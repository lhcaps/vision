"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFormSection,
} from "./bm-form";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm023FormInputs = {
  agency: TextRecord;
  official: TextRecord;
  document: TextRecord;
  legalBasis: TextRecord;
  crimeReport: TextRecord;
  case: TextRecord;
  offense: TextRecord;
  investigation: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm023FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm023FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const EMPTY_FORM: Bm023FormInputs = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
    issuePlace: "",
    phone: "",
  },
  official: {
    fullName: "",
    positionTitle: "",
    issuerTitle: "",
    prosecutorName: "",
  },
  document: {
    documentCode: "",
    issueDate: "",
    issuePlaceAndDateLine: "",
  },
  legalBasis: {
    procedureArticlesLine: "",
  },
  crimeReport: {
    content: "",
  },
  case: {
    caseCode: "",
    caseTitle: "",
    caseSummary: "",
  },
  offense: {
    offenseName: "",
    legalArticle: "",
    criminalCodeText: "",
  },
  investigation: {
    investigationUnitName: "",
    article2Line: "",
  },
  recipients: {
    investigationUnitLine: "",
    superiorProcuracyLine: "",
    archiveLine: "",
    noteLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Cơ quan ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  {
    section: "document",
    field: "issuePlaceAndDateLine",
    label: "Dòng địa danh, ngày tháng",
  },
  { section: "official", field: "issuerTitle", label: "Thẩm quyền ban hành" },
  {
    section: "legalBasis",
    field: "procedureArticlesLine",
    label: "Căn cứ Bộ luật Tố tụng hình sự",
  },
  { section: "crimeReport", field: "content", label: "Nội dung vụ việc" },
  { section: "case", field: "caseTitle", label: "Tên vụ việc" },
  { section: "offense", field: "offenseName", label: "Tội danh" },
  {
    section: "offense",
    field: "legalArticle",
    label: "Điều khoản Bộ luật Hình sự",
  },
  {
    section: "investigation",
    field: "investigationUnitName",
    label: "Cơ quan điều tra",
  },
  { section: "investigation", field: "article2Line", label: "Nội dung Điều 2" },
  {
    section: "recipients",
    field: "investigationUnitLine",
    label: "Nơi nhận - cơ quan điều tra",
  },
  {
    section: "recipients",
    field: "superiorProcuracyLine",
    label: "Nơi nhận - Viện kiểm sát cấp trên",
  },
  { section: "recipients", field: "archiveLine", label: "Nơi nhận - lưu hồ sơ" },
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

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readPath(source: unknown, path: string): unknown {
  let current: unknown = source;

  for (const part of path.split(".")) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }

  return current;
}

function firstExistingRecord(
  payload: unknown,
  paths: string[],
): Record<string, unknown> {
  for (const path of paths) {
    const value = readPath(payload, path);
    if (isRecord(value) && Object.keys(value).length > 0) {
      return value;
    }
  }

  return {};
}

function sourceRoot(payload: unknown): Record<string, unknown> {
  const saved = firstExistingRecord(payload, [
    "formInputs",
    "renderPayloadSnapshot.formInputs",
    "metadata.formInputs",
  ]);

  if (Object.keys(saved).length > 0) return saved;

  return asRecord(payload);
}

function section(source: Record<string, unknown>, key: string): Record<string, unknown> {
  return asRecord(source[key]);
}

function pick(source: Record<string, unknown>, key: string, fallback = ""): string {
  const value = source[key];

  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";

  return fallback;
}

