"use client";

/**
 * BM-081 — QĐ thời điểm người bào chữa tham gia tố tụng
 * Stage: KHoi_TO, Group: G02 (BP_NGAN_CHAN). TT 03/2026-VKSTC, Mẫu số 81/HS.
 *
 * Căn cứ: Điều 75, 76 BLTTHS 2015 — thời điểm người bào chữa tham gia tố tụng.
 * Nghiệp vụ: VKS ra QĐ về thời điểm người bào chữa bắt đầu tham gia tố tụng
 * cho bị can trong vụ án hình sự.
 */
import { useEffect, useMemo, useState } from "react";
import {
  BmFormSection,
  BmFieldText,
  BmFieldDate,
  BmFieldTextarea,
  BmFieldSelect,
  BmFormActions,
  BmFormStatus,
  BmFormMetaBar,
  defaultArchiveLine,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

type TextRecord = Record<string, string>;

type Bm081Form = {
  agency: TextRecord;
  document: TextRecord;
  caseInfo: TextRecord;
  defenseLawyer: TextRecord;
  legalBasis: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm081Form;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm081FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_DOCUMENT_CODE = "81/QĐ-VKSKV7";
const DEFAULT_SIGN_MODE = "KT. VIỆN TRƯỞNG";
const DEFAULT_POSITION_TITLE = "PHÓ VIỆN TRƯỞNG";

const EMPTY_FORM: Bm081Form = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
    phone: "",
  },
  document: {
    documentCode: DEFAULT_DOCUMENT_CODE,
    issueDate: "",
  },
  caseInfo: {
    caseNo: "",
    defendantName: "",
  },
  defenseLawyer: {
    lawyerName: "",
    lawyerLicenseNo: "",
    registrationDate: "",
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
    archiveLine: defaultArchiveLine(),
  },
  signature: {
    signMode: DEFAULT_SIGN_MODE,
    positionTitle: DEFAULT_POSITION_TITLE,
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
  { section: "defenseLawyer", field: "lawyerName", label: "Tên người bào chữa" },
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

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function getValue(form: Bm081Form, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown> | null): Bm081Form {
  if (!payload) return EMPTY_FORM;
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const caseInfo = section(payload, "caseInfo");
  const defenseLawyer = section(payload, "defenseLawyer");
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
      documentCode:
        text(document.documentCode || document.documentNo) ||
        DEFAULT_DOCUMENT_CODE,
      issueDate: toDateInput(document.issueDate),
    },
    caseInfo: {
      caseNo: text(caseInfo.caseNo),
      defendantName: text(caseInfo.defendantName || caseInfo.accusedName),
    },
    defenseLawyer: {
      lawyerName: text(defenseLawyer.lawyerName),
      lawyerLicenseNo: text(defenseLawyer.lawyerLicenseNo),
      registrationDate: toDateInput(defenseLawyer.registrationDate),
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
      archiveLine: text(recipients.archiveLine) || defaultArchiveLine(),
    },
    signature: {
      signMode: text(signature.signMode) || DEFAULT_SIGN_MODE,
      positionTitle: text(signature.positionTitle) || DEFAULT_POSITION_TITLE,
      signerName: text(signature.signerName),
    },
  };
}

