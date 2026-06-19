import { Injectable } from '@nestjs/common';
import { FormContractRepository } from './form-contract.repository';
import {
  FORM_STAGES,
  type FormCatalogItem,
  type FormCatalogQuery,
  type LoadedFormContract,
} from '../domain/form-contract';

export type CatalogStageGroup = {
  stageCode: string;
  stageLabel: string;
  forms: FormCatalogItem[];
};

function toCatalogItem(contract: LoadedFormContract): FormCatalogItem {
  return {
    sourceId: contract.sourceId,
    templateCode: contract.templateCode,
    title: contract.title,
    stageCode: contract.stage?.code,
    stageLabel: contract.stage?.label,
    status: contract.status,
    runtimeEligible: contract.runtimeEligible,
    reviewRequired: contract.needsReview,
    genericFieldCount: contract.genericFieldCount,
    lockedAt: contract.lockedAt,
  };
}

function filterCatalog(
  contracts: LoadedFormContract[],
  query: FormCatalogQuery,
): FormCatalogItem[] {
  const search = query.q?.trim().toLocaleLowerCase('vi-VN');

  return contracts
    .filter(
      (contract) => !query.sourceId || contract.sourceId === query.sourceId,
    )
    .filter((contract) => !query.status || contract.status === query.status)
    .filter((contract) => !query.stage || contract.stage?.code === query.stage)
    .filter((contract) => {
      if (!search) return true;
      return [contract.templateCode, contract.title, contract.stage?.label]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(search));
    })
    .map(toCatalogItem);
}

@Injectable()
export class FormsCatalogService {
  constructor(private readonly repository: FormContractRepository) {}

  getContract(identifier: string): Promise<LoadedFormContract | null> {
    return this.repository.findByIdentifier(identifier);
  }

  async getCatalog(query: FormCatalogQuery = {}): Promise<FormCatalogItem[]> {
    return filterCatalog(await this.repository.list(), query);
  }

  async getCatalogByStage(): Promise<CatalogStageGroup[]> {
    const contracts = await this.repository.list();

    return FORM_STAGES.map((stage) => ({
      stageCode: stage.code,
      stageLabel: stage.label,
      forms: filterCatalog(contracts, { stage: stage.code }),
    }));
  }
}
