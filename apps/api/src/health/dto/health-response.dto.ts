export class DependencyHealthDto {
  status!: 'up' | 'down';
  responseTimeMs!: number;
  details?: Record<string, unknown>;
}

export class HealthResponseDto {
  status!: 'healthy' | 'unhealthy';
  timestamp!: string;
  uptimeSeconds!: number;
  version!: string;
  dependencies!: {
    postgres: DependencyHealthDto;
    redis: DependencyHealthDto;
    minio: DependencyHealthDto;
    cvWorker: DependencyHealthDto;
  };
}

export class LivenessResponseDto {
  status!: 'ok';
  timestamp!: string;
  uptimeSeconds!: number;
}
