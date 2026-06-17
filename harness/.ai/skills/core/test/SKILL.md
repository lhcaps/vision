# Test

> Add or fix tests for a specific surface.

## When to load

- "Add a test for X."
- "This keeps breaking in CI."
- "We have no tests for Y."

## Procedure

1. **Identify the surface.** A function, a module, a class, an
   HTTP endpoint, a UI flow. The smaller the surface, the
   easier the test. If the surface is "the whole app", narrow
   it.
2. **Identify the behaviors to test.** List them. A test for
   "validates input" is not specific enough. A test for
   "rejects emails with no `@`" is.
3. **Pick the test layer.**
   - Unit: pure function, no I/O.
   - Integration: with real I/O but in a test harness.
   - End-to-end: through the public surface.
4. **Write the test.** Name it after the behavior, not the
   function. `rejects_email_without_at_sign` not `test_validate`.
5. **Run the test in isolation.** Confirm it fails for the
   reason you think.
6. **Make the test pass.** Smallest change.
7. **Run the full suite.** Confirm no regression.
8. **Commit.** Test and fix in the same commit.

## Test quality rules

- **One assertion focus per test.** Multiple asserts are OK if
  they all assert the same behavior. A test that asserts five
  different behaviors is five tests.
- **No real I/O.** Inject the network, the clock, the file
  system. The test runner should not need a database.
- **Deterministic.** No `Date.now()`, no `Math.random()`,
  no `setTimeout(..., 100)`.
- **Fast.** A unit test should be < 50ms. A test suite should
  be < 30s.
- **Independent.** Tests can run in any order. Test A does
  not set up state for test B.

## Anti-patterns

- "Snapshot everything" — snapshots are a tool, not a strategy.
  They hide regressions by showing the same blob.
- "Test the implementation, not the behavior" — refactor
  breaks the test even though the behavior is correct.
- "Setup with 50 lines of mocks" — the test is more complex
  than the code. The code is wrong, not the test.

## Output

```
## Test: <surface>

### Behaviors covered
- ...

### Files added
- path/to/test: <what it covers>

### Files changed
- (usually none — test-first means the code was already there
  and the test is new)

### Full-suite result
- pass: N, fail: 0
```
