# Project Intake (meta-harness)

> Filled during the bootstrap prompt. Re-run the intake when
> the project changes shape.

## 1. Identity

- **Project name**: harness
- **One-line description**: Personal meta-harness. Copy this folder to bootstrap a new project with Cursor rules, a curated skill registry, prompts, and a manifest-driven two-way sync.
- **Domain**: library / dev-tool
- **Owner**: solo
- **Repo URL**: this folder
- **Maturity**: production (v0.1.1, semver-tracked)

## 2. Stack

- **Language**: JavaScript (ESM, Node >= 18.17)
- **Framework**: none (CLI)
- **Build / package manager**: npm (no install step; the CLI is dependency-free)
- **Test runner**: `node --test`
- **Linter / formatter**: none
- **CI**: GitHub Actions (`doctor.yml`, `test.yml`)
- **Deploy target**: none (the artifact is the folder itself)

## 3. Operating model

- **Who edits this repo**: solo
- **Review process**: self-review using the `code-review` skill
- **Release cadence**: as-needed, SemVer
- **On-call / pager**: none

## 4. Conventions

- **Branching**: `type/short-kebab-description`
- **Commit message style**: imperative mood, subject < 72 chars, body explains why
- **PR template path**: none
- **Issue tracker**: none

## 5. Constraints

- **Compliance**: none
- **Performance budgets**: install must copy <= 50 files in <= 5s
- **Browser / device support**: n/a
- **Forbidden dependencies**: js-yaml, commander, chalk, inquirer, lodash, any color/prompt library

## 6. AI usage

- **What AI is used for here**:
  - Generating and debugging the custom YAML parser.
  - Self-reviewing changes via the `code-review` skill.
  - Optionally, smart routing of freeform requests via the
    project-customized `ai-integration` skill.
- **What AI must NOT do here**:
  - Add dependencies to the CLI.
  - Edit `.harness/manifest.yaml` by hand.
  - Skip the test suite to "save time".
- **Eval set location**: `bundles/evals/ai-integration.eval.md`
  (used as a rubric; no live model in CI)

## 7. Open questions

- Should the meta-harness itself grow a self-test target
  (a sandbox copy of itself that exercises install/update/diff)
  to catch regressions in the copier? Probably yes; see
  pending todo `verify-restoration`.
