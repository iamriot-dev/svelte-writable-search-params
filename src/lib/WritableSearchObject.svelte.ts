import type { StandardSchemaV1 } from "@standard-schema/spec";
import { SYM } from "./SYM.ts";
import { onMount } from "svelte";

type Init = NonNullable<ConstructorParameters<typeof URLSearchParams>[0]>;

export function WritableSearchParams<
	const S extends StandardSchemaV1<
		Record<string, string>,
		Record<string, unknown>
	>,
>(
	schema: S,
	init: Init,
	encoders?: {
		[Key in keyof StandardSchemaV1.InferOutput<S>]?: (
			input: StandardSchemaV1.InferOutput<S>[Key],
		) => string;
	},
	config?: {
		replace?: boolean;
	},
) {
	type Output = StandardSchemaV1.InferOutput<S>;

	function deleteState() {
		Object.getOwnPropertyNames(state).forEach((k) => {
			delete state[k];
		});
	}

	function getNewState(search: URLSearchParams) {
		search.sort();

		const result = schema["~standard"].validate(Object.fromEntries(search));

		if ("then" in result) throw new Error("Async schemas are not supported");
		if (result.issues)
			throw new Error(
				"The search parameters did not pass validation, ensure that you include catch/fallback in your schema",
			);

		return result.value;
	}

	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const initSearch = new URLSearchParams(init);
	initSearch.sort();

	const state: Output = $state(getNewState(initSearch));
	let prevStr = $state(initSearch.toString());

	onMount(() => {
		const ac = new AbortController();

		navigation.addEventListener(
			"navigate",
			(e: NavigateEvent) => {
				if (e.canIntercept && e.info === SYM) {
					e.intercept({
						focusReset: "manual",
						handler() {},
					});
				}
			},
			{ signal: ac.signal },
		);

		navigation.addEventListener(
			"navigatesuccess",
			() => {
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				const newSearch = new URLSearchParams(window.location.search);
				newSearch.sort();

				prevStr = newSearch.toString();

				deleteState();
				Object.assign(state, getNewState(newSearch));
			},
			{ signal: ac.signal },
		);

		return () => ac.abort();
	});

	return new Proxy(state, {
		set(target, p, newValue, receiver) {
			const didSet = Reflect.set(target, p, newValue, receiver);

			const newObj = Object.fromEntries(
				Object.entries(state)
					.map(([key, v]) => {
						if (typeof key !== "string") return;
						if (v == null) return;

						return [
							key,
							(encoders?.[key] ?? String)(v as Output[typeof key]),
						] as const;
					})
					.filter((x) => x != null),
			);

			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const newSearch = new URLSearchParams(newObj);
			newSearch.sort();

			if (newSearch.toString() !== prevStr) {
				navigation.navigate(`?${newSearch}`, {
					info: SYM,
					history: config?.replace ? "replace" : "push",
				});
			}

			return didSet;
		},
	});
}
