"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type SectionName =
  | "agency"
  | "document"
  | "person"
  | "offense"
  | "investigation"
  | "legalBasis"
  | "arrestNonApproval"
  | "recipients"
  | "signature";

type Bm038FormInputs = {
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
  offense: {
    offenseName: string;
    legalArticle: string;
  };
  investigation: {
    agencyName: string;
  };
  legalBasis: {
    procedureArticlesLine: string;
    includeJuvenileJusticeLine: boolean;
    juvenileJusticeLine: string;
  };
  arrestNonApproval: {
    caseDecisionCode: string;
    caseDecisionDateText: string;
    accusedDecisionCode: string;
    accusedDecisionDateText: string;
    arrestOrderCode: string;
    arrestOrderDateText: string;

    caseDecisionLegalBasisLine: string;
    accusedDecisionLegalBasisLine: string;
    proposalLine: string;
    proposalAgencyLine: string;
    reasonLine: string;
    article1Line: string;
    article2Line: string;
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

type Bm038FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const DEFAULT_SIGNER_NAME = '';
const DEFAULT_INVESTIGATION_AGENCY =
  "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";
const DEFAULT_PARENT_AGENCY =
  "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH";
const DEFAULT_AGENCY = '';
const DEFAULT_ISSUE_PLACE = "TP. Hồ Chí Minh";
const DEFAULT_JUVENILE_LINE =
  "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;";

const EMPTY_FORM: Bm038FormInputs = {
  agency: {
    parentNameUpper: DEFAULT_PARENT_AGENCY,
    nameUpper: DEFAULT_AGENCY,
    issuePlace: DEFAULT_ISSUE_PLACE,
  },
  document: {
    documentCode: "38/QĐ-VKSKV7",
    issueDate: todayDisplayDate(),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
      DEFAULT_ISSUE_PLACE,
      todayDisplayDate(),
    ),
  },
  person: {
    fullName: "",
  },
  offense: {
    offenseName: "",
    legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
  },
  investigation: {
    agencyName: DEFAULT_INVESTIGATION_AGENCY,
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 113, 119, 165 và 173 của Bộ luật Tố tụng hình sự;",
    includeJuvenileJusticeLine: true,
    juvenileJusticeLine: DEFAULT_JUVENILE_LINE,
  },
  arrestNonApproval: {
    caseDecisionCode: "",
    caseDecisionDateText: "ngày 6 tháng 5 năm 2026",
    accusedDecisionCode: "",
    accusedDecisionDateText: "ngày 6 tháng 5 năm 2026",
    arrestOrderCode: "17/LTG-VKSKV7",
    arrestOrderDateText: todayLegalDateText(),

    caseDecisionLegalBasisLine: "",
    accusedDecisionLegalBasisLine: "",
    proposalLine: "",
    proposalAgencyLine: "",
    reasonLine: "",
    article1Line: "",
    article2Line: "",
  },
  recipients: {
    executionAgencyLine: `- ${DEFAULT_INVESTIGATION_AGENCY};`,
    personLine: "- ;",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  { section: "person", field: "fullName", label: "Tên bị can" },
  { section: "offense", field: "offenseName", label: "Tên tội" },
  { section: "offense", field: "legalArticle", label: "Điều luật" },
  { section: "investigation", field: "agencyName", label: "Cơ quan điều tra" },
  { section: "legalBasis", field: "procedureArticlesLine", label: "Căn cứ BLTTHS" },
  {
    section: "arrestNonApproval",
    field: "caseDecisionLegalBasisLine",
    label: "Căn cứ khởi tố vụ án",
  },
  {
    section: "arrestNonApproval",
    field: "accusedDecisionLegalBasisLine",
    label: "Căn cứ khởi tố bị can",
  },
  {
    section: "arrestNonApproval",
    field: "proposalLine",
    label: "Xét hồ sơ đề nghị",
  },
  {
    section: "arrestNonApproval",
    field: "proposalAgencyLine",
    label: "Cơ quan đề nghị và bị can",
  },
  {
    section: "arrestNonApproval",
    field: "reasonLine",
    label: "Nhận thấy / lý do không phê chuẩn",
  },
  { section: "arrestNonApproval", field: "article1Line", label: "Điều 1" },
  { section: "arrestNonApproval", field: "article2Line", label: "Điều 2" },
  { section: "recipients", field: "executionAgencyLine", label: "Nơi nhận - cơ quan" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - bị can" },
  { section: "recipients", field: "archiveLine", label: "Nơi nhận - lưu" },
  { section: "signature", field: "signMode", label: "Chế độ ký" },
  { section: "signature", field: "positionTitle", label: "Chức danh" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

function todayDisplayDate(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());

  const day = parts.find((part) => part.type === "day")?.value ?? "14";
  const month = parts.find((part) => part.type === "month")?.value ?? "06";
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";

  return `${day}/${month}/${year}`;
}

function todayLegalDateText(): string {
  return legalDateTextFromDisplay(todayDisplayDate());
}

function normalizeWhitespace(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function rawText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function pickText(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    const text = String(value);

    if (text.length > 0 && text.trim().toLowerCase() !== "null") {
      return text;
    }
  }

  return "";
}

function pickCleanText(...values: unknown[]): string {
  for (const value of values) {
    const text = normalizeWhitespace(value);

    if (text && text.toLowerCase() !== "null" && text.toLowerCase() !== "undefined") {
      return text;
    }
  }

  return "";
}

function ensureSentenceEnd(value: string, mark: "." | ";" | ","): string {
  const text = value
    .replace(/\s+([,.;])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!text) return "";
  if (/[.;,]$/u.test(text)) return text;

  return `${text}${mark}`;
}

function stripRecipientLine(value: unknown): string {
  return normalizeWhitespace(value)
    .replace(/^\s*-\s*/u, "")
    .replace(/[;.\s]+$/u, "")
    .trim();
}

function recipientLine(value: string): string {
  const text = stripRecipientLine(value);
  return text ? `- ${text};` : "";
}

function parseDateParts(value: unknown): { day: string; month: string; year: string } {
  const text = normalizeWhitespace(value);

  if (!text) {
    return { day: "", month: "", year: "" };
  }

  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slash) {
    return {
      day: String(Number(slash[1])),
      month: String(Number(slash[2])),
      year: slash[3],
    };
  }

  const legal = text.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (legal) {
    return {
      day: String(Number(legal[1])),
      month: String(Number(legal[2])),
      year: legal[3],
    };
  }

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/u);
  if (iso) {
    return {
      day: String(Number(iso[3])),
      month: String(Number(iso[2])),
      year: iso[1],
    };
  }

  return { day: "", month: "", year: "" };
}

function displayDateFromParts(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${String(Number(day)).padStart(2, "0")}/${String(Number(month)).padStart(2, "0")}/${year}`;
}

function legalDateFromParts(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function legalDateTextFromDisplay(value: unknown): string {
  const parts = parseDateParts(value);
  return legalDateFromParts(parts.day, parts.month, parts.year);
}

function buildIssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const legal = legalDateTextFromDisplay(issueDate);
  const place = normalizeWhitespace(issuePlace);

  if (!legal) return place;

  return place ? `${place}, ${legal}` : legal;
}

function getNestedValue(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sourceRoot(payload: unknown): Record<string, unknown> {
  const candidates = [
    "renderPayloadSnapshot.formInputs",
    "render_payload_snapshot.formInputs",
    "data.renderPayloadSnapshot.formInputs",
    "data.render_payload_snapshot.formInputs",
    "formInputs",
    "payloadOverrides",
    "renderPayloadOverrides",
    "data.formInputs",
    "payload.formInputs",
    "renderPayload.formInputs",
  ];

  for (const path of candidates) {
    const value = getNestedValue(payload, path);

    if (isRecord(value) && Object.keys(value).length > 0) {
      return value;
    }
  }

  return isRecord(payload) ? payload : {};
}

function generatedLines(form: Bm038FormInputs): Pick<
  Bm038FormInputs["arrestNonApproval"],
  | "caseDecisionLegalBasisLine"
  | "accusedDecisionLegalBasisLine"
  | "proposalLine"
  | "proposalAgencyLine"
  | "reasonLine"
  | "article1Line"
  | "article2Line"
> {
  const accusedName = pickCleanText(form.person.fullName, "...");
  const offenseName = pickCleanText(form.offense.offenseName, "...");
  const legalArticle = pickCleanText(form.offense.legalArticle, "...");
  const investigationAgency = pickCleanText(
    form.investigation.agencyName,
    DEFAULT_INVESTIGATION_AGENCY,
  );

  const offenseClause = `về tội “${offenseName}” quy định tại ${legalArticle}`;
  const caseDecisionCode = pickCleanText(form.arrestNonApproval.caseDecisionCode, "...");
  const caseDecisionDate = pickCleanText(form.arrestNonApproval.caseDecisionDateText);
  const accusedDecisionCode = pickCleanText(form.arrestNonApproval.accusedDecisionCode, "...");
  const accusedDecisionDate = pickCleanText(form.arrestNonApproval.accusedDecisionDateText);
  const arrestOrderCode = pickCleanText(form.arrestNonApproval.arrestOrderCode, "...");
  const arrestOrderDate = pickCleanText(form.arrestNonApproval.arrestOrderDateText);

  return {
    caseDecisionLegalBasisLine: ensureSentenceEnd(
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ${caseDecisionDate} của ${investigationAgency} ${offenseClause}`,
      ";",
    ),
    accusedDecisionLegalBasisLine: ensureSentenceEnd(
      `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ${accusedDecisionDate} của ${investigationAgency} đối với ${accusedName} ${offenseClause}`,
      ";",
    ),
    proposalLine: normalizeWhitespace(
      `Xét hồ sơ đề nghị phê chuẩn Lệnh bắt bị can để tạm giam số ${arrestOrderCode} ${arrestOrderDate}`,
    ),
    proposalAgencyLine: ensureSentenceEnd(
      `của ${investigationAgency} đối với ${accusedName} ${offenseClause}`,
      ";",
    ),
    reasonLine: ensureSentenceEnd(
      `Nhận thấy việc bắt để tạm giam đối với bị can ${accusedName} là không có căn cứ`,
      ",",
    ),
    article1Line: ensureSentenceEnd(
      `Không phê chuẩn Lệnh bắt bị can để tạm giam số ${arrestOrderCode} ${arrestOrderDate} của ${investigationAgency} đối với ${accusedName}`,
      ".",
    ),
    article2Line: ensureSentenceEnd(
      `Yêu cầu ${investigationAgency} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./`,
      ".",
    ).replace("./.", "./."),
  };
}

