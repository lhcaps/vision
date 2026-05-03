import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaProcessingService } from './media-processing.service';
import { MediaCvWorkerClient } from './media-cv-worker.client';
import { MediaStorageService } from './media-storage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { detectMode, isDatabaseMode } from '../config/app-mode';
import {
  PrismaMediaRepository,
  MemoryMediaRepository,
} from '../repositories/media.repository.impl';
import { MinioStorageRepository } from '../repositories/storage.impl';
import { LocalStorageRepository } from '../repositories/storage.local';
import { APP_MODE, MEDIA_REPOSITORY, STORAGE_REPOSITORY } from '../config/provider-tokens';

const useDatabase = isDatabaseMode();

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [
    // Bootstrap: detect mode and provide concrete implementations
    { provide: APP_MODE, useValue: useDatabase ? 'production' : 'demo' },
    {
      provide: STORAGE_REPOSITORY,
      useClass: useDatabase ? MinioStorageRepository : LocalStorageRepository,
    },
    {
      provide: MEDIA_REPOSITORY,
      useClass: useDatabase ? PrismaMediaRepository : MemoryMediaRepository,
    },
    // Concrete implementations available for direct injection where needed
    MediaStorageService,
    MinioStorageRepository,
    LocalStorageRepository,
    PrismaMediaRepository,
    MemoryMediaRepository,
    // Worker clients
    MediaCvWorkerClient,
    // Media processing (BullMQ consumer)
    MediaProcessingService,
    // Services
    MediaService,
  ],
  exports: [MediaService, MediaProcessingService, MEDIA_REPOSITORY, STORAGE_REPOSITORY, APP_MODE],
})
export class MediaModule {}
