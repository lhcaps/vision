"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type Bm001FormInputs,
  EMPTY_BM001_FORM_INPUTS,
  getBm001RenderPayload,
  normalizeBm001FormInputs,
  saveBm001FormInputs,
} from "@/lib/bm001-form-inputs-api";
import {
  BM001_AGENCY_OPTIONS,
  BM001_GENDER_OPTIONS,
  BM001_RECEIVER_OPTIONS,
} from "@/lib/bm001-options";

type Bm001FormInputsProps = {
  documentId: string | number;
  onSaved?: () => void;
};

type SectionKey = keyof Bm001FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Viện kiểm sát tiếp nhận" },
  { section: "agency", field: "issuePlace", label: "Địa danh" },
  { section: "document", field: "issueDate", label: "Ngày lập biên bản" },
  { section: "reception", field: "startedAtTimeText", label: "Giờ bắt đầu tiếp nhận" },
  { section: "reception", field: "startedAtDate", label: "Ngày bắt đầu tiếp nhận" },
  { section: "reception", field: "locationName", label: "Địa điểm tiếp nhận" },
  { section: "reception", field: "endedAtTimeText", label: "Giờ kết thúc tiếp nhận" },
  { section: "reception", field: "endedAtDate", label: "Ngày kết thúc tiếp nhận" },
  { section: "receiver", field: "fullName", label: "Người tiếp nhận" },
  { section: "receiver", field: "positionTitle", label: "Chức danh người tiếp nhận" },
  { section: "receiver", field: "departmentName", label: "Đơn vị công tác" },
  { section: "informant", field: "fullName", label: "Họ tên người cung cấp nguồn tin" },
  { section: "informant", field: "genderLabel", label: "Giới tính" },
  { section: "informant", field: "otherName", label: "Tên gọi khác" },
  { section: "informant", field: "placeOfBirth", label: "Nơi sinh" },
  { section: "informant", field: "nationality", label: "Quốc tịch" },
  { section: "informant", field: "occupation", label: "Nghề nghiệp" },
  { section: "informant", field: "currentAddress", label: "Nơi ở hiện tại" },
  { section: "crimeReport", field: "content", label: "Nội dung nguồn tin" },
  { section: "crimeReport", field: "attachedItemsDescription", label: "Tài liệu, đồ vật giao nộp" },
  { section: "recipients", field: "archiveLine", label: "Dòng lưu" },
];

function getFieldValue(
  form: Bm001FormInputs,
  section: SectionKey,
  field: string,
): string {
  const sectionValue = form[section] as Record<string, string>;
  return sectionValue[field] ?? "";
}

/* ============================================================
   BM001_DATE_FIELD_COMPONENT
   Real React date control: Ngày / Tháng / Năm.
   Keeps stored value as ISO yyyy-MM-dd for backend compatibility.
   ============================================================ */

function parseBm001DateValue(value: string): {
  day: string;
  month: string;
  year: string;
} {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return { day: "", month: "", year: "" };
  }

  const iso = raw.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (iso) {
    return {
      year: iso[1],
      month: iso[2],
      day: iso[3],
    };
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    const year = slash[3];

    // Browser display may be mm/dd/yyyy. If first > 12, treat as dd/mm/yyyy.
    if (first > 12) {
      return {
        day: String(first).padStart(2, "0"),
        month: String(second).padStart(2, "0"),
        year,
      };
    }

    return {
      day: String(second).padStart(2, "0"),
      month: String(first).padStart(2, "0"),
      year,
    };
  }

  return { day: "", month: "", year: "" };
}

