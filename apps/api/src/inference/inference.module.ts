import { Module } from '@nestjs/common';
import { DatasetsModule } from '../datasets/datasets.module';
import { MediaModule } from '../media/media.module';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CvWorkerClient } from './cv-worker.client';
import { EvaluationService } from './evaluation.service';
import { InferenceController } from './inference.controller';
import { InferenceService } from './inference.service';
import { isDatabaseMode } from '../config/app-mode';
import { PrismaInferenceRepository } from '../repositories/inference.prisma';
import { MemoryInferenceRepository } from '../repositories/inference.memory';
import { INFERENCE_REPOSITORY } from '../config/provider-tokens';

const useDatabase = isDatabaseMode();

@Module({
  imports: [DatasetsModule, MediaModule, PipelinesModule, PrismaModule],
  controllers: [InferenceController],
  providers: [
    {
      provide: INFERENCE_REPOSITORY,
      useClass: useDatabase ? PrismaInferenceRepository : MemoryInferenceRepository,
    },
    CvWorkerClient,
    EvaluationService,
    InferenceService,
  ],
  exports: [InferenceService, INFERENCE_REPOSITORY],
})
export class InferenceModule {}
