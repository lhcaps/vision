-- Phase 20E — EvaluationReport integrity columns migration/backfill
-- Purpose:
--   Move EvaluationReport traceability/integrity fields out of metricsJson-only storage
--   into indexed scalar columns, while preserving metricsJson as the canonical API payload.
--
-- Safety:
--   1. Add nullable columns first.
--   2. Backfill from metricsJson.
--   3. Validate missing/invalid rows.
--   4. Apply NOT NULL only after validation.
--   5. Add indexes/unique constraint.
--
-- Rollback note:
--   Scalar columns can be dropped only after confirming metricsJson still contains
--   equivalent fields. Do not drop metricsJson.

BEGIN;

-- 1. Add columns as nullable first for safe backfill.
ALTER TABLE "EvaluationReport"
  ADD COLUMN IF NOT EXISTS "datasetVersionId" TEXT,
  ADD COLUMN IF NOT EXISTS "pipelineId" TEXT,
  ADD COLUMN IF NOT EXISTS "modelId" TEXT,
  ADD COLUMN IF NOT EXISTS "algorithmVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "iouThreshold" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "inputHash" TEXT,
  ADD COLUMN IF NOT EXISTS "metricsHash" TEXT;

-- 2. Backfill from metricsJson.
UPDATE "EvaluationReport"
SET
  "datasetVersionId" = COALESCE(
    "datasetVersionId",
    NULLIF("metricsJson"->>'datasetVersionId', '')
  ),
  "pipelineId" = COALESCE(
    "pipelineId",
    NULLIF("metricsJson"->>'pipelineId', '')
  ),
  "modelId" = COALESCE(
    "modelId",
    NULLIF("metricsJson"->>'modelId', '')
  ),
  "algorithmVersion" = COALESCE(
    "algorithmVersion",
    NULLIF("metricsJson"->>'algorithmVersion', '')
  ),
  "iouThreshold" = COALESCE(
    "iouThreshold",
    CASE
      WHEN "metricsJson" ? 'iouThreshold'
       AND NULLIF("metricsJson"->>'iouThreshold', '') IS NOT NULL
      THEN ("metricsJson"->>'iouThreshold')::DOUBLE PRECISION
      ELSE NULL
    END
  ),
  "inputHash" = COALESCE(
    "inputHash",
    NULLIF("metricsJson"->>'inputHash', '')
  ),
  "metricsHash" = COALESCE(
    "metricsHash",
    NULLIF("metricsJson"->>'metricsHash', '')
  );

-- 3. Validate required backfill fields.
-- This block fails the migration if any existing row cannot be backfilled safely.
DO $$
DECLARE
  missing_count INTEGER;
  invalid_hash_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO missing_count
  FROM "EvaluationReport"
  WHERE "datasetVersionId" IS NULL
     OR "algorithmVersion" IS NULL
     OR "iouThreshold" IS NULL
     OR "inputHash" IS NULL
     OR "metricsHash" IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION
      'EvaluationReport integrity migration failed: % row(s) missing required backfill fields',
      missing_count;
  END IF;

  SELECT COUNT(*)
  INTO invalid_hash_count
  FROM "EvaluationReport"
  WHERE "inputHash" !~ '^[a-f0-9]{16}$'
     OR "metricsHash" !~ '^[a-f0-9]{16}$';

  IF invalid_hash_count > 0 THEN
    RAISE EXCEPTION
      'EvaluationReport integrity migration failed: % row(s) have invalid 16-char lowercase hex hashes',
      invalid_hash_count;
  END IF;
END $$;

-- 4. Add NOT NULL constraints after successful validation.
ALTER TABLE "EvaluationReport"
  ALTER COLUMN "datasetVersionId" SET NOT NULL,
  ALTER COLUMN "algorithmVersion" SET NOT NULL,
  ALTER COLUMN "iouThreshold" SET NOT NULL,
  ALTER COLUMN "inputHash" SET NOT NULL,
  ALTER COLUMN "metricsHash" SET NOT NULL;

-- 5. Add indexes.
CREATE INDEX IF NOT EXISTS "EvaluationReport_inferenceJobId_createdAt_idx"
  ON "EvaluationReport" ("inferenceJobId", "createdAt");

CREATE INDEX IF NOT EXISTS "EvaluationReport_datasetVersionId_createdAt_idx"
  ON "EvaluationReport" ("datasetVersionId", "createdAt");

CREATE INDEX IF NOT EXISTS "EvaluationReport_inputHash_idx"
  ON "EvaluationReport" ("inputHash");

CREATE INDEX IF NOT EXISTS "EvaluationReport_metricsHash_idx"
  ON "EvaluationReport" ("metricsHash");

CREATE INDEX IF NOT EXISTS "EvaluationReport_algorithmVersion_idx"
  ON "EvaluationReport" ("algorithmVersion");

-- 6. Add unique index for deterministic upsert.
CREATE UNIQUE INDEX IF NOT EXISTS "EvaluationReport_inferenceJobId_inputHash_key"
  ON "EvaluationReport" ("inferenceJobId", "inputHash");

COMMIT;
