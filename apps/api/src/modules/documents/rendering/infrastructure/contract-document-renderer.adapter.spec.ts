import { ContractDocumentRendererAdapter } from './contract-document-renderer.adapter';
import { ContractShadowRendererOrchestrator } from '../application/contract-shadow-renderer.orchestrator';
import type { DocumentRenderCommand } from '../application/document-renderer.ports';

const command: DocumentRenderCommand = {
  documentId: '42',
  options: { force: true },
  actor: null,
};

describe('ContractDocumentRendererAdapter', () => {
  describe('renderActive', () => {
    it('fails clearly with a descriptive error', async () => {
      const orchestrator = {} as ContractShadowRendererOrchestrator;
      const adapter = new ContractDocumentRendererAdapter(orchestrator);

      await expect(adapter.renderActive(command)).rejects.toThrow(
        /not enabled for BM-001 in D\.2\.2/,
      );
    });
  });

  describe('renderShadow', () => {
    it('delegates to the orchestrator', async () => {
      const orchestrator = {
        renderShadow: jest.fn().mockResolvedValue(undefined),
      } as unknown as ContractShadowRendererOrchestrator;
      const adapter = new ContractDocumentRendererAdapter(orchestrator);

      await adapter.renderShadow(command, {});

      expect(orchestrator.renderShadow).toHaveBeenCalledWith(command, {});
    });

    it('passes orchestrator errors through', async () => {
      const orchestrator = {
        renderShadow: jest.fn().mockRejectedValue(new Error('orchestrator error')),
      } as unknown as ContractShadowRendererOrchestrator;
      const adapter = new ContractDocumentRendererAdapter(orchestrator);

      await expect(adapter.renderShadow(command, {})).rejects.toThrow(
        'orchestrator error',
      );
    });
  });
});
