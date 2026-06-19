import { Module } from '@nestjs/common';
import { DocumentFilesController } from './document-files.controller';
import { DocumentFilesService } from './document-files.service';
import { DocumentPreExportService } from './document-pre-export.service';
import { DocumentPdfController } from './document-pdf.controller';
import { DocumentPdfService } from './document-pdf.service';
import { DocumentRendererController } from './document-renderer.controller';
import { DocumentRendererService } from './document-renderer.service';
import { DocumentReviewQueueController } from './document-review-queue.controller';
import { DocumentReviewQueueService } from './document-review-queue.service';
import { DocumentReviewsController } from './document-reviews.controller';
import { DocumentReviewsService } from './document-reviews.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [
    DocumentsController,
    DocumentReviewsController,
    DocumentRendererController,
    DocumentFilesController,
    DocumentPdfController,
    DocumentReviewQueueController,
  ],
  providers: [
    DocumentsService,
    DocumentReviewsService,
    DocumentRendererService,
    DocumentFilesService,
    DocumentPreExportService,
    DocumentPdfService,
    DocumentReviewQueueService,
  ],
})
export class DocumentsModule {}
