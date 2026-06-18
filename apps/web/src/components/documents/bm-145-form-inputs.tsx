"use client";

/**
 * BM-145 — QĐ trả hồ sơ vụ án hình sự để yêu cầu điều tra bổ sung
 * Stage: TRUY_TO, Group: G05. TT 03/2026-VKSTC, Mẫu số 145/HS.
 *
 * Căn cứ: Điều 41, 174, 240, 245 BLTTHS 2015.
 * Nghiệp vụ: VKS trả hồ sơ VAHS cho CQĐT để điều tra bổ sung trước khi truy tố.
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
} from "@/components/documents/bm-form";

type FormState = {
  returnRoundLine: string;
  procedureArticlesLine: string;
  investigationConclusionLegalBasisLine: string;
  hasCourtReturnDecision: boolean;
  courtReturnDecisionNo: string;
  courtReturnDecisionDate: string;
  courtReturnDecisionCourtName: string;
  courtReturnDecisionLegalBasisLine: string;
  reasonLine: string;
  article1IntroLine: string;
  supplementIssue1Line: string;
  supplementIssue2Line: string;
  supplementIssue3Line: string;
  article2Line: string;
  article3Line: string;
  investigationAuthorityRecipientLine: string;
  archiveLine: string;
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_COURT_NAME = "Tòa án nhân dân có thẩm quyền";

const EMPTY_FORM: FormState = {
  returnRoundLine: "(Lần thứ nhất)",
  procedureArticlesLine:
    "Căn cứ các điều 41, 174, 240 và 245 của Bộ luật Tố tụng hình sự;",
  investigationConclusionLegalBasisLine:
    "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 01/KLĐT-CSĐT ngày 17 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  hasCourtReturnDecision: false,
  courtReturnDecisionNo: "",
  courtReturnDecisionDate: "",
  courtReturnDecisionCourtName: DEFAULT_COURT_NAME,
  courtReturnDecisionLegalBasisLine: "",
  reasonLine: "Xét thấy cần điều tra bổ sung để làm rõ một số tình tiết của vụ án,",
  article1IntroLine:
    "Trả hồ sơ vụ án hình sự cho Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh để điều tra bổ sung những vấn đề sau:",
  supplementIssue1Line: "Làm rõ hành vi, vai trò của từng người tham gia trong vụ án.",
  supplementIssue2Line:
    "Thu thập, bổ sung tài liệu, chứng cứ liên quan đến số tiền, phương tiện dùng vào việc phạm tội.",
  supplementIssue3Line:
    "Làm rõ các tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự và các nội dung khác có liên quan.",
  article2Line:
    "Thời hạn điều tra bổ sung không quá 02 tháng, kể từ ngày Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh nhận hồ sơ vụ án và Quyết định này.",
  article3Line:
    "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.",
  investigationAuthorityRecipientLine: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  archiveLine: "- Lưu: HSVA, HSKS, VP.",
  signMode: "KT. VIỆN TRƯỞNG",
  positionTitle: "PHÓ VIỆN TRƯỞNG",
  signerName: "",
};

const REQUIRED_FIELDS: ReadonlyArray<[string, string]> = [
  ["Lần trả hồ sơ", "returnRoundLine"],
  ["Căn cứ BLTTHS", "procedureArticlesLine"],
  ["Căn cứ KLĐT", "investigationConclusionLegalBasisLine"],
  ["Lý do trả hồ sơ", "reasonLine"],
  ["Điều 1 (intro)", "article1IntroLine"],
  ["Vấn đề bổ sung 1", "supplementIssue1Line"],
  ["Điều 2", "article2Line"],
  ["Điều 3", "article3Line"],
  ["Nơi nhận CQĐT", "investigationAuthorityRecipientLine"],
  ["Lưu hồ sơ", "archiveLine"],
  ["Chế độ ký", "signMode"],
  ["Chức vụ ký", "positionTitle"],
  ["Người ký", "signerName"],
];

function cleanText(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function getPath(obj: any, path: string): string {
  const parts = path.split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return "";
    cur = cur[p];
  }
  return cleanText(cur);
}

function formatVietnameseDate(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "";
  return `ngày ${Number(day)} tháng ${Number(month)} năm ${year}`;
}

function buildCourtReturnDecisionLegalBasisLine(form: FormState): string {
  if (!form.hasCourtReturnDecision) return "";
  const decisionNo = cleanText(form.courtReturnDecisionNo);
  const dateText = formatVietnameseDate(form.courtReturnDecisionDate);
  const courtName = cleanText(form.courtReturnDecisionCourtName) || DEFAULT_COURT_NAME;
  const decisionNoPart = decisionNo ? `số ${decisionNo}` : "số ...";
  const datePart = dateText ? ` ${dateText}` : "";
  const courtPart = ` của ${courtName}`;
  return `Căn cứ Quyết định trả hồ sơ vụ án để điều tra bổ sung ${decisionNoPart}${datePart}${courtPart};`;
}

function inferCourtDecisionState(line: string): Pick<
  FormState,
  "hasCourtReturnDecision" | "courtReturnDecisionNo" | "courtReturnDecisionDate" | "courtReturnDecisionCourtName"
> {
  const normalizedLine = cleanText(line);
  if (!normalizedLine) {
    return {
      hasCourtReturnDecision: false,
      courtReturnDecisionNo: "",
      courtReturnDecisionDate: "",
      courtReturnDecisionCourtName: DEFAULT_COURT_NAME,
    };
  }
  const noMatch = normalizedLine.match(/số\s+(.+?)(?:\s+ngày|\s+của|;|$)/i);
  const dateMatch = normalizedLine.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
  const courtMatch = normalizedLine.match(/của\s+(.+?);?$/i);
  let dateValue = "";
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    const year = dateMatch[3];
    dateValue = `${year}-${month}-${day}`;
  }
  return {
    hasCourtReturnDecision: true,
    courtReturnDecisionNo: noMatch && noMatch[1] && noMatch[1] !== "..." ? noMatch[1].trim() : "",
    courtReturnDecisionDate: dateValue,
    courtReturnDecisionCourtName: courtMatch && courtMatch[1] ? courtMatch[1].trim() : DEFAULT_COURT_NAME,
  };
}

function normalizeFormInputs(payload: RenderPayload | null): FormState {
  const group = (payload as any)?.prosecutionSupplementReturn ?? {};
  const recipients = (payload as any)?.recipients ?? {};
  const signature = (payload as any)?.signature ?? {};
  const courtLine = cleanText(group.courtReturnDecisionLegalBasisLine);
  const courtState = inferCourtDecisionState(courtLine);
  return {
    ...EMPTY_FORM,
    returnRoundLine: getPath(group, "returnRoundLine") || EMPTY_FORM.returnRoundLine,
    procedureArticlesLine: getPath(group, "procedureArticlesLine") || EMPTY_FORM.procedureArticlesLine,
    investigationConclusionLegalBasisLine:
      getPath(group, "investigationConclusionLegalBasisLine") ||
      EMPTY_FORM.investigationConclusionLegalBasisLine,
    hasCourtReturnDecision: courtState.hasCourtReturnDecision,
    courtReturnDecisionNo: courtState.courtReturnDecisionNo,
    courtReturnDecisionDate: courtState.courtReturnDecisionDate,
    courtReturnDecisionCourtName: courtState.courtReturnDecisionCourtName,
    courtReturnDecisionLegalBasisLine: courtLine,
    reasonLine: getPath(group, "reasonLine") || EMPTY_FORM.reasonLine,
    article1IntroLine: getPath(group, "article1IntroLine") || EMPTY_FORM.article1IntroLine,
    supplementIssue1Line: getPath(group, "supplementIssue1Line") || EMPTY_FORM.supplementIssue1Line,
    supplementIssue2Line: getPath(group, "supplementIssue2Line") || EMPTY_FORM.supplementIssue2Line,
    supplementIssue3Line: getPath(group, "supplementIssue3Line") || EMPTY_FORM.supplementIssue3Line,
    article2Line: getPath(group, "article2Line") || EMPTY_FORM.article2Line,
    article3Line: getPath(group, "article3Line") || EMPTY_FORM.article3Line,
    investigationAuthorityRecipientLine:
      getPath(group, "investigationAuthorityRecipientLine") ||
      EMPTY_FORM.investigationAuthorityRecipientLine,
    archiveLine: getPath(recipients, "archiveLine") || EMPTY_FORM.archiveLine,
    signMode: getPath(signature, "signMode") || EMPTY_FORM.signMode,
    positionTitle: getPath(signature, "positionTitle") || EMPTY_FORM.positionTitle,
    signerName: getPath(signature, "signerName") || EMPTY_FORM.signerName,
  };
}

function validateForm(form: FormState): string[] {
  return REQUIRED_FIELDS.filter(([, key]) => !cleanText((form as any)[key])).map(
    ([label]) => label,
  );
}

function buildSaveBody(form: FormState) {
  const finalCourtLine = buildCourtReturnDecisionLegalBasisLine(form);
  return {
    updatedByName: form.signerName,
    prosecutionSupplementReturn: {
      returnRoundLine: form.returnRoundLine,
      procedureArticlesLine: form.procedureArticlesLine,
      investigationConclusionLegalBasisLine: form.investigationConclusionLegalBasisLine,
      courtReturnDecisionLegalBasisLine: finalCourtLine,
      reasonLine: form.reasonLine,
      article1IntroLine: form.article1IntroLine,
      supplementIssue1Line: form.supplementIssue1Line,
      supplementIssue2Line: form.supplementIssue2Line,
      supplementIssue3Line: form.supplementIssue3Line,
      article2Line: form.article2Line,
      article3Line: form.article3Line,
      investigationAuthorityRecipientLine: form.investigationAuthorityRecipientLine,
    },
    recipients: {
      investigationAuthorityRecipientLine: form.investigationAuthorityRecipientLine,
      archiveLine: form.archiveLine,
    },
    signature: {
      signMode: form.signMode,
      positionTitle: form.positionTitle,
      signerName: form.signerName,
    },
    official: { fullName: form.signerName, prosecutorName: form.signerName },
    formInputs: {},
    payloadOverrides: {},
    renderPayloadOverrides: {},
  };
}

export function Bm145FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const courtLine = useMemo(() => buildCourtReturnDecisionLegalBasisLine(form), [form]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      setMessage("Đã tải dữ liệu BM-145 từ backend.");
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
      setMessage("Đã lưu BM-145 thành công.");
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
      return { kind: "warning" as const, text: `Còn thiếu: ${validationErrors.join(", ")}` };
    if (error) return { kind: "error" as const, text: error };
    if (message) return { kind: "success" as const, text: message };
    return { kind: "idle" as const, text: "" };
  })();

  return (
    <div className="space-y-5">
      <BmFormMetaBar
        templateCode="BM-145"
        title="Dữ liệu biểu mẫu QĐ trả hồ sơ VAHS để điều tra bổ sung"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 145/HS · Căn cứ Điều 41, 174, 240, 245 BLTTHS 2015."
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-145"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
      />

      {status.kind === "idle" ? null : (
        <BmFormStatus kind={status.kind}>{status.text}</BmFormStatus>
      )}

      <BmFormSection title="1. Căn cứ pháp lý" description="Căn cứ BLTTHS, KLĐT và QĐ của Tòa." requiredCount={3}>
        <BmFieldText
          label="Lần trả hồ sơ"
          required
          value={form.returnRoundLine}
          onChange={(v) => updateField("returnRoundLine", v)}
        />
        <BmFieldTextarea
          label="Căn cứ BLTTHS"
          required
          fullWidth
          value={form.procedureArticlesLine}
          onChange={(v) => updateField("procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Căn cứ Bản kết luận điều tra"
          required
          fullWidth
          value={form.investigationConclusionLegalBasisLine}
          onChange={(v) => updateField("investigationConclusionLegalBasisLine", v)}
          rows={3}
        />
        <BmFieldTextarea
          label="Có QĐ trả hồ sơ của Tòa?"
          fullWidth
          value={form.courtReturnDecisionLegalBasisLine}
          onChange={(v) => {
            const state = inferCourtDecisionState(v);
            setForm((prev) => ({
              ...prev,
              courtReturnDecisionLegalBasisLine: v,
              hasCourtReturnDecision: state.hasCourtReturnDecision,
              courtReturnDecisionNo: state.courtReturnDecisionNo,
              courtReturnDecisionDate: state.courtReturnDecisionDate,
              courtReturnDecisionCourtName: state.courtReturnDecisionCourtName,
            }));
          }}
          rows={2}
        />
        <BmFieldDate
          label="Ngày QĐ trả hồ sơ của Tòa"
          value={form.courtReturnDecisionDate}
          onChange={(v) => {
            setForm((prev) => ({
              ...prev,
              courtReturnDecisionDate: v,
              hasCourtReturnDecision: v ? true : prev.hasCourtReturnDecision,
            }));
          }}
        />
        <BmFieldText
          label="Số QĐ trả hồ sơ của Tòa"
          value={form.courtReturnDecisionNo}
          onChange={(v) => updateField("courtReturnDecisionNo", v)}
        />
        <BmFieldText
          label="Tên Tòa ban hành"
          fullWidth
          value={form.courtReturnDecisionCourtName}
          onChange={(v) => updateField("courtReturnDecisionCourtName", v)}
        />
        <BmFieldTextarea
          label="Dòng căn cứ QĐ Tòa tự sinh"
          fullWidth
          readOnly
          value={courtLine}
          rows={2}
          onChange={() => undefined}
        />
      </BmFormSection>

      <BmFormSection title="2. Nội dung trả hồ sơ" requiredCount={6}>
        <BmFieldTextarea
          label="Lý do trả hồ sơ"
          required
          fullWidth
          value={form.reasonLine}
          onChange={(v) => updateField("reasonLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Điều 1 (intro)"
          required
          fullWidth
          value={form.article1IntroLine}
          onChange={(v) => updateField("article1IntroLine", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Vấn đề bổ sung 1"
          required
          fullWidth
          value={form.supplementIssue1Line}
          onChange={(v) => updateField("supplementIssue1Line", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Vấn đề bổ sung 2"
          fullWidth
          value={form.supplementIssue2Line}
          onChange={(v) => updateField("supplementIssue2Line", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Vấn đề bổ sung 3"
          fullWidth
          value={form.supplementIssue3Line}
          onChange={(v) => updateField("supplementIssue3Line", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Điều 2"
          required
          fullWidth
          value={form.article2Line}
          onChange={(v) => updateField("article2Line", v)}
          rows={2}
        />
        <BmFieldTextarea
          label="Điều 3"
          required
          fullWidth
          value={form.article3Line}
          onChange={(v) => updateField("article3Line", v)}
          rows={2}
        />
      </BmFormSection>

      <BmFormSection title="3. Nơi nhận" requiredCount={2}>
        <BmFieldText
          label="Nơi nhận CQĐT"
          required
          fullWidth
          value={form.investigationAuthorityRecipientLine}
          onChange={(v) => updateField("investigationAuthorityRecipientLine", v)}
        />
        <BmFieldText
          label="Lưu hồ sơ"
          required
          fullWidth
          value={form.archiveLine}
          onChange={(v) => updateField("archiveLine", v)}
        />
      </BmFormSection>

      <BmFormSection title="4. Chữ ký" requiredCount={3}>
        <BmFieldText
          label="Chế độ ký"
          required
          value={form.signMode}
          onChange={(v) => updateField("signMode", v)}
        />
        <BmFieldText
          label="Chức vụ ký"
          required
          value={form.positionTitle}
          onChange={(v) => updateField("positionTitle", v)}
        />
        <BmFieldText
          label="Người ký"
          required
          value={form.signerName}
          onChange={(v) => updateField("signerName", v)}
        />
      </BmFormSection>

      <BmFormActions
        onPrimary={handleSave}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-145"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