function fillCustomerSample(): Bm081Form {
  return {
    agency: { ...EMPTY_FORM.agency, parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7", issuePlace: "TP. Hồ Chí Minh" },
    document: { ...EMPTY_FORM.document },
    caseInfo: { ...EMPTY_FORM.caseInfo },
    defenseLawyer: { ...EMPTY_FORM.defenseLawyer },
    legalBasis: { ...EMPTY_FORM.legalBasis },
    measure: { ...EMPTY_FORM.measure },
    recipients: { ...EMPTY_FORM.recipients },
    signature: { ...EMPTY_FORM.signature, signerName: "Người ký mẫu" },
  };
}

function validateForm(form: Bm081Form): string[] {
  return REQUIRED_FIELDS.filter(
    (item) => !getValue(form, item.section, item.field).trim(),
  ).map((item) => item.label);
}

function buildSaveBody(form: Bm081Form) {
  return {
    ...form,
    updatedByName: form.signature.signerName.trim(),
  };
}

export function Bm081FormInputsPanel({
  documentId,
  onSaved,
}: Bm081FormInputsPanelProps) {
  const [form, setForm] = useState<Bm081Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const reloadFromBackend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không tải được payload BM-081. HTTP ${response.status}`,
        );
      }

      const payload = (await response.json()) as Record<string, unknown>;
      setForm(normalizeFormInputs(payload));
      setSavedAt(null);
      setMessage("Đã tải lại dữ liệu BM-081 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được BM-081.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm(fillCustomerSample());
    setMessage("Đã điền dữ liệu mẫu BM-081.");
    setError(null);
  };

  const handleSave = async () => {
    const errors = validateForm(form);
    if (errors.length > 0) {
      setError(`Thiếu dữ liệu bắt buộc: ${errors.join(", ")}`);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Accept: "application/json",
          },
          body: JSON.stringify(buildSaveBody(form)),
        },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không lưu được BM-081. HTTP ${response.status}`,
        );
      }

      setSavedAt(new Date());
      setMessage(
        "Đã lưu dữ liệu BM-081. Dữ liệu vừa nhập đã được đồng bộ lên backend.",
      );

      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được BM-081.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void reloadFromBackend();
  }, [documentId]);

  const updateField = (sectionKey: SectionKey, field: string, value: string) => {
    setForm((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [field]: value,
      },
    }));
  };

  const status = error
    ? { kind: "error" as const, text: error }
    : message
      ? { kind: "success" as const, text: message }
      : validationErrors.length > 0
        ? {
            kind: "warning" as const,
            text: `Thiếu dữ liệu bắt buộc: ${validationErrors.join(", ")}.`,
          }
        : { kind: "idle" as const, text: "" };

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-081"
        title="Dữ liệu biểu mẫu QĐ thời điểm người bào chữa tham gia tố tụng"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 81/HS · Stage KHOI_TO (G02 BP_NGAN_CHAN). Căn cứ Điều 75, 76 BLTTHS 2015."
        isDirty={Boolean(message) || validationErrors.length > 0}
        isLoading={loading}
        isSaving={saving}
        savedAt={savedAt}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-081"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton<Bm081Form>
            templateCode="BM-081"
            form={form}
            onApply={(next) => setForm(next)}
          />
        }
        meta={
          <button
            type="button"
            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-60"
            onClick={handleFillSample}
            disabled={loading || saving}
          >
            Điền dữ liệu mẫu
          </button>
        }
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus
          kind={status.kind}
          title={
            status.kind === "success"
              ? "Thành công"
              : status.kind === "error"
                ? "Lỗi"
                : status.kind === "warning"
                  ? "Thiếu dữ liệu"
                  : undefined
          }
        >
          {status.text}
        </BmFormStatus>
      )}

      <BmFormSection
        title="1. Cơ quan ban hành"
        description="Thông tin Viện kiểm sát ban hành QĐ về thời điểm người bào chữa tham gia tố tụng."
      >
        <BmFieldText
          label="Cơ quan cấp trên"
          required
          value={form.agency.parentName}
          onChange={(v) => updateField("agency", "parentName", v)}
        />

        <BmFieldText
          label="Cơ quan ban hành"
          required
          value={form.agency.name}
          onChange={(v) => updateField("agency", "name", v)}
        />

        <BmFieldText
          label="Địa danh"
          required
          value={form.agency.issuePlace}
          onChange={(v) => updateField("agency", "issuePlace", v)}
        />

        <BmFieldText
          label="Điện thoại"
          value={form.agency.phone}
          onChange={(v) => updateField("agency", "phone", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="2. Thông tin quyết định"
        description="Số hiệu và ngày ban hành QĐ."
      >
        <BmFieldText
          label="Số quyết định"
          required
          value={form.document.documentCode}
          onChange={(v) => updateField("document", "documentCode", v)}
        />

        <BmFieldDate
          label="Ngày ban hành"
          required
          value={form.document.issueDate}
          onChange={(v) => updateField("document", "issueDate", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="3. Thông tin vụ án"
        description="Thông tin vụ án hình sự mà người bào chữa tham gia."
      >
        <BmFieldText
          label="Số vụ án"
          required
          value={form.caseInfo.caseNo}
          onChange={(v) => updateField("caseInfo", "caseNo", v)}
        />

        <BmFieldText
          label="Tên bị can"
          required
          value={form.caseInfo.defendantName}
          onChange={(v) => updateField("caseInfo", "defendantName", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="4. Thông tin người bào chữa"
        description="Thông tin người bào chữa và ngày đăng ký tham gia tố tụng."
        fullWidth
      >
        <BmFieldText
          label="Tên người bào chữa"
          required
          value={form.defenseLawyer.lawyerName}
          onChange={(v) => updateField("defenseLawyer", "lawyerName", v)}
        />

        <BmFieldText
          label="Số GCN bào chữa"
          value={form.defenseLawyer.lawyerLicenseNo}
          onChange={(v) => updateField("defenseLawyer", "lawyerLicenseNo", v)}
        />

        <BmFieldDate
          label="Ngày đăng ký bào chữa"
          value={form.defenseLawyer.registrationDate}
          onChange={(v) => updateField("defenseLawyer", "registrationDate", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="5. Căn cứ và nội dung quyết định"
        description="Căn cứ pháp lý và nội dung các Điều trong QĐ."
        fullWidth
      >
        <BmFieldTextarea
          label="Điều khoản tố tụng"
          rows={2}
          value={form.legalBasis.procedureArticlesLine}
          onChange={(v) => updateField("legalBasis", "procedureArticlesLine", v)}
          fullWidth
        />

        <BmFieldTextarea
          label="Nội dung Điều 1"
          required
          rows={3}
          value={form.measure.article1Line}
          onChange={(v) => updateField("measure", "article1Line", v)}
          fullWidth
        />

        <BmFieldTextarea
          label="Nội dung Điều 2"
          rows={3}
          value={form.measure.article2Line}
          onChange={(v) => updateField("measure", "article2Line", v)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="6. Nơi nhận"
        fullWidth
      >
        <BmFieldTextarea
          label="Nơi nhận"
          rows={2}
          value={form.recipients.primaryLine}
          onChange={(v) => updateField("recipients", "primaryLine", v)}
          fullWidth
        />

        <BmFieldText
          label="Lưu"
          value={form.recipients.archiveLine}
          onChange={(v) => updateField("recipients", "archiveLine", v)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="7. Chữ ký"
        description="Chế độ ký, chức vụ và người ký QĐ."
      >
        <BmFieldSelect
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(v) => updateField("signature", "signMode", v)}
          options={SIGN_MODE_OPTIONS}
          placeholder="-- Chọn --"
        />

        <BmFieldSelect
          label="Chức vụ"
          value={form.signature.positionTitle}
          onChange={(v) => updateField("signature", "positionTitle", v)}
          options={POSITION_OPTIONS}
          placeholder="-- Chọn --"
        />

        <BmFieldText
          label="Người ký"
          required
          value={form.signature.signerName}
          onChange={(v) => updateField("signature", "signerName", v)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-081"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
