import { describe, expect, it } from 'vitest';
import {
  AnnotationSaveQueueItemSchema,
  AnnotationWorkspaceResponseSchema,
  CreateAnnotationRequestSchema,
  UpdateAnnotationRequestSchema,
} from '../annotations';

describe('annotation contracts', () => {
  it('validates create requests with image-coordinate bbox geometry', () => {
    expect(
      CreateAnnotationRequestSchema.parse({
        assetId: 'asset_frame_1482',
        labelClassId: 'label_car',
        geometry: { x: 318, y: 284, width: 344, height: 188 },
      })
    ).toMatchObject({
      assetId: 'asset_frame_1482',
      geometry: { x: 318, y: 284, width: 344, height: 188 },
    });
  });

  it('rejects empty update bodies so queue patches stay explicit', () => {
    expect(() => UpdateAnnotationRequestSchema.parse({})).toThrow('labelClassId or geometry');
  });

  it('describes an annotation workspace with set, asset, labels, and boxes', () => {
    expect(
      AnnotationWorkspaceResponseSchema.parse({
        annotationSet: {
          id: 'annset_1',
          datasetVersionId: 'version_1',
          name: 'Manual QA Set',
          status: 'DRAFT',
          createdAt: '2026-04-28T12:00:00.000Z',
        },
        asset: {
          id: 'asset_frame_1482',
          name: 'north-gate-frame-1482.jpg',
          type: 'IMAGE',
          width: 1920,
          height: 1080,
          split: 'TRAIN',
          status: 'indexed',
        },
        labels: [
          {
            id: 'label_car',
            projectId: 'proj_parking_lot',
            name: 'car',
            color: '#6ad9a1',
            type: 'BBOX',
          },
        ],
        annotations: [
          {
            id: 'ann_01',
            annotationSetId: 'annset_1',
            assetId: 'asset_frame_1482',
            labelClassId: 'label_car',
            label: 'car',
            color: '#6ad9a1',
            type: 'BBOX',
            geometry: { x: 318, y: 284, width: 344, height: 188 },
            source: 'MANUAL',
            confidence: null,
            createdAt: '2026-04-28T12:00:00.000Z',
            updatedAt: '2026-04-28T12:00:00.000Z',
          },
        ],
        imageWidth: 1920,
        imageHeight: 1080,
      }).annotations
    ).toHaveLength(1);
  });

  it('models queued save operations for frontend sync state', () => {
    expect(
      AnnotationSaveQueueItemSchema.parse({
        id: 'queue_1',
        status: 'queued',
        operation: {
          kind: 'delete',
          annotationId: 'ann_01',
        },
      })
    ).toMatchObject({
      status: 'queued',
      operation: { kind: 'delete' },
    });
  });
});
