"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldSelect,
  BmFormSection,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = '';
const DEFAULT_ACCUSED_NAME = '';
const DEFAULT_OFFENSE_NAME = '';
const DEFAULT_LEGAL_ARTICLE = "khoản 1 Điều 321 Bộ luật Hình sự";
const DEFAULT_AGENCY = '';
const DEFAULT_JUVENILE_LINE =
  "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;";
const BLANK_RENDER_LINE = "\u200C";

type TextRecord = Record<string, string>;

type SectionKey =
  | "agency"
  | "document"
  | "legalBasis"
  | "caseDecision"
  | "accusedDecision"
  | "principal"
  | "offense"
  | "measure"
  | "recipients"
  | "signature";

type Bm037FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  legalBasis: TextRecord;
  caseDecision: TextRecord;
  accusedDecision: TextRecord;
  principal: TextRecord;
  offense: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm037FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const SIGN_MODE_OPTIONS = [
  { value: "KT. VIỆN TRƯỞNG", label: "KT. VIỆN TRƯỞNG" },
  { value: "VIỆN TRƯỞNG", label: "VIỆN TRƯỞNG" },
  { value: "TUQ. VIỆN TRƯỞNG", label: "TUQ. VIỆN TRƯỞNG" },
];

const POSITION_OPTIONS = [
  { value: "VIỆN TRƯỞNG", label: "VIỆN TRƯỞNG" },
  { value: "PHÓ VIỆN TRƯỞNG", label: "PHÓ VIỆN TRƯỞNG" },
  { value: "KIỂM SÁT VIÊN", label: "KIỂM SÁT VIÊN" },
];

const EMPTY_FORM: Bm037FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCodeLine: "37/QĐ-VKSKV7",
    documentCode: "37/QĐ-VKSKV7",
    documentNo: "37/QĐ-VKSKV7",
    fullDocumentCode: "37/QĐ-VKSKV7",
    issueDate: "",
    issuePlaceAndDateLine: "",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 113, 119, 165 và 173 của Bộ luật Tố tụng hình sự;",
    isJuvenile: "false",
    juvenileLegalBasisLine: "",
    juvenileJusticeLine: "",
    requestApprovalLine: "",
  },
  caseDecision: {
    decisionCode: "",
    decisionDate: "",
    decisionDateText: "",
    agencyName: DEFAULT_AGENCY,
    legalBasisLine: "",
  },
  accusedDecision: {
    decisionCode: "",
    decisionDate: "",
    decisionDateText: "",
    agencyName: DEFAULT_AGENCY,
    legalBasisLine: "",
  },
  principal: {
    accusedName: DEFAULT_ACCUSED_NAME,
    personName: DEFAULT_ACCUSED_NAME,
    investigationAuthorityName: DEFAULT_AGENCY,
  },
  offense: {
    offenseName: DEFAULT_OFFENSE_NAME,
    legalArticle: DEFAULT_LEGAL_ARTICLE,
  },
  measure: {
    arrestOrderCode: "17/LTG-VKSKV7",
    arrestOrderIssueDateText: "",
    detentionToDateText: "",
    reasonLine: "",
    article1Line: "",
    detentionDurationLine: "",
    article2Line: "",
  },
  recipients: {
    investigationUnitLine: "",
    personLine: "",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Viện kiểm sát ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh" },
  { section: "document", field: "documentCodeLine", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  { section: "document", field: "issuePlaceAndDateLine", label: "Dòng địa danh, ngày ban hành" },
  { section: "principal", field: "accusedName", label: "Tên bị can" },
  { section: "principal", field: "investigationAuthorityName", label: "Cơ quan ra lệnh" },
  { section: "offense", field: "offenseName", label: "Tội danh" },
  { section: "offense", field: "legalArticle", label: "Điều khoản BLHS" },
  { section: "caseDecision", field: "legalBasisLine", label: "Căn cứ quyết định khởi tố vụ án" },
  { section: "accusedDecision", field: "legalBasisLine", label: "Căn cứ quyết định khởi tố bị can" },
  { section: "legalBasis", field: "requestApprovalLine", label: "Xét hồ sơ đề nghị" },
  { section: "measure", field: "reasonLine", label: "Nhận thấy" },
  { section: "measure", field: "article1Line", label: "Điều 1" },
  { section: "measure", field: "detentionDurationLine", label: "Thời hạn tạm giam" },
  { section: "measure", field: "article2Line", label: "Điều 2" },
  { section: "recipients", field: "investigationUnitLine", label: "Nơi nhận - cơ quan điều tra" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - bị can" },
  { section: "recipients", field: "archiveLine", label: "Nơi nhận - lưu" },
  { section: "signature", field: "signMode", label: "Chế độ ký" },
  { section: "signature", field: "positionTitle", label: "Chức vụ người ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function todayDisplayDate(): string {
  const now = new Date();

  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedValue(source: unknown, path: string): unknown {
  let current: unknown = source;

  for (const part of path.split(".")) {
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      current = current[Number(part)];
      continue;
    }

    if (!isRecord(current)) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function rawInputText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/[\u200B-\u200D\uFEFF]/gu, "");
}

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/[\u200B-\u200D\uFEFF]/gu, "")
    .trim();
}

function pickText(source: unknown, ...paths: string[]): string {
  for (const path of paths) {
    const value = toText(getNestedValue(source, path));

    if (
      value &&
      value.toLowerCase() !== "null" &&
      value.toLowerCase() !== "undefined"
    ) {
      return value;
    }
  }

  return "";
}

function pickDirect(...values: unknown[]): string {
  for (const value of values) {
    const next = toText(value);

    if (
      next &&
      next.toLowerCase() !== "null" &&
      next.toLowerCase() !== "undefined"
    ) {
      return next;
    }
  }

  return "";
}

function sourceRoot(payload: unknown): Record<string, unknown> {
  const candidates = [
    // Ưu tiên dữ liệu khách đã save trong DB snapshot trước.
    "render_payload_snapshot.formInputs",
    "render_payload_snapshot.payloadOverrides",
    "render_payload_snapshot.renderPayloadOverrides",
    "renderPayloadSnapshot.formInputs",
    "renderPayloadSnapshot.payloadOverrides",
    "renderPayloadSnapshot.renderPayloadOverrides",

    // Một số endpoint có thể bọc snapshot trong data/payload/document.
    "data.render_payload_snapshot.formInputs",
    "data.render_payload_snapshot.payloadOverrides",
    "data.render_payload_snapshot.renderPayloadOverrides",
    "data.renderPayloadSnapshot.formInputs",
    "data.renderPayloadSnapshot.payloadOverrides",
    "data.renderPayloadSnapshot.renderPayloadOverrides",
    "payload.render_payload_snapshot.formInputs",
    "payload.render_payload_snapshot.payloadOverrides",
    "payload.render_payload_snapshot.renderPayloadOverrides",
    "payload.renderPayloadSnapshot.formInputs",
    "payload.renderPayloadSnapshot.payloadOverrides",
    "payload.renderPayloadSnapshot.renderPayloadOverrides",
    "document.render_payload_snapshot.formInputs",
    "generatedDocument.render_payload_snapshot.formInputs",
    "generated_document.render_payload_snapshot.formInputs",

    // Sau cùng mới lấy payload top-level vì các field này có thể là bản auto-generate.
    "formInputs",
    "payloadOverrides",
    "renderPayloadOverrides",
    "metadata.formInputs",
    "metadata.payloadOverrides",
    "metadata.renderPayloadOverrides",
    "data.formInputs",
    "data.payloadOverrides",
    "data.renderPayloadOverrides",
    "payload.formInputs",
    "payload.payloadOverrides",
    "payload.renderPayloadOverrides",
    "renderPayload.formInputs",
    "renderPayload.payloadOverrides",
    "renderPayload.renderPayloadOverrides",
  ];

  for (const path of candidates) {
    const value = getNestedValue(payload, path);

    if (isRecord(value) && Object.keys(value).length > 0) {
      return value;
    }
  }

  return isRecord(payload) ? payload : {};
}
function stripRecipientLine(value: string): string {
  return toText(value).replace(/^-\s*/u, "").replace(/[;.]\s*$/u, "");
}

function recipientLine(value: string): string {
  const raw = stripRecipientLine(value);

  return raw ? `- ${raw};` : "";
}

function archiveLine(value: string): string {
  const raw = stripRecipientLine(value);

  if (!raw) {
    return "- Lưu: HSVA, HSKS, VP.";
  }

  return raw.toLocaleLowerCase("vi-VN").startsWith("lưu:")
    ? `- ${raw.replace(/\.$/u, "")}.`
    : `- Lưu: ${raw.replace(/\.$/u, "")}.`;
}

function parseDateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = toText(value);

  const display = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u.exec(raw);
  if (display) {
    return {
      day: pad2(Number(display[1])),
      month: pad2(Number(display[2])),
      year: display[3],
    };
  }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/u.exec(raw);
  if (iso) {
    return {
      day: pad2(Number(iso[3])),
      month: pad2(Number(iso[2])),
      year: iso[1],
    };
  }

  const vn = /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu.exec(raw);
  if (vn) {
    return {
      day: pad2(Number(vn[1])),
      month: pad2(Number(vn[2])),
      year: vn[3],
    };
  }

  const today = todayDisplayDate();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/u.exec(today);

  return {
    day: match?.[1] ?? "01",
    month: match?.[2] ?? "01",
    year: match?.[3] ?? String(new Date().getFullYear()),
  };
}

