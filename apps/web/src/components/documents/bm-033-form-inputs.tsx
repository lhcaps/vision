"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_PERSON_NAME = '';
const DEFAULT_INVESTIGATION_AGENCY =
  "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";
const DEFAULT_SIGNER_NAME = '';
const DEFAULT_JUVENILE_LINE =
  "Căn cứ Điều 135 và Điều 137 của Luật Tư pháp người chưa thành niên;";
const BLANK_RENDER_LINE = "\u200C";

type TextRecord = Record<string, string>;

type SectionName =
  | "agency"
  | "document"
  | "person"
  | "investigation"
  | "legalBasis"
  | "custody"
  | "recipients"
  | "signature";

type Bm033FormInputs = {
  agency: {
    parentNameUpper: string;
    nameUpper: string;
    issuePlace: string;
  };
  document: {
    documentCode: string;
    issueDate: string;
    issuePlaceAndDateLine: string;
  };
  person: {
    fullName: string;
  };
  investigation: {
    agencyName: string;
  };
  legalBasis: {
    procedureArticlesLine: string;
    isJuvenile: string;
    juvenileJusticeLine: string;
  };
  custody: {
    extensionAttemptText: string;
    detentionDecisionCode: string;
    detentionDecisionDateText: string;
    previousExtensionDecisionCode: string;
    previousExtensionDecisionDateText: string;
    approvalProposalCode: string;
    approvalProposalDateText: string;
    detentionDecisionLine: string;
    previousExtensionDecisionLine: string;
    approvalProposalLine: string;
    approvalProposalAgencyLine: string;
    approvalReasonLine: string;
    approvalArticle1Line: string;
    executionRequestLine: string;
  };
  recipients: {
    executionAgencyLine: string;
    personLine: string;
    archiveLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
};

type RequiredField = {
  section: SectionName;
  field: string;
  label: string;
};

type Bm033FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
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

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/[\u200B-\u200D\uFEFF]/gu, "")
    .trim();
}

function rawInputText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/[\u200B-\u200D\uFEFF]/gu, "");
}
function pickText(...values: unknown[]): string {
  for (const value of values) {
    const nextValue = text(value);

    if (
      nextValue.length > 0 &&
      nextValue.toLowerCase() !== "null" &&
      nextValue.toLowerCase() !== "undefined"
    ) {
      return nextValue;
    }
  }

  return "";
}

function pickFromSource(source: unknown, ...paths: string[]): string {
  for (const path of paths) {
    const value = pickText(getNestedValue(source, path));

    if (value) {
      return value;
    }
  }

  return "";
}

function sourceRoot(payload: unknown): Record<string, unknown> {
  const candidates = [
    "formInputs",
    "payloadOverrides",
    "renderPayloadOverrides",
    "renderPayloadSnapshot.formInputs",
    "renderPayloadSnapshot.payloadOverrides",
    "renderPayloadSnapshot.renderPayloadOverrides",
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

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];

  return isRecord(value) ? value : {};
}

