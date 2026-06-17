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

type SourceDirectInspectionPlanForm = {
  inspectedAgency: string;
  attachedDecisionCode: string;
  attachedDecisionDateLine: string;
  attachedDecisionLine: string;

  purposeLine1: string;
  purposeLine2: string;
  purposeLine3: string;

  receivedStatsBlock: string;
  resolvedStatsBlock: string;
  prosecutionDecisionStatsLine: string;
  nonProsecutionDecisionStatsLine: string;
  transferredStatsLine: string;
  pendingStatsLine: string;
  suspendedStatsLine: string;

  advantagesLine: string;
  limitationsLine: string;
  recommendationsLine: string;

  inspectionDurationLine: string;
  inspectionStartDateLine: string;
  inspectionEndDateLine: string;
  inspectionTimeLine: string;
  dataStartDateLine: string;
  dataEndDateLine: string;
  dataPeriodLine: string;
  methodsBlock: string;

  requestPreparationLine: string;
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

type Bm015Form = {
  agency: AgencyForm;
  document: DocumentForm;
  sourceDirectInspectionPlan: SourceDirectInspectionPlanForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm015FormInputsPanelProps = {
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

  return `${issuePlace}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
}


function getBm015TodayParts(): {
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

function buildBm015DisplayDate(day: string, month: string, year: string): string {
  return `${pad2(Number(day))}/${pad2(Number(month))}/${year}`;
}

function buildBm015VietnameseDateLine(day: string, month: string, year: string): string {
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function getBm015TodayDisplayDate(): string {
  const today = getBm015TodayParts();
  return buildBm015DisplayDate(today.day, today.month, today.year);
}

function getBm015TodayVietnameseDateLine(): string {
  const today = getBm015TodayParts();
  return buildBm015VietnameseDateLine(today.day, today.month, today.year);
}

function parseBm015DateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = String(value ?? "").trim();

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

  return getBm015TodayParts();
}

function normalizeBm015DisplayDate(value: string): string {
  const raw = String(value ?? "").trim();

  if (!raw) return getBm015TodayDisplayDate();

  const parsed = parseBm015DateParts(raw);
  return buildBm015DisplayDate(parsed.day, parsed.month, parsed.year);
}

function normalizeBm015VietnameseDateLine(value: string, fallback: string): string {
  const raw = String(value ?? "").trim();

  if (!raw || raw.includes("...")) return fallback;

  const parsed = parseBm015DateParts(raw);
  return buildBm015VietnameseDateLine(parsed.day, parsed.month, parsed.year);
}

function addDaysToBm015DisplayDate(value: string, days: number): string {
  const parsed = parseBm015DateParts(value);
  const base = new Date(
    Number(parsed.year),
    Number(parsed.month) - 1,
    Number(parsed.day),
  );

  base.setDate(base.getDate() + days);

  return buildBm015DisplayDate(
    pad2(base.getDate()),
    pad2(base.getMonth() + 1),
    String(base.getFullYear()),
  );
}

function getBm015DefaultInspectionEndDisplayDate(): string {
  return addDaysToBm015DisplayDate(getBm015TodayDisplayDate(), 2);
}

function getBm015DefaultInspectionEndVietnameseDateLine(): string {
  const parsed = parseBm015DateParts(getBm015DefaultInspectionEndDisplayDate());
  return buildBm015VietnameseDateLine(parsed.day, parsed.month, parsed.year);
}

function getBm015DefaultDataStartVietnameseDateLine(): string {
  const year = String(new Date().getFullYear());
  return buildBm015VietnameseDateLine("01", "01", year);
}

function getBm015DefaultDataEndVietnameseDateLine(): string {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 0);

  return buildBm015VietnameseDateLine(
    pad2(end.getDate()),
    pad2(end.getMonth() + 1),
    String(end.getFullYear()),
  );
}

function extractBm015VietnameseDateLines(value: string): string[] {
  const raw = String(value ?? "");
  const matches = raw.match(/ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}/giu);

  return matches ?? [];
}

function extractBm015InspectionDurationLine(value: string): string {
  const raw = String(value ?? "").trim();
  const match = /^(.+?),\s*từ\s+ngày/iu.exec(raw);

  return match?.[1]?.trim() || "03 ngày";
}

function buildBm015InspectionTimeLine(
  durationLine: string,
  startDateLine: string,
  endDateLine: string,
): string {
  return `${durationLine || "03 ngày"}, từ ${startDateLine} đến ${endDateLine}`;
}

function buildBm015DataPeriodLine(
  startDateLine: string,
  endDateLine: string,
): string {
  return `từ ${startDateLine} đến ${endDateLine}`;
}

function Bm015DateSelectField({
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
  const parsed = parseBm015DateParts(value);

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
        ? buildBm015VietnameseDateLine(next.day, next.month, next.year)
        : buildBm015DisplayDate(next.day, next.month, next.year);

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

const EMPTY_FORM: Bm015Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "15/KH-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  sourceDirectInspectionPlan: {
    inspectedAgency:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    attachedDecisionCode: "14/QĐ-VKSKV7",
    attachedDecisionDateLine: todayDateLine(),
    attachedDecisionLine:
      "(Ban hành kèm theo Quyết định số 14/QĐ-VKSKV7 " +
      todayDateLine() +
      " của Viện kiểm sát nhân dân khu vực 7)",

    purposeLine1:
      "Kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây, qua đó làm rõ vi phạm nếu có, kết luận và kiến nghị khắc phục, sửa chữa vi phạm, phối hợp đề ra giải pháp để giải quyết khó khăn, vướng mắc của đơn vị khi thực hiện nhiệm vụ này.",
    purposeLine2:
      "Nâng cao chất lượng, hiệu quả tiếp nhận, giải quyết nguồn tin về tội phạm bảo đảm thực hiện đúng quy định tại các điều 145, 146, 147, 148 và 160 của Bộ luật Tố tụng hình sự.",
    purposeLine3: "Mục đích, yêu cầu khác: không.",

    receivedStatsBlock:
      "Tổng số nguồn tin về tội phạm đã tiếp nhận: 12, trong đó:\n- Số tố giác: 04\n- Số tin báo về tội phạm: 05\n- Số kiến nghị khởi tố: 01\n- Số thông tin về tội phạm do cơ quan tiến hành tố tụng trực tiếp phát hiện: 01\n- Số nguồn tin do người phạm tội tự thú: 00\n- Số nguồn tin về tội phạm khác: 01",
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
    limitationsLine:
      "Một số hồ sơ còn chậm cập nhật tài liệu xác minh, việc ghi chép sổ theo dõi chưa thật đầy đủ.",
    recommendationsLine:
      "Đề nghị đơn vị khắc phục tồn tại, tăng cường kiểm tra tiến độ xác minh và cập nhật đầy đủ tài liệu vào hồ sơ.",

    inspectionDurationLine: "03 ngày",
    inspectionStartDateLine: todayDateLine(),
    inspectionEndDateLine: getBm015DefaultInspectionEndVietnameseDateLine(),
    inspectionTimeLine: buildBm015InspectionTimeLine(
      "03 ngày",
      todayDateLine(),
      getBm015DefaultInspectionEndVietnameseDateLine(),
    ),
    dataStartDateLine: getBm015DefaultDataStartVietnameseDateLine(),
    dataEndDateLine: getBm015DefaultDataEndVietnameseDateLine(),
    dataPeriodLine: buildBm015DataPeriodLine(
      getBm015DefaultDataStartVietnameseDateLine(),
      getBm015DefaultDataEndVietnameseDateLine(),
    ),
    methodsBlock:
      "- Nghe báo cáo theo nội dung đã yêu cầu.\n- Nghiên cứu hồ sơ, tài liệu, sổ sách liên quan đến yêu cầu kiểm sát.\n- Trao đổi, lấy ý kiến của đơn vị được kiểm sát.\n- Công bố dự thảo kết luận và ban hành Kết luận kiểm sát.",

    requestPreparationLine:
      "Nhận được Kế hoạch này, yêu cầu Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây xây dựng báo cáo, chuẩn bị tài liệu và điều kiện cần thiết khác để phục vụ việc kiểm sát trực tiếp theo Kế hoạch./.",
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

function buildGeneratedLines(form: Bm015Form): Partial<SourceDirectInspectionPlanForm> {
  const inspectedAgency =
    cleanText(form.sourceDirectInspectionPlan.inspectedAgency) ||
    EMPTY_FORM.sourceDirectInspectionPlan.inspectedAgency;

  const agencyBodyName =
    cleanText(form.agency.bodyName) || EMPTY_FORM.agency.bodyName;

  const attachedDecisionCode =
    cleanText(form.sourceDirectInspectionPlan.attachedDecisionCode) ||
    EMPTY_FORM.sourceDirectInspectionPlan.attachedDecisionCode;

  const attachedDecisionDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.attachedDecisionDateLine,
    todayDateLine(),
  );

  const inspectionDurationLine =
    cleanText(form.sourceDirectInspectionPlan.inspectionDurationLine) ||
    "03 ngày";

  const inspectionStartDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.inspectionStartDateLine,
    todayDateLine(),
  );

  const inspectionEndDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.inspectionEndDateLine,
    getBm015DefaultInspectionEndVietnameseDateLine(),
  );

  const dataStartDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.dataStartDateLine,
    getBm015DefaultDataStartVietnameseDateLine(),
  );

  const dataEndDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.dataEndDateLine,
    getBm015DefaultDataEndVietnameseDateLine(),
  );

  return {
    attachedDecisionLine: `(Ban hành kèm theo Quyết định số ${attachedDecisionCode} ${attachedDecisionDateLine} của ${agencyBodyName})`,
    purposeLine1: `Kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm của ${inspectedAgency}, qua đó làm rõ vi phạm nếu có, kết luận và kiến nghị khắc phục, sửa chữa vi phạm, phối hợp đề ra giải pháp để giải quyết khó khăn, vướng mắc của đơn vị khi thực hiện nhiệm vụ này.`,
    transferredStatsLine: `Chuyển để giải quyết theo thẩm quyền: 01 nguồn tin về tội phạm, chuyển đến ${inspectedAgency}.`,
    requestPreparationLine: `Nhận được Kế hoạch này, yêu cầu ${inspectedAgency} xây dựng báo cáo, chuẩn bị tài liệu và điều kiện cần thiết khác để phục vụ việc kiểm sát trực tiếp theo Kế hoạch./.`,
  };
}

function normalizeFormInputs(form: Bm015Form): Bm015Form & {
  document: DocumentForm & { issueDate: string };
} {
  const normalizedDate = normalizeBm015DisplayDate(form.document.issueDateText);
  const nextIssueLine = issuePlaceAndDateLine(
    form.document.issuePlace,
    normalizedDate,
  );

  
  const normalizedAttachedDecisionDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.attachedDecisionDateLine,
    todayDateLine(),
  );

  const normalizedInspectionDurationLine =
    cleanText(form.sourceDirectInspectionPlan.inspectionDurationLine) ||
    "03 ngày";

  const normalizedInspectionStartDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.inspectionStartDateLine,
    todayDateLine(),
  );

  const normalizedInspectionEndDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.inspectionEndDateLine,
    getBm015DefaultInspectionEndVietnameseDateLine(),
  );

  const normalizedDataStartDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.dataStartDateLine,
    getBm015DefaultDataStartVietnameseDateLine(),
  );

  const normalizedDataEndDateLine = normalizeBm015VietnameseDateLine(
    form.sourceDirectInspectionPlan.dataEndDateLine,
    getBm015DefaultDataEndVietnameseDateLine(),
  );

  const generatedLines = buildGeneratedLines({
    ...form,
    sourceDirectInspectionPlan: {
      ...form.sourceDirectInspectionPlan,
      attachedDecisionDateLine: normalizedAttachedDecisionDateLine,
      inspectionDurationLine: normalizedInspectionDurationLine,
      inspectionStartDateLine: normalizedInspectionStartDateLine,
      inspectionEndDateLine: normalizedInspectionEndDateLine,
      dataStartDateLine: normalizedDataStartDateLine,
      dataEndDateLine: normalizedDataEndDateLine,
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
    sourceDirectInspectionPlan: {
      inspectedAgency: cleanText(form.sourceDirectInspectionPlan.inspectedAgency),
      attachedDecisionCode: cleanText(
        form.sourceDirectInspectionPlan.attachedDecisionCode,
      ),
      attachedDecisionDateLine: normalizedAttachedDecisionDateLine,
      attachedDecisionLine: cleanText(form.sourceDirectInspectionPlan.attachedDecisionLine) || generatedLines.attachedDecisionLine || "",

      purposeLine1: cleanText(form.sourceDirectInspectionPlan.purposeLine1),
      purposeLine2: cleanText(form.sourceDirectInspectionPlan.purposeLine2),
      purposeLine3: cleanText(form.sourceDirectInspectionPlan.purposeLine3),

      receivedStatsBlock: cleanText(
        form.sourceDirectInspectionPlan.receivedStatsBlock,
      ),
      resolvedStatsBlock: cleanText(
        form.sourceDirectInspectionPlan.resolvedStatsBlock,
      ),
      prosecutionDecisionStatsLine: cleanText(
        form.sourceDirectInspectionPlan.prosecutionDecisionStatsLine,
      ),
      nonProsecutionDecisionStatsLine: cleanText(
        form.sourceDirectInspectionPlan.nonProsecutionDecisionStatsLine,
      ),
      transferredStatsLine: cleanText(
        form.sourceDirectInspectionPlan.transferredStatsLine,
      ),
      pendingStatsLine: cleanText(form.sourceDirectInspectionPlan.pendingStatsLine),
      suspendedStatsLine: cleanText(
        form.sourceDirectInspectionPlan.suspendedStatsLine,
      ),

      advantagesLine: cleanText(form.sourceDirectInspectionPlan.advantagesLine),
      limitationsLine: cleanText(form.sourceDirectInspectionPlan.limitationsLine),
      recommendationsLine: cleanText(
        form.sourceDirectInspectionPlan.recommendationsLine,
      ),

      inspectionDurationLine:
        cleanText(form.sourceDirectInspectionPlan.inspectionDurationLine) ||
        extractBm015InspectionDurationLine(
          form.sourceDirectInspectionPlan.inspectionTimeLine,
        ),
      inspectionStartDateLine: normalizeBm015VietnameseDateLine(
        form.sourceDirectInspectionPlan.inspectionStartDateLine,
        extractBm015VietnameseDateLines(
          form.sourceDirectInspectionPlan.inspectionTimeLine,
        )[0] || todayDateLine(),
      ),
      inspectionEndDateLine: normalizeBm015VietnameseDateLine(
        form.sourceDirectInspectionPlan.inspectionEndDateLine,
        extractBm015VietnameseDateLines(
          form.sourceDirectInspectionPlan.inspectionTimeLine,
        )[1] || getBm015DefaultInspectionEndVietnameseDateLine(),
      ),
      inspectionTimeLine: buildBm015InspectionTimeLine(
        cleanText(form.sourceDirectInspectionPlan.inspectionDurationLine) ||
          extractBm015InspectionDurationLine(
            form.sourceDirectInspectionPlan.inspectionTimeLine,
          ),
        normalizeBm015VietnameseDateLine(
          form.sourceDirectInspectionPlan.inspectionStartDateLine,
          extractBm015VietnameseDateLines(
            form.sourceDirectInspectionPlan.inspectionTimeLine,
          )[0] || todayDateLine(),
        ),
        normalizeBm015VietnameseDateLine(
          form.sourceDirectInspectionPlan.inspectionEndDateLine,
          extractBm015VietnameseDateLines(
            form.sourceDirectInspectionPlan.inspectionTimeLine,
          )[1] || getBm015DefaultInspectionEndVietnameseDateLine(),
        ),
      ),
      dataStartDateLine: normalizeBm015VietnameseDateLine(
        form.sourceDirectInspectionPlan.dataStartDateLine,
        extractBm015VietnameseDateLines(form.sourceDirectInspectionPlan.dataPeriodLine)[0] ||
          getBm015DefaultDataStartVietnameseDateLine(),
      ),
      dataEndDateLine: normalizeBm015VietnameseDateLine(
        form.sourceDirectInspectionPlan.dataEndDateLine,
        extractBm015VietnameseDateLines(form.sourceDirectInspectionPlan.dataPeriodLine)[1] ||
          getBm015DefaultDataEndVietnameseDateLine(),
      ),
      dataPeriodLine: buildBm015DataPeriodLine(
        normalizeBm015VietnameseDateLine(
          form.sourceDirectInspectionPlan.dataStartDateLine,
          extractBm015VietnameseDateLines(form.sourceDirectInspectionPlan.dataPeriodLine)[0] ||
            getBm015DefaultDataStartVietnameseDateLine(),
        ),
        normalizeBm015VietnameseDateLine(
          form.sourceDirectInspectionPlan.dataEndDateLine,
          extractBm015VietnameseDateLines(form.sourceDirectInspectionPlan.dataPeriodLine)[1] ||
            getBm015DefaultDataEndVietnameseDateLine(),
        ),
      ),
      methodsBlock: cleanText(form.sourceDirectInspectionPlan.methodsBlock),

      requestPreparationLine: cleanText(
        form.sourceDirectInspectionPlan.requestPreparationLine,
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

function buildFormFromPayload(payload: unknown): Bm015Form {
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

  
  const rawInspectionTimeLine = pickString(
    formInputs,
    payload,
    "sourceDirectInspectionPlan.inspectionTimeLine",
    EMPTY_FORM.sourceDirectInspectionPlan.inspectionTimeLine,
  );

  const rawDataPeriodLine = pickString(
    formInputs,
    payload,
    "sourceDirectInspectionPlan.dataPeriodLine",
    EMPTY_FORM.sourceDirectInspectionPlan.dataPeriodLine,
  );

  const inspectionDateLines = extractBm015VietnameseDateLines(rawInspectionTimeLine);
  const dataDateLines = extractBm015VietnameseDateLines(rawDataPeriodLine);

  const attachedDecisionDateLine = pickString(
    formInputs,
    payload,
    "sourceDirectInspectionPlan.attachedDecisionDateLine",
    EMPTY_FORM.sourceDirectInspectionPlan.attachedDecisionDateLine,
  );

  const inspectionDurationLine = pickString(
    formInputs,
    payload,
    "sourceDirectInspectionPlan.inspectionDurationLine",
    extractBm015InspectionDurationLine(rawInspectionTimeLine),
  );

  const inspectionStartDateLine = pickString(
    formInputs,
    payload,
    "sourceDirectInspectionPlan.inspectionStartDateLine",
    inspectionDateLines[0] || EMPTY_FORM.sourceDirectInspectionPlan.inspectionStartDateLine,
  );

  const inspectionEndDateLine = pickString(
    formInputs,
    payload,
    "sourceDirectInspectionPlan.inspectionEndDateLine",
    inspectionDateLines[1] || EMPTY_FORM.sourceDirectInspectionPlan.inspectionEndDateLine,
  );

  const dataStartDateLine = pickString(
    formInputs,
    payload,
    "sourceDirectInspectionPlan.dataStartDateLine",
    dataDateLines[0] || EMPTY_FORM.sourceDirectInspectionPlan.dataStartDateLine,
  );

  const dataEndDateLine = pickString(
    formInputs,
    payload,
    "sourceDirectInspectionPlan.dataEndDateLine",
    dataDateLines[1] || EMPTY_FORM.sourceDirectInspectionPlan.dataEndDateLine,
  );

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
    sourceDirectInspectionPlan: {
      inspectedAgency: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.inspectedAgency",
        EMPTY_FORM.sourceDirectInspectionPlan.inspectedAgency,
      ),
      attachedDecisionCode: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.attachedDecisionCode",
        EMPTY_FORM.sourceDirectInspectionPlan.attachedDecisionCode,
      ),
      attachedDecisionDateLine,
      attachedDecisionLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.attachedDecisionLine",
        EMPTY_FORM.sourceDirectInspectionPlan.attachedDecisionLine,
      ),
      purposeLine1: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.purposeLine1",
        EMPTY_FORM.sourceDirectInspectionPlan.purposeLine1,
      ),
      purposeLine2: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.purposeLine2",
        EMPTY_FORM.sourceDirectInspectionPlan.purposeLine2,
      ),
      purposeLine3: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.purposeLine3",
        EMPTY_FORM.sourceDirectInspectionPlan.purposeLine3,
      ),
      receivedStatsBlock: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.receivedStatsBlock",
        EMPTY_FORM.sourceDirectInspectionPlan.receivedStatsBlock,
      ),
      resolvedStatsBlock: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.resolvedStatsBlock",
        EMPTY_FORM.sourceDirectInspectionPlan.resolvedStatsBlock,
      ),
      prosecutionDecisionStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.prosecutionDecisionStatsLine",
        EMPTY_FORM.sourceDirectInspectionPlan.prosecutionDecisionStatsLine,
      ),
      nonProsecutionDecisionStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.nonProsecutionDecisionStatsLine",
        EMPTY_FORM.sourceDirectInspectionPlan.nonProsecutionDecisionStatsLine,
      ),
      transferredStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.transferredStatsLine",
        EMPTY_FORM.sourceDirectInspectionPlan.transferredStatsLine,
      ),
      pendingStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.pendingStatsLine",
        EMPTY_FORM.sourceDirectInspectionPlan.pendingStatsLine,
      ),
      suspendedStatsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.suspendedStatsLine",
        EMPTY_FORM.sourceDirectInspectionPlan.suspendedStatsLine,
      ),
      advantagesLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.advantagesLine",
        EMPTY_FORM.sourceDirectInspectionPlan.advantagesLine,
      ),
      limitationsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.limitationsLine",
        EMPTY_FORM.sourceDirectInspectionPlan.limitationsLine,
      ),
      recommendationsLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.recommendationsLine",
        EMPTY_FORM.sourceDirectInspectionPlan.recommendationsLine,
      ),
      inspectionDurationLine,
      inspectionStartDateLine,
      inspectionEndDateLine,
      inspectionTimeLine: rawInspectionTimeLine,
      dataStartDateLine,
      dataEndDateLine,
      dataPeriodLine: rawDataPeriodLine,
      methodsBlock: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.methodsBlock",
        EMPTY_FORM.sourceDirectInspectionPlan.methodsBlock,
      ),
      requestPreparationLine: pickString(
        formInputs,
        payload,
        "sourceDirectInspectionPlan.requestPreparationLine",
        EMPTY_FORM.sourceDirectInspectionPlan.requestPreparationLine,
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

export function Bm015FormInputsPanel({
  documentId,
  onSaved,
}: Bm015FormInputsPanelProps) {
  const [form, setForm] = useState<Bm015Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-015 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-015.");
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

  function updatePlan<K extends keyof SourceDirectInspectionPlanForm>(
    key: K,
    value: SourceDirectInspectionPlanForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        sourceDirectInspectionPlan: {
          ...current.sourceDirectInspectionPlan,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        sourceDirectInspectionPlan: {
          ...nextForm.sourceDirectInspectionPlan,
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
      sourceDirectInspectionPlan: {
        ...current.sourceDirectInspectionPlan,
        ...buildGeneratedLines(current),
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-015.");
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
    setMessage("Đang lưu formInputs BM-015...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-015",
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
          result.text || `Không lưu được BM-015. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-015. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-015 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-015
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Kế hoạch trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-015. Dữ liệu chính được lưu vào nhóm{" "}
          <span className="font-semibold">sourceDirectInspectionPlan</span>,
          gồm quyết định kèm theo, mục đích/yêu cầu, thống kê nội dung kiểm sát,
          đánh giá, thời gian/phương pháp, nơi nhận và chữ ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-015
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại dòng liên quan đơn vị kiểm sát
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-015"}
          </button>
        </div>

        <div className="mt-4">
          <StatusMessage status={status} message={message} />
        </div>
      </section>

      <SectionCard
        title="1. Cơ quan / văn bản"
        description="Ngày nhập theo DD/MM/YYYY. Nếu chưa có dữ liệu đã lưu, form tự lấy ngày hôm nay."
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
            label="Số kế hoạch"
            value={form.document.documentCode}
            onChange={(value) => updateDocument("documentCode", value)}
          />
          <Field
            label="Địa danh"
            value={form.document.issuePlace}
            onChange={(value) => updateDocument("issuePlace", value)}
          />
          <div className="space-y-1.5">
            <Bm015DateSelectField
              label="Ngày ban hành"
              value={form.document.issueDateText || getBm015TodayDisplayDate()}
              outputMode="display"
              onChange={(value) => updateDocument("issueDateText", value)}
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {issuePlaceAndDateLine(form.document.issuePlace, form.document.issueDateText)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Quyết định kèm theo / đơn vị kiểm sát">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Đơn vị được kiểm sát"
            value={form.sourceDirectInspectionPlan.inspectedAgency}
            onChange={(value) => updatePlan("inspectedAgency", value, true)}
          />
          <Field
            label="Số quyết định kèm theo"
            value={form.sourceDirectInspectionPlan.attachedDecisionCode}
            onChange={(value) => updatePlan("attachedDecisionCode", value, true)}
          />
          <div className="space-y-1.5">
            <Bm015DateSelectField
              label="Ngày quyết định kèm theo"
              value={
                form.sourceDirectInspectionPlan.attachedDecisionDateLine ||
                getBm015TodayVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updatePlan("attachedDecisionDateLine", value, true)
              }
            />

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {preview.sourceDirectInspectionPlan.attachedDecisionDateLine}
            </p>
          </div>
          <TextAreaField
            label="Dòng ban hành kèm theo"
            value={form.sourceDirectInspectionPlan.attachedDecisionLine}
            onChange={(value) => updatePlan("attachedDecisionLine", value)}
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="3. I. Mục đích, yêu cầu">
        <div className="grid gap-4">
          <TextAreaField
            label="Mục đích/yêu cầu 1"
            value={form.sourceDirectInspectionPlan.purposeLine1}
            onChange={(value) => updatePlan("purposeLine1", value)}
            rows={4}
          />
          <TextAreaField
            label="Mục đích/yêu cầu 2"
            value={form.sourceDirectInspectionPlan.purposeLine2}
            onChange={(value) => updatePlan("purposeLine2", value)}
            rows={3}
          />
          <TextAreaField
            label="Mục đích/yêu cầu 3"
            value={form.sourceDirectInspectionPlan.purposeLine3}
            onChange={(value) => updatePlan("purposeLine3", value)}
            rows={2}
          />
        </div>
      </SectionCard>

      <SectionCard title="4. II. Nội dung kiểm sát - thống kê">
        <div className="grid gap-4">
          <TextAreaField
            label="Kết quả tiếp nhận nguồn tin"
            value={form.sourceDirectInspectionPlan.receivedStatsBlock}
            onChange={(value) => updatePlan("receivedStatsBlock", value)}
            rows={7}
          />
          <TextAreaField
            label="Số đã giải quyết"
            value={form.sourceDirectInspectionPlan.resolvedStatsBlock}
            onChange={(value) => updatePlan("resolvedStatsBlock", value)}
            rows={3}
          />
          <TextAreaField
            label="Quyết định khởi tố"
            value={form.sourceDirectInspectionPlan.prosecutionDecisionStatsLine}
            onChange={(value) => updatePlan("prosecutionDecisionStatsLine", value)}
            rows={2}
          />
          <TextAreaField
            label="Quyết định không khởi tố"
            value={form.sourceDirectInspectionPlan.nonProsecutionDecisionStatsLine}
            onChange={(value) => updatePlan("nonProsecutionDecisionStatsLine", value)}
            rows={2}
          />
          <TextAreaField
            label="Chuyển thẩm quyền"
            value={form.sourceDirectInspectionPlan.transferredStatsLine}
            onChange={(value) => updatePlan("transferredStatsLine", value)}
            rows={3}
          />
          <TextAreaField
            label="Đang giải quyết"
            value={form.sourceDirectInspectionPlan.pendingStatsLine}
            onChange={(value) => updatePlan("pendingStatsLine", value)}
            rows={2}
          />
          <TextAreaField
            label="Tạm đình chỉ"
            value={form.sourceDirectInspectionPlan.suspendedStatsLine}
            onChange={(value) => updatePlan("suspendedStatsLine", value)}
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="5. Đánh giá / kiến nghị">
        <div className="grid gap-4">
          <TextAreaField
            label="Ưu điểm"
            value={form.sourceDirectInspectionPlan.advantagesLine}
            onChange={(value) => updatePlan("advantagesLine", value)}
            rows={3}
          />
          <TextAreaField
            label="Hạn chế, tồn tại và nguyên nhân"
            value={form.sourceDirectInspectionPlan.limitationsLine}
            onChange={(value) => updatePlan("limitationsLine", value)}
            rows={3}
          />
          <TextAreaField
            label="Kiến nghị, đề xuất"
            value={form.sourceDirectInspectionPlan.recommendationsLine}
            onChange={(value) => updatePlan("recommendationsLine", value)}
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="6. III. Thời gian / phương pháp">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label="Số ngày kiểm sát"
              value={form.sourceDirectInspectionPlan.inspectionDurationLine}
              onChange={(value) =>
                updatePlan("inspectionDurationLine", value, true)
              }
            />

            <Bm015DateSelectField
              label="Từ ngày kiểm sát"
              value={
                form.sourceDirectInspectionPlan.inspectionStartDateLine ||
                getBm015TodayVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updatePlan("inspectionStartDateLine", value, true)
              }
            />

            <Bm015DateSelectField
              label="Đến ngày kiểm sát"
              value={
                form.sourceDirectInspectionPlan.inspectionEndDateLine ||
                getBm015DefaultInspectionEndVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updatePlan("inspectionEndDateLine", value, true)
              }
            />
          </div>

          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {preview.sourceDirectInspectionPlan.inspectionTimeLine}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Bm015DateSelectField
              label="Từ ngày lấy số liệu"
              value={
                form.sourceDirectInspectionPlan.dataStartDateLine ||
                getBm015DefaultDataStartVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updatePlan("dataStartDateLine", value, true)
              }
            />

            <Bm015DateSelectField
              label="Đến ngày lấy số liệu"
              value={
                form.sourceDirectInspectionPlan.dataEndDateLine ||
                getBm015DefaultDataEndVietnameseDateLine()
              }
              outputMode="vietnameseLine"
              onChange={(value) =>
                updatePlan("dataEndDateLine", value, true)
              }
            />
          </div>

          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {preview.sourceDirectInspectionPlan.dataPeriodLine}
          </p>
          <TextAreaField
            label="Phương pháp kiểm sát"
            value={form.sourceDirectInspectionPlan.methodsBlock}
            onChange={(value) => updatePlan("methodsBlock", value)}
            rows={5}
          />
          <TextAreaField
            label="Dòng yêu cầu chuẩn bị"
            value={form.sourceDirectInspectionPlan.requestPreparationLine}
            onChange={(value) => updatePlan("requestPreparationLine", value)}
            rows={4}
          />
        </div>
      </SectionCard>

      <SectionCard title="7. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nơi nhận chính"
            value={form.recipients.primaryLine}
            onChange={(value) => updateRecipients("primaryLine", value)}
          />
          <Field
            label="Thành viên Đoàn kiểm sát"
            value={form.recipients.teamMembersLine}
            onChange={(value) => updateRecipients("teamMembersLine", value)}
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
            <span className="font-bold">Đơn vị kiểm sát:</span>{" "}
            {preview.sourceDirectInspectionPlan.inspectedAgency}
          </p>
          <p>
            <span className="font-bold">QĐ kèm theo:</span>{" "}
            {preview.sourceDirectInspectionPlan.attachedDecisionLine}
          </p>
          <p>
            <span className="font-bold">Thời gian:</span>{" "}
            {preview.sourceDirectInspectionPlan.inspectionTimeLine}
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
