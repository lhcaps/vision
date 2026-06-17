# Classify Prompt

Use this when a freeform user request does not obviously map to a
single skill. The `task-classify` skill is a richer version of this
prompt; this is the inline form.

---

You are about to handle a user request. Before doing anything else,
classify it.

## Steps

1. Read `.ai/harness/router.yaml` and see if the request's verbs map
   to a `task_class`.
2. If yes, load the listed skill(s) and proceed.
3. If no, classify the request as one of:
   - `plan`, `implement`, `review`, `debug`, `refactor`, `test`,
     `docs`, `ship`, `design`, `ai-feature`, `meta`.
4. If it's ambiguous, ask the user one question, no more.

## Output

Always print this block before doing anything else:

```
## Classify
- Task class: <class>
- Skills to load: <id>, <id>
- Why: <one-sentence rationale>
```

If the classification changes mid-task, re-print the block and
explain.
