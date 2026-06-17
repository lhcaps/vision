"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm043FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  official: TextRecord;
  legalBasis: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm043FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm043FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm043FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
  },
  document: {
    documentCodeLine: "",
    documentCode: "",
    documentNo: "",
    fullDocumentCode: "",
    issuePlaceAndDateLine: "",
    issueDate: "",
  },
  official: {
    issuerTitle: "",
  },
  legalBasis: {
    baseProcedureLine: "",
    isJuvenile: "true",
    juvenileLegalBasisLine: "",
  },
  measure: {
    accusedName: "",
    offenseName: "",
    detentionOrderCode: "",
    detentionOrderLegalBasisLine: "",
    previousExtensionDecisionLegalBasisLine: "",
    cancelReasonLine: "",
    article1Line: "",
    article2Line: "",
    article3Line: "",
  },
  recipients: {
    detentionExecutionUnitLine: "",
    personLine: "",
    archiveLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Viện kiểm sát ban hành" },
  { section: "document", field: "documentCodeLine", label: "Số quyết định" },
  { section: "document", field: "issuePlaceAndDateLine", label: "Địa danh, ngày ban hành" },
  { section: "measure", field: "accusedName", label: "Tên bị can chính" },
  { section: "measure", field: "offenseName", label: "Tội danh chính" },
  { section: "official", field: "issuerTitle", label: "Chủ thể ban hành" },
  { section: "legalBasis", field: "baseProcedureLine", label: "Căn cứ Bộ luật Tố tụng hình sự" },
  { section: "measure", field: "detentionOrderLegalBasisLine", label: "Căn cứ lệnh tạm giam" },
  { section: "measure", field: "previousExtensionDecisionLegalBasisLine", label: "Căn cứ quyết định gia hạn/truy tố nếu có" },
  { section: "measure", field: "cancelReasonLine", label: "Lý do hủy bỏ tạm giam" },
  { section: "measure", field: "article1Line", label: "Điều 1" },
  { section: "measure", field: "article2Line", label: "Điều 2" },
  { section: "measure", field: "article3Line", label: "Điều 3" },
  { section: "recipients", field: "detentionExecutionUnitLine", label: "Nơi nhận - đơn vị thực hiện" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - bị can" },
  { section: "recipients", field: "archiveLine", label: "Nơi nhận - lưu" },
  { section: "signature", field: "signMode", label: "Chế độ ký" },
  { section: "signature", field: "positionTitle", label: "Chức vụ người ký" },
  { section: "signature", field: "signerName", label: "Họ tên người ký" },
];

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getNestedValue(source: unknown, path: string): string {
  let current: unknown = source;

  for (const part of path.split(".")) {
    if (!current || typeof current !== "object") {
      return "";
    }

    current = (current as Record<string, unknown>)[part];
  }

  return toText(current);
}

function pickText(payload: Record<string, unknown>, ...paths: string[]): string {
  for (const path of paths) {
    const value = getNestedValue(payload, path).trim();

    if (
      value.length > 0 &&
      value.toLowerCase() !== "null" &&
      value.toLowerCase() !== "undefined"
    ) {
      return value;
    }
  }

  return "";
}

function getValue(form: Bm043FormInputs, section: SectionKey, field: string): string {
  return form[section][field] ?? "";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripRecipientName(value: string): string {
  return value
    .replace(/^-+\s*/g, "")
    .replace(/[;.\s]+$/g, "")
    .trim();
}

function extractNameFromLine(value: string): string {
  const text = value.trim();

  if (!text) {
    return "";
  }

  const patterns = [
    /bị can\s+([^,.;]+?)(?=,|\.|$)/i,
    /đối với\s+([^,.;]+?)(?=\s+về tội|,|\.|$)/i,
    /^-+\s*([^;]+);?$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const candidate = match?.[1]?.trim();

    if (candidate) {
      return stripRecipientName(candidate);
    }
  }

  return "";
}

function extractAccusedNameFromPayload(payload: Record<string, unknown>): string {
  const directName = pickText(
    payload,
    "person.fullName",
    "targetPerson.fullName",
    "accused.fullName",
  );

  if (directName) {
    return directName;
  }

  const fromRecipient = extractNameFromLine(
    pickText(payload, "recipients.personLine", "recipients.accusedLine"),
  );

  if (fromRecipient) {
    return fromRecipient;
  }

  const fromArticle1 = extractNameFromLine(pickText(payload, "measure.article1Line"));
  if (fromArticle1) {
    return fromArticle1;
  }

  const fromCancelReason = extractNameFromLine(pickText(payload, "measure.cancelReasonLine"));
  if (fromCancelReason) {
    return fromCancelReason;
  }

  return "";
}

function extractOffenseNameFromLine(value: string): string {
  const text = value.trim();

  if (!text) {
    return "";
  }

  const quoted = text.match(/tội\s+[“"']([^”"']+)[”"']/i);
  if (quoted?.[1]?.trim()) {
    return quoted[1].trim();
  }

  const plain = text.match(/về tội\s+([^,.;]+?)(?=\s+quy định|,|\.|;|$)/i);
  if (plain?.[1]?.trim()) {
    return plain[1].trim();
  }

  return "";
}

function extractOffenseNameFromPayload(payload: Record<string, unknown>): string {
  const directOffense = pickText(
    payload,
    "offense.offenseName",
    "offense.name",
    "caseInfo.offenseName",
  );

  if (directOffense) {
    return directOffense;
  }

  const fromDetentionOrder = extractOffenseNameFromLine(
    pickText(payload, "measure.detentionOrderLegalBasisLine"),
  );

  if (fromDetentionOrder) {
    return fromDetentionOrder;
  }

  const fromPreviousDecision = extractOffenseNameFromLine(
    pickText(payload, "measure.previousExtensionDecisionLegalBasisLine"),
  );

  if (fromPreviousDecision) {
    return fromPreviousDecision;
  }

  return "Đánh bạc";
}

function replaceAccusedNameInText(
  source: string,
  oldName: string,
  nextName: string,
): string {
  const next = nextName.trim();

  if (!source || !next) {
    return source;
  }

  const candidates = Array.from(
    new Set([oldName.trim(), ""].filter(Boolean)),
  );

  let output = source;

  for (const candidate of candidates) {
    if (candidate && output.includes(candidate)) {
      output = output.replace(new RegExp(escapeRegExp(candidate), "g"), next);
    }
  }

  return output;
}

function replaceOffenseNameInText(
  source: string,
  oldOffenseName: string,
  nextOffenseName: string,
): string {
  const next = nextOffenseName.trim();

  if (!source || !next) {
    return source;
  }

  const candidates = Array.from(
    new Set([oldOffenseName.trim(), "Đánh bạc"].filter(Boolean)),
  );

  let output = source;

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    output = output.replace(
      new RegExp(`tội [“"']${escapeRegExp(candidate)}[”"']`, "g"),
      `tội “${next}”`,
    );

    output = output.replace(
      new RegExp(`về tội ${escapeRegExp(candidate)}(?=\\s+quy định|,|\\.|;|$)`, "gi"),
      `về tội “${next}”`,
    );

    output = output.replace(new RegExp(escapeRegExp(candidate), "g"), next);
  }

  return output;
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm043FormInputs {
  const documentCode = pickText(
    payload,
    "document.documentCodeLine",
    "document.documentNo",
    "document.documentCode",
    "document.fullDocumentCode",
  );

  const juvenileLegalBasisLine = pickText(
    payload,
    "legalBasis.juvenileLegalBasisLine",
    "legalBasis.juvenileJusticeLine",
  );

  const accusedName = extractAccusedNameFromPayload(payload);
  const offenseName = extractOffenseNameFromPayload(payload);

  return {
    agency: {
      parentName: pickText(payload, "agency.parentName"),
      name: pickText(payload, "agency.name"),
      issuePlace: pickText(payload, "agency.issuePlace"),
    },
    document: {
      documentCodeLine: documentCode,
      documentCode,
      documentNo: documentCode,
      fullDocumentCode: documentCode,
      issuePlaceAndDateLine: pickText(
        payload,
        "document.issuePlaceAndDateLine",
        "document.issuePlaceDateLine",
      ),
      issueDate: pickText(payload, "document.issueDate"),
    },
    official: {
      issuerTitle: pickText(payload, "official.issuerTitle"),
    },
    legalBasis: {
      baseProcedureLine:
        pickText(payload, "legalBasis.baseProcedureLine") ||
        "Căn cứ các điều 41, 125, 165 và 173 của Bộ luật Tố tụng hình sự;",
      isJuvenile: juvenileLegalBasisLine ? "true" : "false",
      juvenileLegalBasisLine:
        juvenileLegalBasisLine ||
        "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;",
    },
    measure: {
      accusedName,
      offenseName,
      detentionOrderCode: pickText(
        payload,
        "measure.detentionOrderCode",
        "measure.detentionOrderNo",
        "measure.relatedOrderCode",
      ),
      detentionOrderLegalBasisLine: pickText(payload, "measure.detentionOrderLegalBasisLine"),
      previousExtensionDecisionLegalBasisLine: pickText(
        payload,
        "measure.previousExtensionDecisionLegalBasisLine",
      ),
      cancelReasonLine: pickText(payload, "measure.cancelReasonLine"),
      article1Line: pickText(payload, "measure.article1Line"),
      article2Line: pickText(payload, "measure.article2Line"),
      article3Line: pickText(payload, "measure.article3Line"),
    },
    recipients: {
      detentionExecutionUnitLine: pickText(
        payload,
        "recipients.detentionExecutionUnitLine",
        "recipients.investigationUnitLine",
      ),
      personLine: pickText(payload, "recipients.personLine", "recipients.accusedLine"),
      archiveLine: pickText(payload, "recipients.archiveLine"),
    },
    signature: {
      signMode: pickText(payload, "signature.signMode"),
      positionTitle: pickText(payload, "signature.positionTitle"),
      signerName: pickText(payload, "signature.signerName"),
    },
  };
}

async function getBm043RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Không tải được render-payload BM-043. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm043FormInputs(
  documentId: string | number,
  form: Bm043FormInputs,
): Promise<void> {
  const normalizedForm: Bm043FormInputs = {
    ...form,
    legalBasis: {
      ...form.legalBasis,
      juvenileLegalBasisLine:
        form.legalBasis.isJuvenile === "true"
          ? form.legalBasis.juvenileLegalBasisLine
          : "",
    },
  };

  const editableDocumentCode =
    normalizedForm.document.documentCodeLine?.trim() ||
    normalizedForm.document.documentCode?.trim() ||
    normalizedForm.document.documentNo?.trim() ||
    "";

  const savePayload: Bm043FormInputs = {
    ...normalizedForm,
    document: {
      ...normalizedForm.document,
      documentCodeLine: editableDocumentCode,
      documentCode: editableDocumentCode,
      documentNo: editableDocumentCode,
      fullDocumentCode: editableDocumentCode,
    },
  };

  const updatedByName =
    savePayload.signature.signerName?.trim() || "";

  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      updatedByName,
      formInputs: savePayload,
      ...savePayload,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Không lưu được dữ liệu BM-043. HTTP ${response.status}`);
  }
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
  rows = 3,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function normalizeBm043BodyAgencyName(value: string): string {
  const raw = value.trim();

  if (!raw) {
    return "";
  }

  const upper = raw.toUpperCase();

  if (upper === "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7") {
    return "Viện kiểm sát nhân dân khu vực 7";
  }

  if (upper === "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH") {
    return "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh";
  }

  return raw;
}

function extractBm043DateText(value: string): string {
  const vietnamese = value.match(/ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}/i);
  if (vietnamese?.[0]) {
    return vietnamese[0];
  }

  const shortDate = value.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
  if (shortDate?.[0]) {
    return shortDate[0];
  }

  return "ngày 24 tháng 5 năm 2026";
}

function extractBm043OrderCode(value: string): string {
  const match = value.match(/số\s+(.+?)\s+(?:ngày|\d{1,2}\/\d{1,2}\/\d{4})/i);
  return match?.[1]?.trim() || "17/LTG-VKSKV7";
}

function extractBm043LegalArticle(value: string): string {
  const match = value.match(/quy định tại\s+(.+?)(?:;|\.|$)/i);
  return match?.[1]?.trim() || "khoản 1 Điều 321 Bộ luật Hình sự";
}

function extractBm043InvestigationUnit(value: string): string {
  const match = value.match(/của\s+(.+?)\s+đối với/i);
  const unit = match?.[1]?.trim() || "";

  if (
    unit.includes("Cơ quan") ||
    unit.includes("Công an") ||
    unit.includes("Cảnh sát")
  ) {
    return unit;
  }

  return "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";
}

function extractBm043PreviousIssuer(value: string): string {
  const match = value.match(/ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}\s+của\s+(.+?)\s+đối với/i);
  const issuer = match?.[1]?.trim() || "";

  return normalizeBm043BodyAgencyName(issuer || "Viện kiểm sát nhân dân khu vực 7");
}

function buildBm043DetentionOrderLine(args: {
  orderCode: string;
  dateText: string;
  investigationUnit: string;
  accusedName: string;
  offenseName: string;
  legalArticle: string;
}): string {
  return `Căn cứ Lệnh tạm giam/Lệnh bắt bị can để tạm giam số ${args.orderCode} ${args.dateText} của ${args.investigationUnit} đối với ${args.accusedName} về tội “${args.offenseName}” quy định tại ${args.legalArticle};`;
}

function buildBm043PreviousDecisionLine(args: {
  documentCode: string;
  dateText: string;
  issuer: string;
  accusedName: string;
  offenseName: string;
  legalArticle: string;
}): string {
  return `Căn cứ Quyết định gia hạn tạm giam/Quyết định gia hạn thời hạn tạm giam để truy tố số ${args.documentCode} ${args.dateText} của ${args.issuer} đối với ${args.accusedName} về tội “${args.offenseName}” quy định tại ${args.legalArticle};`;
}
export function Bm043FormInputsPanel({
  documentId,
  onSaved,
}: Bm043FormInputsPanelProps) {
  const [form, setForm] = useState<Bm043FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      if (
        item.section === "legalBasis" &&
        item.field === "juvenileLegalBasisLine" &&
        form.legalBasis.isJuvenile !== "true"
      ) {
        return false;
      }

      return !getValue(form, item.section, item.field).trim();
    });
  }, [form]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getBm043RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không tải được dữ liệu biểu mẫu BM-043.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [field]: value,
      },
    }));
  }

  function updateAccusedName(value: string) {
    setForm((current) => {
      const accusedName = value.trim();
      const safeAccusedName = accusedName || "";
      const offenseName = current.measure.offenseName?.trim() || "Đánh bạc";

      const detentionLine = current.measure.detentionOrderLegalBasisLine ?? "";
      const previousLine = current.measure.previousExtensionDecisionLegalBasisLine ?? "";

      const orderCode =
        current.measure.detentionOrderCode?.trim() ||
        extractBm043OrderCode(detentionLine);

      const dateText = extractBm043DateText(detentionLine || previousLine);
      const legalArticle = extractBm043LegalArticle(detentionLine || previousLine);
      const investigationUnit = extractBm043InvestigationUnit(detentionLine);
      const previousIssuer = extractBm043PreviousIssuer(previousLine);

      return {
        ...current,
        measure: {
          ...current.measure,
          accusedName: value,
          detentionOrderCode: orderCode,
          detentionOrderLegalBasisLine: buildBm043DetentionOrderLine({
            orderCode,
            dateText,
            investigationUnit,
            accusedName: safeAccusedName,
            offenseName,
            legalArticle,
          }),
          previousExtensionDecisionLegalBasisLine: buildBm043PreviousDecisionLine({
            documentCode: current.document.documentCodeLine || "43/QĐ-VKSKV7",
            dateText,
            issuer: previousIssuer,
            accusedName: safeAccusedName,
            offenseName,
            legalArticle,
          }),
          cancelReasonLine: `Xét thấy không còn cần thiết tiếp tục áp dụng biện pháp tạm giam đối với bị can ${safeAccusedName},`,
          article1Line: `Hủy bỏ biện pháp tạm giam đối với bị can ${safeAccusedName}.`,
          article3Line: `Yêu cầu ${safeAccusedName} phải có mặt khi cơ quan, người có thẩm quyền tiến hành tố tụng triệu tập theo quy định./.`,
        },
        recipients: {
          ...current.recipients,
          personLine: accusedName ? `- ${safeAccusedName};` : "",
        },
      };
    });
  }

  function updateOffenseName(value: string) {
    setForm((current) => {
      const offenseName = value.trim();
      const safeOffenseName = offenseName || "Đánh bạc";
      const accusedName = current.measure.accusedName?.trim() || "";

      const detentionLine = current.measure.detentionOrderLegalBasisLine ?? "";
      const previousLine = current.measure.previousExtensionDecisionLegalBasisLine ?? "";

      const orderCode =
        current.measure.detentionOrderCode?.trim() ||
        extractBm043OrderCode(detentionLine);

      const dateText = extractBm043DateText(detentionLine || previousLine);
      const legalArticle = extractBm043LegalArticle(detentionLine || previousLine);
      const investigationUnit = extractBm043InvestigationUnit(detentionLine);
      const previousIssuer = extractBm043PreviousIssuer(previousLine);

      return {
        ...current,
        measure: {
          ...current.measure,
          offenseName: value,
          detentionOrderCode: orderCode,
          detentionOrderLegalBasisLine: buildBm043DetentionOrderLine({
            orderCode,
            dateText,
            investigationUnit,
            accusedName,
            offenseName: safeOffenseName,
            legalArticle,
          }),
          previousExtensionDecisionLegalBasisLine: buildBm043PreviousDecisionLine({
            documentCode: current.document.documentCodeLine || "43/QĐ-VKSKV7",
            dateText,
            issuer: previousIssuer,
            accusedName,
            offenseName: safeOffenseName,
            legalArticle,
          }),
        },
      };
    });
  }

  function fillCustomerSample() {
    const sample: Bm043FormInputs = {
      agency: {
        parentName: "",
        name: "",
        issuePlace: "TP. Hồ Chí Minh",
      },
      document: {
        documentCodeLine: "43/QĐ-VKSKV7",
        documentCode: "43/QĐ-VKSKV7",
        documentNo: "43/QĐ-VKSKV7",
        fullDocumentCode: "43/QĐ-VKSKV7",
        issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 24 tháng 5 năm 2026",
        issueDate: "24/05/2026",
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      legalBasis: {
        baseProcedureLine:
          "Căn cứ các điều 41, 125, 165 và 173 của Bộ luật Tố tụng hình sự;",
        isJuvenile: "true",
        juvenileLegalBasisLine:
          "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;",
      },
      measure: {
        accusedName: "",
        offenseName: "",
        detentionOrderCode: "17/LTG-VKSKV7",
        detentionOrderLegalBasisLine:
          "Căn cứ Lệnh tạm giam/Lệnh bắt bị can để tạm giam số 17/LTG-VKSKV7 ngày 24 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với  về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự;",
        previousExtensionDecisionLegalBasisLine:
          "Căn cứ Quyết định gia hạn tạm giam/Quyết định gia hạn thời hạn tạm giam để truy tố số 42/QĐ-VKSKV7 ngày 24 tháng 5 năm 2026 của Viện kiểm sát nhân dân khu vực 7 đối với  về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự;",
        cancelReasonLine:
          "Xét thấy không còn cần thiết tiếp tục áp dụng biện pháp tạm giam đối với bị can ,",
        article1Line:
          "Hủy bỏ biện pháp tạm giam đối với bị can .",
        article2Line:
          "Yêu cầu Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự.",
        article3Line:
          "Yêu cầu  phải có mặt khi cơ quan, người có thẩm quyền tiến hành tố tụng triệu tập theo quy định./.",
      },
      recipients: {
        detentionExecutionUnitLine:
          "- Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh;",
        personLine: "- ;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
    };

    setForm(sample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await saveBm043FormInputs(documentId, form);

      setInitialSnapshot(JSON.stringify(form));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không lưu được dữ liệu biểu mẫu BM-043.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-043...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          BM-043
        </p>

        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Dữ liệu Quyết định hủy bỏ biện pháp tạm giam
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Form này chỉ phục vụ BM-043. Nhập tên bị can và tội danh chính một lần,
              hệ thống tự đồng bộ sang các dòng căn cứ, lý do hủy bỏ, Điều 1/3 và nơi nhận.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadForm}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Tải lại từ backend
            </button>

            <button
              type="button"
              onClick={fillCustomerSample}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              Điền dữ liệu mẫu BM-043
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Còn thiếu {missingFields.length} trường bắt buộc:{" "}
            {missingFields.map((field) => field.label).join(", ")}.
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Đã đủ trường bắt buộc để lưu và render BM-043.
          </div>
        )}
      </div>

      <SectionCard title="1. Thông tin chính cần đồng bộ">
        <TextInput
          label="Tên bị can chính"
          value={form.measure.accusedName}
          onChange={updateAccusedName}
          required
          placeholder=""
        />

        <TextInput
          label="Tội danh chính"
          value={form.measure.offenseName}
          onChange={updateOffenseName}
          required
          placeholder="Đánh bạc"
        />

        <TextInput
          label="Cơ quan cấp trên"
          value={form.agency.parentName}
          onChange={(value) => updateField("agency", "parentName", value)}
          required
        />
        <TextInput
          label="Viện kiểm sát ban hành"
          value={form.agency.name}
          onChange={(value) => updateField("agency", "name", value)}
          required
        />
        <TextInput
          label="Số quyết định"
          value={form.document.documentCodeLine}
          onChange={(value) => updateField("document", "documentCodeLine", value)}
          required
          placeholder="43/QĐ-VKSKV7"
        />
        <TextInput
          label="Địa danh, ngày ban hành"
          value={form.document.issuePlaceAndDateLine}
          onChange={(value) => updateField("document", "issuePlaceAndDateLine", value)}
          required
        />
      </SectionCard>

      <SectionCard title="2. Chủ thể ban hành / căn cứ pháp lý">
        <TextInput
          label="Chủ thể ban hành"
          value={form.official.issuerTitle}
          onChange={(value) => updateField("official", "issuerTitle", value)}
          required
        />

        <TextArea
          label="Căn cứ Bộ luật Tố tụng hình sự"
          value={form.legalBasis.baseProcedureLine}
          onChange={(value) => updateField("legalBasis", "baseProcedureLine", value)}
          required
          rows={2}
          className="md:col-span-2"
        />

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
          <input
            type="checkbox"
            checked={form.legalBasis.isJuvenile === "true"}
            onChange={(event) =>
              updateField("legalBasis", "isJuvenile", event.target.checked ? "true" : "false")
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm font-semibold text-slate-700">
            Có áp dụng căn cứ Luật Tư pháp người chưa thành niên
          </span>
        </label>

        {form.legalBasis.isJuvenile === "true" ? (
          <TextArea
            label="Căn cứ Luật Tư pháp người chưa thành niên"
            value={form.legalBasis.juvenileLegalBasisLine}
            onChange={(value) => updateField("legalBasis", "juvenileLegalBasisLine", value)}
            rows={2}
            className="md:col-span-2"
          />
        ) : null}

        <TextArea
          label="Căn cứ lệnh tạm giam"
          value={form.measure.detentionOrderLegalBasisLine}
          onChange={(value) => updateField("measure", "detentionOrderLegalBasisLine", value)}
          required
          rows={4}
          className="md:col-span-2"
        />

        <TextArea
          label="Căn cứ quyết định gia hạn/truy tố nếu có"
          value={form.measure.previousExtensionDecisionLegalBasisLine}
          onChange={(value) =>
            updateField("measure", "previousExtensionDecisionLegalBasisLine", value)
          }
          required
          rows={4}
          className="md:col-span-2"
        />

        <TextArea
          label="Lý do hủy bỏ biện pháp tạm giam"
          value={form.measure.cancelReasonLine}
          onChange={(value) => updateField("measure", "cancelReasonLine", value)}
          required
          rows={3}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="3. Nội dung quyết định">
        <TextArea
          label="Điều 1"
          value={form.measure.article1Line}
          onChange={(value) => updateField("measure", "article1Line", value)}
          required
          rows={3}
          className="md:col-span-2"
        />

        <TextArea
          label="Điều 2"
          value={form.measure.article2Line}
          onChange={(value) => updateField("measure", "article2Line", value)}
          required
          rows={3}
          className="md:col-span-2"
        />

        <TextArea
          label="Điều 3"
          value={form.measure.article3Line}
          onChange={(value) => updateField("measure", "article3Line", value)}
          required
          rows={3}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="4. Nơi nhận">
        <TextInput
          label="Đơn vị thực hiện quyết định"
          value={form.recipients.detentionExecutionUnitLine}
          onChange={(value) => updateField("recipients", "detentionExecutionUnitLine", value)}
          required
        />
        <TextInput
          label="Bị can"
          value={form.recipients.personLine}
          onChange={(value) => updateField("recipients", "personLine", value)}
          required
        />
        <TextInput
          label="Lưu"
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
          required
        />
      </SectionCard>

      <SectionCard title="5. Chữ ký">
        <TextInput
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          required
        />
        <TextInput
          label="Chức vụ"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          required
        />
        <TextInput
          label="Người ký"
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          required
        />
      </SectionCard>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            {savedAt ? (
              <span>
                Đã lưu lúc{" "}
                <strong className="font-semibold text-slate-900">
                  {savedAt.toLocaleTimeString("vi-VN")}
                </strong>
              </span>
            ) : (
              <span>Chưa lưu thay đổi trong phiên này.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-043"}
          </button>
        </div>
      </div>
    </section>
  );
}