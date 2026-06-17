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

type CaseInvestigationTransferForm = {
  procedureArticlesLine: string;
  caseTitle: string;
  offenseName: string;
  fromInvestigationAuthorityName: string;
  toInvestigationAuthorityName: string;
  toProcuracyName: string;
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm085Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  caseInvestigationTransfer: CaseInvestigationTransferForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm085FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = '';

const EMPTY_FORM: Bm085Form = {
  agency: {
    parentName: "",
    name: "",
  },
  document: {
    documentCode: "85/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: "2026-05-26",
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  caseInvestigationTransfer: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 165 và 169 của Bộ luật Tố tụng hình sự;",
    caseTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
    offenseName: "",
    fromInvestigationAuthorityName:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    toInvestigationAuthorityName:
      "Cơ quan Cảnh sát điều tra Công an tỉnh Bình Dương",
    toProcuracyName: "Viện kiểm sát nhân dân tỉnh Bình Dương",
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

function stripArticlePrefix(value: string): string {
  return value
    .replace(/^\s*Điều\s*1\s*\.\s*/iu, "")
    .replace(/^\s*Điều\s*2\s*\.\s*/iu, "")
    .trim();
}

function buildIssuePlaceAndDateLine(form: Bm085Form): string {
  const place = form.document.issuePlace.trim();
  const dateText = toVietnameseDateText(form.document.issueDateIso);

  return place ? `${place}, ${dateText}` : dateText;
}

function buildReasonLine(form: Bm085Form): string {
  const data = form.caseInvestigationTransfer;

  return `Xét thấy ${data.caseTitle.trim()} về tội “${data.offenseName.trim()}” không thuộc thẩm quyền điều tra của ${data.fromInvestigationAuthorityName.trim()} mà thuộc thẩm quyền điều tra của ${data.toInvestigationAuthorityName.trim()},`;
}

function buildArticle1Line(form: Bm085Form): string {
  const data = form.caseInvestigationTransfer;

  return `Chuyển vụ án ${data.caseTitle.trim()} do ${data.fromInvestigationAuthorityName.trim()} đang tiến hành điều tra đến ${data.toInvestigationAuthorityName.trim()} để điều tra theo thẩm quyền.`;
}

function buildArticle2Line(form: Bm085Form): string {
  const data = form.caseInvestigationTransfer;

  return `Yêu cầu ${data.fromInvestigationAuthorityName.trim()} thực hiện việc chuyển hồ sơ vụ án, vật chứng và bị can (nếu có) theo quy định của Bộ luật Tố tụng hình sự./.`;
}

function buildFromInvestigationAuthorityRecipientLine(form: Bm085Form): string {
  return `- ${form.caseInvestigationTransfer.fromInvestigationAuthorityName.trim()};`;
}

function buildToInvestigationAuthorityRecipientLine(form: Bm085Form): string {
  return `- ${form.caseInvestigationTransfer.toInvestigationAuthorityName.trim()};`;
}

function buildToProcuracyRecipientLine(form: Bm085Form): string {
  return `- ${form.caseInvestigationTransfer.toProcuracyName.trim()};`;
}

function buildAccusedOrRepresentativeRecipientLine(): string {
  return "- Bị can hoặc người đại diện của bị can;";
}

function buildDefenderRecipientLine(): string {
  return "- Người bào chữa;";
}

function buildOtherParticipantRecipientLine(): string {
  return "- Người tham gia tố tụng khác;";
}

function buildRecipientsPreview(form: Bm085Form): string {
  return [
    buildFromInvestigationAuthorityRecipientLine(form),
    buildToInvestigationAuthorityRecipientLine(form),
    buildToProcuracyRecipientLine(form),
    buildAccusedOrRepresentativeRecipientLine(),
    buildDefenderRecipientLine(),
    buildOtherParticipantRecipientLine(),
    form.recipients.archiveLine,
  ].join("\n");
}

function normalizeFormInputs(payload: RenderPayload | null): Bm085Form {
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
    caseInvestigationTransfer: {
      procedureArticlesLine:
        nested(payload, "caseInvestigationTransfer.procedureArticlesLine") ||
        EMPTY_FORM.caseInvestigationTransfer.procedureArticlesLine,

      caseTitle:
        nested(payload, "caseInvestigationTransfer.caseTitle") ||
        nested(payload, "case.caseTitle") ||
        EMPTY_FORM.caseInvestigationTransfer.caseTitle,

      offenseName:
        nested(payload, "caseInvestigationTransfer.offenseName") ||
        nested(payload, "offense.offenseName") ||
        EMPTY_FORM.caseInvestigationTransfer.offenseName,

      fromInvestigationAuthorityName:
        nested(
          payload,
          "caseInvestigationTransfer.fromInvestigationAuthorityName",
        ) ||
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.caseInvestigationTransfer.fromInvestigationAuthorityName,

      toInvestigationAuthorityName:
        nested(payload, "caseInvestigationTransfer.toInvestigationAuthorityName") ||
        EMPTY_FORM.caseInvestigationTransfer.toInvestigationAuthorityName,

      toProcuracyName:
        nested(payload, "caseInvestigationTransfer.toProcuracyName") ||
        EMPTY_FORM.caseInvestigationTransfer.toProcuracyName,
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

function validateForm(form: Bm085Form): string[] {
  const required = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Số quyết định", form.document.documentCode],
    ["Địa danh ban hành", form.document.issuePlace],
    ["Ngày ban hành", form.document.issueDateIso],
    ["Chủ thể ban hành", form.official.issuerTitle],
    ["Căn cứ tố tụng", form.caseInvestigationTransfer.procedureArticlesLine],
    ["Tên vụ án", form.caseInvestigationTransfer.caseTitle],
    ["Tội danh", form.caseInvestigationTransfer.offenseName],
    [
      "Cơ quan đang điều tra",
      form.caseInvestigationTransfer.fromInvestigationAuthorityName,
    ],
    [
      "Cơ quan nhận chuyển điều tra",
      form.caseInvestigationTransfer.toInvestigationAuthorityName,
    ],
    ["Viện kiểm sát có thẩm quyền", form.caseInvestigationTransfer.toProcuracyName],
    ["Lưu hồ sơ", form.recipients.archiveLine],
    ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle],
    ["Người ký", form.signature.signerName],
  ];

  return required
    .filter(([, value]) => !String(value ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm085Form) {
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

  const caseInvestigationTransfer = {
    procedureArticlesLine:
      form.caseInvestigationTransfer.procedureArticlesLine,
    caseTitle: form.caseInvestigationTransfer.caseTitle,
    offenseName: form.caseInvestigationTransfer.offenseName,
    fromInvestigationAuthorityName:
      form.caseInvestigationTransfer.fromInvestigationAuthorityName,
    toInvestigationAuthorityName:
      form.caseInvestigationTransfer.toInvestigationAuthorityName,
    toProcuracyName: form.caseInvestigationTransfer.toProcuracyName,

    reasonLine: buildReasonLine(form),
    article1Line: stripArticlePrefix(buildArticle1Line(form)),
    article2Line: stripArticlePrefix(buildArticle2Line(form)),

    fromInvestigationAuthorityRecipientLine:
      buildFromInvestigationAuthorityRecipientLine(form),
    toInvestigationAuthorityRecipientLine:
      buildToInvestigationAuthorityRecipientLine(form),
    toProcuracyRecipientLine: buildToProcuracyRecipientLine(form),
    accusedOrRepresentativeRecipientLine:
      buildAccusedOrRepresentativeRecipientLine(),
    defenderRecipientLine: buildDefenderRecipientLine(),
    otherParticipantRecipientLine: buildOtherParticipantRecipientLine(),
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
    caseInvestigationTransfer,
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

export function Bm085FormInputsPanel({
  documentId,
  onSaved,
}: Bm085FormInputsPanelProps) {
  const [form, setForm] = useState<Bm085Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm085Form>(
    section: T,
    key: keyof Bm085Form[T],
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
      setMessage("Đã tải lại dữ liệu BM-085 từ backend.");
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
      caseInvestigationTransfer: {
        ...EMPTY_FORM.caseInvestigationTransfer,
      },
      recipients: { ...EMPTY_FORM.recipients },
      signature: { ...EMPTY_FORM.signature },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-085.");
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
      setMessage("Đã lưu dữ liệu BM-085. Các dòng tự sinh đã đồng bộ.");
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
            BM-085
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Dữ liệu Quyết định chuyển vụ án hình sự để điều tra theo thẩm quyền
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Form gom dữ liệu chính thành vài ô nhập. Các dòng Xét thấy, Điều 1,
            Điều 2 và Nơi nhận được tự sinh để dễ đọc, dễ sửa, tránh nhập lặp.
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
        title="2. Khu vực chuyển điều tra"
        description="Chỉ nhập thông tin cốt lõi. Các câu dài trong quyết định sẽ tự sinh từ các ô này."
      >
        <Field
          label="Căn cứ tố tụng"
          required
          multiline
          value={form.caseInvestigationTransfer.procedureArticlesLine}
          onChange={(value) =>
            patch("caseInvestigationTransfer", "procedureArticlesLine", value)
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Tên vụ án"
            required
            value={form.caseInvestigationTransfer.caseTitle}
            onChange={(value) =>
              patch("caseInvestigationTransfer", "caseTitle", value)
            }
          />

          <Field
            label="Tội danh"
            required
            value={form.caseInvestigationTransfer.offenseName}
            onChange={(value) =>
              patch("caseInvestigationTransfer", "offenseName", value)
            }
          />
        </div>

        <Field
          label="Cơ quan đang tiến hành điều tra"
          required
          value={form.caseInvestigationTransfer.fromInvestigationAuthorityName}
          onChange={(value) =>
            patch(
              "caseInvestigationTransfer",
              "fromInvestigationAuthorityName",
              value,
            )
          }
        />

        <Field
          label="Cơ quan nhận chuyển để điều tra"
          required
          value={form.caseInvestigationTransfer.toInvestigationAuthorityName}
          onChange={(value) =>
            patch(
              "caseInvestigationTransfer",
              "toInvestigationAuthorityName",
              value,
            )
          }
        />

        <Field
          label="Viện kiểm sát có thẩm quyền"
          required
          value={form.caseInvestigationTransfer.toProcuracyName}
          onChange={(value) =>
            patch("caseInvestigationTransfer", "toProcuracyName", value)
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

        <Field
          label="Nội dung Điều 1 tự sinh"
          multiline
          readOnly
          value={buildArticle1Line(form)}
        />

        <Field
          label="Nội dung Điều 2 tự sinh"
          multiline
          readOnly
          value={buildArticle2Line(form)}
        />

        <Field
          label="Nơi nhận tự sinh"
          multiline
          readOnly
          value={buildRecipientsPreview(form)}
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
