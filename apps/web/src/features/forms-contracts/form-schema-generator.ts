/**
 * Phase D — Contract-driven form schema generator.
 *
 * Takes a `LoadedFormContract` and produces a `GeneratedFormSchema`.
 * Rules:
 * - Use `canonicalFields` as source of truth.
 * - Do not generate input for `constantFromDocx` unless user can override.
 * - `agencyConfig`, `officialConfig`, `systemDate` become readonly or config-backed.
 * - `manual`, `manualOrDefault`, `casePayload` become editable fields.
 * - Draft/generic fields show review warning and disabled unless `allowDraftPreview`.
 */

import type {
  LoadedFormContract,
  CanonicalField,
  RenderBinding,
  GeneratedFormSchema,
  GeneratedFormSection,
  GeneratedFormField,
} from "./contract-types";

// ─── Field type mapping ────────────────────────────────────────────────────────

type FormFieldType =
  | "text"
  | "textarea"
  | "date"
  | "select"
  | "number"
  | "checkbox"
  | "readonly";

/**
 * Map a canonical field to a UI type.
 */
function mapUiComponent(
  uiComponent: string | undefined,
  slotType: string | undefined,
  fieldPath: string,
): FormFieldType {
  if (uiComponent === "date") return "date";
  if (uiComponent === "textarea") return "textarea";
  if (uiComponent === "select") return "select";
  if (uiComponent === "number") return "number";
  if (uiComponent === "checkbox") return "checkbox";
  if (uiComponent === "readonly") return "readonly";

  // Infer from slot type
  if (slotType === "datePart") return "date";
  if (slotType === "checkbox") return "checkbox";
  if (slotType === "number") return "number";

  // Infer from field path patterns
  if (/\b(date|ngay|thang|nam)\b/i.test(fieldPath)) return "date";
  if (/\b(number|soLuong|soTien)\b/i.test(fieldPath)) return "number";

  return "text";
}

/**
 * Determine if a field should be editable.
 * `constantFromDocx` → readonly unless override allowed.
 * `agencyConfig`/`officialConfig`/`systemDate` → readonly.
 * `manual`/`manualOrDefault`/`casePayload` → editable.
 * `unknown` → editable if not generic `.field#`.
 */
function isEditable(source: string | undefined, fieldPath: string): boolean {
  if (!source) return true;
  const readonlySources = [
    "constantFromDocx",
    "agencyConfig",
    "officialConfig",
    "systemDate",
  ];
  if (readonlySources.includes(source)) return false;
  if (source === "manual" || source === "manualOrDefault" || source === "casePayload") {
    return true;
  }
  // Generic placeholder
  if (/^\w+\.field\d+$/i.test(fieldPath)) return false;
  return true;
}

function isReviewRequired(source: string | undefined, fieldPath: string): boolean {
  if (/^\w+\.field\d+$/i.test(fieldPath)) return true;
  if (source === "unknown") return true;
  return false;
}

// ─── Section grouping ─────────────────────────────────────────────────────────

interface SectionEntry {
  sectionId: string;
  fields: CanonicalField[];
}

/**
 * Group canonical fields into sections based on the first segment of the field path.
 * e.g. `agency.parentName` → section "agency"
 */
function groupFieldsIntoSections(fields: CanonicalField[]): SectionEntry[] {
  const map = new Map<string, CanonicalField[]>();

  for (const field of fields) {
    const sectionId = field.path.split(".")[0] ?? "other";
    if (!map.has(sectionId)) map.set(sectionId, []);
    map.get(sectionId)!.push(field);
  }

  const order = [
    "agency",
    "document",
    "case",
    "offense",
    "person",
    "content",
    "recipients",
    "signature",
  ];

  const sections: SectionEntry[] = [];
  for (const id of order) {
    if (map.has(id)) {
      sections.push({ sectionId: id, fields: map.get(id)! });
      map.delete(id);
    }
  }
  // Append any remaining sections
  for (const [sectionId, fields] of map) {
    sections.push({ sectionId, fields });
  }
  return sections;
}

// ─── Main generator ────────────────────────────────────────────────────────────

export interface FormSchemaOptions {
  /** Allow editing draft/generic fields for preview purposes. Default: false. */
  allowDraftPreview?: boolean;
  /** Select options for select fields (keyed by field path). */
  selectOptions?: Record<string, Array<{ label: string; value: string }>>;
}

/**
 * Generate a form schema from a loaded contract.
 *
 * The output can be used by `ContractDrivenFormPanel` to render the form
 * without any hard-coded BM-specific JSX.
 */
