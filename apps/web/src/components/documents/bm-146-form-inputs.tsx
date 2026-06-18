"use client";

/**
 * BM-146 — Quyết định tạm đình chỉ vụ án hình sự
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số 146/HS.
 *
 * Căn cứ: Điều 41, 236, 240, 247 BLTTHS 2015.
 * Nghiệp vụ: VKS ra QĐ tạm đình chỉ vụ án hình sự.
 */

import { useEffect, useMemo, useState } from "react";

import {
  BmFieldText,
  BmFieldTextarea,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
} from "@/components/documents/bm-form";

type FormState = {
  procedureArticlesLine: string;
  caseDecisionLegalBasisLine: string;
  reasonLine: string;
  article1Line: string;
  article2Line: string;
  article3Line: string;
  article4Line: string;
  investigationAuthorityRecipientLine: string;
  otherRecipientsLine: string;
  archiveLine: string;
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: FormState = {
  procedureArticlesLine:
    "Căn cứ các điều 41, 236, 240 và 247 của Bộ luật Tố tụng hình sự;",
  caseDecisionLegalBasisLine:
    "Căn cứ Quyết định khởi tố vụ án hình sự số ... ngày ... tháng ... năm ... của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội ...",
  reasonLine:
    "Xét thấy có căn cứ tạm đình chỉ vụ án hình sự theo quy định của Bộ luật Tố tụng hình sự,",
  article1Line: "Tạm đình chỉ vụ án hình sự về tội ...",
  article2Line:
    "Việc giám định, định giá tài sản, yêu cầu cơ quan, tổ chức, cá nhân cung cấp tài liệu, đồ vật, tương trợ tư pháp tiếp tục được tiến hành cho đến khi có kết quả.",
  article3Line:
    "Xử lý vật chứng, tài liệu, đồ vật và các vấn đề khác có liên quan theo quy định của pháp luật.",
  article4Line:
    "Yêu cầu Cơ quan điều tra thực hiện Quyết định này theo quy định của pháp luật./.",
  investigationAuthorityRecipientLine: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  otherRecipientsLine: "- Cơ quan, tổ chức, cá nhân có liên quan;",
  archiveLine: "- Lưu: HSVA, HSKS, VP.",
  signMode: "KT. VIỆN TRƯỞNG",
  positionTitle: "PHÓ VIỆN TRƯỞNG",
  signerName: "",
};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Căn cứ BLTTHS", "procedureArticlesLine"],
  ["Căn cứ QĐ khởi tố", "caseDecisionLegalBasisLine"],
  ["Lý do tạm đình chỉ", "reasonLine"],
  ["Điều 1", "article1Line"],
  ["Điều 2", "article2Line"],
  ["Điều 3", "article3Line"],
  ["Điều 4", "article4Line"],
  ["Nơi nhận CQĐT", "investigationAuthorityRecipientLine"],
  ["Nơi nhận khác", "otherRecipientsLine"],
  ["Lưu hồ sơ", "archiveLine"],
  ["Chế độ ký", "signMode"],
  ["Chức vụ ký", "positionTitle"],
  ["Người ký", "signerName"],
];

