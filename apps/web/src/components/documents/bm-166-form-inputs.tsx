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

type Bm166FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  official: TextRecord;
  legalBasis: TextRecord;
  returnInvestigation: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm166FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm166FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm166FormInputs = {
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
  returnInvestigation: {
    courtDecisionType: "",
    courtDecisionCode: "",
    courtDecisionDate: "",
    courtName: "",
    cancelledDecisionType: "",
    cancelledDecisionCode: "",
    cancelledDecisionDate: "",
    cancelledCourtName: "",
    caseTitle: "",
    offenseName: "",
    legalClause: "",
    legalArticle: "",
    investigationAgencyName: "",
    courtDecisionLegalBasisLine: "",
    article1Line: "",
    article2Line: "",
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
  { section: "returnInvestigation", field: "courtDecisionType", label: "Loại bản án/quyết định" },
  { section: "returnInvestigation", field: "courtDecisionCode", label: "Số bản án/quyết định" },
  { section: "returnInvestigation", field: "courtDecisionDate", label: "Ngày bản án/quyết định" },
  { section: "returnInvestigation", field: "courtName", label: "Tòa án ban hành" },
  { section: "returnInvestigation", field: "caseTitle", label: "Tên vụ án" },
  { section: "returnInvestigation", field: "offenseName", label: "Tên tội" },
  { section: "returnInvestigation", field: "legalClause", label: "Khoản" },
  { section: "returnInvestigation", field: "legalArticle", label: "Điều luật" },
  { section: "returnInvestigation", field: "investigationAgencyName", label: "Cơ quan điều tra lại" },
  { section: "signature", field: "positionTitle", label: "Chức vụ ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

const COURT_DECISION_TYPE_OPTIONS = [
  { value: "Bản án", label: "Bản án" },
  { value: "Quyết định", label: "Quyết định" },
  { value: "Bản án/Quyết định", label: "Bản án/Quyết định" },
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

function stripVuAnPrefix(value: string): string {
  return value.replace(/^Vụ án\s+/iu, "").trim();
}

function getValue(form: Bm166FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function buildDerivedFields(form: Bm166FormInputs): Bm166FormInputs {
  const issueDateText = toVietnameseDate(form.document.issueDate);
  const courtDecisionDateText = toVietnameseDate(form.returnInvestigation.courtDecisionDate);
  const cancelledDecisionDateText = toVietnameseDate(form.returnInvestigation.cancelledDecisionDate);

  const issuePlace = form.agency.issuePlace.trim() || "TP. Hồ Chí Minh";
  const courtDecisionType = form.returnInvestigation.courtDecisionType.trim() || "Bản án/Quyết định";
  const courtDecisionCode =
    form.returnInvestigation.courtDecisionCode.trim() || form.document.documentCode.trim();
  const courtName = form.returnInvestigation.courtName.trim() || "Tòa án nhân dân khu vực 7";

  const cancelledDecisionType =
    form.returnInvestigation.cancelledDecisionType.trim() || courtDecisionType;
  const cancelledDecisionCode =
    form.returnInvestigation.cancelledDecisionCode.trim() || courtDecisionCode;
  const cancelledCourtName =
    form.returnInvestigation.cancelledCourtName.trim() || courtName;

  const offenseName = form.returnInvestigation.offenseName.trim();
  const legalClause = form.returnInvestigation.legalClause.trim();
  const legalArticle = form.returnInvestigation.legalArticle.trim();
  const caseTitleRaw = form.returnInvestigation.caseTitle.trim();
  const caseTitle = stripVuAnPrefix(caseTitleRaw);
  const investigationAgencyName = form.returnInvestigation.investigationAgencyName.trim();

  const courtDecisionLegalBasisLine = ensureEnd(
    `Căn cứ ${courtDecisionType} số ${courtDecisionCode}${
      courtDecisionDateText ? ` ${courtDecisionDateText}` : ""
    } của ${courtName} về việc hủy ${cancelledDecisionType} số ${cancelledDecisionCode}${
      cancelledDecisionDateText ? ` ${cancelledDecisionDateText}` : ""
    } của ${cancelledCourtName} để điều tra lại`,
    ",",
  );

  const article1Line = ensureEnd(
    `Trả hồ sơ vụ án ${caseTitle} về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} của Bộ luật Hình sự cho ${investigationAgencyName} để điều tra lại. Thời hạn điều tra lại được tính từ khi ${investigationAgencyName} nhận hồ sơ vụ án và Quyết định này`,
    ".",
  );

  const article2Line = ensureEnd(
    `Yêu cầu ${investigationAgencyName} tiến hành điều tra lại vụ án theo quy định của Bộ luật Tố tụng hình sự`,
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
      procedureArticlesLine: "Căn cứ Điều 41 và Điều 174 của Bộ luật Tố tụng hình sự;",
    },
    returnInvestigation: {
      ...form.returnInvestigation,
      courtDecisionType,
      courtDecisionCode,
      courtDecisionDate: form.returnInvestigation.courtDecisionDate,
      courtName,
      cancelledDecisionType,
      cancelledDecisionCode,
      cancelledDecisionDate:
        form.returnInvestigation.cancelledDecisionDate || form.returnInvestigation.courtDecisionDate,
      cancelledCourtName,
      caseTitle: caseTitleRaw || `Vụ án ${offenseName}`,
      offenseName,
      legalClause,
      legalArticle,
      investigationAgencyName,
      courtDecisionLegalBasisLine,
      article1Line,
      article2Line,
    },
    recipients: {
      ...form.recipients,
      line1: investigationAgencyName ? `- ${investigationAgencyName};` : "",
      archiveLine: form.recipients.archiveLine || "- Lưu: HSVA, HSKS, VP.",
    },
  };
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm166FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const official = section(payload, "official");
  const legalBasis = section(payload, "legalBasis");
  const returnInvestigation = section(payload, "returnInvestigation");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  const form: Bm166FormInputs = {
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
        "Căn cứ Điều 41 và Điều 174 của Bộ luật Tố tụng hình sự;",
      ),
    },
    returnInvestigation: {
      courtDecisionType: firstText(pick(returnInvestigation, "courtDecisionType"), "Bản án/Quyết định"),
      courtDecisionCode: firstText(pick(returnInvestigation, "courtDecisionCode"), pick(document, "documentCode")),
      courtDecisionDate: firstText(toDateInput(returnInvestigation.courtDecisionDate), toDateInput(document.issueDate)),
      courtName: firstText(pick(returnInvestigation, "courtName"), "Tòa án nhân dân khu vực 7"),
      cancelledDecisionType: firstText(pick(returnInvestigation, "cancelledDecisionType"), pick(returnInvestigation, "courtDecisionType"), "Bản án/Quyết định"),
      cancelledDecisionCode: firstText(pick(returnInvestigation, "cancelledDecisionCode"), pick(returnInvestigation, "courtDecisionCode"), pick(document, "documentCode")),
      cancelledDecisionDate: firstText(toDateInput(returnInvestigation.cancelledDecisionDate), toDateInput(returnInvestigation.courtDecisionDate), toDateInput(document.issueDate)),
      cancelledCourtName: firstText(pick(returnInvestigation, "cancelledCourtName"), pick(returnInvestigation, "courtName"), "Tòa án nhân dân khu vực 7"),
      caseTitle: firstText(pick(returnInvestigation, "caseTitle"), "Vụ án đánh bạc tại phường Trung Mỹ Tây"),
      offenseName: firstText(pick(returnInvestigation, "offenseName"), "Đánh bạc"),
      legalClause: firstText(pick(returnInvestigation, "legalClause"), "khoản 1"),
      legalArticle: firstText(pick(returnInvestigation, "legalArticle"), "Điều 321"),
      investigationAgencyName: firstText(
        pick(returnInvestigation, "investigationAgencyName"),
        pick(recipients, "line1").replace(/^-\s*/u, "").replace(/[;.]\s*$/u, ""),
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      ),
      courtDecisionLegalBasisLine: pick(returnInvestigation, "courtDecisionLegalBasisLine"),
      article1Line: pick(returnInvestigation, "article1Line"),
      article2Line: pick(returnInvestigation, "article2Line"),
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

async function getBm166RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không tải được payload BM-166. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm166FormInputs(documentId: string | number, form: Bm166FormInputs): Promise<void> {
  const finalForm = buildDerivedFields(form);

  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      formInputs: finalForm,
      ...finalForm,
      updatedByName: "",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không lưu được dữ liệu BM-166. HTTP ${response.status}`);
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
          rows={2}
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

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
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
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
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
    <label className={`block space-y-1.5 ${className}`}>
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


export function Bm166FormInputsPanel({ documentId, onSaved }: Bm166FormInputsPanelProps) {
  const [form, setForm] = useState<Bm166FormInputs>(EMPTY_FORM);
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
      const payload = await getBm166RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);
      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-166.");
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
          documentCode: "17/QĐ-VKSKV7",
          issueDate: "2026-05-28",
          issuePlaceAndDateLine: "",
        },
        official: {
          issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        },
        legalBasis: {
          procedureArticlesLine: "Căn cứ Điều 41 và Điều 174 của Bộ luật Tố tụng hình sự;",
        },
        returnInvestigation: {
          ...EMPTY_FORM.returnInvestigation,
          courtDecisionType: "Bản án/Quyết định",
          courtDecisionCode: "01/2026/HS-ST",
          courtDecisionDate: "2026-05-28",
          courtName: "Tòa án nhân dân khu vực 7",
          cancelledDecisionType: "Bản án/Quyết định",
          cancelledDecisionCode: "01/2026/HS-ST",
          cancelledDecisionDate: "2026-05-28",
          cancelledCourtName: "Tòa án nhân dân khu vực 7",
          caseTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
          offenseName: "",
          legalClause: "khoản 1",
          legalArticle: "Điều 321",
          investigationAgencyName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
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
      await saveBm166FormInputs(documentId, finalForm);

      setForm(finalForm);
      setInitialSnapshot(JSON.stringify(finalForm));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được dữ liệu BM-166.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-166...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-166" form={form} onApply={(next) => setForm(next as typeof form)} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">BM-166</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu Quyết định trả hồ sơ vụ án để điều tra lại
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này chỉ nhập dữ liệu nguồn chính. Các dòng căn cứ, Điều 1, Điều 2 và nơi nhận sẽ tự sinh khi lưu.
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
        <BmFieldText required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
        <BmFieldText required label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <DateSelectField required label="Ngày quyết định" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <BmFieldText required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} fullWidth />
      </BmFormSection>

      <BmFormSection title="2. Bản án / quyết định của Tòa án" description="Nhập thông tin văn bản của Tòa án làm căn cứ trả hồ sơ điều tra lại.">
        <BmFieldSelect required label="Loại văn bản" value={form.returnInvestigation.courtDecisionType} onChange={(value) => updateField("returnInvestigation", "courtDecisionType", value)} options={COURT_DECISION_TYPE_OPTIONS} />
        <BmFieldText required label="Số văn bản" value={form.returnInvestigation.courtDecisionCode} onChange={(value) => updateField("returnInvestigation", "courtDecisionCode", value)} />
        <DateSelectField required label="Ngày văn bản" value={form.returnInvestigation.courtDecisionDate} onChange={(value) => updateField("returnInvestigation", "courtDecisionDate", value)} />
        <BmFieldText required label="Tòa án ban hành" value={form.returnInvestigation.courtName} onChange={(value) => updateField("returnInvestigation", "courtName", value)} />
      </BmFormSection>

      <BmFormSection title="3. Văn bản bị hủy" description="Nếu giống văn bản phía trên thì có thể giữ nguyên.">
        <BmFieldSelect label="Loại văn bản bị hủy" value={form.returnInvestigation.cancelledDecisionType} onChange={(value) => updateField("returnInvestigation", "cancelledDecisionType", value)} options={COURT_DECISION_TYPE_OPTIONS} />
        <BmFieldText label="Số văn bản bị hủy" value={form.returnInvestigation.cancelledDecisionCode} onChange={(value) => updateField("returnInvestigation", "cancelledDecisionCode", value)} />
        <DateSelectField label="Ngày văn bản bị hủy" value={form.returnInvestigation.cancelledDecisionDate} onChange={(value) => updateField("returnInvestigation", "cancelledDecisionDate", value)} />
        <BmFieldText label="Tòa án đã ban hành văn bản bị hủy" value={form.returnInvestigation.cancelledCourtName} onChange={(value) => updateField("returnInvestigation", "cancelledCourtName", value)} />
      </BmFormSection>

      <BmFormSection title="4. Vụ án và cơ quan điều tra lại">
        <BmFieldText required label="Tên vụ án" value={form.returnInvestigation.caseTitle} onChange={(value) => updateField("returnInvestigation", "caseTitle", value)} fullWidth />
        <BmFieldText required label="Tên tội" value={form.returnInvestigation.offenseName} onChange={(value) => updateField("returnInvestigation", "offenseName", value)} />
        <BmFieldText required label="Khoản" value={form.returnInvestigation.legalClause} onChange={(value) => updateField("returnInvestigation", "legalClause", value)} />
        <BmFieldText required label="Điều luật BLHS" value={form.returnInvestigation.legalArticle} onChange={(value) => updateField("returnInvestigation", "legalArticle", value)} />
        <BmFieldText required label="Cơ quan điều tra lại" value={form.returnInvestigation.investigationAgencyName} onChange={(value) => updateField("returnInvestigation", "investigationAgencyName", value)} fullWidth />
      </BmFormSection>

      <BmFormSection title="5. Chữ ký">
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
            <p><strong>Căn cứ:</strong> {derivedForm.returnInvestigation.courtDecisionLegalBasisLine}</p>
            <p><strong>Điều 1:</strong> {derivedForm.returnInvestigation.article1Line}</p>
            <p><strong>Điều 2:</strong> {derivedForm.returnInvestigation.article2Line}</p>
            <p><strong>Nơi nhận:</strong> {derivedForm.recipients.line1}</p>
          </div>
        </details>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Lưu dữ liệu BM-166</h3>
            <p className="mt-1 text-sm text-slate-500">
              Khi lưu, hệ thống sẽ pack đủ căn cứ, Điều 1, Điều 2 và nơi nhận vào payload render.
            </p>
          </div>

          <button type="button" onClick={handleSave} disabled={isSaving || !isDirty} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-166"}
          </button>
        </div>
      </section>
    </div>
  );
}


