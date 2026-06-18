"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldSelect,
  BmFormSection,
} from "@/components/documents/bm-form";

import { BmFlatFormCasePayloadButton } from "./bm-form/case-payload-button";

type Bm070FormInputsPanelProps = {
  documentId: string;
  onSaved?: () => void;
};

type JsonRecord = Record<string, unknown>;

type AgencyOption = {
  label: string;
  parentName: string;
  name: string;
  shortName: string;
  issuePlace: string;
};

type OffenseOption = {
  label: string;
  offenseName: string;
  legalArticle: string;
  criminalCodeText: string;
};

type OfficerOption = {
  label: string;
  name: string;
  title: string;
  agencyName: string;
};

type SignerOption = {
  label: string;
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm070FormState = {
  agencyParentName: string;
  agencyName: string;
  agencyShortName: string;
  agencyIssuePlace: string;

  documentCode: string;
  documentIssueDate: string;

  caseDecisionNo: string;
  caseDecisionIssueDate: string;
  caseDecisionIssuedBy: string;
  offenseName: string;
  legalArticle: string;
  criminalCodeText: string;
  caseProsecutionDecisionLine: string;

  deputyChiefName: string;
  deputyChiefTitle: string;
  deputyChiefAgencyName: string;
  responsibilityLine: string;
  assignmentProcedureArticlesLine: string;

  investigationAuthorityLine: string;
  assignedPersonLine: string;
  archiveLine: string;

  signMode: string;
  positionTitle: string;
  signerName: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const AGENCY_OPTIONS: AgencyOption[] = [
  {
    label: "VKSND Khu vực 7 - TP. Hồ Chí Minh",
    parentName: "",
    name: "",
    shortName: "VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  {
    label: "VKSND Khu vực 1 - TP. Hồ Chí Minh",
    parentName: "",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 1",
    shortName: "VKSKV1",
    issuePlace: "TP. Hồ Chí Minh",
  },
];

const OFFENSE_OPTIONS: OffenseOption[] = [
  {
    label: "Đánh bạc - khoản 1 Điều 321",
    offenseName: "",
    legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
    criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
  {
    label: "Tổ chức đánh bạc hoặc gá bạc - Điều 322",
    offenseName: "Tổ chức đánh bạc hoặc gá bạc",
    legalArticle: "Điều 322 Bộ luật Hình sự",
    criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
  {
    label: "Trộm cắp tài sản - Điều 173",
    offenseName: "Trộm cắp tài sản",
    legalArticle: "Điều 173 Bộ luật Hình sự",
    criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
  {
    label: "Lừa đảo chiếm đoạt tài sản - Điều 174",
    offenseName: "Lừa đảo chiếm đoạt tài sản",
    legalArticle: "Điều 174 Bộ luật Hình sự",
    criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
];

const OFFICER_OPTIONS: OfficerOption[] = [
  {
    label: " - Phó Viện trưởng",
    name: "",
    title: "Phó Viện trưởng",
    agencyName: "",
  },
  {
    label: " - Phó Viện trưởng",
    name: "",
    title: "Phó Viện trưởng",
    agencyName: "",
  },
];

const SIGNER_OPTIONS: SignerOption[] = [
  {
    label: "KT. VIỆN TRƯỞNG - PHÓ VIỆN TRƯỞNG - ",
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
  {
    label: "KT. VIỆN TRƯỞNG - PHÓ VIỆN TRƯỞNG - ",
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
  {
    label: "VIỆN TRƯỞNG",
    signMode: "",
    positionTitle: "VIỆN TRƯỞNG",
    signerName: "",
  },
];

const RESPONSIBILITY_OPTIONS = [
  {
    label: "Mặc định theo BLTTHS",
    value:
      "thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự",
  },
  {
    label: "Thực hành quyền công tố và kiểm sát giải quyết vụ án",
    value:
      "thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự và chịu trách nhiệm theo quy định của Bộ luật Tố tụng hình sự",
  },
];

const DEFAULT_FORM_STATE: Bm070FormState = {
  agencyParentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  agencyName: "",
  agencyShortName: "VKSKV7",
  agencyIssuePlace: "TP. Hồ Chí Minh",

  documentCode: "70/QĐ-VKS",
  documentIssueDate: todayIsoDate(),

  caseDecisionNo: "",
  caseDecisionIssueDate: todayIsoDate(),
  caseDecisionIssuedBy: "",
  offenseName: "",
  legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
  criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  caseProsecutionDecisionLine:
    "Quyết định khởi tố vụ án hình sự số  ngày 06/5/2026 về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",

  deputyChiefName: "",
  deputyChiefTitle: "Phó Viện trưởng",
  deputyChiefAgencyName: "Viện kiểm sát nhân dân khu vực 7",
  responsibilityLine:
    "thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự",
  assignmentProcedureArticlesLine:
    "Căn cứ các điều 41, 165 và 236 của Bộ luật Tố tụng hình sự;",

  investigationAuthorityLine: "- Cơ quan, người có thẩm quyền điều tra;",
  assignedPersonLine: "- Như Điều 2;",
  archiveLine: "- Lưu: HSVA, HSKS, VP.",

  signMode: "KT. VIỆN TRƯỞNG",
  positionTitle: "PHÓ VIỆN TRƯỞNG",
  signerName: "",
};

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
}

function getString(root: unknown, path: string[], fallback = ""): string {
  let current: unknown = root;

  for (const key of path) {
    const record = asRecord(current);
    current = record[key];
  }

  if (current === null || current === undefined) {
    return fallback;
  }

  const value = String(current);
  return value.trim() ? value : fallback;
}


const BM070_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const BM070_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const BM070_YEAR_OPTIONS = Array.from({ length: 90 }, (_, index) =>
  String(new Date().getFullYear() + 5 - index),
);

function todayIsoDate(): string {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function cleanBm070Text(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function toBm070IsoDate(value: string): string {
  const raw = cleanBm070Text(value);

  if (!raw) {
    return "";
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (iso) {
    return raw;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slash) {
    return [
      slash[3],
      slash[2].padStart(2, "0"),
      slash[1].padStart(2, "0"),
    ].join("-");
  }

  const legal = raw.match(/(?:ngày\s*)?(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (legal) {
    return [
      legal[3],
      legal[2].padStart(2, "0"),
      legal[1].padStart(2, "0"),
    ].join("-");
  }

  return raw;
}

function getBm070DateParts(value: string): { day: string; month: string; year: string } {
  const iso = toBm070IsoDate(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/u);

  if (!match) {
    return { day: "", month: "", year: "" };
  }

  return {
    day: String(Number(match[3])),
    month: String(Number(match[2])),
    year: match[1],
  };
}

function makeBm070IsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function bm070LegalDate(value: string): string {
  const iso = toBm070IsoDate(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/u);

  if (!match) {
    return cleanBm070Text(value);
  }

  return `ngày ${Number(match[3])} tháng ${Number(match[2])} năm ${match[1]}`;
}

function normalizeAgencyBodyName(value: string): string {
  const raw = cleanBm070Text(value);

  if (!raw) {
    return "Viện kiểm sát nhân dân khu vực 7";
  }

  if (raw === raw.toUpperCase()) {
    return raw
      .toLocaleLowerCase("vi-VN")
      .replace(/^./u, (char) => char.toLocaleUpperCase("vi-VN"));
  }

  return raw;
}

function DateSelectField({
  label,
  value,
  onChange,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  const parts = getBm070DateParts(value);

  function updateDate(part: "day" | "month" | "year", nextValue: string) {
    const nextParts = {
      ...parts,
      [part]: nextValue,
    };

    onChange(makeBm070IsoDate(nextParts.day, nextParts.month, nextParts.year));
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <span className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={parts.day}
          onChange={(event) => updateDate("day", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Ngày</option>
          {BM070_DAY_OPTIONS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <select
          value={parts.month}
          onChange={(event) => updateDate("month", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Tháng</option>
          {BM070_MONTH_OPTIONS.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <select
          value={parts.year}
          onChange={(event) => updateDate("year", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Năm</option>
          {BM070_YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}


function normalizeDateText(value: string): string {
  return bm070LegalDate(value).replace(/^ngày\s+/u, "");
}

/* BM-070_OLD_NORMALIZE_DATE_DISABLED_START */
function __bm070OldNormalizeDateDisabled(value: string): string {
  return value.trim().replace(/^0(\d)\//, "$1/");
}
/* BM-070_OLD_NORMALIZE_DATE_DISABLED_END */

function hardBuildBm070CaseDecisionLineFromState(state: Bm070FormState): string {
  const decisionNo = cleanBm070Text(state.caseDecisionNo);
  const issueDate = bm070LegalDate(state.caseDecisionIssueDate);
  const issuedBy = cleanBm070Text(state.caseDecisionIssuedBy);
  const offenseName = cleanBm070Text(state.offenseName);
  const legalArticle = cleanBm070Text(state.legalArticle);
  const criminalCodeText = cleanBm070Text(state.criminalCodeText);

  const issuePart = issueDate ? ` ${issueDate}` : "";
  const issuedByPart = issuedBy ? ` của ${issuedBy}` : "";
  const offensePart = offenseName ? ` về tội “${offenseName}”` : "";
  const legalPart = legalArticle ? ` quy định tại ${legalArticle}` : "";
  const codePart = criminalCodeText ? ` của ${criminalCodeText}` : "";

  return `Quyết định khởi tố vụ án hình sự số ${decisionNo}${issuePart}${issuedByPart}${offensePart}${legalPart}${codePart}`;
}

function buildCaseDecisionLine(state: Bm070FormState): string {
  return hardBuildBm070CaseDecisionLineFromState(state);
}

function buildStateFromPayload(payload: unknown): Bm070FormState {
  const state: Bm070FormState = {
    agencyParentName: getString(
      payload,
      ["agency", "parentName"],
      DEFAULT_FORM_STATE.agencyParentName,
    ),
    agencyName: getString(payload, ["agency", "name"], DEFAULT_FORM_STATE.agencyName),
    agencyShortName: getString(
      payload,
      ["agency", "shortName"],
      DEFAULT_FORM_STATE.agencyShortName,
    ),
    agencyIssuePlace: getString(
      payload,
      ["agency", "issuePlace"],
      DEFAULT_FORM_STATE.agencyIssuePlace,
    ),

    documentCode: getString(
      payload,
      ["document", "documentCode"],
      DEFAULT_FORM_STATE.documentCode,
    ),
    documentIssueDate: getString(
      payload,
      ["document", "issueDate"],
      DEFAULT_FORM_STATE.documentIssueDate,
    ),

    caseDecisionNo: getString(
      payload,
      ["caseDecision", "decisionNo"],
      DEFAULT_FORM_STATE.caseDecisionNo,
    ),
    caseDecisionIssueDate: getString(
      payload,
      ["caseDecision", "issueDate"],
      DEFAULT_FORM_STATE.caseDecisionIssueDate,
    ),
    caseDecisionIssuedBy: getString(payload, ["caseDecision", "issuedBy"], ""),
    offenseName: getString(
      payload,
      ["offense", "offenseName"],
      DEFAULT_FORM_STATE.offenseName,
    ),
    legalArticle: getString(
      payload,
      ["offense", "legalArticle"],
      DEFAULT_FORM_STATE.legalArticle,
    ),
    criminalCodeText: getString(
      payload,
      ["offense", "criminalCodeText"],
      DEFAULT_FORM_STATE.criminalCodeText,
    ),
    caseProsecutionDecisionLine: getString(
      payload,
      ["caseDecision", "caseProsecutionDecisionLine"],
      DEFAULT_FORM_STATE.caseProsecutionDecisionLine,
    ),

    deputyChiefName: getString(
      payload,
      ["assignment", "deputyChiefName"],
      DEFAULT_FORM_STATE.deputyChiefName,
    ),
    deputyChiefTitle: getString(
      payload,
      ["assignment", "deputyChiefTitle"],
      DEFAULT_FORM_STATE.deputyChiefTitle,
    ),
    deputyChiefAgencyName: getString(
      payload,
      ["assignment", "deputyChiefAgencyName"],
      DEFAULT_FORM_STATE.deputyChiefAgencyName,
    ),
    responsibilityLine: getString(
      payload,
      ["assignment", "responsibilityLine"],
      DEFAULT_FORM_STATE.responsibilityLine,
    ),
    assignmentProcedureArticlesLine: getString(
      payload,
      ["legalBasis", "assignmentProcedureArticlesLine"],
      DEFAULT_FORM_STATE.assignmentProcedureArticlesLine,
    ),

    investigationAuthorityLine: getString(
      payload,
      ["recipients", "investigationAuthorityLine"],
      DEFAULT_FORM_STATE.investigationAuthorityLine,
    ),
    assignedPersonLine: getString(
      payload,
      ["recipients", "assignedPersonLine"],
      DEFAULT_FORM_STATE.assignedPersonLine,
    ),
    archiveLine: getString(
      payload,
      ["recipients", "archiveLine"],
      DEFAULT_FORM_STATE.archiveLine,
    ),

    signMode: getString(
      payload,
      ["signature", "signMode"],
      DEFAULT_FORM_STATE.signMode,
    ),
    positionTitle: getString(
      payload,
      ["signature", "positionTitle"],
      DEFAULT_FORM_STATE.positionTitle,
    ),
    signerName: getString(
      payload,
      ["signature", "signerName"],
      DEFAULT_FORM_STATE.signerName,
    ),
  };

  return {
    ...state,
    caseProsecutionDecisionLine:
      state.caseProsecutionDecisionLine.trim() || buildCaseDecisionLine(state),
  };
}


function prepareBm070StateForSave(rawState: Bm070FormState): Bm070FormState {
  const documentIssueDate = toBm070IsoDate(rawState.documentIssueDate) || todayIsoDate();
  const caseDecisionIssueDate =
    toBm070IsoDate(rawState.caseDecisionIssueDate) || todayIsoDate();

  const state: Bm070FormState = {
    ...rawState,

    agencyParentName:
      cleanBm070Text(rawState.agencyParentName) ||
      "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    agencyName:
      cleanBm070Text(rawState.agencyName) ||
      "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    agencyShortName: cleanBm070Text(rawState.agencyShortName) || "VKSKV7",
    agencyIssuePlace:
      cleanBm070Text(rawState.agencyIssuePlace) || "TP. Hồ Chí Minh",

    documentCode: cleanBm070Text(rawState.documentCode) || "70/QĐ-VKSKV7",
    documentIssueDate,

    caseDecisionNo:
      cleanBm070Text(rawState.caseDecisionNo) || "",
    caseDecisionIssueDate,
    caseDecisionIssuedBy: cleanBm070Text(rawState.caseDecisionIssuedBy),

    offenseName: cleanBm070Text(rawState.offenseName) || "Đánh bạc",
    legalArticle:
      cleanBm070Text(rawState.legalArticle) ||
      "khoản 1 Điều 321 Bộ luật Hình sự",
    criminalCodeText:
      cleanBm070Text(rawState.criminalCodeText) ||
      "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",

    deputyChiefName:
      cleanBm070Text(rawState.deputyChiefName) || "",
    deputyChiefTitle:
      cleanBm070Text(rawState.deputyChiefTitle) || "Phó Viện trưởng",
    deputyChiefAgencyName:
      cleanBm070Text(rawState.deputyChiefAgencyName) ||
      normalizeAgencyBodyName(rawState.agencyName),

    responsibilityLine:
      cleanBm070Text(rawState.responsibilityLine) ||
      "thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự",

    assignmentProcedureArticlesLine:
      cleanBm070Text(rawState.assignmentProcedureArticlesLine) ||
      "Căn cứ các điều 41, 165 và 236 của Bộ luật Tố tụng hình sự;",

    investigationAuthorityLine:
      cleanBm070Text(rawState.investigationAuthorityLine) ||
      "- Cơ quan, người có thẩm quyền điều tra;",
    assignedPersonLine:
      cleanBm070Text(rawState.assignedPersonLine) || "- Như Điều 2;",
    archiveLine:
      cleanBm070Text(rawState.archiveLine) || "- Lưu: HSVA, HSKS, VP.",

    signMode: cleanBm070Text(rawState.signMode) || "KT. VIỆN TRƯỞNG",
    positionTitle:
      cleanBm070Text(rawState.positionTitle) || "PHÓ VIỆN TRƯỞNG",
    signerName: cleanBm070Text(rawState.signerName) || "",

    caseProsecutionDecisionLine: "",
  };

  return {
    ...state,
    caseProsecutionDecisionLine: hardBuildBm070CaseDecisionLineFromState(state),
  };
}


function buildBm070RenderPayloadFromState(rawState: Bm070FormState): JsonRecord {
  const state = prepareBm070StateForSave(rawState);
  const caseDecisionLine = hardBuildBm070CaseDecisionLineFromState(state);
  const agencyNameBody = normalizeAgencyBodyName(state.agencyName);

  return {
    agency: {
      parentName: state.agencyParentName,
      name: state.agencyName,
      shortName: state.agencyShortName,
      issuePlace: state.agencyIssuePlace,
      nameBody: agencyNameBody,
      parentNameBody: "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    },
    document: {
      documentCode: state.documentCode,
      documentNo: state.documentCode,
      fullDocumentCode: state.documentCode,
      issueDate: state.documentIssueDate,
      issuePlace: state.agencyIssuePlace,
      issuePlaceAndDateLine: `${state.agencyIssuePlace}, ${bm070LegalDate(state.documentIssueDate)}`,
      issuePlaceDateLine: `${state.agencyIssuePlace}, ${bm070LegalDate(state.documentIssueDate)}`,
    },
    official: {
      issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    },
    legalBasis: {
      assignmentProcedureArticlesLine: state.assignmentProcedureArticlesLine,
    },
    caseDecision: {
      decisionNo: state.caseDecisionNo,
      decisionCode: state.caseDecisionNo,
      issueDate: state.caseDecisionIssueDate,
      decisionDate: state.caseDecisionIssueDate,
      issuedBy: state.caseDecisionIssuedBy,
      legalBasisLine: caseDecisionLine,
      caseProsecutionDecisionLine: caseDecisionLine,
      prosecutionDecisionLegalBasisLine: caseDecisionLine,
      prosecutionDecisionSummaryLine: caseDecisionLine,
    },
    offense: {
      offenseName: state.offenseName,
      legalArticle: state.legalArticle,
      criminalCodeText: state.criminalCodeText,
    },
    assignment: {
      deputyChiefName: state.deputyChiefName,
      deputyChiefTitle: state.deputyChiefTitle,
      deputyChiefAgencyName: state.deputyChiefAgencyName,
      responsibilityLine: state.responsibilityLine,
    },
    recipients: {
      investigationAuthorityLine: state.investigationAuthorityLine,
      assignedPersonLine: state.assignedPersonLine,
      archiveLine: state.archiveLine,
    },
    signature: {
      signMode: state.signMode,
      positionTitle: state.positionTitle,
      signerName: state.signerName,
    },
  };
}

function buildFormInputsPayload(state: Bm070FormState): JsonRecord {
  state = prepareBm070StateForSave(state);
  const caseProsecutionDecisionLine =
    state.caseProsecutionDecisionLine.trim() || buildCaseDecisionLine(state);

  return {
    agency: {
      parentName: state.agencyParentName,
      name: state.agencyName,
      shortName: state.agencyShortName,
      issuePlace: state.agencyIssuePlace,
      issuePlaceAndDateLine: `${state.agencyIssuePlace}, ${bm070LegalDate(state.documentIssueDate)}`,
    },
    document: {
      documentCode: state.documentCode,
      documentNo: state.documentCode,
      issueDate: state.documentIssueDate,
      issuePlace: state.agencyIssuePlace,
      nameBody: normalizeAgencyBodyName(state.agencyName),
      parentNameBody: "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    },
    offense: {
      offenseName: state.offenseName,
      legalArticle: state.legalArticle,
      criminalCodeText: state.criminalCodeText,
    },
    caseDecision: {
      decisionNo: state.caseDecisionNo,
      issueDate: state.caseDecisionIssueDate,
      issuedBy: state.caseDecisionIssuedBy,
      caseProsecutionDecisionLine,
    },
    assignment: {
      deputyChiefName: state.deputyChiefName,
      deputyChiefTitle: state.deputyChiefTitle,
      deputyChiefAgencyName: state.deputyChiefAgencyName,
      responsibilityLine: state.responsibilityLine,
    },
    legalBasis: {
      assignmentProcedureArticlesLine: state.assignmentProcedureArticlesLine,
    },
    official: {
      issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    },
    recipients: {
      investigationAuthorityLine: state.investigationAuthorityLine,
      assignedPersonLine: state.assignedPersonLine,
      archiveLine: state.archiveLine,
    },
    signature: {
      signMode: state.signMode,
      positionTitle: state.positionTitle,
      signerName: state.signerName,
    },
  };
}

export function Bm070FormInputsPanel({
  documentId,
  onSaved,
}: Bm070FormInputsPanelProps) {
  const [formState, setFormState] =
    useState<Bm070FormState>(DEFAULT_FORM_STATE);
  const [initialState, setInitialState] =
    useState<Bm070FormState>(DEFAULT_FORM_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const readyState = useMemo(
    () => prepareBm070StateForSave(formState),
    [formState],
  );

  const isDirty = useMemo(
    () => JSON.stringify(readyState) !== JSON.stringify(initialState),
    [readyState, initialState],
  );

  const updateField = useCallback(
    (field: keyof Bm070FormState, value: string) => {
      setFormState((current) => ({
        ...current,
        [field]: value,
      }));
      setMessage(null);
      setErrorMessage(null);
    },
    [],
  );

  const loadPayload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`Không tải được render-payload: HTTP ${response.status}`);
      }

      const payload: unknown = await response.json();
      const nextState = prepareBm070StateForSave(buildStateFromPayload(payload));

      setFormState(nextState);
      setInitialState(nextState);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không tải được dữ liệu BM-070.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void loadPayload();
  }, [loadPayload]);

  function applyAgencyOption(indexText: string) {
    const index = Number(indexText);
    const option = AGENCY_OPTIONS[index];

    if (!option) {
      return;
    }

    setFormState((current) => ({
      ...current,
      agencyParentName: option.parentName,
      agencyName: option.name,
      agencyShortName: option.shortName,
      agencyIssuePlace: option.issuePlace,
      deputyChiefAgencyName: option.name,
    }));
  }

  function applyOffenseOption(indexText: string) {
    const index = Number(indexText);
    const option = OFFENSE_OPTIONS[index];

    if (!option) {
      return;
    }

    setFormState((current) => {
      const next = {
        ...current,
        offenseName: option.offenseName,
        legalArticle: option.legalArticle,
        criminalCodeText: option.criminalCodeText,
      };

      return {
        ...next,
        caseProsecutionDecisionLine: buildCaseDecisionLine(next),
      };
    });
  }

  function applyOfficerOption(indexText: string) {
    const index = Number(indexText);
    const option = OFFICER_OPTIONS[index];

    if (!option) {
      return;
    }

    setFormState((current) => ({
      ...current,
      deputyChiefName: option.name,
      deputyChiefTitle: option.title,
      deputyChiefAgencyName: option.agencyName,
    }));
  }

  function applySignerOption(indexText: string) {
    const index = Number(indexText);
    const option = SIGNER_OPTIONS[index];

    if (!option) {
      return;
    }

    setFormState((current) => ({
      ...current,
      signMode: option.signMode,
      positionTitle: option.positionTitle,
      signerName: option.signerName,
    }));
  }

  function applyResponsibilityOption(indexText: string) {
    const index = Number(indexText);
    const option = RESPONSIBILITY_OPTIONS[index];

    if (!option) {
      return;
    }

    updateField("responsibilityLine", option.value);
  }

  function regenerateCaseDecisionLine() {
    setFormState((current) => ({
      ...current,
      caseProsecutionDecisionLine: buildCaseDecisionLine(current),
    }));
  }

  function handleFillSampleData() {
    setFormState(prepareBm070StateForSave(DEFAULT_FORM_STATE));
    setMessage("Đã điền dữ liệu mẫu BM-070. Bấm Lưu dữ liệu BM-070 để ghi vào hồ sơ.");
    setErrorMessage(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const formToSave = prepareBm070StateForSave(formState);
      const payloadToSave = buildBm070RenderPayloadFromState(formToSave);

      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            ...payloadToSave,

            templateCode: "BM-070",

            // Raw state: giữ toàn bộ input khách nhập, để sau này ô nào đổi cũng còn dữ liệu.
            formState: formToSave,
            bm070FormState: formToSave,

            // Nested payload: backend render trực tiếp theo nhóm template dùng.
            formInputs: payloadToSave,
            payloadOverrides: payloadToSave,
            renderPayloadOverrides: payloadToSave,

            // Flat atomic fields: backup source-of-truth cho backend.
            documentCode: formToSave.documentCode,
            documentIssueDate: formToSave.documentIssueDate,
            caseDecisionNo: formToSave.caseDecisionNo,
            caseDecisionIssueDate: formToSave.caseDecisionIssueDate,
            caseDecisionIssuedBy: formToSave.caseDecisionIssuedBy,
            offenseName: formToSave.offenseName,
            legalArticle: formToSave.legalArticle,
            criminalCodeText: formToSave.criminalCodeText,
            assignmentProcedureArticlesLine:
              formToSave.assignmentProcedureArticlesLine,
            deputyChiefName: formToSave.deputyChiefName,
            deputyChiefTitle: formToSave.deputyChiefTitle,
            deputyChiefAgencyName: formToSave.deputyChiefAgencyName,
            responsibilityLine: formToSave.responsibilityLine,
            investigationAuthorityLine: formToSave.investigationAuthorityLine,
            assignedPersonLine: formToSave.assignedPersonLine,
            archiveLine: formToSave.archiveLine,
            signMode: formToSave.signMode,
            positionTitle: formToSave.positionTitle,
            signerName: formToSave.signerName,

            updatedByName: formToSave.signerName || "",
            renderedByName: formToSave.signerName || "",
            convertedByName: formToSave.signerName || "",
          }),
        },
      );

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
          responseText || `Không lưu được dữ liệu BM-070: HTTP ${response.status}`,
        );
      }

      setFormState(formToSave);
      setInitialState(formToSave);
      setMessage("Đã lưu dữ liệu BM-070. Có thể render lại DOCX/PDF.");
      onSaved?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không lưu được dữ liệu BM-070.";

      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu biểu mẫu BM-070...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <BmFlatFormCasePayloadButton templateCode="BM-070" form={formState} onApply={(next) => setFormState(next as unknown as typeof formState)} />
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            BM-070
          </p>
          <h2 className="text-xl font-bold text-slate-950">
            Dữ liệu biểu mẫu Quyết định phân công Phó Viện trưởng
          </h2>
          <p className="max-w-4xl text-sm leading-6 text-slate-600">
            Form này chỉ nhập các nhóm dữ liệu riêng của BM-070: cơ quan, văn bản,
            quyết định khởi tố vụ án, người được phân công, nhiệm vụ, nơi nhận và chữ ký.
            Không dùng form BM-053/BM-056 vì nghiệp vụ khác.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleFillSampleData}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-070
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-070"}
          </button>

          <button
            type="button"
            onClick={() => void loadPayload()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Tải lại từ backend
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <BmFormSection title="1. Cơ quan ban hành">
        <BmFieldSelect
          label="Chọn nhanh cơ quan"
          value=""
          onChange={applyAgencyOption}
          options={AGENCY_OPTIONS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          placeholder="-- Chọn --"

        />
        <BmFieldText
          label="Cơ quan cấp trên"
          value={formState.agencyParentName}
          onChange={(value) => updateField("agencyParentName", value)}
        />
        <BmFieldText
          label="Cơ quan ban hành"
          value={formState.agencyName}
          onChange={(value) => updateField("agencyName", value)}
        />
        <BmFieldText
          label="Tên viết tắt"
          value={formState.agencyShortName}
          onChange={(value) => updateField("agencyShortName", value)}
        />
        <BmFieldText
          label="Địa danh ban hành"
          value={formState.agencyIssuePlace}
          onChange={(value) => updateField("agencyIssuePlace", value)}
        />
      </BmFormSection>

      <BmFormSection title="2. Thông tin văn bản">
        <BmFieldText
          label="Số quyết định"
          value={formState.documentCode}
          onChange={(value) => updateField("documentCode", value)}
        />
        <DateSelectField
          label="Ngày ban hành"
          required
          value={formState.documentIssueDate}
          onChange={(value) => updateField("documentIssueDate", value)}
        />
        <BmFieldTextarea
          label="Căn cứ pháp lý BLTTHS"
          value={formState.assignmentProcedureArticlesLine}
          onChange={(value) =>
            updateField("assignmentProcedureArticlesLine", value)
          }

        />
      </BmFormSection>

      <BmFormSection title="3. Quyết định khởi tố vụ án">
        <BmFieldText
          label="Số quyết định khởi tố vụ án"
          value={formState.caseDecisionNo}
          onChange={(value) => updateField("caseDecisionNo", value)}
        />
        <DateSelectField
          label="Ngày quyết định"
          required
          value={formState.caseDecisionIssueDate}
          onChange={(value) => updateField("caseDecisionIssueDate", value)}
        />
        <BmFieldTextarea
          label="Cơ quan ban hành quyết định khởi tố"
          value={formState.caseDecisionIssuedBy}
          onChange={(value) => updateField("caseDecisionIssuedBy", value)}

        />
        <BmFieldSelect
          label="Chọn nhanh tội danh"
          value=""
          onChange={applyOffenseOption}
          options={OFFENSE_OPTIONS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          placeholder="-- Chọn --"

        />
        <BmFieldText
          label="Tội danh"
          value={formState.offenseName}
          onChange={(value) => updateField("offenseName", value)}
        />
        <BmFieldText
          label="Điều khoản áp dụng"
          value={formState.legalArticle}
          onChange={(value) => updateField("legalArticle", value)}
        />
        <BmFieldTextarea
          label="Bộ luật áp dụng"
          value={formState.criminalCodeText}
          onChange={(value) => updateField("criminalCodeText", value)}

        />
        <BmFieldTextarea
          label="Dòng căn cứ quyết định khởi tố vụ án"
          value={formState.caseProsecutionDecisionLine}
          onChange={(value) => updateField("caseProsecutionDecisionLine", value)}

        />
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={regenerateCaseDecisionLine}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Tạo lại dòng căn cứ từ dữ liệu bên trên
          </button>
        </div>
      </BmFormSection>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-950">
          Preview trước khi xuất
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Kiểm nhanh phần căn cứ, phân công, nơi nhận và chữ ký trước khi render DOCX/PDF.
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p>
            <strong>Số văn bản:</strong> {readyState.documentCode}
          </p>
          <p>
            <strong>Ngày ban hành:</strong> {readyState.agencyIssuePlace},{" "}
            {bm070LegalDate(readyState.documentIssueDate)}
          </p>
          <p>
            <strong>Căn cứ BLTTHS:</strong>{" "}
            {readyState.assignmentProcedureArticlesLine}
          </p>
          <p>
            <strong>Quyết định khởi tố:</strong>{" "}
            {hardBuildBm070CaseDecisionLineFromState(readyState)}
          </p>
          <p>
            <strong>Người được phân công:</strong>{" "}
            {readyState.deputyChiefTitle} {readyState.deputyChiefName} —{" "}
            {readyState.deputyChiefAgencyName}
          </p>
          <p>
            <strong>Trách nhiệm:</strong> {readyState.responsibilityLine}
          </p>
          <p>
            <strong>Nơi nhận:</strong> {readyState.investigationAuthorityLine}{" "}
            {readyState.assignedPersonLine} {readyState.archiveLine}
          </p>
          <p>
            <strong>Chữ ký:</strong> {readyState.signMode}{" "}
            {readyState.positionTitle} — {readyState.signerName}
          </p>
        </div>
      </section>



      <BmFormSection title="4. Người được phân công">
        <BmFieldSelect
          label="Chọn nhanh Phó Viện trưởng"
          value=""
          onChange={applyOfficerOption}
          options={OFFICER_OPTIONS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          placeholder="-- Chọn --"

        />
        <BmFieldText
          label="Họ tên Phó Viện trưởng"
          value={formState.deputyChiefName}
          onChange={(value) => updateField("deputyChiefName", value)}
        />
        <BmFieldText
          label="Chức danh"
          value={formState.deputyChiefTitle}
          onChange={(value) => updateField("deputyChiefTitle", value)}
        />
        <BmFieldText
          label="Đơn vị"
          value={formState.deputyChiefAgencyName}
          onChange={(value) => updateField("deputyChiefAgencyName", value)}

        />
      </BmFormSection>

      <BmFormSection title="5. Nhiệm vụ / Điều 2">
        <BmFieldSelect
          label="Chọn nhanh dòng nhiệm vụ"
          value=""
          onChange={applyResponsibilityOption}
          options={RESPONSIBILITY_OPTIONS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          placeholder="-- Chọn --"

        />
        <BmFieldTextarea
          label="Dòng nhiệm vụ, quyền hạn, trách nhiệm"
          value={formState.responsibilityLine}
          onChange={(value) => updateField("responsibilityLine", value)}

        />
      </BmFormSection>

      <BmFormSection title="6. Nơi nhận">
        <BmFieldTextarea
          label="Dòng cơ quan điều tra"
          value={formState.investigationAuthorityLine}
          onChange={(value) => updateField("investigationAuthorityLine", value)}

        />
        <BmFieldTextarea
          label="Dòng người được phân công"
          value={formState.assignedPersonLine}
          onChange={(value) => updateField("assignedPersonLine", value)}
        />
        <BmFieldTextarea
          label="Dòng lưu hồ sơ"
          value={formState.archiveLine}
          onChange={(value) => updateField("archiveLine", value)}
        />
      </BmFormSection>

      <BmFormSection title="7. Chữ ký">
        <BmFieldSelect
          label="Chọn nhanh người ký"
          value=""
          onChange={applySignerOption}
          options={SIGNER_OPTIONS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          placeholder="-- Chọn --"

        />
        <BmFieldSelect
          label="Hình thức ký"
          value={formState.signMode}
          onChange={(value) => updateField("signMode", value)}
          options={[
            { label: "KT. VIỆN TRƯỞNG", value: "KT. VIỆN TRƯỞNG" },
            { label: "TUQ. VIỆN TRƯỞNG", value: "TUQ. VIỆN TRƯỞNG" },
            { label: "Không ghi hình thức ký", value: "" },
          ]}
        />
        <BmFieldSelect
          label="Chức vụ ký"
          value={formState.positionTitle}
          onChange={(value) => updateField("positionTitle", value)}
          options={[
            { label: "PHÓ VIỆN TRƯỞNG", value: "PHÓ VIỆN TRƯỞNG" },
            { label: "VIỆN TRƯỞNG", value: "VIỆN TRƯỞNG" },
            { label: "KIỂM SÁT VIÊN", value: "KIỂM SÁT VIÊN" },
          ]}
        />
        <BmFieldText
          label="Người ký"
          value={formState.signerName}
          onChange={(value) => updateField("signerName", value)}

        />
      </BmFormSection>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Sau khi lưu, backend sẽ dùng các nhóm <strong>assignment</strong>,{" "}
            <strong>legalBasis</strong>, <strong>caseDecision</strong>,{" "}
            <strong>recipients</strong> và <strong>signature</strong> để render BM-070.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-070"}
          </button>
        </div>
      </div>
    </section>
  );
}

type Option = {
  label: string;
  value: string;
};

type CommonFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

