import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { PipelinesService } from './pipelines.service';
import { MemoryPipelineRepository } from '../repositories/pipeline.repository.impl';

describe('PipelinesService', () => {
  let service: PipelinesService;

  beforeEach(() => {
    const repo = new MemoryPipelineRepository();
    service = new PipelinesService({} as PrismaService, repo);
  });

  it('lists pipelines', async () => {
    const pipelines = await service.listPipelines('proj_parking_lot');
    expect(pipelines.length).toBeGreaterThan(0);
    expect(pipelines[0]).toHaveProperty('name');
    expect(pipelines[0]).toHaveProperty('validation');
  });
});
