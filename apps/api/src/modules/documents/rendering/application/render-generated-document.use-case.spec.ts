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
import { ContractShadowRendererOrchestrator } from './contract-shadow-renderer.orchestrator';

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
    orchestrator: 0,
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
    },
  };
  const shadowOrchestrator = {
    renderShadow: jest.fn().mockImplementation(async () => {
      calls.orchestrator += 1;
    }),
  } as unknown as ContractShadowRendererOrchestrator;
  const policy = new DocumentRendererRoutingPolicy(new AppConfigService(env));
  const useCase = new RenderGeneratedDocumentUseCase(
    legacy,
    contract,
    descriptor,
    policy,
    shadowOrchestrator,
  );

  return {
    calls,
    contract,
    contractResult,
    descriptor,
    legacyResult,
    useCase,
    shadowOrchestrator,
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
      orchestrator: 0,
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
      orchestrator: 0,
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
      orchestrator: 0,
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
      orchestrator: 1,
    });
    expect(harness.shadowOrchestrator.renderShadow).toHaveBeenCalledTimes(1);
  });

  it('keeps the user request successful when shadow comparison fails', async () => {
    const harness = createHarness({
      DOCUMENT_RENDERER_MODE: 'shadow',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });
    (harness.shadowOrchestrator.renderShadow as jest.Mock).mockRejectedValueOnce(
      new Error('shadow unavailable'),
    );

    await expect(harness.useCase.execute(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls.legacy).toBe(1);
    expect(harness.shadowOrchestrator.renderShadow).toHaveBeenCalledTimes(1);
  });

  it('keeps the user request successful when shadow orchestrator throws', async () => {
    const harness = createHarness({
      DOCUMENT_RENDERER_MODE: 'shadow',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });
    (harness.shadowOrchestrator.renderShadow as jest.Mock).mockRejectedValueOnce(
      new Error('orchestrator error'),
    );

    await expect(harness.useCase.execute(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls.legacy).toBe(1);
    expect(harness.shadowOrchestrator.renderShadow).toHaveBeenCalledTimes(1);
  });

  it('returns the legacy result when template is not BM-001 in shadow mode', async () => {
    // In shadow mode, contract.renderShadow IS called (port contract).
    // It delegates to orchestrator which skips non-BM-001.
    const calls = { legacy: 0, descriptor: 0, active: 0, orchestrator: 0 };
    const legacyResult: DocumentRenderResult = { skipped: false, renderer: 'legacy' };
    const legacy: LegacyDocumentRendererPort = { async render() { calls.legacy += 1; return legacyResult; } };
    const descriptor: GeneratedDocumentDescriptorPort = {
      async findByDocumentId() {
        calls.descriptor += 1;
        return { documentId: '42', templateCode: 'BM-002' };
      },
    };
    const contract: ContractDocumentRendererPort = {
      async renderActive() { calls.active += 1; return {}; },
      async renderShadow() {},
    };
    const shadowOrchestrator = {
      renderShadow: jest.fn().mockImplementation(async () => { calls.orchestrator += 1; }),
    } as unknown as ContractShadowRendererOrchestrator;
    const policy = new DocumentRendererRoutingPolicy(new AppConfigService({
      DOCUMENT_RENDERER_MODE: 'shadow',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-002',
    }));
    const useCase = new RenderGeneratedDocumentUseCase(
      legacy, contract, descriptor, policy, shadowOrchestrator,
    );

    await expect(useCase.execute(command)).resolves.toBe(legacyResult);
    // contract.renderShadow is called in shadow mode (delegates to orchestrator)
    // orchestrator skips non-BM-001 but renderShadow IS called
    expect(shadowOrchestrator.renderShadow).toHaveBeenCalledTimes(1);
  });
});
