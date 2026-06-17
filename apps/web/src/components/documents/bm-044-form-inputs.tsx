"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type SectionName =
  | "agency"
  | "document"
  | "legalBasis"
  | "detentionReplacement"
  | "recipients"
  | "signature";

type Bm044FormInputs = {
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
    juvenileJusticeLine: string;
  };
  detentionReplacement: {
    includeJuvenileJusticeLine: boolean;
    includeDetentionExtensionLegalBasis: boolean;

    accusedName: string;
    offenseName: string;
    legalArticle: string;

    procuracyName: string;
    procuracyBodyName: string;
    investigationAgency: string;
    executionAgencyName: string;

    detentionOrderCode: string;
    detentionOrderIssueDateText: string;

    extensionDecisionRoundText: string;
    extensionDecisionCode: string;
    extensionDecisionIssueDateText: string;

    replacementMeasureName: string;
    replacementDurationText: string;
    replacementFromDateText: string;
    replacementToDateText: string;

    detentionOrderLegalBasisLine: string;
    detentionExtensionLegalBasisLine: string;
    proposalLine: string;
    reasonLine: string;
    article1Line: string;
    durationLine: string;
    article2Line: string;
  };
  recipients: {
    personLine: string;
    proposalAgencyLine: string;
    executionAgencyLine: string;
    archiveLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
};

type Bm044FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

type RequiredField = {
  section: SectionName;
  field: string;
  label: string;
};

const DEFAULT_PERSON_NAME = '';
const DEFAULT_OFFENSE_NAME = '';
const DEFAULT_LEGAL_ARTICLE = "khoản 1 Điều 321 Bộ luật Hình sự";
const DEFAULT_INVESTIGATION_AGENCY =
  "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";
const DEFAULT_PROCURACY_BODY_NAME = "Viện kiểm sát nhân dân khu vực 7";
const DEFAULT_SIGNER_NAME = '';