function stripListLine(value: unknown): string {
  return text(value)
    .replace(/^-+\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function recipientLine(value: string): string {
  const raw = stripListLine(value);

  return raw ? `- ${raw};` : "";
}

function archiveLine(value: string): string {
  const raw = stripListLine(value);

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
  const raw = text(value);

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
  const raw = text(value);

  if (!raw || raw.includes("...")) {
    return todayDisplayDate();
  }

  const parts = parseDateParts(raw);

  return buildDisplayDate(parts.day, parts.month, parts.year);
}

function normalizeVietnameseDateLine(value: string): string {
  const raw = text(value);

  if (!raw || raw.includes("...")) {
    const parts = parseDateParts(todayDisplayDate());

    return buildVietnameseDateLine(parts.day, parts.month, parts.year);
  }

  const parts = parseDateParts(raw);

  return buildVietnameseDateLine(parts.day, parts.month, parts.year);
}

function buildIssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const place = text(issuePlace) || "TP. Hồ Chí Minh";
  const parts = parseDateParts(issueDate || todayDisplayDate());

  return `${place}, ${buildVietnameseDateLine(parts.day, parts.month, parts.year)}`;
}

function getExtensionRoundOnly(extensionAttemptText: string): string {
  return (
    text(extensionAttemptText)
      .replace(/^lần\s+thứ\s+/iu, "")
      .replace(/^Lần\s+thứ\s+/u, "")
      .trim() || "nhất"
  );
}

function normalizeExecutionRequestLine(value: string): string {
  const raw = text(value);

  if (!raw) {
    return raw;
  }

  return raw
    .replace(/(?:\/\.){2,}$/u, "/.")
    .replace(/\.\s*\/\.\s*\/\.?$/u, "./.")
    .replace(/\.\/\.\/\.$/u, "./.");
}

function getValue(
  form: Bm033FormInputs,
  sectionName: SectionName,
  fieldName: string,
): string {
  const group = form[sectionName] as Record<string, string>;

  return group[fieldName] ?? "";
}

const EMPTY_FORM: Bm033FormInputs = {
  agency: {
    parentNameUpper: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    nameUpper: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "33/QĐ-VKSKV7",
    issueDate: todayDisplayDate(),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine("TP. Hồ Chí Minh", todayDisplayDate()),
  },
  person: {
    fullName: DEFAULT_PERSON_NAME,
  },
  investigation: {
    agencyName: DEFAULT_INVESTIGATION_AGENCY,
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 90 và 106 của Bộ luật Tố tụng hình sự;",
    isJuvenile: "false",
    juvenileJusticeLine: "",
  },
  custody: {
    extensionAttemptText: "Lần thứ nhất",
    detentionDecisionCode: "12/QĐ-TG",
    detentionDecisionDateText: normalizeVietnameseDateLine(todayDisplayDate()),
    previousExtensionDecisionCode: "13/QĐ-CSĐT",
    previousExtensionDecisionDateText: normalizeVietnameseDateLine(todayDisplayDate()),
    approvalProposalCode: "14/QĐ-CSĐT",
    approvalProposalDateText: normalizeVietnameseDateLine(todayDisplayDate()),
    detentionDecisionLine: "",
    previousExtensionDecisionLine: "",
    approvalProposalLine: "",
    approvalProposalAgencyLine: "",
    approvalReasonLine: "",
    approvalArticle1Line: "",
    executionRequestLine: "",
  },
  recipients: {
    executionAgencyLine: "",
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
  { section: "agency", field: "parentNameUpper", label: "Cơ quan cấp trên" },
  { section: "agency", field: "nameUpper", label: "Viện kiểm sát ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  {
    section: "document",
    field: "issuePlaceAndDateLine",
    label: "Dòng địa danh, ngày ban hành",
  },
  { section: "person", field: "fullName", label: "Họ tên người bị tạm giữ" },
  {
    section: "investigation",
    field: "agencyName",
    label: "Cơ quan ra quyết định / đề nghị",
  },
  { section: "legalBasis", field: "procedureArticlesLine", label: "Căn cứ BLTTHS" },
  {
    section: "legalBasis",
    field: "juvenileJusticeLine",
    label: "Căn cứ Luật Tư pháp người chưa thành niên",
  },
  { section: "custody", field: "extensionAttemptText", label: "Lần gia hạn" },
  { section: "custody", field: "detentionDecisionCode", label: "Số quyết định tạm giữ" },
  {
    section: "custody",
    field: "detentionDecisionDateText",
    label: "Ngày quyết định tạm giữ",
  },
  {
    section: "custody",
    field: "previousExtensionDecisionCode",
    label: "Số quyết định gia hạn trước đó",
  },
  {
    section: "custody",
    field: "previousExtensionDecisionDateText",
    label: "Ngày quyết định gia hạn trước đó",
  },
  {
    section: "custody",
    field: "approvalProposalCode",
    label: "Số hồ sơ/văn bản đề nghị phê chuẩn",
  },
  {
    section: "custody",
    field: "approvalProposalDateText",
    label: "Ngày hồ sơ/văn bản đề nghị phê chuẩn",
  },
  { section: "custody", field: "detentionDecisionLine", label: "Căn cứ quyết định tạm giữ" },
  {
    section: "custody",
    field: "previousExtensionDecisionLine",
    label: "Căn cứ gia hạn tạm giữ trước đó",
  },
  { section: "custody", field: "approvalProposalLine", label: "Xét hồ sơ đề nghị" },
  {
    section: "custody",
    field: "approvalProposalAgencyLine",
    label: "Cơ quan đề nghị và người bị tạm giữ",
  },
  { section: "custody", field: "approvalReasonLine", label: "Nhận thấy" },
  { section: "custody", field: "approvalArticle1Line", label: "Điều 1" },
  { section: "custody", field: "executionRequestLine", label: "Điều 2" },
  { section: "recipients", field: "executionAgencyLine", label: "Nơi nhận - cơ quan thực hiện" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - người bị tạm giữ" },
  { section: "recipients", field: "archiveLine", label: "Nơi nhận - lưu" },
  { section: "signature", field: "signMode", label: "Chế độ ký" },
  { section: "signature", field: "positionTitle", label: "Chức danh" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

function buildGeneratedLines(form: Bm033FormInputs): {
  document: Pick<Bm033FormInputs["document"], "issuePlaceAndDateLine">;
  custody: Pick<
    Bm033FormInputs["custody"],
    | "detentionDecisionLine"
    | "previousExtensionDecisionLine"
    | "approvalProposalLine"
    | "approvalProposalAgencyLine"
    | "approvalReasonLine"
    | "approvalArticle1Line"
    | "executionRequestLine"
  >;
  recipients: Bm033FormInputs["recipients"];
} {
  const personName = text(form.person.fullName) || "...";
  const investigationAgency =
    text(form.investigation.agencyName) || DEFAULT_INVESTIGATION_AGENCY;

  const extensionAttemptText = text(form.custody.extensionAttemptText) || "Lần thứ nhất";
  const extensionRoundOnly = getExtensionRoundOnly(extensionAttemptText);

  const detentionDecisionCode =
    text(form.custody.detentionDecisionCode) || "12/QĐ-TG";
  const detentionDecisionDateText = normalizeVietnameseDateLine(
    form.custody.detentionDecisionDateText || form.document.issueDate,
  );

  const previousExtensionDecisionCode =
    text(form.custody.previousExtensionDecisionCode) || "13/QĐ-CSĐT";
  const previousExtensionDecisionDateText = normalizeVietnameseDateLine(
    form.custody.previousExtensionDecisionDateText || form.document.issueDate,
  );

  const approvalProposalCode =
    text(form.custody.approvalProposalCode) || "14/QĐ-CSĐT";
  const approvalProposalDateText = normalizeVietnameseDateLine(
    form.custody.approvalProposalDateText || form.document.issueDate,
  );

  return {
    document: {
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
        form.agency.issuePlace,
        form.document.issueDate,
      ),
    },
    custody: {
      detentionDecisionLine:
        `Căn cứ Quyết định tạm giữ số ${detentionDecisionCode} ${detentionDecisionDateText} của ${investigationAgency};`,
      previousExtensionDecisionLine:
        `và Quyết định gia hạn tạm giữ lần thứ ${extensionRoundOnly} số ${previousExtensionDecisionCode} ${previousExtensionDecisionDateText} của ${investigationAgency} (nếu có);`,
      approvalProposalLine:
        `Xét hồ sơ đề nghị phê chuẩn Quyết định gia hạn tạm giữ lần thứ ${extensionRoundOnly} số ${approvalProposalCode} ${approvalProposalDateText}`,
      approvalProposalAgencyLine:
        `của ${investigationAgency} đối với ${personName};`,
      approvalReasonLine:
        `Nhận thấy việc gia hạn tạm giữ đối với ${personName} là có căn cứ, đúng thẩm quyền và cần thiết cho việc xác minh, điều tra vụ án,`,
      approvalArticle1Line:
        `Phê chuẩn Quyết định gia hạn tạm giữ lần thứ ${extensionRoundOnly} số ${approvalProposalCode} ${approvalProposalDateText} của ${investigationAgency} đối với ${personName}.`,
      executionRequestLine:
        `Yêu cầu ${investigationAgency} thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự./.`,
    },
    recipients: {
      executionAgencyLine: recipientLine(investigationAgency),
      personLine: recipientLine(personName),
      archiveLine: archiveLine(form.recipients.archiveLine),
    },
  };
}

function hydrateMissingGeneratedLines(input: Bm033FormInputs): Bm033FormInputs {
  const form: Bm033FormInputs = JSON.parse(JSON.stringify(input)) as Bm033FormInputs;
  const generated = buildGeneratedLines(form);
  const isJuvenile = form.legalBasis.isJuvenile === "true";

  return {
    ...form,
    agency: {
      parentNameUpper:
        text(form.agency.parentNameUpper) || EMPTY_FORM.agency.parentNameUpper,
      nameUpper: text(form.agency.nameUpper) || EMPTY_FORM.agency.nameUpper,
      issuePlace: text(form.agency.issuePlace) || EMPTY_FORM.agency.issuePlace,
    },
    document: {
      ...form.document,
      documentCode: text(form.document.documentCode) || EMPTY_FORM.document.documentCode,
      issueDate: normalizeDisplayDate(form.document.issueDate),
      issuePlaceAndDateLine:
        text(form.document.issuePlaceAndDateLine) ||
        generated.document.issuePlaceAndDateLine,
    },
    person: {
      fullName: rawInputText(form.person.fullName),
    },
    investigation: {
      agencyName: text(form.investigation.agencyName) || DEFAULT_INVESTIGATION_AGENCY,
    },
    legalBasis: {
      procedureArticlesLine:
        text(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      isJuvenile: isJuvenile ? "true" : "false",
      juvenileJusticeLine: isJuvenile
        ? text(form.legalBasis.juvenileJusticeLine) || DEFAULT_JUVENILE_LINE
        : "",
    },
    custody: {
      extensionAttemptText:
        text(form.custody.extensionAttemptText) || EMPTY_FORM.custody.extensionAttemptText,
      detentionDecisionCode:
        text(form.custody.detentionDecisionCode) ||
        EMPTY_FORM.custody.detentionDecisionCode,
      detentionDecisionDateText: normalizeVietnameseDateLine(
        form.custody.detentionDecisionDateText || form.document.issueDate,
      ),
      previousExtensionDecisionCode:
        text(form.custody.previousExtensionDecisionCode) ||
        EMPTY_FORM.custody.previousExtensionDecisionCode,
      previousExtensionDecisionDateText: normalizeVietnameseDateLine(
        form.custody.previousExtensionDecisionDateText || form.document.issueDate,
      ),
      approvalProposalCode:
        text(form.custody.approvalProposalCode) ||
        EMPTY_FORM.custody.approvalProposalCode,
      approvalProposalDateText: normalizeVietnameseDateLine(
        form.custody.approvalProposalDateText || form.document.issueDate,
      ),
      detentionDecisionLine:
        text(form.custody.detentionDecisionLine) ||
        generated.custody.detentionDecisionLine,
      previousExtensionDecisionLine:
        text(form.custody.previousExtensionDecisionLine) ||
        generated.custody.previousExtensionDecisionLine,
      approvalProposalLine:
        text(form.custody.approvalProposalLine) ||
        generated.custody.approvalProposalLine,
      approvalProposalAgencyLine:
        text(form.custody.approvalProposalAgencyLine) ||
        generated.custody.approvalProposalAgencyLine,
      approvalReasonLine:
        text(form.custody.approvalReasonLine) ||
        generated.custody.approvalReasonLine,
      approvalArticle1Line:
        text(form.custody.approvalArticle1Line) ||
        generated.custody.approvalArticle1Line,
      executionRequestLine: normalizeExecutionRequestLine(
        text(form.custody.executionRequestLine) ||
          generated.custody.executionRequestLine,
      ),
    },
    recipients: {
      executionAgencyLine:
        text(form.recipients.executionAgencyLine) ||
        generated.recipients.executionAgencyLine,
      personLine:
        text(form.recipients.personLine) || generated.recipients.personLine,
      archiveLine: archiveLine(form.recipients.archiveLine),
    },
    signature: {
      signMode: text(form.signature.signMode) || "KT. VIỆN TRƯỞNG",
      positionTitle: text(form.signature.positionTitle) || "PHÓ VIỆN TRƯỞNG",
      signerName: text(form.signature.signerName) || DEFAULT_SIGNER_NAME,
    },
  };
}

function regenerateFromMainFields(input: Bm033FormInputs): Bm033FormInputs {
  const form = hydrateMissingGeneratedLines(input);
  const generated = buildGeneratedLines(form);
  const isJuvenile = form.legalBasis.isJuvenile === "true";

  return {
    ...form,
    document: {
      ...form.document,
      issueDate: normalizeDisplayDate(form.document.issueDate),
      issuePlaceAndDateLine: generated.document.issuePlaceAndDateLine,
    },
    legalBasis: {
      ...form.legalBasis,
      isJuvenile: isJuvenile ? "true" : "false",
      juvenileJusticeLine: isJuvenile
        ? form.legalBasis.juvenileJusticeLine || DEFAULT_JUVENILE_LINE
        : "",
    },
    custody: {
      ...form.custody,
      detentionDecisionDateText: normalizeVietnameseDateLine(
        form.custody.detentionDecisionDateText || form.document.issueDate,
      ),
      previousExtensionDecisionDateText: normalizeVietnameseDateLine(
        form.custody.previousExtensionDecisionDateText || form.document.issueDate,
      ),
      approvalProposalDateText: normalizeVietnameseDateLine(
        form.custody.approvalProposalDateText || form.document.issueDate,
      ),
      detentionDecisionLine: generated.custody.detentionDecisionLine,
      previousExtensionDecisionLine: generated.custody.previousExtensionDecisionLine,
      approvalProposalLine: generated.custody.approvalProposalLine,
      approvalProposalAgencyLine: generated.custody.approvalProposalAgencyLine,
      approvalReasonLine: generated.custody.approvalReasonLine,
      approvalArticle1Line: generated.custody.approvalArticle1Line,
      executionRequestLine: generated.custody.executionRequestLine,
    },
    recipients: generated.recipients,
  };
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm033FormInputs {
  const root = sourceRoot(payload);

  const agency = section(root, "agency");
  const document = section(root, "document");
  const person = section(root, "person");
  const investigation = section(root, "investigation");
  const legalBasis = section(root, "legalBasis");
  const custody = section(root, "custody");
  const recipients = section(root, "recipients");
  const signature = section(root, "signature");

  const rawJuvenile = pickText(legalBasis.isJuvenile);
  const rawJuvenileNormalized = rawJuvenile.toLowerCase();

  const existingJuvenileLine = pickText(
    legalBasis.juvenileJusticeLine,
    legalBasis.juvenileLegalBasisLine,
  );

  const isJuvenile: "true" | "false" =
    rawJuvenileNormalized === "true" ||
    rawJuvenileNormalized === "1" ||
    rawJuvenileNormalized === "yes"
      ? "true"
      : rawJuvenileNormalized === "false" ||
          rawJuvenileNormalized === "0" ||
          rawJuvenileNormalized === "no"
        ? "false"
        : existingJuvenileLine
          ? "true"
          : "false";

  const baseForm: Bm033FormInputs = {
    agency: {
      parentNameUpper:
        pickText(agency.parentNameUpper, agency.parentName) ||
        EMPTY_FORM.agency.parentNameUpper,
      nameUpper:
        pickText(agency.nameUpper, agency.name) || EMPTY_FORM.agency.nameUpper,
      issuePlace: pickText(agency.issuePlace) || EMPTY_FORM.agency.issuePlace,
    },
    document: {
      documentCode:
        pickText(document.documentCode, document.documentNo, document.fullDocumentCode) ||
        EMPTY_FORM.document.documentCode,
      issueDate: normalizeDisplayDate(
        pickText(document.issueDate, document.issueDateText, document.issuePlaceAndDateLine),
      ),
      issuePlaceAndDateLine: pickText(document.issuePlaceAndDateLine),
    },
    person: {
      fullName:
        pickText(
          person.fullName,
          person.personName,
          pickFromSource(root, "principal.personName", "target.personName"),
        ) || DEFAULT_PERSON_NAME,
    },
    investigation: {
      agencyName:
        pickText(
          investigation.agencyName,
          investigation.investigationUnitName,
          stripListLine(recipients.executionAgencyLine),
          stripListLine(recipients.investigationUnitLine),
        ) || DEFAULT_INVESTIGATION_AGENCY,
    },
    legalBasis: {
      procedureArticlesLine:
        pickText(legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      isJuvenile,
      juvenileJusticeLine:
        isJuvenile === "true"
          ? existingJuvenileLine || DEFAULT_JUVENILE_LINE
          : "",
    },
    custody: {
      extensionAttemptText:
        pickText(custody.extensionAttemptText) ||
        EMPTY_FORM.custody.extensionAttemptText,
      detentionDecisionCode:
        pickText(custody.detentionDecisionCode) ||
        EMPTY_FORM.custody.detentionDecisionCode,
      detentionDecisionDateText: normalizeVietnameseDateLine(
        pickText(custody.detentionDecisionDateText) ||
          EMPTY_FORM.custody.detentionDecisionDateText,
      ),
      previousExtensionDecisionCode:
        pickText(custody.previousExtensionDecisionCode) ||
        EMPTY_FORM.custody.previousExtensionDecisionCode,
      previousExtensionDecisionDateText: normalizeVietnameseDateLine(
        pickText(custody.previousExtensionDecisionDateText) ||
          EMPTY_FORM.custody.previousExtensionDecisionDateText,
      ),
      approvalProposalCode:
        pickText(custody.approvalProposalCode) ||
        EMPTY_FORM.custody.approvalProposalCode,
      approvalProposalDateText: normalizeVietnameseDateLine(
        pickText(custody.approvalProposalDateText) ||
          EMPTY_FORM.custody.approvalProposalDateText,
      ),
      detentionDecisionLine: pickText(custody.detentionDecisionLine),
      previousExtensionDecisionLine: pickText(custody.previousExtensionDecisionLine),
      approvalProposalLine: pickText(custody.approvalProposalLine),
      approvalProposalAgencyLine: pickText(custody.approvalProposalAgencyLine),
      approvalReasonLine: pickText(custody.approvalReasonLine),
      approvalArticle1Line: pickText(custody.approvalArticle1Line),
      executionRequestLine: normalizeExecutionRequestLine(
        pickText(custody.executionRequestLine),
      ),
    },
    recipients: {
      executionAgencyLine: pickText(recipients.executionAgencyLine),
      personLine: pickText(recipients.personLine),
      archiveLine: pickText(recipients.archiveLine, EMPTY_FORM.recipients.archiveLine),
    },
    signature: {
      signMode: pickText(signature.signMode) || EMPTY_FORM.signature.signMode,
      positionTitle:
        pickText(signature.positionTitle) || EMPTY_FORM.signature.positionTitle,
      signerName: pickText(signature.signerName) || DEFAULT_SIGNER_NAME,
    },
  };

  return hydrateMissingGeneratedLines(baseForm);
}

function buildIssuingAuthorityLine(form: Bm033FormInputs): string {
  return `VIỆN TRƯỞNG ${text(form.agency.nameUpper) || EMPTY_FORM.agency.nameUpper}`;
}

function prepareBm033Form(form: Bm033FormInputs): Bm033FormInputs {
  return hydrateMissingGeneratedLines(form);
}

function buildBm033RenderData(form: Bm033FormInputs): Record<string, unknown> {
  const ready = prepareBm033Form(form);
  const isJuvenile = ready.legalBasis.isJuvenile === "true";

  const juvenileLine = isJuvenile
    ? ready.legalBasis.juvenileJusticeLine || DEFAULT_JUVENILE_LINE
    : BLANK_RENDER_LINE;

  const normalizedReady: Bm033FormInputs = {
    ...ready,
    legalBasis: {
      ...ready.legalBasis,
      isJuvenile: isJuvenile ? "true" : "false",
      juvenileJusticeLine: juvenileLine,
    },
  };

  return {
    ...normalizedReady,
    templateCode: "BM-033",
    template_code: "BM-033",
    code: "BM-033",
    official: {
      issuingAuthorityLine: buildIssuingAuthorityLine(normalizedReady),
    },
    agency: {
      ...normalizedReady.agency,
      parentName: normalizedReady.agency.parentNameUpper,
      name: normalizedReady.agency.nameUpper,
    },
    legalBasis: {
      ...normalizedReady.legalBasis,
      isJuvenile: isJuvenile ? "true" : "false",
      juvenileJusticeLine: juvenileLine,
      juvenileLegalBasisLine: juvenileLine,
      juvenileLine: juvenileLine,
      minorLegalBasisLine: juvenileLine,
    },
    document: {
      ...normalizedReady.document,
      documentNo: normalizedReady.document.documentCode,
      fullDocumentCode: normalizedReady.document.documentCode,
      issueDateText: normalizedReady.document.issueDate,
    },
  };
}

async function getBm033RenderPayload(
  documentId: string | number,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Không tải được render-payload BM-033. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm033FormInputs(
  documentId: string | number,
  form: Bm033FormInputs,
): Promise<Bm033FormInputs> {
  const ready = prepareBm033Form(form);
  const savePayload = buildBm033RenderData(ready);
  const updatedByName =
    text(ready.signature.signerName) || DEFAULT_SIGNER_NAME;

  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ...savePayload,
        formInputs: savePayload,
        payloadOverrides: savePayload,
        renderPayloadOverrides: savePayload,
        metadata: {
          templateCode: "BM-033",
          template_code: "BM-033",
          code: "BM-033",
          formInputs: savePayload,
          payloadOverrides: savePayload,
          renderPayloadOverrides: savePayload,
        },
        updatedByName,
        renderedByName: updatedByName,
        convertedByName: updatedByName,
      }),
    },
  );

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");

    throw new Error(responseText || `Không lưu được dữ liệu BM-033. HTTP ${response.status}`);
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
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function Bm033FormInputsPanel({
  documentId,
  onSaved,
}: Bm033FormInputsPanelProps) {
  const [form, setForm] = useState<Bm033FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const preview = useMemo(() => prepareBm033Form(form), [form]);
  const currentSnapshot = useMemo(() => JSON.stringify(preview), [preview]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      if (
        item.section === "legalBasis" &&
        item.field === "juvenileJusticeLine" &&
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
    setSuccessMessage("");

    try {
      const payload = await getBm033RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(prepareBm033Form(nextForm)));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không tải được dữ liệu BM-033.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField<TSection extends SectionName>(
    sectionName: TSection,
    fieldName: keyof Bm033FormInputs[TSection],
    value: string,
  ) {
    setForm((current) => {
      const next: Bm033FormInputs = {
        ...current,
        [sectionName]: {
          ...current[sectionName],
          [fieldName]: value,
        },
      };

      if (sectionName === "legalBasis" && fieldName === "isJuvenile") {
        next.legalBasis = {
          ...next.legalBasis,
          isJuvenile: value,
          juvenileJusticeLine:
            value === "true"
              ? next.legalBasis.juvenileJusticeLine || DEFAULT_JUVENILE_LINE
              : "",
        };

        return hydrateMissingGeneratedLines(next);
      }

      if (sectionName === "person" && String(fieldName) === "fullName") {
        const regenerated = regenerateFromMainFields(next);

        return {
          ...regenerated,
          person: {
            ...regenerated.person,
            fullName: value,
          },
        };
      }
      const shouldRegenerate =
        (sectionName === "agency" && fieldName === "issuePlace") ||
        (sectionName === "document" && fieldName === "issueDate") ||
        (sectionName === "investigation" && fieldName === "agencyName") ||
        (sectionName === "custody" &&
          [
            "extensionAttemptText",
            "detentionDecisionCode",
            "detentionDecisionDateText",
            "previousExtensionDecisionCode",
            "previousExtensionDecisionDateText",
            "approvalProposalCode",
            "approvalProposalDateText",
          ].includes(String(fieldName)));

      if (shouldRegenerate) {
        return regenerateFromMainFields(next);
      }

      if (sectionName === "recipients" && fieldName === "archiveLine") {
        next.recipients = {
          ...next.recipients,
          archiveLine: archiveLine(value),
        };
      }

      return next;
    });
  }

  function fillCustomerSample() {
    const sample = regenerateFromMainFields({
      ...EMPTY_FORM,
      document: {
        ...EMPTY_FORM.document,
        issueDate: todayDisplayDate(),
      },
      custody: {
        ...EMPTY_FORM.custody,
        detentionDecisionDateText: normalizeVietnameseDateLine(todayDisplayDate()),
        previousExtensionDecisionDateText: normalizeVietnameseDateLine(todayDisplayDate()),
        approvalProposalDateText: normalizeVietnameseDateLine(todayDisplayDate()),
      },
      legalBasis: {
        ...EMPTY_FORM.legalBasis,
        isJuvenile: "false",
        juvenileJusticeLine: "",
      },
    });

    setForm(sample);
    setSuccessMessage("Đã điền dữ liệu mẫu BM-033. Bấm lưu để ghi vào backend.");
    setErrorMessage("");
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const savedForm = await saveBm033FormInputs(documentId, form);

      setForm(savedForm);
      setInitialSnapshot(JSON.stringify(savedForm));
      setSavedAt(new Date());
      setSuccessMessage("Đã lưu dữ liệu BM-033. Có thể render lại DOCX/PDF.");
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không lưu được dữ liệu BM-033.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu BM-033...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-033
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu Quyết định phê chuẩn Quyết định gia hạn tạm giữ
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Form đã sắp lại theo flow mẫu gốc. Ngày dùng dropdown Ngày - Tháng - Năm,
              căn cứ người chưa thành niên chỉ hiện khi tick, và có preview nội dung
              trước khi in.
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

        {successMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
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
            Điền dữ liệu mẫu BM-033
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
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-033"}
          </button>
        </div>
      </section>

      <SectionCard
        title="Preview nội dung trước khi in"
        description="Kiểm tra đúng thứ tự các dòng sẽ render ra DOCX/PDF."
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-2">
          <table className="w-full border-collapse text-sm">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <th className="w-72 bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Header ngày ban hành
                </th>
                <td className="px-4 py-3 text-slate-900">
                  {preview.document.issuePlaceAndDateLine || "—"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Chủ thể ban hành
                </th>
                <td className="px-4 py-3 text-slate-900">
                  {buildIssuingAuthorityLine(preview)}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Căn cứ BLTTHS
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.legalBasis.procedureArticlesLine || "—"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Căn cứ người chưa thành niên
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.legalBasis.isJuvenile === "true"
                    ? preview.legalBasis.juvenileJusticeLine || DEFAULT_JUVENILE_LINE
                    : "Không áp dụng"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Căn cứ quyết định
                </th>
                <td className="space-y-1 px-4 py-3 leading-6 text-slate-900">
                  <p>{preview.custody.detentionDecisionLine || "—"}</p>
                  <p>{preview.custody.previousExtensionDecisionLine || "—"}</p>
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Xét hồ sơ đề nghị
                </th>
                <td className="space-y-1 px-4 py-3 leading-6 text-slate-900">
                  <p>{preview.custody.approvalProposalLine || "—"}</p>
                  <p>{preview.custody.approvalProposalAgencyLine || "—"}</p>
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Nhận thấy
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.custody.approvalReasonLine || "—"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  QUYẾT ĐỊNH
                </th>
                <td className="space-y-2 px-4 py-3 leading-6 text-slate-900">
                  <p>
                    <strong>Điều 1.</strong> {preview.custody.approvalArticle1Line || "—"}
                  </p>
                  <p>
                    <strong>Điều 2.</strong> {preview.custody.executionRequestLine || "—"}
                  </p>
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Nơi nhận
                </th>
                <td className="space-y-1 px-4 py-3 leading-6 text-slate-900">
                  {[preview.recipients.executionAgencyLine, preview.recipients.personLine, preview.recipients.archiveLine]
                    .filter(Boolean)
                    .map((line, index) => (
                      <p key={`${index}-${line}`}>{line}</p>
                    ))}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Chữ ký
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  <p>{preview.signature.signMode || "—"}</p>
                  <p>{preview.signature.positionTitle || "—"}</p>
                  <p className="font-bold">{preview.signature.signerName || "—"}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="1. Cơ quan / thông tin quyết định">
        <TextInput
          label="Cơ quan cấp trên"
          value={form.agency.parentNameUpper}
          onChange={(value) => updateField("agency", "parentNameUpper", value)}
          required
        />

        <TextInput
          label="Viện kiểm sát ban hành"
          value={form.agency.nameUpper}
          onChange={(value) => updateField("agency", "nameUpper", value)}
          required
        />

        <TextInput
          label="Số quyết định"
          value={form.document.documentCode}
          onChange={(value) => updateField("document", "documentCode", value)}
          required
        />

        <TextInput
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value)}
          required
        />

        <div>
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

        <TextInput
          label="Lần gia hạn"
          value={form.custody.extensionAttemptText}
          onChange={(value) => updateField("custody", "extensionAttemptText", value)}
          required
        />
      </SectionCard>

      <SectionCard
        title="2. Dữ liệu chính"
        description="Các ô này tự sinh lại căn cứ, xét hồ sơ, nhận thấy, Điều 1, Điều 2 và nơi nhận."
      >
        <TextInput
          label="Họ tên người bị tạm giữ"
          value={form.person.fullName}
          onChange={(value) => updateField("person", "fullName", value)}
          required
        />

        <TextInput
          label="Cơ quan ra quyết định / cơ quan đề nghị"
          value={form.investigation.agencyName}
          onChange={(value) => updateField("investigation", "agencyName", value)}
          required
        />

        <TextInput
          label="Số quyết định tạm giữ"
          value={form.custody.detentionDecisionCode}
          onChange={(value) => updateField("custody", "detentionDecisionCode", value)}
          required
        />

        <DateSelectField
          label="Ngày quyết định tạm giữ"
          value={form.custody.detentionDecisionDateText}
          outputMode="vietnameseLine"
          onChange={(value) => updateField("custody", "detentionDecisionDateText", value)}
        />

        <TextInput
          label="Số quyết định gia hạn trước đó"
          value={form.custody.previousExtensionDecisionCode}
          onChange={(value) =>
            updateField("custody", "previousExtensionDecisionCode", value)
          }
          required
        />

        <DateSelectField
          label="Ngày quyết định gia hạn trước đó"
          value={form.custody.previousExtensionDecisionDateText}
          outputMode="vietnameseLine"
          onChange={(value) =>
            updateField("custody", "previousExtensionDecisionDateText", value)
          }
        />

        <TextInput
          label="Số hồ sơ/văn bản đề nghị phê chuẩn"
          value={form.custody.approvalProposalCode}
          onChange={(value) => updateField("custody", "approvalProposalCode", value)}
          required
        />

        <DateSelectField
          label="Ngày hồ sơ/văn bản đề nghị phê chuẩn"
          value={form.custody.approvalProposalDateText}
          outputMode="vietnameseLine"
          onChange={(value) => updateField("custody", "approvalProposalDateText", value)}
        />
      </SectionCard>

      <SectionCard
        title="3. Căn cứ và nội dung quyết định"
        description="Có thể chỉnh tay các dòng dài. Chỉ khi sửa ô nhập chính ở trên thì hệ thống mới tự sinh lại các dòng này."
      >
        <TextArea
          label="Căn cứ Bộ luật Tố tụng hình sự"
          value={form.legalBasis.procedureArticlesLine}
          onChange={(value) => updateField("legalBasis", "procedureArticlesLine", value)}
          required
          rows={3}
          className="md:col-span-2"
        />

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
          <TextArea
            label="Căn cứ Luật Tư pháp người chưa thành niên"
            value={form.legalBasis.juvenileJusticeLine}
            onChange={(value) => updateField("legalBasis", "juvenileJusticeLine", value)}
            rows={2}
            className="md:col-span-2"
          />
        ) : null}

        <TextArea
          label="Căn cứ quyết định tạm giữ"
          value={form.custody.detentionDecisionLine}
          onChange={(value) => updateField("custody", "detentionDecisionLine", value)}
          required
          rows={3}
          className="md:col-span-2"
        />

        <TextArea
          label="Căn cứ quyết định gia hạn tạm giữ trước đó"
          value={form.custody.previousExtensionDecisionLine}
          onChange={(value) =>
            updateField("custody", "previousExtensionDecisionLine", value)
          }
          required
          rows={3}
          className="md:col-span-2"
        />

        <TextArea
          label="Xét hồ sơ đề nghị phê chuẩn"
          value={form.custody.approvalProposalLine}
          onChange={(value) => updateField("custody", "approvalProposalLine", value)}
          required
          rows={3}
          className="md:col-span-2"
        />

        <TextArea
          label="Cơ quan đề nghị và người bị tạm giữ"
          value={form.custody.approvalProposalAgencyLine}
          onChange={(value) =>
            updateField("custody", "approvalProposalAgencyLine", value)
          }
          required
          rows={2}
          className="md:col-span-2"
        />

        <TextArea
          label="Nhận thấy"
          value={form.custody.approvalReasonLine}
          onChange={(value) => updateField("custody", "approvalReasonLine", value)}
          required
          rows={3}
          className="md:col-span-2"
        />

        <TextArea
          label="Điều 1"
          value={form.custody.approvalArticle1Line}
          onChange={(value) => updateField("custody", "approvalArticle1Line", value)}
          required
          rows={5}
          className="md:col-span-2"
        />

        <TextArea
          label="Điều 2"
          value={form.custody.executionRequestLine}
          onChange={(value) => updateField("custody", "executionRequestLine", value)}
          required
          rows={4}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="4. Nơi nhận">
        <TextInput
          label="Nơi nhận - cơ quan thực hiện"
          value={form.recipients.executionAgencyLine}
          onChange={(value) => updateField("recipients", "executionAgencyLine", value)}
          required
        />

        <TextInput
          label="Nơi nhận - người bị tạm giữ"
          value={form.recipients.personLine}
          onChange={(value) => updateField("recipients", "personLine", value)}
          required
        />

        <TextInput
          label="Nơi nhận - lưu"
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
          required
        />
      </SectionCard>

      <SectionCard title="5. Chữ ký">
        <SelectInput
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          options={SIGN_MODE_OPTIONS}
        />

        <SelectInput
          label="Chức danh"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          options={POSITION_OPTIONS}
        />

        <TextInput
          label="Người ký"
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          required
        />
      </SectionCard>

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
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-033"}
          </button>
        </div>
      </div>
    </section>
  );
}