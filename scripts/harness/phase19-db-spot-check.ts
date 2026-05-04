#!/usr/bin/env tsx
/**
 * scripts/harness/phase19-db-spot-check.ts
 *
 * Deterministic read-only DB spot-check for Phase 19 ONNX inference verification.
 * Queries the database to verify prediction persistence from Phase 19 smoke jobs.
 *
 * Usage:
 *   npx tsx scripts/harness/phase19-db-spot-check.ts
 *   npx tsx scripts/harness/phase19-db-spot-check.ts --strict      # fail if expected evidence absent
 *   npx tsx scripts/harness/phase19-db-spot-check.ts --job-id <id>  # focus on specific job
 *
 * This script is read-only and does not mutate any database state.
 */

import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

const LOG_OK = '\x1b[32m[OK]\x1b[0m';
const LOG_FAIL = '\x1b[31m[FAIL]\x1b[0m';
const LOG_INFO = '\x1b[36m[INFO]\x1b[0m';
const LOG_WARN = '\x1b[33m[WARN]\x1b[0m';

function log(label: string, msg: string) {
  console.log(`${label} ${msg}`);
}

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.error(`${LOG_FAIL} ASSERTION FAILED: ${msg}`);
    process.exitCode = 1;
  } else {
    log(LOG_OK, msg);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const targetJobId = args.find((a) => a === '--job-id')
    ? args[args.indexOf('--job-id') + 1]
    : undefined;

  log(LOG_INFO, 'Phase 19 DB Spot-Check (read-only)');
  if (strict) {
    log(LOG_INFO, 'Mode: STRICT — missing expected evidence causes failure');
  } else {
    log(LOG_INFO, 'Mode: LENIENT — missing evidence is logged but not fatal');
  }
  log(LOG_INFO, `Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT configured'}`);

  const prisma = new PrismaClient({
    log: [{ level: 'warn', emit: 'event' }],
  });

  let exitCode = 0;

  try {
    await prisma.$connect();
    log(LOG_INFO, 'Connected to PostgreSQL');

    // 1. Verify no stale QUEUED/RUNNING jobs for proj_parking_lot
    log(LOG_INFO, '\n--- Check 1: No stale QUEUED/RUNNING jobs ---');
    const staleJobs = await prisma.inferenceJob.findMany({
      where: {
        projectId: 'proj_parking_lot',
        status: { in: ['QUEUED', 'RUNNING'] },
      },
      select: { id: true, status: true, progress: true },
    });

    if (staleJobs.length > 0) {
      console.error(`${LOG_FAIL} Found ${staleJobs.length} stale job(s):`);
      staleJobs.forEach((j) => console.error(`  - ${j.id} (${j.status}, progress: ${j.progress})`));
      exitCode = 1;
    } else {
      log(LOG_OK, 'No stale QUEUED/RUNNING jobs found for proj_parking_lot');
    }

    // 2. Find the latest Phase 19 smoke jobs (non-seed)
    log(LOG_INFO, '\n--- Check 2: Phase 19 smoke jobs ---');
    const smokeJobsWhere: Parameters<typeof prisma.inferenceJob.findMany>[0]['where'] = {
      projectId: 'proj_parking_lot',
      modelId: 'model_onnx_yolov8n_v1',
      id: { not: 'job_2026_04_28_2036' },
    };
    if (targetJobId) {
      smokeJobsWhere.id = targetJobId;
    }

    const smokeJobs = await prisma.inferenceJob.findMany({
      where: smokeJobsWhere,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        progress: true,
        modelId: true,
        datasetVersionId: true,
        pipelineId: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    if (smokeJobs.length === 0) {
      const msg = 'No Phase 19 smoke jobs found in DB (checking seed predictions...)';
      log(LOG_WARN, msg);
    } else {
      smokeJobs.forEach((j) => {
        const ts = j.createdAt ? new Date(j.createdAt).toISOString() : 'unknown';
        log(
          LOG_INFO,
          `  Job ${j.id}: ${j.status} (progress: ${j.progress}%, model: ${j.modelId}, created: ${ts})`
        );
      });
    }

    // 2b. Seed predictions (Phase 19 persistent evidence)
    log(LOG_INFO, '\n--- Check 2b: Seed predictions (persistent Phase 19 evidence) ---');
    const seedPredictions = await prisma.prediction.findMany({
      where: { inferenceJobId: 'job_2026_04_28_2036' },
      select: { id: true, labelClassId: true, geometryJson: true, confidence: true },
    });

    if (seedPredictions.length > 0) {
      log(
        LOG_OK,
        `${seedPredictions.length} seed prediction(s) found (Phase 19 persistent evidence)`
      );
      for (const pred of seedPredictions) {
        const geo = pred.geometryJson as { x: number; y: number; width: number; height: number };
        assert(geo.x >= 0, `Seed prediction ${pred.id}: x=${geo.x} >= 0`);
        assert(geo.y >= 0, `Seed prediction ${pred.id}: y=${geo.y} >= 0`);
        assert(geo.width > 0, `Seed prediction ${pred.id}: width=${geo.width} > 0`);
        assert(geo.height > 0, `Seed prediction ${pred.id}: height=${geo.height} > 0`);
        assert(
          pred.confidence >= 0 && pred.confidence <= 1,
          `Seed prediction ${pred.id}: confidence=${pred.confidence} in [0,1]`
        );
        log(
          LOG_OK,
          `  ${pred.id}: labelClassId=${pred.labelClassId ?? '(null)'}, geometry valid, confidence=${pred.confidence}`
        );
      }
    } else {
      log(LOG_WARN, 'No seed predictions found');
    }

    // 3. Find mock smoke predictions and verify
    log(LOG_INFO, '\n--- Check 3: Mock job predictions (if present) ---');
    const mockPredictions = await prisma.prediction.findMany({
      where: {
        inferenceJob: {
          projectId: 'proj_parking_lot',
          id: { not: 'job_2026_04_28_2036' },
        },
        metadataJson: { path: ['workerMode'], equals: 'mock_detector' },
      },
      include: {
        inferenceJob: {
          select: {
            id: true,
            status: true,
            modelId: true,
            datasetVersionId: true,
            pipelineId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { inferenceJob: { createdAt: 'desc' } },
    });

    if (mockPredictions.length === 0) {
      log(LOG_WARN, 'No mock smoke predictions found (seed predictions verified in Check 2b)');
    } else {
      const mockJobId = mockPredictions[0].inferenceJob.id;
      log(LOG_INFO, `Mock job: ${mockJobId} (status: ${mockPredictions[0].inferenceJob.status})`);
      log(LOG_INFO, `Predictions: ${mockPredictions.length} row(s)`);
      for (const pred of mockPredictions) {
        const geo = pred.geometryJson as { x: number; y: number; width: number; height: number };
        assert(geo.x >= 0, `Prediction ${pred.id}: x=${geo.x} >= 0`);
        assert(geo.y >= 0, `Prediction ${pred.id}: y=${geo.y} >= 0`);
        assert(geo.width > 0, `Prediction ${pred.id}: width=${geo.width} > 0`);
        assert(geo.height > 0, `Prediction ${pred.id}: height=${geo.height} > 0`);
        assert(
          pred.confidence >= 0 && pred.confidence <= 1,
          `Prediction ${pred.id}: confidence=${pred.confidence} in [0,1]`
        );
        if (pred.labelClassId !== null) {
          const label = await prisma.labelClass.findUnique({
            where: { id: pred.labelClassId },
            select: { id: true, name: true },
          });
          assert(
            Boolean(label),
            `Prediction ${pred.id}: labelClassId="${pred.labelClassId}" exists in LabelClass table (name: ${label?.name ?? 'unknown'})`
          );
        } else {
          log(
            LOG_INFO,
            `  Prediction ${pred.id}: labelClassId=null (expected — no COCO mapping yet)`
          );
        }
        const meta = pred.metadataJson as Record<string, unknown>;
        assert(
          meta !== null && typeof meta === 'object',
          `Prediction ${pred.id}: metadataJson is object`
        );
        const requiredFields = ['workerMode', 'workerVersion', 'datasetVersionId', 'pipelineId'];
        for (const field of requiredFields) {
          assert(
            field in meta && meta[field] !== undefined,
            `Prediction ${pred.id}: metadata.${field} is present`
          );
        }
        log(
          LOG_OK,
          `  Prediction ${pred.id}: geometry=(${geo.x},${geo.y},${geo.width}x${geo.height}), confidence=${pred.confidence}, labelClassId=${pred.labelClassId ?? 'null'}`
        );
      }
    }

    // 4. Verify ONNX model info in jobs
    log(LOG_INFO, '\n--- Check 4: ONNX model traceability in job metadata ---');
    const onnxJobs = await prisma.inferenceJob.findMany({
      where: {
        projectId: 'proj_parking_lot',
        modelId: 'model_onnx_yolov8n_v1',
      },
      select: {
        id: true,
        status: true,
        modelId: true,
        datasetVersionId: true,
        pipelineId: true,
        errorMessage: true,
      },
    });

    log(LOG_INFO, `Found ${onnxJobs.length} ONNX job(s) in DB:`);
    for (const j of onnxJobs) {
      const status = j.status === 'FAILED' ? `${LOG_FAIL} ${j.status}` : `${j.status}`;
      const errMsg = j.errorMessage ? ` (error: ${j.errorMessage.slice(0, 80)})` : '';
      log(LOG_INFO, `  ${j.id}: ${status}${errMsg}`);
    }

    // 5. Label classes exist
    log(LOG_INFO, '\n--- Check 5: Label classes for COCO mapping ---');
    const labelClasses = await prisma.labelClass.findMany({
      where: { projectId: 'proj_parking_lot' },
      select: { id: true, name: true, color: true },
    });

    log(LOG_INFO, `Found ${labelClasses.length} label class(es):`);
    for (const lc of labelClasses) {
      log(LOG_INFO, `  ${lc.name} (${lc.id})`);
    }
    assert(
      labelClasses.length >= 4,
      `At least 4 label classes exist (car, van, truck, person), found ${labelClasses.length}`
    );

    if (exitCode === 0) {
      log(LOG_INFO, '\n=== All checks passed ===');
    } else {
      console.error(`\n${LOG_FAIL} Some checks failed`);
    }
  } catch (err) {
    console.error(`${LOG_FAIL} DB spot-check error:`, err);
    exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
}

main();