function buildDisplayDate(day: string, month: string, year: string): string {
  return `${pad2(Number(day))}/${pad2(Number(month))}/${year}`;
}

function buildVietnameseDateLine(day: string, month: string, year: string): string {
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function normalizeDisplayDate(value: string): string {
  const raw = toText(value);

  if (!raw || raw.includes("...")) {
    return todayDisplayDate();
  }

  const parts = parseDateParts(raw);

  return buildDisplayDate(parts.day, parts.month, parts.year);
}

function normalizeVietnameseDateLine(value: string): string {
  const raw = toText(value);

  if (!raw || raw.includes("...")) {
    const parts = parseDateParts(todayDisplayDate());

    return buildVietnameseDateLine(parts.day, parts.month, parts.year);
  }

  const parts = parseDateParts(raw);

  return buildVietnameseDateLine(parts.day, parts.month, parts.year);
}

function buildIssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const place = toText(issuePlace) || "TP. Hồ Chí Minh";
  const parts = parseDateParts(issueDate || todayDisplayDate());

  return `${place}, ${buildVietnameseDateLine(parts.day, parts.month, parts.year)}`;
}

function offensePhrase(offenseName: string, legalArticle: string): string {
  const offense = toText(offenseName);
  const article = toText(legalArticle);

  if (!offense && !article) {
    return "";
  }

  if (!article) {
    return `về tội “${offense || "..."}”`;
  }

  return `về tội “${offense || "..."}” quy định tại ${article}`;
}

function getValue(form: Bm037FormInputs, section: SectionKey, field: string): string {
  return form[section][field] ?? "";
}

