# Refactor

> Restructure without changing behavior. Lock tests first.

## When to load

- "Clean this up."
- "This is too long, split it."
- "We have three slightly-different versions of the same thing."

## Procedure

1. **Identify the smell.** Name it. Long function, shotgun
   surgery, feature envy, primitive obsession, etc. If you can't
   name it, you don't have a refactor; you have a vague preference.
2. **Lock the behavior first.** Run the existing test suite. If
   green, commit. If red, fix the test before refactoring.
3. **Plan the smallest mechanical change.** No new features. No
   drive-by cleanups. No renaming unrelated symbols. One refactor
   per PR.
4. **Refactor.** Keep the test suite running after each
   mechanical step. If a test fails, revert that step.
5. **Re-run the full suite.** Commit.
6. **If you found a new test gap** (a behavior the old code had
   that no test covered), add a test in a separate commit. Do not
   bundle it with the refactor.

## Refactor kinds, with anti-patterns

### Extract function
- Pick the smallest coherent block.
- Name it after the value it returns, not the steps it takes.
- Move all locals it uses with it.

### Inline
- Only when the indirection is making the code harder to read.
- Don't inline to "save lines". Lines are cheap.

### Rename
- One symbol at a time across the whole repo.
- After the rename, run the test suite and the type checker.

### Move
- Move the code and its tests together.
- Update all imports.

### Replace conditional with polymorphism
- Only when the conditional is on **type** and the types are
  open. Otherwise, a `switch` is fine.

## Output

```
## Refactor: <one-line>

### Smell
- <name>: <where>

### Locked
- <test name + pass count>

### Plan
1. <smallest step>
2. ...

### Test re-runs
- After step 1: <pass/fail>
- After step N: <pass/fail>

### Follow-up
- <new test gap to address in a separate commit, or "none">
```
