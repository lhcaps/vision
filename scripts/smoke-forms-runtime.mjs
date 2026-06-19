/**
 * Smoke-check the production eligibility invariants of the DOCX contract
 * runtime exposed by the API.
 */

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { checkJsonEndpoint } from './dev-healthcheck.mjs';

const API_HEALTH_URL = 'http://localhost:3001/api/v1/health';
const API_CATALOG_URL = 'http://localhost:3001/api/v1/forms/catalog';
const REQUIRED_LOCKED_CODES = ['BM-001', 'BM-002', 'BM-003'];

export function validateFormsRuntimeCatalog(catalog) {
  const errors = [];

  if (!Array.isArray(catalog)) {
    return { errors: ['Forms catalog response is not an array.'] };
  }

  for (const templateCode of REQUIRED_LOCKED_CODES) {
    const item = catalog.find(
      (candidate) => candidate?.templateCode === templateCode,
    );
    if (!item) {
      errors.push(`Missing runtime contract ${templateCode}.`);
      continue;
    }
    if (item.status !== 'locked' || item.runtimeEligible !== true) {
      errors.push(
        `${templateCode} must be locked with runtimeEligible=true.`,
      );
    }
  }

  const bm004 = catalog.find(
    (candidate) => candidate?.templateCode === 'BM-004',
  );
  if (
    bm004?.status === 'draft' &&
    bm004.runtimeEligible !== false
  ) {
    errors.push('BM-004 is draft but runtimeEligible is not false.');
  }

  for (const item of catalog) {
    const isReference =
      item?.documentKind === 'reference' ||
      String(item?.sourceId ?? '').startsWith('REF__');
    if (isReference) {
      errors.push(
        `Reference document ${item?.templateCode ?? item?.sourceId ?? 'unknown'} leaked into the runtime catalog.`,
      );
    }
  }

  return { errors };
}

export async function runFormsRuntimeSmoke({
  fetchImpl = fetch,
  healthUrl = API_HEALTH_URL,
  catalogUrl = API_CATALOG_URL,
} = {}) {
  const health = await checkJsonEndpoint(healthUrl, { fetchImpl });
  if (!health.ok || health.body?.ok !== true) {
    return {
      ok: false,
      errors: [
        `API health check failed: ${health.error ?? `HTTP ${health.status}`}.`,
      ],
    };
  }

  const catalog = await checkJsonEndpoint(catalogUrl, { fetchImpl });
  if (!catalog.ok) {
    return {
      ok: false,
      errors: [
        `Forms catalog request failed: ${catalog.error ?? `HTTP ${catalog.status}`}.`,
      ],
    };
  }

  const validation = validateFormsRuntimeCatalog(catalog.body);
  return {
    ok: validation.errors.length === 0,
    errors: validation.errors,
    catalogCount: Array.isArray(catalog.body) ? catalog.body.length : 0,
  };
}

export async function main() {
  console.log('\n=== QUANLYVKS Forms Runtime Smoke ===\n');
  const result = await runFormsRuntimeSmoke();

  if (result.ok) {
    console.log(
      `[OK] Contract runtime invariants passed (${result.catalogCount} catalog item(s)).`,
    );
    return 0;
  }

  for (const error of result.errors) {
    console.error(`[FAIL] ${error}`);
  }
  return 1;
}

const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  process.exitCode = await main();
}