function buildGeneratedLines(form: Bm037FormInputs): Pick<Bm037FormInputs, "caseDecision" | "accusedDecision" | "legalBasis" | "measure" | "recipients"> {
  const accusedName = toText(form.principal.accusedName) || "...";
  const offenseName = toText(form.offense.offenseName) || "...";
  const legalArticle = toText(form.offense.legalArticle) || DEFAULT_LEGAL_ARTICLE;

  const caseAgency = toText(form.caseDecision.agencyName) || DEFAULT_AGENCY;
  const accusedAgency = toText(form.accusedDecision.agencyName) || DEFAULT_AGENCY;
  const orderAgency = toText(form.principal.investigationAuthorityName) || DEFAULT_AGENCY;

  const caseDecisionCode = toText(form.caseDecision.decisionCode) || "";
  const caseDecisionDateText = normalizeVietnameseDateLine(
    form.caseDecision.decisionDateText || form.caseDecision.decisionDate,
  );

  const accusedDecisionCode = toText(form.accusedDecision.decisionCode) || "";
  const accusedDecisionDateText = normalizeVietnameseDateLine(
    form.accusedDecision.decisionDateText || form.accusedDecision.decisionDate,
  );

  const orderCode = toText(form.measure.arrestOrderCode) || "17/LTG-VKSKV7";
  const orderDateText = normalizeVietnameseDateLine(form.measure.arrestOrderIssueDateText);
  const detentionToDateText = normalizeVietnameseDateLine(form.measure.detentionToDateText);

  const offense = offensePhrase(offenseName, legalArticle);

  return {
    caseDecision: {
      ...form.caseDecision,
      decisionDateText: caseDecisionDateText,
      legalBasisLine: `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ${caseDecisionDateText} của ${caseAgency} ${offense};`,
    },
    accusedDecision: {
      ...form.accusedDecision,
      decisionDateText: accusedDecisionDateText,
      legalBasisLine: `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ${accusedDecisionDateText} của ${accusedAgency} đối với ${accusedName} ${offense};`,
    },
    legalBasis: {
      ...form.legalBasis,
      requestApprovalLine: `Xét hồ sơ đề nghị phê chuẩn Lệnh bắt bị can để tạm giam số ${orderCode} ${orderDateText} của ${orderAgency} đối với ${accusedName} ${offense};`,
    },
    measure: {
      ...form.measure,
      arrestOrderIssueDateText: orderDateText,
      detentionToDateText,
      reasonLine: `Nhận thấy việc bắt để tạm giam đối với bị can ${accusedName} là có căn cứ và cần thiết,`,
      article1Line: `Phê chuẩn Lệnh bắt bị can để tạm giam số ${orderCode} ${orderDateText} của ${orderAgency} đối với ${accusedName}.`,
      detentionDurationLine: `Thời hạn tạm giam tính từ ngày bắt được bị can để tạm giam đến ${detentionToDateText}.`,
      article2Line: `Yêu cầu ${orderAgency} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.`,
    },
    recipients: {
      investigationUnitLine: recipientLine(orderAgency),
      personLine: recipientLine(accusedName),
      archiveLine: archiveLine(form.recipients.archiveLine),
    },
  };
}

