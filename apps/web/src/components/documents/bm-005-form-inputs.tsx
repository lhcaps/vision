"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type AgencyForm = {
  parentName: string;
  name: string;
  bodyName: string;
  shortName: string;
};

type DocumentForm = {
  documentCode: string;
  issuePlace: string;
  issueDateText: string;
  issuePlaceAndDateLine: string;
};

type OfficialForm = {
  issuerTitle: string;
};

type SourceVerificationForm = {
  requestRoundText: string;
  procedureArticlesLine: string;
  reasonLine: string;
  requestedAuthorityLine: string;
  issue1Line: string;
  issue2Line: string;
  issue3Line: string;
  additionalIssuesLine: string;
  resultSubmissionLine: string;
};

type RecipientsForm = {
  investigatingAgencyLine: string;
  archiveLine: string;
};

type SignatureForm = {
  signerName: string;
};

type ReceiverForm = {
  fullName: string;
  signerName: string;
};

type Bm005Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  sourceVerification: SourceVerificationForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  receiver: ReceiverForm;
  updatedByName: string;
};

type RenderPayload = Record<string, any>;

type Bm005FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = '';

function getBm005TodayDisplayDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}/${month}/${year}`;
}

function normalizeDisplayDate(value: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (iso) return `${iso[3].padStart(2, "0")}/${iso[2].padStart(2, "0")}/${iso[1]}`;

  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (vn) return `${vn[1].padStart(2, "0")}/${vn[2].padStart(2, "0")}/${vn[3]}`;

  return raw;
}

function issuePlaceAndDateLine(issuePlace: string, issueDateText: string): string {
  const normalizedDate = normalizeDisplayDate(issueDateText);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalizedDate);

  if (!match) {
    return `${String(issuePlace ?? "").trim()}, ngày ... tháng ... năm ...`;
  }

  return `${String(issuePlace ?? "").trim()}, ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
}

const EMPTY_FORM: Bm005Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "05/YC-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: getBm005TodayDisplayDate(),
    issuePlaceAndDateLine: issuePlaceAndDateLine("TP. Hồ Chí Minh", getBm005TodayDisplayDate()),
  },
  official: {
    issuerTitle: "",
  },
  sourceVerification: {
    requestRoundText: "(Lần thứ nhất)",
    procedureArticlesLine:
      "Căn cứ các điều 41, 42, 145 và 159 của Bộ luật Tố tụng hình sự;",
    reasonLine:
      "Xét thấy cần kiểm tra, xác minh làm rõ vụ việc có dấu hiệu tội “Đánh bạc”, Viện kiểm sát nhân dân khu vực 7,",
    requestedAuthorityLine:
      "1. Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh làm rõ vấn đề sau:",
    issue1Line: "a) Làm rõ nội dung nguồn tin về tội phạm đã tiếp nhận.",
    issue2Line:
      "b) Thu thập tài liệu, chứng cứ liên quan đến hành vi có dấu hiệu tội phạm.",
    issue3Line: "c) Xác minh nhân thân, lai lịch của người có liên quan.",
    additionalIssuesLine:
      "d) Làm rõ các tình tiết khác có ý nghĩa đối với việc giải quyết nguồn tin.",
    resultSubmissionLine:
      "2. Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh gửi kết quả kiểm tra, xác minh đến Viện kiểm sát nhân dân khu vực 7 theo quy định của Bộ luật Tố tụng hình sự./.",
  },
  recipients: {
    investigatingAgencyLine:
      "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    archiveLine: "- Lưu: HSVV, HSKS, VP.",
  },
  signature: {
    signerName: DEFAULT_SIGNER_NAME,
  },
  receiver: {
    fullName: DEFAULT_SIGNER_NAME,
    signerName: DEFAULT_SIGNER_NAME,
  },
  updatedByName: DEFAULT_SIGNER_NAME,
};

