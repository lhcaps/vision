import { Injectable, Module } from '@nestjs/common';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { DatasetLockValidator } from './dataset-lock.validator';
import { CocoExportService } from './coco-export.service';
import { PrismaModule } from '../prisma/prisma.module';
import { isDatabaseMode } from '../config/app-mode';
import { PrismaDatasetRepository } from '../repositories/dataset.repository.impl';
import { MemoryDatasetRepository } from '../repositories/dataset.memory';
import { DATASET_REPOSITORY } from '../config/provider-tokens';

const useDatabase = isDatabaseMode();

@Module({
  imports: [PrismaModule],
  controllers: [DatasetsController],
  providers: [
    {
      provide: DATASET_REPOSITORY,
      useClass: useDatabase ? PrismaDatasetRepository : MemoryDatasetRepository,
    },
    DatasetsService,
    DatasetLockValidator,
    CocoExportService,
  ],
  exports: [DatasetsService, DatasetLockValidator, CocoExportService, DATASET_REPOSITORY],
})
export class DatasetsModule {}
