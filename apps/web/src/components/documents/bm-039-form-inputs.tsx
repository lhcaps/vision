"use client";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldSelect,
  BmFieldCheckbox,
  BmFormSection,
  BmFormMetaBar,
} from "./bm-form";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applyCasePayloadToBm039Form } from "@/lib/bm-auto-populate/bm039-case-defaults";
import { useCasePayload } from "@/lib/case-payload-context";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type SectionName =
  | "agency"
  | "document"
  | "legalBasis"
  | "detentionArrest"
  | "recipients"
  | "signature";

type Bm039FormInputs = {
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
  legalBasis: {
    procedureArticlesLine: string;
    includeJuvenileJusticeLine: boolean;
    juvenileJusticeLine: string;
  };
  detentionArrest: {
    accusedName: string;
    otherName: string;
    genderLabel: string;

    birthDay: string;
    birthMonth: string;
    birthYear: string;
    placeOfBirth: string;

    nationality: string;
    ethnicity: string;
    religion: string;
    occupation: string;

    identityNo: string;
    identityIssuedDay: string;
    identityIssuedMonth: string;
    identityIssuedYear: string;
    identityIssuedPlace: string;

    permanentAddress: string;
    temporaryAddress: string;
    currentAddress: string;

    offenseName: string;
    legalArticle: string;
    investigationAgency: string;

    caseDecisionCode: string;
    caseDecisionDateText: string;
    accusedDecisionCode: string;
    accusedDecisionDateText: string;

    detentionDurationText: string;
    detentionToDateText: string;
    detentionToDateLine: string;

    detentionExecutionUnitName: string;
    detentionFacilityName: string;

    caseDecisionLegalBasisLine: string;
    accusedDecisionLegalBasisLine: string;
    reasonLine: string;
  };
  recipients: {
    executionAgencyLine: string;
    detentionFacilityLine: string;
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

type Bm039FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const DEFAULT_PERSON_NAME = '';
const DEFAULT_OFFENSE_NAME = '';
const DEFAULT_LEGAL_ARTICLE = "khoản 1 Điều 321 Bộ luật Hình sự";
const DEFAULT_INVESTIGATION_AGENCY =
  "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";
const DEFAULT_EXECUTION_UNIT =
  "Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh";
const DEFAULT_DETENTION_FACILITY =
  "Nhà tạm giữ Công an Thành phố Hồ Chí Minh";
const DEFAULT_SIGNER_NAME = '';

const EMPTY_FORM: Bm039FormInputs = {
  agency: {
    parentNameUpper: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    nameUpper: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "39/LBBC-TG-VKSKV7",
    issueDate: getBm039TodayDisplayDate(),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine("TP. Hồ Chí Minh", getBm039TodayDisplayDate()),
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 113, 119 và 165 của Bộ luật Tố tụng hình sự;",
    includeJuvenileJusticeLine: false,
    juvenileJusticeLine:
      "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;",
  },
  detentionArrest: {
    accusedName: DEFAULT_PERSON_NAME,
    otherName: "Không có",
    genderLabel: "Nam",

    birthDay: "08",
    birthMonth: "09",
    birthYear: "1985",
    placeOfBirth: "tỉnh Quảng Ngãi",

    nationality: "Việt Nam",
    ethnicity: "Kinh",
    religion: "Không",
    occupation: "Kinh doanh",

    identityNo: "051080000314",
    identityIssuedDay: "22",
    identityIssuedMonth: "12",
    identityIssuedYear: "2021",
    identityIssuedPlace: "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",

    permanentAddress:
      "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    temporaryAddress: "",
    currentAddress: "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",

    offenseName: DEFAULT_OFFENSE_NAME,
    legalArticle: DEFAULT_LEGAL_ARTICLE,
    investigationAgency: DEFAULT_INVESTIGATION_AGENCY,

    caseDecisionCode: "",
    caseDecisionDateText: "ngày 6 tháng 5 năm 2026",
    accusedDecisionCode: "",
    accusedDecisionDateText: "ngày 6 tháng 5 năm 2026",

    detentionDurationText: "02 tháng",
    detentionToDateText: "",
    detentionToDateLine: "đến ngày ... tháng ... năm ...",

    detentionExecutionUnitName: DEFAULT_EXECUTION_UNIT,
    detentionFacilityName: DEFAULT_DETENTION_FACILITY,

    caseDecisionLegalBasisLine: "",
    accusedDecisionLegalBasisLine: "",
    reasonLine: "",
  },
  recipients: {
    executionAgencyLine: "",
    detentionFacilityLine: "",
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
  { section: "document", field: "documentCode", label: "Số lệnh" },
  { section: "document", field: "issuePlaceAndDateLine", label: "Địa danh, ngày tháng năm" },
  { section: "detentionArrest", field: "accusedName", label: "Họ tên bị can" },
  { section: "detentionArrest", field: "genderLabel", label: "Giới tính" },
  { section: "detentionArrest", field: "birthDay", label: "Ngày sinh" },
  { section: "detentionArrest", field: "birthMonth", label: "Tháng sinh" },
  { section: "detentionArrest", field: "birthYear", label: "Năm sinh" },
  { section: "detentionArrest", field: "placeOfBirth", label: "Nơi sinh" },
  { section: "detentionArrest", field: "offenseName", label: "Tên tội" },
  { section: "detentionArrest", field: "legalArticle", label: "Điều luật" },
  { section: "detentionArrest", field: "investigationAgency", label: "Cơ quan điều tra" },
  { section: "detentionArrest", field: "detentionDurationText", label: "Thời hạn tạm giam" },
  { section: "detentionArrest", field: "detentionExecutionUnitName", label: "Cơ quan thi hành lệnh" },
  { section: "detentionArrest", field: "detentionFacilityName", label: "Cơ sở giam giữ" },
  { section: "signature", field: "signMode", label: "Chế độ ký" },
  { section: "signature", field: "positionTitle", label: "Chức danh" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
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

function stripListLine(value: unknown): string {
  return text(value)
    .replace(/^-+\s*/u, "")
    .replace(/;$/u, "")
    .trim();
}

function toLegalDateText(value: string): string {
  const raw = value.trim();

  if (!raw) {
    return "";
  }

  if (raw.includes("ngày") && raw.includes("tháng") && raw.includes("năm")) {
    return raw;
  }

  const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);

  if (!match) {
    return raw;
  }

  return `ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
}

function toDetentionToDateLine(value: string): string {
  const raw = value.trim();

  if (!raw) {
    return "đến ngày ... tháng ... năm ...";
  }

  if (/^đến\s+ngày/i.test(raw)) {
    return raw;
  }

  const legalDate = toLegalDateText(raw);

  if (legalDate.startsWith("ngày ")) {
    return `đến ${legalDate}`;
  }

  return `đến ngày ${raw}`;
}

function buildIssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const legalDate = toLegalDateText(issueDate);

  if (!legalDate) {
    return text(issuePlace);
  }

  return `${text(issuePlace) || "TP. Hồ Chí Minh"}, ${legalDate}`;
}

function buildOffenseClause(offenseName: string, legalArticle: string): string {
  return `về tội “${pickText(offenseName, DEFAULT_OFFENSE_NAME)}” quy định tại ${pickText(
    legalArticle,
    DEFAULT_LEGAL_ARTICLE,
  )}`;
}

function getValue(
  form: Bm039FormInputs,
  sectionName: SectionName,
  fieldName: string,
): string {
  const group = form[sectionName] as Record<string, string>;
  return group[fieldName] ?? "";
}

type Bm039GeneratedLines = {
  caseDecisionLegalBasisLine: string;
  accusedDecisionLegalBasisLine: string;
  reasonLine: string;
  detentionToDateLine: string;
  executionAgencyLine: string;
  detentionFacilityLine: string;
  personLine: string;
  archiveLine: string;
};

function buildBm039GeneratedLines(input: Bm039FormInputs): Bm039GeneratedLines {
  const detention = input.detentionArrest;

  const accusedName = pickText(detention.accusedName, DEFAULT_PERSON_NAME);
  const offenseName = pickText(detention.offenseName, DEFAULT_OFFENSE_NAME);
  const legalArticle = pickText(detention.legalArticle, DEFAULT_LEGAL_ARTICLE);
  const offenseClause = buildOffenseClause(offenseName, legalArticle);

  const investigationAgency = pickText(
    detention.investigationAgency,
    DEFAULT_INVESTIGATION_AGENCY,
  );

  const executionUnit = pickText(
    detention.detentionExecutionUnitName,
    DEFAULT_EXECUTION_UNIT,
  );

  const detentionFacility = pickText(
    detention.detentionFacilityName,
    DEFAULT_DETENTION_FACILITY,
  );

  const caseDecisionCode = pickText(detention.caseDecisionCode, "");
  const caseDecisionDateText = toLegalDateText(
    pickText(detention.caseDecisionDateText, input.document.issueDate),
  );

  const accusedDecisionCode = pickText(
    detention.accusedDecisionCode,
    "",
  );
  const accusedDecisionDateText = toLegalDateText(
    pickText(detention.accusedDecisionDateText, input.document.issueDate),
  );

  return {
    caseDecisionLegalBasisLine:
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ${caseDecisionDateText} của ${investigationAgency} ${offenseClause};`,
    accusedDecisionLegalBasisLine:
      `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ${accusedDecisionDateText} của ${investigationAgency} đối với ${accusedName} ${offenseClause};`,
    reasonLine:
      `Xét thấy việc bắt để tạm giam đối với bị can ${accusedName} là có căn cứ và cần thiết,`,
    detentionToDateLine: toDetentionToDateLine(
      pickText(detention.detentionToDateText, detention.detentionToDateLine),
    ),
    executionAgencyLine: `- ${executionUnit};`,
    detentionFacilityLine: `- ${detentionFacility};`,
    personLine: `- ${accusedName};`,
    archiveLine: pickText(input.recipients.archiveLine, "- Lưu: HSVA, HSKS, VP."),
  };
}

function replaceLiteral(source: string, from: string, to: string): string {
  if (!from || from === to) {
    return source;
  }

  return source.split(from).join(to);
}

function replaceKnownBm039Values(
  value: string,
  previous: Bm039FormInputs,
  next: Bm039FormInputs,
): string {
  const replacements: Array<[string, string]> = [
    [previous.detentionArrest.accusedName, next.detentionArrest.accusedName],
    [previous.detentionArrest.offenseName, next.detentionArrest.offenseName],
    [previous.detentionArrest.legalArticle, next.detentionArrest.legalArticle],
    [previous.detentionArrest.investigationAgency, next.detentionArrest.investigationAgency],
    [previous.detentionArrest.caseDecisionCode, next.detentionArrest.caseDecisionCode],
    [previous.detentionArrest.caseDecisionDateText, next.detentionArrest.caseDecisionDateText],
    [previous.detentionArrest.accusedDecisionCode, next.detentionArrest.accusedDecisionCode],
    [previous.detentionArrest.accusedDecisionDateText, next.detentionArrest.accusedDecisionDateText],
    [previous.detentionArrest.detentionDurationText, next.detentionArrest.detentionDurationText],
    [previous.detentionArrest.detentionToDateText, next.detentionArrest.detentionToDateText],
    [previous.detentionArrest.detentionExecutionUnitName, next.detentionArrest.detentionExecutionUnitName],
    [previous.detentionArrest.detentionFacilityName, next.detentionArrest.detentionFacilityName],
  ];

  return replacements.reduce((current, [from, to]) => {
    return replaceLiteral(current, text(from), text(to));
  }, text(value));
}

function keepManualOrAuto(
  currentValue: string,
  oldAutoValue: string,
  nextAutoValue: string,
  _previous: Bm039FormInputs,
  _next: Bm039FormInputs,
): string {
  const current = text(currentValue);
  const currentTrimmed = current.trim();
  const oldAutoTrimmed = text(oldAutoValue).trim();

  // An toàn:
  // - Dòng rỗng hoặc đúng dòng auto cũ thì cập nhật sang auto mới.
  // - Dòng khách đã sửa tay thì giữ nguyên, tuyệt đối không replace substring.
  if (!currentTrimmed || currentTrimmed === oldAutoTrimmed) {
    return nextAutoValue;
  }

  return current;
}

function isBm039FreeTextField(sectionName: SectionName, fieldName: string): boolean {
  if (sectionName === "agency") {
    return ["parentNameUpper", "nameUpper", "issuePlace"].includes(fieldName);
  }

  if (sectionName === "document") {
    return ["documentCode", "issuePlaceAndDateLine"].includes(fieldName);
  }

  if (sectionName === "detentionArrest") {
    return [
      "accusedName",
      "otherName",
      "offenseName",
      "legalArticle",
      "investigationAgency",
      "caseDecisionCode",
      "accusedDecisionCode",
      "genderLabel",
      "placeOfBirth",
      "nationality",
      "ethnicity",
      "religion",
      "occupation",
      "identityNo",
      "identityIssuedPlace",
      "permanentAddress",
      "temporaryAddress",
      "currentAddress",
      "detentionDurationText",
      "detentionExecutionUnitName",
      "detentionFacilityName",
      "caseDecisionLegalBasisLine",
      "accusedDecisionLegalBasisLine",
      "reasonLine",
      "detentionToDateLine",
    ].includes(fieldName);
  }

  if (sectionName === "recipients") {
    return [
      "executionAgencyLine",
      "detentionFacilityLine",
      "personLine",
      "archiveLine",
    ].includes(fieldName);
  }

  if (sectionName === "signature") {
    return ["signMode", "positionTitle", "signerName"].includes(fieldName);
  }

  if (sectionName === "legalBasis") {
    return ["procedureArticlesLine", "juvenileJusticeLine"].includes(fieldName);
  }

  return false;
}
function shouldAutoSyncSourceField(sectionName: SectionName, fieldName: string): boolean {
  if (sectionName === "agency" && fieldName === "issuePlace") return true;
  if (sectionName === "document" && fieldName === "issueDate") return true;

  if (
    sectionName === "detentionArrest" &&
    [
      "accusedName",
      "offenseName",
      "legalArticle",
      "investigationAgency",
      "caseDecisionCode",
      "caseDecisionDateText",
      "accusedDecisionCode",
      "accusedDecisionDateText",
      "detentionDurationText",
      "detentionToDateText",
      "detentionExecutionUnitName",
      "detentionFacilityName",
    ].includes(fieldName)
  ) {
    return true;
  }

  return false;
}

function syncAutoFieldsAfterMainChange(
  previous: Bm039FormInputs,
  next: Bm039FormInputs,
): Bm039FormInputs {
  const previousSynced = buildSyncedForm(previous);
  const nextBase = buildSyncedForm(next);

  const oldAuto = buildBm039GeneratedLines(previousSynced);
  const nextAuto = buildBm039GeneratedLines(nextBase);

  return {
    ...nextBase,
    detentionArrest: {
      ...nextBase.detentionArrest,
      caseDecisionLegalBasisLine: keepManualOrAuto(
        next.detentionArrest.caseDecisionLegalBasisLine,
        oldAuto.caseDecisionLegalBasisLine,
        nextAuto.caseDecisionLegalBasisLine,
        previousSynced,
        nextBase,
      ),
      accusedDecisionLegalBasisLine: keepManualOrAuto(
        next.detentionArrest.accusedDecisionLegalBasisLine,
        oldAuto.accusedDecisionLegalBasisLine,
        nextAuto.accusedDecisionLegalBasisLine,
        previousSynced,
        nextBase,
      ),
      reasonLine: keepManualOrAuto(
        next.detentionArrest.reasonLine,
        oldAuto.reasonLine,
        nextAuto.reasonLine,
        previousSynced,
        nextBase,
      ),
      detentionToDateLine: nextAuto.detentionToDateLine,
    },
    recipients: {
      ...nextBase.recipients,
      executionAgencyLine: keepManualOrAuto(
        next.recipients.executionAgencyLine,
        oldAuto.executionAgencyLine,
        nextAuto.executionAgencyLine,
        previousSynced,
        nextBase,
      ),
      detentionFacilityLine: keepManualOrAuto(
        next.recipients.detentionFacilityLine,
        oldAuto.detentionFacilityLine,
        nextAuto.detentionFacilityLine,
        previousSynced,
        nextBase,
      ),
      personLine: keepManualOrAuto(
        next.recipients.personLine,
        oldAuto.personLine,
        nextAuto.personLine,
        previousSynced,
        nextBase,
      ),
      archiveLine: text(next.recipients.archiveLine) || nextAuto.archiveLine,
    },
  };
}

function buildSyncedForm(input: Bm039FormInputs): Bm039FormInputs {
  const form: Bm039FormInputs = JSON.parse(JSON.stringify(input)) as Bm039FormInputs;

  const detention = form.detentionArrest;

  const accusedName = pickText(detention.accusedName, DEFAULT_PERSON_NAME);
  const offenseName = pickText(detention.offenseName, DEFAULT_OFFENSE_NAME);
  const legalArticle = pickText(detention.legalArticle, DEFAULT_LEGAL_ARTICLE);
  const investigationAgency = pickText(
    detention.investigationAgency,
    DEFAULT_INVESTIGATION_AGENCY,
  );

  const executionUnit = pickText(
    detention.detentionExecutionUnitName,
    DEFAULT_EXECUTION_UNIT,
  );

  const detentionFacility = pickText(
    detention.detentionFacilityName,
    DEFAULT_DETENTION_FACILITY,
  );

  const caseDecisionCode = pickText(detention.caseDecisionCode, "");
  const caseDecisionDateText = toLegalDateText(
    pickText(detention.caseDecisionDateText, form.document.issueDate),
  );

  const accusedDecisionCode = pickText(
    detention.accusedDecisionCode,
    "",
  );
  const accusedDecisionDateText = toLegalDateText(
    pickText(detention.accusedDecisionDateText, form.document.issueDate),
  );

  const includeJuvenile = Boolean(form.legalBasis.includeJuvenileJusticeLine);
  const juvenileLine = includeJuvenile
    ? pickText(
        form.legalBasis.juvenileJusticeLine,
        "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;",
      )
    : "";

  form.document.issuePlaceAndDateLine = buildIssuePlaceAndDateLine(
    form.agency.issuePlace,
    form.document.issueDate,
  );

  form.legalBasis = {
    ...form.legalBasis,
    includeJuvenileJusticeLine: includeJuvenile,
    juvenileJusticeLine: juvenileLine,
  };

  const generated = buildBm039GeneratedLines({
    ...form,
    detentionArrest: {
      ...detention,
      accusedName,
      offenseName,
      legalArticle,
      investigationAgency,
      detentionExecutionUnitName: executionUnit,
      detentionFacilityName: detentionFacility,
      caseDecisionCode,
      caseDecisionDateText,
      accusedDecisionCode,
      accusedDecisionDateText,
    },
  });

  form.detentionArrest = {
    ...detention,
    accusedName,
    offenseName,
    legalArticle,
    investigationAgency,
    detentionExecutionUnitName: executionUnit,
    detentionFacilityName: detentionFacility,
    caseDecisionCode,
    caseDecisionDateText,
    accusedDecisionCode,
    accusedDecisionDateText,
    detentionToDateText: detention.detentionToDateText,
    detentionToDateLine: generated.detentionToDateLine,
    caseDecisionLegalBasisLine: pickText(
      detention.caseDecisionLegalBasisLine,
      generated.caseDecisionLegalBasisLine,
    ),
    accusedDecisionLegalBasisLine: pickText(
      detention.accusedDecisionLegalBasisLine,
      generated.accusedDecisionLegalBasisLine,
    ),
    reasonLine: pickText(detention.reasonLine, generated.reasonLine),
  };

  form.recipients = {
    executionAgencyLine: pickText(
      form.recipients.executionAgencyLine,
      generated.executionAgencyLine,
    ),
    detentionFacilityLine: pickText(
      form.recipients.detentionFacilityLine,
      generated.detentionFacilityLine,
    ),
    personLine: pickText(form.recipients.personLine, generated.personLine),
    archiveLine: pickText(form.recipients.archiveLine, generated.archiveLine),
  };

  form.signature = {
    signMode: pickText(form.signature.signMode, "KT. VIỆN TRƯỞNG"),
    positionTitle: pickText(form.signature.positionTitle, "PHÓ VIỆN TRƯỞNG"),
    signerName: pickText(form.signature.signerName, DEFAULT_SIGNER_NAME),
  };

  return form;
}
function normalizeFormInputs(payload: Record<string, unknown>): Bm039FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const legalBasis = section(payload, "legalBasis");
  const detentionArrest = section(payload, "detentionArrest");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");
  const person = section(payload, "person");
  const offense = section(payload, "offense");
  const caseDecision = section(payload, "caseDecision");
  const accusedDecision = section(payload, "accusedDecision");
  const measure = section(payload, "measure");

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
        document.documentNo,
        EMPTY_FORM.document.documentCode,
      ),
      issueDate: normalizeLegacyBm039IssueDate(pickText(document.issueDate, EMPTY_FORM.document.issueDate)),
      issuePlaceAndDateLine: pickText(
        document.issuePlaceAndDateLine,
        EMPTY_FORM.document.issuePlaceAndDateLine,
      ),
    },
    legalBasis: {
      procedureArticlesLine: pickText(
        legalBasis.procedureArticlesLine,
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
      includeJuvenileJusticeLine:
        String(
          legalBasis.includeJuvenileJusticeLine ??
            legalBasis.isJuvenile ??
            "",
        )
          .trim()
          .toLowerCase() === "true" ||
        Boolean(pickText(legalBasis.juvenileJusticeLine)),
      juvenileJusticeLine: pickText(
        legalBasis.juvenileJusticeLine,
        EMPTY_FORM.legalBasis.juvenileJusticeLine,
      ),
    },
    detentionArrest: {
      accusedName: pickText(
        detentionArrest.accusedName,
        person.fullName,
        DEFAULT_PERSON_NAME,
      ),
      otherName: pickText(detentionArrest.otherName, person.otherName, EMPTY_FORM.detentionArrest.otherName),
      genderLabel: pickText(detentionArrest.genderLabel, person.genderLabel, EMPTY_FORM.detentionArrest.genderLabel),

      birthDay: pickText(detentionArrest.birthDay, person.birthDay, EMPTY_FORM.detentionArrest.birthDay),
      birthMonth: pickText(detentionArrest.birthMonth, person.birthMonth, EMPTY_FORM.detentionArrest.birthMonth),
      birthYear: pickText(detentionArrest.birthYear, person.birthYear, EMPTY_FORM.detentionArrest.birthYear),
      placeOfBirth: pickText(detentionArrest.placeOfBirth, person.placeOfBirth, EMPTY_FORM.detentionArrest.placeOfBirth),

      nationality: pickText(detentionArrest.nationality, person.nationality, EMPTY_FORM.detentionArrest.nationality),
      ethnicity: pickText(detentionArrest.ethnicity, person.ethnicity, EMPTY_FORM.detentionArrest.ethnicity),
      religion: pickText(detentionArrest.religion, person.religion, EMPTY_FORM.detentionArrest.religion),
      occupation: pickText(detentionArrest.occupation, person.occupation, EMPTY_FORM.detentionArrest.occupation),

      identityNo: pickText(detentionArrest.identityNo, person.identityNo, EMPTY_FORM.detentionArrest.identityNo),
      identityIssuedDay: pickText(detentionArrest.identityIssuedDay, person.identityIssuedDay, EMPTY_FORM.detentionArrest.identityIssuedDay),
      identityIssuedMonth: pickText(detentionArrest.identityIssuedMonth, person.identityIssuedMonth, EMPTY_FORM.detentionArrest.identityIssuedMonth),
      identityIssuedYear: pickText(detentionArrest.identityIssuedYear, person.identityIssuedYear, EMPTY_FORM.detentionArrest.identityIssuedYear),
      identityIssuedPlace: pickText(detentionArrest.identityIssuedPlace, person.identityIssuedPlace, EMPTY_FORM.detentionArrest.identityIssuedPlace),

      permanentAddress: pickText(detentionArrest.permanentAddress, person.permanentAddress, EMPTY_FORM.detentionArrest.permanentAddress),
      temporaryAddress: pickText(detentionArrest.temporaryAddress, person.temporaryAddress, EMPTY_FORM.detentionArrest.temporaryAddress),
      currentAddress: pickText(detentionArrest.currentAddress, person.currentAddress, EMPTY_FORM.detentionArrest.currentAddress),

      offenseName: pickText(detentionArrest.offenseName, offense.offenseName, DEFAULT_OFFENSE_NAME),
      legalArticle: pickText(detentionArrest.legalArticle, offense.legalArticle, DEFAULT_LEGAL_ARTICLE),
      investigationAgency: pickText(
        detentionArrest.investigationAgency,
        stripListLine(recipients.investigatingAgencyLine),
        DEFAULT_INVESTIGATION_AGENCY,
      ),

      caseDecisionCode: pickText(detentionArrest.caseDecisionCode, caseDecision.decisionNo, EMPTY_FORM.detentionArrest.caseDecisionCode),
      caseDecisionDateText: pickText(detentionArrest.caseDecisionDateText, caseDecision.issueDateText, caseDecision.issueDate, EMPTY_FORM.detentionArrest.caseDecisionDateText),
      accusedDecisionCode: pickText(detentionArrest.accusedDecisionCode, accusedDecision.decisionNo, EMPTY_FORM.detentionArrest.accusedDecisionCode),
      accusedDecisionDateText: pickText(detentionArrest.accusedDecisionDateText, accusedDecision.issueDateText, accusedDecision.issueDate, EMPTY_FORM.detentionArrest.accusedDecisionDateText),

      detentionDurationText: pickText(detentionArrest.detentionDurationText, measure.detentionDurationText, EMPTY_FORM.detentionArrest.detentionDurationText),
      detentionToDateText: pickText(detentionArrest.detentionToDateText, measure.detentionToDateText, EMPTY_FORM.detentionArrest.detentionToDateText),
      detentionToDateLine: pickText(detentionArrest.detentionToDateLine, EMPTY_FORM.detentionArrest.detentionToDateLine),

      detentionExecutionUnitName: pickText(
        detentionArrest.detentionExecutionUnitName,
        stripListLine(recipients.executionAgencyLine),
        stripListLine(recipients.detentionExecutionUnitLine),
        DEFAULT_EXECUTION_UNIT,
      ),
      detentionFacilityName: pickText(
        detentionArrest.detentionFacilityName,
        stripListLine(recipients.detentionFacilityLine),
        DEFAULT_DETENTION_FACILITY,
      ),

      caseDecisionLegalBasisLine: pickText(detentionArrest.caseDecisionLegalBasisLine),
      accusedDecisionLegalBasisLine: pickText(detentionArrest.accusedDecisionLegalBasisLine),
      reasonLine: pickText(detentionArrest.reasonLine),
    },
    recipients: {
      executionAgencyLine: pickText(recipients.executionAgencyLine),
      detentionFacilityLine: pickText(recipients.detentionFacilityLine),
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

async function getBm039RenderPayload(
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
    throw new Error(`Không tải được render-payload BM-039. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm039FormInputs(
  documentId: string | number,
  form: Bm039FormInputs,
): Promise<void> {
  const savePayload = buildSyncedForm(form);

  const juvenileLine = savePayload.legalBasis.includeJuvenileJusticeLine
    ? savePayload.legalBasis.juvenileJusticeLine ||
      "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;"
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
        person: {
          fullName: savePayload.detentionArrest.accusedName,
        },
        offense: {
          offenseName: savePayload.detentionArrest.offenseName,
          legalArticle: savePayload.detentionArrest.legalArticle,
        },
        ...savePayload,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Không lưu được dữ liệu BM-039. HTTP ${response.status}`);
  }
}


function getBm039TodayDisplayDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  return `${day}/${month}/${year}`;
}

function parseBm039DateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = String(value ?? "").trim();

  const legal = raw.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (legal) {
    return {
      day: legal[1].padStart(2, "0"),
      month: legal[2].padStart(2, "0"),
      year: legal[3],
    };
  }

  const display = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (display) {
    return {
      day: display[1].padStart(2, "0"),
      month: display[2].padStart(2, "0"),
      year: display[3],
    };
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return {
      day: iso[3].padStart(2, "0"),
      month: iso[2].padStart(2, "0"),
      year: iso[1],
    };
  }

  return {
    day: "",
    month: "",
    year: "",
  };
}

