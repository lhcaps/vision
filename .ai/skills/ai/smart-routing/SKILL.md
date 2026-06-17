# Smart Routing (bundle)

> The model's role as a router. Loaded by the
> `ai-integration` skill's smart-routing section, or
> directly when a freeform request doesn't match a static
> route.

This is the **bundle version** of the skill. Projects that
have an actual model wired up should override it with a
copy that specifies the model, the eval set, and the
guardrails. The meta-harness project's customized copy
lives at `.ai/skills/ai/smart-routing/SKILL.md` and is
the canonical example.

## When to load

- A freeform request does NOT match any route in
  `.ai/harness/router.yaml`.
- The user message is ambiguous or multi-part.
- The user explicitly asks for AI-assisted routing.

## Procedure

1. **Try the static router first.** Always.
2. **If no static match**, construct the prompt (see
   `ai-integration` skill for the schema).
3. **Apply the eval rubric.**
4. **If the output is valid**, load the recommended skills
   in order, and proceed.
5. **If the output is invalid**, fall back to
   `task-classify`. Log the failure.
6. **Log every routing decision** to the eval set.

## Output schema

```json
{
  "task_class": "implement|plan|review|debug|...|meta",
  "skills": ["id1", "id2"],
  "question": "single question or null"
}
```

## Guardrails

- Output is JSON only. No prose. No markdown fences.
- Skill ids must be in the registry. Reject otherwise.
- The model is a router, not a doer. It does not write code
  and does not refuse based on request content.

## Customization

Projects with a real model wired up should copy this file
to `.ai/skills/ai/smart-routing/SKILL.md` and add:

- The system prompt they'll actually use.
- The exact JSON schema the model will be asked to produce.
- The eval set path and runner script.
- The fallback procedure.
