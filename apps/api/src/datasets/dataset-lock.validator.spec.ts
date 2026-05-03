import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DatasetLockValidator } from './dataset-lock.validator';

function makeSnapshot(
  overrides: Partial<Parameters<DatasetLockValidator['validate']>[0]> = {}
): Parameters<DatasetLockValidator['validate']>[0] {
  return {
    id: 'version_1',
    datasetId: 'dataset_1',
    version: 1,
    status: 'DRAFT',
    assets: [],
    annotationSets: [],
    ...overrides,
  };
}

function makeAsset(
  overrides: Partial<{
    assetId: string;
    split: 'TRAIN' | 'VALID' | 'TEST' | 'UNASSIGNED';
    width: number | null;
    height: number | null;
    type: 'IMAGE' | 'VIDEO' | 'FRAME';
  }> = {}
): Parameters<DatasetLockValidator['validate']>[0]['assets'][0] {
  return {
    assetId: 'asset_1',
    split: 'TRAIN',
    asset: { id: 'asset_1', type: 'IMAGE', width: 1920, height: 1080, ...overrides },
    ...overrides,
  };
}

function makeAnnotation(
  overrides: Partial<{
    id: string;
    assetId: string;
    type: 'BBOX' | 'MASK' | 'KEYPOINT';
  }> = {}
): Parameters<DatasetLockValidator['validate']>[0]['annotationSets'][0]['annotations'][0] {
  return {
    id: 'ann_1',
    assetId: 'asset_1',
    type: 'BBOX',
    geometryJson: { x: 0, y: 0, width: 100, height: 100 },
    ...overrides,
  };
}

function makeAnnotationSet(
  overrides: Partial<{
    id: string;
    annotations: Parameters<
      DatasetLockValidator['validate']
    >[0]['annotationSets'][0]['annotations'];
  }> = {}
): Parameters<DatasetLockValidator['validate']>[0]['annotationSets'][0] {
  return {
    id: 'set_1',
    annotations: [makeAnnotation()],
    ...overrides,
  };
}

