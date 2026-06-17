"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

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
  onSaved?: () => void;
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
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issuePlaceAndDateLine", label: "Dòng địa danh, ngày tháng" },
  { section: "official", field: "issuerTitle", label: "Thẩm quyền ban hành" },
  { section: "legalBasis", field: "procedureArticlesLine", label: "Căn cứ Bộ luật Tố tụng hình sự" },
  { section: "crimeReport", field: "content", label: "Nội dung vụ việc" },
  { section: "case", field: "caseTitle", label: "Tên vụ án/vụ việc" },
  { section: "offense", field: "offenseName", label: "Tội danh" },
  { section: "offense", field: "legalArticle", label: "Điều khoản Bộ luật Hình sự" },
  { section: "investigation", field: "article2Line", label: "Nội dung Điều 2" },
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

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];
  return isRecord(value) ? value : {};
}

function pick(record: Record<string, unknown>, key: string): string {
  return text(record[key]);
}

function toDateInput(value: unknown): string {
  const raw = text(value).trim();

  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function getValue(form: Bm023FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm023FormInputs {
  const agency = section(payload, "agency");
  const official = section(payload, "official");
  const document = section(payload, "document");
  const legalBasis = section(payload, "legalBasis");
  const crimeReport = section(payload, "crimeReport");
  const caseInfo = section(payload, "case");
  const offense = section(payload, "offense");
  const investigation = section(payload, "investigation");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  return {
    agency: {
      parentName: pick(agency, "parentName"),
      name: pick(agency, "name"),
      shortName: pick(agency, "shortName"),
      issuePlace: pick(agency, "issuePlace"),
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
      issueDate: toDateInput(document.issueDate),
      issuePlaceAndDateLine:
        pick(document, "issuePlaceAndDateLine") || pick(document, "issuePlaceDateLine"),
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
      investigationUnitName: pick(investigation, "investigationUnitName"),
      article2Line: pick(investigation, "article2Line"),
    },
    recipients: {
      investigationUnitLine: pick(recipients, "investigationUnitLine"),
      superiorProcuracyLine: pick(recipients, "superiorProcuracyLine"),
      archiveLine: pick(recipients, "archiveLine"),
      noteLine: pick(recipients, "noteLine"),
    },
    signature: {
      signMode: pick(signature, "signMode") || "KT. VIỆN TRƯỞNG",
      positionTitle: pick(signature, "positionTitle") || "PHÓ VIỆN TRƯỞNG",
      signerName: pick(signature, "signerName"),
    },
  };
}

async function getBm023RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
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

async function saveBm023FormInputs(
  documentId: string | number,
  form: Bm023FormInputs,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ...form,
        updatedByName: "Huy",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không lưu được dữ liệu BM-023. HTTP ${response.status}`);
  }
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
  type?: "text" | "date";
  placeholder?: string;
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
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">-- Chọn --</option>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
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

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      return !getValue(form, item.section, item.field).trim();
    });
  }, [form]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (sectionKey === "investigation" && field === "investigationUnitName") {
        next.investigation = {
          ...next.investigation,
          article2Line: value.trim()
            ? `Yêu cầu ${value.trim()} tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự.`
            : next.investigation.article2Line,
        };

        next.recipients = {
          ...next.recipients,
          investigationUnitLine: value.trim() ? `- ${value.trim()};` : "",
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
    const sample: Bm023FormInputs = {
      agency: {
        parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
        name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "0988027788",
      },
      official: {
        fullName: "Trần Thanh Nam",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        prosecutorName: "Trần Thanh Nam",
      },
      document: {
        documentCode: "19/QĐ-VKSKV7",
        issueDate: "2026-05-11",
        issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 11 tháng 5 năm 2026",
      },
      legalBasis: {
        procedureArticlesLine:
          "Căn cứ các điều 41, 143, 153, 154, 159, 161 và 165 của Bộ luật Tố tụng hình sự;",
      },
      crimeReport: {
        content:
          "Hồ sơ demo phục vụ kiểm thử luồng tạo hồ sơ, thêm bị can, thêm tội danh và sinh biểu mẫu.",
      },
      case: {
        caseCode: "VKS-2026-0001",
        caseTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
        caseSummary:
          "Hồ sơ demo phục vụ kiểm thử luồng tạo hồ sơ, thêm bị can, thêm tội danh và sinh biểu mẫu.",
      },
      offense: {
        offenseName: "Đánh bạc",
        legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
        criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      },
      investigation: {
        investigationUnitName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
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
        signerName: "Trần Thanh Nam",
      },
    };

    setForm(sample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await saveBm023FormInputs(documentId, form);

      setInitialSnapshot(JSON.stringify(form));
      setSavedAt(new Date());
      onSaved?.();
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-023
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định khởi tố vụ án hình sự
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này lưu dữ liệu nghiệp vụ riêng cho BM-023: số quyết định,
              căn cứ pháp lý, nội dung vụ việc, tội danh, yêu cầu điều tra, nơi
              nhận và chữ ký.
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
            <p className="mt-1 text-sm text-amber-700">
              {missingFields.map((item) => item.label).join(", ")}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Các trường quan trọng của BM-023 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-023
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
        description="Các trường này đi vào phần đầu văn bản và dòng thẩm quyền ban hành."
      >
        <Field
          label="Cơ quan cấp trên"
          value={form.agency.parentName}
          onChange={(value) => updateField("agency", "parentName", value)}
          required
        />
        <Field
          label="Cơ quan ban hành"
          value={form.agency.name}
          onChange={(value) => updateField("agency", "name", value)}
          required
        />
        <Field
          label="Tên viết tắt cơ quan"
          value={form.agency.shortName}
          onChange={(value) => updateField("agency", "shortName", value)}
        />
        <Field
          label="Số quyết định"
          value={form.document.documentCode}
          onChange={(value) => updateField("document", "documentCode", value)}
          required
        />
        <Field
          label="Ngày quyết định"
          type="date"
          value={form.document.issueDate}
          onChange={(value) => updateField("document", "issueDate", value)}
        />
        <Field
          label="Dòng địa danh, ngày tháng"
          value={form.document.issuePlaceAndDateLine}
          onChange={(value) =>
            updateField("document", "issuePlaceAndDateLine", value)
          }
          required
        />
        <Field
          label="Thẩm quyền ban hành"
          value={form.official.issuerTitle}
          onChange={(value) => updateField("official", "issuerTitle", value)}
          required
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard
        title="2. Căn cứ, vụ việc và tội danh"
        description="Nội dung chính dùng cho phần xét thấy và Điều 1 của quyết định."
      >
        <Field
          label="Căn cứ Bộ luật Tố tụng hình sự"
          value={form.legalBasis.procedureArticlesLine}
          onChange={(value) =>
            updateField("legalBasis", "procedureArticlesLine", value)
          }
          required
          multiline
          className="md:col-span-2"
        />
        <Field
          label="Nội dung vụ việc"
          value={form.crimeReport.content}
          onChange={(value) => updateField("crimeReport", "content", value)}
          required
          multiline
          className="md:col-span-2"
        />
        <Field
          label="Tên vụ án/vụ việc"
          value={form.case.caseTitle}
          onChange={(value) => updateField("case", "caseTitle", value)}
          required
        />
        <Field
          label="Mã hồ sơ"
          value={form.case.caseCode}
          onChange={(value) => updateField("case", "caseCode", value)}
        />
        <Field
          label="Tội danh"
          value={form.offense.offenseName}
          onChange={(value) => updateField("offense", "offenseName", value)}
          required
        />
        <Field
          label="Điều khoản Bộ luật Hình sự"
          value={form.offense.legalArticle}
          onChange={(value) => updateField("offense", "legalArticle", value)}
          required
        />
      </SectionCard>

      <SectionCard
        title="3. Yêu cầu điều tra và nơi nhận"
        description="Dữ liệu này dùng cho Điều 2 và phần nơi nhận."
      >
        <Field
          label="Cơ quan điều tra"
          value={form.investigation.investigationUnitName}
          onChange={(value) =>
            updateField("investigation", "investigationUnitName", value)
          }
        />
        <Field
          label="Nơi nhận - cơ quan điều tra"
          value={form.recipients.investigationUnitLine}
          onChange={(value) =>
            updateField("recipients", "investigationUnitLine", value)
          }
        />
        <Field
          label="Nội dung Điều 2"
          value={form.investigation.article2Line}
          onChange={(value) => updateField("investigation", "article2Line", value)}
          required
          multiline
          className="md:col-span-2"
        />
        <Field
          label="Nơi nhận - Viện kiểm sát cấp trên"
          value={form.recipients.superiorProcuracyLine}
          onChange={(value) =>
            updateField("recipients", "superiorProcuracyLine", value)
          }
        />
        <Field
          label="Nơi nhận - lưu"
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
          required
        />
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
          required
        />
        <Field
          label="Người ký"
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          required
        />
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
