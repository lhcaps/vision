"use client";

/**
 * BM-017 — Yêu cầu khởi tố vụ án hình sự
 * Stage: TIEP_NHAN (Tiếp nhận, giải quyết nguồn tin về tội phạm), Group: G01
 * TT 03/2026-VKSTC, Mẫu số 17/HS.
 *
 * Form gom theo 8 nhóm field chuẩn (docs/BM_CANONICAL_SPEC.md §1).
 * Tất cả field nhập dùng BmFormSection + BmField* primitives từ ./bm-form.
 * Placeholder contract: docs/templates/BM-017/BM-017_PLACEHOLDER_CONTRACT.md.
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
};

type DocumentForm = {
  documentCode: string;
  issuePlace: string;
  issueDateIso: string;
};

type OfficialForm = {
  issuerTitle: string;
};

type CaseInitiationRequestForm = {
  procedureArticlesLine: string;
  investigationAuthorityName: string;
  incidentSummary: string;
  offenseName: string;
  legalArticle: string;
};

type RecipientsForm = {
  archiveLine: string;
  investigationAuthorityRecipientLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm017Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  caseInitiationRequest: CaseInitiationRequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm017FormInputsPanelProps = {
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

function stripLeadingNumber(value: string, numberText: "1" | "2"): string {
  const pattern = new RegExp(`^\\s*${numberText}\\s*\\.\\s*`, "iu");
  return String(value ?? "").replace(pattern, "").trim();
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

function parseDateToIso(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${slash[3]}-${pad2(Number(slash[2]))}-${pad2(Number(slash[1]))}`;
  }
  return "";
}

function normalizeAgencyBodyName(value: string): string {
  const raw = cleanText(value);
  if (!raw) return EMPTY_FORM.agency.bodyName;
  if (raw === raw.toLocaleUpperCase("vi-VN")) {
    return raw
      .toLocaleLowerCase("vi-VN")
      .replace(/^viện kiểm sát/u, "Viện kiểm sát");
  }
  return raw;
}

const EMPTY_FORM: Bm017Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
  },
  document: {
    documentCode: "17/YC-VKS",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: todayIsoDate(),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN",
  },
  caseInitiationRequest: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 143, 159, 161 và 165 của Bộ luật Tố tụng hình sự;",
    investigationAuthorityName:
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
    incidentSummary: "vụ việc có dấu hiệu tội phạm",
    offenseName: "",
    legalArticle: "khoản 1 Điều 321 Bộ luật Hình sự",
  },
  recipients: {
    archiveLine: defaultArchiveLine(),
    investigationAuthorityRecipientLine: "",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
};

function buildAssessmentLine(form: Bm017Form): string {
  const req = form.caseInitiationRequest;
  const incident = req.incidentSummary.trim() || "vụ việc";
  return `Xét thấy ${incident} có dấu hiệu tội phạm,`;
}

function buildLegalBasisLine(form: Bm017Form): string {
  const req = form.caseInitiationRequest;
  return `${req.legalArticle.trim() || "…"} của Bộ luật Hình sự,`;
}

function buildArticle1Line(form: Bm017Form): string {
  const req = form.caseInitiationRequest;
  return (
    `${req.investigationAuthorityName.trim()} khởi tố vụ án hình sự ` +
    `về tội "${req.offenseName.trim()}" quy định tại ${req.legalArticle.trim()} ` +
    `để tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự.`
  );
}

function buildArticle2Line(form: Bm017Form): string {
  const req = form.caseInitiationRequest;
  const agency = normalizeAgencyBodyName(form.agency.bodyName);
  return (
    `${req.investigationAuthorityName.trim()} gửi Quyết định khởi tố vụ án hình sự ` +
    `kèm theo tài liệu liên quan đến ${agency} để kiểm sát việc khởi tố ` +
    `theo quy định của Bộ luật Tố tụng hình sự./.`
  );
}

function buildInvestigationAuthorityRecipientLine(form: Bm017Form): string {
  const name = form.caseInitiationRequest.investigationAuthorityName.trim();
  return name ? `- ${name};` : "";
}

function normalizeFormInputs(payload: RenderPayload | null): Bm017Form {
  const issueDateRaw =
    nested(payload, "document.issueDate") ||
    nested(payload, "document.issueDateIso") ||
    nested(payload, "document.issueDateText") ||
    EMPTY_FORM.document.issueDateIso;
  const issueDateIso = parseDateToIso(issueDateRaw) || todayIsoDate();

  const savedIncidentSummary =
    nested(payload, "caseInitiationRequest.incidentSummary") ||
    nested(payload, "case.caseSummary") ||
    EMPTY_FORM.caseInitiationRequest.incidentSummary;

  const offenseName =
    nested(payload, "caseInitiationRequest.offenseName") ||
    nested(payload, "offense.offenseName") ||
    EMPTY_FORM.caseInitiationRequest.offenseName;

  const legalArticle =
    nested(payload, "caseInitiationRequest.legalArticle") ||
    nested(payload, "offense.legalArticle") ||
    EMPTY_FORM.caseInitiationRequest.legalArticle;

  const signerName =
    nested(payload, "signature.signerName") || DEFAULT_SIGNER_NAME;

  const issuePlace =
    nested(payload, "document.issuePlace") ||
    nested(payload, "agency.issuePlace") ||
    EMPTY_FORM.document.issuePlace;

  return {
    agency: {
      parentName:
        nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
      bodyName: normalizeAgencyBodyName(
        nested(payload, "agency.bodyName") ||
          nested(payload, "agency.name") ||
          EMPTY_FORM.agency.bodyName,
      ),
    },
    document: {
      documentCode:
        nested(payload, "document.documentCode") ||
        EMPTY_FORM.document.documentCode,
      issuePlace,
      issueDateIso,
    },
    official: {
      issuerTitle:
        nested(payload, "official.issuerTitle") || EMPTY_FORM.official.issuerTitle,
    },
    caseInitiationRequest: {
      procedureArticlesLine:
        nested(payload, "caseInitiationRequest.procedureArticlesLine") ||
        EMPTY_FORM.caseInitiationRequest.procedureArticlesLine,
      investigationAuthorityName:
        nested(payload, "caseInitiationRequest.investigationAuthorityName") ||
        nested(payload, "recipients.investigatingAgencyLine") ||
        EMPTY_FORM.caseInitiationRequest.investigationAuthorityName,
      incidentSummary: savedIncidentSummary,
      offenseName,
      legalArticle,
    },
    recipients: {
      archiveLine:
        nested(payload, "recipients.archiveLine") ||
        EMPTY_FORM.recipients.archiveLine,
      investigationAuthorityRecipientLine:
        nested(payload, "recipients.investigationAuthorityRecipientLine") ||
        buildInvestigationAuthorityRecipientLine({
          ...EMPTY_FORM,
          caseInitiationRequest: {
            ...EMPTY_FORM.caseInitiationRequest,
            investigationAuthorityName:
              nested(
                payload,
                "caseInitiationRequest.investigationAuthorityName",
              ) || "",
          },
        }),
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

function validateForm(form: Bm017Form): string[] {
  const required: Array<[string, string]> = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Tên cơ quan trong thân văn bản", form.agency.bodyName],
    ["Số văn bản", form.document.documentCode],
    ["Địa danh ban hành", form.document.issuePlace],
    ["Ngày ban hành", form.document.issueDateIso],
    ["Chủ thể ban hành", form.official.issuerTitle],
    ["Căn cứ tố tụng", form.caseInitiationRequest.procedureArticlesLine],
    ["Cơ quan điều tra", form.caseInitiationRequest.investigationAuthorityName],
    ["Nội dung vụ việc", form.caseInitiationRequest.incidentSummary],
    ["Tội danh", form.caseInitiationRequest.offenseName],
    ["Điều khoản BLHS", form.caseInitiationRequest.legalArticle],
    ["Dòng lưu hồ sơ", form.recipients.archiveLine],
    ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle],
    ["Người ký", form.signature.signerName],
  ];
  return required
    .filter(([, v]) => !String(v ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm017Form) {
  const signerName = form.signature.signerName.trim() || DEFAULT_SIGNER_NAME;
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(
    form.document.issuePlace,
    form.document.issueDateIso,
  );

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
    bodyName: form.agency.bodyName,
    issuePlace: form.document.issuePlace,
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
    issuePlace: form.document.issuePlace,
    issuePlaceAndDateLine,
    issuePlaceDateLine: issuePlaceAndDateLine,
  };

  const official = {
    issuerTitle: form.official.issuerTitle,
  };

  const caseInitiationRequest = {
    procedureArticlesLine: form.caseInitiationRequest.procedureArticlesLine,
    investigationAuthorityName:
      form.caseInitiationRequest.investigationAuthorityName,
    incidentSummary: form.caseInitiationRequest.incidentSummary,
    offenseName: form.caseInitiationRequest.offenseName,
    legalArticle: form.caseInitiationRequest.legalArticle,
    assessmentLine: buildAssessmentLine(form),
    legalBasisLine: buildLegalBasisLine(form),
    article1Line: stripLeadingNumber(buildArticle1Line(form), "1"),
    article2Line: stripLeadingNumber(buildArticle2Line(form), "2"),
    investigationAuthorityRecipientLine: buildInvestigationAuthorityRecipientLine(
      form,
    ),
  };

  const recipients = {
    archiveLine: form.recipients.archiveLine,
    investigationAuthorityRecipientLine:
      buildInvestigationAuthorityRecipientLine(form),
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
    caseInitiationRequest,
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

export function Bm017FormInputsPanel({
  documentId,
  onSaved,
}: Bm017FormInputsPanelProps) {
  const [form, setForm] = useState<Bm017Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm017Form>(
    section: T,
    key: keyof Bm017Form[T],
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
      setMessage("Đã tải lại dữ liệu BM-017 từ backend.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được dữ liệu BM-017.",
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
        bodyName: "Viện kiểm sát nhân dân khu vực 7",
      },
      document: {
        documentCode: "17/YC-VKSKV7",
        issuePlace: "TP. Hồ Chí Minh",
        issueDateIso: todayIsoDate(),
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      caseInitiationRequest: {
        procedureArticlesLine:
          "Căn cứ các điều 41, 143, 159, 161 và 165 của Bộ luật Tố tụng hình sự;",
        investigationAuthorityName:
          "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
        incidentSummary:
          "vụ trộm cắp tài sản xảy ra ngày 05/01/2026 tại phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        offenseName: "Trộm cắp tài sản",
        legalArticle: "khoản 1 Điều 173 Bộ luật Hình sự",
      },
      recipients: {
        archiveLine: defaultArchiveLine(),
        investigationAuthorityRecipientLine: "",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "Người ký mẫu",
      },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-017.");
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
      setMessage("Đã lưu dữ liệu BM-017. Các dòng tự sinh đã đồng bộ.");
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không lưu được dữ liệu BM-017.",
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
        templateCode="BM-017"
        title="Dữ liệu biểu mẫu Yêu cầu khởi tố vụ án hình sự"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 17/HS · Stage TIEP_NHAN (G01). Căn cứ Điều 41, 143, 159, 161 và 165 BLTTHS."
        isDirty={Boolean(message?.includes("mẫu") || message?.includes("đồng bộ"))}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-017"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton
            templateCode="BM-017"
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
          fullWidth
        />
        <BmFieldText
          label="Địa danh ban hành"
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
        title="3. Nội dung yêu cầu khởi tố"
        description="Căn cứ tố tụng, cơ quan điều tra, mô tả vụ việc, tội danh, điều luật."
      >
        <BmFieldTextarea
          label="Căn cứ tố tụng"
          required
          rows={2}
          value={form.caseInitiationRequest.procedureArticlesLine}
          onChange={(v) =>
            patch("caseInitiationRequest", "procedureArticlesLine", v)
          }
          fullWidth
        />
        <BmFieldText
          label="Cơ quan điều tra được yêu cầu khởi tố"
          required
          value={form.caseInitiationRequest.investigationAuthorityName}
          onChange={(v) =>
            patch("caseInitiationRequest", "investigationAuthorityName", v)
          }
          fullWidth
        />
        <BmFieldTextarea
          label="Nội dung vụ việc (mô tả hành vi có dấu hiệu tội phạm)"
          required
          rows={3}
          value={form.caseInitiationRequest.incidentSummary}
          onChange={(v) =>
            patch("caseInitiationRequest", "incidentSummary", v)
          }
          fullWidth
        />
        <BmFieldText
          label="Tội danh"
          required
          value={form.caseInitiationRequest.offenseName}
          onChange={(v) => patch("caseInitiationRequest", "offenseName", v)}
        />
        <BmFieldText
          label="Khoản – Điều BLHS"
          required
          value={form.caseInitiationRequest.legalArticle}
          onChange={(v) => patch("caseInitiationRequest", "legalArticle", v)}
          helperText="Ví dụ: khoản 1 Điều 173"
        />
      </BmFormSection>

      <BmFormSection
        title="4. Nội dung tự sinh (chỉ xem)"
        description="Hai đoạn văn render thẳng vào văn bản — chỉnh tay tại các field ở trên."
        fullWidth
      >
        <BmFieldTextarea
          label="Đoạn 'Xét thấy…' + căn cứ BLHS"
          value={`${buildAssessmentLine(form)} ${buildLegalBasisLine(form)}`}
          onChange={() => {
            // read-only preview
          }}
          rows={3}
          readOnly
        />
        <BmFieldTextarea
          label="Mục 1 (tự sinh)"
          value={buildArticle1Line(form)}
          onChange={() => {
            // read-only preview
          }}
          rows={3}
          readOnly
        />
        <BmFieldTextarea
          label="Mục 2 (tự sinh)"
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
          label="Dòng nơi nhận (CQĐT)"
          value={buildInvestigationAuthorityRecipientLine(form)}
          onChange={() => {
            // read-only preview: tự sinh từ CQĐT
          }}
          fullWidth
          readOnly
        />
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-017"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
