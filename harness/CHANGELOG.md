# Changelog

All notable changes to this meta-harness are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.2] - 2026-06-16

### Fixed
- `harness diff` no longer reports user-created files (project-intake,
  profile, router) as `removed in bundle`. They are now correctly
  labeled `· project-local`.
- `npm test` works on Windows. The previous `node --test test/`
  script interpreted `test/` as a module name; now uses
  `test/*.test.mjs` glob.

### Notes
- 0.1.1 was effectively rebuilt from scratch after a workspace
  recovery event. The content matches 0.1.1's intended design.

## [0.1.1] - 2026-06-16

### Added
- `harness:ci` npm script that runs `doctor` + `diff`, mirroring CI.
- GitHub Actions workflow `.github/workflows/doctor.yml` that runs
  `harness doctor` and `harness diff` on every push and PR.
- GitHub Actions workflow `.github/workflows/test.yml` that runs the
  new `node --test` suite.
- `node --test` test suite for the YAML parser and the install/update
  copier (manifest-aware install, customize, conflict, pristine
  overwrite).
- Smart-routing customization in the `ai-integration` skill: an
  agent-side router that picks the right skill sequence for a
  freeform request, complementing the static `router.yaml`.

### Changed
- `plan` skill: now reads `.harness/manifest.yaml` first and tags each
  planned change as `(bundle)` or `(installed)`.
- `code-review` skill: now manifest-aware. Adds stop conditions for
  missing CHANGELOG entries, missing registry entries, and unregistered
  stack overlays.
- `debug` skill: now includes CLI-specific debug guidance
  (`HARNESS_DEBUG=1`, exit-code capture, module-by-module suspects).

## [0.1.0] - 2026-06-16

### Added
- Initial meta-harness skeleton.
- CLI: `init`, `install`, `diff`, `update`, `list`, `add`, `remove`, `doctor`.
- Core rules: meta, coding-style, safety, tooling.
- Intake + profile + router templates.
- Bootstrap prompt.
- Skill registry with full-ecosystem coverage (core, frontend, ai, quality, workflow).
- Manifest-driven two-way sync with customization preservation.
- Stack overlays: `generic`, `nextjs`, `python-fastapi`, `node-express`.
