# AI Integration (project-customized)

> Project-specific extension of the bundle's `ai-integration`
> skill. This copy reflects the meta-harness project's actual
> AI surface (currently: a planner that picks skills for
> freeform requests).

## Project AI surface

The meta-harness has one AI-adjacent feature: **smart
routing** of freeform user requests to skills. The current
implementation is:

- **Static layer**: `.ai/harness/router.yaml` maps verbs to
  task classes to skills.
- **Dynamic layer**: the `task-classify` skill handles
  ambiguous requests.
- **Smart layer** (this skill): when a request doesn't match
  a static route, ask the model to propose a skill sequence.

## When to load

- A freeform request doesn't match any verb in the router.
- The user says "use AI to figure out what I want."
- The router has a low confidence match and we want a
  second opinion.

## Procedure

1. **Try the static router first.** If it matches, use it.
   Don't ask the model for a freeform classification when
   the static layer would do.
2. **Capture the request** as the user wrote it. Don't
   paraphrase.
3. **Construct the prompt.**
   - System: "You are a router. Given a user request, output
     the task class and 1-3 skill-ids that should handle it.
     If unclear, output a single clarification question.
     Output is JSON: { task_class, skills, question }."
   - User: the request.
4. **Apply the eval rubric** (see
   `.ai/harness/router-eval.yaml`):
   - Output is valid JSON.
   - `task_class` is one of the valid classes.
   - `skills` are all in the registry.
   - `question` is a single question, or absent.
5. **If valid**, load the recommended skills and proceed.
6. **If invalid**, fall back to `task-classify` (the
   procedural skill).
7. **Log the case** to the eval set so we can re-run and
   measure over time.

## Guardrails (this project)

- The model is a router, not a doer. It does not write code.
- The model is allowed to ask one clarification question.
  It is not allowed to refuse.
- The model's output is validated against the registry
  before being used. A skill it recommends that doesn't
  exist in the registry is a hard reject.

## Failure modes

- **Hallucinated skill id**: rejected by the registry check.
- **Generic task class**: e.g. "code" instead of "implement".
  Mapped to "implement" by a fallback.
- **Empty skills list**: fallback to `task-classify`.

## Output

```
## Smart Route
- request: <verbatim or summarized>
- static match: <hit|miss>
- model output: <json>
- validated: <yes|no>
- resolution: <skills|clarification|fallback>
```
