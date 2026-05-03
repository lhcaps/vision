import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { AnnotationsService } from './annotations.service';
import type { DatasetRepository } from '../repositories/dataset.repository';

const mockDatasetRepo: DatasetRepository = {
  getVersionStatusByAnnotationSet: async () => null,
} as unknown as DatasetRepository;

describe('AnnotationsService memory fallback', () => {
  let service: AnnotationsService;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    service = new AnnotationsService({} as PrismaService, mockDatasetRepo);
  });

  it('loads a seeded annotation workspace with default labels', async () => {
    const workspace = await service.loadWorkspace(
      'proj_parking_lot',
      'dataset_proj_parking_lot_parking_v3',
      'asset_frame_1482'
    );

    expect(workspace.labels).toContainEqual(
      expect.objectContaining({ name: 'car', color: '#6ad9a1' })
    );
    expect(workspace.labels).toContainEqual(
      expect.objectContaining({ name: 'person', color: '#f07178' })
    );
    expect(workspace.annotationSet).toHaveProperty('id');
  });

  it('creates an annotation and retrieves it', async () => {
    const workspace = await service.loadWorkspace(
      'proj_parking_lot',
      'dataset_proj_parking_lot_parking_v3',
      'asset_frame_1482'
    );

    const created = await service.createAnnotation('proj_parking_lot', workspace.annotationSet.id, {
      assetId: 'asset_frame_1482',
      labelClassId: workspace.labels[0].id,
      geometry: { x: 100, y: 100, width: 200, height: 150 },
    });

    expect(created.assetId).toBe('asset_frame_1482');
    expect(created.labelClassId).toBe(workspace.labels[0].id);
    expect(created.type).toBe('BBOX');
    expect(created.geometry).toEqual({ x: 100, y: 100, width: 200, height: 150 });
  });

  it('rejects geometry outside image bounds', async () => {
    const workspace = await service.loadWorkspace(
      'proj_parking_lot',
      'dataset_proj_parking_lot_parking_v3',
      'asset_frame_1482'
    );

    await expect(
      service.createAnnotation('proj_parking_lot', workspace.annotationSet.id, {
        assetId: 'asset_frame_1482',
        labelClassId: workspace.labels[0].id,
        geometry: { x: 5000, y: 5000, width: 10, height: 10 },
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('deletes an annotation', async () => {
    const workspace = await service.loadWorkspace(
      'proj_parking_lot',
      'dataset_proj_parking_lot_parking_v3',
      'asset_frame_1482'
    );

    const created = await service.createAnnotation('proj_parking_lot', workspace.annotationSet.id, {
      assetId: 'asset_frame_1482',
      labelClassId: workspace.labels[0].id,
      geometry: { x: 10, y: 10, width: 50, height: 50 },
    });

    const result = await service.deleteAnnotation('proj_parking_lot', created.id);
    expect(result.deletedId).toBe(created.id);
  });
});
