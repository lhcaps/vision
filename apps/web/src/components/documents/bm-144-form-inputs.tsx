"use client";

/**
 * BM-144 — QĐ gia hạn thời hạn truy tố
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số 144/HS.
 *
 * Căn cứ: Điều 41, 240, 250, 251 BLTTHS 2015.
 * Nghiệp vụ: VKS gia hạn thời hạn quyết định việc truy tố đối với vụ án.
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
type ExtensionForm = {
  procedureArticlesLine: string;
  juvenileJusticeLine: string;
  caseDecisionLegalBasisLine: string;
  accusedDecisionLegalBasisLine: string;
  investigationConclusionLegalBasisLine: string;
  reasonLine: string;
  durationDaysText: string;
  fromDateText: string;
  toDateText: string;
  article1Line: string;
};
type RecipientsForm = { investigatingAgencyLine: string; accusedLine: string; archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm144Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  prosecutionExtension: ExtensionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm144Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    shortName: "VKSTPHCM",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "144/QĐ-VKS",
    issueDate: "",
    issuePlaceAndDateLine: "",
  },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH" },
  prosecutionExtension: {
    procedureArticlesLine: "Căn cứ các điều 41, 240, 250 và 251 của Bộ luật Tố tụng hình sự;",
    juvenileJusticeLine: "",
    caseDecisionLegalBasisLine: "",
    accusedDecisionLegalBasisLine: "",
    investigationConclusionLegalBasisLine: "",
    reasonLine: "",
    durationDaysText: "30",
    fromDateText: "",
    toDateText: "",
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
  ["Căn cứ BLTTHS", "prosecutionExtension.procedureArticlesLine"],
  ["Căn cứ QĐ khởi tố VAHS", "prosecutionExtension.caseDecisionLegalBasisLine"],
  ["Căn cứ QĐ bị can", "prosecutionExtension.accusedDecisionLegalBasisLine"],
  ["Căn cứ KLĐT", "prosecutionExtension.investigationConclusionLegalBasisLine"],
  ["Lý do gia hạn", "prosecutionExtension.reasonLine"],
  ["Số ngày gia hạn", "prosecutionExtension.durationDaysText"],
  ["Từ ngày", "prosecutionExtension.fromDateText"],
  ["Điều 1", "prosecutionExtension.article1Line"],
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

function buildIssuePlaceAndDateLine(form: Bm144Form): string {
  return issuePlaceDateLine(form.agency.issuePlace, form.document.issueDate);
}

function normalizeFormInputs(payload: RenderPayload | null): Bm144Form {
  const obj = (payload as any) ?? {};
  const agency = asObject(obj.agency);
  const document = asObject(obj.document);
  const official = asObject(obj.official);
  const prosecutionExtension = asObject(obj.prosecutionExtension);
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
    prosecutionExtension: {
      procedureArticlesLine:
        pick(prosecutionExtension, "procedureArticlesLine") ||
        EMPTY_FORM.prosecutionExtension.procedureArticlesLine,
      juvenileJusticeLine: pick(prosecutionExtension, "juvenileJusticeLine"),
      caseDecisionLegalBasisLine: pick(prosecutionExtension, "caseDecisionLegalBasisLine"),
      accusedDecisionLegalBasisLine: pick(prosecutionExtension, "accusedDecisionLegalBasisLine"),
      investigationConclusionLegalBasisLine: pick(
        prosecutionExtension,
        "investigationConclusionLegalBasisLine",
      ),
      reasonLine: pick(prosecutionExtension, "reasonLine"),
      durationDaysText:
        pick(prosecutionExtension, "durationDaysText") || EMPTY_FORM.prosecutionExtension.durationDaysText,
      fromDateText: pick(prosecutionExtension, "fromDateText"),
      toDateText: pick(prosecutionExtension, "toDateText"),
      article1Line: pick(prosecutionExtension, "article1Line"),
    },
    recipients: {
      investigatingAgencyLine: pick(recipients, "investigatingAgencyLine"),
      accusedLine: pick(recipients, "accusedLine"),
      archiveLine: pick(recipients, "archiveLine") || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: pick(signature, "signMode") || EMPTY_FORM.signature.signMode,
      positionTitle: pick(signature, "positionTitle") || EMPTY_FORM.signature.positionTitle,
      signerName: pick(signature, "signerName"),
    },
  };
}

function lookupValue(form: Bm144Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: any = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = cur[p];
  }
  return cleanText(cur);
}

function validateForm(form: Bm144Form): string[] {
  return REQUIRED_FIELDS.filter(([, p]) => !lookupValue(form, p)).map(([l]) => l);
}

function buildSaveBody(form: Bm144Form) {
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
    prosecutionExtension: {
      procedureArticlesLine: form.prosecutionExtension.procedureArticlesLine,
      juvenileJusticeLine: form.prosecutionExtension.juvenileJusticeLine,
      caseDecisionLegalBasisLine: form.prosecutionExtension.caseDecisionLegalBasisLine,
      accusedDecisionLegalBasisLine: form.prosecutionExtension.accusedDecisionLegalBasisLine,
      investigationConclusionLegalBasisLine:
        form.prosecutionExtension.investigationConclusionLegalBasisLine,
      reasonLine: form.prosecutionExtension.reasonLine,
      durationDaysText: form.prosecutionExtension.durationDaysText,
      fromDateText: form.prosecutionExtension.fromDateText,
      toDateText: form.prosecutionExtension.toDateText,
      article1Line: form.prosecutionExtension.article1Line,
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

export function Bm144FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm144Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const patch = <S extends keyof Bm144Form, K extends keyof Bm144Form[S]>(
    section: S,
    key: K,
    value: Bm144Form[S][K],
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
      setMessage("Đã tải dữ liệu BM-144 từ backend.");
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
      setMessage("Đã lưu BM-144 thành công.");
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
        templateCode="BM-144"
        title="Dữ liệu biểu mẫu QĐ gia hạn thời hạn truy tố"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 144/HS · Căn cứ Điều 41, 240, 250, 251 BLTTHS 2015."
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-144"}
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
          value={form.prosecutionExtension.procedureArticlesLine}
          onChange={(v) => patch("prosecutionExtension", "procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ luật tư pháp người chưa thành niên (nếu có)"
          fullWidth
          value={form.prosecutionExtension.juvenileJusticeLine}
          onChange={(v) => patch("prosecutionExtension", "juvenileJusticeLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ QĐ khởi tố vụ án"
          required
          fullWidth
          value={form.prosecutionExtension.caseDecisionLegalBasisLine}
          onChange={(v) => patch("prosecutionExtension", "caseDecisionLegalBasisLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ QĐ khởi tố bị can"
          required
          fullWidth
          value={form.prosecutionExtension.accusedDecisionLegalBasisLine}
          onChange={(v) => patch("prosecutionExtension", "accusedDecisionLegalBasisLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ Bản KLĐT"
          required
          fullWidth
          value={form.prosecutionExtension.investigationConclusionLegalBasisLine}
          onChange={(v) =>
            patch("prosecutionExtension", "investigationConclusionLegalBasisLine", v)
          }
          rows={2}
        />
      </BmFormSection>

      <BmFormSection title="3. Nội dung gia hạn" requiredCount={4}>
        <BmFieldTextarea
          label="Lý do gia hạn"
          required
          fullWidth
          value={form.prosecutionExtension.reasonLine}
          onChange={(v) => patch("prosecutionExtension", "reasonLine", v)}
          rows={2}
        />
        <BmFieldText
          label="Số ngày gia hạn"
          required
          value={form.prosecutionExtension.durationDaysText}
          onChange={(v) => patch("prosecutionExtension", "durationDaysText", v)}
        />
        <BmFieldText
          label="Từ ngày"
          required
          value={form.prosecutionExtension.fromDateText}
          onChange={(v) => patch("prosecutionExtension", "fromDateText", v)}
        />
        <BmFieldText
          label="Đến ngày"
          value={form.prosecutionExtension.toDateText}
          onChange={(v) => patch("prosecutionExtension", "toDateText", v)}
        />
        <BmFieldTextarea
          label="Điều 1"
          required
          fullWidth
          value={form.prosecutionExtension.article1Line}
          onChange={(v) => patch("prosecutionExtension", "article1Line", v)}
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-144"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