function getValue(form: Bm023FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function bm023Pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function bm023TodayIsoDate(): string {
  const now = new Date();

  return `${now.getFullYear()}-${bm023Pad2(now.getMonth() + 1)}-${bm023Pad2(now.getDate())}`;
}

function toDateInput(value: unknown): string {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (isoMatch) {
    return `${isoMatch[1]}-${bm023Pad2(Number(isoMatch[2]))}-${bm023Pad2(Number(isoMatch[3]))}`;
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (slashMatch) {
    return `${slashMatch[3]}-${bm023Pad2(Number(slashMatch[2]))}-${bm023Pad2(Number(slashMatch[1]))}`;
  }

  const vnMatch = /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu.exec(raw);
  if (vnMatch) {
    return `${vnMatch[3]}-${bm023Pad2(Number(vnMatch[2]))}-${bm023Pad2(Number(vnMatch[1]))}`;
  }

  return "";
}

function bm023NormalizeIssueDate(value: unknown): string {
  const parsed = toDateInput(value);

  if (!parsed || parsed === "2026-05-11") {
    return bm023TodayIsoDate();
  }

  return parsed;
}

function bm023IsoToParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const iso = bm023NormalizeIssueDate(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) {
    const today = bm023TodayIsoDate();
    const todayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);

    return {
      day: todayMatch?.[3] || "01",
      month: todayMatch?.[2] || "01",
      year: todayMatch?.[1] || String(new Date().getFullYear()),
    };
  }

  return {
    day: match[3],
    month: match[2],
    year: match[1],
  };
}

function bm023BuildIsoDate(day: string, month: string, year: string): string {
  return `${year}-${bm023Pad2(Number(month))}-${bm023Pad2(Number(day))}`;
}

function bm023VietnameseDateLine(value: string): string {
  const parsed = bm023IsoToParts(value);

  return `ngày ${Number(parsed.day)} tháng ${Number(parsed.month)} năm ${parsed.year}`;
}

function bm023IssuePlaceFromLine(value: string): string {
  const raw = String(value ?? "").trim();
  const match = /^(.+?),\s*ngày\s+/iu.exec(raw);

  return match?.[1]?.trim() || "";
}

function bm023IssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const place = String(issuePlace || "").trim() || "TP. Hồ Chí Minh";

  return `${place}, ${bm023VietnameseDateLine(issueDate)}`;
}

function bm023NormalizeProcuracyName(value: string): string {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  if (raw === raw.toLocaleUpperCase("vi-VN")) {
    return raw
      .toLocaleLowerCase("vi-VN")
      .replace(/^viện kiểm sát/u, "Viện kiểm sát");
  }

  return raw;
}

function bm023RecipientLine(value: string): string {
  const raw = String(value ?? "")
    .trim()
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "");

  return raw ? `- ${raw};` : "";
}

function bm023ArchiveLine(value: string): string {
  const raw = String(value ?? "")
    .trim()
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "");

  if (!raw) return "- Lưu: HSVA, HSKS, VP.";

  return raw.toLocaleLowerCase("vi-VN").startsWith("lưu:")
    ? `- ${raw}.`
    : `- Lưu: ${raw}.`;
}

