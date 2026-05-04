# Phase 20D Plan — Evaluation Persistence & CI Hardening

**Phase:** 20D
**Status:** Complete
**Depends on:** Phase 20C
**Target:** Production-grade evaluation persistence with DB-backed integrity guarantees

## Problem Statement

Phase 20C established the shared hash module and integrity harness, but the evaluation subsystem still has 7 gaps preventing a 10/10 production-grade rating:

1. **`EvaluationReport` has no dedicated DB columns** — all traceability (inputHash, metricsHash, datasetVersionId, pipelineId, modelId, algorithmVersion, iouThreshold) lives only inside `metricsJson` JSON blob
2. **No DB-level uniqueness/upsert** — deterministic re-runs create duplicate rows
3. **`--strict` harness exits 0 without DATABASE_URL** — package.json uses `--strict` but harness skips DB and exits 0
4. **Hash schema checks length only, not hex format** — `z.string().length(16)` accepts non-hex like "abcd1234efgh5678"
5. **Phase 20D harness does not exist** — no harness verifies the new DB columns
6. **No CI wiring** — harness is not run in GitHub Actions
7. **No DB-backed integration tests** — DRAFT reject, annotation leak isolation, and upsert dedupe are not tested

## Non-Negotiable Acceptance Criteria

### A. EvaluationReport DB Columns

`EvaluationReport` model in Prisma schema gets dedicated scalar columns:

```prisma
model EvaluationReport {
  id                  String   @id @default(cuid())
  inferenceJobId      String
  datasetVersionId    String
  pipelineId          String?
  modelId            String?
  algorithmVersion    String
  iouThreshold       Float
  inputHash          String
  metricsHash        String
  metricsJson         Json
  confusionMatrixJson Json?
  artifactKey         String?
  createdAt           DateTime @default(now())

  inferenceJob InferenceJob @relation(fields: [inferenceJobId], references: [id], onDelete: Cascade)

  @@unique([inferenceJobId, inputHash])
  @@index([inferenceJobId, createdAt])
  @@index([datasetVersionId, createdAt])
  @@index([inputHash])
  @@index([metricsHash])
  @@index([algorithmVersion])
}
```

### B. Upsert-by-Hash in EvaluationService

Replace `prisma.evaluationReport.create()` with `upsert()`:

```typescript
await this.prisma.evaluationReport.upsert({
  where: {
    inferenceJobId_inputHash: {
      // Prisma names it this way
      inferenceJobId: jobId,
      inputHash: validated.inputHash,
    },
  },
  update: {
    /* update all columns */
  },
  create: {
    /* create all columns */
  },
});
```

### C. Seed Writes All New Columns

`seed-db.ts` must populate all new columns when seeding the `EvaluationReport` row. No `seed_placeholder`.

### D. Read Path Consistency Check

`getEvaluationReport()` cross-checks row scalar columns against parsed `metricsJson` fields. Mismatch → return `null`.

### E. Hash Schema Enforces Lowercase Hex

`z.string().regex(/^[a-f0-9]{16}$/)` for both `inputHash` and `metricsHash`. All test fixtures updated.

### F. Phase 20C Harness Strict Fix

With `--strict`, fail with exit 1 if DATABASE_URL is absent.

### G. Phase 20D Harness

12-point read-only harness verifying:

1. EvaluationReport row exists
2. New DB columns are non-null where required
3. `row.inputHash === metricsJson.inputHash`
4. `row.metricsHash === metricsJson.metricsHash`
5. `row.datasetVersionId === metricsJson.datasetVersionId`
6. `row.algorithmVersion === metricsJson.algorithmVersion`
7. `row.iouThreshold === metricsJson.iouThreshold`
8. Duplicate same-input evaluation does not create duplicate rows
9. Latest report strict-parses
10. No `seed_placeholder` exists anywhere in latest report
11. Unique `[inferenceJobId, inputHash]` is effective
12. No stale QUEUED/RUNNING seeded job exists

### H. DB-Backed Integration Tests

Three tests using Prisma + test DB:

1. **DRAFT reject** — evaluation against DRAFT dataset version throws 409/ConflictException
2. **Annotation leak isolation** — two dataset versions sharing same asset, each with different GT; evaluating version A does not count version B's annotations
3. **Upsert-by-hash** — run same evaluation twice with identical inputs; report count remains 1

### I. CI Wiring

`.github/workflows/ci.yml` gets a new `db-harness` job:

```yaml
db-harness:
  needs: [typecheck, test]
  services:
    postgres: # ... same as test job
  steps:
    - pnpm install
    - pnpm db:generate
    - pnpm db:push
    - pnpm seed:db -- --reset
    - pnpm harness:phase20c
    - pnpm harness:phase20d
```

## Execution Waves

### Wave 1: Schema + Service (prerequisite for everything else)

- Prisma schema update (EvaluationReport new columns)
- `pnpm db:push` to sync
- EvaluationService upsert + read consistency
- Seed updates
- Contract hash regex

### Wave 2: Verification Infrastructure

- Phase 20C harness strict fix
- Phase 20D harness
- DB-backed integration tests

### Wave 3: CI + Artifacts

- CI workflow update
- STATE, ROADMAP, MILESTONES, README updates
- Phase 20D artifact files (PLAN, SUMMARY, REVIEW)

### Wave 4: Verification Gate

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm lint`
- `pnpm format:check`
- `pnpm db:generate && pnpm db:push && pnpm seed:db -- --reset && pnpm harness:phase20c && pnpm harness:phase20d`

## Files to Change

### New Files

- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-PLAN.md`
- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-SUMMARY.md`
- `.planning/phases/phase-20d-evaluation-persistence-ci-hardening/20D-REVIEW.md`
- `scripts/harness/phase20d-evaluation-db-index-check.ts`

### Modified Files

- `infra/prisma/schema.prisma` — EvaluationReport new columns + indexes + unique
- `apps/api/src/inference/evaluation.service.ts` — upsert + read consistency
- `scripts/seed-db.ts` — write all new columns
- `packages/contracts/src/evaluation.ts` — hash regex enforces hex
- `packages/contracts/src/evaluation.test.ts` — update fixtures to valid hex
- `apps/api/src/inference/evaluation-report-schema.test.ts` — update hash tests
- `scripts/harness/phase20c-evaluation-integrity-check.ts` — strict mode fix
- `.github/workflows/ci.yml` — add db-harness job
- `package.json` — add `harness:phase20d` script
- `.planning/STATE.md` — Phase 20D status
- `.planning/ROADMAP.md` — Phase 20D entry
- `.planning/MILESTONES.md` — Phase 20D entry
- `README.md` — Phase 20D status

## Verification Commands

```
pnpm db:generate
pnpm db:push
pnpm seed:db -- --reset
pnpm harness:phase20c
pnpm harness:phase20d
pnpm --filter @visionflow/api typecheck
pnpm --filter @visionflow/api test
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm format:check
```
