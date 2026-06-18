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

type LegalBasisForm = {
  procedureArticlesLine: string;
};

type SourceSuspensionCancellationForm = {
  suspensionDecisionCode: string;
  suspensionDecisionIssueDateLine: string;
  suspensionDecisionIssuedBy: string;
  sourceProvider: string;
  caseSummary: string;
  considerationLine: string;
  article1Line: string;
  article2Line: string;
};

type RecipientsForm = {
  primaryLine: string;
  sourceProviderLine: string;
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm011Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  sourceSuspensionCancellation: SourceSuspensionCancellationForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm011FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const textareaClass =
  "min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const labelClass = "text-xs font-semibold text-slate-600";

const EMPTY_FORM: Bm011Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "11/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: getBm011TodayDisplayDate(),
    issuePlaceAndDateLine: issuePlaceAndDateLine("TP. Hồ Chí Minh", getBm011TodayDisplayDate()),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 148, 149, 159 và 160 của Bộ luật Tố tụng hình sự;",
  },
  sourceSuspensionCancellation: {
    suspensionDecisionCode: "11/QĐ-CSĐT",
    suspensionDecisionIssueDateLine: getBm011TodayVietnameseDateLine(),
    suspensionDecisionIssuedBy:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    sourceProvider:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    caseSummary:
      "nguồn tin về tội phạm có dấu hiệu Đánh bạc xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    considerationLine:
      "Xét thấy Quyết định tạm đình chỉ việc giải quyết nguồn tin về tội phạm số 11/QĐ-CSĐT ngày 30 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây là không có căn cứ,",
    article1Line:
      "Hủy bỏ Quyết định tạm đình chỉ việc giải quyết nguồn tin về tội phạm số 11/QĐ-CSĐT ngày 30 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây.",
    article2Line:
      "Yêu cầu Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây tiếp tục giải quyết nguồn tin về tội phạm theo quy định của Bộ luật Tố tụng hình sự./.",
  },
  recipients: {
    primaryLine: "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    sourceProviderLine:
      "Cơ quan, tổ chức, cá nhân đã cung cấp nguồn tin về tội phạm",
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

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getBm011TodayParts(): {
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

function getBm011TodayDisplayDate(): string {
  const today = getBm011TodayParts();
  return `${today.day}/${today.month}/${today.year}`;
}

function getBm011TodayVietnameseDateLine(): string {
  const today = getBm011TodayParts();
  return `ngày ${Number(today.day)} tháng ${Number(today.month)} năm ${today.year}`;
}

function parseBm011DateParts(value: string): {
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

  return getBm011TodayParts();
}

function buildBm011DisplayDate(day: string, month: string, year: string): string {
  return `${pad2(Number(day))}/${pad2(Number(month))}/${year}`;
}

function buildBm011VietnameseDateLine(day: string, month: string, year: string): string {
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function normalizeBm011IssueDate(value: string): string {
  const raw = cleanText(value);

  if (!raw || raw === "31/05/2026" || raw === "2026-05-31") {
    return getBm011TodayDisplayDate();
  }

  return normalizeDisplayDate(raw) || getBm011TodayDisplayDate();
}

function normalizeBm011SuspensionDateLine(value: string): string {
  const raw = cleanText(value);

  if (
    !raw ||
    raw === "ngày 30 tháng 5 năm 2026" ||
    raw === "30/05/2026" ||
    raw === "2026-05-30"
  ) {
    return getBm011TodayVietnameseDateLine();
  }

  const parsed = parseBm011DateParts(raw);
  return buildBm011VietnameseDateLine(parsed.day, parsed.month, parsed.year);
}

function hasBm011OldSeedDate(value: string): boolean {
  const raw = cleanText(value);

  return (
    raw.includes("ngày 30 tháng 5 năm 2026") ||
    raw.includes("ngày 31 tháng 5 năm 2026") ||
    raw.includes("30/05/2026") ||
    raw.includes("31/05/2026") ||
    raw.includes("2026-05-30") ||
    raw.includes("2026-05-31")
  );
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

function buildGeneratedLines(form: Bm011Form): Pick<
  SourceSuspensionCancellationForm,
  "considerationLine" | "article1Line" | "article2Line"
> {
  const code =
    cleanText(form.sourceSuspensionCancellation.suspensionDecisionCode) ||
    EMPTY_FORM.sourceSuspensionCancellation.suspensionDecisionCode;

  const dateLine =
    cleanText(form.sourceSuspensionCancellation.suspensionDecisionIssueDateLine) ||
    EMPTY_FORM.sourceSuspensionCancellation.suspensionDecisionIssueDateLine;

  const issuedBy =
    cleanText(form.sourceSuspensionCancellation.suspensionDecisionIssuedBy) ||
    EMPTY_FORM.sourceSuspensionCancellation.suspensionDecisionIssuedBy;

  const sourceProvider =
    cleanText(form.sourceSuspensionCancellation.sourceProvider) || issuedBy;

  return {
    considerationLine: `Xét thấy Quyết định tạm đình chỉ việc giải quyết nguồn tin về tội phạm số ${code} ${dateLine} của ${issuedBy} là không có căn cứ,`,
    article1Line: `Hủy bỏ Quyết định tạm đình chỉ việc giải quyết nguồn tin về tội phạm số ${code} ${dateLine} của ${issuedBy}.`,
    article2Line: `Yêu cầu ${sourceProvider} tiếp tục giải quyết nguồn tin về tội phạm theo quy định của Bộ luật Tố tụng hình sự./.`,
  };
}

function normalizeFormInputs(form: Bm011Form): Bm011Form & {
  document: DocumentForm & { issueDate: string };
} {
  const normalizedDate = normalizeBm011IssueDate(form.document.issueDateText);
  const nextIssueLine = issuePlaceAndDateLine(
    form.document.issuePlace,
    normalizedDate,
  );

  const normalizedSuspensionDateLine = normalizeBm011SuspensionDateLine(
    form.sourceSuspensionCancellation.suspensionDecisionIssueDateLine,
  );

  const generatedLines = buildGeneratedLines({
    ...form,
    sourceSuspensionCancellation: {
      ...form.sourceSuspensionCancellation,
      suspensionDecisionIssueDateLine: normalizedSuspensionDateLine,
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
    official: {
      issuerTitle: cleanText(form.official.issuerTitle),
    },
    legalBasis: {
      procedureArticlesLine:
        cleanText(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    sourceSuspensionCancellation: {
      suspensionDecisionCode: cleanText(
        form.sourceSuspensionCancellation.suspensionDecisionCode,
      ),
      suspensionDecisionIssueDateLine: normalizedSuspensionDateLine,
      suspensionDecisionIssuedBy: cleanText(
        form.sourceSuspensionCancellation.suspensionDecisionIssuedBy,
      ),
      sourceProvider: cleanText(form.sourceSuspensionCancellation.sourceProvider),
      caseSummary: cleanText(form.sourceSuspensionCancellation.caseSummary),
      considerationLine: hasBm011OldSeedDate(
        form.sourceSuspensionCancellation.considerationLine,
      )
        ? generatedLines.considerationLine
        : cleanText(form.sourceSuspensionCancellation.considerationLine),
      article1Line: hasBm011OldSeedDate(
        form.sourceSuspensionCancellation.article1Line,
      )
        ? generatedLines.article1Line
        : ensureSentence(form.sourceSuspensionCancellation.article1Line),
      article2Line: cleanText(form.sourceSuspensionCancellation.article2Line),
    },
    recipients: {
      primaryLine: stripRecipientLine(form.recipients.primaryLine),
      sourceProviderLine: stripRecipientLine(form.recipients.sourceProviderLine),
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

function buildFormFromPayload(payload: unknown): Bm011Form {
  const formInputs = firstExistingRecord(payload, [
    "formInputs",
    "renderPayloadSnapshot.formInputs",
    "metadata.formInputs",
  ]);

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
      issuePlaceAndDateLine: pickString(
        formInputs,
        payload,
        "document.issuePlaceAndDateLine",
        EMPTY_FORM.document.issuePlaceAndDateLine,
      ),
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
    sourceSuspensionCancellation: {
      suspensionDecisionCode: pickString(
        formInputs,
        payload,
        "sourceSuspensionCancellation.suspensionDecisionCode",
        EMPTY_FORM.sourceSuspensionCancellation.suspensionDecisionCode,
      ),
      suspensionDecisionIssueDateLine: pickString(
        formInputs,
        payload,
        "sourceSuspensionCancellation.suspensionDecisionIssueDateLine",
        EMPTY_FORM.sourceSuspensionCancellation.suspensionDecisionIssueDateLine,
      ),
      suspensionDecisionIssuedBy: pickString(
        formInputs,
        payload,
        "sourceSuspensionCancellation.suspensionDecisionIssuedBy",
        EMPTY_FORM.sourceSuspensionCancellation.suspensionDecisionIssuedBy,
      ),
      sourceProvider: pickString(
        formInputs,
        payload,
        "sourceSuspensionCancellation.sourceProvider",
        EMPTY_FORM.sourceSuspensionCancellation.sourceProvider,
      ),
      caseSummary: pickString(
        formInputs,
        payload,
        "sourceSuspensionCancellation.caseSummary",
        EMPTY_FORM.sourceSuspensionCancellation.caseSummary,
      ),
      considerationLine: pickString(
        formInputs,
        payload,
        "sourceSuspensionCancellation.considerationLine",
        EMPTY_FORM.sourceSuspensionCancellation.considerationLine,
      ),
      article1Line: pickString(
        formInputs,
        payload,
        "sourceSuspensionCancellation.article1Line",
        EMPTY_FORM.sourceSuspensionCancellation.article1Line,
      ),
      article2Line: pickString(
        formInputs,
        payload,
        "sourceSuspensionCancellation.article2Line",
        EMPTY_FORM.sourceSuspensionCancellation.article2Line,
      ),
    },
    recipients: {
      primaryLine: pickString(
        formInputs,
        payload,
        "recipients.primaryLine",
        EMPTY_FORM.recipients.primaryLine,
      ),
      sourceProviderLine: pickString(
        formInputs,
        payload,
        "recipients.sourceProviderLine",
        EMPTY_FORM.recipients.sourceProviderLine,
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

function Bm011DateSelectField({
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
  const parsed = parseBm011DateParts(value);

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
        ? buildBm011VietnameseDateLine(next.day, next.month, next.year)
        : buildBm011DisplayDate(next.day, next.month, next.year);

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

export function Bm011FormInputsPanel({
  documentId,
  onSaved,
}: Bm011FormInputsPanelProps) {
  const [form, setForm] = useState<Bm011Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-011 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-011.");
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

  function updateCancellation<K extends keyof SourceSuspensionCancellationForm>(
    key: K,
    value: SourceSuspensionCancellationForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        sourceSuspensionCancellation: {
          ...current.sourceSuspensionCancellation,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        sourceSuspensionCancellation: {
          ...nextForm.sourceSuspensionCancellation,
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
      sourceSuspensionCancellation: {
        ...current.sourceSuspensionCancellation,
        ...buildGeneratedLines(current),
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-011.");
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
    setMessage("Đang lưu formInputs BM-011...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-011",
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
          result.text || `Không lưu được BM-011. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-011. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-011 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-011" form={form} onApply={(next) => setForm(next as typeof form)} />
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-011
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Hủy bỏ Quyết định tạm đình chỉ việc giải quyết nguồn tin về tội phạm
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-011. Dữ liệu chính được lưu vào nhóm{" "}
          <span className="font-semibold">sourceSuspensionCancellation</span>,
          gồm căn cứ hủy bỏ, Điều 1, Điều 2, nơi nhận và chữ ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-011
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại xét thấy / Điều 1 / Điều 2
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-011"}
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
            label="Số quyết định"
            value={form.document.documentCode}
            onChange={(value) => updateDocument("documentCode", value)}
          />
          <Field
            label="Địa danh"
            value={form.document.issuePlace}
            onChange={(value) => updateDocument("issuePlace", value)}
          />
          <div className="space-y-1.5">
            <Bm011DateSelectField
              label="Ngày ban hành"
              value={form.document.issueDateText || getBm011TodayDisplayDate()}
              outputMode="display"
              onChange={(value) => updateDocument("issueDateText", value)}
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {issuePlaceAndDateLine(form.document.issuePlace, form.document.issueDateText)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Chủ thể / căn cứ tố tụng">
        <div className="grid gap-4">
          <Field
            label="Chủ thể ban hành"
            value={form.official.issuerTitle}
            onChange={(value) => updateOfficial("issuerTitle", value)}
          />
          <TextAreaField
            label="Căn cứ tố tụng"
            value={form.legalBasis.procedureArticlesLine}
            onChange={(value) => updateLegalBasis("procedureArticlesLine", value)}
            rows={2}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="3. Quyết định tạm đình chỉ bị hủy bỏ"
        description="Sửa các ô ngắn rồi bấm 'Tự sinh lại xét thấy / Điều 1 / Điều 2' nếu muốn cập nhật lại dòng dài."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Số quyết định tạm đình chỉ"
            value={form.sourceSuspensionCancellation.suspensionDecisionCode}
            onChange={(value) =>
              updateCancellation("suspensionDecisionCode", value, true)
            }
          />
          <div className="space-y-1.5">
            <Bm011DateSelectField
              label="Ngày quyết định tạm đình chỉ"
              value={
                form.sourceSuspensionCancellation.suspensionDecisionIssueDateLine ||
                getBm011TodayVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updateCancellation("suspensionDecisionIssueDateLine", value, true)
              }
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {form.sourceSuspensionCancellation.suspensionDecisionIssueDateLine}
            </p>
          </div>
          <Field
            label="Cơ quan đã ban hành quyết định tạm đình chỉ"
            value={form.sourceSuspensionCancellation.suspensionDecisionIssuedBy}
            onChange={(value) =>
              updateCancellation("suspensionDecisionIssuedBy", value, true)
            }
          />
          <Field
            label="Cơ quan được yêu cầu tiếp tục giải quyết"
            value={form.sourceSuspensionCancellation.sourceProvider}
            onChange={(value) => updateCancellation("sourceProvider", value, true)}
          />
        </div>

        <div className="mt-4">
          <TextAreaField
            label="Nguồn tin / vụ việc"
            value={form.sourceSuspensionCancellation.caseSummary}
            onChange={(value) => updateCancellation("caseSummary", value)}
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="4. Nội dung quyết định">
        <div className="grid gap-4">
          <TextAreaField
            label="Xét thấy"
            value={form.sourceSuspensionCancellation.considerationLine}
            onChange={(value) => updateCancellation("considerationLine", value)}
            rows={4}
          />
          <TextAreaField
            label="Điều 1"
            value={form.sourceSuspensionCancellation.article1Line}
            onChange={(value) => updateCancellation("article1Line", value)}
            rows={4}
          />
          <TextAreaField
            label="Điều 2"
            value={form.sourceSuspensionCancellation.article2Line}
            onChange={(value) => updateCancellation("article2Line", value)}
            rows={4}
          />
        </div>
      </SectionCard>

      <SectionCard title="5. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nơi nhận chính"
            value={form.recipients.primaryLine}
            onChange={(value) => updateRecipients("primaryLine", value)}
          />
          <Field
            label="Người/cơ quan cung cấp nguồn tin"
            value={form.recipients.sourceProviderLine}
            onChange={(value) => updateRecipients("sourceProviderLine", value)}
          />
          <Field
            label="Lưu hồ sơ"
            value={form.recipients.archiveLine}
            onChange={(value) => updateRecipients("archiveLine", value)}
          />
          <Field
            label="Chế độ ký"
            value={form.signature.signMode}
            onChange={(value) => updateSignature("signMode", value)}
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
            <span className="font-bold">Căn cứ:</span>{" "}
            {preview.legalBasis.procedureArticlesLine}
          </p>
          <p>
            <span className="font-bold">Xét thấy:</span>{" "}
            {preview.sourceSuspensionCancellation.considerationLine}
          </p>
          <p>
            <span className="font-bold">Điều 1:</span>{" "}
            {preview.sourceSuspensionCancellation.article1Line}
          </p>
          <p>
            <span className="font-bold">Điều 2:</span>{" "}
            {preview.sourceSuspensionCancellation.article2Line}
          </p>
          <p>
            <span className="font-bold">Chữ ký:</span>{" "}
            {preview.signature.signMode} / {preview.signature.positionTitle} /{" "}
            {preview.signature.signerName}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
