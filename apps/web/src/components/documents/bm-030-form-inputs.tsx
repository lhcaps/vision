"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

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

type LegalBasisForm = {
  procedureArticlesLine: string;
};

type SourceResolutionNoticeForm = {
  agencyActionLine: string;
  noticeRecipientLine: string;
  sourceProviderName: string;
  sourceProvidedDateLine: string;
  caseSummary: string;
  resolutionDecisionLine: string;
  sourceInfoLine: string;
  resolutionResultLine: string;
};

type RecipientsForm = {
  primaryLine: string;
  copyLine: string;
  archiveLine: string;
};

type SignatureForm = {
  positionTitle: string;
  signerName: string;
};

type Bm030Form = {
  agency: AgencyForm;
  document: DocumentForm;
  legalBasis: LegalBasisForm;
  sourceResolutionNotice: SourceResolutionNoticeForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm030FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const textareaClass =
  "min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const labelClass = "text-xs font-semibold text-slate-600";

const EMPTY_FORM: Bm030Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "30/TB-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  legalBasis: {
    procedureArticlesLine: "Căn cứ Điều 145 của Bộ luật Tố tụng hình sự,",
  },
  sourceResolutionNotice: {
    agencyActionLine: "Viện kiểm sát nhân dân khu vực 7",
    noticeRecipientLine:
      "Cơ quan, tổ chức, cá nhân đã cung cấp nguồn tin về tội phạm",
    sourceProviderName: "người cung cấp nguồn tin",
    sourceProvidedDateLine: getBm030TodayVietnameseDateLine(),
    caseSummary:
      "có dấu hiệu Đánh bạc xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    resolutionDecisionLine:
      "Quyết định không khởi tố vụ án hình sự số 30/QĐ-VKSKV7 ngày 31 tháng 5 năm 2026",
    sourceInfoLine:
      `Nguồn tin về tội phạm do người cung cấp nguồn tin cung cấp ${getBm030TodayVietnameseDateLine()} về việc có dấu hiệu Đánh bạc xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh`,
    resolutionResultLine:
      "đã được Viện kiểm sát nhân dân khu vực 7 giải quyết và ra Quyết định không khởi tố vụ án hình sự số 30/QĐ-VKSKV7 ngày 31 tháng 5 năm 2026./.",
  },
  recipients: {
    primaryLine: "Cơ quan, tổ chức, cá nhân đã cung cấp nguồn tin về tội phạm",
    copyLine: "Cơ quan, tổ chức, cá nhân đã cung cấp nguồn tin về tội phạm",
    archiveLine: "Lưu: HSVV, HSKS, VP",
  },
  signature: {
    positionTitle: "KIỂM SÁT VIÊN",
    signerName: DEFAULT_SIGNER_NAME,
  },
  updatedByName: DEFAULT_SIGNER_NAME,
  renderedByName: DEFAULT_SIGNER_NAME,
  convertedByName: DEFAULT_SIGNER_NAME,
};

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

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (vn) return `${pad2(Number(vn[1]))}/${pad2(Number(vn[2]))}/${vn[3]}`;

  return raw;
}


