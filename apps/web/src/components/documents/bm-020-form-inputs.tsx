"use client";

/**
 * BM-020 — Yêu cầu ra QĐ huỷ bỏ QĐ khởi tố / QĐ không khởi tố vụ án hình sự
 * Stage: TIEP_NHAN, Group: G01. TT 03/2026-VKSTC, Mẫu số 20/HS.
 *
 * Căn cứ: Điều 41, 157, 158, 159, 161 và 165 (hoặc 432) BLTTHS.
 * Nghiệp vụ: VKS yêu cầu CQĐT ra QĐ huỷ bỏ QĐ khởi tố hoặc QĐ không khởi tố
 * khi thấy QĐ khởi tố trái pháp luật hoặc không có căn cứ.
 */
import { useEffect, useMemo, useState } from "react";
import {
  BmFormSection,
  BmFieldText,
  BmFieldTextarea,
  BmFieldDate,
  BmFieldSelect,
  BmFormActions,
  BmFormStatus,
  BmFormMetaBar,
  defaultArchiveLine,
  todayIsoDate,
} from "@/components/documents/bm-form";
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

type AgencyForm = {
  parentName: string;
  name: string;
  bodyName: string;
  shortName: string;
  issuePlace: string;
};

type DocumentForm = {
  documentCode: string;
  issueDateIso: string;
  issuePlaceAndDateLine: string;
};

type OfficialForm = {
  issuerTitle: string;
};

type InitiationRequestForm = {
  targetDecisionCode: string;
  targetDecisionDateText: string;
  targetIssuerName: string;
  targetDecisionType: string; // "INITIATION" | "NON_INITIATION"
  targetOffenseName: string;
  reasonLine: string;
  article1Line: string;
  article2Line: string;
  orderedAuthorityName: string;
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm020Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  initiationRequest: InitiationRequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm020FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = "";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isoToSlash(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").trim());
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function isoToVietnameseDateLine(value: string, fallback: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").trim());
  if (!m) return fallback;
  return `ngày ${Number(m[3])} tháng ${Number(m[2])} năm ${m[1]}`;
}

function buildIssuePlaceAndDateLine(place: string, dateIso: string): string {
  const p = String(place ?? "").trim() || "TP. Hồ Chí Minh";
  return `${p}, ${isoToVietnameseDateLine(dateIso, "ngày ... tháng ... năm ...")}`;
}

function stripLeadingNumber(value: string, fallback: string): string {
  const stripped = String(value ?? "").replace(/^\s*\d+[.)]?\s*/, "").trim();
  return stripped || fallback;
}

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

const DECISION_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "INITIATION", label: "Huỷ bỏ QĐ khởi tố vụ án hình sự" },
  { value: "NON_INITIATION", label: "Huỷ bỏ QĐ không khởi tố vụ án hình sự" },
];

