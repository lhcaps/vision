"use client";

/**
 * BM-159 — Quyết định phân công VKS cấp dưới THQCT, kiểm sát xét xử sơ thẩm
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số 159/HS.
 *
 * Căn cứ: Điều 41, 239 BLTTHS 2015.
 * Nghiệp vụ: VKS cấp trên phân công VKS cấp dưới thực hành quyền công tố,
 * kiểm sát xét xử sơ thẩm vụ án đã ban hành Cáo trạng.
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
} from "@/components/documents/bm-form";

type AgencyForm = { parentName: string; name: string; bodyName: string; shortName: string };
type DocumentForm = { documentCode: string; issuePlace: string; issueDateIso: string };
type OfficialForm = { issuerTitle: string };
type LegalBasisForm = { procedureArticlesLine: string };
type AssignmentForm = {
  assignedProcuracy: string;
  issuingProcuracy: string;
  caseName: string;
  offenseName: string;
  offenseLegalLine: string;
  indictmentCode: string;
  indictmentDateLine: string;
  indictmentLine: string;
  article1Line: string;
  article2Line: string;
};
type RecipientsForm = { assignedProcuracyLine: string; courtLine: string; archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm159Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  subordinateProcuracyTrialAssignment: AssignmentForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, unknown>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = "";

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function todayDateLine(): string {
  const now = new Date();
  return `ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
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

const EMPTY_FORM: Bm159Form = {
  agency: {
    parentName: "VIỆN KIỂM SÁT NHÂN DÂN CẤP CAO TẠI TP. HỒ CHÍ MINH",
    name: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    bodyName: "Viện kiểm sát nhân dân khu vực 7",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "159/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: todayIsoDate(),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine: "Căn cứ Điều 41 và Điều 239 của Bộ luật Tố tụng hình sự;",
  },
  subordinateProcuracyTrialAssignment: {
    assignedProcuracy: "Viện kiểm sát nhân dân khu vực 3",
    issuingProcuracy: "Viện kiểm sát nhân dân khu vực 7",
    caseName: "vụ án cùng đồng phạm",
    offenseName: "Đánh bạc",
    offenseLegalLine: "quy định tại khoản 1 Điều 321 của Bộ luật Hình sự",
    indictmentCode: "159/CT-VKSKV7",
    indictmentDateLine: todayDateLine(),
    indictmentLine:
      "Căn cứ Cáo trạng số 159/CT-VKSKV7 ngày ... tháng ... năm ... của Viện kiểm sát nhân dân khu vực 7,",
    article1Line:
      "Phân công Viện kiểm sát nhân dân khu vực 3 thực hành quyền công tố, kiểm sát xét xử sơ thẩm vụ án cùng đồng phạm về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự.",
    article2Line:
      "Viện kiểm sát nhân dân khu vực 3 thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.",
  },
  recipients: {
    assignedProcuracyLine: "Viện kiểm sát nhân dân khu vực 3",
    courtLine: "Tòa án có thẩm quyền xét xử",
    archiveLine: "Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Viện kiểm sát cấp trên", "agency.parentName"],
  ["Viện kiểm sát ban hành", "agency.name"],
  ["Số quyết định", "document.documentCode"],
  ["Địa danh", "document.issuePlace"],
  ["Ngày ban hành", "document.issueDateIso"],
  ["Chủ thể ban hành", "official.issuerTitle"],
  ["Căn cứ pháp luật", "legalBasis.procedureArticlesLine"],
  ["VKS được phân công", "subordinateProcuracyTrialAssignment.assignedProcuracy"],
  ["Số cáo trạng", "subordinateProcuracyTrialAssignment.indictmentCode"],
  ["Tên vụ án", "subordinateProcuracyTrialAssignment.caseName"],
  ["Lưu hồ sơ", "recipients.archiveLine"],
  ["Chế độ ký", "signature.signMode"],
  ["Chức vụ ký", "signature.positionTitle"],
  ["Người ký", "signature.signerName"],
];

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

function buildIssuePlaceAndDateLine(form: Bm159Form): string {
  return issuePlaceDateLine(form.document.issuePlace, form.document.issueDateIso);
}

function buildIndictmentLine(form: Bm159Form): string {
  const a = form.subordinateProcuracyTrialAssignment;
  return `Căn cứ Cáo trạng số ${a.indictmentCode.trim()} ${a.indictmentDateLine.trim()} của ${a.issuingProcuracy.trim()},`;
}

function buildArticle1Line(form: Bm159Form): string {
  const a = form.subordinateProcuracyTrialAssignment;
  return `Phân công ${a.assignedProcuracy.trim()} thực hành quyền công tố, kiểm sát xét xử sơ thẩm ${a.caseName.trim()} về tội ${a.offenseName.trim()} ${a.offenseLegalLine.trim()}.`;
}

function buildArticle2Line(form: Bm159Form): string {
  const a = form.subordinateProcuracyTrialAssignment;
  return `${a.assignedProcuracy.trim()} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.`;
}

function normalizeFormInputs(payload: RenderPayload | null): Bm159Form {
  const f = EMPTY_FORM;
  if (!payload) return f;
  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || f.agency.parentName,
      name: nested(payload, "agency.name") || f.agency.name,
      bodyName: nested(payload, "agency.bodyName") || f.agency.bodyName,
      shortName: nested(payload, "agency.shortName") || f.agency.shortName,
    },
    document: {
      documentCode:
        nested(payload, "document.documentCode") || f.document.documentCode,
      issuePlace: nested(payload, "document.issuePlace") || f.document.issuePlace,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) ||
        f.document.issueDateIso,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || f.official.issuerTitle,
    },
    legalBasis: {
      procedureArticlesLine:
        nested(payload, "legalBasis.procedureArticlesLine") ||
        f.legalBasis.procedureArticlesLine,
    },
    subordinateProcuracyTrialAssignment: {
      assignedProcuracy:
        nested(payload, "subordinateProcuracyTrialAssignment.assignedProcuracy") ||
        f.subordinateProcuracyTrialAssignment.assignedProcuracy,
      issuingProcuracy:
        nested(payload, "subordinateProcuracyTrialAssignment.issuingProcuracy") ||
        f.subordinateProcuracyTrialAssignment.issuingProcuracy,
      caseName:
        nested(payload, "subordinateProcuracyTrialAssignment.caseName") ||
        f.subordinateProcuracyTrialAssignment.caseName,
      offenseName:
        nested(payload, "subordinateProcuracyTrialAssignment.offenseName") ||
        f.subordinateProcuracyTrialAssignment.offenseName,
      offenseLegalLine:
        nested(payload, "subordinateProcuracyTrialAssignment.offenseLegalLine") ||
        f.subordinateProcuracyTrialAssignment.offenseLegalLine,
      indictmentCode:
        nested(payload, "subordinateProcuracyTrialAssignment.indictmentCode") ||
        f.subordinateProcuracyTrialAssignment.indictmentCode,
      indictmentDateLine:
        nested(payload, "subordinateProcuracyTrialAssignment.indictmentDateLine") ||
        f.subordinateProcuracyTrialAssignment.indictmentDateLine,
      indictmentLine:
        nested(payload, "subordinateProcuracyTrialAssignment.indictmentLine") ||
        f.subordinateProcuracyTrialAssignment.indictmentLine,
      article1Line:
        nested(payload, "subordinateProcuracyTrialAssignment.article1Line") ||
        f.subordinateProcuracyTrialAssignment.article1Line,
      article2Line:
        nested(payload, "subordinateProcuracyTrialAssignment.article2Line") ||
        f.subordinateProcuracyTrialAssignment.article2Line,
    },
    recipients: {
      assignedProcuracyLine:
        nested(payload, "recipients.assignedProcuracyLine") ||
        f.recipients.assignedProcuracyLine,
      courtLine: nested(payload, "recipients.courtLine") || f.recipients.courtLine,
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

function lookupValue(form: Bm159Form, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = form;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return cleanText(cur);
}

function validateForm(form: Bm159Form): string[] {
  return REQUIRED_FIELDS.filter(([, path]) => !lookupValue(form, path)).map(
    ([label]) => label,
  );
}

function buildSaveBody(form: Bm159Form) {
  return {
    agency: {
      parentName: form.agency.parentName,
      name: form.agency.name,
      bodyName: form.agency.bodyName,
      shortName: form.agency.shortName,
      issuePlace: form.document.issuePlace,
    },
    document: {
      documentCode: form.document.documentCode,
      issueDate: toSlashDateText(form.document.issueDateIso),
      issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(
        /^ngày\s+/iu,
        "",
      ),
      issuePlaceAndDateLine: buildIssuePlaceAndDateLine(form),
    },
    official: { issuerTitle: form.official.issuerTitle },
    legalBasis: {
      procedureArticlesLine: form.legalBasis.procedureArticlesLine,
    },
    subordinateProcuracyTrialAssignment: {
      assignedProcuracy: form.subordinateProcuracyTrialAssignment.assignedProcuracy,
      issuingProcuracy: form.subordinateProcuracyTrialAssignment.issuingProcuracy,
      caseName: form.subordinateProcuracyTrialAssignment.caseName,
      offenseName: form.subordinateProcuracyTrialAssignment.offenseName,
      offenseLegalLine: form.subordinateProcuracyTrialAssignment.offenseLegalLine,
      indictmentCode: form.subordinateProcuracyTrialAssignment.indictmentCode,
      indictmentDateLine: form.subordinateProcuracyTrialAssignment.indictmentDateLine,
      indictmentLine: buildIndictmentLine(form),
      article1Line: buildArticle1Line(form),
      article2Line: buildArticle2Line(form),
    },
    recipients: {
      assignedProcuracyLine: form.recipients.assignedProcuracyLine,
      courtLine: form.recipients.courtLine,
      archiveLine: form.recipients.archiveLine,
    },
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

export function Bm159FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm159Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validation = useMemo(() => validateForm(form), [form]);

  const patch = <S extends keyof Bm159Form, K extends keyof Bm159Form[S]>(
    section: S,
    key: K,
    value: Bm159Form[S][K],
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
      setMessage("Đã tải dữ liệu BM-159 từ backend.");
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
      setMessage("Đã lưu BM-159 thành công.");
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
      return {
        kind: "warning" as const,
        text: `Còn thiếu: ${validationErrors.join(", ")}`,
      };
    if (error) return { kind: "error" as const, text: error };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-159"
        title="Dữ liệu biểu mẫu QĐ phân công VKS cấp dưới THQCT, kiểm sát xét xử"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 159/HS · Căn cứ Điều 41, 239 BLTTHS 2015."
        isDirty={false}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={
          validationErrors.length > 0
            ? `Còn thiếu: ${validationErrors.join(", ")}`
            : undefined
        }
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-159"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection
        title="1. Cơ quan / văn bản"
        description="Thông tin cơ quan ban hành và số hiệu văn bản."
        requiredCount={5}
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
          fullWidth
          value={form.agency.bodyName}
          onChange={(v) => patch("agency", "bodyName", v)}
        />
        <BmFieldText
          label="Tên viết tắt"
          value={form.agency.shortName}
          onChange={(v) => patch("agency", "shortName", v)}
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
      </BmFormSection>

      <BmFormSection
        title="2. Chủ thể ban hành / căn cứ"
        description="Căn cứ BLTTHS."
        requiredCount={2}
      >
        <BmFieldText
          label="Chủ thể ban hành"
          required
          fullWidth
          value={form.official.issuerTitle}
          onChange={(v) => patch("official", "issuerTitle", v)}
        />
        <BmFieldTextarea
          label="Căn cứ pháp luật"
          required
          fullWidth
          value={form.legalBasis.procedureArticlesLine}
          onChange={(v) => patch("legalBasis", "procedureArticlesLine", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection
        title="3. Cáo trạng / vụ án / tội danh"
        description="Các thông tin về cáo trạng và vụ án được phân công."
        requiredCount={3}
      >
        <BmFieldText
          label="VKS được phân công"
          required
          fullWidth
          value={form.subordinateProcuracyTrialAssignment.assignedProcuracy}
          onChange={(v) =>
            patch("subordinateProcuracyTrialAssignment", "assignedProcuracy", v)
          }
        />
        <BmFieldText
          label="VKS ban hành cáo trạng"
          fullWidth
          value={form.subordinateProcuracyTrialAssignment.issuingProcuracy}
          onChange={(v) =>
            patch("subordinateProcuracyTrialAssignment", "issuingProcuracy", v)
          }
        />
        <BmFieldText
          label="Số cáo trạng"
          required
          value={form.subordinateProcuracyTrialAssignment.indictmentCode}
          onChange={(v) =>
            patch("subordinateProcuracyTrialAssignment", "indictmentCode", v)
          }
        />
        <BmFieldText
          label="Ngày cáo trạng"
          value={form.subordinateProcuracyTrialAssignment.indictmentDateLine}
          onChange={(v) =>
            patch("subordinateProcuracyTrialAssignment", "indictmentDateLine", v)
          }
        />
        <BmFieldText
          label="Tên vụ án"
          required
          fullWidth
          value={form.subordinateProcuracyTrialAssignment.caseName}
          onChange={(v) =>
            patch("subordinateProcuracyTrialAssignment", "caseName", v)
          }
        />
        <BmFieldText
          label="Tội danh"
          fullWidth
          value={form.subordinateProcuracyTrialAssignment.offenseName}
          onChange={(v) =>
            patch("subordinateProcuracyTrialAssignment", "offenseName", v)
          }
        />
        <BmFieldText
          label="Điều luật tội danh"
          fullWidth
          value={form.subordinateProcuracyTrialAssignment.offenseLegalLine}
          onChange={(v) =>
            patch("subordinateProcuracyTrialAssignment", "offenseLegalLine", v)
          }
        />
      </BmFormSection>

      <BmFormSection
        title="4. Nội dung quyết định"
        description="Các đoạn văn bản tự sinh từ input phía trên."
      >
        <BmFieldTextarea
          label="Dòng căn cứ Cáo trạng (tự sinh)"
          fullWidth
          value={buildIndictmentLine(form)}
          readOnly
          rows={2}
          onChange={() => undefined}
        />
        <BmFieldTextarea
          label="Điều 1 (tự sinh)"
          fullWidth
          value={buildArticle1Line(form)}
          readOnly
          rows={3}
          onChange={() => undefined}
        />
        <BmFieldTextarea
          label="Điều 2 (tự sinh)"
          fullWidth
          value={buildArticle2Line(form)}
          readOnly
          rows={2}
          onChange={() => undefined}
        />
      </BmFormSection>

      <BmFormSection title="5. Nơi nhận" requiredCount={1}>
        <BmFieldText
          label="VKS được phân công"
          fullWidth
          value={form.recipients.assignedProcuracyLine}
          onChange={(v) => patch("recipients", "assignedProcuracyLine", v)}
        />
        <BmFieldText
          label="Tòa án"
          fullWidth
          value={form.recipients.courtLine}
          onChange={(v) => patch("recipients", "courtLine", v)}
        />
        <BmFieldText
          label="Lưu hồ sơ"
          required
          fullWidth
          value={form.recipients.archiveLine}
          onChange={(v) => patch("recipients", "archiveLine", v)}
        />
      </BmFormSection>

      <BmFormSection title="6. Chữ ký" requiredCount={3}>
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-159"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
