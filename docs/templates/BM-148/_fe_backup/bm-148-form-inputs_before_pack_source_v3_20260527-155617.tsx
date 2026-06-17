"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm148FormInputs = {
  agency: TextRecord;
  official: TextRecord;
  document: TextRecord;
  helper: TextRecord;
  legalBasis: TextRecord;
  caseDecision: TextRecord;
  accusedDecision: TextRecord;
  suspension: TextRecord;
  person: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm148FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm148FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm148FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
  },
  official: {
    issuerTitle: "",
  },
  document: {
    documentCode: "",
    issueDate: "",
  },
  helper: {
    offenseName: "",
    legalClause: "",
    legalArticle: "",
    caseTitle: "",
    investigationAgencyName: "",
    caseDecisionCode: "",
    caseDecisionDate: "",
    accusedDecisionCode: "",
    accusedDecisionDate: "",
  },
  legalBasis: {
    procedureArticlesLine: "",
    juvenileJusticeLine: "",
  },
  caseDecision: {
    prosecutionDecisionLegalBasisLine: "",
  },
  accusedDecision: {
    prosecutionDecisionLegalBasisLine: "",
  },
  suspension: {
    reasonLine: "",
    article1Line: "",
    article2ActionLine: "",
    executionRequestLine: "",
  },
  person: {
    fullName: "",
    genderText: "",
    otherName: "",
    dateOfBirth: "",
    placeOfBirth: "",
    nationality: "",
    ethnicity: "",
    religion: "",
    occupation: "",
    identityNo: "",
    identityIssuedDate: "",
    identityIssuedPlace: "",
    permanentResidence: "",
    temporaryResidence: "",
    currentResidence: "",
  },
  recipients: {
    line1: "",
    line2: "",
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
  { section: "agency", field: "issuePlace", label: "Địa danh ban hành" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày quyết định" },
  { section: "official", field: "issuerTitle", label: "Dòng thẩm quyền" },
  { section: "person", field: "fullName", label: "Họ tên bị can" },
  { section: "helper", field: "offenseName", label: "Tên tội" },
  { section: "helper", field: "legalArticle", label: "Điều luật BLHS" },
  { section: "helper", field: "investigationAgencyName", label: "Cơ quan điều tra" },
  { section: "legalBasis", field: "procedureArticlesLine", label: "Căn cứ BLTTHS" },
  { section: "legalBasis", field: "juvenileJusticeLine", label: "Căn cứ Luật Tư pháp người chưa thành niên" },
  { section: "caseDecision", field: "prosecutionDecisionLegalBasisLine", label: "Căn cứ khởi tố vụ án" },
  { section: "accusedDecision", field: "prosecutionDecisionLegalBasisLine", label: "Căn cứ khởi tố bị can" },
  { section: "suspension", field: "reasonLine", label: "Lý do xét thấy" },
  { section: "suspension", field: "article1Line", label: "Nội dung Điều 1" },
  { section: "suspension", field: "article2ActionLine", label: "Nội dung Điều 2" },
  { section: "suspension", field: "executionRequestLine", label: "Nội dung Điều 3" },
  { section: "person", field: "genderText", label: "Giới tính" },
  { section: "person", field: "dateOfBirth", label: "Ngày sinh" },
  { section: "person", field: "identityNo", label: "Số CMND/CCCD/Hộ chiếu" },
  { section: "person", field: "identityIssuedDate", label: "Ngày cấp giấy tờ" },
  { section: "person", field: "identityIssuedPlace", label: "Nơi cấp giấy tờ" },
  { section: "person", field: "permanentResidence", label: "Nơi thường trú" },
  { section: "person", field: "currentResidence", label: "Nơi ở hiện tại" },
  { section: "recipients", field: "line1", label: "Nơi nhận - cơ quan điều tra" },
  { section: "recipients", field: "line2", label: "Nơi nhận - bị can" },
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
  return value === null || value === undefined ? "" : String(value);
}

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];
  return isRecord(value) ? value : {};
}

function pick(record: Record<string, unknown>, key: string): string {
  return text(record[key]);
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const current = text(value).trim();
    if (current) return current;
  }
  return "";
}

