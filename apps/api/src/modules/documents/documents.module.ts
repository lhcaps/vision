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
import {
  CONTRACT_DOCUMENT_RENDERER,
  GENERATED_DOCUMENT_DESCRIPTOR,
  LEGACY_DOCUMENT_RENDERER,
} from './rendering/application/document-renderer.ports';
import { DocumentRendererRoutingPolicy } from './rendering/application/document-renderer-routing.policy';
import { RenderGeneratedDocumentUseCase } from './rendering/application/render-generated-document.use-case';
import { ContractRenderPlanBuilder } from './rendering/application/contract-render-plan.builder';
import { ContractShadowRendererOrchestrator } from './rendering/application/contract-shadow-renderer.orchestrator';
import { LegacyDocumentRendererAdapter } from './rendering/infrastructure/legacy-document-renderer.adapter';
import { PrismaGeneratedDocumentDescriptorRepository } from './rendering/infrastructure/prisma-generated-document-descriptor.repository';
import { ContractDocumentRendererAdapter } from './rendering/infrastructure/contract-document-renderer.adapter';
import { DocxtemplaterContractRenderEngine } from './rendering/infrastructure/docxtemplater-contract-render-engine';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';

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
    DocumentRendererRoutingPolicy,
    RenderGeneratedDocumentUseCase,
    ContractRenderPlanBuilder,
    ContractShadowRendererOrchestrator,
    DocxtemplaterContractRenderEngine,
    LegacyDocumentRendererAdapter,
    PrismaGeneratedDocumentDescriptorRepository,
    ContractDocumentRendererAdapter,
    WorkspacePathsService,
    {
      provide: LEGACY_DOCUMENT_RENDERER,
      useExisting: LegacyDocumentRendererAdapter,
    },
    {
      provide: CONTRACT_DOCUMENT_RENDERER,
      useExisting: ContractDocumentRendererAdapter,
    },
    {
      provide: GENERATED_DOCUMENT_DESCRIPTOR,
      useExisting: PrismaGeneratedDocumentDescriptorRepository,
    },
  ],
})
export class DocumentsModule {}
