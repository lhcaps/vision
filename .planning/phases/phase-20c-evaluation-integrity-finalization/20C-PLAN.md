# Phase 20C Plan — Evaluation Integrity Finalization

**Phase:** 20C
**Status:** Completed
**Depends on:** Phase 20B
**Target:** Eliminate remaining integrity gaps: seed/runtime hash consistency, real metricsHash, safe legacy adapter, harness proof, stale README

## Problem Statement

Phase 20B fixed 7 correctness blockers in the evaluation core but overclaimed in its artifacts:

1. **Seed hash not aligned** — `seed-db.ts` still used the old lossy `canonicalPredId` (with `toFixed(1/3)`) and a string-join approach, while the runtime used `JSON.stringify`. These produce different hashes for inputs with tiny differences.
2. **`metricsHash: 'seed_placeholder'`** — The seeded report had a fake placeholder instead of a real canonical hash.
3. **Legacy adapter still casts** — `EvaluationReportSchema.partial().safeParse(raw)` followed by `as EvaluationReport` — any subset of fields would be cast as a full report.
4. **No Phase 20C harness** — No dedicated harness to prove seed/runtime hash consistency.
5. **README stale** — Phase 19/20 listed as "Planned", CV Worker described as "(stub)".

## Files to Change

### New files

- `apps/api/src/inference/evaluation-hash.ts` — shared pure hash utilities
- `scripts/harness/phase20c-evaluation-integrity-check.ts` — 12-point DB harness
- `apps/api/src/inference/evaluation-hash.test.ts` — 15 hash utility tests
- `apps/api/src/inference/evaluation-report-schema.test.ts` — 15 schema tests

### `apps/api/src/inference/evaluation-algorithm.ts`

- Import `computeEvaluationInputHash` from `evaluation-hash.ts`
- Re-export `computeEvaluationInputHash` for backward compatibility

### `apps/api/src/inference/evaluation.service.ts`

- Import `computeEvaluationMetricsHash` from `evaluation-hash.ts`
- Remove local `metricsHash` function
- Replace `metricsHash(report)` with `computeEvaluationMetricsHash(report)`
- Fix legacy adapter: remove `partial as EvaluationReport`, implement explicit field checks, re-validate adapted object

### `scripts/seed-db.ts`

- Remove `canonicalPredId`, `canonicalGtId`, local `computeInputHash`
- Import `computeEvaluationInputHash` and `computeEvaluationMetricsHash` from `evaluation-hash.ts`
- Replace `metricsHash: 'seed_placeholder'` with real computed hash

### `package.json`

- Add `"harness:phase20c": "npx tsx scripts/harness/phase20c-evaluation-integrity-check.ts --strict"`

### `README.md`

- Phase 19: "Planned" → "Done"
- Phase 20: "Planned" → "Done"
- Add Phase 20B and Phase 20C entries
- CV Worker: remove "(stub)", describe YOLOv8n detector
- Known limitations: update evaluation reproducibility

## Acceptance Criteria

1. Runtime and seed use the same canonical inputHash logic (single shared module)
2. Seeded `metricsHash` is computed, not `seed_placeholder`
3. Legacy adapter does not cast partial data as full report
4. `harness:phase20c` exists and verifies all 12 integrity checks
5. README no longer says Phase 19/20 are "Planned"
6. README no longer describes ONNX as "stub"
7. Phase 20B artifacts corrected with honest note about seed alignment claim
8. 30 new unit tests (15 hash + 15 schema)
9. Typecheck, build, lint, format all pass