const EMPTY_FORM: Bm044FormInputs = {
  agency: {
    parentNameUpper: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    nameUpper: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "44/QĐ-VKSKV7",
    issueDate: "26/05/2026",
    issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 26 tháng 5 năm 2026",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 125 và 165 của Bộ luật Tố tụng hình sự;",
    juvenileJusticeLine:
      "Căn cứ Điều 138 và Điều 139 của Luật Tư pháp người chưa thành niên;",
  },
  detentionReplacement: {
    includeJuvenileJusticeLine: true,
    includeDetentionExtensionLegalBasis: true,

    accusedName: DEFAULT_PERSON_NAME,
    offenseName: DEFAULT_OFFENSE_NAME,
    legalArticle: DEFAULT_LEGAL_ARTICLE,

    procuracyName: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    procuracyBodyName: DEFAULT_PROCURACY_BODY_NAME,
    investigationAgency: DEFAULT_INVESTIGATION_AGENCY,
    executionAgencyName: DEFAULT_INVESTIGATION_AGENCY,

    detentionOrderCode: "17/LTG-VKSKV7",
    detentionOrderIssueDateText: "ngày 26 tháng 5 năm 2026",

    extensionDecisionRoundText: "lần thứ nhất",
    extensionDecisionCode: "03/QĐ-VKSKV7",
    extensionDecisionIssueDateText: "ngày 26 tháng 5 năm 2026",

    replacementMeasureName: "cấm đi khỏi nơi cư trú",
    replacementDurationText: "02 tháng",
    replacementFromDateText: "26/05/2026",
    replacementToDateText: "",

    detentionOrderLegalBasisLine: "",
    detentionExtensionLegalBasisLine: "",
    proposalLine: "",
    reasonLine: "",
    article1Line: "",
    durationLine: "",
    article2Line: "",
  },
  recipients: {
    personLine: "",
    proposalAgencyLine: "",
    executionAgencyLine: "",
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
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issuePlaceAndDateLine", label: "Địa danh, ngày tháng năm" },
  { section: "legalBasis", field: "procedureArticlesLine", label: "Căn cứ BLTTHS" },
  { section: "detentionReplacement", field: "accusedName", label: "Tên bị can" },
  { section: "detentionReplacement", field: "offenseName", label: "Tên tội" },
  { section: "detentionReplacement", field: "legalArticle", label: "Điều luật" },
  { section: "detentionReplacement", field: "detentionOrderCode", label: "Số lệnh tạm giam" },
  { section: "detentionReplacement", field: "replacementMeasureName", label: "Biện pháp thay thế" },
  { section: "detentionReplacement", field: "executionAgencyName", label: "Cơ quan thực hiện" },
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

function parseBool(value: unknown, defaultValue: boolean): boolean {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const raw = String(value).trim().toLowerCase();

  if (["false", "0", "no", "off"].includes(raw)) {
    return false;
  }

  if (["true", "1", "yes", "on"].includes(raw)) {
    return true;
  }

  return defaultValue;
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

function toAgencyBodyName(value: string): string {
  const raw = value.trim();

  if (!raw) {
    return DEFAULT_PROCURACY_BODY_NAME;
  }

  return raw
    .toLocaleLowerCase("vi-VN")
    .replace(/^viện kiểm sát nhân dân/u, "Viện kiểm sát nhân dân")
    .replace(/thành phố hồ chí minh/gu, "Thành phố Hồ Chí Minh")
    .replace(/hồ chí minh/gu, "Hồ Chí Minh");
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

function toDateRangeLine(fromDate: string, toDate: string): string {
  const fromText = toLegalDateText(fromDate);
  const toText = toLegalDateText(toDate);

  if (fromText && toText) {
    return `kể từ ${fromText} đến ${toText}`;
  }

  if (fromText) {
    return `kể từ ${fromText} đến ngày ... tháng ... năm ...`;
  }

  return "kể từ ngày ... tháng ... năm ... đến ngày ... tháng ... năm ...";
}

function getValue(
  form: Bm044FormInputs,
  sectionName: SectionName,
  fieldName: string,
): string {
  const group = form[sectionName] as Record<string, string>;
  return group[fieldName] ?? "";
}

function buildSyncedForm(input: Bm044FormInputs): Bm044FormInputs {
  const form: Bm044FormInputs = JSON.parse(JSON.stringify(input)) as Bm044FormInputs;
  const detention = form.detentionReplacement;

  const accusedName = pickText(detention.accusedName, DEFAULT_PERSON_NAME);
  const offenseName = pickText(detention.offenseName, DEFAULT_OFFENSE_NAME);
  const legalArticle = pickText(detention.legalArticle, DEFAULT_LEGAL_ARTICLE);
  const offenseClause = buildOffenseClause(offenseName, legalArticle);

  const procuracyBodyName = toAgencyBodyName(
    pickText(detention.procuracyBodyName, detention.procuracyName, form.agency.nameUpper),
  );

  const investigationAgency = pickText(
    detention.investigationAgency,
    DEFAULT_INVESTIGATION_AGENCY,
  );

  const executionAgency = pickText(
    detention.executionAgencyName,
    investigationAgency,
  );

  const detentionOrderCode = pickText(detention.detentionOrderCode, "17/LTG-VKSKV7");
  const detentionOrderIssueDateText = toLegalDateText(
    pickText(detention.detentionOrderIssueDateText, form.document.issueDate),
  );

  const extensionDecisionRoundText = pickText(
    detention.extensionDecisionRoundText,
    "lần thứ nhất",
  );
  const extensionDecisionCode = pickText(
    detention.extensionDecisionCode,
    "03/QĐ-VKSKV7",
  );
  const extensionDecisionIssueDateText = toLegalDateText(
    pickText(detention.extensionDecisionIssueDateText, form.document.issueDate),
  );

  const replacementMeasureName = pickText(
    detention.replacementMeasureName,
    "cấm đi khỏi nơi cư trú",
  );

  const replacementDurationText = pickText(detention.replacementDurationText, "02 tháng");
  const replacementFromDateText = pickText(
    detention.replacementFromDateText,
    form.document.issueDate,
  );
  const replacementToDateText = detention.replacementToDateText;

  form.document.issuePlaceAndDateLine = buildIssuePlaceAndDateLine(
    form.agency.issuePlace,
    form.document.issueDate,
  );

  form.legalBasis.procedureArticlesLine =
    "Căn cứ các điều 41, 125 và 165 của Bộ luật Tố tụng hình sự;";

  form.legalBasis.juvenileJusticeLine = detention.includeJuvenileJusticeLine
    ? "Căn cứ Điều 138 và Điều 139 của Luật Tư pháp người chưa thành niên;"
    : "";

  form.detentionReplacement = {
    ...detention,
    accusedName,
    offenseName,
    legalArticle,
    procuracyBodyName,
    investigationAgency,
    executionAgencyName: executionAgency,
    detentionOrderCode,
    detentionOrderIssueDateText,
    extensionDecisionRoundText,
    extensionDecisionCode,
    extensionDecisionIssueDateText,
    replacementMeasureName,
    replacementDurationText,
    replacementFromDateText,
    replacementToDateText,

    detentionOrderLegalBasisLine:
      `Căn cứ Lệnh tạm giam/Lệnh bắt bị can để tạm giam số ${detentionOrderCode} ${detentionOrderIssueDateText} của ${procuracyBodyName} đối với ${accusedName} ${offenseClause};`,

    detentionExtensionLegalBasisLine: detention.includeDetentionExtensionLegalBasis
      ? `Căn cứ Quyết định gia hạn tạm giam ${extensionDecisionRoundText}/Quyết định gia hạn thời hạn tạm giam để truy tố số ${extensionDecisionCode} ${extensionDecisionIssueDateText} của ${procuracyBodyName} (nếu có);`
      : "",

    proposalLine:
      `Xét hồ sơ đề nghị thay thế biện pháp tạm giam của ${investigationAgency};`,

    reasonLine:
      `Nhận thấy có đủ căn cứ, điều kiện để thay thế biện pháp tạm giam đối với bị can ${accusedName},`,

    article1Line:
      `Thay thế biện pháp tạm giam bằng biện pháp ${replacementMeasureName} đối với bị can ${accusedName}.`,

    durationLine:
      `Thời hạn áp dụng biện pháp ${replacementMeasureName}, ${toDateRangeLine(
        replacementFromDateText,
        replacementToDateText,
      )}.`,

    article2Line:
      `Yêu cầu ${executionAgency} thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự./.`,
  };

  form.recipients = {
    personLine: `- ${accusedName};`,
    proposalAgencyLine: `- ${investigationAgency};`,
    executionAgencyLine: `- ${executionAgency};`,
    archiveLine: pickText(form.recipients.archiveLine, "- Lưu: HSVA, HSKS, VP."),
  };

  form.signature = {
    signMode: pickText(form.signature.signMode, "KT. VIỆN TRƯỞNG"),
    positionTitle: pickText(form.signature.positionTitle, "PHÓ VIỆN TRƯỞNG"),
    signerName: pickText(form.signature.signerName, DEFAULT_SIGNER_NAME),
  };

  return form;
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm044FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const legalBasis = section(payload, "legalBasis");
  const detentionReplacement = section(payload, "detentionReplacement");
  const person = section(payload, "person");
  const offense = section(payload, "offense");
  const measure = section(payload, "measure");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

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
      issueDate: pickText(document.issueDate, EMPTY_FORM.document.issueDate),
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
      juvenileJusticeLine: pickText(
        legalBasis.juvenileJusticeLine,
        EMPTY_FORM.legalBasis.juvenileJusticeLine,
      ),
    },
    detentionReplacement: {
      includeJuvenileJusticeLine: parseBool(
        detentionReplacement.includeJuvenileJusticeLine,
        pickText(legalBasis.juvenileJusticeLine).trim().length > 0,
      ),
      includeDetentionExtensionLegalBasis: parseBool(
        detentionReplacement.includeDetentionExtensionLegalBasis,
        pickText(detentionReplacement.detentionExtensionLegalBasisLine).trim().length > 0,
      ),

      accusedName: pickText(detentionReplacement.accusedName, person.fullName, DEFAULT_PERSON_NAME),
      offenseName: pickText(detentionReplacement.offenseName, offense.offenseName, DEFAULT_OFFENSE_NAME),
      legalArticle: pickText(detentionReplacement.legalArticle, offense.legalArticle, DEFAULT_LEGAL_ARTICLE),

      procuracyName: pickText(detentionReplacement.procuracyName, agency.name, EMPTY_FORM.detentionReplacement.procuracyName),
      procuracyBodyName: pickText(detentionReplacement.procuracyBodyName, DEFAULT_PROCURACY_BODY_NAME),
      investigationAgency: pickText(
        detentionReplacement.investigationAgency,
        stripListLine(recipients.proposalAgencyLine),
        stripListLine(recipients.investigatingAgencyLine),
        DEFAULT_INVESTIGATION_AGENCY,
      ),
      executionAgencyName: pickText(
        detentionReplacement.executionAgencyName,
        stripListLine(recipients.executionAgencyLine),
        DEFAULT_INVESTIGATION_AGENCY,
      ),

      detentionOrderCode: pickText(
        detentionReplacement.detentionOrderCode,
        measure.detentionOrderCode,
        EMPTY_FORM.detentionReplacement.detentionOrderCode,
      ),
      detentionOrderIssueDateText: pickText(
        detentionReplacement.detentionOrderIssueDateText,
        measure.detentionOrderIssueDateText,
        measure.detentionOrderIssueDate,
        EMPTY_FORM.detentionReplacement.detentionOrderIssueDateText,
      ),

      extensionDecisionRoundText: pickText(
        detentionReplacement.extensionDecisionRoundText,
        EMPTY_FORM.detentionReplacement.extensionDecisionRoundText,
      ),
      extensionDecisionCode: pickText(
        detentionReplacement.extensionDecisionCode,
        measure.prosecutionExtensionDecisionCode,
        EMPTY_FORM.detentionReplacement.extensionDecisionCode,
      ),
      extensionDecisionIssueDateText: pickText(
        detentionReplacement.extensionDecisionIssueDateText,
        measure.prosecutionExtensionDecisionIssueDateText,
        measure.prosecutionExtensionDecisionIssueDate,
        EMPTY_FORM.detentionReplacement.extensionDecisionIssueDateText,
      ),

      replacementMeasureName: pickText(
        detentionReplacement.replacementMeasureName,
        EMPTY_FORM.detentionReplacement.replacementMeasureName,
      ),
      replacementDurationText: pickText(
        detentionReplacement.replacementDurationText,
        measure.durationText,
        EMPTY_FORM.detentionReplacement.replacementDurationText,
      ),
      replacementFromDateText: pickText(
        detentionReplacement.replacementFromDateText,
        measure.fromDateText,
        measure.fromDate,
        EMPTY_FORM.detentionReplacement.replacementFromDateText,
      ),
      replacementToDateText: pickText(
        detentionReplacement.replacementToDateText,
        measure.toDateText,
        measure.toDate,
        EMPTY_FORM.detentionReplacement.replacementToDateText,
      ),

      detentionOrderLegalBasisLine: pickText(detentionReplacement.detentionOrderLegalBasisLine),
      detentionExtensionLegalBasisLine: pickText(detentionReplacement.detentionExtensionLegalBasisLine),
      proposalLine: pickText(detentionReplacement.proposalLine),
      reasonLine: pickText(detentionReplacement.reasonLine),
      article1Line: pickText(detentionReplacement.article1Line),
      durationLine: pickText(detentionReplacement.durationLine),
      article2Line: pickText(detentionReplacement.article2Line),
    },
    recipients: {
      personLine: pickText(recipients.personLine),
      proposalAgencyLine: pickText(recipients.proposalAgencyLine),
      executionAgencyLine: pickText(recipients.executionAgencyLine),
      archiveLine: pickText(recipients.archiveLine, EMPTY_FORM.recipients.archiveLine),
    },
    signature: {
      signMode: pickText(signature.signMode, EMPTY_FORM.signature.signMode),
      positionTitle: pickText(signature.positionTitle, EMPTY_FORM.signature.positionTitle),
      signerName: pickText(signature.signerName, DEFAULT_SIGNER_NAME),
    },
  });
}

async function getBm044RenderPayload(
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
    throw new Error(`Không tải được render-payload BM-044. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm044FormInputs(
  documentId: string | number,
  form: Bm044FormInputs,
): Promise<void> {
  const syncedPayload = buildSyncedForm(form);

  const includeJuvenileJusticeLine =
    form.detentionReplacement.includeJuvenileJusticeLine === true;

  const includeDetentionExtensionLegalBasis =
    form.detentionReplacement.includeDetentionExtensionLegalBasis === true;

  const savePayload: Bm044FormInputs = {
    ...syncedPayload,
    legalBasis: {
      ...syncedPayload.legalBasis,
      juvenileJusticeLine: includeJuvenileJusticeLine
        ? syncedPayload.legalBasis.juvenileJusticeLine
        : "",
    },
    detentionReplacement: {
      ...syncedPayload.detentionReplacement,
      includeJuvenileJusticeLine,
      includeDetentionExtensionLegalBasis,
      detentionExtensionLegalBasisLine: includeDetentionExtensionLegalBasis
        ? syncedPayload.detentionReplacement.detentionExtensionLegalBasisLine
        : "",
    },
  };

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

        // Lưu snapshot đầy đủ.
        formInputs: savePayload,

        // Đồng bộ field nền để backend không kéo lại dữ liệu cũ.
        person: {
          fullName: savePayload.detentionReplacement.accusedName,
        },
        offense: {
          offenseName: savePayload.detentionReplacement.offenseName,
          legalArticle: savePayload.detentionReplacement.legalArticle,
        },

        // savePayload đã chứa legalBasis/detentionReplacement với false flags đúng.
        ...savePayload,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Không lưu được dữ liệu BM-044. HTTP ${response.status}`);
  }
}

