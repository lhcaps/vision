"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type JsonObject = Record<string, unknown>;
type TextGroup = Record<string, string>;

type Bm144FormState = {
  agency: TextGroup;
  document: TextGroup;
  official: TextGroup;
  prosecutionExtension: TextGroup;
  recipients: TextGroup;
  signature: TextGroup;
};

type SectionKey = keyof Bm144FormState;

type Bm144FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm144FormState = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
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
  prosecutionExtension: {
    procedureArticlesLine: "",
    juvenileJusticeLine: "",
    caseDecisionLegalBasisLine: "",
    accusedDecisionLegalBasisLine: "",
    investigationConclusionLegalBasisLine: "",
    reasonLine: "",
    durationDaysText: "",
    fromDateText: "",
    toDateText: "",
    article1Line: "",
  },
  recipients: {
    investigatingAgencyLine: "",
    accusedLine: "",
    archiveLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
};

const REQUIRED_FIELDS = [
  "agency.name",
  "document.documentCode",
  "official.issuerTitle",
  "prosecutionExtension.procedureArticlesLine",
  "prosecutionExtension.caseDecisionLegalBasisLine",
  "prosecutionExtension.accusedDecisionLegalBasisLine",
  "prosecutionExtension.investigationConclusionLegalBasisLine",
  "prosecutionExtension.reasonLine",
  "prosecutionExtension.durationDaysText",
  "prosecutionExtension.fromDateText",
  "prosecutionExtension.article1Line",
  "recipients.archiveLine",
  "signature.positionTitle",
  "signature.signerName",
];

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function pick(source: JsonObject, key: string): string {
  return asText(source[key]);
}

function toDateInput(value: unknown): string {
  const text = asText(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return text;

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];

  return year + "-" + month + "-" + day;
}

function normalizeFormInputs(payload: JsonObject): Bm144FormState {
  const agency = asObject(payload.agency);
  const document = asObject(payload.document);
  const official = asObject(payload.official);
  const prosecutionExtension = asObject(payload.prosecutionExtension);
  const recipients = asObject(payload.recipients);
  const signature = asObject(payload.signature);

  return {
    agency: {
      parentName: pick(agency, "parentName"),
      name: pick(agency, "name"),
      shortName: pick(agency, "shortName"),
      issuePlace: pick(agency, "issuePlace"),
    },
    document: {
      documentCode: pick(document, "documentCode"),
      issueDate: toDateInput(document.issueDate),
      issuePlaceAndDateLine: pick(document, "issuePlaceAndDateLine"),
    },
    official: {
      issuerTitle: pick(official, "issuerTitle"),
    },
    prosecutionExtension: {
      procedureArticlesLine: pick(prosecutionExtension, "procedureArticlesLine"),
      juvenileJusticeLine: pick(prosecutionExtension, "juvenileJusticeLine"),
      caseDecisionLegalBasisLine: pick(
        prosecutionExtension,
        "caseDecisionLegalBasisLine",
      ),
      accusedDecisionLegalBasisLine: pick(
        prosecutionExtension,
        "accusedDecisionLegalBasisLine",
      ),
      investigationConclusionLegalBasisLine: pick(
        prosecutionExtension,
        "investigationConclusionLegalBasisLine",
      ),
      reasonLine: pick(prosecutionExtension, "reasonLine"),
      durationDaysText: pick(prosecutionExtension, "durationDaysText"),
      fromDateText: pick(prosecutionExtension, "fromDateText"),
      toDateText: pick(prosecutionExtension, "toDateText"),
      article1Line: pick(prosecutionExtension, "article1Line"),
    },
    recipients: {
      investigatingAgencyLine: pick(recipients, "investigatingAgencyLine"),
      accusedLine: pick(recipients, "accusedLine"),
      archiveLine: pick(recipients, "archiveLine"),
    },
    signature: {
      signMode: pick(signature, "signMode"),
      positionTitle: pick(signature, "positionTitle"),
      signerName: pick(signature, "signerName"),
    },
  };
}

function getNestedValue(form: Bm144FormState, path: string): string {
  const [section, field] = path.split(".") as [SectionKey, string];
  return form[section]?.[field] ?? "";
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  multiline,
  rows = 3,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "date";
  multiline?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={"block space-y-1.5 " + className}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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

// BM-144_ISSUE_DATE_ARTICLE1_FIX_START
function normalizeBm144Text(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+([,.;:])/gu, '$1')
    .replace(/\s{2,}/gu, ' ')
    .trim();
}

