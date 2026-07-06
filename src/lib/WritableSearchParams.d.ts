interface BaseWritableSearchParams {
	readonly current: SvelteURLSearchParams;
}

interface CreateStateFn {
	<const S extends StandardSchemaV1<string | null | undefined, unknown>>(
		key: string,
		schema: S,
		fallback: StandardSchemaV1.InferOutput<S>,
		config?: {
			encoder?: (value: StandardSchemaV1.InferOutput<S>) => string;
		},
	): {
		value: StandardSchemaV1.InferOutput<S>;
	};
}

interface CreateStateAsyncFn {
	<const S extends StandardSchemaV1<string | null | undefined, unknown>>(
		key: string,
		schema: S,
		fallback: StandardSchemaV1.InferOutput<S>,
		config?: {
			encoder?: (value: StandardSchemaV1.InferOutput<S>) => string;
		},
	): {
		get value(): Promise<StandardSchemaV1.InferOutput<S>>;
		set value(newVal: StandardSchemaV1.InferOutput<S>);
	};
}

interface WritableSearchParams extends BaseWritableSearchParams {
	createStateFor: CreateStateFn;
	createStateFor_async: CreateStateAsyncFn;
}
