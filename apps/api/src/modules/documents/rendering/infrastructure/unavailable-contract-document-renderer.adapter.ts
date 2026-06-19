import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  ContractDocumentRendererPort,
  DocumentRenderCommand,
  DocumentRenderResult,
} from '../application/document-renderer.ports';

@Injectable()
export class UnavailableContractDocumentRendererAdapter implements ContractDocumentRendererPort {
  renderActive(command: DocumentRenderCommand): Promise<DocumentRenderResult> {
    return Promise.reject(this.unavailable(command));
  }

  renderShadow(command: DocumentRenderCommand): Promise<void> {
    return Promise.reject(this.unavailable(command));
  }

  private unavailable(
    command: DocumentRenderCommand,
  ): ServiceUnavailableException {
    return new ServiceUnavailableException(
      `Contract renderer is not installed for generated document ${command.documentId}.`,
    );
  }
}
