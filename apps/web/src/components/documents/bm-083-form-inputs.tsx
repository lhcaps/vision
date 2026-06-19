"use client";

/**
 * BM-083 — Yêu cầu thay đổi người giám định, người định giá tài sản
 * Stage: KHoi_TO, Group: G02 (BP_NGAN_CHAN). TT 03/2026-VKSTC, Mẫu số 83/HS.
 *
 * Căn cứ: Điều 206, 207 BLTTHS 2015 — yêu cầu thay đổi người giám định / định giá.
 * Nghiệp vụ: VKS yêu cầu thay đổi người giám định / người định giá tài sản
 * khi có căn cứ cho rằng người giám định không vô tư, không đủ năng lực
 * hoặc vi phạm pháp luật.
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

type Bm083Form = {
  agency: TextRecord;
  document: TextRecord;
  request: TextRecord;
  caseInfo: TextRecord;
  expert: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm083Form;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm083FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_DOCUMENT_CODE = "83/YCU-VKSKV7";
const DEFAULT_SIGN_MODE = "KT. VIỆN TRƯỞNG";
const DEFAULT_POSITION_TITLE = "PHÓ VIỆN TRƯỞNG";

const EMPTY_FORM: Bm083Form = {
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
  request: {
    caseNo: "",
    caseDecisionNo: "",
    caseDecisionIssueDate: "",
    reason: "",
    requestedUnitName: "",
  },
  caseInfo: {
    defendantName: "",
    offenseName: "",
    legalArticle: "",
  },
  expert: {
    expertName: "",
    expertTitle: "",
    expertOrganization: "",
    reason: "",
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
  { section: "document", field: "documentCode", label: "Số yêu cầu" },
  { section: "document", field: "issueDate", label: "Ngày yêu cầu" },
  { section: "request", field: "caseNo", label: "Số vụ án" },
  { section: "caseInfo", field: "defendantName", label: "Tên bị can" },
  { section: "caseInfo", field: "offenseName", label: "Tội danh" },
  { section: "expert", field: "expertName", label: "Tên người giám định/định giá" },
  { section: "expert", field: "reason", label: "Lý do thay đổi" },
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

function getValue(form: Bm083Form, sectionKey: SectionKey, field: string): string {
  return form[sectionKey][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown> | null): Bm083Form {
  if (!payload) return EMPTY_FORM;
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const request = section(payload, "request");
  const caseInfo = section(payload, "caseInfo");
  const expert = section(payload, "expert");
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
    request: {
      caseNo: text(request.caseNo),
      caseDecisionNo: text(request.caseDecisionNo),
      caseDecisionIssueDate: toDateInput(request.caseDecisionIssueDate),
      reason: text(request.reason),
      requestedUnitName: text(request.requestedUnitName),
    },
    caseInfo: {
      defendantName: text(caseInfo.defendantName || caseInfo.accusedName),
      offenseName: text(caseInfo.offenseName),
      legalArticle: text(caseInfo.legalArticle),
    },
    expert: {
      expertName: text(expert.expertName),
      expertTitle: text(expert.expertTitle),
      expertOrganization: text(expert.expertOrganization),
      reason: text(expert.reason),
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

function fillCustomerSample(): Bm083Form {
  return {
    agency: { ...EMPTY_FORM.agency, parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH", name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7", issuePlace: "TP. Hồ Chí Minh" },
    document: { ...EMPTY_FORM.document },
    request: { ...EMPTY_FORM.request },
    caseInfo: { ...EMPTY_FORM.caseInfo },
    expert: { ...EMPTY_FORM.expert },
    recipients: { ...EMPTY_FORM.recipients },
    signature: { ...EMPTY_FORM.signature, signerName: "Người ký mẫu" },
  };
}

function validateForm(form: Bm083Form): string[] {
  return REQUIRED_FIELDS.filter(
    (item) => !getValue(form, item.section, item.field).trim(),
  ).map((item) => item.label);
}

function buildSaveBody(form: Bm083Form) {
  return {
    ...form,
    updatedByName: form.signature.signerName.trim(),
  };
}

export function Bm083FormInputsPanel({
  documentId,
  onSaved,
}: Bm083FormInputsPanelProps) {
  const [form, setForm] = useState<Bm083Form>(EMPTY_FORM);
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
          bodyText || `Không tải được payload BM-083. HTTP ${response.status}`,
        );
      }

      const payload = (await response.json()) as Record<string, unknown>;
      setForm(normalizeFormInputs(payload));
      setSavedAt(null);
      setMessage("Đã tải lại dữ liệu BM-083 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được BM-083.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm(fillCustomerSample());
    setMessage("Đã điền dữ liệu mẫu BM-083.");
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
          bodyText || `Không lưu được BM-083. HTTP ${response.status}`,
        );
      }

      setSavedAt(new Date());
      setMessage(
        "Đã lưu dữ liệu BM-083. Dữ liệu vừa nhập đã được đồng bộ lên backend.",
      );

      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được BM-083.");
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
        templateCode="BM-083"
        title="Dữ liệu biểu mẫu Yêu cầu thay đổi người giám định, người định giá tài sản"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 83/HS · Stage KHOI_TO (G02 BP_NGAN_CHAN). Căn cứ Điều 206, 207 BLTTHS 2015."
        isDirty={Boolean(message) || validationErrors.length > 0}
        isLoading={loading}
        isSaving={saving}
        savedAt={savedAt}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-083"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton<Bm083Form>
            templateCode="BM-083"
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
        description="Thông tin Viện kiểm sát ban hành yêu cầu."
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
        title="2. Thông tin yêu cầu"
        description="Số hiệu và ngày ban hành yêu cầu."
      >
        <BmFieldText
          label="Số yêu cầu"
          required
          value={form.document.documentCode}
          onChange={(v) => updateField("document", "documentCode", v)}
        />

        <BmFieldDate
          label="Ngày yêu cầu"
          required
          value={form.document.issueDate}
          onChange={(v) => updateField("document", "issueDate", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="3. Thông tin vụ án"
        description="Thông tin vụ án liên quan đến giám định / định giá."
        fullWidth
      >
        <BmFieldText
          label="Số vụ án"
          required
          value={form.request.caseNo}
          onChange={(v) => updateField("request", "caseNo", v)}
        />

        <BmFieldText
          label="Số QĐ khởi tố vụ án"
          value={form.request.caseDecisionNo}
          onChange={(v) => updateField("request", "caseDecisionNo", v)}
        />

        <BmFieldDate
          label="Ngày QĐ khởi tố"
          value={form.request.caseDecisionIssueDate}
          onChange={(v) => updateField("request", "caseDecisionIssueDate", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="4. Thông tin bị can"
        description="Thông tin bị can liên quan."
        fullWidth
      >
        <BmFieldText
          label="Tên bị can"
          required
          value={form.caseInfo.defendantName}
          onChange={(v) => updateField("caseInfo", "defendantName", v)}
        />

        <BmFieldText
          label="Tội danh"
          required
          value={form.caseInfo.offenseName}
          onChange={(v) => updateField("caseInfo", "offenseName", v)}
        />

        <BmFieldText
          label="Điều khoản BLHS"
          value={form.caseInfo.legalArticle}
          onChange={(v) => updateField("caseInfo", "legalArticle", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="5. Người giám định/định giá được thay đổi"
        description="Thông tin người giám định / định giá cần thay đổi và lý do."
        fullWidth
      >
        <BmFieldText
          label="Họ tên"
          required
          value={form.expert.expertName}
          onChange={(v) => updateField("expert", "expertName", v)}
        />

        <BmFieldText
          label="Chức danh"
          value={form.expert.expertTitle}
          onChange={(v) => updateField("expert", "expertTitle", v)}
        />

        <BmFieldText
          label="Cơ quan"
          value={form.expert.expertOrganization}
          onChange={(v) => updateField("expert", "expertOrganization", v)}
        />

        <BmFieldTextarea
          label="Lý do thay đổi"
          required
          rows={3}
          value={form.expert.reason}
          onChange={(v) => updateField("expert", "reason", v)}
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
        description="Chế độ ký, chức vụ và người ký yêu cầu."
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-083"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
