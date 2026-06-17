"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm057FormInputs = {
  agency: TextRecord;
  official: TextRecord;
  document: TextRecord;
  person: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm057FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm057FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm057FormInputs = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
    issuePlace: "",
    phone: "",
  },
  official: {
    fullName: "",
    positionTitle: "",
    issuerTitle: "",
    prosecutorName: "",
  },
  document: {
    documentCode: "",
    issueDate: "",
  },
  person: {
    fullName: "",
    genderLabel: "",
    otherName: "",
    dateOfBirth: "",
    birthYear: "",
    placeOfBirth: "",
    nationality: "",
    ethnicity: "",
    religion: "",
    occupation: "",
    identityType: "",
    identityNo: "",
    identityIssuedDate: "",
    identityIssuedPlace: "",
    permanentAddress: "",
    temporaryAddress: "",
    currentAddress: "",
    residenceAddress: "",
  },
  measure: {
    exitPostponementDecisionCode: "",
    exitPostponementDecisionIssueDate: "",
    exitPostponementDecisionLegalBasisLine: "",
    exitPostponementCancelReasonLine: "",
    exitPostponementCancellationArticle1Line: "",
    exitPostponementCancellationArticle2Line: "",
    immigrationAgencyName: "",
  },
  recipients: {
    immigrationUnitLine: "",
    personLine: "",
    investigationUnitLine: "",
    archiveLine: "",
    noteLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Cơ quan ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh ban hành" },
  { section: "official", field: "issuerTitle", label: "Thẩm quyền ban hành" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày quyết định" },
  { section: "person", field: "fullName", label: "Họ tên người được hủy bỏ tạm hoãn xuất cảnh" },
  { section: "person", field: "genderLabel", label: "Giới tính" },
  { section: "person", field: "dateOfBirth", label: "Ngày sinh" },
  { section: "person", field: "placeOfBirth", label: "Nơi sinh" },
  { section: "person", field: "identityNo", label: "Số CMND/CCCD/Hộ chiếu" },
  { section: "person", field: "identityIssuedDate", label: "Ngày cấp giấy tờ" },
  { section: "person", field: "identityIssuedPlace", label: "Nơi cấp giấy tờ" },
  { section: "person", field: "permanentAddress", label: "Nơi thường trú" },
  { section: "person", field: "currentAddress", label: "Nơi ở hiện tại" },
  { section: "measure", field: "exitPostponementDecisionLegalBasisLine", label: "Căn cứ quyết định tạm hoãn xuất cảnh" },
  { section: "measure", field: "exitPostponementCancelReasonLine", label: "Lý do hủy bỏ" },
  { section: "measure", field: "immigrationAgencyName", label: "Cơ quan quản lý xuất nhập cảnh" },
  { section: "recipients", field: "immigrationUnitLine", label: "Nơi nhận - cơ quan xuất nhập cảnh" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - người liên quan" },
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];
  return isRecord(value) ? value : {};
}

function pick(record: Record<string, unknown>, key: string): string {
  return text(record[key]);
}

function toDateInput(value: unknown): string {
  const raw = text(value).trim();

  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function getValue(form: Bm057FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm057FormInputs {
  const agency = section(payload, "agency");
  const official = section(payload, "official");
  const document = section(payload, "document");
  const person = section(payload, "person");
  const measure = section(payload, "measure");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  return {
    agency: {
      parentName: pick(agency, "parentName"),
      name: pick(agency, "name"),
      shortName: pick(agency, "shortName"),
      issuePlace: pick(agency, "issuePlace"),
      phone: pick(agency, "phone"),
    },
    official: {
      fullName: pick(official, "fullName"),
      positionTitle: pick(official, "positionTitle"),
      issuerTitle: pick(official, "issuerTitle"),
      prosecutorName: pick(official, "prosecutorName"),
    },
    document: {
      documentCode: pick(document, "documentCode"),
      issueDate: toDateInput(document.issueDate),
    },
    person: {
      fullName: pick(person, "fullName"),
      genderLabel: pick(person, "genderLabel"),
      otherName: pick(person, "otherName"),
      dateOfBirth: toDateInput(person.dateOfBirth),
      birthYear: pick(person, "birthYear"),
      placeOfBirth: pick(person, "placeOfBirth"),
      nationality: pick(person, "nationality"),
      ethnicity: pick(person, "ethnicity"),
      religion: pick(person, "religion"),
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
      exitPostponementDecisionCode: pick(measure, "exitPostponementDecisionCode"),
      exitPostponementDecisionIssueDate: toDateInput(
        measure.exitPostponementDecisionIssueDate,
      ),
      exitPostponementDecisionLegalBasisLine: pick(
        measure,
        "exitPostponementDecisionLegalBasisLine",
      ),
      exitPostponementCancelReasonLine: pick(
        measure,
        "exitPostponementCancelReasonLine",
      ),
      exitPostponementCancellationArticle1Line: pick(
        measure,
        "exitPostponementCancellationArticle1Line",
      ),
      exitPostponementCancellationArticle2Line: pick(
        measure,
        "exitPostponementCancellationArticle2Line",
      ),
      immigrationAgencyName:
        pick(measure, "immigrationAgencyName") ||
        "Cơ quan quản lý xuất, nhập cảnh Bộ Công an",
    },
    recipients: {
      immigrationUnitLine: pick(recipients, "immigrationUnitLine"),
      personLine: pick(recipients, "personLine"),
      investigationUnitLine: pick(recipients, "investigationUnitLine"),
      archiveLine: pick(recipients, "archiveLine"),
      noteLine: pick(recipients, "noteLine"),
    },
    signature: {
      signMode: pick(signature, "signMode") || "KT. VIỆN TRƯỞNG",
      positionTitle: pick(signature, "positionTitle") || "PHÓ VIỆN TRƯỞNG",
      signerName: pick(signature, "signerName"),
    },
  };
}

async function getBm057RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
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
    throw new Error(body || `Không tải được payload BM-057. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm057FormInputs(
  documentId: string | number,
  form: Bm057FormInputs,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ...form,
        templateCode: "BM-057",
        formInputs: form,
        payloadOverrides: form,
        renderPayloadOverrides: form,
        updatedByName:
          form.signature.signerName ||
          form.official.fullName ||
          "",
        renderedByName:
          form.signature.signerName ||
          form.official.fullName ||
          "",
        convertedByName:
          form.signature.signerName ||
          form.official.fullName ||
          "",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không lưu được dữ liệu BM-057. HTTP ${response.status}`);
  }
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


const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const YEAR_OPTIONS = Array.from({ length: 90 }, (_, index) =>
  String(new Date().getFullYear() + 5 - index),
);

function todayIsoDate(): string {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function cleanBm057UiText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function getBm057DateParts(value: string): { day: string; month: string; year: string } {
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

function makeBm057IsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function bm057LegalDate(value: string): string {
  const iso = toDateInput(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/u);

  if (!match) {
    return cleanBm057UiText(value);
  }

  return `ngày ${Number(match[3])} tháng ${Number(match[2])} năm ${match[1]}`;
}

function bm057AgencyBodyName(form: Bm057FormInputs): string {
  const raw = cleanBm057UiText(form.agency.name);

  if (!raw) {
    return "Viện kiểm sát nhân dân khu vực 7";
  }

  if (raw === raw.toUpperCase()) {
    return raw
      .toLocaleLowerCase("vi-VN")
      .replace(/^./u, (char) => char.toLocaleUpperCase("vi-VN"));
  }

  return raw;
}

function bm057BuildDecisionLegalBasisLine(form: Bm057FormInputs): string {
  const decisionCode =
    cleanBm057UiText(form.measure.exitPostponementDecisionCode) ||
    "15/QĐ-VKSKV7";

  const decisionDate = bm057LegalDate(
    form.measure.exitPostponementDecisionIssueDate,
  );

  return `Quyết định tạm hoãn xuất cảnh số ${decisionCode} ${decisionDate} của ${bm057AgencyBodyName(form)};`;
}

function bm057BuildCancelReasonLine(form: Bm057FormInputs): string {
  const personName =
    cleanBm057UiText(form.person.fullName) || "người được hủy bỏ tạm hoãn xuất cảnh";

  return `không còn cần thiết tiếp tục áp dụng biện pháp tạm hoãn xuất cảnh đối với bị can ${personName}`;
}

function bm057BuildArticle1Line(form: Bm057FormInputs): string {
  const personName =
    cleanBm057UiText(form.person.fullName) || "người được hủy bỏ tạm hoãn xuất cảnh";

  return `Hủy bỏ biện pháp tạm hoãn xuất cảnh đối với bị can ${personName}.`;
}

function bm057BuildArticle2Line(form: Bm057FormInputs): string {
  const immigrationAgencyName =
    cleanBm057UiText(form.measure.immigrationAgencyName) ||
    "Cơ quan quản lý xuất, nhập cảnh Bộ Công an";

  return `Yêu cầu ${immigrationAgencyName} thực hiện Quyết định này theo quy định của pháp luật./.`;
}

function bm057BuildIdentityDocumentLine(form: Bm057FormInputs): string {
  const identityType = cleanBm057UiText(form.person.identityType) || "Thẻ CCCD";
  const identityNo = cleanBm057UiText(form.person.identityNo);
  const identityDate = bm057LegalDate(form.person.identityIssuedDate);
  const identityPlace = cleanBm057UiText(form.person.identityIssuedPlace);

  if (!identityNo) {
    return "";
  }

  return `${identityType} số ${identityNo}, cấp ${identityDate}, Nơi cấp: ${identityPlace}`;
}

function prepareBm057FormForSave(form: Bm057FormInputs): Bm057FormInputs {
  const personName = cleanBm057UiText(form.person.fullName);
  const immigrationAgencyName =
    cleanBm057UiText(form.measure.immigrationAgencyName) ||
    "Cơ quan quản lý xuất, nhập cảnh Bộ Công an";

  return {
    ...form,
    agency: {
      ...form.agency,
      parentName:
        cleanBm057UiText(form.agency.parentName) ||
        "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
      name:
        cleanBm057UiText(form.agency.name) ||
        "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      shortName: cleanBm057UiText(form.agency.shortName) || "VKSKV7",
      issuePlace: cleanBm057UiText(form.agency.issuePlace) || "TP. Hồ Chí Minh",
      phone: cleanBm057UiText(form.agency.phone) || "",
      nameBody: bm057AgencyBodyName(form),
      parentNameBody: "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    },
    official: {
      ...form.official,
      fullName: cleanBm057UiText(form.official.fullName) || "",
      positionTitle:
        cleanBm057UiText(form.official.positionTitle) || "PHÓ VIỆN TRƯỞNG",
      issuerTitle:
        cleanBm057UiText(form.official.issuerTitle) ||
        "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      prosecutorName:
        cleanBm057UiText(form.official.prosecutorName) ||
        "",
    },
    document: {
      ...form.document,
      documentCode:
        cleanBm057UiText(form.document.documentCode) || "57/QĐ-VKSKV7",
      issueDate: toDateInput(form.document.issueDate) || todayIsoDate(),
      issuePlaceAndDateLine: `${cleanBm057UiText(form.agency.issuePlace) || "TP. Hồ Chí Minh"}, ${bm057LegalDate(
        toDateInput(form.document.issueDate) || todayIsoDate(),
      )}`,
    },
    person: {
      ...form.person,
      fullName: personName,
      otherName: cleanBm057UiText(form.person.otherName) || "Không có",
      dateOfBirth: toDateInput(form.person.dateOfBirth),
      dateOfBirthText: bm057LegalDate(form.person.dateOfBirth),
      nationality: cleanBm057UiText(form.person.nationality) || "Việt Nam",
      ethnicity: cleanBm057UiText(form.person.ethnicity) || "Kinh",
      religion: cleanBm057UiText(form.person.religion) || "Không",
      identityType: cleanBm057UiText(form.person.identityType) || "Thẻ CCCD",
      identityIssuedDate: toDateInput(form.person.identityIssuedDate),
      identityDocumentLine: bm057BuildIdentityDocumentLine(form),
    },
    measure: {
      ...form.measure,
      exitPostponementDecisionCode:
        cleanBm057UiText(form.measure.exitPostponementDecisionCode) ||
        "15/QĐ-VKSKV7",
      exitPostponementDecisionIssueDate: toDateInput(
        form.measure.exitPostponementDecisionIssueDate,
      ),
      exitPostponementDecisionLegalBasisLine:
        bm057BuildDecisionLegalBasisLine(form),
      exitPostponementCancelReasonLine: bm057BuildCancelReasonLine(form),
      exitPostponementCancellationArticle1Line: bm057BuildArticle1Line(form),
      exitPostponementCancellationArticle2Line: bm057BuildArticle2Line(form),
      immigrationAgencyName,
    },
    recipients: {
      ...form.recipients,
      immigrationUnitLine:
        cleanBm057UiText(form.recipients.immigrationUnitLine) ||
        `- ${immigrationAgencyName};`,
      personLine:
        cleanBm057UiText(form.recipients.personLine) ||
        (personName ? `- ${personName};` : ""),
      investigationUnitLine:
        cleanBm057UiText(form.recipients.investigationUnitLine) ||
        "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
      archiveLine:
        cleanBm057UiText(form.recipients.archiveLine) ||
        "- Lưu: HSVA, HSKS, VP.",
    },
    signature: {
      ...form.signature,
      signMode: cleanBm057UiText(form.signature.signMode) || "KT. VIỆN TRƯỞNG",
      positionTitle:
        cleanBm057UiText(form.signature.positionTitle) || "PHÓ VIỆN TRƯỞNG",
      signerName: cleanBm057UiText(form.signature.signerName) || "",
    },
  };
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
  const parts = getBm057DateParts(value);

  function updateDate(part: "day" | "month" | "year", nextValue: string) {
    const nextParts = {
      ...parts,
      [part]: nextValue,
    };

    onChange(makeBm057IsoDate(nextParts.day, nextParts.month, nextParts.year));
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

export function Bm057FormInputsPanel({
  documentId,
  onSaved,
}: Bm057FormInputsPanelProps) {
  const [form, setForm] = useState<Bm057FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const readyForm = useMemo(() => prepareBm057FormForSave(form), [form]);
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
      const payload = await getBm057RenderPayload(documentId);
      const nextForm = prepareBm057FormForSave(normalizeFormInputs(payload));

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-057.",
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
      const next: Bm057FormInputs = {
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

      return next;
    });
  }

  function fillCustomerSample() {
    const sample: Bm057FormInputs = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
      },
      official: {
        fullName: "",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        prosecutorName: "thụ lý vụ án",
      },
      document: {
        documentCode: "16/QĐ-VKSKV7",
        issueDate: "2026-05-17",
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
        temporaryAddress: "",
        currentAddress:
          "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
        residenceAddress: "xã Đông Thạnh, Thành phố Hồ Chí Minh",
      },
      measure: {
        exitPostponementDecisionCode: "15/QĐ-VKSKV7",
        exitPostponementDecisionIssueDate: "2026-03-16",
        exitPostponementDecisionLegalBasisLine:
          "Quyết định tạm hoãn xuất cảnh số 15/QĐ-VKSKV7 ngày 16 tháng 3 năm 2026 của VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7;",
        exitPostponementCancelReasonLine:
          "không còn cần thiết tiếp tục áp dụng biện pháp tạm hoãn xuất cảnh đối với bị can ",
        exitPostponementCancellationArticle1Line:
          "Hủy bỏ biện pháp tạm hoãn xuất cảnh đối với bị can .",
        exitPostponementCancellationArticle2Line:
          "Quyết định này có hiệu lực kể từ ngày ký. Cơ quan quản lý xuất, nhập cảnh Bộ Công an và người bị tạm hoãn xuất cảnh có trách nhiệm thi hành Quyết định này.",
        immigrationAgencyName: "Cơ quan quản lý xuất, nhập cảnh Bộ Công an",
      },
      recipients: {
        immigrationUnitLine: "- Cơ quan quản lý xuất, nhập cảnh Bộ Công an;",
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

    setForm(prepareBm057FormForSave(sample));
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const formToSave = prepareBm057FormForSave(form);

      await saveBm057FormInputs(documentId, formToSave);

      setForm(formToSave);
      setInitialSnapshot(JSON.stringify(formToSave));
      setSavedAt(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-057.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-057...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-057
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định hủy bỏ biện pháp tạm hoãn xuất cảnh
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này lưu dữ liệu nghiệp vụ riêng cho BM-057: số quyết định,
              căn cứ quyết định tạm hoãn xuất cảnh, lý do hủy bỏ, thông tin
              người liên quan, cơ quan xuất nhập cảnh, nơi nhận và chữ ký.
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
            Các trường quan trọng của BM-057 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-057
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

      <SectionCard title="1. Cơ quan ban hành">
        <Field required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} />
        <Field required label="Cơ quan ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} />
        <Field label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateField("agency", "shortName", value)} />
        <Field required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
      </SectionCard>

      <SectionCard title="2. Quyết định và thẩm quyền">
        <Field required label="Số quyết định hủy bỏ" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <DateSelectField required label="Ngày quyết định hủy bỏ" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <Field required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="3. Căn cứ và nội dung hủy bỏ">
        <Field required multiline label="Căn cứ quyết định tạm hoãn xuất cảnh" value={form.measure.exitPostponementDecisionLegalBasisLine} onChange={(value) => updateField("measure", "exitPostponementDecisionLegalBasisLine", value)} className="md:col-span-2" />
        <DateSelectField required label="Ngày quyết định tạm hoãn xuất cảnh" value={form.measure.exitPostponementDecisionIssueDate} onChange={(value) => updateField("measure", "exitPostponementDecisionIssueDate", value)} className="md:col-span-2" />
        <Field required multiline label="Lý do hủy bỏ" value={form.measure.exitPostponementCancelReasonLine} onChange={(value) => updateField("measure", "exitPostponementCancelReasonLine", value)} className="md:col-span-2" />
        <Field multiline label="Nội dung Điều 1" value={form.measure.exitPostponementCancellationArticle1Line} onChange={(value) => updateField("measure", "exitPostponementCancellationArticle1Line", value)} className="md:col-span-2" />
        <Field multiline label="Nội dung Điều 2" value={form.measure.exitPostponementCancellationArticle2Line} onChange={(value) => updateField("measure", "exitPostponementCancellationArticle2Line", value)} className="md:col-span-2" />
        <Field required label="Cơ quan quản lý xuất nhập cảnh" value={form.measure.immigrationAgencyName} onChange={(value) => updateField("measure", "immigrationAgencyName", value)} className="md:col-span-2" />
      </SectionCard>


      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-950">
          Preview trước khi xuất
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Kiểm nhanh căn cứ, Điều 1, Điều 2, nơi nhận và chữ ký trước khi render.
        </p>

        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p>
            <strong>Header:</strong> {readyForm.agency.name} — Số:{" "}
            {readyForm.document.documentCode}
          </p>
          <p>
            {readyForm.agency.issuePlace}, {bm057LegalDate(readyForm.document.issueDate)}
          </p>
          <p>
            <strong>Căn cứ quyết định tạm hoãn:</strong>{" "}
            {readyForm.measure.exitPostponementDecisionLegalBasisLine}
          </p>
          <p>
            <strong>Xét thấy:</strong>{" "}
            {readyForm.measure.exitPostponementCancelReasonLine}
          </p>
          <p>
            <strong>Điều 1:</strong>{" "}
            {readyForm.measure.exitPostponementCancellationArticle1Line}
          </p>
          <p>
            <strong>Điều 2:</strong>{" "}
            {readyForm.measure.exitPostponementCancellationArticle2Line}
          </p>
          <p>
            <strong>Nơi nhận:</strong> {readyForm.recipients.immigrationUnitLine}{" "}
            {readyForm.recipients.personLine} {readyForm.recipients.investigationUnitLine}{" "}
            {readyForm.recipients.archiveLine}
          </p>
          <p>
            <strong>Chữ ký:</strong> {readyForm.signature.signMode}{" "}
            {readyForm.signature.positionTitle} — {readyForm.signature.signerName}
          </p>
        </div>
      </section>

      <SectionCard title="4. Người được hủy bỏ tạm hoãn xuất cảnh">
        <Field required label="Họ tên" value={form.person.fullName} onChange={(value) => updateField("person", "fullName", value)} />
        <SelectField required label="Giới tính" value={form.person.genderLabel} onChange={(value) => updateField("person", "genderLabel", value)} options={GENDER_OPTIONS} />
        <Field label="Tên gọi khác" value={form.person.otherName} onChange={(value) => updateField("person", "otherName", value)} />
        <DateSelectField required label="Ngày sinh" value={form.person.dateOfBirth} onChange={(value) => updateField("person", "dateOfBirth", value)} />
        <Field required label="Nơi sinh" value={form.person.placeOfBirth} onChange={(value) => updateField("person", "placeOfBirth", value)} />
        <Field label="Quốc tịch" value={form.person.nationality} onChange={(value) => updateField("person", "nationality", value)} />
        <Field label="Dân tộc" value={form.person.ethnicity} onChange={(value) => updateField("person", "ethnicity", value)} />
        <Field label="Tôn giáo" value={form.person.religion} onChange={(value) => updateField("person", "religion", value)} />
        <Field label="Nghề nghiệp" value={form.person.occupation} onChange={(value) => updateField("person", "occupation", value)} />
        <Field label="Loại giấy tờ" value={form.person.identityType} onChange={(value) => updateField("person", "identityType", value)} />
        <Field required label="Số CMND/CCCD/Hộ chiếu" value={form.person.identityNo} onChange={(value) => updateField("person", "identityNo", value)} />
        <DateSelectField required label="Ngày cấp" value={form.person.identityIssuedDate} onChange={(value) => updateField("person", "identityIssuedDate", value)} />
        <Field required label="Nơi cấp" value={form.person.identityIssuedPlace} onChange={(value) => updateField("person", "identityIssuedPlace", value)} className="md:col-span-2" />
        <Field required multiline label="Nơi thường trú" value={form.person.permanentAddress} onChange={(value) => updateField("person", "permanentAddress", value)} className="md:col-span-2" />
        <Field multiline label="Nơi tạm trú" value={form.person.temporaryAddress} onChange={(value) => updateField("person", "temporaryAddress", value)} className="md:col-span-2" />
        <Field required multiline label="Nơi ở hiện tại" value={form.person.currentAddress} onChange={(value) => updateField("person", "currentAddress", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="5. Nơi nhận">
        <Field required label="Cơ quan xuất nhập cảnh" value={form.recipients.immigrationUnitLine} onChange={(value) => updateField("recipients", "immigrationUnitLine", value)} />
        <Field required label="Người được hủy bỏ tạm hoãn" value={form.recipients.personLine} onChange={(value) => updateField("recipients", "personLine", value)} />
        <Field label="Cơ quan điều tra" value={form.recipients.investigationUnitLine} onChange={(value) => updateField("recipients", "investigationUnitLine", value)} />
        <Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} />
      </SectionCard>

      <SectionCard title="6. Chữ ký">
        <SelectField label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <SelectField required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <Field required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
      </SectionCard>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Lưu dữ liệu BM-057
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
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-057"}
          </button>
        </div>
      </section>
    </div>
  );
}