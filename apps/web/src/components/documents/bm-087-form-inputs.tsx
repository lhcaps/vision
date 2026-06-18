"use client";

/**
 * BM-087 — Yêu cầu điều tra
 * Stage: KHoi_TO, Group: G02 (BP_NGAN_CHAN). TT 03/2026-VKSTC, Mẫu số 87/HS.
 *
 * Căn cứ: Điều 36, 37 BLTTHS 2015 — yêu cầu điều tra giữa VKS và Cơ quan điều tra.
 * Nghiệp vụ: VKS yêu cầu Cơ quan Cảnh sát điều tra điều tra vụ án theo thẩm quyền.
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

type InvestigationRequestForm = {
  procedureArticlesLine: string;
  requestedAuthorityName: string;
  caseTitle: string;
  offenseName: string;
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm087Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  investigationRequest: InvestigationRequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm087FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = "";

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
  const vn = /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu.exec(raw);
  if (vn) {
    const day = vn[1].padStart(2, "0");
    const month = vn[2].padStart(2, "0");
    return `${vn[3]}-${month}-${day}`;
  }
  return "";
}

function issuePlaceFromLine(value: string): string {
  const raw = cleanText(value);
  const index = raw.toLowerCase().indexOf(", ngày");
  return index > 0 ? raw.slice(0, index).trim() : "";
}

const EMPTY_FORM: Bm087Form = {
  agency: {
    parentName: "",
    name: "",
  },
  document: {
    documentCode: "87/YCDT-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: todayIsoDate(),
    issuePlaceAndDateLine: issuePlaceDateLine("TP. Hồ Chí Minh", todayIsoDate()),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  investigationRequest: {
    procedureArticlesLine:
      "Căn cứ các điều 36, 37 của Bộ luật Tố tụng hình sự;",
    requestedAuthorityName: "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    caseTitle: "Vụ án đánh bạc tại phường Trung Mỹ Tây",
    offenseName: "",
  },
  recipients: {
    archiveLine: defaultArchiveLine(),
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
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
    | "investigationRequest.procedureArticlesLine"
    | "investigationRequest.requestedAuthorityName"
    | "investigationRequest.caseTitle"
    | "investigationRequest.offenseName"
    | "recipients.archiveLine"
    | "signature.signMode"
    | "signature.positionTitle"
    | "signature.signerName";
  label: string;
}> = [
  { path: "agency.parentName", label: "Viện kiểm sát cấp trên" },
  { path: "agency.name", label: "Viện kiểm sát ban hành" },
  { path: "document.documentCode", label: "Số quyết định" },
  { path: "document.issuePlace", label: "Địa danh ban hành" },
  { path: "document.issueDateIso", label: "Ngày ban hành" },
  { path: "official.issuerTitle", label: "Chủ thể ban hành" },
  { path: "investigationRequest.procedureArticlesLine", label: "Căn cứ tố tụng" },
  { path: "investigationRequest.requestedAuthorityName", label: "Cơ quan được yêu cầu" },
  { path: "investigationRequest.caseTitle", label: "Tên vụ án" },
  { path: "investigationRequest.offenseName", label: "Tội danh" },
  { path: "recipients.archiveLine", label: "Lưu hồ sơ" },
  { path: "signature.signMode", label: "Chế độ ký" },
  { path: "signature.positionTitle", label: "Chức vụ ký" },
  { path: "signature.signerName", label: "Người ký" },
];

function buildRequestContentLine(form: Bm087Form): string {
  const data = form.investigationRequest;
  return `Yêu cầu ${data.requestedAuthorityName.trim()} tiến hành điều tra vụ án ${data.caseTitle.trim()} về tội ${data.offenseName.trim()} theo thẩm quyền.`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm087Form {
  const issuePlaceAndDateLine = nested(payload, "document.issuePlaceAndDateLine");

  const signerName =
    nested(payload, "signature.signerName") || DEFAULT_SIGNER_NAME;

  const issuePlace =
    nested(payload, "agency.issuePlace") ||
    issuePlaceFromLine(issuePlaceAndDateLine) ||
    EMPTY_FORM.document.issuePlace;

  const issueDateIso =
    normalizeIsoDate(nested(payload, "document.issueDate")) ||
    normalizeIsoDate(nested(payload, "document.issueDateText")) ||
    normalizeIsoDate(issuePlaceAndDateLine) ||
    EMPTY_FORM.document.issueDateIso;

  return {
    agency: {
      parentName:
        nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
    },
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
    investigationRequest: {
      procedureArticlesLine:
        nested(payload, "investigationRequest.procedureArticlesLine") ||
        EMPTY_FORM.investigationRequest.procedureArticlesLine,
      requestedAuthorityName:
        nested(payload, "investigationRequest.requestedAuthorityName") ||
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.investigationRequest.requestedAuthorityName,
      caseTitle:
        nested(payload, "investigationRequest.caseTitle") ||
        nested(payload, "case.caseTitle") ||
        EMPTY_FORM.investigationRequest.caseTitle,
      offenseName:
        nested(payload, "investigationRequest.offenseName") ||
        nested(payload, "offense.offenseName") ||
        EMPTY_FORM.investigationRequest.offenseName,
    },
    recipients: {
      archiveLine:
        nested(payload, "recipients.archiveLine") ||
        EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode:
        nested(payload, "signature.signMode") ||
        EMPTY_FORM.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") ||
        EMPTY_FORM.signature.positionTitle,
      signerName,
    },
  };
}

function fillCustomerSample(): Bm087Form {
  return {
    agency: { ...EMPTY_FORM.agency },
    document: { ...EMPTY_FORM.document },
    official: { ...EMPTY_FORM.official },
    investigationRequest: { ...EMPTY_FORM.investigationRequest },
    recipients: { ...EMPTY_FORM.recipients },
    signature: { ...EMPTY_FORM.signature, signerName: "Nguyễn Văn A" },
  };
}

function validateForm(form: Bm087Form): string[] {
  const errors: string[] = [];
  for (const item of REQUIRED_FIELDS) {
    let value = "";
    if (item.path === "agency.parentName") value = form.agency.parentName;
    else if (item.path === "agency.name") value = form.agency.name;
    else if (item.path === "document.documentCode") value = form.document.documentCode;
    else if (item.path === "document.issuePlace") value = form.document.issuePlace;
    else if (item.path === "document.issueDateIso") value = form.document.issueDateIso;
    else if (item.path === "official.issuerTitle") value = form.official.issuerTitle;
    else if (item.path === "investigationRequest.procedureArticlesLine")
      value = form.investigationRequest.procedureArticlesLine;
    else if (item.path === "investigationRequest.requestedAuthorityName")
      value = form.investigationRequest.requestedAuthorityName;
    else if (item.path === "investigationRequest.caseTitle")
      value = form.investigationRequest.caseTitle;
    else if (item.path === "investigationRequest.offenseName")
      value = form.investigationRequest.offenseName;
    else if (item.path === "recipients.archiveLine") value = form.recipients.archiveLine;
    else if (item.path === "signature.signMode") value = form.signature.signMode;
    else if (item.path === "signature.positionTitle")
      value = form.signature.positionTitle;
    else if (item.path === "signature.signerName") value = form.signature.signerName;
    if (!String(value ?? "").trim()) errors.push(item.label);
  }
  return errors;
}

function buildSaveBody(form: Bm087Form) {
  const signerName = form.signature.signerName.trim() || DEFAULT_SIGNER_NAME;
  const issueDateIso = form.document.issueDateIso;
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
    documentNo: form.document.documentCode,
    issueDate: isoDateToVnSlash(issueDateIso),
    issueDateText: vnDateLine(issueDateIso).replace(/^ngày\s+/iu, ""),
    issueDateIso,
    issuePlaceAndDateLine,
    issuePlaceDateLine: issuePlaceAndDateLine,
  };

  const official = {
    issuerTitle: form.official.issuerTitle,
  };

  const investigationRequest = {
    procedureArticlesLine: form.investigationRequest.procedureArticlesLine,
    requestedAuthorityName: form.investigationRequest.requestedAuthorityName,
    caseTitle: form.investigationRequest.caseTitle,
    offenseName: form.investigationRequest.offenseName,
    requestContentLine: buildRequestContentLine(form),
  };

  const recipients = {
    archiveLine: form.recipients.archiveLine,
  };

  const signature = {
    signMode: form.signature.signMode,
    positionTitle: form.signature.positionTitle,
    signerName,
  };

  const savedInputs = {
    agency,
    document,
    official,
    investigationRequest,
    recipients,
    signature,
  };

  return {
    ...savedInputs,
    formInputs: savedInputs,
    payloadOverrides: savedInputs,
    renderPayloadOverrides: savedInputs,
    updatedByName: signerName,
  };
}

export function Bm087FormInputsPanel({
  documentId,
  onSaved,
}: Bm087FormInputsPanelProps) {
  const [form, setForm] = useState<Bm087Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const requestContentLine = useMemo(() => buildRequestContentLine(form), [form]);

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

  const patchInvestigationRequest = (
    key: keyof InvestigationRequestForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      investigationRequest: {
        ...current.investigationRequest,
        [key]: value,
      },
    }));
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
      setMessage("Đã tải lại dữ liệu BM-087 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm(fillCustomerSample());
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-087.");
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

      await reloadFromBackend();
      setMessage("Đã lưu dữ liệu BM-087. Các dòng tự sinh đã đồng bộ.");
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
        templateCode="BM-087"
        title="Dữ liệu biểu mẫu Yêu cầu điều tra"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 87/HS · Stage KHOI_TO (G02 BP_NGAN_CHAN). Căn cứ Điều 36, 37 BLTTHS 2015."
        isDirty={Boolean(message) || validationErrors.length > 0}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-087"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton<Bm087Form>
            templateCode="BM-087"
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
        description="Nhóm header dùng để render phần đầu BM-087."
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
          label="Địa danh ban hành"
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
        title="2. Nội dung yêu cầu điều tra"
        description="Chỉ nhập thông tin cốt lõi. Các dòng dài trong văn bản sẽ tự sinh."
        fullWidth
      >
        <BmFieldTextarea
          label="Căn cứ tố tụng"
          required
          rows={2}
          value={form.investigationRequest.procedureArticlesLine}
          onChange={(value) =>
            patchInvestigationRequest("procedureArticlesLine", value)
          }
          fullWidth
        />

        <BmFieldText
          label="Cơ quan được yêu cầu điều tra"
          required
          value={form.investigationRequest.requestedAuthorityName}
          onChange={(value) =>
            patchInvestigationRequest("requestedAuthorityName", value)
          }
          fullWidth
        />

        <BmFieldText
          label="Tên vụ án"
          required
          value={form.investigationRequest.caseTitle}
          onChange={(value) => patchInvestigationRequest("caseTitle", value)}
        />

        <BmFieldText
          label="Tội danh"
          required
          value={form.investigationRequest.offenseName}
          onChange={(value) => patchInvestigationRequest("offenseName", value)}
        />
      </BmFormSection>

      <BmFormSection
        title="3. Nội dung tự sinh"
        description="Các dòng này không cần nhập tay. Đổi ô chính ở trên thì nội dung dưới đổi theo."
        fullWidth
      >
        <BmFieldTextarea
          label="Dòng yêu cầu tự sinh"
          readOnly
          rows={3}
          value={requestContentLine}
          onChange={() => undefined}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="4. Nơi nhận và chữ ký"
        fullWidth
      >
        <BmFieldText
          label="Lưu hồ sơ"
          required
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-087"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
