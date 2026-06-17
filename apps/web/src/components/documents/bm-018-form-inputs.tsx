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
};

type CaseInitiationChangeRequestForm = {
  investigationAuthority: string;
  oldDecisionCode: string;
  oldDecisionDateLine: string;
  currentOffenseName: string;
  newOffenseName: string;

  considerationLine: string;
  currentOffenseLegalLine: string;
  changeGroundLine: string;
  newOffenseLegalLine: string;

  requestAuthorityLine: string;
  requestChangeDecisionLine: string;
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

type Bm018Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  caseInitiationChangeRequest: CaseInitiationChangeRequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm018FormInputsPanelProps = {
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

function getBm018TodayParts(): {
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

function buildBm018DisplayDate(day: string, month: string, year: string): string {
  return `${pad2(Number(day))}/${pad2(Number(month))}/${year}`;
}

function buildBm018VietnameseDateLine(day: string, month: string, year: string): string {
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function getBm018TodayDisplayDate(): string {
  const today = getBm018TodayParts();
  return buildBm018DisplayDate(today.day, today.month, today.year);
}

function getBm018TodayVietnameseDateLine(): string {
  const today = getBm018TodayParts();
  return buildBm018VietnameseDateLine(today.day, today.month, today.year);
}

function parseBm018DateParts(value: string): {
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

  return getBm018TodayParts();
}

function normalizeBm018DisplayDate(value: string): string {
  const raw = cleanText(value);

  if (!raw || raw.includes("...")) {
    return getBm018TodayDisplayDate();
  }

  const parsed = parseBm018DateParts(raw);
  return buildBm018DisplayDate(parsed.day, parsed.month, parsed.year);
}

function normalizeBm018VietnameseDateLine(value: string): string {
  const raw = cleanText(value);

  if (!raw || raw.includes("...")) {
    return getBm018TodayVietnameseDateLine();
  }

  const parsed = parseBm018DateParts(raw);
  return buildBm018VietnameseDateLine(parsed.day, parsed.month, parsed.year);
}

function Bm018DateSelectField({
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
  const parsed = parseBm018DateParts(value);

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
        ? buildBm018VietnameseDateLine(next.day, next.month, next.year)
        : buildBm018DisplayDate(next.day, next.month, next.year);

    onChange(nextValue);
  };

  const selectClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </span>

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
const EMPTY_FORM: Bm018Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "18/YC-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 156, 161 và 165 của Bộ luật Tố tụng hình sự;",
  },
  caseInitiationChangeRequest: {
    investigationAuthority:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    oldDecisionCode: "23/QĐ-CSĐT",
    oldDecisionDateLine: todayDateLine(),
    currentOffenseName: "Đánh bạc",
    newOffenseName: "Tổ chức đánh bạc",

    considerationLine:
      "Xét Quyết định khởi tố vụ án hình sự số 23/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây về tội Đánh bạc",
    currentOffenseLegalLine:
      "quy định tại khoản 1 Điều 321 của Bộ luật Hình sự",
    changeGroundLine:
      "là không đúng với hành vi phạm tội xảy ra, có căn cứ xác định dấu hiệu của tội Tổ chức đánh bạc",
    newOffenseLegalLine:
      "quy định tại khoản 1 Điều 322 của Bộ luật Hình sự",

    requestAuthorityLine:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    requestChangeDecisionLine:
      "ra Quyết định thay đổi Quyết định khởi tố vụ án hình sự số 23/QĐ-CSĐT " +
      todayDateLine() +
      " và khởi tố vụ án hình sự về tội Tổ chức đánh bạc",
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

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3];

  return `${cleanText(issuePlace)}, ngày ${day} tháng ${month} năm ${year}`;
}

function stripRecipientLine(value: string): string {
  return cleanText(value)
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function buildGeneratedLines(form: Bm018Form): Partial<CaseInitiationChangeRequestForm> {
  const req = form.caseInitiationChangeRequest;

  const investigationAuthority =
    cleanText(req.investigationAuthority) ||
    cleanText(req.requestAuthorityLine) ||
    EMPTY_FORM.caseInitiationChangeRequest.investigationAuthority;

  const oldDecisionCode =
    cleanText(req.oldDecisionCode) ||
    EMPTY_FORM.caseInitiationChangeRequest.oldDecisionCode;

  const oldDecisionDateLine =
    normalizeBm018VietnameseDateLine(req.oldDecisionDateLine);

  const currentOffenseName =
    cleanText(req.currentOffenseName) ||
    EMPTY_FORM.caseInitiationChangeRequest.currentOffenseName;

  const newOffenseName =
    cleanText(req.newOffenseName) ||
    EMPTY_FORM.caseInitiationChangeRequest.newOffenseName;

  return {
    considerationLine:
      `Xét Quyết định khởi tố vụ án hình sự số ${oldDecisionCode} ${oldDecisionDateLine} của ${investigationAuthority} về tội ${currentOffenseName}`,
    changeGroundLine:
      `là không đúng với hành vi phạm tội xảy ra, có căn cứ xác định dấu hiệu của tội ${newOffenseName}`,
    requestAuthorityLine: investigationAuthority,
    requestChangeDecisionLine:
      `ra Quyết định thay đổi Quyết định khởi tố vụ án hình sự số ${oldDecisionCode} ${oldDecisionDateLine} và khởi tố vụ án hình sự về tội ${newOffenseName}`,
  };
}

function normalizeFormInputs(form: Bm018Form): Bm018Form & {
  document: DocumentForm & { issueDate: string };
} {
  const normalizedDate = normalizeBm018DisplayDate(form.document.issueDateText);
  const nextIssueLine = issuePlaceAndDateLine(
    form.document.issuePlace,
    normalizedDate,
  );

  
  const normalizedOldDecisionDateLine =
    normalizeBm018VietnameseDateLine(
      form.caseInitiationChangeRequest.oldDecisionDateLine,
    );

  const generatedLines = buildGeneratedLines({
    ...form,
    caseInitiationChangeRequest: {
      ...form.caseInitiationChangeRequest,
      oldDecisionDateLine: normalizedOldDecisionDateLine,
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
      issuerTitle:
        cleanText(form.official.issuerTitle) ||
        EMPTY_FORM.official.issuerTitle,
    },
    legalBasis: {
      procedureArticlesLine:
        cleanText(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    caseInitiationChangeRequest: {
      investigationAuthority: cleanText(
        form.caseInitiationChangeRequest.investigationAuthority,
      ),
      oldDecisionCode: cleanText(
        form.caseInitiationChangeRequest.oldDecisionCode,
      ),
      oldDecisionDateLine: normalizedOldDecisionDateLine,
      currentOffenseName: cleanText(
        form.caseInitiationChangeRequest.currentOffenseName,
      ),
      newOffenseName: cleanText(
        form.caseInitiationChangeRequest.newOffenseName,
      ),

      considerationLine: cleanText(form.caseInitiationChangeRequest.considerationLine) || generatedLines.considerationLine || "",
      currentOffenseLegalLine: cleanText(
        form.caseInitiationChangeRequest.currentOffenseLegalLine,
      ),
      changeGroundLine: cleanText(
        form.caseInitiationChangeRequest.changeGroundLine,
      ),
      newOffenseLegalLine: cleanText(
        form.caseInitiationChangeRequest.newOffenseLegalLine,
      ),

      requestAuthorityLine: cleanText(
        form.caseInitiationChangeRequest.requestAuthorityLine,
      ),
      requestChangeDecisionLine: cleanText(form.caseInitiationChangeRequest.requestChangeDecisionLine) || generatedLines.requestChangeDecisionLine || "",
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

function buildFormFromPayload(payload: unknown): Bm018Form {
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
    ? normalizeBm018DisplayDate(
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
    caseInitiationChangeRequest: {
      investigationAuthority: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.investigationAuthority",
        EMPTY_FORM.caseInitiationChangeRequest.investigationAuthority,
      ),
      oldDecisionCode: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.oldDecisionCode",
        EMPTY_FORM.caseInitiationChangeRequest.oldDecisionCode,
      ),
      oldDecisionDateLine: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.oldDecisionDateLine",
        EMPTY_FORM.caseInitiationChangeRequest.oldDecisionDateLine,
      ),
      currentOffenseName: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.currentOffenseName",
        EMPTY_FORM.caseInitiationChangeRequest.currentOffenseName,
      ),
      newOffenseName: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.newOffenseName",
        EMPTY_FORM.caseInitiationChangeRequest.newOffenseName,
      ),

      considerationLine: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.considerationLine",
        EMPTY_FORM.caseInitiationChangeRequest.considerationLine,
      ),
      currentOffenseLegalLine: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.currentOffenseLegalLine",
        EMPTY_FORM.caseInitiationChangeRequest.currentOffenseLegalLine,
      ),
      changeGroundLine: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.changeGroundLine",
        EMPTY_FORM.caseInitiationChangeRequest.changeGroundLine,
      ),
      newOffenseLegalLine: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.newOffenseLegalLine",
        EMPTY_FORM.caseInitiationChangeRequest.newOffenseLegalLine,
      ),

      requestAuthorityLine: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.requestAuthorityLine",
        EMPTY_FORM.caseInitiationChangeRequest.requestAuthorityLine,
      ),
      requestChangeDecisionLine: pickString(
        formInputs,
        payload,
        "caseInitiationChangeRequest.requestChangeDecisionLine",
        EMPTY_FORM.caseInitiationChangeRequest.requestChangeDecisionLine,
      ),
    },
    recipients: {
      primaryLine: pickString(formInputs, payload, "recipients.primaryLine", EMPTY_FORM.recipients.primaryLine),
      archiveLine: pickString(formInputs, payload, "recipients.archiveLine", EMPTY_FORM.recipients.archiveLine),
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

export function Bm018FormInputsPanel({
  documentId,
  onSaved,
}: Bm018FormInputsPanelProps) {
  const [form, setForm] = useState<Bm018Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-018 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-018.");
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

  function updateRequest<K extends keyof CaseInitiationChangeRequestForm>(
    key: K,
    value: CaseInitiationChangeRequestForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        caseInitiationChangeRequest: {
          ...current.caseInitiationChangeRequest,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        caseInitiationChangeRequest: {
          ...nextForm.caseInitiationChangeRequest,
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
      caseInitiationChangeRequest: {
        ...current.caseInitiationChangeRequest,
        ...buildGeneratedLines(current),
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-018.");
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
    setMessage("Đang lưu formInputs BM-018...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-018",
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
          result.text || `Không lưu được BM-018. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-018. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-018 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-018
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Yêu cầu ra Quyết định thay đổi Quyết định khởi tố vụ án hình sự
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-018. Dữ liệu chính nằm trong nhóm{" "}
          <span className="font-semibold">caseInitiationChangeRequest</span>,
          gồm quyết định khởi tố cũ, tội danh cũ, căn cứ thay đổi, tội danh mới,
          cơ quan được yêu cầu, nơi nhận và chữ ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-018
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại dòng theo tội danh
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-018"}
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
          <Field label="Số yêu cầu" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} />
          <Field label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} />
          <div className="space-y-1.5">
            <Bm018DateSelectField
              label="Ngày ban hành"
              value={form.document.issueDateText || getBm018TodayDisplayDate()}
              outputMode="display"
              onChange={(value) => updateDocument("issueDateText", value)}
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {issuePlaceAndDateLine(form.document.issuePlace, form.document.issueDateText)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Chủ thể ban hành / căn cứ">
        <div className="grid gap-4">
          <Field
            label="Chủ thể ban hành"
            value={form.official.issuerTitle}
            onChange={(value) => updateOfficial("issuerTitle", value)}
          />
          <TextAreaField
            label="Căn cứ pháp lý"
            value={form.legalBasis.procedureArticlesLine}
            onChange={(value) => updateLegalBasis("procedureArticlesLine", value)}
            rows={2}
          />
        </div>
      </SectionCard>

      <SectionCard title="3. Quyết định khởi tố cũ / tội danh">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Cơ quan/người có thẩm quyền điều tra"
            value={form.caseInitiationChangeRequest.investigationAuthority}
            onChange={(value) => updateRequest("investigationAuthority", value, true)}
          />
          <Field
            label="Số quyết định khởi tố cũ"
            value={form.caseInitiationChangeRequest.oldDecisionCode}
            onChange={(value) => updateRequest("oldDecisionCode", value, true)}
          />
          <div className="space-y-1.5">
            <Bm018DateSelectField
              label="Ngày quyết định khởi tố cũ"
              value={
                form.caseInitiationChangeRequest.oldDecisionDateLine ||
                getBm018TodayVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updateRequest("oldDecisionDateLine", value, true)
              }
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {preview.caseInitiationChangeRequest.oldDecisionDateLine}
            </p>
          </div>
          <Field
            label="Tội danh cũ"
            value={form.caseInitiationChangeRequest.currentOffenseName}
            onChange={(value) => updateRequest("currentOffenseName", value, true)}
          />
          <Field
            label="Tội danh mới"
            value={form.caseInitiationChangeRequest.newOffenseName}
            onChange={(value) => updateRequest("newOffenseName", value, true)}
          />
          <Field
            label="Pháp lý tội danh cũ"
            value={form.caseInitiationChangeRequest.currentOffenseLegalLine}
            onChange={(value) => updateRequest("currentOffenseLegalLine", value)}
          />
          <Field
            label="Pháp lý tội danh mới"
            value={form.caseInitiationChangeRequest.newOffenseLegalLine}
            onChange={(value) => updateRequest("newOffenseLegalLine", value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="4. Nội dung yêu cầu">
        <div className="grid gap-4">
          <TextAreaField
            label="Dòng xét quyết định"
            value={form.caseInitiationChangeRequest.considerationLine}
            onChange={(value) => updateRequest("considerationLine", value)}
            rows={3}
          />
          <TextAreaField
            label="Dòng căn cứ thay đổi"
            value={form.caseInitiationChangeRequest.changeGroundLine}
            onChange={(value) => updateRequest("changeGroundLine", value)}
            rows={3}
          />
          <TextAreaField
            label="Cơ quan được yêu cầu"
            value={form.caseInitiationChangeRequest.requestAuthorityLine}
            onChange={(value) => updateRequest("requestAuthorityLine", value)}
            rows={2}
          />
          <TextAreaField
            label="Dòng yêu cầu thay đổi quyết định"
            value={form.caseInitiationChangeRequest.requestChangeDecisionLine}
            onChange={(value) => updateRequest("requestChangeDecisionLine", value)}
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
          <p><span className="font-bold">Số:</span> {preview.document.documentCode}</p>
          <p><span className="font-bold">Ngày:</span> {preview.document.issuePlaceAndDateLine}</p>
          <p><span className="font-bold">Căn cứ:</span> {preview.legalBasis.procedureArticlesLine}</p>
          <p><span className="font-bold">Xét:</span> {preview.caseInitiationChangeRequest.considerationLine}</p>
          <p><span className="font-bold">Tội mới:</span> {preview.caseInitiationChangeRequest.newOffenseName} - {preview.caseInitiationChangeRequest.newOffenseLegalLine}</p>
          <p><span className="font-bold">Cơ quan yêu cầu:</span> {preview.caseInitiationChangeRequest.requestAuthorityLine}</p>
          <p><span className="font-bold">Chữ ký:</span> {preview.signature.signMode} / {preview.signature.positionTitle} / {preview.signature.signerName}</p>
        </div>
      </SectionCard>
    </div>
  );
}
