"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = '';
const DEFAULT_JUVENILE_LINE = "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;";

type TextRecord = Record<string, string>;

type Bm031FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  legalBasis: TextRecord;
  principal: TextRecord;
  offense: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm031FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm031FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const EMPTY_FORM: Bm031FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
    phone: "",
  },
  document: {
    documentCodeLine: "",
    documentCode: "",
    documentNo: "",
    fullDocumentCode: "",
    issueDate: "",
    issuePlaceAndDateLine: "",
  },
  legalBasis: {
    isJuvenile: "false",
    juvenileLegalBasisLine: "",
    requestApprovalLine: "",
  },
  principal: {
    personName: "",
    investigationAuthorityName: "",
  },
  offense: {
    offenseName: "",
    legalArticle: "",
    criminalCodeText: "",
  },
  measure: {
    emergencyArrestOrderCode: "",
    emergencyArrestOrderIssueDateText: "",
    reasonLine: "",
    article1Line: "",
    article2Line: "",
  },
  recipients: {
    investigationUnitLine: "",
    personLine: "",
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
  { section: "agency", field: "issuePlace", label: "Địa danh" },
  { section: "document", field: "documentCodeLine", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  {
    section: "document",
    field: "issuePlaceAndDateLine",
    label: "Dòng địa danh, ngày ban hành",
  },
  {
    section: "principal",
    field: "investigationAuthorityName",
    label: "Cơ quan/người ra Lệnh bắt",
  },
  { section: "principal", field: "personName", label: "Tên người bị giữ / bị can" },
  { section: "offense", field: "offenseName", label: "Tội danh" },
  { section: "offense", field: "legalArticle", label: "Điều khoản BLHS" },
  {
    section: "measure",
    field: "emergencyArrestOrderCode",
    label: "Số Lệnh bắt",
  },
  {
    section: "measure",
    field: "emergencyArrestOrderIssueDateText",
    label: "Ngày Lệnh bắt",
  },
  {
    section: "legalBasis",
    field: "requestApprovalLine",
    label: "Dòng xét hồ sơ đề nghị",
  },
  { section: "measure", field: "reasonLine", label: "Dòng nhận thấy" },
  { section: "measure", field: "article1Line", label: "Nội dung Điều 1" },
  { section: "measure", field: "article2Line", label: "Nội dung Điều 2" },
  {
    section: "recipients",
    field: "investigationUnitLine",
    label: "Nơi nhận - cơ quan điều tra",
  },
  { section: "recipients", field: "personLine", label: "Nơi nhận - người bị giữ" },
  { section: "recipients", field: "archiveLine", label: "Nơi nhận - lưu" },
  { section: "signature", field: "signMode", label: "Chế độ ký" },
  { section: "signature", field: "positionTitle", label: "Chức vụ người ký" },
  { section: "signature", field: "signerName", label: "Họ tên người ký" },
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

function getNestedValue(source: unknown, path: string): unknown {
  let current: unknown = source;

  for (const part of path.split(".")) {
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      current = current[Number(part)];
      continue;
    }

    if (!isRecord(current)) return undefined;

    current = current[part];
  }

  return current;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";

  return String(value).trim();
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

function getValue(
  form: Bm031FormInputs,
  section: SectionKey,
  field: string,
): string {
  return form[section][field] ?? "";
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function todayDisplayDate(): string {
  const now = new Date();

  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function parseDateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = toText(value);

  const display = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (display) {
    return {
      day: pad2(Number(display[1])),
      month: pad2(Number(display[2])),
      year: display[3],
    };
  }

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
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
  const todayMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(today);

  return {
    day: todayMatch?.[1] || "01",
    month: todayMatch?.[2] || "01",
    year: todayMatch?.[3] || String(new Date().getFullYear()),
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

  if (!raw || raw.includes("...") || raw === "22/05/2026") {
    return todayDisplayDate();
  }

  const parts = parseDateParts(raw);

  return buildDisplayDate(parts.day, parts.month, parts.year);
}

function normalizeVietnameseDateLine(value: string): string {
  const raw = toText(value);

  if (!raw || raw.includes("...") || raw === "ngày 22 tháng 5 năm 2026") {
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

function stripRecipientLine(value: string): string {
  return toText(value).replace(/^-\s*/u, "").replace(/[;.]\s*$/u, "");
}

function recipientLine(value: string): string {
  const raw = stripRecipientLine(value);

  return raw ? `- ${raw};` : "";
}

function archiveLine(value: string): string {
  const raw = stripRecipientLine(value);

  if (!raw) return "- Lưu: HSVV, HSKS, VP.";

  return raw.toLocaleLowerCase("vi-VN").startsWith("lưu:")
    ? `- ${raw}.`
    : `- Lưu: ${raw}.`;
}

function offensePhrase(offenseName: string, legalArticle: string): string {
  const name = toText(offenseName);
  const article = toText(legalArticle);

  if (!name && !article) return "";

  if (!article) return `về tội “${name}”`;

  return `về tội “${name || "..."}” quy định tại ${article}`;
}

function buildGeneratedLines(form: Bm031FormInputs): Pick<
  Bm031FormInputs["legalBasis"],
  "juvenileLegalBasisLine" | "requestApprovalLine"
> &
  Pick<Bm031FormInputs["measure"], "reasonLine" | "article1Line" | "article2Line"> &
  Pick<Bm031FormInputs["recipients"], "investigationUnitLine" | "personLine" | "archiveLine"> {
  const orderCode = toText(form.measure.emergencyArrestOrderCode);
  const orderDate = normalizeVietnameseDateLine(
    form.measure.emergencyArrestOrderIssueDateText,
  );
  const authority = toText(form.principal.investigationAuthorityName);
  const personName = toText(form.principal.personName);
  const offense = offensePhrase(form.offense.offenseName, form.offense.legalArticle);

  const requestApprovalLine = `Xét hồ sơ đề nghị phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp số ${orderCode || "..."} ${orderDate} của ${authority || "..."} đối với ${personName || "..."};`;

  const reasonLine = `Nhận thấy việc bắt người bị giữ trong trường hợp khẩn cấp đối với ${personName || "..."} là có căn cứ và cần thiết,`;

  const article1Line = `Phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp số ${orderCode || "..."} ${orderDate} của ${authority || "..."} đối với ${personName || "..."}${offense ? ` ${offense}` : ""}.`;

  const article2Line = `Yêu cầu ${authority || "..."} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự.`;

  return {
    juvenileLegalBasisLine:
      form.legalBasis.isJuvenile === "true"
        ? toText(form.legalBasis.juvenileLegalBasisLine) || DEFAULT_JUVENILE_LINE
        : "",
    requestApprovalLine,
    reasonLine,
    article1Line,
    article2Line,
    investigationUnitLine: recipientLine(authority),
    personLine: recipientLine(personName),
    archiveLine: archiveLine(form.recipients.archiveLine),
  };
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm031FormInputs {
  const root = sourceRoot(payload);

  const issuePlace =
    pickText(root, "agency.issuePlace") ||
    "TP. Hồ Chí Minh";

  const documentCode =
    pickText(
      root,
      "document.documentCodeLine",
      "document.documentCode",
      "document.documentNo",
      "document.fullDocumentCode",
    ) || "31/QĐ-VKSKV7";

  const issueDate = normalizeDisplayDate(
    pickText(root, "document.issueDate") ||
      pickText(root, "document.issueDateText") ||
      pickText(root, "document.issuePlaceAndDateLine"),
  );

  const authority =
    pickText(root, "principal.investigationAuthorityName") ||
    stripRecipientLine(pickText(root, "recipients.investigationUnitLine")) ||
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

  const personName =
    pickText(
      root,
      "principal.personName",
      "principal.fullName",
      "accused.fullName",
      "accused.name",
      "person.fullName",
      "person.name",
      "detainee.fullName",
      "detainee.name",
      "arrestee.fullName",
      "arrestee.name",
    ) ||
    stripRecipientLine(pickText(root, "recipients.personLine", "recipients.accusedLine")) ||
    "";

  const offenseName =
    pickText(root, "offense.offenseName") ||
    "Đánh bạc";

  const legalArticle =
    pickText(root, "offense.legalArticle") ||
    "khoản 1 Điều 321 Bộ luật Hình sự";

    const rawJuvenile = pickText(root, "legalBasis.isJuvenile");
  const existingJuvenileLine = pickText(
    root,
    "legalBasis.juvenileLegalBasisLine",
    "legalBasis.juvenileJusticeLine",
  );

  const normalizedRawJuvenile = rawJuvenile.toLocaleLowerCase("vi-VN");

  const isJuvenile: "true" | "false" =
    normalizedRawJuvenile === "true" ||
    normalizedRawJuvenile === "1" ||
    normalizedRawJuvenile === "yes"
      ? "true"
      : normalizedRawJuvenile === "false" ||
          normalizedRawJuvenile === "0" ||
          normalizedRawJuvenile === "no"
        ? "false"
        : existingJuvenileLine
          ? "true"
          : "false";
const baseForm: Bm031FormInputs = {
    agency: {
      parentName:
        pickText(root, "agency.parentName") ||
        "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
      name:
        pickText(root, "agency.name") ||
        "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      issuePlace,
      phone: pickText(root, "agency.phone"),
    },
    document: {
      documentCodeLine: documentCode,
      documentCode,
      documentNo: documentCode,
      fullDocumentCode: documentCode,
      issueDate,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(issuePlace, issueDate),
    },
    legalBasis: {
      isJuvenile,
      juvenileLegalBasisLine:
        isJuvenile === "true"
          ? existingJuvenileLine || DEFAULT_JUVENILE_LINE
          : "",
      requestApprovalLine: pickText(root, "legalBasis.requestApprovalLine"),
    },
    principal: {
      personName,
      investigationAuthorityName: authority,
    },
    offense: {
      offenseName,
      legalArticle,
      criminalCodeText:
        pickText(root, "offense.criminalCodeText") ||
        "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
    },
    measure: {
      emergencyArrestOrderCode:
        pickText(
          root,
          "measure.emergencyArrestOrderCode",
          "measure.arrestOrderCode",
          "measure.detentionOrderCode",
          "measure.orderDocumentCode",
        ) || "17/LTG-VKSKV7",
      emergencyArrestOrderIssueDateText: normalizeVietnameseDateLine(
        pickText(
          root,
          "measure.emergencyArrestOrderIssueDateText",
          "measure.arrestOrderIssueDateText",
          "measure.detentionOrderIssueDateText",
          "measure.orderIssueDateText",
        ),
      ),
      reasonLine: pickText(root, "measure.reasonLine"),
      article1Line: pickText(root, "measure.article1Line"),
      article2Line: pickText(root, "measure.article2Line"),
    },
    recipients: {
      investigationUnitLine: pickText(root, "recipients.investigationUnitLine"),
      personLine: pickText(root, "recipients.personLine", "recipients.accusedLine"),
      archiveLine: pickText(root, "recipients.archiveLine"),
    },
    signature: {
      signMode: pickText(root, "signature.signMode") || "KT. VIỆN TRƯỞNG",
      positionTitle: pickText(root, "signature.positionTitle") || "PHÓ VIỆN TRƯỞNG",
      signerName: pickText(root, "signature.signerName") || DEFAULT_SIGNER_NAME,
    },
  };

  const generated = buildGeneratedLines(baseForm);

  return {
    ...baseForm,
    legalBasis: {
      ...baseForm.legalBasis,
      juvenileLegalBasisLine: generated.juvenileLegalBasisLine,
      requestApprovalLine:
        baseForm.legalBasis.requestApprovalLine || generated.requestApprovalLine,
    },
    measure: {
      ...baseForm.measure,
      reasonLine: baseForm.measure.reasonLine || generated.reasonLine,
      article1Line: baseForm.measure.article1Line || generated.article1Line,
      article2Line: baseForm.measure.article2Line || generated.article2Line,
    },
    recipients: {
      investigationUnitLine:
        baseForm.recipients.investigationUnitLine ||
        generated.investigationUnitLine,
      personLine: baseForm.recipients.personLine || generated.personLine,
      archiveLine: archiveLine(baseForm.recipients.archiveLine),
    },
  };
}

function regenerateFromMainFields(form: Bm031FormInputs): Bm031FormInputs {
  const issueDate = normalizeDisplayDate(form.document.issueDate);
  const issuePlace = toText(form.agency.issuePlace) || "TP. Hồ Chí Minh";
  const generated = buildGeneratedLines({
    ...form,
    document: {
      ...form.document,
      issueDate,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(issuePlace, issueDate),
    },
    legalBasis: {
      ...form.legalBasis,
      juvenileLegalBasisLine:
        form.legalBasis.isJuvenile === "true"
          ? form.legalBasis.juvenileLegalBasisLine || DEFAULT_JUVENILE_LINE
          : "",
    },
    measure: {
      ...form.measure,
      emergencyArrestOrderIssueDateText: normalizeVietnameseDateLine(
        form.measure.emergencyArrestOrderIssueDateText,
      ),
    },
  });

  return {
    ...form,
    document: {
      ...form.document,
      issueDate,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(issuePlace, issueDate),
    },
    legalBasis: {
      ...form.legalBasis,
      juvenileLegalBasisLine: generated.juvenileLegalBasisLine,
      requestApprovalLine: generated.requestApprovalLine,
    },
    measure: {
      ...form.measure,
      emergencyArrestOrderIssueDateText: normalizeVietnameseDateLine(
        form.measure.emergencyArrestOrderIssueDateText,
      ),
      reasonLine: generated.reasonLine,
      article1Line: generated.article1Line,
      article2Line: generated.article2Line,
    },
    recipients: {
      ...form.recipients,
      investigationUnitLine: generated.investigationUnitLine,
      personLine: generated.personLine,
      archiveLine: generated.archiveLine,
    },
  };
}

async function getBm031RenderPayload(
  documentId: string | number,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/bm031-direct-render-payload`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Không tải được render-payload BM-031. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function requestSave(
  documentId: string | number,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<{
  ok: boolean;
  status: number;
  text: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/bm031-direct-form-inputs`,
    {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    },
  );

  return {
    ok: response.ok,
    status: response.status,
    text: await response.text(),
  };
}

function buildBm031SavePayload(ready: Bm031FormInputs): Record<string, unknown> {
  const documentCode =
    ready.document.documentCodeLine ||
    ready.document.documentCode ||
    ready.document.documentNo ||
    ready.document.fullDocumentCode;

  const isJuvenile = ready.legalBasis.isJuvenile === "true";
  const juvenileLine = isJuvenile
    ? ready.legalBasis.juvenileLegalBasisLine || DEFAULT_JUVENILE_LINE
    : "";

  const personName = toText(ready.principal.personName);
  const authority = toText(ready.principal.investigationAuthorityName);
  const offenseName = toText(ready.offense.offenseName);
  const legalArticle = toText(ready.offense.legalArticle);

  const arrestOrderCode =
    toText(ready.measure.emergencyArrestOrderCode) ||
    toText(ready.measure.arrestOrderCode) ||
    toText(ready.measure.detentionOrderCode) ||
    toText(ready.measure.orderDocumentCode);

  const arrestOrderDate = normalizeVietnameseDateLine(
    ready.measure.emergencyArrestOrderIssueDateText ||
      ready.measure.arrestOrderIssueDateText ||
      ready.measure.detentionOrderIssueDateText ||
      ready.measure.orderIssueDateText,
  );

  const measure: TextRecord = {
    ...ready.measure,
    emergencyArrestOrderCode: arrestOrderCode,
    arrestOrderCode: arrestOrderCode,
    detentionOrderCode: arrestOrderCode,
    orderDocumentCode: arrestOrderCode,
    emergencyArrestOrderIssueDateText: arrestOrderDate,
    arrestOrderIssueDateText: arrestOrderDate,
    detentionOrderIssueDateText: arrestOrderDate,
    orderIssueDateText: arrestOrderDate,
  };

  const legalBasis = {
    ...ready.legalBasis,
    isJuvenile: isJuvenile ? "true" : "false",
    juvenileLegalBasisLine: juvenileLine,
    juvenileJusticeLine: juvenileLine,
    requestApprovalLine: ready.legalBasis.requestApprovalLine,
  };

  const document = {
    ...ready.document,
    documentCodeLine: documentCode,
    documentCode,
    documentNo: documentCode,
    fullDocumentCode: documentCode,
    issueDate: normalizeDisplayDate(ready.document.issueDate),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
      ready.agency.issuePlace,
      ready.document.issueDate,
    ),
  };

  const principal = {
    ...ready.principal,
    personName,
    fullName: personName,
    investigationAuthorityName: authority,
  };

  const accused = {
    fullName: personName,
    name: personName,
    personName,
  };

  const person = {
    fullName: personName,
    name: personName,
    personName,
  };

  const detainee = {
    fullName: personName,
    name: personName,
    personName,
  };

  const arrestee = {
    fullName: personName,
    name: personName,
    personName,
  };

  const offense = {
    ...ready.offense,
    offenseName,
    legalArticle,
  };

  const arrest: TextRecord = {
    emergencyArrestOrderCode: arrestOrderCode,
    arrestOrderCode: arrestOrderCode,
    orderCode: arrestOrderCode,
    detentionOrderCode: arrestOrderCode,
    orderDocumentCode: arrestOrderCode,
    emergencyArrestOrderIssueDateText: arrestOrderDate,
    arrestOrderIssueDateText: arrestOrderDate,
    detentionOrderIssueDateText: arrestOrderDate,
    orderIssueDateText: arrestOrderDate,
  };

  const recipients = {
    ...ready.recipients,
    investigationUnitLine: ready.recipients.investigationUnitLine,
    personLine: ready.recipients.personLine,
    accusedLine: ready.recipients.personLine,
    archiveLine: archiveLine(ready.recipients.archiveLine),
  };

  return {
    ...ready,
    agency: ready.agency,
    document,
    legalBasis,
    principal,
    accused,
    person,
    detainee,
    arrestee,
    offense,
    arrest,
    measure,
    recipients,
    signature: ready.signature,
  };
}

function buildBm031DirectSavePayload(form: Bm031FormInputs): Record<string, unknown> {
  const documentCode =
    toText(form.document.documentCodeLine) ||
    toText(form.document.documentCode) ||
    toText(form.document.documentNo) ||
    toText(form.document.fullDocumentCode);

  const issueDate = normalizeDisplayDate(form.document.issueDate);

  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(
    form.agency.issuePlace,
    issueDate,
  );

  const isJuvenile = form.legalBasis.isJuvenile === "true";

  const juvenileLine = isJuvenile
    ? toText(form.legalBasis.juvenileLegalBasisLine) || DEFAULT_JUVENILE_LINE
    : "";

  const personName = toText(form.principal.personName);
  const authority = toText(form.principal.investigationAuthorityName);
  const offenseName = toText(form.offense.offenseName);
  const legalArticle = toText(form.offense.legalArticle);

  const arrestOrderCode =
    toText(form.measure.emergencyArrestOrderCode) ||
    toText(form.measure.arrestOrderCode) ||
    toText(form.measure.detentionOrderCode) ||
    toText(form.measure.orderDocumentCode);

  const arrestOrderDate = normalizeVietnameseDateLine(
    form.measure.emergencyArrestOrderIssueDateText ||
      form.measure.arrestOrderIssueDateText ||
      form.measure.detentionOrderIssueDateText ||
      form.measure.orderIssueDateText,
  );

  const legalBasis: TextRecord = {
    ...form.legalBasis,

    isJuvenile: isJuvenile ? "true" : "false",

    juvenileLegalBasisLine: juvenileLine,
    juvenileJusticeLine: juvenileLine,
    juvenileLine: juvenileLine,
    minorLegalBasisLine: juvenileLine,

    // BODY USER SỬA: GIỮ NGUYÊN, KHÔNG TỰ SINH LẠI.
    requestApprovalLine: toText(form.legalBasis.requestApprovalLine),
  };

  const measure: TextRecord = {
    ...form.measure,

    emergencyArrestOrderCode: arrestOrderCode,
    arrestOrderCode: arrestOrderCode,
    detentionOrderCode: arrestOrderCode,
    orderDocumentCode: arrestOrderCode,

    emergencyArrestOrderIssueDateText: arrestOrderDate,
    arrestOrderIssueDateText: arrestOrderDate,
    detentionOrderIssueDateText: arrestOrderDate,
    orderIssueDateText: arrestOrderDate,

    // BODY USER SỬA: GIỮ NGUYÊN, KHÔNG TỰ SINH LẠI.
    reasonLine: toText(form.measure.reasonLine),
    article1Line: toText(form.measure.article1Line),
    article2Line: toText(form.measure.article2Line),
  };

  const document: TextRecord = {
    ...form.document,
    documentCodeLine: documentCode,
    documentCode: documentCode,
    documentNo: documentCode,
    fullDocumentCode: documentCode,
    issueDate: issueDate,
    issueDateText: issueDate,
    issuePlaceAndDateLine: issuePlaceAndDateLine,
  };

  const principal: TextRecord = {
    ...form.principal,
    personName: personName,
    fullName: personName,
    name: personName,
    investigationAuthorityName: authority,
  };

  const accused: TextRecord = {
    fullName: personName,
    name: personName,
    personName: personName,
  };

  const person: TextRecord = {
    fullName: personName,
    name: personName,
    personName: personName,
  };

  const detainee: TextRecord = {
    fullName: personName,
    name: personName,
    personName: personName,
  };

  const arrestee: TextRecord = {
    fullName: personName,
    name: personName,
    personName: personName,
  };

  const offense: TextRecord = {
    ...form.offense,
    offenseName: offenseName,
    legalArticle: legalArticle,
  };

  const arrest: TextRecord = {
    emergencyArrestOrderCode: arrestOrderCode,
    arrestOrderCode: arrestOrderCode,
    detentionOrderCode: arrestOrderCode,
    orderDocumentCode: arrestOrderCode,
    orderCode: arrestOrderCode,

    emergencyArrestOrderIssueDateText: arrestOrderDate,
    arrestOrderIssueDateText: arrestOrderDate,
    detentionOrderIssueDateText: arrestOrderDate,
    orderIssueDateText: arrestOrderDate,
  };

  const recipients: TextRecord = {
    ...form.recipients,
    investigationUnitLine: toText(form.recipients.investigationUnitLine),
    personLine: toText(form.recipients.personLine),
    accusedLine: toText(form.recipients.personLine),
    archiveLine: toText(form.recipients.archiveLine),
  };

  return {
    ...form,
    agency: form.agency,
    document,
    legalBasis,
    principal,
    accused,
    person,
    detainee,
    arrestee,
    offense,
    arrest,
    measure,
    recipients,
    signature: form.signature,
  };
}

function applyBm031UserEditedBodyFields(
  form: Bm031FormInputs,
  payload: Bm031FormInputs,
): Bm031FormInputs {
  const text = (value: unknown, fallback = ""): string => {
    if (value === null || value === undefined) {
      return fallback;
    }

    return String(value);
  };

  const formAny = form as unknown as {
    legalBasis?: Record<string, unknown>;
    measure?: Record<string, unknown>;
  };

  const payloadAny = payload as unknown as {
    legalBasis?: Record<string, unknown>;
    measure?: Record<string, unknown>;
    [key: string]: unknown;
  };

  const next = {
    ...payloadAny,
    legalBasis: {
      ...(payloadAny.legalBasis ?? {}),
    },
    measure: {
      ...(payloadAny.measure ?? {}),
    },
  };

  next.legalBasis.procedureArticlesLine = text(
    formAny.legalBasis?.procedureArticlesLine,
    text(payloadAny.legalBasis?.procedureArticlesLine),
  );

  next.legalBasis.requestApprovalLine = text(
    formAny.legalBasis?.requestApprovalLine,
    text(payloadAny.legalBasis?.requestApprovalLine),
  );

  next.measure.reasonLine = text(
    formAny.measure?.reasonLine,
    text(payloadAny.measure?.reasonLine),
  );

  next.measure.article1Line = text(
    formAny.measure?.article1Line,
    text(payloadAny.measure?.article1Line),
  );

  next.measure.article2Line = text(
    formAny.measure?.article2Line,
    text(payloadAny.measure?.article2Line),
  );

  return next as unknown as Bm031FormInputs;
}
async function saveBm031FormInputs(
  documentId: string | number,
  form: Bm031FormInputs,
): Promise<Bm031FormInputs> {
  const rawSavePayload =
    buildBm031DirectSavePayload(form) as unknown as Record<string, any>;

  const formAny = form as unknown as Record<string, any>;

  const legalBasisFromForm = formAny.legalBasis ?? {};
  const measureFromForm = formAny.measure ?? {};

  const legalBasisFromRaw = rawSavePayload.legalBasis ?? {};
  const measureFromRaw = rawSavePayload.measure ?? {};

  const text = (value: unknown, fallback = ""): string => {
    if (value === null || value === undefined) {
      return fallback;
    }

    return String(value);
  };

  const isJuvenile =
    legalBasisFromForm.isJuvenile === true ||
    legalBasisFromForm.isJuvenile === "true" ||
    legalBasisFromForm.isJuvenile === 1 ||
    legalBasisFromForm.isJuvenile === "1";

  const juvenileLine = isJuvenile
    ? text(
        legalBasisFromForm.juvenileLegalBasisLine,
        text(legalBasisFromRaw.juvenileLegalBasisLine),
      )
    : "\u200C";

  const savePayload = {
    ...rawSavePayload,

    templateCode: "BM-031",
    template_code: "BM-031",
    code: "BM-031",
    scope: "BM-031",

    legalBasis: {
      ...legalBasisFromRaw,
      ...legalBasisFromForm,

      // 5 dòng body bắt buộc lấy từ form khách đang nhập, không lấy dòng tự sinh.
      procedureArticlesLine: text(
        legalBasisFromForm.procedureArticlesLine,
        text(legalBasisFromRaw.procedureArticlesLine),
      ),
      requestApprovalLine: text(
        legalBasisFromForm.requestApprovalLine,
        text(legalBasisFromRaw.requestApprovalLine),
      ),

      isJuvenile: isJuvenile ? "true" : "false",
      juvenileLegalBasisLine: juvenileLine,
      juvenileJusticeLine: juvenileLine,
      juvenileLine: juvenileLine,
      minorLegalBasisLine: juvenileLine,
    },

    measure: {
      ...measureFromRaw,
      ...measureFromForm,

      // 5 dòng body bắt buộc lấy từ form khách đang nhập, không lấy dòng tự sinh.
      reasonLine: text(
        measureFromForm.reasonLine,
        text(measureFromRaw.reasonLine),
      ),
      article1Line: text(
        measureFromForm.article1Line,
        text(measureFromRaw.article1Line),
      ),
      article2Line: text(
        measureFromForm.article2Line,
        text(measureFromRaw.article2Line),
      ),
    },
  } as unknown as Bm031FormInputs;

  const signerName =
    pickText(savePayload, "signature.signerName") || DEFAULT_SIGNER_NAME;

  const body = {
    ...(savePayload as unknown as Record<string, unknown>),

    templateCode: "BM-031",
    template_code: "BM-031",
    code: "BM-031",

    formInputs: savePayload,
    payloadOverrides: savePayload,
    renderPayloadOverrides: savePayload,

    renderPayloadSnapshot: {
      ...(savePayload as unknown as Record<string, unknown>),
      templateCode: "BM-031",
      template_code: "BM-031",
      code: "BM-031",
      formInputs: savePayload,
      payloadOverrides: savePayload,
      renderPayloadOverrides: savePayload,
    },

    metadata: {
      templateCode: "BM-031",
      template_code: "BM-031",
      code: "BM-031",
      formInputs: savePayload,
      payloadOverrides: savePayload,
      renderPayloadOverrides: savePayload,
    },

    updatedByName: signerName,
    renderedByName: signerName,
    convertedByName: signerName,
  };

  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/bm031-direct-form-inputs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Không lưu được BM-031. HTTP ${response.status}`);
  }

  await response.json().catch(() => null);

  return savePayload;
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
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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

export function Bm031FormInputsPanel({
  documentId,
  onSaved,
}: Bm031FormInputsPanelProps) {
  const [form, setForm] = useState<Bm031FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const preview = useMemo(
    () => buildBm031DirectSavePayload(form) as unknown as Bm031FormInputs,
    [form],
  );

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
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
      const payload = await getBm031RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-031.",
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
      const next: Bm031FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };

      if (sectionKey === "legalBasis" && field === "isJuvenile") {
        next.legalBasis = {
          ...next.legalBasis,
          isJuvenile: value,
          juvenileLegalBasisLine:
            value === "true"
              ? next.legalBasis.juvenileLegalBasisLine || DEFAULT_JUVENILE_LINE
              : "",
        };

        return normalizeFormInputs(next as unknown as Record<string, unknown>);
      }

      const shouldRegenerate =
        (sectionKey === "document" && field === "issueDate") ||
        (sectionKey === "agency" && field === "issuePlace") ||
        (sectionKey === "principal" &&
          ["personName", "investigationAuthorityName"].includes(field)) ||
        (sectionKey === "offense" &&
          ["offenseName", "legalArticle"].includes(field)) ||
        (sectionKey === "measure" &&
          ["emergencyArrestOrderCode", "emergencyArrestOrderIssueDateText"].includes(
            field,
          ));

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

  function fillCustomerSample() {
    const today = todayDisplayDate();
    const orderDate = normalizeVietnameseDateLine(today);

    const sample: Bm031FormInputs = {
      agency: {
        parentName: "",
        name: "",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
      },
      document: {
        documentCodeLine: "31/QĐ-VKSKV7",
        documentCode: "31/QĐ-VKSKV7",
        documentNo: "31/QĐ-VKSKV7",
        fullDocumentCode: "31/QĐ-VKSKV7",
        issueDate: today,
        issuePlaceAndDateLine: buildIssuePlaceAndDateLine("TP. Hồ Chí Minh", today),
      },
      legalBasis: {
        isJuvenile: "true",
        juvenileLegalBasisLine: DEFAULT_JUVENILE_LINE,
        requestApprovalLine: "",
      },
      principal: {
        investigationAuthorityName:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        personName: "",
      },
      offense: {
        offenseName: "",
        legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
        criminalCodeText: "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      },
      measure: {
        emergencyArrestOrderCode: "17/LTG-VKSKV7",
        emergencyArrestOrderIssueDateText: orderDate,
        reasonLine: "",
        article1Line: "",
        article2Line: "",
      },
      recipients: {
        investigationUnitLine:
          "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        personLine: "- ;",
        archiveLine: "- Lưu: HSVV, HSKS, VP.",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: DEFAULT_SIGNER_NAME,
      },
    };

    setForm(regenerateFromMainFields(sample));
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const savedForm = await saveBm031FormInputs(documentId, form);

      setForm(savedForm);
      setInitialSnapshot(JSON.stringify(savedForm));
      setSavedAt(new Date());

      // BM-031: không gọi onSaved ở đây, vì parent reload làm mất mapping và rơi về UNKNOWN.
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-031.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-031...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-031" form={form} onApply={(next) => setForm(next as typeof form)} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-031
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu Quyết định phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Form này lưu toàn bộ dữ liệu header, body, nơi nhận và chữ ký vào
              formInputs, payloadOverrides và renderPayloadOverrides để render
              DOCX/PDF đúng dữ liệu khách nhập.
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
            Điền dữ liệu mẫu BM-031
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
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-031"}
          </button>
        </div>
      </section>

      <SectionCard
        title="Preview nội dung trước khi in"
        description="Kiểm tra trước các dòng sẽ render ra DOCX/PDF."
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-2">
          <table className="w-full border-collapse text-sm">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <th className="w-64 bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Ngày ban hành
                </th>
                <td className="px-4 py-3 text-slate-900">
                  {preview.document.issuePlaceAndDateLine || "—"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Căn cứ người chưa thành niên
                </th>
                <td className="px-4 py-3 text-slate-900">
                  {preview.legalBasis.juvenileLegalBasisLine || "Không áp dụng"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Xét hồ sơ đề nghị
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.legalBasis.requestApprovalLine || "—"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Nhận thấy
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.measure.reasonLine || "—"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Điều 1
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.measure.article1Line || "—"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Điều 2
                </th>
                <td className="px-4 py-3 leading-6 text-slate-900">
                  {preview.measure.article2Line || "—"}
                </td>
              </tr>

              <tr>
                <th className="bg-slate-50 px-4 py-3 text-left font-bold text-slate-700">
                  Nơi nhận
                </th>
                <td className="space-y-1 px-4 py-3 leading-6 text-slate-900">
                  {[
                    preview.recipients.investigationUnitLine,
                    preview.recipients.personLine,
                    preview.recipients.archiveLine,
                  ]
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
          value={form.agency.parentName}
          onChange={(value) => updateField("agency", "parentName", value)}
          required
        />

        <TextInput
          label="Viện kiểm sát ban hành"
          value={form.agency.name}
          onChange={(value) => updateField("agency", "name", value)}
          required
        />

        <TextInput
          label="Số quyết định"
          value={form.document.documentCodeLine}
          onChange={(value) => updateField("document", "documentCodeLine", value)}
          required
        />

        <TextInput
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
      </SectionCard>

      <SectionCard
        title="2. Ô nhập chính"
        description="Các ô này tự sinh lại Xét hồ sơ, Nhận thấy, Điều 1, Điều 2 và nơi nhận."
      >
        <TextInput
          label="Tên người bị giữ / bị can"
          value={form.principal.personName}
          onChange={(value) => updateField("principal", "personName", value)}
          required
        />

        <TextInput
          label="Tội danh"
          value={form.offense.offenseName}
          onChange={(value) => updateField("offense", "offenseName", value)}
          required
        />

        <TextInput
          label="Điều khoản Bộ luật Hình sự"
          value={form.offense.legalArticle}
          onChange={(value) => updateField("offense", "legalArticle", value)}
          required
        />

        <TextInput
          label="Cơ quan/người ra Lệnh bắt"
          value={form.principal.investigationAuthorityName}
          onChange={(value) =>
            updateField("principal", "investigationAuthorityName", value)
          }
          required
        />

        <TextInput
          label="Số Lệnh bắt"
          value={form.measure.emergencyArrestOrderCode}
          onChange={(value) =>
            updateField("measure", "emergencyArrestOrderCode", value)
          }
          required
        />

        <div>
          <DateSelectField
            label="Ngày Lệnh bắt"
            value={
              form.measure.emergencyArrestOrderIssueDateText ||
              normalizeVietnameseDateLine(todayDisplayDate())
            }
            outputMode="vietnameseLine"
            onChange={(value) =>
              updateField("measure", "emergencyArrestOrderIssueDateText", value)
            }
          />

          <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {preview.measure.emergencyArrestOrderIssueDateText}
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="3. Căn cứ và nội dung quyết định"
        description="Có thể chỉnh tay các dòng dài. Nếu sửa ô nhập chính ở trên, hệ thống sẽ tự sinh lại các dòng này."
      >
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
            value={form.legalBasis.juvenileLegalBasisLine}
            onChange={(value) =>
              updateField("legalBasis", "juvenileLegalBasisLine", value)
            }
            rows={2}
            className="md:col-span-2"
          />
        ) : null}

        <TextArea
          label="Xét hồ sơ đề nghị"
          value={form.legalBasis.requestApprovalLine}
          onChange={(value) =>
            updateField("legalBasis", "requestApprovalLine", value)
          }
          required
          rows={4}
          className="md:col-span-2"
        />

        <TextArea
          label="Nhận thấy"
          value={form.measure.reasonLine}
          onChange={(value) => updateField("measure", "reasonLine", value)}
          required
          rows={3}
          className="md:col-span-2"
        />

        <TextArea
          label="Điều 1"
          value={form.measure.article1Line}
          onChange={(value) => updateField("measure", "article1Line", value)}
          required
          rows={5}
          className="md:col-span-2"
        />

        <TextArea
          label="Điều 2"
          value={form.measure.article2Line}
          onChange={(value) => updateField("measure", "article2Line", value)}
          required
          rows={3}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="4. Nơi nhận">
        <TextInput
          label="Cơ quan điều tra"
          value={form.recipients.investigationUnitLine}
          onChange={(value) =>
            updateField("recipients", "investigationUnitLine", value)
          }
          required
        />

        <TextInput
          label="Người bị giữ / bị can"
          value={form.recipients.personLine}
          onChange={(value) => updateField("recipients", "personLine", value)}
          required
        />

        <TextInput
          label="Lưu"
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
          label="Chức vụ"
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
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-031"}
          </button>
        </div>
      </div>
    </section>
  );
}