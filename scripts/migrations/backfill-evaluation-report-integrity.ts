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
 * Classification rules:
 *   1. row null/empty + JSON valid         => needsBackfill (NOT corruption)
 *   2. row non-null + row equals JSON      => consistent (no action)
 *   3. row non-null + JSON missing         => corrupt
 *   4. row non-null + JSON different       => corrupt
 *   5. row null/empty + JSON missing (required) => corrupt
 *   6. row null/empty + JSON missing (optional) => OK (no action)
 *   7. JSON hash values must match /^[a-f0-9]{16}$/ before apply
 *   8. hash row values must match /^[a-f0-9]{16}$/ if non-null
 *   9. iouThreshold JSON must be valid number 0-1
 *  10. iouThreshold row null + JSON valid    => needsBackfill (NOT issue)
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

interface FieldIssue {
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

interface RowAnalysis {
  id: string;
  needsBackfill: boolean;
  consistent: boolean;
  corrupt: boolean;
  issues: FieldIssue[];
  // per-field tracking for reporting
  fieldsNeedingBackfill: string[];
  invalidJsonHash: boolean;
  missingRequiredInJson: boolean;
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

    // ── Analyse every row ────────────────────────────────────────────────────
    // Required fields: datasetVersionId, algorithmVersion, iouThreshold, inputHash, metricsHash
    // Optional fields: pipelineId, modelId
    const analyses: RowAnalysis[] = [];