const REQUIRED_FIELDS: Array<{
  path:
    | keyof SourceVerificationForm
    | "recipients.investigatingAgencyLine"
    | "recipients.archiveLine"
    | "signature.signerName";
  label: string;
}> = [
  { path: "procedureArticlesLine", label: "Căn cứ tố tụng" },
  { path: "reasonLine", label: "Nhận định cần kiểm tra, xác minh" },
  { path: "requestedAuthorityLine", label: "Cơ quan/người có thẩm quyền" },
  { path: "issue1Line", label: "Vấn đề a)" },
  { path: "resultSubmissionLine", label: "Yêu cầu gửi kết quả" },
  {
    path: "recipients.investigatingAgencyLine",
    label: "Nơi nhận - cơ quan điều tra",
  },
  { path: "recipients.archiveLine", label: "Nơi nhận - lưu hồ sơ" },
  { path: "signature.signerName", label: "Kiểm sát viên ký" },
];

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function cleanText(value: unknown): string {
  return text(value).trim();
}

function nested(payload: RenderPayload | null, path: string): string {
  if (!payload) return "";

  const parts = path.split(".").filter(Boolean);
  let current: any = payload;

  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return "";
    }

    current = current[part];
  }

  return cleanText(current);
}

function normalizeFormInputs(payload: RenderPayload | null): Bm005Form {
  const signerName =
    nested(payload, "signature.signerName") ||
    nested(payload, "receiver.signerName") ||
    nested(payload, "receiver.fullName") ||
    DEFAULT_SIGNER_NAME;

  const issuePlace =
    nested(payload, "document.issuePlace") ||
    EMPTY_FORM.document.issuePlace;

  const issueDateText = normalizeDisplayDate(
    nested(payload, "document.issueDateText") ||
      nested(payload, "document.issueDate") ||
      EMPTY_FORM.document.issueDateText,
  );

  return {
    agency: {
      parentName:
        nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
      bodyName:
        nested(payload, "agency.bodyName") || EMPTY_FORM.agency.bodyName,
      shortName:
        nested(payload, "agency.shortName") || EMPTY_FORM.agency.shortName,
    },

    document: {
      documentCode:
        nested(payload, "document.documentCode") ||
        EMPTY_FORM.document.documentCode,
      issuePlace,
      issueDateText,
      issuePlaceAndDateLine: issuePlaceAndDateLine(issuePlace, issueDateText),
    },

    official: {
      issuerTitle:
        nested(payload, "official.issuerTitle") ||
        EMPTY_FORM.official.issuerTitle,
    },

    sourceVerification: {
      requestRoundText:
        nested(payload, "sourceVerification.requestRoundText") ||
        EMPTY_FORM.sourceVerification.requestRoundText,

      procedureArticlesLine:
        nested(payload, "sourceVerification.procedureArticlesLine") ||
        EMPTY_FORM.sourceVerification.procedureArticlesLine,

      reasonLine:
        nested(payload, "sourceVerification.reasonLine") ||
        EMPTY_FORM.sourceVerification.reasonLine,

      requestedAuthorityLine:
        nested(payload, "sourceVerification.requestedAuthorityLine") ||
        EMPTY_FORM.sourceVerification.requestedAuthorityLine,

      issue1Line:
        nested(payload, "sourceVerification.issue1Line") ||
        EMPTY_FORM.sourceVerification.issue1Line,

      issue2Line:
        nested(payload, "sourceVerification.issue2Line") ||
        EMPTY_FORM.sourceVerification.issue2Line,

      issue3Line:
        nested(payload, "sourceVerification.issue3Line") ||
        EMPTY_FORM.sourceVerification.issue3Line,

      additionalIssuesLine:
        nested(payload, "sourceVerification.additionalIssuesLine") ||
        EMPTY_FORM.sourceVerification.additionalIssuesLine,

      resultSubmissionLine:
        nested(payload, "sourceVerification.resultSubmissionLine") ||
        EMPTY_FORM.sourceVerification.resultSubmissionLine,
    },

    recipients: {
      investigatingAgencyLine:
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.recipients.investigatingAgencyLine,

      archiveLine:
        nested(payload, "recipients.archiveLine") ||
        EMPTY_FORM.recipients.archiveLine,
    },

    signature: {
      signerName,
    },

    receiver: {
      fullName: signerName,
      signerName,
    },

    updatedByName: signerName,
  };
}

