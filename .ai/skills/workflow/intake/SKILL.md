# Intake

> Run the project intake conversation and fill
> `.ai/harness/project-intake.md`. Re-run whenever the
> project changes shape.

## When to load

- Bootstrap prompt just ran.
- The project changed stack, owner, deploy, or compliance.
- The user explicitly asks to refresh the intake.

## Procedure

1. **Read the previous intake** if it exists. Treat it as a
   starting point; don't re-do work that's still true.
2. **For each section in `project-intake.template.md`**, ask
   one focused question. Don't ask all 20 at once.
3. **Prefer facts over opinions.** If a section is unknown,
   write "unknown — to be filled by user". Don't make things
   up.
4. **Save the intake** after each answered section so a
   crash doesn't lose work.
5. **At the end, summarize** the 3-5 most important facts
   about this project. The agent will use this on every
   future turn.

## Sections (in order)

1. **Identity** — name, one-liner, domain, owner, repo,
   maturity. Ask first.
2. **Stack** — language, framework, build, test, linter, CI,
   deploy. Often already in `package.json` / `pyproject.toml`.
3. **Operating model** — who edits, review, release cadence,
   on-call.
4. **Conventions** — branching, commit style, PR template.
5. **Constraints** — compliance, perf budgets, support
   matrix, forbidden deps.
6. **AI usage** — what AI is for, what AI must not do, eval
   set location.
7. **Open questions** — things the agent should ask about.

## Output

After the intake, emit a structured summary that the agent
can re-read in one glance:

```
## Intake Summary
- name: <project>
- domain: <domain>
- stack: <primary stack>
- owner: <team>
- key risks: <list>
- open: <list>
```

## Anti-patterns

- Asking 20 questions at once. The user will skim. Ask 1-3
  per turn.
- Inventing answers. "Probably uses Postgres" is a bug.
  "Unknown, to be confirmed" is correct.
- Skipping the maturity question. "Idea" vs "Production"
  changes what the agent should do.
