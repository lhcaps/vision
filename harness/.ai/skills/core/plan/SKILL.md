# Plan (customized for the meta-harness)

> Project-specific override of the bundle `plan` skill.
> Loaded for this project instead of the bundle version.

## When to load

- Any non-trivial `implement`, `refactor`, or `ai-feature` task in this repo.
- Any change that touches > 1 file.
- Whenever you're tempted to "just start coding".

## Manifest-aware procedure

1. **Read first.** Read these in order:
   - `.harness/manifest.yaml` — which files came from the bundle and which are customized.
   - `.harness/AGENTS.md` — project-specific rules.
   - `.ai/harness/project-intake.md` — what the project actually is.
   - `.ai/harness/failure-log.md` — last 3 entries.
2. **Classify.** Re-state the task in one sentence. If you can't, ask.
3. **Tag each planned change as `(bundle)` or `(installed)`.**
   - `(bundle)` files live under `bundles/`, `stacks/`, or
     `cli/`. The user expects them to be pristine.
   - `(installed)` files live under `.cursor/`, `.ai/`, or
     `.harness/`. The user may have customized them; respect
     the manifest's `status` field.
4. **List files you'll change.** Exact paths. **For each,
   say whether it's a bundle file (caution: changes here
   will be inherited by every target project on the next
   `harness update`!) or a project file (changes here are
   local).**
5. **State the failure modes.** At least one. If you can't
   name one, the change is too small to need a plan, just
   do it.
6. **Order the steps.** Step 1 must be the smallest
   verifiable thing.
7. **Stop here.** Do not edit any files.

## Special caution for bundle changes

If the plan touches any of:

- `bundles/skills/<group>/<id>/SKILL.md` — the registry
  must list the skill. If the skill is new, add it. If
  the skill is removed, remove it.
- `bundles/rules/*.mdc` — these are universal rules.
  Changes here affect every target project.
- `stacks/<id>/**` — overlay files. Changes here only
  affect future installs of that stack.
- `cli/**` — the CLI itself. Requires `node --test`
  passing before ship.
- `meta.yaml` — version must be bumped per SemVer.

The plan must call out which of these buckets the change
hits, and whether a CHANGELOG entry is required.

## Output format

```
## Plan: <one-line summary>

### Files I'll change
- path/to/file: <what changes and why>  [bundle | installed]
- ...

### Failure modes
- <risk>: <mitigation>

### Steps
1. <smallest verifiable step>
2. ...

### Out of scope
- ...

### Open questions
- ...
```
