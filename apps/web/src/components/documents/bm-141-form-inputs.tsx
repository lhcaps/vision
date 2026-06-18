"use client";

/**
 * BM-141 — QĐ chuyển hồ sơ vụ án để truy tố
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số 141/HS.
 *
 * Căn cứ: Điều 41, 245, 267 BLTTHS 2015.
 * Nghiệp vụ: VKS chuyển hồ sơ VAHS đã kết thúc điều tra sang VKS cấp trên để truy tố.
 */

import { useEffect, useMemo, useState } from "react";

import {
  BmFieldDate,
  BmFieldText,
  BmFieldTextarea,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
  issuePlaceDateLine,
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string; shortName: string; issuePlace: string };
type DocumentForm = { documentCode: string; issueDate: string; issuePlaceAndDateLine: string };
type OfficialForm = { issuerTitle: string };
type TransferForm = {
  procedureArticlesLine: string;
  caseDecisionLegalBasisLine: string;
  accusedDecisionLegalBasisLine: string;
  investigationConclusionLegalBasisLine: string;
  fromProcuracyName: string;
  toProcuracyName: string;
  toProcuracyRecipientLine: string;
  detentionFacilityRecipientLine: string;
  transferReasonLine: string;
  article1Line: string;
};
type RecipientsForm = {
  investigatingAgencyLine: string;
  accusedLine: string;
  archiveLine: string;
};
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm141Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  prosecutionTransfer: TransferForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm141Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    shortName: "VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "141/QĐ-VKSKV7",
    issueDate: "",
    issuePlaceAndDateLine: "",
  },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  prosecutionTransfer: {
    procedureArticlesLine: "Căn cứ các điều 41, 245 và 267 của Bộ luật Tố tụng hình sự;",
    caseDecisionLegalBasisLine: "",
    accusedDecisionLegalBasisLine: "",
    investigationConclusionLegalBasisLine: "",
    fromProcuracyName: "Viện kiểm sát nhân dân khu vực 7",
    toProcuracyName: "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
    toProcuracyRecipientLine: "",
    detentionFacilityRecipientLine: "",
    transferReasonLine: "",
    article1Line: "",
  },
  recipients: {
    investigatingAgencyLine: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
    accusedLine: "- Bị can;",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Tên VKS", "agency.name"],
  ["Số QĐ", "document.documentCode"],
  ["Chủ thể ban hành", "official.issuerTitle"],
  ["Căn cứ BLTTHS", "prosecutionTransfer.procedureArticlesLine"],
  ["Căn cứ QĐ khởi tố", "prosecutionTransfer.caseDecisionLegalBasisLine"],
  ["Căn cứ QĐ bị can", "prosecutionTransfer.accusedDecisionLegalBasisLine"],
  ["Căn cứ KLĐT", "prosecutionTransfer.investigationConclusionLegalBasisLine"],
  ["VKS nhận hồ sơ", "prosecutionTransfer.toProcuracyName"],
  ["Lý do chuyển", "prosecutionTransfer.transferReasonLine"],
  ["Điều 1", "prosecutionTransfer.article1Line"],
  ["Lưu hồ sơ", "recipients.archiveLine"],
  ["Chức vụ ký", "signature.positionTitle"],
  ["Người ký", "signature.signerName"],
];

