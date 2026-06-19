import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CONTRACT_DOCUMENT_RENDERER,
  GENERATED_DOCUMENT_DESCRIPTOR,
  LEGACY_DOCUMENT_RENDERER,
  type ContractDocumentRendererPort,
  type DocumentRenderCommand,
  type DocumentRenderResult,
  type GeneratedDocumentDescriptorPort,
  type LegacyDocumentRendererPort,
} from './document-renderer.ports';
import { DocumentRendererRoutingPolicy } from './document-renderer-routing.policy';
import { ContractShadowRendererOrchestrator } from './contract-shadow-renderer.orchestrator';

@Injectable()
export class RenderGeneratedDocumentUseCase {
  private readonly logger = new Logger(RenderGeneratedDocumentUseCase.name);

  constructor(
    @Inject(LEGACY_DOCUMENT_RENDERER)
    private readonly legacyRenderer: LegacyDocumentRendererPort,
    @Inject(CONTRACT_DOCUMENT_RENDERER)
    private readonly contractRenderer: ContractDocumentRendererPort,
    @Inject(GENERATED_DOCUMENT_DESCRIPTOR)
    private readonly descriptors: GeneratedDocumentDescriptorPort,
    private readonly routingPolicy: DocumentRendererRoutingPolicy,
    private readonly shadowOrchestrator: ContractShadowRendererOrchestrator,
  ) {}

  async execute(command: DocumentRenderCommand): Promise<DocumentRenderResult> {
    if (this.routingPolicy.isDisabled) {
      return this.legacyRenderer.render(command);
    }

    const descriptor = await this.descriptors.findByDocumentId(
      command.documentId,
    );
    const route = this.routingPolicy.route(descriptor.templateCode);

    if (route === 'legacy') {
      return this.legacyRenderer.render(command);
    }

    if (route === 'active') {
      return this.contractRenderer.renderActive(command);
    }

    const legacyResult = await this.legacyRenderer.render(command);

    try {
      await this.shadowOrchestrator.renderShadow(command, legacyResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Contract renderer shadow failed for documentId=${command.documentId}, templateCode=${descriptor.templateCode}: ${message}`,
      );
    }

    return legacyResult;
  }
}