function buildSyncedForm(form: Bm038FormInputs): Bm038FormInputs {
  const auto = generatedLines(form);

  const includeJuvenile = form.legalBasis.includeJuvenileJusticeLine;
  const issueDate = normalizeWhitespace(form.document.issueDate) || todayDisplayDate();
  const issuePlace = pickCleanText(form.agency.issuePlace, DEFAULT_ISSUE_PLACE);

  return {
    agency: {
      parentNameUpper: pickCleanText(form.agency.parentNameUpper, DEFAULT_PARENT_AGENCY),
      nameUpper: pickCleanText(form.agency.nameUpper, DEFAULT_AGENCY),
      issuePlace,
    },
    document: {
      documentCode: rawText(form.document.documentCode),
      issueDate,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(issuePlace, issueDate),
    },
    person: {
      fullName: rawText(form.person.fullName),
    },
    offense: {
      offenseName: rawText(form.offense.offenseName),
      legalArticle: rawText(form.offense.legalArticle),
    },
    investigation: {
      agencyName: rawText(form.investigation.agencyName),
    },
    legalBasis: {
      procedureArticlesLine: rawText(form.legalBasis.procedureArticlesLine),
      includeJuvenileJusticeLine: includeJuvenile,
      juvenileJusticeLine: includeJuvenile
        ? pickText(form.legalBasis.juvenileJusticeLine, DEFAULT_JUVENILE_LINE)
        : "",
    },
    arrestNonApproval: {
      caseDecisionCode: rawText(form.arrestNonApproval.caseDecisionCode),
      caseDecisionDateText: rawText(form.arrestNonApproval.caseDecisionDateText),
      accusedDecisionCode: rawText(form.arrestNonApproval.accusedDecisionCode),
      accusedDecisionDateText: rawText(form.arrestNonApproval.accusedDecisionDateText),
      arrestOrderCode: rawText(form.arrestNonApproval.arrestOrderCode),
      arrestOrderDateText: rawText(form.arrestNonApproval.arrestOrderDateText),

      caseDecisionLegalBasisLine: pickText(
        form.arrestNonApproval.caseDecisionLegalBasisLine,
        auto.caseDecisionLegalBasisLine,
      ),
      accusedDecisionLegalBasisLine: pickText(
        form.arrestNonApproval.accusedDecisionLegalBasisLine,
        auto.accusedDecisionLegalBasisLine,
      ),
      proposalLine: pickText(form.arrestNonApproval.proposalLine, auto.proposalLine),
      proposalAgencyLine: pickText(
        form.arrestNonApproval.proposalAgencyLine,
        auto.proposalAgencyLine,
      ),
      reasonLine: pickText(form.arrestNonApproval.reasonLine, auto.reasonLine),
      article1Line: pickText(form.arrestNonApproval.article1Line, auto.article1Line),
      article2Line: pickText(form.arrestNonApproval.article2Line, auto.article2Line),
    },
    recipients: {
      executionAgencyLine: rawText(form.recipients.executionAgencyLine),
      personLine: rawText(form.recipients.personLine),
      archiveLine: pickText(form.recipients.archiveLine, EMPTY_FORM.recipients.archiveLine),
    },
    signature: {
      signMode: pickText(form.signature.signMode, EMPTY_FORM.signature.signMode),
      positionTitle: pickText(form.signature.positionTitle, EMPTY_FORM.signature.positionTitle),
      signerName: pickText(form.signature.signerName, DEFAULT_SIGNER_NAME),
    },
  };
}