function bm023Article2Line(investigationUnitName: string): string {
  const unit = String(investigationUnitName ?? "").trim();

  return unit
    ? `Yêu cầu ${unit} tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự.`
    : "";
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm023FormInputs {
  const root = sourceRoot(payload);

  const agency = section(root, "agency");
  const official = section(root, "official");
  const document = section(root, "document");
  const legalBasis = section(root, "legalBasis");
  const crimeReport = section(root, "crimeReport");
  const caseInfo = section(root, "case");
  const offense = section(root, "offense");
  const investigation = section(root, "investigation");
  const recipients = section(root, "recipients");
  const signature = section(root, "signature");

  const agencyParentName = pick(agency, "parentName");
  const agencyIssuePlace =
    pick(agency, "issuePlace") ||
    bm023IssuePlaceFromLine(pick(document, "issuePlaceAndDateLine")) ||
    "TP. Hồ Chí Minh";

  const issueDate = bm023NormalizeIssueDate(
    pick(document, "issueDate") ||
      pick(document, "issueDateText") ||
      pick(document, "issuePlaceAndDateLine"),
  );

  const issuePlaceAndDateLine = bm023IssuePlaceAndDateLine(
    agencyIssuePlace,
    issueDate,
  );

  const investigationUnitName = pick(investigation, "investigationUnitName");

  const article2Line =
    pick(investigation, "article2Line") ||
    bm023Article2Line(investigationUnitName);

  const investigationUnitLine =
    pick(recipients, "investigationUnitLine") ||
    bm023RecipientLine(investigationUnitName);

  const superiorProcuracyLine =
    pick(recipients, "superiorProcuracyLine") ||
    bm023RecipientLine(bm023NormalizeProcuracyName(agencyParentName));

  const archiveLine = bm023ArchiveLine(pick(recipients, "archiveLine"));

  return {
    agency: {
      parentName: agencyParentName,
      name: pick(agency, "name"),
      shortName: pick(agency, "shortName"),
      issuePlace: agencyIssuePlace,
      phone: pick(agency, "phone"),
    },
    official: {
      fullName: pick(official, "fullName"),
      positionTitle: pick(official, "positionTitle"),
      issuerTitle: pick(official, "issuerTitle"),
      prosecutorName: pick(official, "prosecutorName"),
    },
    document: {
      documentCode: pick(document, "documentCode"),
      issueDate,
      issuePlaceAndDateLine,
    },
    legalBasis: {
      procedureArticlesLine: pick(legalBasis, "procedureArticlesLine"),
    },
    crimeReport: {
      content: pick(crimeReport, "content"),
    },
    case: {
      caseCode: pick(caseInfo, "caseCode"),
      caseTitle: pick(caseInfo, "caseTitle"),
      caseSummary: pick(caseInfo, "caseSummary"),
    },
    offense: {
      offenseName: pick(offense, "offenseName"),
      legalArticle: pick(offense, "legalArticle"),
      criminalCodeText: pick(offense, "criminalCodeText"),
    },
    investigation: {
      investigationUnitName,
      article2Line,
    },
    recipients: {
      investigationUnitLine,
      superiorProcuracyLine,
      archiveLine,
      noteLine: pick(recipients, "noteLine"),
    },
    signature: {
      signMode: pick(signature, "signMode") || "KT. VIỆN TRƯỞNG",
      positionTitle: pick(signature, "positionTitle") || "PHÓ VIỆN TRƯỞNG",
      signerName: pick(signature, "signerName"),
    },
  };
}

async function getBm023RenderPayload(
  documentId: string | number,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không tải được payload BM-023. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function requestSave(
  documentId: string | number,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<{
  ok: boolean;
  status: number;
  text: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    },
  );

  return {
    ok: response.ok,
    status: response.status,
    text: await response.text(),
  };
}

async function saveBm023FormInputs(
  documentId: string | number,
  form: Bm023FormInputs,
): Promise<Bm023FormInputs> {
  const ready = normalizeFormInputs(form as unknown as Record<string, unknown>);

  const body = {
    ...ready,
    templateCode: "BM-023",
    formInputs: ready,
    payloadOverrides: ready,
    renderPayloadOverrides: ready,
    updatedByName: "",
    renderedByName: "",
    convertedByName: "",
  };

  let result = await requestSave(documentId, "POST", body);

  if (!result.ok && (result.status === 404 || result.status === 405)) {
    result = await requestSave(documentId, "PATCH", body);
  }

  if (!result.ok) {
    throw new Error(result.text || `Không lưu được BM-023. HTTP ${result.status}`);
  }

  return ready;
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  multiline,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const commonClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      {multiline ? (
        <textarea
          className={`${commonClass} min-h-24 py-2 leading-6`}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={`${commonClass} h-10`}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </span>

      <select
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Bm023DateSelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = bm023IsoToParts(value);

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    bm023Pad2(index + 1),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    bm023Pad2(index + 1),
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, index) =>
    String(currentYear - 10 + index),
  );

  const updatePart = (
    patch: Partial<{
      day: string;
      month: string;
      year: string;
    }>,
  ) => {
    const next = {
      ...parsed,
      ...patch,
    };

    onChange(bm023BuildIsoDate(next.day, next.month, next.year));
  };

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </span>

      <div className="grid gap-2 md:grid-cols-3">
        <select
          className={selectClass}
          value={parsed.day}
          onChange={(event) => updatePart({ day: event.target.value })}
        >
          <option value="">Ngày</option>
          {dayOptions.map((day) => (
            <option key={day} value={day}>
              {Number(day)}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={parsed.month}
          onChange={(event) => updatePart({ month: event.target.value })}
        >
          <option value="">Tháng</option>
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {Number(month)}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={parsed.year}
          onChange={(event) => updatePart({ year: event.target.value })}
        >
          <option value="">Năm</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
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
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function Bm023FormInputsPanel({
  documentId,
  onSaved,
}: Bm023FormInputsPanelProps) {
  const [form, setForm] = useState<Bm023FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const preview = useMemo(
    () => normalizeFormInputs(form as unknown as Record<string, unknown>),
    [form],
  );

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      return !getValue(preview, item.section, item.field).trim();
    });
  }, [preview]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getBm023RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-023.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => {
      const next: Bm023FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };

      if (sectionKey === "document" && field === "issueDate") {
        next.document = {
          ...next.document,
          issueDate: value || bm023TodayIsoDate(),
          issuePlaceAndDateLine: bm023IssuePlaceAndDateLine(
            next.agency.issuePlace,
            value || bm023TodayIsoDate(),
          ),
        };
      }

      if (sectionKey === "agency" && field === "issuePlace") {
        next.document = {
          ...next.document,
          issuePlaceAndDateLine: bm023IssuePlaceAndDateLine(
            value,
            next.document.issueDate || bm023TodayIsoDate(),
          ),
        };
      }

      if (sectionKey === "agency" && field === "parentName") {
        next.recipients = {
          ...next.recipients,
          superiorProcuracyLine: value.trim()
            ? bm023RecipientLine(bm023NormalizeProcuracyName(value))
            : "",
        };
      }

      if (sectionKey === "investigation" && field === "investigationUnitName") {
        next.investigation = {
          ...next.investigation,
          article2Line: value.trim() ? bm023Article2Line(value) : "",
        };

        next.recipients = {
          ...next.recipients,
          investigationUnitLine: value.trim() ? bm023RecipientLine(value) : "",
        };
      }

      if (sectionKey === "recipients" && field === "archiveLine") {
        next.recipients = {
          ...next.recipients,
          archiveLine: bm023ArchiveLine(value),
        };
      }

      if (sectionKey === "agency" && field === "name") {
        next.official = {
          ...next.official,
          issuerTitle:
            next.official.issuerTitle ||
            (value.trim() ? `VIỆN TRƯỞNG ${value.trim()}` : ""),
        };
      }

      return next;
    });
  }

  function fillCustomerSample() {
    const today = bm023TodayIsoDate();

    const sample: Bm023FormInputs = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
      },
      official: {
        fullName: "",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        prosecutorName: "",
      },
      document: {
        documentCode: "23/QĐ-VKSKV7",
        issueDate: today,
        issuePlaceAndDateLine: bm023IssuePlaceAndDateLine("TP. Hồ Chí Minh", today),
      },
      legalBasis: {
        procedureArticlesLine:
          "Căn cứ các điều 41, 143, 153, 154, 159, 161 và 165 của Bộ luật Tố tụng hình sự;",
      },
      crimeReport: {
        content: "",
      },
      case: {
        caseCode: "",
        caseTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
        caseSummary: "",
      },
      offense: {
        offenseName: "",
        legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
        criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      },
      investigation: {
        investigationUnitName:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        article2Line:
          "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự.",
      },
      recipients: {
        investigationUnitLine:
          "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        superiorProcuracyLine:
          "- Viện kiểm sát nhân dân Thành phố Hồ Chí Minh;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
        noteLine: "",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
    };

    const ready = normalizeFormInputs(sample as unknown as Record<string, unknown>);

    setForm(ready);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const ready = await saveBm023FormInputs(documentId, preview);

      setForm(ready);
      setInitialSnapshot(JSON.stringify(ready));
      setSavedAt(new Date());
      await onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-023.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-023...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-023" form={form} onApply={(next) => setForm(next as typeof form)} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-023
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Quyết định khởi tố vụ án hình sự
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              BM-023 chỉ có ngày ban hành ở header, một tội danh, Điều 1,
              Điều 2, nơi nhận và chữ ký. Không có tội danh cũ/tội danh mới.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:items-end">
            <span
              className={
                isDirty
                  ? "font-semibold text-amber-700"
                  : "font-semibold text-emerald-700"
              }
            >
              {isDirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
            </span>

            {savedAt ? (
              <span className="text-xs text-slate-500">
                Lưu lúc {savedAt.toLocaleTimeString("vi-VN")}
              </span>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">
              Còn thiếu {missingFields.length} trường quan trọng:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
              {missingFields.map((item) => (
                <li key={`${item.section}.${item.field}`}>{item.label}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            disabled={isSaving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Điền dữ liệu mẫu
          </button>

          <button
            type="button"
            onClick={loadForm}
            disabled={isSaving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tải lại từ backend
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-023"}
          </button>
        </div>
      </section>

      <SectionCard
        title="1. Cơ quan, văn bản và thẩm quyền"
        description="BM-023 chỉ có ngày ban hành ở header. Không có ngày quyết định khởi tố cũ."
      >
        <BmFieldText label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} fullWidth />

        <BmFieldText label="Cơ quan ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} fullWidth />

        <BmFieldText label="Tên viết tắt cơ quan" value={form.agency.shortName} onChange={(value) => updateField("agency", "shortName", value)} fullWidth />

        <BmFieldText label="Địa danh" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} fullWidth />

        <BmFieldText label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} fullWidth />

        <div className="space-y-1.5">
          <Bm023DateSelectField
            label="Ngày ban hành"
            value={form.document.issueDate || bm023TodayIsoDate()}
            onChange={(value) => updateField("document", "issueDate", value)}
          />

          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {preview.document.issuePlaceAndDateLine}
          </p>
        </div>

        <BmFieldText label="Thẩm quyền ban hành" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} fullWidth />
      </SectionCard>

      <SectionCard
        title="2. Căn cứ, vụ việc và tội danh"
        description="BM-023 chỉ có một tội danh và một điều khoản Bộ luật Hình sự."
      >
        <BmFieldText label="Căn cứ pháp lý" value={form.legalBasis.procedureArticlesLine} onChange={(value) =>
            updateField("legalBasis", "procedureArticlesLine", value)
          } fullWidth />

        <BmFieldText label="Nội dung vụ việc" value={form.crimeReport.content} onChange={(value) => updateField("crimeReport", "content", value)} fullWidth />

        <BmFieldText label="Tên vụ việc" value={form.case.caseTitle} onChange={(value) => updateField("case", "caseTitle", value)} fullWidth />

        <BmFieldText label="Tội danh" value={form.offense.offenseName} onChange={(value) => updateField("offense", "offenseName", value)} fullWidth />

        <BmFieldText label="Điều khoản Bộ luật Hình sự" value={form.offense.legalArticle} onChange={(value) => updateField("offense", "legalArticle", value)} fullWidth />

        <BmFieldText label="Ghi chú Bộ luật Hình sự" value={form.offense.criminalCodeText} onChange={(value) => updateField("offense", "criminalCodeText", value)} fullWidth />
      </SectionCard>

      <SectionCard
        title="3. Yêu cầu điều tra và nơi nhận"
        description="Điều 2 và nơi nhận theo đúng mẫu gốc BM-023."
      >
        <BmFieldText label="Cơ quan điều tra" value={form.investigation.investigationUnitName} onChange={(value) =>
            updateField("investigation", "investigationUnitName", value)
          } fullWidth />

        <BmFieldText label="Nơi nhận - cơ quan điều tra" value={form.recipients.investigationUnitLine} onChange={(value) =>
            updateField("recipients", "investigationUnitLine", value)
          } fullWidth />

        <BmFieldText label="Nội dung Điều 2" value={form.investigation.article2Line} onChange={(value) => updateField("investigation", "article2Line", value)} fullWidth />

        <BmFieldText label="Nơi nhận - Viện kiểm sát cấp trên" value={form.recipients.superiorProcuracyLine} onChange={(value) =>
            updateField("recipients", "superiorProcuracyLine", value)
          } fullWidth />

        <BmFieldText label="Nơi nhận - lưu" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} fullWidth />
      </SectionCard>

      <SectionCard title="4. Chữ ký">
        <SelectField
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          options={SIGN_MODE_OPTIONS}
        />

        <SelectField
          label="Chức vụ ký"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          options={POSITION_OPTIONS}
        />

        <BmFieldText label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} fullWidth />
      </SectionCard>

      <SectionCard
        title="Preview nội dung trước khi in"
        description="Xem nhanh các dòng chính sẽ render ra DOCX/PDF."
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-2">
          <table className="w-full border-collapse text-sm">
            <tbody className="divide-y divide-slate-200">
              <tr className="align-top">
                <th className="w-56 bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Số quyết định
                </th>
                <td className="px-4 py-3 font-semibold text-slate-950">
                  {preview.document.documentCode || "—"}
                </td>
              </tr>

              <tr className="align-top">
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Ngày ban hành
                </th>
                <td className="px-4 py-3 text-slate-900">
                  {preview.document.issuePlaceAndDateLine || "—"}
                </td>
              </tr>

              <tr className="align-top">
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Thẩm quyền
                </th>
                <td className="px-4 py-3 text-slate-900">
                  {preview.official.issuerTitle || "—"}
                </td>
              </tr>

              <tr className="align-top">
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Căn cứ
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.legalBasis.procedureArticlesLine || "—"}
                </td>
              </tr>

              <tr className="align-top">
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Xét thấy
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  Xét thấy {preview.crimeReport.content || "…"} về vụ việc{" "}
                  {preview.case.caseTitle || "…"} có dấu hiệu tội phạm{" "}
                  {preview.offense.offenseName || "…"} quy định tại{" "}
                  {preview.offense.legalArticle || "…"},
                </td>
              </tr>

              <tr className="align-top">
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Điều 1
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  Khởi tố vụ án hình sự về tội{" "}
                  {preview.offense.offenseName || "…"} quy định tại{" "}
                  {preview.offense.legalArticle || "…"}.
                </td>
              </tr>

              <tr className="align-top">
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Điều 2
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.investigation.article2Line || "—"}
                </td>
              </tr>

              <tr className="align-top">
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Nơi nhận
                </th>
                <td className="space-y-1 px-4 py-3 leading-6 text-slate-900">
                  {[
                    preview.recipients.investigationUnitLine,
                    preview.recipients.superiorProcuracyLine,
                    preview.recipients.archiveLine,
                  ]
                    .filter(Boolean)
                    .map((line, index) => (
                      <p key={`${index}-${line}`}>{line}</p>
                    ))}
                </td>
              </tr>

              <tr className="align-top">
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Chữ ký
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  <p>{preview.signature.signMode || "—"}</p>
                  <p>{preview.signature.positionTitle || "—"}</p>
                  <p className="font-bold">{preview.signature.signerName || "—"}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-023"}
        </button>
      </div>
    </div>
  );
}
