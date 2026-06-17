"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm084FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  caseInfo: TextRecord;
  changeInfo: TextRecord;
  legalBasis: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm084FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm084FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm084FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
    phone: "",
  },
  document: {
    documentCode: "84/QĐ-VKSKV7",
    issueDate: "",
    issuePlaceAndDateLine: "",
  },
  caseInfo: {
    caseNo: "",
    defendantName: "",
  },
  changeInfo: {
    changeType: "",
    oldPersonName: "",
    oldPersonTitle: "",
    oldPersonOrganization: "",
    newPersonName: "",
    newPersonTitle: "",
    newPersonOrganization: "",
    reason: "",
  },
  legalBasis: {
    procedureArticlesLine: "",
  },
  measure: {
    article1Line: "",
    article2Line: "",
  },
  recipients: {
    primaryLine: "",
    archiveLine: "- Lưu: HSVV, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Cơ quan ban hành" },
  { section: "agency", field: "issuePlace", label: "Địa danh" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issueDate", label: "Ngày ban hành" },
  { section: "caseInfo", field: "caseNo", label: "Số vụ án" },
  { section: "caseInfo", field: "defendantName", label: "Tên bị can" },
  { section: "changeInfo", field: "oldPersonName", label: "Người cũ" },
  { section: "changeInfo", field: "newPersonName", label: "Người mới" },
  { section: "measure", field: "article1Line", label: "Nội dung Điều 1" },
  { section: "signature", field: "signerName", label: "Người ký" },
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

function getValue(form: Bm084FormInputs, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm084FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const caseInfo = section(payload, "caseInfo");
  const changeInfo = section(payload, "changeInfo");
  const legalBasis = section(payload, "legalBasis");
  const measure = section(payload, "measure");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  return {
    agency: {
      parentName: text(agency.parentName),
      name: text(agency.name),
      issuePlace: text(agency.issuePlace),
      phone: text(agency.phone),
    },
    document: {
      documentCode: text(document.documentCode || document.documentNo || "84/QĐ-VKSKV7"),
      issueDate: toDateInput(document.issueDate),
      issuePlaceAndDateLine: text(document.issuePlaceAndDateLine),
    },
    caseInfo: {
      caseNo: text(caseInfo.caseNo),
      defendantName: text(caseInfo.defendantName || caseInfo.accusedName),
    },
    changeInfo: {
      changeType: text(changeInfo.changeType),
      oldPersonName: text(changeInfo.oldPersonName),
      oldPersonTitle: text(changeInfo.oldPersonTitle),
      oldPersonOrganization: text(changeInfo.oldPersonOrganization),
      newPersonName: text(changeInfo.newPersonName),
      newPersonTitle: text(changeInfo.newPersonTitle),
      newPersonOrganization: text(changeInfo.newPersonOrganization),
      reason: text(changeInfo.reason),
    },
    legalBasis: {
      procedureArticlesLine: text(legalBasis.procedureArticlesLine),
    },
    measure: {
      article1Line: text(measure.article1Line),
      article2Line: text(measure.article2Line),
    },
    recipients: {
      primaryLine: text(recipients.primaryLine || recipients.investigationUnitLine),
      archiveLine: text(recipients.archiveLine) || "- Lưu: HSVV, HSKS, VP.",
    },
    signature: {
      signMode: text(signature.signMode) || "KT. VIỆN TRƯỞNG",
      positionTitle: text(signature.positionTitle) || "PHÓ VIỆN TRƯỞNG",
      signerName: text(signature.signerName),
    },
  };
}

async function getBm084RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(`Không tải được payload BM-084. HTTP ${response.status}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

async function saveBm084FormInputs(
  documentId: string | number,
  form: Bm084FormInputs,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", Accept: "application/json" },
      body: JSON.stringify({ ...form, updatedByName: form.signature.signerName }),
    },
  );
  if (!response.ok) {
    throw new Error(`Không lưu được BM-084. HTTP ${response.status}`);
  }
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  multiline,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "date";
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
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">-- Chọn --</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function Bm084FormInputsPanel({ documentId, onSaved }: Bm084FormInputsPanelProps) {
  const [form, setForm] = useState<Bm084FormInputs>(EMPTY_FORM);
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

  function loadForm() {
    setIsLoading(true);
    setErrorMessage("");
    getBm084RenderPayload(documentId)
      .then((payload) => {
        const nextForm = normalizeFormInputs(payload);
        setForm(nextForm);
        setInitialSnapshot(JSON.stringify(nextForm));
        setSavedAt(null);
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Không tải được BM-084"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { void loadForm(); }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => {
      const next: Bm084FormInputs = {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [field]: value,
        },
      };
      return next;
    });
  }

  function handleSave() {
    setIsSaving(true);
    setErrorMessage("");
    saveBm084FormInputs(documentId, form)
      .then(() => {
        setInitialSnapshot(currentSnapshot);
        setSavedAt(new Date());
        onSaved?.();
      })
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Không lưu được BM-084"))
      .finally(() => setIsSaving(false));
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-084...</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">BM-084</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">QĐ thay đổi người giám định, người định giá tài sản</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Form nhập dữ liệu cho Quyết định thay đổi người giám định, người định giá tài sản trong tố tụng hình sự.
              Dữ liệu gồm thông tin vụ án, người giám định cũ, người mới và lý do thay đổi.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:items-end">
            <span className={isDirty ? "font-semibold text-amber-700" : "font-semibold text-emerald-700"}>
              {isDirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
            </span>
            {savedAt ? <span className="text-xs text-slate-500">Lưu lúc {savedAt.toLocaleTimeString("vi-VN")}</span> : null}
          </div>
        </div>
        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}
        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">Còn thiếu {missingFields.length} trường quan trọng: {missingFields.map((item) => item.label).join(", ")}</p>
          </div>
        ) : null}
      </section>

      <SectionCard title="1. Cơ quan ban hành">
        <Field required label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(v) => updateField("agency", "parentName", v)} />
        <Field required label="Cơ quan ban hành" value={form.agency.name} onChange={(v) => updateField("agency", "name", v)} />
        <Field label="Địa danh" value={form.agency.issuePlace} onChange={(v) => updateField("agency", "issuePlace", v)} />
        <Field label="Điện thoại" value={form.agency.phone} onChange={(v) => updateField("agency", "phone", v)} />
      </SectionCard>

      <SectionCard title="2. Thông tin quyết định">
        <Field required label="Số quyết định" value={form.document.documentCode} onChange={(v) => updateField("document", "documentCode", v)} />
        <Field required type="date" label="Ngày ban hành" value={form.document.issueDate} onChange={(v) => updateField("document", "issueDate", v)} />
      </SectionCard>

      <SectionCard title="3. Thông tin vụ án">
        <Field required label="Số vụ án" value={form.caseInfo.caseNo} onChange={(v) => updateField("caseInfo", "caseNo", v)} />
        <Field required label="Tên bị can" value={form.caseInfo.defendantName} onChange={(v) => updateField("caseInfo", "defendantName", v)} />
      </SectionCard>

      <SectionCard title="4. Thông tin thay đổi người giám định/định giá">
        <Field required label="Người cũ" value={form.changeInfo.oldPersonName} onChange={(v) => updateField("changeInfo", "oldPersonName", v)} />
        <Field label="Chức danh người cũ" value={form.changeInfo.oldPersonTitle} onChange={(v) => updateField("changeInfo", "oldPersonTitle", v)} />
        <Field label="Cơ quan người cũ" value={form.changeInfo.oldPersonOrganization} onChange={(v) => updateField("changeInfo", "oldPersonOrganization", v)} />
        <Field required label="Người mới" value={form.changeInfo.newPersonName} onChange={(v) => updateField("changeInfo", "newPersonName", v)} />
        <Field label="Chức danh người mới" value={form.changeInfo.newPersonTitle} onChange={(v) => updateField("changeInfo", "newPersonTitle", v)} />
        <Field label="Cơ quan người mới" value={form.changeInfo.newPersonOrganization} onChange={(v) => updateField("changeInfo", "newPersonOrganization", v)} />
        <Field multiline className="md:col-span-2" label="Lý do thay đổi" value={form.changeInfo.reason} onChange={(v) => updateField("changeInfo", "reason", v)} />
      </SectionCard>

      <SectionCard title="5. Căn cứ và nội dung quyết định">
        <Field multiline className="md:col-span-2" label="Điều khoản tố tụng" value={form.legalBasis.procedureArticlesLine} onChange={(v) => updateField("legalBasis", "procedureArticlesLine", v)} />
        <Field required multiline className="md:col-span-2" label="Nội dung Điều 1" value={form.measure.article1Line} onChange={(v) => updateField("measure", "article1Line", v)} />
        <Field multiline className="md:col-span-2" label="Nội dung Điều 2" value={form.measure.article2Line} onChange={(v) => updateField("measure", "article2Line", v)} />
      </SectionCard>

      <SectionCard title="6. Nơi nhận">
        <Field multiline className="md:col-span-2" label="Nơi nhận" value={form.recipients.primaryLine} onChange={(v) => updateField("recipients", "primaryLine", v)} />
        <Field className="md:col-span-2" label="Lưu" value={form.recipients.archiveLine} onChange={(v) => updateField("recipients", "archiveLine", v)} />
      </SectionCard>

      <SectionCard title="7. Chữ ký">
        <SelectField label="Chế độ ký" value={form.signature.signMode} onChange={(v) => updateField("signature", "signMode", v)} options={SIGN_MODE_OPTIONS} />
        <SelectField label="Chức vụ" value={form.signature.positionTitle} onChange={(v) => updateField("signature", "positionTitle", v)} options={POSITION_OPTIONS} />
        <Field required label="Người ký" value={form.signature.signerName} onChange={(v) => updateField("signature", "signerName", v)} />
      </SectionCard>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            {savedAt ? <span>Đã lưu lúc <strong>{savedAt.toLocaleTimeString("vi-VN")}</strong></span> : <span>Chưa lưu thay đổi.</span>}
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-084"}
          </button>
        </div>
      </div>
    </div>
  );
}
