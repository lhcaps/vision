import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateFormsRuntimeCatalog,
} from '../scripts/smoke-forms-runtime.mjs';

function item(templateCode, status, runtimeEligible, documentKind = 'form') {
  return {
    sourceId: `${templateCode}__fixture`,
    templateCode,
    title: templateCode,
    status,
    runtimeEligible,
    documentKind,
  };
}

test('accepts the locked pilot contracts and draft BM-004', () => {
  const result = validateFormsRuntimeCatalog([
    item('BM-001', 'locked', true),
    item('BM-002', 'locked', true),
    item('BM-003', 'locked', true),
    item('BM-004', 'draft', false),
  ]);

  assert.deepEqual(result.errors, []);
});

test('reports each missing locked pilot contract', () => {
  const result = validateFormsRuntimeCatalog([
    item('BM-001', 'locked', true),
    item('BM-004', 'draft', false),
  ]);

  assert.deepEqual(result.errors, [
    'Missing runtime contract BM-002.',
    'Missing runtime contract BM-003.',
  ]);
});

test('rejects a reference document in the runtime catalog', () => {
  const result = validateFormsRuntimeCatalog([
    item('BM-001', 'locked', true),
    item('BM-002', 'locked', true),
    item('BM-003', 'locked', true),
    item('BM-004', 'draft', false),
    item('BM-999', 'draft', false, 'reference'),
  ]);

  assert.deepEqual(result.errors, [
    'Reference document BM-999 leaked into the runtime catalog.',
  ]);
});

test('requires draft BM-004 to remain non-runtime-eligible', () => {
  const result = validateFormsRuntimeCatalog([
    item('BM-001', 'locked', true),
    item('BM-002', 'locked', true),
    item('BM-003', 'locked', true),
    item('BM-004', 'draft', true),
  ]);

  assert.deepEqual(result.errors, [
    'BM-004 is draft but runtimeEligible is not false.',
  ]);
});
