"use client";

/**
 * BM-106 — QĐ gia hạn thời hạn điều tra VAHS
 * Stage: DIEU_TRA, Group: G04. TT 03/2026-VKSTC, Mẫu số 106/HS.
 *
 * Căn cứ: Điều 36, 172 BLTTHS 2015.
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

type AgencyForm = { parentName: string; name: string };
type DocumentForm = { documentCode: string; issuePlace: string; issueDateIso: string };
type OfficialForm = { issuerTitle: string };
type DecisionForm = {
  caseTitle: string;
  offenseName: string;
  investigationDeadline: string;
  reasonLine: string;
};
type RecipientsForm = { archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm106Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  decision: DecisionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm106Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  document: { documentCode: "106/QĐ-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  decision: {
caseTitle: "",
    offenseName: "",
    investigationDeadline: "",
    reasonLine: ""
  },
  recipients: { archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: { signMode: "KT. VIỆN TRƯỞNG", positionTitle: "PHÓ VIỆN TRƯỞNG", signerName: "" },
};

function cleanText(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function nested(payload: RenderPayload | null, path: string): string {
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let cur: any = payload;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = cur[p];
  }
  return cleanText(cur);
}

function parseDateToIso(v: string): string {
  const raw = cleanText(v);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
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

function buildIssuePlaceAndDateLine(form: Bm106Form): string {
  return issuePlaceDateLine(form.document.issuePlace, form.document.issueDateIso);
}

function buildReasonLine(form: Bm106Form): string {
  const d = form.decision;
  if (!d.caseTitle) return "";
  return `Xét thấy cần gia hạn thời hạn điều tra vụ án hình sự ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}". ${d.investigationDeadline ? `Thời hạn gia hạn: ${d.investigationDeadline.trim()}.` : ""} ${d.reasonLine || ""}`.trim();
}

function normalizeFormInputs(payload: RenderPayload | null): Bm106Form {
  const f = EMPTY_FORM;
  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || f.agency.parentName,
      name: nested(payload, "agency.name") || f.agency.name,
    },
    document: {
      documentCode: nested(payload, "document.documentCode") || f.document.documentCode,
      issuePlace:
        nested(payload, "document.issuePlace") ||
        nested(payload, "agency.issuePlace") ||
        f.document.issuePlace,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) ||
        f.document.issueDateIso,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle,
    },
    decision: {
      caseTitle: nested(payload, "decision.caseTitle") || "",
      offenseName: nested(payload, "decision.offenseName") || "",
      investigationDeadline: nested(payload, "decision.investigationDeadline") || "",
      reasonLine: nested(payload, "decision.reasonLine") || "",
    },
    recipients: {
      archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine,
    },
    signature: {
      signMode: nested(payload, "signature.signMode") || f.signature.signMode,
      positionTitle: nested(payload, "signature.positionTitle") || f.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    },
  };
}

function lookupValue(form: Bm106Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: any = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = cur[p];
  }
  return cleanText(cur);
}

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Viện kiểm sát cấp trên", "agency.parentName"],
  ["Viện kiểm sát ban hành", "agency.name"],
  ["Số quyết định", "document.documentCode"],
  ["Địa danh", "document.issuePlace"],
  ["Ngày ban hành", "document.issueDateIso"],
  ["Chủ thể ban hành", "official.issuerTitle"],
  ["Chế độ ký", "signature.signMode"],
  ["Chức vụ ký", "signature.positionTitle"],
  ["Người ký", "signature.signerName"],
];

function validateForm(form: Bm106Form): string[] {
  return REQUIRED_FIELDS.filter(([, p]) => !lookupValue(form, p)).map(([l]) => l);
}

function buildSaveBody(form: Bm106Form) {
  return {
    agency: {
      parentName: form.agency.parentName,
      name: form.agency.name,
      issuePlace: form.document.issuePlace,
    },
    document: {
      documentCode: form.document.documentCode,
      issueDate: toSlashDateText(form.document.issueDateIso),
      issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(/^ngày\s+/iu, ""),
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form),
    },
    official: { issuerTitle: form.official.issuerTitle },
    decision: {
      caseTitle: form.decision.caseTitle,
      offenseName: form.decision.offenseName,
      investigationDeadline: form.decision.investigationDeadline,

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

export function Bm106FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm106Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm106Form, K extends keyof Bm106Form[S]>(
    section: S,
    key: K,
    value: Bm106Form[S][K],
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
      setMessage("Đã tải dữ liệu BM-106 từ backend.");
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
      setMessage("Đã lưu BM-106 thành công.");
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
        templateCode="BM-106"
        title="Dữ liệu biểu mẫu QĐ gia hạn thời hạn điều tra VAHS"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 106/HS · Căn cứ Điều 36, 172 BLTTHS 2015."
        isDirty={false}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={validationErrors.length > 0 ? `Còn thiếu: ${validationErrors.join(", ")}` : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-106"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection title="1. Header biểu mẫu" requiredCount={6}>
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

      <BmFormSection title="2. Nội dung gia hạn" description="Thông tin vụ án, tội danh và thời hạn gia hạn." requiredCount={2}>
        <BmFieldText
          label="Tên vụ án"
          required
          value={form.decision.caseTitle}
          onChange={(v) => patch("decision", "caseTitle", v)}
        />
        <BmFieldText
          label="Tội danh"
          value={form.decision.offenseName}
          onChange={(v) => patch("decision", "offenseName", v)}
        />
        <BmFieldText
          label="Thời hạn gia hạn"
          value={form.decision.investigationDeadline}
          onChange={(v) => patch("decision", "investigationDeadline", v)}
        />
        <BmFieldTextarea
          label="Lý do gia hạn"
          fullWidth
          value={form.decision.reasonLine}
          onChange={(v) => patch("decision", "reasonLine", v)}
          rows={3}
        />
        <BmFieldTextarea
          label="Lý do tự sinh"
          fullWidth
          value={buildReasonLine(form)}
          readOnly
          rows={3}
          onChange={() => undefined}
        />
      </BmFormSection>

      <BmFormSection title="3. Nơi nhận và chữ ký" requiredCount={3}>
        <BmFieldText
          label="Lưu hồ sơ"
          fullWidth
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
        />
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-106"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
