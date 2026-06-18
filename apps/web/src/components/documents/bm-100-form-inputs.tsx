"use client";

/**
 * BM-100 — Yêu cầu ra QĐ bổ sung QĐ khởi tố bị can
 * Stage: KHOI_TO, Group: G02. TT 03/2026-VKSTC, Mẫu số 100/HS.
 *
 * Căn cứ: Điều 36, 37, 167 BLTTHS.
 * Nghiệp vụ: VKS yêu cầu CQĐT ra QĐ bổ sung QĐ khởi tố bị can.
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
  isoDateToVnSlash,
  vnDateLine,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "@/components/documents/bm-form/case-payload-button";

type AgencyForm = { parentName: string; name: string };
type DocumentForm = { documentCode: string; issuePlace: string; issueDateIso: string };
type OfficialForm = { issuerTitle: string };
type RequestForm = {
  procedureArticlesLine: string;
  caseTitle: string;
  offenseName: string;
  accusedFullName: string;
  originalDecisionCode: string;
  originalDecisionDate: string;
  supplementReason: string;
};
type RecipientsForm = { archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm100Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  request: RequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm100Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  document: { documentCode: "100/YCT-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  request: {
    procedureArticlesLine: "Căn cứ các điều 36, 37 và 167 của Bộ luật Tố tụng hình sự;",
    caseTitle: "",
    offenseName: "",
    accusedFullName: "",
    originalDecisionCode: "",
    originalDecisionDate: "",
    supplementReason: "",
  },
  recipients: { archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

const REQUIRED_FIELDS: ReadonlyArray<[keyof Bm100Form, string, string]> = [
  ["agency", "parentName", "Viện kiểm sát cấp trên"],
  ["agency", "name", "Viện kiểm sát ban hành"],
  ["document", "documentCode", "Số yêu cầu"],
  ["document", "issuePlace", "Địa danh"],
  ["document", "issueDateIso", "Ngày ban hành"],
  ["official", "issuerTitle", "Chủ thể ban hành"],
  ["request", "procedureArticlesLine", "Căn cứ pháp luật"],
  ["request", "caseTitle", "Tên vụ án"],
  ["request", "offenseName", "Tội danh"],
  ["request", "accusedFullName", "Họ tên bị can"],
  ["request", "supplementReason", "Lý do bổ sung"],
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
  return vnDateLine(isoDate, isoDate || "");
}

function toSlashDateText(isoDate: string): string {
  return isoDateToVnSlash(isoDate) || isoDate || "";
}

function buildIssuePlaceAndDateLine(form: Bm100Form): string {
  return issuePlaceDateLine(form.document.issuePlace, form.document.issueDateIso);
}

function buildReasonLine(form: Bm100Form): string {
  const r = form.request;
  if (!r.accusedFullName || !r.caseTitle) return "";
  return `Qua xét nội dung vụ án ${r.caseTitle.trim()}, có căn cứ cho rằng QĐ số ${r.originalDecisionCode.trim()}${r.originalDecisionDate ? ` ngày ${cleanText(r.originalDecisionDate)}` : ""} về việc khởi tố bị can ${r.accusedFullName.trim()} về tội "${r.offenseName.trim()}" cần được bổ sung vì ${r.supplementReason.trim()}.`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm100Form {
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
        parseDateToIso(nested(payload, "document.issueDate")) || f.document.issueDateIso,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle,
    },
    request: {
      procedureArticlesLine:
        nested(payload, "request.procedureArticlesLine") || f.request.procedureArticlesLine,
      caseTitle:
        nested(payload, "request.caseTitle") || nested(payload, "case.caseTitle") || "",
      offenseName:
        nested(payload, "request.offenseName") || nested(payload, "offense.offenseName") || "",
      accusedFullName:
        nested(payload, "request.accusedFullName") ||
        nested(payload, "accused.fullName") ||
        nested(payload, "suspect.fullName") ||
        "",
      originalDecisionCode: nested(payload, "request.originalDecisionCode") || "",
      originalDecisionDate: nested(payload, "request.originalDecisionDate") || "",
      supplementReason: nested(payload, "request.supplementReason") || "",
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

function validateForm(form: Bm100Form): string[] {
  return REQUIRED_FIELDS.filter(([section, key]) => {
    const sectionValue = form[section] as unknown as Record<string, string>;
    return !String(sectionValue?.[key] ?? "").trim();
  }).map(([, , label]) => label);
}

function buildSaveBody(form: Bm100Form) {
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(form);
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
      issuePlaceAndDateLine,
    },
    official: { issuerTitle: form.official.issuerTitle },
    request: {
      procedureArticlesLine: form.request.procedureArticlesLine,
      caseTitle: form.request.caseTitle,
      offenseName: form.request.offenseName,
      accusedFullName: form.request.accusedFullName,
      originalDecisionCode: form.request.originalDecisionCode,
      originalDecisionDate: form.request.originalDecisionDate,
      supplementReason: form.request.supplementReason,
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

export function Bm100FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm100Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const issuePlaceAndDateLine = useMemo(() => buildIssuePlaceAndDateLine(form), [form]);
  const reasonLine = useMemo(() => buildReasonLine(form), [form]);

  const patch = <S extends keyof Bm100Form, K extends keyof Bm100Form[S]>(
    section: S,
    key: K,
    value: Bm100Form[S][K],
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
      const payload = (await res.json()) as RenderPayload;
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải dữ liệu BM-100 từ backend.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tải.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const errors = validateForm(form);
    if (errors.length > 0) {
      setError(`Thiếu: ${errors.join(", ")}`);
      return;
    }
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
      setMessage("Đã lưu BM-100 thành công.");
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
    if (validationErrors.length > 0)
      return { kind: "warning" as const, text: `Còn thiếu: ${validationErrors.join(", ")}` };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  const statusTitle =
    status.kind === "success"
      ? "Thành công"
      : status.kind === "error"
        ? "Lỗi"
        : status.kind === "warning"
          ? "Thiếu dữ liệu"
          : status.kind === "loading"
            ? "Đang xử lý"
            : undefined;

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-100"
        title="Dữ liệu biểu mẫu Yêu cầu ra QĐ bổ sung QĐ khởi tố bị can"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 100/HS · Stage KHOI_TO (G02). Căn cứ Điều 36, 37, 167 BLTTHS."
        isDirty={Boolean(message?.includes("mẫu") || message?.includes("đồng bộ"))}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-100"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton<Bm100Form>
            templateCode="BM-100"
            form={form}
            onApply={(next) => {
              setForm(next);
              setMessage("Đã lấy dữ liệu từ vụ án. Bấm lưu để ghi vào backend.");
            }}
          />
        }
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind} title={statusTitle}>
          {status.text}
        </BmFormStatus>
      )}

      <BmFormSection title="1. Header biểu mẫu">
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
          label="Số yêu cầu"
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
        <BmFieldTextarea
          label="Dòng địa danh/ngày tự sinh"
          value={issuePlaceAndDateLine}
          readOnly
          onChange={() => undefined}
          rows={2}
        />
        <BmFieldText
          label="Chủ thể ban hành"
          required
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="2. Nội dung yêu cầu"
        description="Nhập thông tin QĐ khởi tố bị can cần bổ sung và lý do bổ sung."
      >
        <BmFieldTextarea
          label="Căn cứ pháp luật"
          required
          value={form.request.procedureArticlesLine}
          onChange={(v) => patch("request", "procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldText
          label="Tên vụ án"
          required
          value={form.request.caseTitle}
          onChange={(v) => patch("request", "caseTitle", v)}
        />
        <BmFieldText
          label="Tội danh"
          required
          value={form.request.offenseName}
          onChange={(v) => patch("request", "offenseName", v)}
        />
        <BmFieldText
          label="Họ tên bị can"
          required
          value={form.request.accusedFullName}
          onChange={(v) => patch("request", "accusedFullName", v)}
        />
        <BmFieldText
          label="Số QĐ khởi tố bị cần thay đổi"
          value={form.request.originalDecisionCode}
          onChange={(v) => patch("request", "originalDecisionCode", v)}
        />
        <BmFieldDate
          label="Ngày QĐ khởi tố"
          value={parseDateToIso(form.request.originalDecisionDate)}
          onChange={(v) => patch("request", "originalDecisionDate", v)}
        />
        <BmFieldTextarea
          label="Lý do bổ sung"
          required
          value={form.request.supplementReason}
          onChange={(v) => patch("request", "supplementReason", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Lý do yêu cầu tự sinh"
          value={reasonLine}
          readOnly
          onChange={() => undefined}
          rows={4}
        />
      </BmFormSection>

      <BmFormSection title="3. Nơi nhận và chữ ký">
        <BmFieldText
          label="Lưu hồ sơ"
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-100"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
