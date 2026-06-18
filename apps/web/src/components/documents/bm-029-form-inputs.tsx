"use client";

/**
 * BM-029 — QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố vụ án hình sự
 * Stage: TIEP_NHAN (Tiếp nhận, giải quyết nguồn tin về tội phạm), Group: G01
 * TT 03/2026-VKSTC, Mẫu số 29/HS.
 *
 * Form gom theo 8 nhóm field chuẩn (docs/BM_CANONICAL_SPEC.md §1).
 * Tất cả field nhập dùng BmFormSection + BmField* primitives từ ./bm-form.
 */
import { useEffect, useMemo, useState } from "react";
import {
  BmFormSection,
  BmFieldText,
  BmFieldTextarea,
  BmFieldDate,
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
  supplementaryDecisionIssuerName: string;
};

type SupplementaryDecisionForm = {
  supplementaryDecisionCode: string;
  supplementaryDecisionDateText: string;
  offenseName: string;
  offenseClauseAndArticle: string;
  decisionReasonLine: string;
  decisionArticle1Line: string;
  decisionArticle2Line: string;
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

type Bm029Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  supplementaryDecision: SupplementaryDecisionForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm029FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = "";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function todayIso(): string {
  return todayIsoDate();
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

const EMPTY_FORM: Bm029Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKS",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "29/QĐ-VKS",
    issueDateIso: todayIso(),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine("TP. Hồ Chí Minh", todayIso()),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN",
    supplementaryDecisionIssuerName: "",
  },
  supplementaryDecision: {
    supplementaryDecisionCode: "",
    supplementaryDecisionDateText: "",
    offenseName: "",
    offenseClauseAndArticle: "",
    decisionReasonLine:
      "Xét thấy Quyết định bổ sung Quyết định khởi tố vụ án hình sự là không có căn cứ, trái pháp luật,",
    decisionArticle1Line: "",
    decisionArticle2Line: "",
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

function buildAssessmentLine(form: Bm029Form): string {
  const supp = form.supplementaryDecision;
  const issuer = form.official.supplementaryDecisionIssuerName.trim();
  return [
    "Xét thấy Quyết định bổ sung Quyết định khởi tố vụ án hình sự số",
    supp.supplementaryDecisionCode || "…",
    "ngày",
    supp.supplementaryDecisionDateText || "… tháng … năm …",
    "của",
    issuer || "…",
    "về tội",
    supp.offenseName || "…",
    "quy định tại khoản",
    (supp.offenseClauseAndArticle || "…").split("Điều")[0]?.trim() || "…",
    "Điều",
    (supp.offenseClauseAndArticle || "").includes("Điều")
      ? (supp.offenseClauseAndArticle.split("Điều")[1] ?? "").trim() || "…"
      : "…",
    "của Bộ luật Hình sự là không có căn cứ, trái pháp luật,",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildArticle1Line(form: Bm029Form): string {
  const supp = form.supplementaryDecision;
  const issuer = form.official.supplementaryDecisionIssuerName.trim();
  return (
    `1. Hủy bỏ Quyết định bổ sung Quyết định khởi tố vụ án hình sự số ` +
    `${supp.supplementaryDecisionCode || "…"} ngày ${supp.supplementaryDecisionDateText || "… tháng … năm …"} ` +
    `của ${issuer || "…"} về tội ${supp.offenseName || "…"} ` +
    `quy định tại ${supp.offenseClauseAndArticle || "…"} của Bộ luật Hình sự.`
  );
}

function buildArticle2Line(form: Bm029Form): string {
  const authority = form.supplementaryDecision.orderedAuthorityName.trim();
  if (!authority) {
    return "2. Yêu cầu … tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự./.";
  }
  return `2. Yêu cầu ${authority} tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự./.`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm029Form {
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
    nested(payload, "signature.signerName") ||
    nested(payload, "official.signerName") ||
    DEFAULT_SIGNER_NAME;

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
      supplementaryDecisionIssuerName:
        nested(payload, "official.supplementaryDecisionIssuerName") ||
        nested(payload, "supplementaryDecision.issuerName") ||
        EMPTY_FORM.official.supplementaryDecisionIssuerName,
    },
    supplementaryDecision: {
      supplementaryDecisionCode:
        nested(payload, "supplementaryDecision.supplementaryDecisionCode") ||
        nested(payload, "supplementaryDecision.decisionCode") ||
        EMPTY_FORM.supplementaryDecision.supplementaryDecisionCode,
      supplementaryDecisionDateText:
        nested(payload, "supplementaryDecision.supplementaryDecisionDateText") ||
        nested(payload, "supplementaryDecision.decisionDateText") ||
        EMPTY_FORM.supplementaryDecision.supplementaryDecisionDateText,
      offenseName:
        nested(payload, "supplementaryDecision.offenseName") ||
        nested(payload, "offense.offenseName") ||
        EMPTY_FORM.supplementaryDecision.offenseName,
      offenseClauseAndArticle:
        nested(payload, "supplementaryDecision.offenseClauseAndArticle") ||
        nested(payload, "offense.legalArticle") ||
        EMPTY_FORM.supplementaryDecision.offenseClauseAndArticle,
      decisionReasonLine:
        nested(payload, "supplementaryDecision.decisionReasonLine") ||
        EMPTY_FORM.supplementaryDecision.decisionReasonLine,
      decisionArticle1Line:
        nested(payload, "supplementaryDecision.decisionArticle1Line") ||
        EMPTY_FORM.supplementaryDecision.decisionArticle1Line,
      decisionArticle2Line:
        nested(payload, "supplementaryDecision.decisionArticle2Line") ||
        EMPTY_FORM.supplementaryDecision.decisionArticle2Line,
      orderedAuthorityName:
        nested(payload, "supplementaryDecision.orderedAuthorityName") ||
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.supplementaryDecision.orderedAuthorityName,
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

function validateForm(form: Bm029Form): string[] {
  const required: Array<[string, string]> = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Tên cơ quan trong thân văn bản", form.agency.bodyName],
    ["Địa danh ban hành", form.agency.issuePlace],
    ["Số văn bản", form.document.documentCode],
    ["Ngày ban hành", form.document.issueDateIso],
    ["Chủ thể ban hành", form.official.issuerTitle],
    ["Cơ quan ra QĐ bổ sung", form.official.supplementaryDecisionIssuerName],
    ["Số QĐ bổ sung", form.supplementaryDecision.supplementaryDecisionCode],
    [
      "Ngày QĐ bổ sung",
      form.supplementaryDecision.supplementaryDecisionDateText,
    ],
    ["Tội danh", form.supplementaryDecision.offenseName],
    [
      "Khoản – Điều BLHS",
      form.supplementaryDecision.offenseClauseAndArticle,
    ],
    ["Cơ quan bị yêu cầu", form.supplementaryDecision.orderedAuthorityName],
    ["Dòng lưu hồ sơ", form.recipients.archiveLine],
    ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle],
    ["Người ký", form.signature.signerName],
  ];
  return required
    .filter(([, v]) => !String(v ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm029Form) {
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
    supplementaryDecisionIssuerName:
      form.official.supplementaryDecisionIssuerName,
  };

  const supplementaryDecision = {
    supplementaryDecisionCode: form.supplementaryDecision.supplementaryDecisionCode,
    supplementaryDecisionDateText:
      form.supplementaryDecision.supplementaryDecisionDateText,
    offenseName: form.supplementaryDecision.offenseName,
    offenseClauseAndArticle: form.supplementaryDecision.offenseClauseAndArticle,
    decisionReasonLine: form.supplementaryDecision.decisionReasonLine,
    decisionArticle1Line: stripLeadingNumber(
      buildArticle1Line(form),
      "Điều 1. Hủy bỏ Quyết định bổ sung Quyết định khởi tố vụ án hình sự.",
    ),
    decisionArticle2Line: stripLeadingNumber(
      buildArticle2Line(form),
      "Điều 2. Yêu cầu … tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự.",
    ),
    orderedAuthorityName: form.supplementaryDecision.orderedAuthorityName,
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
    supplementaryDecision,
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

export function Bm029FormInputsPanel({
  documentId,
  onSaved,
}: Bm029FormInputsPanelProps) {
  const [form, setForm] = useState<Bm029Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm029Form>(
    section: T,
    key: keyof Bm029Form[T],
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
      setMessage("Đã tải lại dữ liệu BM-029 từ backend.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được dữ liệu BM-029.",
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
        documentCode: "29/QĐ-VKSKV7",
        issueDateIso: todayIso(),
        issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
          "TP. Hồ Chí Minh",
          todayIso(),
        ),
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        supplementaryDecisionIssuerName:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      supplementaryDecision: {
        supplementaryDecisionCode: "15/QĐ-CSĐT",
        supplementaryDecisionDateText: "20/01/2026",
        offenseName: "Trộm cắp tài sản",
        offenseClauseAndArticle: "khoản 2 Điều 173 của Bộ luật Hình sự",
        decisionReasonLine:
          "Xét thấy Quyết định bổ sung Quyết định khởi tố vụ án hình sự là không có căn cứ, trái pháp luật,",
        decisionArticle1Line: "",
        decisionArticle2Line: "",
        orderedAuthorityName:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      },
      recipients: {
        archiveLine: defaultArchiveLine(),
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "Nguyễn Văn A",
      },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-029.");
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
      setMessage("Đã lưu dữ liệu BM-029. Các dòng tự sinh đã đồng bộ.");
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không lưu được dữ liệu BM-029.",
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
        templateCode="BM-029"
        title="Dữ liệu biểu mẫu QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố vụ án hình sự"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 29/HS · Stage TIEP_NHAN (G01). Căn cứ Điều 41, 156, 161 và 165 (hoặc 432) BLTTHS."
        isDirty={Boolean(message?.includes("mẫu") || message?.includes("đồng bộ"))}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-029"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton
            templateCode="BM-029"
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
        description="Số hiệu và danh xưng người ký."
      >
        <BmFieldText
          label="Số văn bản"
          required
          value={form.document.documentCode}
          onChange={(v) => patch("document", "documentCode", v)}
          helperText="Ví dụ: 29/QĐ-VKSKV7"
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
        title="3. Quyết định bổ sung bị huỷ bỏ"
        description="Mô tả QĐ bổ sung QĐ khởi tố đang bị huỷ: số, ngày, tội danh, điều luật."
      >
        <BmFieldText
          label="Cơ quan/người ra QĐ bổ sung"
          required
          value={form.official.supplementaryDecisionIssuerName}
          onChange={(v) =>
            patch("official", "supplementaryDecisionIssuerName", v)
          }
        />
        <BmFieldText
          label="Số QĐ bổ sung"
          required
          value={form.supplementaryDecision.supplementaryDecisionCode}
          onChange={(v) =>
            patch("supplementaryDecision", "supplementaryDecisionCode", v)
          }
        />
        <BmFieldText
          label="Ngày QĐ bổ sung (dd/MM/yyyy)"
          required
          value={form.supplementaryDecision.supplementaryDecisionDateText}
          onChange={(v) =>
            patch(
              "supplementaryDecision",
              "supplementaryDecisionDateText",
              v,
            )
          }
        />
        <BmFieldText
          label="Tội danh bị khởi tố bổ sung"
          required
          value={form.supplementaryDecision.offenseName}
          onChange={(v) => patch("supplementaryDecision", "offenseName", v)}
        />
        <BmFieldText
          label="Khoản – Điều BLHS"
          required
          value={form.supplementaryDecision.offenseClauseAndArticle}
          onChange={(v) =>
            patch("supplementaryDecision", "offenseClauseAndArticle", v)
          }
          helperText="Ví dụ: khoản 2 Điều 173"
        />
      </BmFormSection>

      <BmFormSection
        title="4. Lý do & nội dung huỷ bỏ"
        description="Hai dòng tự sinh khi lưu: Điều 1 (huỷ) và Điều 2 (yêu cầu CQĐT điều tra)."
        fullWidth
      >
        <BmFieldTextarea
          label="Dòng lý do 'Xét thấy… trái pháp luật'"
          value={form.supplementaryDecision.decisionReasonLine}
          onChange={(v) =>
            patch("supplementaryDecision", "decisionReasonLine", v)
          }
          rows={3}
        />
        <BmFieldText
          label="Cơ quan bị yêu cầu (Điều 2)"
          required
          value={form.supplementaryDecision.orderedAuthorityName}
          onChange={(v) =>
            patch("supplementaryDecision", "orderedAuthorityName", v)
          }
          helperText="Thường là Cơ quan Cảnh sát điều tra được giao điều tra vụ án."
        />
        <BmFieldTextarea
          label="Điều 1 (tự sinh, có thể chỉnh tay)"
          value={buildArticle1Line(form)}
          onChange={() => {
            // read-only preview: user muốn sửa thì sửa ở các field phía trên
          }}
          rows={3}
          readOnly
        />
        <BmFieldTextarea
          label="Điều 2 (tự sinh, có thể chỉnh tay)"
          value={buildArticle2Line(form)}
          onChange={() => {
            // read-only preview
          }}
          rows={2}
          readOnly
        />
      </BmFormSection>

      <BmFormSection
        title="5. Nơi nhận & lưu hồ sơ"
      >
        <BmFieldText
          label="Dòng lưu"
          required
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="6. Chữ ký"
        description="Người ký + chế độ ký + chức vụ — dùng cho phần ký cuối văn bản."
      >
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-029"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
