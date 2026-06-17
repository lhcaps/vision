"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Bm071FormInputsPanelProps = {
  documentId: string;
  onSaved?: () => void;
};

type JsonRecord = Record<string, unknown>;

type Bm071FormState = {
  agencyParentName: string;
  agencyName: string;
  agencyShortName: string;
  agencyIssuePlace: string;

  documentCode: string;
  documentIssueDate: string;

  officialIssuerTitle: string;
  staffAssignmentProcedureArticlesLine: string;

  caseDecisionNo: string;
  caseDecisionIssueDate: string;
  caseDecisionIssuedBy: string;
  offenseName: string;
  legalArticle: string;
  criminalCodeText: string;
  caseProsecutionDecisionLine: string;

  assignedRoleText: string;
  assignedOfficerName: string;
  assignedOfficerTitle: string;
  assignedOfficerAgencyName: string;
  additionalAssignedOfficersLine: string;
  responsibilityLine: string;

  investigationAuthorityLine: string;
  assignedPersonLine: string;
  archiveLine: string;

  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Option = {
  label: string;
  value: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_FORM_STATE: Bm071FormState = {
  agencyParentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  agencyName: "",
  agencyShortName: "VKSKV7",
  agencyIssuePlace: "TP. Hồ Chí Minh",

  documentCode: "71/QĐ-VKSKV7",
  documentIssueDate: "",

  officialIssuerTitle:
    "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  staffAssignmentProcedureArticlesLine:
    "Căn cứ các điều 41, 42, 43, 165 và 236 của Bộ luật Tố tụng hình sự;",

  caseDecisionNo: "",
  caseDecisionIssueDate: "",
  caseDecisionIssuedBy:
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  offenseName: "Tổ chức đánh bạc hoặc gá bạc",
  legalArticle: "Điều 322 Bộ luật Hình sự",
  criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  caseProsecutionDecisionLine: "",

  assignedRoleText: "Kiểm sát viên",
  assignedOfficerName: "",
  assignedOfficerTitle: "Kiểm sát viên",
  assignedOfficerAgencyName: "Viện kiểm sát nhân dân khu vực 7",
  additionalAssignedOfficersLine:
    "Phân công ông/bà ; Kiểm tra viên của Viện kiểm sát nhân dân khu vực 7 tham gia thực hành quyền công tố, kiểm sát việc giải quyết vụ án.",
  responsibilityLine:
    "thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự",

  investigationAuthorityLine: "- Cơ quan, người có thẩm quyền điều tra;",
  assignedPersonLine: "- Như Điều 2;",
  archiveLine: "- Lưu: HSVA, HSKS, VP.",

  signMode: "KT. VIỆN TRƯỞNG",
  positionTitle: "PHÓ VIỆN TRƯỞNG",
  signerName: "",
};

const AGENCY_PRESETS = [
  {
    label: "VKSND Khu vực 7 - TP. Hồ Chí Minh",
    parentName: "",
    name: "",
    shortName: "VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
  },
];

const OFFICER_PRESETS = [
  {
    label: " - Kiểm sát viên",
    name: "",
    title: "Kiểm sát viên",
    agencyName: "",
    roleText: "Kiểm sát viên",
  },
  {
    label: " - Kiểm sát viên",
    name: "",
    title: "Kiểm sát viên",
    agencyName: "",
    roleText: "Kiểm sát viên",
  },
  {
    label: " - Kiểm tra viên",
    name: "",
    title: "Kiểm tra viên",
    agencyName: "",
    roleText: "Kiểm tra viên",
  },
];

const ROLE_OPTIONS: Option[] = [
  { label: "Kiểm sát viên", value: "Kiểm sát viên" },
  { label: "Kiểm tra viên", value: "Kiểm tra viên" },
  { label: "Kiểm sát viên/Kiểm tra viên", value: "Kiểm sát viên/Kiểm tra viên" },
];

const ADDITIONAL_ASSIGNMENT_OPTIONS: Option[] = [
  {
    label: "Có Kiểm tra viên phối hợp",
    value:
      "Phân công ông/bà ; Kiểm tra viên của Viện kiểm sát nhân dân khu vực 7 tham gia thực hành quyền công tố, kiểm sát việc giải quyết vụ án.",
  },
  {
    label: "Không có dòng phân công bổ sung",
    value: "",
  },
  {
    label: "Giữ dòng trống theo mẫu",
    value: "Phân công …………………………………………………………………..",
  },
];

const SIGNER_PRESETS = [
  {
    label: "KT. VIỆN TRƯỞNG - PHÓ VIỆN TRƯỞNG - ",
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
  {
    label: "VIỆN TRƯỞNG - ",
    signMode: "",
    positionTitle: "VIỆN TRƯỞNG",
    signerName: "",
  },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const YEAR_OPTIONS = Array.from({ length: 90 }, (_, index) =>
  String(new Date().getFullYear() + 5 - index),
);

const REQUIRED_FIELDS: Array<{ key: keyof Bm071FormState; label: string }> = [
  { key: "agencyParentName", label: "Cơ quan cấp trên" },
  { key: "agencyName", label: "Cơ quan ban hành" },
  { key: "documentCode", label: "Số quyết định" },
  { key: "documentIssueDate", label: "Ngày ban hành" },
  { key: "staffAssignmentProcedureArticlesLine", label: "Căn cứ pháp lý" },
  { key: "caseDecisionNo", label: "Số quyết định khởi tố" },
  { key: "caseDecisionIssueDate", label: "Ngày quyết định khởi tố" },
  { key: "assignedOfficerName", label: "Người được phân công" },
  { key: "responsibilityLine", label: "Điều 2 - nhiệm vụ" },
  { key: "signerName", label: "Người ký" },
];

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
}

function getString(root: unknown, path: string[], fallback = ""): string {
  let current: unknown = root;

  for (const key of path) {
    current = asRecord(current)[key];
  }

  if (current === null || current === undefined) {
    return fallback;
  }

  const value = String(current).trim();
  return value || fallback;
}

function cleanText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function todayIsoDate(): string {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function toIsoDate(value: string): string {
  const raw = cleanText(value);

  if (!raw) {
    return "";
  }

  const iso = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/u);
  if (iso) {
    return [
      iso[1],
      iso[2].padStart(2, "0"),
      iso[3].padStart(2, "0"),
    ].join("-");
  }

  const slash = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/u);
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

  return "";
}

function getDateParts(value: string): { day: string; month: string; year: string } {
  const iso = toIsoDate(value);
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

function makeIsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function legalDate(value: string): string {
  const iso = toIsoDate(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/u);

  if (!match) {
    return cleanText(value);
  }

  return `ngày ${Number(match[3])} tháng ${Number(match[2])} năm ${match[1]}`;
}

function normalizeAgencyBodyName(value: string): string {
  const raw = cleanText(value);

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

function buildCaseDecisionLine(state: Bm071FormState): string {
  const decisionNo = cleanText(state.caseDecisionNo);
  const issueDate = legalDate(state.caseDecisionIssueDate);
  const issuedBy = cleanText(state.caseDecisionIssuedBy);
  const offenseName = cleanText(state.offenseName);
  const legalArticle = cleanText(state.legalArticle);
  const criminalCodeText = cleanText(state.criminalCodeText);

  return [
    decisionNo ? `Quyết định khởi tố vụ án hình sự số ${decisionNo}` : "",
    issueDate,
    issuedBy ? `của ${issuedBy}` : "",
    offenseName ? `về tội “${offenseName}”` : "",
    legalArticle ? `quy định tại ${legalArticle}` : "",
    criminalCodeText ? `của ${criminalCodeText}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildAdditionalAssignmentLine(state: Bm071FormState): string {
  const current = cleanText(state.additionalAssignedOfficersLine);

  if (current) {
    return current;
  }

  return "";
}

function prepareState(rawState: Bm071FormState): Bm071FormState {
  const state: Bm071FormState = {
    ...rawState,
    agencyParentName:
      cleanText(rawState.agencyParentName) ||
      DEFAULT_FORM_STATE.agencyParentName,
    agencyName:
      cleanText(rawState.agencyName) || DEFAULT_FORM_STATE.agencyName,
    agencyShortName:
      cleanText(rawState.agencyShortName) || DEFAULT_FORM_STATE.agencyShortName,
    agencyIssuePlace:
      cleanText(rawState.agencyIssuePlace) ||
      DEFAULT_FORM_STATE.agencyIssuePlace,

    documentCode:
      cleanText(rawState.documentCode) || DEFAULT_FORM_STATE.documentCode,
    documentIssueDate: toIsoDate(rawState.documentIssueDate) || todayIsoDate(),

    officialIssuerTitle:
      cleanText(rawState.officialIssuerTitle) ||
      DEFAULT_FORM_STATE.officialIssuerTitle,
    staffAssignmentProcedureArticlesLine:
      cleanText(rawState.staffAssignmentProcedureArticlesLine) ||
      DEFAULT_FORM_STATE.staffAssignmentProcedureArticlesLine,

    caseDecisionNo:
      cleanText(rawState.caseDecisionNo) || DEFAULT_FORM_STATE.caseDecisionNo,
    caseDecisionIssueDate:
      toIsoDate(rawState.caseDecisionIssueDate) || todayIsoDate(),
    caseDecisionIssuedBy: cleanText(rawState.caseDecisionIssuedBy),

    // Không auto-fill 3 field này khi user đang sửa BM-071.
    // Nếu để default ở đây, xoá field sẽ bị tự nhảy lại dữ liệu cũ/BM-070.
    offenseName: cleanText(rawState.offenseName),
    legalArticle: cleanText(rawState.legalArticle),
    criminalCodeText: cleanText(rawState.criminalCodeText),

    assignedRoleText:
      cleanText(rawState.assignedRoleText) ||
      DEFAULT_FORM_STATE.assignedRoleText,
    assignedOfficerName:
      cleanText(rawState.assignedOfficerName) ||
      DEFAULT_FORM_STATE.assignedOfficerName,
    assignedOfficerTitle:
      cleanText(rawState.assignedOfficerTitle) ||
      DEFAULT_FORM_STATE.assignedOfficerTitle,
    assignedOfficerAgencyName:
      cleanText(rawState.assignedOfficerAgencyName) ||
      normalizeAgencyBodyName(rawState.agencyName),

    additionalAssignedOfficersLine: cleanText(
      rawState.additionalAssignedOfficersLine,
    ),
    responsibilityLine:
      cleanText(rawState.responsibilityLine) ||
      DEFAULT_FORM_STATE.responsibilityLine,

    investigationAuthorityLine:
      cleanText(rawState.investigationAuthorityLine) ||
      DEFAULT_FORM_STATE.investigationAuthorityLine,
    assignedPersonLine:
      cleanText(rawState.assignedPersonLine) ||
      DEFAULT_FORM_STATE.assignedPersonLine,
    archiveLine:
      cleanText(rawState.archiveLine) || DEFAULT_FORM_STATE.archiveLine,

    signMode: cleanText(rawState.signMode) || DEFAULT_FORM_STATE.signMode,
    positionTitle:
      cleanText(rawState.positionTitle) || DEFAULT_FORM_STATE.positionTitle,
    signerName: cleanText(rawState.signerName) || DEFAULT_FORM_STATE.signerName,

    caseProsecutionDecisionLine: "",
  };

  return {
    ...state,
    caseProsecutionDecisionLine: buildCaseDecisionLine(state),
    additionalAssignedOfficersLine: buildAdditionalAssignmentLine(state),
  };
}

function buildPayloadFromState(rawState: Bm071FormState): JsonRecord {
  const state = prepareState(rawState);
  const caseLine = buildCaseDecisionLine(state);
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
      issuePlaceAndDateLine: `${state.agencyIssuePlace}, ${legalDate(
        state.documentIssueDate,
      )}`,
      issuePlaceDateLine: `${state.agencyIssuePlace}, ${legalDate(
        state.documentIssueDate,
      )}`,
    },
    official: {
      issuerTitle: state.officialIssuerTitle,
    },
    legalBasis: {
      staffAssignmentProcedureArticlesLine:
        state.staffAssignmentProcedureArticlesLine,
    },
    caseDecision: {
      decisionNo: state.caseDecisionNo,
      decisionCode: state.caseDecisionNo,
      issueDate: state.caseDecisionIssueDate,
      decisionDate: state.caseDecisionIssueDate,
      issuedBy: state.caseDecisionIssuedBy,
      caseProsecutionDecisionLine: caseLine,
      legalBasisLine: caseLine,
      prosecutionDecisionLegalBasisLine: caseLine,
      prosecutionDecisionSummaryLine: caseLine,
    },
    offense: {
      offenseName: state.offenseName,
      legalArticle: state.legalArticle,
      criminalCodeText: state.criminalCodeText,
    },
    assignment: {
      assignedRoleText: state.assignedRoleText,
      assignedOfficerName: state.assignedOfficerName,
      assignedOfficerTitle: state.assignedOfficerTitle,
      assignedOfficerAgencyName: state.assignedOfficerAgencyName,
      additionalAssignedOfficersLine: state.additionalAssignedOfficersLine,
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

function buildStateFromPayload(payload: unknown): Bm071FormState {
  const rawState = asRecord(getString(payload, ["bm071FormState"]) ? asRecord(payload).bm071FormState : {});
  const formState = asRecord(getString(payload, ["formState"]) ? asRecord(payload).formState : {});

  const directState =
    Object.keys(rawState).length > 0
      ? rawState
      : Object.keys(formState).length > 0
        ? formState
        : {};

  if (Object.keys(directState).length > 0) {
    return prepareState({
      ...DEFAULT_FORM_STATE,
      ...(directState as Partial<Bm071FormState>),
    });
  }

  return prepareState({
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
      DEFAULT_FORM_STATE.documentIssueDate || todayIsoDate(),
    ),

    officialIssuerTitle: getString(
      payload,
      ["official", "issuerTitle"],
      DEFAULT_FORM_STATE.officialIssuerTitle,
    ),
    staffAssignmentProcedureArticlesLine: getString(
      payload,
      ["legalBasis", "staffAssignmentProcedureArticlesLine"],
      DEFAULT_FORM_STATE.staffAssignmentProcedureArticlesLine,
    ),

    caseDecisionNo: getString(
      payload,
      ["caseDecision", "decisionNo"],
      DEFAULT_FORM_STATE.caseDecisionNo,
    ),
    caseDecisionIssueDate: getString(
      payload,
      ["caseDecision", "issueDate"],
      DEFAULT_FORM_STATE.caseDecisionIssueDate || todayIsoDate(),
    ),
    caseDecisionIssuedBy: getString(
      payload,
      ["caseDecision", "issuedBy"],
      DEFAULT_FORM_STATE.caseDecisionIssuedBy,
    ),
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
    caseProsecutionDecisionLine: "",

    assignedRoleText: getString(
      payload,
      ["assignment", "assignedRoleText"],
      DEFAULT_FORM_STATE.assignedRoleText,
    ),
    assignedOfficerName: getString(
      payload,
      ["assignment", "assignedOfficerName"],
      DEFAULT_FORM_STATE.assignedOfficerName,
    ),
    assignedOfficerTitle: getString(
      payload,
      ["assignment", "assignedOfficerTitle"],
      DEFAULT_FORM_STATE.assignedOfficerTitle,
    ),
    assignedOfficerAgencyName: getString(
      payload,
      ["assignment", "assignedOfficerAgencyName"],
      DEFAULT_FORM_STATE.assignedOfficerAgencyName,
    ),
    additionalAssignedOfficersLine: getString(
      payload,
      ["assignment", "additionalAssignedOfficersLine"],
      DEFAULT_FORM_STATE.additionalAssignedOfficersLine,
    ),
    responsibilityLine: getString(
      payload,
      ["assignment", "responsibilityLine"],
      DEFAULT_FORM_STATE.responsibilityLine,
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
  });
}

async function getRenderPayload(documentId: string): Promise<unknown> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Không tải được render-payload BM-071. HTTP ${response.status}`);
  }

  return response.json();
}

async function saveFormInputs(
  documentId: string,
  rawState: Bm071FormState,
): Promise<void> {
  const state = prepareState(rawState);
  const payload = buildPayloadFromState(state);

  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ...payload,
        templateCode: "BM-071",
        formState: state,
        bm071FormState: state,
        formInputs: payload,
        payloadOverrides: payload,
        renderPayloadOverrides: payload,

        documentCode: state.documentCode,
        documentIssueDate: state.documentIssueDate,
        caseDecisionNo: state.caseDecisionNo,
        caseDecisionIssueDate: state.caseDecisionIssueDate,
        caseDecisionIssuedBy: state.caseDecisionIssuedBy,
        offenseName: state.offenseName,
        legalArticle: state.legalArticle,
        criminalCodeText: state.criminalCodeText,
        assignedRoleText: state.assignedRoleText,
        assignedOfficerName: state.assignedOfficerName,
        assignedOfficerTitle: state.assignedOfficerTitle,
        assignedOfficerAgencyName: state.assignedOfficerAgencyName,

        updatedByName: state.signerName || "",
        renderedByName: state.signerName || "",
        convertedByName: state.signerName || "",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không lưu được dữ liệu BM-071. HTTP ${response.status}`);
  }
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  multiline,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">-- Chọn --</option>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuickSelectField({
  label,
  onSelect,
  options,
  className = "",
}: {
  label: string;
  onSelect: (value: string) => void;
  options: Option[];
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>

      <select
        value=""
        onChange={(event) => {
          if (event.target.value) {
            onSelect(event.target.value);
          }
        }}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">-- Chọn --</option>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
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
  const parts = getDateParts(value);

  function updateDate(part: "day" | "month" | "year", nextValue: string) {
    const nextParts = {
      ...parts,
      [part]: nextValue,
    };

    onChange(makeIsoDate(nextParts.day, nextParts.month, nextParts.year));
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
          {DAY_OPTIONS.map((day) => (
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
          {MONTH_OPTIONS.map((month) => (
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
          {YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
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
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function PreviewBlock({ state }: { state: Bm071FormState }) {
  const readyState = prepareState(state);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">
        Preview trước khi xuất
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Kiểm nhanh đúng trình tự mẫu BM-071 trước khi render DOCX/PDF.
      </p>

      <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p>
          <strong>Header:</strong> {readyState.agencyName} — Số:{" "}
          {readyState.documentCode}
        </p>
        <p>
          {readyState.agencyIssuePlace}, {legalDate(readyState.documentIssueDate)}
        </p>
        <p>
          <strong>Căn cứ pháp lý:</strong>{" "}
          {readyState.staffAssignmentProcedureArticlesLine}
        </p>
        <p>
          <strong>Căn cứ quyết định khởi tố:</strong>{" "}
          {readyState.caseProsecutionDecisionLine}
        </p>
        <p>
          <strong>Điều 1:</strong> Phân công ông/bà{" "}
          {readyState.assignedOfficerName}; {readyState.assignedOfficerTitle} của{" "}
          {readyState.assignedOfficerAgencyName} thực hành quyền công tố, kiểm sát
          việc giải quyết vụ án.
        </p>
        {readyState.additionalAssignedOfficersLine ? (
          <p>
            <strong>Dòng phân công bổ sung:</strong>{" "}
            {readyState.additionalAssignedOfficersLine}
          </p>
        ) : null}
        <p>
          <strong>Điều 2:</strong> Ông/Bà có tên nêu tại Điều 1 Quyết định này{" "}
          {readyState.responsibilityLine}.
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
  );
}

export function Bm071FormInputsPanel({
  documentId,
  onSaved,
}: Bm071FormInputsPanelProps) {
  const [formState, setFormState] = useState<Bm071FormState>(() =>
    prepareState(DEFAULT_FORM_STATE),
  );
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const readyState = useMemo(() => prepareState(formState), [formState]);
  const currentSnapshot = useMemo(() => JSON.stringify(readyState), [readyState]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => !cleanText(readyState[item.key]));
  }, [readyState]);

  const loadForm = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getRenderPayload(documentId);
      const nextState = buildStateFromPayload(payload);

      setFormState(nextState);
      setInitialSnapshot(JSON.stringify(nextState));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-071.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  function updateField(field: keyof Bm071FormState, value: string) {
    setFormState((current) => {
      const next: Bm071FormState = {
        ...current,
        [field]: value,
      };

      if (
        field === "caseDecisionNo" ||
        field === "caseDecisionIssueDate" ||
        field === "caseDecisionIssuedBy" ||
        field === "offenseName" ||
        field === "legalArticle" ||
        field === "criminalCodeText"
      ) {
        next.caseProsecutionDecisionLine = buildCaseDecisionLine(next);
      }

      if (field === "assignedOfficerName") {
        next.assignedPersonLine = value.trim() ? "- Như Điều 2;" : "";
      }

      return next;
    });
  }

  function applyAgencyPreset(value: string) {
    const preset = AGENCY_PRESETS[Number(value)];

    if (!preset) {
      return;
    }

    setFormState((current) =>
      prepareState({
        ...current,
        agencyParentName: preset.parentName,
        agencyName: preset.name,
        agencyShortName: preset.shortName,
        agencyIssuePlace: preset.issuePlace,
        officialIssuerTitle: `VIỆN TRƯỞNG ${preset.name}`,
      }),
    );
  }

  function applyOfficerPreset(value: string) {
    const preset = OFFICER_PRESETS[Number(value)];

    if (!preset) {
      return;
    }

    setFormState((current) =>
      prepareState({
        ...current,
        assignedRoleText: preset.roleText,
        assignedOfficerName: preset.name,
        assignedOfficerTitle: preset.title,
        assignedOfficerAgencyName: preset.agencyName,
        assignedPersonLine: "- Như Điều 2;",
      }),
    );
  }

  function applySignerPreset(value: string) {
    const preset = SIGNER_PRESETS[Number(value)];

    if (!preset) {
      return;
    }

    setFormState((current) =>
      prepareState({
        ...current,
        signMode: preset.signMode,
        positionTitle: preset.positionTitle,
        signerName: preset.signerName,
      }),
    );
  }

  function applyAdditionalAssignment(value: string) {
    updateField("additionalAssignedOfficersLine", value);
  }

  function fillSample() {
    setFormState(
      prepareState({
        ...DEFAULT_FORM_STATE,
        documentCode: "71/QĐ-VKSKV7",
        documentIssueDate: todayIsoDate(),
        caseDecisionNo: "",
        caseDecisionIssueDate: "2026-05-06",
      }),
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const formToSave = prepareState(formState);

      await saveFormInputs(documentId, formToSave);

      setFormState(formToSave);
      setInitialSnapshot(JSON.stringify(formToSave));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-071.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-071...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-071
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định phân công Kiểm sát viên/Kiểm tra viên
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form nhập dữ liệu đúng trình tự mẫu BM-071: căn cứ pháp lý, quyết
              định khởi tố, Điều 1 phân công, dòng phân công bổ sung, Điều 2,
              nơi nhận và chữ ký.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:items-end">
            <span
              className={
                isDirty
                  ? "font-semibold text-amber-700"
                  : "font-semibold text-emerald-700"
              }
            >
              {isDirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
            </span>

            {savedAt ? (
              <span className="text-xs text-slate-500">
                Lưu lúc {savedAt.toLocaleTimeString("vi-VN")}
              </span>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">
              Còn thiếu {missingFields.length} trường quan trọng:
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {missingFields.map((item) => item.label).join(", ")}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Các trường quan trọng của BM-071 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-071
          </button>

          <button
            type="button"
            onClick={loadForm}
            disabled={isSaving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tải lại từ backend
          </button>
        </div>
      </section>

      <SectionCard title="1. Cơ quan ban hành">
        <QuickSelectField
          label="Chọn nhanh cơ quan"
          options={AGENCY_PRESETS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          onSelect={applyAgencyPreset}
          className="md:col-span-2"
        />
        <Field
          required
          label="Cơ quan cấp trên"
          value={formState.agencyParentName}
          onChange={(value) => updateField("agencyParentName", value)}
        />
        <Field
          required
          label="Cơ quan ban hành"
          value={formState.agencyName}
          onChange={(value) => updateField("agencyName", value)}
        />
        <Field
          label="Tên viết tắt"
          value={formState.agencyShortName}
          onChange={(value) => updateField("agencyShortName", value)}
        />
        <Field
          required
          label="Địa danh ban hành"
          value={formState.agencyIssuePlace}
          onChange={(value) => updateField("agencyIssuePlace", value)}
        />
      </SectionCard>

      <SectionCard title="2. Thông tin văn bản">
        <Field
          required
          label="Số quyết định"
          value={formState.documentCode}
          onChange={(value) => updateField("documentCode", value)}
        />
        <DateSelectField
          required
          label="Ngày ban hành"
          value={formState.documentIssueDate}
          onChange={(value) => updateField("documentIssueDate", value)}
        />
        <Field
          required
          label="Chủ thể ban hành"
          value={formState.officialIssuerTitle}
          onChange={(value) => updateField("officialIssuerTitle", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard
        title="3. Căn cứ pháp lý và quyết định khởi tố vụ án"
        description="Các dòng này sẽ in ở phần căn cứ trước chữ QUYẾT ĐỊNH."
      >
        <Field
          required
          multiline
          label="Căn cứ pháp lý BLTTHS"
          value={formState.staffAssignmentProcedureArticlesLine}
          onChange={(value) =>
            updateField("staffAssignmentProcedureArticlesLine", value)
          }
          className="md:col-span-2"
        />
        <Field
          required
          label="Số quyết định khởi tố"
          value={formState.caseDecisionNo}
          onChange={(value) => updateField("caseDecisionNo", value)}
        />
        <DateSelectField
          required
          label="Ngày quyết định khởi tố"
          value={formState.caseDecisionIssueDate}
          onChange={(value) => updateField("caseDecisionIssueDate", value)}
        />
        <Field
          label="Cơ quan ban hành quyết định khởi tố"
          value={formState.caseDecisionIssuedBy}
          onChange={(value) => updateField("caseDecisionIssuedBy", value)}
          className="md:col-span-2"
        />
        <Field
          label="Tội danh"
          value={formState.offenseName}
          onChange={(value) => updateField("offenseName", value)}
        />
        <Field
          label="Điều khoản áp dụng"
          value={formState.legalArticle}
          onChange={(value) => updateField("legalArticle", value)}
        />
        <Field
          label="Bộ luật áp dụng"
          value={formState.criminalCodeText}
          onChange={(value) => updateField("criminalCodeText", value)}
          className="md:col-span-2"
        />
        <Field
          multiline
          label="Preview dòng căn cứ quyết định khởi tố"
          value={readyState.caseProsecutionDecisionLine}
          onChange={() => undefined}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard
        title="4. Điều 1 - Người được phân công"
        description="Nội dung này tương ứng Điều 1 trong mẫu: Phân công ông/bà... chức danh... của Viện kiểm sát..."
      >
        <SelectField
          required
          label="Vai trò được phân công"
          value={formState.assignedRoleText}
          options={ROLE_OPTIONS}
          onChange={(value) => updateField("assignedRoleText", value)}
        />
        <QuickSelectField
          label="Chọn nhanh cán bộ"
          options={OFFICER_PRESETS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          onSelect={applyOfficerPreset}
        />
        <Field
          required
          label="Họ tên người được phân công"
          value={formState.assignedOfficerName}
          onChange={(value) => updateField("assignedOfficerName", value)}
        />
        <Field
          required
          label="Chức danh người được phân công"
          value={formState.assignedOfficerTitle}
          onChange={(value) => updateField("assignedOfficerTitle", value)}
        />
        <Field
          required
          label="Đơn vị người được phân công"
          value={formState.assignedOfficerAgencyName}
          onChange={(value) => updateField("assignedOfficerAgencyName", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard
        title="5. Dòng phân công bổ sung"
        description="Dòng này nằm sau Điều 1 theo mẫu. Có thể để trống nếu không phân công thêm người phối hợp."
      >
        <QuickSelectField
          label="Chọn nhanh dòng phân công bổ sung"
          options={ADDITIONAL_ASSIGNMENT_OPTIONS}
          onSelect={applyAdditionalAssignment}
          className="md:col-span-2"
        />
        <Field
          multiline
          label="Dòng “Phân công...”"
          value={formState.additionalAssignedOfficersLine}
          onChange={(value) => updateField("additionalAssignedOfficersLine", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="6. Điều 2 - Nhiệm vụ, quyền hạn, trách nhiệm">
        <Field
          required
          multiline
          label="Dòng nhiệm vụ, quyền hạn, trách nhiệm"
          value={formState.responsibilityLine}
          onChange={(value) => updateField("responsibilityLine", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="7. Nơi nhận">
        <Field
          label="Dòng cơ quan điều tra"
          value={formState.investigationAuthorityLine}
          onChange={(value) => updateField("investigationAuthorityLine", value)}
          className="md:col-span-2"
        />
        <Field
          label="Dòng người được phân công"
          value={formState.assignedPersonLine}
          onChange={(value) => updateField("assignedPersonLine", value)}
        />
        <Field
          label="Dòng lưu hồ sơ"
          value={formState.archiveLine}
          onChange={(value) => updateField("archiveLine", value)}
        />
      </SectionCard>

      <SectionCard title="8. Chữ ký">
        <QuickSelectField
          label="Chọn nhanh người ký"
          options={SIGNER_PRESETS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          onSelect={applySignerPreset}
          className="md:col-span-2"
        />
        <Field
          label="Hình thức ký"
          value={formState.signMode}
          onChange={(value) => updateField("signMode", value)}
        />
        <Field
          required
          label="Chức vụ ký"
          value={formState.positionTitle}
          onChange={(value) => updateField("positionTitle", value)}
        />
        <Field
          required
          label="Người ký"
          value={formState.signerName}
          onChange={(value) => updateField("signerName", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <PreviewBlock state={formState} />

      <section className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Lưu dữ liệu BM-071
            </p>
            <p className="text-sm text-slate-500">
              Sau khi lưu, chuyển sang tab Tệp đã xuất để render DOCX/PDF.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-071"}
          </button>
        </div>
      </section>
    </div>
  );
}