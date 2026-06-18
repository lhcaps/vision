"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = '';

type JsonObject = Record<string, unknown>;

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

type SourceRequestForm = {
  reasonLine: string;
  receiverName: string;
  actionLine: string;
  caseSummary: string;
  actionResultLine: string;
};

type RecipientsForm = {
  primaryLine: string;
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm006Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  sourceRequest: SourceRequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm006FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const textareaClass =
  "min-h-[92px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const labelClass = "text-xs font-bold text-slate-600";

function getBm006TodayDisplayDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}/${month}/${year}`;
}

function parseBm006DisplayDateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = String(value ?? "").trim();

  const display = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (display) {
    return {
      day: display[1].padStart(2, "0"),
      month: display[2].padStart(2, "0"),
      year: display[3],
    };
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return {
      day: iso[3].padStart(2, "0"),
      month: iso[2].padStart(2, "0"),
      year: iso[1],
    };
  }

  return { day: "", month: "", year: "" };
}

function buildBm006DisplayDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function Bm006DateSelectField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseBm006DisplayDateParts(value || getBm006TodayDisplayDate());

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
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
    const next = { ...parsed, ...patch };

    if (next.day && next.month && next.year) {
      onChange(buildBm006DisplayDate(next.day, next.month, next.year));
    }
  };

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
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
  );
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function readPath(root: unknown, path: string): { found: boolean; value: unknown } {
  const parts = path.split(".").filter(Boolean);
  let current: unknown = root;

  for (const part of parts) {
    const obj = asRecord(current);

    if (!Object.prototype.hasOwnProperty.call(obj, part)) {
      return { found: false, value: undefined };
    }

    current = obj[part];
  }

  return { found: true, value: current };
}

function firstExistingRecord(payload: unknown, paths: string[]): JsonObject {
  for (const path of paths) {
    const result = readPath(payload, path);

    if (result.found) {
      const obj = asRecord(result.value);
      if (Object.keys(obj).length > 0) return obj;
    }
  }

  return {};
}

function pickString(
  formInputs: unknown,
  payload: unknown,
  path: string,
  fallback = "",
): string {
  const saved = readPath(formInputs, path);
  if (saved.found) return cleanText(saved.value);

  const root = readPath(payload, path);
  if (root.found) return cleanText(root.value);

  return fallback;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeDisplayDate(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "";

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (iso) return `${pad2(Number(iso[3]))}/${pad2(Number(iso[2]))}/${iso[1]}`;

  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (vn) return `${pad2(Number(vn[1]))}/${pad2(Number(vn[2]))}/${vn[3]}`;

  return raw;
}

function displayDateToIso(value: string): string {
  const raw = normalizeDisplayDate(value);
  const vn = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);

  if (!vn) return "";

  return `${vn[3]}-${vn[2]}-${vn[1]}`;
}

function issuePlaceAndDateLine(issuePlace: string, issueDateText: string): string {
  const normalizedDate = normalizeDisplayDate(issueDateText);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalizedDate);

  if (!match) {
    return `${cleanText(issuePlace)}, ngày ... tháng ... năm ...`;
  }

  return `${cleanText(issuePlace)}, ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
}

function stripRecipientLine(value: string): string {
  return cleanText(value)
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function ensureNoEndingDot(value: string): string {
  return cleanText(value).replace(/[,.]\s*$/u, "").trim();
}

const EMPTY_FORM: Bm006Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "06/YC-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: getBm006TodayDisplayDate(),
    issuePlaceAndDateLine: issuePlaceAndDateLine(
      "TP. Hồ Chí Minh",
      getBm006TodayDisplayDate(),
    ),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG",
  },
  sourceRequest: {
    reasonLine:
      "thấy việc tiếp nhận, kiểm tra, xác minh và ra quyết định giải quyết nguồn tin về tội phạm của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với vụ việc có dấu hiệu tội phạm chưa đầy đủ, kịp thời",
    receiverName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    actionLine:
      "tiếp nhận, kiểm tra, xác minh và ra quyết định giải quyết nguồn tin về tội phạm",
    caseSummary: "có dấu hiệu tội phạm xảy ra trên địa bàn Thành phố Hồ Chí Minh",
    actionResultLine:
      "tiếp nhận, kiểm tra, xác minh và ra quyết định giải quyết nguồn tin về tội phạm",
  },
  recipients: {
    primaryLine: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    archiveLine: "Lưu: HSVV, HSKS, VP",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
  updatedByName: DEFAULT_SIGNER_NAME,
  renderedByName: DEFAULT_SIGNER_NAME,
  convertedByName: DEFAULT_SIGNER_NAME,
};

