import type { CurrentUser } from '../../../auth/current-user.type';

export type DocumentRenderResult = Readonly<Record<string, unknown>>;

export interface DocumentRenderCommand {
  documentId: string;
  options: {
    force?: boolean;
    renderedByName?: string;
  };
  actor: CurrentUser | null;
}

export interface GeneratedDocumentDescriptor {
  documentId: string;
  templateCode: string;
}

export interface LegacyDocumentRendererPort {
  render(command: DocumentRenderCommand): Promise<DocumentRenderResult>;
}

export interface ContractDocumentRendererPort {
  renderActive(command: DocumentRenderCommand): Promise<DocumentRenderResult>;
  renderShadow(
    command: DocumentRenderCommand,
    legacyResult: DocumentRenderResult,
  ): Promise<void>;
}

export interface GeneratedDocumentDescriptorPort {
  findByDocumentId(documentId: string): Promise<GeneratedDocumentDescriptor>;
}

export const LEGACY_DOCUMENT_RENDERER = Symbol('LEGACY_DOCUMENT_RENDERER');
export const CONTRACT_DOCUMENT_RENDERER = Symbol('CONTRACT_DOCUMENT_RENDERER');
export const GENERATED_DOCUMENT_DESCRIPTOR = Symbol(
  'GENERATED_DOCUMENT_DESCRIPTOR',
);
