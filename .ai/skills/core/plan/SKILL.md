# Plan

> Plan the smallest safe change before editing.

## When to load

- Any non-trivial `implement`, `refactor`, or `ai-feature` task.
- Any change that touches > 2 files.
- Whenever you're tempted to "just start coding".

## Procedure

1. **Classify**. Re-state the task in one sentence. If you can't,
   ask.
2. **Read first.** Read every file you'll need to touch, plus 1 file
   of context on either side. Don't skim — read.
3. **List files you'll change.** Exact paths. If a file's name
   surprises you, re-classify.
4. **State the failure modes** you are guarding against. At least
   one. If you can't name one, the change is too small to need a
   plan, just do it.
5. **Order the steps.** Step 1 must be the smallest verifiable
   thing. Step N must be the thing the user actually asked for.
6. **Stop here.** Do not edit any files.

## Output format

```
## Plan: <one-line summary>

### Files I'll change
- path/to/file: <what changes and why>
- ...

### Failure modes
- <risk>: <mitigation>

### Steps
1. <smallest verifiable step>
2. ...

### Out of scope
- <things I considered and explicitly won't do>

### Open questions
- <anything I need the user to confirm before step 1>
```

## Self-check

Before you finish:

- Can the user reject any single step without rejecting the whole
  plan?
- Does each step produce a visible signal (test pass, file diff,
  log line)?
- Is the last step the thing the user actually asked for?
- Did you avoid the trap of writing pseudo-code in the plan?
  Pseudo-code is fine. A whole file is not.

## Common mistakes

- Planning 5 files when 2 will do. (You can add more if the plan
  is rejected.)
- Vague failure modes ("things could break"). Name the actual
  thing.
- No open questions. If you have none, the plan is probably
  under-specified.
- Planning past the user's request. The plan should stop at the
  smallest solution.