function normalizeFormInputs(form: Bm006Form): Bm006Form & {
  document: DocumentForm & { issueDate: string };
} {
  const issueDateText =
    normalizeDisplayDate(form.document.issueDateText) || getBm006TodayDisplayDate();

  return {
    ...form,
    agency: {
      parentName: cleanText(form.agency.parentName),
      name: cleanText(form.agency.name),
      bodyName: cleanText(form.agency.bodyName),
      shortName: cleanText(form.agency.shortName),
    },
    document: {
      documentCode: cleanText(form.document.documentCode),
      issuePlace: cleanText(form.document.issuePlace),
      issueDateText,
      issueDate: displayDateToIso(issueDateText),
      issuePlaceAndDateLine: issuePlaceAndDateLine(
        form.document.issuePlace,
        issueDateText,
      ),
    },
    official: {
      issuerTitle: cleanText(form.official.issuerTitle),
    },
    sourceRequest: {
      reasonLine: ensureNoEndingDot(form.sourceRequest.reasonLine),
      receiverName: ensureNoEndingDot(form.sourceRequest.receiverName),
      actionLine: ensureNoEndingDot(form.sourceRequest.actionLine),
      caseSummary: ensureNoEndingDot(form.sourceRequest.caseSummary),
      actionResultLine: ensureNoEndingDot(form.sourceRequest.actionResultLine),
    },
    recipients: {
      primaryLine: stripRecipientLine(form.recipients.primaryLine),
      archiveLine: stripRecipientLine(form.recipients.archiveLine),
    },
    signature: {
      signMode: cleanText(form.signature.signMode),
      positionTitle: cleanText(form.signature.positionTitle),
      signerName: cleanText(form.signature.signerName),
    },
    updatedByName: cleanText(form.updatedByName) || DEFAULT_SIGNER_NAME,
    renderedByName: cleanText(form.renderedByName) || DEFAULT_SIGNER_NAME,
    convertedByName: cleanText(form.convertedByName) || DEFAULT_SIGNER_NAME,
  };
}

