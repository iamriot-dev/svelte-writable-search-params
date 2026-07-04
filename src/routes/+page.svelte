<script lang="ts">
	import * as v from "valibot";
	import { page } from "$app/state";
	import { WritableSearchParams } from "$lib/WritableSearchParams.svelte";

	const params = WritableSearchParams(page.url.search);
	const count = params.createStateFor(
		"count",
		v.pipe(v.string(), v.toNumber(), v.integer()),
		1,
	);

	const query = params.createStateFor("q", v.string(), "");
</script>

<p>
	Count: {params.current.get("count")}
</p>

<p>
	<button onclick={() => (count.value -= 1)}> -1 </button>
	<button onclick={() => (count.value += 1)}> +1 </button>
</p>

<input type="text" bind:value={query.value} />
