# 📝 Svelte Writable Search Params

Reactive writable search parameters for Svelte, complete with validation!

```javascript
// use any StandardSchemaV1
const params = WritableSearchParams(MySchema, window.location.search);

function incrementPage() {
  params.page += 1;
}
```

<!-- prettier-ignore-start -->
```html
Current Page: {page.value}
<button onclick={incrementPage}>Next Page</button>
```
<!-- prettier-ignore-end -->

## Installing

```sh
npm install svelte-writable-search-params
# or
yarn add svelte-writable-search-params
# or
pnpm add svelte-writable-search-params
```

## Requirements

- Svelte 5 or later
- Any validation library that supports Standard Schema V1
  - e.g. Zod, Valibot, ArkType, yup, Joi
- Navigation API (on browser-side)
  - If you wish to support browsers that do not have the Navigation API, you can add a polyfill

Works with SvelteKit, but it is not required.

## Setting Up

Pass your schema and the initial search parameters to `WritableSearchParams(...)`. The initial value can be any valid value that can be passed to `new URLSearchParams(...)`. This value will only be used for initialisation and does not need to be reactive, any updates will be read directly from the current URL (`window.location`).

Browser-only / no SSR:

```javascript
import { WritableSearchParams } from "svelte-writable-search-params";

const params = WritableSearchParams(MySchema, window.location.href);
// params will be a reactive object matching the provided schema
```

SvelteKit with SSR:

```javascript
import { WritableSearchParams } from "svelte-writable-search-params";
import { page } from "$app/state";

// use page.url.search instead as window is only available in the browser
const params = WritableSearchParams(MySchema, page.url.search);
```

For other frameworks, refer to their documentation on how to read the current search parameters.

## Usage

```javascript
// using Valibot as an example, feel free to use your favourite library
const params = WritableSearchParams(
  v.object({
    // always ensure you have a fallback
    page: v.fallback(v.pipe(v.string(), v.toNumber(), v.integer()), 1),

    // for optional params, use an optional schema that falls back to undefined
    // undefined and null values will be removed from URL search string, to keep the property in the URL search string, provide an empty string instead
    q: v.fallback(v.optional(v.string()), undefined),
  }),
  window.location.search,
);

const readonlyReactiveSearchQuery = $derived(params.q);
// or read directly from params.q

function nextPage() {
  params.page += 1;
}

function prevPage() {
  params.page -= 1;
}
```

You can also bind the values.

<!-- prettier-ignore-start -->
```html
<Pagination bind:currentPage={params.page} />
```
<!-- prettier-ignore-end -->

Works great with search boxes too:

<!-- prettier-ignore-start -->
```html
<input type="text" bind:value={query.value} />
```
<!-- prettier-ignore-end -->

The URL will update as the user types, without interruptions or losing focus.

### Async Validation

Async validation is not currently supported.

## Usage with SvelteKit Remote Functions

```javascript
// ⚠️ Note: you may need to enable experimental settings
// Check SvelteKit documentation for details
const foundBooks = $derived(await findBooksByTitle(params.q));
```

<!-- prettier-ignore-start -->
```html
<input type="text" bind:value={params.q} placeholder="Search All Books..." />
```
<!-- prettier-ignore-end -->

## Encoding Non-String Values

By default, all values will be encoded with `String(...)` when added to the URL. This works well for strings, numbers, and objects with a `.toString()` method. For other values, you can provide an encoding function to convert the value into a string.

For example, with Date:

```javascript
const MySchema = v.object({
  normalString: v.fallback(v.string(), ""),
  laterThan: v.fallback(
    // laterThan is represened as milliseconds from Unix Epoch
    v.optional(v.pipe(v.string(), v.toNumber(), v.integer(), v.toDate())),
    undefined,
  ),
});

const params = WritableSearchParams(
  MySchema,
  window.location.search,
  // provide your encoders here
  {
    // this function will not be called when input is undefined or null
    laterThan(input) {
      // return stringified milliseconds from Unix Epoch
      return String(input.getTime());
    },
  },
);
```

You do not need to provide an encoder for every single property. For properties where `String(...)` is sufficient, you can skip the encoder.

## Notes

This library uses shallow navigation to update the search parameters, and may not trigger data reload automatically depending on the library used.

By default, updates will add entries to the browser's history stack, to replace instead of pushing entries, provide a configuration.

```javascript
const params = WritableSearchParams(
  MySchema,
  window.location.search,
  undefined, // or pass in your encoders
  { replace: true },
);
```
