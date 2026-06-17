"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type AgencyForm = {
  parentName: string;
  name: string;
  bodyName: string;
};

type DocumentForm = {
  documentCode: string;
  issuePlace: string;
  issueDateIso: string;
};

type OfficialForm = {
  issuerTitle: string;
};

type CaseInitiationRequestForm = {
  procedureArticlesLine: string;
  investigationAuthorityName: string;
  incidentSummary: string;
  offenseName: string;
  legalArticle: string;
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm017Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  caseInitiationRequest: CaseInitiationRequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm017FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = '';

function todayIsoDate(): string {
  const now = new Date();

  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

const EMPTY_FORM: Bm017Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
  },
  document: {
    documentCode: "17/YC-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: todayIsoDate(),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  caseInitiationRequest: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 143, 159, 161 và 165 của Bộ luật Tố tụng hình sự;",
    investigationAuthorityName:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    incidentSummary: "vụ việc có dấu hiệu tội phạm",
    offenseName: "",
    legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
  },
  recipients: {
    archiveLine: "- Lưu: HSVV, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
};

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function nested(payload: RenderPayload | null, path: string): string {
  if (!payload) return "";

  const parts = path.split(".").filter(Boolean);
  let current: any = payload;

  for (const part of parts) {
    if (!current || typeof current !== "object") return "";
    current = current[part];
  }

  return cleanText(current);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseBm017DateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const iso = parseDateToIso(value) || todayIsoDate();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) {
    const today = todayIsoDate();
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

function buildBm017IsoDate(day: string, month: string, year: string): string {
  return `${year}-${pad2(Number(month))}-${pad2(Number(day))}`;
}

function normalizeBm017IssueDateIso(value: string): string {
  const parsed = parseDateToIso(value);

  if (!parsed || parsed === "2026-05-26") {
    return todayIsoDate();
  }

  return parsed;
}

function Bm017DateSelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseBm017DateParts(value);

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    pad2(index + 1),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    pad2(index + 1),
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

    onChange(buildBm017IsoDate(next.day, next.month, next.year));
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
function parseDateToIso(value: string): string {
  const raw = cleanText(value);

  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${slash[3]}-${pad2(Number(slash[2]))}-${pad2(Number(slash[1]))}`;
  }

  const vn = raw.match(
    /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu,
  );
  if (vn) {
    return `${vn[3]}-${pad2(Number(vn[2]))}-${pad2(Number(vn[1]))}`;
  }

  return "";
}

function toVietnameseDateText(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate || "";

  return `ngày ${Number(match[3])} tháng ${Number(match[2])} năm ${match[1]}`;
}

function toSlashDateText(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate || "";

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function issuePlaceFromLine(value: string): string {
  const raw = cleanText(value);
  const index = raw.toLowerCase().indexOf(", ngày");
  return index > 0 ? raw.slice(0, index).trim() : "";
}

function stripLeadingNumber(value: string, numberText: "1" | "2"): string {
  const pattern = new RegExp(`^\\s*${numberText}\\s*\\.\\s*`, "iu");
  return value.replace(pattern, "").trim();
}

function buildIssuePlaceAndDateLine(form: Bm017Form): string {
  const place = form.document.issuePlace.trim();
  const dateText = toVietnameseDateText(form.document.issueDateIso);

  return place ? `${place}, ${dateText}` : dateText;
}

function buildAssessmentLine(form: Bm017Form): string {
  const req = form.caseInitiationRequest;
  const incident = req.incidentSummary.trim() || "vụ việc";
  const legalArticle = req.legalArticle.trim();

  return `Xét thấy ${incident} có dấu hiệu tội phạm quy định tại ${legalArticle},`;
}

function buildArticle1Line(form: Bm017Form): string {
  const req = form.caseInitiationRequest;

  return `${req.investigationAuthorityName.trim()} khởi tố vụ án hình sự về tội “${req.offenseName.trim()}” quy định tại ${req.legalArticle.trim()} để tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự.`;
}

function normalizeAgencyBodyName(value: string): string {
  const raw = cleanText(value);

  if (!raw) return EMPTY_FORM.agency.bodyName;

  if (raw === raw.toLocaleUpperCase("vi-VN")) {
    return raw
      .toLocaleLowerCase("vi-VN")
      .replace(/^viện kiểm sát/u, "Viện kiểm sát");
  }

  return raw;
}

function buildArticle2Line(form: Bm017Form): string {
  const req = form.caseInitiationRequest;
  const agencyName = normalizeAgencyBodyName(form.agency.bodyName);

  return `${req.investigationAuthorityName.trim()} gửi Quyết định khởi tố vụ án hình sự kèm theo tài liệu liên quan đến ${agencyName} để kiểm sát việc khởi tố theo quy định của Bộ luật Tố tụng hình sự./.`;
}

function buildInvestigationAuthorityRecipientLine(form: Bm017Form): string {
  return `- ${form.caseInitiationRequest.investigationAuthorityName.trim()};`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm017Form {
  const issuePlaceAndDateLine = nested(payload, "document.issuePlaceAndDateLine");

  const savedIncidentSummary =
    nested(payload, "caseInitiationRequest.incidentSummary") ||
    nested(payload, "case.caseSummary") ||
    "vụ việc";

  const offenseName =
    nested(payload, "caseInitiationRequest.offenseName") ||
    nested(payload, "offense.offenseName") ||
    EMPTY_FORM.caseInitiationRequest.offenseName;

  const legalArticle =
    nested(payload, "caseInitiationRequest.legalArticle") ||
    nested(payload, "offense.legalArticle") ||
    EMPTY_FORM.caseInitiationRequest.legalArticle;

  const signerName =
    nested(payload, "signature.signerName") || DEFAULT_SIGNER_NAME;

  return {
    agency: {
      parentName:
        nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
      bodyName: normalizeAgencyBodyName(
        nested(payload, "agency.bodyName") ||
          nested(payload, "agency.name") ||
          EMPTY_FORM.agency.bodyName,
      ),
    },
    document: {
      documentCode:
        nested(payload, "document.documentCode") ||
        EMPTY_FORM.document.documentCode,
      issuePlace:
        nested(payload, "agency.issuePlace") ||
        issuePlaceFromLine(issuePlaceAndDateLine) ||
        EMPTY_FORM.document.issuePlace,
      issueDateIso:
        normalizeBm017IssueDateIso(
          nested(payload, "document.issueDate") ||
            nested(payload, "document.issueDateText") ||
            issuePlaceAndDateLine ||
            EMPTY_FORM.document.issueDateIso,
        ),
    },
    official: {
      issuerTitle:
        nested(payload, "official.issuerTitle") ||
        EMPTY_FORM.official.issuerTitle,
    },
    caseInitiationRequest: {
      procedureArticlesLine:
        nested(payload, "caseInitiationRequest.procedureArticlesLine") ||
        EMPTY_FORM.caseInitiationRequest.procedureArticlesLine,

      investigationAuthorityName:
        nested(payload, "caseInitiationRequest.investigationAuthorityName") ||
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.caseInitiationRequest.investigationAuthorityName,

      incidentSummary: savedIncidentSummary,
      offenseName,
      legalArticle,
    },
    recipients: {
      archiveLine:
        nested(payload, "recipients.archiveLine") ||
        EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode:
        nested(payload, "signature.signMode") ||
        EMPTY_FORM.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") ||
        EMPTY_FORM.signature.positionTitle,
      signerName,
    },
  };
}

function validateForm(form: Bm017Form): string[] {
  const required = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Tên cơ quan trong thân văn bản", form.agency.bodyName],
    ["Số văn bản", form.document.documentCode],
    ["Địa danh ban hành", form.document.issuePlace],
    ["Ngày ban hành", form.document.issueDateIso],
    ["Chủ thể ban hành", form.official.issuerTitle],
    ["Căn cứ tố tụng", form.caseInitiationRequest.procedureArticlesLine],
    ["Cơ quan điều tra", form.caseInitiationRequest.investigationAuthorityName],
    ["Nội dung vụ việc", form.caseInitiationRequest.incidentSummary],
    ["Tội danh", form.caseInitiationRequest.offenseName],
    ["Điều khoản BLHS", form.caseInitiationRequest.legalArticle],
    ["Lưu hồ sơ", form.recipients.archiveLine],
    ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle],
    ["Người ký", form.signature.signerName],
  ];

  return required
    .filter(([, value]) => !String(value ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm017Form) {
  const signerName = form.signature.signerName.trim() || DEFAULT_SIGNER_NAME;
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(form);

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
    bodyName: normalizeAgencyBodyName(form.agency.bodyName),
    issuePlace: form.document.issuePlace,
  };

  const document = {
    documentCode: form.document.documentCode,
    documentNo: form.document.documentCode,
    issueDate: toSlashDateText(form.document.issueDateIso),
    issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(
      /^ngày\s+/iu,
      "",
    ),
    issuePlaceAndDateLine,
    issuePlaceDateLine: issuePlaceAndDateLine,
  };

  const official = {
    issuerTitle: form.official.issuerTitle,
  };

  const caseInitiationRequest = {
    procedureArticlesLine:
      form.caseInitiationRequest.procedureArticlesLine,
    investigationAuthorityName:
      form.caseInitiationRequest.investigationAuthorityName,
    incidentSummary: form.caseInitiationRequest.incidentSummary,
    offenseName: form.caseInitiationRequest.offenseName,
    legalArticle: form.caseInitiationRequest.legalArticle,
    assessmentLine: buildAssessmentLine(form),
    article1Line: stripLeadingNumber(buildArticle1Line(form), "1"),
    article2Line: stripLeadingNumber(buildArticle2Line(form), "2"),
    investigationAuthorityRecipientLine:
      buildInvestigationAuthorityRecipientLine(form),
  };

  const recipients = {
    archiveLine: form.recipients.archiveLine,
  };

  const signature = {
    signMode: form.signature.signMode,
    positionTitle: form.signature.positionTitle,
    signerName,
  };

  const savedInputs = {
    agency,
    document,
    official,
    caseInitiationRequest,
    recipients,
    signature,
  };

  return {
    ...savedInputs,
    formInputs: savedInputs,
    payloadOverrides: savedInputs,
    renderPayloadOverrides: savedInputs,
    updatedByName: signerName,
  };
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
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  type?: "text" | "date";
  readOnly?: boolean;
}) {
  const cls =
    "rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      {multiline ? (
        <textarea
          className={`${cls} min-h-[88px] ${
            readOnly ? "bg-slate-100 text-slate-700" : "bg-white"
          }`}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <input
          className={`${cls} ${
            readOnly ? "bg-slate-100 text-slate-700" : "bg-white"
          }`}
          value={value}
          type={type}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </label>
  );
}

export function Bm017FormInputsPanel({
  documentId,
  onSaved,
}: Bm017FormInputsPanelProps) {
  const [form, setForm] = useState<Bm017Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm017Form>(
    section: T,
    key: keyof Bm017Form[T],
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...(current[section] as Record<string, string>),
        [key]: value,
      },
    }));
  };

  const reloadFromBackend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        { method: "GET", cache: "no-store" },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không tải được render-payload. HTTP ${response.status}`,
        );
      }

      const payload = (await response.json()) as RenderPayload;
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải lại dữ liệu BM-017 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm({
      agency: { ...EMPTY_FORM.agency },
      document: { ...EMPTY_FORM.document },
      official: { ...EMPTY_FORM.official },
      caseInitiationRequest: { ...EMPTY_FORM.caseInitiationRequest },
      recipients: { ...EMPTY_FORM.recipients },
      signature: { ...EMPTY_FORM.signature },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-017.");
  };

  const handleSave = async () => {
    const errors = validateForm(form);

    if (errors.length > 0) {
      setError(`Thiếu dữ liệu bắt buộc: ${errors.join(", ")}`);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(buildSaveBody(form)),
        },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không lưu được dữ liệu biểu mẫu. HTTP ${response.status}`,
        );
      }

      await reloadFromBackend();
      setMessage("Đã lưu dữ liệu BM-017. Các câu tự sinh đã đồng bộ.");
      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void reloadFromBackend();
     
  }, [documentId]);

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            BM-017
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Dữ liệu biểu mẫu Yêu cầu khởi tố vụ án hình sự
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Form này gom dữ liệu thành các ô chính. Các dòng Xét thấy, mục 1,
            mục 2 và nơi nhận được tự sinh để tránh nhập lặp.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            onClick={reloadFromBackend}
            disabled={loading || saving}
          >
            {loading ? "Đang tải..." : "Tải lại từ backend"}
          </button>

          <button
            type="button"
            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-60"
            onClick={handleFillSample}
            disabled={loading || saving}
          >
            Điền dữ liệu mẫu
          </button>

          <button
            type="button"
            className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? "Đang lưu..." : "Lưu dữ liệu"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Còn thiếu: {validationErrors.join(", ")}
        </div>
      ) : null}

      <SectionCard title="1. Header biểu mẫu">
        <Field
          label="Viện kiểm sát cấp trên"
          required
          value={form.agency.parentName}
          onChange={(value) => patch("agency", "parentName", value)}
        />

        $1
        <Field
          label="Tên cơ quan trong thân văn bản"
          required
          value={form.agency.bodyName}
          onChange={(value) => patch("agency", "bodyName", value)}
        />
<div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Số văn bản"
            required
            value={form.document.documentCode}
            onChange={(value) => patch("document", "documentCode", value)}
          />

          <Field
            label="Địa danh ban hành"
            required
            value={form.document.issuePlace}
            onChange={(value) => patch("document", "issuePlace", value)}
          />

          <Bm017DateSelectField
            label="Ngày ban hành"
            value={form.document.issueDateIso || todayIsoDate()}
            onChange={(value) => patch("document", "issueDateIso", value)}
          />
        </div>

        <Field
          label="Dòng địa danh/ngày tháng tự sinh"
          value={buildIssuePlaceAndDateLine(form)}
          readOnly
        />

        <Field
          label="Chủ thể ban hành"
          required
          value={form.official.issuerTitle}
          onChange={(value) => patch("official", "issuerTitle", value)}
        />
      </SectionCard>

      <SectionCard
        title="2. Nội dung chính"
        description="Chỉ nhập các thông tin chính. Các câu dài bên dưới tự sinh theo dữ liệu này."
      >
        <Field
          label="Căn cứ tố tụng"
          required
          multiline
          value={form.caseInitiationRequest.procedureArticlesLine}
          onChange={(value) =>
            patch("caseInitiationRequest", "procedureArticlesLine", value)
          }
        />

        <Field
          label="Cơ quan, người có thẩm quyền"
          required
          value={form.caseInitiationRequest.investigationAuthorityName}
          onChange={(value) =>
            patch("caseInitiationRequest", "investigationAuthorityName", value)
          }
        />

        <Field
          label="Nội dung vụ việc"
          required
          multiline
          value={form.caseInitiationRequest.incidentSummary}
          onChange={(value) =>
            patch("caseInitiationRequest", "incidentSummary", value)
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Tội danh"
            required
            value={form.caseInitiationRequest.offenseName}
            onChange={(value) =>
              patch("caseInitiationRequest", "offenseName", value)
            }
          />

          <Field
            label="Điều khoản BLHS"
            required
            value={form.caseInitiationRequest.legalArticle}
            onChange={(value) =>
              patch("caseInitiationRequest", "legalArticle", value)
            }
          />
        </div>

        <Field
          label="Dòng xét thấy tự sinh"
          multiline
          readOnly
          value={buildAssessmentLine(form)}
        />

        <Field
          label="Nội dung mục 1 tự sinh"
          multiline
          readOnly
          value={buildArticle1Line(form)}
        />

        <Field
          label="Nội dung mục 2 tự sinh"
          multiline
          readOnly
          value={buildArticle2Line(form)}
        />
      </SectionCard>

      <SectionCard title="3. Nơi nhận">
        <Field
          label="Cơ quan điều tra tự sinh"
          readOnly
          value={buildInvestigationAuthorityRecipientLine(form)}
        />

        <Field
          label="Lưu hồ sơ"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => patch("recipients", "archiveLine", value)}
        />
      </SectionCard>

      <SectionCard title="4. Chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Chế độ ký"
            required
            value={form.signature.signMode}
            onChange={(value) => patch("signature", "signMode", value)}
          />

          <Field
            label="Chức vụ ký"
            required
            value={form.signature.positionTitle}
            onChange={(value) => patch("signature", "positionTitle", value)}
          />
        </div>

        <Field
          label="Người ký"
          required
          value={form.signature.signerName}
          onChange={(value) => patch("signature", "signerName", value)}
        />
      </SectionCard>
    </div>
  );
}
