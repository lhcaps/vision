#!/usr/bin/env tsx
/**
 * scripts/harness/phase22a-meta-harness.ts
 *
 * Meta-harness aggregator for Phase 22A Fixture & Test Infrastructure.
 *
 * Orchestrates the Phase 22A fixture infrastructure check alongside existing
 * phase20c/20d/20e/20f harnesses. Each harness runs independently and reports
 * its own pass/fail. The meta-harness exits non-zero if any harness fails.
 *
 * Note: This meta-harness does NOT run seed:db -- --reset. That step is handled
 * externally (e.g., by CI or the developer before running this script). This
 * script assumes the database has already been seeded.
 *
 * Usage:
 *   npx tsx scripts/harness/phase22a-meta-harness.ts --strict
 *   pnpm meta:harness:phase22a
 */

import { execSync } from 'child_process';
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

const LOG_PREFIX = '[phase22a-meta]';

function log(msg: string) {
  console.log(`${LOG_PREFIX} ${msg}`);
}

function logPass(msg: string) {
  console.log(`\x1b[32m  PASS\x1b[0m ${msg}`);
}

function logFail(msg: string) {
  console.error(`\x1b[31m  FAIL\x1b[0m ${msg}`);
}

function logSection(msg: string) {
  console.log(`\n\x1b[1m${msg}\x1b[0m`);
}

interface HarnessResult {
  name: string;
  passed: boolean;
  exitCode: number;
  durationMs: number;
  error?: string;
}

function runHarness(cmd: string, label: string): HarnessResult {
  const start = Date.now();
  log(`Running: ${cmd}`);
  try {
    execSync(cmd, {
      stdio: 'inherit',
      env: { ...process.env },
    });
    const durationMs = Date.now() - start;
    return { name: label, passed: true, exitCode: 0, durationMs };
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const exitCode = (err as { status?: number }).status ?? 1;
    return {
      name: label,
      passed: false,
      exitCode,
      durationMs,
      error: exitCode === null ? 'ENOENT' : `exit ${exitCode}`,
    };
  }
}

async function main() {
  log('Starting Phase 22A Meta Harness...');
  log(`Database: ${process.env.DATABASE_URL ? '(configured)' : '(NOT configured)'}`);

  const strict = process.argv.includes('--strict');

  if (!process.env.DATABASE_URL) {
    if (strict) {
      logFail('DATABASE_URL not configured — STRICT mode requires database connection.');
      process.exit(1);
    }
    log('DATABASE_URL not configured — DB harnesses will be skipped.');
    log('For full meta-harness verification:');
    log('  1. Start Docker: docker compose -f infra/docker-compose.yml up -d');
    log('  2. Reset DB:    pnpm seed:db -- --reset');
    log('  3. Run harness: pnpm meta:harness:phase22a');
    process.exit(0);
  }

  const harnesses: Array<{ cmd: string; label: string; required: boolean }> = [
    {
      cmd: 'pnpm harness:phase22a',
      label: 'phase22a-fixture-infrastructure-check',
      required: true,
    },
    { cmd: 'pnpm harness:phase20c', label: 'phase20c-evaluation-integrity', required: true },
    { cmd: 'pnpm harness:phase20d', label: 'phase20d-evaluation-db-index', required: true },
    { cmd: 'pnpm harness:phase20e', label: 'phase20e-evaluation-migration', required: true },
    { cmd: 'pnpm harness:phase20f', label: 'phase20f-migration-chain', required: true },
  ];

  const results: HarnessResult[] = [];

  for (const h of harnesses) {
    logSection(`[${h.label}]`);
    const result = runHarness(h.cmd, h.label);
    results.push(result);
    if (result.passed) {
      logPass(`${h.label} PASSED (${result.durationMs}ms)`);
    } else {
      logFail(`${h.label} FAILED (${result.durationMs}ms) — ${result.error}`);
    }
  }

  // Print summary
  console.log('\n');
  logSection('=== Meta Harness Summary ===');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const skipped = results.filter((r) => !r.required && r.passed).length;

  for (const r of results) {
    if (r.passed) {
      logPass(`${r.name}: PASSED (${r.durationMs}ms)`);
    } else {
      logFail(`${r.name}: FAILED (${r.durationMs}ms) — ${r.error}`);
    }
  }

  console.log('');
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);
  log(`Total: ${passed} passed, ${failed} failed, ${(totalMs / 1000).toFixed(1)}s`);

  if (failed > 0) {
    const failedNames = results
      .filter((r) => !r.passed)
      .map((r) => r.name)
      .join(', ');
    console.log('');
    logFail(`Meta harness FAILED — ${failed} harness(es) failed: ${failedNames}`);
    process.exit(1);
  }

  logPass('Meta harness: ALL HARNESSES PASSED');
  process.exit(0);
}

main();
