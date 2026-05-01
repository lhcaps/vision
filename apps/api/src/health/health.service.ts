import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PostgresHealthService } from './services/postgres-health.service';
import { RedisHealthService } from './services/redis-health.service';
import { MinioHealthService } from './services/minio-health.service';
import { CvWorkerHealthService } from './services/cv-worker-health.service';
import {
  HealthResponseDto,
  DependencyHealthDto,
} from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly postgresHealth: PostgresHealthService,
    private readonly redisHealth: RedisHealthService,
    private readonly minioHealth: MinioHealthService,
    private readonly cvWorkerHealth: CvWorkerHealthService,
  ) {}

  async deepCheck(): Promise<HealthResponseDto> {
    const [postgres, redis, minio, cvWorker] = await Promise.all([
      this.postgresHealth.check(),
      this.redisHealth.check(),
      this.minioHealth.check(),
      this.cvWorkerHealth.check(),
    ]);

    const allUp = [postgres, redis, minio, cvWorker].every(
      (d: DependencyHealthDto) => d.status === 'up',
    );

    const response: HealthResponseDto = {
      status: allUp ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? '0.0.0',
      dependencies: { postgres, redis, minio, cvWorker },
    };

    if (!allUp) {
      throw new ServiceUnavailableException(response);
    }
    return response;
  }
}
