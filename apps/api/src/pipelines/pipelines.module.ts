import { Module } from '@nestjs/common';
import { PipelinesController } from './pipelines.controller';
import { PipelinesService } from './pipelines.service';
import { PrismaModule } from '../prisma/prisma.module';
import { isDatabaseMode } from '../config/app-mode';
import {
  PrismaPipelineRepository,
  MemoryPipelineRepository,
} from '../repositories/pipeline.repository.impl';
import { PIPELINE_REPOSITORY } from '../config/provider-tokens';

const useDatabase = isDatabaseMode();

@Module({
  imports: [PrismaModule],
  controllers: [PipelinesController],
  providers: [
    {
      provide: PIPELINE_REPOSITORY,
      useClass: useDatabase ? PrismaPipelineRepository : MemoryPipelineRepository,
    },
    PipelinesService,
  ],
  exports: [PipelinesService, PIPELINE_REPOSITORY],
})
export class PipelinesModule {}