function cleanText(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function pick(source: Record<string, any>, key: string): string {
  return cleanText(source[key]);
}

function toDateInput(value: unknown): string {
  const text = cleanText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return text;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function toVietnameseDateText(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value || "";
  return `ngày ${Number(m[3])} tháng ${Number(m[2])} năm ${m[1]}`;
}

function toSlashDateText(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value || "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function buildIssuePlaceAndDateLine(form: Bm141Form): string {
  return issuePlaceDateLine(form.agency.issuePlace, form.document.issueDate);
}

function normalizeFormInputs(payload: RenderPayload | null): Bm141Form {
  const obj = (payload as any) ?? {};
  const agency = asObject(obj.agency);
  const document = asObject(obj.document);
  const official = asObject(obj.official);
  const prosecutionTransfer = asObject(obj.prosecutionTransfer);
  const recipients = asObject(obj.recipients);
  const signature = asObject(obj.signature);
  return {
    agency: {
      parentName: pick(agency, "parentName") || EMPTY_FORM.agency.parentName,
      name: pick(agency, "name") || EMPTY_FORM.agency.name,
      shortName: pick(agency, "shortName") || EMPTY_FORM.agency.shortName,
      issuePlace: pick(agency, "issuePlace") || EMPTY_FORM.agency.issuePlace,
    },
    document: {
      documentCode: pick(document, "documentCode") || EMPTY_FORM.document.documentCode,
      issueDate: toDateInput(document.issueDate),
      issuePlaceAndDateLine: pick(document, "issuePlaceAndDateLine"),
    },
    official: {
      issuerTitle: pick(official, "issuerTitle") || EMPTY_FORM.official.issuerTitle,
    },
    prosecutionTransfer: {
      procedureArticlesLine:
        pick(prosecutionTransfer, "procedureArticlesLine") || EMPTY_FORM.prosecutionTransfer.procedureArticlesLine,
      caseDecisionLegalBasisLine: pick(prosecutionTransfer, "caseDecisionLegalBasisLine"),
      accusedDecisionLegalBasisLine: pick(prosecutionTransfer, "accusedDecisionLegalBasisLine"),
      investigationConclusionLegalBasisLine: pick(
        prosecutionTransfer,
        "investigationConclusionLegalBasisLine",
      ),
      fromProcuracyName:
        pick(prosecutionTransfer, "fromProcuracyName") || EMPTY_FORM.prosecutionTransfer.fromProcuracyName,
      toProcuracyName:
        pick(prosecutionTransfer, "toProcuracyName") || EMPTY_FORM.prosecutionTransfer.toProcuracyName,
      toProcuracyRecipientLine: pick(prosecutionTransfer, "toProcuracyRecipientLine"),
      detentionFacilityRecipientLine: pick(prosecutionTransfer, "detentionFacilityRecipientLine"),
      transferReasonLine: pick(prosecutionTransfer, "transferReasonLine"),
      article1Line: pick(prosecutionTransfer, "article1Line"),
    },
    recipients: {
      investigatingAgencyLine: pick(recipients, "investigatingAgencyLine"),
      accusedLine: pick(recipients, "accusedLine"),
      archiveLine: pick(recipients, "archiveLine") || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: pick(signature, "signMode") || EMPTY_FORM.signature.signMode,
      positionTitle:
        pick(signature, "positionTitle") || EMPTY_FORM.signature.positionTitle,
      signerName: pick(signature, "signerName"),
    },
  };
}

function lookupValue(form: Bm141Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: any = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = cur[p];
  }
  return cleanText(cur);
}

function validateForm(form: Bm141Form): string[] {
  return REQUIRED_FIELDS.filter(([, p]) => !lookupValue(form, p)).map(([l]) => l);
}

function buildSaveBody(form: Bm141Form) {
  return {
    agency: {
      parentName: form.agency.parentName,
      name: form.agency.name,
      shortName: form.agency.shortName,
      issuePlace: form.agency.issuePlace,
    },
    document: {
      documentCode: form.document.documentCode,
      issueDate: toSlashDateText(form.document.issueDate),
      issueDateText: toVietnameseDateText(form.document.issueDate).replace(/^ngày\s+/iu, ""),
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form),
    },
    official: { issuerTitle: form.official.issuerTitle },
    prosecutionTransfer: {
      procedureArticlesLine: form.prosecutionTransfer.procedureArticlesLine,
      caseDecisionLegalBasisLine: form.prosecutionTransfer.caseDecisionLegalBasisLine,
      accusedDecisionLegalBasisLine: form.prosecutionTransfer.accusedDecisionLegalBasisLine,
      investigationConclusionLegalBasisLine:
        form.prosecutionTransfer.investigationConclusionLegalBasisLine,
      fromProcuracyName: form.prosecutionTransfer.fromProcuracyName,
      toProcuracyName: form.prosecutionTransfer.toProcuracyName,
      toProcuracyRecipientLine: form.prosecutionTransfer.toProcuracyRecipientLine,
      detentionFacilityRecipientLine: form.prosecutionTransfer.detentionFacilityRecipientLine,
      transferReasonLine: form.prosecutionTransfer.transferReasonLine,
      article1Line: form.prosecutionTransfer.article1Line,
    },
    recipients: {
      investigatingAgencyLine: form.recipients.investigatingAgencyLine,
      accusedLine: form.recipients.accusedLine,
      archiveLine: form.recipients.archiveLine,
    },
    signature: {
      signMode: form.signature.signMode,
      positionTitle: form.signature.positionTitle,
      signerName: form.signature.signerName,
    },
    officialProxy: {
      fullName: form.signature.signerName,
      prosecutorName: form.signature.signerName,
    },
    formInputs: {},
    payloadOverrides: {},
    renderPayloadOverrides: {},
  };
}

