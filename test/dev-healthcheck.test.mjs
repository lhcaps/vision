import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkJsonEndpoint,
  checkTextEndpoint,
  runHealthChecks,
  waitForHealth,
} from '../scripts/dev-healthcheck.mjs';

test('checkTextEndpoint accepts an HTML web response', async () => {
  const result = await checkTextEndpoint('http://web.test', {
    fetchImpl: async () =>
      new Response('<!doctype html><title>QUANLYVKS</title>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.match(result.body, /QUANLYVKS/);
});

test('checkJsonEndpoint reports invalid JSON without throwing', async () => {
  const result = await checkJsonEndpoint('http://api.test', {
    fetchImpl: async () =>
      new Response('<!doctype html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 502);
  assert.match(result.error, /valid JSON/);
});

test('endpoint checks report fetch rejection as an unavailable service', async () => {
  const result = await checkJsonEndpoint('http://api.test', {
    fetchImpl: async () => {
      throw new TypeError('Failed to fetch');
    },
  });

  assert.deepEqual(result, {
    ok: false,
    status: 0,
    error: 'Failed to fetch',
  });
});

test('runHealthChecks fails when readiness is false', async () => {
  const urls = {
    apiHealth: 'http://api.test/health',
    apiReady: 'http://api.test/ready',
    apiCatalog: 'http://api.test/catalog',
    web: 'http://web.test',
  };
  const fetchImpl = async (url) => {
    if (url === urls.apiHealth) {
      return Response.json({ ok: true });
    }
    if (url === urls.apiReady) {
      return Response.json({ ok: false });
    }
    if (url === urls.apiCatalog) {
      return Response.json([{ templateCode: 'BM-001' }]);
    }
    return new Response('<!doctype html>', { status: 200 });
  };

  const result = await runHealthChecks({ urls, fetchImpl });

  assert.equal(result.apiReadiness.ok, false);
  assert.equal(result.ok, false);
});

test('waitForHealth waits for the complete API and web stack', async () => {
  let attempts = 0;
  const urls = {
    apiHealth: 'http://api.test/health',
    apiReady: 'http://api.test/ready',
    apiCatalog: 'http://api.test/catalog',
    web: 'http://web.test',
  };
  const fetchImpl = async (url) => {
    if (url === urls.apiHealth) {
      attempts += 1;
      return Response.json({ ok: true });
    }
    if (url === urls.apiReady) {
      return Response.json({ ok: true });
    }
    if (url === urls.apiCatalog) {
      return Response.json([{ templateCode: 'BM-001' }]);
    }
    return new Response('<!doctype html>', {
      status: attempts >= 2 ? 200 : 503,
    });
  };

  const result = await waitForHealth({
    urls,
    fetchImpl,
    waitTimeoutMs: 100,
    intervalMs: 1,
  });

  assert.equal(result.ok, true);
  assert.equal(attempts, 2);
});