function stripLeadingNgay(value: string): string {
  return normalizeBm144Text(value).replace(/^ngày\s+/iu, '');
}

function formatBm144VietnameseDate(value: unknown): string {
  const raw = normalizeBm144Text(value);
  if (!raw) return '';

  const alreadyVietnamese = raw.match(/(?:ngày\s+)?(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (alreadyVietnamese) {
    return `${Number(alreadyVietnamese[1])} tháng ${Number(alreadyVietnamese[2])} năm ${alreadyVietnamese[3]}`;
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/u);
  if (iso) {
    return `${Number(iso[3])} tháng ${Number(iso[2])} năm ${iso[1]}`;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    const year = slash[3];

    if (first > 12) {
      return `${first} tháng ${second} năm ${year}`;
    }

    return `${second} tháng ${first} năm ${year}`;
  }

  return stripLeadingNgay(raw);
}

function extractBm144IssuePlaceFromLine(value: unknown): string {
  const line = normalizeBm144Text(value);
  const commaIndex = line.indexOf(',');
  if (commaIndex <= 0) return '';
  return normalizeBm144Text(line.slice(0, commaIndex));
}

function extractBm144DateFromLine(value: unknown): string {
  const line = normalizeBm144Text(value);
  const match = line.match(/ngày\s+(.+)$/iu);
  return match ? stripLeadingNgay(match[1]) : '';
}

function buildBm144IssuePlaceAndDateLine(form: Bm144FormState): string {
  const currentLine = normalizeBm144Text(form.document.issuePlaceAndDateLine);
  const issuePlace =
    normalizeBm144Text(form.document.issuePlace) ||
    extractBm144IssuePlaceFromLine(currentLine) ||
    'TP. Hồ Chí Minh';

  const dateText =
    formatBm144VietnameseDate(form.document.issueDate) ||
    extractBm144DateFromLine(currentLine);

  if (!dateText) {
    return currentLine;
  }

  return `${issuePlace}, ngày ${dateText}`;
}

function ensureBm144SlashDot(value: string): string {
  const cleaned = normalizeBm144Text(value).replace(/[.\s/]*$/gu, '');
  if (!cleaned) return '';
  return `${cleaned}/.`;
}

function buildBm144Article1Line(form: Bm144FormState): string {
  const extension = form.prosecutionExtension;
  const currentArticle1 = normalizeBm144Text(extension.article1Line);
  const durationDaysText = normalizeBm144Text(extension.durationDaysText) || '15 ngày';
  const fromDateText = stripLeadingNgay(formatBm144VietnameseDate(extension.fromDateText)) || stripLeadingNgay(normalizeBm144Text(extension.fromDateText)) || '21 tháng 5 năm 2026';
  const toDateText = stripLeadingNgay(formatBm144VietnameseDate(extension.toDateText)) || stripLeadingNgay(normalizeBm144Text(extension.toDateText));

  const datePart = toDateText
    ? `kể từ ngày ${fromDateText} đến ngày ${toDateText}`
    : `kể từ ngày ${fromDateText}`;

  if (
    !currentArticle1 ||
    /Gia\s+hạn\s+thời\s+hạn\s+quyết\s+định\s+việc\s+truy\s+tố/iu.test(currentArticle1)
  ) {
    return ensureBm144SlashDot(
      `Gia hạn thời hạn quyết định việc truy tố trong thời hạn ${durationDaysText}, ${datePart}.`,
    );
  }

  return ensureBm144SlashDot(currentArticle1);
}

function buildBm144RenderReadyForm(form: Bm144FormState): Bm144FormState {
  return {
    ...form,
    document: {
      ...form.document,
      issuePlaceAndDateLine: buildBm144IssuePlaceAndDateLine(form),
    },
    prosecutionExtension: {
      ...form.prosecutionExtension,
      article1Line: buildBm144Article1Line(form),
    },
    signature: {
      ...form.signature,
      signMode: form.signature.signMode || "KT. VIỆN TRƯỞNG",
      positionTitle: form.signature.positionTitle || "PHÓ VIỆN TRƯỞNG",
      signerName: form.signature.signerName || "",
    },
  };
}

function getBm144ApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3001/api/v1"
  );
}

async function postBm144Json(
  url: string,
  body: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Không gọi được API BM-144.");
  }
}

async function forceRenderBm144Files(documentId: string | number): Promise<void> {
  const apiBase = getBm144ApiBaseUrl();

  await postBm144Json(
    apiBase + "/documents/generated/" + documentId + "/render-docx",
    {
      force: true,
      renderedByName: "",
    },
  );

  await postBm144Json(
    apiBase + "/documents/generated/" + documentId + "/convert-pdf",
    {
      force: true,
      convertedByName: "",
    },
  );
}
// BM-144_ISSUE_DATE_ARTICLE1_FIX_END