function buildBm001IsoDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function Bm001DateField({
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
  const createDraft = (inputValue: string) => {
    const parsed = parseBm001DateValue(inputValue);

    return {
      day: parsed.day,
      month: parsed.month,
      year: parsed.year,
      committedValue: inputValue || "",
      isEditing: false,
    };
  };

  const [draft, setDraft] = useState(() => createDraft(value));

  useEffect(() => {
    const externalValue = value || "";

    setDraft((current) => {
      const currentIso = buildBm001IsoDate(
        current.day,
        current.month,
        current.year,
      );

      // Không reset khi user đang chọn ngày rỗng/từng phần.
      if (
        current.isEditing ||
        externalValue === current.committedValue ||
        externalValue === currentIso
      ) {
        return current;
      }

      return createDraft(externalValue);
    });
  }, [value]);

  const currentYear = new Date().getFullYear();

  const days = Array.from({ length: 31 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const months = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

  const years = Array.from(
    { length: currentYear + 2 - 1900 + 1 },
    (_, index) => String(currentYear + 2 - index),
  );

  const update = (
    patch: Partial<{
      day: string;
      month: string;
      year: string;
    }>,
  ) => {
    const next = {
      ...draft,
      ...patch,
      isEditing: true,
    };

    if (next.day && next.month && next.year) {
      const iso = buildBm001IsoDate(next.day, next.month, next.year);

      setDraft({
        ...next,
        committedValue: iso,
        isEditing: false,
      });

      // Quan trọng: gọi onChange sau setDraft, không gọi bên trong setDraft updater.
      // Nếu gọi bên trong updater, React sẽ báo:
      // Cannot update Bm001FormInputsPanel while rendering Bm001DateField.
      onChange(iso);

      return;
    }

    // Quan trọng: không gọi onChange("") khi mới chọn 1 phần.
    // Nếu gọi, React sẽ render lại và reset dropdown về Ngày/Tháng/Năm.
    setDraft(next);
  };

  const clear = () => {
    const next = {
      day: "",
      month: "",
      year: "",
      committedValue: "",
      isEditing: false,
    };

    setDraft(next);
    onChange("");
  };

  const selectClass =
    "h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>

      <div className="grid grid-cols-[1fr_1fr_1.3fr_auto] gap-2">
        <select
          value={draft.day}
          onChange={(event) => update({ day: event.target.value })}
          className={selectClass}
        >
          <option value="">Ngày</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <select
          value={draft.month}
          onChange={(event) => update({ month: event.target.value })}
          className={selectClass}
        >
          <option value="">Tháng</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <select
          value={draft.year}
          onChange={(event) => update({ year: event.target.value })}
          className={selectClass}
        >
          <option value="">Năm</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={clear}
          className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          title="Xóa ngày"
        >
          Xóa
        </button>
      </div>
    </label>
  );
}
function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  multiline,
  rows = 3,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "date" | "tel";
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}) {
  if (!multiline && type === "date") {
    return (
      <Bm001DateField
        label={label}
        value={value}
        onChange={onChange}
        required={required}
        className={className}
      />
    );
  }

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
          rows={rows}
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


/* ============================================================
   BM001_LOCAL_FORM_PERSISTENCE
   Prevent BE seed/default from overwriting user's saved inputs on reload.
   ============================================================ */

function bm001LocalStorageKey(documentId: string | number): string {
  return `quanlyvks:bm001:formInputs:${documentId}`;
}

function readBm001SavedForm(documentId: string | number): Bm001FormInputs | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(bm001LocalStorageKey(documentId));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Bm001FormInputs;
  } catch {
    return null;
  }
}

function writeBm001SavedForm(
  documentId: string | number,
  formInputs: Bm001FormInputs,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    bm001LocalStorageKey(documentId),
    JSON.stringify(formInputs),
  );
}

