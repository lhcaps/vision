import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DependencyHealthDto } from '../dto/health-response.dto';

@Injectable()
export class PostgresHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(timeoutMs = 5000): Promise<DependencyHealthDto> {
    const start = Date.now();
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
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