function fillCustomerSample(): Bm005Form {
  return {
    agency: {
      ...EMPTY_FORM.agency,
    },
    document: {
      ...EMPTY_FORM.document,
      issueDateText: getBm005TodayDisplayDate(),
      issuePlaceAndDateLine: issuePlaceAndDateLine(
        EMPTY_FORM.document.issuePlace,
        getBm005TodayDisplayDate(),
      ),
    },
    official: {
      ...EMPTY_FORM.official,
    },
    sourceVerification: {
      ...EMPTY_FORM.sourceVerification,
    },
    recipients: {
      ...EMPTY_FORM.recipients,
    },
    signature: {
      signerName: DEFAULT_SIGNER_NAME,
    },
    receiver: {
      fullName: DEFAULT_SIGNER_NAME,
      signerName: DEFAULT_SIGNER_NAME,
    },
    updatedByName: DEFAULT_SIGNER_NAME,
  };
}

function validateForm(form: Bm005Form): string[] {
  const errors: string[] = [];

  for (const item of REQUIRED_FIELDS) {
    if (item.path === "signature.signerName") {
      if (!form.signature.signerName.trim()) errors.push(item.label);
      continue;
    }

    if (item.path === "recipients.investigatingAgencyLine") {
      if (!form.recipients.investigatingAgencyLine.trim()) {
        errors.push(item.label);
      }
      continue;
    }

    if (item.path === "recipients.archiveLine") {
      if (!form.recipients.archiveLine.trim()) errors.push(item.label);
      continue;
    }

    if (!form.sourceVerification[item.path].trim()) {
      errors.push(item.label);
    }
  }

  return errors;
}

