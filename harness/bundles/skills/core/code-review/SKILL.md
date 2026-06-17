# Code Review

> Review staged and unstaged changes for quality, risk, and adherence
> to the project's rules and harness.

## When to load

- Before opening a PR.
- After a long agent turn, as a self-check.
- When the user says "review this".

## Procedure

1. **Scope the diff.** `git diff --stat` and `git status`. Note
   M / A / D / R counts. If the diff is too large to review in
   one pass, break it into logical chunks and review each.
2. **For each changed file:**
   - Read the file. Don't review from the diff alone.
   - **Intent**: what is the change trying to do?
   - **Correctness**: does it actually do that? Walk through the
     code paths in your head.
   - **Risk**: what could this break? Think about callers,
     edge cases, and any concurrency / async / cleanup.
   - **Style**: does it follow `.cursor/rules/10-coding-style.mdc`?
   - **Tests**: are the new behaviors covered? Are the old tests
     still valid?
3. **For the diff as a whole:**
   - Is the change small enough to be reviewable?
   - Is the commit message (or PR title) clear about **why**?
   - Are docs / CHANGELOG / intake updated where they should be?
   - Did it touch a bundle file? If so, is the registry in sync?
   - Did it customize a skill? Is the customization intentional
     and the manifest updated?

## Manifest-aware stops (project-specific)

The harness targets this project. Add these stop conditions:

- If a `bundles/*` file changed, the matching entry in
  `registry/skills.yaml` must also be updated (or confirmed unchanged).
- If a new skill is added, the SKILL.md must exist under
  `bundles/skills/<group>/<id>/SKILL.md` and the registry must
  list it.
- If a CHANGELOG entry references a manifest behavior change, the
  `meta.yaml` version must be bumped per SemVer.
- If a stack overlay (`stacks/<id>/`) is added, it must declare
  its `stack.yaml` and at least one rule.

## Output

```
## Diff scope
- N files, M insertions, K deletions.

## Findings
- <file:line> severity: <low|med|high>  issue: <...>  fix: <...>

## Strengths
- ...

## Verdict
- <approve|request-changes|comment-only>
```

## Style

Be specific. "This could be cleaner" is not a finding. "Line 42's
`catch {}` swallows the validation error from `parseUser`" is.
