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
      const payload = await getBm053RenderPayload(documentId);
      const nextForm = normalizeBm053FormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  function updateField(section: SectionKey, field: string, value: string) {
  setForm((current) => {
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

    return next;
  });
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
  const option = BM053_RESIDENCE_OPTIONS.find((item) => item.id === optionId);

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
      fullName: option.officialFullName,
      positionTitle: option.officialPositionTitle,
      prosecutorName: option.prosecutorName,
    },
    signature: {
      ...current.signature,
      signMode: option.signMode,
      positionTitle: option.positionTitle,
      signerName: option.signerName,
    },
    monitoring: {
      ...current.monitoring,
      prosecutorName: option.prosecutorName,
    },
  }));
}

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await saveBm053FormInputs(documentId, form);

      setInitialSnapshot(JSON.stringify(form));
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
        parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
        name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "0988027788",
        monitoringUnitName:
          "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh",
      },
      official: {
        fullName: "Trần Thanh Nam",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        prosecutorName: "Nguyễn Thị Hồng Hạnh",
      },
      document: {
        documentNo: "",
        documentCode: "12/LCCT-VKSKV7",
        issueDate: "2026-03-04",
      },
      caseDecision: {
        decisionNo: "G505/QĐ-VPCQCSĐT",
        issueDate: "2025-10-15",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      accusedDecision: {
        decisionNo: "G813/QĐ-VPCQCSĐT",
        issueDate: "2025-10-15",
        issuedBy: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      offense: {
        offenseName: "Đánh bạc",
        legalArticle: "khoản 1 Điều 321",
        criminalCodeText:
          "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      },
      person: {
        fullName: "Đoàn Văn Dũng",
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
        phone: "0988027788",
        prosecutorName: "Nguyễn Thị Hồng Hạnh",
      },
      recipients: {
        monitoringUnitLine: "- UBND xã Đông Thạnh, Thành phố Hồ Chí Minh;",
        personLine: "- Đoàn Văn Dũng;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
        noteLine: "T. Huyền.05b",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "Trần Thanh Nam",
      },
      delivery: {
        deliveredAtText:
          "Lệnh này đã được giao cho người bị cấm đi khỏi nơi cư trú một bản vào hồi …..giờ……phút, ngày…….tháng…….năm 2026",
        receiverTitle: "NGƯỜI BỊ CẤM ĐI KHỎI NƠI CƯ TRÚ",
      },
    };

    setForm(sample);
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
            Điền dữ liệu mẫu Đoàn Văn Dũng
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
        <Field required type="date" label="Ngày ban hành" value={form.document.issueDate} onChange={(value) => updateField("document", "issueDate", value)} />
      </SectionCard>

      <SectionCard title="3. Quyết định khởi tố vụ án">
        <Field required label="Số quyết định" value={form.caseDecision.decisionNo} onChange={(value) => updateField("caseDecision", "decisionNo", value)} />
        <Field required type="date" label="Ngày quyết định" value={form.caseDecision.issueDate} onChange={(value) => updateField("caseDecision", "issueDate", value)} />
        <Field required multiline className="md:col-span-2" label="Cơ quan ban hành" value={form.caseDecision.issuedBy} onChange={(value) => updateField("caseDecision", "issuedBy", value)} />
      </SectionCard>

      <SectionCard title="4. Quyết định khởi tố bị can">
        <Field required label="Số quyết định" value={form.accusedDecision.decisionNo} onChange={(value) => updateField("accusedDecision", "decisionNo", value)} />
        <Field required type="date" label="Ngày quyết định" value={form.accusedDecision.issueDate} onChange={(value) => updateField("accusedDecision", "issueDate", value)} />
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

      <SectionCard title="5. Tội danh">
        <Field required label="Tội danh" value={form.offense.offenseName} onChange={(value) => updateField("offense", "offenseName", value)} />
        <Field required label="Điều khoản" value={form.offense.legalArticle} onChange={(value) => updateField("offense", "legalArticle", value)} />
        <Field multiline className="md:col-span-2" label="Bộ luật áp dụng" value={form.offense.criminalCodeText} onChange={(value) => updateField("offense", "criminalCodeText", value)} />
      </SectionCard>

      <SectionCard title="6. Thông tin bị can">
        <Field required label="Họ tên" value={form.person.fullName} onChange={(value) => updateField("person", "fullName", value)} />
        <SelectField
          required
          label="Giới tính"
          value={form.person.genderLabel}
          onChange={(value) => updateField("person", "genderLabel", value)}
          options={BM053_GENDER_OPTIONS}
        />
        <Field required label="Tên gọi khác" value={form.person.otherName} onChange={(value) => updateField("person", "otherName", value)} />
        <Field type="date" label="Ngày sinh đầy đủ" value={form.person.dateOfBirth} onChange={(value) => updateField("person", "dateOfBirth", value)} />
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
        <Field required type="date" label="Ngày cấp" value={form.person.identityIssuedDate} onChange={(value) => updateField("person", "identityIssuedDate", value)} />
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

      <SectionCard title="7. Biện pháp cấm đi khỏi nơi cư trú">
        <Field required label="Thời hạn" value={form.measure.durationText} onChange={(value) => updateField("measure", "durationText", value)} />
        <Field required type="date" label="Từ ngày" value={form.measure.fromDate} onChange={(value) => updateField("measure", "fromDate", value)} />
        <Field required type="date" label="Đến ngày" value={form.measure.toDate} onChange={(value) => updateField("measure", "toDate", value)} />
        <Field required multiline className="md:col-span-2" label="Nơi cư trú trong Điều 2" value={form.measure.residencePlace} onChange={(value) => updateField("measure", "residencePlace", value)} />
      </SectionCard>

      <SectionCard title="8. Đơn vị giám sát / Điều 3">
        <Field required multiline className="md:col-span-2" label="Đơn vị quản lý, theo dõi" value={form.monitoring.unitName} onChange={(value) => updateField("monitoring", "unitName", value)} />
        <Field required label="Số điện thoại liên hệ" value={form.monitoring.phone} onChange={(value) => updateField("monitoring", "phone", value)} />
        <Field label="Kiểm sát viên / ghi chú người xử lý" value={form.monitoring.prosecutorName} onChange={(value) => updateField("monitoring", "prosecutorName", value)} />
      </SectionCard>

      <SectionCard title="9. Nơi nhận">
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

      <SectionCard title="10. Chữ ký">
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

      <SectionCard title="11. Phần giao lệnh cuối văn bản">
        <Field multiline className="md:col-span-2" label="Nội dung giao lệnh" value={form.delivery.deliveredAtText} onChange={(value) => updateField("delivery", "deliveredAtText", value)} />
        <Field label="Tiêu đề người nhận lệnh" value={form.delivery.receiverTitle} onChange={(value) => updateField("delivery", "receiverTitle", value)} />
      </SectionCard>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Sau khi lưu, backend sẽ tự tạo các dòng pháp lý như{" "}
            <b>birthInfoLine</b>, <b>identityDocumentLine</b>,{" "}
            <b>legalBasisLine</b>, <b>article2Line</b>.
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