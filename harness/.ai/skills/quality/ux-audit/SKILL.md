# UX Audit

> Audit flows for clarity, error states, and accessibility.
> Use this before launch, and after any major UX change.

## When to load

- "Does this make sense?"
- "Users are dropping off at step 3."
- Pre-launch for any user-facing flow.

## Procedure

1. **Define the user goal.** One sentence. The whole audit
   is in service of this sentence.
2. **Walk the happy path.** As a user with the goal, do
   you reach it in < 5 steps? Is each step obvious?
3. **Walk the error paths.** For each step, what happens
   if the network fails, the input is invalid, the user
   navigates back, the session expires, the user is on
   a slow connection?
4. **Walk the edge cases.** Empty state, single-item
   state, 1000-item state. New user vs returning user.
   First-time setup vs long-time user.
5. **Check the language.** Is the user told what
   happened, why, and what to do next? Or are they
   told "an error occurred"?
6. **Check the keyboard path.** Every interaction
   reachable by keyboard? Focus visible? Tab order
   logical?
7. **Check the screen-reader path.** Every interactive
   element labeled? Live regions for dynamic content?
   Headings in order?
8. **Check the trust signals.** Is it clear who the user
   is talking to? Is the brand consistent? Is the
   privacy posture clear (what data, where, why)?

## Severity scale

- **Critical**: blocks the user from completing the
  goal. Block release.
- **High**: makes the goal achievable with effort.
  Block release unless mitigated.
- **Medium**: confusing, slow, or unaesthetic. Plan to
  fix.
- **Low**: polish. Backlog.

## Output

```
## UX Audit: <flow>

### Goal
- <one sentence>

### Happy path
- steps: N
- clarity: <good|ok|bad>

### Error paths
- <list of paths, each with state>

### Edge cases
- <list of cases, each with state>

### A11y
- keyboard: <ok|issues>
- screen reader: <ok|issues>
- color contrast: <ok|issues>

### Trust signals
- <list or "missing">

### Severity summary
- critical: N
- high: N
- medium: N
- low: N

### Verdict
- ship / ship-with-mitigation / block
```
