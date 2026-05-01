import { Injectable, Module } from '@nestjs/common';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { PrismaModule } from '../prisma/prisma.module';
import { detectMode } from '../config/app-mode';
import { PrismaDatasetRepository } from '../repositories/dataset.repository.impl';
import { MemoryDatasetRepository } from '../repositories/dataset.memory';
import { DATASET_REPOSITORY } from '../config/provider-tokens';

const mode = detectMode();

@Module({
  imports: [PrismaModule],
  controllers: [DatasetsController],
  providers: [
    {
      provide: DATASET_REPOSITORY,
      useClass: mode === 'production' ? PrismaDatasetRepository : MemoryDatasetRepository,
    },
    DatasetsService,
  ],
  exports: [DatasetsService, DATASET_REPOSITORY],
})
export class DatasetsModule {}
