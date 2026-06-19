"use client";

/**
 * BM-089 — QĐ huỷ bỏ QĐ tách vụ án hình sự
 * Stage: KHoi_TO, Group: G02 (BP_NGAN_CHAN). TT 03/2026-VKSTC, Mẫu số 89/HS.
 *
 * Căn cứ: Điều 156 BLTTHS 2015 — huỷ bỏ QĐ tách vụ án không có căn cứ, trái pháp luật.
 * Nghiệp vụ: VKS huỷ bỏ QĐ tách vụ án hình sự đã ban hành khi xét thấy không có căn cứ và trái pháp luật.
 */
import { useEffect, useMemo, useState } from "react";
import {
  BmFormSection,
  BmFieldText,
  BmFieldDate,
  BmFieldTextarea,
  BmFormActions,
  BmFormStatus,
  BmFormMetaBar,
  defaultArchiveLine,
  issuePlaceDateLine,
  isoDateToVnSlash,
  vnDateLine,
  todayIsoDate,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

type AgencyForm = {
  parentName: string;
  name: string;
};

type DocumentForm = {
  documentCode: string;
  issuePlace: string;
  issueDateIso: string;
  issuePlaceAndDateLine: string;
};

type OfficialForm = {
  issuerTitle: string;
};

type CancelledDecisionForm = {
  cancelledDocumentCode: string;
  cancelledDocumentDateIso: string;
  cancelledDocumentAgency: string;
  caseTitle: string;
  offenseName: string;
  reasonLine: string;
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm089Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  cancelledDecision: CancelledDecisionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm089FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_PARENT_NAME =
  "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH";
const DEFAULT_AGENCY_NAME = "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7";
const DEFAULT_DOCUMENT_CODE = "89/QĐ-VKSKV7";
const DEFAULT_ISSUE_PLACE = "TP. Hồ Chí Minh";
const DEFAULT_ISSUER_TITLE = "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7";
const DEFAULT_SIGN_MODE = "KT. VIỆN TRƯỞNG";
const DEFAULT_POSITION_TITLE = "PHÓ VIỆN TRƯỞNG";

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function nested(payload: RenderPayload | null, path: string): string {
  if (!payload) return "";
  const parts = path.split(".").filter(Boolean);
  let current: any = payload;
  for (const part of parts) {
    if (!current || typeof current !== "object") return "";
    current = current[part];
  }
  return cleanText(current);
}

function normalizeIsoDate(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return raw;
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (slash) {
    const day = slash[1].padStart(2, "0");
    const month = slash[2].padStart(2, "0");
    return `${slash[3]}-${month}-${day}`;
  }
  return "";
}

const EMPTY_FORM: Bm089Form = {
  agency: {
    parentName: DEFAULT_PARENT_NAME,
    name: DEFAULT_AGENCY_NAME,
  },
  document: {
    documentCode: DEFAULT_DOCUMENT_CODE,
    issuePlace: DEFAULT_ISSUE_PLACE,
    issueDateIso: todayIsoDate(),
    issuePlaceAndDateLine: issuePlaceDateLine(DEFAULT_ISSUE_PLACE, todayIsoDate()),
  },
  official: {
    issuerTitle: DEFAULT_ISSUER_TITLE,
  },
  cancelledDecision: {
    cancelledDocumentCode: "",
    cancelledDocumentDateIso: "",
    cancelledDocumentAgency: "",
    caseTitle: "",
    offenseName: "",
    reasonLine: "",
  },
  recipients: {
    archiveLine: defaultArchiveLine(),
  },
  signature: {
    signMode: DEFAULT_SIGN_MODE,
    positionTitle: DEFAULT_POSITION_TITLE,
    signerName: "",
  },
};

const REQUIRED_FIELDS: Array<{
  path:
    | "agency.parentName"
    | "agency.name"
    | "document.documentCode"
    | "document.issuePlace"
    | "document.issueDateIso"
    | "official.issuerTitle"
    | "cancelledDecision.cancelledDocumentCode"
    | "cancelledDecision.caseTitle"
    | "recipients.archiveLine"
    | "signature.signMode"
    | "signature.positionTitle"
    | "signature.signerName";
  label: string;
}> = [
  { path: "agency.parentName", label: "Viện kiểm sát cấp trên" },
  { path: "agency.name", label: "Viện kiểm sát ban hành" },
  { path: "document.documentCode", label: "Số quyết định" },
  { path: "document.issuePlace", label: "Địa danh" },
  { path: "document.issueDateIso", label: "Ngày ban hành" },
  { path: "official.issuerTitle", label: "Chủ thể ban hành" },
  { path: "cancelledDecision.cancelledDocumentCode", label: "Số QĐ bị huỷ" },
  { path: "cancelledDecision.caseTitle", label: "Tên vụ án" },
  { path: "signature.signMode", label: "Chế độ ký" },
  { path: "signature.positionTitle", label: "Chức vụ ký" },
  { path: "signature.signerName", label: "Người ký" },
];

function buildReasonLine(form: Bm089Form): string {
  const d = form.cancelledDecision;
  if (!d.cancelledDocumentCode.trim() || !d.caseTitle.trim()) return "";
  const dateText = vnDateLine(d.cancelledDocumentDateIso, "");
  const codePart = d.cancelledDocumentCode.trim();
  const datePart = dateText ? ` ${dateText}` : "";
  const agencyPart = d.cancelledDocumentAgency.trim();
  const agencyClause = agencyPart ? ` của ${agencyPart}` : "";
  const offensePart = d.offenseName.trim()
    ? ` về tội “${d.offenseName.trim()}”`
    : "";
  return `Xét thấy QĐ số ${codePart}${datePart}${agencyClause} về việc tách vụ án hình sự ${d.caseTitle.trim()}${offensePart} không có căn cứ và trái pháp luật;`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm089Form {
  const parentName =
    nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName;
  const name = nested(payload, "agency.name") || EMPTY_FORM.agency.name;
  const issuePlace =
    nested(payload, "document.issuePlace") ||
    nested(payload, "agency.issuePlace") ||
    EMPTY_FORM.document.issuePlace;
  const issueDateIso =
    normalizeIsoDate(
      nested(payload, "document.issueDate") ||
        nested(payload, "document.issueDateIso") ||
        EMPTY_FORM.document.issueDateIso,
    ) || EMPTY_FORM.document.issueDateIso;
  const cancelledDocumentDateIso = normalizeIsoDate(
    nested(payload, "cancelledDecision.cancelledDocumentDate") ||
      nested(payload, "cancelledDocument.issueDate") ||
      "",
  );

  const baseForm: Bm089Form = {
    agency: { parentName, name },
    document: {
      documentCode:
        nested(payload, "document.documentCode") ||
        EMPTY_FORM.document.documentCode,
      issuePlace,
      issueDateIso,
      issuePlaceAndDateLine: issuePlaceDateLine(issuePlace, issueDateIso),
    },
    official: {
      issuerTitle:
        nested(payload, "official.issuerTitle") ||
        EMPTY_FORM.official.issuerTitle,
    },
    cancelledDecision: {
      cancelledDocumentCode:
        nested(payload, "cancelledDecision.cancelledDocumentCode") ||
        nested(payload, "cancelledDocument.documentCode") ||
        "",
      cancelledDocumentDateIso,
      cancelledDocumentAgency:
        nested(payload, "cancelledDecision.cancelledDocumentAgency") ||
        nested(payload, "cancelledDocument.agency") ||
        "",
      caseTitle:
        nested(payload, "cancelledDecision.caseTitle") ||
        nested(payload, "case.caseTitle") ||
        "",
      offenseName:
        nested(payload, "cancelledDecision.offenseName") ||
        nested(payload, "offense.offenseName") ||
        "",
      reasonLine: nested(payload, "cancelledDecision.reasonLine") || "",
    },
    recipients: {
      archiveLine:
        nested(payload, "recipients.archiveLine") ||
        EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode:
        nested(payload, "signature.signMode") || EMPTY_FORM.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") ||
        EMPTY_FORM.signature.positionTitle,
      signerName: nested(payload, "signature.signerName") || "",
    },
  };

  baseForm.cancelledDecision.reasonLine = buildReasonLine(baseForm);
  return baseForm;
}

function fillCustomerSample(): Bm089Form {
  const issueDateIso = todayIsoDate();
  const issuePlace = DEFAULT_ISSUE_PLACE;
  return {
    agency: {
      parentName: DEFAULT_PARENT_NAME,
      name: DEFAULT_AGENCY_NAME,
    },
    document: {
      documentCode: DEFAULT_DOCUMENT_CODE,
      issuePlace,
      issueDateIso,
      issuePlaceAndDateLine: issuePlaceDateLine(issuePlace, issueDateIso),
    },
    official: {
      issuerTitle: DEFAULT_ISSUER_TITLE,
    },
    cancelledDecision: {
      cancelledDocumentCode: "22/QĐ-VKSKV7",
      cancelledDocumentDateIso: todayIsoDate(),
      cancelledDocumentAgency: "Viện kiểm sát nhân dân khu vực 7",
      caseTitle: "Vụ án tách từ vụ án đánh bạc tại quán cà phê X",
      offenseName: "Đánh bạc",
      reasonLine: "",
    },
    recipients: {
      archiveLine: defaultArchiveLine(),
    },
    signature: {
      signMode: DEFAULT_SIGN_MODE,
      positionTitle: DEFAULT_POSITION_TITLE,
      signerName: "Người ký mẫu",
    },
  };
}

function validateForm(form: Bm089Form): string[] {
  const errors: string[] = [];
  for (const item of REQUIRED_FIELDS) {
    const path = item.path;
    let value = "";
    if (path === "agency.parentName") value = form.agency.parentName;
    else if (path === "agency.name") value = form.agency.name;
    else if (path === "document.documentCode") value = form.document.documentCode;
    else if (path === "document.issuePlace") value = form.document.issuePlace;
    else if (path === "document.issueDateIso") value = form.document.issueDateIso;
    else if (path === "official.issuerTitle") value = form.official.issuerTitle;
    else if (path === "cancelledDecision.cancelledDocumentCode")
      value = form.cancelledDecision.cancelledDocumentCode;
    else if (path === "cancelledDecision.caseTitle")
      value = form.cancelledDecision.caseTitle;
    else if (path === "recipients.archiveLine") value = form.recipients.archiveLine;
    else if (path === "signature.signMode") value = form.signature.signMode;
    else if (path === "signature.positionTitle")
      value = form.signature.positionTitle;
    else if (path === "signature.signerName") value = form.signature.signerName;
    if (!String(value ?? "").trim()) errors.push(item.label);
  }
  return errors;
}

function buildSaveBody(form: Bm089Form) {
  const issueDateIso = form.document.issueDateIso;
  const cancelledDateIso = form.cancelledDecision.cancelledDocumentDateIso;
  const issuePlaceAndDateLine = issuePlaceDateLine(
    form.document.issuePlace,
    issueDateIso,
  );

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
    issuePlace: form.document.issuePlace,
  };

  const document = {
    documentCode: form.document.documentCode,
    issueDate: isoDateToVnSlash(issueDateIso),
    issueDateText: vnDateLine(issueDateIso).replace(/^ngày\s+/iu, ""),
    issueDateIso,
    issuePlaceAndDateLine,
  };

  const official = {
    issuerTitle: form.official.issuerTitle,
  };

  const cancelledDecision = {
    cancelledDocumentCode: form.cancelledDecision.cancelledDocumentCode,
    cancelledDocumentDate: isoDateToVnSlash(cancelledDateIso),
    cancelledDocumentDateIso: cancelledDateIso,
    cancelledDocumentAgency: form.cancelledDecision.cancelledDocumentAgency,
    caseTitle: form.cancelledDecision.caseTitle,
    offenseName: form.cancelledDecision.offenseName,
    reasonLine: buildReasonLine(form),
  };

  const recipients = {
    archiveLine: form.recipients.archiveLine,
  };

  const signature = {
    signMode: form.signature.signMode,
    positionTitle: form.signature.positionTitle,
    signerName: form.signature.signerName.trim(),
  };

  const savedInputs = {
    agency,
    document,
    official,
    cancelledDecision,
    recipients,
    signature,
  };

  return {
    ...savedInputs,
    formInputs: savedInputs,
    payloadOverrides: savedInputs,
    renderPayloadOverrides: savedInputs,
  };
}

export function Bm089FormInputsPanel({
  documentId,
  onSaved,
}: Bm089FormInputsPanelProps) {
  const [form, setForm] = useState<Bm089Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const reasonLine = useMemo(() => buildReasonLine(form), [form]);

  const patchAgency = (key: keyof AgencyForm, value: string) => {
    setForm((current) => ({
      ...current,
      agency: { ...current.agency, [key]: value },
    }));
  };

  const patchDocument = (key: keyof DocumentForm, value: string) => {
    setForm((current) => {
      const document = { ...current.document, [key]: value };
      return {
        ...current,
        document: {
          ...document,
          issuePlaceAndDateLine: issuePlaceDateLine(
            document.issuePlace,
            document.issueDateIso,
          ),
        },
      };
    });
  };

  const patchOfficial = (key: keyof OfficialForm, value: string) => {
    setForm((current) => ({
      ...current,
      official: { ...current.official, [key]: value },
    }));
  };

  const patchCancelledDecision = (
    key: keyof CancelledDecisionForm,
    value: string,
  ) => {
    setForm((current) => {
      const cancelledDecision = { ...current.cancelledDecision, [key]: value };
      const next: Bm089Form = {
        ...current,
        cancelledDecision: {
          ...cancelledDecision,
          reasonLine: "",
        },
      };
      next.cancelledDecision.reasonLine = buildReasonLine(next);
      return next;
    });
  };

  const patchRecipients = (key: keyof RecipientsForm, value: string) => {
    setForm((current) => ({
      ...current,
      recipients: { ...current.recipients, [key]: value },
    }));
  };

  const patchSignature = (key: keyof SignatureForm, value: string) => {
    setForm((current) => ({
      ...current,
      signature: { ...current.signature, [key]: value },
    }));
  };

  const reloadFromBackend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
        { method: "GET", cache: "no-store" },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không tải được render-payload. HTTP ${response.status}`,
        );
      }

      const payload = (await response.json()) as RenderPayload;
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải lại dữ liệu BM-089 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm(fillCustomerSample());
    setMessage("Đã điền dữ liệu mẫu BM-089.");
    setError(null);
  };

  const handleSave = async () => {
    const errors = validateForm(form);
    if (errors.length > 0) {
      setError(`Thiếu dữ liệu bắt buộc: ${errors.join(", ")}`);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(buildSaveBody(form)),
        },
      );

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText || `Không lưu được dữ liệu biểu mẫu. HTTP ${response.status}`,
        );
      }

      const savedPayload = (await response.json()) as RenderPayload;
      setForm(normalizeFormInputs(savedPayload));

      setMessage(
        "Đã lưu dữ liệu BM-089. Dữ liệu vừa nhập đã được đồng bộ lại từ backend.",
      );

      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void reloadFromBackend();
  }, [documentId]);

  const status = error
    ? { kind: "error" as const, text: error }
    : message
      ? { kind: "success" as const, text: message }
      : validationErrors.length > 0
        ? {
            kind: "warning" as const,
            text: `Thiếu dữ liệu bắt buộc: ${validationErrors.join(", ")}.`,
          }
        : { kind: "idle" as const, text: "" };

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-089"
        title="Dữ liệu biểu mẫu QĐ huỷ bỏ QĐ tách vụ án hình sự"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 89/HS · Stage KHOI_TO (G02 BP_NGAN_CHAN). Căn cứ Điều 156 BLTTHS 2015."
        isDirty={Boolean(message) || validationErrors.length > 0}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-089"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton<Bm089Form>
            templateCode="BM-089"
            form={form}
            onApply={(next) => setForm(next)}
          />
        }
        meta={
          <button
            type="button"
            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-60"
            onClick={handleFillSample}
            disabled={loading || saving}
          >
            Điền dữ liệu mẫu
          </button>
        }
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus
          kind={status.kind}
          title={
            status.kind === "success"
              ? "Thành công"
              : status.kind === "error"
                ? "Lỗi"
                : status.kind === "warning"
                  ? "Thiếu dữ liệu"
                  : undefined
          }
        >
          {status.text}
        </BmFormStatus>
      )}

      <BmFormSection
        title="1. Header biểu mẫu"
        description="Nhóm header dùng để render phần đầu BM-089: cơ quan, số văn bản, địa danh, ngày ban hành, chủ thể."
      >
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          required
          value={form.agency.parentName}
          onChange={(value) => patchAgency("parentName", value)}
        />

        <BmFieldText
          label="Viện kiểm sát ban hành"
          required
          value={form.agency.name}
          onChange={(value) => patchAgency("name", value)}
        />

        <BmFieldText
          label="Số quyết định"
          required
          value={form.document.documentCode}
          onChange={(value) => patchDocument("documentCode", value)}
        />

        <BmFieldText
          label="Địa danh"
          required
          value={form.document.issuePlace}
          onChange={(value) => patchDocument("issuePlace", value)}
        />

        <BmFieldDate
          label="Ngày ban hành"
          required
          value={form.document.issueDateIso}
          onChange={(value) => patchDocument("issueDateIso", value)}
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          {form.document.issuePlaceAndDateLine}
        </div>

        <BmFieldText
          label="Chủ thể ban hành"
          required
          value={form.official.issuerTitle}
          onChange={(value) => patchOfficial("issuerTitle", value)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="2. Quyết định bị huỷ bỏ"
        description="Nhập thông tin QĐ tách vụ án hình sự cần huỷ bỏ."
        fullWidth
      >
        <BmFieldText
          label="Số QĐ bị huỷ"
          required
          value={form.cancelledDecision.cancelledDocumentCode}
          onChange={(value) =>
            patchCancelledDecision("cancelledDocumentCode", value)
          }
        />

        <BmFieldDate
          label="Ngày QĐ bị huỷ"
          value={form.cancelledDecision.cancelledDocumentDateIso}
          onChange={(value) => {
            const normalized = normalizeIsoDate(value);
            patchCancelledDecision("cancelledDocumentDateIso", normalized);
          }}
        />

        <BmFieldText
          label="Cơ quan ban hành QĐ bị huỷ"
          value={form.cancelledDecision.cancelledDocumentAgency}
          onChange={(value) =>
            patchCancelledDecision("cancelledDocumentAgency", value)
          }
          fullWidth
        />

        <BmFieldText
          label="Tên vụ án"
          required
          value={form.cancelledDecision.caseTitle}
          onChange={(value) => patchCancelledDecision("caseTitle", value)}
          fullWidth
        />

        <BmFieldText
          label="Tội danh"
          value={form.cancelledDecision.offenseName}
          onChange={(value) => patchCancelledDecision("offenseName", value)}
        />

        <BmFieldTextarea
          label="Lý do huỷ bỏ tự sinh"
          readOnly
          rows={3}
          value={reasonLine}
          onChange={() => undefined}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="3. Nơi nhận và chữ ký"
        fullWidth
      >
        <BmFieldText
          label="Lưu hồ sơ"
          value={form.recipients.archiveLine}
          onChange={(value) => patchRecipients("archiveLine", value)}
          fullWidth
        />

        <BmFieldText
          label="Chế độ ký"
          required
          value={form.signature.signMode}
          onChange={(value) => patchSignature("signMode", value)}
        />

        <BmFieldText
          label="Chức vụ ký"
          required
          value={form.signature.positionTitle}
          onChange={(value) => patchSignature("positionTitle", value)}
        />

        <BmFieldText
          label="Người ký"
          required
          value={form.signature.signerName}
          onChange={(value) => patchSignature("signerName", value)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-089"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
