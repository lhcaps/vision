export type ContractRenderPlanFieldSource =
  | 'agencyConfig'
  | 'manual'
  | 'casePayload'
  | 'computed';

export type ContractRenderPlanField = {
  path: string;
  value: unknown;
  source: ContractRenderPlanFieldSource;
  required: boolean;
};

export type ContractRenderPlanBinding = {
  slotId: string;
  from: string;
  transform: string;
  fallback: unknown;
  value: unknown;
};

export type ContractRenderPlanMissingRequired = {
  path: string;
  slotId?: string;
  reason: string;
};

export type ContractRenderPlan = Readonly<{
  sourceId: string;
  templateCode: 'BM-001';
  contractStatus: 'locked';
  fields: readonly ContractRenderPlanField[];
  bindings: readonly ContractRenderPlanBinding[];
  missingRequired: readonly ContractRenderPlanMissingRequired[];
  warnings: readonly string[];
}>;

export function createContractRenderPlan(
  raw: Omit<ContractRenderPlan, 'sourceId' | 'templateCode' | 'contractStatus'>,
  sourceId: string,
): ContractRenderPlan {
  return Object.freeze({
    sourceId,
    templateCode: 'BM-001',
    contractStatus: 'locked',
    fields: Object.freeze([...raw.fields]),
    bindings: Object.freeze([...raw.bindings]),
    missingRequired: Object.freeze([...raw.missingRequired]),
    warnings: Object.freeze([...raw.warnings]),
  });
}
