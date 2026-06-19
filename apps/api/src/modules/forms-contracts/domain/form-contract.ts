export type ContractStatus = 'locked' | 'draft';

export type StageInfo = {
  code?: string;
  label?: string;
};

export type DocxSlot = {
  slotId: string;
  required: boolean;
  reviewRequired: boolean;
  context?: string;
  label?: string;
  location?: {
    partName: string;
    blockId: string | null;
    tableCellId: string | null;
  };
};

export type CanonicalField = {
  path: string;
  type: string;
  source?: string;
  uiComponent?: string;
  section?: string;
  required?: boolean;
  transform?: string;
};

export type RenderBinding = {
  slotId: string;
  from: string;
  transform: string;
  fallback: string;
};

export type RawFormContract = {
  sourceId: string;
  templateCode: string;
  templateTitle: string;
  documentKind: 'form' | 'reference';
  status: ContractStatus;
  docxSlots: DocxSlot[];
  canonicalFields: CanonicalField[];
  renderBindings: RenderBinding[];
  lockedAt?: string;
};

export type LoadedFormContract = {
  sourceId: string;
  templateCode: string;
  title: string;
  status: ContractStatus;
  documentKind: 'form';
  stage?: StageInfo;
  docxSlots: DocxSlot[];
  canonicalFields: CanonicalField[];
  renderBindings: RenderBinding[];
  runtimeEligible: boolean;
  needsReview: boolean;
  genericFieldCount: number;
  fieldsNeedingReviewCount: number;
  lockedAt?: string;
};

export type FormCatalogItem = {
  sourceId: string;
  templateCode: string;
  title: string;
  stageCode?: string;
  stageLabel?: string;
  status: ContractStatus;
  runtimeEligible: boolean;
  reviewRequired: boolean;
  genericFieldCount: number;
  lockedAt?: string;
};

export type FormCatalogQuery = {
  stage?: string;
  q?: string;
  status?: ContractStatus;
  sourceId?: string;
};

export const FORM_STAGES = [
  {
    code: '01',
    label: 'Tiếp nhận và giải quyết nguồn tin',
    range: [1, 30],
  },
  {
    code: '02',
    label: 'Biện pháp ngăn chặn, cưỡng chế',
    range: [31, 69],
  },
  {
    code: '03',
    label: 'Người tham gia tố tụng',
    range: [70, 84],
  },
  { code: '04', label: 'Giai đoạn điều tra', range: [85, 140] },
  { code: '05', label: 'Giai đoạn truy tố', range: [141, 168] },
  { code: '06', label: 'Vật chứng', range: [169, 173] },
  {
    code: '07',
    label: 'Biện pháp điều tra đặc biệt',
    range: [174, 178],
  },
  { code: '08', label: 'Thủ tục đặc biệt', range: [179, 184] },
  { code: '09', label: 'Người chưa thành niên', range: [185, 213] },
] as const;

const GENERIC_FIELD_PATTERN = /^\w+\.field\d+$/i;

function getStage(templateCode: string): StageInfo | undefined {
  const match = /^BM-(\d{3})$/.exec(templateCode);
  if (!match) return undefined;
  const formNumber = Number(match[1]);
  const stage = FORM_STAGES.find(
    (candidate) =>
      formNumber >= candidate.range[0] && formNumber <= candidate.range[1],
  );
  return stage ? { code: stage.code, label: stage.label } : undefined;
}

/**
 * Convert a validated raw form contract into the runtime domain shape.
 */
export function normalizeFormContract(
  contract: RawFormContract,
): LoadedFormContract {
  const genericFieldCount = contract.docxSlots.filter((slot) =>
    GENERIC_FIELD_PATTERN.test(slot.slotId),
  ).length;
  const fieldsNeedingReviewCount = contract.canonicalFields.filter(
    (field) =>
      field.source === 'unknown' || GENERIC_FIELD_PATTERN.test(field.path),
  ).length;

  return {
    sourceId: contract.sourceId,
    templateCode: contract.templateCode,
    title: contract.templateTitle,
    status: contract.status,
    documentKind: 'form',
    stage: getStage(contract.templateCode),
    docxSlots: contract.docxSlots,
    canonicalFields: contract.canonicalFields,
    renderBindings: contract.renderBindings,
    runtimeEligible: contract.status === 'locked',
    needsReview: genericFieldCount > 0 || fieldsNeedingReviewCount > 0,
    genericFieldCount,
    fieldsNeedingReviewCount,
    lockedAt: contract.lockedAt,
  };
}