const EMPTY_FORM: Bm020Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKS",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "20/YC-VKS",
    issueDateIso: todayIsoDate(),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine("TP. Hồ Chí Minh", todayIsoDate()),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN",
  },
  initiationRequest: {
    targetDecisionCode: "",
    targetDecisionDateText: "",
    targetIssuerName: "",
    targetDecisionType: "INITIATION",
    targetOffenseName: "",
    reasonLine:
      "Xét thấy Quyết định khởi tố vụ án hình sự nêu trên là không có căn cứ, trái pháp luật;",
    article1Line: "",
    article2Line: "",
    orderedAuthorityName: "",
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

function buildArticle1Line(form: Bm020Form): string {
  const r = form.initiationRequest;
  const issuer = r.targetIssuerName.trim();
  const isNonInit = r.targetDecisionType === "NON_INITIATION";
  const decisionKind = isNonInit
    ? "không khởi tố"
    : "khởi tố";
  return (
    `1. Cơ quan, người có thẩm quyền ${issuer || "…"} ra Quyết định huỷ bỏ Quyết định ` +
    `${decisionKind} vụ án hình sự số ${r.targetDecisionCode.trim() || "…"} ` +
    `ngày ${r.targetDecisionDateText.trim() || "… tháng … năm …"} ` +
    `của ${issuer || "…"} về tội "${r.targetOffenseName.trim() || "…"}" của Bộ luật Hình sự.`
  );
}

function buildArticle2Line(form: Bm020Form): string {
  const ordered = form.initiationRequest.orderedAuthorityName.trim();
  return (
    `2. Yêu cầu ${ordered || "…"} tiếp tục giải quyết nguồn tin về tội phạm ` +
    `theo quy định của Bộ luật Tố tụng hình sự/ra Quyết định khởi tố vụ án hình sự./.`
  );
}

function normalizeFormInputs(payload: RenderPayload | null): Bm020Form {
  const issuePlace =
    nested(payload, "agency.issuePlace") ||
    nested(payload, "document.issuePlace") ||
    EMPTY_FORM.agency.issuePlace;
  const issueDateIso = (
    nested(payload, "document.issueDateIso") ||
    nested(payload, "document.issueDate") ||
    EMPTY_FORM.document.issueDateIso
  ).slice(0, 10);

  const signerName =
    nested(payload, "signature.signerName") || DEFAULT_SIGNER_NAME;

  const decisionTypeRaw = nested(
    payload,
    "initiationRequest.targetDecisionType",
  ).toUpperCase();
  const targetDecisionType =
    decisionTypeRaw === "INITIATION" || decisionTypeRaw === "NON_INITIATION"
      ? decisionTypeRaw
      : EMPTY_FORM.initiationRequest.targetDecisionType;

  return {
    agency: {
      parentName:
        nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
      bodyName:
        nested(payload, "agency.bodyName") || EMPTY_FORM.agency.bodyName,
      shortName:
        nested(payload, "agency.shortName") || EMPTY_FORM.agency.shortName,
      issuePlace,
    },
    document: {
      documentCode:
        nested(payload, "document.documentCode") ||
        EMPTY_FORM.document.documentCode,
      issueDateIso,
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(issuePlace, issueDateIso),
    },
    official: {
      issuerTitle:
        nested(payload, "official.issuerTitle") || EMPTY_FORM.official.issuerTitle,
    },
    initiationRequest: {
      targetDecisionCode:
        nested(payload, "initiationRequest.targetDecisionCode") ||
        EMPTY_FORM.initiationRequest.targetDecisionCode,
      targetDecisionDateText:
        nested(payload, "initiationRequest.targetDecisionDateText") ||
        EMPTY_FORM.initiationRequest.targetDecisionDateText,
      targetIssuerName:
        nested(payload, "initiationRequest.targetIssuerName") ||
        nested(payload, "case.investigationAuthorityName") ||
        EMPTY_FORM.initiationRequest.targetIssuerName,
      targetDecisionType,
      targetOffenseName:
        nested(payload, "initiationRequest.targetOffenseName") ||
        nested(payload, "offense.offenseName") ||
        EMPTY_FORM.initiationRequest.targetOffenseName,
      reasonLine:
        nested(payload, "initiationRequest.reasonLine") ||
        EMPTY_FORM.initiationRequest.reasonLine,
      article1Line:
        nested(payload, "initiationRequest.article1Line") ||
        EMPTY_FORM.initiationRequest.article1Line,
      article2Line:
        nested(payload, "initiationRequest.article2Line") ||
        EMPTY_FORM.initiationRequest.article2Line,
      orderedAuthorityName:
        nested(payload, "initiationRequest.orderedAuthorityName") ||
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.initiationRequest.orderedAuthorityName,
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
      signerName,
    },
  };
}

function validateForm(form: Bm020Form): string[] {
  const required: Array<[string, string]> = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Tên cơ quan trong thân văn bản", form.agency.bodyName],
    ["Địa danh ban hành", form.agency.issuePlace],
    ["Số văn bản", form.document.documentCode],
    ["Ngày ban hành", form.document.issueDateIso],
    ["Chủ thể ban hành", form.official.issuerTitle],
    [
      "Số QĐ cần huỷ bỏ",
      form.initiationRequest.targetDecisionCode,
    ],
    [
      "Ngày QĐ cần huỷ bỏ",
      form.initiationRequest.targetDecisionDateText,
    ],
    ["Cơ quan ra QĐ cần huỷ bỏ", form.initiationRequest.targetIssuerName],
    ["Tội danh QĐ cần huỷ bỏ", form.initiationRequest.targetOffenseName],
    ["Cơ quan được yêu cầu", form.initiationRequest.orderedAuthorityName],
    ["Dòng lưu hồ sơ", form.recipients.archiveLine],
    ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle],
    ["Người ký", form.signature.signerName],
  ];
  return required
    .filter(([, v]) => !String(v ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm020Form) {
  const signerName = form.signature.signerName.trim() || DEFAULT_SIGNER_NAME;
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(
    form.agency.issuePlace,
    form.document.issueDateIso,
  );

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
    bodyName: form.agency.bodyName,
    shortName: form.agency.shortName,
    issuePlace: form.agency.issuePlace,
  };

  const document = {
    documentCode: form.document.documentCode,
    documentNo: form.document.documentCode,
    issueDate: isoToSlash(form.document.issueDateIso),
    issueDateIso: form.document.issueDateIso,
    issueDateText: isoToVietnameseDateLine(
      form.document.issueDateIso,
      "ngày ... tháng ... năm ...",
    ).replace(/^ngày\s+/iu, ""),
    issuePlace: form.agency.issuePlace,
    issuePlaceAndDateLine,
    issuePlaceDateLine: issuePlaceAndDateLine,
  };

  const official = {
    issuerTitle: form.official.issuerTitle,
  };

  const initiationRequest = {
    targetDecisionCode: form.initiationRequest.targetDecisionCode,
    targetDecisionDateText: form.initiationRequest.targetDecisionDateText,
    targetIssuerName: form.initiationRequest.targetIssuerName,
    targetDecisionType: form.initiationRequest.targetDecisionType,
    targetOffenseName: form.initiationRequest.targetOffenseName,
    reasonLine: form.initiationRequest.reasonLine,
    article1Line: stripLeadingNumber(
      buildArticle1Line(form),
      "Điều 1. Cơ quan … ra QĐ huỷ bỏ QĐ khởi tố/không khởi tố vụ án hình sự.",
    ),
    article2Line: stripLeadingNumber(
      buildArticle2Line(form),
      "Điều 2. Yêu cầu … tiếp tục giải quyết nguồn tin/ra QĐ khởi tố.",
    ),
    orderedAuthorityName: form.initiationRequest.orderedAuthorityName,
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
    initiationRequest,
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

export function Bm020FormInputsPanel({
  documentId,
  onSaved,
}: Bm020FormInputsPanelProps) {
  const [form, setForm] = useState<Bm020Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm020Form>(
    section: T,
    key: keyof Bm020Form[T],
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...(current[section] as Record<string, string>),
        [key]: value,
      },
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
      setMessage("Đã tải lại dữ liệu BM-020 từ backend.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được dữ liệu BM-020.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm({
      agency: {
        parentName: "Viện Kiểm sát nhân dân TP. Hồ Chí Minh",
        name: "Viện kiểm sát nhân dân khu vực 7",
        bodyName: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        shortName: "VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
      },
      document: {
        documentCode: "20/YC-VKSKV7",
        issueDateIso: todayIsoDate(),
        issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
          "TP. Hồ Chí Minh",
          todayIsoDate(),
        ),
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      initiationRequest: {
        targetDecisionCode: "10/QĐ-CSĐT",
        targetDecisionDateText: "10/01/2026",
        targetIssuerName:
          "Cơ quan Cảnh sát điều tra Công an Quận 1, TP. Hồ Chí Minh",
        targetDecisionType: "INITIATION",
        targetOffenseName: "Trộm cắp tài sản",
        reasonLine:
          "Xét thấy Quyết định khởi tố vụ án hình sự số 10/QĐ-CSĐT là không có căn cứ, trái pháp luật;",
        article1Line: "",
        article2Line: "",
        orderedAuthorityName:
          "Cơ quan Cảnh sát điều tra Công an Quận 1, TP. Hồ Chí Minh",
      },
      recipients: {
        archiveLine: defaultArchiveLine(),
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "Người ký mẫu",
      },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-020.");
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
      setMessage("Đã lưu dữ liệu BM-020. Các dòng tự sinh đã đồng bộ.");
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không lưu được dữ liệu BM-020.",
      );
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
            text: `Còn ${validationErrors.length} trường bắt buộc chưa nhập: ${validationErrors.join(", ")}.`,
          }
        : { kind: "idle" as const, text: "" };

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-020"
        title="Dữ liệu biểu mẫu Yêu cầu ra QĐ huỷ bỏ QĐ khởi tố / QĐ không khởi tố vụ án hình sự"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 20/HS · Stage TIEP_NHAN (G01). Căn cứ Điều 41, 157, 158, 159, 161 và 165 (hoặc 432) BLTTHS."
        isDirty={Boolean(message?.includes("mẫu") || message?.includes("đồng bộ"))}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-020"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton
            templateCode="BM-020"
            form={form}
            onApply={(next) => setForm(next as typeof form)}
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
        title="1. Cơ quan ban hành"
        description="Tên viện kiểm sát, địa danh, ngày ban hành dùng để render tiêu ngữ."
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
          label="Tên cơ quan trong thân văn bản"
          required
          value={form.agency.bodyName}
          onChange={(v) => patch("agency", "bodyName", v)}
        />
        <BmFieldText
          label="Viết tắt tên VKS (nếu có)"
          value={form.agency.shortName}
          onChange={(v) => patch("agency", "shortName", v)}
        />
        <BmFieldText
          label="Địa danh ban hành"
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
      </BmFormSection>

      <BmFormSection
        title="2. Số văn bản & chủ thể"
      >
        <BmFieldText
          label="Số văn bản"
          required
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
        />
        <BmFieldText
          label="Chức danh người ký (VIỆN TRƯỞNG …)"
          required
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="3. QĐ cần yêu cầu huỷ bỏ"
        description="Quyết định khởi tố/không khởi tố mà VKS cho là không có căn cứ."
      >
        <BmFieldSelect
          label="Loại QĐ cần huỷ bỏ"
          value={form.initiationRequest.targetDecisionType}
          onChange={(v) =>
            patch("initiationRequest", "targetDecisionType", v)
          }
          options={DECISION_TYPE_OPTIONS}
        />
        <BmFieldText
          label="Số QĐ cần huỷ bỏ"
          required
          value={form.initiationRequest.targetDecisionCode}
          onChange={(v) =>
            patch("initiationRequest", "targetDecisionCode", v)
          }
        />
        <BmFieldText
          label="Ngày QĐ cần huỷ bỏ (dd/MM/yyyy)"
          required
          value={form.initiationRequest.targetDecisionDateText}
          onChange={(v) =>
            patch("initiationRequest", "targetDecisionDateText", v)
          }
        />
        <BmFieldText
          label="Cơ quan ra QĐ cần huỷ bỏ"
          required
          value={form.initiationRequest.targetIssuerName}
          onChange={(v) =>
            patch("initiationRequest", "targetIssuerName", v)
          }
        />
        <BmFieldText
          label="Tội danh trong QĐ cần huỷ bỏ"
          required
          value={form.initiationRequest.targetOffenseName}
          onChange={(v) =>
            patch("initiationRequest", "targetOffenseName", v)
          }
        />
      </BmFormSection>

      <BmFormSection
        title="4. Lý do & nội dung tự sinh"
        fullWidth
      >
        <BmFieldTextarea
          label="Dòng 'Xét thấy…'"
          rows={2}
          value={form.initiationRequest.reasonLine}
          onChange={(v) => patch("initiationRequest", "reasonLine", v)}
        />
        <BmFieldTextarea
          label="Điều 1 (tự sinh)"
          value={buildArticle1Line(form)}
          onChange={() => {
            // read-only preview
          }}
          rows={4}
          readOnly
        />
        <BmFieldTextarea
          label="Điều 2 (tự sinh)"
          value={buildArticle2Line(form)}
          onChange={() => {
            // read-only preview
          }}
          rows={2}
          readOnly
        />
        <BmFieldText
          label="Cơ quan được yêu cầu (Điều 2)"
          required
          value={form.initiationRequest.orderedAuthorityName}
          onChange={(v) =>
            patch("initiationRequest", "orderedAuthorityName", v)
          }
        />
      </BmFormSection>

      <BmFormSection title="5. Nơi nhận & lưu hồ sơ">
        <BmFieldText
          label="Dòng lưu"
          required
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection title="6. Chữ ký">
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
          label="Họ tên người ký"
          required
          value={form.signature.signerName}
          onChange={(v) => patch("signature", "signerName", v)}
          fullWidth
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-020"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
