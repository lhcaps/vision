#!/usr/bin/env tsx
/**
 * scripts/harness/phase22a-fixture-infrastructure-check.ts
 *
 * Read-only DB integrity harness for Phase 22A Fixture & Test Infrastructure.
 *
 * Verifies that the deterministic seed produces the expected fixture baseline:
 *   1.  --strict mode fails if DATABASE_URL missing.
 *   2.  Project proj_parking_lot exists.
 *   3.  Dataset exists for the project.
 *   4.  Dataset version exists and is LOCKED.
 *   5.  All 3 demo assets are linked to the version.
 *   6.  Annotation workspace target asset exists.
 *   7.  Annotation set exists.
 *   8.  At least one MANUAL ground-truth annotation exists on the workspace asset.
 *   9.  Pipeline exists.
 *  10.  Pipeline references model_onnx_yolov8n_v1.
 *  11.  ONNX model artifact row exists.
 *  12.  SUCCEEDED inference job exists.
 *  13.  Predictions exist for the job.
 *  14.  Evaluation report exists with correct traceability fields.
 *  15.  No stale QUEUED/RUNNING jobs for the demo project after seed reset.
 *  16.  Seeded evaluation report consistency: row scalars match metricsJson.
 *  17.  Phase 20D harness equivalence: EvaluationReport integrity columns non-null.
 *  18.  Phase 20E harness equivalence: all migration columns present and NOT NULL.
 *  19.  Phase 20F harness equivalence: migrations applied, no stale state.
 *
 * Usage:
 *   npx tsx scripts/harness/phase22a-fixture-infrastructure-check.ts
 *   npx tsx scripts/harness/phase22a-fixture-infrastructure-check.ts --strict
 *   pnpm harness:phase22a
 */

import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

const LOG_PREFIX = '[phase22a-harness]';

function log(msg: string) {
  console.log(`${LOG_PREFIX} ${msg}`);
}

function logPass(msg: string) {
  console.log(`\x1b[32m  PASS\x1b[0m ${msg}`);
}

function logFail(msg: string) {
  console.error(`\x1b[31m  FAIL\x1b[0m ${msg}`);
}

function logSkip(msg: string) {
  console.log(`\x1b[33m  SKIP\x1b[0m ${msg}`);
}

interface CheckResult {
  name: string;
  passed: boolean;
  details?: string;
}

