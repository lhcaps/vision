// Tests for the dependency-free YAML parser/writer used by manifest,
// meta.yaml, and registry/skills.yaml. Run with: node --test test/yaml.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, toYaml, stringify } from '../cli/lib/yaml.mjs';

test('parses simple scalars', () => {
  assert.deepEqual(parse('name: harness\nversion: 0.1.0'), {
    name: 'harness',
    version: '0.1.0',
  });
});

test('parses booleans and null', () => {
  assert.deepEqual(parse('a: true\nb: false\nc: null\nd: ~'), {
    a: true,
    b: false,
    c: null,
    d: null,
  });
});

test('parses integers and floats', () => {
  assert.deepEqual(parse('i: 42\nf: 3.14\nneg: -7'), { i: 42, f: 3.14, neg: -7 });
});

test('parses quoted strings with colons', () => {
  assert.deepEqual(parse('a: "x: y"\nb: \'literal\''), { a: 'x: y', b: 'literal' });
});

test('parses nested maps', () => {
  const src = 'outer:\n  inner: 1\n  deeper:\n    val: 2\n';
  assert.deepEqual(parse(src), { outer: { inner: 1, deeper: { val: 2 } } });
});

test('parses simple lists', () => {
  assert.deepEqual(parse('items:\n  - a\n  - b\n  - c'), { items: ['a', 'b', 'c'] });
});

test('parses lists of maps', () => {
  const src = 'people:\n  - id: 1\n    name: alice\n  - id: 2\n    name: bob\n';
  assert.deepEqual(parse(src), {
    people: [
      { id: 1, name: 'alice' },
      { id: 2, name: 'bob' },
    ],
  });
});

test('parses inline lists with brace-aware splitting', () => {
  const src = 'detect: [package.json, next.config.{js,mjs,ts}]\n';
  assert.deepEqual(parse(src), {
    detect: ['package.json', 'next.config.{js,mjs,ts}'],
  });
});

test('parses block folded scalar (>)', () => {
  const src = 'desc: >\n  Line one\n  Line two\n  Line three\n';
  assert.equal(parse(src).desc, 'Line one Line two Line three');
});

test('parses block literal scalar (|)', () => {
  const src = 'desc: |\n  Line one\n  Line two\n';
  assert.equal(parse(src).desc, 'Line one\nLine two');
});

test('strips UTF-8 BOM', () => {
  const bom = '\uFEFF';
  const src = bom + 'a: 1\nb: 2\n';
  assert.deepEqual(parse(src), { a: 1, b: 2 });
});

test('ignores comments and blank lines', () => {
  const src = '# top comment\na: 1\n\n# trailing\nb: 2\n';
  assert.deepEqual(parse(src), { a: 1, b: 2 });
});

test('does not strip # inside quoted strings', () => {
  // Regression: prior to the fix, stripTrailingComment would eat # even
  // inside double-quoted values, breaking round-trips of strings like
  // "a # b".
  const obj = { withHash: 'a # b' };
  const back = parse(toYaml(obj));
  assert.equal(back.withHash, 'a # b');
});

test('stringifies and parses round-trip for simple map', () => {
  const obj = { name: 'harness', version: '0.1.0', flag: true, count: 42 };
  const back = parse(toYaml(obj));
  assert.deepEqual(back, obj);
});

test('stringifies and parses round-trip for nested map with array', () => {
  const obj = {
    stack: {
      langs: ['js', 'ts'],
      packages: { runtime: 'node', version: '>=18' },
    },
  };
  const back = parse(toYaml(obj));
  assert.deepEqual(back, obj);
});

test('stringifies list of maps with array values (the round-trip bug)', () => {
  // Original bug: list-of-maps where each map has an array value
  // (e.g. skills[].requires) was emitting invalid YAML.
  const obj = {
    skills: [
      { id: 'plan', requires: [] },
      { id: 'ship', requires: ['code-review', 'test'] },
      { id: 'ui-architect', requires: ['plan'] },
    ],
  };
  const back = parse(toYaml(obj));
  assert.deepEqual(back, obj);
});

test('parses the actual meta.yaml without losing data', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');
  const __filename = fileURLToPath(import.meta.url);
  const metaPath = path.resolve(path.dirname(__filename), '..', 'meta.yaml');
  const obj = parse(readFileSync(metaPath, 'utf8'));
  assert.equal(obj.name, 'harness');
  assert.ok(obj.supported_stacks.length >= 4);
  assert.ok(obj.supported_stacks.find((s) => s.id === 'nextjs'));
});

test('parses the actual skills registry', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');
  const __filename = fileURLToPath(import.meta.url);
  const regPath = path.resolve(
    path.dirname(__filename),
    '..',
    'registry',
    'skills.yaml'
  );
  const obj = parse(readFileSync(regPath, 'utf8'));
  assert.ok(obj.skills.length >= 20);
  assert.ok(obj.groups.length >= 5);
  const plan = obj.skills.find((s) => s.id === 'plan');
  assert.ok(plan);
  assert.equal(plan.group, 'core');
});

test('quoted strings with special characters round-trip', () => {
  const obj = { pattern: 'foo:bar|baz', withHash: 'a # b' };
  const back = parse(toYaml(obj));
  assert.deepEqual(back, obj);
});

test('inline list of inline maps parses correctly', () => {
  // Regression: parseInlineList previously only recognized scalars.
  const src = 'matrix: [{a: 1, b: 2}, {a: 3, b: 4}]\n';
  const obj = parse(src);
  assert.ok(Array.isArray(obj.matrix));
  assert.equal(obj.matrix.length, 2);
  assert.equal(obj.matrix[0].a, 1);
  assert.equal(obj.matrix[1].b, 4);
});
