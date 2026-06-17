# Task Classify

> Classify a freeform request into a skill (or sequence
> of skills). The router is the static version; this skill
> is the dynamic fallback for ambiguous requests.

## When to load

- The request doesn't match a route in
  `.ai/harness/router.yaml`.
- The user message is ambiguous or multi-part.
- The user asks "what should I do with this?"

## Procedure

1. **Read the request literally.** What is the user
   actually asking for? Strip politeness, strip
   hedging, strip "could you maybe".
2. **Identify the verb.** Implement, plan, review, debug,
   refactor, test, document, ship, design, integrate-AI.
3. **Identify the noun.** What is the subject? A feature,
   a file, a flow, a system.
4. **Identify the constraint.** Time, scope, risk, what
   must not change.
5. **Map to a task class.** The valid classes are listed
   in `.cursor/rules/00-meta.mdc` under "Classify the
   request".
6. **Map to a skill.** Use the router if possible. If
   not, pick the closest skill from the registry.
7. **If multi-part**, decompose. One skill per part. State
   the order.
8. **If still ambiguous**, ask one question, no more.
   Don't ask 5. Ask the one that disambiguates.

## Output

Always print this block before doing anything else:

```
## Classify
- Task class: <class>
- Skills to load: <id>, <id>
- Why: <one-sentence rationale>
- Open question (if any): <one question>
```

## Anti-patterns

- Asking "could you clarify" without first printing a
  best-guess classification. The user benefits more
  from "I think you want X; correct me if not" than
  from "what do you mean?"
- Picking 5 skills. The agent has finite context.
  Pick the 1-3 that are most likely to be the actual
  work.
- Skipping the classification entirely. The user
  benefits from seeing the agent's mental model.