function syncAutoFieldsAfterMainChange(
  previous: Bm038FormInputs,
  next: Bm038FormInputs,
): Bm038FormInputs {
  const previousAuto = generatedLines(previous);
  const nextAuto = generatedLines(next);

  const replaceLiteral = (source: string, from: string, to: string): string => {
    if (!from || from === to) {
      return source;
    }

    return source.split(from).join(to);
  };

  const replaceKnownValues = (value: string): string => {
    const replacements: Array<[string, string]> = [
      [previous.person.fullName, next.person.fullName],
      [previous.offense.offenseName, next.offense.offenseName],
      [previous.offense.legalArticle, next.offense.legalArticle],
      [previous.investigation.agencyName, next.investigation.agencyName],

      [
        previous.arrestNonApproval.caseDecisionCode,
        next.arrestNonApproval.caseDecisionCode,
      ],
      [
        previous.arrestNonApproval.caseDecisionDateText,
        next.arrestNonApproval.caseDecisionDateText,
      ],
      [
        previous.arrestNonApproval.accusedDecisionCode,
        next.arrestNonApproval.accusedDecisionCode,
      ],
      [
        previous.arrestNonApproval.accusedDecisionDateText,
        next.arrestNonApproval.accusedDecisionDateText,
      ],
      [
        previous.arrestNonApproval.arrestOrderCode,
        next.arrestNonApproval.arrestOrderCode,
      ],
      [
        previous.arrestNonApproval.arrestOrderDateText,
        next.arrestNonApproval.arrestOrderDateText,
      ],
    ];

    return replacements.reduce((current, [from, to]) => {
      return replaceLiteral(current, rawText(from), rawText(to));
    }, rawText(value));
  };

  const keepManualOrSync = (
    currentValue: string,
    oldAutoValue: string,
    nextAutoValue: string,
  ): string => {
    const current = rawText(currentValue);
    const trimmedCurrent = current.trim();
    const trimmedOldAuto = oldAutoValue.trim();

    if (!trimmedCurrent || trimmedCurrent === trimmedOldAuto) {
      return nextAutoValue;
    }

    return replaceKnownValues(current);
  };

  const oldRecipientAgency = recipientLine(previous.investigation.agencyName);
  const nextRecipientAgency = recipientLine(next.investigation.agencyName);
  const oldRecipientPerson = recipientLine(previous.person.fullName);
  const nextRecipientPerson = recipientLine(next.person.fullName);

  const syncRecipient = (
    currentValue: string,
    oldAutoValue: string,
    nextAutoValue: string,
  ): string => {
    const current = rawText(currentValue);

    if (!current.trim() || current.trim() === oldAutoValue.trim()) {
      return nextAutoValue;
    }

    return replaceKnownValues(current);
  };

  return {
    ...next,
    document: {
      ...next.document,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
        next.agency.issuePlace,
        next.document.issueDate,
      ),
    },
    legalBasis: {
      ...next.legalBasis,
      juvenileJusticeLine: next.legalBasis.includeJuvenileJusticeLine
        ? next.legalBasis.juvenileJusticeLine || DEFAULT_JUVENILE_LINE
        : "",
    },
    arrestNonApproval: {
      ...next.arrestNonApproval,
      caseDecisionLegalBasisLine: keepManualOrSync(
        next.arrestNonApproval.caseDecisionLegalBasisLine,
        previousAuto.caseDecisionLegalBasisLine,
        nextAuto.caseDecisionLegalBasisLine,
      ),
      accusedDecisionLegalBasisLine: keepManualOrSync(
        next.arrestNonApproval.accusedDecisionLegalBasisLine,
        previousAuto.accusedDecisionLegalBasisLine,
        nextAuto.accusedDecisionLegalBasisLine,
      ),
      proposalLine: keepManualOrSync(
        next.arrestNonApproval.proposalLine,
        previousAuto.proposalLine,
        nextAuto.proposalLine,
      ),
      proposalAgencyLine: keepManualOrSync(
        next.arrestNonApproval.proposalAgencyLine,
        previousAuto.proposalAgencyLine,
        nextAuto.proposalAgencyLine,
      ),
      reasonLine: keepManualOrSync(
        next.arrestNonApproval.reasonLine,
        previousAuto.reasonLine,
        nextAuto.reasonLine,
      ),
      article1Line: keepManualOrSync(
        next.arrestNonApproval.article1Line,
        previousAuto.article1Line,
        nextAuto.article1Line,
      ),
      article2Line: keepManualOrSync(
        next.arrestNonApproval.article2Line,
        previousAuto.article2Line,
        nextAuto.article2Line,
      ),
    },
    recipients: {
      ...next.recipients,
      executionAgencyLine: syncRecipient(
        next.recipients.executionAgencyLine,
        oldRecipientAgency,
        nextRecipientAgency,
      ),
      personLine: syncRecipient(
        next.recipients.personLine,
        oldRecipientPerson,
        nextRecipientPerson,
      ),
    },
  };
}
function normalizeFormInputs(payload: Record<string, unknown>): Bm038FormInputs {
  const root = sourceRoot(payload);

  const legalBasis = isRecord(root.legalBasis) ? root.legalBasis : {};
  const arrestNonApproval = isRecord(root.arrestNonApproval)
    ? root.arrestNonApproval
    : {};
  const document = isRecord(root.document) ? root.document : {};
  const agency = isRecord(root.agency) ? root.agency : {};
  const person = isRecord(root.person) ? root.person : {};
  const offense = isRecord(root.offense) ? root.offense : {};
  const investigation = isRecord(root.investigation) ? root.investigation : {};
  const recipients = isRecord(root.recipients) ? root.recipients : {};
  const signature = isRecord(root.signature) ? root.signature : {};

  const juvenileLine = pickText(
    legalBasis.juvenileJusticeLine,
    EMPTY_FORM.legalBasis.juvenileJusticeLine,
  );

  const includeJuvenile =
    typeof legalBasis.includeJuvenileJusticeLine === "boolean"
      ? legalBasis.includeJuvenileJusticeLine
      : normalizeWhitespace(juvenileLine).length > 0;

  return buildSyncedForm({
    agency: {
      parentNameUpper: pickText(
        agency.parentNameUpper,
        agency.parentName,
        EMPTY_FORM.agency.parentNameUpper,
      ),
      nameUpper: pickText(agency.nameUpper, agency.name, EMPTY_FORM.agency.nameUpper),
      issuePlace: pickText(agency.issuePlace, EMPTY_FORM.agency.issuePlace),
    },
    document: {
      documentCode: pickText(
        document.documentCode,
        document.fullDocumentCode,
        document.documentNo,
        EMPTY_FORM.document.documentCode,
      ),
      issueDate: pickText(
        document.issueDate,
        document.issueDateText,
        document.issuePlaceAndDateLine,
        EMPTY_FORM.document.issueDate,
      ),
      issuePlaceAndDateLine: pickText(document.issuePlaceAndDateLine),
    },
    person: {
      fullName: pickText(person.fullName, root.targetPersonName, EMPTY_FORM.person.fullName),
    },
    offense: {
      offenseName: pickText(offense.offenseName, EMPTY_FORM.offense.offenseName),
      legalArticle: pickText(offense.legalArticle, EMPTY_FORM.offense.legalArticle),
    },
    investigation: {
      agencyName: pickText(
        investigation.agencyName,
        investigation.investigationUnitName,
        recipients.executionAgencyLine ? stripRecipientLine(recipients.executionAgencyLine) : "",
        EMPTY_FORM.investigation.agencyName,
      ),
    },
    legalBasis: {
      procedureArticlesLine: pickText(
        legalBasis.procedureArticlesLine,
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
      includeJuvenileJusticeLine: includeJuvenile,
      juvenileJusticeLine: includeJuvenile ? juvenileLine : "",
    },
    arrestNonApproval: {
      caseDecisionCode: pickText(
        arrestNonApproval.caseDecisionCode,
        EMPTY_FORM.arrestNonApproval.caseDecisionCode,
      ),
      caseDecisionDateText: pickText(
        arrestNonApproval.caseDecisionDateText,
        EMPTY_FORM.arrestNonApproval.caseDecisionDateText,
      ),
      accusedDecisionCode: pickText(
        arrestNonApproval.accusedDecisionCode,
        EMPTY_FORM.arrestNonApproval.accusedDecisionCode,
      ),
      accusedDecisionDateText: pickText(
        arrestNonApproval.accusedDecisionDateText,
        EMPTY_FORM.arrestNonApproval.accusedDecisionDateText,
      ),
      arrestOrderCode: pickText(
        arrestNonApproval.arrestOrderCode,
        EMPTY_FORM.arrestNonApproval.arrestOrderCode,
      ),
      arrestOrderDateText: pickText(
        arrestNonApproval.arrestOrderDateText,
        EMPTY_FORM.arrestNonApproval.arrestOrderDateText,
      ),

      caseDecisionLegalBasisLine: pickText(arrestNonApproval.caseDecisionLegalBasisLine),
      accusedDecisionLegalBasisLine: pickText(
        arrestNonApproval.accusedDecisionLegalBasisLine,
      ),
      proposalLine: pickText(arrestNonApproval.proposalLine),
      proposalAgencyLine: pickText(arrestNonApproval.proposalAgencyLine),
      reasonLine: pickText(arrestNonApproval.reasonLine),
      article1Line: pickText(arrestNonApproval.article1Line),
      article2Line: pickText(arrestNonApproval.article2Line),
    },
    recipients: {
      executionAgencyLine: pickText(recipients.executionAgencyLine),
      personLine: pickText(recipients.personLine),
      archiveLine: pickText(recipients.archiveLine, EMPTY_FORM.recipients.archiveLine),
    },
    signature: {
      signMode: pickText(signature.signMode, EMPTY_FORM.signature.signMode),
      positionTitle: pickText(signature.positionTitle, EMPTY_FORM.signature.positionTitle),
      signerName: pickText(signature.signerName, DEFAULT_SIGNER_NAME),
    },
  });
}

async function getBm038RenderPayload(
  documentId: string | number,
): Promise<Record<string, unknown>> {
  try {
    const detailResponse = await fetch(`${API_BASE_URL}/documents/generated/${documentId}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

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
    // fallback below
  }

  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Không tải được render-payload BM-038. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm038FormInputs(
  documentId: string | number,
  form: Bm038FormInputs,
): Promise<void> {
  const savePayload = buildSyncedForm(form);

  const juvenileLine = savePayload.legalBasis.includeJuvenileJusticeLine
    ? savePayload.legalBasis.juvenileJusticeLine || DEFAULT_JUVENILE_LINE
    : "";

  savePayload.legalBasis.juvenileJusticeLine = juvenileLine;

  const legalBasisAny = savePayload.legalBasis as unknown as Record<string, unknown>;
  legalBasisAny["juvenileLegalBasisLine"] = juvenileLine;
  legalBasisAny["minorLegalBasisLine"] = juvenileLine;
  legalBasisAny["isJuvenile"] = savePayload.legalBasis.includeJuvenileJusticeLine
    ? "true"
    : "false";
  legalBasisAny["includeJuvenileJusticeLine"] =
    savePayload.legalBasis.includeJuvenileJusticeLine;

  const updatedByName = savePayload.signature.signerName.trim() || DEFAULT_SIGNER_NAME;

  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updatedByName,
        formInputs: savePayload,
        ...savePayload,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Không lưu được dữ liệu BM-038. HTTP ${response.status}`);
  }
}

function getMissingFields(form: Bm038FormInputs): RequiredField[] {
  return REQUIRED_FIELDS.filter(({ section, field }) => {
    const sectionValue = form[section] as unknown as Record<string, unknown>;
    return !normalizeWhitespace(sectionValue[field]).length;
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
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
  className = "lg:col-span-2",
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
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function DateTriplet({
  label,
  value,
  onChange,
  format = "display",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  format?: "display" | "legal";
}) {
  const parts = parseDateParts(value);
  const years = Array.from({ length: 9 }, (_, index) => String(2022 + index));

  const update = (key: "day" | "month" | "year", nextValue: string) => {
    const next = {
      ...parts,
      [key]: nextValue,
    };

    onChange(
      format === "legal"
        ? legalDateFromParts(next.day, next.month, next.year)
        : displayDateFromParts(next.day, next.month, next.year),
    );
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
        {label}
      </span>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={parts.day}
          onChange={(event) => update("day", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Ngày</option>
          {Array.from({ length: 31 }, (_, index) => String(index + 1)).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <select
          value={parts.month}
          onChange={(event) => update("month", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Tháng</option>
          {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <select
          value={parts.year}
          onChange={(event) => update("year", event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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

function shouldAutoSyncSourceField(sectionName: SectionName, fieldName: string): boolean {
  if (sectionName === "person" && fieldName === "fullName") return true;

  if (
    sectionName === "offense" &&
    ["offenseName", "legalArticle"].includes(fieldName)
  ) {
    return true;
  }

  if (sectionName === "investigation" && fieldName === "agencyName") return true;

  if (
    sectionName === "arrestNonApproval" &&
    [
      "caseDecisionCode",
      "caseDecisionDateText",
      "accusedDecisionCode",
      "accusedDecisionDateText",
      "arrestOrderCode",
      "arrestOrderDateText",
    ].includes(fieldName)
  ) {
    return true;
  }

  if (
    sectionName === "document" &&
    ["issueDate"].includes(fieldName)
  ) {
    return true;
  }

  if (
    sectionName === "agency" &&
    ["issuePlace"].includes(fieldName)
  ) {
    return true;
  }

  return false;
}
export function Bm038FormInputsPanel({
  documentId,
  onSaved,
}: Bm038FormInputsPanelProps) {
  const [form, setForm] = useState<Bm038FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState<string>(
    JSON.stringify(EMPTY_FORM),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const payload = await getBm038RenderPayload(documentId);
        const normalized = normalizeFormInputs(payload);

        if (!isMounted) return;

        setForm(normalized);
        setInitialSnapshot(JSON.stringify(normalized));
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error ? error.message : "Không tải được dữ liệu BM-038.",
        );
        setForm(EMPTY_FORM);
        setInitialSnapshot(JSON.stringify(EMPTY_FORM));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  function updateField(
    sectionName: SectionName,
    fieldName: string,
    value: string | boolean,
    options?: { syncAuto?: boolean },
  ) {
    setForm((current) => {
      const next = {
        ...current,
        [sectionName]: {
          ...current[sectionName],
          [fieldName]: value,
        },
      } as Bm038FormInputs;

      const mustSync =
        options?.syncAuto === true || shouldAutoSyncSourceField(sectionName, fieldName);

      return mustSync ? syncAutoFieldsAfterMainChange(current, next) : next;
    });
  }

  function fillCustomerSample() {
    const sample = buildSyncedForm(EMPTY_FORM);

    setForm(sample);
    setSuccessMessage("Đã điền dữ liệu mẫu BM-038. Bấm lưu để ghi vào backend.");
    setErrorMessage("");
  }

  function regenerateBodyLines() {
    const auto = generatedLines(form);

    setForm((current) => ({
      ...current,
      document: {
        ...current.document,
        issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
          current.agency.issuePlace,
          current.document.issueDate,
        ),
      },
      legalBasis: {
        ...current.legalBasis,
        juvenileJusticeLine: current.legalBasis.includeJuvenileJusticeLine
          ? current.legalBasis.juvenileJusticeLine || DEFAULT_JUVENILE_LINE
          : "",
      },
      arrestNonApproval: {
        ...current.arrestNonApproval,
        ...auto,
      },
      recipients: {
        ...current.recipients,
        executionAgencyLine: recipientLine(current.investigation.agencyName),
        personLine: recipientLine(current.person.fullName),
      },
    }));
    setSuccessMessage("Đã đồng bộ lại các dòng render từ dữ liệu nguồn.");
    setErrorMessage("");
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const savePayload = buildSyncedForm(form);
      await saveBm038FormInputs(documentId, savePayload);

      setForm(savePayload);
      setInitialSnapshot(JSON.stringify(savePayload));
      setSuccessMessage("Đã lưu dữ liệu BM-038. Có thể render lại DOCX/PDF.");
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không lưu được dữ liệu BM-038.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const missingFields = useMemo(() => getMissingFields(buildSyncedForm(form)), [form]);
  const isDirty = JSON.stringify(buildSyncedForm(form)) !== initialSnapshot;
  const canSave = isDirty && missingFields.length === 0 && !isSaving;

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu BM-038...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          BM-038
        </p>
        <h2 className="mt-2 text-xl font-bold text-emerald-950">
          Dữ liệu biểu mẫu Quyết định không phê chuẩn Lệnh bắt bị can để tạm giam
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Các dòng body và nơi nhận hiện là dữ liệu nhập tay. Khi cần tự sinh lại từ tên bị can,
          tội danh, số/ngày quyết định thì bấm nút đồng bộ.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-038
          </button>

          <button
            type="button"
            onClick={regenerateBodyLines}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
          >
            Đồng bộ lại dòng render
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-038"}
          </button>
        </div>

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Còn thiếu: {missingFields.map((field) => field.label).join(", ")}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Đã nhập đủ các trường quan trọng.
          </div>
        )}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        ) : null}
      </div>

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
        <DateTriplet
          label="Ngày ban hành"
          value={form.document.issueDate}
          onChange={(value) => updateField("document", "issueDate", value, { syncAuto: true })}
        />
        <TextInput
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value, { syncAuto: true })}
          required
        />
        <TextInput
          label="Địa danh, ngày tháng năm"
          value={buildIssuePlaceAndDateLine(form.agency.issuePlace, form.document.issueDate)}
          onChange={(value) => updateField("document", "issuePlaceAndDateLine", value)}
          required
        />
      </SectionCard>

      <SectionCard
        title="2. Dữ liệu nguồn"
        description="Sửa các ô chính rồi bấm đồng bộ lại dòng render nếu muốn hệ thống tự sinh lại nội dung."
      >
        <TextInput
          label="Tên bị can"
          value={form.person.fullName}
          onChange={(value) => updateField("person", "fullName", value, { syncAuto: true })}
          required
        />
        <TextInput
          label="Tên tội"
          value={form.offense.offenseName}
          onChange={(value) => updateField("offense", "offenseName", value, { syncAuto: true })}
          required
        />
        <TextInput
          label="Điều luật"
          value={form.offense.legalArticle}
          onChange={(value) => updateField("offense", "legalArticle", value, { syncAuto: true })}
          required
        />
        <TextInput
          label="Cơ quan điều tra / cơ quan đề nghị"
          value={form.investigation.agencyName}
          onChange={(value) =>
            updateField("investigation", "agencyName", value, { syncAuto: true })
          }
          required
        />
      </SectionCard>

      <SectionCard title="3. Số/ngày quyết định liên quan">
        <TextInput
          label="Số quyết định khởi tố vụ án"
          value={form.arrestNonApproval.caseDecisionCode}
          onChange={(value) =>
            updateField("arrestNonApproval", "caseDecisionCode", value, { syncAuto: true })
          }
          required
        />
        <DateTriplet
          label="Ngày quyết định khởi tố vụ án"
          value={form.arrestNonApproval.caseDecisionDateText}
          format="legal"
          onChange={(value) =>
            updateField("arrestNonApproval", "caseDecisionDateText", value, {
              syncAuto: true,
            })
          }
        />
        <TextInput
          label="Số quyết định khởi tố bị can"
          value={form.arrestNonApproval.accusedDecisionCode}
          onChange={(value) =>
            updateField("arrestNonApproval", "accusedDecisionCode", value, {
              syncAuto: true,
            })
          }
          required
        />
        <DateTriplet
          label="Ngày quyết định khởi tố bị can"
          value={form.arrestNonApproval.accusedDecisionDateText}
          format="legal"
          onChange={(value) =>
            updateField("arrestNonApproval", "accusedDecisionDateText", value, {
              syncAuto: true,
            })
          }
        />
        <TextInput
          label="Số lệnh bắt bị can để tạm giam"
          value={form.arrestNonApproval.arrestOrderCode}
          onChange={(value) =>
            updateField("arrestNonApproval", "arrestOrderCode", value, { syncAuto: true })
          }
          required
        />
        <DateTriplet
          label="Ngày lệnh bắt bị can để tạm giam"
          value={form.arrestNonApproval.arrestOrderDateText}
          format="legal"
          onChange={(value) =>
            updateField("arrestNonApproval", "arrestOrderDateText", value, {
              syncAuto: true,
            })
          }
        />
      </SectionCard>

      <SectionCard title="4. Căn cứ pháp lý / nội dung quyết định">
        <TextArea
          label="Căn cứ Bộ luật Tố tụng hình sự"
          value={form.legalBasis.procedureArticlesLine}
          onChange={(value) => updateField("legalBasis", "procedureArticlesLine", value)}
          required
        />

        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={form.legalBasis.includeJuvenileJusticeLine}
              onChange={(event) => {
                const checked = event.target.checked;

                setForm((current) => ({
                  ...current,
                  legalBasis: {
                    ...current.legalBasis,
                    includeJuvenileJusticeLine: checked,
                    juvenileJusticeLine: checked
                      ? current.legalBasis.juvenileJusticeLine || DEFAULT_JUVENILE_LINE
                      : "",
                  },
                }));
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            Có áp dụng căn cứ Luật Tư pháp người chưa thành niên
          </label>
        </div>

        {form.legalBasis.includeJuvenileJusticeLine ? (
          <TextArea
            label="Căn cứ Luật Tư pháp người chưa thành niên"
            value={form.legalBasis.juvenileJusticeLine}
            onChange={(value) => updateField("legalBasis", "juvenileJusticeLine", value)}
            required
          />
        ) : null}

        <TextArea
          label="Căn cứ quyết định khởi tố vụ án"
          value={form.arrestNonApproval.caseDecisionLegalBasisLine}
          onChange={(value) =>
            updateField("arrestNonApproval", "caseDecisionLegalBasisLine", value)
          }
          required
          rows={4}
        />
        <TextArea
          label="Căn cứ quyết định khởi tố bị can"
          value={form.arrestNonApproval.accusedDecisionLegalBasisLine}
          onChange={(value) =>
            updateField("arrestNonApproval", "accusedDecisionLegalBasisLine", value)
          }
          required
          rows={4}
        />
        <TextArea
          label="Xét hồ sơ đề nghị phê chuẩn"
          value={form.arrestNonApproval.proposalLine}
          onChange={(value) => updateField("arrestNonApproval", "proposalLine", value)}
          required
          rows={3}
        />
        <TextArea
          label="Cơ quan đề nghị và bị can"
          value={form.arrestNonApproval.proposalAgencyLine}
          onChange={(value) => updateField("arrestNonApproval", "proposalAgencyLine", value)}
          required
          rows={3}
        />
        <TextArea
          label="Nhận thấy / lý do không phê chuẩn"
          value={form.arrestNonApproval.reasonLine}
          onChange={(value) => updateField("arrestNonApproval", "reasonLine", value)}
          required
          rows={3}
        />
        <TextArea
          label="Điều 1"
          value={form.arrestNonApproval.article1Line}
          onChange={(value) => updateField("arrestNonApproval", "article1Line", value)}
          required
          rows={4}
        />
        <TextArea
          label="Điều 2"
          value={form.arrestNonApproval.article2Line}
          onChange={(value) => updateField("arrestNonApproval", "article2Line", value)}
          required
          rows={4}
        />
      </SectionCard>

      <SectionCard title="5. Nơi nhận / chữ ký">
        <TextInput
          label="Nơi nhận - cơ quan thực hiện"
          value={form.recipients.executionAgencyLine}
          onChange={(value) => updateField("recipients", "executionAgencyLine", value)}
          required
        />
        <TextInput
          label="Nơi nhận - bị can"
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
        <TextInput
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          required
        />
        <TextInput
          label="Chức danh"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          required
        />
        <TextInput
          label="Người ký"
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          required
        />
      </SectionCard>
    </section>
  );
}