import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { STORAGE_REPOSITORY } from '../../config/provider-tokens';
import { DependencyHealthDto } from '../dto/health-response.dto';

@Injectable()
export class MinioHealthService {
  private readonly bucket: string;

  constructor(
    @Inject(STORAGE_REPOSITORY)
    private readonly storage: {
      listBuckets(): Promise<void>;
      bucketExists?(name: string): Promise<boolean>;
    }
  ) {
    this.bucket = process.env.MINIO_BUCKET ?? 'visionflow-artifacts';
  }

  async check(timeoutMs = 5000): Promise<DependencyHealthDto> {
    const start = Date.now();
    try {
      await Promise.race([
        this.storage.listBuckets(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        ),
      ]);

      if (typeof this.storage.bucketExists === 'function') {
        await Promise.race([
          this.storage.bucketExists(this.bucket),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Bucket check timeout')), timeoutMs)
          ),
        ]);
      }

      return { status: 'up', responseTimeMs: Date.now() - start };
    } catch (err) {
      return {
        status: 'down',
        responseTimeMs: Date.now() - start,
        details: { error: (err as Error).message },
      };
    }
  }
}
