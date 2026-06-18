"use client";

/**
 * BM-143 — Quyết định tách vụ án hình sự trong giai đoạn truy tố
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số 143/HS.
 *
 * Căn cứ: Điều 41, 245 BLTTHS 2015.
 * Nghiệp vụ: VKS tách một phần VAHS ra thành VAHS độc lập.
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
type LegalBasisForm = { procedureArticlesLine: string; splitDecisionLine: string };
type ContentForm = {
  originalCaseCode: string;
  originalCaseName: string;
  separatedCaseCode: string;
  separatedCaseName: string;
  retainedCaseCode: string;
  retainedCaseName: string;
  article1Line: string;
  article2Line: string;
};
type RecipientsForm = { line1: string; line2: string; archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm143Form = {
  agency: AgencyForm;
  document: DocumentForm;
  legalBasis: LegalBasisForm;
  content: ContentForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm143Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: { documentCode: "QĐ-VKSKV7-TACH", issueDateIso: "" },
  legalBasis: {
    procedureArticlesLine: "Căn cứ Điều 41 và Điều 245 của Bộ luật Tố tụng hình sự;",
    splitDecisionLine: "",
  },
  content: {
    originalCaseCode: "",
    originalCaseName: "",
    separatedCaseCode: "",
    separatedCaseName: "",
    retainedCaseCode: "",
    retainedCaseName: "",
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

const REQUIRED_FIELDS: ReadonlyArray<[keyof Bm143Form, string, string]> = [
  ["agency", "parentName", "Viện kiểm sát cấp trên"],
  ["agency", "name", "Viện kiểm sát ban hành"],
  ["agency", "issuePlace", "Địa danh ban hành"],
  ["document", "documentCode", "Số quyết định"],
  ["document", "issueDateIso", "Ngày ban hành"],
  ["legalBasis", "procedureArticlesLine", "Căn cứ BLTTHS"],
  ["legalBasis", "splitDecisionLine", "Căn cứ QĐ tách vụ án"],
  ["content", "originalCaseCode", "Mã vụ án gốc"],
  ["content", "originalCaseName", "Tên vụ án gốc"],
  ["content", "separatedCaseCode", "Mã vụ án tách ra"],
  ["content", "separatedCaseName", "Tên vụ án tách ra"],
  ["content", "retainedCaseCode", "Mã vụ án giữ lại"],
  ["content", "retainedCaseName", "Tên vụ án giữ lại"],
  ["content", "article1Line", "Điều 1"],
  ["content", "article2Line", "Điều 2"],
  ["recipients", "archiveLine", "Lưu hồ sơ"],
  ["signature", "signMode", "Chế độ ký"],
  ["signature", "positionTitle", "Chức vụ ký"],
  ["signature", "signerName", "Người ký"],
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

function buildIssuePlaceAndDateLine(form: Bm143Form): string {
  return issuePlaceDateLine(
    form.agency.issuePlace,
    form.document.issueDateIso,
  );
}

function buildArticle1Line(form: Bm143Form): string {
  const c = form.content;
  return `Tách từ vụ án ${c.originalCaseName.trim() || c.originalCaseCode.trim()} vụ án ${c.separatedCaseName.trim() || c.separatedCaseCode.trim()} để giải quyết độc lập. Vụ án gốc giữ lại là vụ án ${c.retainedCaseName.trim() || c.retainedCaseCode.trim()}.`;
}

function buildArticle2Line(form: Bm143Form): string {
  return "Vụ án tách được thụ lý từ giai đoạn điều tra; hồ sơ, vật chứng, bị can liên quan (nếu có) được chuyển kèm theo quy định của Bộ luật Tố tụng hình sự./.";
}

function normalizeFormInputs(payload: RenderPayload | null): Bm143Form {
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
      documentCode:
        nested(payload, "document.documentCode") || f.document.documentCode,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) ||
        f.document.issueDateIso,
    },
    legalBasis: {
      procedureArticlesLine:
        nested(payload, "legalBasis.procedureArticlesLine") ||
        f.legalBasis.procedureArticlesLine,
      splitDecisionLine:
        nested(payload, "legalBasis.splitDecisionLine") || "",
    },
    content: {
      originalCaseCode: nested(payload, "content.originalCaseCode") || "",
      originalCaseName: nested(payload, "content.originalCaseName") || "",
      separatedCaseCode: nested(payload, "content.separatedCaseCode") || "",
      separatedCaseName: nested(payload, "content.separatedCaseName") || "",
      retainedCaseCode: nested(payload, "content.retainedCaseCode") || "",
      retainedCaseName: nested(payload, "content.retainedCaseName") || "",
      article1Line: nested(payload, "content.article1Line") || "",
      article2Line: nested(payload, "content.article2Line") || "",
    },
    recipients: {
      line1: nested(payload, "recipients.line1") || "",
      line2: nested(payload, "recipients.line2") || "",
      archiveLine:
        nested(payload, "recipients.archiveLine") || f.recipients.archiveLine,
    },
    signature: {
      signMode: nested(payload, "signature.signMode") || f.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") || f.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    },
  };
}

function lookupValue(form: Bm143Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function validateForm(form: Bm143Form): string[] {
  return REQUIRED_FIELDS.filter(([, , path]) => !lookupValue(form, path)).map(
    ([, label]) => label,
  );
}

function buildSaveBody(form: Bm143Form) {
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
    legalBasis: {
      procedureArticlesLine: form.legalBasis.procedureArticlesLine,
      splitDecisionLine: form.legalBasis.splitDecisionLine,
    },
    content: {
      originalCaseCode: form.content.originalCaseCode,
      originalCaseName: form.content.originalCaseName,
      separatedCaseCode: form.content.separatedCaseCode,
      separatedCaseName: form.content.separatedCaseName,
      retainedCaseCode: form.content.retainedCaseCode,
      retainedCaseName: form.content.retainedCaseName,
      article1Line: form.content.article1Line || buildArticle1Line(form),
      article2Line: form.content.article2Line || buildArticle2Line(form),
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

export function Bm143FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm143Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm143Form, K extends keyof Bm143Form[S]>(
    section: S,
    key: K,
    value: Bm143Form[S][K],
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
      setMessage("Đã tải dữ liệu BM-143 từ backend.");
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
      setMessage("Đã lưu BM-143 thành công.");
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
        templateCode="BM-143"
        title="Dữ liệu biểu mẫu QĐ tách vụ án hình sự trong giai đoạn truy tố"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 143/HS · Căn cứ Điều 41, 245 BLTTHS 2015."
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-143"}
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
      </BmFormSection>

      <BmFormSection
        title="2. Căn cứ pháp lý"
        description="Căn cứ BLTTHS và QĐ tách vụ án."
        requiredCount={2}
      >
        <BmFieldTextarea
          label="Căn cứ BLTTHS"
          required
          fullWidth
          value={form.legalBasis.procedureArticlesLine}
          onChange={(v) => patch("legalBasis", "procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ QĐ tách vụ án"
          required
          fullWidth
          value={form.legalBasis.splitDecisionLine}
          onChange={(v) => patch("legalBasis", "splitDecisionLine", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection
        title="3. Nội dung tách vụ án"
        description="Thông tin vụ án gốc, vụ án tách ra, vụ án giữ lại."
        requiredCount={8}
      >
        <BmFieldText
          label="Mã vụ án gốc"
          required
          value={form.content.originalCaseCode}
          onChange={(v) => patch("content", "originalCaseCode", v)}
        />
        <BmFieldText
          label="Tên vụ án gốc"
          required
          fullWidth
          value={form.content.originalCaseName}
          onChange={(v) => patch("content", "originalCaseName", v)}
        />
        <BmFieldText
          label="Mã vụ án tách ra"
          required
          value={form.content.separatedCaseCode}
          onChange={(v) => patch("content", "separatedCaseCode", v)}
        />
        <BmFieldText
          label="Tên vụ án tách ra"
          required
          fullWidth
          value={form.content.separatedCaseName}
          onChange={(v) => patch("content", "separatedCaseName", v)}
        />
        <BmFieldText
          label="Mã vụ án giữ lại"
          required
          value={form.content.retainedCaseCode}
          onChange={(v) => patch("content", "retainedCaseCode", v)}
        />
        <BmFieldText
          label="Tên vụ án giữ lại"
          required
          fullWidth
          value={form.content.retainedCaseName}
          onChange={(v) => patch("content", "retainedCaseName", v)}
        />
        <BmFieldTextarea
          label="Điều 1"
          required
          fullWidth
          value={form.content.article1Line}
          onChange={(v) => patch("content", "article1Line", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Điều 2"
          required
          fullWidth
          value={form.content.article2Line}
          onChange={(v) => patch("content", "article2Line", v)}
          rows={2}
        />
        <BmFieldText
          label="Điều 1 tự sinh"
          fullWidth
          value={buildArticle1Line(form)}
          readOnly
          onChange={() => undefined}
        />
        <BmFieldText
          label="Điều 2 tự sinh"
          fullWidth
          value={buildArticle2Line(form)}
          readOnly
          onChange={() => undefined}
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-143"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
