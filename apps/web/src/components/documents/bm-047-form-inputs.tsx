"use client";

/**
 * BM-047 — Quyết định về việc bảo lĩnh
 * Stage: BP_NGAN_CHAN, Group: G02. TT 03/2026-VKSTC, Mẫu số 47/HS.
 *
 * Căn cứ: Điều 41, 121, 236 và 241 BLTTHS; Điều 135 Luật Tư pháp NCTVN.
 * Nghiệp vụ: VKS phê duyệt đề nghị áp dụng biện pháp bảo lĩnh do CQĐT trình,
 * xác định thời hạn bảo lĩnh, nghĩa vụ của bị can và người nhận bảo lĩnh.
 */
import { useEffect, useMemo, useState } from "react";
import {
  BmFormSection,
  BmFieldText,
  BmFieldTextarea,
  BmFormStatus,
  BmFormMetaBar,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

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

type OfficialForm = {
  issuerTitle: string;
};

type LegalBasisForm = {
  procedureArticlesLine: string;
  juvenileJusticeLine: string;
};

type GuaranteeApprovalForm = {
  investigationAuthority: string;
  defendantName: string;
  guarantorName: string;
  offenseName: string;
  offenseLegalLine: string;
  caseInitiationCode: string;
  caseInitiationDateLine: string;
  defendantInitiationCode: string;
  defendantInitiationDateLine: string;
  guaranteeDuration: string;
  guaranteeStartDateLine: string;
  guaranteeEndDateLine: string;
  caseInitiationLine: string;
  defendantInitiationLine: string;
  sufficientGroundsLine: string;
  assignmentLine: string;
  guaranteePeriodLine: string;
  article2Line: string;
};

type DefendantForm = {
  fullName: string;
  gender: string;
  aliasName: string;
  birthDateLine: string;
  birthPlace: string;
  nationality: string;
  ethnicity: string;
  religion: string;
  occupation: string;
  identityNumber: string;
  identityIssueDateLine: string;
  identityIssuePlace: string;
  permanentResidence: string;
  temporaryResidence: string;
  currentResidence: string;
};

type RecipientsForm = {
  defendantLine: string;
  guarantorLine: string;
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm047Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  guaranteeApproval: GuaranteeApprovalForm;
  defendant: DefendantForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm047FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

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

const EMPTY_FORM: Bm047Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "47/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 121, 236 và 241 của Bộ luật Tố tụng hình sự;",
    juvenileJusticeLine:
      "Căn cứ Điều 135 của Luật Tư pháp người chưa thành niên;",
  },
  guaranteeApproval: {
    investigationAuthority:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    defendantName: "",
    guarantorName: "",
    offenseName: "",
    offenseLegalLine: "quy định tại khoản 1 Điều 321 của Bộ luật Hình sự",
    caseInitiationCode: "01/QĐ-CSĐT",
    caseInitiationDateLine: todayDateLine(),
    defendantInitiationCode: "02/QĐ-CSĐT",
    defendantInitiationDateLine: todayDateLine(),
    guaranteeDuration: "02 tháng",
    guaranteeStartDateLine: todayDateLine(),
    guaranteeEndDateLine: "ngày 4 tháng 8 năm 2026",
    caseInitiationLine:
      "Căn cứ Quyết định khởi tố vụ án hình sự số 01/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;",
    defendantInitiationLine:
      "Căn cứ Quyết định khởi tố bị can số 02/QĐ-CSĐT " +
      todayDateLine() +
      " của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây đối với  về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự;",
    sufficientGroundsLine:
      "Xét thấy có đủ căn cứ, điều kiện áp dụng biện pháp bảo lĩnh đối với bị can ,",
    assignmentLine: "Giao cho  được nhận bảo lĩnh cho bị can:",
    guaranteePeriodLine:
      "Thời hạn bảo lĩnh: 02 tháng, kể từ " +
      todayDateLine() +
      " đến ngày 4 tháng 8 năm 2026.",
    article2Line:
      "Yêu cầu  và  thực hiện đầy đủ nghĩa vụ theo giấy cam đoan; nếu bị can  vi phạm thì bị áp dụng biện pháp tạm giam; nếu  để bị can vi phạm nghĩa vụ đã cam đoan thì tùy tính chất, mức độ vi phạm sẽ bị phạt tiền theo quy định của pháp luật./.",
  },
  defendant: {
    fullName: "",
    gender: "Nam",
    aliasName: "Không",
    birthDateLine: "01 tháng 01 năm 1990",
    birthPlace: "TP. Hồ Chí Minh",
    nationality: "Việt Nam",
    ethnicity: "Kinh",
    religion: "Không",
    occupation: "Lao động tự do",
    identityNumber: "079090000001",
    identityIssueDateLine: "01 tháng 01 năm 2021",
    identityIssuePlace: "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
    permanentResidence:
      "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
    temporaryResidence: "Không",
    currentResidence:
      "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
  },
  recipients: {
    defendantLine: "",
    guarantorLine: "",
    archiveLine: "Lưu: HSVA, HSKS, VP",
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

  return `${cleanText(issuePlace)}, ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
}

function stripRecipientLine(value: string): string {
  return cleanText(value)
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function buildGeneratedLines(form: Bm047Form): Partial<GuaranteeApprovalForm> {
  const guarantee = form.guaranteeApproval;

  const investigationAuthority =
    cleanText(guarantee.investigationAuthority) ||
    EMPTY_FORM.guaranteeApproval.investigationAuthority;

  const defendantName =
    cleanText(form.defendant.fullName) ||
    cleanText(guarantee.defendantName) ||
    EMPTY_FORM.defendant.fullName;

  const guarantorName =
    cleanText(guarantee.guarantorName) ||
    EMPTY_FORM.guaranteeApproval.guarantorName;

  const offenseName =
    cleanText(guarantee.offenseName) ||
    EMPTY_FORM.guaranteeApproval.offenseName;

  const offenseLegalLine =
    cleanText(guarantee.offenseLegalLine) ||
    EMPTY_FORM.guaranteeApproval.offenseLegalLine;

  const caseInitiationCode =
    cleanText(guarantee.caseInitiationCode) ||
    EMPTY_FORM.guaranteeApproval.caseInitiationCode;

  const caseInitiationDateLine =
    cleanText(guarantee.caseInitiationDateLine) ||
    EMPTY_FORM.guaranteeApproval.caseInitiationDateLine;

  const defendantInitiationCode =
    cleanText(guarantee.defendantInitiationCode) ||
    EMPTY_FORM.guaranteeApproval.defendantInitiationCode;

  const defendantInitiationDateLine =
    cleanText(guarantee.defendantInitiationDateLine) ||
    EMPTY_FORM.guaranteeApproval.defendantInitiationDateLine;

  const guaranteeDuration =
    cleanText(guarantee.guaranteeDuration) ||
    EMPTY_FORM.guaranteeApproval.guaranteeDuration;

  const guaranteeStartDateLine =
    cleanText(guarantee.guaranteeStartDateLine) ||
    EMPTY_FORM.guaranteeApproval.guaranteeStartDateLine;

  const guaranteeEndDateLine =
    cleanText(guarantee.guaranteeEndDateLine) ||
    EMPTY_FORM.guaranteeApproval.guaranteeEndDateLine;

  return {
    defendantName,
    caseInitiationLine:
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseInitiationCode} ${caseInitiationDateLine} của ${investigationAuthority} về tội ${offenseName} ${offenseLegalLine};`,
    defendantInitiationLine:
      `Căn cứ Quyết định khởi tố bị can số ${defendantInitiationCode} ${defendantInitiationDateLine} của ${investigationAuthority} đối với ${defendantName} về tội ${offenseName} ${offenseLegalLine};`,
    sufficientGroundsLine:
      `Xét thấy có đủ căn cứ, điều kiện áp dụng biện pháp bảo lĩnh đối với bị can ${defendantName},`,
    assignmentLine:
      `Giao cho ${guarantorName} được nhận bảo lĩnh cho bị can:`,
    guaranteePeriodLine:
      `Thời hạn bảo lĩnh: ${guaranteeDuration}, kể từ ${guaranteeStartDateLine} đến ${guaranteeEndDateLine}.`,
    article2Line:
      `Yêu cầu ${defendantName} và ${guarantorName} thực hiện đầy đủ nghĩa vụ theo giấy cam đoan; nếu bị can ${defendantName} vi phạm thì bị áp dụng biện pháp tạm giam; nếu ${guarantorName} để bị can vi phạm nghĩa vụ đã cam đoan thì tùy tính chất, mức độ vi phạm sẽ bị phạt tiền theo quy định của pháp luật./.`,
  };
}