    for (const row of allRows) {
      const json = row.metricsJson;
      const issues: FieldIssue[] = [];
      const fieldsNeedingBackfill: string[] = [];
      let invalidJsonHash = false;
      let missingRequiredInJson = false;

      // ── Text fields: datasetVersionId, algorithmVersion, inputHash, metricsHash ──
      const textFields: Array<{ field: keyof RawReportRow; jsonKey: string; required: boolean }> = [
        { field: 'datasetVersionId', jsonKey: 'datasetVersionId', required: true },
        { field: 'pipelineId', jsonKey: 'pipelineId', required: false },
        { field: 'modelId', jsonKey: 'modelId', required: false },
        { field: 'algorithmVersion', jsonKey: 'algorithmVersion', required: true },
        { field: 'inputHash', jsonKey: 'inputHash', required: true },
        { field: 'metricsHash', jsonKey: 'metricsHash', required: true },
      ];

      for (const { field, jsonKey, required } of textFields) {
        const rowVal = row[field] as string | null;
        const jsonVal = json[jsonKey] as string | null;
        const jsonValStr = jsonVal === null || jsonVal === undefined ? null : String(jsonVal);

        const rowEmpty = rowVal === null || rowVal === '';
        const jsonValid = jsonValStr !== null && jsonValStr !== '';

        if (rowEmpty && jsonValid) {
          // Rule 1: row null/empty + JSON valid => needsBackfill
          fieldsNeedingBackfill.push(field);
        } else if (!rowEmpty && !jsonValid) {
          // Rule 3: row non-null + JSON missing => corrupt
          issues.push({
            id: row.id,
            field,
            rowValue: rowVal,
            jsonValue: null,
            reason: `row="${rowVal}" but JSON missing`,
          });
        } else if (!rowEmpty && jsonValid && rowVal !== jsonValStr) {
          // Rule 4: row non-null + JSON different => corrupt
          issues.push({
            id: row.id,
            field,
            rowValue: rowVal,
            jsonValue: jsonValStr,
            reason: `row="${rowVal}" vs json="${jsonValStr}"`,
          });
        }
        // Rule 2: row non-null + row equals JSON => consistent (no action needed)
        // Rule 6: row empty + JSON missing (optional) => OK (no action needed)
        // Rule 5: row empty + JSON missing (required) => corrupt (handled below after loop)
      }

      // ── iouThreshold (numeric) ─────────────────────────────────────────────
      const rowIou = row.iouThreshold;
      const jsonIouRaw = json.iouThreshold;
      const jsonIou = typeof jsonIouRaw === 'number' && isFinite(jsonIouRaw) ? jsonIouRaw : null;
      const jsonIouValid = jsonIou !== null && jsonIou >= 0 && jsonIou <= 1;

      if (rowIou === null && jsonIouValid) {
        // Rule 10: row null + JSON valid => needsBackfill (NOT corruption)
        fieldsNeedingBackfill.push('iouThreshold');
      } else if (rowIou !== null && !jsonIouValid) {
        // Rule 4: row has value but JSON invalid/missing => corrupt
        issues.push({
          id: row.id,
          field: 'iouThreshold',
          rowValue: String(rowIou),
          jsonValue: String(jsonIouRaw ?? 'null'),
          reason: `row=${rowIou} but JSON iouThreshold invalid/missing`,
        });
      } else if (rowIou !== null && jsonIouValid && rowIou !== jsonIou) {
        // Rule 4: row non-null + JSON different => corrupt
        issues.push({
          id: row.id,
          field: 'iouThreshold',
          rowValue: String(rowIou),
          jsonValue: String(jsonIou),
          reason: `row=${rowIou} vs json=${jsonIou}`,
        });
      }

      // ── Validate JSON hash format before applying ───────────────────────────
      // Rule 7: JSON hash values must match /^[a-f0-9]{16}$/ before apply
      const jsonInputHash = json.inputHash as string | null;
      const jsonMetricsHash = json.metricsHash as string | null;

      if (
        jsonInputHash !== null &&
        jsonInputHash !== undefined &&
        typeof jsonInputHash === 'string'
      ) {
        if (!HEX_REGEX.test(jsonInputHash)) {
          invalidJsonHash = true;
          issues.push({
            id: row.id,
            field: 'inputHash',
            rowValue: row.inputHash,
            jsonValue: jsonInputHash,
            reason: `JSON inputHash does not match /^[a-f0-9]{16}$/: "${jsonInputHash}"`,
          });
        }
      }

      if (
        jsonMetricsHash !== null &&
        jsonMetricsHash !== undefined &&
        typeof jsonMetricsHash === 'string'
      ) {
        if (!HEX_REGEX.test(jsonMetricsHash)) {
          invalidJsonHash = true;
          issues.push({
            id: row.id,
            field: 'metricsHash',
            rowValue: row.metricsHash,
            jsonValue: jsonMetricsHash,
            reason: `JSON metricsHash does not match /^[a-f0-9]{16}$/: "${jsonMetricsHash}"`,
          });
        }
      }

      // ── Validate row hash format ───────────────────────────────────────────
      // Rule 8: hash row values must match /^[a-f0-9]{16}$/ if non-null
      if (row.inputHash !== null && !HEX_REGEX.test(row.inputHash)) {
        issues.push({
          id: row.id,
          field: 'inputHash',
          rowValue: row.inputHash,
          jsonValue: null,
          reason: `row inputHash invalid format: "${row.inputHash}"`,
        });
      }
      if (row.metricsHash !== null && !HEX_REGEX.test(row.metricsHash)) {
        issues.push({
          id: row.id,
          field: 'metricsHash',
          rowValue: row.metricsHash,
          jsonValue: null,
          reason: `row metricsHash invalid format: "${row.metricsHash}"`,
        });
      }

      // ── Check for seed_placeholder ───────────────────────────────────────
      if (
        row.inputHash === 'seed_placeholder' ||
        (row.inputHash !== null && row.inputHash.includes('placeholder'))
      ) {
        issues.push({
          id: row.id,
          field: 'inputHash',
          rowValue: row.inputHash,
          jsonValue: null,
          reason: 'contains seed_placeholder',
        });
      }
      if (
        row.metricsHash === 'seed_placeholder' ||
        (row.metricsHash !== null && row.metricsHash.includes('placeholder'))
      ) {
        issues.push({
          id: row.id,
          field: 'metricsHash',
          rowValue: row.metricsHash,
          jsonValue: null,
          reason: 'contains seed_placeholder',
        });
      }

      // ── Rule 5: row empty + JSON missing for required field => corrupt ───
      for (const { field, jsonKey } of textFields) {
        if (!textFields.find((f) => f.field === field)!.required) continue;
        const rowVal = row[field] as string | null;
        const jsonVal = json[jsonKey] as string | null;
        const jsonValStr = jsonVal === null || jsonVal === undefined ? null : String(jsonVal);
        const rowEmpty = rowVal === null || rowVal === '';
        const jsonValid = jsonValStr !== null && jsonValStr !== '';

        if (rowEmpty && !jsonValid) {
          missingRequiredInJson = true;
          // Avoid duplicate issue if already recorded
          if (!issues.some((i) => i.field === field)) {
            issues.push({
              id: row.id,
              field,
              rowValue: null,
              jsonValue: null,
              reason: `required field missing in both row and JSON`,
            });
          }
        }
      }

      // Row-level classification
      const needsBackfill = fieldsNeedingBackfill.length > 0 || invalidJsonHash;
      const consistent = issues.length === 0 && !needsBackfill;
      const corrupt = issues.length > 0;

      analyses.push({
        id: row.id,
        needsBackfill,
        consistent,
        corrupt,
        issues,
        fieldsNeedingBackfill,
        invalidJsonHash,
        missingRequiredInJson,
      });
    }

