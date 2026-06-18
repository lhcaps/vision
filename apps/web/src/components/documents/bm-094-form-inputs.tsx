"use client";

/**
 * BM-094 — QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố bị can
 * Stage: KHOI_TO, Group: G02. TT 03/2026-VKSTC, Mẫu số 94/HS.
 *
 * Căn cứ: Điều 154, 156 BLTTHS.
 * Nghiệp vụ: VKS huỷ QĐ bổ sung QĐ khởi tố bị can đã ban hành.
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
type CancelledDecisionForm = {
  cancelledDocumentCode: string;
  cancelledDocumentDate: string;
  cancelledDocumentAgency: string;
  accusedFullName: string;
  caseTitle: string;
  offenseName: string;
};
type RecipientsForm = { archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm094Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  cancelledDecision: CancelledDecisionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const EMPTY_FORM: Bm094Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  document: { documentCode: "94/QĐ-VKSKV7", issuePlace: "TP. Hồ Chí Minh", issueDateIso: "" },
  official: { issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7" },
  cancelledDecision: {
    cancelledDocumentCode: "",
    cancelledDocumentDate: "",
    cancelledDocumentAgency: "",
    accusedFullName: "",
    caseTitle: "",
    offenseName: "",
  },
  recipients: { archiveLine: "- Lưu: HSVA, HSKS, VP." },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

const REQUIRED_FIELDS: ReadonlyArray<[keyof Bm094Form, string, string]> = [
  ["agency", "parentName", "Viện kiểm sát cấp trên"],
  ["agency", "name", "Viện kiểm sát ban hành"],
  ["document", "documentCode", "Số quyết định"],
  ["document", "issuePlace", "Địa danh"],
  ["document", "issueDateIso", "Ngày ban hành"],
  ["official", "issuerTitle", "Chủ thể ban hành"],
  ["cancelledDecision", "cancelledDocumentCode", "Số QĐ bị huỷ"],
  ["cancelledDecision", "accusedFullName", "Họ tên bị can"],
  ["cancelledDecision", "caseTitle", "Tên vụ án"],
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

function buildIssuePlaceAndDateLine(form: Bm094Form): string {
  return issuePlaceDateLine(form.document.issuePlace, form.document.issueDateIso);
}

function buildReasonLine(form: Bm094Form): string {
  const d = form.cancelledDecision;
  if (!d.cancelledDocumentCode || !d.accusedFullName) return "";
  const dateText = toVietnameseDateText(parseDateToIso(d.cancelledDocumentDate));
  return `Xét thấy QĐ số ${d.cancelledDocumentCode.trim()}${dateText ? ` ${dateText}` : ""} của ${d.cancelledDocumentAgency.trim()} về việc bổ sung QĐ khởi tố bị can ${d.accusedFullName.trim()} trong vụ án ${d.caseTitle.trim()} về tội "${d.offenseName.trim()}" không có căn cứ và trái pháp luật;`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm094Form {
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
    cancelledDecision: {
      cancelledDocumentCode: nested(payload, "cancelledDecision.cancelledDocumentCode") || "",
      cancelledDocumentDate: nested(payload, "cancelledDecision.cancelledDocumentDate") || "",
      cancelledDocumentAgency: nested(payload, "cancelledDecision.cancelledDocumentAgency") || "",
      accusedFullName:
        nested(payload, "cancelledDecision.accusedFullName") ||
        nested(payload, "accused.fullName") ||
        nested(payload, "suspect.fullName") ||
        "",
      caseTitle:
        nested(payload, "cancelledDecision.caseTitle") || nested(payload, "case.caseTitle") || "",
      offenseName:
        nested(payload, "cancelledDecision.offenseName") ||
        nested(payload, "offense.offenseName") ||
        "",
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

function validateForm(form: Bm094Form): string[] {
  return REQUIRED_FIELDS.filter(([section, key]) => {
    const sectionValue = form[section] as unknown as Record<string, string>;
    return !String(sectionValue?.[key] ?? "").trim();
  }).map(([, , label]) => label);
}

function buildSaveBody(form: Bm094Form) {
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(form);
  const cancelledDateIso = parseDateToIso(form.cancelledDecision.cancelledDocumentDate);
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
    cancelledDecision: {
      cancelledDocumentCode: form.cancelledDecision.cancelledDocumentCode,
      cancelledDocumentDate: toSlashDateText(cancelledDateIso),
      cancelledDocumentAgency: form.cancelledDecision.cancelledDocumentAgency,
      accusedFullName: form.cancelledDecision.accusedFullName,
      caseTitle: form.cancelledDecision.caseTitle,
      offenseName: form.cancelledDecision.offenseName,
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

export function Bm094FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm094Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const issuePlaceAndDateLine = useMemo(() => buildIssuePlaceAndDateLine(form), [form]);
  const reasonLine = useMemo(() => buildReasonLine(form), [form]);

  const patch = <S extends keyof Bm094Form, K extends keyof Bm094Form[S]>(
    section: S,
    key: K,
    value: Bm094Form[S][K],
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
      setMessage("Đã tải dữ liệu BM-094 từ backend.");
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
      setMessage("Đã lưu BM-094 thành công.");
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
        templateCode="BM-094"
        title="Dữ liệu biểu mẫu QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố bị can"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 93/HS · Stage KHOI_TO (G02). Căn cứ Điều 154, 156 BLTTHS."
        isDirty={Boolean(message?.includes("mẫu") || message?.includes("đồng bộ"))}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-094"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton<Bm094Form>
            templateCode="BM-094"
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
        title="2. Quyết định bị huỷ bỏ"
        description="Nhập thông tin QĐ thay đổi khởi tố bị can cần huỷ bỏ."
      >
        <BmFieldText
          label="Số QĐ bị huỷ"
          required
          value={form.cancelledDecision.cancelledDocumentCode}
          onChange={(v) => patch("cancelledDecision", "cancelledDocumentCode", v)}
        />
        <BmFieldDate
          label="Ngày QĐ bị huỷ"
          value={parseDateToIso(form.cancelledDecision.cancelledDocumentDate)}
          onChange={(v) => patch("cancelledDecision", "cancelledDocumentDate", v)}
        />
        <BmFieldText
          label="Cơ quan ban hành QĐ bị huỷ"
          value={form.cancelledDecision.cancelledDocumentAgency}
          onChange={(v) => patch("cancelledDecision", "cancelledDocumentAgency", v)}
        />
        <BmFieldText
          label="Họ tên bị can"
          required
          value={form.cancelledDecision.accusedFullName}
          onChange={(v) => patch("cancelledDecision", "accusedFullName", v)}
        />
        <BmFieldText
          label="Tên vụ án"
          required
          value={form.cancelledDecision.caseTitle}
          onChange={(v) => patch("cancelledDecision", "caseTitle", v)}
        />
        <BmFieldText
          label="Tội danh"
          value={form.cancelledDecision.offenseName}
          onChange={(v) => patch("cancelledDecision", "offenseName", v)}
        />
        <BmFieldTextarea
          label="Lý do huỷ bỏ tự sinh"
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-094"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
