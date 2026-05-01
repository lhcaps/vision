import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AnnotationsModule } from './annotations/annotations.module';
import { DatasetsModule } from './datasets/datasets.module';
import { HealthModule } from './health/health.module';
import { InferenceModule } from './inference/inference.module';
import { MediaModule } from './media/media.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    HealthModule,
    ProjectsModule,
    MediaModule,
    DatasetsModule,
    AnnotationsModule,
    PipelinesModule,
    InferenceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
