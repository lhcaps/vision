# Phase 20B Plan — Evaluation Correctness Hardening

**Phase:** 20B
**Status:** Completed
**Depends on:** Phase 20 (FULL PASS 10/10)
**Target:** Fix correctness blockers found in Phase 20 audit

## Problem Statement

Phase 20 audit identified 7 correctness blockers that prevent the evaluation subsystem from being production-correct:

1. **Per-class aggregation bug** — algorithm groups by `${assetId}|${classKey}` then stores into `classMetrics` using only `classKey`, overwriting results across assets for the same class.
2. **No LOCKED dataset version enforcement** — evaluation can run against DRAFT/ARCHIVED dataset versions.
3. **GT scoping bug** — `versionAssets` includes annotations via `link.asset.annotations`, which can pull annotations from other dataset versions' annotation sets.
4. **Partial report casting** — `getEvaluationReport()` uses `.partial()` parse and casts to full `EvaluationReport`, corrupting the contract.
5. **Lossy inputHash** — `canonicalPredId` uses `toFixed(1)` for geometry and `toFixed(3)` for confidence, causing hash collisions.
6. **EvaluationMatch unused** — `EvaluationMatchSchema` exists but matches are not persisted/returned in final report.
7. **metricsHash is incomplete** — computed from only 4 fields, not the full report payload.

## Files to Change

### `apps/api/src/inference/evaluation-algorithm.ts`

- Fix per-class aggregation: aggregate TP/FP/FN across all `assetId|classKey` groups into one per-class row
- Replace lossy `toFixed(1/3)` with deterministic canonical JSON for `computeInputHash`
- Add `algorithmVersion` and `assetId`/`classKey`/`id` to hash canonical input
- Keep 16-char hex output, document that canonical source uses full SHA-256

### `apps/api/src/inference/evaluation.service.ts`

- Add LOCKED dataset version check before evaluation
- Fix GT scoping: load `AnnotationSet` via `DatasetVersion.annotationSets`, then `AnnotationSet.annotations`
- Fix `getEvaluationReport()`: strict parse first, legacy adapter second, null if neither matches
- Add matches to persisted report
- Improve `metricsHash` to include full canonical payload

### `apps/api/src/inference/evaluation-algorithm.test.ts`

- Add test: same class across 2 assets with TP in one and FP+FN in another → aggregated per-class
- Add test: tiny geometry/confidence diff changes hash
- Add test: order changes don't change hash

### `packages/contracts/src/evaluation.ts`

- Extend `EvaluationReportSchema` to include optional `matches: EvaluationMatchSchema[]`
- The field is optional so existing persisted reports without matches are still valid

### `scripts/seed-db.ts`

- Ensure seeded dataset version is LOCKED
- Verify annotations are scoped to the correct `AnnotationSet` belonging to the seeded version

## Fix 4.1: Per-Class Aggregation

**Current behavior:** `classMetrics` is keyed by `classKey` only. Each iteration over `allGroupKeys` overwrites the entry, so if "car" appears in asset a1 and asset a2, only the last one's metrics survive.

**Required behavior:** Aggregate TP/FP/FN across all `assetId|classKey` groups that share the same `classKey`.

**Fix approach:**

1. Iterate `allGroupKeys` to compute per-group TP/FP/FN
2. Accumulate into a `classKey`-keyed accumulator `{ classKey, label, tp, fp, fn, ious[] }`
3. After processing all groups, the accumulator has the correct aggregated counts
4. Label: prefer GT label > prediction label > classKey (unchanged)

## Fix 4.2: LOCKED Dataset Version Enforcement

**Required behavior:** Before loading assets/GT, query `DatasetVersion` by `job.datasetVersionId`. If `status !== 'LOCKED'`, throw `ConflictException("Evaluation requires a LOCKED dataset version. Current status: <status>.")`.

**Note:** Does not apply to memory/demo mode.

## Fix 4.3: GT Scoping via AnnotationSet

**Current behavior:** `versionAssets` → `link.asset.annotations` loads all MANUAL annotations on the asset, regardless of which `AnnotationSet` they belong to.

**Required behavior:** Ground truth must come only from `AnnotationSet` rows that belong to the evaluated `DatasetVersion`.

**Fix approach:**

