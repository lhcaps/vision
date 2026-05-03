import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  CocoDatasetSchema,
  CocoExportResponseSchema,
  CocoInfoSchema,
  CocoImageSchema,
  CocoCategorySchema,
  CocoAnnotationSchema,
  CocoExportMetadataSchema,
} from '@visionflow/contracts';

describe('CocoExport contracts', () => {
  describe('CocoInfoSchema', () => {
    it('parses valid info', () => {
      const info = {
        description: 'VisionFlow COCO export',
        version: '1.0',
        year: 2026,
        date_created: '2026-05-04T00:00:00.000Z',
      };
      expect(CocoInfoSchema.parse(info)).toEqual(info);
    });

    it('rejects missing description', () => {
      const info = { version: '1.0', year: 2026, date_created: '2026-05-04T00:00:00.000Z' };
      expect(() => CocoInfoSchema.parse(info)).toThrow();
    });
  });

  describe('CocoImageSchema', () => {
    it('parses valid image', () => {
      const img = { id: 1, file_name: 'projects/p1/originals/abc.jpg', width: 1920, height: 1080 };
      expect(CocoImageSchema.parse(img)).toEqual(img);
    });

    it('rejects zero width', () => {
      const img = { id: 1, file_name: 'test.jpg', width: 0, height: 1080 };
      expect(() => CocoImageSchema.parse(img)).toThrow();
    });

    it('rejects negative width', () => {
      const img = { id: 1, file_name: 'test.jpg', width: -100, height: 1080 };
      expect(() => CocoImageSchema.parse(img)).toThrow();
    });
  });

  describe('CocoCategorySchema', () => {
    it('parses valid category', () => {
      const cat = { id: 1, name: 'car', supercategory: 'object' };
      expect(CocoCategorySchema.parse(cat)).toEqual(cat);
    });

    it('parses category without supercategory', () => {
      const cat = { id: 1, name: 'car' };
      expect(CocoCategorySchema.parse(cat)).toEqual(cat);
    });
  });

  describe('CocoAnnotationSchema', () => {
    it('parses valid annotation', () => {
      const ann = {
        id: 1,
        image_id: 1,
        category_id: 1,
        bbox: [10, 20, 100, 200],
        area: 20000,
        iscrowd: 0,
      };
      expect(CocoAnnotationSchema.parse(ann)).toEqual(ann);
    });

    it('rejects iscrowd > 0', () => {
      const ann = {
        id: 1,
        image_id: 1,
        category_id: 1,
        bbox: [10, 20, 100, 200],
        area: 20000,
        iscrowd: 1,
      };
      expect(() => CocoAnnotationSchema.parse(ann)).toThrow();
    });

    it('rejects non-4-element bbox', () => {
      const ann = {
        id: 1,
        image_id: 1,
        category_id: 1,
        bbox: [10, 20, 100],
        area: 20000,
        iscrowd: 0,
      };
      expect(() => CocoAnnotationSchema.parse(ann)).toThrow();
    });
  });

  describe('CocoDatasetSchema', () => {
    it('parses valid minimal COCO dataset', () => {
      const coco = {
        info: {
          description: 'test',
          version: '1.0',
          year: 2026,
          date_created: '2026-05-04T00:00:00.000Z',
        },
        images: [{ id: 1, file_name: 'test.jpg', width: 1920, height: 1080 }],
        annotations: [],
        categories: [{ id: 1, name: 'car', supercategory: 'object' }],
      };
      expect(CocoDatasetSchema.parse(coco)).toEqual(coco);
    });

    it('rejects images array with zero elements', () => {
      const coco = {
        info: {
          description: 'test',
          version: '1.0',
          year: 2026,
          date_created: '2026-05-04T00:00:00.000Z',
        },
        images: [],
        annotations: [],
        categories: [{ id: 1, name: 'car' }],
      };
      expect(() => CocoDatasetSchema.parse(coco)).toThrow();
    });

    it('rejects categories array with zero elements', () => {
      const coco = {
        info: {
          description: 'test',
          version: '1.0',
          year: 2026,
          date_created: '2026-05-04T00:00:00.000Z',
        },
        images: [{ id: 1, file_name: 'test.jpg', width: 1920, height: 1080 }],
        annotations: [],
        categories: [],
      };
      expect(() => CocoDatasetSchema.parse(coco)).toThrow();
    });
  });

  describe('CocoExportResponseSchema', () => {
    it('parses full export response with metadata', () => {
      const hash = createHash('sha256').update('test').digest('hex');
      const response = {
        info: {
          description: 'VisionFlow COCO export',
          version: '1.0',
          year: 2026,
          date_created: '2026-05-04T00:00:00.000Z',
        },
        images: [{ id: 1, file_name: 'projects/p1/originals/abc.jpg', width: 1920, height: 1080 }],
        annotations: [
          {
            id: 1,
            image_id: 1,
            category_id: 1,
            bbox: [100, 100, 200, 150],
            area: 30000,
            iscrowd: 0,
          },
        ],
        categories: [{ id: 1, name: 'car', supercategory: 'object' }],
        metadata: {
          projectId: 'proj_parking_lot',
          datasetId: 'ds_1',
          datasetVersionId: 'version_1',
          datasetVersion: 1,
          status: 'LOCKED',
          assetCount: 1,
          annotationCount: 1,
          categoryCount: 1,
          splits: { TRAIN: 1, VALID: 0, TEST: 0, UNASSIGNED: 0 },
          deterministicHash: hash,
        },
      };
      expect(CocoExportResponseSchema.parse(response)).toEqual(response);
    });

    it('rejects non-LOCKED status in metadata', () => {
      const response = {
        info: {
          description: 'test',
          version: '1.0',
          year: 2026,
          date_created: '2026-05-04T00:00:00.000Z',
        },
        images: [{ id: 1, file_name: 'test.jpg', width: 1920, height: 1080 }],
        annotations: [],
        categories: [{ id: 1, name: 'car' }],
        metadata: {
          projectId: 'p1',
          datasetId: 'd1',
          datasetVersionId: 'v1',
          datasetVersion: 1,
          status: 'DRAFT' as const,
          assetCount: 1,
          annotationCount: 0,
          categoryCount: 1,
          splits: { TRAIN: 1, VALID: 0, TEST: 0, UNASSIGNED: 0 },
          deterministicHash: 'abc123',
        },
      };
      expect(() => CocoExportResponseSchema.parse(response)).toThrow();
    });
  });
});
