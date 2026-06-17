"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm058FormInputs = {
  agency: TextRecord;
  official: TextRecord;
  document: TextRecord;
  caseDecision: TextRecord;
  accusedDecision: TextRecord;
  investigation: TextRecord;
  person: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
  delivery: TextRecord;
};

type SectionKey = keyof Bm058FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm058FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm058FormInputs = {
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
  caseDecision: {
    decisionNo: "",
    issueDate: "",
    issuedBy: "",
    legalBasisLine: "",
  },
  accusedDecision: {
    decisionNo: "",
    issueDate: "",
    issuedBy: "",
    legalBasisLine: "",
  },
  investigation: {
    investigationUnitName: "",
    detentionExecutionUnitName: "",
  },
  person: {
    fullName: "",
    genderLabel: "",
    otherName: "",
    dateOfBirth: "",
    birthDay: "",
    birthMonth: "",
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
    durationText: "",
    fromDate: "",
    toDate: "",
    detentionDurationText: "",
    detentionFromDateText: "",
    detentionToDateText: "",
    detentionReasonLine: "",
    detentionArticle1Line: "",
    detentionArticle2Line: "",
    detentionExecutionUnitName: "",
  },
  recipients: {
    personLine: "",
    detentionExecutionUnitLine: "",
    investigationUnitLine: "",
    archiveLine: "",
    noteLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
  delivery: {
    deliveredAtText: "",
    receiverTitle: "",
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Cơ quan ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh ban hành" },
  { section: "official", field: "issuerTitle", label: "Thẩm quyền ban hành" },
  { section: "document", field: "documentCode", label: "Số lệnh tạm giam" },
  { section: "document", field: "issueDate", label: "Ngày ban hành lệnh" },
  { section: "caseDecision", field: "decisionNo", label: "Số quyết định khởi tố vụ án" },
  { section: "caseDecision", field: "issueDate", label: "Ngày quyết định khởi tố vụ án" },
  { section: "caseDecision", field: "issuedBy", label: "Cơ quan ra quyết định khởi tố vụ án" },
  { section: "accusedDecision", field: "decisionNo", label: "Số quyết định khởi tố bị can" },
  { section: "accusedDecision", field: "issueDate", label: "Ngày quyết định khởi tố bị can" },
  { section: "accusedDecision", field: "issuedBy", label: "Cơ quan ra quyết định khởi tố bị can" },
  { section: "investigation", field: "investigationUnitName", label: "Cơ quan điều tra" },
  { section: "investigation", field: "detentionExecutionUnitName", label: "Đơn vị thi hành lệnh tạm giam" },
  { section: "person", field: "fullName", label: "Họ tên bị can" },
  { section: "person", field: "genderLabel", label: "Giới tính" },
  { section: "person", field: "dateOfBirth", label: "Ngày sinh" },
  { section: "person", field: "placeOfBirth", label: "Nơi sinh" },
  { section: "person", field: "identityNo", label: "Số CMND/CCCD/Hộ chiếu" },
  { section: "person", field: "identityIssuedDate", label: "Ngày cấp giấy tờ" },
  { section: "person", field: "identityIssuedPlace", label: "Nơi cấp giấy tờ" },
  { section: "person", field: "permanentAddress", label: "Nơi thường trú" },
  { section: "person", field: "currentAddress", label: "Nơi ở hiện tại" },
  { section: "measure", field: "detentionDurationText", label: "Thời hạn tạm giam" },
  { section: "measure", field: "fromDate", label: "Ngày bắt đầu tạm giam" },
  { section: "measure", field: "toDate", label: "Ngày kết thúc tạm giam" },
  { section: "measure", field: "detentionReasonLine", label: "Lý do/căn cứ cần thiết tạm giam" },
  { section: "measure", field: "detentionArticle1Line", label: "Nội dung Điều 1" },
  { section: "measure", field: "detentionArticle2Line", label: "Nội dung Điều 2" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - bị can" },
  { section: "recipients", field: "detentionExecutionUnitLine", label: "Nơi nhận - đơn vị thi hành" },
  { section: "recipients", field: "archiveLine", label: "Nơi nhận - lưu hồ sơ" },
  { section: "signature", field: "positionTitle", label: "Chức vụ ký" },
  { section: "signature", field: "signerName", label: "Người ký" },
  { section: "delivery", field: "receiverTitle", label: "Chức danh người nhận lệnh" },
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
  if (value === null || value === undefined) return "";
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

  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function getValue(form: Bm058FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm058FormInputs {
  const agency = section(payload, "agency");
  const official = section(payload, "official");
  const document = section(payload, "document");
  const caseDecision = section(payload, "caseDecision");
  const accusedDecision = section(payload, "accusedDecision");
  const investigation = section(payload, "investigation");
  const person = section(payload, "person");
  const measure = section(payload, "measure");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");
  const delivery = section(payload, "delivery");

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
    caseDecision: {
      decisionNo: pick(caseDecision, "decisionNo"),
      issueDate: toDateInput(caseDecision.issueDate),
      issuedBy: pick(caseDecision, "issuedBy"),
      legalBasisLine: pick(caseDecision, "legalBasisLine"),
    },
    accusedDecision: {
      decisionNo: pick(accusedDecision, "decisionNo"),
      issueDate: toDateInput(accusedDecision.issueDate),
      issuedBy: pick(accusedDecision, "issuedBy"),
      legalBasisLine: pick(accusedDecision, "legalBasisLine"),
    },
    investigation: {
      investigationUnitName: pick(investigation, "investigationUnitName"),
      detentionExecutionUnitName:
        pick(investigation, "detentionExecutionUnitName") ||
        pick(measure, "detentionExecutionUnitName"),
    },
    person: {
      fullName: pick(person, "fullName"),
      genderLabel: pick(person, "genderLabel"),
      otherName: pick(person, "otherName"),
      dateOfBirth: toDateInput(person.dateOfBirth),
      birthDay: pick(person, "birthDay"),
      birthMonth: pick(person, "birthMonth"),
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
      durationText: pick(measure, "durationText"),
      fromDate: toDateInput(measure.fromDate),
      toDate: toDateInput(measure.toDate),
      detentionDurationText:
        pick(measure, "detentionDurationText") || pick(measure, "durationText"),
      detentionFromDateText: pick(measure, "detentionFromDateText"),
      detentionToDateText: pick(measure, "detentionToDateText"),
      detentionReasonLine: pick(measure, "detentionReasonLine"),
      detentionArticle1Line: pick(measure, "detentionArticle1Line"),
      detentionArticle2Line: pick(measure, "detentionArticle2Line"),
      detentionExecutionUnitName: pick(measure, "detentionExecutionUnitName"),
    },
    recipients: {
      personLine: pick(recipients, "personLine"),
      detentionExecutionUnitLine: pick(recipients, "detentionExecutionUnitLine"),
      investigationUnitLine: pick(recipients, "investigationUnitLine"),
      archiveLine: pick(recipients, "archiveLine"),
      noteLine: pick(recipients, "noteLine"),
    },
    signature: {
      signMode: pick(signature, "signMode") || "KT. VIỆN TRƯỞNG",
      positionTitle: pick(signature, "positionTitle") || "PHÓ VIỆN TRƯỞNG",
      signerName: pick(signature, "signerName"),
    },
    delivery: {
      deliveredAtText: pick(delivery, "deliveredAtText"),
      receiverTitle: pick(delivery, "receiverTitle") || "NGƯỜI BỊ TẠM GIAM",
    },
  };
}

async function getBm058RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
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
    throw new Error(body || `Không tải được payload BM-058. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm058FormInputs(
  documentId: string | number,
  form: Bm058FormInputs,
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
        updatedByName: "",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Không lưu được dữ liệu BM-058. HTTP ${response.status}`);
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

export function Bm058FormInputsPanel({
  documentId,
  onSaved,
}: Bm058FormInputsPanelProps) {
  const [form, setForm] = useState<Bm058FormInputs>(EMPTY_FORM);
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
      const payload = await getBm058RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-058.",
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
      const next: Bm058FormInputs = {
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

        next.measure = {
          ...next.measure,
          detentionReasonLine: value.trim()
            ? `việc tạm giam đối với bị can ${value.trim()} là có căn cứ và cần thiết,`
            : next.measure.detentionReasonLine,
          detentionArticle1Line: value.trim()
            ? `Tạm giam đối với bị can ${value.trim()}.`
            : next.measure.detentionArticle1Line,
        };
      }

      if (
        (sectionKey === "investigation" && field === "detentionExecutionUnitName") ||
        (sectionKey === "measure" && field === "detentionExecutionUnitName")
      ) {
        const unitName = value.trim();

        next.measure = {
          ...next.measure,
          detentionExecutionUnitName: unitName,
          detentionArticle2Line: unitName
            ? `Yêu cầu ${unitName} thi hành Lệnh này theo quy định của Bộ luật Tố tụng hình sự.`
            : next.measure.detentionArticle2Line,
        };

        next.recipients = {
          ...next.recipients,
          detentionExecutionUnitLine: unitName ? `- ${unitName};` : "",
        };
      }

      if (sectionKey === "measure" && field === "durationText") {
        next.measure = {
          ...next.measure,
          detentionDurationText: value,
        };
      }

      return next;
    });
  }

  function fillCustomerSample() {
    const sample: Bm058FormInputs = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
      },
      official: {
        fullName: "",
        positionTitle: "VIỆN TRƯỞNG",
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        prosecutorName: "",
      },
      document: {
        documentCode: "17/LTG-VKSKV7",
        issueDate: "2026-05-11",
      },
      caseDecision: {
        decisionNo: "01/QĐ-VKSKV7",
        issueDate: "2026-05-06",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        legalBasisLine: "",
      },
      accusedDecision: {
        decisionNo: "02/QĐ-VKSKV7",
        issueDate: "2026-05-06",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        legalBasisLine: "",
      },
      investigation: {
        investigationUnitName:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        detentionExecutionUnitName:
          "Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh",
      },
      person: {
        fullName: "",
        genderLabel: "Nam",
        otherName: "Không có",
        dateOfBirth: "1985-09-08",
        birthDay: "08",
        birthMonth: "09",
        birthYear: "1985",
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
        residenceAddress: "",
      },
      measure: {
        durationText: "02 tháng",
        fromDate: "2026-05-11",
        toDate: "2026-07-11",
        detentionDurationText: "02 tháng",
        detentionFromDateText: "11/5/2026",
        detentionToDateText: "11/7/2026",
        detentionReasonLine:
          "việc tạm giam đối với bị can  là có căn cứ và cần thiết,",
        detentionArticle1Line: "Tạm giam đối với bị can .",
        detentionArticle2Line:
          "Yêu cầu Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh thi hành Lệnh này theo quy định của Bộ luật Tố tụng hình sự.",
        detentionExecutionUnitName:
          "Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh",
      },
      recipients: {
        personLine: "- ;",
        detentionExecutionUnitLine:
          "- Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh;",
        investigationUnitLine:
          "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
        noteLine: "",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
      delivery: {
        deliveredAtText:
          "Lệnh này đã được giao cho người bị tạm giam một bản vào hồi ... giờ ... ngày ... tháng ... năm 2026",
        receiverTitle: "NGƯỜI BỊ TẠM GIAM",
      },
    };

    setForm(sample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await saveBm058FormInputs(documentId, form);

      setInitialSnapshot(JSON.stringify(form));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-058.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-058...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-058
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Lệnh tạm giam
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này lưu dữ liệu nghiệp vụ riêng cho BM-058: số lệnh,
              căn cứ khởi tố vụ án/bị can, thời hạn tạm giam, đơn vị thi hành,
              thông tin bị can, nơi nhận, giao nhận lệnh và chữ ký.
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
            Các trường quan trọng của BM-058 đã được nhập đủ.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-058
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

      <SectionCard title="2. Lệnh tạm giam và thẩm quyền">
        <Field required label="Số lệnh tạm giam" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} />
        <Field required type="date" label="Ngày ban hành lệnh" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
        <Field required label="Dòng thẩm quyền" value={form.official.issuerTitle} onChange={(value) => updateField("official", "issuerTitle", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="3. Căn cứ khởi tố">
        <Field required label="Số quyết định khởi tố vụ án" value={form.caseDecision.decisionNo} onChange={(value) => updateField("caseDecision", "decisionNo", value)} />
        <Field required type="date" label="Ngày quyết định khởi tố vụ án" value={form.caseDecision.issueDate} onChange={(value) => updateField("caseDecision", "issueDate", value)} />
        <Field required multiline label="Cơ quan ra quyết định khởi tố vụ án" value={form.caseDecision.issuedBy} onChange={(value) => updateField("caseDecision", "issuedBy", value)} className="md:col-span-2" />
        <Field required label="Số quyết định khởi tố bị can" value={form.accusedDecision.decisionNo} onChange={(value) => updateField("accusedDecision", "decisionNo", value)} />
        <Field required type="date" label="Ngày quyết định khởi tố bị can" value={form.accusedDecision.issueDate} onChange={(value) => updateField("accusedDecision", "issueDate", value)} />
        <Field required multiline label="Cơ quan ra quyết định khởi tố bị can" value={form.accusedDecision.issuedBy} onChange={(value) => updateField("accusedDecision", "issuedBy", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="4. Nội dung tạm giam">
        <Field required label="Thời hạn tạm giam" value={form.measure.detentionDurationText} onChange={(value) => updateField("measure", "detentionDurationText", value)} />
        <Field required type="date" label="Từ ngày" value={form.measure.fromDate} onChange={(value) => updateField("measure", "fromDate", value)} />
        <Field required type="date" label="Đến ngày" value={form.measure.toDate} onChange={(value) => updateField("measure", "toDate", value)} />
        <Field required multiline label="Lý do/căn cứ cần thiết tạm giam" value={form.measure.detentionReasonLine} onChange={(value) => updateField("measure", "detentionReasonLine", value)} className="md:col-span-2" />
        <Field required multiline label="Điều 1" value={form.measure.detentionArticle1Line} onChange={(value) => updateField("measure", "detentionArticle1Line", value)} className="md:col-span-2" />
        <Field required multiline label="Điều 2" value={form.measure.detentionArticle2Line} onChange={(value) => updateField("measure", "detentionArticle2Line", value)} className="md:col-span-2" />
        <Field required multiline label="Đơn vị thi hành lệnh tạm giam" value={form.investigation.detentionExecutionUnitName} onChange={(value) => updateField("investigation", "detentionExecutionUnitName", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="5. Bị can bị tạm giam">
        <Field required label="Họ tên" value={form.person.fullName} onChange={(value) => updateField("person", "fullName", value)} />
        <SelectField required label="Giới tính" value={form.person.genderLabel} onChange={(value) => updateField("person", "genderLabel", value)} options={GENDER_OPTIONS} />
        <Field label="Tên gọi khác" value={form.person.otherName} onChange={(value) => updateField("person", "otherName", value)} />
        <Field required type="date" label="Ngày sinh" value={form.person.dateOfBirth} onChange={(value) => updateField("person", "dateOfBirth", value)} />
        <Field required label="Nơi sinh" value={form.person.placeOfBirth} onChange={(value) => updateField("person", "placeOfBirth", value)} />
        <Field label="Quốc tịch" value={form.person.nationality} onChange={(value) => updateField("person", "nationality", value)} />
        <Field label="Dân tộc" value={form.person.ethnicity} onChange={(value) => updateField("person", "ethnicity", value)} />
        <Field label="Tôn giáo" value={form.person.religion} onChange={(value) => updateField("person", "religion", value)} />
        <Field label="Nghề nghiệp" value={form.person.occupation} onChange={(value) => updateField("person", "occupation", value)} />
        <Field label="Loại giấy tờ" value={form.person.identityType} onChange={(value) => updateField("person", "identityType", value)} />
        <Field required label="Số CMND/CCCD/Hộ chiếu" value={form.person.identityNo} onChange={(value) => updateField("person", "identityNo", value)} />
        <Field required type="date" label="Ngày cấp" value={form.person.identityIssuedDate} onChange={(value) => updateField("person", "identityIssuedDate", value)} />
        <Field required label="Nơi cấp" value={form.person.identityIssuedPlace} onChange={(value) => updateField("person", "identityIssuedPlace", value)} className="md:col-span-2" />
        <Field required multiline label="Nơi thường trú" value={form.person.permanentAddress} onChange={(value) => updateField("person", "permanentAddress", value)} className="md:col-span-2" />
        <Field multiline label="Nơi tạm trú" value={form.person.temporaryAddress} onChange={(value) => updateField("person", "temporaryAddress", value)} className="md:col-span-2" />
        <Field required multiline label="Nơi ở hiện tại" value={form.person.currentAddress} onChange={(value) => updateField("person", "currentAddress", value)} className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="6. Nơi nhận">
        <Field required label="Người bị tạm giam" value={form.recipients.personLine} onChange={(value) => updateField("recipients", "personLine", value)} />
        <Field required label="Đơn vị thi hành lệnh" value={form.recipients.detentionExecutionUnitLine} onChange={(value) => updateField("recipients", "detentionExecutionUnitLine", value)} />
        <Field label="Cơ quan điều tra" value={form.recipients.investigationUnitLine} onChange={(value) => updateField("recipients", "investigationUnitLine", value)} />
        <Field required label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} />
      </SectionCard>

      <SectionCard title="7. Chữ ký và giao nhận lệnh">
        <SelectField label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <SelectField required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <Field required label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} />
        <Field multiline label="Dòng giao lệnh" value={form.delivery.deliveredAtText} onChange={(value) => updateField("delivery", "deliveredAtText", value)} className="md:col-span-2" />
        <Field required label="Chức danh người nhận lệnh" value={form.delivery.receiverTitle} onChange={(value) => updateField("delivery", "receiverTitle", value)} />
      </SectionCard>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Lưu dữ liệu BM-058
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
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-058"}
          </button>
        </div>
      </section>
    </div>
  );
}
