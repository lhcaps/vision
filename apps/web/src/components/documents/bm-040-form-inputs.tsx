"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  BmFieldText,
  BmFieldTextarea,
  BmFormSection,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm040FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  legalBasis: TextRecord;
  caseDecision: TextRecord;
  accusedDecision: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
  principal: TextRecord;
  offense: TextRecord;
};

type SectionKey = keyof Bm040FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm040FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const DEFAULT_AGENCY_PARENT = "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH";
const DEFAULT_AGENCY_NAME = '';
const DEFAULT_AGENCY_BODY_NAME = "Viện kiểm sát nhân dân khu vực 7";
const DEFAULT_ISSUE_PLACE = "TP. Hồ Chí Minh";
const DEFAULT_ACCUSED_NAME = '';
const DEFAULT_OFFENSE_NAME = '';
const DEFAULT_LEGAL_ARTICLE = "khoản 1 Điều 321 Bộ luật Hình sự";
const DEFAULT_INVESTIGATION_AGENCY =
  "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";
const DEFAULT_EXECUTION_UNIT =
  "Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh";
const DEFAULT_SIGNER_NAME = '';

const EMPTY_FORM: Bm040FormInputs = {
  agency: {
    parentName: DEFAULT_AGENCY_PARENT,
    name: DEFAULT_AGENCY_NAME,
    bodyName: DEFAULT_AGENCY_BODY_NAME,
    issuePlace: DEFAULT_ISSUE_PLACE,
    phone: "",
  },
  document: {
    documentCodeLine: "40/QĐ-VKSKV7",
    documentCode: "40/QĐ-VKSKV7",
    documentNo: "40/QĐ-VKSKV7",
    fullDocumentCode: "40/QĐ-VKSKV7",
    issuePlaceAndDateLine: "",
    issueDate: "",
  },
  legalBasis: {
    baseProcedureLine:
      "Căn cứ các điều 41, 113, 119, 165 và 173 của Bộ luật Tố tụng hình sự;",
    isJuvenile: "false",
    includeJuvenileJusticeLine: "false",
    juvenileLegalBasisLine: "",
    juvenileJusticeLine: "",
    minorLegalBasisLine: "",
    requestApprovalLine: "",
  },
  caseDecision: {
    decisionCode: "",
    decisionDateText: "",
    legalBasisLine: "",
  },
  accusedDecision: {
    decisionCode: "",
    decisionDateText: "",
    legalBasisLine: "",
  },
  measure: {
    detentionOrderCode: "17/LTG-VKSKV7",
    detentionOrderIssueDateText: "",
    detentionOrderIssueDate: "",
    detentionDurationText: "02 tháng",
    detentionStartDateText: "",
    detentionFromDateText: "",
    detentionEndDateText: "",
    detentionToDateText: "",
    detentionExecutionUnitName: DEFAULT_EXECUTION_UNIT,
    reasonLine: "",
    article1Line: "",
    detentionDurationLine: "",
    article2Line: "",
  },
  recipients: {
    detentionExecutionUnitLine: "",
    personLine: "",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
  principal: {
    accusedName: DEFAULT_ACCUSED_NAME,
  },
  offense: {
    offenseName: DEFAULT_OFFENSE_NAME,
    legalArticle: DEFAULT_LEGAL_ARTICLE,
    investigationAgencyName: DEFAULT_INVESTIGATION_AGENCY,
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Viện kiểm sát ban hành" },
  { section: "document", field: "documentCodeLine", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  { section: "principal", field: "accusedName", label: "Tên bị can" },
  { section: "offense", field: "offenseName", label: "Tội danh" },
  { section: "offense", field: "legalArticle", label: "Điều luật" },
  { section: "legalBasis", field: "baseProcedureLine", label: "Căn cứ BLTTHS" },
  { section: "caseDecision", field: "legalBasisLine", label: "Căn cứ khởi tố vụ án" },
  { section: "accusedDecision", field: "legalBasisLine", label: "Căn cứ khởi tố bị can" },
  { section: "legalBasis", field: "requestApprovalLine", label: "Dòng xét hồ sơ" },
  { section: "measure", field: "reasonLine", label: "Dòng nhận thấy" },
  { section: "measure", field: "article1Line", label: "Điều 1" },
  { section: "measure", field: "detentionDurationLine", label: "Thời hạn tạm giam" },
  { section: "measure", field: "detentionStartDateText", label: "Từ ngày tạm giam" },
  { section: "measure", field: "detentionEndDateText", label: "Đến ngày tạm giam" },
  { section: "measure", field: "article2Line", label: "Điều 2" },
  { section: "recipients", field: "detentionExecutionUnitLine", label: "Nơi nhận - cơ quan" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - bị can" },
  { section: "recipients", field: "archiveLine", label: "Lưu" },
  { section: "signature", field: "signMode", label: "Chế độ ký" },
  { section: "signature", field: "positionTitle", label: "Chức vụ" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedValue(source: unknown, path: string): unknown {
  let current: unknown = source;

  for (const part of path.split(".")) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }

  return current;
}

function rawText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function cleanText(value: unknown): string {
  return rawText(value).trim();
}

function pickText(...values: unknown[]): string {
  for (const value of values) {
    const next = cleanText(value);

    if (next && next.toLowerCase() !== "null" && next.toLowerCase() !== "undefined") {
      return next;
    }
  }

  return "";
}

function normalizeLine(value: string): string {
  return value.replace(/\s+([,.;:])/gu, "$1").replace(/\s{2,}/gu, " ").trim();
}

function ensureEnding(value: string, ending: string): string {
  const raw = normalizeLine(value);

  if (!raw) return "";
  if (/[.!?;,]$/u.test(raw)) return raw.replace(/[.!?;,]$/u, ending);

  return `${raw}${ending}`;
}

function formatDateInput(value: string): string {
  const raw = cleanText(value);

  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/u);
  if (iso) {
    return `${iso[3].padStart(2, "0")}/${iso[2].padStart(2, "0")}/${iso[1]}`;
  }

  const dmy = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);
  if (dmy) {
    return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`;
  }

  const legal = raw.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (legal) {
    return `${legal[1].padStart(2, "0")}/${legal[2].padStart(2, "0")}/${legal[3]}`;
  }

  return raw;
}

function toLegalDateText(value: string): string {
  const normalized = formatDateInput(value);
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);

  if (!match) {
    return cleanText(value);
  }

  return `ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
}

function getTodayDisplayDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());

  return `${day}/${month}/${year}`;
}

function buildIssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const place = pickText(issuePlace, DEFAULT_ISSUE_PLACE);
  const dateText = toLegalDateText(pickText(issueDate, getTodayDisplayDate()));

  return `${place}, ${dateText}`;
}

function sentenceAgencyName(value: string): string {
  const raw = cleanText(value);

  if (!raw) return DEFAULT_AGENCY_BODY_NAME;

  const upper = raw.toLocaleUpperCase("vi-VN").replace(/\s+/g, " ").trim();

  if (upper === "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7") {
    return DEFAULT_AGENCY_BODY_NAME;
  }

  if (upper === "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH") {
    return "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh";
  }

  const lower = raw.toLocaleLowerCase("vi-VN").replace(/\s+/g, " ").trim();
  return lower.charAt(0).toLocaleUpperCase("vi-VN") + lower.slice(1);
}

function buildDerivedLines(input: Bm040FormInputs): Bm040FormInputs {
  const form: Bm040FormInputs = JSON.parse(JSON.stringify(input));

  const documentCode = pickText(
    form.document.documentCodeLine,
    form.document.documentCode,
    form.document.documentNo,
    "40/QĐ-VKSKV7",
  );

  const issueDate = formatDateInput(pickText(form.document.issueDate, getTodayDisplayDate()));
  const accusedName = pickText(form.principal.accusedName, DEFAULT_ACCUSED_NAME);
  const offenseName = pickText(form.offense.offenseName, DEFAULT_OFFENSE_NAME);
  const legalArticle = pickText(form.offense.legalArticle, DEFAULT_LEGAL_ARTICLE);
  const investigationAgency = pickText(
    form.offense.investigationAgencyName,
    DEFAULT_INVESTIGATION_AGENCY,
  );

  const detentionOrderCode = pickText(form.measure.detentionOrderCode, "17/LTG-VKSKV7");
  const detentionOrderIssueDateText = toLegalDateText(
    pickText(form.measure.detentionOrderIssueDateText, issueDate),
  );

  const caseDecisionCode = pickText(form.caseDecision.decisionCode, "");
  const caseDecisionDateText = toLegalDateText(
    pickText(form.caseDecision.decisionDateText, issueDate),
  );

  const accusedDecisionCode = pickText(form.accusedDecision.decisionCode, "");
  const accusedDecisionDateText = toLegalDateText(
    pickText(form.accusedDecision.decisionDateText, issueDate),
  );

  const detentionDurationText = pickText(form.measure.detentionDurationText, "02 tháng");

  const detentionStartDateText = formatDateInput(
    pickText(
      form.measure.detentionStartDateText,
      form.measure.detentionFromDateText,
      form.measure.detentionOrderIssueDateText,
      issueDate,
    ),
  );

  const detentionEndDateText = formatDateInput(
    pickText(
      form.measure.detentionEndDateText,
      form.measure.detentionToDateText,
      "",
    ),
  );

  const detentionStartDateLine = toLegalDateText(detentionStartDateText);
  const detentionEndDateLine = toLegalDateText(detentionEndDateText);

  const detentionDurationLine = detentionEndDateLine
    ? ensureEnding(
        `Thời hạn tạm giam là ${detentionDurationText}, kể từ ${detentionStartDateLine} đến ${detentionEndDateLine}`,
        ".",
      )
    : ensureEnding(
        `Thời hạn tạm giam là ${detentionDurationText}, kể từ ${detentionStartDateLine} đến ngày ... tháng ... năm ...`,
        ".",
      );

  const executionUnit = pickText(
    form.measure.detentionExecutionUnitName,
    DEFAULT_EXECUTION_UNIT,
  );

  const includeJuvenile = form.legalBasis.isJuvenile === "true";
  const juvenileLine = includeJuvenile
    ? pickText(
        form.legalBasis.juvenileLegalBasisLine,
        "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;",
      )
    : "";

  form.agency = {
    ...form.agency,
    parentName: pickText(form.agency.parentName, DEFAULT_AGENCY_PARENT),
    name: pickText(form.agency.name, DEFAULT_AGENCY_NAME),
    bodyName: sentenceAgencyName(pickText(form.agency.bodyName, form.agency.name)),
    issuePlace: pickText(form.agency.issuePlace, DEFAULT_ISSUE_PLACE),
  };

  form.document = {
    ...form.document,
    documentCodeLine: documentCode,
    documentCode,
    documentNo: documentCode,
    fullDocumentCode: documentCode,
    issueDate,
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form.agency.issuePlace, issueDate),
  };

  form.principal = {
    ...form.principal,
    accusedName,
  };

  form.offense = {
    ...form.offense,
    offenseName,
    legalArticle,
    investigationAgencyName: investigationAgency,
  };

  form.legalBasis = {
    ...form.legalBasis,
    baseProcedureLine: pickText(
      form.legalBasis.baseProcedureLine,
      EMPTY_FORM.legalBasis.baseProcedureLine,
    ),
    isJuvenile: includeJuvenile ? "true" : "false",
    includeJuvenileJusticeLine: includeJuvenile ? "true" : "false",
    juvenileLegalBasisLine: juvenileLine,
    juvenileJusticeLine: juvenileLine,
    minorLegalBasisLine: juvenileLine,
    requestApprovalLine: ensureEnding(
      `Xét hồ sơ đề nghị phê chuẩn Lệnh tạm giam số ${detentionOrderCode} ${detentionOrderIssueDateText} của ${investigationAgency} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalArticle}`,
      ";",
    ),
  };

  form.caseDecision = {
    ...form.caseDecision,
    decisionCode: caseDecisionCode,
    decisionDateText: formatDateInput(pickText(form.caseDecision.decisionDateText, issueDate)),
    legalBasisLine: ensureEnding(
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ${caseDecisionDateText} của ${investigationAgency} về tội “${offenseName}” quy định tại ${legalArticle}`,
      ";",
    ),
  };

  form.accusedDecision = {
    ...form.accusedDecision,
    decisionCode: accusedDecisionCode,
    decisionDateText: formatDateInput(pickText(form.accusedDecision.decisionDateText, issueDate)),
    legalBasisLine: ensureEnding(
      `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ${accusedDecisionDateText} của ${investigationAgency} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalArticle}`,
      ";",
    ),
  };

  form.measure = {
    ...form.measure,
    detentionOrderCode,
    detentionOrderIssueDateText: formatDateInput(
      pickText(form.measure.detentionOrderIssueDateText, issueDate),
    ),
    detentionDurationText,
    detentionStartDateText,
    detentionFromDateText: detentionStartDateText,
    detentionEndDateText,
    detentionToDateText: detentionEndDateText,
    detentionExecutionUnitName: executionUnit,
    reasonLine: ensureEnding(
      `Nhận thấy việc tạm giam đối với bị can ${accusedName} là có căn cứ và cần thiết`,
      ",",
    ),
    article1Line: ensureEnding(
      `Phê chuẩn Lệnh tạm giam số ${detentionOrderCode} ${detentionOrderIssueDateText} của ${investigationAgency} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalArticle}`,
      ".",
    ),
    detentionDurationLine,
    article2Line: ensureEnding(
      `Yêu cầu ${executionUnit} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự`,
      "./.",
    ),
  };

  form.recipients = {
    ...form.recipients,
    detentionExecutionUnitLine: `- ${executionUnit};`,
    personLine: `- ${accusedName};`,
    archiveLine: pickText(form.recipients.archiveLine, "- Lưu: HSVA, HSKS, VP."),
  };

  form.signature = {
    ...form.signature,
    signMode: pickText(form.signature.signMode, "KT. VIỆN TRƯỞNG"),
    positionTitle: pickText(form.signature.positionTitle, "PHÓ VIỆN TRƯỞNG"),
    signerName: pickText(form.signature.signerName, DEFAULT_SIGNER_NAME),
  };

  return form;
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm040FormInputs {
  const form: Bm040FormInputs = JSON.parse(JSON.stringify(EMPTY_FORM));

  const agency = getNestedValue(payload, "formInputs.agency") ?? getNestedValue(payload, "agency") ?? {};
  const document = getNestedValue(payload, "formInputs.document") ?? getNestedValue(payload, "document") ?? {};
  const legalBasis = getNestedValue(payload, "formInputs.legalBasis") ?? getNestedValue(payload, "legalBasis") ?? {};
  const caseDecision = getNestedValue(payload, "formInputs.caseDecision") ?? getNestedValue(payload, "caseDecision") ?? {};
  const accusedDecision = getNestedValue(payload, "formInputs.accusedDecision") ?? getNestedValue(payload, "accusedDecision") ?? {};
  const measure = getNestedValue(payload, "formInputs.measure") ?? getNestedValue(payload, "measure") ?? {};
  const recipients = getNestedValue(payload, "formInputs.recipients") ?? getNestedValue(payload, "recipients") ?? {};
  const signature = getNestedValue(payload, "formInputs.signature") ?? getNestedValue(payload, "signature") ?? {};
  const principal = getNestedValue(payload, "formInputs.principal") ?? getNestedValue(payload, "principal") ?? {};
  const offense = getNestedValue(payload, "formInputs.offense") ?? getNestedValue(payload, "offense") ?? {};
  const person = getNestedValue(payload, "person") ?? {};

  form.agency = {
    ...form.agency,
    parentName: pickText(getNestedValue(agency, "parentName"), form.agency.parentName),
    name: pickText(getNestedValue(agency, "name"), form.agency.name),
    bodyName: pickText(getNestedValue(agency, "bodyName"), getNestedValue(agency, "nameBody"), form.agency.bodyName),
    issuePlace: pickText(getNestedValue(agency, "issuePlace"), form.agency.issuePlace),
    phone: pickText(getNestedValue(agency, "phone"), form.agency.phone),
  };

  form.document = {
    ...form.document,
    documentCodeLine: pickText(
      getNestedValue(document, "documentCodeLine"),
      getNestedValue(document, "documentCode"),
      getNestedValue(document, "documentNo"),
      form.document.documentCodeLine,
    ),
    documentCode: pickText(getNestedValue(document, "documentCode"), getNestedValue(document, "documentCodeLine"), form.document.documentCode),
    documentNo: pickText(getNestedValue(document, "documentNo"), getNestedValue(document, "documentCodeLine"), form.document.documentNo),
    fullDocumentCode: pickText(getNestedValue(document, "fullDocumentCode"), getNestedValue(document, "documentCodeLine"), form.document.fullDocumentCode),
    issueDate: formatDateInput(pickText(getNestedValue(document, "issueDate"), getNestedValue(document, "issueDateText"), form.document.issueDate)),
    issuePlaceAndDateLine: pickText(getNestedValue(document, "issuePlaceAndDateLine"), form.document.issuePlaceAndDateLine),
  };

  form.principal = {
    accusedName: pickText(
      getNestedValue(principal, "accusedName"),
      getNestedValue(accusedDecision, "accusedName"),
      getNestedValue(person, "fullName"),
      DEFAULT_ACCUSED_NAME,
    ),
  };

  form.offense = {
    offenseName: pickText(getNestedValue(offense, "offenseName"), DEFAULT_OFFENSE_NAME),
    legalArticle: pickText(getNestedValue(offense, "legalArticle"), DEFAULT_LEGAL_ARTICLE),
    investigationAgencyName: pickText(
      getNestedValue(offense, "investigationAgencyName"),
      getNestedValue(agency, "investigationAgencyName"),
      DEFAULT_INVESTIGATION_AGENCY,
    ),
  };

  const isJuvenile =
    pickText(
      getNestedValue(legalBasis, "includeJuvenileJusticeLine"),
      getNestedValue(legalBasis, "isJuvenile"),
      "false",
    ).toLowerCase() === "true";

  form.legalBasis = {
    ...form.legalBasis,
    baseProcedureLine: pickText(getNestedValue(legalBasis, "baseProcedureLine"), form.legalBasis.baseProcedureLine),
    isJuvenile: isJuvenile ? "true" : "false",
    includeJuvenileJusticeLine: isJuvenile ? "true" : "false",
    juvenileLegalBasisLine: isJuvenile
      ? pickText(getNestedValue(legalBasis, "juvenileLegalBasisLine"), getNestedValue(legalBasis, "juvenileJusticeLine"), form.legalBasis.juvenileLegalBasisLine)
      : "",
    juvenileJusticeLine: isJuvenile
      ? pickText(getNestedValue(legalBasis, "juvenileJusticeLine"), getNestedValue(legalBasis, "juvenileLegalBasisLine"), form.legalBasis.juvenileJusticeLine)
      : "",
    minorLegalBasisLine: isJuvenile
      ? pickText(getNestedValue(legalBasis, "minorLegalBasisLine"), getNestedValue(legalBasis, "juvenileLegalBasisLine"), form.legalBasis.minorLegalBasisLine)
      : "",
    requestApprovalLine: pickText(getNestedValue(legalBasis, "requestApprovalLine"), form.legalBasis.requestApprovalLine),
  };

  form.caseDecision = {
    ...form.caseDecision,
    decisionCode: pickText(
      getNestedValue(caseDecision, "decisionCode"),
      getNestedValue(caseDecision, "decisionNo"),
      form.caseDecision.decisionCode,
    ),
    decisionDateText: formatDateInput(
      pickText(
        getNestedValue(caseDecision, "decisionDateText"),
        getNestedValue(caseDecision, "decisionDate"),
        getNestedValue(caseDecision, "issueDate"),
        getNestedValue(caseDecision, "issueDateText"),
        getNestedValue(caseDecision, "decisionIssueDateText"),
        form.caseDecision.decisionDateText,
      ),
    ),
    legalBasisLine: pickText(getNestedValue(caseDecision, "legalBasisLine"), form.caseDecision.legalBasisLine),
  };

  form.accusedDecision = {
    ...form.accusedDecision,
    decisionCode: pickText(
      getNestedValue(accusedDecision, "decisionCode"),
      getNestedValue(accusedDecision, "decisionNo"),
      form.accusedDecision.decisionCode,
    ),
    decisionDateText: formatDateInput(
      pickText(
        getNestedValue(accusedDecision, "decisionDateText"),
        getNestedValue(accusedDecision, "decisionDate"),
        getNestedValue(accusedDecision, "issueDate"),
        getNestedValue(accusedDecision, "issueDateText"),
        getNestedValue(accusedDecision, "decisionIssueDateText"),
        form.accusedDecision.decisionDateText,
      ),
    ),
    legalBasisLine: pickText(getNestedValue(accusedDecision, "legalBasisLine"), form.accusedDecision.legalBasisLine),
  };

  form.measure = {
    ...form.measure,
    detentionOrderCode: pickText(getNestedValue(measure, "detentionOrderCode"), form.measure.detentionOrderCode),
    detentionOrderIssueDateText: formatDateInput(
      pickText(
        getNestedValue(measure, "detentionOrderIssueDateText"),
        getNestedValue(measure, "detentionOrderIssueDate"),
        getNestedValue(measure, "detentionOrderDateText"),
        getNestedValue(measure, "orderIssueDateText"),
        getNestedValue(measure, "orderIssueDate"),
        getNestedValue(measure, "issueDateText"),
        form.measure.detentionOrderIssueDateText,
      ),
    ),
    detentionDurationText: pickText(getNestedValue(measure, "detentionDurationText"), form.measure.detentionDurationText),
    detentionStartDateText: formatDateInput(
      pickText(
        getNestedValue(measure, "detentionStartDateText"),
        getNestedValue(measure, "detentionFromDateText"),
        getNestedValue(measure, "detentionOrderIssueDateText"),
        getNestedValue(measure, "orderIssueDateText"),
        form.measure.detentionStartDateText,
      ),
    ),
    detentionFromDateText: formatDateInput(
      pickText(
        getNestedValue(measure, "detentionFromDateText"),
        getNestedValue(measure, "detentionStartDateText"),
        form.measure.detentionFromDateText,
      ),
    ),
    detentionEndDateText: formatDateInput(
      pickText(
        getNestedValue(measure, "detentionEndDateText"),
        getNestedValue(measure, "detentionToDateText"),
        form.measure.detentionEndDateText,
      ),
    ),
    detentionToDateText: formatDateInput(
      pickText(
        getNestedValue(measure, "detentionToDateText"),
        getNestedValue(measure, "detentionEndDateText"),
        form.measure.detentionToDateText,
      ),
    ),
    detentionExecutionUnitName: pickText(getNestedValue(measure, "detentionExecutionUnitName"), form.measure.detentionExecutionUnitName),
    reasonLine: pickText(getNestedValue(measure, "reasonLine"), form.measure.reasonLine),
    article1Line: pickText(getNestedValue(measure, "article1Line"), form.measure.article1Line),
    detentionDurationLine: pickText(getNestedValue(measure, "detentionDurationLine"), form.measure.detentionDurationLine),
    article2Line: pickText(getNestedValue(measure, "article2Line"), form.measure.article2Line),
  };

  form.recipients = {
    ...form.recipients,
    detentionExecutionUnitLine: pickText(getNestedValue(recipients, "detentionExecutionUnitLine"), form.recipients.detentionExecutionUnitLine),
    personLine: pickText(getNestedValue(recipients, "personLine"), getNestedValue(recipients, "accusedLine"), form.recipients.personLine),
    archiveLine: pickText(getNestedValue(recipients, "archiveLine"), form.recipients.archiveLine),
  };

  form.signature = {
    ...form.signature,
    signMode: pickText(getNestedValue(signature, "signMode"), form.signature.signMode),
    positionTitle: pickText(getNestedValue(signature, "positionTitle"), form.signature.positionTitle),
    signerName: pickText(getNestedValue(signature, "signerName"), form.signature.signerName),
  };

  return buildDerivedLines(form);
}

async function getBm040RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Không tải được render-payload BM-040. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

function withBm040DateAliases(input: Bm040FormInputs): Bm040FormInputs {
  const form = JSON.parse(JSON.stringify(input)) as Bm040FormInputs;

  const issueDate = formatDateInput(pickText(form.document.issueDate, getTodayDisplayDate()));

  const caseDecisionDate = formatDateInput(
    pickText(
      form.caseDecision.decisionDateText,
      form.caseDecision.decisionDate,
      form.caseDecision.issueDate,
      form.caseDecision.issueDateText,
      issueDate,
    ),
  );

  const accusedDecisionDate = formatDateInput(
    pickText(
      form.accusedDecision.decisionDateText,
      form.accusedDecision.decisionDate,
      form.accusedDecision.issueDate,
      form.accusedDecision.issueDateText,
      issueDate,
    ),
  );

  const detentionOrderDate = formatDateInput(
    pickText(
      form.measure.detentionOrderIssueDateText,
      form.measure.detentionOrderIssueDate,
      form.measure.detentionOrderDateText,
      form.measure.orderIssueDateText,
      form.measure.orderIssueDate,
      form.measure.issueDateText,
      issueDate,
    ),
  );

  const detentionStartDate = formatDateInput(
    pickText(
      form.measure.detentionStartDateText,
      form.measure.detentionFromDateText,
      detentionOrderDate,
      issueDate,
    ),
  );

  const detentionEndDate = formatDateInput(
    pickText(
      form.measure.detentionEndDateText,
      form.measure.detentionToDateText,
      "",
    ),
  );

  form.document.issueDate = issueDate;
  form.document.issueDateText = issueDate;

  form.caseDecision.decisionDateText = caseDecisionDate;
  form.caseDecision.decisionDate = caseDecisionDate;
  form.caseDecision.issueDate = caseDecisionDate;
  form.caseDecision.issueDateText = caseDecisionDate;
  form.caseDecision.decisionIssueDateText = caseDecisionDate;

  form.accusedDecision.decisionDateText = accusedDecisionDate;
  form.accusedDecision.decisionDate = accusedDecisionDate;
  form.accusedDecision.issueDate = accusedDecisionDate;
  form.accusedDecision.issueDateText = accusedDecisionDate;
  form.accusedDecision.decisionIssueDateText = accusedDecisionDate;

  form.measure.detentionOrderIssueDateText = detentionOrderDate;
  form.measure.detentionOrderIssueDate = detentionOrderDate;
  form.measure.detentionOrderDateText = detentionOrderDate;
  form.measure.orderIssueDateText = detentionOrderDate;
  form.measure.orderIssueDate = detentionOrderDate;
  form.measure.issueDateText = detentionOrderDate;

  form.measure.detentionStartDateText = detentionStartDate;
  form.measure.detentionFromDateText = detentionStartDate;
  form.measure.detentionEndDateText = detentionEndDate;
  form.measure.detentionToDateText = detentionEndDate;

  return form;
}
async function saveBm040FormInputs(documentId: string | number, form: Bm040FormInputs): Promise<void> {
  const savePayload = withBm040DateAliases(buildDerivedLines(form));
  const updatedByName = savePayload.signature.signerName.trim() || DEFAULT_SIGNER_NAME;

  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      updatedByName,
      formInputs: savePayload,
      ...savePayload,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Không lưu được dữ liệu BM-040. HTTP ${response.status}`);
  }
}