1. Load the `DatasetVersion` with its `annotationSets` included
2. Get the set of annotation set IDs: `version.annotationSets.map(s => s.id)`
3. Load annotations filtered to those annotation set IDs and `source: 'MANUAL'`
4. The annotation's `assetId` must be in the version's asset set

**Query shape:**

```typescript
const version = await this.prisma.datasetVersion.findUnique({
  where: { id: job.datasetVersionId },
  include: {
    annotationSets: { include: { annotations: { include: { labelClass: true } } } },
  },
});
// Filter annotations to source=MANUAL and assetId in versionAssets
```

## Fix 4.4: Strict Report Parsing

**Current behavior:** `EvaluationReportSchema.partial().safeParse(raw)` allows any subset of fields.

**Fix approach:**

1. First: `EvaluationReportSchema.safeParse(raw)` (strict) — if valid, return it
2. Second: try a legacy adapter for known old shapes (e.g., report without `matches`, report with `perClassMetrics` but missing fields)
3. If neither succeeds, return `null`
4. `InferenceController.getEvaluation` wraps response in `{ report }` — null report is returned as `{ report: null }`, which is valid per `EvaluationRunResponseSchema`

## Fix 4.5: Non-Lossy inputHash

**Current behavior:** `canonicalPredId` rounds geometry to 1 decimal and confidence to 3 decimals.

**Fix approach:** Replace string concatenation with canonical JSON:

```typescript
const sortedPreds = [...predictions].sort((a, b) => a.id.localeCompare(b.id));
const sortedGt = [...groundTruth].sort((a, b) => a.id.localeCompare(b.id));

const canonical = JSON.stringify({
  jobId,
  datasetVersionId,
  iouThreshold,
  algorithmVersion,
  predictions: sortedPreds.map((p) => ({
    id: p.id,
    assetId: p.assetId,
    classKey: p.classKey,
    geometry: p.geometry,
    confidence: p.confidence,
  })),
  groundTruth: sortedGt.map((gt) => ({
    id: gt.id,
    assetId: gt.assetId,
    classKey: gt.classKey,
    geometry: gt.geometry,
  })),
});
```

Keep 16-char hex output. Update seed's inline hash computation to match.

## Fix 4.6: Persist EvaluationMatch

**Required behavior:** `EvaluationReportSchema` extends with optional `matches: EvaluationMatchSchema[]`.

**Implementation:**

- Add `matches` field to the `EvaluationReport` object constructed in `runEvaluation()`
- Persist in `metricsJson` alongside other fields
- `getEvaluationReport()` already returns the full report, so matches are returned automatically
- Frontend already ignores unknown fields (no contract change needed on consumer side)

## Fix 4.7: metricsHash Full Payload

**Required behavior:** `metricsHash` computed from canonical JSON of full report excluding `metricsHash` itself.

**Fields included:**

- jobId, datasetVersionId, pipelineId, modelId, algorithmVersion
- iouThreshold, inputHash
- precision, recall, f1, meanIoU
- truePositives, falsePositives, falseNegatives
- predictionCount, groundTruthCount, assetCount
- perClassMetrics (sorted canonical JSON)
- matches (sorted canonical JSON, if present)

**Excluded:** `metricsHash`, `id`, `evaluatedAt`

## Verification Commands

```
pnpm --filter @visionflow/api typecheck
pnpm --filter @visionflow/api test
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm format:check
pnpm seed:db -- --reset
pnpm harness:phase20
# Add phase20b harness if new coverage needed
# API smoke:
# POST evaluation for SEEDED_SUCCEEDED_JOB_ID
# GET evaluation
# Verify per-class aggregation
# Verify matches in report
# Verify hash stability across re-runs
```

## Acceptance Criteria

1. Same class across 2 assets produces ONE per-class row with aggregated TP/FP/FN
2. Evaluation against DRAFT dataset version throws 409 ConflictException
3. Annotations from other dataset versions are not included in GT
4. Partial/corrupt metricsJson does not crash API or return false data
5. Tiny geometry/confidence difference changes inputHash
6. `matches` field appears in persisted report
7. `metricsHash` is stable for same inputs
8. All unit tests pass (including new ones)
9. Seeded dataset version is LOCKED
10. Typecheck, build, lint, format all pass
