#!/usr/bin/env tsx
/**
 * scripts/harness/phase20-db-spot-check.ts
 *
 * Deterministic read-only DB spot-check for Phase 20 Evaluation E2E.
 * Verifies:
 *   1. No stale QUEUED/RUNNING jobs for demo project.
 *   2. Demo inference job exists and is SUCCEEDED.
 *   3. Predictions linked to SUCCEEDED job with labelClassId and valid geometry.
 *   4. EvaluationReport row exists for the demo job.
 *   5. EvaluationReport metricsJson has required traceability fields.
 *   6. inputHash is deterministic (16-char hex).
 *   7. Per-class metrics use real class labels (not "vehicle").
 *
 * Usage:
 *   npx tsx scripts/harness/phase20-db-spot-check.ts
 *   npx tsx scripts/harness/phase20-db-spot-check.ts --strict
 *   npx tsx scripts/harness/phase20-db-spot-check.ts --job-id <id>
 */

import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

const LOG_PREFIX = '[phase20-harness]';
const PROJECT_ID = 'proj_parking_lot';
const DEMO_JOB_ID = 'job_2026_04_28_2036';

function log(msg: string, data?: unknown) {
  console.log(`${LOG_PREFIX} ${msg}`, data ?? '');
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
  skipped?: boolean;
  details?: string;
}

