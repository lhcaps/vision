import type { ContractRepositoryStatus } from './form-contract.repository';
import { FormContractRepository } from './form-contract.repository';
import { FormsCatalogService } from './forms-catalog.service';
import type { LoadedFormContract } from '../domain/form-contract';

class InMemoryFormContractRepository extends FormContractRepository {
  constructor(private readonly contracts: LoadedFormContract[]) {
    super();
  }

  async findByIdentifier(
    identifier: string,
  ): Promise<LoadedFormContract | null> {
    return (
      this.contracts.find(
        (contract) =>
          contract.sourceId === identifier ||
          contract.templateCode === identifier,
      ) ?? null
    );
  }

  async list(): Promise<LoadedFormContract[]> {
    return this.contracts;
  }

  async inspect(): Promise<ContractRepositoryStatus> {
    return {
      ready: true,
      contractsRoot: 'memory',
      lockedCount: this.contracts.filter(
        (contract) => contract.status === 'locked',
      ).length,
      draftCount: this.contracts.filter(
        (contract) => contract.status === 'draft',
      ).length,
      invalidFiles: [],
    };
  }
}

function contract(
  templateCode: string,
  status: 'locked' | 'draft',
  stageCode: string,
): LoadedFormContract {
  return {
    sourceId: `${templateCode}__fixture`,
    templateCode,
    title:
      templateCode === 'BM-001'
        ? 'Biên bản tiếp nhận nguồn tin'
        : 'Quyết định điều tra',
    status,
    documentKind: 'form',
    stage: {
      code: stageCode,
      label: stageCode === '01' ? 'Tiếp nhận' : 'Điều tra',
    },
    docxSlots: [],
    canonicalFields: [],
    renderBindings: [],
    runtimeEligible: status === 'locked',
    needsReview: status === 'draft',
    genericFieldCount: status === 'draft' ? 1 : 0,
    fieldsNeedingReviewCount: status === 'draft' ? 1 : 0,
  };
}

describe('FormsCatalogService application use case', () => {
  const service = new FormsCatalogService(
    new InMemoryFormContractRepository([
      contract('BM-001', 'locked', '01'),
      contract('BM-097', 'draft', '04'),
    ]),
  );

  it('filters catalog items by status', async () => {
    await expect(service.getCatalog({ status: 'locked' })).resolves.toEqual([
      expect.objectContaining({ templateCode: 'BM-001' }),
    ]);
  });

  it('filters catalog items by stage', async () => {
    await expect(service.getCatalog({ stage: '04' })).resolves.toEqual([
      expect.objectContaining({ templateCode: 'BM-097' }),
    ]);
  });

  it('searches by code, title, and stage label', async () => {
    await expect(service.getCatalog({ q: 'tiếp nhận' })).resolves.toEqual([
      expect.objectContaining({ templateCode: 'BM-001' }),
    ]);
    await expect(service.getCatalog({ q: 'BM-097' })).resolves.toEqual([
      expect.objectContaining({ templateCode: 'BM-097' }),
    ]);
  });

  it('returns contract detail by template code', async () => {
    await expect(service.getContract('BM-001')).resolves.toMatchObject({
      sourceId: 'BM-001__fixture',
      runtimeEligible: true,
    });
  });

  it('groups catalog items by stage', async () => {
    const groups = await service.getCatalogByStage();

    expect(groups.find((group) => group.stageCode === '01')?.forms).toEqual([
      expect.objectContaining({ templateCode: 'BM-001' }),
    ]);
    expect(groups.find((group) => group.stageCode === '04')?.forms).toEqual([
      expect.objectContaining({ templateCode: 'BM-097' }),
    ]);
  });
});
