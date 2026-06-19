/**
 * Local development health checks for the QUANLYVKS API, contract catalog, and
 * web application.
 */

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const DEFAULT_HEALTH_URLS = Object.freeze({
  apiHealth: 'http://localhost:3001/api/v1/health',
  apiReady: 'http://localhost:3001/api/v1/ready',
  apiCatalog:
    'http://localhost:3001/api/v1/forms/catalog?status=locked',
  web: 'http://localhost:3000',
});

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_WAIT_TIMEOUT_MS = 60_000;
const DEFAULT_WAIT_INTERVAL_MS = 500;

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function fetchResponse(
  url,
  {
    fetchImpl = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    accept,
  } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(url, {
      signal: controller.signal,
      headers: accept ? { Accept: accept } : undefined,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkJsonEndpoint(url, options = {}) {
  try {
    const response = await fetchResponse(url, {
      ...options,
      accept: 'application/json',
    });
    const text = await response.text();

    try {
      const body = text.trim() ? JSON.parse(text) : null;
      return {
        ok: response.ok,
        status: response.status,
        body,
        ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
      };
    } catch {
      return {
        ok: false,
        status: response.status,
        error: 'Response was not valid JSON.',
      };
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: errorMessage(error),
    };
  }
}

export async function checkTextEndpoint(url, options = {}) {
  try {
    const response = await fetchResponse(url, {
      ...options,
      accept: 'text/html, text/plain;q=0.9, */*;q=0.8',
    });
    const body = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      body,
      ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: errorMessage(error),
    };
  }
}

function logResult(label, result, note) {
  const marker = result.ok ? '[OK]' : '[FAIL]';
  const status = result.status ? ` HTTP ${result.status}` : '';
  const error = result.error ? ` - ${result.error}` : '';
  console.log(`  ${marker} ${label}${status}${error}`);
  if (note) console.log(`       ${note}`);
}

export async function runHealthChecks({
  apiOnly = false,
  urls = DEFAULT_HEALTH_URLS,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const apiHealth = await checkJsonEndpoint(urls.apiHealth, {
    fetchImpl,
    timeoutMs,
  });

  if (apiOnly) {
    return {
      ok: apiHealth.ok,
      apiHealth,
    };
  }

  const [apiReadiness, apiCatalog, web] = await Promise.all([
    checkJsonEndpoint(urls.apiReady, { fetchImpl, timeoutMs }),
    checkJsonEndpoint(urls.apiCatalog, { fetchImpl, timeoutMs }),
    checkTextEndpoint(urls.web, { fetchImpl, timeoutMs }),
  ]);

  const readinessHealthy =
    apiReadiness.ok && apiReadiness.body?.ok === true;
  const catalogHasLockedForms =
    apiCatalog.ok &&
    Array.isArray(apiCatalog.body) &&
    apiCatalog.body.length > 0;

  return {
    ok:
      apiHealth.ok &&
      readinessHealthy &&
      catalogHasLockedForms &&
      web.ok,
    apiHealth,
    apiReadiness: {
      ...apiReadiness,
      ok: readinessHealthy,
      ...(!readinessHealthy && apiReadiness.ok
        ? { error: 'API readiness reported ok=false.' }
        : {}),
    },
    apiCatalog: {
      ...apiCatalog,
      ok: catalogHasLockedForms,
      ...(!catalogHasLockedForms && apiCatalog.ok
        ? { error: 'Locked forms catalog is empty.' }
        : {}),
    },
    web,
  };
}

export async function waitForHealth({
  apiOnly = false,
  urls = DEFAULT_HEALTH_URLS,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  waitTimeoutMs = DEFAULT_WAIT_TIMEOUT_MS,
  intervalMs = DEFAULT_WAIT_INTERVAL_MS,
} = {}) {
  const deadline = Date.now() + waitTimeoutMs;
  let lastResult;

  while (Date.now() < deadline) {
    lastResult = await runHealthChecks({
      apiOnly,
      urls,
      fetchImpl,
      timeoutMs,
    });
    if (lastResult.ok) return lastResult;
    await new Promise((resolvePromise) =>
      setTimeout(resolvePromise, intervalMs),
    );
  }

  return (
    lastResult ?? {
      ok: false,
      apiHealth: {
        ok: false,
        status: 0,
        error: `API did not become healthy within ${waitTimeoutMs}ms.`,
      },
    }
  );
}

function printHealthReport(result, { apiOnly = false } = {}) {
  console.log('\n=== QUANLYVKS Dev Health Check ===\n');
  logResult('API /api/v1/health', result.apiHealth);

  if (!apiOnly) {
    logResult('API /api/v1/ready', result.apiReadiness);
    const lockedCount = Array.isArray(result.apiCatalog?.body)
      ? result.apiCatalog.body.length
      : 0;
    logResult(
      'Forms catalog (locked)',
      result.apiCatalog,
      result.apiCatalog?.ok ? `${lockedCount} locked form(s)` : undefined,
    );
    logResult('Web http://localhost:3000', result.web);
  }

  console.log(
    `\n=== ${result.ok ? 'ALL REQUIRED SERVICES HEALTHY' : 'SOME REQUIRED SERVICES DOWN'} ===\n`,
  );
}

export async function main(args = process.argv.slice(2)) {
  const apiOnly = args.includes('--api-only');
  const wait = args.includes('--wait');
  const waitAll = args.includes('--wait-all');
  const effectiveApiOnly = waitAll ? false : apiOnly;
  const result =
    wait || waitAll
      ? await waitForHealth({ apiOnly: effectiveApiOnly })
      : await runHealthChecks({ apiOnly: effectiveApiOnly });

  printHealthReport(result, { apiOnly: effectiveApiOnly });
  return result.ok ? 0 : 1;
}

const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectExecution) {
  process.exitCode = await main();
}
