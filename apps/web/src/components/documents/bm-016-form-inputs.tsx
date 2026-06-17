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

type SourceDirectInspectionConclusionForm = {
  inspectedAgency: string;
  implementationDecisionCode: string;
  implementationDecisionDateLine: string;
  implementationDecisionLine: string;

  receivedTotalLine: string;
  receivedDenunciationLine: string;
  receivedCrimeReportLine: string;
  receivedProsecutionRequestLine: string;
  receivedDirectDiscoveryLine: string;
  receivedSelfSurrenderLine: string;
  receivedOtherLine: string;

  resolvedStatsBlock: string;
  prosecutionDecisionStatsLine: string;
  nonProsecutionDecisionStatsLine: string;
  transferredStatsLine: string;
  pendingStatsLine: string;
  suspendedStatsLine: string;

  advantagesLine: string;
  violationsLine: string;
  violationReasonsLine: string;

  recommendationsBlock: string;
  implementationRequestLine: string;
};

type RecipientsForm = {
  primaryLine: string;
  teamMembersLine: string;
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm016Form = {
  agency: AgencyForm;
  document: DocumentForm;
  legalBasis: LegalBasisForm;
  sourceDirectInspectionConclusion: SourceDirectInspectionConclusionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm016FormInputsPanelProps = {
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

function getBm016TodayParts(): {
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

function buildBm016DisplayDate(day: string, month: string, year: string): string {
  return `${pad2(Number(day))}/${pad2(Number(month))}/${year}`;
}

function buildBm016VietnameseDateLine(day: string, month: string, year: string): string {
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function getBm016TodayDisplayDate(): string {
  const today = getBm016TodayParts();
  return buildBm016DisplayDate(today.day, today.month, today.year);
}

function getBm016TodayVietnameseDateLine(): string {
  const today = getBm016TodayParts();
  return buildBm016VietnameseDateLine(today.day, today.month, today.year);
}

function parseBm016DateParts(value: string): {
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

  return getBm016TodayParts();
}

function normalizeBm016DisplayDate(value: string): string {
  const raw = cleanText(value);

  if (!raw || raw.includes("...")) {
    return getBm016TodayDisplayDate();
  }

  const parsed = parseBm016DateParts(raw);
  return buildBm016DisplayDate(parsed.day, parsed.month, parsed.year);
}

function normalizeBm016VietnameseDateLine(value: string): string {
  const raw = cleanText(value);

  if (!raw || raw.includes("...")) {
    return getBm016TodayVietnameseDateLine();
  }

  const parsed = parseBm016DateParts(raw);
  return buildBm016VietnameseDateLine(parsed.day, parsed.month, parsed.year);
}

function Bm016DateSelectField({
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
  const parsed = parseBm016DateParts(value);

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
        ? buildBm016VietnameseDateLine(next.day, next.month, next.year)
        : buildBm016DisplayDate(next.day, next.month, next.year);

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
const EMPTY_FORM: Bm016Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "16/KL-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ Điều 41 và Điều 160 của Bộ luật Tố tụng hình sự,",
  },
  sourceDirectInspectionConclusion: {
    inspectedAgency:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    implementationDecisionCode: "14/QĐ-VKSKV7",
    implementationDecisionDateLine: todayDateLine(),
    implementationDecisionLine:
      "Thực hiện Quyết định trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm số 14/QĐ-VKSKV7 " +
      todayDateLine() +
      " của Viện trưởng Viện kiểm sát nhân dân khu vực 7 đối với Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây, Viện kiểm sát nhân dân khu vực 7 kết luận như sau:",

    receivedTotalLine:
      "Tổng số nguồn tin về tội phạm đã tiếp nhận: 12, trong đó:",
    receivedDenunciationLine: "Số tố giác: 04",
    receivedCrimeReportLine: "Số tin báo về tội phạm: 05",
    receivedProsecutionRequestLine: "Số kiến nghị khởi tố: 01",
    receivedDirectDiscoveryLine:
      "Số thông tin về tội phạm do cơ quan tiến hành tố tụng trực tiếp phát hiện: 01",
    receivedSelfSurrenderLine: "Số nguồn tin do người phạm tội tự thú: 00",
    receivedOtherLine: "Số nguồn tin về tội phạm khác: 01",

    resolvedStatsBlock:
      "Số đã giải quyết: 09 nguồn tin về tội phạm, trong đó tố giác 03, tin báo về tội phạm 04, kiến nghị khởi tố 01, nguồn tin khác 01.",
    prosecutionDecisionStatsLine:
      "Quyết định khởi tố vụ án hình sự: 03 vụ.",
    nonProsecutionDecisionStatsLine:
      "Quyết định không khởi tố vụ án hình sự: 02 nguồn tin về tội phạm.",
    transferredStatsLine:
      "Chuyển để giải quyết theo thẩm quyền: 01 nguồn tin về tội phạm, chuyển đến Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây.",
    pendingStatsLine:
      "Số đang giải quyết: 02 nguồn tin về tội phạm; trong đó quá hạn: 00 nguồn tin.",
    suspendedStatsLine:
      "Tạm đình chỉ việc giải quyết: 01 vụ việc do chưa xác định được người thực hiện hành vi có dấu hiệu tội phạm.",

    advantagesLine:
      "Đơn vị cơ bản thực hiện đúng quy định về tiếp nhận, phân loại, xử lý và giải quyết nguồn tin về tội phạm.",
    violationsLine:
      "Trên cơ sở tiến hành kiểm sát trực tiếp tại Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây, Viện kiểm sát nhân dân khu vực 7 phát hiện một số hồ sơ còn chậm cập nhật tài liệu xác minh, việc ghi chép sổ theo dõi chưa thật đầy đủ.",
    violationReasonsLine:
      "Nguyên nhân chủ yếu do việc phân công theo dõi hồ sơ chưa thường xuyên, công tác cập nhật tài liệu sau xác minh chưa được kiểm tra kịp thời.",

    recommendationsBlock:
      "1. Tổ chức rút kinh nghiệm, khắc phục các vi phạm, hạn chế đã nêu.\n2. Cập nhật đầy đủ tài liệu, kết quả xác minh vào hồ sơ giải quyết nguồn tin về tội phạm.\n3. Tăng cường kiểm tra tiến độ giải quyết nguồn tin, bảo đảm đúng thời hạn theo quy định.",
    implementationRequestLine:
      "Yêu cầu Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây tổ chức thực hiện kiến nghị; có văn bản trả lời Viện kiểm sát nhân dân khu vực 7 trong thời hạn 15 ngày, kể từ ngày nhận được Kết luận này./.",
  },
  recipients: {
    primaryLine: "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    teamMembersLine: "Thành viên Đoàn kiểm sát",
    archiveLine: "Lưu: HSKS, VP",
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

function buildGeneratedLines(form: Bm016Form): Partial<SourceDirectInspectionConclusionForm> {
  const inspectedAgency =
    cleanText(form.sourceDirectInspectionConclusion.inspectedAgency) ||
    EMPTY_FORM.sourceDirectInspectionConclusion.inspectedAgency;

  const agencyBodyName =
    cleanText(form.agency.bodyName) || EMPTY_FORM.agency.bodyName;

  const implementationDecisionCode =
    cleanText(form.sourceDirectInspectionConclusion.implementationDecisionCode) ||
    EMPTY_FORM.sourceDirectInspectionConclusion.implementationDecisionCode;

  const implementationDecisionDateLine =
    normalizeBm016VietnameseDateLine(
      form.sourceDirectInspectionConclusion.implementationDecisionDateLine,
    );

  return {
    implementationDecisionLine:
      `Thực hiện Quyết định trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm số ${implementationDecisionCode} ${implementationDecisionDateLine} của Viện trưởng ${agencyBodyName} đối với ${inspectedAgency}, ${agencyBodyName} kết luận như sau:`,
    transferredStatsLine:
      `Chuyển để giải quyết theo thẩm quyền: 01 nguồn tin về tội phạm, chuyển đến ${inspectedAgency}.`,
    violationsLine:
      `Trên cơ sở tiến hành kiểm sát trực tiếp tại ${inspectedAgency}, ${agencyBodyName} phát hiện một số hồ sơ còn chậm cập nhật tài liệu xác minh, việc ghi chép sổ theo dõi chưa thật đầy đủ.`,
    implementationRequestLine:
      `Yêu cầu ${inspectedAgency} tổ chức thực hiện kiến nghị; có văn bản trả lời ${agencyBodyName} trong thời hạn 15 ngày, kể từ ngày nhận được Kết luận này./.`,
  };
}

function normalizeFormInputs(form: Bm016Form): Bm016Form & {
  document: DocumentForm & { issueDate: string };
} {
  const normalizedDate = normalizeBm016DisplayDate(form.document.issueDateText);
  const nextIssueLine = issuePlaceAndDateLine(
    form.document.issuePlace,
    normalizedDate,
  );

  
  const normalizedImplementationDecisionDateLine =
    normalizeBm016VietnameseDateLine(
      form.sourceDirectInspectionConclusion.implementationDecisionDateLine,
    );

  const generatedLines = buildGeneratedLines({
    ...form,
    sourceDirectInspectionConclusion: {
      ...form.sourceDirectInspectionConclusion,
      implementationDecisionDateLine: normalizedImplementationDecisionDateLine,
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
    sourceDirectInspectionConclusion: {
      inspectedAgency: cleanText(
        form.sourceDirectInspectionConclusion.inspectedAgency,
      ),
      implementationDecisionCode: cleanText(
        form.sourceDirectInspectionConclusion.implementationDecisionCode,
      ),
      implementationDecisionDateLine: normalizedImplementationDecisionDateLine,
      implementationDecisionLine: cleanText(form.sourceDirectInspectionConclusion.implementationDecisionLine) || generatedLines.implementationDecisionLine || "",

      receivedTotalLine: cleanText(
        form.sourceDirectInspectionConclusion.receivedTotalLine,
      ),
      receivedDenunciationLine: cleanText(
        form.sourceDirectInspectionConclusion.receivedDenunciationLine,
      ),
      receivedCrimeReportLine: cleanText(
        form.sourceDirectInspectionConclusion.receivedCrimeReportLine,
      ),
      receivedProsecutionRequestLine: cleanText(
        form.sourceDirectInspectionConclusion.receivedProsecutionRequestLine,
      ),
      receivedDirectDiscoveryLine: cleanText(
        form.sourceDirectInspectionConclusion.receivedDirectDiscoveryLine,
      ),
      receivedSelfSurrenderLine: cleanText(
        form.sourceDirectInspectionConclusion.receivedSelfSurrenderLine,
      ),
      receivedOtherLine: cleanText(
        form.sourceDirectInspectionConclusion.receivedOtherLine,
      ),

      resolvedStatsBlock: cleanText(
        form.sourceDirectInspectionConclusion.resolvedStatsBlock,
      ),
      prosecutionDecisionStatsLine: cleanText(
        form.sourceDirectInspectionConclusion.prosecutionDecisionStatsLine,
      ),
      nonProsecutionDecisionStatsLine: cleanText(
        form.sourceDirectInspectionConclusion.nonProsecutionDecisionStatsLine,
      ),
      transferredStatsLine: cleanText(
        form.sourceDirectInspectionConclusion.transferredStatsLine,
      ),
      pendingStatsLine: cleanText(
        form.sourceDirectInspectionConclusion.pendingStatsLine,
      ),
      suspendedStatsLine: cleanText(
        form.sourceDirectInspectionConclusion.suspendedStatsLine,
      ),

      advantagesLine: cleanText(
        form.sourceDirectInspectionConclusion.advantagesLine,
      ),
      violationsLine: cleanText(
        form.sourceDirectInspectionConclusion.violationsLine,
      ),
      violationReasonsLine: cleanText(
        form.sourceDirectInspectionConclusion.violationReasonsLine,
      ),

      recommendationsBlock: cleanText(
        form.sourceDirectInspectionConclusion.recommendationsBlock,
      ),
      implementationRequestLine: cleanText(
        form.sourceDirectInspectionConclusion.implementationRequestLine,
      ),
    },
    recipients: {
      primaryLine: stripRecipientLine(form.recipients.primaryLine),
      teamMembersLine: stripRecipientLine(form.recipients.teamMembersLine),
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

function buildFormFromPayload(payload: unknown): Bm016Form {
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
    ? normalizeBm016DisplayDate(
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
      issuePlaceAndDateLine: issueLine,
    },
    legalBasis: {
      procedureArticlesLine: pickString(
        formInputs,
        payload,
        "legalBasis.procedureArticlesLine",
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
    },
    sourceDirectInspectionConclusion: {
      inspectedAgency: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.inspectedAgency",
        EMPTY_FORM.sourceDirectInspectionConclusion.inspectedAgency,
      ),
      implementationDecisionCode: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.implementationDecisionCode",
        EMPTY_FORM.sourceDirectInspectionConclusion.implementationDecisionCode,
      ),
      implementationDecisionDateLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.implementationDecisionDateLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.implementationDecisionDateLine,
      ),
      implementationDecisionLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.implementationDecisionLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.implementationDecisionLine,
      ),

      receivedTotalLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.receivedTotalLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.receivedTotalLine,
      ),
      receivedDenunciationLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.receivedDenunciationLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.receivedDenunciationLine,
      ),
      receivedCrimeReportLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.receivedCrimeReportLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.receivedCrimeReportLine,
      ),
      receivedProsecutionRequestLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.receivedProsecutionRequestLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.receivedProsecutionRequestLine,
      ),
      receivedDirectDiscoveryLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.receivedDirectDiscoveryLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.receivedDirectDiscoveryLine,
      ),
      receivedSelfSurrenderLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.receivedSelfSurrenderLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.receivedSelfSurrenderLine,
      ),
      receivedOtherLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.receivedOtherLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.receivedOtherLine,
      ),

      resolvedStatsBlock: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.resolvedStatsBlock",
        EMPTY_FORM.sourceDirectInspectionConclusion.resolvedStatsBlock,
      ),
      prosecutionDecisionStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.prosecutionDecisionStatsLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.prosecutionDecisionStatsLine,
      ),
      nonProsecutionDecisionStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.nonProsecutionDecisionStatsLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.nonProsecutionDecisionStatsLine,
      ),
      transferredStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.transferredStatsLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.transferredStatsLine,
      ),
      pendingStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.pendingStatsLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.pendingStatsLine,
      ),
      suspendedStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.suspendedStatsLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.suspendedStatsLine,
      ),
      advantagesLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.advantagesLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.advantagesLine,
      ),
      violationsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.violationsLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.violationsLine,
      ),
      violationReasonsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.violationReasonsLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.violationReasonsLine,
      ),
      recommendationsBlock: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.recommendationsBlock",
        EMPTY_FORM.sourceDirectInspectionConclusion.recommendationsBlock,
      ),
      implementationRequestLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionConclusion.implementationRequestLine",
        EMPTY_FORM.sourceDirectInspectionConclusion.implementationRequestLine,
      ),
    },
    recipients: {
      primaryLine: pickString(
        formInputs,
        payload,
        "recipients.primaryLine",
        EMPTY_FORM.recipients.primaryLine,
      ),
      teamMembersLine: pickString(
        formInputs,
        payload,
        "recipients.teamMembersLine",
        EMPTY_FORM.recipients.teamMembersLine,
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

export function Bm016FormInputsPanel({
  documentId,
  onSaved,
}: Bm016FormInputsPanelProps) {
  const [form, setForm] = useState<Bm016Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-016 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-016.");
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

  function updateConclusion<K extends keyof SourceDirectInspectionConclusionForm>(
    key: K,
    value: SourceDirectInspectionConclusionForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        sourceDirectInspectionConclusion: {
          ...current.sourceDirectInspectionConclusion,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        sourceDirectInspectionConclusion: {
          ...nextForm.sourceDirectInspectionConclusion,
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
      sourceDirectInspectionConclusion: {
        ...current.sourceDirectInspectionConclusion,
        ...buildGeneratedLines(current),
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-016.");
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
    setMessage("Đang lưu formInputs BM-016...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-016",
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
          result.text || `Không lưu được BM-016. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-016. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-016 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-016
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Kết luận trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-016. Dữ liệu chính được lưu vào nhóm{" "}
          <span className="font-semibold">sourceDirectInspectionConclusion</span>.
          Phần thống kê tiếp nhận đã được tách thành từng dòng để DOCX giữ đúng thụt dòng.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-016
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại dòng theo đơn vị kiểm sát
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-016"}
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
          <Field label="Số kết luận" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} />
          <Field label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} />
          <div className="space-y-1.5">
            <Bm016DateSelectField
              label="Ngày ban hành"
              value={form.document.issueDateText || getBm016TodayDisplayDate()}
              outputMode="display"
              onChange={(value) => updateDocument("issueDateText", value)}
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {issuePlaceAndDateLine(form.document.issuePlace, form.document.issueDateText)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Căn cứ / Quyết định thực hiện">
        <div className="grid gap-4">
          <TextAreaField label="Căn cứ" value={form.legalBasis.procedureArticlesLine} onChange={(value) => updateLegalBasis("procedureArticlesLine", value)} rows={2} />
          <Field label="Đơn vị được kiểm sát" value={form.sourceDirectInspectionConclusion.inspectedAgency} onChange={(value) => updateConclusion("inspectedAgency", value, true)} />
          <Field label="Số quyết định trực tiếp kiểm sát" value={form.sourceDirectInspectionConclusion.implementationDecisionCode} onChange={(value) => updateConclusion("implementationDecisionCode", value, true)} />
          <div className="space-y-1.5">
            <Bm016DateSelectField
              label="Ngày quyết định trực tiếp kiểm sát"
              value={
                form.sourceDirectInspectionConclusion.implementationDecisionDateLine ||
                getBm016TodayVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updateConclusion("implementationDecisionDateLine", value, true)
              }
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {preview.sourceDirectInspectionConclusion.implementationDecisionDateLine}
            </p>
          </div>
          <TextAreaField label="Dòng thực hiện quyết định" value={form.sourceDirectInspectionConclusion.implementationDecisionLine} onChange={(value) => updateConclusion("implementationDecisionLine", value)} rows={4} />
        </div>
      </SectionCard>

      <SectionCard
        title="3. I. Công tác tiếp nhận - các dòng thụt riêng"
        description="Các dòng này tương ứng từng placeholder riêng trong DOCX để giữ đúng indent."
      >
        <div className="grid gap-4">
          <TextAreaField label="a) Tổng số nguồn tin" value={form.sourceDirectInspectionConclusion.receivedTotalLine} onChange={(value) => updateConclusion("receivedTotalLine", value)} rows={2} />
          <Field label="- Số tố giác" value={form.sourceDirectInspectionConclusion.receivedDenunciationLine} onChange={(value) => updateConclusion("receivedDenunciationLine", value)} />
          <Field label="- Số tin báo về tội phạm" value={form.sourceDirectInspectionConclusion.receivedCrimeReportLine} onChange={(value) => updateConclusion("receivedCrimeReportLine", value)} />
          <Field label="- Số kiến nghị khởi tố" value={form.sourceDirectInspectionConclusion.receivedProsecutionRequestLine} onChange={(value) => updateConclusion("receivedProsecutionRequestLine", value)} />
          <Field label="- Số thông tin do cơ quan tiến hành tố tụng trực tiếp phát hiện" value={form.sourceDirectInspectionConclusion.receivedDirectDiscoveryLine} onChange={(value) => updateConclusion("receivedDirectDiscoveryLine", value)} />
          <Field label="- Số nguồn tin do người phạm tội tự thú" value={form.sourceDirectInspectionConclusion.receivedSelfSurrenderLine} onChange={(value) => updateConclusion("receivedSelfSurrenderLine", value)} />
          <Field label="- Số nguồn tin khác" value={form.sourceDirectInspectionConclusion.receivedOtherLine} onChange={(value) => updateConclusion("receivedOtherLine", value)} />
        </div>
      </SectionCard>

      <SectionCard title="4. Kết quả giải quyết">
        <div className="grid gap-4">
          <TextAreaField label="Số đã giải quyết" value={form.sourceDirectInspectionConclusion.resolvedStatsBlock} onChange={(value) => updateConclusion("resolvedStatsBlock", value)} rows={3} />
          <TextAreaField label="Quyết định khởi tố" value={form.sourceDirectInspectionConclusion.prosecutionDecisionStatsLine} onChange={(value) => updateConclusion("prosecutionDecisionStatsLine", value)} rows={2} />
          <TextAreaField label="Quyết định không khởi tố" value={form.sourceDirectInspectionConclusion.nonProsecutionDecisionStatsLine} onChange={(value) => updateConclusion("nonProsecutionDecisionStatsLine", value)} rows={2} />
          <TextAreaField label="Chuyển thẩm quyền" value={form.sourceDirectInspectionConclusion.transferredStatsLine} onChange={(value) => updateConclusion("transferredStatsLine", value)} rows={3} />
          <TextAreaField label="Đang giải quyết" value={form.sourceDirectInspectionConclusion.pendingStatsLine} onChange={(value) => updateConclusion("pendingStatsLine", value)} rows={2} />
          <TextAreaField label="Tạm đình chỉ" value={form.sourceDirectInspectionConclusion.suspendedStatsLine} onChange={(value) => updateConclusion("suspendedStatsLine", value)} rows={3} />
        </div>
      </SectionCard>

      <SectionCard title="5. Đánh giá / kiến nghị">
        <div className="grid gap-4">
          <TextAreaField label="Ưu điểm" value={form.sourceDirectInspectionConclusion.advantagesLine} onChange={(value) => updateConclusion("advantagesLine", value)} rows={3} />
          <TextAreaField label="Vi phạm, hạn chế, tồn tại" value={form.sourceDirectInspectionConclusion.violationsLine} onChange={(value) => updateConclusion("violationsLine", value)} rows={4} />
          <TextAreaField label="Nguyên nhân" value={form.sourceDirectInspectionConclusion.violationReasonsLine} onChange={(value) => updateConclusion("violationReasonsLine", value)} rows={3} />
          <TextAreaField label="Kiến nghị" value={form.sourceDirectInspectionConclusion.recommendationsBlock} onChange={(value) => updateConclusion("recommendationsBlock", value)} rows={5} />
          <TextAreaField label="Yêu cầu thực hiện kiến nghị" value={form.sourceDirectInspectionConclusion.implementationRequestLine} onChange={(value) => updateConclusion("implementationRequestLine", value)} rows={4} />
        </div>
      </SectionCard>

      <SectionCard title="6. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nơi nhận chính" value={form.recipients.primaryLine} onChange={(value) => updateRecipients("primaryLine", value)} />
          <Field label="Thành viên Đoàn kiểm sát" value={form.recipients.teamMembersLine} onChange={(value) => updateRecipients("teamMembersLine", value)} />
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
          <p><span className="font-bold">Đơn vị kiểm sát:</span> {preview.sourceDirectInspectionConclusion.inspectedAgency}</p>
          <p><span className="font-bold">Tổng nguồn tin:</span> {preview.sourceDirectInspectionConclusion.receivedTotalLine}</p>
          <p><span className="font-bold">Dòng tố giác:</span> {preview.sourceDirectInspectionConclusion.receivedDenunciationLine}</p>
          <p><span className="font-bold">Chữ ký:</span> {preview.signature.signMode} / {preview.signature.positionTitle} / {preview.signature.signerName}</p>
        </div>
      </SectionCard>
    </div>
  );
}
