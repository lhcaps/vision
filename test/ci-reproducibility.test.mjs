import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiPackageJson = JSON.parse(
  await readFile(
    new URL('../apps/api/package.json', import.meta.url),
    'utf8',
  ),
);
const ciWorkflow = await readFile(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
);

test('API build generates Prisma Client in fresh environments', () => {
  assert.equal(apiPackageJson.scripts.prebuild, 'prisma generate');
});

test('API lint is check-only and exposes an explicit fix command', () => {
  assert.doesNotMatch(apiPackageJson.scripts.lint, /--fix/u);
  assert.match(apiPackageJson.scripts['lint:fix'], /--fix/u);
});

test('CI forwards Jest arguments without adding a positional separator', () => {
  assert.match(
    ciWorkflow,
    /pnpm --filter api test --runInBand/u,
  );
  assert.doesNotMatch(
    ciWorkflow,
    /pnpm --filter api test -- --runInBand/u,
  );
});
