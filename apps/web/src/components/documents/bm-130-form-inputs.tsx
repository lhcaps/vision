"use client";

/**
 * BM-130 — QĐ trưng cầu giám định lại
 * Stage: PHUC_HOI_XAC_MINH, Group: G99. TT 03/2026-VKSTC, Mẫu số 130/HS.
 *
 * Căn cứ: Điều 36, 37, 51 BLTTHS 2015.
 * Nghiệp vụ: VKS ra QĐ trưng cầu giám định lại khi có căn cứ.
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
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string };
type DocumentForm = { documentCode: string; issuePlace: string; issueDateIso: string };
type OfficialForm = { issuerTitle: string };
type DecisionForm = {
  procedureArticlesLine: string;
  caseTitle: string;
  offenseName: string;
  originalAppraisalCode: string;
  originalAppraisalDate: string;
  originalAppraisalAgency: string;
  reappraisalReason: string;
  reasonLine: string;
};
type RecipientsForm = { archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm130Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  decision: DecisionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm130Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  document: { documentCode: "130/QĐ-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  decision: {
    procedureArticlesLine: "Căn cứ các điều 36, 37 và 51 của Bộ luật Tố tụng hình sự;",
    caseTitle: "",
    offenseName: "",
    originalAppraisalCode: "",
    originalAppraisalDate: "",
    originalAppraisalAgency: "",
    reappraisalReason: "",
    reasonLine: "",
  },
  recipients: { archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Viện kiểm sát cấp trên", "agency.parentName"],
  ["Viện kiểm sát ban hành", "agency.name"],
  ["Số quyết định", "document.documentCode"],
  ["Địa danh", "document.issuePlace"],
  ["Ngày ban hành", "document.issueDateIso"],
  ["Chủ thể ban hành", "official.issuerTitle"],
  ["Căn cứ pháp luật", "decision.procedureArticlesLine"],
  ["Tên vụ án", "decision.caseTitle"],
  ["Số giám định gốc", "decision.originalAppraisalCode"],
  ["Lý do giám định lại", "decision.reappraisalReason"],
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

function buildIssuePlaceAndDateLine(form: Bm130Form): string {
  const place = form.document.issuePlace.trim();
  const dateText = toVietnameseDateText(form.document.issueDateIso);
  return place ? `${place}, ${dateText}` : dateText;
}

function buildReasonLine(form: Bm130Form): string {
  const d = form.decision;
  if (!d.caseTitle) return "";
  const parts: string[] = [
    `Qua xét nội dung vụ án ${d.caseTitle.trim()}`,
    d.offenseName ? `về tội "${d.offenseName.trim()}"` : "",
    `, căn cứ kết luận giám định số ${d.originalAppraisalCode.trim()}`,
    d.originalAppraisalDate ? ` ngày ${cleanText(d.originalAppraisalDate)}` : "",
    ` của ${d.originalAppraisalAgency.trim()}.`,
    ` Có căn cứ cho rằng cần giám định lại vì ${d.reappraisalReason.trim()}.`,
  ];
  return parts.filter(Boolean).join("");
}

function normalizeFormInputs(payload: RenderPayload | null): Bm130Form {
  const f = EMPTY_FORM;
  if (!payload) return f;
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
        parseDateToIso(nested(payload, "document.issueDate")) || f.document.issueDateIso,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle,
    },
    decision: {
      procedureArticlesLine:
        nested(payload, "decision.procedureArticlesLine") || f.decision.procedureArticlesLine,
      caseTitle:
        nested(payload, "decision.caseTitle") || nested(payload, "case.caseTitle") || "",
      offenseName:
        nested(payload, "decision.offenseName") || nested(payload, "offense.offenseName") || "",
      originalAppraisalCode: nested(payload, "decision.originalAppraisalCode") || "",
      originalAppraisalDate: nested(payload, "decision.originalAppraisalDate") || "",
      originalAppraisalAgency: nested(payload, "decision.originalAppraisalAgency") || "",
      reappraisalReason: nested(payload, "decision.reappraisalReason") || "",
      reasonLine: nested(payload, "decision.reasonLine") || "",
    },
    recipients: { archiveLine: nested(payload, "recipients.archiveLine") || f.recipients.archiveLine },
    signature: {
      signMode: nested(payload, "signature.signMode") || f.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") || f.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    },
  };
}

function lookupValue(form: Bm130Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function validateForm(form: Bm130Form): string[] {
  return REQUIRED_FIELDS.filter(([, path]) => !lookupValue(form, path)).map(([label]) => label);
}

function buildSaveBody(form: Bm130Form) {
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
      procedureArticlesLine: form.decision.procedureArticlesLine,
      caseTitle: form.decision.caseTitle,
      offenseName: form.decision.offenseName,
      originalAppraisalCode: form.decision.originalAppraisalCode,
      originalAppraisalDate: form.decision.originalAppraisalDate,
      originalAppraisalAgency: form.decision.originalAppraisalAgency,
      reappraisalReason: form.decision.reappraisalReason,
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

export function Bm130FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm130Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm130Form, K extends keyof Bm130Form[S]>(
    section: S,
    key: K,
    value: Bm130Form[S][K],
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
      setMessage("Đã tải dữ liệu BM-130 từ backend.");
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
      setMessage("Đã lưu BM-130 thành công.");
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
        templateCode="BM-130"
        title="Dữ liệu biểu mẫu QĐ trưng cầu giám định lại"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 130/HS · Căn cứ Điều 36, 37, 51 BLTTHS 2015."
        isDirty={false}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={validationErrors.length > 0 ? `Còn thiếu: ${validationErrors.join(", ")}` : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-130"}
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

      <BmFormSection
        title="1. Header biểu mẫu"
        description="Thông tin cơ quan ban hành và số hiệu văn bản."
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
          label="Chủ thể ban hành"
          required
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="2. Thông tin trưng cầu giám định lại"
        description="Nhập thông tin giám định lại."
      >
        <BmFieldTextarea
          label="Căn cứ pháp luật"
          required
          fullWidth
          value={form.decision.procedureArticlesLine}
          onChange={(v) => patch("decision", "procedureArticlesLine", v)}
          rows={2}
        />
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
          label="Số giám định gốc"
          required
          value={form.decision.originalAppraisalCode}
          onChange={(v) => patch("decision", "originalAppraisalCode", v)}
        />
        <BmFieldText
          label="Ngày giám định gốc"
          value={form.decision.originalAppraisalDate}
          onChange={(v) => patch("decision", "originalAppraisalDate", v)}
        />
        <BmFieldText
          label="Đơn vị giám định gốc"
          value={form.decision.originalAppraisalAgency}
          onChange={(v) => patch("decision", "originalAppraisalAgency", v)}
        />
        <BmFieldTextarea
          label="Lý do giám định lại"
          required
          fullWidth
          value={form.decision.reappraisalReason}
          onChange={(v) => patch("decision", "reappraisalReason", v)}
          rows={3}
        />
        <BmFieldTextarea
          label="Nội dung QĐ tự sinh"
          fullWidth
          value={buildReasonLine(form)}
          readOnly
          rows={3}
          onChange={() => undefined}
        />
      </BmFormSection>

      <BmFormSection title="3. Nơi nhận và chữ ký">
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-130"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