export function Bm141FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm141Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const patch = <S extends keyof Bm141Form, K extends keyof Bm141Form[S]>(
    section: S,
    key: K,
    value: Bm141Form[S][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, unknown>), [key]: value },
    }));
  };

  const reloadFromBackend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setForm(normalizeFormInputs((await res.json()) as RenderPayload));
      setMessage("Đã tải dữ liệu BM-141 từ backend.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tải.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const errs = validateForm(form);
    if (errs.length > 0) {
      setValidationErrors(errs);
      setError(`Thiếu: ${errs.join(", ")}`);
      return;
    }
    setValidationErrors([]);
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(buildSaveBody(form)),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reloadFromBackend();
      setMessage("Đã lưu BM-141 thành công.");
      await onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void reloadFromBackend();
  }, [documentId]);

  const status = (() => {
    if (loading) return { kind: "loading" as const, text: "Đang tải..." };
    if (saving) return { kind: "loading" as const, text: "Đang lưu..." };
    if (validationErrors.length > 0)
      return { kind: "warning" as const, text: `Còn thiếu: ${validationErrors.join(", ")}` };
    if (error) return { kind: "error" as const, text: error };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-141"
        title="Dữ liệu biểu mẫu QĐ chuyển hồ sơ vụ án để truy tố"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 141/HS · Căn cứ Điều 41, 245, 267 BLTTHS 2015."
        isDirty={false}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={
          validationErrors.length > 0
            ? `Còn thiếu: ${validationErrors.join(", ")}`
            : undefined
        }
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-141"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection title="1. Header biểu mẫu" requiredCount={3}>
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          value={form.agency.parentName}
          onChange={(v) => patch("agency", "parentName", v)}
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          required
          value={form.agency.name}
          onChange={(v) => patch("agency", "name", v)}
        />
        <BmFieldText
          label="Tên viết tắt"
          value={form.agency.shortName}
          onChange={(v) => patch("agency", "shortName", v)}
        />
        <BmFieldText
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(v) => patch("agency", "issuePlace", v)}
        />
        <BmFieldText
          label="Số QĐ"
          required
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
        />
        <BmFieldDate
          label="Ngày ban hành"
          value={form.document.issueDate}
          onChange={(v) => patch("document", "issueDate", v)}
        />
        <BmFieldText
          label="Dòng địa danh/ngày tự sinh"
          fullWidth
          readOnly
          value={buildIssuePlaceAndDateLine(form)}
          onChange={() => undefined}
        />
        <BmFieldText
          label="Chủ thể ban hành"
          required
          fullWidth
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
        />
      </BmFormSection>

      <BmFormSection title="2. Căn cứ pháp lý" requiredCount={5}>
        <BmFieldTextarea
          label="Căn cứ BLTTHS"
          required
          fullWidth
          value={form.prosecutionTransfer.procedureArticlesLine}
          onChange={(v) => patch("prosecutionTransfer", "procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ QĐ khởi tố vụ án"
          required
          fullWidth
          value={form.prosecutionTransfer.caseDecisionLegalBasisLine}
          onChange={(v) => patch("prosecutionTransfer", "caseDecisionLegalBasisLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ QĐ khởi tố bị can"
          required
          fullWidth
          value={form.prosecutionTransfer.accusedDecisionLegalBasisLine}
          onChange={(v) => patch("prosecutionTransfer", "accusedDecisionLegalBasisLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ Bản KLĐT"
          required
          fullWidth
          value={form.prosecutionTransfer.investigationConclusionLegalBasisLine}
          onChange={(v) => patch("prosecutionTransfer", "investigationConclusionLegalBasisLine", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection title="3. Nội dung chuyển hồ sơ" requiredCount={2}>
        <BmFieldText
          label="VKS gửi hồ sơ"
          value={form.prosecutionTransfer.fromProcuracyName}
          onChange={(v) => patch("prosecutionTransfer", "fromProcuracyName", v)}
        />
        <BmFieldText
          label="VKS nhận hồ sơ"
          required
          value={form.prosecutionTransfer.toProcuracyName}
          onChange={(v) => patch("prosecutionTransfer", "toProcuracyName", v)}
        />
        <BmFieldText
          label="Nơi nhận VKS cấp trên"
          fullWidth
          value={form.prosecutionTransfer.toProcuracyRecipientLine}
          onChange={(v) => patch("prosecutionTransfer", "toProcuracyRecipientLine", v)}
        />
        <BmFieldText
          label="Nơi nhận trại tạm giam"
          fullWidth
          value={form.prosecutionTransfer.detentionFacilityRecipientLine}
          onChange={(v) => patch("prosecutionTransfer", "detentionFacilityRecipientLine", v)}
        />
        <BmFieldTextarea
          label="Lý do chuyển"
          required
          fullWidth
          value={form.prosecutionTransfer.transferReasonLine}
          onChange={(v) => patch("prosecutionTransfer", "transferReasonLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Điều 1"
          required
          fullWidth
          value={form.prosecutionTransfer.article1Line}
          onChange={(v) => patch("prosecutionTransfer", "article1Line", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection title="4. Nơi nhận" requiredCount={1}>
        <BmFieldText
          label="Nơi nhận CQĐT"
          fullWidth
          value={form.recipients.investigatingAgencyLine}
          onChange={(v) => patch("recipients", "investigatingAgencyLine", v)}
        />
        <BmFieldText
          label="Nơi nhận bị can"
          fullWidth
          value={form.recipients.accusedLine}
          onChange={(v) => patch("recipients", "accusedLine", v)}
        />
        <BmFieldText
          label="Lưu hồ sơ"
          required
          fullWidth
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
        />
      </BmFormSection>

      <BmFormSection title="5. Chữ ký" requiredCount={2}>
        <BmFieldText
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(v) => patch("signature", "signMode", v)}
        />
        <BmFieldText
          label="Chức vụ ký"
          required
          value={form.signature.positionTitle}
          onChange={(v) => patch("signature", "positionTitle", v)}
        />
        <BmFieldText
          label="Người ký"
          required
          value={form.signature.signerName}
          onChange={(v) => patch("signature", "signerName", v)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-141"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
