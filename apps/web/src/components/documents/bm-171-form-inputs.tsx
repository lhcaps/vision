"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;
type AssetReturnRecord = Record<string, string | boolean>;

type Bm171FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  official: TextRecord;
  legalBasis: TextRecord;
  caseDecision: TextRecord;
  accusedDecision: TextRecord;
  assetReturn: AssetReturnRecord;
  assetOwner: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm171FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Props = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm171FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
  },
  document: {
    documentCode: "",
    issueDate: "",
    issuePlaceAndDateLine: "",
  },
  official: {
    issuerTitle: "",
  },
  legalBasis: {
    procedureArticlesLine: "",
  },
  caseDecision: {
    decisionCode: "",
    decisionDate: "",
    prosecutionDecisionLegalBasisLine: "",
  },
  accusedDecision: {
    decisionCode: "",
    decisionDate: "",
    accusedName: "",
    prosecutionDecisionLegalBasisLine: "",
  },
  assetReturn: {
    includeAccusedDecisionLine: true,
    includeCaseSuspensionDecisionLine: true,
    includeAccusedSuspensionDecisionLine: true,

    agencyBodyName: "",
    investigationAgencyName: "",
    offenseName: "",
    legalClause: "",
    legalArticle: "",
    accusedName: "",

    investigationConclusionCode: "",
    investigationConclusionDate: "",
    investigationConclusionLegalBasisLine: "",

    caseSuspensionDecisionCode: "",
    caseSuspensionDecisionDate: "",
    caseSuspensionDecisionLegalBasisLine: "",

    accusedSuspensionDecisionCode: "",
    accusedSuspensionDecisionDate: "",
    accusedSuspensionDecisionLegalBasisLine: "",

    considerationLine: "",
    assetListLine: "",
    executionRequestLine: "",
  },
  assetOwner: {
    fullName: "",
    genderText: "",
    otherName: "",
    dateOfBirth: "",
    dateOfBirthText: "",
    placeOfBirth: "",
    nationality: "",
    ethnicity: "",
    religion: "",
    occupation: "",
    identityNo: "",
    identityIssuedDate: "",
    identityIssuedDateText: "",
    identityIssuedPlace: "",
    permanentResidence: "",
    temporaryResidence: "",
    currentResidence: "",
  },
  recipients: {
    line1: "",
    archiveLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Viện kiểm sát ban hành" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày quyết định" },
  { section: "assetReturn", field: "investigationAgencyName", label: "Cơ quan điều tra" },
  { section: "assetReturn", field: "offenseName", label: "Tên tội" },
  { section: "assetReturn", field: "legalClause", label: "Khoản" },
  { section: "assetReturn", field: "legalArticle", label: "Điều luật" },
  { section: "assetReturn", field: "assetListLine", label: "Tài sản trả lại" },
  { section: "assetOwner", field: "fullName", label: "Người nhận tài sản" },
  { section: "assetOwner", field: "identityNo", label: "Số CCCD/CMND" },
  { section: "signature", field: "positionTitle", label: "Chức vụ ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];
  return isRecord(value) ? value : {};
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function pick(record: Record<string, unknown>, key: string): string {
  return text(record[key]);
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const current = text(value).trim();
    if (current && current !== "null" && current !== "NULL") return current;
  }

  return "";
}

function bool(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === "boolean") return value;

  const raw = text(value).trim().toLowerCase();
  if (!raw) return defaultValue;

  if (["true", "1", "yes", "y", "co", "có"].includes(raw)) return true;
  if (["false", "0", "no", "n", "khong", "không"].includes(raw)) return false;

  return defaultValue;
}

