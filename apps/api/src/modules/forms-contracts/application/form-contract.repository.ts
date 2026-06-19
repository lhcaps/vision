import type { LoadedFormContract } from '../domain/form-contract';

export type InvalidContractFile = {
  path: string;
  message: string;
};

export type ContractRepositoryStatus = {
  ready: boolean;
  contractsRoot: string;
  lockedCount: number;
  draftCount: number;
  invalidFiles: InvalidContractFile[];
};

export abstract class FormContractRepository {
  abstract findByIdentifier(
    identifier: string,
  ): Promise<LoadedFormContract | null>;

  abstract list(): Promise<LoadedFormContract[]>;

  abstract inspect(): Promise<ContractRepositoryStatus>;
}
