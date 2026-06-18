"use client";

/**
 * BM-140 — Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm pháp luật
 * Stage: DIEU_TRA, Group: G04. TT 03/2026-VKSTC, Mẫu số 140/HS.
 *
 * Căn cứ: Điều 36, 37 Luật Tổ chức VKSND; Điều 65 Bộ luật Hình sự.
 * Nghiệp vụ: VKS kiến nghị cơ quan/đơn vị áp dụng biện pháp phòng ngừa tội phạm.
 */

import { useEffect, useMemo, useState } from "react";

import {
  BmFieldDate,
  BmFieldSelect,
  BmFieldText,
  BmFieldTextarea,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
  issuePlaceDateLine,
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string };
type DocumentForm = { documentCode: string; issuePlace: string; issueDateIso: string };
type OfficialForm = { issuerTitle: string };
type SuggestionForm = {
  procedureArticlesLine: string;
  recipientAgency: string;
  recipientName: string;
  caseTitle: string;
  offenseName: string;
  violationDescription: string;
  suggestedMeasure: string;
  legalBasis: string;
  reasonLine: string;
};
type RecipientsForm = { archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm140Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  suggestion: SuggestionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const SIGN_MODE_OPTIONS = [
  { value: "handwritten", label: "Chữ ký tay" },
  { value: "digital", label: "Chữ ký số" },
] as const;

const EMPTY_FORM: Bm140Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  document: { documentCode: "140/KNBPPN-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" },
  official: { issuerTitle: "Viện trưởng" },
  suggestion: {
    procedureArticlesLine: "Điều 36, Điều 37 Luật Tổ chức Viện kiểm sát nhân dân; Điều 65 Bộ luật Hình sự;",
    recipientAgency: "",
    recipientName: "",
    caseTitle: "",
    offenseName: "",
    violationDescription: "",
    suggestedMeasure: "",
    legalBasis: "",
    reasonLine: "",
  },
  recipients: { archiveLine: "Lưu hồ sơ vụ án" },
  signature: { signMode: "handwritten", positionTitle: "Kiểm sát viên", signerName: "" },
};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Viện kiểm sát cấp trên", "agency.parentName"],
  ["Viện kiểm sát ban hành", "agency.name"],
  ["Số kiến nghị", "document.documentCode"],
  ["Địa danh", "document.issuePlace"],
  ["Ngày ban hành", "document.issueDateIso"],
  ["Chủ thể ban hành", "official.issuerTitle"],
  ["Cơ quan nhận kiến nghị", "suggestion.recipientAgency"],
  ["Tên người nhận", "suggestion.recipientName"],
  ["Lưu hồ sơ", "recipients.archiveLine"],
  ["Người ký", "signature.signerName"],
];

