import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DatasetLockValidator } from './dataset-lock.validator';

function makeSnapshot(overrides?: {
  status?: 'DRAFT' | 'LOCKED' | 'ARCHIVED';
  assets?: Array<{
    assetId: string;
    split: 'TRAIN' | 'VALID' | 'TEST' | 'UNASSIGNED';
    asset: {
      id: string;
      type: 'IMAGE' | 'VIDEO' | 'FRAME';
      width: number | null;
      height: number | null;
    };
  }>;
  annotationSets?: ReturnType<typeof makeAnnotationSet>[];
}) {
  const assets = overrides?.assets ?? [makeAsset()];
  return {
    id: 'version_1',
    datasetId: 'dataset_1',
    version: 1,
    status: overrides?.status ?? 'DRAFT',
    assets,
    annotationSets: overrides?.annotationSets ?? [makeAnnotationSet()],
  };
}

function makeAsset(overrides?: {
  assetId?: string;
  split?: 'TRAIN' | 'VALID' | 'TEST' | 'UNASSIGNED';
  width?: number | null;
  height?: number | null;
  type?: 'IMAGE' | 'VIDEO' | 'FRAME';
}) {
  const assetId = overrides?.assetId ?? 'asset_1';
  return {
    assetId,
    split: overrides?.split ?? 'TRAIN',
    asset: {
      id: assetId,
      type: (overrides?.type ?? 'IMAGE') as 'IMAGE' | 'VIDEO' | 'FRAME',
      width: overrides?.width ?? 1920,
      height: overrides?.height ?? 1080,
    },
  };
}

function makeAnnotation(overrides?: {
  id?: string;
  assetId?: string;
  type?: 'BBOX' | 'MASK' | 'KEYPOINT';
  geometryJson?: object;
}) {
  return {
    id: overrides?.id ?? 'ann_1',
    assetId: overrides?.assetId ?? 'asset_1',
    type: (overrides?.type ?? 'BBOX') as 'BBOX' | 'MASK' | 'KEYPOINT',
    geometryJson: overrides?.geometryJson ?? { x: 0, y: 0, width: 100, height: 100 },
  };
}

function makeAnnotationSet(overrides?: {
  id?: string;
  annotations?: ReturnType<typeof makeAnnotation>[];
}) {
  return {
    id: overrides?.id ?? 'set_1',
    annotations: overrides?.annotations ?? [makeAnnotation()],
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
      // Inline snapshot to avoid makeAsset helper spread issues with null
      const snapshot = {
        id: 'version_1',
        datasetId: 'dataset_1',
        version: 1,
        status: 'DRAFT' as const,
        assets: [
          {
            assetId: 'asset_1',
            split: 'TRAIN' as const,
            asset: { id: 'asset_1', type: 'IMAGE' as const, width: null, height: 1080 },
          },
        ],
        annotationSets: [
          {
            id: 'set_1',
            annotations: [
              {
                id: 'ann_1',
                assetId: 'asset_1',
                type: 'BBOX' as const,
                geometryJson: { x: 0, y: 0, width: 100, height: 100 },
              },
            ],
          },
        ],
      };
      expect(() => validator.validate(snapshot)).toThrow('missing image dimensions');
    });

    it('throws when IMAGE asset has null height', () => {
      const snapshot = {
        id: 'version_1',
        datasetId: 'dataset_1',
        version: 1,
        status: 'DRAFT' as const,
        assets: [
          {
            assetId: 'asset_1',
            split: 'TRAIN' as const,
            asset: { id: 'asset_1', type: 'IMAGE' as const, width: 1920, height: null },
          },
        ],
        annotationSets: [
          {
            id: 'set_1',
            annotations: [
              {
                id: 'ann_1',
                assetId: 'asset_1',
                type: 'BBOX' as const,
                geometryJson: { x: 0, y: 0, width: 100, height: 100 },
              },
            ],
          },
        ],
      };
      expect(() => validator.validate(snapshot)).toThrow('missing image dimensions');
    });

    it('throws when IMAGE asset has zero width', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ width: 0, height: 1080 })],
        annotationSets: [makeAnnotationSet()],
      });
      expect(() => validator.validate(snapshot)).toThrow('invalid dimensions');
    });

    it('throws when IMAGE asset has zero height', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ width: 1920, height: 0 })],
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

  describe('rejects invalid BBox geometry', () => {
    it('throws when BBox width is zero', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ assetId: 'asset_1' })],
        annotationSets: [
          makeAnnotationSet({
            annotations: [makeAnnotation({ geometryJson: { x: 0, y: 0, width: 0, height: 100 } })],
          }),
        ],
      });
      expect(() => validator.validate(snapshot)).toThrow('invalid geometry');
    });

    it('throws when BBox height is zero', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ assetId: 'asset_1' })],
        annotationSets: [
          makeAnnotationSet({
            annotations: [makeAnnotation({ geometryJson: { x: 0, y: 0, width: 100, height: 0 } })],
          }),
        ],
      });
      expect(() => validator.validate(snapshot)).toThrow('invalid geometry');
    });

    it('throws when BBox width is negative', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ assetId: 'asset_1' })],
        annotationSets: [
          makeAnnotationSet({
            annotations: [
              makeAnnotation({ geometryJson: { x: 10, y: 10, width: -100, height: 50 } }),
            ],
          }),
        ],
      });
      expect(() => validator.validate(snapshot)).toThrow('invalid geometry');
    });

    it('throws when BBox height is negative', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ assetId: 'asset_1' })],
        annotationSets: [
          makeAnnotationSet({
            annotations: [
              makeAnnotation({ geometryJson: { x: 10, y: 10, width: 100, height: -50 } }),
            ],
          }),
        ],
      });
      expect(() => validator.validate(snapshot)).toThrow('invalid geometry');
    });

    it('throws when geometry JSON is not a valid BBox', () => {
      const snapshot = makeSnapshot({
        assets: [makeAsset({ assetId: 'asset_1' })],
        annotationSets: [
          makeAnnotationSet({
            annotations: [
              makeAnnotation({
                geometryJson: { x: 'bad', y: 0, width: 100, height: 100 } as unknown as object,
              }),
            ],
          }),
        ],
      });
      expect(() => validator.validate(snapshot)).toThrow('invalid geometry');
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
            annotations: [makeAnnotation({ assetId: 'asset_video', type: 'BBOX' })],
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
            annotations: [
              makeAnnotation({
                assetId: 'asset_1',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 100, height: 100 },
              }),
            ],
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
