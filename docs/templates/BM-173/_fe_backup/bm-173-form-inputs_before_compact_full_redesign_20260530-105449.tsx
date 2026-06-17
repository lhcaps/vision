"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm173FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  official: TextRecord;
  legalBasis: TextRecord;
  evidenceTransfer: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm173FormInputs;

type Props = {
  documentId: string | number;
  onSaved?: () => void;
};

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

const EMPTY_FORM: Bm173FormInputs = {
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
  evidenceTransfer: {
    agencyBodyName: "",
    prosecutionDecisionType: "",
    prosecutionDecisionCode: "",
    prosecutionDecisionDate: "",
    prosecutionDecisionLegalBasisLine: "",
    caseTitle: "",
    evidenceListLine: "",
    fromAgencyName: "",
    toAgencyName: "",
    considerationLine: "",
    article1Line: "",
    article2Line: "",
  },
  recipients: {
    line1: "",
    line2: "",
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
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày quyết định" },
  { section: "evidenceTransfer", field: "prosecutionDecisionCode", label: "Số cáo trạng/quyết định truy tố" },
  { section: "evidenceTransfer", field: "prosecutionDecisionDate", label: "Ngày cáo trạng/quyết định truy tố" },
  { section: "evidenceTransfer", field: "caseTitle", label: "Tên vụ án" },
  { section: "evidenceTransfer", field: "evidenceListLine", label: "Danh sách vật chứng" },
  { section: "evidenceTransfer", field: "fromAgencyName", label: "Nơi đang giữ vật chứng" },
  { section: "evidenceTransfer", field: "toAgencyName", label: "Nơi nhận vật chứng" },
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
  if (/^\d{4}-\d{2}-\d{2}$/u.test(raw)) return raw;

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

function stripFinalDot(value: string): string {
  return value.replace(/[.。]\s*$/u, "").trim();
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

function getValue(form: Bm173FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function buildDerivedFields(form: Bm173FormInputs): Bm173FormInputs {
  const issuePlace = form.agency.issuePlace.trim() || "TP. Hồ Chí Minh";
  const issueDateText = toVietnameseDate(form.document.issueDate);

  const agencyBodyName =
    form.evidenceTransfer.agencyBodyName.trim() ||
    normalizeAgencyBodyName(form.agency.name);

  const prosecutionDecisionDateText = toVietnameseDate(
    form.evidenceTransfer.prosecutionDecisionDate,
  );

  const prosecutionDecisionType =
    form.evidenceTransfer.prosecutionDecisionType.trim() ||
    "Cáo trạng/Quyết định truy tố theo thủ tục rút gọn";

  const prosecutionDecisionLegalBasisLine = ensureEnd(
    `Căn cứ ${prosecutionDecisionType} số ${form.evidenceTransfer.prosecutionDecisionCode}${
      prosecutionDecisionDateText ? ` ${prosecutionDecisionDateText}` : ""
    } của ${agencyBodyName}`,
    ";",
  );

  const evidenceListClean = stripFinalDot(form.evidenceTransfer.evidenceListLine);

  const considerationLine = ensureEnd(
    firstText(
      form.evidenceTransfer.considerationLine,
      `Xét thấy cần phải chuyển các vật chứng của vụ án ${form.evidenceTransfer.caseTitle} đến ${form.evidenceTransfer.toAgencyName} để bảo đảm việc xét xử và thi hành án theo quy định của pháp luật`,
    ),
    ",",
  );

  const article1Line = ensureEnd(
    firstText(
      form.evidenceTransfer.article1Line,
      `Chuyển các vật chứng sau đây ${evidenceListClean} từ ${form.evidenceTransfer.fromAgencyName} đến ${form.evidenceTransfer.toAgencyName}`,
    ),
    ".",
  ).replace(/([^\s])\.\s+từ\s+/giu, "$1 từ ");

  const article2Line = ensureEnd(
    firstText(
      form.evidenceTransfer.article2Line,
      `Yêu cầu ${form.evidenceTransfer.fromAgencyName} và ${form.evidenceTransfer.toAgencyName} thực hiện việc giao, nhận vật chứng và gửi 02 biên bản giao, nhận đến ${agencyBodyName}`,
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
        "Căn cứ các điều 41, 90 và 106 của Bộ luật Tố tụng hình sự;",
    },
    evidenceTransfer: {
      ...form.evidenceTransfer,
      agencyBodyName,
      prosecutionDecisionType,
      prosecutionDecisionLegalBasisLine,
      considerationLine,
      article1Line,
      article2Line,
    },
    recipients: {
      ...form.recipients,
      line1: form.evidenceTransfer.fromAgencyName
        ? `- ${form.evidenceTransfer.fromAgencyName};`
        : "",
      line2: form.evidenceTransfer.toAgencyName
        ? `- ${form.evidenceTransfer.toAgencyName};`
        : "",
      archiveLine: form.recipients.archiveLine || "- Lưu: HSVA, HSKS, VP.",
    },
  };
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm173FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const official = section(payload, "official");
  const legalBasis = section(payload, "legalBasis");
  const evidenceTransfer = section(payload, "evidenceTransfer");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  return buildDerivedFields({
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
        "Căn cứ các điều 41, 90 và 106 của Bộ luật Tố tụng hình sự;",
      ),
    },
    evidenceTransfer: {
      agencyBodyName: firstText(
        pick(evidenceTransfer, "agencyBodyName"),
        normalizeAgencyBodyName(pick(agency, "name")),
        "Viện kiểm sát nhân dân khu vực 7",
      ),
      prosecutionDecisionType: firstText(
        pick(evidenceTransfer, "prosecutionDecisionType"),
        "Cáo trạng/Quyết định truy tố theo thủ tục rút gọn",
      ),
      prosecutionDecisionCode: firstText(
        pick(evidenceTransfer, "prosecutionDecisionCode"),
        pick(document, "documentCode"),
      ),
      prosecutionDecisionDate: firstText(
        toDateInput(evidenceTransfer.prosecutionDecisionDate),
        toDateInput(document.issueDate),
      ),
      prosecutionDecisionLegalBasisLine: pick(
        evidenceTransfer,
        "prosecutionDecisionLegalBasisLine",
      ),
      caseTitle: firstText(
        pick(evidenceTransfer, "caseTitle"),
        "Vụ án đánh bạc tại phường Trung Mỹ Tây",
      ),
      evidenceListLine: firstText(
        pick(evidenceTransfer, "evidenceListLine"),
        "01 điện thoại di động màu đen đã qua sử dụng và các tài liệu, đồ vật liên quan trong hồ sơ vụ án.",
      ),
      fromAgencyName: firstText(
        pick(evidenceTransfer, "fromAgencyName"),
        pick(recipients, "line1").replace(/^-\s*/u, "").replace(/[;.]\s*$/u, ""),
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      ),
      toAgencyName: firstText(
        pick(evidenceTransfer, "toAgencyName"),
        pick(recipients, "line2").replace(/^-\s*/u, "").replace(/[;.]\s*$/u, ""),
        "Tòa án nhân dân khu vực 7",
      ),
      considerationLine: pick(evidenceTransfer, "considerationLine"),
      article1Line: pick(evidenceTransfer, "article1Line"),
      article2Line: pick(evidenceTransfer, "article2Line"),
    },
    recipients: {
      line1: pick(recipients, "line1"),
      line2: pick(recipients, "line2"),
      archiveLine: firstText(pick(recipients, "archiveLine"), "- Lưu: HSVA, HSKS, VP."),
    },
    signature: {
      signMode: firstText(pick(signature, "signMode"), "KT. VIỆN TRƯỞNG"),
      positionTitle: firstText(pick(signature, "positionTitle"), "PHÓ VIỆN TRƯỞNG"),
      signerName: firstText(pick(signature, "signerName"), "Trần Thanh Nam"),
    },
  });
}

async function getRenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không tải được payload BM-173. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveFormInputs(documentId: string | number, form: Bm173FormInputs): Promise<void> {
  const finalForm = buildDerivedFields(form);

  const body = {
    formInputs: finalForm,
    agency: finalForm.agency,
    document: finalForm.document,
    official: finalForm.official,
    legalBasis: finalForm.legalBasis,
    evidenceTransfer: finalForm.evidenceTransfer,
    recipients: finalForm.recipients,
    signature: finalForm.signature,
    updatedByName: "Trần Thanh Nam",
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
    throw new Error(responseBody || `Không lưu được dữ liệu BM-173. HTTP ${response.status}`);
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
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function Bm173FormInputsPanel({ documentId, onSaved }: Props) {
  const [form, setForm] = useState<Bm173FormInputs>(EMPTY_FORM);
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
      setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-173.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        agency: {
          parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
          name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
          issuePlace: "TP. Hồ Chí Minh",
        },
        document: {
          documentCode: "173/QĐ-VKSKV7",
          issueDate: "2026-05-30",
          issuePlaceAndDateLine: "",
        },
        official: {
          issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        },
        legalBasis: {
          procedureArticlesLine: "Căn cứ các điều 41, 90 và 106 của Bộ luật Tố tụng hình sự;",
        },
        evidenceTransfer: {
          agencyBodyName: "Viện kiểm sát nhân dân khu vực 7",
          prosecutionDecisionType: "Cáo trạng",
          prosecutionDecisionCode: "173/CT-VKSKV7",
          prosecutionDecisionDate: "2026-05-30",
          prosecutionDecisionLegalBasisLine: "",
          caseTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
          evidenceListLine: "01 điện thoại di động màu đen đã qua sử dụng và các tài liệu, đồ vật liên quan trong hồ sơ vụ án",
          fromAgencyName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
          toAgencyName: "Tòa án nhân dân khu vực 7",
          considerationLine: "",
          article1Line: "",
          article2Line: "",
        },
        recipients: {
          line1: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
          line2: "- Tòa án nhân dân khu vực 7;",
          archiveLine: "- Lưu: HSVA, HSKS, VP.",
        },
        signature: {
          signMode: "KT. VIỆN TRƯỞNG",
          positionTitle: "PHÓ VIỆN TRƯỞNG",
          signerName: "Trần Thanh Nam",
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
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được dữ liệu BM-173.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-173...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">BM-173</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu Quyết định chuyển vật chứng
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Nhập dữ liệu chính. Hệ thống tự sinh dòng căn cứ, Điều 1, Điều 2 và nơi nhận.
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

      <SectionCard title="1. Cơ quan / quyết định">
        <Field required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} />
        <Field required label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} />
        <Field required label="Tên cơ quan trong nội dung" value={form.evidenceTransfer.agencyBodyName} onChange={(value) => updateField("evidenceTransfer", "agencyBodyName", value)} />
        <Field required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
        <Field required label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <DateSelectField required label="Ngày quyết định" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <Field required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="2. Căn cứ truy tố">
        <Field required label="Loại văn bản truy tố" value={form.evidenceTransfer.prosecutionDecisionType} onChange={(value) => updateField("evidenceTransfer", "prosecutionDecisionType", value)} />
        <Field required label="Số cáo trạng/quyết định truy tố" value={form.evidenceTransfer.prosecutionDecisionCode} onChange={(value) => updateField("evidenceTransfer", "prosecutionDecisionCode", value)} />
        <DateSelectField required label="Ngày cáo trạng/quyết định truy tố" value={form.evidenceTransfer.prosecutionDecisionDate} onChange={(value) => updateField("evidenceTransfer", "prosecutionDecisionDate", value)} />
        <Field required label="Tên vụ án" value={form.evidenceTransfer.caseTitle} onChange={(value) => updateField("evidenceTransfer", "caseTitle", value)} />
      </SectionCard>

      <SectionCard title="3. Chuyển vật chứng">
        <Field required multiline label="Danh sách vật chứng" value={form.evidenceTransfer.evidenceListLine} onChange={(value) => updateField("evidenceTransfer", "evidenceListLine", value)} className="md:col-span-2" />
        <Field required label="Từ cơ quan/người đang giữ" value={form.evidenceTransfer.fromAgencyName} onChange={(value) => updateField("evidenceTransfer", "fromAgencyName", value)} />
        <Field required label="Đến cơ quan nhận" value={form.evidenceTransfer.toAgencyName} onChange={(value) => updateField("evidenceTransfer", "toAgencyName", value)} />
        <Field multiline label="Lý do xét thấy" value={form.evidenceTransfer.considerationLine} onChange={(value) => updateField("evidenceTransfer", "considerationLine", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="4. Chữ ký">
        <SelectField label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <SelectField required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <Field required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
        <Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} />
      </SectionCard>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Xem nhanh nội dung tự sinh
          </summary>

          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <p><strong>Căn cứ BLTTHS:</strong> {derivedForm.legalBasis.procedureArticlesLine}</p>
            <p><strong>Căn cứ truy tố:</strong> {derivedForm.evidenceTransfer.prosecutionDecisionLegalBasisLine}</p>
            <p><strong>Xét thấy:</strong> {derivedForm.evidenceTransfer.considerationLine}</p>
            <p><strong>Điều 1:</strong> {derivedForm.evidenceTransfer.article1Line}</p>
            <p><strong>Điều 2:</strong> {derivedForm.evidenceTransfer.article2Line}</p>
            <p><strong>Nơi nhận 1:</strong> {derivedForm.recipients.line1}</p>
            <p><strong>Nơi nhận 2:</strong> {derivedForm.recipients.line2}</p>
          </div>
        </details>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Lưu dữ liệu BM-173</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sau khi lưu, kiểm tra render-payload trước khi render DOCX để tránh dữ liệu cũ đè dữ liệu mới.
            </p>
          </div>

          <button type="button" onClick={handleSave} disabled={isSaving || !isDirty} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-173"}
          </button>
        </div>
      </section>
    </div>
  );
}