function normalizeFormInputs(form: Bm047Form): Bm047Form & {
  document: DocumentForm & { issueDate: string };
} {
  const normalizedDate = normalizeDisplayDate(form.document.issueDateText);
  const nextIssueLine = issuePlaceAndDateLine(
    form.document.issuePlace,
    normalizedDate,
  );

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
    official: {
      issuerTitle:
        cleanText(form.official.issuerTitle) || EMPTY_FORM.official.issuerTitle,
    },
    legalBasis: {
      procedureArticlesLine:
        cleanText(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      juvenileJusticeLine:
        cleanText(form.legalBasis.juvenileJusticeLine) ||
        EMPTY_FORM.legalBasis.juvenileJusticeLine,
    },
    guaranteeApproval: {
      investigationAuthority: cleanText(form.guaranteeApproval.investigationAuthority),
      defendantName: cleanText(form.defendant.fullName),
      guarantorName: cleanText(form.guaranteeApproval.guarantorName),
      offenseName: cleanText(form.guaranteeApproval.offenseName),
      offenseLegalLine: cleanText(form.guaranteeApproval.offenseLegalLine),
      caseInitiationCode: cleanText(form.guaranteeApproval.caseInitiationCode),
      caseInitiationDateLine: cleanText(form.guaranteeApproval.caseInitiationDateLine),
      defendantInitiationCode: cleanText(form.guaranteeApproval.defendantInitiationCode),
      defendantInitiationDateLine: cleanText(form.guaranteeApproval.defendantInitiationDateLine),
      guaranteeDuration: cleanText(form.guaranteeApproval.guaranteeDuration),
      guaranteeStartDateLine: cleanText(form.guaranteeApproval.guaranteeStartDateLine),
      guaranteeEndDateLine: cleanText(form.guaranteeApproval.guaranteeEndDateLine),
      caseInitiationLine: cleanText(form.guaranteeApproval.caseInitiationLine),
      defendantInitiationLine: cleanText(form.guaranteeApproval.defendantInitiationLine),
      sufficientGroundsLine: cleanText(form.guaranteeApproval.sufficientGroundsLine),
      assignmentLine: cleanText(form.guaranteeApproval.assignmentLine),
      guaranteePeriodLine: cleanText(form.guaranteeApproval.guaranteePeriodLine),
      article2Line: cleanText(form.guaranteeApproval.article2Line),
    },
    defendant: {
      fullName: cleanText(form.defendant.fullName),
      gender: cleanText(form.defendant.gender),
      aliasName: cleanText(form.defendant.aliasName),
      birthDateLine: cleanText(form.defendant.birthDateLine),
      birthPlace: cleanText(form.defendant.birthPlace),
      nationality: cleanText(form.defendant.nationality),
      ethnicity: cleanText(form.defendant.ethnicity),
      religion: cleanText(form.defendant.religion),
      occupation: cleanText(form.defendant.occupation),
      identityNumber: cleanText(form.defendant.identityNumber),
      identityIssueDateLine: cleanText(form.defendant.identityIssueDateLine),
      identityIssuePlace: cleanText(form.defendant.identityIssuePlace),
      permanentResidence: cleanText(form.defendant.permanentResidence),
      temporaryResidence: cleanText(form.defendant.temporaryResidence),
      currentResidence: cleanText(form.defendant.currentResidence),
    },
    recipients: {
      defendantLine: stripRecipientLine(form.recipients.defendantLine),
      guarantorLine: stripRecipientLine(form.recipients.guarantorLine),
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

function buildFormFromPayload(payload: unknown): Bm047Form {
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

  return normalizeFormInputs({
    agency: {
      parentName: pickString(formInputs, payload, "agency.parentName", EMPTY_FORM.agency.parentName),
      name: pickString(formInputs, payload, "agency.name", EMPTY_FORM.agency.name),
      bodyName: pickString(formInputs, payload, "agency.bodyName", EMPTY_FORM.agency.bodyName),
      shortName: pickString(formInputs, payload, "agency.shortName", EMPTY_FORM.agency.shortName),
    },
    document: {
      documentCode: pickString(formInputs, payload, "document.documentCode", EMPTY_FORM.document.documentCode),
      issuePlace,
      issueDateText,
      issuePlaceAndDateLine: issueLine,
    },
    official: {
      issuerTitle: pickString(formInputs, payload, "official.issuerTitle", EMPTY_FORM.official.issuerTitle),
    },
    legalBasis: {
      procedureArticlesLine: pickString(
        formInputs,
        payload,
        "legalBasis.procedureArticlesLine",
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
      juvenileJusticeLine: pickString(
        formInputs,
        payload,
        "legalBasis.juvenileJusticeLine",
        EMPTY_FORM.legalBasis.juvenileJusticeLine,
      ),
    },
    guaranteeApproval: {
      investigationAuthority: pickString(
        formInputs,
        payload,
        "guaranteeApproval.investigationAuthority",
        EMPTY_FORM.guaranteeApproval.investigationAuthority,
      ),
      defendantName: pickString(
        formInputs,
        payload,
        "guaranteeApproval.defendantName",
        EMPTY_FORM.guaranteeApproval.defendantName,
      ),
      guarantorName: pickString(
        formInputs,
        payload,
        "guaranteeApproval.guarantorName",
        EMPTY_FORM.guaranteeApproval.guarantorName,
      ),
      offenseName: pickString(
        formInputs,
        payload,
        "guaranteeApproval.offenseName",
        EMPTY_FORM.guaranteeApproval.offenseName,
      ),
      offenseLegalLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.offenseLegalLine",
        EMPTY_FORM.guaranteeApproval.offenseLegalLine,
      ),
      caseInitiationCode: pickString(
        formInputs,
        payload,
        "guaranteeApproval.caseInitiationCode",
        EMPTY_FORM.guaranteeApproval.caseInitiationCode,
      ),
      caseInitiationDateLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.caseInitiationDateLine",
        EMPTY_FORM.guaranteeApproval.caseInitiationDateLine,
      ),
      defendantInitiationCode: pickString(
        formInputs,
        payload,
        "guaranteeApproval.defendantInitiationCode",
        EMPTY_FORM.guaranteeApproval.defendantInitiationCode,
      ),
      defendantInitiationDateLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.defendantInitiationDateLine",
        EMPTY_FORM.guaranteeApproval.defendantInitiationDateLine,
      ),
      guaranteeDuration: pickString(
        formInputs,
        payload,
        "guaranteeApproval.guaranteeDuration",
        EMPTY_FORM.guaranteeApproval.guaranteeDuration,
      ),
      guaranteeStartDateLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.guaranteeStartDateLine",
        EMPTY_FORM.guaranteeApproval.guaranteeStartDateLine,
      ),
      guaranteeEndDateLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.guaranteeEndDateLine",
        EMPTY_FORM.guaranteeApproval.guaranteeEndDateLine,
      ),
      caseInitiationLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.caseInitiationLine",
        EMPTY_FORM.guaranteeApproval.caseInitiationLine,
      ),
      defendantInitiationLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.defendantInitiationLine",
        EMPTY_FORM.guaranteeApproval.defendantInitiationLine,
      ),
      sufficientGroundsLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.sufficientGroundsLine",
        EMPTY_FORM.guaranteeApproval.sufficientGroundsLine,
      ),
      assignmentLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.assignmentLine",
        EMPTY_FORM.guaranteeApproval.assignmentLine,
      ),
      guaranteePeriodLine: pickString(
        formInputs,
        payload,
        "guaranteeApproval.guaranteePeriodLine",
        EMPTY_FORM.guaranteeApproval.guaranteePeriodLine,
      ),
      article2Line: pickString(
        formInputs,
        payload,
        "guaranteeApproval.article2Line",
        EMPTY_FORM.guaranteeApproval.article2Line,
      ),
    },
    defendant: {
      fullName: pickString(
        formInputs,
        payload,
        "defendant.fullName",
        pickString(formInputs, payload, "guaranteeApproval.defendantName", EMPTY_FORM.defendant.fullName),
      ),
      gender: pickString(formInputs, payload, "defendant.gender", EMPTY_FORM.defendant.gender),
      aliasName: pickString(formInputs, payload, "defendant.aliasName", EMPTY_FORM.defendant.aliasName),
      birthDateLine: pickString(formInputs, payload, "defendant.birthDateLine", EMPTY_FORM.defendant.birthDateLine),
      birthPlace: pickString(formInputs, payload, "defendant.birthPlace", EMPTY_FORM.defendant.birthPlace),
      nationality: pickString(formInputs, payload, "defendant.nationality", EMPTY_FORM.defendant.nationality),
      ethnicity: pickString(formInputs, payload, "defendant.ethnicity", EMPTY_FORM.defendant.ethnicity),
      religion: pickString(formInputs, payload, "defendant.religion", EMPTY_FORM.defendant.religion),
      occupation: pickString(formInputs, payload, "defendant.occupation", EMPTY_FORM.defendant.occupation),
      identityNumber: pickString(formInputs, payload, "defendant.identityNumber", EMPTY_FORM.defendant.identityNumber),
      identityIssueDateLine: pickString(formInputs, payload, "defendant.identityIssueDateLine", EMPTY_FORM.defendant.identityIssueDateLine),
      identityIssuePlace: pickString(formInputs, payload, "defendant.identityIssuePlace", EMPTY_FORM.defendant.identityIssuePlace),
      permanentResidence: pickString(formInputs, payload, "defendant.permanentResidence", EMPTY_FORM.defendant.permanentResidence),
      temporaryResidence: pickString(formInputs, payload, "defendant.temporaryResidence", EMPTY_FORM.defendant.temporaryResidence),
      currentResidence: pickString(formInputs, payload, "defendant.currentResidence", EMPTY_FORM.defendant.currentResidence),
    },
    recipients: {
      defendantLine: pickString(
        formInputs,
        payload,
        "recipients.defendantLine",
        EMPTY_FORM.recipients.defendantLine,
      ),
      guarantorLine: pickString(
        formInputs,
        payload,
        "recipients.guarantorLine",
        EMPTY_FORM.recipients.guarantorLine,
      ),
      archiveLine: pickString(
        formInputs,
        payload,
        "recipients.archiveLine",
        EMPTY_FORM.recipients.archiveLine,
      ),
    },
    signature: {
      signMode: pickString(formInputs, payload, "signature.signMode", EMPTY_FORM.signature.signMode),
      positionTitle: pickString(formInputs, payload, "signature.positionTitle", EMPTY_FORM.signature.positionTitle),
      signerName: pickString(formInputs, payload, "signature.signerName", EMPTY_FORM.signature.signerName),
    },
    updatedByName: pickString(formInputs, payload, "updatedByName", DEFAULT_SIGNER_NAME),
    renderedByName: pickString(formInputs, payload, "renderedByName", DEFAULT_SIGNER_NAME),
    convertedByName: pickString(formInputs, payload, "convertedByName", DEFAULT_SIGNER_NAME),
  });
}

