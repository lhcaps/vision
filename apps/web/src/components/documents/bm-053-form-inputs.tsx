"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type Bm053FormInputs,
  EMPTY_BM053_FORM_INPUTS,
  getBm053RenderPayload,
  normalizeBm053FormInputs,
  saveBm053FormInputs,
} from "@/lib/bm053-form-inputs-api";

import {
  BM053_AGENCY_OPTIONS,
  BM053_GENDER_OPTIONS,
  BM053_IDENTITY_TYPE_OPTIONS,
  BM053_OFFENSE_OPTIONS,
  BM053_POSITION_OPTIONS,
  BM053_RESIDENCE_OPTIONS,
  BM053_SIGNER_OPTIONS,
  BM053_SIGN_MODE_OPTIONS,
  type Bm053ResidenceOption,
} from "@/lib/bm053-options";

type Bm053FormInputsProps = {
  documentId: string | number;
  onSaved?: () => void;
};

type SectionKey = keyof Bm053FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Cơ quan ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh ban hành" },
  { section: "document", field: "documentCode", label: "Số/ký hiệu lệnh" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  { section: "caseDecision", field: "decisionNo", label: "Số QĐ khởi tố vụ án" },
  { section: "caseDecision", field: "issueDate", label: "Ngày QĐ khởi tố vụ án" },
  { section: "caseDecision", field: "issuedBy", label: "Cơ quan ra QĐ khởi tố vụ án" },
  { section: "accusedDecision", field: "decisionNo", label: "Số QĐ khởi tố bị can" },
  { section: "accusedDecision", field: "issueDate", label: "Ngày QĐ khởi tố bị can" },
  { section: "accusedDecision", field: "issuedBy", label: "Cơ quan ra QĐ khởi tố bị can" },
  { section: "offense", field: "offenseName", label: "Tội danh" },
  { section: "offense", field: "legalArticle", label: "Điều khoản" },
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
  { section: "person", field: "residenceAddress", label: "Nơi cư trú áp dụng biện pháp" },
  { section: "measure", field: "durationText", label: "Thời hạn" },
  { section: "measure", field: "fromDate", label: "Từ ngày" },
  { section: "measure", field: "toDate", label: "Đến ngày" },
  { section: "measure", field: "residencePlace", label: "Nơi cư trú trong Điều 2" },
  { section: "monitoring", field: "unitName", label: "Đơn vị giám sát" },
  { section: "monitoring", field: "phone", label: "Số điện thoại liên hệ" },
  { section: "signature", field: "signMode", label: "Hình thức ký" },
  { section: "signature", field: "positionTitle", label: "Chức vụ ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

function getFieldValue(
  form: Bm053FormInputs,
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

function getBm053TodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseBm053DateParts(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = String(value ?? "").trim();

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (isoMatch) {
    return {
      day: isoMatch[3],
      month: isoMatch[2],
      year: isoMatch[1],
    };
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (slashMatch) {
    return {
      day: slashMatch[2].padStart(2, "0"),
      month: slashMatch[1].padStart(2, "0"),
      year: slashMatch[3],
    };
  }

  return { day: "", month: "", year: "" };
}

function buildBm053IsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (!Number.isFinite(dayNumber) || !Number.isFinite(monthNumber) || !Number.isFinite(yearNumber)) return "";
  if (yearNumber < 1900 || yearNumber > 2100) return "";
  if (monthNumber < 1 || monthNumber > 12) return "";

  const maxDay = new Date(yearNumber, monthNumber, 0).getDate();
  if (dayNumber < 1 || dayNumber > maxDay) return "";

  return `${yearNumber}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
}

function bm053DateLine(value: string): string {
  const parsed = parseBm053DateParts(value);

  if (!parsed.day || !parsed.month || !parsed.year) {
    return "";
  }

  return `${Number(parsed.day)} tháng ${Number(parsed.month)} năm ${parsed.year}`;
}

function bm053IssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const place = String(issuePlace ?? "").trim() || "TP. Hồ Chí Minh";
  const dateLine = bm053DateLine(issueDate);

  return dateLine ? `${place}, ngày ${dateLine}` : `${place}, ngày … tháng … năm …`;
}

function Bm053DateSelectField({
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear() + 10,
}: {
  value: string;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
}) {
  const [parts, setParts] = useState(() => parseBm053DateParts(value));

  useEffect(() => {
    setParts(parseBm053DateParts(value));
  }, [value]);

  const dayOptions = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const monthOptions = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const safeMinYear = Math.min(minYear, maxYear);
  const safeMaxYear = Math.max(minYear, maxYear);
  const yearOptions = Array.from(
    { length: safeMaxYear - safeMinYear + 1 },
    (_, index) => String(safeMinYear + index),
  );

  const updatePart = (
    patch: Partial<{
      day: string;
      month: string;
      year: string;
    }>,
  ) => {
    setParts((current) => {
      const next = {
        ...current,
        ...patch,
      };

      if (next.day && next.month && next.year) {
        const nextIso = buildBm053IsoDate(next.day, next.month, next.year);
        if (nextIso) {
          onChange(nextIso);
        }
      }

      return next;
    });
  };

  const selectClass =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <select value={parts.day} onChange={(event) => updatePart({ day: event.target.value })} className={selectClass}>
        <option value="">Ngày</option>
        {dayOptions.map((day) => (
          <option key={day} value={day}>
            {Number(day)}
          </option>
        ))}
      </select>

      <select value={parts.month} onChange={(event) => updatePart({ month: event.target.value })} className={selectClass}>
        <option value="">Tháng</option>
        {monthOptions.map((month) => (
          <option key={month} value={month}>
            {Number(month)}
          </option>
        ))}
      </select>

      <select value={parts.year} onChange={(event) => updatePart({ year: event.target.value })} className={selectClass}>
        <option value="">Năm</option>
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

const BM053_DEFAULT_LEGAL_BASIS = {
  line1: "Căn cứ các điều 41, 123, 165 và 168 của Bộ luật Tố tụng hình sự;",
  line2: "Căn cứ Điều 135 của Luật Tư pháp người chưa thành niên;",
  line3: "Căn cứ Quyết định khởi tố vụ án hình sự số … ngày … tháng … năm … của … về tội … quy định tại khoản … Điều … của Bộ luật Hình sự;",
  line4: "Căn cứ Quyết định khởi tố bị can số … ngày … tháng … năm … của … đối với … về tội … quy định tại khoản … Điều … của Bộ luật Hình sự;",
  line5: "Xét thấy có đủ căn cứ, điều kiện áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can …,",
};

type Bm053LegalBasisForm = typeof BM053_DEFAULT_LEGAL_BASIS;

function generateBm053LegalBasis(form: Bm053FormInputs): Bm053LegalBasisForm {
  const personName = form.person.fullName.trim() || "…";
  const offenseName = form.offense.offenseName.trim() || "…";
  const legalArticle = form.offense.legalArticle.trim() || "…";
  const criminalCodeText = form.offense.criminalCodeText.trim() || "Bộ luật Hình sự";
  const caseDecisionNo = form.caseDecision.decisionNo.trim() || "…";
  const caseDecisionDate = bm053DateLine(form.caseDecision.issueDate) || "… tháng … năm …";
  const caseDecisionIssuedBy = form.caseDecision.issuedBy.trim() || "…";
  const accusedDecisionNo = form.accusedDecision.decisionNo.trim() || "…";
  const accusedDecisionDate = bm053DateLine(form.accusedDecision.issueDate) || "… tháng … năm …";
  const accusedDecisionIssuedBy = form.accusedDecision.issuedBy.trim() || "…";

  return {
    line1: BM053_DEFAULT_LEGAL_BASIS.line1,
    line2: BM053_DEFAULT_LEGAL_BASIS.line2,
    line3:
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionNo}` +
      ` ngày ${caseDecisionDate}` +
      ` của ${caseDecisionIssuedBy}` +
      ` về tội ${offenseName} quy định tại ${legalArticle} của ${criminalCodeText};`,
    line4:
      `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionNo}` +
      ` ngày ${accusedDecisionDate}` +
      ` của ${accusedDecisionIssuedBy}` +
      ` đối với ${personName}` +
      ` về tội ${offenseName} quy định tại ${legalArticle} của ${criminalCodeText};`,
    line5:
      `Xét thấy có đủ căn cứ, điều kiện áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can ${personName},`,
  };
}

function getBm053LegalBasis(form: Bm053FormInputs): Bm053LegalBasisForm {
  const anyForm = form as any;
  const generated = generateBm053LegalBasis(form);
  const source = anyForm.legalBasis ?? {};

  return {
    line1: String(source.line1 ?? generated.line1),
    line2: String(source.line2 ?? generated.line2),
    line3: String(source.line3 ?? generated.line3),
    line4: String(source.line4 ?? generated.line4),
    line5: String(source.line5 ?? generated.line5),
  };
}

function buildBm053ReadyForm(form: Bm053FormInputs): Bm053FormInputs {
  const anyForm = form as any;
  const legalBasis = getBm053LegalBasis(form);

  const birthDateLine = bm053DateLine(form.person.dateOfBirth);
  const identityIssueDateLine = bm053DateLine(form.person.identityIssuedDate);
  const fromDateLine = bm053DateLine(form.measure.fromDate);
  const toDateLine = bm053DateLine(form.measure.toDate);

  const identityDocumentLine = [
    `${form.person.identityType.trim() || "Giấy tờ"} số ${form.person.identityNo.trim() || "…"}`,
    identityIssueDateLine ? `cấp ngày ${identityIssueDateLine}` : "",
    form.person.identityIssuedPlace.trim() ? `Nơi cấp: ${form.person.identityIssuedPlace.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const article2Line =
    `Bị can không được phép đi khỏi nơi cư trú tại ${form.measure.residencePlace.trim() || form.person.residenceAddress.trim() || "…"}` +
    ` trong thời hạn ${form.measure.durationText.trim() || "…"}` +
    ` kể từ ngày ${fromDateLine || "… tháng … năm …"}` +
    ` đến ngày ${toDateLine || "… tháng … năm …"}.`;

  const article3Line =
    `Khi chưa được sự đồng ý của ${form.monitoring.unitName.trim() || "…"}` +
    ` và giấy phép của Viện kiểm sát đã ra Lệnh này thì bị can không được đi khỏi nơi cư trú quy định tại Điều 2 Lệnh này.` +
    ` Nếu bị can vi phạm nghĩa vụ cam đoan, yêu cầu ${form.monitoring.unitName.trim() || "…"}` +
    ` phải báo ngay cho Viện kiểm sát biết để xử lý theo thẩm quyền, điện thoại liên hệ số ${form.monitoring.phone.trim() || "…"}` +
    `, gặp Kiểm sát viên ${form.monitoring.prosecutorName.trim() || "thụ lý vụ án"} để giải quyết.`;

  return {
    ...anyForm,
    legalBasis,
    document: {
      ...anyForm.document,
      issuePlaceAndDateLine: bm053IssuePlaceAndDateLine(form.agency.issuePlace, form.document.issueDate),
    },
    caseDecision: {
      ...anyForm.caseDecision,
      legalBasisLine: legalBasis.line3,
    },
    accusedDecision: {
      ...anyForm.accusedDecision,
      legalBasisLine: legalBasis.line4,
    },
    person: {
      ...anyForm.person,
      dateOfBirthText:
        birthDateLine ||
        (form.person.birthYear.trim() ? `năm ${form.person.birthYear.trim()}` : ""),
      placeOfBirth: form.person.placeOfBirth.trim(),
      identityDocumentLine,
    },
    measure: {
      ...anyForm.measure,
      article2Line,
      sufficientGroundsLine: legalBasis.line5,
    },
    monitoring: {
      ...anyForm.monitoring,
      article3Line,
    },
  } as Bm053FormInputs;
}

function extractBm053LegalBasisFromPayload(payload: unknown): Partial<Bm053LegalBasisForm> | null {
  const anyPayload = payload as any;

  const candidates = [
    anyPayload?.formInputs?.legalBasis,
    anyPayload?.renderPayloadSnapshot?.formInputs?.legalBasis,
    anyPayload?.render_payload_snapshot?.formInputs?.legalBasis,
    anyPayload?.legalBasis,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      return {
        line1: typeof candidate.line1 === "string" ? candidate.line1 : undefined,
        line2: typeof candidate.line2 === "string" ? candidate.line2 : undefined,
        line3: typeof candidate.line3 === "string" ? candidate.line3 : undefined,
        line4: typeof candidate.line4 === "string" ? candidate.line4 : undefined,
        line5: typeof candidate.line5 === "string" ? candidate.line5 : undefined,
      };
    }
  }

  return null;
}

function mergeBm053LegalBasisFromPayload(
  form: Bm053FormInputs,
  payload: unknown,
): Bm053FormInputs {
  const savedLegalBasis = extractBm053LegalBasisFromPayload(payload);

  if (!savedLegalBasis) {
    return form;
  }

  const generated = generateBm053LegalBasis(form);

  return {
    ...(form as any),
    legalBasis: {
      line1: savedLegalBasis.line1 ?? generated.line1,
      line2: savedLegalBasis.line2 ?? generated.line2,
      line3: savedLegalBasis.line3 ?? generated.line3,
      line4: savedLegalBasis.line4 ?? generated.line4,
      line5: savedLegalBasis.line5 ?? generated.line5,
    },
  } as Bm053FormInputs;
}
function buildBm053ReadyFormWithManualLegalBasis(
  form: Bm053FormInputs,
  legalBasis: Bm053LegalBasisForm,
): Bm053FormInputs {
  const anyForm = form as any;

  const baseForm = buildBm053ReadyForm({
    ...anyForm,
    legalBasis,
  } as Bm053FormInputs) as any;

  return {
    ...baseForm,
    legalBasis,
    caseDecision: {
      ...baseForm.caseDecision,
      legalBasisLine: legalBasis.line3,
    },
    accusedDecision: {
      ...baseForm.accusedDecision,
      legalBasisLine: legalBasis.line4,
    },
    measure: {
      ...baseForm.measure,
      sufficientGroundsLine: legalBasis.line5,
    },
  } as Bm053FormInputs;
}
function withBm053Defaults(form: Bm053FormInputs): Bm053FormInputs {
  const anyForm = form as any;
  const generated = generateBm053LegalBasis(form);
  const source = anyForm.legalBasis ?? {};

  return buildBm053ReadyForm({
    ...anyForm,
    document: {
      ...anyForm.document,
      issueDate: anyForm.document?.issueDate || getBm053TodayIso(),
    },
    legalBasis: {
      line1: String(source.line1 ?? generated.line1),
      line2: String(source.line2 ?? generated.line2),
      line3: String(source.line3 ?? generated.line3),
      line4: String(source.line4 ?? generated.line4),
      line5: String(source.line5 ?? generated.line5),
    },
  } as Bm053FormInputs);
}

function PreviewCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
      <p className="mb-2 font-semibold text-slate-950">{title}</p>
      <div className="space-y-1">{children}</div>
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

export function Bm053FormInputsPanel({
  documentId,
  onSaved,
}: Bm053FormInputsProps) {
  const [form, setForm] = useState<Bm053FormInputs>(EMPTY_BM053_FORM_INPUTS);
  const [legalBasisDraft, setLegalBasisDraft] = useState<Bm053LegalBasisForm>(BM053_DEFAULT_LEGAL_BASIS);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const readyForm = useMemo(() => buildBm053ReadyFormWithManualLegalBasis(form, legalBasisDraft), [form, legalBasisDraft]);
  const legalBasisForm = legalBasisDraft;
  const currentSnapshot = useMemo(() => JSON.stringify(readyForm), [readyForm]);
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
      const payload = await getBm053RenderPayload(documentId);
      const normalizedForm = normalizeBm053FormInputs(payload);
      const mergedForm = mergeBm053LegalBasisFromPayload(normalizedForm, payload);
      const nextForm = withBm053Defaults(mergedForm);

      setForm(nextForm);
      setLegalBasisDraft(getBm053LegalBasis(nextForm));
      setInitialSnapshot(JSON.stringify(buildBm053ReadyFormWithManualLegalBasis(nextForm, getBm053LegalBasis(nextForm))));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-053.",
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
      const currentGenerated = generateBm053LegalBasis(current);
      const currentLegalBasis = getBm053LegalBasis(current);

      const next: Bm053FormInputs = {
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

      const nextGenerated = generateBm053LegalBasis(next);
      const nextLegalBasis = {
        ...currentLegalBasis,
      };

      if (!currentLegalBasis.line3.trim() || currentLegalBasis.line3 === currentGenerated.line3) {
        nextLegalBasis.line3 = nextGenerated.line3;
      }

      if (!currentLegalBasis.line4.trim() || currentLegalBasis.line4 === currentGenerated.line4) {
        nextLegalBasis.line4 = nextGenerated.line4;
      }

      if (!currentLegalBasis.line5.trim() || currentLegalBasis.line5 === currentGenerated.line5) {
        nextLegalBasis.line5 = nextGenerated.line5;
      }

      return {
        ...(next as any),
        legalBasis: nextLegalBasis,
      } as Bm053FormInputs;
    });
  }

  function updateLegalBasisLine(field: keyof Bm053LegalBasisForm, value: string) {
    setLegalBasisDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }
  function handleSelectOffense(optionId: string) {
  const option = BM053_OFFENSE_OPTIONS.find((item) => item.id === optionId);

  if (!option) {
    return;
  }

  setForm((current) => ({
    ...current,
    offense: {
      ...current.offense,
      offenseName: option.offenseName,
      legalArticle: option.legalArticle,
      criminalCodeText: option.criminalCodeText,
    },
  }));
}

function handleSelectAgency(optionId: string) {
  const option = BM053_AGENCY_OPTIONS.find((item) => item.id === optionId);

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
      monitoringUnitName:
        option.monitoringUnitName || current.agency.monitoringUnitName,
    },
    monitoring: {
      ...current.monitoring,
      phone: option.phone || current.monitoring.phone,
      unitName:
        option.monitoringUnitName || current.monitoring.unitName,
    },
  }));
}

function handleSelectResidence(optionId: string) {
  // Cast to any: legacy code expects nhiều fields mà type Bm053ResidenceOption
  // không cover (residenceAddress, measureResidencePlace, ...).
  // TODO: thay bằng hook lấy từ API trong giai đoạn sau.
  const option = BM053_RESIDENCE_OPTIONS.find((item) => item.id === optionId) as
    | (Bm053ResidenceOption & {
        residenceAddress?: string;
        measureResidencePlace?: string;
        monitoringUnitName?: string;
        monitoringRecipientLine?: string;
      })
    | undefined;

  if (!option) {
    return;
  }

  if (!option) {
    return;
  }

  setForm((current) => ({
    ...current,
    person: {
      ...current.person,
      residenceAddress: option.residenceAddress,
    },
    measure: {
      ...current.measure,
      residencePlace: option.measureResidencePlace,
    },
    monitoring: {
      ...current.monitoring,
      unitName: option.monitoringUnitName,
    },
    recipients: {
      ...current.recipients,
      monitoringUnitLine: option.monitoringRecipientLine,
    },
  }));
}

function handleSelectSigner(optionId: string) {
  const option = BM053_SIGNER_OPTIONS.find((item) => item.id === optionId);

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
    monitoring: {
      ...current.monitoring,
      prosecutorName: (option.prosecutorName as string) ?? "",
    },
  }));
}

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const finalForm = buildBm053ReadyFormWithManualLegalBasis(form, legalBasisDraft);

      await saveBm053FormInputs(documentId, finalForm);

      setForm(finalForm);
      setLegalBasisDraft(getBm053LegalBasis(finalForm));
      setInitialSnapshot(JSON.stringify(finalForm));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-053.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function fillCustomerSample() {
    const sample: Bm053FormInputs = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
        monitoringUnitName:
          "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
      },
      official: {
        fullName: "",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        prosecutorName: "Nguyễn Thị Hồng Hạnh",
      },
      document: {
        documentNo: "",
        documentCode: "12/LCCT-VKSKV7",
        issueDate: getBm053TodayIso(),
      },
      caseDecision: {
        decisionNo: "G505/QĐ-VPCQCSĐT",
        issueDate: "2025-10-15",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      accusedDecision: {
        decisionNo: "",
        issueDate: "2025-10-15",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      offense: {
        offenseName: "",
        legalArticle: "khoản 1 Điều 321",
        criminalCodeText:
          "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      },
      person: {
        fullName: "",
        genderLabel: "Nam",
        otherName: "Không có",
        dateOfBirth: "1990-12-08",
        birthYear: "1990",
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
        durationText: "10 ngày",
        fromDate: "2026-03-05",
        toDate: "2026-03-14",
        residencePlace: "xã Đông Thạnh, Thành phố Hồ Chí Minh",
      },
      monitoring: {
        unitName: "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
        phone: "",
        prosecutorName: "Nguyễn Thị Hồng Hạnh",
      },
      recipients: {
        monitoringUnitLine: "- UBND xã Đông Thạnh, Thành phố Hồ Chí Minh;",
        personLine: "- ;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
        noteLine: "T. Huyền.05b",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
      delivery: {
        deliveredAtText:
          "Lệnh này đã được giao cho người bị cấm đi khỏi nơi cư trú một bản vào hồi …..giờ……phút, ngày…….tháng…….năm 2026",
        receiverTitle: "NGƯỜI BỊ CẤM ĐI KHỎI NƠI CƯ TRÚ",
      },
    };

    const sampleForm = withBm053Defaults(sample);
    setForm(sampleForm);
    setLegalBasisDraft(getBm053LegalBasis(sampleForm));
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-053...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-053
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Lệnh cấm đi khỏi nơi cư trú
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này nhập đầy đủ dữ liệu nghiệp vụ cho BM-053: thông tin bị
              can, tội danh, quyết định tố tụng, biện pháp, nơi nhận và chữ ký.
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
            Các trường quan trọng của BM-053 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu 
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
      </div>

      <SelectField
        label="Chọn nhanh cơ quan"
        value=""
        onChange={handleSelectAgency}
        options={BM053_AGENCY_OPTIONS.map((item) => ({
          value: item.id,
          label: item.label,
        }))}
        className="md:col-span-2"
      />

      <SectionCard title="1. Cơ quan ban hành">
        <Field required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} />
        <Field required label="Cơ quan ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} />
        <Field label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateField("agency", "shortName", value)} />
        <Field required label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} />
        <Field label="Số điện thoại" value={form.agency.phone} onChange={(value) => updateField("agency", "phone", value)} />
        <Field required label="Đơn vị giám sát" value={form.agency.monitoringUnitName} onChange={(value) => updateField("agency", "monitoringUnitName", value)} />
      </SectionCard>

      <SectionCard title="2. Thông tin văn bản">
        <Field label="Số lệnh" value={form.document.documentNo} onChange={(value) => updateField("document", "documentNo", value)} />
        <Field required label="Số/ký hiệu lệnh" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Ngày ban hành<span className="ml-1 text-red-600">*</span></span>
          <Bm053DateSelectField value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} minYear={1900} maxYear={new Date().getFullYear() + 10} />
        </label>
      </SectionCard>

      <SectionCard
        title="3. Căn cứ pháp lý"
        description="Mỗi dòng là một MVP riêng. Khách nhập sao thì hệ thống lưu và in đúng như vậy. Nếu cần tự sinh lại từ số quyết định/ngày/tội danh, mở phần nguồn dữ liệu đồng bộ bên dưới."
      >
        <Field multiline className="md:col-span-2" label="Dòng căn cứ 1" value={legalBasisDraft.line1} onChange={(value) => updateLegalBasisLine("line1", value)} />
        <Field multiline className="md:col-span-2" label="Dòng căn cứ 2" value={legalBasisDraft.line2} onChange={(value) => updateLegalBasisLine("line2", value)} />
        <Field multiline className="md:col-span-2" label="Dòng căn cứ 3 - Quyết định khởi tố vụ án" value={legalBasisDraft.line3} onChange={(value) => updateLegalBasisLine("line3", value)} />
        <Field multiline className="md:col-span-2" label="Dòng căn cứ 4 - Quyết định khởi tố bị can" value={legalBasisDraft.line4} onChange={(value) => updateLegalBasisLine("line4", value)} />
        <Field multiline className="md:col-span-2" label="Dòng xét thấy" value={legalBasisDraft.line5} onChange={(value) => updateLegalBasisLine("line5", value)} />

        <div className="md:col-span-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLegalBasisDraft(generateBm053LegalBasis(form))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Đồng bộ căn cứ từ dữ liệu bên dưới
          </button>
        </div>

        <PreviewCard title="Preview căn cứ sẽ in">
          <p>{legalBasisDraft.line1}</p>
          <p>{legalBasisDraft.line2}</p>
          <p>{legalBasisDraft.line3}</p>
          <p>{legalBasisDraft.line4}</p>
          <p>{legalBasisDraft.line5}</p>
        </PreviewCard>
      </SectionCard>
      <details className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
        <summary className="cursor-pointer select-none text-sm font-bold uppercase tracking-[0.16em] text-slate-600">
          Nguồn dữ liệu đồng bộ căn cứ — tùy chọn
        </summary>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Phần này không phải nội dung in trực tiếp. Nó chỉ dùng để tự sinh lại dòng căn cứ 3, dòng căn cứ 4 và dòng xét thấy khi bấm “Đồng bộ căn cứ từ dữ liệu bên dưới”.
        </p>
        <div className="mt-4 space-y-5">
      <SectionCard title="Nguồn dòng căn cứ 3 - Quyết định khởi tố vụ án">

        <Field required label="Số quyết định" value={form.caseDecision.decisionNo} onChange={(value) => updateField("caseDecision", "decisionNo", value)} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Ngày quyết định<span className="ml-1 text-red-600">*</span></span>
          <Bm053DateSelectField value={form.caseDecision.issueDate} onChange={(value) => updateField("caseDecision", "issueDate", value)} minYear={1900} maxYear={new Date().getFullYear() + 10} />
        </label>
        <Field required multiline className="md:col-span-2" label="Cơ quan ban hành" value={form.caseDecision.issuedBy} onChange={(value) => updateField("caseDecision", "issuedBy", value)} />
      </SectionCard>

      <SectionCard title="Nguồn dòng căn cứ 4 - Quyết định khởi tố bị can">
        <Field required label="Số quyết định" value={form.accusedDecision.decisionNo} onChange={(value) => updateField("accusedDecision", "decisionNo", value)} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Ngày quyết định<span className="ml-1 text-red-600">*</span></span>
          <Bm053DateSelectField value={form.accusedDecision.issueDate} onChange={(value) => updateField("accusedDecision", "issueDate", value)} minYear={1900} maxYear={new Date().getFullYear() + 10} />
        </label>
        <Field required multiline className="md:col-span-2" label="Cơ quan ban hành" value={form.accusedDecision.issuedBy} onChange={(value) => updateField("accusedDecision", "issuedBy", value)} />
      </SectionCard>

      <SelectField
        label="Chọn nhanh tội danh"
        value=""
        onChange={handleSelectOffense}
        options={BM053_OFFENSE_OPTIONS.map((item) => ({
          value: item.id,
          label: item.label,
        }))}
        className="md:col-span-2"
      />

      <SectionCard title="Nguồn tội danh / điều luật cho căn cứ">
        <Field required label="Tội danh" value={form.offense.offenseName} onChange={(value) => updateField("offense", "offenseName", value)} />
        <Field required label="Điều khoản" value={form.offense.legalArticle} onChange={(value) => updateField("offense", "legalArticle", value)} />
        <Field multiline className="md:col-span-2" label="Bộ luật áp dụng" value={form.offense.criminalCodeText} onChange={(value) => updateField("offense", "criminalCodeText", value)} />
      </SectionCard>

        </div>
      </details>
      <SectionCard title="7. Thông tin bị can">
        <Field required label="Họ tên" value={form.person.fullName} onChange={(value) => updateField("person", "fullName", value)} />
        <SelectField
          required
          label="Giới tính"
          value={form.person.genderLabel}
          onChange={(value) => updateField("person", "genderLabel", value)}
          options={BM053_GENDER_OPTIONS}
        />
        <Field required label="Tên gọi khác" value={form.person.otherName} onChange={(value) => updateField("person", "otherName", value)} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Ngày sinh đầy đủ</span>
          <Bm053DateSelectField value={form.person.dateOfBirth} onChange={(value) => updateField("person", "dateOfBirth", value)} minYear={1900} maxYear={new Date().getFullYear()} />
        </label>
        <Field label="Chỉ có năm sinh" value={form.person.birthYear} onChange={(value) => updateField("person", "birthYear", value)} />
        <Field required label="Nơi sinh" value={form.person.placeOfBirth} onChange={(value) => updateField("person", "placeOfBirth", value)} />
        <Field required label="Quốc tịch" value={form.person.nationality} onChange={(value) => updateField("person", "nationality", value)} />
        <Field required label="Dân tộc" value={form.person.ethnicity} onChange={(value) => updateField("person", "ethnicity", value)} />
        <Field required label="Tôn giáo" value={form.person.religion} onChange={(value) => updateField("person", "religion", value)} />
        <Field required label="Nghề nghiệp" value={form.person.occupation} onChange={(value) => updateField("person", "occupation", value)} />
        <SelectField
          label="Loại giấy tờ"
          value={form.person.identityType}
          onChange={(value) => updateField("person", "identityType", value)}
          options={BM053_IDENTITY_TYPE_OPTIONS}
        />
        <Field required label="Số CCCD/CMND" value={form.person.identityNo} onChange={(value) => updateField("person", "identityNo", value)} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Ngày cấp<span className="ml-1 text-red-600">*</span></span>
          <Bm053DateSelectField value={form.person.identityIssuedDate} onChange={(value) => updateField("person", "identityIssuedDate", value)} minYear={1900} maxYear={new Date().getFullYear() + 10} />
        </label>
        <Field required multiline className="md:col-span-2" label="Nơi cấp" value={form.person.identityIssuedPlace} onChange={(value) => updateField("person", "identityIssuedPlace", value)} />
        <Field required multiline className="md:col-span-2" label="Nơi thường trú" value={form.person.permanentAddress} onChange={(value) => updateField("person", "permanentAddress", value)} />
        <Field multiline className="md:col-span-2" label="Nơi tạm trú" value={form.person.temporaryAddress} onChange={(value) => updateField("person", "temporaryAddress", value)} />
        <Field required multiline className="md:col-span-2" label="Nơi ở hiện tại" value={form.person.currentAddress} onChange={(value) => updateField("person", "currentAddress", value)} />
        <SelectField
          label="Chọn nhanh nơi cư trú"
          value=""
          onChange={handleSelectResidence}
          options={BM053_RESIDENCE_OPTIONS.map((item) => ({
            value: item.id,
            label: item.label,
          }))}
          className="md:col-span-2"
        />
        <Field required multiline className="md:col-span-2" label="Nơi cư trú áp dụng biện pháp" value={form.person.residenceAddress} onChange={(value) => updateField("person", "residenceAddress", value)} />
      </SectionCard>

      <SectionCard title="8. Biện pháp cấm đi khỏi nơi cư trú">
        <Field required label="Thời hạn" value={form.measure.durationText} onChange={(value) => updateField("measure", "durationText", value)} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Từ ngày<span className="ml-1 text-red-600">*</span></span>
          <Bm053DateSelectField value={form.measure.fromDate} onChange={(value) => updateField("measure", "fromDate", value)} minYear={1900} maxYear={new Date().getFullYear() + 10} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Đến ngày<span className="ml-1 text-red-600">*</span></span>
          <Bm053DateSelectField value={form.measure.toDate} onChange={(value) => updateField("measure", "toDate", value)} minYear={1900} maxYear={new Date().getFullYear() + 10} />
        </label>
        <Field required multiline className="md:col-span-2" label="Nơi cư trú trong Điều 2" value={form.measure.residencePlace} onChange={(value) => updateField("measure", "residencePlace", value)} />
      </SectionCard>

      <SectionCard title="9. Đơn vị giám sát / Điều 3">
        <Field required multiline className="md:col-span-2" label="Đơn vị quản lý, theo dõi" value={form.monitoring.unitName} onChange={(value) => updateField("monitoring", "unitName", value)} />
        <Field required label="Số điện thoại liên hệ" value={form.monitoring.phone} onChange={(value) => updateField("monitoring", "phone", value)} />
        <Field label="Kiểm sát viên / ghi chú người xử lý" value={form.monitoring.prosecutorName} onChange={(value) => updateField("monitoring", "prosecutorName", value)} />
      </SectionCard>

      <SectionCard title="10. Nơi nhận">
        <Field multiline className="md:col-span-2" label="Dòng đơn vị giám sát" value={form.recipients.monitoringUnitLine} onChange={(value) => updateField("recipients", "monitoringUnitLine", value)} />
        <Field multiline className="md:col-span-2" label="Dòng bị can" value={form.recipients.personLine} onChange={(value) => updateField("recipients", "personLine", value)} />
        <Field label="Dòng lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} />
        <Field label="Ghi chú lưu" value={form.recipients.noteLine} onChange={(value) => updateField("recipients", "noteLine", value)} />
      </SectionCard>

      <SelectField
        label="Chọn nhanh người ký"
        value=""
        onChange={handleSelectSigner}
        options={BM053_SIGNER_OPTIONS.map((item) => ({
          value: item.id,
          label: item.label,
        }))}
        className="md:col-span-2"
      />

      <SectionCard title="11. Chữ ký">
        <SelectField
          required
          label="Hình thức ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          options={BM053_SIGN_MODE_OPTIONS}
        />
        <SelectField
          required
          label="Chức vụ ký"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          options={BM053_POSITION_OPTIONS}
        />
        <Field required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
      </SectionCard>

      <SectionCard title="12. Phần giao lệnh cuối văn bản">
        <Field multiline className="md:col-span-2" label="Nội dung giao lệnh" value={form.delivery.deliveredAtText} onChange={(value) => updateField("delivery", "deliveredAtText", value)} />
        <Field label="Tiêu đề người nhận lệnh" value={form.delivery.receiverTitle} onChange={(value) => updateField("delivery", "receiverTitle", value)} />
      </SectionCard>

      <SectionCard
        title="Preview Điều 1, Điều 2, Điều 3"
        description="Phần căn cứ đã có preview riêng ở trên. Khu vực này chỉ kiểm Điều 1, Điều 2, Điều 3, nơi nhận, chữ ký và phần giao lệnh."
      >
        <div className="space-y-3 md:col-span-2">
          <PreviewCard title="Header">
            <p><b>{readyForm.agency.name}</b> — Số: {readyForm.document.documentCode || "…"}</p>
            <p>{(readyForm.document as any).issuePlaceAndDateLine || bm053IssuePlaceAndDateLine(readyForm.agency.issuePlace, readyForm.document.issueDate)}</p>
          </PreviewCard>

          <PreviewCard title="Điều 1 - Bị can">
            <p>
              Họ tên: <b>{readyForm.person.fullName || "…"}</b>; Giới tính:{" "}
              <b>{readyForm.person.genderLabel || "…"}</b>; Tên gọi khác:{" "}
              <b>{readyForm.person.otherName || "…"}</b>.
            </p>
            <p>
              Sinh ngày <b>{(readyForm.person as any).dateOfBirthText || "… tháng … năm …"}</b>{" "}
              tại <b>{readyForm.person.placeOfBirth || "…"}</b>.
            </p>
            <p>{(readyForm.person as any).identityDocumentLine || "…"}</p>
          </PreviewCard>

          <PreviewCard title="Điều 2 - Biện pháp">
            <p>{(readyForm.measure as any).article2Line}</p>
          </PreviewCard>

          <PreviewCard title="Điều 3 - Giám sát">
            <p>{(readyForm.monitoring as any).article3Line}</p>
          </PreviewCard>

          <PreviewCard title="Nơi nhận / chữ ký / giao lệnh">
            <p>{readyForm.recipients.monitoringUnitLine || "- …;"}</p>
            <p>{readyForm.recipients.personLine || "- …;"}</p>
            <p>{readyForm.recipients.archiveLine || "- Lưu: HSVA, HSKS, VP."}</p>
            <p>
              Chữ ký: <b>{readyForm.signature.signMode || "…"}</b>{" "}
              <b>{readyForm.signature.positionTitle || "…"}</b> —{" "}
              <b>{readyForm.signature.signerName || "…"}</b>
            </p>
            <p>{readyForm.delivery.deliveredAtText || "Lệnh này đã được giao..."}</p>
            <p><b>{readyForm.delivery.receiverTitle || "NGƯỜI BỊ CẤM ĐI KHỎI NƠI CƯ TRÚ"}</b></p>
          </PreviewCard>
        </div>
      </SectionCard>
      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Sau khi lưu, hệ thống sẽ lưu đúng dữ liệu khách nhập, đồng thời build sẵn các dòng Điều 1, Điều 2, Điều 3 để render DOCX/PDF.
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-053"}
          </button>
        </div>
      </div>
    </div>
  );
}