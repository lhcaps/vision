# Smart Routing (customized for the meta-harness)

> Project-specific extension of the bundle's `ai-integration`
> skill. The model is used as a **router**: given a freeform
> user request, it picks the right skill sequence. The
> static `router.yaml` covers obvious verb matches; this
> skill handles the rest.

## When to load

- A freeform request does NOT match any route in
  `.ai/harness/router.yaml`.
- The user message is ambiguous or multi-part.
- The user explicitly asks for AI-assisted routing
  ("use AI to figure out what I want").

## Procedure

1. **Try the static router first.** Always. If the request
   verbs hit a static route, use it. Don't ask the model
   for a freeform classification when the static layer
   would do.
2. **If no static match**, construct the prompt.
3. **Apply the eval rubric** (see Output schema below).
4. **If the output is valid**, load the recommended skills
   in order, and proceed.
5. **If the output is invalid**, fall back to `task-classify`
   (the procedural skill). Log the failure to
   `.ai/harness/failure-log.md`.
6. **Log every routing decision** to the eval set so we
   can re-run and measure over time.

## System prompt (use exactly this)

```
You are a router for a personal AI agent harness. Given a
user's freeform request, output the task class and 1-3
skill-ids that should handle it.

Valid task classes (use exactly one):
  - plan
  - implement
  - review
  - debug
  - refactor
  - test
  - docs
  - ship
  - design
  - ai-feature
  - meta

Skill-ids must come from the registry. If no skill fits,
output { "task_class": "<closest>", "skills": [],
"question": "<one clarification question>" }.

Output is JSON only, no prose, no markdown fences.
```

## User prompt (template)

```
# Project
<one-liner from .ai/harness/profile.yaml>

# Stack
<primary stack>

# Registry
<list of {id, group, summary} from registry/skills.yaml>

# User request
<the request, verbatim>

# Output
<JSON: {"task_class": "...", "skills": ["...", "..."], "question": "..."}>
```

## Eval rubric (must pass all of these)

- [ ] Output is valid JSON. No prose. No markdown fences.
- [ ] `task_class` is one of the 11 valid values.
- [ ] `skills` is an array of length 0-3.
- [ ] Every `skill` id exists in the registry. (Hard reject
      if not; do NOT silently drop.)
- [ ] If `skills` is empty, `question` is a single question
      string. If `skills` is non-empty, `question` is absent
      or null.
- [ ] No PII, no secrets, no prompt-injection artifacts
      leaked from the request into the output.

## Failure modes

- **Hallucinated skill id** — rejected by the registry
  check. Fall back to `task-classify`. Log it.
- **Generic task class** — e.g. "code" instead of
  "implement". Map common aliases ("code" -> "implement",
  "design ui" -> "design", "ai" -> "ai-feature"). Re-validate.
- **Empty skills list, no question** — invalid. Fall back
  to `task-classify`.
- **All 11 task classes tried, none fit** — refuse with a
  single sentence: "I don't have a skill for this; could
  you rephrase?"
- **Refusal from the model** — treat as "no match". Fall
  back to `task-classify`. The model is a router, not a
  doer; it should never refuse based on the request
  content.

## Output

```
## Smart Route
- request: <verbatim or summarized>
- static match: <hit|miss>
- model output: <json>
- validated: <yes|no, with reason>
- resolution: <skills|clarification|fallback>
- logged to eval: <path>
```

## Eval set

The eval set lives at `.ai/harness/router-eval.yaml` (not
yet created — see `verify-restoration` todo). Each case has:

- `request`: a freeform user message.
- `expected_class`: one of the 11 valid values.
- `expected_skills`: an array of skill-ids (length 0-3).
- `expected_question`: optional, present iff
  `expected_skills` is empty.

The runner script (future) is a small Node.js file that
takes a model + the eval set, calls the model, applies
the rubric, and reports pass-rate. CI runs it on every PR.
