<script lang="ts">
	import { page } from "$app/state";
	import { WritableSearchParams } from "$lib/WritableSearchObject.svelte";
	import * as v from "valibot";

	const params = WritableSearchParams(
		v.object({
			count: v.fallback(v.pipe(v.string(), v.toNumber(), v.integer()), 1),
			q: v.fallback(v.string(), ""),
		}),
		page.url.search,
	);

	v.pipe(v.string(), v.toNumber(), v.integer(), v.toDate());
</script>

<p>
	Count: {params.count}
</p>

<p>
	<button onclick={() => (params.count -= 1)}> -1 </button>
	<button onclick={() => (params.count += 1)}> +1 </button>
</p>

<input type="text" bind:value={params.q} />
