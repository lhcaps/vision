import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { DatasetsService } from './datasets.service';

describe('DatasetsService memory fallback', () => {
  let service: DatasetsService;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    service = new DatasetsService({} as PrismaService);
  });

  it('lists a seeded demo dataset with timeline versions', async () => {
    const datasets = await service.listDatasets('proj_parking_lot');
    const versions = await service.listVersions('proj_parking_lot', datasets[0].id);

    expect(datasets[0]).toMatchObject({
      name: 'Parking Lot Dataset',
      versionCount: 4,
      lockedVersionCount: 3,
      draftVersionCount: 1,
    });
    expect(versions[0]).toMatchObject({
      label: 'v4',
      status: 'DRAFT',
    });
  });

  it('creates a draft version and computes split summaries after assignment', async () => {
    const [dataset] = await service.listDatasets('proj_parking_lot');
    const version = await service.createVersion('proj_parking_lot', dataset.id, {
      parentVersionId: null,
    });
    const assigned = await service.assignAssets('proj_parking_lot', version.id, {
      assets: [
        { assetId: 'asset_new_train', split: 'TRAIN' },
        { assetId: 'asset_new_valid', split: 'VALID' },
      ],
    });

    expect(assigned.status).toBe('DRAFT');
    expect(assigned.assetCount).toBe(2);
    expect(assigned.splitSummary).toEqual({
      TRAIN: 1,
      VALID: 1,
      TEST: 0,
      UNASSIGNED: 0,
    });
  });

  it('rejects assigning the same asset twice to one version', async () => {
    const [dataset] = await service.listDatasets('proj_parking_lot');
    const version = await service.createVersion('proj_parking_lot', dataset.id, {});

    await service.assignAssets('proj_parking_lot', version.id, {
      assets: [{ assetId: 'asset_repeat', split: 'TRAIN' }],
    });

    await expect(
      service.assignAssets('proj_parking_lot', version.id, {
        assets: [{ assetId: 'asset_repeat', split: 'VALID' }],
      })
    ).rejects.toThrow(ConflictException);
  });

  it('rejects assigning assets to a locked version', async () => {
    const [dataset] = await service.listDatasets('proj_parking_lot');
    const version = await service.createVersion('proj_parking_lot', dataset.id, {});

    await service.lockVersion('proj_parking_lot', version.id);

    await expect(
      service.assignAssets('proj_parking_lot', version.id, {
        assets: [{ assetId: 'asset_after_lock', split: 'TEST' }],
      })
    ).rejects.toThrow('Version is locked');
  });
});
