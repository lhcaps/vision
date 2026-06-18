"use client";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldSelect,
  BmFieldCheckbox,
  BmFormSection,
  BmFormMetaBar,
} from "./bm-form";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm056FormInputs = {
  agency: TextRecord;
  official: TextRecord;
  document: TextRecord;
  person: TextRecord;
  measure: TextRecord;
  monitoring: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm056FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm056FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const DEFAULT_IMMIGRATION_AGENCY = "Cơ quan quản lý xuất, nhập cảnh Bộ Công an";
const DEFAULT_PHONE = "";
const DEFAULT_PROSECUTOR = "";
const DEFAULT_SIGNER = '';

const EMPTY_FORM: Bm056FormInputs = {
  agency: {
    parentName: "",
    name: "",
    shortName: "VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    phone: DEFAULT_PHONE,
  },
  official: {
    fullName: DEFAULT_SIGNER,
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    prosecutorName: DEFAULT_PROSECUTOR,
  },
  document: {
    documentCode: "56/QĐ-VKSKV7",
    issueDate: todayIsoDate(),
  },
  person: {
    fullName: "",
    genderLabel: "",
    otherName: "Không có",
    dateOfBirth: "",
    birthYear: "",
    placeOfBirth: "",
    nationality: "Việt Nam",
    ethnicity: "Kinh",
    religion: "Không",
    occupation: "",
    identityType: "Thẻ CCCD",
    identityNo: "",
    identityIssuedDate: "",
    identityIssuedPlace: "",
    permanentAddress: "",
    temporaryAddress: "",
    currentAddress: "",
    residenceAddress: "",
  },
  measure: {
    durationText: "02 tháng",
    fromDate: "2026-03-16",
    toDate: "2026-05-16",
    exitPostponementReasonLine: "",
    exitPostponementArticle1Line: "",
    exitPostponementArticle2Line: "",
    exitPostponementDurationText: "02 tháng",
    exitPostponementFromDateText: "16/03/2026",
    exitPostponementToDateText: "16/05/2026",
    immigrationAgencyName: DEFAULT_IMMIGRATION_AGENCY,
  },
  monitoring: {
    phone: DEFAULT_PHONE,
    prosecutorName: DEFAULT_PROSECUTOR,
  },
  recipients: {
    personLine: "",
    immigrationUnitLine: `- ${DEFAULT_IMMIGRATION_AGENCY};`,
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
    noteLine: "",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER,
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Cơ quan ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh ban hành" },
  { section: "official", field: "issuerTitle", label: "Thẩm quyền ban hành" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày quyết định" },
  { section: "person", field: "fullName", label: "Họ tên người bị tạm hoãn xuất cảnh" },
  { section: "person", field: "genderLabel", label: "Giới tính" },
  { section: "person", field: "dateOfBirth", label: "Ngày sinh" },
  { section: "person", field: "placeOfBirth", label: "Nơi sinh" },
  { section: "person", field: "identityNo", label: "Số CMND/CCCD/Hộ chiếu" },
  { section: "person", field: "identityIssuedDate", label: "Ngày cấp giấy tờ" },
  { section: "person", field: "identityIssuedPlace", label: "Nơi cấp giấy tờ" },
  { section: "person", field: "permanentAddress", label: "Nơi thường trú" },
  { section: "person", field: "currentAddress", label: "Nơi ở hiện tại" },
  { section: "measure", field: "durationText", label: "Thời hạn" },
  { section: "measure", field: "fromDate", label: "Từ ngày" },
  { section: "measure", field: "toDate", label: "Đến ngày" },
  { section: "measure", field: "immigrationAgencyName", label: "Cơ quan quản lý xuất nhập cảnh" },
  { section: "monitoring", field: "phone", label: "Số điện thoại liên hệ" },
  { section: "monitoring", field: "prosecutorName", label: "Kiểm sát viên thụ lý" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - người bị tạm hoãn" },
  { section: "recipients", field: "immigrationUnitLine", label: "Nơi nhận - cơ quan xuất nhập cảnh" },
  { section: "signature", field: "positionTitle", label: "Chức vụ ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

const GENDER_OPTIONS = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
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

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const YEAR_OPTIONS = Array.from({ length: 90 }, (_, index) => String(new Date().getFullYear() + 5 - index));

function todayIsoDate(): string {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];
  return isRecord(value) ? value : {};
}

function pick(record: Record<string, unknown>, key: string): string {
  return text(record[key]);
}

function cleanBm056UiText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function toDateInput(value: unknown): string {
  const raw = cleanBm056UiText(text(value));

  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/u.test(raw)) {
    return raw;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const vnMatch = raw.match(/(?:ngày\s*)?(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/iu);
  if (vnMatch) {
    const [, day, month, year] = vnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function getDateParts(value: string): { day: string; month: string; year: string } {
  const iso = toDateInput(value);
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

function makeIsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function dateInputToVnDate(value: string): string {
  const iso = toDateInput(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/u);

  if (!match) {
    return "";
  }

  return `${Number(match[3])}/${Number(match[2])}/${match[1]}`;
}

function dateInputToLegalDate(value: string): string {
  const iso = toDateInput(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/u);

  if (!match) {
    return "";
  }

  return `ngày ${Number(match[3])} tháng ${Number(match[2])} năm ${match[1]}`;
}

function getDurationMonths(durationText: string): number {
  const match = cleanBm056UiText(durationText).match(/(\d+)/u);
  const value = match ? Number(match[1]) : 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function addMonthsToIsoDate(value: string, months: number): string {
  const iso = toDateInput(value);

  if (!iso || months <= 0) {
    return "";
  }

  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const maxDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, maxDay));

  return [
    result.getFullYear(),
    String(result.getMonth() + 1).padStart(2, "0"),
    String(result.getDate()).padStart(2, "0"),
  ].join("-");
}

function getValue(form: Bm056FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm056FormInputs {
  const agency = section(payload, "agency");
  const official = section(payload, "official");
  const document = section(payload, "document");
  const person = section(payload, "person");
  const measure = section(payload, "measure");
  const monitoring = section(payload, "monitoring");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  return prepareBm056FormForSave({
    agency: {
      parentName: pick(agency, "parentName") || EMPTY_FORM.agency.parentName,
      name: pick(agency, "name") || EMPTY_FORM.agency.name,
      shortName: pick(agency, "shortName") || EMPTY_FORM.agency.shortName,
      issuePlace: pick(agency, "issuePlace") || EMPTY_FORM.agency.issuePlace,
      phone: pick(agency, "phone") || DEFAULT_PHONE,
    },
    official: {
      fullName: pick(official, "fullName") || DEFAULT_SIGNER,
      positionTitle: pick(official, "positionTitle") || "PHÓ VIỆN TRƯỞNG",
      issuerTitle:
        pick(official, "issuerTitle") ||
        "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      prosecutorName: pick(official, "prosecutorName") || DEFAULT_PROSECUTOR,
    },
    document: {
      documentCode: pick(document, "documentCode") || EMPTY_FORM.document.documentCode,
      issueDate: toDateInput(document.issueDate) || todayIsoDate(),
    },
    person: {
      fullName: pick(person, "fullName"),
      genderLabel: pick(person, "genderLabel"),
      otherName: pick(person, "otherName") || "Không có",
      dateOfBirth: toDateInput(person.dateOfBirth),
      birthYear: pick(person, "birthYear"),
      placeOfBirth: pick(person, "placeOfBirth"),
      nationality: pick(person, "nationality") || "Việt Nam",
      ethnicity: pick(person, "ethnicity") || "Kinh",
      religion: pick(person, "religion") || "Không",
      occupation: pick(person, "occupation"),
      identityType: pick(person, "identityType") || "Thẻ CCCD",
      identityNo: pick(person, "identityNo"),
      identityIssuedDate: toDateInput(person.identityIssuedDate),
      identityIssuedPlace: pick(person, "identityIssuedPlace"),
      permanentAddress: pick(person, "permanentAddress"),
      temporaryAddress: pick(person, "temporaryAddress"),
      currentAddress: pick(person, "currentAddress"),
      residenceAddress: pick(person, "residenceAddress"),
    },
    measure: {
      durationText:
        pick(measure, "durationText") ||
        pick(measure, "exitPostponementDurationText") ||
        "02 tháng",
      fromDate:
        toDateInput(measure.fromDate || measure.exitPostponementFromDateText) ||
        "2026-03-16",
      toDate:
        toDateInput(measure.toDate || measure.exitPostponementToDateText) ||
        "2026-05-16",
      exitPostponementReasonLine: pick(measure, "exitPostponementReasonLine"),
      exitPostponementArticle1Line: pick(measure, "exitPostponementArticle1Line"),
      exitPostponementArticle2Line: pick(measure, "exitPostponementArticle2Line"),
      exitPostponementDurationText: pick(measure, "exitPostponementDurationText"),
      exitPostponementFromDateText: pick(measure, "exitPostponementFromDateText"),
      exitPostponementToDateText: pick(measure, "exitPostponementToDateText"),
      immigrationAgencyName: pick(measure, "immigrationAgencyName") || DEFAULT_IMMIGRATION_AGENCY,
    },
    monitoring: {
      phone: pick(monitoring, "phone") || DEFAULT_PHONE,
      prosecutorName: pick(monitoring, "prosecutorName") || DEFAULT_PROSECUTOR,
    },
    recipients: {
      personLine: pick(recipients, "personLine"),
      immigrationUnitLine: pick(recipients, "immigrationUnitLine"),
      archiveLine: pick(recipients, "archiveLine") || "- Lưu: HSVA, HSKS, VP.",
      noteLine: pick(recipients, "noteLine"),
    },
    signature: {
      signMode: pick(signature, "signMode") || "KT. VIỆN TRƯỞNG",
      positionTitle: pick(signature, "positionTitle") || "PHÓ VIỆN TRƯỞNG",
      signerName: pick(signature, "signerName") || DEFAULT_SIGNER,
    },
  });
}

async function getBm056RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không tải được payload BM-056. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm056FormInputs(
  documentId: string | number,
  form: Bm056FormInputs,
): Promise<void> {
  const signerName =
    cleanBm056UiText(form.signature.signerName) ||
    cleanBm056UiText(form.official.fullName) ||
    DEFAULT_SIGNER;

  const body = {
    ...form,
    templateCode: "BM-056",
    formInputs: form,
    payloadOverrides: form,
    renderPayloadOverrides: form,
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
    const bodyText = await response.text();
    throw new Error(bodyText || `Không lưu được dữ liệu BM-056. HTTP ${response.status}`);
  }
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  multiline,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
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
          type="text"
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
}) {
  const parts = getDateParts(value);

  function updateDate(part: "day" | "month" | "year", nextValue: string) {
    const nextParts = {
      ...parts,
      [part]: nextValue,
    };

    onChange(makeIsoDate(nextParts.day, nextParts.month, nextParts.year));
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
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
          {DAY_OPTIONS.map((day) => (
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
          {MONTH_OPTIONS.map((month) => (
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
          {YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}


function buildBm056ReasonLine(form: Bm056FormInputs): string {
  const personName =
    cleanBm056UiText(form.person.fullName) || "người bị tạm hoãn xuất cảnh";

  return `có đủ căn cứ, điều kiện áp dụng biện pháp tạm hoãn xuất cảnh đối với ${personName}`;
}

function buildBm056Article1Line(form: Bm056FormInputs): string {
  const personName =
    cleanBm056UiText(form.person.fullName) || "người bị tạm hoãn xuất cảnh";

  return `Tạm hoãn xuất cảnh đối với ${personName}.`;
}

function buildBm056Article2Line(form: Bm056FormInputs): string {
  const immigrationAgencyName =
    cleanBm056UiText(form.measure.immigrationAgencyName) ||
    DEFAULT_IMMIGRATION_AGENCY;

  const phone = cleanBm056UiText(form.monitoring.phone) || DEFAULT_PHONE;

  const prosecutorName =
    cleanBm056UiText(form.monitoring.prosecutorName) ||
    DEFAULT_PROSECUTOR;

  return immigrationAgencyName +
    ", ng\u01B0\u1EDDi b\u1ECB t\u1EA1m ho\u00E3n xu\u1EA5t c\u1EA3nh n\u00EAu t\u1EA1i \u0110i\u1EC1u 1 c\u00F3 tr\u00E1ch nhi\u1EC7m thi h\u00E0nh Quy\u1EBFt \u0111\u1ECBnh n\u00E0y. N\u1EBFu b\u1ECB can vi ph\u1EA1m, y\u00EAu c\u1EA7u " +
    immigrationAgencyName +
    " th\u00F4ng b\u00E1o ngay cho Vi\u1EC7n ki\u1EC3m s\u00E1t nh\u00E2n d\u00E2n khu v\u1EF1c 7 bi\u1EBFt \u0111\u1EC3 x\u1EED l\u00FD theo th\u1EA9m quy\u1EC1n, \u0111i\u1EC7n tho\u1EA1i li\u00EAn h\u1EC7 s\u1ED1 " +
    phone +
    ", g\u1EB7p Ki\u1EC3m s\u00E1t vi\u00EAn " +
    prosecutorName +
    " \u0111\u1EC3 gi\u1EA3i quy\u1EBFt./.";
}

function prepareBm056FormForSave(form: Bm056FormInputs): Bm056FormInputs {
  const durationText =
    cleanBm056UiText(form.measure.durationText) ||
    cleanBm056UiText(form.measure.exitPostponementDurationText) ||
    "02 tháng";

  const fromDateInput =
    toDateInput(form.measure.fromDate || form.measure.exitPostponementFromDateText) ||
    "2026-03-16";

  const toDateInputValue =
    toDateInput(form.measure.toDate || form.measure.exitPostponementToDateText) ||
    addMonthsToIsoDate(fromDateInput, getDurationMonths(durationText)) ||
    "2026-05-16";

  const personName = cleanBm056UiText(form.person.fullName);

  const nextForm: Bm056FormInputs = {
    ...form,
    agency: {
      ...form.agency,
      parentName: cleanBm056UiText(form.agency.parentName) || EMPTY_FORM.agency.parentName,
      name: cleanBm056UiText(form.agency.name) || EMPTY_FORM.agency.name,
      shortName: cleanBm056UiText(form.agency.shortName) || EMPTY_FORM.agency.shortName,
      issuePlace: cleanBm056UiText(form.agency.issuePlace) || EMPTY_FORM.agency.issuePlace,
      phone: cleanBm056UiText(form.agency.phone) || DEFAULT_PHONE,
    },
    official: {
      ...form.official,
      fullName: cleanBm056UiText(form.official.fullName) || DEFAULT_SIGNER,
      positionTitle: cleanBm056UiText(form.official.positionTitle) || "PHÓ VIỆN TRƯỞNG",
      issuerTitle:
        cleanBm056UiText(form.official.issuerTitle) ||
        "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      prosecutorName: cleanBm056UiText(form.official.prosecutorName) || DEFAULT_PROSECUTOR,
    },
    person: {
      ...form.person,
      fullName: personName,
      otherName: cleanBm056UiText(form.person.otherName) || "Không có",
      nationality: cleanBm056UiText(form.person.nationality) || "Việt Nam",
      ethnicity: cleanBm056UiText(form.person.ethnicity) || "Kinh",
      religion: cleanBm056UiText(form.person.religion) || "Không",
      identityType: cleanBm056UiText(form.person.identityType) || "Thẻ CCCD",
      dateOfBirth: toDateInput(form.person.dateOfBirth),
      identityIssuedDate: toDateInput(form.person.identityIssuedDate),
    },
    measure: {
      ...form.measure,
      durationText,
      fromDate: fromDateInput,
      toDate: toDateInputValue,
      exitPostponementDurationText: durationText,
      exitPostponementFromDateText: dateInputToVnDate(fromDateInput),
      exitPostponementToDateText: dateInputToVnDate(toDateInputValue),
      exitPostponementReasonLine: buildBm056ReasonLine(form),
      exitPostponementArticle1Line: buildBm056Article1Line(form),
      exitPostponementArticle2Line: buildBm056Article2Line(form),
      immigrationAgencyName:
        cleanBm056UiText(form.measure.immigrationAgencyName) ||
        DEFAULT_IMMIGRATION_AGENCY,
    },
    monitoring: {
      ...form.monitoring,
      phone: cleanBm056UiText(form.monitoring.phone) || DEFAULT_PHONE,
      prosecutorName:
        cleanBm056UiText(form.monitoring.prosecutorName) ||
        cleanBm056UiText(form.official.prosecutorName) ||
        DEFAULT_PROSECUTOR,
    },
    recipients: {
      ...form.recipients,
      personLine: personName ? `- ${personName};` : "",
      immigrationUnitLine: `- ${
        cleanBm056UiText(form.measure.immigrationAgencyName) ||
        DEFAULT_IMMIGRATION_AGENCY
      };`,
      archiveLine: cleanBm056UiText(form.recipients.archiveLine) || "- Lưu: HSVA, HSKS, VP.",
    },
    signature: {
      ...form.signature,
      signMode: cleanBm056UiText(form.signature.signMode) || "KT. VIỆN TRƯỞNG",
      positionTitle: cleanBm056UiText(form.signature.positionTitle) || "PHÓ VIỆN TRƯỞNG",
      signerName: cleanBm056UiText(form.signature.signerName) || DEFAULT_SIGNER,
    },
  };

  return nextForm;
}

export function Bm056FormInputsPanel({
  documentId,
  onSaved,
}: Bm056FormInputsPanelProps) {
  const [form, setForm] = useState<Bm056FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const readyForm = useMemo(() => prepareBm056FormForSave(form), [form]);
  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      return !getValue(readyForm, item.section, item.field).trim();
    });
  }, [readyForm]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getBm056RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-056.",
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
      const next: Bm056FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };

      if (sectionKey === "person" && field === "fullName") {
        next.recipients = {
          ...next.recipients,
          personLine: value.trim() ? `- ${value.trim()};` : "",
        };
      }

      if (sectionKey === "measure" && field === "immigrationAgencyName") {
        next.recipients = {
          ...next.recipients,
          immigrationUnitLine: value.trim() ? `- ${value.trim()};` : "",
        };
      }

      if (sectionKey === "agency" && field === "phone") {
        next.monitoring = {
          ...next.monitoring,
          phone: next.monitoring.phone || value,
        };
      }

      if (sectionKey === "measure" && (field === "fromDate" || field === "durationText")) {
        const duration = field === "durationText" ? value : next.measure.durationText;
        const fromDate = field === "fromDate" ? value : next.measure.fromDate;
        const calculatedToDate = addMonthsToIsoDate(fromDate, getDurationMonths(duration));

        if (calculatedToDate) {
          next.measure = {
            ...next.measure,
            toDate: calculatedToDate,
          };
        }
      }

      return next;
    });
  }

  function fillCustomerSample() {
    const sample: Bm056FormInputs = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: DEFAULT_PHONE,
      },
      official: {
        fullName: DEFAULT_SIGNER,
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        prosecutorName: DEFAULT_PROSECUTOR,
      },
      document: {
        documentCode: "56/QĐ-VKSKV7",
        issueDate: todayIsoDate(),
      },
      person: {
        fullName: "",
        genderLabel: "Nam",
        otherName: "Không có",
        dateOfBirth: "1985-09-08",
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
        temporaryAddress:
          "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
        currentAddress:
          "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
        residenceAddress: "xã Đông Thạnh, Thành phố Hồ Chí Minh",
      },
      measure: {
        durationText: "02 tháng",
        fromDate: "2026-03-16",
        toDate: "2026-05-16",
        exitPostponementReasonLine: "",
        exitPostponementArticle1Line: "",
        exitPostponementArticle2Line: "",
        exitPostponementDurationText: "02 tháng",
        exitPostponementFromDateText: "16/03/2026",
        exitPostponementToDateText: "16/05/2026",
        immigrationAgencyName: DEFAULT_IMMIGRATION_AGENCY,
      },
      monitoring: {
        phone: DEFAULT_PHONE,
        prosecutorName: DEFAULT_PROSECUTOR,
      },
      recipients: {
        personLine: "- ;",
        immigrationUnitLine: `- ${DEFAULT_IMMIGRATION_AGENCY};`,
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
        noteLine: "",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: DEFAULT_SIGNER,
      },
    };

    const preparedSample = prepareBm056FormForSave(sample);
    setForm(preparedSample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const formToSave = prepareBm056FormForSave(form);

      await saveBm056FormInputs(documentId, formToSave);

      setForm(formToSave);
      setInitialSnapshot(JSON.stringify(formToSave));
      setSavedAt(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu BM-056.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-056...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-056
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định tạm hoãn xuất cảnh
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này lưu dữ liệu nghiệp vụ riêng cho BM-056: số quyết định,
              thông tin người bị tạm hoãn xuất cảnh, thời hạn tạm hoãn, cơ quan
              quản lý xuất nhập cảnh, nơi nhận và chữ ký.
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
            <p className="mt-1 text-sm text-amber-700">
              {missingFields.map((item) => item.label).join(", ")}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Các trường quan trọng của BM-056 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-056
          </button>

          <button
            type="button"
            onClick={loadForm}
            disabled={isSaving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tải lại từ backend
          </button>
        </div>
      </section>

      <BmFormSection title="1. Cơ quan ban hành">
        <BmFieldText required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} />
        <BmFieldText required label="Cơ quan ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} />
        <BmFieldText label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateField("agency", "shortName", value)} />
        <BmFieldText required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
      </BmFormSection>

      <BmFormSection title="2. Quyết định và thẩm quyền">
        <BmFieldText required label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <DateSelectField required label="Ngày quyết định" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <BmFieldText required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} fullWidth />
      </BmFormSection>

      <BmFormSection title="3. Người bị tạm hoãn xuất cảnh">
        <BmFieldText required label="Họ tên" value={form.person.fullName} onChange={(value) => updateField("person", "fullName", value)} />
        <BmFieldSelect required label="Giới tính" value={form.person.genderLabel} onChange={(value) => updateField("person", "genderLabel", value)} options={GENDER_OPTIONS} />
        <BmFieldText label="Tên gọi khác" value={form.person.otherName} onChange={(value) => updateField("person", "otherName", value)} />
        <DateSelectField required label="Ngày sinh" value={form.person.dateOfBirth} onChange={(value) => updateField("person", "dateOfBirth", value)} />
        <BmFieldText required label="Nơi sinh" value={form.person.placeOfBirth} onChange={(value) => updateField("person", "placeOfBirth", value)} />
        <BmFieldText label="Quốc tịch" value={form.person.nationality} onChange={(value) => updateField("person", "nationality", value)} />
        <BmFieldText label="Dân tộc" value={form.person.ethnicity} onChange={(value) => updateField("person", "ethnicity", value)} />
        <BmFieldText label="Tôn giáo" value={form.person.religion} onChange={(value) => updateField("person", "religion", value)} />
        <BmFieldText label="Nghề nghiệp" value={form.person.occupation} onChange={(value) => updateField("person", "occupation", value)} />
        <BmFieldText label="Loại giấy tờ" value={form.person.identityType} onChange={(value) => updateField("person", "identityType", value)} />
        <BmFieldText required label="Số CMND/CCCD/Hộ chiếu" value={form.person.identityNo} onChange={(value) => updateField("person", "identityNo", value)} />
        <DateSelectField required label="Ngày cấp" value={form.person.identityIssuedDate} onChange={(value) => updateField("person", "identityIssuedDate", value)} />
        <BmFieldText required label="Nơi cấp" value={form.person.identityIssuedPlace} onChange={(value) => updateField("person", "identityIssuedPlace", value)} fullWidth />
        <BmFieldTextarea required label="Nơi thường trú" value={form.person.permanentAddress} onChange={(value) => updateField("person", "permanentAddress", value)} fullWidth />
        <BmFieldTextarea label="Nơi tạm trú" value={form.person.temporaryAddress} onChange={(value) => updateField("person", "temporaryAddress", value)} fullWidth />
        <BmFieldTextarea required label="Nơi ở hiện tại" value={form.person.currentAddress} onChange={(value) => updateField("person", "currentAddress", value)} fullWidth />
      </BmFormSection>

      <BmFormSection
        title="4. Nội dung tạm hoãn xuất cảnh"
        description="Từ ngày + thời hạn sẽ tự tính Đến ngày. Nếu ngày kết thúc chưa đúng, vẫn chỉnh lại thủ công được."
      >
        <BmFieldTextarea required label="Lý do tạm hoãn xuất cảnh" value={readyForm.measure.exitPostponementReasonLine} onChange={(value) => updateField("measure", "exitPostponementReasonLine", value)} fullWidth />
        <BmFieldText required label="Thời hạn" value={form.measure.durationText} onChange={(value) => updateField("measure", "durationText", value)} />
        <DateSelectField required label="Từ ngày" value={form.measure.fromDate} onChange={(value) => updateField("measure", "fromDate", value)} />
        <DateSelectField required label="Đến ngày" value={form.measure.toDate} onChange={(value) => updateField("measure", "toDate", value)} />
        <BmFieldText required label="Cơ quan quản lý xuất nhập cảnh" value={form.measure.immigrationAgencyName} onChange={(value) => updateField("measure", "immigrationAgencyName", value)} />
        <BmFieldTextarea label="Nội dung Điều 1" value={readyForm.measure.exitPostponementArticle1Line} onChange={(value) => updateField("measure", "exitPostponementArticle1Line", value)} fullWidth />
        <BmFieldTextarea required label="Nội dung Điều 2" value={readyForm.measure.exitPostponementArticle2Line} onChange={(value) => updateField("measure", "exitPostponementArticle2Line", value)} fullWidth />
      </BmFormSection>

      <BmFormSection title="5. Liên hệ, nơi nhận">
        <BmFieldText required label="Số điện thoại liên hệ" value={form.monitoring.phone} onChange={(value) => updateField("monitoring", "phone", value)} />
        <BmFieldText required label="Kiểm sát viên thụ lý" value={form.monitoring.prosecutorName} onChange={(value) => updateField("monitoring", "prosecutorName", value)} />
        <BmFieldText required label="Nơi nhận - người bị tạm hoãn" value={readyForm.recipients.personLine} onChange={(value) => updateField("recipients", "personLine", value)} />
        <BmFieldText required label="Nơi nhận - cơ quan xuất nhập cảnh" value={readyForm.recipients.immigrationUnitLine} onChange={(value) => updateField("recipients", "immigrationUnitLine", value)} />
        <BmFieldText label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} />
      </BmFormSection>

      <BmFormSection title="6. Chữ ký">
        <BmFieldSelect label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <BmFieldSelect required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <BmFieldText required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
      </BmFormSection>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-950">
          Preview trước khi in
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Kiểm nhanh các dòng chính trước khi xuất DOCX/PDF.
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p>
            <strong>Header:</strong> {readyForm.agency.name} — Số:{" "}
            {readyForm.document.documentCode}
          </p>
          <p>
            {readyForm.agency.issuePlace}, {dateInputToLegalDate(readyForm.document.issueDate)}
          </p>
          <p>
            <strong>Xét thấy:</strong> {readyForm.measure.exitPostponementReasonLine}
          </p>
          <p>
            <strong>Điều 1:</strong> {readyForm.measure.exitPostponementArticle1Line}
          </p>
          <p>
            <strong>Thời hạn:</strong> {readyForm.measure.exitPostponementDurationText} kể từ{" "}
            {readyForm.measure.exitPostponementFromDateText} đến{" "}
            {readyForm.measure.exitPostponementToDateText}.
          </p>
          <p>
            <strong>Điều 2:</strong> {readyForm.measure.exitPostponementArticle2Line}
          </p>
          <p>
            <strong>Nơi nhận:</strong> {readyForm.recipients.personLine}{" "}
            {readyForm.recipients.immigrationUnitLine} {readyForm.recipients.archiveLine}
          </p>
          <p>
            <strong>Chữ ký:</strong> {readyForm.signature.signMode}{" "}
            {readyForm.signature.positionTitle} — {readyForm.signature.signerName}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Lưu dữ liệu BM-056
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Sau khi lưu, chuyển sang tab File đã xuất để render DOCX và convert PDF.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-056"}
          </button>
        </div>
      </section>
    </div>
  );
}