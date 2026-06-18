"use client";

/**
 * BM-155 — Quyết định phục hồi vụ án đối với bị can
 * Stage: PHUC_HOI_XAC_MINH, Group: G99. TT 03/2026-VKSTC, Mẫu số 155/HS.
 *
 * Căn cứ: Điều 41, 251 BLTTHS 2015.
 * Nghiệp vụ: VKS phục hồi vụ án hình sự bị đình chỉ khi có căn cứ mới.
 */

import { useEffect, useState } from "react";

import {
  BmFieldDate,
  BmFieldText,
  BmFieldTextarea,
  BmFormActions,
  BmFormMetaBar,
  BmFormSection,
  BmFormStatus,
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string; issuePlace: string };
type DocumentForm = { documentCode: string; issueDate: string };
type OfficialForm = { issuerTitle: string };
type LegalBasisForm = { procedureArticlesLine: string; suspensionDecisionLine: string };
type ContentForm = {
  suspensionDecisionCode: string;
  suspensionDecisionDate: string;
  accusedName: string;
  caseName: string;
  reasonLine: string;
  article1Line: string;
  article2Line: string;
};
type RecipientsForm = { line1: string; line2: string; archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm155Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  content: ContentForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm155Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: { documentCode: "QĐ-VKSKV7-PHUCHOIBican", issueDate: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  legalBasis: {
    procedureArticlesLine: "Căn cứ Điều 41 và Điều 251 của Bộ luật Tố tụng hình sự;",
    suspensionDecisionLine: "",
  },
  content: {
    suspensionDecisionCode: "",
    suspensionDecisionDate: "",
    accusedName: "",
    caseName: "",
    reasonLine: "",
    article1Line: "",
    article2Line: "",
  },
  recipients: { line1: "", line2: "", archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

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

function normalizeForm(payload: RenderPayload | null): Bm155Form {
  if (!payload) return EMPTY_FORM;
  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
      issuePlace: nested(payload, "agency.issuePlace") || EMPTY_FORM.agency.issuePlace,
    },
    document: {
      documentCode: nested(payload, "document.documentCode") || EMPTY_FORM.document.documentCode,
      issueDate: nested(payload, "document.issueDate") || EMPTY_FORM.document.issueDate,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || EMPTY_FORM.official.issuerTitle,
    },
    legalBasis: {
      procedureArticlesLine:
        nested(payload, "legalBasis.procedureArticlesLine") ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      suspensionDecisionLine:
        nested(payload, "legalBasis.suspensionDecisionLine") ||
        EMPTY_FORM.legalBasis.suspensionDecisionLine,
    },
    content: {
      suspensionDecisionCode: nested(payload, "content.suspensionDecisionCode") || "",
      suspensionDecisionDate: nested(payload, "content.suspensionDecisionDate") || "",
      accusedName: nested(payload, "content.accusedName") || "",
      caseName: nested(payload, "content.caseName") || "",
      reasonLine: nested(payload, "content.reasonLine") || "",
      article1Line: nested(payload, "content.article1Line") || "",
      article2Line: nested(payload, "content.article2Line") || "",
    },
    recipients: {
      line1: nested(payload, "recipients.line1") || "",
      line2: nested(payload, "recipients.line2") || "",
      archiveLine: nested(payload, "recipients.archiveLine") || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: nested(payload, "signature.signMode") || EMPTY_FORM.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") || EMPTY_FORM.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    },
  };
}

function buildSaveBody(form: Bm155Form) {
  return {
    agency: form.agency,
    document: form.document,
    official: form.official,
    legalBasis: form.legalBasis,
    content: form.content,
    recipients: form.recipients,
    signature: form.signature,
  };
}

export function Bm155FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm155Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const patch = <S extends keyof Bm155Form, K extends keyof Bm155Form[S]>(
    section: S,
    key: K,
    value: Bm155Form[S][K],
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
      if (res.ok) setForm(normalizeForm((await res.json()) as RenderPayload));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
      setMessage("Đã lưu thành công.");
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
    if (error) return { kind: "error" as const, text: error };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-155"
        title="Dữ liệu biểu mẫu QĐ phục hồi vụ án đối với bị can"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 155/HS · Căn cứ Điều 41, 251 BLTTHS 2015."
        isDirty={false}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-155"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>
          {status.text}
        </BmFormStatus>
      )}

      <BmFormSection title="1. Header biểu mẫu">
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          value={form.agency.parentName}
          onChange={(v) => patch("agency", "parentName", v)}
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          value={form.agency.name}
          onChange={(v) => patch("agency", "name", v)}
        />
        <BmFieldText
          label="Số quyết định"
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
        />
        <BmFieldText
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(v) => patch("agency", "issuePlace", v)}
        />
        <BmFieldDate
          label="Ngày ban hành"
          value={form.document.issueDate}
          onChange={(v) => patch("document", "issueDate", v)}
        />
        <BmFieldText
          label="Chủ thể ban hành"
          fullWidth
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
        />
      </BmFormSection>

      <BmFormSection title="2. Căn cứ pháp lý">
        <BmFieldTextarea
          label="Căn cứ BLTTHS"
          fullWidth
          value={form.legalBasis.procedureArticlesLine}
          onChange={(v) => patch("legalBasis", "procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ QĐ đình chỉ bị huỷ"
          fullWidth
          value={form.legalBasis.suspensionDecisionLine}
          onChange={(v) => patch("legalBasis", "suspensionDecisionLine", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection title="3. Nội dung phục hồi">
        <BmFieldText
          label="Số QĐ đình chỉ bị huỷ"
          value={form.content.suspensionDecisionCode}
          onChange={(v) => patch("content", "suspensionDecisionCode", v)}
        />
        <BmFieldDate
          label="Ngày QĐ đình chỉ bị huỷ"
          value={form.content.suspensionDecisionDate}
          onChange={(v) => patch("content", "suspensionDecisionDate", v)}
        />
        <BmFieldText
          label="Tên bị can"
          value={form.content.accusedName}
          onChange={(v) => patch("content", "accusedName", v)}
        />
        <BmFieldText
          label="Tên vụ án"
          value={form.content.caseName}
          onChange={(v) => patch("content", "caseName", v)}
        />
        <BmFieldTextarea
          label="Lý do phục hồi"
          fullWidth
          value={form.content.reasonLine}
          onChange={(v) => patch("content", "reasonLine", v)}
          rows={3}
        />
        <BmFieldTextarea
          label="Điều 1"
          fullWidth
          value={form.content.article1Line}
          onChange={(v) => patch("content", "article1Line", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Điều 2"
          fullWidth
          value={form.content.article2Line}
          onChange={(v) => patch("content", "article2Line", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection title="4. Nơi nhận">
        <BmFieldText
          label="Nơi nhận 1"
          value={form.recipients.line1}
          onChange={(v) => patch("recipients", "line1", v)}
        />
        <BmFieldText
          label="Nơi nhận 2"
          value={form.recipients.line2}
          onChange={(v) => patch("recipients", "line2", v)}
        />
        <BmFieldText
          label="Lưu hồ sơ"
          fullWidth
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
        />
      </BmFormSection>

      <BmFormSection title="5. Chữ ký">
        <BmFieldText
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(v) => patch("signature", "signMode", v)}
        />
        <BmFieldText
          label="Chức vụ ký"
          value={form.signature.positionTitle}
          onChange={(v) => patch("signature", "positionTitle", v)}
        />
        <BmFieldText
          label="Người ký"
          value={form.signature.signerName}
          onChange={(v) => patch("signature", "signerName", v)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-155"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
