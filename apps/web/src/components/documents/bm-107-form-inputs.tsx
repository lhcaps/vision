"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type AgencyForm = {
  parentName: string;
  name: string;
};

type DocumentForm = {
  documentCode: string;
  issuePlace: string;
  issueDateIso: string;
};

type OfficialForm = {
  issuerTitle: string;
};

type SuspensionCancelForm = {
  procedureArticlesLine: string;
  suspendedDecisionInfoLine: string;
  caseTitle: string;
  offenseName: string;
  reasonLine: string;
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm107Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  suspensionCancel: SuspensionCancelForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm107FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = "";

const EMPTY_FORM: Bm107Form = {
  agency: {
    parentName: "",
    name: "",
  },
  document: {
    documentCode: "107/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: "2026-05-26",
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  suspensionCancel: {
    procedureArticlesLine:
      "Căn cứ các điều 36, 190 của Bộ luật Tố tụng hình sự;",
    suspendedDecisionInfoLine: "Quyết định số 85/QĐ-VKSKV7 ngày 01/05/2026",
    caseTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
    offenseName: "",
    reasonLine: "",
  },
  recipients: {
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
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

function buildIssuePlaceAndDateLine(form: Bm107Form): string {
  const place = form.document.issuePlace.trim();
  const dateText = toVietnameseDateText(form.document.issueDateIso);

  return place ? `${place}, ${dateText}` : dateText;
}

function buildReasonLine(form: Bm107Form): string {
  const data = form.suspensionCancel;

  if (!data.reasonLine.trim()) {
    return `Xét thấy việc hủy bỏ quyết định tạm đình chỉ điều tra là có căn cứ.`;
  }

  return data.reasonLine.trim();
}

function normalizeFormInputs(payload: RenderPayload | null): Bm107Form {
  const issuePlaceAndDateLine = nested(payload, "document.issuePlaceAndDateLine");

  const signerName =
    nested(payload, "signature.signerName") || DEFAULT_SIGNER_NAME;

  return {
    agency: {
      parentName:
        nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
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
        parseDateToIso(nested(payload, "document.issueDate")) ||
        parseDateToIso(nested(payload, "document.issueDateText")) ||
        parseDateToIso(issuePlaceAndDateLine) ||
        EMPTY_FORM.document.issueDateIso,
    },
    official: {
      issuerTitle:
        nested(payload, "official.issuerTitle") ||
        EMPTY_FORM.official.issuerTitle,
    },
    suspensionCancel: {
      procedureArticlesLine:
        nested(payload, "suspensionCancel.procedureArticlesLine") ||
        EMPTY_FORM.suspensionCancel.procedureArticlesLine,

      suspendedDecisionInfoLine:
        nested(payload, "suspensionCancel.suspendedDecisionInfoLine") ||
        EMPTY_FORM.suspensionCancel.suspendedDecisionInfoLine,

      caseTitle:
        nested(payload, "suspensionCancel.caseTitle") ||
        nested(payload, "case.caseTitle") ||
        EMPTY_FORM.suspensionCancel.caseTitle,

      offenseName:
        nested(payload, "suspensionCancel.offenseName") ||
        nested(payload, "offense.offenseName") ||
        EMPTY_FORM.suspensionCancel.offenseName,

      reasonLine:
        nested(payload, "suspensionCancel.reasonLine") ||
        EMPTY_FORM.suspensionCancel.reasonLine,
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

function validateForm(form: Bm107Form): string[] {
  const required = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Số quyết định", form.document.documentCode],
    ["Địa danh ban hành", form.document.issuePlace],
    ["Ngày ban hành", form.document.issueDateIso],
    ["Chủ thể ban hành", form.official.issuerTitle],
    ["Căn cứ tố tụng", form.suspensionCancel.procedureArticlesLine],
    ["QĐ tạm đình chỉ bị hủy", form.suspensionCancel.suspendedDecisionInfoLine],
    ["Tên vụ án", form.suspensionCancel.caseTitle],
    ["Tội danh", form.suspensionCancel.offenseName],
    ["Lý do hủy bỏ", form.suspensionCancel.reasonLine],
    ["Lưu hồ sơ", form.recipients.archiveLine],
    ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle],
    ["Người ký", form.signature.signerName],
  ];

  return required
    .filter(([, value]) => !String(value ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm107Form) {
  const signerName = form.signature.signerName.trim() || DEFAULT_SIGNER_NAME;
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(form);

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
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

  const suspensionCancel = {
    procedureArticlesLine:
      form.suspensionCancel.procedureArticlesLine,
    suspendedDecisionInfoLine:
      form.suspensionCancel.suspendedDecisionInfoLine,
    caseTitle: form.suspensionCancel.caseTitle,
    offenseName: form.suspensionCancel.offenseName,
    reasonLine: buildReasonLine(form),
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
    suspensionCancel,
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

export function Bm107FormInputsPanel({
  documentId,
  onSaved,
}: Bm107FormInputsPanelProps) {
  const [form, setForm] = useState<Bm107Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm107Form>(
    section: T,
    key: keyof Bm107Form[T],
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
      setMessage("Đã tải lại dữ liệu BM-107 từ backend.");
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
      suspensionCancel: {
        ...EMPTY_FORM.suspensionCancel,
      },
      recipients: { ...EMPTY_FORM.recipients },
      signature: { ...EMPTY_FORM.signature },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-107.");
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
      setMessage("Đã lưu dữ liệu BM-107. Các dòng tự sinh đã đồng bộ.");
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
            BM-107
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            QĐ hủy bỏ QĐ tạm đình chỉ điều tra VAHS
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Form gom dữ liệu chính thành vài ô nhập. Các dòng tự sinh từ các ô
            cơ bản giúp nhập liệu nhanh, tránh lặp lại.
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

        <Field
          label="Viện kiểm sát ban hành"
          required
          value={form.agency.name}
          onChange={(value) => patch("agency", "name", value)}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Số quyết định"
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

          <Field
            label="Ngày ban hành"
            required
            type="date"
            value={form.document.issueDateIso}
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
        title="2. Nội dung hủy bỏ tạm đình chỉ"
        description="Chỉ nhập thông tin cốt lõi. Các dòng dài trong văn bản sẽ tự sinh."
      >
        <Field
          label="Căn cứ tố tụng"
          required
          multiline
          value={form.suspensionCancel.procedureArticlesLine}
          onChange={(value) =>
            patch("suspensionCancel", "procedureArticlesLine", value)
          }
        />

        <Field
          label="QĐ tạm đình chỉ điều tra bị hủy"
          required
          value={form.suspensionCancel.suspendedDecisionInfoLine}
          onChange={(value) =>
            patch("suspensionCancel", "suspendedDecisionInfoLine", value)
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Tên vụ án"
            required
            value={form.suspensionCancel.caseTitle}
            onChange={(value) =>
              patch("suspensionCancel", "caseTitle", value)
            }
          />

          <Field
            label="Tội danh"
            required
            value={form.suspensionCancel.offenseName}
            onChange={(value) =>
              patch("suspensionCancel", "offenseName", value)
            }
          />
        </div>

        <Field
          label="Lý do hủy bỏ"
          required
          multiline
          value={form.suspensionCancel.reasonLine}
          onChange={(value) =>
            patch("suspensionCancel", "reasonLine", value)
          }
        />
      </SectionCard>

      <SectionCard
        title="3. Nội dung tự sinh"
        description="Các dòng này không cần nhập tay. Đổi ô chính ở trên thì nội dung dưới đổi theo."
      >
        <Field
          label="Dòng xét thấy tự sinh"
          multiline
          readOnly
          value={buildReasonLine(form)}
        />
      </SectionCard>

      <SectionCard title="4. Nơi nhận và chữ ký">
        <Field
          label="Lưu hồ sơ"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => patch("recipients", "archiveLine", value)}
        />

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
