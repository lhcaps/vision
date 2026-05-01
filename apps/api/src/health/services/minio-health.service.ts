import { Injectable } from '@nestjs/common';
import { StorageRepository } from '../../repositories/storage.repository';
import { DependencyHealthDto } from '../dto/health-response.dto';

@Injectable()
export class MinioHealthService {
  constructor(private readonly storage: StorageRepository) {}

  async check(timeoutMs = 5000): Promise<DependencyHealthDto> {
    const start = Date.now();
    try {
      await Promise.race([
        this.storage.listBuckets(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs),
        ),
      ]);
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
