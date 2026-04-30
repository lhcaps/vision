import { describe, expect, it } from 'vitest';
import {
  assertDraftDatasetVersion,
  createEmptySplitSummary,
  DatasetVersionSummarySchema,
  summarizeDatasetSplits,
} from '../datasets';

describe('dataset versioning contracts', () => {
  it('computes split summaries from dataset version asset rows', () => {
    expect(
      summarizeDatasetSplits([
        { split: 'TRAIN' },
        { split: 'TRAIN' },
        { split: 'VALID' },
        { split: 'TEST' },
        { split: 'UNASSIGNED' },
      ])
    ).toEqual({
      TRAIN: 2,
      VALID: 1,
      TEST: 1,
      UNASSIGNED: 1,
    });
  });

  it('creates empty split summaries with every split present', () => {
    expect(createEmptySplitSummary()).toEqual({
      TRAIN: 0,
      VALID: 0,
      TEST: 0,
      UNASSIGNED: 0,
    });
  });

  it('guards immutable versions after draft', () => {
    expect(() => assertDraftDatasetVersion('DRAFT')).not.toThrow();
    expect(() => assertDraftDatasetVersion('LOCKED')).toThrow('immutable');
    expect(() => assertDraftDatasetVersion('ARCHIVED')).toThrow('immutable');
  });

  it('validates version summaries with computed split summary shape', () => {
    expect(
      DatasetVersionSummarySchema.parse({
        id: 'version_1',
        datasetId: 'dataset_1',
        version: 1,
        label: 'v1',
        status: 'LOCKED',
        parentVersionId: null,
        assetCount: 3,
        splitSummary: {
          TRAIN: 1,
          VALID: 1,
          TEST: 1,
          UNASSIGNED: 0,
        },
        createdAt: new Date('2026-04-28T00:00:00.000Z').toISOString(),
      })
    ).toMatchObject({
      label: 'v1',
      assetCount: 3,
      status: 'LOCKED',
    });
  });
});