export function generateFormSchema(
  contract: LoadedFormContract,
  options: FormSchemaOptions = {},
): GeneratedFormSchema {
  const { allowDraftPreview = false } = options;

  const sections: GeneratedFormSection[] = [];
  const allFields: GeneratedFormField[] = [];

  // Build a map of slotId → reviewRequired for per-field review flags
  const slotReviewMap = new Map<string, boolean>();
  for (const slot of contract.docxSlots ?? []) {
    if (slot.reviewRequired) {
      slotReviewMap.set(slot.slotId, true);
    }
  }

  // Group canonical fields by section
  const sectionEntries = groupFieldsIntoSections(contract.canonicalFields ?? []);

  for (const entry of sectionEntries) {
    const sectionFields: GeneratedFormField[] = [];

    for (const field of entry.fields) {
      const editable = isEditable(field.source, field.path);
      const reviewRequired = isReviewRequired(field.source, field.path);

      // Find the corresponding slot for evidence
      const slot = contract.docxSlots?.find((s) => s.slotId === field.path);
      const slotReview = slotReviewMap.get(field.path) || false;

      const finalReviewRequired = reviewRequired || slotReview;

      // Determine actual editability considering draft preview flag
      const isDisabled =
        !editable ||
        (finalReviewRequired && !allowDraftPreview && contract.status !== "locked");

      sectionFields.push({
        path: field.path,
        label: deriveLabel(field.path),
        type: mapUiComponent(field.uiComponent, slot?.slotType, field.path),
        source: field.path,
        required: field.required ?? false,
        reviewRequired: finalReviewRequired,
        placeholder: finalReviewRequired
          ? `[CẦN REVIEW] ${field.path}`
          : undefined,
        options: field.uiComponent === "select"
          ? (contract.formInputHints?.selectOptions?.[field.path] ?? [])
          : undefined,
        evidence: slot
          ? {
              blockId: slot.location?.blockId ?? undefined,
              context: slot.context ?? undefined,
            }
          : undefined,
      });

      allFields.push(sectionFields[sectionFields.length - 1]);
    }

    sections.push({
      sectionId: entry.sectionId,
      title: deriveSectionTitle(entry.sectionId),
      fields: sectionFields,
    });
  }

  return {
    sourceId: contract.sourceId,
    templateCode: contract.templateCode,
    title: contract.title,
    sections,
    fields: allFields,
  };
}

/**
 * Derive a human-readable label from a field path.
 * e.g. `agency.parentName` → "Parent Name"
 */
export function deriveLabel(fieldPath: string): string {
  const segments = fieldPath.split(".").slice(1); // drop section prefix
  if (segments.length === 0) return fieldPath;

  const label = segments
    .map((seg) =>
      seg
        .replace(/([A-Z])/g, " $1")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase()),
    )
    .join(" ");

  return label || fieldPath;
}

/**
 * Derive a section title from its ID.
 */
export function deriveSectionTitle(sectionId: string): string {
  const titles: Record<string, string> = {
    agency: "Cơ quan ban hành",
    document: "Số văn bản và ngày",
    case: "Thông tin vụ án",
    offense: "Tội danh",
    person: "Người liên quan",
    content: "Nội dung văn bản",
    recipients: "Nơi nhận và lưu",
    signature: "Chữ ký",
    reception: "Thông tin tiếp nhận",
    receiver: "Người tiếp nhận",
    informant: "Nguồn tin",
    crimeReport: "Nội dung tố giác",
    investigation: "Điều tra",
    prosecution: "Truy tố",
    caseDecision: "Quyết định vụ án",
    legalBasis: "Căn cứ pháp lý",
    giamHan: "Gia hạn tạm giam",
    minorProtection: "Bảo vệ NCTN",
    familyRepresentative: "Đại diện gia đình",
  };
  return titles[sectionId] ?? sectionId.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

// ─── Render binding resolution ────────────────────────────────────────────────

export interface ResolvedBinding {
  slotId: string;
  value: string;
  isStale: boolean;
  hasData: boolean;
}

/**
 * Resolve a render binding against current form data.
 * Returns the resolved value and staleness indicators.
 */
export function resolveRenderBinding(
  binding: RenderBinding,
  formData: Record<string, unknown>,
): ResolvedBinding {
  const raw = formData[binding.from];
  const hasData = raw !== undefined && raw !== null && raw !== "";

  if (!hasData) {
    return {
      slotId: binding.slotId,
      value: binding.fallback ?? "",
      isStale: false,
      hasData: false,
    };
  }

  // Apply transform
  let value = String(raw);

  if (binding.transform === "date.day") {
    const d = new Date(String(raw));
    value = isNaN(d.getTime()) ? String(raw) : String(d.getDate());
  } else if (binding.transform === "date.month") {
    const d = new Date(String(raw));
    value = isNaN(d.getTime()) ? String(raw) : String(d.getMonth() + 1);
  } else if (binding.transform === "date.year") {
    const d = new Date(String(raw));
    value = isNaN(d.getTime()) ? String(raw) : String(d.getFullYear());
  } else if (binding.transform === "date.full") {
    const d = new Date(String(raw));
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      value = `ngày ${dd} tháng ${mm} năm ${yyyy}`;
    }
  }

  return {
    slotId: binding.slotId,
    value,
    isStale: false,
    hasData: true,
  };
}
