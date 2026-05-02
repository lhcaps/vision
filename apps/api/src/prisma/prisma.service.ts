import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../common/logging/structured-logger';
import { isDatabaseMode } from '../config/app-mode';

const logger = createLogger('prisma');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    // @ts-expect-error - Prisma $on event typing is incompatible with strict mode; event shape is stable.
    this.$on('warn', (event: { message: string; tags?: string[] }) => {
      logger.warn({ prismaTags: event.tags ?? [] }, `Prisma warning: ${event.message}`);
    });

    // @ts-expect-error - Prisma $on event typing is incompatible with strict mode; event shape is stable.
    this.$on('error', (event: { message: string; tags?: string[] }) => {
      logger.error({ prismaTags: event.tags ?? [] }, `Prisma error: ${event.message}`);
    });
  }

  async onModuleInit() {
    if (isDatabaseMode()) {
      await this.$connect();
    } else {
      logger.info('Skipping Prisma connection — running in memory mode');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
