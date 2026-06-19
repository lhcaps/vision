import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  parsePorts,
  parseWindowsListenerPids,
  windowsTaskkillArgs,
} from '../scripts/dev-port-manager.mjs';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const webPackageJson = JSON.parse(
  await readFile(new URL('../apps/web/package.json', import.meta.url), 'utf8'),
);

test('root pnpm dev cleans ports and starts the stable API-first stack', () => {
  assert.equal(
    packageJson.scripts.dev,
    'pnpm dev:clean && pnpm dev:run',
  );
  assert.equal(
    packageJson.scripts['dev:clean'],
    'node scripts/free-ports.mjs 3000,3001',
  );
  assert.match(
    packageJson.scripts['dev:run'],
    /--kill-others-on-fail/u,
  );
  assert.match(
    packageJson.scripts['dev:run'],
    /pnpm dev:api:stable/u,
  );
  assert.match(
    packageJson.scripts['dev:run'],
    /pnpm dev:wait-api && pnpm dev:web/u,
  );
  assert.match(
    packageJson.scripts['dev:run'],
    /pnpm dev:wait-ready/u,
  );
  assert.equal(webPackageJson.scripts.dev, 'next dev -p 3000');
});

test('watch mode is explicit and keeps the same safe startup flow', () => {
  assert.equal(
    packageJson.scripts['dev:watch'],
    'pnpm dev:clean && pnpm dev:run:watch',
  );
  assert.match(packageJson.scripts['dev:run:watch'], /pnpm dev:api:watch/u);
  assert.match(
    packageJson.scripts['dev:run:watch'],
    /pnpm dev:wait-api && pnpm dev:web/u,
  );
});

test('parsePorts accepts comma-separated ports and defaults safely', () => {
  assert.deepEqual(parsePorts(['3000,3001']), [3000, 3001]);
  assert.deepEqual(parsePorts([]), [3000, 3001]);
  assert.deepEqual(parsePorts(['3000,invalid,-1,3001']), [3000, 3001]);
});

test('Windows listener parsing matches the exact local port', () => {
  const output = [
    '  TCP    0.0.0.0:3000       0.0.0.0:0       LISTENING       1234',
    '  TCP    [::]:3001          [::]:0          LISTENING       5678',
    '  TCP    0.0.0.0:13000      0.0.0.0:0       LISTENING       9999',
  ].join('\r\n');

  assert.deepEqual(parseWindowsListenerPids(output, 3000), [1234]);
  assert.deepEqual(parseWindowsListenerPids(output, 3001), [5678]);
});

test('Windows port cleanup terminates the listener process tree', () => {
  assert.deepEqual(windowsTaskkillArgs(1234), [
    '/PID',
    '1234',
    '/T',
    '/F',
  ]);
});
