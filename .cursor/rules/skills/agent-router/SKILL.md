# Agent Router Skill

Classify every task before acting. Use at most 5 skills per task. Never apply contradictory skills simultaneously.

## Classification

Before writing code, inspect the user's request and classify it into ONE primary category:

| # | Category | Keywords | Primary Skills |
|---|----------|----------|----------------|
| 1 | **Runtime / Backend** | API, DB, Prisma, Redis, BullMQ, MinIO, Docker, seed, queue, inference, job, annotation workspace | visionflow-runtime, karpathy-coding-guidelines, unittest-skill |
| 2 | **Frontend UI polish** | layout, visual, theme, component, animation, color, typography | impeccable, stitch-skill, design-taste-frontend |
| 3 | **Frontend redesign** | redesign, overhaul, new look, different style | impeccable, stitch-skill, redign-skill, images-taste-skill |
| 4 | **Browser / UI smoke test** | check UI, verify page, screenshot, smoke | browser-use, playwright-testing |
| 5 | **Test generation** | test, spec, coverage | unittest-skill, playwright-testing |
| 6 | **GSD workflow** | plan, execute, verify, audit, release | gsd-plan-phase, gsd-execute-phase, gsd-verify-work |
| 7 | **Artifact / design** | sketch, mockup, prototype | gsd-sketch |
| 8 | **Repo audit / code review** | review, security, performance | gsd-code-review |

## Rule Hierarchy

1. **Runtime first, UI second.** If the task mentions API, DB, queue, seed, Docker, or logs — fix runtime before touching UI.
2. **Never apply contradictory visual styles together.** Pick ONE from: brutalist-skill, minimalist-skill, soft-skill, impeccable. Never load >1 at once.
3. **Max 5 skills active per task.** Prefer 2-3 focused skills over 5 generic ones.
4. **Always produce a verification plan before claiming a fix is done.** State what commands you will run to verify, not just that the code "looks correct."
5. **Browser smoke after code changes** on local web apps. Use browser-use or Playwright to verify the UI still works.

## Skill Activation Pattern

### Runtime bug (Category 1)
```
visionflow-runtime
karpathy-coding-guidelines
output-skill
unittest-skill (if applicable)
browser-use (for UI smoke after fix)
```

### Frontend polish (Category 2)
```
impeccable
stitch-skill
design-taste-frontend
browser-use (screenshot validation)
```

### GSD workflow (Category 6)
```
gsd-plan-phase
gsd-execute-phase
gsd-verify-work
gsd-code-review
```

## Verification Gate

Every completed fix MUST include:
1. The specific command that proves the fix works
2. The expected output or behavior
3. The actual output (captured in your response)

Do NOT claim success without running verification commands.

## Anti-patterns

- Do NOT load 10 skills and hope the right ones apply themselves
- Do NOT start with UI redesign when the API is broken
- Do NOT claim "fixed" without running typecheck + tests + smoke
- Do NOT apply `brutalist-skill` + `minimalist-skill` + `soft-skill` simultaneously
