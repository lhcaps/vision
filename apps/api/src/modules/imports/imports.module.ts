import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import { FileExtractionService } from './file-extraction.service';
import { createImportUploadStorage } from './import-upload-storage';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { ImportStorageService } from './import-storage.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [WorkspacePathsService],
      useFactory: (paths: WorkspacePathsService) => ({
        storage: createImportUploadStorage(paths),
      }),
    }),
  ],
  controllers: [ImportsController],
  providers: [ImportsService, ImportStorageService, FileExtractionService],
})
export class ImportsModule {}
