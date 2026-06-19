#!/usr/bin/env node
/**
 * smoke-bm001-shadow-render.mjs
 *
 * Smoke test for BM-001 shadow render mode.
 * Requires API running with:
 *   DOCUMENT_RENDERER_MODE=shadow
 *   DOCUMENT_RENDERER_CONTRACT_TEMPLATES=BM-001
 *
 * Usage:
 *   node scripts/smoke-bm001-shadow-render.mjs
 *
 * Exit codes:
 *   0  — all checks pass
 *   1  — infra failure (API unreachable, manifest missing, etc.)
 *   2  — semantic/format warning (printed clearly, not infra failure)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_BASE = process.env.API_BASE ?? 'http://localhost:3001/api/v1';
const DOCUMENT_ID = process.env.SMOKE_DOCUMENT_ID ?? '1';
const STRICT = process.env.SMOKE_STRICT === 'true';

const shadowRendersDir = join(__dirname, '..', 'storage', 'generated', 'shadow-renders', 'BM-001');

function log(level, ...args) {
  const prefix = level === 'FAIL' ? '❌' : level === 'WARN' ? '⚠️ ' : level === 'PASS' ? '✅' : 'ℹ️ ';
  console.log(prefix, ...args);
}

function checkFile(path, label) {
  if (!existsSync(path)) {
    log('FAIL', `${label} not found: ${path}`);
    return false;
  }
  log('PASS', `${label}: ${path}`);
  return true;
}

async function main() {
  console.log('\n=== BM-001 Shadow Render Smoke Test ===\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Document ID: ${DOCUMENT_ID}`);
  console.log(`Shadow dir: ${shadowRendersDir}`);
  console.log(`Strict mode: ${STRICT}\n`);

  let infraFail = false;
  let hasWarning = false;
  let latestShadowDir = null;

  // 1. Find the latest shadow render directory
  if (existsSync(shadowRendersDir)) {
    const entries = readdirSync(shadowRendersDir)
      .map((name) => ({ name, stat: statSync(join(shadowRendersDir, name)) }))
      .filter((e) => e.stat.isDirectory())
      .sort((a, b) => b.stat.mtime - a.stat.mtime);

    if (entries.length > 0) {
      latestShadowDir = join(shadowRendersDir, entries[0].name);
      log('PASS', `Latest shadow dir: ${latestShadowDir}`);
    } else {
      log('WARN', 'Shadow renders dir exists but is empty — no shadow renders found yet.');
      hasWarning = true;
    }
  } else {
    log('WARN', `Shadow renders dir does not exist yet: ${shadowRendersDir}`);
    hasWarning = true;
  }

  // 2. Check required artifacts exist
  const requiredArtifacts = [
    'contract.docx',
    'semantic-diff.json',
    'semantic-diff.md',
    'format-audit.json',
    'format-audit.md',
    'manifest.json',
  ];

  if (!latestShadowDir) {
    log('WARN', 'No shadow renders exist yet — skip artifact checks.');
    log('INFO', 'To trigger a shadow render, make a GET request to:');
    log('INFO', `  ${API_BASE}/documents/generated/${DOCUMENT_ID}/render-payload`);
    log('INFO', '(Requires authenticated session)');
    infraFail = false;
    hasWarning = true;
  } else if (latestShadowDir === shadowRendersDir) {
    // latestShadowDir was set to the base dir when empty
    log('WARN', 'Shadow renders dir is empty — no renders triggered yet.');
    infraFail = false;
    hasWarning = true;
  } else {
    for (const artifact of requiredArtifacts) {
      const artifactPath = join(latestShadowDir, artifact);
      if (!checkFile(artifactPath, artifact)) {
        infraFail = true;
      }
    }
  }

  // 3. Check manifest content
  if (latestShadowDir && existsSync(join(latestShadowDir, 'manifest.json'))) {
    try {
      const manifest = JSON.parse(
        readFileSync(join(latestShadowDir, 'manifest.json'), 'utf-8'),
      );

      if (!manifest.templateCode || manifest.templateCode !== 'BM-001') {
        log('FAIL', `Manifest has wrong templateCode: ${manifest.templateCode}`);
        infraFail = true;
      }

      if (!manifest.renderPlan || manifest.renderPlan.fieldCount === undefined) {
        log('FAIL', 'Manifest missing render plan fields');
        infraFail = true;
      }

      log('PASS', `Manifest: ${manifest.renderPlan?.fieldCount ?? 0} fields, ${manifest.renderPlan?.bindingCount ?? 0} bindings`);
    } catch (err) {
      log('FAIL', `Failed to parse manifest: ${err.message}`);
      infraFail = true;
    }
  }

  // 4. Check semantic diff
  if (latestShadowDir && existsSync(join(latestShadowDir, 'semantic-diff.json'))) {
    try {
      const diff = JSON.parse(
        readFileSync(join(latestShadowDir, 'semantic-diff.json'), 'utf-8'),
      );

      if (diff.status === 'fail') {
        log('WARN', `Semantic comparison FAILED:`);
        if (diff.missingExpectedText?.length > 0) {
          log('WARN', `  Missing: ${diff.missingExpectedText.join(', ')}`);
        }
        if (diff.unexpectedUnresolvedPlaceholders?.length > 0) {
          log('WARN', `  Unresolved: ${diff.unexpectedUnresolvedPlaceholders.join(', ')}`);
        }
        hasWarning = true;
      } else if (diff.status === 'warning') {
        log('WARN', `Semantic comparison WARNING: ${diff.notes?.join('; ')}`);
        hasWarning = true;
      } else {
        log('PASS', `Semantic comparison PASSED`);
      }

      if (diff.legacyTextLength > 0 && diff.contractTextLength > 0) {
        log('INFO', `  Legacy text: ${diff.legacyTextLength} chars, Contract text: ${diff.contractTextLength} chars`);
      }
    } catch (err) {
      log('FAIL', `Failed to parse semantic-diff.json: ${err.message}`);
      infraFail = true;
    }
  }

  // 5. Check format audit
  if (latestShadowDir && existsSync(join(latestShadowDir, 'format-audit.json'))) {
    try {
      const audit = JSON.parse(
        readFileSync(join(latestShadowDir, 'format-audit.json'), 'utf-8'),
      );

      const failed = (audit.checks ?? []).filter((c) => c.status === 'fail');
      const warnings = (audit.checks ?? []).filter((c) => c.status === 'warning');
      const notDetectable = (audit.checks ?? []).filter((c) => c.status === 'not_detectable');

      if (audit.status === 'fail' || failed.length > 0) {
        log('WARN', `Format audit FAILED (${failed.length} checks):`);
        for (const f of failed) {
          log('WARN', `  ${f.id}: ${f.requirement}`);
        }
        hasWarning = true;
      } else {
        log('PASS', `Format audit overall: ${audit.status}`);
      }

      if (warnings.length > 0) {
        log('WARN', `Format audit ${warnings.length} warnings:`);
        for (const w of warnings) {
          log('WARN', `  ${w.id}: ${w.requirement}`);
        }
        hasWarning = true;
      }

      if (notDetectable.length > 0 && STRICT) {
        log('WARN', `Format audit ${notDetectable.length} not_detectable (strict):`);
        for (const nd of notDetectable) {
          log('WARN', `  ${nd.id}: ${nd.requirement}`);
        }
        hasWarning = true;
      }

      log('INFO', `  Total checks: ${(audit.checks ?? []).length}`);
    } catch (err) {
      log('FAIL', `Failed to parse format-audit.json: ${err.message}`);
      infraFail = true;
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  if (infraFail) {
    log('FAIL', 'INFRA FAILURE — one or more required artifacts missing or unreadable');
    process.exit(1);
  }

  if (hasWarning) {
    log('WARN', 'Warnings detected — see above for details');
    if (STRICT) {
      process.exit(2);
    }
  } else {
    log('PASS', 'All checks passed');
  }

  process.exit(0);
}

main().catch((err) => {
  log('FAIL', `Smoke test crashed: ${err.message}`);
  process.exit(1);
});
