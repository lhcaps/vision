#!/usr/bin/env tsx
/**
 * scripts/migrations/backfill-evaluation-report-integrity.ts
 *
 * Backfill dry-run and apply script for EvaluationReport integrity columns.
 *
 * This script inspects existing EvaluationReport rows and copies values from
 * metricsJson into the new scalar columns (datasetVersionId, pipelineId, modelId,
 * algorithmVersion, iouThreshold, inputHash, metricsHash).
 *
 * It does NOT:
 *   - Recompute metricsHash or inputHash (they must match the existing JSON)
 *   - Change metricsJson
 *   - Delete rows automatically
 *   - Silently ignore corrupt rows
 *
 * Usage:
 *   --check   Dry run: inspect rows, report issues, exit 1 if unsafe
 *   --apply   Execute safe backfill updates, refuse on corrupt rows
 *
 * Examples:
 *   pnpm migration:eval-report:check
 *   pnpm migration:eval-report:apply
 *
 * Prerequisites:
 *   - Run AFTER migration SQL has been applied (columns exist, nullable)
 *   - Run BEFORE NOT NULL constraints are applied (or after, for incremental fixes)
 */

import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

const LOG_PREFIX = '[backfill-eval-report]';
const HEX_REGEX = /^[a-f0-9]{16}$/;

function log(msg: string, data?: unknown) {
  console.log(`${LOG_PREFIX} ${msg}`, data ?? '');
}

function logWarn(msg: string) {
  console.warn(`\x1b[33m${LOG_PREFIX} WARN:\x1b[0m ${msg}`);
}

function logError(msg: string) {
  console.error(`\x1b[31m${LOG_PREFIX} ERROR:\x1b[0m ${msg}`);
}

function logSuccess(msg: string) {
  console.log(`\x1b[32m${LOG_PREFIX} OK:\x1b[0m ${msg}`);
}

interface RawReportRow {
  id: string;
  inferenceJobId: string;
  datasetVersionId: string | null;
  pipelineId: string | null;
  modelId: string | null;
  algorithmVersion: string | null;
  iouThreshold: number | null;
  inputHash: string | null;
  metricsHash: string | null;
  metricsJson: Record<string, unknown>;
}

interface RowIssue {
  id: string;
  field: string;
  rowValue: string | null;
  jsonValue: string | null;
  reason: string;
}

interface BackfillCandidate {
  id: string;
  datasetVersionId: string | null;
  pipelineId: string | null;
  modelId: string | null;
  algorithmVersion: string | null;
  iouThreshold: number | null;
  inputHash: string | null;
  metricsHash: string | null;
}

type Mode = '--check' | '--apply';

