import assert from 'node:assert/strict';
import test from 'node:test';
import { installApiFetchDefaults } from './api-client';
import { fetchMe, login } from './auth-client';

test('fetchMe returns null when the API request rejects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  try {
    assert.equal(await fetchMe(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('login reports an actionable error when the API request rejects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  try {
    await assert.rejects(
      login('admin', 'secret'),
      /Không kết nối được API đăng nhập/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('the global fetch observer does not create an unhandled rejection', async () => {
  const originalWindow = globalThis.window;
  const observedUnhandledRejections: unknown[] = [];
  const onUnhandledRejection = (reason: unknown) => {
    observedUnhandledRejections.push(reason);
  };

  const fakeWindow = {
    fetch: async () => {
      throw new TypeError('Failed to fetch');
    },
    location: new URL('http://localhost:3000'),
  } as unknown as Window & typeof globalThis;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: fakeWindow,
    writable: true,
  });
  process.on('unhandledRejection', onUnhandledRejection);

  try {
    installApiFetchDefaults();
    await assert.rejects(
      fakeWindow.fetch('http://localhost:3001/api/v1/cases'),
      /Failed to fetch/,
    );
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(observedUnhandledRejections, []);
  } finally {
    process.off('unhandledRejection', onUnhandledRejection);
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
      writable: true,
    });
  }
});