function buildBm039DisplayDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function normalizeLegacyBm039IssueDate(value: string): string {
  const raw = String(value ?? "").trim();

  if (!raw || raw === "25/05/2026" || raw === "2026-05-25") {
    return getBm039TodayDisplayDate();
  }

  return raw;
}

function Bm039DateSelectField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const parsed = parseBm039DateParts(value || getBm039TodayDisplayDate());

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 121 }, (_, index) =>
    String(currentYear - 100 + index),
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

    if (next.day && next.month && next.year) {
      onChange(buildBm039DisplayDate(next.day, next.month, next.year));
    }
  };

  const selectClass =
    "mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
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
    </label>
  );
}

function Bm039DatePartsSelectField({
  label,
  day,
  month,
  year,
  onChange,
  required = false,
}: {
  label: string;
  day: string;
  month: string;
  year: string;
  onChange: (value: { day: string; month: string; year: string }) => void;
  required?: boolean;
}) {
  const current = {
    day: String(day ?? "").padStart(String(day ?? "").length > 0 ? 2 : 0, "0"),
    month: String(month ?? "").padStart(String(month ?? "").length > 0 ? 2 : 0, "0"),
    year: String(year ?? ""),
  };

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 121 }, (_, index) =>
    String(currentYear - 100 + index),
  );

  const updatePart = (
    patch: Partial<{
      day: string;
      month: string;
      year: string;
    }>,
  ) => {
    onChange({
      ...current,
      ...patch,
    });
  };

  const selectClass =
    "mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <div className="block md:col-span-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>

      <div className="grid gap-2 md:grid-cols-3">
        <select
          className={selectClass}
          value={current.day}
          onChange={(event) => updatePart({ day: event.target.value })}
        >
          <option value="">Ngày</option>
          {dayOptions.map((nextDay) => (
            <option key={nextDay} value={nextDay}>
              {Number(nextDay)}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={current.month}
          onChange={(event) => updatePart({ month: event.target.value })}
        >
          <option value="">Tháng</option>
          {monthOptions.map((nextMonth) => (
            <option key={nextMonth} value={nextMonth}>
              {Number(nextMonth)}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={current.year}
          onChange={(event) => updatePart({ year: event.target.value })}
        >
          <option value="">Năm</option>
          {yearOptions.map((nextYear) => (
            <option key={nextYear} value={nextYear}>
              {nextYear}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Bm039PreviewTable({
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
function TextInput({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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

function TextArea({
  label,
  value,
  onChange,
  required = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
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


export function Bm039FormInputsPanel({
  documentId,
  onSaved,
}: Bm039FormInputsPanelProps) {
  const casePayload = useCasePayload();
  const [form, setForm] = useState<Bm039FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const syncedForm = useMemo(() => buildSyncedForm(form), [form]);
  const isDirty = JSON.stringify(syncedForm) !== initialSnapshot;
  const hasCasePayloadData = Boolean(
    casePayload?.case ||
      casePayload?.people.length ||
      casePayload?.offenses.length ||
      casePayload?.assignments.length,
  );

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      return !getValue(syncedForm, item.section, item.field).trim();
    });
  }, [syncedForm]);

  const applyCasePayloadDefaults = useCallback(
    (
      sourceForm: Bm039FormInputs,
      overwrite = false,
    ): {
      form: Bm039FormInputs;
      appliedFields: string[];
    } => {
      const result = applyCasePayloadToBm039Form({
        form: sourceForm,
        casePayload,
        defaultForm: EMPTY_FORM,
        overwrite,
      });

      if (result.appliedFields.length === 0) {
        return {
          form: sourceForm,
          appliedFields: result.appliedFields,
        };
      }

      return {
        form: syncAutoFieldsAfterMainChange(sourceForm, result.form),
        appliedFields: result.appliedFields,
      };
    },
    [casePayload],
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const payload = await getBm039RenderPayload(documentId);
        const normalizedForm = normalizeFormInputs(payload);
        const caseApplied = applyCasePayloadDefaults(normalizedForm);

        if (!isMounted) {
          return;
        }

        setForm(caseApplied.form);
        setInitialSnapshot(JSON.stringify(buildSyncedForm(normalizedForm)));

        if (caseApplied.appliedFields.length > 0) {
          setSuccessMessage(
            `Đã tự lấy ${caseApplied.appliedFields.length} trường từ vụ án. Bấm lưu để ghi vào backend.`,
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-039.");
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
  }, [applyCasePayloadDefaults, documentId]);

  function updateField<TSection extends SectionName>(
    sectionName: TSection,
    fieldName: keyof Bm039FormInputs[TSection],
    value: string | boolean,
  ) {
    setForm((current) => {
      const fieldKey = String(fieldName);

      const next = {
        ...current,
        [sectionName]: {
          ...current[sectionName],
          [fieldName]: value,
        },
      } as Bm039FormInputs;

      const shouldSync = shouldAutoSyncSourceField(sectionName, fieldKey);

      if (typeof value === "string") {
        const isFreeText = isBm039FreeTextField(sectionName, fieldKey);

        // Khi đang gõ dấu cách, không chạy sync/fallback.
        if (isFreeText && /\s$/u.test(value)) {
          return next;
        }

        // Khi xóa trắng để nhập lại, không tự bật về default.
        if (shouldSync && value.trim() === "") {
          return next;
        }
      }

      return shouldSync
        ? syncAutoFieldsAfterMainChange(current, next)
        : next;
    });
  }

  function fillCustomerSample() {
    const sample = buildSyncedForm(EMPTY_FORM);

    setForm(sample);
    setSuccessMessage("Đã điền dữ liệu mẫu BM-039. Bấm lưu để ghi vào backend.");
    setErrorMessage("");
  }

  function fillFromCasePayload() {
    const caseApplied = applyCasePayloadDefaults(form);

    if (caseApplied.appliedFields.length === 0) {
      setSuccessMessage("Không có trường trống/default nào để lấy thêm từ vụ án.");
      setErrorMessage("");
      return;
    }

    setForm(caseApplied.form);
    setSuccessMessage(
      `Đã lấy ${caseApplied.appliedFields.length} trường từ vụ án. Bấm lưu để ghi vào backend.`,
    );
    setErrorMessage("");
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const savePayload = buildSyncedForm(form);
      await saveBm039FormInputs(documentId, savePayload);

      setForm(savePayload);
      setInitialSnapshot(JSON.stringify(savePayload));
      setSuccessMessage("Đã lưu dữ liệu BM-039. Có thể render lại DOCX/PDF.");
      onSaved?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được dữ liệu BM-039.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu BM-039...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          BM-039
        </p>
        <h2 className="mt-2 text-xl font-bold text-emerald-950">
          Dữ liệu biểu mẫu Lệnh bắt bị can để tạm giam
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Tên bị can chỉ nhập một lần tại ô Họ tên. Các dòng căn cứ, lý do,
          Điều 3 và nơi nhận tự đồng bộ trước khi lưu/render.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillFromCasePayload}
            disabled={!hasCasePayloadData}
            className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            Lấy từ vụ án
          </button>

          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-039
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-039"}
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
        description="Ngày ban hành có thể sửa. Dòng địa danh, ngày tháng năm sẽ tự format."
      >
        <BmFieldText
          label="Cơ quan cấp trên"
          value={form.agency.parentNameUpper}
          onChange={(value) => updateField("agency", "parentNameUpper", value)}
          required
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          value={form.agency.nameUpper}
          onChange={(value) => updateField("agency", "nameUpper", value)}
          required
        />
        <BmFieldText
          label="Số lệnh"
          value={form.document.documentCode}
          onChange={(value) => updateField("document", "documentCode", value)}
          required
        />
        <Bm039DateSelectField
          label="Ngày ban hành"
          value={form.document.issueDate || getBm039TodayDisplayDate()}
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

      <BmFormSection title="2. Căn cứ vụ án / tội danh">
        <BmFieldText
          label="Tên tội"
          value={form.detentionArrest.offenseName}
          onChange={(value) => updateField("detentionArrest", "offenseName", value)}
        />
        <BmFieldText
          label="Điều luật"
          value={form.detentionArrest.legalArticle}
          onChange={(value) => updateField("detentionArrest", "legalArticle", value)}
        />
        <BmFieldText
          label="Cơ quan điều tra"
          value={form.detentionArrest.investigationAgency}
          onChange={(value) => updateField("detentionArrest", "investigationAgency", value)}
        />
        <BmFieldText
          label="Số quyết định khởi tố vụ án"
          value={form.detentionArrest.caseDecisionCode}
          onChange={(value) => updateField("detentionArrest", "caseDecisionCode", value)}
        />
        <Bm039DateSelectField
          label="Ngày quyết định khởi tố vụ án"
          value={form.detentionArrest.caseDecisionDateText}
          onChange={(value) => updateField("detentionArrest", "caseDecisionDateText", value)}
        />
        <BmFieldText
          label="Số quyết định khởi tố bị can"
          value={form.detentionArrest.accusedDecisionCode}
          onChange={(value) => updateField("detentionArrest", "accusedDecisionCode", value)}
        />
        <Bm039DateSelectField
          label="Ngày quyết định khởi tố bị can"
          value={form.detentionArrest.accusedDecisionDateText}
          onChange={(value) => updateField("detentionArrest", "accusedDecisionDateText", value)}
        />
        <BmFieldTextarea
          label="Căn cứ BLTTHS"
          value={form.legalBasis.procedureArticlesLine}
          onChange={(value) => updateField("legalBasis", "procedureArticlesLine", value)}
          required
        />
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                      ? current.legalBasis.juvenileJusticeLine ||
                        "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;"
                      : "",
                  },
                }));
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Có áp dụng căn cứ Luật Tư pháp người chưa thành niên
          </label>

          {form.legalBasis.includeJuvenileJusticeLine ? (
            <div className="mt-4">
              <BmFieldTextarea
                label="Căn cứ Luật Tư pháp người chưa thành niên"
                value={form.legalBasis.juvenileJusticeLine}
                onChange={(value) => updateField("legalBasis", "juvenileJusticeLine", value)}
                rows={3}
              />
            </div>
          ) : null}
        </div>
      </BmFormSection>

      <BmFormSection
        title="3. Lý lịch bị can"
        description="Chỉ có một ô Họ tên bị can. Các nơi khác tự đồng bộ theo ô này."
      >
        <BmFieldText
          label="Họ tên bị can"
          value={form.detentionArrest.accusedName}
          onChange={(value) => updateField("detentionArrest", "accusedName", value)}
          required
        />
        <SelectInput
          label="Giới tính"
          value={form.detentionArrest.genderLabel}
          onChange={(value) => updateField("detentionArrest", "genderLabel", value)}
          options={[
            { label: "Nam", value: "Nam" },
            { label: "Nữ", value: "Nữ" },
            { label: "Khác", value: "Khác" },
          ]}
        />
        <BmFieldText
          label="Tên gọi khác"
          value={form.detentionArrest.otherName}
          onChange={(value) => updateField("detentionArrest", "otherName", value)}
        />
        <Bm039DatePartsSelectField
          label="Ngày sinh"
          day={form.detentionArrest.birthDay}
          month={form.detentionArrest.birthMonth}
          year={form.detentionArrest.birthYear}
          onChange={(value) => {
            updateField("detentionArrest", "birthDay", value.day);
            updateField("detentionArrest", "birthMonth", value.month);
            updateField("detentionArrest", "birthYear", value.year);
          }}
          required
        />
        <BmFieldText
          label="Nơi sinh"
          value={form.detentionArrest.placeOfBirth}
          onChange={(value) => updateField("detentionArrest", "placeOfBirth", value)}
        />
        <BmFieldText
          label="Quốc tịch"
          value={form.detentionArrest.nationality}
          onChange={(value) => updateField("detentionArrest", "nationality", value)}
        />
        <BmFieldText
          label="Dân tộc"
          value={form.detentionArrest.ethnicity}
          onChange={(value) => updateField("detentionArrest", "ethnicity", value)}
        />
        <BmFieldText
          label="Tôn giáo"
          value={form.detentionArrest.religion}
          onChange={(value) => updateField("detentionArrest", "religion", value)}
        />
        <BmFieldText
          label="Nghề nghiệp"
          value={form.detentionArrest.occupation}
          onChange={(value) => updateField("detentionArrest", "occupation", value)}
        />
        <BmFieldText
          label="Số CCCD/CMND/Hộ chiếu"
          value={form.detentionArrest.identityNo}
          onChange={(value) => updateField("detentionArrest", "identityNo", value)}
        />
        <Bm039DatePartsSelectField
          label="Ngày cấp CCCD/CMND/Hộ chiếu"
          day={form.detentionArrest.identityIssuedDay}
          month={form.detentionArrest.identityIssuedMonth}
          year={form.detentionArrest.identityIssuedYear}
          onChange={(value) => {
            updateField("detentionArrest", "identityIssuedDay", value.day);
            updateField("detentionArrest", "identityIssuedMonth", value.month);
            updateField("detentionArrest", "identityIssuedYear", value.year);
          }}
        />
        <BmFieldTextarea
          label="Nơi cấp"
          value={form.detentionArrest.identityIssuedPlace}
          onChange={(value) => updateField("detentionArrest", "identityIssuedPlace", value)}
        />
        <BmFieldTextarea
          label="Nơi thường trú"
          value={form.detentionArrest.permanentAddress}
          onChange={(value) => updateField("detentionArrest", "permanentAddress", value)}
        />
        <BmFieldTextarea
          label="Nơi tạm trú"
          value={form.detentionArrest.temporaryAddress}
          onChange={(value) => updateField("detentionArrest", "temporaryAddress", value)}
        />
        <BmFieldTextarea
          label="Nơi ở hiện tại"
          value={form.detentionArrest.currentAddress}
          onChange={(value) => updateField("detentionArrest", "currentAddress", value)}
        />
      </BmFormSection>

      <BmFormSection title="4. Thời hạn / thi hành">
        <BmFieldText
          label="Thời hạn tạm giam"
          value={form.detentionArrest.detentionDurationText}
          onChange={(value) => updateField("detentionArrest", "detentionDurationText", value)}
          placeholder="02 tháng"
        />
        <Bm039DateSelectField
          label="Đến ngày"
          value={form.detentionArrest.detentionToDateText}
          onChange={(value) => updateField("detentionArrest", "detentionToDateText", value)}
        />
        <BmFieldText
          label="Cơ quan thi hành Lệnh"
          value={form.detentionArrest.detentionExecutionUnitName}
          onChange={(value) =>
            updateField("detentionArrest", "detentionExecutionUnitName", value)
          }
        />
        <BmFieldText
          label="Cơ sở giam giữ"
          value={form.detentionArrest.detentionFacilityName}
          onChange={(value) =>
            updateField("detentionArrest", "detentionFacilityName", value)
          }
        />
      </BmFormSection>

      <BmFormSection
        title="5. Dòng sẽ render"
        description="Các dòng này tự đồng bộ. Chỉ sửa khi cần kiểm tra câu chữ trước khi lưu."
      >
        <BmFieldTextarea
          label="Căn cứ khởi tố vụ án"
          value={form.detentionArrest.caseDecisionLegalBasisLine}
          onChange={(value) =>
            updateField("detentionArrest", "caseDecisionLegalBasisLine", value)
          }
          rows={4}
        />
        <BmFieldTextarea
          label="Căn cứ khởi tố bị can"
          value={form.detentionArrest.accusedDecisionLegalBasisLine}
          onChange={(value) =>
            updateField("detentionArrest", "accusedDecisionLegalBasisLine", value)
          }
          rows={4}
        />
        <BmFieldTextarea
          label="Xét thấy"
          value={form.detentionArrest.reasonLine}
          onChange={(value) => updateField("detentionArrest", "reasonLine", value)}
        />

        <BmFieldText
          label="Nơi nhận - cơ quan thi hành"
          value={form.recipients.executionAgencyLine}
          onChange={(value) => updateField("recipients", "executionAgencyLine", value)}
        />
        <BmFieldText
          label="Nơi nhận - cơ sở giam giữ"
          value={form.recipients.detentionFacilityLine}
          onChange={(value) => updateField("recipients", "detentionFacilityLine", value)}
        />
        <BmFieldText
          label="Nơi nhận - bị can"
          value={form.recipients.personLine}
          onChange={(value) => updateField("recipients", "personLine", value)}
        />
        <BmFieldText
          label="Nơi nhận - lưu"
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
        />
      </BmFormSection>

      {/* BM-039_PREVIEW_BLOCK_START */}
      <BmFormSection
        title="Preview trước khi render"
        description="Bảng này cho khách xem nhanh các dòng chính sẽ đưa vào DOCX/PDF. Các ô dài ở phần trên vẫn là nơi chỉnh sửa chính."
      >
        <Bm039PreviewTable
          title="Căn cứ và lý do"
          rows={[
            {
              label: "Căn cứ tố tụng",
              value: syncedForm.legalBasis.procedureArticlesLine,
            },
            {
              label: "Căn cứ người chưa thành niên",
              value: syncedForm.legalBasis.juvenileJusticeLine || "(không áp dụng)",
            },
            {
              label: "Căn cứ khởi tố vụ án",
              value: syncedForm.detentionArrest.caseDecisionLegalBasisLine,
            },
            {
              label: "Căn cứ khởi tố bị can",
              value: syncedForm.detentionArrest.accusedDecisionLegalBasisLine,
            },
            {
              label: "Xét thấy",
              value: syncedForm.detentionArrest.reasonLine,
            },
          ]}
        />

        <Bm039PreviewTable
          title="Nội dung lệnh"
          rows={[
            {
              label: "Bị can",
              value: `${syncedForm.detentionArrest.accusedName} - ${syncedForm.detentionArrest.genderLabel}`,
            },
            {
              label: "Tội danh / điều luật",
              value: `${syncedForm.detentionArrest.offenseName} - ${syncedForm.detentionArrest.legalArticle}`,
            },
            {
              label: "Thời hạn",
              value: `Thời hạn tạm giam ${syncedForm.detentionArrest.detentionDurationText}, kể từ ngày bắt được bị can ${syncedForm.detentionArrest.detentionToDateLine}`,
            },
            {
              label: "Điều 2",
              value: `Yêu cầu ${syncedForm.detentionArrest.detentionExecutionUnitName} thi hành Lệnh này theo quy định của Bộ luật Tố tụng hình sự.`,
            },
            {
              label: "Điều 3",
              value: `Yêu cầu ${syncedForm.detentionArrest.detentionFacilityName} tạm giam bị can ${syncedForm.detentionArrest.accusedName} cho đến khi có Lệnh/Quyết định mới./.`,
            },
          ]}
        />

        <Bm039PreviewTable
          title="Nơi nhận / chữ ký"
          rows={[
            {
              label: "Nơi nhận - cơ quan thi hành",
              value: syncedForm.recipients.executionAgencyLine,
            },
            {
              label: "Nơi nhận - cơ sở giam giữ",
              value: syncedForm.recipients.detentionFacilityLine,
            },
            {
              label: "Nơi nhận - bị can",
              value: syncedForm.recipients.personLine,
            },
            {
              label: "Lưu",
              value: syncedForm.recipients.archiveLine,
            },
            {
              label: "Chữ ký",
              value: `${syncedForm.signature.signMode}\n${syncedForm.signature.positionTitle}\n${syncedForm.signature.signerName}`,
            },
          ]}
        />
      </BmFormSection>
      {/* BM-039_PREVIEW_BLOCK_END */}
      <BmFormSection title="6. Chữ ký">
        <BmFieldText
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          required
        />
        <BmFieldText
          label="Chức danh"
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
    </section>
  );
}