function todayDisplayDateText(): string {
  const now = new Date();

  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function todayIssuePlaceAndDateLine(issuePlace = "TP. Hồ Chí Minh"): string {
  const now = new Date();

  return `${cleanText(issuePlace)}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
}
function displayDateToIso(value: string): string {
  const raw = cleanText(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return raw;

  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (!vn) return "";

  return `${vn[3]}-${pad2(Number(vn[2]))}-${pad2(Number(vn[1]))}`;
}

function issuePlaceAndDateLine(issuePlace: string, issueDateText: string): string {
  const normalizedDate = normalizeDisplayDate(issueDateText);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalizedDate);

  if (!match) {
    return `${cleanText(issuePlace)}, ngày ... tháng ... năm ...`;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3];

  return `${cleanText(issuePlace)}, ngày ${day} tháng ${month} năm ${year}`;
}

function getBm030TodayParts(): {
  day: string;
  month: string;
  year: string;
} {
  const now = new Date();

  return {
    day: pad2(now.getDate()),
    month: pad2(now.getMonth() + 1),
    year: String(now.getFullYear()),
  };
}

function buildBm030DisplayDate(day: string, month: string, year: string): string {
  return `${pad2(Number(day))}/${pad2(Number(month))}/${year}`;
}

function buildBm030VietnameseDateLine(day: string, month: string, year: string): string {
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function getBm030TodayDisplayDate(): string {
  const today = getBm030TodayParts();
  return buildBm030DisplayDate(today.day, today.month, today.year);
}

function getBm030TodayVietnameseDateLine(): string {
  const today = getBm030TodayParts();
  return buildBm030VietnameseDateLine(today.day, today.month, today.year);
}

function parseBm030DateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = cleanText(value);

  const vnLine = /^ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})$/iu.exec(raw);
  if (vnLine) {
    return {
      day: pad2(Number(vnLine[1])),
      month: pad2(Number(vnLine[2])),
      year: vnLine[3],
    };
  }

  const display = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (display) {
    return {
      day: pad2(Number(display[1])),
      month: pad2(Number(display[2])),
      year: display[3],
    };
  }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (iso) {
    return {
      day: pad2(Number(iso[3])),
      month: pad2(Number(iso[2])),
      year: iso[1],
    };
  }

  return getBm030TodayParts();
}

function normalizeBm030DisplayDate(value: string): string {
  const raw = cleanText(value);

  if (!raw || raw.includes("...")) {
    return getBm030TodayDisplayDate();
  }

  const parsed = parseBm030DateParts(raw);
  return buildBm030DisplayDate(parsed.day, parsed.month, parsed.year);
}

function normalizeBm030VietnameseDateLine(value: string): string {
  const raw = cleanText(value);

  if (!raw || raw.includes("...")) {
    return getBm030TodayVietnameseDateLine();
  }

  const parsed = parseBm030DateParts(raw);
  return buildBm030VietnameseDateLine(parsed.day, parsed.month, parsed.year);
}

function Bm030DateSelectField({
  label,
  value,
  onChange,
  outputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  outputMode: "display" | "vietnameseLine";
}) {
  const parsed = parseBm030DateParts(value);

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

    const nextValue =
      outputMode === "vietnameseLine"
        ? buildBm030VietnameseDateLine(next.day, next.month, next.year)
        : buildBm030DisplayDate(next.day, next.month, next.year);

    onChange(nextValue);
  };

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <div className="space-y-1.5">
      <span className={labelClass}>{label}</span>

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
function stripRecipientLine(value: string): string {
  return cleanText(value)
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function ensureEnd(value: string, ending = "./."): string {
  const text = cleanText(value).replace(/\s+([,.;:])/gu, "$1");
  if (!text) return "";
  return /[.!?;:]$/u.test(text) || text.endsWith("./.") ? text : `${text}${ending}`;
}

function buildGeneratedLines(form: Bm030Form): Pick<
  SourceResolutionNoticeForm,
  "sourceInfoLine" | "resolutionResultLine" | "agencyActionLine" | "noticeRecipientLine"
> {
  const agencyBodyName =
    cleanText(form.agency.bodyName) || EMPTY_FORM.agency.bodyName;

  const noticeRecipient =
    cleanText(form.sourceResolutionNotice.noticeRecipientLine) ||
    cleanText(form.recipients.primaryLine) ||
    EMPTY_FORM.sourceResolutionNotice.noticeRecipientLine;

  const sourceProviderName =
    cleanText(form.sourceResolutionNotice.sourceProviderName) ||
    EMPTY_FORM.sourceResolutionNotice.sourceProviderName;

  const sourceProvidedDateLine =
    normalizeBm030VietnameseDateLine(
      form.sourceResolutionNotice.sourceProvidedDateLine,
    );

  const caseSummary =
    cleanText(form.sourceResolutionNotice.caseSummary) ||
    EMPTY_FORM.sourceResolutionNotice.caseSummary;

  const resolutionDecisionLine =
    cleanText(form.sourceResolutionNotice.resolutionDecisionLine) ||
    EMPTY_FORM.sourceResolutionNotice.resolutionDecisionLine;

  return {
    agencyActionLine: agencyBodyName,
    noticeRecipientLine: noticeRecipient,
    sourceInfoLine: `Nguồn tin về tội phạm do ${sourceProviderName} cung cấp ${sourceProvidedDateLine} về việc ${caseSummary}`,
    resolutionResultLine: `đã được ${agencyBodyName} giải quyết và ra ${resolutionDecisionLine}./.`,
  };
}

function normalizeFormInputs(form: Bm030Form): Bm030Form & {
  document: DocumentForm & { issueDate: string };
} {
  const normalizedDate = normalizeBm030DisplayDate(form.document.issueDateText);
  const nextIssueLine = issuePlaceAndDateLine(
    form.document.issuePlace,
    normalizedDate,
  );
  const normalizedSourceProvidedDateLine =
    normalizeBm030VietnameseDateLine(
      form.sourceResolutionNotice.sourceProvidedDateLine,
    );

  const generatedLines = buildGeneratedLines({
    ...form,
    sourceResolutionNotice: {
      ...form.sourceResolutionNotice,
      sourceProvidedDateLine: normalizedSourceProvidedDateLine,
    },
  });

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
      issueDateText: normalizedDate,
      issueDate: displayDateToIso(normalizedDate),
      issuePlaceAndDateLine: nextIssueLine,
    },
    legalBasis: {
      procedureArticlesLine:
        cleanText(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    sourceResolutionNotice: {
      agencyActionLine: generatedLines.agencyActionLine || cleanText(form.sourceResolutionNotice.agencyActionLine),
      noticeRecipientLine: generatedLines.noticeRecipientLine || cleanText(form.sourceResolutionNotice.noticeRecipientLine),
      sourceProviderName: cleanText(
        form.sourceResolutionNotice.sourceProviderName,
      ),
      sourceProvidedDateLine: normalizedSourceProvidedDateLine,
      caseSummary: cleanText(form.sourceResolutionNotice.caseSummary),
      resolutionDecisionLine: cleanText(
        form.sourceResolutionNotice.resolutionDecisionLine,
      ),
      sourceInfoLine: generatedLines.sourceInfoLine || cleanText(form.sourceResolutionNotice.sourceInfoLine),
      resolutionResultLine: ensureEnd(
        form.sourceResolutionNotice.resolutionResultLine,
      ),
    },
    recipients: {
      primaryLine: stripRecipientLine(form.recipients.primaryLine),
      copyLine: stripRecipientLine(form.recipients.copyLine),
      archiveLine: stripRecipientLine(form.recipients.archiveLine),
    },
    signature: {
      positionTitle: cleanText(form.signature.positionTitle),
      signerName: cleanText(form.signature.signerName),
    },
    updatedByName: cleanText(form.updatedByName) || DEFAULT_SIGNER_NAME,
    renderedByName: cleanText(form.renderedByName) || DEFAULT_SIGNER_NAME,
    convertedByName: cleanText(form.convertedByName) || DEFAULT_SIGNER_NAME,
  };
}

function buildFormFromPayload(payload: unknown): Bm030Form {
  const formInputs = firstExistingRecord(payload, [
    "formInputs",
    "renderPayloadSnapshot.formInputs",
    "metadata.formInputs",
  ]);

  const hasSavedFormInputs = Object.keys(formInputs).length > 0;
  const defaultIssuePlace = pickString(
    formInputs,
    payload,
    "document.issuePlace",
    pickString(formInputs, payload, "agency.issuePlace", EMPTY_FORM.document.issuePlace),
  );

  const defaultIssueDateText = hasSavedFormInputs
    ? normalizeBm030DisplayDate(
        pickString(
          formInputs,
          payload,
          "document.issueDateText",
          pickString(formInputs, payload, "document.issueDate", todayDisplayDateText()),
        ),
      )
    : todayDisplayDateText();

  const defaultIssuePlaceAndDateLine = hasSavedFormInputs
    ? pickString(
        formInputs,
        payload,
        "document.issuePlaceAndDateLine",
        issuePlaceAndDateLine(defaultIssuePlace, defaultIssueDateText),
      )
    : issuePlaceAndDateLine(defaultIssuePlace, defaultIssueDateText);

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
      issuePlace: defaultIssuePlace,
      issueDateText: defaultIssueDateText,
      issuePlaceAndDateLine: defaultIssuePlaceAndDateLine,
    },
    legalBasis: {
      procedureArticlesLine: pickString(
        formInputs,
        payload,
        "legalBasis.procedureArticlesLine",
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
    },
    sourceResolutionNotice: {
      agencyActionLine: pickString(
        formInputs,
        payload,
        "sourceResolutionNotice.agencyActionLine",
        EMPTY_FORM.sourceResolutionNotice.agencyActionLine,
      ),
      noticeRecipientLine: pickString(
        formInputs,
        payload,
        "sourceResolutionNotice.noticeRecipientLine",
        EMPTY_FORM.sourceResolutionNotice.noticeRecipientLine,
      ),
      sourceProviderName: pickString(
        formInputs,
        payload,
        "sourceResolutionNotice.sourceProviderName",
        EMPTY_FORM.sourceResolutionNotice.sourceProviderName,
      ),
      sourceProvidedDateLine: pickString(
        formInputs,
        payload,
        "sourceResolutionNotice.sourceProvidedDateLine",
        EMPTY_FORM.sourceResolutionNotice.sourceProvidedDateLine,
      ),
      caseSummary: pickString(
        formInputs,
        payload,
        "sourceResolutionNotice.caseSummary",
        EMPTY_FORM.sourceResolutionNotice.caseSummary,
      ),
      resolutionDecisionLine: pickString(
        formInputs,
        payload,
        "sourceResolutionNotice.resolutionDecisionLine",
        EMPTY_FORM.sourceResolutionNotice.resolutionDecisionLine,
      ),
      sourceInfoLine: pickString(
        formInputs,
        payload,
        "sourceResolutionNotice.sourceInfoLine",
        EMPTY_FORM.sourceResolutionNotice.sourceInfoLine,
      ),
      resolutionResultLine: pickString(
        formInputs,
        payload,
        "sourceResolutionNotice.resolutionResultLine",
        EMPTY_FORM.sourceResolutionNotice.resolutionResultLine,
      ),
    },
    recipients: {
      primaryLine: pickString(
        formInputs,
        payload,
        "recipients.primaryLine",
        EMPTY_FORM.recipients.primaryLine,
      ),
      copyLine: pickString(
        formInputs,
        payload,
        "recipients.copyLine",
        EMPTY_FORM.recipients.copyLine,
      ),
      archiveLine: pickString(
        formInputs,
        payload,
        "recipients.archiveLine",
        EMPTY_FORM.recipients.archiveLine,
      ),
    },
    signature: {
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
        EMPTY_FORM.signature.signerName,
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>{label}</span>
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
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <textarea
        className={textareaClass}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function StatusMessage({
  status,
  message,
}: {
  status: "idle" | "loading" | "saving" | "success" | "error";
  message: string;
}) {
  if (!message) return null;

  const className =
    status === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : status === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${className}`}>
      {message}
    </div>
  );
}

