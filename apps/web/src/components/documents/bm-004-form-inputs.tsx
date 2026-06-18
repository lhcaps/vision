"use client";

/**
 * BM-004 — QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin
 * Stage: TIEP_NHAN, Group: G01. TT 03/2026-VKSTC, Mẫu số 04/HS.
 *
 * Căn cứ: Điều 41, 42, 43, 159 và 160 BLTTHS.
 * Nghiệp vụ: Thay đổi người được phân công THQCT / KS việc giải quyết nguồn tin
 * (từ người A sang người B) cho vụ việc X.
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
  previousDecisionCode: string;
  previousDecisionDateText: string;
};

type AssignmentForm = {
  currentAssigneeName: string;
  currentAssigneeTitle: string;
  newAssigneeName: string;
  newAssigneeTitle: string;
  changeReasonLine: string;
  affectedCaseOrIncidentSummary: string;
  decisionArticle1Line: string;
  decisionArticle2Line: string;
};

type RecipientsForm = {
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm004Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  assignment: AssignmentForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

type Bm004FormInputsPanelProps = {
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

const EMPTY_FORM: Bm004Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKS",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "04/QĐ-VKS",
    issueDateIso: todayIsoDate(),
    issuePlaceAndDateLine: buildIssuePlaceAndDateLine("TP. Hồ Chí Minh", todayIsoDate()),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN",
    previousDecisionCode: "",
    previousDecisionDateText: "",
  },
  assignment: {
    currentAssigneeName: "",
    currentAssigneeTitle: "Kiểm sát viên",
    newAssigneeName: "",
    newAssigneeTitle: "Kiểm sát viên",
    changeReasonLine: "Xét thấy việc thay đổi người được phân công là cần thiết,",
    affectedCaseOrIncidentSummary: "",
    decisionArticle1Line: "",
    decisionArticle2Line: "",
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

function buildArticle1Line(form: Bm004Form): string {
  const a = form.assignment;
  return (
    `1. Phân công ${a.newAssigneeName.trim() || "…"} — ${a.newAssigneeTitle.trim() || "…"} ` +
    `của ${form.agency.bodyName.trim() || "…"} thay cho ${a.currentAssigneeName.trim() || "…"} — ` +
    `${a.currentAssigneeTitle.trim() || "…"}, thực hiện nhiệm vụ THQCT, kiểm sát việc ` +
    `tiếp nhận, giải quyết nguồn tin về tội phạm đối với ${a.affectedCaseOrIncidentSummary.trim() || "vụ việc …"}.`
  );
}

function buildArticle2Line(form: Bm004Form): string {
  return (
    `2. Các đồng chí có tên tại Điều 1 Quyết định này thực hiện nhiệm vụ, quyền hạn ` +
    `và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự./.`
  );
}

function normalizeFormInputs(payload: RenderPayload | null): Bm004Form {
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
      previousDecisionCode:
        nested(payload, "official.previousDecisionCode") ||
        EMPTY_FORM.official.previousDecisionCode,
      previousDecisionDateText:
        nested(payload, "official.previousDecisionDateText") ||
        EMPTY_FORM.official.previousDecisionDateText,
    },
    assignment: {
      currentAssigneeName:
        nested(payload, "assignment.currentAssigneeName") ||
        nested(payload, "assignment.previousAssigneeName") ||
        EMPTY_FORM.assignment.currentAssigneeName,
      currentAssigneeTitle:
        nested(payload, "assignment.currentAssigneeTitle") ||
        EMPTY_FORM.assignment.currentAssigneeTitle,
      newAssigneeName:
        nested(payload, "assignment.newAssigneeName") ||
        EMPTY_FORM.assignment.newAssigneeName,
      newAssigneeTitle:
        nested(payload, "assignment.newAssigneeTitle") ||
        EMPTY_FORM.assignment.newAssigneeTitle,
      changeReasonLine:
        nested(payload, "assignment.changeReasonLine") ||
        EMPTY_FORM.assignment.changeReasonLine,
      affectedCaseOrIncidentSummary:
        nested(payload, "assignment.affectedCaseOrIncidentSummary") ||
        nested(payload, "case.caseSummary") ||
        EMPTY_FORM.assignment.affectedCaseOrIncidentSummary,
      decisionArticle1Line:
        nested(payload, "assignment.decisionArticle1Line") ||
        EMPTY_FORM.assignment.decisionArticle1Line,
      decisionArticle2Line:
        nested(payload, "assignment.decisionArticle2Line") ||
        EMPTY_FORM.assignment.decisionArticle2Line,
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

function validateForm(form: Bm004Form): string[] {
  const required: Array<[string, string]> = [
    ["Viện kiểm sát cấp trên", form.agency.parentName],
    ["Viện kiểm sát ban hành", form.agency.name],
    ["Tên cơ quan trong thân văn bản", form.agency.bodyName],
    ["Địa danh ban hành", form.agency.issuePlace],
    ["Số văn bản", form.document.documentCode],
    ["Ngày ban hành", form.document.issueDateIso],
    ["Chủ thể ban hành", form.official.issuerTitle],
    ["Số QĐ phân công cũ", form.official.previousDecisionCode],
    ["Ngày QĐ phân công cũ", form.official.previousDecisionDateText],
    ["Họ tên người được phân công hiện tại", form.assignment.currentAssigneeName],
    ["Chức danh người hiện tại", form.assignment.currentAssigneeTitle],
    ["Họ tên người mới", form.assignment.newAssigneeName],
    ["Chức danh người mới", form.assignment.newAssigneeTitle],
    ["Vụ việc liên quan", form.assignment.affectedCaseOrIncidentSummary],
    ["Dòng lưu hồ sơ", form.recipients.archiveLine],
    ["Chế độ ký", form.signature.signMode],
    ["Chức vụ ký", form.signature.positionTitle],
    ["Người ký", form.signature.signerName],
  ];
  return required
    .filter(([, v]) => !String(v ?? "").trim())
    .map(([label]) => label);
}

function buildSaveBody(form: Bm004Form) {
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
    previousDecisionCode: form.official.previousDecisionCode,
    previousDecisionDateText: form.official.previousDecisionDateText,
  };

  const assignment = {
    currentAssigneeName: form.assignment.currentAssigneeName,
    currentAssigneeTitle: form.assignment.currentAssigneeTitle,
    newAssigneeName: form.assignment.newAssigneeName,
    newAssigneeTitle: form.assignment.newAssigneeTitle,
    changeReasonLine: form.assignment.changeReasonLine,
    affectedCaseOrIncidentSummary: form.assignment.affectedCaseOrIncidentSummary,
    decisionArticle1Line: stripLeadingNumber(
      buildArticle1Line(form),
      "Điều 1. Phân công … thay cho … thực hiện nhiệm vụ THQCT.",
    ),
    decisionArticle2Line: stripLeadingNumber(
      buildArticle2Line(form),
      "Điều 2. Các đồng chí có tên tại Điều 1 thực hiện nhiệm vụ theo BLTTHS.",
    ),
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
    assignment,
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

export function Bm004FormInputsPanel({
  documentId,
  onSaved,
}: Bm004FormInputsPanelProps) {
  const [form, setForm] = useState<Bm004Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);

  const patch = <T extends keyof Bm004Form>(
    section: T,
    key: keyof Bm004Form[T],
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
      setMessage("Đã tải lại dữ liệu BM-004 từ backend.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được dữ liệu BM-004.",
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
        documentCode: "04/QĐ-VKSKV7",
        issueDateIso: todayIsoDate(),
        issuePlaceAndDateLine: buildIssuePlaceAndDateLine(
          "TP. Hồ Chí Minh",
          todayIsoDate(),
        ),
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        previousDecisionCode: "01/QĐ-VKSKV7",
        previousDecisionDateText: "05/01/2026",
      },
      assignment: {
        currentAssigneeName: "Trần Văn B",
        currentAssigneeTitle: "Kiểm sát viên sơ cấp",
        newAssigneeName: "Lê Thị C",
        newAssigneeTitle: "Kiểm sát viên sơ cấp",
        changeReasonLine:
          "Xét thấy việc thay đổi người được phân công THQCT là cần thiết để đảm bảo tiến độ giải quyết nguồn tin,",
        affectedCaseOrIncidentSummary:
          "vụ trộm cắp tài sản xảy ra ngày 05/01/2026 tại phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        decisionArticle1Line: "",
        decisionArticle2Line: "",
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
    setMessage("Đã điền dữ liệu mẫu BM-004.");
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
      setMessage("Đã lưu dữ liệu BM-004. Các dòng tự sinh đã đồng bộ.");
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không lưu được dữ liệu BM-004.",
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
        templateCode="BM-004"
        title="Dữ liệu biểu mẫu QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 04/HS · Stage TIEP_NHAN (G01). Căn cứ Điều 41, 42, 43, 159 và 160 BLTTHS."
        isDirty={Boolean(message?.includes("mẫu") || message?.includes("đồng bộ"))}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel="Lưu dữ liệu BM-004"
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel="Tải lại từ backend"
        onSecondary={reloadFromBackend}
        extraActions={
          <BmFormCasePayloadButton
            templateCode="BM-004"
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
        title="3. QĐ phân công cũ"
        description="Quyết định phân công hiện đang có hiệu lực mà QĐ này thay thế."
      >
        <BmFieldText
          label="Số QĐ phân công cũ"
          required
          value={form.official.previousDecisionCode}
          onChange={(v) => patch("official", "previousDecisionCode", v)}
        />
        <BmFieldText
          label="Ngày QĐ phân công cũ (dd/MM/yyyy)"
          required
          value={form.official.previousDecisionDateText}
          onChange={(v) => patch("official", "previousDecisionDateText", v)}
        />
      </BmFormSection>

      <BmFormSection
        title="4. Thay đổi người THQCT/KS"
        description="Người hiện đang THQCT và người thay thế."
        fullWidth
      >
        <BmFieldText
          label="Họ tên người hiện đang THQCT"
          required
          value={form.assignment.currentAssigneeName}
          onChange={(v) => patch("assignment", "currentAssigneeName", v)}
        />
        <BmFieldText
          label="Chức danh người hiện tại"
          required
          value={form.assignment.currentAssigneeTitle}
          onChange={(v) => patch("assignment", "currentAssigneeTitle", v)}
        />
        <BmFieldText
          label="Họ tên người thay thế"
          required
          value={form.assignment.newAssigneeName}
          onChange={(v) => patch("assignment", "newAssigneeName", v)}
        />
        <BmFieldText
          label="Chức danh người thay thế"
          required
          value={form.assignment.newAssigneeTitle}
          onChange={(v) => patch("assignment", "newAssigneeTitle", v)}
        />
        <BmFieldTextarea
          label="Lý do thay đổi"
          rows={2}
          value={form.assignment.changeReasonLine}
          onChange={(v) => patch("assignment", "changeReasonLine", v)}
          fullWidth
        />
        <BmFieldTextarea
          label="Mô tả vụ việc / nguồn tin bị ảnh hưởng"
          required
          rows={2}
          value={form.assignment.affectedCaseOrIncidentSummary}
          onChange={(v) => patch("assignment", "affectedCaseOrIncidentSummary", v)}
          fullWidth
        />
        <BmFieldTextarea
          label="Điều 1 (tự sinh, có thể chỉnh tay)"
          value={buildArticle1Line(form)}
          onChange={() => {
            // read-only preview
          }}
          rows={4}
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-004"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
