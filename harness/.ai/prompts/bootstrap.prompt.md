# Bootstrap Prompt

> Paste this into a fresh Cursor chat in a project that just had
> `harness install` run. It is the single most important prompt the
> agent will receive — it teaches the agent the project.

---

You are starting a new project bootstrapped with the personal
meta-harness. Your job in this turn is to **learn the project** and
**customize the harness to it**.

## What to read first

Read in this order, taking notes as you go:

1. `.harness/manifest.yaml` — which files came from the harness and
   which are customized.
2. `.harness/AGENTS.md` — the operating model. Follow it.
3. `.ai/harness/project-intake.md` — if it already has content, treat
   it as a starting point and **update** it, don't re-do it.
4. `.ai/harness/profile.yaml` — same.
5. `.ai/harness/router.yaml` — same.
6. `.ai/harness/failure-log.md` — last 3 entries.
7. The top 1-2 levels of the source tree.
8. `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` —
   whichever exists.
9. The README, if it exists.

## What to do

1. **Fill `.ai/harness/project-intake.md`**. Use the `intake` skill
   for the exact fields.
2. **Customize `.ai/harness/profile.yaml`** with the real facts of
   this project (name, domain, primary stack, key paths, owner,
   deploy target).
3. **Customize `.ai/harness/router.yaml`** so the most likely
   request types for this project route to the right skills. Remove
   skills that this project will not use.
4. **Read 3-5 skills in `.ai/skills/<group>/<id>/SKILL.md`** that are
   most likely to be used first in this project. For each, write a
   1-2 sentence note in `.ai/harness/profile.yaml` under
   `customized_skills` explaining any project-specific tuning.
5. If the project uses a stack with an overlay (nextjs, fastapi,
   node-express), confirm `.cursor/rules/<stack-overlay>.mdc` was
   installed and that the stack-specific skill
   (e.g. `nextjs-conventions`) is enabled in `router.yaml`.

## What to NOT do

- Do not edit any file under `.harness/` — that's the bundle source.
- Do not edit `.harness/manifest.yaml` by hand.
- Do not run `harness update` until you've finished customizing.
- Do not delete skills the user hasn't asked to remove.

## Output

End your turn with a structured report:

```
## Intake
- 3-5 sentence summary of what this project is.

## Customizations
- profile.yaml: <what you changed>
- router.yaml: <what you added/removed>
- skills: <which skills you tuned, in one line each>

## Risks / Open
- Anything the intake surfaced that the user should weigh in on.

## Next step
- One concrete follow-up.
```