function getValue(form: Bm040FormInputs, section: SectionKey, field: string): string {
  return form[section]?.[field] ?? "";
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required = false,
  rows = 3,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function DateSelectField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  required?: boolean;
}) {
  const normalized = formatDateInput(value);
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  const selectedDay = match ? match[1].padStart(2, "0") : "";
  const selectedMonth = match ? match[2].padStart(2, "0") : "";
  const selectedYear = match ? match[3] : "";

  const updatePart = (part: "day" | "month" | "year", nextValue: string) => {
    const day = part === "day" ? nextValue : selectedDay;
    const month = part === "month" ? nextValue : selectedMonth;
    const year = part === "year" ? nextValue : selectedYear;

    if (!day && !month && !year) {
      onChange("");
      return;
    }

    onChange(`${day || "01"}/${month || "01"}/${year || String(new Date().getFullYear())}`);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, index) => String(currentYear - 5 + index));

  return (
    <div className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        <select
          value={selectedDay}
          onChange={(event) => updatePart("day", event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Ngày</option>
          {Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={(event) => updatePart("month", event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Tháng</option>
          {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(event) => updatePart("year", event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Năm</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PreviewTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="md:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-bold text-slate-900">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 last:border-b-0">
                <th className="w-56 align-top bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                  {row.label}
                </th>
                <td className="whitespace-pre-wrap px-4 py-3 leading-6 text-slate-900">
                  {row.value || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Bm040FormInputsPanel({
  documentId,
  onSaved,
}: Bm040FormInputsPanelProps) {
  const [form, setForm] = useState<Bm040FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const syncedForm = useMemo(() => buildDerivedLines(form), [form]);
  const isDirty = JSON.stringify(syncedForm) !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => !getValue(syncedForm, item.section, item.field).trim());
  }, [syncedForm]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const payload = await getBm040RenderPayload(documentId);
        const nextForm = normalizeFormInputs(payload);

        if (!isMounted) return;

        setForm(nextForm);
        setInitialSnapshot(JSON.stringify(buildDerivedLines(nextForm)));
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-040.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  function updateField<TSection extends SectionKey>(
    sectionName: TSection,
    fieldName: string,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [sectionName]: {
        ...current[sectionName],
        [fieldName]: value,
      },
    }));
  }

  function fillCustomerSample() {
    const sample = buildDerivedLines(EMPTY_FORM);

    setForm(sample);
    setSuccessMessage("Đã điền dữ liệu mẫu BM-040. Bấm lưu để ghi vào backend.");
    setErrorMessage("");
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const savePayload = withBm040DateAliases(buildDerivedLines(form));
      await saveBm040FormInputs(documentId, savePayload);

      setForm(savePayload);
      setInitialSnapshot(JSON.stringify(savePayload));
      setSavedAt(new Date());
      setSuccessMessage("Đã lưu dữ liệu BM-040. Có thể render lại DOCX/PDF.");
      onSaved?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được dữ liệu BM-040.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu BM-040...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-040" form={form} onApply={(next) => setForm(next as typeof form)} />
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          BM-040
        </p>
        <h2 className="mt-2 text-xl font-bold text-emerald-950">
          Dữ liệu biểu mẫu Quyết định phê chuẩn Lệnh tạm giam
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Tên bị can và tội danh nhập một lần ở phần thông tin chính. Các dòng căn cứ,
          xét hồ sơ, Điều 1, Điều 2 và nơi nhận tự đồng bộ trước khi lưu/render.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-040
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-040"}
          </button>
        </div>

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3 text-sm text-amber-900">
            <p className="font-semibold">Còn thiếu {missingFields.length} trường quan trọng:</p>
            <p className="mt-1">{missingFields.map((item) => item.label).join(", ")}</p>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-emerald-800">
            Đã nhập đủ các trường quan trọng.
          </p>
        )}

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </p>
        ) : null}
      </div>

      <BmFormSection
        title="1. Văn bản / cơ quan"
        description="Ngày ban hành dùng dropdown ngày - tháng - năm. Dòng địa danh ngày tháng tự format."
      >
        <BmFieldText
          label="Cơ quan cấp trên"
          value={form.agency.parentName}
          onChange={(value) => updateField("agency", "parentName", value)}
          required
         />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          value={form.agency.name}
          onChange={(value) => updateField("agency", "name", value)}
          required
         />
        <BmFieldText
          label="Số quyết định"
          value={form.document.documentCodeLine}
          onChange={(value) => updateField("document", "documentCodeLine", value)}
          required
         />
        <DateSelectField
          label="Ngày ban hành"
          value={form.document.issueDate || getTodayDisplayDate()}
          onChange={(value) => updateField("document", "issueDate", value)}
          required
        />
        <BmFieldText
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value)}
         />
        <div className="block">
          <span className="text-sm font-semibold text-slate-700">
            Địa danh, ngày tháng năm <span className="text-red-600">*</span>
          </span>
          <p className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
            {syncedForm.document.issuePlaceAndDateLine}
          </p>
        </div>
      </BmFormSection>

      <BmFormSection
        title="2. Thông tin chính"
        description="Hai ô chính Tên bị can và Tội danh không giới hạn ký tự, nhập được dấu cách bình thường."
      >
        <BmFieldText
          label="Tên bị can"
          value={form.principal.accusedName}
          onChange={(value) => updateField("principal", "accusedName", value)}
          required
          placeholder="Ví dụ: "
         />
        <BmFieldText
          label="Tội danh"
          value={form.offense.offenseName}
          onChange={(value) => updateField("offense", "offenseName", value)}
          required
          placeholder="Ví dụ: Trộm cắp tài sản"
         />
        <BmFieldText
          label="Điều luật"
          value={form.offense.legalArticle}
          onChange={(value) => updateField("offense", "legalArticle", value)}
          required
         />
        <BmFieldText
          label="Cơ quan điều tra"
          value={form.offense.investigationAgencyName}
          onChange={(value) => updateField("offense", "investigationAgencyName", value)}
          required
         />
      </BmFormSection>

      <BmFormSection title="3. Căn cứ / Lệnh tạm giam">
        <BmFieldTextarea
          label="Căn cứ Bộ luật Tố tụng hình sự"
          value={form.legalBasis.baseProcedureLine}
          onChange={(value) => updateField("legalBasis", "baseProcedureLine", value)}
          required fullWidth
         />

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={form.legalBasis.isJuvenile === "true"}
              onChange={(event) =>
                updateField("legalBasis", "isJuvenile", event.target.checked ? "true" : "false")
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Có áp dụng căn cứ Luật Tư pháp người chưa thành niên
          </label>

          {form.legalBasis.isJuvenile === "true" ? (
            <div className="mt-4">
              <BmFieldTextarea
                label="Căn cứ người chưa thành niên"
                value={
                  form.legalBasis.juvenileLegalBasisLine ||
                  "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;"
                }
                onChange={(value) => updateField("legalBasis", "juvenileLegalBasisLine", value)}
                rows={3}
               />
            </div>
          ) : null}
        </div>

        <BmFieldText
          label="Số quyết định khởi tố vụ án"
          value={form.caseDecision.decisionCode}
          onChange={(value) => updateField("caseDecision", "decisionCode", value)}
         />
        <DateSelectField
          label="Ngày quyết định khởi tố vụ án"
          value={form.caseDecision.decisionDateText}
          onChange={(value) => updateField("caseDecision", "decisionDateText", value)}
        />
        <BmFieldText
          label="Số quyết định khởi tố bị can"
          value={form.accusedDecision.decisionCode}
          onChange={(value) => updateField("accusedDecision", "decisionCode", value)}
         />
        <DateSelectField
          label="Ngày quyết định khởi tố bị can"
          value={form.accusedDecision.decisionDateText}
          onChange={(value) => updateField("accusedDecision", "decisionDateText", value)}
        />
        <BmFieldText
          label="Số Lệnh tạm giam"
          value={form.measure.detentionOrderCode}
          onChange={(value) => updateField("measure", "detentionOrderCode", value)}
         />
        <DateSelectField
          label="Ngày Lệnh tạm giam"
          value={form.measure.detentionOrderIssueDateText}
          onChange={(value) => updateField("measure", "detentionOrderIssueDateText", value)}
        />
      </BmFormSection>

      <BmFormSection title="4. Nội dung quyết định">
        <BmFieldTextarea
          label="Căn cứ quyết định khởi tố vụ án"
          value={syncedForm.caseDecision.legalBasisLine}
          onChange={(value) => updateField("caseDecision", "legalBasisLine", value)}
          required fullWidth
         />
        <BmFieldTextarea
          label="Căn cứ quyết định khởi tố bị can"
          value={syncedForm.accusedDecision.legalBasisLine}
          onChange={(value) => updateField("accusedDecision", "legalBasisLine", value)}
          required fullWidth
         />
        <BmFieldTextarea
          label="Xét hồ sơ đề nghị phê chuẩn"
          value={syncedForm.legalBasis.requestApprovalLine}
          onChange={(value) => updateField("legalBasis", "requestApprovalLine", value)}
          required fullWidth
         />
        <BmFieldTextarea
          label="Nhận thấy"
          value={syncedForm.measure.reasonLine}
          onChange={(value) => updateField("measure", "reasonLine", value)}
          required fullWidth
         />
        <BmFieldTextarea
          label="Điều 1"
          value={syncedForm.measure.article1Line}
          onChange={(value) => updateField("measure", "article1Line", value)}
          required
          rows={4} fullWidth
         />
        <BmFieldText
          label="Thời hạn tạm giam"
          value={form.measure.detentionDurationText}
          onChange={(value) => updateField("measure", "detentionDurationText", value)}
          required
          placeholder="Ví dụ: 02 tháng"
         />
        <DateSelectField
          label="Từ ngày tạm giam"
          value={form.measure.detentionStartDateText}
          onChange={(value) => updateField("measure", "detentionStartDateText", value)}
          required
        />
        <DateSelectField
          label="Đến ngày tạm giam"
          value={form.measure.detentionEndDateText}
          onChange={(value) => updateField("measure", "detentionEndDateText", value)}
          required
        />
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold leading-6 text-slate-800">
          {syncedForm.measure.detentionDurationLine}
        </div>
        <BmFieldText
          label="Cơ quan thực hiện quyết định"
          value={form.measure.detentionExecutionUnitName}
          onChange={(value) => updateField("measure", "detentionExecutionUnitName", value)}
          required
         />
        <BmFieldTextarea
          label="Điều 2"
          value={syncedForm.measure.article2Line}
          onChange={(value) => updateField("measure", "article2Line", value)}
          required
          rows={3} fullWidth
         />
      </BmFormSection>

      <BmFormSection title="5. Nơi nhận">
        <BmFieldText
          label="Cơ quan thực hiện quyết định"
          value={syncedForm.recipients.detentionExecutionUnitLine}
          onChange={(value) => updateField("recipients", "detentionExecutionUnitLine", value)}
          required
         />
        <BmFieldText
          label="Bị can"
          value={syncedForm.recipients.personLine}
          onChange={(value) => updateField("recipients", "personLine", value)}
          required
         />
        <BmFieldText
          label="Lưu"
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
          required
         />
      </BmFormSection>

      <BmFormSection
        title="Preview trước khi in"
        description="Xem nhanh các dòng chính sẽ render ra DOCX/PDF."
      >
        <PreviewTable
          title="Căn cứ"
          rows={[
            { label: "Căn cứ BLTTHS", value: syncedForm.legalBasis.baseProcedureLine },
            {
              label: "Căn cứ người chưa thành niên",
              value: syncedForm.legalBasis.juvenileLegalBasisLine || "(không áp dụng)",
            },
            { label: "Quyết định khởi tố vụ án", value: syncedForm.caseDecision.legalBasisLine },
            { label: "Quyết định khởi tố bị can", value: syncedForm.accusedDecision.legalBasisLine },
            { label: "Xét hồ sơ", value: syncedForm.legalBasis.requestApprovalLine },
            { label: "Nhận thấy", value: syncedForm.measure.reasonLine },
          ]}
        />

        <PreviewTable
          title="Quyết định"
          rows={[
            { label: "Điều 1", value: syncedForm.measure.article1Line },
            { label: "Thời hạn", value: syncedForm.measure.detentionDurationLine },
            { label: "Điều 2", value: syncedForm.measure.article2Line },
          ]}
        />

        <PreviewTable
          title="Nơi nhận / chữ ký"
          rows={[
            { label: "Cơ quan thực hiện", value: syncedForm.recipients.detentionExecutionUnitLine },
            { label: "Bị can", value: syncedForm.recipients.personLine },
            { label: "Lưu", value: syncedForm.recipients.archiveLine },
            {
              label: "Chữ ký",
              value: `${syncedForm.signature.signMode}\n${syncedForm.signature.positionTitle}\n${syncedForm.signature.signerName}`,
            },
          ]}
        />
      </BmFormSection>

      <BmFormSection title="6. Chữ ký">
        <BmFieldText
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          required
         />
        <BmFieldText
          label="Chức vụ"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          required
         />
        <BmFieldText
          label="Người ký"
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          required
         />
      </BmFormSection>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            {savedAt ? (
              <span>
                Đã lưu lúc{" "}
                <strong className="font-semibold text-slate-900">
                  {savedAt.toLocaleTimeString("vi-VN")}
                </strong>
              </span>
            ) : (
              <span>Chưa lưu thay đổi trong phiên này.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-040"}
          </button>
        </div>
      </div>
    </section>
  );
}