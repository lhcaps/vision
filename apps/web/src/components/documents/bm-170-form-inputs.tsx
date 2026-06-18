"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  BmFieldText,
  BmFieldTextarea,
  BmFormSection,
} from "./bm-form";

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

type LegalBasisForm = {
  procedureArticlesLine: string;
};

type EvidenceHandlingCancellationForm = {
  investigationAuthority: string;
  defendantName: string;
  offenseName: string;
  offenseLegalLine: string;
  caseInitiationCode: string;
  caseInitiationDateLine: string;
  defendantInitiationCode: string;
  defendantInitiationDateLine: string;
  evidenceHandlingDecisionCode: string;
  evidenceHandlingDecisionDateLine: string;
  evidenceHandlingDecisionIssuedBy: string;
  caseInitiationLine: string;
  defendantInitiationLine: string;
  evidenceHandlingDecisionReviewLine: string;
  unlawfulReasonLine: string;
  article1Line: string;
  article2Line: string;
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

type Bm170Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  evidenceHandlingCancellation: EvidenceHandlingCancellationForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm170FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const textareaClass =
  "min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const labelClass = "text-xs font-semibold text-slate-600";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function todayDisplayDateText(): string {
  const now = new Date();
  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function todayDateLine(): string {
  const now = new Date();
  return `ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
}

function todayIssuePlaceAndDateLine(issuePlace = "TP. Hồ Chí Minh"): string {
  const now = new Date();
  return `${cleanText(issuePlace)}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
}

const EMPTY_FORM: Bm170Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "170/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 106 và 165 của Bộ luật Tố tụng hình sự;",
  },
  evidenceHandlingCancellation: {
    investigationAuthority:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    defendantName: "",
    offenseName: "",
    offenseLegalLine: "quy định tại khoản 1 Điều 321 của Bộ luật Hình sự",
    caseInitiationCode: "01/QĐ-CSĐT",
    caseInitiationDateLine: todayDateLine(),
    defendantInitiationCode: "02/QĐ-CSĐT",
    defendantInitiationDateLine: todayDateLine(),
    evidenceHandlingDecisionCode: "169/QĐ-CSĐT",
    evidenceHandlingDecisionDateLine: todayDateLine(),
    evidenceHandlingDecisionIssuedBy:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    caseInitiationLine:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 01/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;",
    defendantInitiationLine:
      "Căn cứ Quyết định khởi tố bị can số 02/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây đối với  về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;",
    evidenceHandlingDecisionReviewLine:
      "Xét Quyết định xử lý vật chứng số 169/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây;",
    unlawfulReasonLine:
      "Nhận thấy Quyết định xử lý vật chứng là không có căn cứ và trái pháp luật,",
    article1Line:
      "Hủy bỏ Quyết định xử lý vật chứng số 169/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây.",
    article2Line:
      "Yêu cầu Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự./.",
  },
  recipients: {
    primaryLine: "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    archiveLine: "Lưu: HSVA, HSKS, VP",
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

  return `${cleanText(issuePlace)}, ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
}

function stripRecipientLine(value: string): string {
  return cleanText(value)
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function buildGeneratedLines(
  form: Bm170Form,
): Partial<EvidenceHandlingCancellationForm> {
  const data = form.evidenceHandlingCancellation;

  const investigationAuthority =
    cleanText(data.investigationAuthority) ||
    EMPTY_FORM.evidenceHandlingCancellation.investigationAuthority;

  const defendantName =
    cleanText(data.defendantName) ||
    EMPTY_FORM.evidenceHandlingCancellation.defendantName;

  const offenseName =
    cleanText(data.offenseName) ||
    EMPTY_FORM.evidenceHandlingCancellation.offenseName;

  const offenseLegalLine =
    cleanText(data.offenseLegalLine) ||
    EMPTY_FORM.evidenceHandlingCancellation.offenseLegalLine;

  const caseInitiationCode =
    cleanText(data.caseInitiationCode) ||
    EMPTY_FORM.evidenceHandlingCancellation.caseInitiationCode;

  const caseInitiationDateLine =
    cleanText(data.caseInitiationDateLine) ||
    EMPTY_FORM.evidenceHandlingCancellation.caseInitiationDateLine;

  const defendantInitiationCode =
    cleanText(data.defendantInitiationCode) ||
    EMPTY_FORM.evidenceHandlingCancellation.defendantInitiationCode;

  const defendantInitiationDateLine =
    cleanText(data.defendantInitiationDateLine) ||
    EMPTY_FORM.evidenceHandlingCancellation.defendantInitiationDateLine;

  const evidenceHandlingDecisionCode =
    cleanText(data.evidenceHandlingDecisionCode) ||
    EMPTY_FORM.evidenceHandlingCancellation.evidenceHandlingDecisionCode;

  const evidenceHandlingDecisionDateLine =
    cleanText(data.evidenceHandlingDecisionDateLine) ||
    EMPTY_FORM.evidenceHandlingCancellation.evidenceHandlingDecisionDateLine;

  const evidenceHandlingDecisionIssuedBy =
    cleanText(data.evidenceHandlingDecisionIssuedBy) ||
    investigationAuthority;

  return {
    caseInitiationLine:
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseInitiationCode} ${caseInitiationDateLine} của ${investigationAuthority} về tội ${offenseName} ${offenseLegalLine};`,
    defendantInitiationLine:
      `Căn cứ Quyết định khởi tố bị can số ${defendantInitiationCode} ${defendantInitiationDateLine} của ${investigationAuthority} đối với ${defendantName} về tội ${offenseName} ${offenseLegalLine};`,
    evidenceHandlingDecisionReviewLine:
      `Xét Quyết định xử lý vật chứng số ${evidenceHandlingDecisionCode} ${evidenceHandlingDecisionDateLine} của ${evidenceHandlingDecisionIssuedBy};`,
    unlawfulReasonLine:
      cleanText(data.unlawfulReasonLine) ||
      EMPTY_FORM.evidenceHandlingCancellation.unlawfulReasonLine,
    article1Line:
      `Hủy bỏ Quyết định xử lý vật chứng số ${evidenceHandlingDecisionCode} ${evidenceHandlingDecisionDateLine} của ${evidenceHandlingDecisionIssuedBy}.`,
    article2Line:
      `Yêu cầu ${evidenceHandlingDecisionIssuedBy} thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự./.`,
  };
}