function cleanText(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function getPath(obj: unknown, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function normalizeFormInputs(payload: RenderPayload | null): FormState {
  const f = EMPTY_FORM;
  if (!payload) return f;
  return {
    procedureArticlesLine:
      getPath(payload, "prosecutionCaseSuspension.procedureArticlesLine") ||
      f.procedureArticlesLine,
    caseDecisionLegalBasisLine:
      getPath(payload, "prosecutionCaseSuspension.caseDecisionLegalBasisLine") ||
      f.caseDecisionLegalBasisLine,
    reasonLine:
      getPath(payload, "prosecutionCaseSuspension.reasonLine") || f.reasonLine,
    article1Line:
      getPath(payload, "prosecutionCaseSuspension.article1Line") ||
      f.article1Line,
    article2Line:
      getPath(payload, "prosecutionCaseSuspension.article2Line") ||
      f.article2Line,
    article3Line:
      getPath(payload, "prosecutionCaseSuspension.article3Line") ||
      f.article3Line,
    article4Line:
      getPath(payload, "prosecutionCaseSuspension.article4Line") ||
      f.article4Line,
    investigationAuthorityRecipientLine:
      getPath(payload, "prosecutionCaseSuspension.investigationAuthorityRecipientLine") ||
      f.investigationAuthorityRecipientLine,
    otherRecipientsLine:
      getPath(payload, "recipients.otherRecipientsLine") || f.otherRecipientsLine,
    archiveLine:
      getPath(payload, "recipients.archiveLine") || f.archiveLine,
    signMode: getPath(payload, "signature.signMode") || f.signMode,
    positionTitle:
      getPath(payload, "signature.positionTitle") || f.positionTitle,
    signerName: getPath(payload, "signature.signerName") || "",
  };
}

function validateForm(form: FormState): string[] {
  return REQUIRED_FIELDS.filter(([, key]) => !cleanText(form[key as keyof FormState])).map(
    ([label]) => label,
  );
}

function buildSaveBody(form: FormState) {
  return {
    updatedByName: form.signerName,
    prosecutionCaseSuspension: {
      procedureArticlesLine: form.procedureArticlesLine,
      caseDecisionLegalBasisLine: form.caseDecisionLegalBasisLine,
      reasonLine: form.reasonLine,
      article1Line: form.article1Line,
      article2Line: form.article2Line,
      article3Line: form.article3Line,
      article4Line: form.article4Line,
      investigationAuthorityRecipientLine:
        form.investigationAuthorityRecipientLine,
    },
    recipients: {
      otherRecipientsLine: form.otherRecipientsLine,
      archiveLine: form.archiveLine,
    },
    signature: {
      signMode: form.signMode,
      positionTitle: form.positionTitle,
      signerName: form.signerName,
    },
    official: {
      fullName: form.signerName,
      prosecutorName: form.signerName,
    },
    formInputs: {},
    payloadOverrides: {},
    renderPayloadOverrides: {},
  };
}

export function Bm146FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      setMessage("Đã tải dữ liệu BM-146 từ backend.");
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
      setMessage("Đã lưu BM-146 thành công.");
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
        templateCode="BM-146"
        title="Dữ liệu biểu mẫu QĐ tạm đình chỉ vụ án hình sự"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 146/HS · Căn cứ Điều 41, 236, 240, 247 BLTTHS 2015."
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-146"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection
        title="1. Căn cứ pháp lý và lý do"
        description="Căn cứ BLTTHS, QĐ khởi tố vụ án và lý do tạm đình chỉ."
        requiredCount={3}
      >
        <BmFieldTextarea
          label="Căn cứ BLTTHS"
          required
          fullWidth
          value={form.procedureArticlesLine}
          onChange={(v) => updateField("procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ QĐ khởi tố vụ án"
          required
          fullWidth
          value={form.caseDecisionLegalBasisLine}
          onChange={(v) => updateField("caseDecisionLegalBasisLine", v)}
          rows={3}
        />
        <BmFieldTextarea
          label="Lý do tạm đình chỉ"
          required
          fullWidth
          value={form.reasonLine}
          onChange={(v) => updateField("reasonLine", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection
        title="2. Nội dung quyết định"
        description="Các điều khoản của QĐ."
        requiredCount={4}
      >
        <BmFieldTextarea
          label="Điều 1"
          required
          fullWidth
          value={form.article1Line}
          onChange={(v) => updateField("article1Line", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Điều 2"
          required
          fullWidth
          value={form.article2Line}
          onChange={(v) => updateField("article2Line", v)}
          rows={3}
        />
        <BmFieldTextarea
          label="Điều 3"
          required
          fullWidth
          value={form.article3Line}
          onChange={(v) => updateField("article3Line", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Điều 4"
          required
          fullWidth
          value={form.article4Line}
          onChange={(v) => updateField("article4Line", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection
        title="3. Nơi nhận"
        description="Cơ quan điều tra và các cơ quan liên quan."
        requiredCount={3}
      >
        <BmFieldText
          label="Nơi nhận CQĐT"
          required
          fullWidth
          value={form.investigationAuthorityRecipientLine}
          onChange={(v) => updateField("investigationAuthorityRecipientLine", v)}
        />
        <BmFieldText
          label="Nơi nhận khác"
          required
          fullWidth
          value={form.otherRecipientsLine}
          onChange={(v) => updateField("otherRecipientsLine", v)}
        />
        <BmFieldText
          label="Lưu hồ sơ"
          required
          fullWidth
          value={form.archiveLine}
          onChange={(v) => updateField("archiveLine", v)}
        />
      </BmFormSection>

      <BmFormSection title="4. Chữ ký" requiredCount={3}>
        <BmFieldText
          label="Chế độ ký"
          required
          value={form.signMode}
          onChange={(v) => updateField("signMode", v)}
        />
        <BmFieldText
          label="Chức vụ ký"
          required
          value={form.positionTitle}
          onChange={(v) => updateField("positionTitle", v)}
        />
        <BmFieldText
          label="Người ký"
          required
          value={form.signerName}
          onChange={(v) => updateField("signerName", v)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-146"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