    // ── Duplicate detection ───────────────────────────────────────────────
    const dupGroups = await prisma.$queryRawUnsafe<
      Array<{ inferenceJobId: string; inputHash: string; count: number }>
    >(`
      SELECT "inferenceJobId", "inputHash", COUNT(*)::int AS count
      FROM "EvaluationReport"
      GROUP BY "inferenceJobId", "inputHash"
      HAVING COUNT(*) > 1
    `);

    if (dupGroups.length > 0) {
      logError(`${dupGroups.length} duplicate [inferenceJobId, inputHash] group(s):`);
      for (const g of dupGroups) {
        logError(
          `  inferenceJobId=${g.inferenceJobId}, inputHash=${g.inputHash}, count=${g.count}`
        );
      }
    }

    // ── Summary counters ───────────────────────────────────────────────────
    const totalRows = allRows.length;
    const rowsNeedingBackfill = analyses.filter((a) => a.needsBackfill && !a.corrupt).length;
    const rowsConsistent = analyses.filter((a) => a.consistent && !a.needsBackfill).length;
    const rowsCorrupt = analyses.filter((a) => a.corrupt).length;
    const invalidJsonHashRows = analyses.filter((a) => a.invalidJsonHash).length;
    const missingRequiredJsonRows = analyses.filter((a) => a.missingRequiredInJson).length;

    if (mode === '--check') {
      log('=== BACKFILL CHECK (--check) ===');
      log(`Total rows:                    ${totalRows}`);
      log(`Rows needing backfill:         ${rowsNeedingBackfill}`);
      log(`Rows consistent:               ${rowsConsistent}`);
      log(`Rows corrupt:                  ${rowsCorrupt}`);
      log(`Duplicate groups:              ${dupGroups.length}`);
      log(`Invalid JSON hash rows:        ${invalidJsonHashRows}`);
      log(`Missing required JSON rows:    ${missingRequiredJsonRows}`);
      console.log('');

      if (rowsCorrupt > 0) {
        logError(`${rowsCorrupt} corrupt row(s):`);
        const corruptAnalyses = analyses.filter((a) => a.corrupt);
        for (const a of corruptAnalyses) {
          for (const issue of a.issues) {
            logError(`  Row ${a.id}: ${issue.field}: ${issue.reason}`);
          }
        }
        console.log('');
      }

      if (dupGroups.length > 0) {
        logError('Duplicate [inferenceJobId, inputHash] groups detected.');
        logError('Unique constraint violation — backfill cannot proceed safely.');
        console.log('');
      }

      if (rowsCorrupt === 0 && dupGroups.length === 0) {
        logSuccess('Backfill is safe to apply.');
        log(`Rows needing backfill: ${rowsNeedingBackfill}`);
        logSuccess('Run with --apply to execute the backfill.');
      } else {
        logError('Backfill cannot proceed safely. Fix the above issues first.');
        logError('Do NOT use --apply until all issues are resolved.');
        await prisma.$disconnect();
        process.exit(1);
      }
    } else {
      // ── Apply mode ──────────────────────────────────────────────────────
      log('=== BACKFILL APPLY (--apply) ===');

      if (rowsCorrupt > 0) {
        logError(`${rowsCorrupt} corrupt row(s) — backfill refused.`);
        const corruptAnalyses = analyses.filter((a) => a.corrupt);
        for (const a of corruptAnalyses) {
          for (const issue of a.issues) {
            logError(`  Row ${a.id}: ${issue.field}: ${issue.reason}`);
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

      const candidates = analyses
        .filter((a) => a.needsBackfill && !a.corrupt)
        .map((a) => {
          const row = allRows.find((r) => r.id === a.id)!;
          return {
            id: a.id,
            datasetVersionId: row.datasetVersionId,
            pipelineId: row.pipelineId,
            modelId: row.modelId,
            algorithmVersion: row.algorithmVersion,
            iouThreshold: row.iouThreshold,
            inputHash: row.inputHash,
            metricsHash: row.metricsHash,
          };
        });

      if (candidates.length === 0) {
        logSuccess('All rows are consistent — nothing to backfill.');
      } else {
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
                   AND ("metricsJson"->>'iouThreshold') ~ '^[0-9.]+$'
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
        log(`  Rows already consistent (not modified): ${rowsConsistent}`);
        log(`  Rows needing backfill: ${rowsNeedingBackfill}`);
      }
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
