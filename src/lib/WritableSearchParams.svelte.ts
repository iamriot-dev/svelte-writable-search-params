import type { StandardSchemaV1 } from "@standard-schema/spec";
import { onMount, untrack } from "svelte";
import { SvelteURLSearchParams } from "svelte/reactivity";

const SYM = Symbol("WritableSearchParams");

type Init = NonNullable<ConstructorParameters<typeof URLSearchParams>[0]>;

type Config = {
	replace?: boolean;
};

export function WritableSearchParams(init: Init, config?: Config) {
	const state = $state({
		value: new SvelteURLSearchParams(init),
	});

	state.value.sort();

	let prevStr = $state(state.value.toString());

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
				const newSearch = new SvelteURLSearchParams(window.location.search);
				newSearch.sort();

				prevStr = newSearch.toString();
				state.value = newSearch;
			},
			{ signal: ac.signal },
		);

		return () => ac.abort();
	});

	$effect(() => {
		if (state.value.toString() !== untrack(() => prevStr)) {
			state.value.sort();
			prevStr = state.value.toString();

			navigation.navigate(`?${state.value}`, {
				info: SYM,
				history: config?.replace ? "replace" : "push",
			});
		}
	});

	return {
		get current() {
			return state.value;
		},
		createStateFor<
			const S extends StandardSchemaV1<string | null | undefined, unknown>,
		>(
			key: string,
			schema: S,
			fallback: StandardSchemaV1.InferOutput<S>,
			config?: {
				encoder?: (value: StandardSchemaV1.InferOutput<S>) => string;
			},
		) {
			return validatedReactiveParam(key, schema, fallback, {
				...config,
				with: {
					get current() {
						return state.value;
					},
				},
			});
		},
		createStateFor_async<
			const S extends StandardSchemaV1<string | null | undefined, unknown>,
		>(
			key: string,
			schema: S,
			fallback: StandardSchemaV1.InferOutput<S>,
			config?: {
				encoder?: (value: StandardSchemaV1.InferOutput<S>) => string;
			},
		) {
			return asyncValidatedReactiveParam(key, schema, fallback, {
				...config,
				with: {
					get current() {
						return state.value;
					},
				},
			});
		},
	} as WritableSearchParams;
}

function validatedReactiveParam<
	const S extends StandardSchemaV1<string | null | undefined, unknown>,
>(
	key: string,
	schema: S,
	fallback: StandardSchemaV1.InferOutput<S>,
	config: {
		encoder?: (value: StandardSchemaV1.InferOutput<S>) => string;
		with: BaseWritableSearchParams;
	},
) {
	const params = config.with;

	const value = $derived.by(() => {
		const rawValue = params.current.get(key);

		const result = schema["~standard"].validate(rawValue);

		if ("then" in result) throw new Error("Async schemas are not supported");

		if (result.issues) return fallback;

		return result.value;
	});

	return {
		get value() {
			return value;
		},
		set value(newVal: StandardSchemaV1.InferOutput<S>) {
			const encodedNewVal = (config?.encoder ?? String)(newVal);

			if (encodedNewVal == null || encodedNewVal === "") {
				params.current.delete(key);
			} else {
				params.current.set(key, encodedNewVal);
			}
		},
	};
}

function asyncValidatedReactiveParam<
	const S extends StandardSchemaV1<string | null | undefined, unknown>,
>(
	key: string,
	schema: S,
	fallback: StandardSchemaV1.InferOutput<S>,
	config: {
		encoder?: (value: StandardSchemaV1.InferOutput<S>) => string;
		with: BaseWritableSearchParams;
	},
) {
	const params = config.with;

	const value = $derived.by(async () => {
		const rawValue = params.current.get(key);

		const result = await schema["~standard"].validate(rawValue);

		if (result.issues) return fallback;

		return result.value;
	});

	return {
		get value(): Promise<StandardSchemaV1.InferOutput<S>> {
			return value;
		},
		set value(newVal: StandardSchemaV1.InferOutput<S>) {
			const encodedNewVal = (config?.encoder ?? String)(newVal);

			if (encodedNewVal == null || encodedNewVal === "") {
				params.current.delete(key);
			} else {
				params.current.set(key, encodedNewVal);
			}
		},
	};
}
