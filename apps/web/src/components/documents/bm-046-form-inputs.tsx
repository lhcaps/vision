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

type OfficialForm = {
  issuerTitle: string;
};

type LegalBasisForm = {
  procedureArticlesLine: string;
  juvenileJusticeLine: string;
};

type GuaranteeNonApprovalForm = {
  investigationAuthority: string;
  defendantName: string;
  offenseName: string;
  offenseLegalLine: string;
  caseInitiationCode: string;
  caseInitiationDateLine: string;
  defendantInitiationCode: string;
  defendantInitiationDateLine: string;
  guaranteeDecisionCode: string;
  guaranteeDecisionDateLine: string;
  caseInitiationLine: string;
  defendantInitiationLine: string;
  proposalReviewLine: string;
  insufficientGroundsLine: string;
  article1Line: string;
  article2Line: string;
};

type RecipientsForm = {
  investigationAuthorityLine: string;
  defendantRepresentativeLine: string;
  guarantorLine: string;
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm046Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  guaranteeNonApproval: GuaranteeNonApprovalForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm046FormInputsPanelProps = {
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

const EMPTY_FORM: Bm046Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "46/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 121 và 165 của Bộ luật Tố tụng hình sự;",
    juvenileJusticeLine:
      "Căn cứ Điều 135 của Luật Tư pháp người chưa thành niên;",
  },
  guaranteeNonApproval: {
    investigationAuthority:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    defendantName: "",
    offenseName: "",
    offenseLegalLine: "quy định tại khoản 1 Điều 321 của Bộ luật Hình sự",
    caseInitiationCode: "01/QĐ-CSĐT",
    caseInitiationDateLine: todayDateLine(),
    defendantInitiationCode: "02/QĐ-CSĐT",
    defendantInitiationDateLine: todayDateLine(),
    guaranteeDecisionCode: "03/QĐ-CSĐT",
    guaranteeDecisionDateLine: todayDateLine(),
    caseInitiationLine:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 01/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;",
    defendantInitiationLine:
      "Căn cứ Quyết định khởi tố bị can số 02/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây đối với  về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;",
    proposalReviewLine:
      "Xét hồ sơ đề nghị phê chuẩn Quyết định về việc bảo lĩnh số 03/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây;",
    insufficientGroundsLine:
      "Nhận thấy không có đủ căn cứ, điều kiện áp dụng biện pháp bảo lĩnh đối với bị can ,",
    article1Line:
      "Không phê chuẩn Quyết định về việc bảo lĩnh số 03/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây đối với bị can .",
    article2Line:
      "Yêu cầu Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.",
  },
  recipients: {
    investigationAuthorityLine:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    defendantRepresentativeLine: ", người đại diện của bị can",
    guarantorLine: "Cơ quan, tổ chức, cá nhân nhận bảo lĩnh cho bị can",
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

function buildGeneratedLines(form: Bm046Form): Partial<GuaranteeNonApprovalForm> {
  const guarantee = form.guaranteeNonApproval;

  const investigationAuthority =
    cleanText(guarantee.investigationAuthority) ||
    EMPTY_FORM.guaranteeNonApproval.investigationAuthority;

  const defendantName =
    cleanText(guarantee.defendantName) ||
    EMPTY_FORM.guaranteeNonApproval.defendantName;

  const offenseName =
    cleanText(guarantee.offenseName) ||
    EMPTY_FORM.guaranteeNonApproval.offenseName;

  const offenseLegalLine =
    cleanText(guarantee.offenseLegalLine) ||
    EMPTY_FORM.guaranteeNonApproval.offenseLegalLine;

  const caseInitiationCode =
    cleanText(guarantee.caseInitiationCode) ||
    EMPTY_FORM.guaranteeNonApproval.caseInitiationCode;

  const caseInitiationDateLine =
    cleanText(guarantee.caseInitiationDateLine) ||
    EMPTY_FORM.guaranteeNonApproval.caseInitiationDateLine;

  const defendantInitiationCode =
    cleanText(guarantee.defendantInitiationCode) ||
    EMPTY_FORM.guaranteeNonApproval.defendantInitiationCode;

  const defendantInitiationDateLine =
    cleanText(guarantee.defendantInitiationDateLine) ||
    EMPTY_FORM.guaranteeNonApproval.defendantInitiationDateLine;

  const guaranteeDecisionCode =
    cleanText(guarantee.guaranteeDecisionCode) ||
    EMPTY_FORM.guaranteeNonApproval.guaranteeDecisionCode;

  const guaranteeDecisionDateLine =
    cleanText(guarantee.guaranteeDecisionDateLine) ||
    EMPTY_FORM.guaranteeNonApproval.guaranteeDecisionDateLine;

  return {
    caseInitiationLine:
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseInitiationCode} ${caseInitiationDateLine} của ${investigationAuthority} về tội ${offenseName} ${offenseLegalLine};`,
    defendantInitiationLine:
      `Căn cứ Quyết định khởi tố bị can số ${defendantInitiationCode} ${defendantInitiationDateLine} của ${investigationAuthority} đối với ${defendantName} về tội ${offenseName} ${offenseLegalLine};`,
    proposalReviewLine:
      `Xét hồ sơ đề nghị phê chuẩn Quyết định về việc bảo lĩnh số ${guaranteeDecisionCode} ${guaranteeDecisionDateLine} của ${investigationAuthority};`,
    insufficientGroundsLine:
      `Nhận thấy không có đủ căn cứ, điều kiện áp dụng biện pháp bảo lĩnh đối với bị can ${defendantName},`,
    article1Line:
      `Không phê chuẩn Quyết định về việc bảo lĩnh số ${guaranteeDecisionCode} ${guaranteeDecisionDateLine} của ${investigationAuthority} đối với bị can ${defendantName}.`,
    article2Line:
      `Yêu cầu ${investigationAuthority} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.`,
  };
}

function normalizeFormInputs(form: Bm046Form): Bm046Form & {
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
      juvenileJusticeLine:
        cleanText(form.legalBasis.juvenileJusticeLine) ||
        EMPTY_FORM.legalBasis.juvenileJusticeLine,
    },
    guaranteeNonApproval: {
      investigationAuthority: cleanText(form.guaranteeNonApproval.investigationAuthority),
      defendantName: cleanText(form.guaranteeNonApproval.defendantName),
      offenseName: cleanText(form.guaranteeNonApproval.offenseName),
      offenseLegalLine: cleanText(form.guaranteeNonApproval.offenseLegalLine),
      caseInitiationCode: cleanText(form.guaranteeNonApproval.caseInitiationCode),
      caseInitiationDateLine: cleanText(form.guaranteeNonApproval.caseInitiationDateLine),
      defendantInitiationCode: cleanText(form.guaranteeNonApproval.defendantInitiationCode),
      defendantInitiationDateLine: cleanText(form.guaranteeNonApproval.defendantInitiationDateLine),
      guaranteeDecisionCode: cleanText(form.guaranteeNonApproval.guaranteeDecisionCode),
      guaranteeDecisionDateLine: cleanText(form.guaranteeNonApproval.guaranteeDecisionDateLine),
      caseInitiationLine: cleanText(form.guaranteeNonApproval.caseInitiationLine),
      defendantInitiationLine: cleanText(form.guaranteeNonApproval.defendantInitiationLine),
      proposalReviewLine: cleanText(form.guaranteeNonApproval.proposalReviewLine),
      insufficientGroundsLine: cleanText(form.guaranteeNonApproval.insufficientGroundsLine),
      article1Line: cleanText(form.guaranteeNonApproval.article1Line),
      article2Line: cleanText(form.guaranteeNonApproval.article2Line),
    },
    recipients: {
      investigationAuthorityLine: stripRecipientLine(form.recipients.investigationAuthorityLine),
      defendantRepresentativeLine: stripRecipientLine(form.recipients.defendantRepresentativeLine),
      guarantorLine: stripRecipientLine(form.recipients.guarantorLine),
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

function buildFormFromPayload(payload: unknown): Bm046Form {
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
      juvenileJusticeLine: pickString(
        formInputs,
        payload,
        "legalBasis.juvenileJusticeLine",
        EMPTY_FORM.legalBasis.juvenileJusticeLine,
      ),
    },
    guaranteeNonApproval: {
      investigationAuthority: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.investigationAuthority",
        EMPTY_FORM.guaranteeNonApproval.investigationAuthority,
      ),
      defendantName: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.defendantName",
        EMPTY_FORM.guaranteeNonApproval.defendantName,
      ),
      offenseName: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.offenseName",
        EMPTY_FORM.guaranteeNonApproval.offenseName,
      ),
      offenseLegalLine: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.offenseLegalLine",
        EMPTY_FORM.guaranteeNonApproval.offenseLegalLine,
      ),
      caseInitiationCode: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.caseInitiationCode",
        EMPTY_FORM.guaranteeNonApproval.caseInitiationCode,
      ),
      caseInitiationDateLine: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.caseInitiationDateLine",
        EMPTY_FORM.guaranteeNonApproval.caseInitiationDateLine,
      ),
      defendantInitiationCode: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.defendantInitiationCode",
        EMPTY_FORM.guaranteeNonApproval.defendantInitiationCode,
      ),
      defendantInitiationDateLine: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.defendantInitiationDateLine",
        EMPTY_FORM.guaranteeNonApproval.defendantInitiationDateLine,
      ),
      guaranteeDecisionCode: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.guaranteeDecisionCode",
        EMPTY_FORM.guaranteeNonApproval.guaranteeDecisionCode,
      ),
      guaranteeDecisionDateLine: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.guaranteeDecisionDateLine",
        EMPTY_FORM.guaranteeNonApproval.guaranteeDecisionDateLine,
      ),
      caseInitiationLine: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.caseInitiationLine",
        EMPTY_FORM.guaranteeNonApproval.caseInitiationLine,
      ),
      defendantInitiationLine: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.defendantInitiationLine",
        EMPTY_FORM.guaranteeNonApproval.defendantInitiationLine,
      ),
      proposalReviewLine: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.proposalReviewLine",
        EMPTY_FORM.guaranteeNonApproval.proposalReviewLine,
      ),
      insufficientGroundsLine: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.insufficientGroundsLine",
        EMPTY_FORM.guaranteeNonApproval.insufficientGroundsLine,
      ),
      article1Line: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.article1Line",
        EMPTY_FORM.guaranteeNonApproval.article1Line,
      ),
      article2Line: pickString(
        formInputs,
        payload,
        "guaranteeNonApproval.article2Line",
        EMPTY_FORM.guaranteeNonApproval.article2Line,
      ),
    },
    recipients: {
      investigationAuthorityLine: pickString(
        formInputs,
        payload,
        "recipients.investigationAuthorityLine",
        EMPTY_FORM.recipients.investigationAuthorityLine,
      ),
      defendantRepresentativeLine: pickString(
        formInputs,
        payload,
        "recipients.defendantRepresentativeLine",
        EMPTY_FORM.recipients.defendantRepresentativeLine,
      ),
      guarantorLine: pickString(
        formInputs,
        payload,
        "recipients.guarantorLine",
        EMPTY_FORM.recipients.guarantorLine,
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

export function Bm046FormInputsPanel({
  documentId,
  onSaved,
}: Bm046FormInputsPanelProps) {
  const [form, setForm] = useState<Bm046Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-046 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-046.");
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

  function updateGuarantee<K extends keyof GuaranteeNonApprovalForm>(
    key: K,
    value: GuaranteeNonApprovalForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        guaranteeNonApproval: {
          ...current.guaranteeNonApproval,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        guaranteeNonApproval: {
          ...nextForm.guaranteeNonApproval,
          ...buildGeneratedLines(nextForm),
        },
      };
    });
  }

  function updateDefendantName(value: string) {
    setForm((current) => {
      const nextForm: Bm046Form = {
        ...current,
        guaranteeNonApproval: {
          ...current.guaranteeNonApproval,
          defendantName: value,
        },
      };

      const generatedLines = buildGeneratedLines(nextForm);
      const cleanName = cleanText(value);

      return {
        ...nextForm,
        guaranteeNonApproval: {
          ...nextForm.guaranteeNonApproval,
          defendantInitiationLine:
            generatedLines.defendantInitiationLine ??
            nextForm.guaranteeNonApproval.defendantInitiationLine,
          insufficientGroundsLine:
            generatedLines.insufficientGroundsLine ??
            nextForm.guaranteeNonApproval.insufficientGroundsLine,
          article1Line:
            generatedLines.article1Line ??
            nextForm.guaranteeNonApproval.article1Line,
        },
        recipients: {
          ...nextForm.recipients,
          defendantRepresentativeLine: cleanName
            ? `${cleanName}, người đại diện của bị can`
            : "",
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
      guaranteeNonApproval: {
        ...current.guaranteeNonApproval,
        ...buildGeneratedLines(current),
      },
      recipients: {
        ...current.recipients,
        investigationAuthorityLine:
          current.guaranteeNonApproval.investigationAuthority,
        defendantRepresentativeLine:
          `${current.guaranteeNonApproval.defendantName}, người đại diện của bị can`,
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-046.");
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
    setMessage("Đang lưu formInputs BM-046...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-046",
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
          result.text || `Không lưu được BM-046. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-046. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-046 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-046
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Quyết định không phê chuẩn Quyết định về việc bảo lĩnh
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-046. Dữ liệu chính nằm trong nhóm{" "}
          <span className="font-semibold">guaranteeNonApproval</span>, gồm
          quyết định khởi tố vụ án, khởi tố bị can, hồ sơ đề nghị bảo lĩnh,
          lý do không đủ căn cứ, Điều 1, Điều 2, nơi nhận và chữ ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-046
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
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-046"}
          </button>
        </div>

        <div className="mt-4">
          <StatusMessage status={status} message={message} />
        </div>
      </section>

      <SectionCard
        title="1. Cơ quan / văn bản"
        description="Nếu chưa có dữ liệu đã lưu, ngày ban hành tự lấy ngày hôm nay."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateAgency("parentName", value)} />
          <Field label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateAgency("name", value)} />
          <Field label="Tên cơ quan trong thân văn bản" value={form.agency.bodyName} onChange={(value) => updateAgency("bodyName", value)} />
          <Field label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateAgency("shortName", value)} />
          <Field label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} />
          <Field label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} />
          <Field label="Ngày ban hành DD/MM/YYYY" value={form.document.issueDateText} onChange={(value) => updateDocument("issueDateText", value)} />
          <Field label="Dòng địa danh, ngày tháng" value={form.document.issuePlaceAndDateLine} onChange={(value) => updateDocument("issuePlaceAndDateLine", value)} />
        </div>
      </SectionCard>

      <SectionCard title="2. Chủ thể ban hành / căn cứ">
        <div className="grid gap-4">
          <Field label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={(value) => updateOfficial("issuerTitle", value)} />
          <TextAreaField label="Căn cứ BLTTHS" value={form.legalBasis.procedureArticlesLine} onChange={(value) => updateLegalBasis("procedureArticlesLine", value)} rows={2} />
          <TextAreaField label="Căn cứ Luật Tư pháp người chưa thành niên" value={form.legalBasis.juvenileJusticeLine} onChange={(value) => updateLegalBasis("juvenileJusticeLine", value)} rows={2} />
        </div>
      </SectionCard>

      <SectionCard title="3. Thông tin vụ án / bị can / bảo lĩnh">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cơ quan điều tra" value={form.guaranteeNonApproval.investigationAuthority} onChange={(value) => updateGuarantee("investigationAuthority", value, true)} />
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 md:col-span-2">
            <div className="mb-3">
              <p className="text-sm font-bold text-blue-950">
                Tên bị can - dữ liệu đồng bộ toàn biểu mẫu
              </p>
              <p className="mt-1 text-xs leading-5 text-blue-800">
                Nhập tên ở ô này. Hệ thống sẽ tự cập nhật các dòng căn cứ khởi tố bị can,
                nhận thấy không đủ căn cứ, Điều 1 và nơi nhận.
              </p>
            </div>
            <Field
              label="Tên bị can"
              value={form.guaranteeNonApproval.defendantName}
              onChange={updateDefendantName}
            />
          </div>
          <Field label="Tội danh" value={form.guaranteeNonApproval.offenseName} onChange={(value) => updateGuarantee("offenseName", value, true)} />
          <Field label="Điều luật tội danh" value={form.guaranteeNonApproval.offenseLegalLine} onChange={(value) => updateGuarantee("offenseLegalLine", value, true)} />
          <Field label="Số QĐ khởi tố vụ án" value={form.guaranteeNonApproval.caseInitiationCode} onChange={(value) => updateGuarantee("caseInitiationCode", value, true)} />
          <Field label="Ngày QĐ khởi tố vụ án" value={form.guaranteeNonApproval.caseInitiationDateLine} onChange={(value) => updateGuarantee("caseInitiationDateLine", value, true)} />
          <Field label="Số QĐ khởi tố bị can" value={form.guaranteeNonApproval.defendantInitiationCode} onChange={(value) => updateGuarantee("defendantInitiationCode", value, true)} />
          <Field label="Ngày QĐ khởi tố bị can" value={form.guaranteeNonApproval.defendantInitiationDateLine} onChange={(value) => updateGuarantee("defendantInitiationDateLine", value, true)} />
          <Field label="Số QĐ bảo lĩnh" value={form.guaranteeNonApproval.guaranteeDecisionCode} onChange={(value) => updateGuarantee("guaranteeDecisionCode", value, true)} />
          <Field label="Ngày QĐ bảo lĩnh" value={form.guaranteeNonApproval.guaranteeDecisionDateLine} onChange={(value) => updateGuarantee("guaranteeDecisionDateLine", value, true)} />
        </div>
      </SectionCard>

      <SectionCard title="4. Nội dung quyết định">
        <div className="grid gap-4">
          <TextAreaField label="Căn cứ khởi tố vụ án" value={form.guaranteeNonApproval.caseInitiationLine} onChange={(value) => updateGuarantee("caseInitiationLine", value)} rows={3} />
          <TextAreaField label="Căn cứ khởi tố bị can" value={form.guaranteeNonApproval.defendantInitiationLine} onChange={(value) => updateGuarantee("defendantInitiationLine", value)} rows={3} />
          <TextAreaField label="Xét hồ sơ đề nghị" value={form.guaranteeNonApproval.proposalReviewLine} onChange={(value) => updateGuarantee("proposalReviewLine", value)} rows={3} />
          <TextAreaField label="Nhận thấy không đủ căn cứ" value={form.guaranteeNonApproval.insufficientGroundsLine} onChange={(value) => updateGuarantee("insufficientGroundsLine", value)} rows={2} />
          <TextAreaField label="Điều 1" value={form.guaranteeNonApproval.article1Line} onChange={(value) => updateGuarantee("article1Line", value)} rows={3} />
          <TextAreaField label="Điều 2" value={form.guaranteeNonApproval.article2Line} onChange={(value) => updateGuarantee("article2Line", value)} rows={3} />
        </div>
      </SectionCard>

      <SectionCard title="5. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cơ quan điều tra" value={form.recipients.investigationAuthorityLine} onChange={(value) => updateRecipients("investigationAuthorityLine", value)} />
          <Field label="Bị can / người đại diện" value={form.recipients.defendantRepresentativeLine} onChange={(value) => updateRecipients("defendantRepresentativeLine", value)} />
          <Field label="Cơ quan/tổ chức/cá nhân nhận bảo lĩnh" value={form.recipients.guarantorLine} onChange={(value) => updateRecipients("guarantorLine", value)} />
          <Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateRecipients("archiveLine", value)} />
          <Field label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateSignature("signMode", value)} />
          <Field label="Chức vụ người ký" value={form.signature.positionTitle} onChange={(value) => updateSignature("positionTitle", value)} />
          <Field label="Người ký" value={form.signature.signerName} onChange={(value) => updateSignature("signerName", value)} />
        </div>
      </SectionCard>

      <SectionCard title="Preview dữ liệu sẽ lưu">
        <div className="space-y-3 rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          <p><span className="font-bold">Số:</span> {preview.document.documentCode}</p>
          <p><span className="font-bold">Ngày:</span> {preview.document.issuePlaceAndDateLine}</p>
          <p><span className="font-bold">Bị can:</span> {preview.guaranteeNonApproval.defendantName}</p>
          <p><span className="font-bold">Cơ quan điều tra:</span> {preview.guaranteeNonApproval.investigationAuthority}</p>
          <p><span className="font-bold">Điều 1:</span> {preview.guaranteeNonApproval.article1Line}</p>
          <p><span className="font-bold">Điều 2:</span> {preview.guaranteeNonApproval.article2Line}</p>
          <p><span className="font-bold">Chữ ký:</span> {preview.signature.signMode} / {preview.signature.positionTitle} / {preview.signature.signerName}</p>
        </div>
      </SectionCard>
    </div>
  );
}