function buildFormFromPayload(payload: unknown): Bm006Form {
  const formInputs = firstExistingRecord(payload, [
    "formInputs",
    "renderPayloadSnapshot.formInputs",
    "metadata.formInputs",
  ]);

  const hasSavedFormInputs = Object.keys(formInputs).length > 0;

  const issuePlace = pickString(
    formInputs,
    payload,
    "document.issuePlace",
    EMPTY_FORM.document.issuePlace,
  );

  const savedIssueDate = hasSavedFormInputs
    ? pickString(
        formInputs,
        payload,
        "document.issueDateText",
        pickString(formInputs, payload, "document.issueDate", ""),
      )
    : "";

  const issueDateText =
    normalizeDisplayDate(savedIssueDate) || getBm006TodayDisplayDate();

  return normalizeFormInputs({
    agency: {
      parentName: pickString(
        formInputs,
        payload,
        "agency.parentName",
        EMPTY_FORM.agency.parentName,
      ),
      name: pickString(formInputs, payload, "agency.name", EMPTY_FORM.agency.name),
      bodyName: pickString(
        formInputs,
        payload,
        "agency.bodyName",
        EMPTY_FORM.agency.bodyName,
      ),
      shortName: pickString(
        formInputs,
        payload,
        "agency.shortName",
        EMPTY_FORM.agency.shortName,
      ),
    },
    document: {
      documentCode: pickString(
        formInputs,
        payload,
        "document.documentCode",
        EMPTY_FORM.document.documentCode,
      ),
      issuePlace,
      issueDateText,
      issuePlaceAndDateLine: issuePlaceAndDateLine(issuePlace, issueDateText),
    },
    official: {
      issuerTitle: pickString(
        formInputs,
        payload,
        "official.issuerTitle",
        EMPTY_FORM.official.issuerTitle,
      ),
    },
    sourceRequest: {
      reasonLine: pickString(
        formInputs,
        payload,
        "sourceRequest.reasonLine",
        EMPTY_FORM.sourceRequest.reasonLine,
      ),
      receiverName: pickString(
        formInputs,
        payload,
        "sourceRequest.receiverName",
        EMPTY_FORM.sourceRequest.receiverName,
      ),
      actionLine: pickString(
        formInputs,
        payload,
        "sourceRequest.actionLine",
        EMPTY_FORM.sourceRequest.actionLine,
      ),
      caseSummary: pickString(
        formInputs,
        payload,
        "sourceRequest.caseSummary",
        EMPTY_FORM.sourceRequest.caseSummary,
      ),
      actionResultLine: pickString(
        formInputs,
        payload,
        "sourceRequest.actionResultLine",
        EMPTY_FORM.sourceRequest.actionResultLine,
      ),
    },
    recipients: {
      primaryLine: pickString(
        formInputs,
        payload,
        "recipients.primaryLine",
        EMPTY_FORM.recipients.primaryLine,
      ),
      archiveLine: pickString(
        formInputs,
        payload,
        "recipients.archiveLine",
        EMPTY_FORM.recipients.archiveLine,
      ),
    },
    signature: {
      signMode: pickString(
        formInputs,
        payload,
        "signature.signMode",
        EMPTY_FORM.signature.signMode,
      ),
      positionTitle: pickString(
        formInputs,
        payload,
        "signature.positionTitle",
        EMPTY_FORM.signature.positionTitle,
      ),
      signerName: pickString(
        formInputs,
        payload,
        "signature.signerName",
        DEFAULT_SIGNER_NAME,
      ),
    },
    updatedByName: pickString(
      formInputs,
      payload,
      "updatedByName",
      DEFAULT_SIGNER_NAME,
    ),
    renderedByName: pickString(
      formInputs,
      payload,
      "renderedByName",
      DEFAULT_SIGNER_NAME,
    ),
    convertedByName: pickString(
      formInputs,
      payload,
      "convertedByName",
      DEFAULT_SIGNER_NAME,
    ),
  });
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
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <textarea
        className={textareaClass}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function StatusMessage({
  type,
  message,
}: {
  type: "success" | "error" | "info";
  message: string;
}) {
  if (!message) return null;

  const className =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${className}`}>
      {message}
    </div>
  );
}

export function Bm006FormInputsPanel({
  documentId,
  onSaved,
}: Bm006FormInputsPanelProps) {
  const [form, setForm] = useState<Bm006Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-006 từ backend...");

      try {
        const response = await fetch(
          `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`Không tải được render-payload BM-006. HTTP ${response.status}`);
        }

        const payload = await response.json();

        if (!cancelled) {
          setForm(buildFormFromPayload(payload));
          setStatus("success");
          setMessage("Đã tải dữ liệu BM-006.");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-006.");
        }
      }
    }

    void loadPayload();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const preview = useMemo(() => normalizeFormInputs(form), [form]);

  const printLine1 = `${preview.sourceRequest.receiverName} ${preview.sourceRequest.actionLine} đối với vụ việc ${preview.sourceRequest.caseSummary} theo quy định của pháp luật.`;
  const printLine2 = `${preview.sourceRequest.receiverName} thông báo kết quả ${preview.sourceRequest.actionResultLine} đến ${preview.agency.bodyName} theo quy định của Bộ luật Tố tụng hình sự./.`;

  function updateAgency<K extends keyof AgencyForm>(key: K, value: AgencyForm[K]) {
    setForm((current) => ({
      ...current,
      agency: { ...current.agency, [key]: value },
    }));
  }

  function updateDocument<K extends keyof DocumentForm>(key: K, value: DocumentForm[K]) {
    setForm((current) => {
      const document = { ...current.document, [key]: value };

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
  }

  function updateOfficial<K extends keyof OfficialForm>(key: K, value: OfficialForm[K]) {
    setForm((current) => ({
      ...current,
      official: { ...current.official, [key]: value },
    }));
  }

  function updateSourceRequest<K extends keyof SourceRequestForm>(
    key: K,
    value: SourceRequestForm[K],
  ) {
    setForm((current) => ({
      ...current,
      sourceRequest: { ...current.sourceRequest, [key]: value },
    }));
  }

  function updateRecipients<K extends keyof RecipientsForm>(key: K, value: RecipientsForm[K]) {
    setForm((current) => ({
      ...current,
      recipients: { ...current.recipients, [key]: value },
    }));
  }

  function updateSignature<K extends keyof SignatureForm>(key: K, value: SignatureForm[K]) {
    setForm((current) => ({
      ...current,
      signature: { ...current.signature, [key]: value },
      updatedByName: key === "signerName" ? value : current.updatedByName,
      renderedByName: key === "signerName" ? value : current.renderedByName,
      convertedByName: key === "signerName" ? value : current.convertedByName,
    }));
  }

  function fillCustomerSample() {
    const today = getBm006TodayDisplayDate();

    setForm(
      normalizeFormInputs({
        ...EMPTY_FORM,
        document: {
          ...EMPTY_FORM.document,
          issueDateText: today,
          issuePlaceAndDateLine: issuePlaceAndDateLine(
            EMPTY_FORM.document.issuePlace,
            today,
          ),
        },
      }),
    );

    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-006 theo ngày hiện tại.");
  }

  async function requestSave(method: "POST" | "PATCH", body: unknown) {
    const response = await fetch(
      `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
      {
        method,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      },
    );

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      text,
    };
  }

  async function handleSave() {
    setStatus("saving");
    setMessage("Đang lưu formInputs BM-006...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-006",
        formInputs: ready,
        payloadOverrides: ready,
        renderPayloadOverrides: ready,
        updatedByName: ready.updatedByName,
        renderedByName: ready.renderedByName,
        convertedByName: ready.convertedByName,
      };

      let result = await requestSave("POST", body);

      if (!result.ok && (result.status === 404 || result.status === 405)) {
        result = await requestSave("PATCH", body);
      }

      if (!result.ok) {
        throw new Error(result.text || `Không lưu được BM-006. HTTP ${result.status}`);
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-006. Preview bên dưới là nội dung sẽ đưa vào DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-006 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-900 bg-slate-950 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <BmFormCasePayloadButton<Bm006Form>
              templateCode="BM-006"
              form={form}
              onApply={(next) => setForm(next)}
            />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              BM-006
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">
              Yêu cầu giải quyết nguồn tin về tội phạm
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Ngày ban hành mặc định lấy theo ngày hiện tại nếu chưa có dữ liệu đã lưu.
              Body bám đúng mẫu gốc: Xét... YÊU CẦU 1 và 2.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fillCustomerSample}
              disabled={status === "saving" || status === "loading"}
              className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-800 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Điền dữ liệu mẫu
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={status === "saving" || status === "loading"}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <StatusMessage
            type={status === "error" ? "error" : status === "success" ? "success" : "info"}
            message={message}
          />
        </div>
      </section>

      <SectionCard title="1. Cơ quan / số văn bản">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Cơ quan cấp trên"
            required
            value={form.agency.parentName}
            onChange={(value) => updateAgency("parentName", value)}
          />

          <Field
            label="Viện kiểm sát"
            required
            value={form.agency.name}
            onChange={(value) => updateAgency("name", value)}
          />

          <Field
            label="Tên trong thân văn bản"
            required
            value={form.agency.bodyName}
            onChange={(value) => updateAgency("bodyName", value)}
          />

          <Field
            label="Số yêu cầu"
            required
            value={form.document.documentCode}
            onChange={(value) => updateDocument("documentCode", value)}
          />

          <Field
            label="Địa danh"
            required
            value={form.document.issuePlace}
            onChange={(value) => updateDocument("issuePlace", value)}
          />

          <div className="space-y-1.5">
            <label className={labelClass}>
              Ngày ban hành <span className="text-red-500">*</span>
            </label>

            <Bm006DateSelectField
              value={form.document.issueDateText || getBm006TodayDisplayDate()}
              onChange={(value) => updateDocument("issueDateText", value)}
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
              {issuePlaceAndDateLine(form.document.issuePlace, form.document.issueDateText)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="2. Nội dung yêu cầu"
        description="Các ô này map đúng vào placeholder sourceRequest của BM-006."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Chủ thể ban hành"
            required
            value={form.official.issuerTitle}
            onChange={(value) => updateOfficial("issuerTitle", value)}
          />

          <Field
            label="Cơ quan / người được yêu cầu"
            required
            value={form.sourceRequest.receiverName}
            onChange={(value) => updateSourceRequest("receiverName", value)}
          />
        </div>

        <div className="mt-4 grid gap-4">
          <TextAreaField
            label="Lý do xét thấy"
            required
            value={form.sourceRequest.reasonLine}
            onChange={(value) => updateSourceRequest("reasonLine", value)}
            rows={3}
          />

          <TextAreaField
            label="Hành động yêu cầu"
            required
            value={form.sourceRequest.actionLine}
            onChange={(value) => updateSourceRequest("actionLine", value)}
            rows={3}
          />

          <TextAreaField
            label="Tóm tắt vụ việc"
            required
            value={form.sourceRequest.caseSummary}
            onChange={(value) => updateSourceRequest("caseSummary", value)}
            rows={3}
          />

          <TextAreaField
            label="Kết quả cần thông báo"
            required
            value={form.sourceRequest.actionResultLine}
            onChange={(value) => updateSourceRequest("actionResultLine", value)}
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="3. Nơi nhận / ký tên">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nơi nhận chính"
            required
            value={form.recipients.primaryLine}
            onChange={(value) => updateRecipients("primaryLine", value)}
          />

          <Field
            label="Lưu hồ sơ"
            required
            value={form.recipients.archiveLine}
            onChange={(value) => updateRecipients("archiveLine", value)}
          />

          <Field
            label="Ký thay"
            required
            value={form.signature.signMode}
            onChange={(value) => updateSignature("signMode", value)}
          />

          <Field
            label="Chức danh"
            required
            value={form.signature.positionTitle}
            onChange={(value) => updateSignature("positionTitle", value)}
          />

          <Field
            label="Người ký"
            required
            value={form.signature.signerName}
            onChange={(value) => updateSignature("signerName", value)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="4. Preview nội dung trước khi in"
        description="Đây là nội dung ghép cuối cùng sẽ render ra DOCX/PDF. Nếu thấy câu không khớp, sửa lại ở phần Nội dung yêu cầu phía trên."
      >
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm leading-7 text-slate-100">
          <p className="text-center font-bold uppercase">
            YÊU CẦU
          </p>

          <p className="text-center font-semibold">
            Tiếp nhận/kiểm tra, xác minh/ra quyết định giải quyết nguồn tin về tội phạm
          </p>

          <p>
            <span className="font-bold">{preview.official.issuerTitle}</span>{" "}
            <span className="font-bold">{preview.agency.name}</span>
          </p>

          <p>Căn cứ các điều 41, 147 và 160 của Bộ luật Tố tụng hình sự;</p>

          <p>Xét {preview.sourceRequest.reasonLine},</p>

          <p className="font-bold uppercase">YÊU CẦU:</p>

          <p>
            <span className="font-bold">1.</span> {printLine1}
          </p>

          <p>
            <span className="font-bold">2.</span> {printLine2}
          </p>

          <div className="mt-4 grid gap-2 border-t border-slate-700 pt-4 md:grid-cols-2">
            <p>
              <span className="font-bold">Số:</span> {preview.document.documentCode}
            </p>
            <p>
              <span className="font-bold">Ngày:</span>{" "}
              {preview.document.issuePlaceAndDateLine}
            </p>
            <p>
              <span className="font-bold">Nơi nhận:</span>{" "}
              {preview.recipients.primaryLine}; {preview.recipients.archiveLine}
            </p>
            <p>
              <span className="font-bold">Ký:</span> {preview.signature.signMode} /{" "}
              {preview.signature.positionTitle} / {preview.signature.signerName}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}