"use client";

/**
 * BM-013 — QĐ giải quyết tranh chấp về thẩm quyền giải quyết nguồn tin về tội phạm
 * Stage: TIEP_NHAN (Tiếp nhận, giải quyết nguồn tin về tội phạm), Group: G01
 * TT 03/2026-VKSTC, Mẫu số 13/HS.
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

type JurisdictionDisputeForm = {
  proposerName: string;
  incidentSummary: string;
  disputeReasonLine: string;
  decisionArticle1Line: string;
  decisionArticle2Line: string;
  orderedAuthorityName: string;
  receivingAuthorityName: string;
  disputeResolutionMode: string; // "TRANSFER" | "CONTINUE"
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm013Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  jurisdictionDispute: JurisdictionDisputeForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm013FormInputsPanelProps = {
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

const RESOLUTION_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "CONTINUE", label: "Yêu cầu tiếp tục giải quyết nguồn tin" },
  { value: "TRANSFER", label: "Yêu cầu chuyển nguồn tin cho cơ quan có thẩm quyền" },
];

const EMPTY_FORM: Bm013Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKS",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "13/QĐ-VKS",
    issueDateIso: todayIsoDate(),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine("TP. Hồ Chí Minh", todayIsoDate()),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN",
  },
  jurisdictionDispute: {
    proposerName: "",
    incidentSummary: "",
    disputeReasonLine:
      "Nhận thấy vụ việc thuộc thẩm quyền giải quyết của cơ quan khác,",
    decisionArticle1Line: "",
    decisionArticle2Line: "",
    orderedAuthorityName: "",
    receivingAuthorityName: "",
    disputeResolutionMode: "TRANSFER",
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

function buildArticle1Line(form: Bm013Form): string {
  const ordered = form.jurisdictionDispute.orderedAuthorityName.trim();
  return `1. Vụ việc thuộc thẩm quyền giải quyết của ${ordered || "…"}.`;
}

function buildArticle2Line(form: Bm013Form): string {
  const mode = form.jurisdictionDispute.disputeResolutionMode;
  const ordered = form.jurisdictionDispute.orderedAuthorityName.trim();
  const receiving = form.jurisdictionDispute.receivingAuthorityName.trim();
  if (mode === "CONTINUE") {
    return (
      `2. Yêu cầu ${ordered || "…"} tiếp tục giải quyết nguồn tin về tội phạm ` +
      `theo quy định của Bộ luật Tố tụng hình sự./.`
    );
  }
  return (
    `2. Yêu cầu ${ordered || "…"} chuyển nguồn tin về tội phạm ` +
    `cho ${receiving || "…"} để giải quyết theo quy định của Bộ luật Tố tụng hình sự./.`
  );
}

function normalizeFormInputs(payload: RenderPayload | null): Bm013Form {
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

  const resolutionModeRaw = nested(
    payload,
    "jurisdictionDispute.disputeResolutionMode",
  ).toUpperCase();
  const resolutionMode =
    resolutionModeRaw === "CONTINUE" || resolutionModeRaw === "TRANSFER"
      ? resolutionModeRaw
      : EMPTY_FORM.jurisdictionDispute.disputeResolutionMode;

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
    jurisdictionDispute: {
      proposerName:
        nested(payload, "jurisdictionDispute.proposerName") ||
        nested(payload, "jurisdictionDispute.proposingAuthorityName") ||
        EMPTY_FORM.jurisdictionDispute.proposerName,
      incidentSummary:
        nested(payload, "jurisdictionDispute.incidentSummary") ||
        EMPTY_FORM.jurisdictionDispute.incidentSummary,
      disputeReasonLine:
        nested(payload, "jurisdictionDispute.disputeReasonLine") ||
        EMPTY_FORM.jurisdictionDispute.disputeReasonLine,
      decisionArticle1Line:
        nested(payload, "jurisdictionDispute.decisionArticle1Line") ||
        EMPTY_FORM.jurisdictionDispute.decisionArticle1Line,
      decisionArticle2Line:
        nested(payload, "jurisdictionDispute.decisionArticle2Line") ||
        EMPTY_FORM.jurisdictionDispute.decisionArticle2Line,
      orderedAuthorityName:
        nested(payload, "jurisdictionDispute.orderedAuthorityName") ||
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.jurisdictionDispute.orderedAuthorityName,
      receivingAuthorityName:
        nested(payload, "jurisdictionDispute.receivingAuthorityName") ||
        EMPTY_FORM.jurisdictionDispute.receivingAuthorityName,
      disputeResolutionMode: resolutionMode,
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

function validateForm(form: Bm013Form): string[] {
  const required: Array<[string, string]> = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Tên cơ quan trong thân văn bản", form.agency.bodyName],
    ["Địa danh ban hành", form.agency.issuePlace],
    ["Số văn bản", form.document.documentCode],
    ["Ngày ban hành", form.document.issueDateIso],
    ["Chủ thể ban hành", form.official.issuerTitle],
    ["Cơ quan đề nghị giải quyết tranh chấp", form.jurisdictionDispute.proposerName],
    ["Trích dẫn nội dung vụ việc", form.jurisdictionDispute.incidentSummary],
    ["Cơ quan có thẩm quyền", form.jurisdictionDispute.orderedAuthorityName],
    [
      "Cơ quan nhận chuyển nguồn tin (nếu chế độ TRANSFER)",
      form.jurisdictionDispute.disputeResolutionMode === "TRANSFER"
        ? form.jurisdictionDispute.receivingAuthorityName
        : "x",
    ],
    ["Dòng lưu hồ sơ", form.recipients.archiveLine],
    ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle],
    ["Người ký", form.signature.signerName],
  ];
  return required
    .filter(([, v]) => !String(v ?? "").trim() || v === "x")
    .map(([label]) => label);
}

function buildSaveBody(form: Bm013Form) {
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

  const jurisdictionDispute = {
    proposerName: form.jurisdictionDispute.proposerName,
    incidentSummary: form.jurisdictionDispute.incidentSummary,
    disputeReasonLine: form.jurisdictionDispute.disputeReasonLine,
    decisionArticle1Line: stripLeadingNumber(
      buildArticle1Line(form),
      "Điều 1. Vụ việc thuộc thẩm quyền giải quyết của …",
    ),
    decisionArticle2Line: stripLeadingNumber(
      buildArticle2Line(form),
      "Điều 2. Yêu cầu … tiếp tục giải quyết nguồn tin về tội phạm",
    ),
    orderedAuthorityName: form.jurisdictionDispute.orderedAuthorityName,
    receivingAuthorityName: form.jurisdictionDispute.receivingAuthorityName,
    disputeResolutionMode: form.jurisdictionDispute.disputeResolutionMode,
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
    jurisdictionDispute,
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

export function Bm013FormInputsPanel({
  documentId,
  onSaved,
}: Bm013FormInputsPanelProps) {
  const [form, setForm] = useState<Bm013Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm013Form>(
    section: T,
    key: keyof Bm013Form[T],
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
      setMessage("Đã tải lại dữ liệu BM-013 từ backend.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được dữ liệu BM-013.",
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
        documentCode: "13/QĐ-VKSKV7",
        issueDateIso: todayIsoDate(),
        issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
          "TP. Hồ Chí Minh",
          todayIsoDate(),
        ),
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      jurisdictionDispute: {
        proposerName:
          "Cơ quan Cảnh sát điều tra Công an Quận 1, TP. Hồ Chí Minh",
        incidentSummary:
          "Vụ việc trộm cắp tài sản xảy ra ngày 05/01/2026 tại phường Bến Nghé, Quận 1, TP. Hồ Chí Minh.",
        disputeReasonLine:
          "Nhận thấy vụ việc thuộc thẩm quyền giải quyết của Cơ quan Cảnh sát điều tra Công an Quận 3,",
        decisionArticle1Line: "",
        decisionArticle2Line: "",
        orderedAuthorityName:
          "Cơ quan Cảnh sát điều tra Công an Quận 1, TP. Hồ Chí Minh",
        receivingAuthorityName:
          "Cơ quan Cảnh sát điều tra Công an Quận 3, TP. Hồ Chí Minh",
        disputeResolutionMode: "TRANSFER",
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
    setMessage("Đã điền dữ liệu mẫu BM-013.");
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
      setMessage("Đã lưu dữ liệu BM-013. Các dòng tự sinh đã đồng bộ.");
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không lưu được dữ liệu BM-013.",
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
        templateCode="BM-013"
        title="Dữ liệu biểu mẫu QĐ giải quyết tranh chấp về thẩm quyền giải quyết nguồn tin"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 13/HS · Stage TIEP_NHAN (G01). Căn cứ Điều 41, 150 và 160 BLTTHS."
        isDirty={Boolean(message?.includes("mẫu") || message?.includes("đồng bộ"))}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-013"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton
            templateCode="BM-013"
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
        title="3. Nội dung tranh chấp thẩm quyền"
        description="Mô tả CQ đề nghị giải quyết tranh chấp và nội dung vụ việc."
      >
        <BmFieldText
          label="Cơ quan/người đề nghị giải quyết tranh chấp"
          required
          value={form.jurisdictionDispute.proposerName}
          onChange={(v) => patch("jurisdictionDispute", "proposerName", v)}
        />
        <BmFieldTextarea
          label="Trích dẫn ngắn gọn nội dung vụ việc"
          required
          rows={3}
          value={form.jurisdictionDispute.incidentSummary}
          onChange={(v) => patch("jurisdictionDispute", "incidentSummary", v)}
          fullWidth
        />
        <BmFieldTextarea
          label="Dòng nhận thấy / lý do tranh chấp"
          rows={2}
          value={form.jurisdictionDispute.disputeReasonLine}
          onChange={(v) => patch("jurisdictionDispute", "disputeReasonLine", v)}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection
        title="4. Quyết định thẩm quyền & chế độ xử lý"
        description="Điều 1: xác định cơ quan có thẩm quyền. Điều 2: yêu cầu tiếp tục hoặc chuyển nguồn tin."
        fullWidth
      >
        <BmFieldText
          label="Cơ quan có thẩm quyền giải quyết"
          required
          value={form.jurisdictionDispute.orderedAuthorityName}
          onChange={(v) =>
            patch("jurisdictionDispute", "orderedAuthorityName", v)
          }
        />
        <BmFieldSelect
          label="Chế độ Điều 2"
          value={form.jurisdictionDispute.disputeResolutionMode}
          onChange={(v) =>
            patch("jurisdictionDispute", "disputeResolutionMode", v)
          }
          options={RESOLUTION_OPTIONS}
        />
        {form.jurisdictionDispute.disputeResolutionMode === "TRANSFER" ? (
          <BmFieldText
            label="Cơ quan nhận chuyển nguồn tin"
            required
            value={form.jurisdictionDispute.receivingAuthorityName}
            onChange={(v) =>
              patch("jurisdictionDispute", "receivingAuthorityName", v)
            }
            fullWidth
          />
        ) : null}
        <BmFieldTextarea
          label="Điều 1 (tự sinh, có thể chỉnh tay)"
          value={buildArticle1Line(form)}
          onChange={() => {
            // read-only preview
          }}
          rows={2}
          readOnly
        />
        <BmFieldTextarea
          label="Điều 2 (tự sinh, có thể chỉnh tay)"
          value={buildArticle2Line(form)}
          onChange={() => {
            // read-only preview
          }}
          rows={3}
          readOnly
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-013"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
