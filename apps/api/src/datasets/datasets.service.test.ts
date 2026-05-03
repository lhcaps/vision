import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { DatasetsService } from './datasets.service';
import { MemoryDatasetRepository } from '../repositories/dataset.memory';

describe('DatasetsService memory fallback', () => {
  let service: DatasetsService;
  let repo: MemoryDatasetRepository;

  beforeEach(() => {
    repo = new MemoryDatasetRepository();
    service = new DatasetsService(repo);
  });

  it('creates a dataset and lists it', async () => {
    const created = await service.createDataset('proj_test', { name: 'Test Dataset' });
    expect(created.name).toBe('Test Dataset');

    const datasets = await service.listDatasets('proj_test');
    expect(datasets).toHaveLength(1);
    expect(datasets[0].name).toBe('Test Dataset');
  });

  it('creates a draft version', async () => {
    const created = await service.createDataset('proj_test', { name: 'Test Dataset' });
    const version = await service.createVersion('proj_test', created.id, { parentVersionId: null });

    expect(version.status).toBe('DRAFT');
    expect(version.label).toBe('v1');

    const versions = await service.listVersions('proj_test', created.id);
    expect(versions).toHaveLength(1);
  });

  it('rejects assigning assets to a locked version', async () => {
    const created = await service.createDataset('proj_test', { name: 'Test Dataset' });
    const version = await service.createVersion('proj_test', created.id, {});

    // Memory repo does not validate asset readiness — lock succeeds with no assets
    const locked = await service.lockVersion('proj_test', version.id);
    expect(locked.status).toBe('LOCKED');

    // Asset assignment after lock must be rejected
    await expect(
      service.assignAssets('proj_test', version.id, {
        assets: [{ assetId: 'asset_after_lock', split: 'TEST' }],
      })
    ).rejects.toThrow('immutable once');
  });
});
