import { AppConfigService } from '../../../../infrastructure/config/app-config.service';
import type {
  ContractDocumentRendererPort,
  DocumentRenderCommand,
  DocumentRenderResult,
  GeneratedDocumentDescriptorPort,
  LegacyDocumentRendererPort,
} from './document-renderer.ports';
import { DocumentRendererRoutingPolicy } from './document-renderer-routing.policy';
import { RenderGeneratedDocumentUseCase } from './render-generated-document.use-case';

const command: DocumentRenderCommand = {
  documentId: '42',
  options: {
    force: true,
    renderedByName: 'KSV A',
  },
  actor: null,
};

function createHarness(env: Record<string, string> = {}) {
  const legacyResult: DocumentRenderResult = {
    skipped: false,
    renderer: 'legacy',
  };
  const contractResult: DocumentRenderResult = {
    skipped: false,
    renderer: 'contract',
  };
  const calls = {
    legacy: 0,
    descriptor: 0,
    active: 0,
    shadow: 0,
  };

  const legacy: LegacyDocumentRendererPort = {
    async render() {
      calls.legacy += 1;
      return legacyResult;
    },
  };
  const descriptor: GeneratedDocumentDescriptorPort = {
    async findByDocumentId() {
      calls.descriptor += 1;
      return {
        documentId: '42',
        templateCode: 'BM-001',
      };
    },
  };
  const contract: ContractDocumentRendererPort = {
    async renderActive() {
      calls.active += 1;
      return contractResult;
    },
    async renderShadow() {
      calls.shadow += 1;
    },
  };
  const policy = new DocumentRendererRoutingPolicy(new AppConfigService(env));
  const useCase = new RenderGeneratedDocumentUseCase(
    legacy,
    contract,
    descriptor,
    policy,
  );

  return {
    calls,
    contract,
    contractResult,
    descriptor,
    legacyResult,
    useCase,
  };
}

describe('RenderGeneratedDocumentUseCase', () => {
  it('preserves the legacy path without descriptor lookup when mode is off', async () => {
    const harness = createHarness();

    await expect(harness.useCase.execute(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls).toEqual({
      legacy: 1,
      descriptor: 0,
      active: 0,
      shadow: 0,
    });
  });

  it('uses legacy for templates outside the active allow-list', async () => {
    const harness = createHarness({
      DOCUMENT_RENDERER_MODE: 'active',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-002',
    });

    await expect(harness.useCase.execute(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls).toEqual({
      legacy: 1,
      descriptor: 1,
      active: 0,
      shadow: 0,
    });
  });

  it('uses the contract renderer for an active allow-listed template', async () => {
    const harness = createHarness({
      DOCUMENT_RENDERER_MODE: 'active',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });

    await expect(harness.useCase.execute(command)).resolves.toBe(
      harness.contractResult,
    );
    expect(harness.calls).toEqual({
      legacy: 0,
      descriptor: 1,
      active: 1,
      shadow: 0,
    });
  });

  it('does not silently fall back when active contract rendering fails', async () => {
    const harness = createHarness({
      DOCUMENT_RENDERER_MODE: 'active',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });
    harness.contract.renderActive = async () => {
      harness.calls.active += 1;
      throw new Error('contract renderer failed');
    };

    await expect(harness.useCase.execute(command)).rejects.toThrow(
      'contract renderer failed',
    );
    expect(harness.calls.legacy).toBe(0);
  });

  it('returns the legacy result when shadow comparison succeeds', async () => {
    const harness = createHarness({
      DOCUMENT_RENDERER_MODE: 'shadow',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });

    await expect(harness.useCase.execute(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls).toEqual({
      legacy: 1,
      descriptor: 1,
      active: 0,
      shadow: 1,
    });
  });

  it('keeps the user request successful when shadow comparison fails', async () => {
    const harness = createHarness({
      DOCUMENT_RENDERER_MODE: 'shadow',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });
    harness.contract.renderShadow = async () => {
      harness.calls.shadow += 1;
      throw new Error('shadow unavailable');
    };

    await expect(harness.useCase.execute(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls.legacy).toBe(1);
    expect(harness.calls.shadow).toBe(1);
  });
});
