import { Module } from '@nestjs/common';
import { FileExtractionService } from './file-extraction.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { ImportStorageService } from './import-storage.service';

@Module({
  controllers: [ImportsController],
  providers: [ImportsService, ImportStorageService, FileExtractionService],
})
export class ImportsModule {}
