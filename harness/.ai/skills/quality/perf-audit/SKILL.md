# Perf Audit

> Profile a hot path, then propose a targeted fix.
> Use this when something is slow, or when you want to
> make sure it stays fast.

## When to load

- "The page is slow."
- "This endpoint takes 2 seconds."
- Pre-launch for any user-facing surface.

## Procedure

1. **Measure first.** Don't optimize without a number.
   - Web: Lighthouse, WebPageTest, browser devtools
     Performance tab.
   - Backend: `time`, flame graphs, APM.
   - DB: `EXPLAIN ANALYZE` for the actual query, not
     just the plan.
2. **Find the bottleneck.** The 80/20 rule: 80% of the
   time is in 20% of the code. Find the 20%. Don't
   optimize the other 80% first.
3. **Set a target.** What's the budget? p95 < 200ms?
   First contentful paint < 1.5s? The target is a
   contract; the audit is whether you meet it.
4. **Propose a fix.** One fix per bottleneck. The fix
   should be:
   - **Targeted**: changes one thing, in one place.
   - **Measurable**: you can re-measure and see the
     improvement.
   - **Reversible**: easy to revert if it doesn't
     help.
5. **Re-measure.** Did it help? By how much? If not,
   revert. If yes, commit.
6. **Track over time.** Add a perf test to CI. The
   budget is a regression test, not a one-shot.

## Common bottlenecks, with the cheap check

- **N+1 queries**: count the queries, not just the time.
- **Unnecessary re-renders**: count them, don't guess.
- **Bundle size**: `next build --analyze` or equivalent.
- **Synchronous I/O on the main thread**: look for it in
  the trace.
- **Missing indexes**: the database will tell you.
- **Hot path allocations**: GC pauses are a signal.
- **Unbounded loops**: `O(n²)` over a 10k-item list.

## Anti-patterns

- **Premature optimization**. Without a measurement, it's
  just guessing.
- **Caching everything**. Caching is a state problem. It
  needs invalidation. It needs monitoring. Only cache
  what's measured to be a bottleneck.
- **Memoization everywhere**. Same problem. If the input
  domain is small, memoization helps. If it's large,
  you're just hiding a memory leak.
- **"It's fast on my machine"**. Profile in the
  environment that matters (production-like).

## Output

```
## Perf Audit: <surface>

### Baseline
- <metric>: <value>
- <metric>: <value>

### Bottleneck
- <location>: <why>

### Fix
- <change>

### After
- <metric>: <value>
- delta: <%>

### CI
- test: <path>
- budget: <value>

### Follow-ups
- <list or "none">
```
