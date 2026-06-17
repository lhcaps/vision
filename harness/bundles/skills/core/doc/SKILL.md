# Doc

> Generate or update documentation aligned with the code.

## When to load

- Adding a public module / function / class.
- "Write the README."
- "Update the docs for the new behavior."

## Procedure

1. **Find the canonical place.** README, `/docs`, JSDoc, docstring,
   type signature, OpenAPI spec. The right place is wherever
   other docs for this surface already live.
2. **Read the code, then the existing docs.** Docs that disagree
   with the code are worse than no docs. The code is the source
   of truth.
3. **Pick the granularity.** A one-liner for trivial things. A
   paragraph for things with non-obvious behavior. A page for
   things with prerequisites, options, and gotchas.
4. **Write the doc.** Use the user-facing perspective: "to do X,
   run Y" beats "the `Y` function exists".
5. **Verify.** The doc's code examples must run. If the doc
   references a flag, the flag must exist in the code at the
   same version.
6. **Update the index.** If you added a page, add it to the
   table of contents. If you added a section, add it to the
   nav.

## Doc kinds

### README
- What is this? (1 paragraph)
- Why does it exist? (1 paragraph)
- Quick start (the smallest runnable example).
- How to get help / report a bug.

### API doc
- Signature.
- One-line description.
- Parameters, return type, throws.
- One example.
- One gotcha if there is one.

### Tutorial
- A single linear narrative.
- Each step builds on the previous.
- End with a real thing the user has built.

### Reference
- Complete, no narrative.
- Alphabetical or by domain.
- One line per item.

## Output

```
## Doc: <where>

### Files added
- path/to/doc: <what it covers>

### Files changed
- path/to/index: <what nav/link updated>

### Verified
- Code examples: <run result>
- Cross-refs: <list of links that resolve>
```
