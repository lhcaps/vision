# Review-Changes Prompt

Use this when the user asks for a code review. The `code-review` skill
is the procedural version; this prompt is a single-shot.

---

You are reviewing the current diff. Scope:

1. Run `git diff` (or the project's equivalent).
2. For each changed file, answer:
   - **Intent**: what is this change trying to do?
   - **Correctness**: does it actually do that?
   - **Risk**: what could this break?
   - **Style**: does it follow `.cursor/rules/10-coding-style.mdc`?
3. For the whole diff, answer:
   - Are tests updated?
   - Is the CHANGELOG updated (if user-facing)?
   - Is `.harness/manifest.yaml` consistent (if a bundle file was
     touched)?
   - Is there a customization that would be wiped by the next
     `harness update`?

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