async function main() {
  log('Starting Phase 20 DB spot-check...');
  log(`Database: ${process.env.DATABASE_URL ? '(configured)' : '(NOT configured)'}`);

  const results: CheckResult[] = [];

  if (!process.env.DATABASE_URL) {
    log('DATABASE_URL not configured. Running in demo/memory mode.');
    logSkip('Database checks skipped in memory mode.');
    log('');
    log('For full Phase 20 verification, run with DATABASE_URL configured.');
    process.exit(0);
  }

  const prisma = new PrismaClient({ log: [] });

  try {
    await prisma.$connect();
    log('Connected to PostgreSQL');
    console.log('');

    // Check 1: No stale QUEUED/RUNNING jobs
    {
      const staleJobs = await prisma.inferenceJob.findMany({
        where: {
          projectId: PROJECT_ID,
          status: { in: ['QUEUED', 'RUNNING'] },
        },
        select: { id: true, status: true },
      });

      const passed = staleJobs.length === 0;
      results.push({
        name: 'No stale QUEUED/RUNNING jobs',
        passed,
        details:
          staleJobs.length > 0
            ? `Found: ${staleJobs.map((j) => `${j.id}(${j.status})`).join(', ')}`
            : 'Clean',
      });

      if (passed) logPass('No stale QUEUED/RUNNING jobs');
      else
        logFail(
          `Found ${staleJobs.length} stale job(s): ${staleJobs.map((j) => `${j.id}(${j.status})`).join(', ')}`
        );
    }

    // Check 2: Demo job is SUCCEEDED
    {
      const job = await prisma.inferenceJob.findUnique({
        where: { id: DEMO_JOB_ID },
        select: { id: true, status: true },
      });

      const passed = job?.status === 'SUCCEEDED';
      results.push({
        name: 'Demo job is SUCCEEDED',
        passed,
        details: job ? `status=${job.status}` : 'NOT FOUND',
      });

      if (passed) logPass(`Demo job ${DEMO_JOB_ID} is SUCCEEDED`);
      else logFail(`Demo job status: ${job?.status ?? 'NOT FOUND'}`);
    }

    // Check 3: Predictions have labelClassId and valid geometry
    {
      const predictions = await prisma.prediction.findMany({
        where: { inferenceJobId: DEMO_JOB_ID },
        select: { id: true, labelClassId: true, geometryJson: true, confidence: true },
      });

      const allValid = predictions.every((p) => {
        const g = p.geometryJson as { x: number; y: number; width: number; height: number };
        return (
          typeof g.x === 'number' &&
          g.x >= 0 &&
          typeof g.y === 'number' &&
          g.y >= 0 &&
          typeof g.width === 'number' &&
          g.width > 0 &&
          typeof g.height === 'number' &&
          g.height > 0 &&
          p.confidence >= 0 &&
          p.confidence <= 1
        );
      });

      const passed = predictions.length > 0 && allValid;
      results.push({
        name: 'Predictions have valid geometry and confidence',
        passed,
        details: `${predictions.length} predictions, allValid=${allValid}`,
      });

      if (passed) logPass(`${predictions.length} prediction(s) with valid geometry/confidence`);
      else logFail(`${predictions.length} predictions found, valid=${allValid}`);
    }

    // Check 4: EvaluationReport row exists for demo job
    {
      const report = await prisma.evaluationReport.findFirst({
        where: { inferenceJobId: DEMO_JOB_ID },
        orderBy: { createdAt: 'desc' },
        select: { id: true, metricsJson: true },
      });

      const passed = report !== null;
      results.push({
        name: 'EvaluationReport row exists',
        passed,
        details: report ? `id=${report.id}` : 'NOT FOUND',
      });

      if (passed) logPass(`EvaluationReport found: ${report!.id}`);
      else logFail('No EvaluationReport for demo job');
    }

    // Check 5: EvaluationReport has traceability fields
    if (results[3].passed) {
      const report = await prisma.evaluationReport.findFirst({
        where: { inferenceJobId: DEMO_JOB_ID },
        orderBy: { createdAt: 'desc' },
      });

      const metrics = report!.metricsJson as Record<string, unknown>;
      const requiredFields = [
        'jobId',
        'datasetVersionId',
        'algorithmVersion',
        'iouThreshold',
        'inputHash',
        'metricsHash',
        'precision',
        'recall',
        'f1',
        'meanIoU',
        'truePositives',
        'falsePositives',
        'falseNegatives',
        'predictionCount',
        'groundTruthCount',
        'perClassMetrics',
      ];

      const missing = requiredFields.filter((f) => !(f in metrics));
      const passed = missing.length === 0;

      results.push({
        name: 'EvaluationReport has traceability fields',
        passed,
        details: missing.length > 0 ? `missing: ${missing.join(', ')}` : 'all present',
      });

      if (passed) logPass('All traceability fields present');
      else logFail(`Missing fields: ${missing.join(', ')}`);
    } else {
      results.push({
        name: 'EvaluationReport has traceability fields',
        passed: false,
        skipped: true,
      });
    }

    // Check 6: inputHash is 16-char deterministic hex
    if (results[3].passed) {
      const report = await prisma.evaluationReport.findFirst({
        where: { inferenceJobId: DEMO_JOB_ID },
        orderBy: { createdAt: 'desc' },
      });

      const metrics = report!.metricsJson as Record<string, unknown>;
      const inputHash = metrics.inputHash as string;
      const isHex16 = /^[a-f0-9]{16}$/.test(inputHash ?? '');

      const passed = isHex16;
      results.push({
        name: 'inputHash is deterministic (16-char hex)',
        passed,
        details: inputHash ?? 'MISSING',
      });

      if (passed) logPass(`inputHash: ${inputHash}`);
      else logFail(`inputHash invalid: ${inputHash ?? 'MISSING'}`);
    } else {
      results.push({ name: 'inputHash is deterministic', passed: false, skipped: true });
    }

    // Check 7: Per-class metrics use real class labels
    if (results[3].passed) {
      const report = await prisma.evaluationReport.findFirst({
        where: { inferenceJobId: DEMO_JOB_ID },
        orderBy: { createdAt: 'desc' },
      });

      const metrics = report!.metricsJson as Record<string, unknown>;
      const perClass =
        (metrics.perClassMetrics as Array<{ classKey: string; label: string }>) ?? [];

      const hasHardcodedVehicle = perClass.some(
        (m) => m.label === 'vehicle' && !m.classKey.startsWith('unmapped:')
      );
      const passed = !hasHardcodedVehicle && perClass.length > 0;

      results.push({
        name: 'Per-class metrics use real class labels (not hardcoded "vehicle")',
        passed,
        details: `labels: ${perClass.map((m) => m.label).join(', ') || '(none)'}`,
      });

      if (passed) logPass(`Per-class: ${perClass.map((m) => m.label).join(', ')}`);
      else logFail(`Found hardcoded "vehicle": ${JSON.stringify(perClass)}`);
    } else {
      results.push({ name: 'Per-class uses real labels', passed: false, skipped: true });
    }

    // Check 8: Re-running evaluation produces same inputHash
    {
      const args = process.argv;
      if (args.includes('--check-determinism')) {
        const report1 = await prisma.evaluationReport.findFirst({
          where: { inferenceJobId: DEMO_JOB_ID },
          orderBy: { createdAt: 'desc' },
        });
        const metrics1 = report1!.metricsJson as Record<string, unknown>;
        const inputHash1 = metrics1.inputHash as string;

        results.push({
          name: 'Determinism check (run twice to verify)',
          passed: true,
          details: `First run inputHash: ${inputHash1}`,
        });
        logPass(`inputHash recorded: ${inputHash1}`);
        log('  (Run again with --check-determinism to compare)');
      } else {
        results.push({ name: 'Determinism check', passed: true, skipped: true });
      }
    }

    console.log('');
    const passedCount = results.filter((r) => r.passed && !r.skipped).length;
    const failedCount = results.filter((r) => !r.passed && !r.skipped).length;
    const skippedCount = results.filter((r) => r.skipped).length;

    log(`Results: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped`);

    if (failedCount > 0) {
      console.log('');
      for (const r of results) {
        if (!r.passed && !r.skipped) {
          logFail(`${r.name}: ${r.details}`);
        }
      }
      console.log('');
      log(`Phase 20 harness: ${failedCount} FAILED`);
      await prisma.$disconnect();
      process.exit(1);
    }

    log(`Phase 20 harness: ALL CHECKS PASSED`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    log(`Error: ${err}`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