function mergeBm001Forms(
  backendForm: Bm001FormInputs,
  savedForm: Bm001FormInputs | null,
): Bm001FormInputs {
  if (!savedForm) {
    return backendForm;
  }

  return {
    ...backendForm,
    ...savedForm,
    agency: {
      ...backendForm.agency,
      ...savedForm.agency,
    },
    document: {
      ...backendForm.document,
      ...savedForm.document,
    },
    reception: {
      ...backendForm.reception,
      ...savedForm.reception,
    },
    receiver: {
      ...backendForm.receiver,
      ...savedForm.receiver,
    },
    informant: {
      ...backendForm.informant,
      ...savedForm.informant,
    },
    crimeReport: {
      ...backendForm.crimeReport,
      ...savedForm.crimeReport,
    },
    recipients: {
      ...backendForm.recipients,
      ...savedForm.recipients,
    },
  };
}
export function Bm001FormInputsPanel({
  documentId,
  onSaved,
}: Bm001FormInputsProps) {
  const [form, setForm] = useState<Bm001FormInputs>(EMPTY_BM001_FORM_INPUTS);
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
      const payload = await getBm001RenderPayload(documentId);
      const backendForm = normalizeBm001FormInputs(payload);
      const savedForm = readBm001SavedForm(documentId);
      const nextForm = mergeBm001Forms(backendForm, savedForm);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
      setSavedAt(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu biểu mẫu BM-001.",
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
      const next: Bm001FormInputs = {
        ...current,
        [section]: {
          ...current[section],
          [field]: value,
        },
      };

      if (section === "agency" && field === "name") {
        next.reception = {
          ...next.reception,
          locationName: next.reception.locationName || value,
        };
        next.receiver = {
          ...next.receiver,
          departmentName: next.receiver.departmentName || value,
        };
      }

      if (section === "document" && field === "issueDate") {
        next.reception = {
          ...next.reception,
          startedAtDate: next.reception.startedAtDate || value,
          endedAtDate: next.reception.endedAtDate || value,
        };
      }

      if (section === "receiver" && field === "fullName") {
        next.receiver = {
          ...next.receiver,
          signerName: value.trim() ? value.trim() : next.receiver.signerName,
        };
      }

      if (section === "informant" && field === "fullName") {
        next.informant = {
          ...next.informant,
          signerName: value.trim() ? value.trim() : next.informant.signerName,
        };
      }

      if (section === "informant" && field === "dateOfBirth") {
        const year = value.match(/^(\d{4})-\d{2}-\d{2}$/)?.[1] ?? "";
        next.informant = {
          ...next.informant,
          birthYear: year || next.informant.birthYear,
        };
      }

      return next;
    });
  }

  function handleSelectAgency(value: string) {
    const option = BM001_AGENCY_OPTIONS.find((item) => item.id === value);
    if (!option) return;

    setForm((current) => ({
      ...current,
      agency: {
        parentName: option.parentName,
        name: option.name,
        issuePlace: option.issuePlace,
      },
      reception: {
        ...current.reception,
        locationName: current.reception.locationName || option.name,
      },
      receiver: {
        ...current.receiver,
        departmentName: current.receiver.departmentName || option.name,
      },
    }));
  }

  function handleSelectReceiver(value: string) {
    const option = BM001_RECEIVER_OPTIONS.find((item) => item.id === value);
    if (!option) return;

    setForm((current) => ({
      ...current,
      receiver: {
        ...current.receiver,
        fullName: option.fullName,
        positionTitle: option.positionTitle,
        signerName: option.signerName,
      },
    }));
  }

  function fillCustomerSample() {
    const sample: Bm001FormInputs = {
      agency: {
        parentName: "",
        name: "",
        issuePlace: "TP. Hồ Chí Minh",
      },
      document: {
        issueDate: "2026-03-04",
      },
      reception: {
        startedAtTimeText: "08 giờ 00 phút",
        startedAtDate: "2026-03-04",
        locationName: "Viện kiểm sát nhân dân khu vực 7",
        endedAtTimeText: "08 giờ 30 phút",
        endedAtDate: "2026-03-04",
      },
      receiver: {
        fullName: "Nguyễn Thị Hồng Hạnh",
        positionTitle: "Kiểm sát viên",
        departmentName: "Viện kiểm sát nhân dân khu vực 7",
        signerName: "",
      },
      informant: {
        fullName: "",
        genderLabel: "Nam",
        otherName: "Không có",
        dateOfBirth: "1985-09-08",
        birthYear: "1985",
        placeOfBirth: "tỉnh Quảng Ngãi",
        nationality: "Việt Nam",
        ethnicity: "Kinh",
        religion: "Không",
        occupation: "Kinh doanh",
        identityNo: "051080000314",
        identityIssuedDate: "2021-12-22",
        identityIssuedPlace:
          "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
        permanentAddress:
          "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
        temporaryAddress: "",
        currentAddress:
          "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
        phone: "",
        representedOrganization: "Không",
        signerName: "Nguyễn Thị Hồng Hạnh",
      },
      crimeReport: {
        content:
          "Ông  cung cấp nguồn tin về hành vi đánh bạc trái phép xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh.",
        attachedItemsDescription:
          "01 bản tường trình; 01 bản sao giấy tờ tùy thân; các tài liệu liên quan khác nếu có.",
      },
      recipients: {
        archiveLine: "Lưu: HSVV, VP.",
      },
    };

    setForm(sample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const savedPayload = await saveBm001FormInputs(documentId, form);
      const savedForm = normalizeBm001FormInputs(savedPayload);

      writeBm001SavedForm(documentId, savedForm);

      setForm(savedForm);
      setInitialSnapshot(JSON.stringify(savedForm));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không lưu được dữ liệu biểu mẫu BM-001.",
      );
    } finally {
      setIsSaving(false);
    }
  }
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-001...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              BM-001
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Dữ liệu biểu mẫu Biên bản tiếp nhận nguồn tin về tội phạm
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form này chỉ phục vụ BM-001: thời gian tiếp nhận, người tiếp nhận,
              người cung cấp nguồn tin, nội dung nguồn tin, tài liệu giao nộp và
              phần ký biên bản. Không dùng logic của BM-053/BM-097.
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
              Còn thiếu {missingFields.length} trường cần nhập để render đầy đủ:
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {missingFields.map((item) => item.label).join(", ")}
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Các trường quan trọng của BM-001 đã được nhập đủ.
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Điền dữ liệu mẫu BM-001
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

      <SectionCard title="1. Cơ quan lập biên bản">
        <SelectField
          label="Chọn nhanh cơ quan"
          value=""
          onChange={handleSelectAgency}
          options={BM001_AGENCY_OPTIONS.map((option) => ({
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
          label="Viện kiểm sát tiếp nhận"
          required
          value={form.agency.name}
          onChange={(value) => updateField("agency", "name", value)}
        />
        <Field
          label="Địa danh"
          required
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value)}
        />
        <Field
          label="Ngày lập biên bản"
          type="date"
          required
          value={form.document.issueDate}
          onChange={(value) => updateField("document", "issueDate", value)}
        />
      </SectionCard>

      <SectionCard title="2. Thời gian / địa điểm tiếp nhận">
        <Field
          label="Giờ bắt đầu"
          required
          placeholder="08 giờ 00 phút"
          value={form.reception.startedAtTimeText}
          onChange={(value) =>
            updateField("reception", "startedAtTimeText", value)
          }
        />
        <Field
          label="Ngày bắt đầu"
          type="date"
          required
          value={form.reception.startedAtDate}
          onChange={(value) => updateField("reception", "startedAtDate", value)}
        />
        <Field
          label="Địa điểm tiếp nhận"
          required
          value={form.reception.locationName}
          onChange={(value) => updateField("reception", "locationName", value)}
          className="md:col-span-2"
        />
        <Field
          label="Giờ kết thúc"
          required
          placeholder="08 giờ 30 phút"
          value={form.reception.endedAtTimeText}
          onChange={(value) =>
            updateField("reception", "endedAtTimeText", value)
          }
        />
        <Field
          label="Ngày kết thúc"
          type="date"
          required
          value={form.reception.endedAtDate}
          onChange={(value) => updateField("reception", "endedAtDate", value)}
        />
      </SectionCard>

      <SectionCard title="3. Người tiếp nhận">
        <SelectField
          label="Chọn nhanh người tiếp nhận"
          value=""
          onChange={handleSelectReceiver}
          options={BM001_RECEIVER_OPTIONS.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
          className="md:col-span-2"
        />
        <Field
          label="Họ tên người tiếp nhận"
          required
          value={form.receiver.fullName}
          onChange={(value) => updateField("receiver", "fullName", value)}
        />
        <Field
          label="Chức danh"
          required
          value={form.receiver.positionTitle}
          onChange={(value) => updateField("receiver", "positionTitle", value)}
        />
        <Field
          label="Đơn vị công tác"
          required
          value={form.receiver.departmentName}
          onChange={(value) => updateField("receiver", "departmentName", value)}
          className="md:col-span-2"
        />
        <Field
          label="Tên ký phần người tiếp nhận"
          value={form.receiver.signerName}
          onChange={(value) => updateField("receiver", "signerName", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="4. Người cung cấp nguồn tin">
        <Field
          label="Họ tên"
          required
          value={form.informant.fullName}
          onChange={(value) => updateField("informant", "fullName", value)}
        />
        <SelectField
          label="Giới tính"
          required
          value={form.informant.genderLabel}
          onChange={(value) => updateField("informant", "genderLabel", value)}
          options={BM001_GENDER_OPTIONS}
        />
        <Field
          label="Tên gọi khác"
          required
          value={form.informant.otherName}
          onChange={(value) => updateField("informant", "otherName", value)}
        />
        <Field
          label="Ngày sinh đầy đủ"
          type="date"
          value={form.informant.dateOfBirth}
          onChange={(value) => updateField("informant", "dateOfBirth", value)}
        />
        <Field
          label="Năm sinh nếu không rõ ngày/tháng"
          value={form.informant.birthYear}
          onChange={(value) => updateField("informant", "birthYear", value)}
        />
        <Field
          label="Nơi sinh"
          value={form.informant.placeOfBirth}
          onChange={(value) => updateField("informant", "placeOfBirth", value)}
        />
        <Field
          label="Quốc tịch"
          required
          value={form.informant.nationality}
          onChange={(value) => updateField("informant", "nationality", value)}
        />
        <Field
          label="Dân tộc"
          required
          value={form.informant.ethnicity}
          onChange={(value) => updateField("informant", "ethnicity", value)}
        />
        <Field
          label="Tôn giáo"
          required
          value={form.informant.religion}
          onChange={(value) => updateField("informant", "religion", value)}
        />
        <Field
          label="Nghề nghiệp"
          required
          value={form.informant.occupation}
          onChange={(value) => updateField("informant", "occupation", value)}
        />
        <Field
          label="Số CMND/CCCD/Hộ chiếu"
          value={form.informant.identityNo}
          onChange={(value) => updateField("informant", "identityNo", value)}
        />
        <Field
          label="Ngày cấp"
          type="date"
          value={form.informant.identityIssuedDate}
          onChange={(value) =>
            updateField("informant", "identityIssuedDate", value)
          }
        />
        <Field
          label="Nơi cấp"
          value={form.informant.identityIssuedPlace}
          onChange={(value) =>
            updateField("informant", "identityIssuedPlace", value)
          }
          className="md:col-span-2"
        />
        <Field
          label="Nơi thường trú"
          multiline
          value={form.informant.permanentAddress}
          onChange={(value) =>
            updateField("informant", "permanentAddress", value)
          }
          className="md:col-span-2"
        />
        <Field
          label="Nơi tạm trú"
          multiline
          value={form.informant.temporaryAddress}
          onChange={(value) =>
            updateField("informant", "temporaryAddress", value)
          }
          className="md:col-span-2"
        />
        <Field
          label="Nơi ở hiện tại"
          required
          multiline
          value={form.informant.currentAddress}
          onChange={(value) => updateField("informant", "currentAddress", value)}
          className="md:col-span-2"
        />
        <Field
          label="Số điện thoại"
          type="tel"
          value={form.informant.phone}
          onChange={(value) => updateField("informant", "phone", value)}
        />
        <Field
          label="Đại diện cơ quan/tổ chức nếu có"
          value={form.informant.representedOrganization}
          onChange={(value) =>
            updateField("informant", "representedOrganization", value)
          }
        />
        <Field
          label="Tên ký phần người cung cấp nguồn tin"
          value={form.informant.signerName}
          onChange={(value) => updateField("informant", "signerName", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="5. Nội dung nguồn tin về tội phạm">
        <Field
          label="Nội dung nguồn tin"
          required
          multiline
          rows={6}
          value={form.crimeReport.content}
          onChange={(value) => updateField("crimeReport", "content", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="6. Tài liệu, đồ vật giao nộp kèm theo">
        <Field
          label="Tài liệu, đồ vật giao nộp"
          required
          multiline
          rows={4}
          value={form.crimeReport.attachedItemsDescription}
          onChange={(value) =>
            updateField("crimeReport", "attachedItemsDescription", value)
          }
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="7. Dòng lưu hồ sơ">
        <Field
          label="Dòng lưu"
          required
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Sau khi lưu, render lại DOCX/PDF để dữ liệu BM-001 thay vào đúng
            template biên bản tiếp nhận nguồn tin.
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-001"}
          </button>
        </div>
      </div>
    </div>
  );
}







