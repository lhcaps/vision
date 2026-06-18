"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  BmFieldText,
  BmFieldTextarea,
  BmFormSection,
} from "./bm-form";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm055FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  caseDecision: TextRecord;
  accusedDecision: TextRecord;
  offense: TextRecord;
  person: TextRecord;
  measure: TextRecord;
  monitoring: TextRecord;
  notification: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm055FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm055FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm055FormInputs = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
    issuePlace: "",
    phone: "",
    monitoringUnitName: "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
  },
  document: {
    documentCode: "14/QĐ-VKSKV7",
    issueDate: "",
  },
  caseDecision: {
    decisionNo: "",
    issueDate: "",
    issuedBy: "",
  },
  accusedDecision: {
    decisionNo: "",
    issueDate: "",
    issuedBy: "",
  },
  offense: {
    offenseName: "",
    legalArticle: "khoản 1 Điều 321",
    criminalCodeText: "",
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
    durationText: "10 ngày",
    fromDate: "05/03/2026",
    toDate: "14/03/2026",
    residencePlace: "",
    cancelReasonLine: "",
    cancellationArticle1Line: "",
    cancellationArticle2Line: "",
  },
  monitoring: {
    unitName: "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
    phone: "",
    prosecutorName: "",
  },
  notification: {
    title: "QUYẾT ĐỊNH",
    subject: "Về việc hủy bỏ biện pháp cấm đi khỏi nơi cư trú",
    content: "",
    preventiveMeasureOrderCode: "12/LCCT-VKS",
    preventiveMeasureOrderIssueDate: "04/03/2026",
  },
  recipients: {
    monitoringUnitLine: "",
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
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày quyết định" },
  { section: "notification", field: "preventiveMeasureOrderCode", label: "Số lệnh cấm đi khỏi nơi cư trú" },
  { section: "notification", field: "preventiveMeasureOrderIssueDate", label: "Ngày lệnh cấm đi khỏi nơi cư trú" },
  { section: "measure", field: "cancelReasonLine", label: "Lý do hủy bỏ biện pháp" },
  { section: "measure", field: "cancellationArticle1Line", label: "Nội dung Điều 1" },
  { section: "measure", field: "cancellationArticle2Line", label: "Nội dung Điều 2" },
  { section: "person", field: "fullName", label: "Họ tên bị can" },
  { section: "person", field: "genderLabel", label: "Giới tính" },
  { section: "person", field: "placeOfBirth", label: "Nơi sinh" },
  { section: "person", field: "identityNo", label: "Số CCCD/CMND" },
  { section: "person", field: "identityIssuedDate", label: "Ngày cấp CCCD/CMND" },
  { section: "person", field: "identityIssuedPlace", label: "Nơi cấp CCCD/CMND" },
  { section: "person", field: "permanentAddress", label: "Nơi thường trú" },
  { section: "person", field: "currentAddress", label: "Nơi ở hiện tại" },
  { section: "offense", field: "offenseName", label: "Tội danh" },
  { section: "offense", field: "legalArticle", label: "Điều khoản" },
  { section: "measure", field: "durationText", label: "Thời hạn" },
  { section: "measure", field: "fromDate", label: "Từ ngày" },
  { section: "measure", field: "toDate", label: "Đến ngày" },
  { section: "monitoring", field: "unitName", label: "Đơn vị quản lý, theo dõi" },
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

function getValue(form: Bm055FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function pick(record: Record<string, unknown>, key: string): string {
  return text(record[key]);
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm055FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const caseDecision = section(payload, "caseDecision");
  const accusedDecision = section(payload, "accusedDecision");
  const offense = section(payload, "offense");
  const person = section(payload, "person");
  const measure = section(payload, "measure");
  const monitoring = section(payload, "monitoring");
  const notification = section(payload, "notification");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  return {
    agency: {
      parentName: pick(agency, "parentName"),
      name: pick(agency, "name"),
      shortName: pick(agency, "shortName"),
      issuePlace: pick(agency, "issuePlace"),
      phone: pick(agency, "phone"),
      monitoringUnitName: pick(agency, "monitoringUnitName"),
    },
    document: {
      documentCode: pick(document, "documentCode"),
      issueDate: toDateInput(document.issueDate),
    },
    caseDecision: {
      decisionNo: pick(caseDecision, "decisionNo"),
      issueDate: toDateInput(caseDecision.issueDate),
      issuedBy: pick(caseDecision, "issuedBy"),
    },
    accusedDecision: {
      decisionNo: pick(accusedDecision, "decisionNo"),
      issueDate: toDateInput(accusedDecision.issueDate),
      issuedBy: pick(accusedDecision, "issuedBy"),
    },
    offense: {
      offenseName: pick(offense, "offenseName"),
      legalArticle: pick(offense, "legalArticle"),
      criminalCodeText: pick(offense, "criminalCodeText"),
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
      durationText: pick(measure, "durationText"),
      fromDate: toDateInput(measure.fromDate),
      toDate: toDateInput(measure.toDate),
      residencePlace: pick(measure, "residencePlace"),
      cancelReasonLine: pick(measure, "cancelReasonLine"),
      cancellationArticle1Line: pick(measure, "cancellationArticle1Line"),
      cancellationArticle2Line: pick(measure, "cancellationArticle2Line"),
    },
    monitoring: {
      unitName: pick(monitoring, "unitName"),
      phone: pick(monitoring, "phone"),
      prosecutorName: pick(monitoring, "prosecutorName"),
    },
    notification: {
      title: pick(notification, "title") || "QUYẾT ĐỊNH",
      subject:
        pick(notification, "subject") ||
        "Về việc hủy bỏ biện pháp cấm đi khỏi nơi cư trú",
      content: pick(notification, "content"),
      preventiveMeasureOrderCode: pick(notification, "preventiveMeasureOrderCode"),
      preventiveMeasureOrderIssueDate: toDateInput(
        notification.preventiveMeasureOrderIssueDate,
      ),
    },
    recipients: {
      monitoringUnitLine: pick(recipients, "monitoringUnitLine"),
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

async function getBm055RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
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
    throw new Error(body || `Không tải được payload BM-055. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm055FormInputs(
  documentId: string | number,
  form: Bm055FormInputs,
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
    throw new Error(body || `Không lưu được dữ liệu BM-055. HTTP ${response.status}`);
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

export function Bm055FormInputsPanel({
  documentId,
  onSaved,
}: Bm055FormInputsPanelProps) {
  const [form, setForm] = useState<Bm055FormInputs>(EMPTY_FORM);
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
      const payload = await getBm055RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-055.",
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
      const next: Bm055FormInputs = {
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

      if (sectionKey === "monitoring" && field === "unitName") {
        next.recipients = {
          ...next.recipients,
          monitoringUnitLine: value.trim() ? `- ${value.trim()};` : "",
        };
      }

      return next;
    });
  }

  function fillCustomerSample() {
    const sample: Bm055FormInputs = {
      agency: {
        parentName: "",
        name: "",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
        monitoringUnitName:
          "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
      },
      document: {
        documentCode: "14/QĐ-VKSKV7",
        issueDate: "2026-03-15",
      },
      caseDecision: {
        decisionNo: "G505/QĐ-VPCQCSĐT",
        issueDate: "2025-10-15",
        issuedBy:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      accusedDecision: {
        decisionNo: "",
        issueDate: "2025-10-15",
        issuedBy:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
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
        durationText: "10 ngày",
        fromDate: "05/03/2026",
        toDate: "14/03/2026",
        residencePlace: "xã Đông Thạnh, Thành phố Hồ Chí Minh",
        cancelReasonLine:
          "Xét thấy không còn cần thiết tiếp tục áp dụng biện pháp cấm đi khỏi nơi cư trú đối với bị can .",
        cancellationArticle1Line:
          "Hủy bỏ biện pháp cấm đi khỏi nơi cư trú đối với bị can .",
        cancellationArticle2Line:
          "Quyết định này có hiệu lực kể từ ngày ký.",
      },
      monitoring: {
        unitName:
          "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
        phone: "",
        prosecutorName: "thụ lý vụ án",
      },
      notification: {
        title: "QUYẾT ĐỊNH",
        subject: "Về việc hủy bỏ biện pháp cấm đi khỏi nơi cư trú",
        content:
          "Quyết định hủy bỏ biện pháp cấm đi khỏi nơi cư trú đối với bị can .",
        preventiveMeasureOrderCode: "12/LCCT-VKS",
        preventiveMeasureOrderIssueDate: "04/03/2026",
      },
      recipients: {
        monitoringUnitLine:
          "- Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh;",
        personLine: "- ;",
        investigationUnitLine:
          "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
        noteLine: "T. ền.05b",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
    };

    setForm(sample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await saveBm055FormInputs(documentId, form);

      setInitialSnapshot(JSON.stringify(form));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-055.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-055...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-055
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Quyết định hủy bỏ biện pháp cấm đi khỏi nơi cư trú
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này lưu dữ liệu nghiệp vụ riêng cho BM-055: số quyết định, số lệnh cấm, ngày lệnh cấm, lý do hủy bỏ,
              thông tin bị can, nơi nhận và chữ ký.
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
            Các trường quan trọng của BM-055 đã được nhập đủ.
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
      </section>

      <SectionCard title="1. Cơ quan ban hành">
        <BmFieldText label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateField("agency", "parentName", value)} fullWidth />
        <BmFieldText label="Cơ quan ban hành" value={form.agency.name} onChange={(value) => updateField("agency", "name", value)} fullWidth />
        <BmFieldText label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateField("agency", "shortName", value)} fullWidth />
        <BmFieldText label="Địa danh ban hành" value={form.agency.issuePlace} onChange={(value) => updateField("agency", "issuePlace", value)} fullWidth />
      </SectionCard>

      <SectionCard title="2. Thông tin quyết định BM-055">
        <BmFieldText label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateField("document", "documentCode", value)} fullWidth />
        <BmFieldText label="Ngày quyết định" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} fullWidth />
        <BmFieldText label="Số lệnh cấm đi khỏi nơi cư trú" value={form.notification.preventiveMeasureOrderCode} onChange={(value) => updateField("notification", "preventiveMeasureOrderCode", value)} fullWidth />
        <BmFieldText label="Ngày lệnh cấm đi khỏi nơi cư trú" value={form.notification.preventiveMeasureOrderIssueDate} onChange={(value) => updateField("notification", "preventiveMeasureOrderIssueDate", value)} fullWidth />
      </SectionCard>

      <SectionCard title="3. Quyết định tố tụng">
        <BmFieldText label="Số QĐ khởi tố vụ án" value={form.caseDecision.decisionNo} onChange={(value) => updateField("caseDecision", "decisionNo", value)} fullWidth />
        <BmFieldText label="Ngày QĐ khởi tố vụ án" value={form.caseDecision.issueDate} onChange={(value) => updateField("caseDecision", "issueDate", value)} fullWidth />
        <BmFieldText label="Cơ quan ra QĐ khởi tố vụ án" value={form.caseDecision.issuedBy} onChange={(value) => updateField("caseDecision", "issuedBy", value)} fullWidth />
        <BmFieldText label="Số QĐ khởi tố bị can" value={form.accusedDecision.decisionNo} onChange={(value) => updateField("accusedDecision", "decisionNo", value)} fullWidth />
        <BmFieldText label="Ngày QĐ khởi tố bị can" value={form.accusedDecision.issueDate} onChange={(value) => updateField("accusedDecision", "issueDate", value)} fullWidth />
        <BmFieldText label="Cơ quan ra QĐ khởi tố bị can" value={form.accusedDecision.issuedBy} onChange={(value) => updateField("accusedDecision", "issuedBy", value)} fullWidth />
      </SectionCard>

      <SectionCard title="4. Thông tin bị can">
        <BmFieldText label="Họ tên" value={form.person.fullName} onChange={(value) => updateField("person", "fullName", value)} fullWidth />
        <SelectField required label="Giới tính" value={form.person.genderLabel} onChange={(value) => updateField("person", "genderLabel", value)} options={GENDER_OPTIONS} />
        <BmFieldText label="Tên gọi khác" value={form.person.otherName} onChange={(value) => updateField("person", "otherName", value)} fullWidth />
        <BmFieldText label="Ngày sinh đầy đủ" value={form.person.dateOfBirth} onChange={(value) => updateField("person", "dateOfBirth", value)} fullWidth />
        <BmFieldText label="Chỉ có năm sinh" value={form.person.birthYear} onChange={(value) => updateField("person", "birthYear", value)} fullWidth />
        <BmFieldText label="Nơi sinh" value={form.person.placeOfBirth} onChange={(value) => updateField("person", "placeOfBirth", value)} fullWidth />
        <BmFieldText label="Quốc tịch" value={form.person.nationality} onChange={(value) => updateField("person", "nationality", value)} fullWidth />
        <BmFieldText label="Dân tộc" value={form.person.ethnicity} onChange={(value) => updateField("person", "ethnicity", value)} fullWidth />
        <BmFieldText label="Tôn giáo" value={form.person.religion} onChange={(value) => updateField("person", "religion", value)} fullWidth />
        <BmFieldText label="Nghề nghiệp" value={form.person.occupation} onChange={(value) => updateField("person", "occupation", value)} fullWidth />
        <BmFieldText label="Loại giấy tờ" value={form.person.identityType} onChange={(value) => updateField("person", "identityType", value)} fullWidth />
        <BmFieldText label="Số CCCD/CMND" value={form.person.identityNo} onChange={(value) => updateField("person", "identityNo", value)} fullWidth />
        <BmFieldText label="Ngày cấp" value={form.person.identityIssuedDate} onChange={(value) => updateField("person", "identityIssuedDate", value)} fullWidth />
        <BmFieldText label="Nơi cấp" value={form.person.identityIssuedPlace} onChange={(value) => updateField("person", "identityIssuedPlace", value)} fullWidth />
        <BmFieldText label="Nơi thường trú" value={form.person.permanentAddress} onChange={(value) => updateField("person", "permanentAddress", value)} fullWidth />
        <BmFieldText label="Nơi tạm trú" value={form.person.temporaryAddress} onChange={(value) => updateField("person", "temporaryAddress", value)} fullWidth />
        <BmFieldText label="Nơi ở hiện tại" value={form.person.currentAddress} onChange={(value) => updateField("person", "currentAddress", value)} fullWidth />
        <BmFieldText label="Nơi cư trú áp dụng biện pháp" value={form.person.residenceAddress} onChange={(value) => updateField("person", "residenceAddress", value)} fullWidth />
      </SectionCard>

      <SectionCard title="5. Tội danh">
        <BmFieldText label="Tội danh" value={form.offense.offenseName} onChange={(value) => updateField("offense", "offenseName", value)} fullWidth />
        <BmFieldText label="Điều khoản" value={form.offense.legalArticle} onChange={(value) => updateField("offense", "legalArticle", value)} fullWidth />
        <BmFieldText label="Bộ luật áp dụng" value={form.offense.criminalCodeText} onChange={(value) => updateField("offense", "criminalCodeText", value)} fullWidth />
      </SectionCard>

      <SectionCard title="6. Biện pháp cấm đi khỏi nơi cư trú">
        <BmFieldText label="Thời hạn" value={form.measure.durationText} onChange={(value) => updateField("measure", "durationText", value)} fullWidth />
        <BmFieldText label="Từ ngày" value={form.measure.fromDate} onChange={(value) => updateField("measure", "fromDate", value)} fullWidth />
        <BmFieldText label="Đến ngày" value={form.measure.toDate} onChange={(value) => updateField("measure", "toDate", value)} fullWidth />
        <BmFieldText label="Nơi cư trú trong thời hạn áp dụng" value={form.measure.residencePlace} onChange={(value) => updateField("measure", "residencePlace", value)} fullWidth />
        <BmFieldText label="Lý do hủy bỏ biện pháp" value={form.measure.cancelReasonLine} onChange={(value) => updateField("measure", "cancelReasonLine", value)} fullWidth />
        <BmFieldText label="Nội dung Điều 1" value={form.measure.cancellationArticle1Line} onChange={(value) => updateField("measure", "cancellationArticle1Line", value)} fullWidth />
        <BmFieldText label="Nội dung Điều 2" value={form.measure.cancellationArticle2Line} onChange={(value) => updateField("measure", "cancellationArticle2Line", value)} fullWidth />
      </SectionCard>

      <SectionCard title="8. Nơi nhận">
        <BmFieldText label="Dòng đơn vị quản lý" value={form.recipients.monitoringUnitLine} onChange={(value) => updateField("recipients", "monitoringUnitLine", value)} fullWidth />
        <BmFieldText label="Dòng cơ quan điều tra" value={form.recipients.investigationUnitLine} onChange={(value) => updateField("recipients", "investigationUnitLine", value)} fullWidth />
        <BmFieldText label="Dòng bị can" value={form.recipients.personLine} onChange={(value) => updateField("recipients", "personLine", value)} fullWidth />
        <BmFieldText label="Dòng lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateField("recipients", "archiveLine", value)} fullWidth />
      </SectionCard>

      <SectionCard title="9. Chữ ký">
        <SelectField required label="Hình thức ký" value={form.signature.signMode} onChange={(value) => updateField("signature", "signMode", value)} options={SIGN_MODE_OPTIONS} />
        <SelectField required label="Chức vụ ký" value={form.signature.positionTitle} onChange={(value) => updateField("signature", "positionTitle", value)} options={POSITION_OPTIONS} />
        <BmFieldText label="Người ký" value={form.signature.signerName} onChange={(value) => updateField("signature", "signerName", value)} fullWidth />
      </SectionCard>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Sau khi lưu, backend tự sinh các dòng như <b>identityDocumentLine</b>,
            <b> issuePlaceAndDateLine</b> và <b>measure.preventiveMeasureOrderLegalBasisLine</b>, <b>cancelReasonLine</b>, <b>cancellationArticle1Line</b>.
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-055"}
          </button>
        </div>
      </div>
    </div>
  );
}