async function main() {
  const args = process.argv.slice(2);
  const mode: Mode | null = args.includes('--check')
    ? '--check'
    : args.includes('--apply')
      ? '--apply'
      : null;

  if (!mode) {
    logError('Usage:');
    logError('  npx tsx scripts/migrations/backfill-evaluation-report-integrity.ts --check');
    logError('  npx tsx scripts/migrations/backfill-evaluation-report-integrity.ts --apply');
    logError('');
    logError('  --check  Dry run: inspect rows, report issues, exit 1 if unsafe to migrate');
    logError('  --apply  Execute safe backfill updates, refuse on corrupt rows');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    logError(
      'DATABASE_URL not configured. Set it in .env or export DATABASE_URL=<connection_string>.'
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({ log: [] });

  try {
    await prisma.$connect();
    log(`Connected to PostgreSQL (mode: ${mode})`);
    console.log('');

    // Check that required columns exist before attempting anything
    const columns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'EvaluationReport'
        AND column_name IN (
          'datasetVersionId', 'pipelineId', 'modelId', 'algorithmVersion',
          'iouThreshold', 'inputHash', 'metricsHash'
        )
    `);

    const foundCols = new Set(columns.map((c) => c.column_name));
    const requiredCols = [
      'datasetVersionId',
      'pipelineId',
      'modelId',
      'algorithmVersion',
      'iouThreshold',
      'inputHash',
      'metricsHash',
    ];
    const missing = requiredCols.filter((c) => !foundCols.has(c));

    if (missing.length > 0) {
      logError(`Required columns not found in EvaluationReport: ${missing.join(', ')}`);
      logError('This script must be run AFTER the migration SQL has been applied (columns exist).');
      logError('Run the migration first: pnpm db:migrate');
      await prisma.$disconnect();
      process.exit(1);
    }

    log('All required columns found in EvaluationReport');

    // Fetch all existing rows
    const allRows = await prisma.$queryRawUnsafe<RawReportRow[]>(`
      SELECT id, "inferenceJobId", "datasetVersionId", "pipelineId", "modelId",
             "algorithmVersion", "iouThreshold", "inputHash", "metricsHash", "metricsJson"
      FROM "EvaluationReport"
    `);

    log(`Found ${allRows.length} EvaluationReport row(s)`);
    console.log('');

    if (allRows.length === 0) {
      logSuccess('No EvaluationReport rows to backfill');
      await prisma.$disconnect();
      process.exit(0);
    }

    const issues: RowIssue[] = [];
    const candidates: BackfillCandidate[] = [];

    for (const row of allRows) {
      const json = row.metricsJson;
      const rowIssues: RowIssue[] = [];

      // Validate row vs JSON consistency
      const fieldsToCheck: Array<{ field: keyof RawReportRow; jsonKey: string }> = [
        { field: 'datasetVersionId', jsonKey: 'datasetVersionId' },
        { field: 'pipelineId', jsonKey: 'pipelineId' },
        { field: 'modelId', jsonKey: 'modelId' },
        { field: 'algorithmVersion', jsonKey: 'algorithmVersion' },
        { field: 'inputHash', jsonKey: 'inputHash' },
        { field: 'metricsHash', jsonKey: 'metricsHash' },
      ];

      for (const { field, jsonKey } of fieldsToCheck) {
        const rowVal = row[field] as string | null;
        const jsonVal = json[jsonKey] as string | null;

        // If row is null but JSON has a value, it needs backfill
        if (
          (rowVal === null || rowVal === '') &&
          jsonVal !== null &&
          jsonVal !== undefined &&
          jsonVal !== ''
        ) {
          // This is a backfill candidate, not an issue
        } else if (rowVal !== jsonVal) {
          rowIssues.push({
            id: row.id,
            field,
            rowValue: rowVal,
            jsonValue: jsonVal ?? null,
            reason: `row=${rowVal ?? '(null)'} vs json=${jsonVal ?? '(null)'}`,
          });
        }
      }

      // Check iouThreshold
      const rowIou = row.iouThreshold;
      const jsonIou = json.iouThreshold as number | null;
      if (rowIou !== jsonIou) {
        rowIssues.push({
          id: row.id,
          field: 'iouThreshold',
          rowValue: String(rowIou ?? 'null'),
          jsonValue: String(jsonIou ?? 'null'),
          reason: `row=${rowIou} vs json=${jsonIou}`,
        });
      }

      // Check hash format
      if (row.inputHash && !HEX_REGEX.test(row.inputHash)) {
        rowIssues.push({
          id: row.id,
          field: 'inputHash',
          rowValue: row.inputHash,
          jsonValue: null,
          reason: `invalid hex format: ${row.inputHash}`,
        });
      }
      if (row.metricsHash && !HEX_REGEX.test(row.metricsHash)) {
        rowIssues.push({
          id: row.id,
          field: 'metricsHash',
          rowValue: row.metricsHash,
          jsonValue: null,
          reason: `invalid hex format: ${row.metricsHash}`,
        });
      }

      // Check for seed_placeholder
      if (
        row.inputHash === 'seed_placeholder' ||
        (row.inputHash && row.inputHash.includes('placeholder'))
      ) {
        rowIssues.push({
          id: row.id,
          field: 'inputHash',
          rowValue: row.inputHash,
          jsonValue: null,
          reason: 'contains seed_placeholder',
        });
      }
      if (
        row.metricsHash === 'seed_placeholder' ||
        (row.metricsHash && row.metricsHash.includes('placeholder'))
      ) {
        rowIssues.push({
          id: row.id,
          field: 'metricsHash',
          rowValue: row.metricsHash,
          jsonValue: null,
          reason: 'contains seed_placeholder',
        });
      }

      // Check duplicate [inferenceJobId, inputHash]
      const dupCount = allRows.filter(
        (r) => r.inferenceJobId === row.inferenceJobId && r.inputHash === row.inputHash
      ).length;
      if (dupCount > 1) {
        rowIssues.push({
          id: row.id,
          field: 'inputHash',
          rowValue: row.inputHash,
          jsonValue: null,
          reason: `duplicate [inferenceJobId=${row.inferenceJobId}, inputHash=${row.inputHash}] — ${dupCount} rows`,
        });
      }

      if (rowIssues.length > 0) {
        issues.push(...rowIssues);
      } else {
        candidates.push({
          id: row.id,
          datasetVersionId: row.datasetVersionId,
          pipelineId: row.pipelineId,
          modelId: row.modelId,
          algorithmVersion: row.algorithmVersion,
          iouThreshold: row.iouThreshold,
          inputHash: row.inputHash,
          metricsHash: row.metricsHash,
        });
      }
    }

    // Report duplicate groups separately
    const dupGroups = await prisma.$queryRawUnsafe<
      Array<{ inferenceJobId: string; inputHash: string; count: number }>
    >(`
      SELECT "inferenceJobId", "inputHash", COUNT(*)::int AS count
      FROM "EvaluationReport"
      GROUP BY "inferenceJobId", "inputHash"
      HAVING COUNT(*) > 1
    `);

    if (dupGroups.length > 0) {
      logError(`Found ${dupGroups.length} duplicate [inferenceJobId, inputHash] group(s):`);
      for (const g of dupGroups) {
        logError(
          `  inferenceJobId=${g.inferenceJobId}, inputHash=${g.inputHash}, count=${g.count}`
        );
      }
    }

    // Check for rows with null required fields even in JSON
    const jsonMissingFields = await prisma.$queryRawUnsafe<Array<{ id: string; missing: string }>>(`
      SELECT id,
        CASE
          WHEN ("metricsJson"->>'datasetVersionId') IS NULL OR ("metricsJson"->>'datasetVersionId') = '' THEN 'datasetVersionId'
          WHEN ("metricsJson"->>'algorithmVersion') IS NULL OR ("metricsJson"->>'algorithmVersion') = '' THEN 'algorithmVersion'
          WHEN ("metricsJson"->>'iouThreshold') IS NULL OR ("metricsJson"->>'iouThreshold') = '' THEN 'iouThreshold'
          WHEN ("metricsJson"->>'inputHash') IS NULL OR ("metricsJson"->>'inputHash') = '' THEN 'inputHash'
          WHEN ("metricsJson"->>'metricsHash') IS NULL OR ("metricsJson"->>'metricsHash') = '' THEN 'metricsHash'
          ELSE NULL
        END AS missing
      FROM "EvaluationReport"
      WHERE ("datasetVersionId" IS NULL OR "algorithmVersion" IS NULL OR
             "iouThreshold" IS NULL OR "inputHash" IS NULL OR "metricsHash" IS NULL)
        AND (
          ("metricsJson"->>'datasetVersionId') IS NULL OR ("metricsJson"->>'datasetVersionId') = ''
       OR ("metricsJson"->>'algorithmVersion') IS NULL OR ("metricsJson"->>'algorithmVersion') = ''
       OR ("metricsJson"->>'iouThreshold') IS NULL OR ("metricsJson"->>'iouThreshold') = ''
       OR ("metricsJson"->>'inputHash') IS NULL OR ("metricsJson"->>'inputHash') = ''
       OR ("metricsJson"->>'metricsHash') IS NULL OR ("metricsJson"->>'metricsHash') = ''
        )
    `);

    if (mode === '--check') {
      log('=== BACKFILL CHECK (--check) ===');
      log(`Total rows: ${allRows.length}`);
      log(`Rows needing backfill: ${candidates.length}`);
      log(`Rows with issues: ${issues.length}`);
      console.log('');

      if (issues.length > 0) {
        logError(`${issues.length} issue(s) found — backfill cannot proceed safely:`);
        // Deduplicate by row id
        const rowsWithIssues = new Map<string, RowIssue[]>();
        for (const issue of issues) {
          if (!rowsWithIssues.has(issue.id)) rowsWithIssues.set(issue.id, []);
          rowsWithIssues.get(issue.id)!.push(issue);
        }
        for (const [id, rowIssues] of rowsWithIssues) {
          logError(`  Row ${id}:`);
          for (const issue of rowIssues) {
            logError(`    - ${issue.field}: ${issue.reason}`);
          }
        }
        console.log('');
      }

      if (jsonMissingFields.length > 0) {
        logError(`${jsonMissingFields.length} row(s) missing required fields even in JSON:`);
        for (const r of jsonMissingFields) {
          logError(`  id=${r.id}: missing ${r.missing}`);
        }
        console.log('');
      }

      if (dupGroups.length > 0) {
        logError('Duplicate [inferenceJobId, inputHash] groups detected.');
        logError('Unique constraint violation — backfill cannot proceed safely.');
        console.log('');
      }

      if (issues.length === 0 && dupGroups.length === 0 && jsonMissingFields.length === 0) {
        logSuccess('All rows are consistent — backfill is safe to apply.');
        log(`Rows needing backfill: ${candidates.length}`);
        logSuccess('Run with --apply to execute the backfill.');
      } else {
        logError('Backfill cannot proceed safely. Fix the above issues first.');
        logError('Do NOT use --apply until all issues are resolved.');
        await prisma.$disconnect();
        process.exit(1);
      }
    } else {
      // --apply mode
      log('=== BACKFILL APPLY (--apply) ===');

      if (issues.length > 0) {
        logError(`${issues.length} issue(s) found — backfill refused due to data corruption.`);
        const rowsWithIssues = new Map<string, RowIssue[]>();
        for (const issue of issues) {
          if (!rowsWithIssues.has(issue.id)) rowsWithIssues.set(issue.id, []);
          rowsWithIssues.get(issue.id)!.push(issue);
        }
        for (const [id, rowIssues] of rowsWithIssues) {
          logError(`  Row ${id}:`);
          for (const issue of rowIssues) {
            logError(`    - ${issue.field}: ${issue.reason}`);
          }
        }
        console.log('');
        logError('Refusing to apply backfill due to corrupt rows.');
        await prisma.$disconnect();
        process.exit(1);
      }

      if (dupGroups.length > 0) {
        logError('Duplicate [inferenceJobId, inputHash] groups detected.');
        logError('Refusing to apply backfill — unique constraint would be violated.');
        await prisma.$disconnect();
        process.exit(1);
      }

      if (jsonMissingFields.length > 0) {
        logError(
          `${jsonMissingFields.length} row(s) cannot be backfilled — required fields missing in JSON:`
        );
        for (const r of jsonMissingFields) {
          logError(`  id=${r.id}: missing ${r.missing}`);
        }
        console.log('');
        logError('Refusing to apply backfill — some rows cannot be recovered.');
        await prisma.$disconnect();
        process.exit(1);
      }

      log(`Applying backfill to ${candidates.length} row(s)...`);

      for (const candidate of candidates) {
        await prisma.$executeRawUnsafe(
          `
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
            )
          WHERE id = $1
        `,
          candidate.id
        );
      }

      logSuccess(`Backfill applied to ${candidates.length} row(s)`);
      log('Note: Run the migration SQL NOT NULL step separately if not yet applied.');
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    logError(`Unexpected error: ${err}`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