function toDateInput(value: unknown): string {
  const raw = text(value).trim();

  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function splitIsoDate(value: string): { day: string; month: string; year: string } {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return { day: "", month: "", year: "" };
  }

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
}

function toVietnameseDate(value: string): string {
  const { day, month, year } = splitIsoDate(value);

  if (!day || !month || !year) return "";

  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function makeIsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function ensureSentenceEnd(value: string, ending = "."): string {
  const clean = value.replace(/\s+([,.;:])/gu, "$1").replace(/\s{2,}/gu, " ").trim();

  if (!clean) return "";

  return clean.endsWith(ending) ? clean : `${clean}${ending}`;
}

function stripRecipientLine(value: string): string {
  return value.replace(/^-\s*/u, "").replace(/[;.]\s*$/u, "").trim();
}

function getValue(form: Bm148FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function buildCaseDecisionLine(form: Bm148FormInputs): string {
  const decisionCode = form.helper.caseDecisionCode || form.document.documentCode;
  const decisionDate = toVietnameseDate(form.helper.caseDecisionDate || form.document.issueDate);
  const agencyName =
    form.helper.investigationAgencyName ||
    stripRecipientLine(form.recipients.line1) ||
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";
  const offenseName = form.helper.offenseName || "Đánh bạc";
  const legalClause = form.helper.legalClause || "khoản 1";
  const legalArticle = form.helper.legalArticle || "Điều 321";
  const datePart = decisionDate ? ` ${decisionDate}` : "";

  return ensureSentenceEnd(
    `Căn cứ Quyết định khởi tố vụ án hình sự số ${decisionCode}${datePart} của ${agencyName} về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} Bộ luật Hình sự`,
    ";",
  );
}

function buildAccusedDecisionLine(form: Bm148FormInputs): string {
  const decisionCode = form.helper.accusedDecisionCode || form.document.documentCode;
  const decisionDate = toVietnameseDate(form.helper.accusedDecisionDate || form.document.issueDate);
  const accusedName = form.person.fullName.trim();
  const offenseName = form.helper.offenseName || "Đánh bạc";
  const legalClause = form.helper.legalClause || "khoản 1";
  const legalArticle = form.helper.legalArticle || "Điều 321";
  const datePart = decisionDate ? ` ${decisionDate}` : "";
  const namePart = accusedName ? ` đối với ${accusedName},` : "";

  return ensureSentenceEnd(
    `Căn cứ Quyết định khởi tố bị can số ${decisionCode}${datePart}${namePart} về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} Bộ luật Hình sự`,
    ";",
  );
}

function syncDerivedFields(form: Bm148FormInputs): Bm148FormInputs {
  const accusedName = form.person.fullName.trim();
  const offenseName = form.helper.offenseName || "Đánh bạc";
  const caseTitle = form.helper.caseTitle || `Vụ án ${offenseName}`;
  const investigationAgencyName =
    form.helper.investigationAgencyName ||
    stripRecipientLine(form.recipients.line1) ||
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

  return {
    ...form,
    helper: {
      ...form.helper,
      caseTitle,
      investigationAgencyName,
    },
    caseDecision: {
      ...form.caseDecision,
      prosecutionDecisionLegalBasisLine: buildCaseDecisionLine(form),
    },
    accusedDecision: {
      ...form.accusedDecision,
      prosecutionDecisionLegalBasisLine: buildAccusedDecisionLine(form),
    },
    suspension: {
      ...form.suspension,
      reasonLine: accusedName
        ? ensureSentenceEnd(
            `Xét thấy cần tạm đình chỉ vụ án hình sự đối với bị can ${accusedName}`,
            ",",
          )
        : "",
      article1Line: accusedName
        ? ensureSentenceEnd(
            `Tạm đình chỉ vụ án hình sự đối với bị can ${accusedName} trong ${caseTitle}`,
            ".",
          )
        : "",
      article2ActionLine: ensureSentenceEnd(
        form.suspension.article2ActionLine ||
          "Việc giám định/định giá tài sản/yêu cầu cơ quan, tổ chức, cá nhân cung cấp tài liệu, đồ vật/tương trợ tư pháp tiếp tục được tiến hành cho đến khi có kết quả",
        ".",
      ),
      executionRequestLine: ensureSentenceEnd(
        `Yêu cầu ${investigationAgencyName} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự`,
        "./.",
      ),
    },
    recipients: {
      ...form.recipients,
      line1: `- ${investigationAgencyName};`,
      line2: accusedName ? `- ${accusedName};` : "",
      archiveLine: form.recipients.archiveLine || "- Lưu: HSVA, HSKS, VP.",
    },
  };
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm148FormInputs {
  const agency = section(payload, "agency");
  const official = section(payload, "official");
  const document = section(payload, "document");
  const person = section(payload, "person");
  const legalBasis = section(payload, "legalBasis");
  const caseInfo = section(payload, "case");
  const caseDecision = section(payload, "caseDecision");
  const accusedDecision = section(payload, "accusedDecision");
  const suspension = section(payload, "suspension");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  const fullName = firstText(pick(person, "fullName"), pick(person, "name"));
  const investigationAgencyName = firstText(
    stripRecipientLine(pick(recipients, "line1")),
    stripRecipientLine(pick(recipients, "investigationAuthorityLine")),
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
  );

  return syncDerivedFields({
    agency: {
      parentName: pick(agency, "parentName"),
      name: pick(agency, "name"),
      issuePlace: firstText(pick(agency, "issuePlace"), "TP. Hồ Chí Minh"),
    },
    official: {
      issuerTitle: firstText(
        pick(official, "issuerTitle"),
        "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      ),
    },
    document: {
      documentCode: pick(document, "documentCode"),
      issueDate: toDateInput(document.issueDate),
    },
    helper: {
      offenseName: firstText(pick(caseInfo, "offenseName"), "Đánh bạc"),
      legalClause: firstText(pick(caseInfo, "legalClause"), "khoản 1"),
      legalArticle: firstText(pick(caseInfo, "legalArticle"), "Điều 321"),
      caseTitle: firstText(pick(caseInfo, "caseTitle"), "Vụ án đánh bạc tại phường Trung Mỹ Tây"),
      investigationAgencyName,
      caseDecisionCode: pick(caseDecision, "decisionCode"),
      caseDecisionDate: toDateInput(caseDecision.decisionDate),
      accusedDecisionCode: pick(accusedDecision, "decisionCode"),
      accusedDecisionDate: toDateInput(accusedDecision.decisionDate),
    },
    legalBasis: {
      procedureArticlesLine: firstText(
        pick(legalBasis, "procedureArticlesLine"),
        "Căn cứ các điều 41, 236, 240 và 247 của Bộ luật Tố tụng hình sự;",
      ),
      juvenileJusticeLine: firstText(
        pick(legalBasis, "juvenileJusticeLine"),
        "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;",
      ),
    },
    caseDecision: {
      prosecutionDecisionLegalBasisLine: pick(
        caseDecision,
        "prosecutionDecisionLegalBasisLine",
      ),
    },
    accusedDecision: {
      prosecutionDecisionLegalBasisLine: pick(
        accusedDecision,
        "prosecutionDecisionLegalBasisLine",
      ),
    },
    suspension: {
      reasonLine: pick(suspension, "reasonLine"),
      article1Line: pick(suspension, "article1Line"),
      article2ActionLine: pick(suspension, "article2ActionLine"),
      executionRequestLine: pick(suspension, "executionRequestLine"),
    },
    person: {
      fullName,
      genderText: firstText(pick(person, "genderText"), pick(person, "genderLabel"), "Nam"),
      otherName: firstText(pick(person, "otherName"), "Không có"),
      dateOfBirth: toDateInput(firstText(person.dateOfBirth, person.birthDate)),
      placeOfBirth: pick(person, "placeOfBirth"),
      nationality: firstText(pick(person, "nationality"), "Việt Nam"),
      ethnicity: firstText(pick(person, "ethnicity"), "Kinh"),
      religion: firstText(pick(person, "religion"), "Không"),
      occupation: pick(person, "occupation"),
      identityNo: pick(person, "identityNo"),
      identityIssuedDate: toDateInput(person.identityIssuedDate),
      identityIssuedPlace: pick(person, "identityIssuedPlace"),
      permanentResidence: firstText(
        pick(person, "permanentResidence"),
        pick(person, "permanentAddress"),
      ),
      temporaryResidence: firstText(
        pick(person, "temporaryResidence"),
        pick(person, "temporaryAddress"),
        "Không có",
      ),
      currentResidence: firstText(
        pick(person, "currentResidence"),
        pick(person, "currentAddress"),
      ),
    },
    recipients: {
      line1: pick(recipients, "line1"),
      line2: pick(recipients, "line2"),
      archiveLine: firstText(pick(recipients, "archiveLine"), "- Lưu: HSVA, HSKS, VP."),
    },
    signature: {
      signMode: firstText(pick(signature, "signMode"), "KT. VIỆN TRƯỞNG"),
      positionTitle: firstText(pick(signature, "positionTitle"), "PHÓ VIỆN TRƯỞNG"),
      signerName: firstText(pick(signature, "signerName"), "Trần Thanh Nam"),
    },
  });
}

async function getBm148RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không tải được payload BM-148. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm148FormInputs(
  documentId: string | number,
  form: Bm148FormInputs,
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
        updatedByName: "Trần Thanh Nam",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không lưu được dữ liệu BM-148. HTTP ${response.status}`);
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
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
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
  const years = Array.from({ length: 110 }, (_, index) => String(currentYear - index));

  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={day}
          onChange={(event) => update(event.target.value, month, year)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Ngày</option>
          {Array.from({ length: 31 }, (_, index) => {
            const valueItem = String(index + 1).padStart(2, "0");
            return (
              <option key={valueItem} value={valueItem}>
                {index + 1}
              </option>
            );
          })}
        </select>

        <select
          value={month}
          onChange={(event) => update(day, event.target.value, year)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Tháng</option>
          {Array.from({ length: 12 }, (_, index) => {
            const valueItem = String(index + 1).padStart(2, "0");
            return (
              <option key={valueItem} value={valueItem}>
                {index + 1}
              </option>
            );
          })}
        </select>

        <select
          value={year}
          onChange={(event) => update(day, month, event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Năm</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
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

export function Bm148FormInputsPanel({
  documentId,
  onSaved,
}: Bm148FormInputsPanelProps) {
  const [form, setForm] = useState<Bm148FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      return !getValue(form, item.section, item.field).trim();
    });
  }, [form]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getBm148RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-148.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => {
      const next: Bm148FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };

      const shouldAutoSync =
        (sectionKey === "person" && field === "fullName") ||
        (sectionKey === "helper" &&
          (field === "offenseName" ||
            field === "legalClause" ||
            field === "legalArticle" ||
            field === "caseTitle" ||
            field === "investigationAgencyName" ||
            field === "caseDecisionCode" ||
            field === "caseDecisionDate" ||
            field === "accusedDecisionCode" ||
            field === "accusedDecisionDate")) ||
        (sectionKey === "document" &&
          (field === "documentCode" || field === "issueDate"));

      if (shouldAutoSync) {
        return syncDerivedFields(next);
      }

      return next;
    });
  }

  function syncAllDerivedFields() {
    setForm((current) => syncDerivedFields(current));
  }

  function fillCustomerSample() {
    const sample = syncDerivedFields({
      agency: {
        parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
        name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        issuePlace: "TP. Hồ Chí Minh",
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      document: {
        documentCode: "17/QĐ-VKSKV7",
        issueDate: "2026-05-27",
      },
      helper: {
        offenseName: "Đánh bạc",
        legalClause: "khoản 1",
        legalArticle: "Điều 321",
        caseTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
        investigationAgencyName:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        caseDecisionCode: "VKS-2026-0001",
        caseDecisionDate: "2026-05-06",
        accusedDecisionCode: "VKS-2026-0001",
        accusedDecisionDate: "2026-05-06",
      },
      legalBasis: {
        procedureArticlesLine:
          "Căn cứ các điều 41, 236, 240 và 247 của Bộ luật Tố tụng hình sự;",
        juvenileJusticeLine:
          "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;",
      },
      caseDecision: {
        prosecutionDecisionLegalBasisLine: "",
      },
      accusedDecision: {
        prosecutionDecisionLegalBasisLine: "",
      },
      suspension: {
        reasonLine: "",
        article1Line: "",
        article2ActionLine:
          "Việc giám định/định giá tài sản/yêu cầu cơ quan, tổ chức, cá nhân cung cấp tài liệu, đồ vật/tương trợ tư pháp tiếp tục được tiến hành cho đến khi có kết quả.",
        executionRequestLine: "",
      },
      person: {
        fullName: "Đoàn Văn Dũng",
        genderText: "Nam",
        otherName: "Không có",
        dateOfBirth: "1985-09-08",
        placeOfBirth: "tỉnh Quảng Ngãi",
        nationality: "Việt Nam",
        ethnicity: "Kinh",
        religion: "Không",
        occupation: "Kinh doanh",
        identityNo: "051080000314",
        identityIssuedDate: "2021-12-22",
        identityIssuedPlace:
          "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
        permanentResidence:
          "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
        temporaryResidence: "Không có",
        currentResidence:
          "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
      },
      recipients: {
        line1: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        line2: "- Đoàn Văn Dũng;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "Trần Thanh Nam",
      },
    });

    setForm(sample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await saveBm148FormInputs(documentId, form);

      setInitialSnapshot(JSON.stringify(form));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-148.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-148...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-148
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định tạm đình chỉ vụ án đối với bị can
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Nhập tên bị can, tên tội, ngày tháng và cơ quan điều tra một lần. Các dòng căn cứ, Điều 1, Điều 3 và nơi nhận sẽ tự đồng bộ. Nếu khách sửa thủ công ô nào thì ô đó vẫn được lưu y nguyên khi bấm Lưu.
              Ngày tháng dùng thứ tự Việt Nam: ngày → tháng → năm.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm md:items-end">
            {isDirty ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
                Đã đồng bộ
              </span>
            )}

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
            Các trường quan trọng của BM-148 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-148
          </button>

          <button
            type="button"
            onClick={syncAllDerivedFields}
            className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            Đồng bộ dòng lặp
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

      <SectionCard title="1. Cơ quan / quyết định">
        <Field required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} />
        <Field required label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} />
        <Field required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
        <Field required label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <DateSelectField required label="Ngày quyết định" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <Field required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard
        title="2. Dữ liệu đồng bộ"
        description="Tên bị can, tên tội, ngày tháng và cơ quan điều tra là dữ liệu nguồn. Sửa ở đây thì các dòng căn cứ, Điều 1, Điều 3 và nơi nhận tự cập nhật."
      >
        <Field required label="Họ tên bị can" value={form.person.fullName} onChange={(value) => updateField("person", "fullName", value)} />
        <Field required label="Tên tội" value={form.helper.offenseName} onChange={(value) => updateField("helper", "offenseName", value)} />
        <Field label="Khoản" value={form.helper.legalClause} onChange={(value) => updateField("helper", "legalClause", value)} />
        <Field required label="Điều luật BLHS" value={form.helper.legalArticle} onChange={(value) => updateField("helper", "legalArticle", value)} />
        <Field label="Tên vụ án" value={form.helper.caseTitle} onChange={(value) => updateField("helper", "caseTitle", value)} className="md:col-span-2" />
        <Field required label="Cơ quan điều tra" value={form.helper.investigationAgencyName} onChange={(value) => updateField("helper", "investigationAgencyName", value)} className="md:col-span-2" />
        <Field label="Số QĐ khởi tố vụ án" value={form.helper.caseDecisionCode} onChange={(value) => updateField("helper", "caseDecisionCode", value)} />
        <DateSelectField label="Ngày QĐ khởi tố vụ án" value={form.helper.caseDecisionDate} onChange={(value) => updateField("helper", "caseDecisionDate", value)} />
        <Field label="Số QĐ khởi tố bị can" value={form.helper.accusedDecisionCode} onChange={(value) => updateField("helper", "accusedDecisionCode", value)} />
        <DateSelectField label="Ngày QĐ khởi tố bị can" value={form.helper.accusedDecisionDate} onChange={(value) => updateField("helper", "accusedDecisionDate", value)} />
      </SectionCard>

      <SectionCard title="3. Căn cứ tố tụng">
        <Field required multiline label="Căn cứ BLTTHS" value={form.legalBasis.procedureArticlesLine} onChange={(value) => updateField("legalBasis", "procedureArticlesLine", value)} className="md:col-span-2" />
        <Field required multiline label="Căn cứ Luật Tư pháp người chưa thành niên" value={form.legalBasis.juvenileJusticeLine} onChange={(value) => updateField("legalBasis", "juvenileJusticeLine", value)} className="md:col-span-2" />
        <Field required multiline label="Căn cứ khởi tố vụ án" value={form.caseDecision.prosecutionDecisionLegalBasisLine} onChange={(value) => updateField("caseDecision", "prosecutionDecisionLegalBasisLine", value)} className="md:col-span-2" />
        <Field required multiline label="Căn cứ khởi tố bị can" value={form.accusedDecision.prosecutionDecisionLegalBasisLine} onChange={(value) => updateField("accusedDecision", "prosecutionDecisionLegalBasisLine", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="4. Nội dung tạm đình chỉ">
        <Field required multiline label="Lý do xét thấy" value={form.suspension.reasonLine} onChange={(value) => updateField("suspension", "reasonLine", value)} className="md:col-span-2" />
        <Field required multiline label="Điều 1" value={form.suspension.article1Line} onChange={(value) => updateField("suspension", "article1Line", value)} className="md:col-span-2" />
        <Field required multiline label="Điều 2" value={form.suspension.article2ActionLine} onChange={(value) => updateField("suspension", "article2ActionLine", value)} className="md:col-span-2" />
        <Field required multiline label="Điều 3" value={form.suspension.executionRequestLine} onChange={(value) => updateField("suspension", "executionRequestLine", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="5. Lý lịch bị can">
        <SelectField required label="Giới tính" value={form.person.genderText} onChange={(value) => updateField("person", "genderText", value)} options={GENDER_OPTIONS} />
        <Field label="Tên gọi khác" value={form.person.otherName} onChange={(value) => updateField("person", "otherName", value)} />
        <DateSelectField required label="Ngày sinh" value={form.person.dateOfBirth} onChange={(value) => updateField("person", "dateOfBirth", value)} />
        <Field label="Nơi sinh" value={form.person.placeOfBirth} onChange={(value) => updateField("person", "placeOfBirth", value)} />
        <Field label="Quốc tịch" value={form.person.nationality} onChange={(value) => updateField("person", "nationality", value)} />
        <Field label="Dân tộc" value={form.person.ethnicity} onChange={(value) => updateField("person", "ethnicity", value)} />
        <Field label="Tôn giáo" value={form.person.religion} onChange={(value) => updateField("person", "religion", value)} />
        <Field label="Nghề nghiệp" value={form.person.occupation} onChange={(value) => updateField("person", "occupation", value)} />
        <Field required label="Số CMND/CCCD/Hộ chiếu" value={form.person.identityNo} onChange={(value) => updateField("person", "identityNo", value)} />
        <DateSelectField required label="Ngày cấp" value={form.person.identityIssuedDate} onChange={(value) => updateField("person", "identityIssuedDate", value)} />
        <Field required label="Nơi cấp" value={form.person.identityIssuedPlace} onChange={(value) => updateField("person", "identityIssuedPlace", value)} className="md:col-span-2" />
        <Field required multiline label="Nơi thường trú" value={form.person.permanentResidence} onChange={(value) => updateField("person", "permanentResidence", value)} className="md:col-span-2" />
        <Field multiline label="Nơi tạm trú" value={form.person.temporaryResidence} onChange={(value) => updateField("person", "temporaryResidence", value)} className="md:col-span-2" />
        <Field required multiline label="Nơi ở hiện tại" value={form.person.currentResidence} onChange={(value) => updateField("person", "currentResidence", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="6. Nơi nhận">
        <Field required label="Nơi nhận dòng 1" value={form.recipients.line1} onChange={(value) => updateField("recipients", "line1", value)} />
        <Field required label="Nơi nhận dòng 2" value={form.recipients.line2} onChange={(value) => updateField("recipients", "line2", value)} />
        <Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="7. Chữ ký">
        <SelectField label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <SelectField required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <Field required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
      </SectionCard>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Lưu dữ liệu BM-148
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Sau khi lưu, render lại DOCX/PDF để kiểm tra dữ liệu khách nhập đã thay thế dữ liệu mặc định.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-148"}
          </button>
        </div>
      </section>
    </div>
  );
}