function normalizeFormInputs(form: Bm170Form): Bm170Form & {
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
      issuerTitle:
        cleanText(form.official.issuerTitle) || EMPTY_FORM.official.issuerTitle,
    },
    legalBasis: {
      procedureArticlesLine:
        cleanText(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    evidenceHandlingCancellation: {
      investigationAuthority: cleanText(form.evidenceHandlingCancellation.investigationAuthority),
      defendantName: cleanText(form.evidenceHandlingCancellation.defendantName),
      offenseName: cleanText(form.evidenceHandlingCancellation.offenseName),
      offenseLegalLine: cleanText(form.evidenceHandlingCancellation.offenseLegalLine),
      caseInitiationCode: cleanText(form.evidenceHandlingCancellation.caseInitiationCode),
      caseInitiationDateLine: cleanText(form.evidenceHandlingCancellation.caseInitiationDateLine),
      defendantInitiationCode: cleanText(form.evidenceHandlingCancellation.defendantInitiationCode),
      defendantInitiationDateLine: cleanText(form.evidenceHandlingCancellation.defendantInitiationDateLine),
      evidenceHandlingDecisionCode: cleanText(form.evidenceHandlingCancellation.evidenceHandlingDecisionCode),
      evidenceHandlingDecisionDateLine: cleanText(form.evidenceHandlingCancellation.evidenceHandlingDecisionDateLine),
      evidenceHandlingDecisionIssuedBy: cleanText(form.evidenceHandlingCancellation.evidenceHandlingDecisionIssuedBy),
      caseInitiationLine: cleanText(form.evidenceHandlingCancellation.caseInitiationLine),
      defendantInitiationLine: cleanText(form.evidenceHandlingCancellation.defendantInitiationLine),
      evidenceHandlingDecisionReviewLine: cleanText(form.evidenceHandlingCancellation.evidenceHandlingDecisionReviewLine),
      unlawfulReasonLine: cleanText(form.evidenceHandlingCancellation.unlawfulReasonLine),
      article1Line: cleanText(form.evidenceHandlingCancellation.article1Line),
      article2Line: cleanText(form.evidenceHandlingCancellation.article2Line),
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

function buildFormFromPayload(payload: unknown): Bm170Form {
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
    pickString(formInputs, payload, "agency.issuePlace", EMPTY_FORM.document.issuePlace),
  );

  const issueDateText = hasSavedFormInputs
    ? normalizeDisplayDate(
        pickString(
          formInputs,
          payload,
          "document.issueDateText",
          pickString(formInputs, payload, "document.issueDate", todayDisplayDateText()),
        ),
      )
    : todayDisplayDateText();

  const issueLine = hasSavedFormInputs
    ? pickString(
        formInputs,
        payload,
        "document.issuePlaceAndDateLine",
        issuePlaceAndDateLine(issuePlace, issueDateText),
      )
    : issuePlaceAndDateLine(issuePlace, issueDateText);

  return normalizeFormInputs({
    agency: {
      parentName: pickString(formInputs, payload, "agency.parentName", EMPTY_FORM.agency.parentName),
      name: pickString(formInputs, payload, "agency.name", EMPTY_FORM.agency.name),
      bodyName: pickString(formInputs, payload, "agency.bodyName", EMPTY_FORM.agency.bodyName),
      shortName: pickString(formInputs, payload, "agency.shortName", EMPTY_FORM.agency.shortName),
    },
    document: {
      documentCode: pickString(formInputs, payload, "document.documentCode", EMPTY_FORM.document.documentCode),
      issuePlace,
      issueDateText,
      issuePlaceAndDateLine: issueLine,
    },
    official: {
      issuerTitle: pickString(formInputs, payload, "official.issuerTitle", EMPTY_FORM.official.issuerTitle),
    },
    legalBasis: {
      procedureArticlesLine: pickString(
        formInputs,
        payload,
        "legalBasis.procedureArticlesLine",
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
    },
    evidenceHandlingCancellation: {
      investigationAuthority: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.investigationAuthority",
        EMPTY_FORM.evidenceHandlingCancellation.investigationAuthority,
      ),
      defendantName: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.defendantName",
        EMPTY_FORM.evidenceHandlingCancellation.defendantName,
      ),
      offenseName: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.offenseName",
        EMPTY_FORM.evidenceHandlingCancellation.offenseName,
      ),
      offenseLegalLine: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.offenseLegalLine",
        EMPTY_FORM.evidenceHandlingCancellation.offenseLegalLine,
      ),
      caseInitiationCode: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.caseInitiationCode",
        EMPTY_FORM.evidenceHandlingCancellation.caseInitiationCode,
      ),
      caseInitiationDateLine: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.caseInitiationDateLine",
        EMPTY_FORM.evidenceHandlingCancellation.caseInitiationDateLine,
      ),
      defendantInitiationCode: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.defendantInitiationCode",
        EMPTY_FORM.evidenceHandlingCancellation.defendantInitiationCode,
      ),
      defendantInitiationDateLine: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.defendantInitiationDateLine",
        EMPTY_FORM.evidenceHandlingCancellation.defendantInitiationDateLine,
      ),
      evidenceHandlingDecisionCode: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.evidenceHandlingDecisionCode",
        EMPTY_FORM.evidenceHandlingCancellation.evidenceHandlingDecisionCode,
      ),
      evidenceHandlingDecisionDateLine: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.evidenceHandlingDecisionDateLine",
        EMPTY_FORM.evidenceHandlingCancellation.evidenceHandlingDecisionDateLine,
      ),
      evidenceHandlingDecisionIssuedBy: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.evidenceHandlingDecisionIssuedBy",
        pickString(
          formInputs,
          payload,
          "evidenceHandlingCancellation.investigationAuthority",
          EMPTY_FORM.evidenceHandlingCancellation.evidenceHandlingDecisionIssuedBy,
        ),
      ),
      caseInitiationLine: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.caseInitiationLine",
        EMPTY_FORM.evidenceHandlingCancellation.caseInitiationLine,
      ),
      defendantInitiationLine: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.defendantInitiationLine",
        EMPTY_FORM.evidenceHandlingCancellation.defendantInitiationLine,
      ),
      evidenceHandlingDecisionReviewLine: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.evidenceHandlingDecisionReviewLine",
        EMPTY_FORM.evidenceHandlingCancellation.evidenceHandlingDecisionReviewLine,
      ),
      unlawfulReasonLine: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.unlawfulReasonLine",
        EMPTY_FORM.evidenceHandlingCancellation.unlawfulReasonLine,
      ),
      article1Line: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.article1Line",
        EMPTY_FORM.evidenceHandlingCancellation.article1Line,
      ),
      article2Line: pickString(
        formInputs,
        payload,
        "evidenceHandlingCancellation.article2Line",
        EMPTY_FORM.evidenceHandlingCancellation.article2Line,
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
      signMode: pickString(formInputs, payload, "signature.signMode", EMPTY_FORM.signature.signMode),
      positionTitle: pickString(formInputs, payload, "signature.positionTitle", EMPTY_FORM.signature.positionTitle),
      signerName: pickString(formInputs, payload, "signature.signerName", EMPTY_FORM.signature.signerName),
    },
    updatedByName: pickString(formInputs, payload, "updatedByName", DEFAULT_SIGNER_NAME),
    renderedByName: pickString(formInputs, payload, "renderedByName", DEFAULT_SIGNER_NAME),
    convertedByName: pickString(formInputs, payload, "convertedByName", DEFAULT_SIGNER_NAME),
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        value={value}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>{label}</span>
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

