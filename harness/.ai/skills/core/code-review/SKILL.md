# Code Review (customized for the meta-harness)

> Project-specific override. Loaded for this project instead of
> the bundle version.

## When to load

- Before opening a PR.
- After a long agent turn, as a self-check.
- When the user says "review this".

## Manifest-aware procedure

1. **Scope the diff.** `git diff --stat` and `git status`.
2. **Read `.harness/manifest.yaml`.** Note any files whose
   `status` is `customized` or `conflict`. The review must
   not propose changes that wipe a customization.
3. **For each changed file, read it. Don't review from the
   diff alone.**
4. **For each changed file, answer:**
   - **Intent**: what is the change trying to do?
   - **Correctness**: does it actually do that?
   - **Risk**: what could this break? Think about callers,
     edge cases, and any concurrency / async / cleanup.
   - **Style**: does it follow `.cursor/rules/10-coding-style.mdc`?
   - **Tests**: are the new behaviors covered?

## Project-specific stop conditions

Stop and flag if any of these are true:

- A new file was added under `bundles/skills/<group>/<id>/`
  but no entry was added to `registry/skills.yaml`.
- A file under `bundles/` or `stacks/` was changed but the
  CHANGELOG does not mention it.
- A new rule (`.mdc`) was added but no `globs` are set.
- A stack overlay (`stacks/<id>/`) was added but its
  `stack.yaml` does not list the new rule or skill.
- A new prompt or eval was added but `registry/skills.yaml`
  does not list it (only skills need to be in the registry;
  prompts and evals are referenced by path in skills).
- The version in `meta.yaml` changed but `CHANGELOG.md`
  was not updated.
- The version in `package.json` changed but `CHANGELOG.md`
  was not updated (same as above, for npm consumers).
- `meta.yaml` `version` and `package.json` `version` got
  out of sync.
- A change to `cli/lib/yaml.mjs` does not have a
  corresponding test under `test/yaml.test.mjs`.
- A change to `cli/lib/copier.mjs` does not have a
  corresponding test under `test/copier.test.mjs`.
- A new file is untracked (not in `git status` as `M` or
  `A`).

## Output

```
## Diff scope
- N files, M insertions, K deletions.

## Findings
- <file:line> severity: <low|med|high>  issue: <...>  fix: <...>

## Manifest health
- customized files preserved: <yes/no>
- conflicts: <list or none>

## Stop conditions triggered
- <list or "none">

## Strengths
- ...

## Verdict
- <approve|request-changes|comment-only>
```
