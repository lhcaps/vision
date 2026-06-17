# Failure Log

> Record a failure and update the skill that should
> have caught it. This is how the harness improves.

## When to load

- A test failed and the fix wasn't obvious.
- The user had to correct the agent more than once on
  the same task.
- A task completed but with a near-miss that should
  have been a stop.
- "What did we learn?"

## Procedure

1. **Capture the failure.** Date, request (verbatim or
   summarized), what happened vs what was expected.
2. **Name the root cause.** Not the symptom. "I added
   `JSON.parse` to the wrong field" is a symptom. "I
   didn't read the manifest before editing the bundle"
   is a cause.
3. **Name the skill that should have caught it.**
   Usually a `plan`, `code-review`, `debug`, or
   `task-classify` issue. If no skill would have
   caught it, propose a new skill (or a new check
   inside an existing one).
4. **Edit the skill.** Add a stop condition, a
   pre-flight check, a "before you do X, do Y" step.
   Make it small. Make it specific.
5. **Add an entry** to `.ai/harness/failure-log.md`
   with the date, request, root cause, skill, and
   fix.
6. **Verify** the change would have caught the
   failure. Re-run the scenario if practical.

## Entry format

Append to `.ai/harness/failure-log.md`, most recent
first:

```
## YYYY-MM-DD
**Request**: <one-line user request>
**What I tried**: <one-line summary>
**Root cause**: <one-line diagnosis>
**Skill that should have caught it**: <skill-id>
**Fix**: <what I changed in that skill, or in the bundle>
```

## What NOT to do

- Don't apologize in the entry. Just record the
  fact.
- Don't delete old entries. The log is the memory
  of the system.
- Don't add a fix without naming the skill. A fix
  without a skill is a one-shot, not a
  generalization.

## Output

After the entry is written, emit:

```
## Failure Logged
- date: YYYY-MM-DD
- skill updated: <skill-id>
- manifest updated: <yes/no>
- entry path: .ai/harness/failure-log.md
```
