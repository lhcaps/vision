import type { ContractRepositoryStatus } from '../forms-contracts/application/form-contract.repository';
import { FormContractRepository } from '../forms-contracts/application/form-contract.repository';
import type { LoadedFormContract } from '../forms-contracts/domain/form-contract';
import { ReadinessService } from './readiness.service';

class ReadinessRepository extends FormContractRepository {
  constructor(
    private readonly contracts: LoadedFormContract[],
    private readonly status: ContractRepositoryStatus,
  ) {
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
    return this.status;
  }
}

function locked(templateCode: string): LoadedFormContract {
  return {
    sourceId: `${templateCode}__locked`,
    templateCode,
    title: templateCode,
    status: 'locked',
    documentKind: 'form',
    docxSlots: [],
    canonicalFields: [],
    renderBindings: [],
    runtimeEligible: true,
    needsReview: false,
    genericFieldCount: 0,
    fieldsNeedingReviewCount: 0,
  };
}

function status(
  overrides: Partial<ContractRepositoryStatus> = {},
): ContractRepositoryStatus {
  return {
    ready: true,
    contractsRoot: 'D:/repo/docs/audit/docx/contracts',
    lockedCount: 3,
    draftCount: 210,
    invalidFiles: [],
    ...overrides,
  };
}

describe('ReadinessService', () => {
  it('is ready when all pilot contracts are locked and valid', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: true,
      checks: {
        contracts: {
          ok: true,
          requiredLocked: ['BM-001', 'BM-002', 'BM-003'],
          missingLocked: [],
          lockedCount: 3,
          draftCount: 210,
          invalidFileCount: 0,
        },
      },
    });
  });

  it('is not ready when a required locked contract is missing', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-003')],
        status({ lockedCount: 2 }),
      ),
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: false,
      checks: {
        contracts: {
          ok: false,
          missingLocked: ['BM-002'],
        },
      },
    });
  });

  it('is not ready when the repository reports invalid files', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status({
          invalidFiles: [
            {
              path: 'D:/repo/contracts/BM-004.json',
              message: 'Invalid JSON',
            },
          ],
        }),
      ),
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: false,
      checks: {
        contracts: {
          ok: false,
          invalidFileCount: 1,
        },
      },
    });
  });

  it('is not ready when the contracts root is unavailable', async () => {
    const service = new ReadinessService(
      new ReadinessRepository([], status({ ready: false, lockedCount: 0 })),
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: false,
      checks: {
        contracts: {
          ok: false,
          missingLocked: ['BM-001', 'BM-002', 'BM-003'],
        },
      },
    });
  });
});
