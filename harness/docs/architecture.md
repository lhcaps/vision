# Architecture

```
harness/
  cli/                 # the Node.js CLI
    harness.mjs        # entry point
    lib/               # core helpers
    commands/          # per-command implementations
  bundles/             # content copied into target repos
    rules/             # Cursor .mdc rules
    skills/            # skills by group
    prompts/           # repeatable prompts
    evals/             # checklists
    harness/           # AGENTS.md + templates
  stacks/              # stack-specific overlays
  registry/            # declarative indexes
  test/                # node:test suite
  meta.yaml            # version + supported stacks
```

## CLI flow

1. `harness.mjs` parses argv.
2. `runner.mjs` dispatches to a command module.
3. Command modules call into `lib/` for paths, fs, hashing,
   YAML, manifest, registry, detector, copier, output, doctor.
4. Output is shaped for humans or JSON.

## Two-way sync

- A target repo has `.harness/manifest.yaml` after install.
- `harness diff` compares the installed manifest against the
  current bundle.
- `harness update` applies non-conflicting changes. Conflicts
  are recorded in the manifest as `status: conflict` and the
  user resolves them by hand.

## Why no dependencies?

The CLI is intentionally dependency-free:

- Smaller install surface.
- Easier to vendor (copy the folder, no `npm install`).
- No CVEs to track.
- The YAML we use is small enough to parse by hand.

The cost is a slightly less feature-complete YAML parser. The
trade-off is intentional.