function hydrateMissingGeneratedLines(input: Bm037FormInputs): Bm037FormInputs {
  const form = JSON.parse(JSON.stringify(input)) as Bm037FormInputs;
  const isJuvenile = form.legalBasis.isJuvenile === "true";
  const generated = buildGeneratedLines(form);

  return {
    agency: {
      parentName: toText(form.agency.parentName) || EMPTY_FORM.agency.parentName,
      name: toText(form.agency.name) || EMPTY_FORM.agency.name,
      issuePlace: toText(form.agency.issuePlace) || EMPTY_FORM.agency.issuePlace,
    },
    document: {
      ...form.document,
      documentCodeLine:
        toText(form.document.documentCodeLine) ||
        toText(form.document.documentCode) ||
        EMPTY_FORM.document.documentCodeLine,
      documentCode:
        toText(form.document.documentCode) ||
        toText(form.document.documentCodeLine) ||
        EMPTY_FORM.document.documentCodeLine,
      documentNo:
        toText(form.document.documentNo) ||
        toText(form.document.documentCodeLine) ||
        EMPTY_FORM.document.documentCodeLine,
      fullDocumentCode:
        toText(form.document.fullDocumentCode) ||
        toText(form.document.documentCodeLine) ||
        EMPTY_FORM.document.documentCodeLine,
      issueDate: normalizeDisplayDate(form.document.issueDate),
      issuePlaceAndDateLine:
        toText(form.document.issuePlaceAndDateLine) ||
        buildIssuePlaceAndDateLine(form.agency.issuePlace, form.document.issueDate),
    },
    legalBasis: {
      ...form.legalBasis,
      procedureArticlesLine:
        toText(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      isJuvenile: isJuvenile ? "true" : "false",
      juvenileLegalBasisLine: isJuvenile
        ? toText(form.legalBasis.juvenileLegalBasisLine) || DEFAULT_JUVENILE_LINE
        : "",
      juvenileJusticeLine: isJuvenile
        ? toText(form.legalBasis.juvenileJusticeLine) ||
          toText(form.legalBasis.juvenileLegalBasisLine) ||
          DEFAULT_JUVENILE_LINE
        : "",
      requestApprovalLine:
        toText(form.legalBasis.requestApprovalLine) ||
        generated.legalBasis.requestApprovalLine,
    },
    caseDecision: {
      ...form.caseDecision,
      decisionCode:
        toText(form.caseDecision.decisionCode) ||
        EMPTY_FORM.caseDecision.decisionCode,
      decisionDate: normalizeDisplayDate(
        form.caseDecision.decisionDate || form.caseDecision.decisionDateText,
      ),
      decisionDateText: normalizeVietnameseDateLine(
        form.caseDecision.decisionDateText || form.caseDecision.decisionDate,
      ),
      agencyName:
        toText(form.caseDecision.agencyName) ||
        toText(form.principal.investigationAuthorityName) ||
        DEFAULT_AGENCY,
      legalBasisLine:
        toText(form.caseDecision.legalBasisLine) ||
        generated.caseDecision.legalBasisLine,
    },
    accusedDecision: {
      ...form.accusedDecision,
      decisionCode:
        toText(form.accusedDecision.decisionCode) ||
        EMPTY_FORM.accusedDecision.decisionCode,
      decisionDate: normalizeDisplayDate(
        form.accusedDecision.decisionDate || form.accusedDecision.decisionDateText,
      ),
      decisionDateText: normalizeVietnameseDateLine(
        form.accusedDecision.decisionDateText || form.accusedDecision.decisionDate,
      ),
      agencyName:
        toText(form.accusedDecision.agencyName) ||
        toText(form.principal.investigationAuthorityName) ||
        DEFAULT_AGENCY,
      legalBasisLine:
        toText(form.accusedDecision.legalBasisLine) ||
        generated.accusedDecision.legalBasisLine,
    },
    principal: {
      accusedName: rawInputText(form.principal.accusedName),
      personName: rawInputText(form.principal.accusedName || form.principal.personName),
      investigationAuthorityName:
        toText(form.principal.investigationAuthorityName) || DEFAULT_AGENCY,
    },
    offense: {
      offenseName: rawInputText(form.offense.offenseName),
      legalArticle: toText(form.offense.legalArticle) || DEFAULT_LEGAL_ARTICLE,
    },
    measure: {
      ...form.measure,
      arrestOrderCode:
        toText(form.measure.arrestOrderCode) ||
        toText(form.measure.emergencyArrestOrderCode) ||
        toText(form.measure.detentionOrderCode) ||
        EMPTY_FORM.measure.arrestOrderCode,
      arrestOrderIssueDateText: normalizeVietnameseDateLine(
        form.measure.arrestOrderIssueDateText ||
          form.measure.emergencyArrestOrderIssueDateText ||
          form.measure.orderIssueDateText,
      ),
      detentionToDateText: normalizeVietnameseDateLine(form.measure.detentionToDateText),
      reasonLine:
        toText(form.measure.reasonLine) || generated.measure.reasonLine,
      article1Line:
        toText(form.measure.article1Line) || generated.measure.article1Line,
      detentionDurationLine:
        toText(form.measure.detentionDurationLine) ||
        generated.measure.detentionDurationLine,
      article2Line:
        toText(form.measure.article2Line) || generated.measure.article2Line,
    },
    recipients: {
      investigationUnitLine:
        toText(form.recipients.investigationUnitLine) ||
        generated.recipients.investigationUnitLine,
      personLine:
        toText(form.recipients.personLine) || generated.recipients.personLine,
      archiveLine: archiveLine(form.recipients.archiveLine),
    },
    signature: {
      signMode: toText(form.signature.signMode) || "KT. VIỆN TRƯỞNG",
      positionTitle: toText(form.signature.positionTitle) || "PHÓ VIỆN TRƯỞNG",
      signerName: toText(form.signature.signerName) || DEFAULT_SIGNER_NAME,
    },
  };
}

function regenerateFromMainFields(input: Bm037FormInputs): Bm037FormInputs {
  const form = hydrateMissingGeneratedLines(input);
  const generated = buildGeneratedLines(form);
  const isJuvenile = form.legalBasis.isJuvenile === "true";
  const issueDate = normalizeDisplayDate(form.document.issueDate);

  return {
    ...form,
    document: {
      ...form.document,
      issueDate,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form.agency.issuePlace, issueDate),
    },
    legalBasis: {
      ...form.legalBasis,
      isJuvenile: isJuvenile ? "true" : "false",
      juvenileLegalBasisLine: isJuvenile
        ? form.legalBasis.juvenileLegalBasisLine || DEFAULT_JUVENILE_LINE
        : "",
      juvenileJusticeLine: isJuvenile
        ? form.legalBasis.juvenileJusticeLine ||
          form.legalBasis.juvenileLegalBasisLine ||
          DEFAULT_JUVENILE_LINE
        : "",
      requestApprovalLine: generated.legalBasis.requestApprovalLine,
    },
    caseDecision: {
      ...form.caseDecision,
      legalBasisLine: generated.caseDecision.legalBasisLine,
    },
    accusedDecision: {
      ...form.accusedDecision,
      legalBasisLine: generated.accusedDecision.legalBasisLine,
    },
    measure: {
      ...form.measure,
      reasonLine: generated.measure.reasonLine,
      article1Line: generated.measure.article1Line,
      detentionDurationLine: generated.measure.detentionDurationLine,
      article2Line: generated.measure.article2Line,
    },
    recipients: generated.recipients,
  };
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm037FormInputs {
  const root = sourceRoot(payload);

  const existingJuvenileLine =
    pickText(root, "legalBasis.juvenileLegalBasisLine") ||
    pickText(root, "legalBasis.juvenileJusticeLine");

  const rawJuvenile = pickText(root, "legalBasis.isJuvenile").toLowerCase();

  const isJuvenile: "true" | "false" =
    rawJuvenile === "true" || rawJuvenile === "1" || rawJuvenile === "yes"
      ? "true"
      : rawJuvenile === "false" || rawJuvenile === "0" || rawJuvenile === "no"
        ? "false"
        : existingJuvenileLine
          ? "true"
          : "false";

  const issuePlace =
    pickText(root, "agency.issuePlace") || EMPTY_FORM.agency.issuePlace;

  const documentCode =
    pickText(
      root,
      "document.documentCodeLine",
      "document.documentCode",
      "document.documentNo",
      "document.fullDocumentCode",
    ) || EMPTY_FORM.document.documentCodeLine;

  const accusedName =
    pickText(
      root,
      "principal.accusedName",
      "principal.personName",
      "accused.fullName",
      "accused.name",
      "person.fullName",
      "person.name",
    ) ||
    stripRecipientLine(pickText(root, "recipients.personLine", "recipients.accusedLine")) ||
    DEFAULT_ACCUSED_NAME;

  const authority =
    pickText(
      root,
      "principal.investigationAuthorityName",
      "investigation.agencyName",
      "investigation.investigationUnitName",
    ) ||
    stripRecipientLine(pickText(root, "recipients.investigationUnitLine")) ||
    DEFAULT_AGENCY;

  const base: Bm037FormInputs = {
    agency: {
      parentName:
        pickText(root, "agency.parentName", "agency.parentNameUpper") ||
        EMPTY_FORM.agency.parentName,
      name:
        pickText(root, "agency.name", "agency.nameUpper") ||
        EMPTY_FORM.agency.name,
      issuePlace,
    },
    document: {
      documentCodeLine: documentCode,
      documentCode,
      documentNo: documentCode,
      fullDocumentCode: documentCode,
      issueDate: normalizeDisplayDate(
        pickText(root, "document.issueDate", "document.issueDateText", "document.issuePlaceAndDateLine"),
      ),
      issuePlaceAndDateLine:
        pickText(root, "document.issuePlaceAndDateLine") ||
        buildIssuePlaceAndDateLine(issuePlace, todayDisplayDate()),
    },
    legalBasis: {
      procedureArticlesLine:
        pickText(root, "legalBasis.procedureArticlesLine") ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      isJuvenile,
      juvenileLegalBasisLine:
        isJuvenile === "true"
          ? existingJuvenileLine || DEFAULT_JUVENILE_LINE
          : "",
      juvenileJusticeLine:
        isJuvenile === "true"
          ? existingJuvenileLine || DEFAULT_JUVENILE_LINE
          : "",
      requestApprovalLine: pickText(root, "legalBasis.requestApprovalLine"),
    },
    caseDecision: {
      decisionCode:
        pickText(root, "caseDecision.decisionCode", "caseDecision.decisionNo") ||
        EMPTY_FORM.caseDecision.decisionCode,
      decisionDate: normalizeDisplayDate(
        pickText(root, "caseDecision.decisionDate", "caseDecision.issueDate", "caseDecision.decisionDateText"),
      ),
      decisionDateText: normalizeVietnameseDateLine(
        pickText(root, "caseDecision.decisionDateText", "caseDecision.decisionDate", "caseDecision.issueDate"),
      ),
      agencyName:
        pickText(root, "caseDecision.agencyName", "caseDecision.issuedBy") ||
        authority,
      legalBasisLine:
        pickText(root, "caseDecision.legalBasisLine", "caseDecision.prosecutionDecisionLegalBasisLine"),
    },
    accusedDecision: {
      decisionCode:
        pickText(root, "accusedDecision.decisionCode", "accusedDecision.decisionNo") ||
        EMPTY_FORM.accusedDecision.decisionCode,
      decisionDate: normalizeDisplayDate(
        pickText(root, "accusedDecision.decisionDate", "accusedDecision.issueDate", "accusedDecision.decisionDateText"),
      ),
      decisionDateText: normalizeVietnameseDateLine(
        pickText(root, "accusedDecision.decisionDateText", "accusedDecision.decisionDate", "accusedDecision.issueDate"),
      ),
      agencyName:
        pickText(root, "accusedDecision.agencyName", "accusedDecision.issuedBy") ||
        authority,
      legalBasisLine:
        pickText(root, "accusedDecision.legalBasisLine", "accusedDecision.prosecutionDecisionLegalBasisLine"),
    },
    principal: {
      accusedName,
      personName: accusedName,
      investigationAuthorityName: authority,
    },
    offense: {
      offenseName:
        pickText(root, "offense.offenseName") || DEFAULT_OFFENSE_NAME,
      legalArticle:
        pickText(root, "offense.legalArticle") || DEFAULT_LEGAL_ARTICLE,
    },
    measure: {
      arrestOrderCode:
        pickText(
          root,
          "measure.arrestOrderCode",
          "measure.emergencyArrestOrderCode",
          "measure.detentionOrderCode",
          "measure.orderDocumentCode",
        ) || EMPTY_FORM.measure.arrestOrderCode,
      arrestOrderIssueDateText: normalizeVietnameseDateLine(
        pickText(
          root,
          "measure.arrestOrderIssueDateText",
          "measure.emergencyArrestOrderIssueDateText",
          "measure.detentionOrderIssueDateText",
          "measure.orderIssueDateText",
        ),
      ),
      detentionToDateText: normalizeVietnameseDateLine(
        pickText(root, "measure.detentionToDateText", "measure.toDateText"),
      ),
      reasonLine: pickText(root, "measure.reasonLine"),
      article1Line: pickText(root, "measure.article1Line"),
      detentionDurationLine: pickText(root, "measure.detentionDurationLine"),
      article2Line: pickText(root, "measure.article2Line"),
    },
    recipients: {
      investigationUnitLine: pickText(root, "recipients.investigationUnitLine"),
      personLine: pickText(root, "recipients.personLine", "recipients.accusedLine"),
      archiveLine: pickText(root, "recipients.archiveLine", EMPTY_FORM.recipients.archiveLine),
    },
    signature: {
      signMode: pickText(root, "signature.signMode") || EMPTY_FORM.signature.signMode,
      positionTitle:
        pickText(root, "signature.positionTitle") || EMPTY_FORM.signature.positionTitle,
      signerName: pickText(root, "signature.signerName") || DEFAULT_SIGNER_NAME,
    },
  };

  return hydrateMissingGeneratedLines(base);
}

function preserveUserEditedBodyFields(
  source: Bm037FormInputs,
  target: Bm037FormInputs,
): Bm037FormInputs {
  const sourceAny = source as unknown as Record<string, any>;
  const targetAny = target as unknown as Record<string, any>;

  const keep = (path: string) => {
    const parts = path.split(".");
    const section = parts[0];
    const field = parts[1];

    const sourceValue = sourceAny?.[section]?.[field];

    if (sourceValue !== undefined && sourceValue !== null) {
      targetAny[section] = {
        ...(targetAny[section] ?? {}),
        [field]: String(sourceValue),
      };
    }
  };

  // BODY TEXTAREAS: tuyệt đối giữ nội dung khách sửa tay.
  keep("legalBasis.requestApprovalLine");
  keep("caseDecision.legalBasisLine");
  keep("accusedDecision.legalBasisLine");
  keep("measure.reasonLine");
  keep("measure.article1Line");
  keep("measure.detentionDurationLine");
  keep("measure.article2Line");

  return targetAny as Bm037FormInputs;
}
function buildBm037SavePayload(form: Bm037FormInputs): Record<string, unknown> {
  const ready = preserveUserEditedBodyFields(form, hydrateMissingGeneratedLines(form));
  const isJuvenile = ready.legalBasis.isJuvenile === "true";
  const juvenileLine = isJuvenile
    ? ready.legalBasis.juvenileLegalBasisLine || DEFAULT_JUVENILE_LINE
    : BLANK_RENDER_LINE;

  const documentCode =
    ready.document.documentCodeLine ||
    ready.document.documentCode ||
    ready.document.documentNo ||
    ready.document.fullDocumentCode;

  const accusedName = toText(ready.principal.accusedName);
  const authority = toText(ready.principal.investigationAuthorityName);

  const legalBasis: TextRecord = {
    ...ready.legalBasis,
    isJuvenile: isJuvenile ? "true" : "false",
    juvenileLegalBasisLine: juvenileLine,
    juvenileJusticeLine: juvenileLine,
    juvenileLine,
    minorLegalBasisLine: juvenileLine,
    requestApprovalLine: toText(ready.legalBasis.requestApprovalLine),
  };

  const document: TextRecord = {
    ...ready.document,
    documentCodeLine: documentCode,
    documentCode,
    documentNo: documentCode,
    fullDocumentCode: documentCode,
    issueDate: normalizeDisplayDate(ready.document.issueDate),
    issueDateText: normalizeDisplayDate(ready.document.issueDate),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
      ready.agency.issuePlace,
      ready.document.issueDate,
    ),
  };

  const principal: TextRecord = {
    ...ready.principal,
    accusedName,
    personName: accusedName,
    fullName: accusedName,
    name: accusedName,
    investigationAuthorityName: authority,
  };

  const accused: TextRecord = {
    fullName: accusedName,
    name: accusedName,
    personName: accusedName,
    accusedName,
  };

  const person: TextRecord = {
    fullName: accusedName,
    name: accusedName,
    personName: accusedName,
    accusedName,
  };

  const measure: TextRecord = {
    ...ready.measure,
    arrestOrderCode: ready.measure.arrestOrderCode,
    emergencyArrestOrderCode: ready.measure.arrestOrderCode,
    detentionOrderCode: ready.measure.arrestOrderCode,
    orderDocumentCode: ready.measure.arrestOrderCode,
    arrestOrderIssueDateText: normalizeVietnameseDateLine(ready.measure.arrestOrderIssueDateText),
    emergencyArrestOrderIssueDateText: normalizeVietnameseDateLine(ready.measure.arrestOrderIssueDateText),
    detentionOrderIssueDateText: normalizeVietnameseDateLine(ready.measure.arrestOrderIssueDateText),
    orderIssueDateText: normalizeVietnameseDateLine(ready.measure.arrestOrderIssueDateText),
    detentionToDateText: normalizeVietnameseDateLine(ready.measure.detentionToDateText),
    reasonLine: toText(ready.measure.reasonLine),
    article1Line: toText(ready.measure.article1Line),
    detentionDurationLine: toText(ready.measure.detentionDurationLine),
    article2Line: toText(ready.measure.article2Line),
  };

  const recipients: TextRecord = {
    ...ready.recipients,
    investigationUnitLine: toText(ready.recipients.investigationUnitLine),
    personLine: toText(ready.recipients.personLine),
    accusedLine: toText(ready.recipients.personLine),
    archiveLine: archiveLine(ready.recipients.archiveLine),
  };

  return {
    ...ready,
    templateCode: "BM-037",
    template_code: "BM-037",
    code: "BM-037",
    agency: ready.agency,
    document,
    legalBasis,
    caseDecision: ready.caseDecision,
    accusedDecision: ready.accusedDecision,
    principal,
    accused,
    person,
    offense: ready.offense,
    measure,
    recipients,
    signature: ready.signature,
  };
}