function CheckboxInput({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-6 text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
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

function PreviewArea({
  label,
  value,
  rows = 3,
}: {
  label: string;
  value: string;
  rows?: number;
}) {
  if (!value.trim()) {
    return null;
  }

  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        readOnly
        rows={rows}
        className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm leading-6 text-slate-700 shadow-sm outline-none"
      />
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
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function Bm044FormInputsPanel({
  documentId,
  onSaved,
}: Bm044FormInputsPanelProps) {
  const [form, setForm] = useState<Bm044FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const syncedForm = useMemo(() => buildSyncedForm(form), [form]);
  const isDirty = JSON.stringify(syncedForm) !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      return !getValue(syncedForm, item.section, item.field).trim();
    });
  }, [syncedForm]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const payload = await getBm044RenderPayload(documentId);
        const nextForm = normalizeFormInputs(payload);

        if (!isMounted) {
          return;
        }

        setForm(nextForm);
        setInitialSnapshot(JSON.stringify(buildSyncedForm(nextForm)));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-044.");
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

  function updateField<TSection extends SectionName>(
    sectionName: TSection,
    fieldName: keyof Bm044FormInputs[TSection],
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

  function updateDetentionBoolean(
    fieldName: "includeJuvenileJusticeLine" | "includeDetentionExtensionLegalBasis",
    value: boolean,
  ) {
    setForm((current) => ({
      ...current,
      detentionReplacement: {
        ...current.detentionReplacement,
        [fieldName]: value,
      },
    }));
  }

  function fillCustomerSample() {
    const sample = buildSyncedForm(EMPTY_FORM);

    setForm(sample);
    setErrorMessage("");
    setSuccessMessage("Đã điền dữ liệu mẫu BM-044. Bấm lưu để ghi vào backend.");
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const savePayload = buildSyncedForm(form);
      await saveBm044FormInputs(documentId, savePayload);

      setForm(savePayload);
      setInitialSnapshot(JSON.stringify(savePayload));
      setSuccessMessage("Đã lưu dữ liệu BM-044. Có thể render lại DOCX/PDF.");
      onSaved?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được dữ liệu BM-044.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu BM-044...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          BM-044
        </p>
        <h2 className="mt-2 text-xl font-bold text-emerald-950">
          Dữ liệu biểu mẫu Quyết định thay thế biện pháp tạm giam
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Form có checkbox điều kiện. Nếu không tick dòng người chưa thành niên hoặc dòng gia hạn,
          dữ liệu sẽ lưu rỗng để backend không render dòng đó.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-044
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-044"}
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

      <SectionCard
        title="1. Tùy chọn dòng điều kiện"
        description="Không tick thì không render dòng đó. Preview phía dưới cũng tự ẩn."
      >
        <CheckboxInput
          label="Áp dụng căn cứ Luật Tư pháp người chưa thành niên"
          checked={form.detentionReplacement.includeJuvenileJusticeLine}
          onChange={(value) => updateDetentionBoolean("includeJuvenileJusticeLine", value)}
          description="Tick để render dòng: Căn cứ Điều 138 và Điều 139..."
        />
        <CheckboxInput
          label="Có Quyết định gia hạn tạm giam / gia hạn thời hạn tạm giam để truy tố"
          checked={form.detentionReplacement.includeDetentionExtensionLegalBasis}
          onChange={(value) =>
            updateDetentionBoolean("includeDetentionExtensionLegalBasis", value)
          }
          description="Không tick thì bỏ hẳn dòng căn cứ gia hạn."
        />
      </SectionCard>

      <SectionCard title="2. Văn bản / cơ quan">
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
          label="Tên Viện kiểm sát trong thân văn bản"
          value={form.detentionReplacement.procuracyBodyName}
          onChange={(value) => updateField("detentionReplacement", "procuracyBodyName", value)}
          placeholder="Viện kiểm sát nhân dân khu vực 7"
        />
        <TextInput
          label="Số quyết định"
          value={form.document.documentCode}
          onChange={(value) => updateField("document", "documentCode", value)}
          required
        />
        <TextInput
          label="Ngày ban hành"
          value={form.document.issueDate}
          onChange={(value) => updateField("document", "issueDate", value)}
          placeholder="26/05/2026"
        />
        <TextInput
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value)}
        />
      </SectionCard>

      <SectionCard title="3. Bị can / tội danh">
        <TextInput
          label="Họ tên bị can"
          value={form.detentionReplacement.accusedName}
          onChange={(value) => updateField("detentionReplacement", "accusedName", value)}
          required
        />
        <TextInput
          label="Tên tội"
          value={form.detentionReplacement.offenseName}
          onChange={(value) => updateField("detentionReplacement", "offenseName", value)}
          required
        />
        <TextInput
          label="Điều luật"
          value={form.detentionReplacement.legalArticle}
          onChange={(value) => updateField("detentionReplacement", "legalArticle", value)}
          required
        />
        <TextInput
          label="Cơ quan đề nghị"
          value={form.detentionReplacement.investigationAgency}
          onChange={(value) =>
            updateField("detentionReplacement", "investigationAgency", value)
          }
          required
        />
        <TextInput
          label="Cơ quan thực hiện quyết định"
          value={form.detentionReplacement.executionAgencyName}
          onChange={(value) =>
            updateField("detentionReplacement", "executionAgencyName", value)
          }
          required
        />
      </SectionCard>

      <SectionCard title="4. Căn cứ tạm giam / gia hạn">
        <TextInput
          label="Số Lệnh tạm giam / Lệnh bắt bị can để tạm giam"
          value={form.detentionReplacement.detentionOrderCode}
          onChange={(value) =>
            updateField("detentionReplacement", "detentionOrderCode", value)
          }
          required
        />
        <TextInput
          label="Ngày Lệnh tạm giam"
          value={form.detentionReplacement.detentionOrderIssueDateText}
          onChange={(value) =>
            updateField("detentionReplacement", "detentionOrderIssueDateText", value)
          }
        />

        {form.detentionReplacement.includeDetentionExtensionLegalBasis ? (
          <>
            <TextInput
              label="Lần gia hạn"
              value={form.detentionReplacement.extensionDecisionRoundText}
              onChange={(value) =>
                updateField("detentionReplacement", "extensionDecisionRoundText", value)
              }
            />
            <TextInput
              label="Số Quyết định gia hạn"
              value={form.detentionReplacement.extensionDecisionCode}
              onChange={(value) =>
                updateField("detentionReplacement", "extensionDecisionCode", value)
              }
            />
            <TextInput
              label="Ngày Quyết định gia hạn"
              value={form.detentionReplacement.extensionDecisionIssueDateText}
              onChange={(value) =>
                updateField("detentionReplacement", "extensionDecisionIssueDateText", value)
              }
            />
          </>
        ) : null}
      </SectionCard>

      <SectionCard title="5. Biện pháp thay thế / thời hạn">
        <TextInput
          label="Biện pháp thay thế"
          value={form.detentionReplacement.replacementMeasureName}
          onChange={(value) =>
            updateField("detentionReplacement", "replacementMeasureName", value)
          }
          placeholder="cấm đi khỏi nơi cư trú"
          required
        />
        <TextInput
          label="Thời hạn áp dụng"
          value={form.detentionReplacement.replacementDurationText}
          onChange={(value) =>
            updateField("detentionReplacement", "replacementDurationText", value)
          }
          placeholder="02 tháng"
        />
        <TextInput
          label="Từ ngày"
          value={form.detentionReplacement.replacementFromDateText}
          onChange={(value) =>
            updateField("detentionReplacement", "replacementFromDateText", value)
          }
          placeholder="26/05/2026"
        />
        <TextInput
          label="Đến ngày"
          value={form.detentionReplacement.replacementToDateText}
          onChange={(value) =>
            updateField("detentionReplacement", "replacementToDateText", value)
          }
          placeholder="26/07/2026"
        />
      </SectionCard>

      <SectionCard
        title="6. Preview dòng sẽ render"
        description="Dòng không tick sẽ không hiển thị ở preview và khi lưu sẽ gửi rỗng về backend."
      >
        <PreviewArea
          label="Căn cứ BLTTHS"
          value={syncedForm.legalBasis.procedureArticlesLine}
        />
        <PreviewArea
          label="Căn cứ người chưa thành niên"
          value={syncedForm.legalBasis.juvenileJusticeLine}
        />
        <PreviewArea
          label="Căn cứ lệnh tạm giam"
          value={syncedForm.detentionReplacement.detentionOrderLegalBasisLine}
          rows={4}
        />
        <PreviewArea
          label="Căn cứ quyết định gia hạn nếu có"
          value={syncedForm.detentionReplacement.detentionExtensionLegalBasisLine}
          rows={4}
        />
        <PreviewArea
          label="Xét hồ sơ"
          value={syncedForm.detentionReplacement.proposalLine}
        />
        <PreviewArea
          label="Nhận thấy"
          value={syncedForm.detentionReplacement.reasonLine}
        />
        <PreviewArea
          label="Điều 1"
          value={syncedForm.detentionReplacement.article1Line}
        />
        <PreviewArea
          label="Thời hạn"
          value={syncedForm.detentionReplacement.durationLine}
        />
        <PreviewArea
          label="Điều 2"
          value={syncedForm.detentionReplacement.article2Line}
        />
      </SectionCard>

      <SectionCard title="7. Nơi nhận / chữ ký">
        <PreviewArea
          label="Nơi nhận - bị can"
          value={syncedForm.recipients.personLine}
        />
        <PreviewArea
          label="Nơi nhận - cơ quan đề nghị"
          value={syncedForm.recipients.proposalAgencyLine}
        />
        <PreviewArea
          label="Nơi nhận - cơ quan thực hiện"
          value={syncedForm.recipients.executionAgencyLine}
        />
        <TextInput
          label="Nơi nhận - lưu"
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
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