export function Bm030FormInputsPanel({
  documentId,
  onSaved,
}: Bm030FormInputsPanelProps) {
  const [form, setForm] = useState<Bm030Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-030 từ backend...");

      try {
        const response = await fetch(
          `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`Không tải được render-payload. HTTP ${response.status}`);
        }

        const payload = await response.json();

        if (!cancelled) {
          setForm(buildFormFromPayload(payload));
          setStatus("idle");
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-030.");
        }
      }
    }

    void loadPayload();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const preview = useMemo(() => normalizeFormInputs(form), [form]);

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

  function updateLegalBasis<K extends keyof LegalBasisForm>(key: K, value: LegalBasisForm[K]) {
    setForm((current) => ({
      ...current,
      legalBasis: { ...current.legalBasis, [key]: value },
    }));
  }

  function updateNotice<K extends keyof SourceResolutionNoticeForm>(
    key: K,
    value: SourceResolutionNoticeForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        sourceResolutionNotice: {
          ...current.sourceResolutionNotice,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        sourceResolutionNotice: {
          ...nextForm.sourceResolutionNotice,
          ...buildGeneratedLines(nextForm),
        },
      };
    });
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

  function regenerateLines() {
    setForm((current) => ({
      ...current,
      sourceResolutionNotice: {
        ...current.sourceResolutionNotice,
        ...buildGeneratedLines(current),
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-030.");
  }

  async function requestSave(method: "POST" | "PATCH", body: unknown) {
    const response = await fetch(
      `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
      {
        method,
        headers: { "Content-Type": "application/json" },
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
    setMessage("Đang lưu formInputs BM-030...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-030",
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
        throw new Error(
          result.text || `Không lưu được BM-030. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-030. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-030 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-030
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Thông báo kết quả giải quyết nguồn tin về tội phạm
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-030. Dữ liệu chính được lưu vào nhóm{" "}
          <span className="font-semibold">sourceResolutionNotice</span>, gồm
          người/cơ quan nhận thông báo, nguồn tin, kết quả giải quyết, nơi nhận
          và chữ ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-030
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại nội dung nguồn tin / kết quả
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-030"}
          </button>
        </div>

        <div className="mt-4">
          <StatusMessage status={status} message={message} />
        </div>
      </section>

      <SectionCard
        title="1. Cơ quan / văn bản"
        description="Ngày nhập theo DD/MM/YYYY để tránh lỗi đảo năm-tháng-ngày."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Cơ quan cấp trên"
            value={form.agency.parentName}
            onChange={(value) => updateAgency("parentName", value)}
          />
          <Field
            label="Viện kiểm sát ban hành"
            value={form.agency.name}
            onChange={(value) => updateAgency("name", value)}
          />
          <Field
            label="Tên cơ quan trong thân văn bản"
            value={form.agency.bodyName}
            onChange={(value) => updateAgency("bodyName", value)}
          />
          <Field
            label="Tên viết tắt"
            value={form.agency.shortName}
            onChange={(value) => updateAgency("shortName", value)}
          />
          <Field
            label="Số thông báo"
            value={form.document.documentCode}
            onChange={(value) => updateDocument("documentCode", value)}
          />
          <Field
            label="Địa danh"
            value={form.document.issuePlace}
            onChange={(value) => updateDocument("issuePlace", value)}
          />
          <div className="space-y-1.5">
            <Bm030DateSelectField
              label="Ngày ban hành"
              value={form.document.issueDateText || getBm030TodayDisplayDate()}
              outputMode="display"
              onChange={(value) => updateDocument("issueDateText", value)}
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {preview.document.issuePlaceAndDateLine}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Căn cứ / người nhận thông báo">
        <div className="grid gap-4">
          <TextAreaField
            label="Căn cứ"
            value={form.legalBasis.procedureArticlesLine}
            onChange={(value) => updateLegalBasis("procedureArticlesLine", value)}
            rows={2}
          />
          <Field
            label="Kính gửi"
            value={form.recipients.primaryLine}
            onChange={(value) => {
              updateRecipients("primaryLine", value);
              updateNotice("noticeRecipientLine", value);
            }}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="3. Thông tin nguồn tin"
        description="Sửa các ô ngắn rồi bấm 'Tự sinh lại nội dung nguồn tin / kết quả' để cập nhật dòng dài."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Người/cơ quan cung cấp nguồn tin"
            value={form.sourceResolutionNotice.sourceProviderName}
            onChange={(value) =>
              updateNotice("sourceProviderName", value, true)
            }
          />
          <div className="space-y-1.5">
            <Bm030DateSelectField
              label="Ngày cung cấp nguồn tin"
              value={
                form.sourceResolutionNotice.sourceProvidedDateLine ||
                getBm030TodayVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updateNotice("sourceProvidedDateLine", value, true)
              }
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {preview.sourceResolutionNotice.sourceProvidedDateLine}
            </p>
          </div>
          <TextAreaField
            label="Tóm tắt vụ việc"
            value={form.sourceResolutionNotice.caseSummary}
            onChange={(value) => updateNotice("caseSummary", value, true)}
            rows={3}
          />
          <TextAreaField
            label="Quyết định/kết quả giải quyết"
            value={form.sourceResolutionNotice.resolutionDecisionLine}
            onChange={(value) =>
              updateNotice("resolutionDecisionLine", value, true)
            }
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="4. Nội dung thông báo">
        <div className="grid gap-4">
          <Field
            label="Viện kiểm sát thông báo"
            value={form.sourceResolutionNotice.agencyActionLine}
            onChange={(value) => updateNotice("agencyActionLine", value)}
          />
          <Field
            label="Thông báo cho"
            value={form.sourceResolutionNotice.noticeRecipientLine}
            onChange={(value) => updateNotice("noticeRecipientLine", value)}
          />
          <TextAreaField
            label="Dòng nguồn tin"
            value={form.sourceResolutionNotice.sourceInfoLine}
            onChange={(value) => updateNotice("sourceInfoLine", value)}
            rows={4}
          />
          <TextAreaField
            label="Dòng kết quả giải quyết"
            value={form.sourceResolutionNotice.resolutionResultLine}
            onChange={(value) => updateNotice("resolutionResultLine", value)}
            rows={4}
          />
        </div>
      </SectionCard>

      <SectionCard title="5. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nơi nhận"
            value={form.recipients.copyLine}
            onChange={(value) => updateRecipients("copyLine", value)}
          />
          <Field
            label="Lưu hồ sơ"
            value={form.recipients.archiveLine}
            onChange={(value) => updateRecipients("archiveLine", value)}
          />
          <Field
            label="Chức vụ người ký"
            value={form.signature.positionTitle}
            onChange={(value) => updateSignature("positionTitle", value)}
          />
          <Field
            label="Người ký"
            value={form.signature.signerName}
            onChange={(value) => updateSignature("signerName", value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Preview dữ liệu sẽ lưu">
        <div className="space-y-3 rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          <p>
            <span className="font-bold">Số:</span> {preview.document.documentCode}
          </p>
          <p>
            <span className="font-bold">Ngày:</span>{" "}
            {preview.document.issuePlaceAndDateLine}
          </p>
          <p>
            <span className="font-bold">Kính gửi:</span>{" "}
            {preview.recipients.primaryLine}
          </p>
          <p>
            <span className="font-bold">Nguồn tin:</span>{" "}
            {preview.sourceResolutionNotice.sourceInfoLine}
          </p>
          <p>
            <span className="font-bold">Kết quả:</span>{" "}
            {preview.sourceResolutionNotice.resolutionResultLine}
          </p>
          <p>
            <span className="font-bold">Chữ ký:</span>{" "}
            {preview.signature.positionTitle} / {preview.signature.signerName}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
