# 📝 Svelte Writable Search Params

Reactive writable search parameters for Svelte, complete with validation!

```javascript
const params = WritableSearchParams(window.location.search);

const page = params.createStateFor("page", PositiveIntegerSchema, 1);

function incrementPage() {
  page.value += 1;
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
- Navigation API (on browser-side)
  - If you wish to support browsers that do not have the Navigation API, you can add a polyfill

Works with SvelteKit, but it is not required.

## How to use

### Setting up

Pass the initial search parameters to `WritableSearchParams(...)`, this can be any valid initial value that can be passed to `new URLSearchParams(...)`. This value will only be used for initialisation and does not need to be reactive, any updates will be read directly from the current URL (`window.location`).

Browser-only / no SSR:

```javascript
import { WritableSearchParams } from "svelte-writable-search-params";

const params = WritableSearchParams(window.location.href);
// params.current will be will be an instance of SvelteURLSearchParams
```

SvelteKit with SSR:

```javascript
import { WritableSearchParams } from "svelte-writable-search-params";
import { page } from "$app/state";

// use page.url.search instead so tha the initial render will be accurate
const params = WritableSearchParams(page.url.search);
```

For other frameworks/setup, refer to their documentation on how to read the current search parameters.

### Reading Params (Unvalidated)

```javascript
const pageParam = $derived(params.current.get("page"));
// pageParam will be string | null
```

### Writing Params (Unvalidated)

```javascript
params.current.set("page", "2");
```

### Other Methods

Since `params.current` is an instance of `SvelteURLSearchParams`, any valid methods and properties for `SvelteURLSearchParams` can be used. Any updates and changes to it will be automatically reflected in the URL.

**⚠️ Note:** Always use `params.current` or a `$derived(...)` value to get reactive parameters, as the entire instance will be replaced on external navigation. For example, when the user navigates back and forth with the browser controls.

## Validated Params

```javascript
// using Valibot as an example, feel free to use your favourite library
const StrToIntSchema = v.pipe(v.string(), v.toNumber(), v.integer());

// pass in (key, schema, fallbackValue)
const page = params.createStateFor("page", StrToIntSchema, 1);
// fallback value will be used if validation fails, or param is missing

function increment() {
  page.value += 1;
  // will automatically update the URL using shallow navigation
  // e.g. from "/books" to "/books?page=2"
  // or from "/books?page=2" to "/books?page=3"
}
```

Works great with search boxes too:

```javascript
const query = params.createStateFor("q", v.string(), "");
```

<!-- prettier-ignore-start -->
```html
<input type="text" bind:value={query.value} />
```
<!-- prettier-ignore-end -->

The URL will update as the user types, without interruptions or losing focus.

### Async Validation

For async schemas, you will need to use `createStateFor_async(...)` instead.

```javascript
const page = params.createStateFor("page", MyAsyncSchema, 1);
// page.value will be Promise<number>
```

## Usage with SvelteKit Remote Functions

```javascript
const query = params.createStateFor("q", v.string(), "");

// ⚠️ Note: you may need to enable experimental settings
// Check SvelteKit documentation for details
const foundBooks = $derived(await findBooksByTitle(query.value));
```

<!-- prettier-ignore-start -->
```html
<input type="text" bind:value={query.value} placeholder="Search All Books..." />
```
<!-- prettier-ignore-end -->

## Notes

This library uses shallow navigation to update the search parameters, and may not trigger data reload automatically depending on the library used.

By default, updates will add entries to the browser's history stack, to replace instead of pushing entries, provide a configuration.

```javascript
const params = WritableSearchParams(window.location.search, { replace: true });
```
