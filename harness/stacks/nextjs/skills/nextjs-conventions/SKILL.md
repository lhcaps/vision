# Next.js Conventions (skill)

> Stack-specific skill for Next.js App Router. Loaded
> automatically when the project is detected as Next.js.

## When to load

- Working on any file under `app/` or `src/app/`.
- Adding a route, a server action, or a Server Component.
- Reviewing a PR that touches `next.config.*`.

## Procedure

1. **Confirm App Router.** If you see `pages/`, flag it and
   recommend the migration.
2. **Confirm Server Component by default.** If a component
   is `"use client"` but doesn't need to be, recommend the
   change.
3. **Check the data flow.** Where does the data come from?
   Is it cached? Is it tagged? Is it revalidated on
   mutation?
4. **Check Server Actions.** Are they idempotent? Are they
   authenticated? Do they return typed results?
5. **Check the layout chain.** Is there a global layout?
   Are nested layouts doing too much? Is there a
   `not-found.tsx` at every meaningful level?
6. **Check the build output.** `next build` should produce
   no warnings about missing metadata, missing alt text,
   missing viewport.
7. **Run `next lint`.** Capture the result.

## Stack-specific traps

- **`"use client"` leaking.** A `"use client"` file
  becomes a Client Component. Every import becomes part of
  the client bundle. Import only what you need.
- **Server Action in a form with no action.** The form
  silently does nothing. Always wire the action.
- **Missing `revalidatePath` / `revalidateTag`.** A
  mutation succeeds but the UI shows stale data.
- **`useSearchParams` without `<Suspense>`.** The build
  fails or the page de-opts to dynamic.
- **Missing `metadata` in `layout.tsx`.** Pages get the
  default title and description, which is rarely right.

## Output

```
## Next.js Audit: <route or surface>

### App Router
- pages/ folder: <present|absent>
- layouts: <list>
- loading/error/not-found: <list>

### Data flow
- fetches: <list with cache strategy>
- mutations: <list with revalidation>
- server actions: <list with auth + return type>

### Client surface
- use client files: <count, justified vs unjustified>

### Build
- next build: <clean|warn count>
- next lint: <clean|warn count>

### Verdict
- ship / fix-first
```
