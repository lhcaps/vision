import { Injectable, Logger } from '@nestjs/common';
import type {
  ContractDocumentRendererPort,
  DocumentRenderCommand,
  DocumentRenderResult,
} from '../application/document-renderer.ports';
import { ContractShadowRendererOrchestrator } from '../application/contract-shadow-renderer.orchestrator';

@Injectable()
export class ContractDocumentRendererAdapter implements ContractDocumentRendererPort {
  private readonly logger = new Logger(ContractDocumentRendererAdapter.name);

  constructor(
    private readonly shadowOrchestrator: ContractShadowRendererOrchestrator,
  ) {}

  async renderActive(
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _command: DocumentRenderCommand,
  ): Promise<DocumentRenderResult> {
    throw new Error(
      'Contract active render is not enabled for BM-001 in D.2.2. ' +
        'Set DOCUMENT_RENDERER_MODE=active after D.2.3 criteria are met.',
    );
  }

  async renderShadow(
    _command: DocumentRenderCommand,
    _legacyResult: DocumentRenderResult,
  ): Promise<void> {
    await this.shadowOrchestrator.renderShadow(_command, _legacyResult);
  }
}