export function Bm170FormInputsPanel({
  documentId,
  onSaved,
}: Bm170FormInputsPanelProps) {
  const [form, setForm] = useState<Bm170Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-170 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-170.");
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

  function updateCancellation<K extends keyof EvidenceHandlingCancellationForm>(
    key: K,
    value: EvidenceHandlingCancellationForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const previousAuthority = cleanText(
        current.evidenceHandlingCancellation.investigationAuthority,
      );

      const nextCancellation = {
        ...current.evidenceHandlingCancellation,
        [key]: value,
      };

      if (key === "investigationAuthority") {
        const previousIssuedBy = cleanText(
          current.evidenceHandlingCancellation.evidenceHandlingDecisionIssuedBy,
        );

        if (!previousIssuedBy || previousIssuedBy === previousAuthority) {
          nextCancellation.evidenceHandlingDecisionIssuedBy = value;
        }
      }

      const nextForm: Bm170Form = {
        ...current,
        evidenceHandlingCancellation: nextCancellation,
        recipients:
          key === "investigationAuthority"
            ? { ...current.recipients, primaryLine: cleanText(value) }
            : current.recipients,
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        evidenceHandlingCancellation: {
          ...nextForm.evidenceHandlingCancellation,
          ...buildGeneratedLines(nextForm),
        },
      };
    });
  }

  function updateEvidenceDecisionIssuedBy(value: string) {
    setForm((current) => {
      const nextForm: Bm170Form = {
        ...current,
        evidenceHandlingCancellation: {
          ...current.evidenceHandlingCancellation,
          evidenceHandlingDecisionIssuedBy: value,
        },
        recipients: {
          ...current.recipients,
          primaryLine: value,
        },
      };

      return {
        ...nextForm,
        evidenceHandlingCancellation: {
          ...nextForm.evidenceHandlingCancellation,
          ...buildGeneratedLines(nextForm),
        },
      };
    });
  }

  function updateRecipients<K extends keyof RecipientsForm>(
    key: K,
    value: RecipientsForm[K],
  ) {
    setForm((current) => ({
      ...current,
      recipients: { ...current.recipients, [key]: value },
    }));
  }

  function updateSignature<K extends keyof SignatureForm>(
    key: K,
    value: SignatureForm[K],
  ) {
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
      evidenceHandlingCancellation: {
        ...current.evidenceHandlingCancellation,
        ...buildGeneratedLines(current),
      },
      recipients: {
        ...current.recipients,
        primaryLine:
          current.evidenceHandlingCancellation.evidenceHandlingDecisionIssuedBy ||
          current.evidenceHandlingCancellation.investigationAuthority,
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-170.");
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
    setMessage("Đang lưu formInputs BM-170...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-170",
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
          result.text || `Không lưu được BM-170. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-170. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-170 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-170
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Quyết định hủy bỏ Quyết định xử lý vật chứng
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-170. Dữ liệu chính nằm trong nhóm{" "}
          <span className="font-semibold">evidenceHandlingCancellation</span>.
          Khi đổi cơ quan điều tra hoặc cơ quan ban hành Quyết định xử lý vật
          chứng, các dòng căn cứ, Điều 1, Điều 2 và nơi nhận sẽ tự đồng bộ.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-170
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại căn cứ / Điều 1 / Điều 2
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-170"}
          </button>
        </div>

        <div className="mt-4">
          <StatusMessage status={status} message={message} />
        </div>
      </section>

      <SectionCard
        title="1. Dữ liệu đồng bộ chính"
        description="Các ô này là nguồn dữ liệu để tự sinh lại toàn bộ căn cứ, Điều 1, Điều 2 và nơi nhận."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:col-span-2">
            <p className="mb-3 text-sm font-bold text-blue-950">
              Cơ quan điều tra / cơ quan thực hiện quyết định - đồng bộ toàn biểu mẫu
            </p>
            <BmFieldText label="Cơ quan điều tra" value={form.evidenceHandlingCancellation.investigationAuthority} onChange={(value) =>
                updateCancellation("investigationAuthority", value, true)
              } fullWidth />
          </div>

          <BmFieldText label="Số Quyết định xử lý vật chứng bị hủy" value={form.evidenceHandlingCancellation.evidenceHandlingDecisionCode} onChange={(value) =>
              updateCancellation("evidenceHandlingDecisionCode", value, true)
            } fullWidth />
          <BmFieldText label="Ngày Quyết định xử lý vật chứng" value={form.evidenceHandlingCancellation.evidenceHandlingDecisionDateLine} onChange={(value) =>
              updateCancellation("evidenceHandlingDecisionDateLine", value, true)
            } fullWidth />
          <div className="md:col-span-2">
            <BmFieldText label="Cơ quan ban hành Quyết định xử lý vật chứng" value={form.evidenceHandlingCancellation.evidenceHandlingDecisionIssuedBy} onChange={updateEvidenceDecisionIssuedBy} fullWidth />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Cơ quan / văn bản">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateAgency("parentName", value)} fullWidth />
          <BmFieldText label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateAgency("name", value)} fullWidth />
          <BmFieldText label="Tên cơ quan trong thân văn bản" value={form.agency.bodyName} onChange={(value) => updateAgency("bodyName", value)} fullWidth />
          <BmFieldText label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateAgency("shortName", value)} fullWidth />
          <BmFieldText label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} fullWidth />
          <BmFieldText label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} fullWidth />
          <BmFieldText label="Ngày ban hành DD/MM/YYYY" value={form.document.issueDateText} onChange={(value) => updateDocument("issueDateText", value)} fullWidth />
          <BmFieldText label="Dòng địa danh, ngày tháng" value={form.document.issuePlaceAndDateLine} onChange={(value) => updateDocument("issuePlaceAndDateLine", value)} fullWidth />
        </div>
      </SectionCard>

      <SectionCard title="3. Chủ thể ban hành / căn cứ">
        <div className="grid gap-4">
          <BmFieldText label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={(value) => updateOfficial("issuerTitle", value)} fullWidth />
          <TextAreaField label="Căn cứ BLTTHS" value={form.legalBasis.procedureArticlesLine} onChange={(value) => updateLegalBasis("procedureArticlesLine", value)} rows={2} />
        </div>
      </SectionCard>

      <SectionCard title="4. Thông tin vụ án / bị can">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Bị can" value={form.evidenceHandlingCancellation.defendantName} onChange={(value) => updateCancellation("defendantName", value, true)} fullWidth />
          <BmFieldText label="Tội danh" value={form.evidenceHandlingCancellation.offenseName} onChange={(value) => updateCancellation("offenseName", value, true)} fullWidth />
          <BmFieldText label="Điều luật tội danh" value={form.evidenceHandlingCancellation.offenseLegalLine} onChange={(value) => updateCancellation("offenseLegalLine", value, true)} fullWidth />
          <BmFieldText label="Số QĐ khởi tố vụ án" value={form.evidenceHandlingCancellation.caseInitiationCode} onChange={(value) => updateCancellation("caseInitiationCode", value, true)} fullWidth />
          <BmFieldText label="Ngày QĐ khởi tố vụ án" value={form.evidenceHandlingCancellation.caseInitiationDateLine} onChange={(value) => updateCancellation("caseInitiationDateLine", value, true)} fullWidth />
          <BmFieldText label="Số QĐ khởi tố bị can" value={form.evidenceHandlingCancellation.defendantInitiationCode} onChange={(value) => updateCancellation("defendantInitiationCode", value, true)} fullWidth />
          <BmFieldText label="Ngày QĐ khởi tố bị can" value={form.evidenceHandlingCancellation.defendantInitiationDateLine} onChange={(value) => updateCancellation("defendantInitiationDateLine", value, true)} fullWidth />
        </div>
      </SectionCard>

      <SectionCard title="5. Nội dung quyết định">
        <div className="grid gap-4">
          <TextAreaField label="Căn cứ khởi tố vụ án" value={form.evidenceHandlingCancellation.caseInitiationLine} onChange={(value) => updateCancellation("caseInitiationLine", value)} rows={3} />
          <TextAreaField label="Căn cứ khởi tố bị can" value={form.evidenceHandlingCancellation.defendantInitiationLine} onChange={(value) => updateCancellation("defendantInitiationLine", value)} rows={3} />
          <TextAreaField label="Xét Quyết định xử lý vật chứng" value={form.evidenceHandlingCancellation.evidenceHandlingDecisionReviewLine} onChange={(value) => updateCancellation("evidenceHandlingDecisionReviewLine", value)} rows={2} />
          <TextAreaField label="Nhận thấy" value={form.evidenceHandlingCancellation.unlawfulReasonLine} onChange={(value) => updateCancellation("unlawfulReasonLine", value)} rows={2} />
          <TextAreaField label="Điều 1" value={form.evidenceHandlingCancellation.article1Line} onChange={(value) => updateCancellation("article1Line", value)} rows={3} />
          <TextAreaField label="Điều 2" value={form.evidenceHandlingCancellation.article2Line} onChange={(value) => updateCancellation("article2Line", value)} rows={3} />
        </div>
      </SectionCard>

      <SectionCard title="6. Nơi nhận / chữ ký">
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
          <p><span className="font-bold">Số:</span> {preview.document.documentCode}</p>
          <p><span className="font-bold">Ngày:</span> {preview.document.issuePlaceAndDateLine}</p>
          <p><span className="font-bold">Cơ quan điều tra:</span> {preview.evidenceHandlingCancellation.investigationAuthority}</p>
          <p><span className="font-bold">QĐ xử lý vật chứng:</span> {preview.evidenceHandlingCancellation.evidenceHandlingDecisionCode}</p>
          <p><span className="font-bold">Điều 1:</span> {preview.evidenceHandlingCancellation.article1Line}</p>
          <p><span className="font-bold">Điều 2:</span> {preview.evidenceHandlingCancellation.article2Line}</p>
          <p><span className="font-bold">Chữ ký:</span> {preview.signature.signMode} / {preview.signature.positionTitle} / {preview.signature.signerName}</p>
        </div>
      </SectionCard>
    </div>
  );
}