function toDateInput(value: unknown): string {
  const raw = text(value).trim();

  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slash) {
    const [, day, month, year] = slash;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const vn = raw.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (vn) {
    const [, day, month, year] = vn;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function splitIsoDate(value: string): { day: string; month: string; year: string } {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (!match) return { day: "", month: "", year: "" };

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
}

function makeIsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function toVietnameseDate(value: string): string {
  const { day, month, year } = splitIsoDate(value);
  if (!day || !month || !year) return "";
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function toPersonDateText(value: string): string {
  const { day, month, year } = splitIsoDate(value);
  if (!day || !month || !year) return "";
  return `${Number(day)}/${Number(month)}/${year}`;
}

function ensureEnd(value: string, ending: string): string {
  const clean = value
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();

  if (!clean) return "";
  return clean.endsWith(ending) ? clean : `${clean}${ending}`;
}

function normalizeAgencyBodyName(value: string): string {
  return value
    .replace(/VIỆN KIỂM SÁT NHÂN DÂN/gu, "Viện kiểm sát nhân dân")
    .replace(/KHU VỰC/gu, "khu vực")
    .replace(/THÀNH PHỐ/gu, "Thành phố")
    .replace(/TỈNH/gu, "tỉnh")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function getValue(form: Bm171FormInputs, sectionKey: SectionKey, field: string): string {
  const value = form[sectionKey][field];
  return typeof value === "string" ? value : "";
}

function buildDerivedFields(form: Bm171FormInputs): Bm171FormInputs {
  const issueDateText = toVietnameseDate(form.document.issueDate);
  const issuePlace = form.agency.issuePlace.trim() || "TP. Hồ Chí Minh";

  const agencyBodyName =
    text(form.assetReturn.agencyBodyName).trim() ||
    normalizeAgencyBodyName(form.agency.name);

  const investigationAgencyName = text(form.assetReturn.investigationAgencyName).trim();
  const offenseName = text(form.assetReturn.offenseName).trim();
  const legalClause = text(form.assetReturn.legalClause).trim();
  const legalArticle = text(form.assetReturn.legalArticle).trim();
  const accusedName =
    text(form.assetReturn.accusedName).trim() ||
    text(form.accusedDecision.accusedName).trim();

  const caseDecisionDateText = toVietnameseDate(form.caseDecision.decisionDate);
  const accusedDecisionDateText = toVietnameseDate(form.accusedDecision.decisionDate);
  const investigationConclusionDateText = toVietnameseDate(
    text(form.assetReturn.investigationConclusionDate),
  );
  const caseSuspensionDecisionDateText = toVietnameseDate(
    text(form.assetReturn.caseSuspensionDecisionDate),
  );
  const accusedSuspensionDecisionDateText = toVietnameseDate(
    text(form.assetReturn.accusedSuspensionDecisionDate),
  );

  const caseDecisionLine = ensureEnd(
    `Căn cứ Quyết định khởi tố vụ án hình sự số ${form.caseDecision.decisionCode}${
      caseDecisionDateText ? ` ${caseDecisionDateText}` : ""
    } của ${investigationAgencyName} về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} của Bộ luật Hình sự`,
    ";",
  );

  const accusedDecisionLine = form.assetReturn.includeAccusedDecisionLine
    ? ensureEnd(
        `Căn cứ Quyết định khởi tố bị can số ${form.accusedDecision.decisionCode}${
          accusedDecisionDateText ? ` ${accusedDecisionDateText}` : ""
        } của ${investigationAgencyName} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} của Bộ luật Hình sự`,
        ";",
      )
    : "";

  const investigationConclusionLegalBasisLine = ensureEnd(
    `Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số ${text(
      form.assetReturn.investigationConclusionCode,
    )}${investigationConclusionDateText ? ` ${investigationConclusionDateText}` : ""} của ${investigationAgencyName}`,
    ";",
  );

  const caseSuspensionDecisionLegalBasisLine = form.assetReturn.includeCaseSuspensionDecisionLine
    ? ensureEnd(
        `Căn cứ Quyết định đình chỉ/tạm đình chỉ vụ án hình sự số ${text(
          form.assetReturn.caseSuspensionDecisionCode,
        )}${caseSuspensionDecisionDateText ? ` ${caseSuspensionDecisionDateText}` : ""} của ${agencyBodyName}`,
        ";",
      )
    : "";

  const accusedSuspensionDecisionLegalBasisLine =
    form.assetReturn.includeAccusedSuspensionDecisionLine
      ? ensureEnd(
          `Căn cứ Quyết định đình chỉ/tạm đình chỉ vụ án hình sự đối với bị can số ${text(
            form.assetReturn.accusedSuspensionDecisionCode,
          )}${
            accusedSuspensionDecisionDateText ? ` ${accusedSuspensionDecisionDateText}` : ""
          } của ${agencyBodyName}`,
          ";",
        )
      : "";

  return {
    ...form,
    document: {
      ...form.document,
      issuePlaceAndDateLine: issueDateText ? `${issuePlace}, ${issueDateText}` : "",
    },
    legalBasis: {
      ...form.legalBasis,
      procedureArticlesLine: "Căn cứ Điều 41, Điều 106 của Bộ luật Tố tụng hình sự;",
    },
    caseDecision: {
      ...form.caseDecision,
      prosecutionDecisionLegalBasisLine: caseDecisionLine,
    },
    accusedDecision: {
      ...form.accusedDecision,
      accusedName,
      prosecutionDecisionLegalBasisLine: accusedDecisionLine,
    },
    assetReturn: {
      ...form.assetReturn,
      agencyBodyName,
      investigationAgencyName,
      offenseName,
      legalClause,
      legalArticle,
      accusedName,
      investigationConclusionLegalBasisLine,
      caseSuspensionDecisionLegalBasisLine,
      accusedSuspensionDecisionLegalBasisLine,
      considerationLine: ensureEnd(
        firstText(
          form.assetReturn.considerationLine,
          "Xét thấy tài sản nêu trên không liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, người quản lý hợp pháp",
        ),
        ",",
      ),
      assetListLine: ensureEnd(text(form.assetReturn.assetListLine), "."),
      executionRequestLine: ensureEnd(
        firstText(
          form.assetReturn.executionRequestLine,
          `Yêu cầu ${investigationAgencyName} thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự`,
        ),
        "./.",
      ),
    },
    assetOwner: {
      ...form.assetOwner,
      dateOfBirthText: firstText(
        form.assetOwner.dateOfBirthText,
        toPersonDateText(form.assetOwner.dateOfBirth),
      ),
      identityIssuedDateText: firstText(
        form.assetOwner.identityIssuedDateText,
        toPersonDateText(form.assetOwner.identityIssuedDate),
      ),
    },
    recipients: {
      ...form.recipients,
      line1: investigationAgencyName ? `- ${investigationAgencyName};` : "",
      archiveLine: form.recipients.archiveLine || "- Lưu: HSVA, HSKS, VP.",
    },
  };
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm171FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const official = section(payload, "official");
  const legalBasis = section(payload, "legalBasis");
  const caseDecision = section(payload, "caseDecision");
  const accusedDecision = section(payload, "accusedDecision");
  const assetReturn = section(payload, "assetReturn");
  const assetOwner = section(payload, "assetOwner");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");
  const person = section(payload, "person");

  return buildDerivedFields({
    agency: {
      parentName: pick(agency, "parentName"),
      name: pick(agency, "name"),
      issuePlace: firstText(pick(agency, "issuePlace"), "TP. Hồ Chí Minh"),
    },
    document: {
      documentCode: pick(document, "documentCode"),
      issueDate: toDateInput(document.issueDate),
      issuePlaceAndDateLine: pick(document, "issuePlaceAndDateLine"),
    },
    official: {
      issuerTitle: firstText(
        pick(official, "issuerTitle"),
        "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      ),
    },
    legalBasis: {
      procedureArticlesLine: firstText(
        pick(legalBasis, "procedureArticlesLine"),
        "Căn cứ Điều 41, Điều 106 của Bộ luật Tố tụng hình sự;",
      ),
    },
    caseDecision: {
      decisionCode: firstText(pick(caseDecision, "decisionCode"), ""),
      decisionDate: firstText(toDateInput(caseDecision.decisionDate), "2026-05-29"),
      prosecutionDecisionLegalBasisLine: pick(caseDecision, "prosecutionDecisionLegalBasisLine"),
    },
    accusedDecision: {
      decisionCode: firstText(pick(accusedDecision, "decisionCode"), ""),
      decisionDate: firstText(toDateInput(accusedDecision.decisionDate), "2026-05-29"),
      accusedName: firstText(
        pick(accusedDecision, "accusedName"),
        pick(assetReturn, "accusedName"),
        pick(person, "fullName"),
        "",
      ),
      prosecutionDecisionLegalBasisLine: pick(accusedDecision, "prosecutionDecisionLegalBasisLine"),
    },
    assetReturn: {
      includeAccusedDecisionLine: bool(assetReturn.includeAccusedDecisionLine, true),
      includeCaseSuspensionDecisionLine: bool(assetReturn.includeCaseSuspensionDecisionLine, true),
      includeAccusedSuspensionDecisionLine: bool(assetReturn.includeAccusedSuspensionDecisionLine, true),
      agencyBodyName: firstText(pick(assetReturn, "agencyBodyName"), normalizeAgencyBodyName(pick(agency, "name"))),
      investigationAgencyName: firstText(
        pick(assetReturn, "investigationAgencyName"),
        pick(recipients, "line1").replace(/^-\s*/u, "").replace(/[;.]\s*$/u, ""),
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      ),
      offenseName: firstText(pick(assetReturn, "offenseName"), "Đánh bạc"),
      legalClause: firstText(pick(assetReturn, "legalClause"), "khoản 1"),
      legalArticle: firstText(pick(assetReturn, "legalArticle"), "Điều 321"),
      accusedName: firstText(pick(assetReturn, "accusedName"), pick(person, "fullName"), ""),
      investigationConclusionCode: firstText(pick(assetReturn, "investigationConclusionCode"), "01/KLĐT"),
      investigationConclusionDate: firstText(toDateInput(assetReturn.investigationConclusionDate), toDateInput(document.issueDate)),
      investigationConclusionLegalBasisLine: pick(assetReturn, "investigationConclusionLegalBasisLine"),
      caseSuspensionDecisionCode: firstText(pick(assetReturn, "caseSuspensionDecisionCode"), pick(document, "documentCode")),
      caseSuspensionDecisionDate: firstText(toDateInput(assetReturn.caseSuspensionDecisionDate), toDateInput(document.issueDate)),
      caseSuspensionDecisionLegalBasisLine: pick(assetReturn, "caseSuspensionDecisionLegalBasisLine"),
      accusedSuspensionDecisionCode: firstText(pick(assetReturn, "accusedSuspensionDecisionCode"), pick(document, "documentCode")),
      accusedSuspensionDecisionDate: firstText(toDateInput(assetReturn.accusedSuspensionDecisionDate), toDateInput(document.issueDate)),
      accusedSuspensionDecisionLegalBasisLine: pick(assetReturn, "accusedSuspensionDecisionLegalBasisLine"),
      considerationLine: firstText(
        pick(assetReturn, "considerationLine"),
        "Xét thấy tài sản nêu trên không liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, người quản lý hợp pháp,",
      ),
      assetListLine: firstText(
        pick(assetReturn, "assetListLine"),
        "01 điện thoại di động màu đen đã qua sử dụng và các tài liệu, đồ vật liên quan trong hồ sơ vụ án.",
      ),
      executionRequestLine: pick(assetReturn, "executionRequestLine"),
    },
    assetOwner: {
      fullName: firstText(pick(assetOwner, "fullName"), pick(person, "fullName"), ""),
      genderText: firstText(pick(assetOwner, "genderText"), pick(person, "genderText"), "Nam"),
      otherName: firstText(pick(assetOwner, "otherName"), pick(person, "otherName"), "Không có"),
      dateOfBirth: firstText(toDateInput(assetOwner.dateOfBirth), toDateInput(person.dateOfBirth), "1985-09-08"),
      dateOfBirthText: pick(assetOwner, "dateOfBirthText"),
      placeOfBirth: firstText(pick(assetOwner, "placeOfBirth"), pick(person, "placeOfBirth"), "tỉnh Quảng Ngãi"),
      nationality: firstText(pick(assetOwner, "nationality"), pick(person, "nationality"), "Việt Nam"),
      ethnicity: firstText(pick(assetOwner, "ethnicity"), pick(person, "ethnicity"), "Kinh"),
      religion: firstText(pick(assetOwner, "religion"), pick(person, "religion"), "Không"),
      occupation: firstText(pick(assetOwner, "occupation"), pick(person, "occupation"), "Kinh doanh"),
      identityNo: firstText(pick(assetOwner, "identityNo"), pick(person, "identityNo"), "051080000314"),
      identityIssuedDate: firstText(toDateInput(assetOwner.identityIssuedDate), toDateInput(person.identityIssuedDate), "2021-12-22"),
      identityIssuedDateText: pick(assetOwner, "identityIssuedDateText"),
      identityIssuedPlace: firstText(
        pick(assetOwner, "identityIssuedPlace"),
        pick(person, "identityIssuedPlace"),
        "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
      ),
      permanentResidence: firstText(
        pick(assetOwner, "permanentResidence"),
        pick(person, "permanentResidence"),
        "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
      ),
      temporaryResidence: firstText(pick(assetOwner, "temporaryResidence"), pick(person, "temporaryResidence"), "Không có"),
      currentResidence: firstText(
        pick(assetOwner, "currentResidence"),
        pick(person, "currentResidence"),
        "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
      ),
    },
    recipients: {
      line1: pick(recipients, "line1"),
      archiveLine: firstText(pick(recipients, "archiveLine"), "- Lưu: HSVA, HSKS, VP."),
    },
    signature: {
      signMode: firstText(pick(signature, "signMode"), "KT. VIỆN TRƯỞNG"),
      positionTitle: firstText(pick(signature, "positionTitle"), "PHÓ VIỆN TRƯỞNG"),
      signerName: firstText(pick(signature, "signerName"), ""),
    },
  });
}

async function getRenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không tải được payload BM-171. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveFormInputs(documentId: string | number, form: Bm171FormInputs): Promise<void> {
  const syncedInput: Bm171FormInputs = {
    ...form,
    accusedDecision: {
      ...form.accusedDecision,
      accusedName: text(form.assetReturn.accusedName) || form.accusedDecision.accusedName,
    },
    assetReturn: {
      ...form.assetReturn,
      includeAccusedDecisionLine: Boolean(form.assetReturn.includeAccusedDecisionLine),
      includeCaseSuspensionDecisionLine: Boolean(form.assetReturn.includeCaseSuspensionDecisionLine),
      includeAccusedSuspensionDecisionLine: Boolean(form.assetReturn.includeAccusedSuspensionDecisionLine),
      accusedName: text(form.assetReturn.accusedName) || form.accusedDecision.accusedName,
    },
  };

  const finalForm = buildDerivedFields(syncedInput);

  const body = {
    formInputs: finalForm,
    agency: finalForm.agency,
    document: finalForm.document,
    official: finalForm.official,
    legalBasis: finalForm.legalBasis,
    caseDecision: finalForm.caseDecision,
    accusedDecision: finalForm.accusedDecision,
    assetReturn: finalForm.assetReturn,
    assetOwner: finalForm.assetOwner,
    recipients: finalForm.recipients,
    signature: finalForm.signature,
    updatedByName: "",
  };

  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(responseBody || `Không lưu được dữ liệu BM-171. HTTP ${response.status}`);
  }
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
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
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      )}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300"
      />
      <span className="block text-sm font-semibold text-slate-800">{label}</span>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">-- Chọn --</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const parsed = splitIsoDate(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const next = splitIsoDate(value);
    setDay(next.day);
    setMonth(next.month);
    setYear(next.year);
  }, [value]);

  function update(nextDay: string, nextMonth: string, nextYear: string) {
    setDay(nextDay);
    setMonth(nextMonth);
    setYear(nextYear);

    if (!nextDay && !nextMonth && !nextYear) {
      onChange("");
      return;
    }

    if (nextDay && nextMonth && nextYear) {
      onChange(makeIsoDate(nextDay, nextMonth, nextYear));
    }
  }

  const currentYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: 100 }, (_, index) => String(currentYear - index));

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <div className="grid grid-cols-3 gap-2">
        <select value={day} onChange={(event) => update(event.target.value, month, year)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
          <option value="">Ngày</option>
          {Array.from({ length: 31 }, (_, index) => {
            const item = String(index + 1).padStart(2, "0");
            return <option key={item} value={item}>{index + 1}</option>;
          })}
        </select>

        <select value={month} onChange={(event) => update(day, event.target.value, year)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
          <option value="">Tháng</option>
          {Array.from({ length: 12 }, (_, index) => {
            const item = String(index + 1).padStart(2, "0");
            return <option key={item} value={item}>{index + 1}</option>;
          })}
        </select>

        <select value={year} onChange={(event) => update(day, month, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200">
          <option value="">Năm</option>
          {years.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
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
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function Bm171FormInputsPanel({ documentId, onSaved }: Props) {
  const [form, setForm] = useState<Bm171FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const derivedForm = useMemo(() => buildDerivedFields(form), [form]);
  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => !getValue(form, item.section, item.field).trim());
  }, [form]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getRenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);
      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-171.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => {
      const next: Bm171FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };

      if (sectionKey === "assetReturn" && field === "accusedName") {
        next.accusedDecision = {
          ...next.accusedDecision,
          accusedName: value,
        };
      }

      if (sectionKey === "accusedDecision" && field === "accusedName") {
        next.assetReturn = {
          ...next.assetReturn,
          accusedName: value,
        };
      }

      return next;
    });
  }

  function updateBool(field: string, value: boolean) {
    setForm((current) => ({
      ...current,
      assetReturn: {
        ...current.assetReturn,
        [field]: value,
      },
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const finalForm = buildDerivedFields(form);
      await saveFormInputs(documentId, finalForm);

      setForm(finalForm);
      setInitialSnapshot(JSON.stringify(finalForm));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được dữ liệu BM-171.");
    } finally {
      setIsSaving(false);
    }
  }

  function fillSample() {
    setForm(
      buildDerivedFields({
        ...EMPTY_FORM,
        agency: {
          parentName: "",
          name: "",
          issuePlace: "TP. Hồ Chí Minh",
        },
        document: {
          documentCode: "171/QĐ-VKSKV7",
          issueDate: "2026-05-29",
          issuePlaceAndDateLine: "",
        },
        official: {
          issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        },
        legalBasis: {
          procedureArticlesLine: "Căn cứ Điều 41, Điều 106 của Bộ luật Tố tụng hình sự;",
        },
        caseDecision: {
          decisionCode: "",
          decisionDate: "2026-05-29",
          prosecutionDecisionLegalBasisLine: "",
        },
        accusedDecision: {
          decisionCode: "",
          decisionDate: "2026-05-29",
          accusedName: "",
          prosecutionDecisionLegalBasisLine: "",
        },
        assetReturn: {
          ...EMPTY_FORM.assetReturn,
          includeAccusedDecisionLine: true,
          includeCaseSuspensionDecisionLine: true,
          includeAccusedSuspensionDecisionLine: true,
          agencyBodyName: "Viện kiểm sát nhân dân khu vực 7",
          investigationAgencyName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
          offenseName: "",
          legalClause: "khoản 1",
          legalArticle: "Điều 321",
          accusedName: "",
          investigationConclusionCode: "01/KLĐT",
          investigationConclusionDate: "2026-05-29",
          caseSuspensionDecisionCode: "171/QĐ-VKSKV7",
          caseSuspensionDecisionDate: "2026-05-29",
          accusedSuspensionDecisionCode: "172/QĐ-VKSKV7",
          accusedSuspensionDecisionDate: "2026-05-29",
          considerationLine: "Xét thấy tài sản nêu trên không liên quan đến việc giải quyết vụ án và cần trả lại cho chủ sở hữu, người quản lý hợp pháp",
          assetListLine: "01 điện thoại di động màu đen đã qua sử dụng và các tài liệu, đồ vật liên quan trong hồ sơ vụ án",
          executionRequestLine: "",
        },
        assetOwner: {
          fullName: "",
          genderText: "Nam",
          otherName: "Không có",
          dateOfBirth: "1985-09-08",
          dateOfBirthText: "",
          placeOfBirth: "tỉnh Quảng Ngãi",
          nationality: "Việt Nam",
          ethnicity: "Kinh",
          religion: "Không",
          occupation: "Kinh doanh",
          identityNo: "051080000314",
          identityIssuedDate: "2021-12-22",
          identityIssuedDateText: "",
          identityIssuedPlace: "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
          permanentResidence: "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
          temporaryResidence: "Không có",
          currentResidence: "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
        },
        recipients: {
          line1: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
          archiveLine: "- Lưu: HSVA, HSKS, VP.",
        },
        signature: {
          signMode: "KT. VIỆN TRƯỞNG",
          positionTitle: "PHÓ VIỆN TRƯỞNG",
          signerName: "",
        },
      }),
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-171...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-171" form={form} onApply={(next) => setForm(next as typeof form)} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">BM-171</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu Quyết định trả lại tài sản
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Nhập dữ liệu nguồn chính. Hệ thống tự sinh căn cứ, tài sản trả lại, người nhận tài sản và nơi nhận.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm md:items-end">
            {isDirty ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">Có thay đổi chưa lưu</span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">Đã đồng bộ</span>
            )}
            {savedAt ? <span className="text-xs text-slate-500">Lưu lúc {savedAt.toLocaleTimeString("vi-VN")}</span> : null}
          </div>
        </div>

        {errorMessage ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">Còn thiếu {missingFields.length} trường chính:</p>
            <p className="mt-1 text-sm text-amber-700">{missingFields.map((item) => item.label).join(", ")}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Dữ liệu chính đã đủ. Có thể lưu và render.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={fillSample} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100">
            Điền dữ liệu mẫu
          </button>
          <button type="button" onClick={loadForm} disabled={isSaving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            Tải lại từ backend
          </button>
        </div>
      </section>

      <SectionCard title="1. Quyết định">
        <Field required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} />
        <Field required label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} />
        <Field required label="Tên cơ quan trong nội dung" value={text(form.assetReturn.agencyBodyName)} onChange={(value) => updateField("assetReturn", "agencyBodyName", value)} />
        <Field required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
        <Field required label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <DateSelectField required label="Ngày quyết định" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <Field required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="2. Vụ án / tội danh">
        <Field required label="Tên tội" value={text(form.assetReturn.offenseName)} onChange={(value) => updateField("assetReturn", "offenseName", value)} />
        <Field required label="Khoản" value={text(form.assetReturn.legalClause)} onChange={(value) => updateField("assetReturn", "legalClause", value)} />
        <Field required label="Điều luật BLHS" value={text(form.assetReturn.legalArticle)} onChange={(value) => updateField("assetReturn", "legalArticle", value)} />
        <Field required label="Bị can" value={text(form.assetReturn.accusedName)} onChange={(value) => updateField("assetReturn", "accusedName", value)} />
        <Field required label="Cơ quan điều tra" value={text(form.assetReturn.investigationAgencyName)} onChange={(value) => updateField("assetReturn", "investigationAgencyName", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="3. Căn cứ">
        <Field required label="Số QĐ khởi tố vụ án" value={form.caseDecision.decisionCode} onChange={(value) => updateField("caseDecision", "decisionCode", value)} />
        <DateSelectField required label="Ngày QĐ khởi tố vụ án" value={form.caseDecision.decisionDate} onChange={(value) => updateField("caseDecision", "decisionDate", value)} />
        <Field required label="Số bản kết luận điều tra" value={text(form.assetReturn.investigationConclusionCode)} onChange={(value) => updateField("assetReturn", "investigationConclusionCode", value)} />
        <DateSelectField required label="Ngày bản kết luận điều tra" value={text(form.assetReturn.investigationConclusionDate)} onChange={(value) => updateField("assetReturn", "investigationConclusionDate", value)} />
      </SectionCard>

      <SectionCard title="4. Dòng nếu có">
        <div className="md:col-span-2 grid gap-3">
          <CheckboxField label="Có căn cứ Quyết định khởi tố bị can" checked={Boolean(form.assetReturn.includeAccusedDecisionLine)} onChange={(value) => updateBool("includeAccusedDecisionLine", value)} />
          {form.assetReturn.includeAccusedDecisionLine ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Số QĐ khởi tố bị can" value={form.accusedDecision.decisionCode} onChange={(value) => updateField("accusedDecision", "decisionCode", value)} />
              <DateSelectField label="Ngày QĐ khởi tố bị can" value={form.accusedDecision.decisionDate} onChange={(value) => updateField("accusedDecision", "decisionDate", value)} />
            </div>
          ) : null}

          <CheckboxField label="Có căn cứ Quyết định đình chỉ/tạm đình chỉ vụ án" checked={Boolean(form.assetReturn.includeCaseSuspensionDecisionLine)} onChange={(value) => updateBool("includeCaseSuspensionDecisionLine", value)} />
          {form.assetReturn.includeCaseSuspensionDecisionLine ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Số QĐ đình chỉ/tạm đình chỉ vụ án" value={text(form.assetReturn.caseSuspensionDecisionCode)} onChange={(value) => updateField("assetReturn", "caseSuspensionDecisionCode", value)} />
              <DateSelectField label="Ngày QĐ đình chỉ/tạm đình chỉ vụ án" value={text(form.assetReturn.caseSuspensionDecisionDate)} onChange={(value) => updateField("assetReturn", "caseSuspensionDecisionDate", value)} />
            </div>
          ) : null}

          <CheckboxField label="Có căn cứ Quyết định đình chỉ/tạm đình chỉ đối với bị can" checked={Boolean(form.assetReturn.includeAccusedSuspensionDecisionLine)} onChange={(value) => updateBool("includeAccusedSuspensionDecisionLine", value)} />
          {form.assetReturn.includeAccusedSuspensionDecisionLine ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Số QĐ đình chỉ/tạm đình chỉ đối với bị can" value={text(form.assetReturn.accusedSuspensionDecisionCode)} onChange={(value) => updateField("assetReturn", "accusedSuspensionDecisionCode", value)} />
              <DateSelectField label="Ngày QĐ đình chỉ/tạm đình chỉ đối với bị can" value={text(form.assetReturn.accusedSuspensionDecisionDate)} onChange={(value) => updateField("assetReturn", "accusedSuspensionDecisionDate", value)} />
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="5. Tài sản trả lại">
        <Field required multiline label="Tài sản trả lại" value={text(form.assetReturn.assetListLine)} onChange={(value) => updateField("assetReturn", "assetListLine", value)} className="md:col-span-2" />
        <Field multiline label="Lý do xét thấy" value={text(form.assetReturn.considerationLine)} onChange={(value) => updateField("assetReturn", "considerationLine", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="6. Người nhận tài sản">
        <Field required label="Họ tên" value={form.assetOwner.fullName} onChange={(value) => updateField("assetOwner", "fullName", value)} />
        <Field label="Giới tính" value={form.assetOwner.genderText} onChange={(value) => updateField("assetOwner", "genderText", value)} />
        <Field label="Tên gọi khác" value={form.assetOwner.otherName} onChange={(value) => updateField("assetOwner", "otherName", value)} />
        <DateSelectField label="Ngày sinh" value={form.assetOwner.dateOfBirth} onChange={(value) => updateField("assetOwner", "dateOfBirth", value)} />
        <Field label="Nơi sinh" value={form.assetOwner.placeOfBirth} onChange={(value) => updateField("assetOwner", "placeOfBirth", value)} />
        <Field label="Quốc tịch" value={form.assetOwner.nationality} onChange={(value) => updateField("assetOwner", "nationality", value)} />
        <Field label="Dân tộc" value={form.assetOwner.ethnicity} onChange={(value) => updateField("assetOwner", "ethnicity", value)} />
        <Field label="Tôn giáo" value={form.assetOwner.religion} onChange={(value) => updateField("assetOwner", "religion", value)} />
        <Field label="Nghề nghiệp" value={form.assetOwner.occupation} onChange={(value) => updateField("assetOwner", "occupation", value)} />
        <Field required label="Số CCCD/CMND/Hộ chiếu" value={form.assetOwner.identityNo} onChange={(value) => updateField("assetOwner", "identityNo", value)} />
        <DateSelectField label="Ngày cấp" value={form.assetOwner.identityIssuedDate} onChange={(value) => updateField("assetOwner", "identityIssuedDate", value)} />
        <Field label="Nơi cấp" value={form.assetOwner.identityIssuedPlace} onChange={(value) => updateField("assetOwner", "identityIssuedPlace", value)} />
        <Field label="Nơi thường trú" value={form.assetOwner.permanentResidence} onChange={(value) => updateField("assetOwner", "permanentResidence", value)} className="md:col-span-2" />
        <Field label="Nơi tạm trú" value={form.assetOwner.temporaryResidence} onChange={(value) => updateField("assetOwner", "temporaryResidence", value)} className="md:col-span-2" />
        <Field label="Nơi ở hiện tại" value={form.assetOwner.currentResidence} onChange={(value) => updateField("assetOwner", "currentResidence", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="7. Chữ ký">
        <SelectField label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <SelectField required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <Field required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
        <Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} />
      </SectionCard>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Xem nhanh nội dung tự sinh
          </summary>

          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <p><strong>Căn cứ BLTTHS:</strong> {derivedForm.legalBasis.procedureArticlesLine}</p>
            <p><strong>Khởi tố vụ án:</strong> {derivedForm.caseDecision.prosecutionDecisionLegalBasisLine}</p>
            {derivedForm.assetReturn.includeAccusedDecisionLine ? <p><strong>Khởi tố bị can:</strong> {derivedForm.accusedDecision.prosecutionDecisionLegalBasisLine}</p> : null}
            <p><strong>Kết luận điều tra:</strong> {derivedForm.assetReturn.investigationConclusionLegalBasisLine}</p>
            {derivedForm.assetReturn.includeCaseSuspensionDecisionLine ? <p><strong>Đình chỉ/tạm đình chỉ vụ án:</strong> {derivedForm.assetReturn.caseSuspensionDecisionLegalBasisLine}</p> : null}
            {derivedForm.assetReturn.includeAccusedSuspensionDecisionLine ? <p><strong>Đình chỉ/tạm đình chỉ bị can:</strong> {derivedForm.assetReturn.accusedSuspensionDecisionLegalBasisLine}</p> : null}
            <p><strong>Tài sản:</strong> {derivedForm.assetReturn.assetListLine}</p>
            <p><strong>Điều 2:</strong> {derivedForm.assetReturn.executionRequestLine}</p>
          </div>
        </details>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Lưu dữ liệu BM-171</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sau khi lưu, kiểm tra render-payload trước khi render DOCX để tránh dữ liệu cũ đè dữ liệu khách nhập.
            </p>
          </div>

          <button type="button" onClick={handleSave} disabled={isSaving || !isDirty} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-171"}
          </button>
        </div>
      </section>
    </div>
  );
}
