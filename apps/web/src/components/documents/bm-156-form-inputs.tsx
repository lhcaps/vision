"use client";

import { useEffect, useMemo, useState } from "react";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldCheckbox,
  BmFormSection,
  BmFormMetaBar,
} from "./bm-form";

type Section = Record<string, string>;

type Bm156FormState = {
  agency: Section;
  document: Section;
  caseInfo: Section;
  official: Section;
  legalBasis: Section;
  caseDecision: Section;
  accusedDecision: Section;
  caseJoinder: Section;
  caseRecovery: Section;
  investigationConclusion: Section;
  indictment: Section;
  recipients: Section;
  signature: Section;
};

type Bm156FormInputsPanelProps = any;


function getBm156TodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const BM156_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const BM156_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const BM156_YEAR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(new Date().getFullYear() - 2 + index),
);

const EMPTY_FORM: Bm156FormState = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "",
    issueDate: getBm156TodayIso(),
    issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 21 tháng 5 năm 2026",
  },
  caseInfo: {
    accusedName: "",
    offenseName: "",
    legalArticle: "khoản 1 Điều 321",
    criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
    investigationAgencyName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  official: {
    issuerTitle: "",
  },
  legalBasis: {
    procedureArticlesLine: "",
  },
  caseDecision: {
    prosecutionDecisionLegalBasisLine: "",
  },
  accusedDecision: {
    prosecutionDecisionLegalBasisLine: "",
  },
  caseJoinder: {
    hasLegalBasisLine: "true",
    legalBasisLine: "",
  },
  caseRecovery: {
    hasLegalBasisLine: "true",
    legalBasisLine: "",
  },
  investigationConclusion: {
    legalBasisLine: "",
  },
  indictment: {
    criminalActDescriptionLine: "",
    aggravatingMitigatingAnalysisLine: "",
    evidenceHandlingLine: "",
    hasCivilLiabilityLine: "true",
    civilLiabilityLine: "",
    otherFactsLine: "",
    summaryConclusionLine: "",
    hasAbsentAccusedNoteLine: "true",
    absentAccusedNoteLine: "",
    defendantIdentityLine: "",
    familyBackgroundLine: "",
    hasSpecialStatusLine: "true",
    specialStatusLine: "",
    administrativeViolationLine: "",
    criminalRecordLine: "",
    preventiveMeasureLine: "",
    crimeConclusionLine: "",
    aggravatingMitigatingLine: "",
    hasSeparatedCaseHandlingLine: "true",
    separatedCaseHandlingLine: "",
    article1Line: "",
    hasReplacementLine: "true",
    replacementLine: "",
    caseFileLine: "",
    hasEvidenceListLine: "true",
    evidenceListLine: "",
    summonedPersonsLine: "",
  },
  recipients: {
    courtLine: "",
    accusedLine: "",
    hasDefenseCounselLine: "true",
    defenseCounselLine: "",
    investigatingAgencyLine: "",
    hasOtherRecipientLine: "true",
    otherRecipientLine: "",
    archiveLine: "",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

const SAMPLE_FORM: Bm156FormState = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    shortName: "VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "156/CT-VKSKV7",
    issueDate: getBm156TodayIso(),
    issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 21 tháng 5 năm 2026",
  },
  caseInfo: {
    accusedName: "",
    offenseName: "Đánh bạc",
    legalArticle: "khoản 1 Điều 321",
    criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
    investigationAgencyName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 236, 239 và 243 của Bộ luật Tố tụng hình sự;",
  },
  caseDecision: {
    prosecutionDecisionLegalBasisLine:
      "Căn cứ Quyết định khởi tố vụ án hình sự số G505/QĐ-VPCQCSĐT ngày 15 tháng 10 năm 2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội “Đánh bạc” quy định tại khoản 1 Điều 321 của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025;",
  },
  accusedDecision: {
    prosecutionDecisionLegalBasisLine:
      "Căn cứ Quyết định khởi tố bị can số  ngày 15 tháng 10 năm 2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với  về tội “Đánh bạc” quy định tại khoản 1 Điều 321 của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025;",
  },
  caseJoinder: {
    hasLegalBasisLine: "true",
    legalBasisLine:
      "Căn cứ Quyết định nhập vụ án hình sự số 03/QĐ-CQĐT ngày 10 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  },
  caseRecovery: {
    hasLegalBasisLine: "true",
    legalBasisLine:
      "Căn cứ Quyết định phục hồi vụ án hình sự số 04/QĐ-CQĐT ngày 15 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  },
  investigationConclusion: {
    legalBasisLine:
      "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 25/KLĐT ngày 20 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  },
  indictment: {
    criminalActDescriptionLine:
      " đã có hành vi đánh bạc trái phép tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh. Hành vi của bị can xâm phạm trật tự công cộng, đủ yếu tố cấu thành tội Đánh bạc theo quy định của Bộ luật Hình sự.",
    aggravatingMitigatingAnalysisLine:
      "Về tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự: bị can thành khẩn khai báo, ăn năn hối cải; chưa phát hiện tình tiết tăng nặng trách nhiệm hình sự.",
    evidenceHandlingLine:
      "Việc thu giữ, tạm giữ tài liệu, đồ vật và xử lý vật chứng được thực hiện theo hồ sơ vụ án.",
    hasCivilLiabilityLine: "true",
    civilLiabilityLine: "Phần dân sự: không có yêu cầu giải quyết trong vụ án.",
    otherFactsLine:
      "Các vấn đề khác có liên quan đã được xem xét trong quá trình giải quyết vụ án.",
    summaryConclusionLine:
      " đã thực hiện hành vi đánh bạc trái phép; hành vi có đủ yếu tố cấu thành tội Đánh bạc, thuộc trường hợp phải truy cứu trách nhiệm hình sự.",
    hasAbsentAccusedNoteLine: "true",
    absentAccusedNoteLine:
      "Bị can có mặt tại địa phương, không thuộc trường hợp vắng mặt bị can.",
    defendantIdentityLine:
      ", giới tính: Nam; nơi cư trú: số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh; nghề nghiệp: lao động tự do; trình độ học vấn: 9/12; quốc tịch: Việt Nam; dân tộc: Kinh.",
    familyBackgroundLine:
      "Về gia đình: cha, mẹ, anh chị em ruột, vợ/chồng, con của bị can được thể hiện trong hồ sơ vụ án.",
    hasSpecialStatusLine: "true",
    specialStatusLine:
      "Bị can không thuộc diện thương binh, bệnh binh, người có công hoặc có danh hiệu Nhà nước phong tặng.",
    administrativeViolationLine: "Tiền sự: không.",
    criminalRecordLine: "Tiền án: không.",
    preventiveMeasureLine:
      "Bị can đang bị áp dụng biện pháp ngăn chặn cấm đi khỏi nơi cư trú theo quyết định của cơ quan có thẩm quyền.",
    crimeConclusionLine:
      "Bị can  phạm tội “Đánh bạc” theo quy định tại khoản 1 Điều 321 Bộ luật Hình sự.",
    aggravatingMitigatingLine:
      "Áp dụng tình tiết giảm nhẹ trách nhiệm hình sự: thành khẩn khai báo, ăn năn hối cải; chưa áp dụng tình tiết tăng nặng trách nhiệm hình sự.",
    hasSeparatedCaseHandlingLine: "true",
    separatedCaseHandlingLine:
      "Trong vụ án không có người hoặc pháp nhân được đình chỉ, tạm đình chỉ, tách ra để xử lý trong vụ án khác.",
    article1Line:
      "Truy tố ra trước Tòa án nhân dân có thẩm quyền để xét xử bị can  về tội “Đánh bạc” theo quy định tại khoản 1 Điều 321 Bộ luật Hình sự.",
    hasReplacementLine: "true",
    replacementLine:
      "Cáo trạng này thay thế Cáo trạng số 01/CT-VKSKV7 ngày 10 tháng 5 năm 2026 của Viện kiểm sát nhân dân khu vực 7.",
    caseFileLine:
      "- Hồ sơ vụ án gồm có: 01 tập, bằng 120 tờ; đánh số thứ tự từ 01 đến 120.",
    hasEvidenceListLine: "true",
    evidenceListLine: "- Bản kê vật chứng kèm theo hồ sơ vụ án.",
    summonedPersonsLine:
      "- Danh sách những người Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa.",
  },
  recipients: {
    courtLine: "- Tòa án nhân dân có thẩm quyền;",
    accusedLine: "- ;",
    hasDefenseCounselLine: "true",
    defenseCounselLine: "- Người bào chữa/người đại diện của bị can;",
    investigatingAgencyLine:
      "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    hasOtherRecipientLine: "true",
    otherRecipientLine: "- Các cá nhân, cơ quan có liên quan;",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3001/api/v1"
  );
}

function readString(source: unknown, key: string): string {
  if (!source || typeof source !== "object") {
    return "";
  }

  const value = (source as Record<string, unknown>)[key];

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getSection(source: unknown, key: string): Record<string, unknown> {
  if (!source || typeof source !== "object") {
    return {};
  }

  const value = (source as Record<string, unknown>)[key];

  if (!value || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

function isChecked(value: unknown): boolean {
  return String(value ?? "").trim().toLowerCase() === "true";
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function formatVietnameseDate(value: string): string {
  const raw = normalizeText(value);

  if (!raw) {
    return "";
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/u);
  if (iso) {
    return `${Number(iso[3])} tháng ${Number(iso[2])} năm ${iso[1]}`;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    const year = slash[3];

    if (first > 12) {
      return `${first} tháng ${second} năm ${year}`;
    }

    return `${second} tháng ${first} năm ${year}`;
  }

  return raw.replace(/^ngày\s+/iu, "");
}

function buildIssuePlaceAndDateLine(form: Bm156FormState): string {
  const place = normalizeText(form.agency.issuePlace) || "TP. Hồ Chí Minh";
  const dateText = formatVietnameseDate(form.document.issueDate);

  if (!dateText) {
    return normalizeText(form.document.issuePlaceAndDateLine);
  }

  return `${place}, ngày ${dateText}`;
}

function normalizePayloadToForm(payload: unknown): Bm156FormState {
  const formInputs = getSection(payload, "formInputs");

  function section(name: keyof Bm156FormState): Record<string, unknown> {
    return {
      ...getSection(payload, name),
      ...getSection(formInputs, name),
    };
  }

  const agency = section("agency");
  const document = section("document");
  const caseInfo = section("caseInfo");
  const official = section("official");
  const legalBasis = section("legalBasis");
  const caseDecision = section("caseDecision");
  const accusedDecision = section("accusedDecision");
  const caseJoinder = section("caseJoinder");
  const caseRecovery = section("caseRecovery");
  const investigationConclusion = section("investigationConclusion");
  const indictment = section("indictment");
  const recipients = section("recipients");
  const signature = section("signature");

  return {
    agency: {
      parentName: readString(agency, "parentName") || EMPTY_FORM.agency.parentName,
      name: readString(agency, "name") || EMPTY_FORM.agency.name,
      shortName: readString(agency, "shortName") || EMPTY_FORM.agency.shortName,
      issuePlace:
        readString(agency, "issuePlace") ||
        readString(document, "issuePlace") ||
        EMPTY_FORM.agency.issuePlace,
    },
    document: {
      documentCode:
        readString(document, "documentCode") ||
        readString(document, "fullDocumentCode") ||
        EMPTY_FORM.document.documentCode,
      issueDate: readString(document, "issueDate") || EMPTY_FORM.document.issueDate,
      issuePlaceAndDateLine:
        readString(document, "issuePlaceAndDateLine") ||
        readString(document, "issuePlaceDateLine") ||
        EMPTY_FORM.document.issuePlaceAndDateLine,
    },
    caseInfo: {
      accusedName:
        readString(caseInfo, "accusedName") ||
        readString(indictment, "accusedName") ||
        "",
      offenseName:
        readString(caseInfo, "offenseName") ||
        "Đánh bạc",
      legalArticle:
        readString(caseInfo, "legalArticle") ||
        "khoản 1 Điều 321",
      criminalCodeText:
        readString(caseInfo, "criminalCodeText") ||
        "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      investigationAgencyName:
        readString(caseInfo, "investigationAgencyName") ||
        readString(recipients, "investigatingAgencyLine").replace(/^[-\\s]+/u, "").replace(/[;.]+$/u, "") ||
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    },
    official: {
      issuerTitle:
        readString(official, "issuerTitle") || EMPTY_FORM.official.issuerTitle,
    },
    legalBasis: {
      procedureArticlesLine:
        readString(legalBasis, "procedureArticlesLine") ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    caseDecision: {
      prosecutionDecisionLegalBasisLine:
        readString(caseDecision, "prosecutionDecisionLegalBasisLine") ||
        EMPTY_FORM.caseDecision.prosecutionDecisionLegalBasisLine,
    },
    accusedDecision: {
      prosecutionDecisionLegalBasisLine:
        readString(accusedDecision, "prosecutionDecisionLegalBasisLine") ||
        EMPTY_FORM.accusedDecision.prosecutionDecisionLegalBasisLine,
    },
    caseJoinder: {
      hasLegalBasisLine:
        readString(caseJoinder, "hasLegalBasisLine") ||
        (readString(caseJoinder, "legalBasisLine") ? "true" : "false"),
      legalBasisLine:
        readString(caseJoinder, "legalBasisLine") ||
        EMPTY_FORM.caseJoinder.legalBasisLine,
    },
    caseRecovery: {
      hasLegalBasisLine:
        readString(caseRecovery, "hasLegalBasisLine") ||
        (readString(caseRecovery, "legalBasisLine") ? "true" : "false"),
      legalBasisLine:
        readString(caseRecovery, "legalBasisLine") ||
        EMPTY_FORM.caseRecovery.legalBasisLine,
    },
    investigationConclusion: {
      legalBasisLine:
        readString(investigationConclusion, "legalBasisLine") ||
        EMPTY_FORM.investigationConclusion.legalBasisLine,
    },
    indictment: {
      criminalActDescriptionLine:
        readString(indictment, "criminalActDescriptionLine") ||
        EMPTY_FORM.indictment.criminalActDescriptionLine,
      aggravatingMitigatingAnalysisLine:
        readString(indictment, "aggravatingMitigatingAnalysisLine") ||
        EMPTY_FORM.indictment.aggravatingMitigatingAnalysisLine,
      evidenceHandlingLine:
        readString(indictment, "evidenceHandlingLine") ||
        EMPTY_FORM.indictment.evidenceHandlingLine,
      hasCivilLiabilityLine:
        readString(indictment, "hasCivilLiabilityLine") ||
        (readString(indictment, "civilLiabilityLine") ? "true" : "false"),
      civilLiabilityLine:
        readString(indictment, "civilLiabilityLine") ||
        EMPTY_FORM.indictment.civilLiabilityLine,
      otherFactsLine:
        readString(indictment, "otherFactsLine") ||
        EMPTY_FORM.indictment.otherFactsLine,
      summaryConclusionLine:
        readString(indictment, "summaryConclusionLine") ||
        EMPTY_FORM.indictment.summaryConclusionLine,
      hasAbsentAccusedNoteLine:
        readString(indictment, "hasAbsentAccusedNoteLine") ||
        (readString(indictment, "absentAccusedNoteLine") ? "true" : "false"),
      absentAccusedNoteLine:
        readString(indictment, "absentAccusedNoteLine") ||
        EMPTY_FORM.indictment.absentAccusedNoteLine,
      defendantIdentityLine:
        readString(indictment, "defendantIdentityLine") ||
        EMPTY_FORM.indictment.defendantIdentityLine,
      familyBackgroundLine:
        readString(indictment, "familyBackgroundLine") ||
        EMPTY_FORM.indictment.familyBackgroundLine,
      hasSpecialStatusLine:
        readString(indictment, "hasSpecialStatusLine") ||
        (readString(indictment, "specialStatusLine") ? "true" : "false"),
      specialStatusLine:
        readString(indictment, "specialStatusLine") ||
        EMPTY_FORM.indictment.specialStatusLine,
      administrativeViolationLine:
        readString(indictment, "administrativeViolationLine") ||
        EMPTY_FORM.indictment.administrativeViolationLine,
      criminalRecordLine:
        readString(indictment, "criminalRecordLine") ||
        EMPTY_FORM.indictment.criminalRecordLine,
      preventiveMeasureLine:
        readString(indictment, "preventiveMeasureLine") ||
        EMPTY_FORM.indictment.preventiveMeasureLine,
      crimeConclusionLine:
        readString(indictment, "crimeConclusionLine") ||
        EMPTY_FORM.indictment.crimeConclusionLine,
      aggravatingMitigatingLine:
        readString(indictment, "aggravatingMitigatingLine") ||
        EMPTY_FORM.indictment.aggravatingMitigatingLine,
      hasSeparatedCaseHandlingLine:
        readString(indictment, "hasSeparatedCaseHandlingLine") ||
        (readString(indictment, "separatedCaseHandlingLine") ? "true" : "false"),
      separatedCaseHandlingLine:
        readString(indictment, "separatedCaseHandlingLine") ||
        EMPTY_FORM.indictment.separatedCaseHandlingLine,
      article1Line:
        readString(indictment, "article1Line") ||
        EMPTY_FORM.indictment.article1Line,
      hasReplacementLine:
        readString(indictment, "hasReplacementLine") ||
        (readString(indictment, "replacementLine") ? "true" : "false"),
      replacementLine:
        readString(indictment, "replacementLine") ||
        EMPTY_FORM.indictment.replacementLine,
      caseFileLine:
        readString(indictment, "caseFileLine") ||
        EMPTY_FORM.indictment.caseFileLine,
      hasEvidenceListLine:
        readString(indictment, "hasEvidenceListLine") ||
        (readString(indictment, "evidenceListLine") ? "true" : "false"),
      evidenceListLine:
        readString(indictment, "evidenceListLine") ||
        EMPTY_FORM.indictment.evidenceListLine,
      summonedPersonsLine:
        readString(indictment, "summonedPersonsLine") ||
        EMPTY_FORM.indictment.summonedPersonsLine,
    },
    recipients: {
      courtLine:
        readString(recipients, "courtLine") || EMPTY_FORM.recipients.courtLine,
      accusedLine:
        readString(recipients, "accusedLine") || EMPTY_FORM.recipients.accusedLine,
      hasDefenseCounselLine:
        readString(recipients, "hasDefenseCounselLine") ||
        (readString(recipients, "defenseCounselLine") ? "true" : "false"),
      defenseCounselLine:
        readString(recipients, "defenseCounselLine") ||
        EMPTY_FORM.recipients.defenseCounselLine,
      investigatingAgencyLine:
        readString(recipients, "investigatingAgencyLine") ||
        EMPTY_FORM.recipients.investigatingAgencyLine,
      hasOtherRecipientLine:
        readString(recipients, "hasOtherRecipientLine") ||
        (readString(recipients, "otherRecipientLine") ? "true" : "false"),
      otherRecipientLine:
        readString(recipients, "otherRecipientLine") ||
        EMPTY_FORM.recipients.otherRecipientLine,
      archiveLine:
        readString(recipients, "archiveLine") ||
        EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: readString(signature, "signMode") || EMPTY_FORM.signature.signMode,
      positionTitle:
        readString(signature, "positionTitle") ||
        EMPTY_FORM.signature.positionTitle,
      signerName:
        readString(signature, "signerName") || EMPTY_FORM.signature.signerName,
    },
  };
}


function ensureBm156Sentence(value: string, ending = ";"): string {
  const clean = normalizeText(value);
  if (!clean) return "";
  if (/[.;:]$/u.test(clean)) return clean;
  return `${clean}${ending}`;
}

function buildRenderReadyForm(form: Bm156FormState): Bm156FormState {
  const accusedName = normalizeText(form.caseInfo?.accusedName) || "";
  const offenseName = normalizeText(form.caseInfo?.offenseName) || "Đánh bạc";
  const legalArticle = normalizeText(form.caseInfo?.legalArticle) || "khoản 1 Điều 321";
  const criminalCodeText =
    normalizeText(form.caseInfo?.criminalCodeText) ||
    "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025";
  const investigationAgency =
    normalizeText(form.caseInfo?.investigationAgencyName) ||
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

  const ready: Bm156FormState = {
    ...form,
    document: {
      ...form.document,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form),
    },
    caseDecision: {
      ...form.caseDecision,
      prosecutionDecisionLegalBasisLine: ensureBm156Sentence(
        form.caseDecision.prosecutionDecisionLegalBasisLine,
      ).replace(/tội\\s+“[^”]+”/giu, `tội “${offenseName}”`),
    },
    accusedDecision: {
      ...form.accusedDecision,
      prosecutionDecisionLegalBasisLine: ensureBm156Sentence(
        form.accusedDecision.prosecutionDecisionLegalBasisLine,
      )
        .replace(/đối với\\s+[^,;]+?\\s+về tội/giu, `đối với ${accusedName} về tội`)
        .replace(/tội\\s+“[^”]+”/giu, `tội “${offenseName}”`),
    },
    caseJoinder: {
      ...form.caseJoinder,
      legalBasisLine: isChecked(form.caseJoinder.hasLegalBasisLine)
        ? ensureBm156Sentence(form.caseJoinder.legalBasisLine)
        : "",
    },
    caseRecovery: {
      ...form.caseRecovery,
      legalBasisLine: isChecked(form.caseRecovery.hasLegalBasisLine)
        ? ensureBm156Sentence(form.caseRecovery.legalBasisLine)
        : "",
    },
    investigationConclusion: {
      ...form.investigationConclusion,
      legalBasisLine: ensureBm156Sentence(form.investigationConclusion.legalBasisLine),
    },
    indictment: {
      ...form.indictment,
      criminalActDescriptionLine:
        normalizeText(form.indictment.criminalActDescriptionLine) ||
        `${accusedName} đã có hành vi ${offenseName.toLowerCase()} trái phép. Hành vi của bị can đủ yếu tố cấu thành tội ${offenseName} theo quy định của Bộ luật Hình sự.`,
      civilLiabilityLine: isChecked(form.indictment.hasCivilLiabilityLine)
        ? normalizeText(form.indictment.civilLiabilityLine)
        : "",
      absentAccusedNoteLine: isChecked(form.indictment.hasAbsentAccusedNoteLine)
        ? normalizeText(form.indictment.absentAccusedNoteLine)
        : "",
      specialStatusLine: isChecked(form.indictment.hasSpecialStatusLine)
        ? normalizeText(form.indictment.specialStatusLine)
        : "",
      separatedCaseHandlingLine: isChecked(form.indictment.hasSeparatedCaseHandlingLine)
        ? normalizeText(form.indictment.separatedCaseHandlingLine)
        : "",
      replacementLine: isChecked(form.indictment.hasReplacementLine)
        ? normalizeText(form.indictment.replacementLine)
        : "",
      evidenceListLine: isChecked(form.indictment.hasEvidenceListLine)
        ? normalizeText(form.indictment.evidenceListLine)
        : "",
      summaryConclusionLine:
        normalizeText(form.indictment.summaryConclusionLine) ||
        `${accusedName} đã thực hiện hành vi ${offenseName.toLowerCase()}; hành vi có đủ yếu tố cấu thành tội ${offenseName}, thuộc trường hợp phải truy cứu trách nhiệm hình sự.`,
      defendantIdentityLine:
        normalizeText(form.indictment.defendantIdentityLine) ||
        `${accusedName}; các thông tin nhân thân thể hiện trong hồ sơ vụ án.`,
      crimeConclusionLine:
        `Bị can ${accusedName} phạm tội “${offenseName}” theo quy định tại ${legalArticle} ${criminalCodeText}.`,
      article1Line:
        `Truy tố ra trước Tòa án nhân dân có thẩm quyền để xét xử bị can ${accusedName} về tội “${offenseName}” theo quy định tại ${legalArticle} ${criminalCodeText}.`,
    },
    recipients: {
      ...form.recipients,
      accusedLine: `- ${accusedName};`,
      investigatingAgencyLine:
        normalizeText(form.recipients.investigatingAgencyLine) ||
        `- ${investigationAgency};`,
      defenseCounselLine: isChecked(form.recipients.hasDefenseCounselLine)
        ? normalizeText(form.recipients.defenseCounselLine)
        : "",
      otherRecipientLine: isChecked(form.recipients.hasOtherRecipientLine)
        ? normalizeText(form.recipients.otherRecipientLine)
        : "",
    },
    signature: {
      ...form.signature,
      signMode: form.signature.signMode || "KT. VIỆN TRƯỞNG",
      positionTitle: form.signature.positionTitle || "PHÓ VIỆN TRƯỞNG",
      signerName: form.signature.signerName || "",
    },
  };

  return ready;
}


async function postJson(url: string, body: Record<string, unknown>): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Không gọi được API BM-156.");
  }
}

function TextInput(props: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {props.label}
        {props.required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
      />
    </label>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  required?: boolean;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {props.label}
        {props.required ? <span className="text-red-600"> *</span> : null}
      </span>
      <textarea
        value={props.value}
        rows={props.rows ?? 3}
        onChange={(event) => props.onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
      />
    </label>
  );
}

function OptionalTextArea(props: {
  checked: boolean;
  label: string;
  value: string;
  rows?: number;
  onToggle: (checked: boolean) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(event) => props.onToggle(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        {props.label}
      </label>

      {props.checked ? (
        <div className="mt-3">
          <BmFieldTextarea
            label="Nội dung"
            value={props.value}
            rows={props.rows ?? 2}
            onChange={props.onChange}
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Không chọn thì dòng này sẽ gửi rỗng. Sau bước optional paragraph,
          renderer sẽ xóa nguyên dòng để không còn khoảng trắng.
        </p>
      )}
    </div>
  );
}


function parseBm156DateParts(value: string): { day: string; month: string; year: string } {
  const raw = normalizeText(value);

  const iso = raw.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})$/u);
  if (iso) {
    return {
      day: String(Number(iso[3])).padStart(2, "0"),
      month: String(Number(iso[2])).padStart(2, "0"),
      year: iso[1],
    };
  }

  return { day: "", month: "", year: "" };
}

function buildBm156IsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}



function DateSelectField(props: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const effectiveValue = props.value || getBm156TodayIso();
  const parsed = parseBm156DateParts(effectiveValue);
  const [parts, setParts] = useState(parsed);

  useEffect(() => {
    const nextValue = props.value || getBm156TodayIso();
    const nextParts = parseBm156DateParts(nextValue);

    setParts(nextParts);

    // Nếu form/backend đang rỗng thì tự đẩy ngày hiện tại vào form.
    if (!props.value && nextValue) {
      props.onChange(nextValue);
    }
  }, [props.value, props.onChange]);

  function update(part: "day" | "month" | "year", value: string) {
    const next = { ...parts, [part]: value };
    setParts(next);

    if (next.day && next.month && next.year) {
      props.onChange(buildBm156IsoDate(next.day, next.month, next.year));
    }
  }

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {props.label}
        {props.required ? <span className="text-red-600"> *</span> : null}
      </span>

      <div className="mt-1 grid grid-cols-3 gap-2">
        <select
          value={parts.day}
          onChange={(event) => update("day", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Ngày</option>
          {BM156_DAY_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {Number(item)}
            </option>
          ))}
        </select>

        <select
          value={parts.month}
          onChange={(event) => update("month", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Tháng</option>
          {BM156_MONTH_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {Number(item)}
            </option>
          ))}
        </select>

        <select
          value={parts.year}
          onChange={(event) => update("year", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="">Năm</option>
          {BM156_YEAR_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function PreviewBox(props: { title: string; lines: string[] }) {
  const lines = props.lines.map((line) => normalizeText(line)).filter(Boolean);

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
      <p className="text-sm font-bold text-sky-950">{props.title}</p>
      <div className="mt-3 space-y-2 rounded-lg bg-white p-3 text-sm leading-6 text-slate-800">
        {lines.length ? lines.map((line, index) => (
          <p key={index} className="whitespace-pre-wrap">{line}</p>
        )) : <p className="text-slate-400">Chưa có dữ liệu preview.</p>}
      </div>
    </div>
  );
}

function SectionBox(props: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{props.title}</h3>
      {props.description ? (
        <p className="mt-1 text-xs text-slate-500">{props.description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{props.children}</div>
    </section>
  );
}

export function Bm156FormInputsPanel(props: Bm156FormInputsPanelProps) {
  const documentId = useMemo(() => {
    const raw =
      props.documentId ??
      props.generatedDocumentId ??
      props.document?.id ??
      props.generatedDocument?.id ??
      props.data?.id;

    return raw === null || raw === undefined ? "" : String(raw);
  }, [props]);

  const [form, setForm] = useState<Bm156FormState>(SAMPLE_FORM);
  const [initialForm, setInitialForm] = useState<Bm156FormState>(SAMPLE_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  const apiBase = getApiBaseUrl();

  function updateSection(
    sectionName: keyof Bm156FormState,
    fieldName: string,
    value: string,
  ): void {
    setForm((current) => ({
      ...current,
      [sectionName]: {
        ...(current[sectionName] as Section),
        [fieldName]: value,
      },
    }));
  }

  async function loadFromBackend(): Promise<void> {
    if (!documentId) {
      setErrorMessage("Không xác định được documentId BM-156.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${apiBase}/documents/generated/${documentId}/render-payload`,
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = await response.json();
      const next = normalizePayloadToForm(payload);
      setForm(next);
      setInitialForm(next);
      setSuccessMessage("Đã tải dữ liệu BM-156 từ backend.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không tải được dữ liệu BM-156.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(): Promise<void> {
    if (!documentId) {
      setErrorMessage("Không xác định được documentId BM-156.");
      return;
    }

    const renderReadyForm = buildRenderReadyForm(form);

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await postJson(`${apiBase}/documents/generated/${documentId}/form-inputs`, {
        ...renderReadyForm,
        formInputs: renderReadyForm,
        payloadOverrides: renderReadyForm,
        renderPayloadOverrides: renderReadyForm,
        updatedByName: "",
      });

      await postJson(`${apiBase}/documents/generated/${documentId}/render-docx`, {
        force: true,
        renderedByName: "",
      });

      await postJson(`${apiBase}/documents/generated/${documentId}/convert-pdf`, {
        force: true,
        convertedByName: "",
      });

      setForm(renderReadyForm);
      setInitialForm(renderReadyForm);
      props.onSaved?.();
      setSuccessMessage("Đã lưu và render lại DOCX/PDF BM-156.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Lưu BM-156 thất bại.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    void loadFromBackend();
     
  }, [documentId]);

  const renderPreview = buildRenderReadyForm(form);

  return (
    <div className="space-y-4">
      <BmFormCasePayloadButton templateCode="BM-156" form={form} onApply={(next) => setForm(next as typeof form)} />
      <BmFormMetaBar
        templateCode="BM-156"
        title="Cáo trạng"
        subtitle="Biểu mẫu Cáo trạng - render scope: CASE_LEVEL · 1 file / vụ án. Mỗi ô bên dưới map đúng 1 placeholder trong BM-156, không dùng form cũ gộp sai dữ liệu."
        isDirty={isDirty}
        isLoading={isLoading}
        isSaving={isSaving}
        errorMessage={errorMessage}
        successMessage={successMessage}
        primaryLabel="Lưu và render BM-156"
        onPrimary={() => void handleSave()}
        primaryDisabled={isSaving}
        secondaryLabel="Tải lại từ backend"
        onSecondary={() => void loadFromBackend()}
        extraActions={
          <>
            <button
              type="button"
              onClick={() => setForm(SAMPLE_FORM)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Điền dữ liệu mẫu BM-156
            </button>
          </>
        }
      />

      <BmFormSection
        title="1. Cơ quan / thông tin cáo trạng"
        description="Các trường này ảnh hưởng phần đầu cáo trạng."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText
            label="Cơ quan cấp trên"
            required
            value={form.agency.parentName}
            onChange={(value) => updateSection("agency", "parentName", value)}
          />
          <BmFieldText
            label="Viện kiểm sát ban hành"
            required
            value={form.agency.name}
            onChange={(value) => updateSection("agency", "name", value)}
          />
          <BmFieldText
            label="Tên viết tắt"
            value={form.agency.shortName}
            onChange={(value) => updateSection("agency", "shortName", value)}
          />
          <BmFieldText
            label="Địa danh"
            required
            value={form.agency.issuePlace}
            onChange={(value) => updateSection("agency", "issuePlace", value)}
          />
          <BmFieldText
            label="Số cáo trạng"
            required
            value={form.document.documentCode}
            onChange={(value) => updateSection("document", "documentCode", value)}
          />
          <DateSelectField
            label="Ngày cáo trạng"
            required
            value={form.document.issueDate || getBm156TodayIso()}
            onChange={(value) => updateSection("document", "issueDate", value)}
          />
          <BmFieldText
            label="Tên bị can"
            required
            value={form.caseInfo.accusedName}
            onChange={(value) => updateSection("caseInfo", "accusedName", value)}
          />
          <BmFieldText
            label="Tên tội"
            required
            value={form.caseInfo.offenseName}
            onChange={(value) => updateSection("caseInfo", "offenseName", value)}
          />
        </div>

        <BmFieldText
          label="Chủ thể ban hành"
          required
          value={form.official.issuerTitle}
          onChange={(value) => updateSection("official", "issuerTitle", value)}
        />

        <BmFieldText
          label="Dòng ngày tháng sẽ render"
          value={renderPreview.document.issuePlaceAndDateLine}
          onChange={(value) =>
            updateSection("document", "issuePlaceAndDateLine", value)
          }
        />
      </BmFormSection>

      <BmFormSection title="2. Sáu dòng căn cứ tố tụng">
        <BmFieldTextarea
          label="1. Căn cứ các điều BLTTHS"
          required
          value={form.legalBasis.procedureArticlesLine}
          onChange={(value) =>
            updateSection("legalBasis", "procedureArticlesLine", value)
          }
        />
        <BmFieldTextarea
          label="2. Căn cứ quyết định khởi tố vụ án"
          required
          value={form.caseDecision.prosecutionDecisionLegalBasisLine}
          onChange={(value) =>
            updateSection("caseDecision", "prosecutionDecisionLegalBasisLine", value)
          }
        />
        <BmFieldTextarea
          label="3. Căn cứ quyết định khởi tố bị can"
          required
          value={form.accusedDecision.prosecutionDecisionLegalBasisLine}
          onChange={(value) =>
            updateSection(
              "accusedDecision",
              "prosecutionDecisionLegalBasisLine",
              value,
            )
          }
        />
        <OptionalTextArea
          checked={isChecked(form.caseJoinder.hasLegalBasisLine)}
          label="4. Có Quyết định nhập vụ án hình sự"
          value={form.caseJoinder.legalBasisLine}
          onToggle={(checked) =>
            updateSection("caseJoinder", "hasLegalBasisLine", checked ? "true" : "false")
          }
          onChange={(value) => updateSection("caseJoinder", "legalBasisLine", value)}
        />
        <OptionalTextArea
          checked={isChecked(form.caseRecovery.hasLegalBasisLine)}
          label="5. Có Quyết định phục hồi vụ án hình sự"
          value={form.caseRecovery.legalBasisLine}
          onToggle={(checked) =>
            updateSection("caseRecovery", "hasLegalBasisLine", checked ? "true" : "false")
          }
          onChange={(value) => updateSection("caseRecovery", "legalBasisLine", value)}
        />
        <BmFieldTextarea
          label="6. Căn cứ bản kết luận điều tra"
          required
          value={form.investigationConclusion.legalBasisLine}
          onChange={(value) =>
            updateSection("investigationConclusion", "legalBasisLine", value)
          }
        />
      </BmFormSection>

      <PreviewBox
        title="Preview căn cứ trước khi render"
        lines={[
          renderPreview.legalBasis.procedureArticlesLine,
          renderPreview.caseDecision.prosecutionDecisionLegalBasisLine,
          renderPreview.accusedDecision.prosecutionDecisionLegalBasisLine,
          renderPreview.caseJoinder.legalBasisLine,
          renderPreview.caseRecovery.legalBasisLine,
          renderPreview.investigationConclusion.legalBasisLine,
        ]}
      />

      <PreviewBox
        title="Preview nội dung truy tố"
        lines={[
          renderPreview.indictment.criminalActDescriptionLine,
          renderPreview.indictment.summaryConclusionLine,
          renderPreview.indictment.defendantIdentityLine,
          renderPreview.indictment.crimeConclusionLine,
          renderPreview.indictment.article1Line,
        ]}
      />

      <BmFormSection title="3. Kết quả điều tra / diễn biến hành vi">
        <BmFieldTextarea
          label="Diễn biến hành vi phạm tội"
          required
          rows={5}
          value={form.indictment.criminalActDescriptionLine}
          onChange={(value) =>
            updateSection("indictment", "criminalActDescriptionLine", value)
          }
        />
        <BmFieldTextarea
          label="Phân tích tình tiết tăng nặng, giảm nhẹ"
          required
          rows={3}
          value={form.indictment.aggravatingMitigatingAnalysisLine}
          onChange={(value) =>
            updateSection("indictment", "aggravatingMitigatingAnalysisLine", value)
          }
        />
        <BmFieldTextarea
          label="Việc thu giữ, xử lý vật chứng"
          required
          rows={3}
          value={form.indictment.evidenceHandlingLine}
          onChange={(value) =>
            updateSection("indictment", "evidenceHandlingLine", value)
          }
        />
        <OptionalTextArea
          checked={isChecked(form.indictment.hasCivilLiabilityLine)}
          label="Có phần dân sự"
          value={form.indictment.civilLiabilityLine}
          onToggle={(checked) =>
            updateSection("indictment", "hasCivilLiabilityLine", checked ? "true" : "false")
          }
          onChange={(value) => updateSection("indictment", "civilLiabilityLine", value)}
        />
        <BmFieldTextarea
          label="Các vấn đề khác"
          value={form.indictment.otherFactsLine}
          onChange={(value) => updateSection("indictment", "otherFactsLine", value)}
        />
      </BmFormSection>

      <BmFormSection title="4. Kết luận truy tố">
        <BmFieldTextarea
          label="Tổng hợp kết luận hành vi phạm tội"
          required
          rows={4}
          value={form.indictment.summaryConclusionLine}
          onChange={(value) =>
            updateSection("indictment", "summaryConclusionLine", value)
          }
        />
        <OptionalTextArea
          checked={isChecked(form.indictment.hasAbsentAccusedNoteLine)}
          label="Có ghi chú về bị can vắng mặt"
          value={form.indictment.absentAccusedNoteLine}
          onToggle={(checked) =>
            updateSection(
              "indictment",
              "hasAbsentAccusedNoteLine",
              checked ? "true" : "false",
            )
          }
          onChange={(value) =>
            updateSection("indictment", "absentAccusedNoteLine", value)
          }
        />
        <BmFieldTextarea
          label="Lý lịch bị can"
          required
          rows={4}
          value={form.indictment.defendantIdentityLine}
          onChange={(value) =>
            updateSection("indictment", "defendantIdentityLine", value)
          }
        />
        <BmFieldTextarea
          label="Quan hệ gia đình"
          rows={3}
          value={form.indictment.familyBackgroundLine}
          onChange={(value) =>
            updateSection("indictment", "familyBackgroundLine", value)
          }
        />
        <OptionalTextArea
          checked={isChecked(form.indictment.hasSpecialStatusLine)}
          label="Có thông tin thương binh/bệnh binh/người có công"
          value={form.indictment.specialStatusLine}
          onToggle={(checked) =>
            updateSection("indictment", "hasSpecialStatusLine", checked ? "true" : "false")
          }
          onChange={(value) => updateSection("indictment", "specialStatusLine", value)}
        />
        <BmFieldTextarea
          label="Tiền sự"
          value={form.indictment.administrativeViolationLine}
          onChange={(value) =>
            updateSection("indictment", "administrativeViolationLine", value)
          }
        />
        <BmFieldTextarea
          label="Tiền án"
          value={form.indictment.criminalRecordLine}
          onChange={(value) =>
            updateSection("indictment", "criminalRecordLine", value)
          }
        />
        <BmFieldTextarea
          label="Biện pháp ngăn chặn/cưỡng chế"
          rows={3}
          value={form.indictment.preventiveMeasureLine}
          onChange={(value) =>
            updateSection("indictment", "preventiveMeasureLine", value)
          }
        />
        <BmFieldTextarea
          label="Khẳng định tội danh"
          required
          rows={3}
          value={form.indictment.crimeConclusionLine}
          onChange={(value) =>
            updateSection("indictment", "crimeConclusionLine", value)
          }
        />
        <BmFieldTextarea
          label="Tình tiết tăng nặng, giảm nhẹ áp dụng"
          rows={3}
          value={form.indictment.aggravatingMitigatingLine}
          onChange={(value) =>
            updateSection("indictment", "aggravatingMitigatingLine", value)
          }
        />
        <OptionalTextArea
          checked={isChecked(form.indictment.hasSeparatedCaseHandlingLine)}
          label="Có người/pháp nhân được đình chỉ, tạm đình chỉ, tách vụ án"
          value={form.indictment.separatedCaseHandlingLine}
          onToggle={(checked) =>
            updateSection(
              "indictment",
              "hasSeparatedCaseHandlingLine",
              checked ? "true" : "false",
            )
          }
          onChange={(value) =>
            updateSection("indictment", "separatedCaseHandlingLine", value)
          }
        />
      </BmFormSection>

      <BmFormSection title="5. Quyết định truy tố">
        <BmFieldTextarea
          label="Điều 1 - Quyết định truy tố"
          required
          rows={4}
          value={form.indictment.article1Line}
          onChange={(value) => updateSection("indictment", "article1Line", value)}
        />
        <OptionalTextArea
          checked={isChecked(form.indictment.hasReplacementLine)}
          label="Có cáo trạng thay thế"
          value={form.indictment.replacementLine}
          onToggle={(checked) =>
            updateSection("indictment", "hasReplacementLine", checked ? "true" : "false")
          }
          onChange={(value) => updateSection("indictment", "replacementLine", value)}
        />
      </BmFormSection>

      <BmFormSection title="6. Hồ sơ kèm theo">
        <BmFieldTextarea
          label="Hồ sơ vụ án"
          required
          value={form.indictment.caseFileLine}
          onChange={(value) => updateSection("indictment", "caseFileLine", value)}
        />
        <OptionalTextArea
          checked={isChecked(form.indictment.hasEvidenceListLine)}
          label="Có bản kê vật chứng"
          value={form.indictment.evidenceListLine}
          onToggle={(checked) =>
            updateSection("indictment", "hasEvidenceListLine", checked ? "true" : "false")
          }
          onChange={(value) => updateSection("indictment", "evidenceListLine", value)}
        />
        <BmFieldTextarea
          label="Danh sách triệu tập"
          required
          value={form.indictment.summonedPersonsLine}
          onChange={(value) =>
            updateSection("indictment", "summonedPersonsLine", value)
          }
        />
      </BmFormSection>

      <BmFormSection title="7. Nơi nhận">
        <BmFieldText
          label="Tòa án"
          required
          value={form.recipients.courtLine}
          onChange={(value) => updateSection("recipients", "courtLine", value)}
        />
        <BmFieldText
          label="Bị can / người đại diện"
          required
          value={form.recipients.accusedLine}
          onChange={(value) => updateSection("recipients", "accusedLine", value)}
        />
        <OptionalTextArea
          checked={isChecked(form.recipients.hasDefenseCounselLine)}
          label="Có người bào chữa/người đại diện"
          value={form.recipients.defenseCounselLine}
          rows={1}
          onToggle={(checked) =>
            updateSection(
              "recipients",
              "hasDefenseCounselLine",
              checked ? "true" : "false",
            )
          }
          onChange={(value) =>
            updateSection("recipients", "defenseCounselLine", value)
          }
        />
        <BmFieldText
          label="Cơ quan điều tra"
          required
          value={form.recipients.investigatingAgencyLine}
          onChange={(value) =>
            updateSection("recipients", "investigatingAgencyLine", value)
          }
        />
        <OptionalTextArea
          checked={isChecked(form.recipients.hasOtherRecipientLine)}
          label="Có nơi nhận khác"
          value={form.recipients.otherRecipientLine}
          rows={1}
          onToggle={(checked) =>
            updateSection(
              "recipients",
              "hasOtherRecipientLine",
              checked ? "true" : "false",
            )
          }
          onChange={(value) =>
            updateSection("recipients", "otherRecipientLine", value)
          }
        />
        <BmFieldText
          label="Dòng lưu"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => updateSection("recipients", "archiveLine", value)}
        />
      </BmFormSection>

      <BmFormSection title="8. Chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText
            label="Chế độ ký"
            value={form.signature.signMode}
            onChange={(value) => updateSection("signature", "signMode", value)}
          />
          <BmFieldText
            label="Chức vụ"
            required
            value={form.signature.positionTitle}
            onChange={(value) => updateSection("signature", "positionTitle", value)}
          />
        </div>
        <BmFieldText
          label="Người ký"
          required
          value={form.signature.signerName}
          onChange={(value) => updateSection("signature", "signerName", value)}
        />
      </BmFormSection>

    </div>
  );
}
