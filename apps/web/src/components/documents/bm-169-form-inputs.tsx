"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldSelect,
  BmFieldCheckbox,
  BmFormSection,
  BmFormMetaBar,
} from "./bm-form";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;
type EvidenceHandlingRecord = Record<string, string | boolean>;

type Bm169FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  official: TextRecord;
  legalBasis: TextRecord;
  caseDecision: TextRecord;
  accusedDecision: TextRecord;
  evidenceHandling: EvidenceHandlingRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm169FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Props = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm169FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
  },
  document: {
    documentCode: "",
    issueDate: "",
    issuePlaceAndDateLine: "",
  },
  official: {
    issuerTitle: "",
  },
  legalBasis: {
    procedureArticlesLine: "",
  },
  caseDecision: {
    decisionCode: "",
    decisionDate: "",
    prosecutionDecisionLegalBasisLine: "",
  },
  accusedDecision: {
    decisionCode: "",
    decisionDate: "",
    accusedName: "",
    prosecutionDecisionLegalBasisLine: "",
  },
  evidenceHandling: {
    includeAccusedDecisionLine: true,
    includeCaseSuspensionDecisionLine: true,
    includeAccusedSuspensionDecisionLine: true,

    agencyBodyName: "",
    investigationAgencyName: "",
    offenseName: "",
    legalClause: "",
    legalArticle: "",
    accusedName: "",

    investigationConclusionCode: "",
    investigationConclusionDate: "",
    investigationConclusionLegalBasisLine: "",

    caseSuspensionDecisionCode: "",
    caseSuspensionDecisionDate: "",
    caseSuspensionDecisionLegalBasisLine: "",

    accusedSuspensionDecisionCode: "",
    accusedSuspensionDecisionDate: "",
    accusedSuspensionDecisionLegalBasisLine: "",

    considerationLine: "",
    evidenceListLine: "",
    handlingMethodLine: "",
    executionRequestLine: "",
  },
  recipients: {
    line1: "",
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
  { section: "agency", field: "issuePlace", label: "Địa danh ban hành" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày quyết định" },
  { section: "official", field: "issuerTitle", label: "Dòng thẩm quyền" },
  { section: "caseDecision", field: "decisionCode", label: "Số QĐ khởi tố vụ án" },
  { section: "caseDecision", field: "decisionDate", label: "Ngày QĐ khởi tố vụ án" },
  { section: "evidenceHandling", field: "investigationConclusionCode", label: "Số bản kết luận điều tra" },
  { section: "evidenceHandling", field: "investigationConclusionDate", label: "Ngày bản kết luận điều tra" },
  { section: "evidenceHandling", field: "investigationAgencyName", label: "Cơ quan điều tra" },
  { section: "evidenceHandling", field: "offenseName", label: "Tên tội" },
  { section: "evidenceHandling", field: "legalClause", label: "Khoản" },
  { section: "evidenceHandling", field: "legalArticle", label: "Điều luật" },
  { section: "evidenceHandling", field: "evidenceListLine", label: "Vật chứng" },
  { section: "evidenceHandling", field: "handlingMethodLine", label: "Hình thức xử lý" },
  { section: "signature", field: "positionTitle", label: "Chức vụ ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

const SIGN_MODE_OPTIONS = [
  { value: "KT. VIỆN TRƯỞNG", label: "KT. VIỆN TRƯỞNG" },
  { value: "VIỆN TRƯỞNG", label: "VIỆN TRƯỞNG" },
  { value: "TUQ. VIỆN TRƯỞNG", label: "TUQ. VIỆN TRƯỞNG" },
];

const POSITION_OPTIONS = [
  { value: "VIỆN TRƯỞNG", label: "VIỆN TRƯỞNG" },
  { value: "PHÓ VIỆN TRƯỞNG", label: "PHÓ VIỆN TRƯỞNG" },
  { value: "KIỂM SÁT VIÊN", label: "KIỂM SÁT VIÊN" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];
  return isRecord(value) ? value : {};
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function pick(record: Record<string, unknown>, key: string): string {
  return text(record[key]);
}

function bool(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === "boolean") return value;

  const raw = text(value).trim().toLowerCase();
  if (!raw) return defaultValue;

  if (["true", "1", "yes", "y", "co", "có"].includes(raw)) return true;
  if (["false", "0", "no", "n", "khong", "không"].includes(raw)) return false;

  return defaultValue;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const current = text(value).trim();
    if (current && current !== "null" && current !== "NULL") return current;
  }

  return "";
}

function toDateInput(value: unknown): string {
  const raw = text(value).trim();

  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slash) {
    const [, day, month, year] = slash;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const vn = raw.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (vn) {
    const [, day, month, year] = vn;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function splitIsoDate(value: string): { day: string; month: string; year: string } {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (!match) return { day: "", month: "", year: "" };

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
}

function makeIsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function toVietnameseDate(value: string): string {
  const { day, month, year } = splitIsoDate(value);
  if (!day || !month || !year) return "";
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function ensureEnd(value: string, ending: string): string {
  const clean = value
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();

  if (!clean) return "";
  return clean.endsWith(ending) ? clean : `${clean}${ending}`;
}

function normalizeAgencyBodyName(value: string): string {
  return value
    .replace(/VIỆN KIỂM SÁT NHÂN DÂN/gu, "Viện kiểm sát nhân dân")
    .replace(/KHU VỰC/gu, "khu vực")
    .replace(/THÀNH PHỐ/gu, "Thành phố")
    .replace(/TỈNH/gu, "tỉnh")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function getValue(form: Bm169FormInputs, sectionKey: SectionKey, field: string): string {
  const value = form[sectionKey][field];
  return typeof value === "string" ? value : "";
}

function buildDerivedFields(form: Bm169FormInputs): Bm169FormInputs {
  const issueDateText = toVietnameseDate(form.document.issueDate);
  const issuePlace = form.agency.issuePlace.trim() || "TP. Hồ Chí Minh";
  const agencyBodyName =
    text(form.evidenceHandling.agencyBodyName).trim() ||
    normalizeAgencyBodyName(form.agency.name);

  const investigationAgencyName = text(form.evidenceHandling.investigationAgencyName).trim();
  const offenseName = text(form.evidenceHandling.offenseName).trim();
  const legalClause = text(form.evidenceHandling.legalClause).trim();
  const legalArticle = text(form.evidenceHandling.legalArticle).trim();
  const accusedName =
    text(form.evidenceHandling.accusedName).trim() ||
    text(form.accusedDecision.accusedName).trim();

  const caseDecisionDateText = toVietnameseDate(form.caseDecision.decisionDate);
  const accusedDecisionDateText = toVietnameseDate(form.accusedDecision.decisionDate);
  const investigationConclusionDateText = toVietnameseDate(
    text(form.evidenceHandling.investigationConclusionDate),
  );
  const caseSuspensionDecisionDateText = toVietnameseDate(
    text(form.evidenceHandling.caseSuspensionDecisionDate),
  );
  const accusedSuspensionDecisionDateText = toVietnameseDate(
    text(form.evidenceHandling.accusedSuspensionDecisionDate),
  );

  const caseDecisionLine = ensureEnd(
    `Căn cứ Quyết định khởi tố vụ án hình sự số ${form.caseDecision.decisionCode}${
      caseDecisionDateText ? ` ${caseDecisionDateText}` : ""
    } của ${investigationAgencyName} về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} của Bộ luật Hình sự`,
    ";",
  );

  const accusedDecisionLine = form.evidenceHandling.includeAccusedDecisionLine
    ? ensureEnd(
        `Căn cứ Quyết định khởi tố bị can số ${form.accusedDecision.decisionCode}${
          accusedDecisionDateText ? ` ${accusedDecisionDateText}` : ""
        } của ${investigationAgencyName} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} của Bộ luật Hình sự`,
        ";",
      )
    : "";

  const investigationConclusionLegalBasisLine = ensureEnd(
    `Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số ${text(
      form.evidenceHandling.investigationConclusionCode,
    )}${investigationConclusionDateText ? ` ${investigationConclusionDateText}` : ""} của ${investigationAgencyName}`,
    ";",
  );

  const caseSuspensionDecisionLegalBasisLine =
    form.evidenceHandling.includeCaseSuspensionDecisionLine
      ? ensureEnd(
          `Căn cứ Quyết định đình chỉ/tạm đình chỉ vụ án hình sự số ${text(
            form.evidenceHandling.caseSuspensionDecisionCode,
          )}${caseSuspensionDecisionDateText ? ` ${caseSuspensionDecisionDateText}` : ""} của ${agencyBodyName}`,
          ";",
        )
      : "";

  const accusedSuspensionDecisionLegalBasisLine =
    form.evidenceHandling.includeAccusedSuspensionDecisionLine
      ? ensureEnd(
          `Căn cứ Quyết định đình chỉ/tạm đình chỉ vụ án hình sự đối với bị can số ${text(
            form.evidenceHandling.accusedSuspensionDecisionCode,
          )}${
            accusedSuspensionDecisionDateText ? ` ${accusedSuspensionDecisionDateText}` : ""
          } của ${agencyBodyName}`,
          ";",
        )
      : "";

  const considerationLine = ensureEnd(
    firstText(
      form.evidenceHandling.considerationLine,
      "Xét thấy cần xử lý vật chứng trong vụ án theo quy định của pháp luật",
    ),
    ",",
  );

  const evidenceListLine = ensureEnd(text(form.evidenceHandling.evidenceListLine), ".");
  const handlingMethodLine = ensureEnd(text(form.evidenceHandling.handlingMethodLine), ".");
  const executionRequestLine = ensureEnd(
    firstText(
      form.evidenceHandling.executionRequestLine,
      `Yêu cầu ${investigationAgencyName} thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự`,
    ),
    "./.",
  );

  return {
    ...form,
    document: {
      ...form.document,
      issuePlaceAndDateLine: issueDateText ? `${issuePlace}, ${issueDateText}` : "",
    },
    legalBasis: {
      ...form.legalBasis,
      procedureArticlesLine:
        "Căn cứ các điều 41, 90, 106 và 248 của Bộ luật Tố tụng hình sự;",
    },
    caseDecision: {
      ...form.caseDecision,
      prosecutionDecisionLegalBasisLine: caseDecisionLine,
    },
    accusedDecision: {
      ...form.accusedDecision,
      accusedName,
      prosecutionDecisionLegalBasisLine: accusedDecisionLine,
    },
    evidenceHandling: {
      ...form.evidenceHandling,
      agencyBodyName,
      accusedName,
      investigationAgencyName,
      offenseName,
      legalClause,
      legalArticle,
      investigationConclusionLegalBasisLine,
      caseSuspensionDecisionLegalBasisLine,
      accusedSuspensionDecisionLegalBasisLine,
      considerationLine,
      evidenceListLine,
      handlingMethodLine,
      executionRequestLine,
    },
    recipients: {
      ...form.recipients,
      line1: investigationAgencyName ? `- ${investigationAgencyName};` : "",
      archiveLine: form.recipients.archiveLine || "- Lưu: HSVA, HSKS, VP.",
    },
  };
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm169FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const official = section(payload, "official");
  const legalBasis = section(payload, "legalBasis");
  const caseDecision = section(payload, "caseDecision");
  const accusedDecision = section(payload, "accusedDecision");
  const evidenceHandling = section(payload, "evidenceHandling");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");
  const person = section(payload, "person");

  const form: Bm169FormInputs = {
    agency: {
      parentName: pick(agency, "parentName"),
      name: pick(agency, "name"),
      issuePlace: firstText(pick(agency, "issuePlace"), "TP. Hồ Chí Minh"),
    },
    document: {
      documentCode: pick(document, "documentCode"),
      issueDate: toDateInput(document.issueDate),
      issuePlaceAndDateLine: pick(document, "issuePlaceAndDateLine"),
    },
    official: {
      issuerTitle: firstText(
        pick(official, "issuerTitle"),
        "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      ),
    },
    legalBasis: {
      procedureArticlesLine: firstText(
        pick(legalBasis, "procedureArticlesLine"),
        "Căn cứ các điều 41, 90, 106 và 248 của Bộ luật Tố tụng hình sự;",
      ),
    },
    caseDecision: {
      decisionCode: firstText(pick(caseDecision, "decisionCode"), pick(caseDecision, "decisionNo"), ""),
      decisionDate: firstText(toDateInput(caseDecision.decisionDate), toDateInput(caseDecision.issueDate), "2026-05-06"),
      prosecutionDecisionLegalBasisLine: pick(caseDecision, "prosecutionDecisionLegalBasisLine"),
    },
    accusedDecision: {
      decisionCode: firstText(pick(accusedDecision, "decisionCode"), pick(accusedDecision, "decisionNo"), ""),
      decisionDate: firstText(toDateInput(accusedDecision.decisionDate), toDateInput(accusedDecision.issueDate), "2026-05-06"),
      accusedName: firstText(pick(accusedDecision, "accusedName"), pick(evidenceHandling, "accusedName"), pick(person, "fullName"), ""),
      prosecutionDecisionLegalBasisLine: pick(accusedDecision, "prosecutionDecisionLegalBasisLine"),
    },
    evidenceHandling: {
      includeAccusedDecisionLine: bool(evidenceHandling.includeAccusedDecisionLine, true),
      includeCaseSuspensionDecisionLine: bool(evidenceHandling.includeCaseSuspensionDecisionLine, true),
      includeAccusedSuspensionDecisionLine: bool(evidenceHandling.includeAccusedSuspensionDecisionLine, true),

      agencyBodyName: firstText(pick(evidenceHandling, "agencyBodyName"), normalizeAgencyBodyName(pick(agency, "name"))),
      investigationAgencyName: firstText(
        pick(evidenceHandling, "investigationAgencyName"),
        pick(recipients, "line1").replace(/^-\s*/u, "").replace(/[;.]\s*$/u, ""),
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      ),
      offenseName: firstText(pick(evidenceHandling, "offenseName"), "Đánh bạc"),
      legalClause: firstText(pick(evidenceHandling, "legalClause"), "khoản 1"),
      legalArticle: firstText(pick(evidenceHandling, "legalArticle"), "Điều 321"),
      accusedName: firstText(pick(evidenceHandling, "accusedName"), pick(person, "fullName"), ""),

      investigationConclusionCode: firstText(pick(evidenceHandling, "investigationConclusionCode"), "01/KLĐT"),
      investigationConclusionDate: firstText(toDateInput(evidenceHandling.investigationConclusionDate), toDateInput(document.issueDate)),
      investigationConclusionLegalBasisLine: pick(evidenceHandling, "investigationConclusionLegalBasisLine"),

      caseSuspensionDecisionCode: firstText(pick(evidenceHandling, "caseSuspensionDecisionCode"), pick(document, "documentCode")),
      caseSuspensionDecisionDate: firstText(toDateInput(evidenceHandling.caseSuspensionDecisionDate), toDateInput(document.issueDate)),
      caseSuspensionDecisionLegalBasisLine: pick(evidenceHandling, "caseSuspensionDecisionLegalBasisLine"),

      accusedSuspensionDecisionCode: firstText(pick(evidenceHandling, "accusedSuspensionDecisionCode"), pick(document, "documentCode")),
      accusedSuspensionDecisionDate: firstText(toDateInput(evidenceHandling.accusedSuspensionDecisionDate), toDateInput(document.issueDate)),
      accusedSuspensionDecisionLegalBasisLine: pick(evidenceHandling, "accusedSuspensionDecisionLegalBasisLine"),

      considerationLine: firstText(
        pick(evidenceHandling, "considerationLine"),
        "Xét thấy cần xử lý vật chứng trong vụ án theo quy định của pháp luật,",
      ),
      evidenceListLine: firstText(
        pick(evidenceHandling, "evidenceListLine"),
        "01 điện thoại di động màu đen đã qua sử dụng và các tài liệu, đồ vật liên quan trong hồ sơ vụ án.",
      ),
      handlingMethodLine: firstText(
        pick(evidenceHandling, "handlingMethodLine"),
        "Tịch thu sung quỹ Nhà nước đối với tài sản có giá trị; tiêu hủy vật không còn giá trị sử dụng theo quy định.",
      ),
      executionRequestLine: pick(evidenceHandling, "executionRequestLine"),
    },
    recipients: {
      line1: pick(recipients, "line1"),
      archiveLine: firstText(pick(recipients, "archiveLine"), "- Lưu: HSVA, HSKS, VP."),
    },
    signature: {
      signMode: firstText(pick(signature, "signMode"), "KT. VIỆN TRƯỞNG"),
      positionTitle: firstText(pick(signature, "positionTitle"), "PHÓ VIỆN TRƯỞNG"),
      signerName: firstText(pick(signature, "signerName"), ""),
    },
  };

  return buildDerivedFields(form);
}

async function getRenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không tải được payload BM-169. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveFormInputs(documentId: string | number, form: Bm169FormInputs): Promise<void> {
  const syncedInput: Bm169FormInputs = {
    ...form,
    accusedDecision: {
      ...form.accusedDecision,
      accusedName: text(form.evidenceHandling.accusedName) || form.accusedDecision.accusedName,
    },
    evidenceHandling: {
      ...form.evidenceHandling,
      includeAccusedDecisionLine: Boolean(form.evidenceHandling.includeAccusedDecisionLine),
      includeCaseSuspensionDecisionLine: Boolean(form.evidenceHandling.includeCaseSuspensionDecisionLine),
      includeAccusedSuspensionDecisionLine: Boolean(
        form.evidenceHandling.includeAccusedSuspensionDecisionLine,
      ),
      accusedName: text(form.evidenceHandling.accusedName) || form.accusedDecision.accusedName,
    },
  };

  const finalForm = buildDerivedFields(syncedInput);

  const body = {
    formInputs: finalForm,
    agency: finalForm.agency,
    document: finalForm.document,
    official: finalForm.official,
    legalBasis: finalForm.legalBasis,
    caseDecision: finalForm.caseDecision,
    accusedDecision: finalForm.accusedDecision,
    evidenceHandling: finalForm.evidenceHandling,
    recipients: finalForm.recipients,
    signature: finalForm.signature,
    updatedByName: "",
  };

  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(responseBody || `Không lưu được dữ liệu BM-169. HTTP ${response.status}`);
  }
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      )}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span> : null}
      </span>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">-- Chọn --</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateSelectField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const parsed = splitIsoDate(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const next = splitIsoDate(value);
    setDay(next.day);
    setMonth(next.month);
    setYear(next.year);
  }, [value]);

  function update(nextDay: string, nextMonth: string, nextYear: string) {
    setDay(nextDay);
    setMonth(nextMonth);
    setYear(nextYear);

    if (!nextDay && !nextMonth && !nextYear) {
      onChange("");
      return;
    }

    if (nextDay && nextMonth && nextYear) {
      onChange(makeIsoDate(nextDay, nextMonth, nextYear));
    }
  }

  const currentYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: 100 }, (_, index) => String(currentYear - index));

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <div className="grid grid-cols-3 gap-2">
        <select value={day} onChange={(event) => update(event.target.value, month, year)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
          <option value="">Ngày</option>
          {Array.from({ length: 31 }, (_, index) => {
            const item = String(index + 1).padStart(2, "0");
            return <option key={item} value={item}>{index + 1}</option>;
          })}
        </select>

        <select value={month} onChange={(event) => update(day, event.target.value, year)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
          <option value="">Tháng</option>
          {Array.from({ length: 12 }, (_, index) => {
            const item = String(index + 1).padStart(2, "0");
            return <option key={item} value={item}>{index + 1}</option>;
          })}
        </select>

        <select value={year} onChange={(event) => update(day, month, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
          <option value="">Năm</option>
          {years.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </label>
  );
}


export function Bm169FormInputsPanel({ documentId, onSaved }: Props) {
  const [form, setForm] = useState<Bm169FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const derivedForm = useMemo(() => buildDerivedFields(form), [form]);
  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => !getValue(form, item.section, item.field).trim());
  }, [form]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getRenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);
      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-169.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => {
      const next: Bm169FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };

      if (sectionKey === "evidenceHandling" && field === "accusedName") {
        next.accusedDecision = {
          ...next.accusedDecision,
          accusedName: value,
        };
      }

      if (sectionKey === "accusedDecision" && field === "accusedName") {
        next.evidenceHandling = {
          ...next.evidenceHandling,
          accusedName: value,
        };
      }

      return next;
    });
  }

  function updateBool(field: string, value: boolean) {
    setForm((current) => ({
      ...current,
      evidenceHandling: {
        ...current.evidenceHandling,
        [field]: value,
      },
    }));
  }

  function fillSample() {
    setForm(
      buildDerivedFields({
        ...EMPTY_FORM,
        agency: {
          parentName: "",
          name: "",
          issuePlace: "TP. Hồ Chí Minh",
        },
        document: {
          documentCode: "19/QĐ-VKSKV7",
          issueDate: "2026-05-29",
          issuePlaceAndDateLine: "",
        },
        official: {
          issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        },
        legalBasis: {
          procedureArticlesLine:
            "Căn cứ các điều 41, 90, 106 và 248 của Bộ luật Tố tụng hình sự;",
        },
        caseDecision: {
          decisionCode: "",
          decisionDate: "2026-05-06",
          prosecutionDecisionLegalBasisLine: "",
        },
        accusedDecision: {
          decisionCode: "",
          decisionDate: "2026-05-06",
          accusedName: "",
          prosecutionDecisionLegalBasisLine: "",
        },
        evidenceHandling: {
          ...EMPTY_FORM.evidenceHandling,
          includeAccusedDecisionLine: true,
          includeCaseSuspensionDecisionLine: true,
          includeAccusedSuspensionDecisionLine: true,
          agencyBodyName: "Viện kiểm sát nhân dân khu vực 7",
          investigationAgencyName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
          offenseName: "",
          legalClause: "khoản 1",
          legalArticle: "Điều 321",
          accusedName: "",
          investigationConclusionCode: "01/KLĐT",
          investigationConclusionDate: "2026-05-29",
          caseSuspensionDecisionCode: "19/QĐ-VKSKV7",
          caseSuspensionDecisionDate: "2026-05-29",
          accusedSuspensionDecisionCode: "20/QĐ-VKSKV7",
          accusedSuspensionDecisionDate: "2026-05-29",
          considerationLine: "Xét thấy cần xử lý vật chứng trong vụ án theo quy định của pháp luật",
          evidenceListLine: "01 điện thoại di động màu đen đã qua sử dụng và các tài liệu, đồ vật liên quan trong hồ sơ vụ án",
          handlingMethodLine: "Tịch thu sung quỹ Nhà nước đối với tài sản có giá trị; tiêu hủy vật không còn giá trị sử dụng theo quy định",
          executionRequestLine: "",
        },
        recipients: {
          line1: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
          archiveLine: "- Lưu: HSVA, HSKS, VP.",
        },
        signature: {
          signMode: "KT. VIỆN TRƯỞNG",
          positionTitle: "PHÓ VIỆN TRƯỞNG",
          signerName: "",
        },
      }),
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const finalForm = buildDerivedFields(form);
      await saveFormInputs(documentId, finalForm);

      setForm(finalForm);
      setInitialSnapshot(JSON.stringify(finalForm));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được dữ liệu BM-169.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-169...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-169" form={form} onApply={(next) => setForm(next as typeof form)} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">BM-169</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu Quyết định xử lý vật chứng
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Chỉ nhập dữ liệu nguồn chính. Các dòng căn cứ và Điều 2 sẽ tự sinh. Dòng “nếu có” được điều khiển bằng checkbox.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm md:items-end">
            {isDirty ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">Có thay đổi chưa lưu</span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">Đã đồng bộ</span>
            )}
            {savedAt ? <span className="text-xs text-slate-500">Lưu lúc {savedAt.toLocaleTimeString("vi-VN")}</span> : null}
          </div>
        </div>

        {errorMessage ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">Còn thiếu {missingFields.length} trường chính:</p>
            <p className="mt-1 text-sm text-amber-700">{missingFields.map((item) => item.label).join(", ")}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Dữ liệu chính đã đủ. Có thể lưu và render.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={fillSample} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
            Điền dữ liệu mẫu
          </button>
          <button type="button" onClick={loadForm} disabled={isSaving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            Tải lại từ backend
          </button>
        </div>
      </section>

      <BmFormSection title="1. Quyết định">
        <BmFieldText required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} />
        <BmFieldText required label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} />
        <BmFieldText required label="Tên cơ quan trong nội dung" value={text(form.evidenceHandling.agencyBodyName)} onChange={(value) => updateField("evidenceHandling", "agencyBodyName", value)} />
        <BmFieldText required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
        <BmFieldText required label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <DateSelectField required label="Ngày quyết định" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <BmFieldText required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} fullWidth />
      </BmFormSection>

      <BmFormSection title="2. Vụ án / tội danh">
        <BmFieldText required label="Tên tội" value={text(form.evidenceHandling.offenseName)} onChange={(value) => updateField("evidenceHandling", "offenseName", value)} />
        <BmFieldText required label="Khoản" value={text(form.evidenceHandling.legalClause)} onChange={(value) => updateField("evidenceHandling", "legalClause", value)} />
        <BmFieldText required label="Điều luật BLHS" value={text(form.evidenceHandling.legalArticle)} onChange={(value) => updateField("evidenceHandling", "legalArticle", value)} />
        <BmFieldText required label="Bị can" value={text(form.evidenceHandling.accusedName)} onChange={(value) => {
          updateField("evidenceHandling", "accusedName", value);
          updateField("accusedDecision", "accusedName", value);
        }} />
        <BmFieldText required label="Cơ quan điều tra" value={text(form.evidenceHandling.investigationAgencyName)} onChange={(value) => updateField("evidenceHandling", "investigationAgencyName", value)} fullWidth />
      </BmFormSection>

      <BmFormSection title="3. Căn cứ chính">
        <BmFieldText required label="Số QĐ khởi tố vụ án" value={form.caseDecision.decisionCode} onChange={(value) => updateField("caseDecision", "decisionCode", value)} />
        <DateSelectField required label="Ngày QĐ khởi tố vụ án" value={form.caseDecision.decisionDate} onChange={(value) => updateField("caseDecision", "decisionDate", value)} />
        <BmFieldText required label="Số bản kết luận điều tra" value={text(form.evidenceHandling.investigationConclusionCode)} onChange={(value) => updateField("evidenceHandling", "investigationConclusionCode", value)} />
        <DateSelectField required label="Ngày bản kết luận điều tra" value={text(form.evidenceHandling.investigationConclusionDate)} onChange={(value) => updateField("evidenceHandling", "investigationConclusionDate", value)} />
      </BmFormSection>

      <BmFormSection title="4. Dòng nếu có" description="Bỏ tick thì backend sẽ trả dòng rỗng. Sau khi render nếu Word còn dòng trắng, sẽ xử lý remove paragraph ở bước sau.">
        <div className="md:col-span-2 grid gap-3">
          <BmFieldCheckbox
            label="Có căn cứ Quyết định khởi tố bị can"
            checked={Boolean(form.evidenceHandling.includeAccusedDecisionLine)}
            onChange={(value) => updateBool("includeAccusedDecisionLine", value)}
          />
          {form.evidenceHandling.includeAccusedDecisionLine ? (
            <div className="grid gap-4 md:grid-cols-2">
              <BmFieldText label="Số QĐ khởi tố bị can" value={form.accusedDecision.decisionCode} onChange={(value) => updateField("accusedDecision", "decisionCode", value)} />
              <DateSelectField label="Ngày QĐ khởi tố bị can" value={form.accusedDecision.decisionDate} onChange={(value) => updateField("accusedDecision", "decisionDate", value)} />
            </div>
          ) : null}

          <BmFieldCheckbox
            label="Có căn cứ Quyết định đình chỉ/tạm đình chỉ vụ án"
            checked={Boolean(form.evidenceHandling.includeCaseSuspensionDecisionLine)}
            onChange={(value) => updateBool("includeCaseSuspensionDecisionLine", value)}
          />
          {form.evidenceHandling.includeCaseSuspensionDecisionLine ? (
            <div className="grid gap-4 md:grid-cols-2">
              <BmFieldText label="Số QĐ đình chỉ/tạm đình chỉ vụ án" value={text(form.evidenceHandling.caseSuspensionDecisionCode)} onChange={(value) => updateField("evidenceHandling", "caseSuspensionDecisionCode", value)} />
              <DateSelectField label="Ngày QĐ đình chỉ/tạm đình chỉ vụ án" value={text(form.evidenceHandling.caseSuspensionDecisionDate)} onChange={(value) => updateField("evidenceHandling", "caseSuspensionDecisionDate", value)} />
            </div>
          ) : null}

          <BmFieldCheckbox
            label="Có căn cứ Quyết định đình chỉ/tạm đình chỉ đối với bị can"
            checked={Boolean(form.evidenceHandling.includeAccusedSuspensionDecisionLine)}
            onChange={(value) => updateBool("includeAccusedSuspensionDecisionLine", value)}
          />
          {form.evidenceHandling.includeAccusedSuspensionDecisionLine ? (
            <div className="grid gap-4 md:grid-cols-2">
              <BmFieldText label="Số QĐ đình chỉ/tạm đình chỉ đối với bị can" value={text(form.evidenceHandling.accusedSuspensionDecisionCode)} onChange={(value) => updateField("evidenceHandling", "accusedSuspensionDecisionCode", value)} />
              <DateSelectField label="Ngày QĐ đình chỉ/tạm đình chỉ đối với bị can" value={text(form.evidenceHandling.accusedSuspensionDecisionDate)} onChange={(value) => updateField("evidenceHandling", "accusedSuspensionDecisionDate", value)} />
            </div>
          ) : null}
        </div>
      </BmFormSection>

      <BmFormSection title="5. Vật chứng và hình thức xử lý">
        <BmFieldTextarea required label="Vật chứng cần xử lý" value={text(form.evidenceHandling.evidenceListLine)} onChange={(value) => updateField("evidenceHandling", "evidenceListLine", value)} fullWidth />
        <BmFieldTextarea required label="Hình thức xử lý" value={text(form.evidenceHandling.handlingMethodLine)} onChange={(value) => updateField("evidenceHandling", "handlingMethodLine", value)} fullWidth />
        <BmFieldTextarea label="Lý do xét thấy" value={text(form.evidenceHandling.considerationLine)} onChange={(value) => updateField("evidenceHandling", "considerationLine", value)} fullWidth />
      </BmFormSection>

      <BmFormSection title="6. Chữ ký">
        <BmFieldSelect label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <BmFieldSelect required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <BmFieldText required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
        <BmFieldText label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} />
      </BmFormSection>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Xem nhanh nội dung sẽ tự sinh
          </summary>

          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <p><strong>Khởi tố vụ án:</strong> {derivedForm.caseDecision.prosecutionDecisionLegalBasisLine}</p>
            {derivedForm.evidenceHandling.includeAccusedDecisionLine ? (
              <p><strong>Khởi tố bị can:</strong> {derivedForm.accusedDecision.prosecutionDecisionLegalBasisLine}</p>
            ) : null}
            <p><strong>Kết luận điều tra:</strong> {derivedForm.evidenceHandling.investigationConclusionLegalBasisLine}</p>
            {derivedForm.evidenceHandling.includeCaseSuspensionDecisionLine ? (
              <p><strong>Đình chỉ/tạm đình chỉ vụ án:</strong> {derivedForm.evidenceHandling.caseSuspensionDecisionLegalBasisLine}</p>
            ) : null}
            {derivedForm.evidenceHandling.includeAccusedSuspensionDecisionLine ? (
              <p><strong>Đình chỉ/tạm đình chỉ bị can:</strong> {derivedForm.evidenceHandling.accusedSuspensionDecisionLegalBasisLine}</p>
            ) : null}
            <p><strong>Điều 2:</strong> {derivedForm.evidenceHandling.executionRequestLine}</p>
          </div>
        </details>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Lưu dữ liệu BM-169</h3>
            <p className="mt-1 text-sm text-slate-500">
              Khi lưu, hệ thống sẽ pack lại toàn bộ căn cứ, vật chứng, hình thức xử lý và checkbox optional vào payload render.
            </p>
          </div>

          <button type="button" onClick={handleSave} disabled={isSaving || !isDirty} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-169"}
          </button>
        </div>
      </section>
    </div>
  );
}



