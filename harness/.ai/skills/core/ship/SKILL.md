# Ship

> Pre-merge checklist, PR description, release notes.

## When to load

- "Open the PR."
- "Cut a release."
- "We're done, time to ship."

## Procedure

### Pre-merge

1. Run the project's test command. Capture the result.
2. Run the project's linter and formatter. Capture the result.
3. Run `harness doctor` (if this is a harness-aware project).
   Capture the result.
4. Run `harness diff` (if this is a harness-aware project).
   Confirm no conflicts.
5. Confirm the CHANGELOG has an entry for the change (if
   user-facing).
6. Confirm no secrets are in the diff.
7. If you added a new skill or rule, confirm it's in the
   registry.
8. If you changed a stack overlay, confirm the stack.yaml is in
   sync.

### PR

1. Title: `type(scope): summary`. Imperative mood. < 72 chars.
2. Body:
   - **Why** (1-3 sentences).
   - **What** (bullet list of changes, grouped by file or
     theme).
   - **How to verify** (commands the reviewer can run).
   - **Risks** (anything the reviewer should pay extra
     attention to).
3. Request at least one reviewer. The harness's `code-review`
   skill can self-review; a human still has to approve.
4. Confirm CI is green. If it's not, that's a blocker, not a
   suggestion.

### Release (if cutting a release)

1. Bump the version per SemVer. MAJOR for breaking, MINOR for
   new, PATCH for fixes.
2. Update `CHANGELOG.md`. Date. Link to the PR(s) that landed.
3. Cut a git tag matching the version.
4. Write release notes:
   - What changed.
   - Why it changed.
   - How to migrate (if breaking).
   - Known issues (if any).
5. File follow-up issues for anything that didn't make it.

## Output

```
## Ship: <PR title>

### Pre-merge
- tests: <pass count> passed, 0 failed
- linter: <clean|N issues>
- harness doctor: <pass|fail>
- harness diff: <N add, M overwrite, K conflict>

### PR
- title: <title>
- body:
  ```
  <body>
  ```
- reviewers: <list>
- CI: <green|red>

### Release
- version: <old> -> <new>
- tag: <tag-name>
- notes: <path or inline>
- follow-ups: <list of issues>
```