function cleanText(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function nested(payload: RenderPayload | null, path: string): string {
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = payload;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function parseDateToIso(v: string): string {
  const raw = cleanText(v);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

function toVietnameseDateText(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate || "";
  return `ngày ${Number(m[3])} tháng ${Number(m[2])} năm ${m[1]}`;
}

function toSlashDateText(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate || "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function buildIssuePlaceAndDateLine(form: Bm140Form): string {
  return issuePlaceDateLine(form.document.issuePlace, form.document.issueDateIso);
}

function buildReasonLine(form: Bm140Form): string {
  const s = form.suggestion;
  return `Qua công tác kiểm sát vụ án ${s.caseTitle.trim()} về tội "${s.offenseName.trim()}", phát hiện ${s.violationDescription.trim()} Đề nghị ${s.recipientAgency.trim()} áp dụng biện pháp: ${s.suggestedMeasure.trim()} Lý do: ${s.reasonLine.trim()}`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm140Form {
  const f = EMPTY_FORM;
  if (!payload) return f;
  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || f.agency.parentName,
      name: nested(payload, "agency.name") || f.agency.name,
    },
    document: {
      documentCode: nested(payload, "document.documentCode") || f.document.documentCode,
      issuePlace: nested(payload, "document.issuePlace") || f.document.issuePlace,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) ||
        f.document.issueDateIso,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle,
    },
    suggestion: {
      procedureArticlesLine:
        nested(payload, "suggestion.procedureArticlesLine") ||
        f.suggestion.procedureArticlesLine,
      recipientAgency: nested(payload, "suggestion.recipientAgency") || "",
      recipientName: nested(payload, "suggestion.recipientName") || "",
      caseTitle: nested(payload, "suggestion.caseTitle") || "",
      offenseName: nested(payload, "suggestion.offenseName") || "",
      violationDescription: nested(payload, "suggestion.violationDescription") || "",
      suggestedMeasure: nested(payload, "suggestion.suggestedMeasure") || "",
      legalBasis: nested(payload, "suggestion.legalBasis") || "",
      reasonLine: nested(payload, "suggestion.reasonLine") || "",
    },
    recipients: {
      archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine,
    },
    signature: {
      signMode: nested(payload, "signature.signMode") || f.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") || f.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    },
  };
}

function lookupValue(form: Bm140Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function validateForm(form: Bm140Form): string[] {
  return REQUIRED_FIELDS.filter(([, path]) => !lookupValue(form, path)).map(
    ([label]) => label,
  );
}

function buildSaveBody(form: Bm140Form) {
  return {
    agency: {
      parentName: form.agency.parentName,
      name: form.agency.name,
      issuePlace: form.document.issuePlace,
    },
    document: {
      documentCode: form.document.documentCode,
      issueDate: toSlashDateText(form.document.issueDateIso),
      issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(
        /^ngày\s+/iu,
        "",
      ),
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form),
    },
    official: { issuerTitle: form.official.issuerTitle },
    suggestion: {
      procedureArticlesLine: form.suggestion.procedureArticlesLine,
      recipientAgency: form.suggestion.recipientAgency,
      recipientName: form.suggestion.recipientName,
      caseTitle: form.suggestion.caseTitle,
      offenseName: form.suggestion.offenseName,
      violationDescription: form.suggestion.violationDescription,
      suggestedMeasure: form.suggestion.suggestedMeasure,
      legalBasis: form.suggestion.legalBasis,
      reasonLine: buildReasonLine(form),
    },
    recipients: { archiveLine: form.recipients.archiveLine },
    signature: {
      signMode: form.signature.signMode,
      positionTitle: form.signature.positionTitle,
      signerName: form.signature.signerName || "",
    },
    formInputs: {},
    payloadOverrides: {},
    renderPayloadOverrides: {},
  };
}

export function Bm140FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm140Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm140Form, K extends keyof Bm140Form[S]>(
    section: S,
    key: K,
    value: Bm140Form[S][K],
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
      setMessage("Đã tải dữ liệu BM-140 từ backend.");
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
      setMessage("Đã lưu BM-140 thành công.");
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
      return {
        kind: "warning" as const,
        text: `Còn thiếu: ${validationErrors.join(", ")}`,
      };
    if (error) return { kind: "error" as const, text: error };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-140"
        title="Dữ liệu biểu mẫu Kiến nghị áp dụng biện pháp phòng ngừa tội phạm"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 140/HS · Căn cứ Điều 36, 37 Luật Tổ chức VKSND; Điều 65 BLHS."
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-140"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection
        title="1. Cơ quan / văn bản"
        description="Thông tin cơ quan ban hành và số hiệu kiến nghị."
        requiredCount={5}
      >
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          required
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
          label="Số kiến nghị"
          required
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
        />
        <BmFieldText
          label="Địa danh"
          required
          value={form.document.issuePlace}
          onChange={(v) => patch("document", "issuePlace", v)}
        />
        <BmFieldDate
          label="Ngày ban hành"
          required
          value={form.document.issueDateIso}
          onChange={(v) => patch("document", "issueDateIso", v)}
        />
        <BmFieldText
          label="Dòng địa danh/ngày tự sinh"
          fullWidth
          value={buildIssuePlaceAndDateLine(form)}
          readOnly
          onChange={() => undefined}
        />
        <BmFieldText
          label="Chức vụ người ký"
          required
          fullWidth
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="2. Nội dung kiến nghị"
        description="Điều khoản căn cứ, cơ quan nhận, vụ án và biện pháp đề nghị."
        requiredCount={2}
      >
        <BmFieldTextarea
          label="Điều khoản căn cứ pháp luật"
          fullWidth
          value={form.suggestion.procedureArticlesLine}
          onChange={(v) => patch("suggestion", "procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldText
          label="Cơ quan nhận kiến nghị"
          required
          value={form.suggestion.recipientAgency}
          onChange={(v) => patch("suggestion", "recipientAgency", v)}
        />
        <BmFieldText
          label="Tên người nhận"
          required
          value={form.suggestion.recipientName}
          onChange={(v) => patch("suggestion", "recipientName", v)}
        />
        <BmFieldText
          label="Tên vụ án"
          fullWidth
          value={form.suggestion.caseTitle}
          onChange={(v) => patch("suggestion", "caseTitle", v)}
        />
        <BmFieldText
          label="Tội danh"
          value={form.suggestion.offenseName}
          onChange={(v) => patch("suggestion", "offenseName", v)}
        />
        <BmFieldTextarea
          label="Mô tả nội dung kiến nghị"
          fullWidth
          value={form.suggestion.violationDescription}
          onChange={(v) => patch("suggestion", "violationDescription", v)}
          rows={4}
        />
        <BmFieldTextarea
          label="Biện pháp đề nghị"
          fullWidth
          value={form.suggestion.suggestedMeasure}
          onChange={(v) => patch("suggestion", "suggestedMeasure", v)}
          rows={3}
        />
        <BmFieldTextarea
          label="Căn cứ pháp lý"
          fullWidth
          value={form.suggestion.legalBasis}
          onChange={(v) => patch("suggestion", "legalBasis", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Lý do kiến nghị"
          fullWidth
          value={form.suggestion.reasonLine}
          onChange={(v) => patch("suggestion", "reasonLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Lý do kiến nghị tự sinh"
          fullWidth
          value={buildReasonLine(form)}
          readOnly
          rows={3}
          onChange={() => undefined}
        />
      </BmFormSection>

      <BmFormSection title="3. Nơi nhận" requiredCount={1}>
        <BmFieldText
          label="Dòng lưu"
          required
          fullWidth
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
        />
      </BmFormSection>

      <BmFormSection title="4. Chữ ký" requiredCount={1}>
        <BmFieldSelect
          label="Hình thức ký"
          value={form.signature.signMode}
          onChange={(v) => patch("signature", "signMode", v)}
          options={SIGN_MODE_OPTIONS}
        />
        <BmFieldText
          label="Chức danh"
          value={form.signature.positionTitle}
          onChange={(v) => patch("signature", "positionTitle", v)}
        />
        <BmFieldText
          label="Tên người ký"
          required
          value={form.signature.signerName}
          onChange={(v) => patch("signature", "signerName", v)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-140"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
