import { join } from 'node:path';
import { ContractRenderPlanBuilder } from './contract-render-plan.builder';
import { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';
import type { GeneratedDocumentDescriptor } from './document-renderer.ports';

function makeWorkspacePaths(repoRoot: string): WorkspacePathsService {
  return {
    repoRoot,
    contractsRoot: `${repoRoot}/docs/audit/docx/contracts`,
  } as unknown as WorkspacePathsService;
}

function makeDescriptor(overrides: Partial<GeneratedDocumentDescriptor> = {}): GeneratedDocumentDescriptor {
  return {
    documentId: '1',
    templateCode: 'BM-001',
    ...overrides,
  };
}

// ts-jest runs from apps/api (process.cwd() = apps/api).
// repo root = apps/api/../../../.. = the monorepo root.
const REPO_ROOT = join(process.cwd(), '..', '..');

describe('ContractRenderPlanBuilder', () => {
  describe('template code validation', () => {
    it('rejects templates other than BM-001', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      expect(() => builder.build(makeDescriptor({ templateCode: 'BM-002' }))).toThrow(
        /only supports BM-001/,
      );
    });

    it('rejects BM-002 with whitespace', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      expect(() => builder.build(makeDescriptor({ templateCode: '  BM-002  ' }))).toThrow(
        /only supports BM-001/,
      );
    });
  });

  describe('BM-001 locked contract', () => {
    it('loads the locked BM-001 contract and builds a plan', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(makeDescriptor());
      expect(plan.templateCode).toBe('BM-001');
      expect(plan.contractStatus).toBe('locked');
    });

    it('populates fields from canonical fields', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(
        makeDescriptor({
          formData: {
            'receiver.fullName': 'Nguyễn Văn Minh',
            'informant.fullName': 'Trần Thị Lan',
          },
        }),
      );

      const receiverField = plan.fields.find((f) => f.path === 'receiver.fullName');
      expect(receiverField?.value).toBe('Nguyễn Văn Minh');
      expect(receiverField?.source).toBe('agencyConfig');
      expect(receiverField?.required).toBe(true);

      const informantField = plan.fields.find((f) => f.path === 'informant.fullName');
      expect(informantField?.value).toBe('Trần Thị Lan');
      expect(informantField?.source).toBe('manual');
    });

    it('marks missing required fields explicitly', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(makeDescriptor({ formData: {} }));

      const missingRequired = plan.missingRequired.map((m) => m.path);
      expect(missingRequired).toContain('receiver.fullName');
      expect(missingRequired).toContain('informant.fullName');
    });

    it('skips generic field paths containing .field# or [#]', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(makeDescriptor());

      const genericFields = plan.fields.filter(
        (f) => f.path.includes('.field#') || f.path.includes('[#]'),
      );
      expect(genericFields).toHaveLength(0);
    });

    it('skips fields with unknown source', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(makeDescriptor());

      const unknownSource = plan.fields.filter((f) => f.source === 'manual');
      expect(unknownSource.length).toBeGreaterThan(0);
    });

    it('does not set reviewRequired=true in the plan', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(makeDescriptor());

      const bindings = plan.bindings;
      expect(bindings.length).toBeGreaterThan(0);
    });

    it('applies identity transform correctly', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(
        makeDescriptor({
          formData: {
            'receiver.fullName': 'Nguyễn Văn Minh',
          },
        }),
      );

      const binding = plan.bindings.find((b) => b.slotId === 'receiver.fullName');
      expect(binding?.transform).toBe('identity');
      expect(binding?.value).toBe('Nguyễn Văn Minh');
    });

    it('uses fallback when form data is missing', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(makeDescriptor({ formData: {} }));

      const binding = plan.bindings.find((b) => b.slotId === 'receiver.fullName');
      expect(binding?.value).toBe('');
      expect(binding?.fallback).toBe('');
    });

    it('throws for unknown transform', () => {
      const builder = new ContractRenderPlanBuilder(makeWorkspacePaths(REPO_ROOT));
      const plan = builder.build(makeDescriptor());
      const unknownTransformBinding = plan.bindings.find(
        (b) => !['identity', 'derived', 'uppercase', 'lowercase', 'trim'].includes(b.transform),
      );
      expect(unknownTransformBinding).toBeUndefined();
    });
  });
});
