# Coding Tool Optimization Scaffold

This scaffold is meant for two use cases:

1. developers building agentic coding systems
2. advanced users tuning AGENTS.md, GEMINI.md, and helper scripts around coding-agent tools

The baseline workspace lives under `baseline/`.
The project is configured by `metaharness.json`.
This scaffold was generated with the `standard` profile.

Run it with the fake backend:

```bash
metaharness run . --backend fake --budget 1
```

Run it with Codex:

```bash
metaharness run . --backend codex --budget 2
```

Probe the local Codex CLI before spending model calls:

```bash
metaharness smoke codex . --probe-only
```

To adapt this scaffold to your real workflow:

- edit `metaharness.json` to define the objective, constraints, required files, and `allowed_write_paths`
- configure `backends.codex` in `metaharness.json` if you want hosted Codex or local Codex-over-Ollama
- replace `tasks.json` with deterministic `file_phrase` and `command` checks that match your workflow
- expand `baseline/AGENTS.md`, `baseline/GEMINI.md`, and `baseline/scripts/`
- replace the placeholder command checks in `baseline/scripts/` with real bootstrap and validation logic
