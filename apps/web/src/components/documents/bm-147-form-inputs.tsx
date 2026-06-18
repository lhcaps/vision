"use client";

/**
 * BM-147 — Quyết định huỷ bỏ QĐ tạm đình chỉ vụ án
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số 147/HS.
 *
 * Căn cứ: Căn cứ Điều 41, Điều 249 và Điều 250 của Bộ luật Tố tụng hình sự;
 * Nghiệp vụ: Biểu mẫu VKS trong giai đoạn truy tố.
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

type AgencyForm = { parentName: string; name: string; issuePlace: string };
type DocumentForm = { documentCode: string; issueDateIso: string };
type OfficialForm = { issuerTitle: string };
type LegalBasisForm = {
  procedureArticlesLine: string;
  annulledDecisionLine: string;
};
type ContentForm = {
  annulledDecisionCode: string;
  annulledDecisionDate: string;
  caseName: string;
  reasonLine: string;
  article1Line: string;
  article2Line: string;
};
type RecipientsForm = { line1: string; line2: string; archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm147Form = {
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

const EMPTY_FORM: Bm147Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: { documentCode: "QĐ-VKSKV7-HUYBO", issueDateIso: "" },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
  procedureArticlesLine: 'Căn cứ Điều 41, Điều 249 và Điều 250 của Bộ luật Tố tụng hình sự;',
    annulledDecisionLine: "",
  },
  content: {
    annulledDecisionCode: "",
    annulledDecisionDate: "",
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

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> =   [
    ["Viện kiểm sát cấp trên", "agency.parentName"],
    ["Viện kiểm sát ban hành", "agency.name"],
    ["Địa danh ban hành", "agency.issuePlace"],
    ["Số quyết định", "document.documentCode"],
    ["Ngày ban hành", "document.issueDateIso"],
    ["Chủ thể ban hành", "official.issuerTitle"],
    ["Căn cứ BLTTHS", "legalBasis.procedureArticlesLine"],
    ["Căn cứ QĐ tạm đình chỉ bị huỷ", "legalBasis.annulledDecisionLine"],
    ["Tên vụ án", "content.caseName"],
    ["Lý do huỷ bỏ", "content.reasonLine"],
    ["Điều 1", "content.article1Line"],
    ["Điều 2", "content.article2Line"],
    ["Lưu hồ sơ", "recipients.archiveLine"],
    ["Chế độ ký", "signature.signMode"],
    ["Chức vụ ký", "signature.positionTitle"],
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

function buildIssuePlaceAndDateLine(form: Bm147Form): string {
  return issuePlaceDateLine(form.agency.issuePlace, form.document.issueDateIso);
}

function normalizeFormInputs(payload: RenderPayload | null): Bm147Form {
  const f = EMPTY_FORM;
  if (!payload) return f;
  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || f.agency.parentName,
      name: nested(payload, "agency.name") || f.agency.name,
      issuePlace:
        nested(payload, "agency.issuePlace") ||
        nested(payload, "document.issuePlace") ||
        f.agency.issuePlace,
    },
    document: {
      documentCode: nested(payload, "document.documentCode") || f.document.documentCode,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) || f.document.issueDateIso,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle,
    },
    legalBasis: {
        procedureArticlesLine:
          nested(payload, "legalBasis.procedureArticlesLine") || f.legalBasis.procedureArticlesLine,
        annulledDecisionLine: nested(payload, "legalBasis.annulledDecisionLine") || "",
    },
    content: {
      annulledDecisionCode: nested(payload, "content.annulledDecisionCode") || "",
      annulledDecisionDate: nested(payload, "content.annulledDecisionDate") || "",
      caseName: nested(payload, "content.caseName") || "",
      reasonLine: nested(payload, "content.reasonLine") || "",
      article1Line: nested(payload, "content.article1Line") || "",
      article2Line: nested(payload, "content.article2Line") || "",
    },
    recipients: {
      line1: nested(payload, "recipients.line1") || "",
      line2: nested(payload, "recipients.line2") || "",
      archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine,
    },
    signature: {
      signMode: nested(payload, "signature.signMode") || f.signature.signMode,
      positionTitle: nested(payload, "signature.positionTitle") || f.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    },
  };
}

function lookupValue(form: Bm147Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function validateForm(form: Bm147Form): string[] {
  return REQUIRED_FIELDS.filter(([, path]) => !lookupValue(form, path)).map(
    ([label]) => label,
  );
}

function buildSaveBody(form: Bm147Form) {
  return {
    agency: {
      parentName: form.agency.parentName,
      name: form.agency.name,
      issuePlace: form.agency.issuePlace,
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
    legalBasis: {
      procedureArticlesLine: form.legalBasis.procedureArticlesLine,
      annulledDecisionLine: form.legalBasis.annulledDecisionLine,
    },
    content: {
      annulledDecisionCode: form.content.annulledDecisionCode,
      annulledDecisionDate: form.content.annulledDecisionDate,
      caseName: form.content.caseName,
      reasonLine: form.content.reasonLine,
      article1Line: form.content.article1Line,
      article2Line: form.content.article2Line,
    },
    recipients: {
      line1: form.recipients.line1,
      line2: form.recipients.line2,
      archiveLine: form.recipients.archiveLine,
    },
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

export function Bm147FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm147Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm147Form, K extends keyof Bm147Form[S]>(
    section: S,
    key: K,
    value: Bm147Form[S][K],
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
      setMessage("Đã tải dữ liệu BM-147 từ backend.");
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
      setMessage("Đã lưu BM-147 thành công.");
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
        templateCode="BM-147"
        title="Dữ liệu biểu mẫu Quyết định huỷ bỏ QĐ tạm đình chỉ vụ án"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 147/HS · Căn cứ Điều 41, 249, 250 BLTTHS 2015."
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-147"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection
        title="1. Header biểu mẫu"
        description="Thông tin cơ quan ban hành và số hiệu văn bản."
        requiredCount={6}
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
          label="Số quyết định"
          required
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
        />
        <BmFieldText
          label="Địa danh"
          required
          value={form.agency.issuePlace}
          onChange={(v) => patch("agency", "issuePlace", v)}
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
          label="Chủ thể ban hành"
          required
          fullWidth
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="2. Căn cứ pháp lý"
        description="Căn cứ BLTTHS và các văn bản liên quan."
        requiredCount={2}
      >
        <BmFieldTextarea
                  label="Căn cứ BLTTHS" required
                  fullWidth
                  value={form.legalBasis.procedureArticlesLine}
                  onChange={(v) => patch("legalBasis", "procedureArticlesLine", v)}
                  rows={2}
                />
        <BmFieldTextarea
                  label="Căn cứ QĐ tạm đình chỉ bị huỷ"
                  fullWidth
                  value={form.legalBasis.annulledDecisionLine}
                  onChange={(v) => patch("legalBasis", "annulledDecisionLine", v)}
                  rows={2}
                />
      </BmFormSection>

      <BmFormSection
        title="3. Nội dung huỷ bỏ"
        description=""
        requiredCount={4}
      >
        <BmFieldText
                  label="Số QĐ tạm đình chỉ bị huỷ"
        
                  value={form.content.annulledDecisionCode}
                  onChange={(v) => patch("content", "annulledDecisionCode", v)}
                />
        <BmFieldDate
                  label="Ngày QĐ tạm đình chỉ bị huỷ"
                  value={form.document.issueDateIso}
                  onChange={(v) => patch("document", "issueDateIso", v)}
                />
        <BmFieldText
                  label="Tên vụ án" required
        
                  value={form.content.caseName}
                  onChange={(v) => patch("content", "caseName", v)}
                />
        <BmFieldTextarea
                  label="Lý do huỷ bỏ" required
        
                  fullWidth
                  value={form.content.reasonLine}
                  onChange={(v) => patch("content", "reasonLine", v)} rows={3}
                />
        <BmFieldTextarea
                  label="Điều 1" required
        
                  fullWidth
                  value={form.content.article1Line}
                  onChange={(v) => patch("content", "article1Line", v)} rows={3}
                />
        <BmFieldTextarea
                  label="Điều 2" required
        
                  fullWidth
                  value={form.content.article2Line}
                  onChange={(v) => patch("content", "article2Line", v)} rows={3}
                />
      </BmFormSection>

      <BmFormSection title="4. Nơi nhận">
        <BmFieldText
          label="Nơi nhận 1"
          fullWidth
          value={form.recipients.line1}
          onChange={(v) => patch("recipients", "line1", v)}
        />
        <BmFieldText
          label="Nơi nhận 2"
          fullWidth
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

      <BmFormSection title="5. Chữ ký" requiredCount={3}>
        <BmFieldText
          label="Chế độ ký"
          required
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-147"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
