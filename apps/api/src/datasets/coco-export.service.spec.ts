import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CocoExportService } from './coco-export.service';
import type { DatasetRepository, VersionSnapshot } from '../repositories/dataset.repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSnapshot(
  overrides?: Partial<Pick<VersionSnapshot, 'status' | 'assets' | 'annotationSets'>> &
    Record<string, any>
): VersionSnapshot {
  const o = overrides ?? ({} as any);
  const assets: VersionSnapshot['assets'] = o.assets ?? [
    {
      assetId: 'asset_a',
      split: 'TRAIN',
      asset: {
        id: 'asset_a',
        type: 'IMAGE',
        storageKey: 'projects/p/originals/a.jpg',
        width: 1920,
        height: 1080,
      },
    },
  ];
  const annotationSets: VersionSnapshot['annotationSets'] = o.annotationSets ?? [
    {
      id: 'set_1',
      annotations: [
        {
          id: 'ann_1',
          assetId: 'asset_a',
          labelClassId: 'label_car',
          labelName: 'car',
          type: 'BBOX',
          geometryJson: { x: 10, y: 10, width: 100, height: 80 },
        },
        {
          id: 'ann_2',
          assetId: 'asset_a',
          labelClassId: 'label_person',
          labelName: 'person',
          type: 'BBOX',
          geometryJson: { x: 200, y: 300, width: 50, height: 120 },
        },
      ],
    },
  ];
  return {
    id: 'version_1',
    datasetId: 'dataset_1',
    version: 1,
    status: o.status ?? 'LOCKED',
    assets,
    annotationSets,
  } as VersionSnapshot;
}

