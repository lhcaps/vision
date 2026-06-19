import { Injectable } from '@nestjs/common';
import { DocumentRendererService } from '../../document-renderer.service';
import type {
  DocumentRenderCommand,
  DocumentRenderResult,
  LegacyDocumentRendererPort,
} from '../application/document-renderer.ports';

@Injectable()
export class LegacyDocumentRendererAdapter implements LegacyDocumentRendererPort {
  constructor(private readonly renderer: DocumentRendererService) {}

  async render(command: DocumentRenderCommand): Promise<DocumentRenderResult> {
    return this.renderer.renderDocx(
      command.documentId,
      command.options,
      command.actor,
    ) as Promise<DocumentRenderResult>;
  }
}
