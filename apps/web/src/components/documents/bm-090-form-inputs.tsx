"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Bm090FormInputsPanelProps = {
  documentId: string;
  onSaved?: () => void;
};

type JsonRecord = Record<string, unknown>;

type Option = {
  label: string;
  value: string;
};

type Bm090FormState = {
  agencyParentName: string;
  agencyName: string;
  agencyShortName: string;
  agencyIssuePlace: string;

  documentCode: string;
  documentIssueDate: string;

  procedureArticlesLine: string;
  includeJuvenileJusticeBasis: boolean;
  juvenileJusticeLine: string;

  caseDecisionNo: string;
  caseDecisionIssueDate: string;
  caseDecisionIssuedBy: string;
  caseDecisionLegalBasisLine: string;

  accusedDecisionNo: string;
  accusedDecisionIssueDate: string;
  accusedDecisionIssuedBy: string;
  accusedName: string;
  offenseName: string;
  legalArticle: string;
  criminalCodeText: string;

  accusedDecisionRequestLine: string;
  approvalAssessmentLine: string;
  approvalArticle1Line: string;
  investigationRequestLine: string;

  investigationUnitLine: string;
  personLine: string;
  archiveLine: string;

  signMode: string;
  positionTitle: string;
  signerName: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_FORM_STATE: Bm090FormState = {
  agencyParentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
  agencyName: "",
  agencyShortName: "VKSKV7",
  agencyIssuePlace: "TP. Hồ Chí Minh",

  documentCode: "90/QĐ-VKS-VKSKV7",
  documentIssueDate: "",

  procedureArticlesLine:
    "Căn cứ các điều 41, 165 và 179 của Bộ luật Tố tụng hình sự;",
  includeJuvenileJusticeBasis: false,
  juvenileJusticeLine:
    "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;",

  caseDecisionNo: "",
  caseDecisionIssueDate: "",
  caseDecisionIssuedBy:
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  caseDecisionLegalBasisLine: "",

  accusedDecisionNo: "",
  accusedDecisionIssueDate: "",
  accusedDecisionIssuedBy:
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  accusedName: "",
  offenseName: "Tổ chức đánh bạc hoặc gá bạc",
  legalArticle: "Điều 322 Bộ luật Hình sự",
  criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",

  accusedDecisionRequestLine: "",
  approvalAssessmentLine: "",
  approvalArticle1Line: "",
  investigationRequestLine: "",

  investigationUnitLine:
    "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  personLine: "- ;",
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

const ISSUER_PRESETS: Option[] = [
  {
    label: "Cơ quan CSĐT Công an TP. Hồ Chí Minh",
    value: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  {
    label: "Cơ quan có thẩm quyền điều tra",
    value: "Cơ quan có thẩm quyền điều tra",
  },
];

const OFFENSE_PRESETS = [
  {
    label: "Tổ chức đánh bạc hoặc gá bạc - Điều 322",
    offenseName: "Tổ chức đánh bạc hoặc gá bạc",
    legalArticle: "Điều 322 Bộ luật Hình sự",
    criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
  },
  {
    label: "Đánh bạc - khoản 1 Điều 321",
    offenseName: "",
    legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
    criminalCodeText: "Bộ luật Hình sự",
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

const REQUIRED_FIELDS: Array<{ key: keyof Bm090FormState; label: string }> = [
  { key: "agencyParentName", label: "Cơ quan cấp trên" },
  { key: "agencyName", label: "Cơ quan ban hành" },
  { key: "documentCode", label: "Số/ký hiệu văn bản" },
  { key: "documentIssueDate", label: "Ngày ban hành" },
  { key: "procedureArticlesLine", label: "Căn cứ BLTTHS" },
  { key: "caseDecisionNo", label: "Số quyết định khởi tố vụ án" },
  { key: "caseDecisionIssueDate", label: "Ngày quyết định khởi tố vụ án" },
  { key: "accusedDecisionNo", label: "Số quyết định khởi tố bị can" },
  { key: "accusedDecisionIssueDate", label: "Ngày quyết định khởi tố bị can" },
  { key: "accusedName", label: "Bị can" },
  { key: "offenseName", label: "Tội danh" },
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

function getBoolean(root: unknown, path: string[], fallback = false): boolean {
  let current: unknown = root;

  for (const key of path) {
    current = asRecord(current)[key];
  }

  if (typeof current === "boolean") {
    return current;
  }

  if (typeof current === "string") {
    return current === "true" || current === "1";
  }

  return fallback;
}

function cleanText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function ensureEnd(value: string, end: "." | ";" | "," | "./."): string {
  const text = cleanText(value).replace(/[.;,]+$/u, "");

  return text ? `${text}${end}` : "";
}

function stripLinePrefix(value: string): string {
  return cleanText(value).replace(/^-\s*/u, "").replace(/[;.]$/u, "");
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

  const legal = raw.match(
    /(?:ngày\s*)?(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu,
  );
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

function buildCaseDecisionLegalBasisLine(state: Bm090FormState): string {
  return ensureEnd(
    [
      "Căn cứ Quyết định khởi tố vụ án hình sự số " + cleanText(state.caseDecisionNo),
      legalDate(state.caseDecisionIssueDate),
      state.caseDecisionIssuedBy ? "của " + cleanText(state.caseDecisionIssuedBy) : "",
      state.offenseName ? "về tội “" + cleanText(state.offenseName) + "”" : "",
      state.legalArticle ? "quy định tại " + cleanText(state.legalArticle) : "",
      state.criminalCodeText ? "của " + cleanText(state.criminalCodeText) : "",
    ]
      .filter(Boolean)
      .join(" "),
    ";",
  );
}

function buildAccusedDecisionRequestLine(state: Bm090FormState): string {
  return ensureEnd(
    [
      `Xét hồ sơ đề nghị phê chuẩn Quyết định khởi tố bị can số ${cleanText(
        state.accusedDecisionNo,
      )}`,
      legalDate(state.accusedDecisionIssueDate),
      state.accusedDecisionIssuedBy
        ? `của ${cleanText(state.accusedDecisionIssuedBy)}`
        : "",
      state.accusedName ? `đối với ${cleanText(state.accusedName)}` : "",
      state.offenseName ? `về tội “${cleanText(state.offenseName)}”` : "",
      state.legalArticle ? `quy định tại ${cleanText(state.legalArticle)}` : "",
      state.criminalCodeText ? `của ${cleanText(state.criminalCodeText)}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    ";",
  );
}

function buildApprovalAssessmentLine(state: Bm090FormState): string {
  return ensureEnd(
    `Nhận thấy việc khởi tố bị can đối với ${cleanText(
      state.accusedName,
    )} là có căn cứ`,
    ",",
  );
}

function buildApprovalArticle1Line(state: Bm090FormState): string {
  return ensureEnd(
    [
      `Phê chuẩn Quyết định khởi tố bị can số ${cleanText(
        state.accusedDecisionNo,
      )}`,
      legalDate(state.accusedDecisionIssueDate),
      state.accusedDecisionIssuedBy
        ? `của ${cleanText(state.accusedDecisionIssuedBy)}`
        : "",
      state.accusedName ? `đối với ${cleanText(state.accusedName)}` : "",
      state.offenseName ? `về tội “${cleanText(state.offenseName)}”` : "",
      state.legalArticle ? `quy định tại ${cleanText(state.legalArticle)}` : "",
      state.criminalCodeText ? `của ${cleanText(state.criminalCodeText)}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    ".",
  );
}

function buildInvestigationRequestLine(state: Bm090FormState): string {
  const unit =
    stripLinePrefix(state.investigationUnitLine) ||
    cleanText(state.accusedDecisionIssuedBy) ||
    "Cơ quan có thẩm quyền điều tra";

  return ensureEnd(
    `Yêu cầu ${unit} tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự`,
    "./.",
  );
}

function prepareState(rawState: Bm090FormState): Bm090FormState {
  const state: Bm090FormState = {
    ...rawState,
    agencyParentName:
      cleanText(rawState.agencyParentName) || DEFAULT_FORM_STATE.agencyParentName,
    agencyName: cleanText(rawState.agencyName) || DEFAULT_FORM_STATE.agencyName,
    agencyShortName:
      cleanText(rawState.agencyShortName) || DEFAULT_FORM_STATE.agencyShortName,
    agencyIssuePlace:
      cleanText(rawState.agencyIssuePlace) || DEFAULT_FORM_STATE.agencyIssuePlace,

    documentCode: cleanText(rawState.documentCode) || DEFAULT_FORM_STATE.documentCode,
    documentIssueDate: toIsoDate(rawState.documentIssueDate) || todayIsoDate(),

    procedureArticlesLine:
      cleanText(rawState.procedureArticlesLine) ||
      DEFAULT_FORM_STATE.procedureArticlesLine,
    includeJuvenileJusticeBasis: Boolean(rawState.includeJuvenileJusticeBasis),
    juvenileJusticeLine:
      cleanText(rawState.juvenileJusticeLine) ||
      DEFAULT_FORM_STATE.juvenileJusticeLine,

    caseDecisionNo:
      cleanText(rawState.caseDecisionNo) || DEFAULT_FORM_STATE.caseDecisionNo,
    caseDecisionIssueDate:
      toIsoDate(rawState.caseDecisionIssueDate) || todayIsoDate(),
    caseDecisionIssuedBy: cleanText(rawState.caseDecisionIssuedBy),
    caseDecisionLegalBasisLine: "",

    accusedDecisionNo:
      cleanText(rawState.accusedDecisionNo) ||
      DEFAULT_FORM_STATE.accusedDecisionNo,
    accusedDecisionIssueDate:
      toIsoDate(rawState.accusedDecisionIssueDate) || todayIsoDate(),
    accusedDecisionIssuedBy:
      cleanText(rawState.accusedDecisionIssuedBy) ||
      cleanText(rawState.caseDecisionIssuedBy),
    accusedName: cleanText(rawState.accusedName),

    offenseName: cleanText(rawState.offenseName),
    legalArticle: cleanText(rawState.legalArticle),
    criminalCodeText: cleanText(rawState.criminalCodeText),

    accusedDecisionRequestLine: "",
    approvalAssessmentLine: "",
    approvalArticle1Line: "",
    investigationRequestLine: "",

    investigationUnitLine:
      cleanText(rawState.investigationUnitLine) ||
      DEFAULT_FORM_STATE.investigationUnitLine,
    personLine:
      cleanText(rawState.personLine) ||
      (rawState.accusedName ? `- ${cleanText(rawState.accusedName)};` : ""),
    archiveLine: cleanText(rawState.archiveLine) || DEFAULT_FORM_STATE.archiveLine,

    signMode: cleanText(rawState.signMode) || DEFAULT_FORM_STATE.signMode,
    positionTitle:
      cleanText(rawState.positionTitle) || DEFAULT_FORM_STATE.positionTitle,
    signerName: cleanText(rawState.signerName) || DEFAULT_FORM_STATE.signerName,
  };

  return {
    ...state,
    caseDecisionLegalBasisLine: buildCaseDecisionLegalBasisLine(state),
    accusedDecisionRequestLine: buildAccusedDecisionRequestLine(state),
    approvalAssessmentLine: buildApprovalAssessmentLine(state),
    approvalArticle1Line: buildApprovalArticle1Line(state),
    investigationRequestLine: buildInvestigationRequestLine(state),
  };
}

function buildPayloadFromState(rawState: Bm090FormState): JsonRecord {
  const state = prepareState(rawState);

  return {
    agency: {
      parentName: state.agencyParentName,
      name: state.agencyName,
      shortName: state.agencyShortName,
      issuePlace: state.agencyIssuePlace,
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
      issuerTitle: `VIỆN TRƯỞNG ${state.agencyName}`,
    },
    legalBasis: {
      procedureArticlesLine: state.procedureArticlesLine,
      includeJuvenileJusticeBasis: state.includeJuvenileJusticeBasis,
      juvenileJusticeLine: state.includeJuvenileJusticeBasis
        ? ensureEnd(state.juvenileJusticeLine, ";")
        : "",
    },
    caseDecision: {
      decisionNo: state.caseDecisionNo,
      decisionCode: state.caseDecisionNo,
      issueDate: state.caseDecisionIssueDate,
      decisionDate: state.caseDecisionIssueDate,
      issuedBy: state.caseDecisionIssuedBy,
      legalBasisLine: state.caseDecisionLegalBasisLine,
      caseProsecutionDecisionLine: state.caseDecisionLegalBasisLine,
    },
    accusedDecision: {
      decisionNo: state.accusedDecisionNo,
      decisionCode: state.accusedDecisionNo,
      issueDate: state.accusedDecisionIssueDate,
      decisionDate: state.accusedDecisionIssueDate,
      issuedBy: state.accusedDecisionIssuedBy,
      accusedName: state.accusedName,
      requestLine: state.accusedDecisionRequestLine,
      approvalArticle1Line: state.approvalArticle1Line,
      investigationRequestLine: state.investigationRequestLine,
    },
    offense: {
      offenseName: state.offenseName,
      legalArticle: state.legalArticle,
      criminalCodeText: state.criminalCodeText,
    },
    approval: {
      assessmentLine: state.approvalAssessmentLine,
    },
    recipients: {
      investigationUnitLine: state.investigationUnitLine,
      personLine: state.personLine,
      archiveLine: state.archiveLine,
    },
    signature: {
      signMode: state.signMode,
      positionTitle: state.positionTitle,
      signerName: state.signerName,
    },
  };
}

function buildStateFromPayload(payload: unknown): Bm090FormState {
  const root = asRecord(payload);
  const stateCandidate = asRecord(root.bm090FormState);
  const formStateCandidate = asRecord(root.formState);
  const savedState =
    Object.keys(stateCandidate).length > 0 ? stateCandidate : formStateCandidate;

  if (Object.keys(savedState).length > 0) {
    return prepareState({
      ...DEFAULT_FORM_STATE,
      ...(savedState as Partial<Bm090FormState>),
      includeJuvenileJusticeBasis:
        typeof savedState.includeJuvenileJusticeBasis === "boolean"
          ? savedState.includeJuvenileJusticeBasis
          : savedState.includeJuvenileJusticeBasis === "true",
    });
  }

  const juvenileLine = getString(payload, ["legalBasis", "juvenileJusticeLine"]);

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
      ["document", "fullDocumentCode"],
      getString(payload, ["document", "documentCode"], DEFAULT_FORM_STATE.documentCode),
    ),
    documentIssueDate: getString(
      payload,
      ["document", "issueDate"],
      DEFAULT_FORM_STATE.documentIssueDate || todayIsoDate(),
    ),

    procedureArticlesLine: getString(
      payload,
      ["legalBasis", "procedureArticlesLine"],
      DEFAULT_FORM_STATE.procedureArticlesLine,
    ),
    includeJuvenileJusticeBasis:
      getBoolean(payload, ["legalBasis", "includeJuvenileJusticeBasis"], false) ||
      Boolean(juvenileLine),
    juvenileJusticeLine: juvenileLine || DEFAULT_FORM_STATE.juvenileJusticeLine,

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
    caseDecisionLegalBasisLine: "",

    accusedDecisionNo: getString(
      payload,
      ["accusedDecision", "decisionNo"],
      DEFAULT_FORM_STATE.accusedDecisionNo,
    ),
    accusedDecisionIssueDate: getString(
      payload,
      ["accusedDecision", "issueDate"],
      DEFAULT_FORM_STATE.accusedDecisionIssueDate || todayIsoDate(),
    ),
    accusedDecisionIssuedBy: getString(
      payload,
      ["accusedDecision", "issuedBy"],
      DEFAULT_FORM_STATE.accusedDecisionIssuedBy,
    ),
    accusedName: getString(
      payload,
      ["accusedDecision", "accusedName"],
      getString(payload, ["person", "fullName"], DEFAULT_FORM_STATE.accusedName),
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

    accusedDecisionRequestLine: "",
    approvalAssessmentLine: "",
    approvalArticle1Line: "",
    investigationRequestLine: "",

    investigationUnitLine: getString(
      payload,
      ["recipients", "investigationUnitLine"],
      DEFAULT_FORM_STATE.investigationUnitLine,
    ),
    personLine: getString(
      payload,
      ["recipients", "personLine"],
      DEFAULT_FORM_STATE.personLine,
    ),
    archiveLine: getString(
      payload,
      ["recipients", "archiveLine"],
      DEFAULT_FORM_STATE.archiveLine,
    ),

    signMode: getString(payload, ["signature", "signMode"], DEFAULT_FORM_STATE.signMode),
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
    throw new Error(`Không tải được render-payload BM-090. HTTP ${response.status}`);
  }

  return response.json();
}

async function saveFormInputs(
  documentId: string,
  rawState: Bm090FormState,
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
        templateCode: "BM-090",
        formState: state,
        bm090FormState: state,
        formInputs: payload,
        payloadOverrides: payload,
        renderPayloadOverrides: payload,

        documentCode: state.documentCode,
        documentIssueDate: state.documentIssueDate,
        caseDecisionNo: state.caseDecisionNo,
        caseDecisionIssueDate: state.caseDecisionIssueDate,
        accusedDecisionNo: state.accusedDecisionNo,
        accusedDecisionIssueDate: state.accusedDecisionIssueDate,
        accusedName: state.accusedName,
        offenseName: state.offenseName,
        legalArticle: state.legalArticle,
        criminalCodeText: state.criminalCodeText,

        updatedByName: state.signerName || "",
        renderedByName: state.signerName || "",
        convertedByName: state.signerName || "",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không lưu được dữ liệu BM-090. HTTP ${response.status}`);
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

function PreviewBlock({ state }: { state: Bm090FormState }) {
  const readyState = prepareState(state);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">
        Preview trước khi xuất
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Kiểm nhanh từng dòng sẽ được đưa vào phần căn cứ, Điều 1, Điều 2, nơi nhận và chữ ký.
      </p>

      <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p>
          <strong>Số văn bản:</strong> {readyState.documentCode}
        </p>
        <p>
          <strong>Ngày ban hành:</strong> {readyState.agencyIssuePlace},{" "}
          {legalDate(readyState.documentIssueDate)}
        </p>
        <p>
          <strong>Căn cứ 1 - BLTTHS:</strong> {readyState.procedureArticlesLine}
        </p>
        <p>
          <strong>Căn cứ 2 - người chưa thành niên:</strong>{" "}
          {readyState.includeJuvenileJusticeBasis
            ? ensureEnd(readyState.juvenileJusticeLine, ";")
            : "Không áp dụng"}
        </p>
        <p>
          <strong>Căn cứ 3 - quyết định khởi tố vụ án:</strong>{" "}
          {readyState.caseDecisionLegalBasisLine}
        </p>
        <p>
          <strong>Xét hồ sơ đề nghị:</strong>{" "}
          {readyState.accusedDecisionRequestLine}
        </p>
        <p>
          <strong>Nhận thấy:</strong> {readyState.approvalAssessmentLine}
        </p>
        <p>
          <strong>Điều 1:</strong> {readyState.approvalArticle1Line}
        </p>
        <p>
          <strong>Điều 2:</strong> {readyState.investigationRequestLine}
        </p>
        <p>
          <strong>Nơi nhận:</strong> {readyState.investigationUnitLine}{" "}
          {readyState.personLine} {readyState.archiveLine}
        </p>
        <p>
          <strong>Chữ ký:</strong> {readyState.signMode}{" "}
          {readyState.positionTitle} — {readyState.signerName}
        </p>
      </div>
    </section>
  );
}

export function Bm090FormInputsPanel({
  documentId,
  onSaved,
}: Bm090FormInputsPanelProps) {
  const [formState, setFormState] = useState<Bm090FormState>(() =>
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
    return REQUIRED_FIELDS.filter((item) => !cleanText(String(readyState[item.key] ?? "")));
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
          : "Không tải được dữ liệu biểu mẫu BM-090.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  function updateField(field: keyof Bm090FormState, value: string | boolean) {
    setFormState((current) => {
      const next: Bm090FormState = {
        ...current,
        [field]: value,
      } as Bm090FormState;

      if (field === "accusedName" && typeof value === "string") {
        next.personLine = value.trim() ? `- ${value.trim()};` : "";
      }

      return next;
    });
  }

  function applyAgencyPreset(value: string) {
    const preset = AGENCY_PRESETS[Number(value)];

    if (!preset) {
      return;
    }

    setFormState((current) => ({
      ...current,
      agencyParentName: preset.parentName,
      agencyName: preset.name,
      agencyShortName: preset.shortName,
      agencyIssuePlace: preset.issuePlace,
    }));
  }

  function applyIssuerPreset(value: string) {
    setFormState((current) => ({
      ...current,
      caseDecisionIssuedBy: value,
      accusedDecisionIssuedBy: value,
      investigationUnitLine: `- ${value};`,
    }));
  }

  function applyOffensePreset(value: string) {
    const preset = OFFENSE_PRESETS[Number(value)];

    if (!preset) {
      return;
    }

    setFormState((current) => ({
      ...current,
      offenseName: preset.offenseName,
      legalArticle: preset.legalArticle,
      criminalCodeText: preset.criminalCodeText,
    }));
  }

  function applySignerPreset(value: string) {
    const preset = SIGNER_PRESETS[Number(value)];

    if (!preset) {
      return;
    }

    setFormState((current) => ({
      ...current,
      signMode: preset.signMode,
      positionTitle: preset.positionTitle,
      signerName: preset.signerName,
    }));
  }

  function fillSample() {
    setFormState(
      prepareState({
        ...DEFAULT_FORM_STATE,
        documentIssueDate: todayIsoDate(),
        caseDecisionIssueDate: todayIsoDate(),
        accusedDecisionIssueDate: todayIsoDate(),
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
          : "Không lưu được dữ liệu biểu mẫu BM-090.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-090...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-090
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định phê chuẩn Quyết định khởi tố bị can
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form nhập đúng trình tự mẫu: căn cứ pháp lý, quyết định khởi tố vụ án,
              hồ sơ đề nghị phê chuẩn khởi tố bị can, Điều 1, Điều 2, nơi nhận và chữ ký.
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
            Các trường quan trọng của BM-090 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-090
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
        <Field required label="Cơ quan cấp trên" value={formState.agencyParentName} onChange={(value) => updateField("agencyParentName", value)} />
        <Field required label="Cơ quan ban hành" value={formState.agencyName} onChange={(value) => updateField("agencyName", value)} />
        <Field label="Tên viết tắt" value={formState.agencyShortName} onChange={(value) => updateField("agencyShortName", value)} />
        <Field required label="Địa danh ban hành" value={formState.agencyIssuePlace} onChange={(value) => updateField("agencyIssuePlace", value)} />
      </SectionCard>

      <SectionCard title="2. Thông tin văn bản">
        <Field required label="Số/ký hiệu văn bản" value={formState.documentCode} onChange={(value) => updateField("documentCode", value)} />
        <DateSelectField required label="Ngày ban hành" value={formState.documentIssueDate} onChange={(value) => updateField("documentIssueDate", value)} />
      </SectionCard>

      <SectionCard title="3. Căn cứ pháp lý">
        <Field required multiline label="Căn cứ 1 - các điều BLTTHS" value={formState.procedureArticlesLine} onChange={(value) => updateField("procedureArticlesLine", value)} className="md:col-span-2" />

        <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={formState.includeJuvenileJusticeBasis}
            onChange={(event) =>
              updateField("includeJuvenileJusticeBasis", event.target.checked)
            }
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Áp dụng căn cứ người chưa thành niên
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Nếu tick, file xuất sẽ thêm dòng: “Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;”.
              Nếu không tick, dòng này không xuất hiện.
            </span>
          </span>
        </label>

        <Field multiline label="Căn cứ 2 - Luật Tư pháp người chưa thành niên" value={formState.juvenileJusticeLine} onChange={(value) => updateField("juvenileJusticeLine", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="4. Quyết định khởi tố vụ án">
        <Field required label="Số quyết định khởi tố vụ án" value={formState.caseDecisionNo} onChange={(value) => updateField("caseDecisionNo", value)} />
        <DateSelectField required label="Ngày quyết định khởi tố vụ án" value={formState.caseDecisionIssueDate} onChange={(value) => updateField("caseDecisionIssueDate", value)} />
        <QuickSelectField label="Chọn nhanh cơ quan ban hành" options={ISSUER_PRESETS} onSelect={applyIssuerPreset} className="md:col-span-2" />
        <Field label="Cơ quan ban hành quyết định khởi tố vụ án" value={formState.caseDecisionIssuedBy} onChange={(value) => updateField("caseDecisionIssuedBy", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="5. Quyết định khởi tố bị can cần phê chuẩn">
        <Field required label="Số quyết định khởi tố bị can" value={formState.accusedDecisionNo} onChange={(value) => updateField("accusedDecisionNo", value)} />
        <DateSelectField required label="Ngày quyết định khởi tố bị can" value={formState.accusedDecisionIssueDate} onChange={(value) => updateField("accusedDecisionIssueDate", value)} />
        <Field label="Cơ quan điều tra đề nghị phê chuẩn" value={formState.accusedDecisionIssuedBy} onChange={(value) => updateField("accusedDecisionIssuedBy", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="6. Bị can và tội danh">
        <Field required label="Họ tên bị can" value={formState.accusedName} onChange={(value) => updateField("accusedName", value)} />
        <QuickSelectField
          label="Chọn nhanh tội danh"
          options={OFFENSE_PRESETS.map((item, index) => ({
            label: item.label,
            value: String(index),
          }))}
          onSelect={applyOffensePreset}
        />
        <Field required label="Tội danh" value={formState.offenseName} onChange={(value) => updateField("offenseName", value)} />
        <Field required label="Điều khoản áp dụng" value={formState.legalArticle} onChange={(value) => updateField("legalArticle", value)} />
        <Field label="Bộ luật áp dụng" value={formState.criminalCodeText} onChange={(value) => updateField("criminalCodeText", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="7. Nơi nhận">
        <Field label="Dòng cơ quan điều tra" value={formState.investigationUnitLine} onChange={(value) => updateField("investigationUnitLine", value)} className="md:col-span-2" />
        <Field label="Dòng bị can" value={formState.personLine} onChange={(value) => updateField("personLine", value)} />
        <Field label="Dòng lưu hồ sơ" value={formState.archiveLine} onChange={(value) => updateField("archiveLine", value)} />
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
        <Field label="Hình thức ký" value={formState.signMode} onChange={(value) => updateField("signMode", value)} />
        <Field required label="Chức vụ ký" value={formState.positionTitle} onChange={(value) => updateField("positionTitle", value)} />
        <Field required label="Người ký" value={formState.signerName} onChange={(value) => updateField("signerName", value)} className="md:col-span-2" />
      </SectionCard>

      <PreviewBlock state={formState} />

      <section className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Lưu dữ liệu BM-090
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
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-090"}
          </button>
        </div>
      </section>
    </div>
  );
}