export function Bm144FormInputsPanel({
  documentId,
  onSaved,
}: Bm144FormInputsPanelProps) {
  const [form, setForm] = useState<Bm144FormState>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((path) => !getNestedValue(form, path).trim());
  }, [form]);

  const canSave = missingFields.length === 0 && !isSaving && isDirty;

  async function loadPayload() {
    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        API_BASE_URL + "/documents/generated/" + documentId + "/render-payload",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          body || "Không tải được render-payload BM-144: " + response.status,
        );
      }

      const payload = (await response.json()) as JsonObject;
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-144.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayload();
     
  }, [documentId]);

  function updateField(section: SectionKey, field: string, value: string) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));

    setMessage("");
    setErrorMessage("");
  }

  function fillSample() {
    const sample: Bm144FormState = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
      },
      document: {
        documentCode: "144/QĐ-VKSKV7",
        issueDate: "2026-05-17",
        issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 17 tháng 5 năm 2026",
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      prosecutionExtension: {
        procedureArticlesLine:
          "Căn cứ các điều 41, 236 và 240 của Bộ luật Tố tụng hình sự;",
        juvenileJusticeLine: "",
        caseDecisionLegalBasisLine:
          "Căn cứ Quyết định khởi tố vụ án hình sự số  ngày 06 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự;",
        accusedDecisionLegalBasisLine:
          "Căn cứ Quyết định khởi tố bị can số  ngày 06 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với  về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự;",
        investigationConclusionLegalBasisLine:
          "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        reasonLine:
          "Xét thấy cần gia hạn thời hạn quyết định việc truy tố để nghiên cứu, đánh giá đầy đủ hồ sơ vụ án,",
        durationDaysText: "15 ngày",
        fromDateText: "ngày 17 tháng 5 năm 2026",
        toDateText: "",
        article1Line:
          "Gia hạn thời hạn quyết định việc truy tố trong thời hạn 15 ngày, kể từ ngày 17 tháng 5 năm 2026./.",
      },
      recipients: {
        investigatingAgencyLine:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        accusedLine: "- ;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
    };

    setForm(sample);
    setMessage("Đã điền dữ liệu mẫu BM-144.");
    setErrorMessage("");
  }

  async function handleSave() {
    const renderReadyForm = buildBm144RenderReadyForm(form);

setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        API_BASE_URL + "/documents/generated/" + documentId + "/form-inputs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            ...renderReadyForm,
            formInputs: renderReadyForm,
            payloadOverrides: renderReadyForm,
            renderPayloadOverrides: renderReadyForm,
            updatedByName: "",
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          body || "Không lưu được dữ liệu BM-144: " + response.status,
        );
      }

      setInitialSnapshot(JSON.stringify(form));
      setMessage(
        "Đã lưu dữ liệu BM-144. Có thể render lại DOCX/PDF từ tab File đã xuất.",
      );

      await forceRenderBm144Files(documentId);
      setForm(renderReadyForm);
onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu BM-144.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Đang tải dữ liệu biểu mẫu BM-144...
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-950">
              Dữ liệu biểu mẫu BM-144
            </h2>
            <p className="mt-1 text-sm text-blue-800">
              Quyết định gia hạn thời hạn quyết định việc truy tố.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              onClick={fillSample}
            >
              Điền dữ liệu mẫu BM-144
            </button>

            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => void loadPayload()}
            >
              Tải lại từ backend
            </button>

            <button
              type="button"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!canSave}
              onClick={() => void handleSave()}
            >
              {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-144"}
            </button>
          </div>
        </div>

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Còn thiếu {missingFields.length} trường bắt buộc. Hãy điền đủ trước
            khi lưu.
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <SectionCard
        title="1. Thông tin văn bản / cơ quan"
        description="Các trường này ảnh hưởng phần đầu quyết định."
      >
        <Field
          label="Số quyết định"
          required
          value={form.document.documentCode}
          onChange={(value) => updateField("document", "documentCode", value)}
        />
        <Field
          label="Ngày ban hành"
          type="date"
          value={form.document.issueDate}
          onChange={(value) => updateField("document", "issueDate", value)}
        />
        <Field
          label="Cơ quan cấp trên"
          value={form.agency.parentName}
          onChange={(value) => updateField("agency", "parentName", value)}
        />
        <Field
          label="Viện kiểm sát ban hành"
          required
          value={form.agency.name}
          onChange={(value) => updateField("agency", "name", value)}
        />
        <Field
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value)}
        />
        <Field
          label="Chủ thể ban hành"
          required
          value={form.official.issuerTitle}
          onChange={(value) => updateField("official", "issuerTitle", value)}
        />
        <Field
          label="Dòng ngày tháng đã format"
          value={form.document.issuePlaceAndDateLine}
          onChange={(value) =>
            updateField("document", "issuePlaceAndDateLine", value)
          }
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="2. Căn cứ pháp lý">
        <Field
          label="Điều luật tố tụng"
          required
          value={form.prosecutionExtension.procedureArticlesLine}
          onChange={(value) =>
            updateField("prosecutionExtension", "procedureArticlesLine", value)
          }
          className="md:col-span-2"
        />
        <Field
          label="Luật tư pháp người chưa thành niên nếu có"
          value={form.prosecutionExtension.juvenileJusticeLine}
          onChange={(value) =>
            updateField("prosecutionExtension", "juvenileJusticeLine", value)
          }
          placeholder="Để trống nếu không áp dụng"
          className="md:col-span-2"
        />
        <Field
          label="Căn cứ quyết định khởi tố vụ án"
          required
          multiline
          rows={4}
          value={form.prosecutionExtension.caseDecisionLegalBasisLine}
          onChange={(value) =>
            updateField(
              "prosecutionExtension",
              "caseDecisionLegalBasisLine",
              value,
            )
          }
          className="md:col-span-2"
        />
        <Field
          label="Căn cứ quyết định khởi tố bị can"
          required
          multiline
          rows={4}
          value={form.prosecutionExtension.accusedDecisionLegalBasisLine}
          onChange={(value) =>
            updateField(
              "prosecutionExtension",
              "accusedDecisionLegalBasisLine",
              value,
            )
          }
          className="md:col-span-2"
        />
        <Field
          label="Căn cứ bản kết luận điều tra"
          required
          multiline
          rows={3}
          value={
            form.prosecutionExtension.investigationConclusionLegalBasisLine
          }
          onChange={(value) =>
            updateField(
              "prosecutionExtension",
              "investigationConclusionLegalBasisLine",
              value,
            )
          }
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="3. Nội dung gia hạn">
        <Field
          label="Lý do gia hạn"
          required
          multiline
          rows={3}
          value={form.prosecutionExtension.reasonLine}
          onChange={(value) =>
            updateField("prosecutionExtension", "reasonLine", value)
          }
          className="md:col-span-2"
        />
        <Field
          label="Thời hạn gia hạn"
          required
          value={form.prosecutionExtension.durationDaysText}
          onChange={(value) =>
            updateField("prosecutionExtension", "durationDaysText", value)
          }
          placeholder="VD: 15 ngày"
        />
        <Field
          label="Từ ngày"
          required
          value={form.prosecutionExtension.fromDateText}
          onChange={(value) =>
            updateField("prosecutionExtension", "fromDateText", value)
          }
          placeholder="ngày 17 tháng 5 năm 2026"
        />
        <Field
          label="Đến ngày nếu có"
          value={form.prosecutionExtension.toDateText}
          onChange={(value) =>
            updateField("prosecutionExtension", "toDateText", value)
          }
          placeholder="Để trống nếu không cần hiển thị"
        />
        <Field
          label="Điều 1 - Nội dung quyết định"
          required
          multiline
          rows={3}
          value={form.prosecutionExtension.article1Line}
          onChange={(value) =>
            updateField("prosecutionExtension", "article1Line", value)
          }
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="4. Nơi nhận">
        <Field
          label="Cơ quan điều tra"
          value={form.recipients.investigatingAgencyLine}
          onChange={(value) =>
            updateField("recipients", "investigatingAgencyLine", value)
          }
          className="md:col-span-2"
        />
        <Field
          label="Bị can / người liên quan"
          value={form.recipients.accusedLine}
          onChange={(value) => updateField("recipients", "accusedLine", value)}
        />
        <Field
          label="Dòng lưu"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
        />
      </SectionCard>

      <SectionCard title="5. Chữ ký">
        <Field
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
        />
        <Field
          label="Chức vụ"
          required
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
        />
        <Field
          label="Người ký"
          required
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Sau khi lưu, qua tab File đã xuất để render lại DOCX/PDF cho BM-144.
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-144"}
          </button>
        </div>
      </div>
    </div>
  );
}
