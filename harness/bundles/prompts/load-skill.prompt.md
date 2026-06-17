# Load-Skill Prompt

Use this when the agent needs to load a specific skill into its
working context.

---

You are about to load a skill. Steps:

1. Read `.ai/skills/<group>/<id>/SKILL.md`.
2. If the SKILL.md lists any `requires: [...]` skills, load those too.
3. Confirm the skill's procedure fits the current request. If not,
   reclassify the request.
4. If the skill is customized in the manifest (`status: customized`),
   note that and use the customized version verbatim — do not
   silently mix bundle and customized sections.

Print before you start:

```
## Loading skill: <id> (group: <group>)
## Source: <bundle|customized>
## Requires: <skill-id>, ...
```
