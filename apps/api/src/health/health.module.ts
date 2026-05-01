import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PostgresHealthService } from './services/postgres-health.service';
import { RedisHealthService } from './services/redis-health.service';
import { MinioHealthService } from './services/minio-health.service';
import { CvWorkerHealthService } from './services/cv-worker-health.service';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    PostgresHealthService,
    RedisHealthService,
    MinioHealthService,
    CvWorkerHealthService,
  ],
  exports: [HealthService],
})
export class HealthModule {}
