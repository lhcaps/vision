import { Injectable } from '@nestjs/common';
import { FormContractRepository } from '../forms-contracts/application/form-contract.repository';

const REQUIRED_LOCKED_CONTRACTS = ['BM-001', 'BM-002', 'BM-003'] as const;

export type ReadinessInfo = {
  ok: boolean;
  service: 'QUANLYVKS API';
  timestamp: string;
  checks: {
    contracts: {
      ok: boolean;
      contractsRoot: string;
      lockedCount: number;
      draftCount: number;
      invalidFileCount: number;
      requiredLocked: readonly string[];
      missingLocked: string[];
      error?: string;
    };
  };
};

@Injectable()
export class ReadinessService {
  constructor(private readonly contracts: FormContractRepository) {}

  async getReadiness(): Promise<ReadinessInfo> {
    const status = await this.contracts.inspect();
    let lockedCodes = new Set<string>();
    let error: string | undefined;

    if (status.ready) {
      try {
        const contracts = await this.contracts.list();
        lockedCodes = new Set(
          contracts
            .filter((contract) => contract.status === 'locked')
            .map((contract) => contract.templateCode),
        );
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }
    }

    const missingLocked = REQUIRED_LOCKED_CONTRACTS.filter(
      (templateCode) => !lockedCodes.has(templateCode),
    );
    const contractsOk =
      status.ready &&
      !error &&
      status.invalidFiles.length === 0 &&
      missingLocked.length === 0;

    return {
      ok: contractsOk,
      service: 'QUANLYVKS API',
      timestamp: new Date().toISOString(),
      checks: {
        contracts: {
          ok: contractsOk,
          contractsRoot: status.contractsRoot,
          lockedCount: status.lockedCount,
          draftCount: status.draftCount,
          invalidFileCount: status.invalidFiles.length,
          requiredLocked: REQUIRED_LOCKED_CONTRACTS,
          missingLocked,
          ...(error ? { error } : {}),
        },
      },
    };
  }
}
