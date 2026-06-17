# AGENTS.md (project root)

> This file is copied from the meta-harness bundle. It is the
> **project-specific** AGENTS file. The bundle's `.cursor/rules/00-meta.mdc`
> is the **universal** operating model. They work together: the
> rule is the chassis, this file is the trim.

## What this project is

<!-- One paragraph. Replace with a real description after intake. -->

> The meta-harness itself: a portable, file-based AI agent harness for
> Cursor-first software projects. See the top-level README for the
> full pitch.

## Project-specific rules (override the universal ones)

<!-- Add only if this project genuinely needs to deviate from
`.cursor/rules/10-coding-style.mdc` or `20-safety.mdc`. Do not
re-state the universals. -->

- This project is itself a meta-harness. The agent's task is
  sometimes to **edit the bundle** that other projects will copy.
  When that is the case, prefer `node --test` and `harness diff` in
  a sandbox over reasoning from first principles.

## Skills to prefer

<!-- Filled in by the bootstrap prompt's `intake` step. -->

- `plan` — almost every change starts here.
- `code-review` — every PR.
- `debug` — the YAML parser, the copier, and the Windows path
  resolution have all been debugged before. Read
  `.ai/harness/failure-log.md` for the exact traps.
- `meta` — operating the harness itself.

## Skills to ignore

- `image-to-code` — no UI in this project.
- `motion-design` — no UI in this project.

## Local overrides to the universal rules

- The CLI is dependency-free on purpose. **Do not add `js-yaml`,
  `chalk`, or `commander`.** If a feature seems to need them, write
  the small version by hand.
- The custom YAML parser in `cli/lib/yaml.mjs` is intentionally
  minimal. If a config grows a feature the parser can't handle,
  extend the parser, not the config.

## Repo map

- `cli/` — the Node.js CLI. Entry point: `cli/harness.mjs`.
- `bundles/` — content that gets copied into target repos.
- `stacks/` — stack-specific overlays.
- `registry/skills.yaml` — the index of all skills.
- `meta.yaml` — version, defaults, supported stacks.
- `test/` — `node --test` suite.
- `.github/workflows/` — CI for doctor and tests.
