"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type Bm097FormInputs,
  EMPTY_BM097_FORM_INPUTS,
  getBm097RenderPayload,
  normalizeBm097FormInputs,
  saveBm097FormInputs,
} from "@/lib/bm097-form-inputs-api";
import {
  BM097_AGENCY_OPTIONS,
  BM097_GENDER_OPTIONS,
  BM097_IDENTITY_TYPE_OPTIONS,
  BM097_OFFENSE_OPTIONS,
  BM097_POSITION_OPTIONS,
  BM097_SIGNER_OPTIONS,
  BM097_SIGN_MODE_OPTIONS,
} from "@/lib/bm097-options";

type Bm097FormInputsProps = {
  documentId: string | number;
  onSaved?: () => void;
};

type SectionKey = keyof Bm097FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Cơ quan ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh ban hành" },
  { section: "document", field: "documentNo", label: "Số quyết định" },
  { section: "document", field: "documentCode", label: "Số/ký hiệu quyết định" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  { section: "caseDecision", field: "decisionNo", label: "Số QĐ khởi tố vụ án" },
  { section: "caseDecision", field: "issueDate", label: "Ngày QĐ khởi tố vụ án" },
  { section: "caseDecision", field: "issuedBy", label: "Cơ quan ra QĐ khởi tố vụ án" },
  { section: "accusedDecision", field: "issuedBy", label: "Cơ quan điều tra" },
  { section: "offense", field: "offenseName", label: "Tội danh" },
  { section: "offense", field: "legalArticle", label: "Điều khoản" },
  { section: "offense", field: "actDescriptionLine", label: "Hành vi phạm tội" },
  { section: "person", field: "fullName", label: "Họ tên bị can" },
  { section: "person", field: "genderLabel", label: "Giới tính" },
  { section: "person", field: "otherName", label: "Tên gọi khác" },
  { section: "person", field: "placeOfBirth", label: "Nơi sinh" },
  { section: "person", field: "nationality", label: "Quốc tịch" },
  { section: "person", field: "ethnicity", label: "Dân tộc" },
  { section: "person", field: "religion", label: "Tôn giáo" },
  { section: "person", field: "occupation", label: "Nghề nghiệp" },
  { section: "person", field: "identityNo", label: "Số CCCD/CMND" },
  { section: "person", field: "identityIssuedDate", label: "Ngày cấp CCCD/CMND" },
  { section: "person", field: "identityIssuedPlace", label: "Nơi cấp CCCD/CMND" },
  { section: "person", field: "permanentAddress", label: "Nơi thường trú" },
  { section: "person", field: "currentAddress", label: "Nơi ở hiện tại" },
  { section: "person", field: "criminalRecordLine", label: "Tiền án, tiền sự" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - bị can" },
  { section: "recipients", field: "investigationUnitLine", label: "Nơi nhận - cơ quan điều tra" },
  { section: "recipients", field: "archiveLine", label: "Dòng lưu hồ sơ" },
  { section: "signature", field: "signMode", label: "Hình thức ký" },
  { section: "signature", field: "positionTitle", label: "Chức vụ ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

function getFieldValue(
  form: Bm097FormInputs,
  section: SectionKey,
  field: string,
): string {
  const sectionValue = form[section] as Record<string, string>;
  return sectionValue[field] ?? "";
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  multiline,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "date";
  placeholder?: string;
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
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">-- Chọn --</option>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}


const BM097_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const BM097_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const BM097_YEAR_OPTIONS = Array.from({ length: 90 }, (_, index) =>
  String(new Date().getFullYear() + 5 - index),
);

function toBm097IsoDate(value: string): string {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/u);
  if (iso) {
    return [iso[1], iso[2].padStart(2, "0"), iso[3].padStart(2, "0")].join("-");
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slash) {
    return [slash[3], slash[2].padStart(2, "0"), slash[1].padStart(2, "0")].join("-");
  }

  const legal = raw.match(/(?:ngày\s*)?(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (legal) {
    return [legal[3], legal[2].padStart(2, "0"), legal[1].padStart(2, "0")].join("-");
  }

  return "";
}

function getBm097DateParts(value: string): { day: string; month: string; year: string } {
  const iso = toBm097IsoDate(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/u);

  if (!match) {
    return { day: "", month: "", year: "" };
  }

  return {
    day: String(Number(match[3])),
    month: String(Number(match[2])),
    year: match[1],
  };
}

function makeBm097IsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";

  return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
}

function DateSelectField({
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
  [key: string]: unknown;
}) {
  const valueParts = getBm097DateParts(value);
  const [parts, setParts] = useState(valueParts);

  useEffect(() => {
    setParts(valueParts);
  }, [valueParts.day, valueParts.month, valueParts.year]);

  function updateDate(part: "day" | "month" | "year", nextValue: string) {
    const nextParts = {
      ...parts,
      [part]: nextValue,
    };

    setParts(nextParts);

    if (nextParts.day && nextParts.month && nextParts.year) {
      onChange(makeBm097IsoDate(nextParts.day, nextParts.month, nextParts.year));
      return;
    }

    if (!nextParts.day && !nextParts.month && !nextParts.year) {
      onChange("");
    }
  }

  return (
    <div className={"space-y-1.5 " + className}>
      <span className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={parts.day}
          onChange={(event) => updateDate("day", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Ngày</option>
          {BM097_DAY_OPTIONS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <select
          value={parts.month}
          onChange={(event) => updateDate("month", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Tháng</option>
          {BM097_MONTH_OPTIONS.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <select
          value={parts.year}
          onChange={(event) => updateDate("year", event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Năm</option>
          {BM097_YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  description,
  className = "",
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  className?: string;
}) {
  return (
    <label
      className={
        "flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 " +
        className
      }
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-500"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-800">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function PreviewBox({
  title,
  description,
  lines,
  className = "",
}: {
  title: string;
  description?: string;
  lines: string[];
  className?: string;
}) {
  const cleanLines = lines
    .map((line) => String(line ?? "").trim())
    .filter(Boolean);

  return (
    <div
      className={
        "md:col-span-2 rounded-xl border border-sky-200 bg-sky-50 p-4 " +
        className
      }
    >
      <p className="text-sm font-bold text-sky-900">{title}</p>

      {description ? (
        <p className="mt-1 text-xs leading-5 text-sky-700">{description}</p>
      ) : null}

      <div className="mt-3 space-y-2 rounded-lg border border-sky-100 bg-white p-3 text-sm leading-6 text-slate-800">
        {cleanLines.length > 0 ? (
          cleanLines.map((line, index) => (
            <p key={index} className="whitespace-pre-wrap">
              {line}
            </p>
          ))
        ) : (
          <p className="text-slate-400">Chưa có dữ liệu preview.</p>
        )}
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
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}


function firstBm097Text(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function bm097CleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function bm097EnsureEnd(value: unknown, end = "."): string {
  const text = bm097CleanText(value);
  if (!text) return "";
  return /[.;:,]$/u.test(text) ? text : text + end;
}

function bm097DateToLegalText(value: unknown): string {
  const raw = bm097CleanText(value);
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/u);
  if (iso) {
    return "ngày " + Number(iso[3]) + " tháng " + Number(iso[2]) + " năm " + iso[1];
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slash) {
    return "ngày " + Number(slash[1]) + " tháng " + Number(slash[2]) + " năm " + slash[3];
  }

  if (/ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}/iu.test(raw)) {
    return raw;
  }

  return raw;
}

function bm097BuildOffenseLegalText(offenseName: string, legalArticle: string, criminalCodeText: string): string {
  return [
    offenseName ? "về tội “" + offenseName + "”" : "",
    legalArticle ? "quy định tại " + legalArticle : "",
    criminalCodeText ? "của " + criminalCodeText : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeBm097DocumentCode(value: unknown): string {
  const text = bm097CleanText(value);

  if (
    !text ||
    text === "/QĐ-VKS-VKSKV7" ||
    text === "/QĐ-VKSKV7" ||
    text === "0297/QĐ-VKSKV7" ||
    text === "097/QĐ-VKSKV7"
  ) {
    return "97/QĐ-VKSKV7";
  }

  return text
    .replace(/^0+(?=97\/QĐ)/u, "")
    .replace("QĐ-VKS-VKSKV7", "QĐ-VKSKV7")
    .trim();
}

function buildBm097RenderReadyForm(form: Bm097FormInputs): Bm097FormInputs {
  const next = JSON.parse(JSON.stringify(form)) as Bm097FormInputs;
  const data = next as any;

  data.agency = data.agency ?? {};
  data.official = data.official ?? {};
  data.document = data.document ?? {};
  data.legalBasis = data.legalBasis ?? {};
  data.person = data.person ?? {};
  data.caseDecision = data.caseDecision ?? {};
  data.accusedDecision = data.accusedDecision ?? {};
  data.offense = data.offense ?? {};
  data.recipients = data.recipients ?? {};
  data.signature = data.signature ?? {};

  const documentCode = normalizeBm097DocumentCode(
    data.document.fullDocumentCode || data.document.documentCode,
  );

  data.document.documentCode = documentCode;
  data.document.fullDocumentCode = documentCode;

  const personName = firstBm097Text(
    data.person.fullName,
    data.accusedDecision.personName,
    data.accusedDecision.fullName,
    "",
  );

  data.person.fullName = personName;
  data.accusedDecision.personName = personName;
  data.accusedDecision.fullName = personName;

  const offenseName = firstBm097Text(
    data.caseDecision.offenseName,
    data.accusedDecision.offenseName,
    data.offense.offenseName,
    "Đánh bạc",
  );

  const legalArticle = firstBm097Text(
    data.caseDecision.legalArticle,
    data.accusedDecision.legalArticle,
    data.offense.legalArticle,
    "khoản 1 Điều 321",
  );

  const criminalCodeText = firstBm097Text(
    data.caseDecision.criminalCodeText,
    data.accusedDecision.criminalCodeText,
    data.offense.criminalCodeText,
    "Bộ luật Hình sự",
  );

  data.caseDecision.offenseName = offenseName;
  data.accusedDecision.offenseName = offenseName;
  data.offense.offenseName = offenseName;
  data.caseDecision.legalArticle = legalArticle;
  data.accusedDecision.legalArticle = legalArticle;
  data.offense.legalArticle = legalArticle;
  data.caseDecision.criminalCodeText = criminalCodeText;
  data.accusedDecision.criminalCodeText = criminalCodeText;
  data.offense.criminalCodeText = criminalCodeText;

  const investigationAgency = firstBm097Text(
    data.accusedDecision.issuedBy,
    data.recipients.investigationUnitName,
    data.caseDecision.issuedBy,
    data.caseDecision.investigationAgencyName,
    data.accusedDecision.investigationAgencyName,
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  );

  data.accusedDecision.issuedBy = investigationAgency;

  const offenseLegalText = bm097BuildOffenseLegalText(
    offenseName,
    legalArticle,
    criminalCodeText,
  );

  const caseDecisionNo = bm097CleanText(data.caseDecision.decisionNo);
  const caseDecisionDateText = bm097DateToLegalText(data.caseDecision.issueDate);
  const caseDecisionIssuedBy = bm097CleanText(data.caseDecision.issuedBy);
  const additionalDecisionText = bm097CleanText(data.caseDecision.additionalDecisionText);

  data.legalBasis.procedureArticlesLine =
    bm097EnsureEnd(
      data.legalBasis.procedureArticlesLine ||
        "Căn cứ các điều 41, 165 và 179 của Bộ luật Tố tụng hình sự",
      ";",
    );

  const includeJuvenile =
    data.legalBasis.includeJuvenileJusticeLine === true ||
    data.legalBasis.includeJuvenileJusticeLine === "true" ||
    data.legalBasis.isJuvenile === true ||
    data.legalBasis.isJuvenile === "true";

  data.legalBasis.includeJuvenileJusticeLine = includeJuvenile ? "true" : "false";
  data.legalBasis.juvenileJusticeLine = includeJuvenile
    ? bm097EnsureEnd(
        data.legalBasis.juvenileJusticeLine ||
          "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên",
        ";",
      )
    : "";

  const caseDecisionBase = [
    "Căn cứ Quyết định khởi tố vụ án hình sự",
    caseDecisionNo ? "số " + caseDecisionNo : "",
    caseDecisionDateText,
    additionalDecisionText ? "(" + additionalDecisionText + ")" : "",
    caseDecisionIssuedBy ? "của " + caseDecisionIssuedBy : "",
    offenseLegalText,
  ]
    .filter(Boolean)
    .join(" ");

  data.caseDecision.legalBasisLine = bm097EnsureEnd(caseDecisionBase, ";");

  data.accusedDecision.sufficientGroundsLine =
    bm097EnsureEnd(
      data.accusedDecision.sufficientGroundsLine ||
        "Sau khi nghiên cứu tài liệu trong hồ sơ vụ án, xét thấy có đủ căn cứ xác định",
      ":",
    );

  const birthDateText = bm097DateToLegalText(data.person.dateOfBirth).replace(/^ngày\s+/iu, "");

  data.person.birthInfoLine = [
    birthDateText ? "Sinh ngày " + birthDateText : "",
    data.person.placeOfBirth ? "tại: " + bm097CleanText(data.person.placeOfBirth) : "",
  ]
    .filter(Boolean)
    .join(" ");

  data.person.identityDocumentLine = [
    data.person.identityType ? bm097CleanText(data.person.identityType) : "Thẻ CCCD",
    data.person.identityNo ? "số " + bm097CleanText(data.person.identityNo) : "",
    data.person.identityIssuedDate
      ? "cấp " + bm097DateToLegalText(data.person.identityIssuedDate)
      : "",
    data.person.identityIssuedPlace
      ? "Nơi cấp: " + bm097CleanText(data.person.identityIssuedPlace)
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  data.offense.actDescriptionLine = bm097EnsureEnd(
    data.offense.actDescriptionLine || "đã có hành vi phạm tội",
    ",",
  );

  data.accusedDecision.article1Line =
    bm097EnsureEnd(
      data.accusedDecision.article1Line ||
        "Khởi tố bị can đối với " +
          personName +
          " " +
          offenseLegalText,
      ".",
    );

  data.accusedDecision.article2Line =
    bm097EnsureEnd(
      data.accusedDecision.article2Line ||
        "Yêu cầu " +
          investigationAgency +
          " tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự",
      "./.",
    );

  // BM-097: recipients are user-editable source-of-truth.
  // Do not auto-fallback here, otherwise FE will jump back to old/default values after save/load.
  data.recipients.personLine = bm097CleanText(data.recipients.personLine);
  data.recipients.investigationUnitLine = bm097CleanText(data.recipients.investigationUnitLine);
  data.recipients.archiveLine = bm097CleanText(data.recipients.archiveLine);
  data.recipients.noteLine = bm097CleanText(data.recipients.noteLine);

  data.signature.signMode = data.signature.signMode || "KT. VIỆN TRƯỞNG";
  data.signature.positionTitle = data.signature.positionTitle || "PHÓ VIỆN TRƯỞNG";
  data.signature.signerName = data.signature.signerName || "";

  // BM-097 FINAL RECIPIENTS SOURCE OF TRUTH START
  // Nơi nhận là dữ liệu người dùng nhập. Không được tự fallback về personName/investigationAgency.
  const bm097OriginalRecipients = ((form as any).recipients ?? {}) as Record<string, unknown>;
  data.recipients.personLine = bm097CleanText(bm097OriginalRecipients.personLine);
  data.recipients.investigationUnitLine = bm097CleanText(bm097OriginalRecipients.investigationUnitLine);
  data.recipients.archiveLine = bm097CleanText(bm097OriginalRecipients.archiveLine);
  data.recipients.noteLine = bm097CleanText(bm097OriginalRecipients.noteLine);
  // BM-097 FINAL RECIPIENTS SOURCE OF TRUTH END
  return next;
}
async function forceRenderBm097Files(documentId: string | number): Promise<void> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

  const renderResponse = await fetch(
    `${apiBase}/documents/generated/${documentId}/render-docx`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        force: true,
        renderedByName: "",
      }),
    },
  );

  if (!renderResponse.ok) {
    const message = await renderResponse.text().catch(() => "");
    throw new Error(
      message || "Đã lưu dữ liệu nhưng không render lại được DOCX.",
    );
  }

  const convertResponse = await fetch(
    `${apiBase}/documents/generated/${documentId}/convert-pdf`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        force: true,
        convertedByName: "",
      }),
    },
  );

  if (!convertResponse.ok) {
    const message = await convertResponse.text().catch(() => "");
    throw new Error(
      message || "Đã render DOCX nhưng không convert lại được PDF.",
    );
  }
}

export function Bm097FormInputsPanel({
  documentId,
  onSaved,
}: Bm097FormInputsProps) {
  const [form, setForm] = useState<Bm097FormInputs>(EMPTY_BM097_FORM_INPUTS);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      return !getFieldValue(form, item.section, item.field).trim();
    });
  }, [form]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getBm097RenderPayload(documentId);
      const nextForm = normalizeBm097FormInputs(payload);
      const nextData = nextForm as any;
      nextData.document = nextData.document ?? {};
      nextData.document.documentCode = normalizeBm097DocumentCode(
        nextData.document.fullDocumentCode || nextData.document.documentCode,
      );
      nextData.document.fullDocumentCode = nextData.document.documentCode;
      nextData.legalBasis = nextData.legalBasis ?? {};
      if (typeof nextData.legalBasis.includeJuvenileJusticeLine === "undefined") {
        nextData.legalBasis.includeJuvenileJusticeLine = nextData.legalBasis.juvenileJusticeLine
          ? "true"
          : "false";
      }

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-097.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField(section: SectionKey, field: string, value: string) {
    setForm((current) => {
      const next: Bm097FormInputs = {
        ...current,
        [section]: {
          ...current[section],
          [field]: value,
        },
      };

      if (section === "person" && field === "fullName") {
        next.recipients = {
          ...next.recipients,
          personLine: value.trim() ? `- ${value.trim()};` : "",
        };
      }

      if (section === "accusedDecision" && field === "issuedBy") {
        next.recipients = {
          ...next.recipients,
          investigationUnitLine: value.trim() ? `- ${value.trim()};` : "",
        };
      }

      return next;
    });
  }

  function handleSelectOffense(optionId: string) {
    const option = BM097_OFFENSE_OPTIONS.find((item) => item.id === optionId);

    if (!option) {
      return;
    }

    setForm((current) => ({
      ...current,
      offense: {
        ...current.offense,
        offenseName: (option.offenseName as string) ?? "",
        legalArticle: (option.legalArticle as string) ?? "",
        criminalCodeText: (option.criminalCodeText as string) ?? "",
        actDescriptionLine: (option.actDescriptionLine as string) ?? "",
      },
    }));
  }

  function handleSelectAgency(optionId: string) {
    const option = BM097_AGENCY_OPTIONS.find((item) => item.id === optionId);

    if (!option) {
      return;
    }

    setForm((current) => ({
      ...current,
      agency: {
        ...current.agency,
        parentName: option.parentName,
        name: option.name,
        shortName: option.shortName,
        issuePlace: option.issuePlace,
        phone: option.phone,
      },
    }));
  }

  function handleSelectSigner(optionId: string) {
    const option = BM097_SIGNER_OPTIONS.find((item) => item.id === optionId);

    if (!option) {
      return;
    }

    setForm((current) => ({
      ...current,
      official: {
        ...current.official,
        fullName: (option.officialFullName as string) ?? "",
        positionTitle: (option.officialPositionTitle as string) ?? "",
        prosecutorName: (option.prosecutorName as string) ?? "",
      },
      signature: {
        ...current.signature,
        signMode: (option.signMode as string) ?? "",
        positionTitle: option.positionTitle,
        signerName: option.signerName,
      },
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const renderReadyForm = buildBm097RenderReadyForm(form);
      await saveBm097FormInputs(documentId, renderReadyForm);
      await forceRenderBm097Files(documentId);
      setForm(renderReadyForm);
      setInitialSnapshot(JSON.stringify(renderReadyForm));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-097.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function fillCustomerSample() {
    const sample: Bm097FormInputs = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
        monitoringUnitName: "",
      },
      official: {
        fullName: "",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        prosecutorName: "thụ lý vụ án",
      },
      document: {
        documentNo: "02",
        documentCode: "97/QĐ-VKSKV7",
        issueDate: "2026-03-04",
      },
      caseDecision: {
        decisionNo: "G505/QĐ-VPCQCSĐT",
        issueDate: "2025-10-15",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      accusedDecision: {
        decisionNo: "",
        issueDate: "",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      offense: {
        offenseName: "",
        legalArticle: "khoản 1 Điều 321",
        criminalCodeText:
          "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
        actDescriptionLine: "đã có hành vi đánh bạc trái phép,",
      },
      person: {
        fullName: "",
        genderLabel: "Nam",
        otherName: "Không có",
        dateOfBirth: "",
        birthYear: "",
        placeOfBirth: "tỉnh Quảng Ngãi",
        nationality: "Việt Nam",
        ethnicity: "Kinh",
        religion: "Không",
        occupation: "Kinh doanh",
        identityType: "Thẻ CCCD",
        identityNo: "051080000314",
        identityIssuedDate: "2021-12-22",
        identityIssuedPlace:
          "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
        permanentAddress:
          "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
        temporaryAddress: "",
        currentAddress:
          "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
        criminalRecordLine: "Không",
      },
      recipients: {
        personLine: "- ;",
        investigationUnitLine:
          "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
        noteLine: "T. Huyền.05b",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
    };

    setForm(sample);
  }

  function getAnyFormField(section: string, field: string): string {
    const data = form as any;
    return String(data?.[section]?.[field] ?? "");
  }

  function updateAnyField(section: string, field: string, value: string) {
    setForm((current) => {
      const data = current as any;

      return {
        ...current,
        [section]: {
          ...(data[section] ?? {}),
          [field]: value,
        },
      } as Bm097FormInputs;
    });
  }

  function toggleJuvenileBasis(checked: boolean) {
    setForm((current) => {
      const data = current as any;
      const line = "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;";

      return {
        ...current,
        legalBasis: {
          ...(data.legalBasis ?? {}),
          includeJuvenileJusticeLine: checked ? "true" : "false",
          juvenileJusticeLine: checked ? line : "",
        },
      } as Bm097FormInputs;
    });
  }

  const previewForm = useMemo(() => buildBm097RenderReadyForm(form), [form]);
  const previewData = previewForm as any;

  const basisPreviewLines = [
    previewData.legalBasis?.procedureArticlesLine,
    previewData.legalBasis?.juvenileJusticeLine,
    previewData.caseDecision?.legalBasisLine,
  ];

  const bodyPreviewLines = [
    previewData.accusedDecision?.sufficientGroundsLine,
    "Họ tên: " +
      (previewData.person?.fullName ?? "") +
      "    Giới tính: " +
      (previewData.person?.genderLabel ?? ""),
    "Tên gọi khác: " + (previewData.person?.otherName ?? ""),
    previewData.person?.birthInfoLine,
    "Quốc tịch: " +
      (previewData.person?.nationality ?? "") +
      "; Dân tộc: " +
      (previewData.person?.ethnicity ?? "") +
      "; Tôn giáo: " +
      (previewData.person?.religion ?? ""),
    "Nghề nghiệp: " + (previewData.person?.occupation ?? ""),
    "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: " +
      (previewData.person?.identityDocumentLine ?? ""),
    "Nơi thường trú: " + (previewData.person?.permanentAddress ?? ""),
    previewData.person?.temporaryAddress
      ? "Nơi tạm trú: " + previewData.person?.temporaryAddress
      : "",
    "Nơi ở hiện tại: " + (previewData.person?.currentAddress ?? ""),
    "Tiền án, tiền sự: " + (previewData.person?.criminalRecordLine ?? ""),
    previewData.offense?.actDescriptionLine,
    "Điều 1. " + (previewData.accusedDecision?.article1Line ?? ""),
    "Điều 2. " + (previewData.accusedDecision?.article2Line ?? ""),
    "Nơi nhận:",
    previewData.recipients?.personLine,
    previewData.recipients?.investigationUnitLine,
    previewData.recipients?.archiveLine,
    previewData.recipients?.noteLine,
    (previewData.signature?.signMode ?? "") +
      " " +
      (previewData.signature?.positionTitle ?? "") +
      " — " +
      (previewData.signature?.signerName ?? ""),
  ];

  const isJuvenileChecked =
    getAnyFormField("legalBasis", "includeJuvenileJusticeLine") === "true" ||
    Boolean(getAnyFormField("legalBasis", "juvenileJusticeLine"));

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-097...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-097
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định khởi tố bị can
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Nhập theo đúng trình tự mẫu gốc: cơ quan, văn bản, căn cứ,
              thông tin bị can, hành vi phạm tội, Điều 1, Điều 2, nơi nhận và chữ ký.
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

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Điền dữ liệu mẫu 
          </button>

          <button
            type="button"
            onClick={loadForm}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Tải lại từ backend
          </button>
        </div>
      </div>

      <SectionCard title="1. Cơ quan ban hành">
        <SelectField
          label="Chọn nhanh cơ quan"
          value=""
          onChange={handleSelectAgency}
          options={BM097_AGENCY_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
          className="md:col-span-2"
        />
        <Field
          label="Cơ quan cấp trên"
          required
          value={form.agency.parentName}
          onChange={(value) => updateField("agency", "parentName", value)}
        />
        <Field
          label="Cơ quan ban hành"
          required
          value={form.agency.name}
          onChange={(value) => updateField("agency", "name", value)}
        />
        <Field
          label="Tên viết tắt"
          value={form.agency.shortName}
          onChange={(value) => updateField("agency", "shortName", value)}
        />
        <Field
          label="Địa danh ban hành"
          required
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value)}
        />
      </SectionCard>

      <SectionCard title="2. Thông tin văn bản">
        <Field
          label="Số/ký hiệu quyết định"
          required
          value={form.document.documentCode}
          onChange={(value) => updateField("document", "documentCode", value)}
          placeholder="Ví dụ: 97/QĐ-VKSKV7"
        />
        <DateSelectField
          label="Ngày ban hành"
          required
          value={form.document.issueDate}
          onChange={(value) => updateField("document", "issueDate", value)}
        />
      </SectionCard>

      <SectionCard
        title="3. Căn cứ khởi tố"
        description="Nhập đủ 3 dòng căn cứ. Dòng Luật Tư pháp người chưa thành niên chỉ xuất khi tick."
      >
        <Field
          label="Căn cứ Bộ luật Tố tụng hình sự"
          required
          multiline
          value={
            getAnyFormField("legalBasis", "procedureArticlesLine") ||
            "Căn cứ các điều 41, 165 và 179 của Bộ luật Tố tụng hình sự;"
          }
          onChange={(value) =>
            updateAnyField("legalBasis", "procedureArticlesLine", value)
          }
          className="md:col-span-2"
        />

        <CheckboxField
          label="Bị can là người chưa thành niên"
          checked={isJuvenileChecked}
          onChange={toggleJuvenileBasis}
          description="Tick mục này để thêm căn cứ: Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên."
          className="md:col-span-2"
        />

        {isJuvenileChecked ? (
          <Field
            label="Căn cứ Luật Tư pháp người chưa thành niên"
            multiline
            value={
              getAnyFormField("legalBasis", "juvenileJusticeLine") ||
              "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;"
            }
            onChange={(value) =>
              updateAnyField("legalBasis", "juvenileJusticeLine", value)
            }
            className="md:col-span-2"
          />
        ) : null}

        <Field
          label="Số quyết định khởi tố vụ án"
          required
          value={form.caseDecision.decisionNo}
          onChange={(value) => updateField("caseDecision", "decisionNo", value)}
        />

        <DateSelectField
          label="Ngày quyết định khởi tố vụ án"
          required
          value={form.caseDecision.issueDate}
          onChange={(value) => updateField("caseDecision", "issueDate", value)}
        />

        <Field
          label="Cơ quan ra quyết định khởi tố vụ án"
          required
          value={form.caseDecision.issuedBy}
          onChange={(value) => updateField("caseDecision", "issuedBy", value)}
          className="md:col-span-2"
        />

        <Field
          label="Quyết định thay đổi/bổ sung nếu có"
          multiline
          value={getAnyFormField("caseDecision", "additionalDecisionText")}
          onChange={(value) =>
            updateAnyField("caseDecision", "additionalDecisionText", value)
          }
          placeholder="Ví dụ: Quyết định thay đổi/bổ sung Quyết định khởi tố vụ án số ..."
          className="md:col-span-2"
        />

        <SelectField
          label="Chọn nhanh tội danh"
          value=""
          onChange={handleSelectOffense}
          options={BM097_OFFENSE_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
          className="md:col-span-2"
        />

        <Field
          label="Tội danh"
          required
          value={form.offense.offenseName}
          onChange={(value) => updateField("offense", "offenseName", value)}
        />

        <Field
          label="Điều khoản áp dụng"
          required
          value={form.offense.legalArticle}
          onChange={(value) => updateField("offense", "legalArticle", value)}
        />

        <Field
          label="Bộ luật áp dụng"
          required
          value={form.offense.criminalCodeText}
          onChange={(value) => updateField("offense", "criminalCodeText", value)}
          className="md:col-span-2"
        />

        <PreviewBox
          title="Preview phần căn cứ"
          description="Đây là 3 dòng căn cứ sẽ dùng trước phần thông tin bị can."
          lines={basisPreviewLines}
        />
      </SectionCard>

      <SectionCard title="4. Thông tin bị can">
        <Field
          label="Họ tên bị can"
          required
          value={form.person.fullName}
          onChange={(value) => updateField("person", "fullName", value)}
        />
        <SelectField
          label="Giới tính"
          required
          value={form.person.genderLabel}
          onChange={(value) => updateField("person", "genderLabel", value)}
          options={BM097_GENDER_OPTIONS}
        />
        <Field
          label="Tên gọi khác"
          required
          value={form.person.otherName}
          onChange={(value) => updateField("person", "otherName", value)}
        />
        <DateSelectField
          label="Ngày sinh"
          value={form.person.dateOfBirth}
          onChange={(value) => updateField("person", "dateOfBirth", value)}
        />
        <Field
          label="Nơi sinh"
          required
          value={form.person.placeOfBirth}
          onChange={(value) => updateField("person", "placeOfBirth", value)}
        />
        <Field
          label="Quốc tịch"
          required
          value={form.person.nationality}
          onChange={(value) => updateField("person", "nationality", value)}
        />
        <Field
          label="Dân tộc"
          required
          value={form.person.ethnicity}
          onChange={(value) => updateField("person", "ethnicity", value)}
        />
        <Field
          label="Tôn giáo"
          required
          value={form.person.religion}
          onChange={(value) => updateField("person", "religion", value)}
        />
        <Field
          label="Nghề nghiệp"
          required
          value={form.person.occupation}
          onChange={(value) => updateField("person", "occupation", value)}
        />
        <SelectField
          label="Loại giấy tờ"
          value={form.person.identityType}
          onChange={(value) => updateField("person", "identityType", value)}
          options={BM097_IDENTITY_TYPE_OPTIONS}
        />
        <Field
          label="Số CMND/CCCD/Hộ chiếu"
          required
          value={form.person.identityNo}
          onChange={(value) => updateField("person", "identityNo", value)}
        />
        <DateSelectField
          label="Ngày cấp giấy tờ"
          required
          value={form.person.identityIssuedDate}
          onChange={(value) => updateField("person", "identityIssuedDate", value)}
        />
        <Field
          label="Nơi cấp giấy tờ"
          required
          value={form.person.identityIssuedPlace}
          onChange={(value) => updateField("person", "identityIssuedPlace", value)}
          className="md:col-span-2"
        />
        <Field
          label="Nơi thường trú"
          required
          multiline
          value={form.person.permanentAddress}
          onChange={(value) => updateField("person", "permanentAddress", value)}
          className="md:col-span-2"
        />
        <Field
          label="Nơi tạm trú"
          multiline
          value={form.person.temporaryAddress}
          onChange={(value) => updateField("person", "temporaryAddress", value)}
          className="md:col-span-2"
        />
        <Field
          label="Nơi ở hiện tại"
          required
          multiline
          value={form.person.currentAddress}
          onChange={(value) => updateField("person", "currentAddress", value)}
          className="md:col-span-2"
        />
        <Field
          label="Tiền án, tiền sự"
          required
          value={form.person.criminalRecordLine}
          onChange={(value) => updateField("person", "criminalRecordLine", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="5. Hành vi, Điều 1 và Điều 2">
        <Field
          label="Hành vi phạm tội / lý do khởi tố"
          required
          multiline
          value={form.offense.actDescriptionLine}
          onChange={(value) => updateField("offense", "actDescriptionLine", value)}
          className="md:col-span-2"
        />

        <Field
          label="Cơ quan, người có thẩm quyền điều tra"
          required
          value={form.accusedDecision.issuedBy}
          onChange={(value) => updateField("accusedDecision", "issuedBy", value)}
          className="md:col-span-2"
        />

        <Field
          label="Dòng Điều 1"
          multiline
          value={getAnyFormField("accusedDecision", "article1Line")}
          onChange={(value) =>
            updateAnyField("accusedDecision", "article1Line", value)
          }
          placeholder="Để trống nếu muốn hệ thống tự tạo từ họ tên, tội danh và điều khoản."
          className="md:col-span-2"
        />

        <Field
          label="Dòng Điều 2"
          multiline
          value={getAnyFormField("accusedDecision", "article2Line")}
          onChange={(value) =>
            updateAnyField("accusedDecision", "article2Line", value)
          }
          placeholder="Để trống nếu muốn hệ thống tự tạo từ cơ quan điều tra."
          className="md:col-span-2"
        />

        <PreviewBox
          title="Preview phần nội dung quyết định"
          description="Kiểm nhanh từ dòng nghiên cứu hồ sơ đến hết Điều 1, Điều 2, nơi nhận và chữ ký."
          lines={bodyPreviewLines}
        />
      </SectionCard>

      <SectionCard title="6. Nơi nhận">
        <Field
          label="Dòng bị can"
          required
          value={form.recipients.personLine}
          onChange={(value) => updateField("recipients", "personLine", value)}
        />
        <Field
          label="Dòng cơ quan điều tra"
          required
          value={form.recipients.investigationUnitLine}
          onChange={(value) =>
            updateField("recipients", "investigationUnitLine", value)
          }
        />
        <Field
          label="Dòng lưu hồ sơ"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
        />
        <Field
          label="Ghi chú lưu / người soạn"
          value={form.recipients.noteLine}
          onChange={(value) => updateField("recipients", "noteLine", value)}
        />
      </SectionCard>

      <SectionCard title="7. Chữ ký">
        <SelectField
          label="Chọn nhanh người ký"
          value=""
          onChange={handleSelectSigner}
          options={BM097_SIGNER_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
          className="md:col-span-2"
        />
        <SelectField
          label="Hình thức ký"
          required
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          options={BM097_SIGN_MODE_OPTIONS}
        />
        <SelectField
          label="Chức vụ ký"
          required
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          options={BM097_POSITION_OPTIONS}
        />
        <Field
          label="Người ký"
          required
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Sau khi lưu, hệ thống sẽ render lại DOCX/PDF. Hãy kiểm preview trước khi lưu.
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-097"}
          </button>
        </div>
      </div>
    </div>
  );
}




