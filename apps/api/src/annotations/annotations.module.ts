import { Module } from '@nestjs/common';
import { AnnotationsController } from './annotations.controller';
import { AnnotationsService } from './annotations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { isDatabaseMode } from '../config/app-mode';
import { PrismaDatasetRepository } from '../repositories/dataset.repository.impl';
import { MemoryDatasetRepository } from '../repositories/dataset.memory';
import { DATASET_REPOSITORY } from '../config/provider-tokens';

const useDatabase = isDatabaseMode();

@Module({
  imports: [PrismaModule],
  controllers: [AnnotationsController],
  providers: [
    {
      provide: DATASET_REPOSITORY,
      useClass: useDatabase ? PrismaDatasetRepository : MemoryDatasetRepository,
    },
    AnnotationsService,
  ],
  exports: [AnnotationsService],
})
export class AnnotationsModule {}