async function main() {
  log('Starting Phase 22A Fixture Infrastructure check...');
  log(`Database: ${process.env.DATABASE_URL ? '(configured)' : '(NOT configured)'}`);

  const results: CheckResult[] = [];
  const strict = process.argv.includes('--strict');

  if (!process.env.DATABASE_URL) {
    if (strict) {
      logFail('DATABASE_URL not configured — STRICT mode requires database connection.');
      logFail('Fix: set DATABASE_URL in .env or export DATABASE_URL=<connection_string>');
      process.exit(1);
    }
    logSkip('DATABASE_URL not configured — DB checks skipped.');
    log('For full Phase 22A verification:');
    log('  1. Start Docker: docker compose -f infra/docker-compose.yml up -d');
    log('  2. Reset DB:    pnpm seed:db -- --reset');
    log('  3. Run harness: pnpm harness:phase22a');
    process.exit(0);
  }

  const prisma = new PrismaClient({ log: [] });

  try {
    await prisma.$connect();
    log('Connected to PostgreSQL');
    console.log('');

    // ── Check 1: Project exists ─────────────────────────────────────────────────
    {
      const project = (await prisma.$queryRawUnsafe(
        'SELECT id, name FROM "Project" WHERE id = $1',
        'proj_parking_lot'
      )) as Array<{ id: string; name: string }>;

      const passed = project.length === 1 && project[0].id === 'proj_parking_lot';
      results.push({
        name: 'Project proj_parking_lot exists',
        passed,
        details: passed ? project[0].name : 'NOT FOUND',
      });
      if (passed) logPass('Project proj_parking_lot exists');
      else logFail('Project proj_parking_lot NOT FOUND');
    }

    // ── Check 2: Dataset exists ──────────────────────────────────────────────────
    {
      const dataset = (await prisma.$queryRawUnsafe(
        'SELECT id FROM "Dataset" WHERE id = $1',
        'ds_proj_parking_lot'
      )) as Array<{ id: string }>;

      const passed = dataset.length === 1;
      results.push({
        name: 'Dataset ds_proj_parking_lot exists',
        passed,
        details: passed ? 'found' : 'NOT FOUND',
      });
      if (passed) logPass('Dataset ds_proj_parking_lot exists');
      else logFail('Dataset ds_proj_parking_lot NOT FOUND');
    }

    // ── Check 3: Dataset version exists and is LOCKED ───────────────────────────
    {
      const version = (await prisma.$queryRawUnsafe(
        'SELECT id, status FROM "DatasetVersion" WHERE id = $1',
        'dataset_proj_parking_lot_parking_v3'
      )) as Array<{ id: string; status: string }>;

      const passed = version.length === 1 && String(version[0].status) === 'LOCKED';
      results.push({
        name: 'Dataset version exists and is LOCKED',
        passed,
        details: passed
          ? `id=${version[0].id}, status=${version[0].status}`
          : version.length === 0
            ? 'NOT FOUND'
            : `status=${version[0].status} (expected LOCKED)`,
      });
      if (passed) logPass('Dataset version dataset_proj_parking_lot_parking_v3 is LOCKED');
      else logFail(`Dataset version status: ${version[0]?.status ?? 'NOT FOUND'}`);
    }

    // ── Check 4: All 3 demo assets are linked to the version ───────────────────
    {
      const linked = (await prisma.$queryRawUnsafe(
        'SELECT COUNT(*)::int AS cnt FROM "DatasetVersionAsset" WHERE "datasetVersionId" = $1',
        'dataset_proj_parking_lot_parking_v3'
      )) as Array<{ cnt: number }>;

      const passed = linked.length === 1 && linked[0].cnt >= 3;
      results.push({
        name: 'At least 3 assets linked to dataset version',
        passed,
        details: passed ? `${linked[0].cnt} assets linked` : `only ${linked[0]?.cnt ?? 0} linked`,
      });
      if (passed) logPass(`${linked[0].cnt} assets linked to dataset version`);
      else logFail(`${linked[0]?.cnt ?? 0} assets linked (expected >= 3)`);
    }

    // ── Check 5: Annotation workspace target asset exists ───────────────────────
    {
      const asset = (await prisma.$queryRawUnsafe(
        'SELECT id, width, height FROM "MediaAsset" WHERE id = $1',
        'asset_frame_1482'
      )) as Array<{ id: string; width: number; height: number }>;

      const passed = asset.length === 1;
      results.push({
        name: 'Annotation workspace target asset exists',
        passed,
        details: passed ? `${asset[0].width}x${asset[0].height}` : 'asset_frame_1482 NOT FOUND',
      });
      if (passed) logPass('Annotation workspace asset asset_frame_1482 exists');
      else logFail('Asset asset_frame_1482 NOT FOUND');
    }

    // ── Check 6: Annotation set exists ─────────────────────────────────────────
    {
      const annSet = (await prisma.$queryRawUnsafe(
        'SELECT id FROM "AnnotationSet" WHERE id = $1',
        'annset_dataset_proj_parking_lot_parking_v3_manual'
      )) as Array<{ id: string }>;

      const passed = annSet.length === 1;
      results.push({
        name: 'Annotation set exists',
        passed,
        details: passed
          ? annSet[0].id
          : 'annset_dataset_proj_parking_lot_parking_v3_manual NOT FOUND',
      });
      if (passed) logPass('Annotation set exists');
      else logFail('Annotation set NOT FOUND');
    }

    // ── Check 7: At least one MANUAL annotation on workspace asset ───────────────
    {
      const annotations = (await prisma.$queryRawUnsafe(
        'SELECT id, "labelClassId", source FROM "Annotation" WHERE "annotationSetId" = $1 AND "assetId" = $2 AND source::text = \'MANUAL\'',
        'annset_dataset_proj_parking_lot_parking_v3_manual',
        'asset_frame_1482'
      )) as Array<{ id: string; labelClassId: string; source: string }>;

      const passed = annotations.length >= 1;
      results.push({
        name: 'At least one MANUAL annotation on workspace asset',
        passed,
        details: passed ? `${annotations.length} MANUAL annotation(s)` : 'NONE found',
      });
      if (passed) logPass(`${annotations.length} MANUAL annotation(s) on asset_frame_1482`);
      else logFail('No MANUAL annotations found on asset_frame_1482');
    }

    // ── Check 8: Pipeline exists ────────────────────────────────────────────────
    {
      const pipeline = (await prisma.$queryRawUnsafe(
        'SELECT id, name, "definitionJson" FROM "Pipeline" WHERE id = $1',
        'pipeline_proj_parking_lot_parking_detector'
      )) as Array<{ id: string; name: string; definitionJson: Record<string, unknown> }>;

      const passed = pipeline.length === 1;
      results.push({
        name: 'Pipeline exists',
        passed,
        details: passed ? pipeline[0].name : 'pipeline_proj_parking_lot_parking_detector NOT FOUND',
      });
      if (passed) logPass(`Pipeline exists: ${pipeline[0].name}`);
      else logFail('Pipeline NOT FOUND');
    }

    // ── Check 9: Pipeline references ONNX model ─────────────────────────────────
    {
      const pipeline = (await prisma.$queryRawUnsafe(
        'SELECT "definitionJson" FROM "Pipeline" WHERE id = $1',
        'pipeline_proj_parking_lot_parking_detector'
      )) as Array<{ definitionJson: Record<string, unknown> }>;

      let passed = false;
      let details = 'NOT CHECKED';
      if (pipeline.length === 1) {
        const def = pipeline[0].definitionJson;
        const nodes = (def?.nodes ?? []) as Array<{ type: string; params: { modelId?: string } }>;
        const detectorNode = nodes.find((n) => n.type === 'yolo_onnx');
        passed = detectorNode?.params?.modelId === 'model_onnx_yolov8n_v1';
        details = passed
          ? 'pipeline references model_onnx_yolov8n_v1'
          : detectorNode
            ? `pipeline references ${detectorNode.params.modelId} (expected model_onnx_yolov8n_v1)`
            : 'no yolo_onnx node found in pipeline';
      } else {
        details = 'pipeline not found';
      }
      results.push({ name: 'Pipeline references model_onnx_yolov8n_v1', passed, details });
      if (passed) logPass('Pipeline correctly references model_onnx_yolov8n_v1');
      else logFail(details);
    }

    // ── Check 10: ONNX model artifact row exists ────────────────────────────────
    {
      const model = (await prisma.$queryRawUnsafe(
        'SELECT id, name, runtime, "configJson" FROM "ModelArtifact" WHERE id = $1',
        'model_onnx_yolov8n_v1'
      )) as Array<{
        id: string;
        name: string;
        runtime: string;
        configJson: Record<string, unknown>;
      }>;

      const passed = model.length === 1 && model[0].runtime === 'ONNX';
      results.push({
        name: 'ONNX model artifact row exists',
        passed,
        details: passed
          ? `${model[0].name} (${model[0].runtime})`
          : 'model_onnx_yolov8n_v1 NOT FOUND or wrong runtime',
      });
      if (passed)
        logPass(`Model artifact model_onnx_yolov8n_v1 exists (runtime=${model[0].runtime})`);
      else logFail('Model artifact model_onnx_yolov8n_v1 NOT FOUND or wrong runtime');
    }

    // ── Check 11: SUCCEEDED inference job exists ───────────────────────────────
    {
      const job = (await prisma.$queryRawUnsafe(
        'SELECT id, status FROM "InferenceJob" WHERE id = $1 AND status::text = $2',
        'job_2026_04_28_2036',
        'SUCCEEDED'
      )) as Array<{ id: string; status: string }>;

      const passed = job.length === 1;
      results.push({
        name: 'SUCCEEDED inference job exists',
        passed,
        details: passed ? job[0].id : 'job_2026_04_28_2036 NOT FOUND or not SUCCEEDED',
      });
      if (passed) logPass('Inference job job_2026_04_28_2036 exists and is SUCCEEDED');
      else logFail('Inference job NOT FOUND or not SUCCEEDED');
    }

    // ── Check 12: Predictions exist for the job ────────────────────────────────
    {
      const preds = (await prisma.$queryRawUnsafe(
        'SELECT COUNT(*)::int AS cnt FROM "Prediction" WHERE "inferenceJobId" = $1',
        'job_2026_04_28_2036'
      )) as Array<{ cnt: number }>;

      const passed = preds.length === 1 && preds[0].cnt >= 3;
      results.push({
        name: 'At least 3 predictions exist for the job',
        passed,
        details: passed ? `${preds[0].cnt} predictions` : `${preds[0]?.cnt ?? 0} predictions`,
      });
      if (passed) logPass(`${preds[0].cnt} predictions exist for job_2026_04_28_2036`);
      else logFail(`${preds[0]?.cnt ?? 0} predictions (expected >= 3)`);
    }

    // ── Check 13: Evaluation report exists with traceability fields ─────────────
    {
      const report = (await prisma.$queryRawUnsafe(
        'SELECT id, "datasetVersionId", "pipelineId", "modelId", "algorithmVersion", "inputHash", "metricsHash" FROM "EvaluationReport" WHERE "inferenceJobId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
        'job_2026_04_28_2036'
      )) as Array<{
        id: string;
        datasetVersionId: string;
        pipelineId: string;
        modelId: string;
        algorithmVersion: string;
        inputHash: string;
        metricsHash: string;
      }>;

      const passed =
        report.length === 1 &&
        report[0].datasetVersionId !== null &&
        report[0].algorithmVersion !== null &&
        report[0].inputHash !== null &&
        report[0].metricsHash !== null;
      results.push({
        name: 'Evaluation report exists with all traceability fields',
        passed,
        details: passed
          ? `inputHash=${report[0].inputHash}, metricsHash=${report[0].metricsHash}`
          : 'report NOT FOUND or missing traceability fields',
      });
      if (passed) logPass('Evaluation report exists with full traceability');
      else logFail('Evaluation report NOT FOUND or missing traceability fields');
    }

    // ── Check 14: No stale QUEUED/RUNNING jobs for demo project ────────────────
    {
      const stale = (await prisma.$queryRawUnsafe(
        'SELECT id, status FROM "InferenceJob" WHERE "projectId" = $1 AND status::text IN (\'QUEUED\',\'RUNNING\')',
        'proj_parking_lot'
      )) as Array<{ id: string; status: string }>;

      const passed = stale.length === 0;
      results.push({
        name: 'No stale QUEUED/RUNNING jobs for demo project',
        passed,
        details: passed
          ? 'none found'
          : `${stale.length} stale: ${stale.map((j) => j.id).join(', ')}`,
      });
      if (passed) logPass('No stale QUEUED/RUNNING jobs');
      else
        logFail(
          `${stale.length} stale job(s): ${stale.map((j) => `${j.id}(${j.status})`).join(', ')}`
        );
    }

    // ── Check 15: Seeded evaluation report consistency: row scalars match JSON ───
    {
      const report = (await prisma.$queryRawUnsafe(
        'SELECT "inputHash", "metricsHash", "datasetVersionId", "algorithmVersion", "iouThreshold", "metricsJson" FROM "EvaluationReport" WHERE "inferenceJobId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
        'job_2026_04_28_2036'
      )) as Array<{
        inputHash: string;
        metricsHash: string;
        datasetVersionId: string;
        algorithmVersion: string;
        iouThreshold: number;
        metricsJson: Record<string, unknown>;
      }>;

      let passed = false;
      let details = 'report not found';
      if (report.length === 1) {
        const r = report[0];
        const mj = r.metricsJson ?? {};
        const mjInputHash = (mj['inputHash'] as string) ?? '';
        const mjMetricsHash = (mj['metricsHash'] as string) ?? '';
        const mjAlgo = (mj['algorithmVersion'] as string) ?? '';
        const mjIou = (mj['iouThreshold'] as number) ?? -1;

        passed =
          r.inputHash === mjInputHash &&
          r.metricsHash === mjMetricsHash &&
          r.datasetVersionId === 'dataset_proj_parking_lot_parking_v3' &&
          r.algorithmVersion === mjAlgo &&
          Math.abs(r.iouThreshold - mjIou) < 0.001;

        details = passed
          ? 'row scalars match metricsJson'
          : `mismatch: row.inputHash=${r.inputHash} vs json.inputHash=${mjInputHash}, row.metricsHash=${r.metricsHash} vs json.metricsHash=${mjMetricsHash}`;
      }
      results.push({ name: 'EvaluationReport row scalars match metricsJson', passed, details });
      if (passed) logPass('Row scalars match metricsJson');
      else logFail(`Scalar/JSON mismatch: ${details}`);
    }

    // ── Check 16: Phase 20D harness equivalence: integrity columns non-null ────
    {
      const report = (await prisma.$queryRawUnsafe(
        'SELECT "datasetVersionId", "pipelineId", "modelId", "algorithmVersion", "iouThreshold", "inputHash", "metricsHash" FROM "EvaluationReport" WHERE "inferenceJobId" = $1 LIMIT 1',
        'job_2026_04_28_2036'
      )) as Array<{
        datasetVersionId: string | null;
        pipelineId: string | null;
        modelId: string | null;
        algorithmVersion: string | null;
        iouThreshold: number | null;
        inputHash: string | null;
        metricsHash: string | null;
      }>;

      const passed =
        report.length === 1 &&
        report[0].datasetVersionId !== null &&
        report[0].algorithmVersion !== null &&
        report[0].iouThreshold !== null &&
        report[0].inputHash !== null &&
        report[0].metricsHash !== null;
      results.push({
        name: 'Phase 20D harness equivalence: integrity columns non-null',
        passed,
        details: passed ? 'all required columns non-null' : 'some integrity columns are null',
      });
      if (passed) logPass('Phase 20D equivalence: all integrity columns non-null');
      else logFail('Phase 20D equivalence: some integrity columns are NULL');
    }

    // ── Check 17: Phase 20E harness equivalence: migration columns present ─────
    {
      const cols = (await prisma.$queryRawUnsafe(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'EvaluationReport' AND column_name IN ('datasetVersionId', 'pipelineId', 'modelId', 'algorithmVersion', 'iouThreshold', 'inputHash', 'metricsHash')"
      )) as Array<{ column_name: string }>;

      const requiredCols = [
        'datasetVersionId',
        'pipelineId',
        'modelId',
        'algorithmVersion',
        'iouThreshold',
        'inputHash',
        'metricsHash',
      ];
      const foundCols = new Set(cols.map((c) => c.column_name));
      const missing = requiredCols.filter((c) => !foundCols.has(c));
      const passed = missing.length === 0;
      results.push({
        name: 'Phase 20E harness equivalence: all 7 migration columns present',
        passed,
        details: passed ? requiredCols.join(', ') : `missing: ${missing.join(', ')}`,
      });
      if (passed) logPass('Phase 20E equivalence: all 7 migration columns present');
      else logFail(`Phase 20E equivalence: missing columns: ${missing.join(', ')}`);
    }

    // ── Check 18: Phase 20F harness equivalence: migrations applied, no stale ───
    {
      const migrations = (await prisma.$queryRawUnsafe(
        'SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL'
      )) as Array<{
        migration_name: string;
        finished_at: string | null;
        rolled_back_at: string | null;
      }>;

      const passed = migrations.length === 0;
      results.push({
        name: 'Phase 20F harness equivalence: no stale/pending migrations',
        passed,
        details: passed
          ? 'all migrations settled'
          : `${migrations.length} unsettled: ${migrations.map((m) => m.migration_name).join(', ')}`,
      });
      if (passed) logPass('Phase 20F equivalence: no stale migrations');
      else logFail(`Phase 20F equivalence: ${migrations.length} unsettled migration(s)`);
    }

    printResults(prisma, results);
  } catch (err) {
    log(`Error: ${err}`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

async function printResults(prisma: PrismaClient, results: CheckResult[]) {
  console.log('');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  log(`Results: ${passedCount} passed, ${failedCount} failed`);

  if (failedCount > 0) {
    console.log('');
    for (const r of results) {
      if (!r.passed) {
        logFail(`${r.name}: ${r.details}`);
      }
    }
    console.log('');
    log(`Phase 22A harness: ${failedCount} CHECKS FAILED`);
    await prisma.$disconnect();
    process.exit(1);
  }

  log(`Phase 22A harness: ALL ${passedCount} CHECKS PASSED`);
  await prisma.$disconnect();
  process.exit(0);
}

main();