async function getBm037RenderPayload(
  documentId: string | number,
): Promise<Record<string, unknown>> {
  // Ưu tiên endpoint detail vì endpoint này có renderPayloadSnapshot.formInputs,
  // tức dữ liệu khách đã sửa tay và đã save trong DB.
  try {
    const detailResponse = await fetch(
      `${API_BASE_URL}/documents/generated/${documentId}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    if (detailResponse.ok) {
      const detailPayload = (await detailResponse.json()) as Record<string, unknown>;

      const savedFormInputs =
        getNestedValue(detailPayload, "renderPayloadSnapshot.formInputs") ??
        getNestedValue(detailPayload, "render_payload_snapshot.formInputs") ??
        getNestedValue(detailPayload, "data.renderPayloadSnapshot.formInputs") ??
        getNestedValue(detailPayload, "data.render_payload_snapshot.formInputs");

      if (isRecord(savedFormInputs) && Object.keys(savedFormInputs).length > 0) {
        return detailPayload;
      }
    }
  } catch {
    // Fallback bên dưới.
  }

  // Fallback: render-payload chỉ dùng khi detail không trả snapshot.
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Không tải được dữ liệu BM-037. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}
async function saveBm037FormInputs(
  documentId: string | number,
  form: Bm037FormInputs,
): Promise<Bm037FormInputs> {
  const ready = preserveUserEditedBodyFields(form, hydrateMissingGeneratedLines(form));
  const savePayload = buildBm037SavePayload(ready);
  const signerName =
    pickDirect((savePayload.signature as TextRecord).signerName) || DEFAULT_SIGNER_NAME;

  const body = {
    ...savePayload,
    formInputs: savePayload,
    payloadOverrides: savePayload,
    renderPayloadOverrides: savePayload,
    renderPayloadSnapshot: {
      ...savePayload,
      formInputs: savePayload,
      payloadOverrides: savePayload,
      renderPayloadOverrides: savePayload,
    },
    metadata: {
      templateCode: "BM-037",
      template_code: "BM-037",
      code: "BM-037",
      formInputs: savePayload,
      payloadOverrides: savePayload,
      renderPayloadOverrides: savePayload,
    },
    updatedByName: signerName,
    renderedByName: signerName,
    convertedByName: signerName,
  };

  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");

    throw new Error(responseText || `Không lưu được dữ liệu BM-037. HTTP ${response.status}`);
  }

  await response.json().catch(() => null);

  return ready;
}

function DateSelectField({
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
  const parsed = parseDateParts(value);

  const dayOptions = Array.from({ length: 31 }, (_, index) => pad2(index + 1));
  const monthOptions = Array.from({ length: 12 }, (_, index) => pad2(index + 1));
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

    onChange(
      outputMode === "display"
        ? buildDisplayDate(next.day, next.month, next.year)
        : buildVietnameseDateLine(next.day, next.month, next.year),
    );
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </span>

      <div className="grid gap-2 md:grid-cols-3">
        <select
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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

function TextInput({
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
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
  rows = 3,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Bm037FormInputsPanel({
  documentId,
  onSaved,
}: Bm037FormInputsPanelProps) {
  const [form, setForm] = useState<Bm037FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const preview = useMemo(() => preserveUserEditedBodyFields(form, hydrateMissingGeneratedLines(form)), [form]);
  const currentSnapshot = useMemo(() => JSON.stringify(preview), [preview]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      if (
        item.section === "legalBasis" &&
        item.field === "juvenileLegalBasisLine" &&
        preview.legalBasis.isJuvenile !== "true"
      ) {
        return false;
      }

      return !getValue(preview, item.section, item.field).trim();
    });
  }, [preview]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getBm037RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(hydrateMissingGeneratedLines(nextForm)));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-037.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => {
      const next: Bm037FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };

      if (sectionKey === "principal" && field === "accusedName") {
        const regenerated = regenerateFromMainFields({
          ...next,
          principal: {
            ...next.principal,
            accusedName: value,
            personName: value,
          },
        });

        return {
          ...regenerated,
          principal: {
            ...regenerated.principal,
            accusedName: value,
            personName: value,
          },
        };
      }

      if (sectionKey === "offense" && field === "offenseName") {
        const regenerated = regenerateFromMainFields(next);

        return {
          ...regenerated,
          offense: {
            ...regenerated.offense,
            offenseName: value,
          },
        };
      }

      if (sectionKey === "legalBasis" && field === "isJuvenile") {
        next.legalBasis = {
          ...next.legalBasis,
          isJuvenile: value,
          juvenileLegalBasisLine:
            value === "true"
              ? next.legalBasis.juvenileLegalBasisLine || DEFAULT_JUVENILE_LINE
              : "",
          juvenileJusticeLine:
            value === "true"
              ? next.legalBasis.juvenileJusticeLine ||
                next.legalBasis.juvenileLegalBasisLine ||
                DEFAULT_JUVENILE_LINE
              : "",
        };

        return hydrateMissingGeneratedLines(next);
      }

      const shouldRegenerate =
        (sectionKey === "agency" && ["issuePlace"].includes(field)) ||
        (sectionKey === "document" && ["issueDate"].includes(field)) ||
        (sectionKey === "caseDecision" &&
          ["decisionCode", "decisionDate", "decisionDateText", "agencyName"].includes(field)) ||
        (sectionKey === "accusedDecision" &&
          ["decisionCode", "decisionDate", "decisionDateText", "agencyName"].includes(field)) ||
        (sectionKey === "principal" &&
          ["investigationAuthorityName"].includes(field)) ||
        (sectionKey === "offense" &&
          ["legalArticle"].includes(field)) ||
        (sectionKey === "measure" &&
          ["arrestOrderCode", "arrestOrderIssueDateText", "detentionToDateText"].includes(field));

      if (shouldRegenerate) {
        return regenerateFromMainFields(next);
      }

      if (sectionKey === "recipients" && field === "archiveLine") {
        next.recipients = {
          ...next.recipients,
          archiveLine: archiveLine(value),
        };
      }

      return next;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const savedForm = await saveBm037FormInputs(documentId, form);

      setForm(savedForm);
      setInitialSnapshot(JSON.stringify(preserveUserEditedBodyFields(savedForm, hydrateMissingGeneratedLines(savedForm))));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-037.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function fillCustomerSample() {
    const today = todayDisplayDate();
    const sample = regenerateFromMainFields({
      ...EMPTY_FORM,
      document: {
        ...EMPTY_FORM.document,
        issueDate: today,
        issuePlaceAndDateLine: buildIssuePlaceAndDateLine("TP. Hồ Chí Minh", today),
      },
      caseDecision: {
        ...EMPTY_FORM.caseDecision,
        decisionDate: today,
        decisionDateText: normalizeVietnameseDateLine(today),
      },
      accusedDecision: {
        ...EMPTY_FORM.accusedDecision,
        decisionDate: today,
        decisionDateText: normalizeVietnameseDateLine(today),
      },
      measure: {
        ...EMPTY_FORM.measure,
        arrestOrderIssueDateText: normalizeVietnameseDateLine(today),
        detentionToDateText: normalizeVietnameseDateLine(today),
      },
    });

    setForm(sample);
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-037...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-037" form={form} onApply={(next) => setForm(next as typeof form)} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-037
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu Quyết định phê chuẩn Lệnh bắt bị can để tạm giam
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Đã tách riêng tên bị can, tội danh, ngày tháng dropdown và lưu sâu các dòng body.
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
            <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
              {missingFields.map((item) => (
                <li key={`${item.section}.${item.field}`}>{item.label}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            disabled={isSaving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Điền dữ liệu mẫu BM-037
          </button>

          <button
            type="button"
            onClick={loadForm}
            disabled={isSaving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tải lại từ backend
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-037"}
          </button>
        </div>
      </section>

      <BmFormSection
        title="Preview nội dung trước khi in"
        description="Kiểm tra các dòng body sẽ render ra DOCX/PDF."
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-2">
          <table className="w-full border-collapse text-sm">
            <tbody className="divide-y divide-slate-200">
              {[
                ["Ngày ban hành", preview.document.issuePlaceAndDateLine],
                ["Căn cứ người chưa thành niên", preview.legalBasis.isJuvenile === "true" ? preview.legalBasis.juvenileLegalBasisLine : "Không áp dụng"],
                ["Căn cứ khởi tố vụ án", preview.caseDecision.legalBasisLine],
                ["Căn cứ khởi tố bị can", preview.accusedDecision.legalBasisLine],
                ["Xét hồ sơ đề nghị", preview.legalBasis.requestApprovalLine],
                ["Nhận thấy", preview.measure.reasonLine],
                ["Điều 1", preview.measure.article1Line],
                ["Thời hạn tạm giam", preview.measure.detentionDurationLine],
                ["Điều 2", preview.measure.article2Line],
              ].map(([label, value]) => (
                <tr key={label}>
                  <th className="w-72 bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                    {label}
                  </th>
                  <td className="px-4 py-3 leading-6 text-slate-900">
                    {value || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BmFormSection>

      <BmFormSection title="1. Cơ quan / thông tin quyết định">
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

        <BmFieldText
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value)}
          required
         />

        <div className="md:col-span-2">
          <DateSelectField
            label="Ngày ban hành"
            value={form.document.issueDate || todayDisplayDate()}
            outputMode="display"
            onChange={(value) => updateField("document", "issueDate", value)}
          />

          <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {preview.document.issuePlaceAndDateLine}
          </p>
        </div>
      </BmFormSection>

      <BmFormSection
        title="2. Ô nhập chính"
        description="Hai ô tên bị can và tội danh sẽ đồng bộ xuống toàn bộ body."
      >
        <BmFieldText
          label="Tên bị can"
          value={form.principal.accusedName}
          onChange={(value) => updateField("principal", "accusedName", value)}
          required
         />

        <BmFieldText
          label="Tên tội"
          value={form.offense.offenseName}
          onChange={(value) => updateField("offense", "offenseName", value)}
          required
         />

        <BmFieldText
          label="Điều khoản Bộ luật Hình sự"
          value={form.offense.legalArticle}
          onChange={(value) => updateField("offense", "legalArticle", value)}
          required
         />

        <BmFieldText
          label="Cơ quan/người ra Lệnh bắt"
          value={form.principal.investigationAuthorityName}
          onChange={(value) => updateField("principal", "investigationAuthorityName", value)}
          required
         />

        <BmFieldText
          label="Số Lệnh bắt bị can để tạm giam"
          value={form.measure.arrestOrderCode}
          onChange={(value) => updateField("measure", "arrestOrderCode", value)}
          required
         />

        <DateSelectField
          label="Ngày Lệnh bắt"
          value={form.measure.arrestOrderIssueDateText}
          outputMode="vietnameseLine"
          onChange={(value) => updateField("measure", "arrestOrderIssueDateText", value)}
        />
      </BmFormSection>

      <BmFormSection title="3. Căn cứ pháp lý">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
          <input
            type="checkbox"
            checked={form.legalBasis.isJuvenile === "true"}
            onChange={(event) =>
              updateField(
                "legalBasis",
                "isJuvenile",
                event.target.checked ? "true" : "false",
              )
            }
            className="h-4 w-4 rounded border-slate-300"
          />

          <span className="text-sm font-semibold text-slate-700">
            Có áp dụng căn cứ Luật Tư pháp người chưa thành niên
          </span>
        </label>

        {form.legalBasis.isJuvenile === "true" ? (
          <BmFieldTextarea
            label="Căn cứ Luật Tư pháp người chưa thành niên"
            value={form.legalBasis.juvenileLegalBasisLine}
            onChange={(value) =>
              updateField("legalBasis", "juvenileLegalBasisLine", value)
            }
            rows={2} fullWidth
           />
        ) : null}

        <BmFieldText
          label="Số quyết định khởi tố vụ án"
          value={form.caseDecision.decisionCode}
          onChange={(value) => updateField("caseDecision", "decisionCode", value)}
          required
         />

        <DateSelectField
          label="Ngày quyết định khởi tố vụ án"
          value={form.caseDecision.decisionDate || form.caseDecision.decisionDateText}
          outputMode="display"
          onChange={(value) => {
            updateField("caseDecision", "decisionDate", value);
          }}
        />

        <BmFieldText
          label="Cơ quan ra quyết định khởi tố vụ án"
          value={form.caseDecision.agencyName}
          onChange={(value) => updateField("caseDecision", "agencyName", value)}
          required
         />

        <BmFieldText
          label="Số quyết định khởi tố bị can"
          value={form.accusedDecision.decisionCode}
          onChange={(value) => updateField("accusedDecision", "decisionCode", value)}
          required
         />

        <DateSelectField
          label="Ngày quyết định khởi tố bị can"
          value={form.accusedDecision.decisionDate || form.accusedDecision.decisionDateText}
          outputMode="display"
          onChange={(value) => updateField("accusedDecision", "decisionDate", value)}
        />

        <BmFieldText
          label="Cơ quan ra quyết định khởi tố bị can"
          value={form.accusedDecision.agencyName}
          onChange={(value) => updateField("accusedDecision", "agencyName", value)}
          required
         />

        <BmFieldTextarea
          label="Căn cứ Quyết định khởi tố vụ án"
          value={form.caseDecision.legalBasisLine}
          onChange={(value) => updateField("caseDecision", "legalBasisLine", value)}
          required
          rows={4} fullWidth
         />

        <BmFieldTextarea
          label="Căn cứ Quyết định khởi tố bị can"
          value={form.accusedDecision.legalBasisLine}
          onChange={(value) => updateField("accusedDecision", "legalBasisLine", value)}
          required
          rows={4} fullWidth
         />

        <BmFieldTextarea
          label="Xét hồ sơ đề nghị"
          value={form.legalBasis.requestApprovalLine}
          onChange={(value) => updateField("legalBasis", "requestApprovalLine", value)}
          required
          rows={4} fullWidth
         />
      </BmFormSection>

      <BmFormSection title="4. Nội dung quyết định">
        <BmFieldTextarea
          label="Nhận thấy"
          value={form.measure.reasonLine}
          onChange={(value) => updateField("measure", "reasonLine", value)}
          required
          rows={3} fullWidth
         />

        <BmFieldTextarea
          label="Điều 1"
          value={form.measure.article1Line}
          onChange={(value) => updateField("measure", "article1Line", value)}
          required
          rows={4} fullWidth
         />

        <DateSelectField
          label="Ngày kết thúc thời hạn tạm giam"
          value={form.measure.detentionToDateText}
          outputMode="vietnameseLine"
          onChange={(value) => updateField("measure", "detentionToDateText", value)}
        />

        <BmFieldTextarea
          label="Thời hạn tạm giam"
          value={form.measure.detentionDurationLine}
          onChange={(value) => updateField("measure", "detentionDurationLine", value)}
          required
          rows={3} fullWidth
         />

        <BmFieldTextarea
          label="Điều 2"
          value={form.measure.article2Line}
          onChange={(value) => updateField("measure", "article2Line", value)}
          required
          rows={3} fullWidth
         />
      </BmFormSection>

      <BmFormSection title="5. Nơi nhận">
        <BmFieldText
          label="Cơ quan điều tra"
          value={form.recipients.investigationUnitLine}
          onChange={(value) => updateField("recipients", "investigationUnitLine", value)}
          required
         />

        <BmFieldText
          label="Bị can"
          value={form.recipients.personLine}
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

      <BmFormSection title="6. Chữ ký">
        <BmFieldSelect
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          options={SIGN_MODE_OPTIONS}
         />

        <BmFieldSelect
          label="Chức vụ"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          options={POSITION_OPTIONS}
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
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-037"}
          </button>
        </div>
      </div>
    </section>
  );
}