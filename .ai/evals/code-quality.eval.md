# Code Quality Eval

A 6-pillar check for any code change. Run **before** declaring done.

## Scoring

For each pillar, score 0-3:

- 0: not addressed, or actively violated.
- 1: partially addressed, glaring gaps.
- 2: solid, with one or two minor issues.
- 3: excellent, no issues I can find.

## Pillars

### 1. Correctness
- Does the code do what it claims?
- Are error paths handled?
- Is the type system helping or fighting?

### 2. Readability
- Will a stranger understand this in 6 months?
- Are names intent-revealing?
- Is the control flow flat enough to read top-to-bottom?

### 3. Robustness
- What happens at the boundaries? Empty input, max input, malformed
  input, network down, disk full, locale weirdness.
- Are there any `catch {}` or "this should never happen" comments?

### 4. Testability
- Is the code structured so each behavior can be tested in
  isolation?
- Are dependencies injectable?

### 5. Performance
- Is there an O(n²) where O(n) is trivial?
- Any blocking calls in a hot path?
- Any unbounded memory growth?

### 6. Operability
- Will the next on-call know what to do when this fails?
- Are logs useful?
- Are the right things instrumented?

## Verdict

- Total >= 16: ship.
- Total 12-15: ship with a follow-up issue.
- Total < 12: stop and address the gaps.
