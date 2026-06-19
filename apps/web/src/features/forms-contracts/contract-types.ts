/**
 * Phase D — Contract types shared across web and API.
 * Aligned with locked contract schema version 1.0.
 */

// ─── Contract source status ──────────────────────────────────────────────────

export type ContractStatus = "locked" | "draft";

/** Runtime eligibility: only locked contracts are production-ready. */
export type RuntimeStatus = "locked" | "draft" | "reference" | "invalid";

/** How the field value is obtained. */
export type FieldSource =
  | "manual"
  | "agencyConfig"
  | "officialConfig"
  | "constantFromDocx"
  | "casePayload"
  | "systemDate"
  | "manualOrDefault"
  | "unknown";

/** Where the slot appears in the DOCX structure. */
export type SlotType = "text" | "datePart" | "tableCell" | "checkbox" | "number" | "mixed";

/** UI component hint derived from slot analysis. */
export type UiComponentHint =
  | "text"
  | "textarea"
  | "date"
  | "select"
  | "number"
  | "checkbox"
  | "readonly";

// ─── Contract structure ───────────────────────────────────────────────────────

export interface DocxSlot {
  slotId: string;
  location: {
    partName: string;
    blockId: string | null;
    tableCellId: string | null;
  };
  context: string;
  label: string;
  slotType: SlotType;
  required: boolean;
  confidence: number;
  /** Set to true if field has generic placeholder names like .field1 */
  reviewRequired: boolean;
  /** Optional suggestion from heuristic */
  suggestedCanonicalPath?: string;
  suggestedBy?: string;
  suggestedReason?: string;
  evidence?: {
    textBefore?: string;
    textAfter?: string;
    rawPattern?: string;
  };
}

export interface CanonicalField {
  path: string;
  type: string;
  source: FieldSource;
  uiComponent: UiComponentHint;
  section: string;
  required: boolean;
  transform?: string;
  suggestedCanonicalPath?: string;
  suggestedBy?: string;
}

export interface RenderBinding {
  slotId: string;
  from: string;
  transform: string;
  fallback: string;
}

export interface ProductMetadata {
  stage?: {
    code?: string;
    label?: string;
  };
  formNumber?: string;
  legalBasisLine?: string;
}

export interface FormInputHints {
  /** Field paths that are read-only (agency/system config). */
  readonlyFields?: string[];
  /** Field paths that need date picker. */
  dateFields?: string[];
  /** Field paths that need select dropdown. */
  selectFields?: string[];
  /** Select options keyed by field path. */
  selectOptions?: Record<string, Array<{ label: string; value: string }>>;
}

export interface RenderFormatHints {
  fontFamily?: string;
  baseFontSize?: number;
  requiresDifferentFirstPage?: boolean;
  lineHeight?: number;
}

export interface ReportingHints {
  /** Field path(s) for time-based reporting index */
  timeField?: string;
  /** Field path(s) for ward-based reporting index */
  wardField?: string;
  /** Field path(s) for offense-based reporting index */
  offenseField?: string;
}

/** Raw contract as stored on disk. */
export interface FormContract {
  schemaVersion: string;
  sourceId: string;
  templateCode: string;
  documentKind: "form" | "reference";
  duplicateIndex: number;
  duplicateCount: number;
  isDuplicateCode: boolean;
  templateTitle: string;
  docx?: {
    sha256: string;
    fileName: string;
    relativePath: string;
    format: string;
  };
  extractionSource?: {
    kind: string;
    relativePath: string;
    sha256: string;
    format: string;
  };
  status: ContractStatus;
  docxSlots?: DocxSlot[];
  canonicalFields?: CanonicalField[];
  renderBindings?: RenderBinding[];
  productMetadata?: ProductMetadata;
  formInputHints?: FormInputHints;
  renderFormatHints?: RenderFormatHints;
  reportingHints?: ReportingHints;
  reviewRequired?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  lockedAt?: string;
  lockedBy?: string;
  unresolvedQuestions?: Array<{
    slotId: string;
    question: string;
    recommendation: string;
  }>;
}

// ─── Loaded / normalized contract ────────────────────────────────────────────

/** The result returned by the contract loader. */
export interface LoadedFormContract {
  sourceId: string;
  templateCode: string;
  title: string;
  status: ContractStatus;
  documentKind: "form";
  stage?: {
    code?: string;
    label?: string;
  };
  docxSlots: DocxSlot[];
  canonicalFields: CanonicalField[];
  renderBindings: RenderBinding[];
  formInputHints?: FormInputHints;
  renderFormatHints?: RenderFormatHints;
  reportingHints?: ReportingHints;
  /** Whether this contract can be used for production create/save/render. */
  runtimeEligible: boolean;
  /** Whether this contract has generic `.field#` placeholders needing human review. */
  needsReview: boolean;
  /** Total count of generic `.field#` slots */
  genericFieldCount: number;
  /** Canonical fields needing review */
  fieldsNeedingReviewCount: number;
  lockedAt?: string;
}

// ─── Form catalog ─────────────────────────────────────────────────────────────

export interface FormCatalogItem {
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
}

export interface FormCatalogQuery {
  stage?: string;
  q?: string;
  status?: ContractStatus;
  sourceId?: string;
}

// ─── Form schema generation output ───────────────────────────────────────────────

export interface GeneratedFormField {
  path: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "number" | "checkbox" | "readonly";
  source: string;
  required: boolean;
  reviewRequired: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  evidence?: {
    blockId?: string;
    context?: string;
  };
}

export interface GeneratedFormSection {
  sectionId: string;
  title: string;
  fields: GeneratedFormField[];
}

export interface GeneratedFormSchema {
  sourceId: string;
  templateCode: string;
  title: string;
  sections: GeneratedFormSection[];
  fields: GeneratedFormField[];
}

// ─── Form instance ───────────────────────────────────────────────────────────

export type FormInstanceStatus = "draft" | "ready" | "rendered" | "archived";

export interface FormInstanceReportingIndex {
  time?: string;
  ward?: string;
  offense?: string;
}

export interface FormInstance {
  id: string;
  sourceId: string;
  templateCode: string;
  contractVersion?: string;
  status: FormInstanceStatus;
  data: Record<string, unknown>;
  reportingIndex: FormInstanceReportingIndex;
  createdAt: string;
  updatedAt: string;
}

// ─── Stage definitions ────────────────────────────────────────────────────────

export interface FormStage {
  code: string;
  label: string;
  bmRange: [number, number];
}

export const FORM_STAGES: FormStage[] = [
  { code: "01", label: "Tiếp nhận và giải quyết nguồn tin", bmRange: [1, 30] },
  { code: "02", label: "Biện pháp ngăn chặn, cưỡng chế", bmRange: [31, 69] },
  { code: "03", label: "Người tham gia tố tụng", bmRange: [70, 84] },
  { code: "04", label: "Giai đoạn điều tra", bmRange: [85, 140] },
  { code: "05", label: "Giai đoạn truy tố", bmRange: [141, 168] },
  { code: "06", label: "Vật chứng", bmRange: [169, 173] },
  { code: "07", label: "Biện pháp điều tra đặc biệt", bmRange: [174, 178] },
  { code: "08", label: "Thủ tục đặc biệt", bmRange: [179, 184] },
  { code: "09", label: "Người chưa thành niên", bmRange: [185, 213] },
];

export function getStageForBm(bmCode: string): FormStage | undefined {
  const match = bmCode.match(/^BM-(\d+)/);
  if (!match) return undefined;
  const n = parseInt(match[1], 10);
  return FORM_STAGES.find((s) => n >= s.bmRange[0] && n <= s.bmRange[1]);
}
