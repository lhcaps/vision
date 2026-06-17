# UI Architect

> Design a component tree, state model, and data flow before coding.
> No styling or motion here — those are downstream skills.

## When to load

- "Build a new page."
- "Add a new feature with a UI."
- "Redesign this flow."

## Procedure

1. **State the user goal** in one sentence. The whole design
   must serve it. If a design element doesn't, cut it.
2. **Sketch the data flow first.** Where does data come from?
   Where does it go? What mutates it? Draw this on paper or in
   your head before any tree.
3. **State model.** Enumerate the entities, the relationships,
   and the events. The events are the verbs; the entities are
   the nouns.
4. **Component tree.** Top-down. Each component has one job and
   one parent. Co-locate state with the components that need
   it; lift it only when two siblings need it.
5. **Boundaries.** Where does the UI end and the server / DB /
   model begin? Name the boundary. The boundary is the API.
6. **States.** Empty, loading, error, success, partial, stale.
   Every component renders at least one of these at all times.
7. **Accessibility.** Keyboard path for every interaction. ARIA
   roles only when the semantic tag is wrong (rare).
8. **Performance.** Suspicious of: large lists (virtualize),
   expensive re-renders (memoize or split), large initial
   bundle (code-split).

## Component rules

- One component, one responsibility. If a component's name
  contains "And" or "With", split it.
- Props down, events up. No deep imports of state.
- Side effects in `useEffect` (or equivalent) only at the
  boundary layer.
- No `any` types. No `// @ts-ignore` without a TODO and a
  ticket.

## Output

```
## UI Design: <feature>

### Goal
- <one sentence>

### Data flow
- <narrative + diagram in ASCII>

### State model
- entities: <list>
- events: <list>
- store(s): <list>

### Tree
```
<Component>
├─ <Child>
│  └─ <Grandchild>
└─ <Child>
```

### States covered
- empty / loading / error / success / partial / stale

### A11y
- keyboard path: <list>
- roles: <list>

### Perf risks
- <list>
```