describe('CocoExportService', () => {
  let repo: DatasetRepository;
  let service: CocoExportService;

  beforeEach(() => {
    repo = {
      getVersionSnapshot: vi.fn(),
    } as unknown as DatasetRepository;
    service = new CocoExportService(repo);
  });

  describe('rejects non-LOCKED versions', () => {
    it('throws NotFoundException when version not found', async () => {
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(null);
      await expect(service.exportCoco('proj', 'v1')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when version is DRAFT', async () => {
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(makeSnapshot({ status: 'DRAFT' }));
      await expect(service.exportCoco('proj', 'v1')).rejects.toThrow(ConflictException);
      await expect(service.exportCoco('proj', 'v1')).rejects.toThrow(
        'requires a locked dataset version'
      );
    });

    it('throws ConflictException when version is ARCHIVED', async () => {
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(makeSnapshot({ status: 'ARCHIVED' }));
      await expect(service.exportCoco('proj', 'v1')).rejects.toThrow(ConflictException);
    });
  });

  describe('rejects versions with no exportable assets', () => {
    it('throws when version has no assets', async () => {
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(makeSnapshot({ assets: [] }));
      await expect(service.exportCoco('proj', 'v1')).rejects.toThrow(ConflictException);
      await expect(service.exportCoco('proj', 'v1')).rejects.toThrow('no exportable image assets');
    });

    it('throws when all assets are VIDEO type', async () => {
      const snapshot = makeSnapshot({
        assets: [
          {
            assetId: 'video_1',
            split: 'TRAIN',
            asset: {
              id: 'video_1',
              type: 'VIDEO',
              storageKey: 'p/orig/v1.mp4',
              width: null,
              height: null,
            },
          },
        ],
      });
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(snapshot);
      await expect(service.exportCoco('proj', 'v1')).rejects.toThrow(ConflictException);
    });

    it('throws when assets have null dimensions', async () => {
      const snapshot = makeSnapshot({
        assets: [
          {
            assetId: 'asset_bad',
            split: 'TRAIN',
            asset: {
              id: 'asset_bad',
              type: 'IMAGE',
              storageKey: 'p/orig/bad.jpg',
              width: null,
              height: null,
            },
          },
        ],
      });
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(snapshot);
      await expect(service.exportCoco('proj', 'v1')).rejects.toThrow(ConflictException);
    });
  });

  describe('exports valid COCO JSON', () => {
    it('exports with correct image fields', async () => {
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(makeSnapshot());
      const result = await service.exportCoco('proj', 'version_1');
      expect(result.images).toHaveLength(1);
      expect(result.images[0]).toMatchObject({
        file_name: 'projects/p/originals/a.jpg',
        width: 1920,
        height: 1080,
      });
    });

    it('uses labelName as category name, not labelClassId', async () => {
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(makeSnapshot());
      const result = await service.exportCoco('proj', 'version_1');
      const categoryNames = result.categories.map((c) => c.name).sort();
      expect(categoryNames).toEqual(['car', 'person']);
      // Verify names are semantic labels, not IDs
      expect(categoryNames).not.toContain('label_car');
      expect(categoryNames).not.toContain('label_person');
    });

    it('excludes annotations for assets outside the dataset version', async () => {
      const snapshot = makeSnapshot({
        annotationSets: [
          {
            id: 'set_1',
            annotations: [
              {
                id: 'ann_outside',
                assetId: 'asset_not_in_version',
                labelClassId: 'label_car',
                labelName: 'car',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 10, height: 10 },
              },
              {
                id: 'ann_inside',
                assetId: 'asset_a',
                labelClassId: 'label_car',
                labelName: 'car',
                type: 'BBOX',
                geometryJson: { x: 10, y: 10, width: 100, height: 80 },
              },
            ],
          },
        ],
      });
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(snapshot);
      const result = await service.exportCoco('proj', 'version_1');
      // Only annotation for asset_a (which is in the version) should be exported
      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].image_id).toBe(result.images[0].id);
    });

    it('produces identical deterministicHash across repeated calls', async () => {
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(makeSnapshot());
      const first = await service.exportCoco('proj', 'version_1');
      const second = await service.exportCoco('proj', 'version_1');
      expect(first.metadata.deterministicHash).toBe(second.metadata.deterministicHash);
    });
  });

  describe('deterministic ordering', () => {
    it('assigns COCO IDs sequentially starting at 1', async () => {
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(makeSnapshot());
      const result = await service.exportCoco('proj', 'version_1');
      expect(result.images[0].id).toBe(1);
      expect(result.categories[0].id).toBe(1);
      expect(result.annotations[0].id).toBe(1);
    });

    it('sorts images by split order TRAIN > VALID > TEST', async () => {
      const snapshot = makeSnapshot({
        assets: [
          {
            assetId: 't',
            split: 'TEST',
            asset: {
              id: 't',
              type: 'IMAGE',
              storageKey: 'projects/p/originals/t.jpg',
              width: 1920,
              height: 1080,
            },
          },
          {
            assetId: 'v',
            split: 'VALID',
            asset: {
              id: 'v',
              type: 'IMAGE',
              storageKey: 'projects/p/originals/v.jpg',
              width: 1920,
              height: 1080,
            },
          },
          {
            assetId: 'a',
            split: 'TRAIN',
            asset: {
              id: 'a',
              type: 'IMAGE',
              storageKey: 'projects/p/originals/a.jpg',
              width: 1920,
              height: 1080,
            },
          },
        ],
      });
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(snapshot);
      const result = await service.exportCoco('proj', 'version_1');
      // TRAIN should come first, then VALID, then TEST
      expect(result.images.map((img) => img.file_name)).toEqual([
        'projects/p/originals/a.jpg',
        'projects/p/originals/v.jpg',
        'projects/p/originals/t.jpg',
      ]);
    });

    it('sorts categories by name asc, then labelClassId asc', async () => {
      const snapshot = makeSnapshot({
        annotationSets: [
          {
            id: 'set_1',
            annotations: [
              {
                id: 'z_ann',
                assetId: 'asset_a',
                labelClassId: 'label_zebra',
                labelName: 'zebra',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 50, height: 50 },
              },
              {
                id: 'a_ann',
                assetId: 'asset_a',
                labelClassId: 'label_apple',
                labelName: 'apple',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 50, height: 50 },
              },
              {
                id: 'b_ann',
                assetId: 'asset_a',
                labelClassId: 'label_banana',
                labelName: 'banana',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 50, height: 50 },
              },
            ],
          },
        ],
      });
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(snapshot);
      const result = await service.exportCoco('proj', 'version_1');
      const names = result.categories.map((c) => c.name);
      expect(names).toEqual(['apple', 'banana', 'zebra']);
    });

    it('sorts annotations by image_id asc, then category_id asc, then annotation id asc', async () => {
      // Create a snapshot with 2 images and 2 annotations per image for different categories
      const snapshot: VersionSnapshot = {
        id: 'v1',
        datasetId: 'd1',
        version: 1,
        status: 'LOCKED',
        assets: [
          {
            assetId: 'img_b',
            split: 'TRAIN',
            asset: { id: 'img_b', type: 'IMAGE', storageKey: 'p/o/b.jpg', width: 100, height: 100 },
          },
          {
            assetId: 'img_a',
            split: 'TRAIN',
            asset: { id: 'img_a', type: 'IMAGE', storageKey: 'p/o/a.jpg', width: 100, height: 100 },
          },
        ],
        annotationSets: [
          {
            id: 'set_1',
            annotations: [
              // Annotations in reverse order to prove sorting works
              {
                id: 'ann_4',
                assetId: 'img_a',
                labelClassId: 'label_dog',
                labelName: 'dog',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 10, height: 10 },
              },
              {
                id: 'ann_3',
                assetId: 'img_a',
                labelClassId: 'label_cat',
                labelName: 'cat',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 10, height: 10 },
              },
              {
                id: 'ann_2',
                assetId: 'img_b',
                labelClassId: 'label_dog',
                labelName: 'dog',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 10, height: 10 },
              },
              {
                id: 'ann_1',
                assetId: 'img_b',
                labelClassId: 'label_cat',
                labelName: 'cat',
                type: 'BBOX',
                geometryJson: { x: 0, y: 0, width: 10, height: 10 },
              },
            ],
          },
        ],
      };
      vi.mocked(repo.getVersionSnapshot).mockResolvedValue(snapshot);
      const result = await service.exportCoco('proj', 'v1');
      // After sort: img_a first (a.jpg), then img_b (b.jpg). Within each image, cat < dog (by name).
      expect(result.annotations.map((a) => a.image_id)).toEqual([1, 1, 2, 2]);
      expect(result.annotations.map((a) => a.category_id)).toEqual([1, 2, 1, 2]);
      expect(result.annotations.map((a) => a.id)).toEqual([1, 2, 3, 4]);
    });
  });
});
