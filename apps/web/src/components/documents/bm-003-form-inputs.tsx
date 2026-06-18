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

const DEFAULT_SIGNER_NAME = '';
const DEFAULT_PROSECUTOR_NAME = "";

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

type LegalBasisForm = {
  procedureArticlesLine: string;
};

type SourceAssignmentForm = {
  sourceProvider: string;
  caseSummary: string;
  prosecutorName: string;
  prosecutorTitle: string;
  inspectorName: string;
  inspectorTitle: string;
  hasInspectorAssistant: boolean;
  article1Line: string;
  article2Line: string;
  article3Line: string;
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

type Bm003Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  sourceAssignment: SourceAssignmentForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm003FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const textareaClass =
  "min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const labelClass = "text-xs font-semibold text-slate-600";


function getBm003TodayDisplayDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}/${month}/${year}`;
}

function parseBm003DisplayDateParts(value: string): {
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

  return {
    day: "",
    month: "",
    year: "",
  };
}

function buildBm003DisplayDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function Bm003DateSelectField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseBm003DisplayDateParts(value || getBm003TodayDisplayDate());

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
    const next = {
      ...parsed,
      ...patch,
    };

    if (next.day && next.month && next.year) {
      onChange(buildBm003DisplayDate(next.day, next.month, next.year));
    }
  };

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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

const EMPTY_FORM: Bm003Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "03/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: getBm003TodayDisplayDate(),
    issuePlaceAndDateLine: issuePlaceAndDateLine("TP. Hồ Chí Minh", getBm003TodayDisplayDate()),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 42, 43, 159 và 160 của Bộ luật Tố tụng hình sự;",
  },
  sourceAssignment: {
    sourceProvider: "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    caseSummary:
      "vụ việc có dấu hiệu Đánh bạc xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    prosecutorName: DEFAULT_PROSECUTOR_NAME,
    prosecutorTitle: "Kiểm sát viên",
    inspectorName: DEFAULT_SIGNER_NAME,
    inspectorTitle: "Kiểm tra viên",
    hasInspectorAssistant: true,
    article1Line:
      "Phân công ông/bà ; chức danh Kiểm sát viên của Viện kiểm sát nhân dân khu vực 7 thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây đối với vụ việc có dấu hiệu Đánh bạc xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh.",
    article2Line:
      "Phân công ông/bà , Kiểm tra viên của Viện kiểm sát nhân dân khu vực 7 giúp việc cho Kiểm sát viên .",
    article3Line:
      "Ông/bà có tên nêu tại Điều 1 và Điều 2 Quyết định này thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự.",
  },
  recipients: {
    primaryLine: "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
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

function pickBoolean(
  formInputs: unknown,
  payload: unknown,
  path: string,
  fallback: boolean,
): boolean {
  const saved = readPath(formInputs, path);
  if (saved.found) return Boolean(saved.value);

  const root = readPath(payload, path);
  if (root.found) return Boolean(root.value);

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

function ensureSentence(value: string, ending = "."): string {
  const text = cleanText(value).replace(/\s+([,.;:])/gu, "$1");
  if (!text) return "";
  return /[.!?;:]$/u.test(text) ? text : `${text}${ending}`;
}

function stripRecipientLine(value: string): string {
  return cleanText(value)
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function buildArticleLines(form: Bm003Form): Pick<
  SourceAssignmentForm,
  "article1Line" | "article2Line" | "article3Line"
> {
  const agencyBodyName =
    cleanText(form.agency.bodyName) || "Viện kiểm sát nhân dân khu vực 7";

  const prosecutorName =
    cleanText(form.sourceAssignment.prosecutorName) || DEFAULT_PROSECUTOR_NAME;
  const prosecutorTitle =
    cleanText(form.sourceAssignment.prosecutorTitle) || "Kiểm sát viên";

  const inspectorName =
    cleanText(form.sourceAssignment.inspectorName) || DEFAULT_SIGNER_NAME;
  const inspectorTitle =
    cleanText(form.sourceAssignment.inspectorTitle) || "Kiểm tra viên";

  const sourceProvider =
    cleanText(form.sourceAssignment.sourceProvider) ||
    "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây";

  const caseSummary =
    cleanText(form.sourceAssignment.caseSummary) ||
    "vụ việc có dấu hiệu Đánh bạc xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh";

  const article1Line = ensureSentence(
    `Phân công ông/bà ${prosecutorName}; chức danh ${prosecutorTitle} của ${agencyBodyName} thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm của ${sourceProvider} đối với ${caseSummary}`,
  );

  const article2Line = form.sourceAssignment.hasInspectorAssistant
    ? ensureSentence(
        `Phân công ông/bà ${inspectorName}, ${inspectorTitle} của ${agencyBodyName} giúp việc cho ${prosecutorTitle} ${prosecutorName}`,
      )
    : "";

  const article3Line = form.sourceAssignment.hasInspectorAssistant
    ? "Ông/bà có tên nêu tại Điều 1 và Điều 2 Quyết định này thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự."
    : "Ông/bà có tên nêu tại Điều 1 Quyết định này thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự.";

  return { article1Line, article2Line, article3Line };
}

function normalizeFormInputs(form: Bm003Form): Bm003Form & {
  document: DocumentForm & { issueDate: string };
} {
  const normalizedDate = normalizeDisplayDate(form.document.issueDateText);
  const nextIssueLine = issuePlaceAndDateLine(
    form.document.issuePlace,
    normalizedDate,
  );

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
    official: {
      issuerTitle: cleanText(form.official.issuerTitle),
    },
    legalBasis: {
      procedureArticlesLine: cleanText(form.legalBasis.procedureArticlesLine),
    },
    sourceAssignment: {
      ...form.sourceAssignment,
      sourceProvider: cleanText(form.sourceAssignment.sourceProvider),
      caseSummary: cleanText(form.sourceAssignment.caseSummary),
      prosecutorName: cleanText(form.sourceAssignment.prosecutorName),
      prosecutorTitle: cleanText(form.sourceAssignment.prosecutorTitle),
      inspectorName: cleanText(form.sourceAssignment.inspectorName),
      inspectorTitle: cleanText(form.sourceAssignment.inspectorTitle),
      article1Line: ensureSentence(form.sourceAssignment.article1Line),
      article2Line: form.sourceAssignment.hasInspectorAssistant
        ? ensureSentence(form.sourceAssignment.article2Line)
        : "",
      article3Line: ensureSentence(form.sourceAssignment.article3Line),
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

function buildFormFromPayload(payload: unknown): Bm003Form {
  const formInputs = firstExistingRecord(payload, [
    "formInputs",
    "renderPayloadSnapshot.formInputs",
    "metadata.formInputs",
  ]);

  const base: Bm003Form = {
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
      issuePlace: pickString(
        formInputs,
        payload,
        "document.issuePlace",
        pickString(formInputs, payload, "agency.issuePlace", EMPTY_FORM.document.issuePlace),
      ),
      issueDateText: normalizeDisplayDate(
        pickString(
          formInputs,
          payload,
          "document.issueDateText",
          pickString(formInputs, payload, "document.issueDate", EMPTY_FORM.document.issueDateText),
        ),
      ),
      issuePlaceAndDateLine: issuePlaceAndDateLine(pickString(formInputs, payload, "document.issuePlace", EMPTY_FORM.document.issuePlace), pickString(formInputs, { document: {} }, "document.issueDateText", getBm003TodayDisplayDate())),
    },
    official: {
      issuerTitle: pickString(
        formInputs,
        payload,
        "official.issuerTitle",
        EMPTY_FORM.official.issuerTitle,
      ),
    },
    legalBasis: {
      procedureArticlesLine: pickString(
        formInputs,
        payload,
        "legalBasis.procedureArticlesLine",
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
    },
    sourceAssignment: {
      sourceProvider: pickString(
        formInputs,
        payload,
        "sourceAssignment.sourceProvider",
        EMPTY_FORM.sourceAssignment.sourceProvider,
      ),
      caseSummary: pickString(
        formInputs,
        payload,
        "sourceAssignment.caseSummary",
        EMPTY_FORM.sourceAssignment.caseSummary,
      ),
      prosecutorName: pickString(
        formInputs,
        payload,
        "sourceAssignment.prosecutorName",
        EMPTY_FORM.sourceAssignment.prosecutorName,
      ),
      prosecutorTitle: pickString(
        formInputs,
        payload,
        "sourceAssignment.prosecutorTitle",
        EMPTY_FORM.sourceAssignment.prosecutorTitle,
      ),
      inspectorName: pickString(
        formInputs,
        payload,
        "sourceAssignment.inspectorName",
        EMPTY_FORM.sourceAssignment.inspectorName,
      ),
      inspectorTitle: pickString(
        formInputs,
        payload,
        "sourceAssignment.inspectorTitle",
        EMPTY_FORM.sourceAssignment.inspectorTitle,
      ),
      hasInspectorAssistant: pickBoolean(
        formInputs,
        payload,
        "sourceAssignment.hasInspectorAssistant",
        EMPTY_FORM.sourceAssignment.hasInspectorAssistant,
      ),
      article1Line: pickString(
        formInputs,
        payload,
        "sourceAssignment.article1Line",
        EMPTY_FORM.sourceAssignment.article1Line,
      ),
      article2Line: pickString(
        formInputs,
        payload,
        "sourceAssignment.article2Line",
        EMPTY_FORM.sourceAssignment.article2Line,
      ),
      article3Line: pickString(
        formInputs,
        payload,
        "sourceAssignment.article3Line",
        EMPTY_FORM.sourceAssignment.article3Line,
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
  };

  return normalizeFormInputs(base);
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

export function Bm003FormInputsPanel({
  documentId,
  onSaved,
}: Bm003FormInputsPanelProps) {
  const [form, setForm] = useState<Bm003Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-003 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-003.");
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

  function updateOfficial<K extends keyof OfficialForm>(key: K, value: OfficialForm[K]) {
    setForm((current) => ({
      ...current,
      official: { ...current.official, [key]: value },
    }));
  }

  function updateLegalBasis<K extends keyof LegalBasisForm>(key: K, value: LegalBasisForm[K]) {
    setForm((current) => ({
      ...current,
      legalBasis: { ...current.legalBasis, [key]: value },
    }));
  }

  function updateSource<K extends keyof SourceAssignmentForm>(
    key: K,
    value: SourceAssignmentForm[K],
    regenerateArticles = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        sourceAssignment: {
          ...current.sourceAssignment,
          [key]: value,
        },
      };

      if (!regenerateArticles) return nextForm;

      const generated = buildArticleLines(nextForm);

      return {
        ...nextForm,
        sourceAssignment: {
          ...nextForm.sourceAssignment,
          ...generated,
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

  function regenerateArticles() {
    setForm((current) => ({
      ...current,
      sourceAssignment: {
        ...current.sourceAssignment,
        ...buildArticleLines(current),
      },
    }));
  }

  function fillCustomerSample() {
    const next = normalizeFormInputs({
      ...EMPTY_FORM,
      document: {
        ...EMPTY_FORM.document,
        documentCode: "03/QĐ-VKSKV7",
        issueDateText: getBm003TodayDisplayDate(),
      },
    });

    setForm(next);
    setMessage("Đã điền dữ liệu mẫu BM-003.");
    setStatus("success");
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
    setMessage("Đang lưu formInputs BM-003...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-003",
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
          result.text || `Không lưu được BM-003. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-003. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-003 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-003
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Quyết định phân công thực hành quyền công tố, kiểm sát nguồn tin
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-003. Dữ liệu được lưu vào nhóm{" "}
          <span className="font-semibold">sourceAssignment</span>, gồm Điều 1,
          Điều 2, Điều 3, nơi nhận và chữ ký. Không dùng logic của BM-005/BM-009.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <BmFormCasePayloadButton<Bm003Form>
            templateCode="BM-003"
            form={form}
            onApply={(next) => setForm(next)}
          />
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-003
          </button>
          <button
            type="button"
            onClick={regenerateArticles}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại Điều 1/2/3
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-003"}
          </button>
        </div>

        <div className="mt-4">
          <StatusMessage status={status} message={message} />
        </div>
      </section>

      <SectionCard
        title="1. Cơ quan / văn bản"
        description="Không dùng input type=date. Ngày nhập theo DD/MM/YYYY."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateAgency("parentName", value)} fullWidth />
          <BmFieldText label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateAgency("name", value)} fullWidth />
          <BmFieldText label="Tên cơ quan trong thân văn bản" value={form.agency.bodyName} onChange={(value) => updateAgency("bodyName", value)} fullWidth />
          <BmFieldText label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateAgency("shortName", value)} fullWidth />
          <BmFieldText label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} fullWidth />
          <BmFieldText label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} fullWidth />
          <div className="space-y-1">
            <label className={labelClass}>Ngày ban hành</label>
            <Bm003DateSelectField
              value={form.document.issueDateText || getBm003TodayDisplayDate()}
              onChange={(value) => updateDocument("issueDateText", value)}
            />
            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {normalizeFormInputs(form).document.issuePlaceAndDateLine || "Chưa có dòng địa danh, ngày tháng"}
            </p>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Dòng địa danh, ngày tháng</label>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              {normalizeFormInputs(form).document.issuePlaceAndDateLine || "Chưa có dòng địa danh, ngày tháng"}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Người ban hành / căn cứ tố tụng">
        <div className="grid gap-4">
          <BmFieldText label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={(value) => updateOfficial("issuerTitle", value)} fullWidth />
          <TextAreaField
            label="Căn cứ tố tụng"
            value={form.legalBasis.procedureArticlesLine}
            onChange={(value) => updateLegalBasis("procedureArticlesLine", value)}
            rows={2}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="3. Phân công thực hành quyền công tố, kiểm sát nguồn tin"
        description="Sửa các ô ngắn rồi bấm 'Tự sinh lại Điều 1/2/3' nếu muốn cập nhật lại nội dung điều khoản."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Kiểm sát viên được phân công" value={form.sourceAssignment.prosecutorName} onChange={(value) => updateSource("prosecutorName", value, true)} fullWidth />
          <BmFieldText label="Chức danh Kiểm sát viên" value={form.sourceAssignment.prosecutorTitle} onChange={(value) => updateSource("prosecutorTitle", value, true)} fullWidth />
          <BmFieldText label="Cơ quan cung cấp / giải quyết nguồn tin" value={form.sourceAssignment.sourceProvider} onChange={(value) => updateSource("sourceProvider", value, true)} fullWidth />
          <BmFieldText label="Tóm tắt vụ việc / nguồn tin" value={form.sourceAssignment.caseSummary} onChange={(value) => updateSource("caseSummary", value, true)} fullWidth />
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300"
            checked={form.sourceAssignment.hasInspectorAssistant}
            onChange={(event) =>
              updateSource("hasInspectorAssistant", event.target.checked, true)
            }
          />
          <span>
            <span className="block font-semibold text-slate-900">
              Có phân công Kiểm tra viên giúp việc
            </span>
            Nếu bỏ chọn, Điều 2 sẽ rỗng và Điều 3 chỉ nhắc người ở Điều 1.
          </span>
        </label>

        {form.sourceAssignment.hasInspectorAssistant ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <BmFieldText label="Kiểm tra viên giúp việc" value={form.sourceAssignment.inspectorName} onChange={(value) => updateSource("inspectorName", value, true)} fullWidth />
            <BmFieldText label="Chức danh Kiểm tra viên" value={form.sourceAssignment.inspectorTitle} onChange={(value) => updateSource("inspectorTitle", value, true)} fullWidth />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="4. Nội dung Điều 1 / Điều 2 / Điều 3">
        <div className="grid gap-4">
          <TextAreaField
            label="Điều 1"
            value={form.sourceAssignment.article1Line}
            onChange={(value) => updateSource("article1Line", value)}
            rows={5}
          />
          <TextAreaField
            label="Điều 2"
            value={form.sourceAssignment.article2Line}
            onChange={(value) => updateSource("article2Line", value)}
            rows={4}
          />
          <TextAreaField
            label="Điều 3"
            value={form.sourceAssignment.article3Line}
            onChange={(value) => updateSource("article3Line", value)}
            rows={4}
          />
        </div>
      </SectionCard>

      <SectionCard title="5. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Nơi nhận chính" value={form.recipients.primaryLine} onChange={(value) => updateRecipients("primaryLine", value)} fullWidth />
          <BmFieldText label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateRecipients("archiveLine", value)} fullWidth />
          <BmFieldText label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateSignature("signMode", value)} fullWidth />
          <BmFieldText label="Chức vụ người ký" value={form.signature.positionTitle} onChange={(value) => updateSignature("positionTitle", value)} fullWidth />
          <BmFieldText label="Người ký" value={form.signature.signerName} onChange={(value) => updateSignature("signerName", value)} fullWidth />
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
            <span className="font-bold">Căn cứ:</span>{" "}
            {preview.legalBasis.procedureArticlesLine}
          </p>
          <p>
            <span className="font-bold">Điều 1:</span>{" "}
            {preview.sourceAssignment.article1Line}
          </p>
          {preview.sourceAssignment.article2Line ? (
            <p>
              <span className="font-bold">Điều 2:</span>{" "}
              {preview.sourceAssignment.article2Line}
            </p>
          ) : null}
          <p>
            <span className="font-bold">Điều 3:</span>{" "}
            {preview.sourceAssignment.article3Line}
          </p>
          <p>
            <span className="font-bold">Nơi nhận:</span>{" "}
            {preview.recipients.primaryLine}; {preview.recipients.archiveLine}
          </p>
          <p>
            <span className="font-bold">Chữ ký:</span> {preview.signature.signMode} /{" "}
            {preview.signature.positionTitle} / {preview.signature.signerName}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