export function Bm047FormInputsPanel({
  documentId,
  onSaved,
}: Bm047FormInputsPanelProps) {
  const [form, setForm] = useState<Bm047Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-047 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-047.");
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

  function updateOfficial<K extends keyof OfficialForm>(key: K, value: OfficialForm[K]) {
    setForm((current) => ({
      ...current,
      official: { ...current.official, [key]: value },
    }));
  }

  function updateLegalBasis<K extends keyof LegalBasisForm>(key: K, value: LegalBasisForm[K]) {
    setForm((current) => ({
      ...current,
      legalBasis: { ...current.legalBasis, [key]: value },
    }));
  }

  function updateDefendant<K extends keyof DefendantForm>(key: K, value: DefendantForm[K]) {
    setForm((current) => {
      const nextForm: Bm047Form = {
        ...current,
        defendant: {
          ...current.defendant,
          [key]: value,
        },
      };

      if (key !== "fullName") return nextForm;

      const generatedLines = buildGeneratedLines(nextForm);
      const cleanName = cleanText(value);

      return {
        ...nextForm,
        guaranteeApproval: {
          ...nextForm.guaranteeApproval,
          defendantName: cleanName,
          defendantInitiationLine:
            generatedLines.defendantInitiationLine ??
            nextForm.guaranteeApproval.defendantInitiationLine,
          sufficientGroundsLine:
            generatedLines.sufficientGroundsLine ??
            nextForm.guaranteeApproval.sufficientGroundsLine,
          article2Line:
            generatedLines.article2Line ??
            nextForm.guaranteeApproval.article2Line,
        },
        recipients: {
          ...nextForm.recipients,
          defendantLine: cleanName,
        },
      };
    });
  }

  function updateGuarantee<K extends keyof GuaranteeApprovalForm>(
    key: K,
    value: GuaranteeApprovalForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm: Bm047Form = {
        ...current,
        guaranteeApproval: {
          ...current.guaranteeApproval,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      const generatedLines = buildGeneratedLines(nextForm);

      return {
        ...nextForm,
        guaranteeApproval: {
          ...nextForm.guaranteeApproval,
          ...generatedLines,
        },
        recipients: {
          ...nextForm.recipients,
          defendantLine: nextForm.defendant.fullName,
          guarantorLine: nextForm.guaranteeApproval.guarantorName,
        },
      };
    });
  }

  function updateGuarantorName(value: string) {
    setForm((current) => {
      const nextForm: Bm047Form = {
        ...current,
        guaranteeApproval: {
          ...current.guaranteeApproval,
          guarantorName: value,
        },
      };

      const generatedLines = buildGeneratedLines(nextForm);
      const cleanName = cleanText(value);

      return {
        ...nextForm,
        guaranteeApproval: {
          ...nextForm.guaranteeApproval,
          assignmentLine:
            generatedLines.assignmentLine ??
            nextForm.guaranteeApproval.assignmentLine,
          article2Line:
            generatedLines.article2Line ??
            nextForm.guaranteeApproval.article2Line,
        },
        recipients: {
          ...nextForm.recipients,
          guarantorLine: cleanName,
        },
      };
    });
  }

  function updateRecipients<K extends keyof RecipientsForm>(
    key: K,
    value: RecipientsForm[K],
  ) {
    setForm((current) => ({
      ...current,
      recipients: { ...current.recipients, [key]: value },
    }));
  }

  function updateSignature<K extends keyof SignatureForm>(
    key: K,
    value: SignatureForm[K],
  ) {
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
      guaranteeApproval: {
        ...current.guaranteeApproval,
        ...buildGeneratedLines(current),
      },
      recipients: {
        ...current.recipients,
        defendantLine: current.defendant.fullName,
        guarantorLine: current.guaranteeApproval.guarantorName,
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-047.");
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
    setMessage("Đang lưu formInputs BM-047...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-047",
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
          result.text || `Không lưu được BM-047. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-047. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-047 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-047"
        title="Quyết định về việc bảo lĩnh"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 47/HS · Stage BP_NGAN_CHAN (G02). Căn cứ Điều 41, 121, 236 và 241 BLTTHS; Điều 135 Luật Tư pháp NCTVN. Hai trường quan trọng nhất: Tên bị can và Người nhận bảo lĩnh — các dòng Điều 1, Điều 2, nơi nhận sẽ tự đồng bộ."
        isDirty={false}
        isLoading={status === "loading"}
        isSaving={status === "saving"}
        savedAt={null}
        errorMessage={status === "error" && message ? message : undefined}
        warningMessage={
          status === "saving"
            ? "Đang lưu formInputs BM-047..."
            : undefined
        }
        successMessage={status === "success" ? message : undefined}
        primaryLabel="Lưu dữ liệu BM-047"
        onPrimary={handleSave}
        primaryDisabled={status === "saving" || status === "loading"}
        secondaryLabel={undefined}
        onSecondary={undefined}
        extraActions={
          <>
            <BmFormCasePayloadButton<Bm047Form>
              templateCode="BM-047"
              form={form}
              onApply={(next) => setForm(next)}
            />
            <button
              type="button"
              onClick={regenerateLines}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Tự sinh lại căn cứ / Điều 1 / Điều 2
            </button>
            <button
              type="button"
              onClick={fillCustomerSample}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
            >
              Điền dữ liệu mẫu
            </button>
          </>
        }
      />

      {status === "error" && message ? (
        <BmFormStatus kind="error" title="Lỗi">
          {message}
        </BmFormStatus>
      ) : null}

      <BmFormSection
        title="1. Dữ liệu đồng bộ chính"
        description="Nhập tên ở đây. Hệ thống tự đồng bộ sang các dòng liên quan trong mẫu."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-3 text-sm font-bold text-blue-950">
              Tên bị can - đồng bộ toàn biểu mẫu
            </p>
            <BmFieldText
              label="Tên bị can"
              value={form.defendant.fullName}
              onChange={(value) => updateDefendant("fullName", value)}
            />
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-3 text-sm font-bold text-emerald-950">
              Người nhận bảo lĩnh - đồng bộ Điều 1, Điều 2, nơi nhận
            </p>
            <BmFieldText
              label="Người nhận bảo lĩnh"
              value={form.guaranteeApproval.guarantorName}
              onChange={updateGuarantorName}
            />
          </div>
        </div>
      </BmFormSection>

      <BmFormSection title="2. Cơ quan / văn bản">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateAgency("parentName", value)} />
          <BmFieldText label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateAgency("name", value)} />
          <BmFieldText label="Tên cơ quan trong thân văn bản" value={form.agency.bodyName} onChange={(value) => updateAgency("bodyName", value)} />
          <BmFieldText label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateAgency("shortName", value)} />
          <BmFieldText label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} />
          <BmFieldText label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} />
          <BmFieldText label="Ngày ban hành DD/MM/YYYY" value={form.document.issueDateText} onChange={(value) => updateDocument("issueDateText", value)} />
          <BmFieldText label="Dòng địa danh, ngày tháng" value={form.document.issuePlaceAndDateLine} onChange={(value) => updateDocument("issuePlaceAndDateLine", value)} />
        </div>
      </BmFormSection>

      <BmFormSection title="3. Chủ thể ban hành / căn cứ">
        <div className="grid gap-4">
          <BmFieldText label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={(value) => updateOfficial("issuerTitle", value)} />
          <BmFieldTextarea label="Căn cứ BLTTHS" value={form.legalBasis.procedureArticlesLine} onChange={(value) => updateLegalBasis("procedureArticlesLine", value)} rows={2} />
          <BmFieldTextarea label="Căn cứ Luật Tư pháp người chưa thành niên" value={form.legalBasis.juvenileJusticeLine} onChange={(value) => updateLegalBasis("juvenileJusticeLine", value)} rows={2} />
        </div>
      </BmFormSection>

      <BmFormSection title="4. Thông tin vụ án / bảo lĩnh">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Cơ quan điều tra" value={form.guaranteeApproval.investigationAuthority} onChange={(value) => updateGuarantee("investigationAuthority", value, true)} />
          <BmFieldText label="Tội danh" value={form.guaranteeApproval.offenseName} onChange={(value) => updateGuarantee("offenseName", value, true)} />
          <BmFieldText label="Điều luật tội danh" value={form.guaranteeApproval.offenseLegalLine} onChange={(value) => updateGuarantee("offenseLegalLine", value, true)} />
          <BmFieldText label="Số QĐ khởi tố vụ án" value={form.guaranteeApproval.caseInitiationCode} onChange={(value) => updateGuarantee("caseInitiationCode", value, true)} />
          <BmFieldText label="Ngày QĐ khởi tố vụ án" value={form.guaranteeApproval.caseInitiationDateLine} onChange={(value) => updateGuarantee("caseInitiationDateLine", value, true)} />
          <BmFieldText label="Số QĐ khởi tố bị can" value={form.guaranteeApproval.defendantInitiationCode} onChange={(value) => updateGuarantee("defendantInitiationCode", value, true)} />
          <BmFieldText label="Ngày QĐ khởi tố bị can" value={form.guaranteeApproval.defendantInitiationDateLine} onChange={(value) => updateGuarantee("defendantInitiationDateLine", value, true)} />
          <BmFieldText label="Thời hạn bảo lĩnh" value={form.guaranteeApproval.guaranteeDuration} onChange={(value) => updateGuarantee("guaranteeDuration", value, true)} />
          <BmFieldText label="Từ ngày" value={form.guaranteeApproval.guaranteeStartDateLine} onChange={(value) => updateGuarantee("guaranteeStartDateLine", value, true)} />
          <BmFieldText label="Đến ngày" value={form.guaranteeApproval.guaranteeEndDateLine} onChange={(value) => updateGuarantee("guaranteeEndDateLine", value, true)} />
        </div>
      </BmFormSection>

      <BmFormSection title="5. Thông tin bị can">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Giới tính" value={form.defendant.gender} onChange={(value) => updateDefendant("gender", value)} />
          <BmFieldText label="Tên gọi khác" value={form.defendant.aliasName} onChange={(value) => updateDefendant("aliasName", value)} />
          <BmFieldText label="Sinh ngày" value={form.defendant.birthDateLine} onChange={(value) => updateDefendant("birthDateLine", value)} />
          <BmFieldText label="Nơi sinh" value={form.defendant.birthPlace} onChange={(value) => updateDefendant("birthPlace", value)} />
          <BmFieldText label="Quốc tịch" value={form.defendant.nationality} onChange={(value) => updateDefendant("nationality", value)} />
          <BmFieldText label="Dân tộc" value={form.defendant.ethnicity} onChange={(value) => updateDefendant("ethnicity", value)} />
          <BmFieldText label="Tôn giáo" value={form.defendant.religion} onChange={(value) => updateDefendant("religion", value)} />
          <BmFieldText label="Nghề nghiệp" value={form.defendant.occupation} onChange={(value) => updateDefendant("occupation", value)} />
          <BmFieldText label="Số CMND/CCCD/Hộ chiếu" value={form.defendant.identityNumber} onChange={(value) => updateDefendant("identityNumber", value)} />
          <BmFieldText label="Ngày cấp" value={form.defendant.identityIssueDateLine} onChange={(value) => updateDefendant("identityIssueDateLine", value)} />
          <BmFieldText label="Nơi cấp" value={form.defendant.identityIssuePlace} onChange={(value) => updateDefendant("identityIssuePlace", value)} />
          <BmFieldText label="Nơi thường trú" value={form.defendant.permanentResidence} onChange={(value) => updateDefendant("permanentResidence", value)} />
          <BmFieldText label="Nơi tạm trú" value={form.defendant.temporaryResidence} onChange={(value) => updateDefendant("temporaryResidence", value)} />
          <BmFieldText label="Nơi ở hiện tại" value={form.defendant.currentResidence} onChange={(value) => updateDefendant("currentResidence", value)} />
        </div>
      </BmFormSection>

      <BmFormSection title="6. Nội dung quyết định">
        <div className="grid gap-4">
          <BmFieldTextarea label="Căn cứ khởi tố vụ án" value={form.guaranteeApproval.caseInitiationLine} onChange={(value) => updateGuarantee("caseInitiationLine", value)} rows={3} />
          <BmFieldTextarea label="Căn cứ khởi tố bị can" value={form.guaranteeApproval.defendantInitiationLine} onChange={(value) => updateGuarantee("defendantInitiationLine", value)} rows={3} />
          <BmFieldTextarea label="Xét thấy đủ căn cứ" value={form.guaranteeApproval.sufficientGroundsLine} onChange={(value) => updateGuarantee("sufficientGroundsLine", value)} rows={2} />
          <BmFieldTextarea label="Điều 1 - giao bảo lĩnh" value={form.guaranteeApproval.assignmentLine} onChange={(value) => updateGuarantee("assignmentLine", value)} rows={2} />
          <BmFieldTextarea label="Thời hạn bảo lĩnh" value={form.guaranteeApproval.guaranteePeriodLine} onChange={(value) => updateGuarantee("guaranteePeriodLine", value)} rows={2} />
          <BmFieldTextarea label="Điều 2" value={form.guaranteeApproval.article2Line} onChange={(value) => updateGuarantee("article2Line", value)} rows={4} />
        </div>
      </BmFormSection>

      <BmFormSection title="7. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Bị can" value={form.recipients.defendantLine} onChange={(value) => updateRecipients("defendantLine", value)} />
          <BmFieldText label="Người nhận bảo lĩnh" value={form.recipients.guarantorLine} onChange={(value) => updateRecipients("guarantorLine", value)} />
          <BmFieldText label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateRecipients("archiveLine", value)} />
          <BmFieldText label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateSignature("signMode", value)} />
          <BmFieldText label="Chức vụ người ký" value={form.signature.positionTitle} onChange={(value) => updateSignature("positionTitle", value)} />
          <BmFieldText label="Người ký" value={form.signature.signerName} onChange={(value) => updateSignature("signerName", value)} />
        </div>
      </BmFormSection>

      <BmFormSection title="Preview dữ liệu sẽ lưu">
        <div className="space-y-3 rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          <p><span className="font-bold">Số:</span> {preview.document.documentCode}</p>
          <p><span className="font-bold">Ngày:</span> {preview.document.issuePlaceAndDateLine}</p>
          <p><span className="font-bold">Bị can:</span> {preview.defendant.fullName}</p>
          <p><span className="font-bold">Người nhận bảo lĩnh:</span> {preview.guaranteeApproval.guarantorName}</p>
          <p><span className="font-bold">Điều 1:</span> {preview.guaranteeApproval.assignmentLine}</p>
          <p><span className="font-bold">Điều 2:</span> {preview.guaranteeApproval.article2Line}</p>
          <p><span className="font-bold">Chữ ký:</span> {preview.signature.signMode} / {preview.signature.positionTitle} / {preview.signature.signerName}</p>
        </div>
      </BmFormSection>
    </div>
  );
}