describe('DatasetLockValidator', () => {
  const validator = new DatasetLockValidator();

  describe('rejects non-DRAFT status', () => {
    it('rejects already LOCKED version', () => {
      const snapshot = makeSnapshot({ status: 'LOCKED' });
      expect(() => validator.validate(snapshot)).toThrow(ConflictException);
    });

    it('rejects ARCHIVED version', () => {
      const snapshot = makeSnapshot({ status: 'ARCHIVED' });
      expect(() => validator.validate(snapshot)).toThrow(ConflictException);
    });
  });

  describe('rejects empty version', () => {
    it('throws when no assets', () => {
      const snapshot = makeSnapshot({ assets: [] });
      expect(() => validator.validate(snapshot)).toThrow('at least one asset');
    });
  });

  describe('rejects UNASSIGNED assets', () => {
    it('throws when any asset is UNASSIGNED', () => {
      const snapshot = makeSnapshot({
        assets: [
          makeAsset({ assetId: 'a1', split: 'TRAIN' }),
          makeAsset({ assetId: 'a2', split: 'UNASSIGNED' }),
        ],
        annotationSets: [makeAnnotationSet()],
      });
      expect(() => validator.validate(snapshot)).toThrow('UNASSIGNED');
    });
  });

  describe('rejects assets without dimensions', () => {
    it('throws when IMAGE asset has null width', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ width: null, height: 1080 })],
        annotationSets: [makeAnnotationSet()],
      });
      expect(() => validator.validate(snapshot)).toThrow('missing image dimensions');
    });

    it('throws when IMAGE asset has null height', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ width: 1920, height: null })],
        annotationSets: [makeAnnotationSet()],
      });
      expect(() => validator.validate(snapshot)).toThrow('missing image dimensions');
    });

    it('throws when IMAGE asset has zero width', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ width: 0, height: 1080 })],
        annotationSets: [makeAnnotationSet()],
      });
      expect(() => validator.validate(snapshot)).toThrow('invalid dimensions');
    });
  });

  describe('rejects no annotation set', () => {
    it('throws when no annotation sets', () => {
      const snapshot = makeSnapshot({ assets: [makeAsset()], annotationSets: [] });
      expect(() => validator.validate(snapshot)).toThrow('annotation set');
    });
  });

  describe('rejects no BBox annotations', () => {
    it('throws when annotation set is empty', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset()],
        annotationSets: [makeAnnotationSet({ annotations: [] })],
      });
      expect(() => validator.validate(snapshot)).toThrow('at least one BBox');
    });

    it('throws when only MASK annotation exists', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset()],
        annotationSets: [makeAnnotationSet({ annotations: [makeAnnotation({ type: 'MASK' })] })],
      });
      expect(() => validator.validate(snapshot)).toThrow('at least one BBox');
    });
  });

  describe('rejects annotation assets outside version', () => {
    it('throws when annotation references asset not in version', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ assetId: 'asset_1' })],
        annotationSets: [
          makeAnnotationSet({ annotations: [makeAnnotation({ assetId: 'asset_outside' })] }),
        ],
      });
      expect(() => validator.validate(snapshot)).toThrow('outside this dataset version');
    });
  });

  describe('rejects non-image assets without dimensions', () => {
    it('throws when no exportable IMAGE assets exist', () => {
      const snapshot = makeSnapshot({
        assets: [
          {
            assetId: 'asset_video',
            split: 'TRAIN' as const,
            asset: { id: 'asset_video', type: 'VIDEO' as const, width: null, height: null },
          },
        ],
        annotationSets: [
          makeAnnotationSet({
            annotations: [makeAnnotation({ assetId: 'asset_video', type: 'BBOX' as const })],
          }),
        ],
      });
      expect(() => validator.validate(snapshot)).toThrow('no exportable image assets');
    });
  });

  describe('accepts valid DRAFT version', () => {
    it('accepts version with one IMAGE asset, no UNASSIGNED, with BBox annotation', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ assetId: 'asset_1', split: 'TRAIN', width: 1920, height: 1080 })],
        annotationSets: [
          makeAnnotationSet({
            annotations: [makeAnnotation({ assetId: 'asset_1', type: 'BBOX' })],
          }),
        ],
      });
      expect(() => validator.validate(snapshot)).not.toThrow();
    });

    it('accepts version with multiple TRAIN/VALID/TEST assets', () => {
      const snapshot = makeSnapshot({
        assets: [
          makeAsset({ assetId: 'a1', split: 'TRAIN', width: 1920, height: 1080 }),
          makeAsset({ assetId: 'a2', split: 'VALID', width: 800, height: 600 }),
          makeAsset({ assetId: 'a3', split: 'TEST', width: 1280, height: 720 }),
        ],
        annotationSets: [
          makeAnnotationSet({
            annotations: [
              makeAnnotation({ assetId: 'a1', type: 'BBOX' }),
              makeAnnotation({ id: 'ann_2', assetId: 'a2', type: 'BBOX' }),
            ],
          }),
        ],
      });
      expect(() => validator.validate(snapshot)).not.toThrow();
    });

    it('accepts version with VIDEO assets (they are skipped in COCO export)', () => {
      const snapshot = makeSnapshot({
        assets: [
          makeAsset({ assetId: 'a1', split: 'TRAIN', width: 1920, height: 1080, type: 'IMAGE' }),
          {
            assetId: 'v1',
            split: 'VALID' as const,
            asset: { id: 'v1', type: 'VIDEO' as const, width: null, height: null },
          },
        ],
        annotationSets: [
          makeAnnotationSet({ annotations: [makeAnnotation({ assetId: 'a1', type: 'BBOX' })] }),
        ],
      });
      expect(() => validator.validate(snapshot)).not.toThrow();
    });
  });
});