function buildSaveBody(form: Bm005Form) {
  const signerName = form.signature.signerName.trim() || DEFAULT_SIGNER_NAME;
  const updatedByName = form.updatedByName.trim() || signerName;

  const issueDateText = normalizeDisplayDate(form.document.issueDateText);

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
    bodyName: form.agency.bodyName,
    shortName: form.agency.shortName,
  };

  const document = {
    documentCode: form.document.documentCode,
    issuePlace: form.document.issuePlace,
    issueDateText,
    issuePlaceAndDateLine: issuePlaceAndDateLine(form.document.issuePlace, issueDateText),
  };

  const official = {
    issuerTitle: form.official.issuerTitle,
  };

  const sourceVerification = {
    requestRoundText: form.sourceVerification.requestRoundText,
    procedureArticlesLine: form.sourceVerification.procedureArticlesLine,
    reasonLine: form.sourceVerification.reasonLine,
    requestedAuthorityLine: form.sourceVerification.requestedAuthorityLine,
    issue1Line: form.sourceVerification.issue1Line,
    issue2Line: form.sourceVerification.issue2Line,
    issue3Line: form.sourceVerification.issue3Line,
    additionalIssuesLine: form.sourceVerification.additionalIssuesLine,
    resultSubmissionLine: form.sourceVerification.resultSubmissionLine,
  };

  const recipients = {
    investigatingAgencyLine: form.recipients.investigatingAgencyLine,
    archiveLine: form.recipients.archiveLine,
  };

  const signature = {
    signerName,
  };

  const receiver = {
    fullName: signerName,
    signerName,
  };

  const savedInputs = {
    agency,
    document,
    official,
    sourceVerification,
    recipients,
    signature,
    receiver,
  };

  return {
    // Quan trọng:
    // Gửi đủ 4 lớp để backend kiểu nào cũng nhận:
    // 1. root fields
    // 2. formInputs
    // 3. payloadOverrides
    // 4. renderPayloadOverrides
    ...savedInputs,
    formInputs: savedInputs,
    payloadOverrides: savedInputs,
    renderPayloadOverrides: savedInputs,
    updatedByName,
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
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      {multiline ? (
        <textarea
          className="min-h-[88px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function Bm005FormInputsPanel({
  documentId,
  onSaved,
}: Bm005FormInputsPanelProps) {
  const [form, setForm] = useState<Bm005Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patchAgency = (key: keyof AgencyForm, value: string) => {
    setForm((current) => ({
      ...current,
      agency: {
        ...current.agency,
        [key]: value,
      },
    }));
  };

  const patchDocument = (key: keyof DocumentForm, value: string) => {
    setForm((current) => {
      const document = {
        ...current.document,
        [key]: value,
      };

      return {
        ...current,
        document: {
          ...document,
          issuePlaceAndDateLine: issuePlaceAndDateLine(
            document.issuePlace,
            document.issueDateText,
          ),
        },
      };
    });
  };

  const patchOfficial = (key: keyof OfficialForm, value: string) => {
    setForm((current) => ({
      ...current,
      official: {
        ...current.official,
        [key]: value,
      },
    }));
  };

  const patchSourceVerification = (
    key: keyof SourceVerificationForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      sourceVerification: {
        ...current.sourceVerification,
        [key]: value,
      },
    }));
  };

  const patchRecipients = (key: keyof RecipientsForm, value: string) => {
    setForm((current) => ({
      ...current,
      recipients: {
        ...current.recipients,
        [key]: value,
      },
    }));
  };

  const patchSignerName = (value: string) => {
    setForm((current) => ({
      ...current,
      signature: {
        ...current.signature,
        signerName: value,
      },
      receiver: {
        ...current.receiver,
        fullName: value,
        signerName: value,
      },
      updatedByName: value.trim() ? value : current.updatedByName,
    }));
  };

  const reloadFromBackend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không tải được render-payload. HTTP ${response.status}`,
        );
      }

      const payload = (await response.json()) as RenderPayload;
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải lại dữ liệu BM-005 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm(fillCustomerSample());
    setMessage("Đã điền dữ liệu mẫu BM-005.");
    setError(null);
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
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(buildSaveBody(form)),
        },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không lưu được dữ liệu biểu mẫu. HTTP ${response.status}`,
        );
      }

      const savedPayload = (await response.json()) as RenderPayload;
      setForm(normalizeFormInputs(savedPayload));

      setMessage(
        "Đã lưu dữ liệu BM-005. Dữ liệu vừa nhập đã được đồng bộ lại từ backend.",
      );

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
            BM-005
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Dữ liệu biểu mẫu Yêu cầu kiểm tra, xác minh nguồn tin về tội phạm
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Khách sửa ô nào thì ô đó phải lưu vào formInputs và render ra đúng
            dữ liệu vừa nhập. Không giữ default nếu khách đã sửa.
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

      <SectionCard
        title="1. Cơ quan / văn bản"
        description="Nhóm header dùng để render phần đầu BM-005: cơ quan, số văn bản, địa danh, ngày ban hành."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Cơ quan cấp trên"
            required
            value={form.agency.parentName}
            onChange={(value) => patchAgency("parentName", value)}
          />

          <Field
            label="Viện kiểm sát ban hành"
            required
            value={form.agency.name}
            onChange={(value) => patchAgency("name", value)}
          />

          <Field
            label="Tên cơ quan trong thân văn bản"
            required
            value={form.agency.bodyName}
            onChange={(value) => patchAgency("bodyName", value)}
          />

          <Field
            label="Tên viết tắt"
            required
            value={form.agency.shortName}
            onChange={(value) => patchAgency("shortName", value)}
          />

          <Field
            label="Số văn bản"
            required
            value={form.document.documentCode}
            onChange={(value) => patchDocument("documentCode", value)}
          />

          <Field
            label="Địa danh"
            required
            value={form.document.issuePlace}
            onChange={(value) => patchDocument("issuePlace", value)}
          />

          <Field
            label="Ngày ban hành"
            required
            value={form.document.issueDateText}
            onChange={(value) => patchDocument("issueDateText", value)}
            placeholder="DD/MM/YYYY"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            {issuePlaceAndDateLine(form.document.issuePlace, form.document.issueDateText)}
          </div>

          <Field
            label="Chủ thể ban hành"
            required
            value={form.official.issuerTitle}
            onChange={(value) => patchOfficial("issuerTitle", value)}
          />
        </div>
      </SectionCard>
      <SectionCard
        title="2. Nội dung yêu cầu kiểm tra, xác minh"
        description="Các dòng này render trực tiếp vào phần thân BM-005."
      >
        <Field
          label="Lần yêu cầu"
          value={form.sourceVerification.requestRoundText}
          onChange={(value) =>
            patchSourceVerification("requestRoundText", value)
          }
          placeholder="(Lần thứ nhất)"
        />

        <Field
          label="Căn cứ tố tụng"
          required
          multiline
          value={form.sourceVerification.procedureArticlesLine}
          onChange={(value) =>
            patchSourceVerification("procedureArticlesLine", value)
          }
        />

        <Field
          label="Nhận định cần kiểm tra, xác minh"
          required
          multiline
          value={form.sourceVerification.reasonLine}
          onChange={(value) => patchSourceVerification("reasonLine", value)}
        />

        <Field
          label="Cơ quan/người có thẩm quyền được yêu cầu"
          required
          multiline
          value={form.sourceVerification.requestedAuthorityLine}
          onChange={(value) =>
            patchSourceVerification("requestedAuthorityLine", value)
          }
        />

        <Field
          label="Vấn đề a)"
          required
          multiline
          value={form.sourceVerification.issue1Line}
          onChange={(value) => patchSourceVerification("issue1Line", value)}
        />

        <Field
          label="Vấn đề b)"
          multiline
          value={form.sourceVerification.issue2Line}
          onChange={(value) => patchSourceVerification("issue2Line", value)}
        />

        <Field
          label="Vấn đề c)"
          multiline
          value={form.sourceVerification.issue3Line}
          onChange={(value) => patchSourceVerification("issue3Line", value)}
        />

        <Field
          label="Vấn đề bổ sung"
          multiline
          value={form.sourceVerification.additionalIssuesLine}
          onChange={(value) =>
            patchSourceVerification("additionalIssuesLine", value)
          }
        />

        <Field
          label="Yêu cầu gửi kết quả"
          required
          multiline
          value={form.sourceVerification.resultSubmissionLine}
          onChange={(value) =>
            patchSourceVerification("resultSubmissionLine", value)
          }
        />
      </SectionCard>

      <SectionCard title="3. Nơi nhận">
        <Field
          label="Cơ quan điều tra"
          required
          value={form.recipients.investigatingAgencyLine}
          onChange={(value) =>
            patchRecipients("investigatingAgencyLine", value)
          }
        />

        <Field
          label="Lưu hồ sơ"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => patchRecipients("archiveLine", value)}
        />
      </SectionCard>

      <SectionCard
        title="4. Chữ ký"
        description="BM-005 giữ chức danh KIỂM SÁT VIÊN trong template, chỉ nhập tên người ký."
      >
        <Field
          label="Kiểm sát viên ký"
          required
          value={form.signature.signerName}
          onChange={patchSignerName}
          placeholder={DEFAULT_SIGNER_NAME}
        />

        <Field
          label="Người cập nhật"
          value={form.updatedByName}
          onChange={(value) =>
            setForm((current) => ({ ...current, updatedByName: value }))
          }
        />
      </SectionCard>
    </div>
  );
}


