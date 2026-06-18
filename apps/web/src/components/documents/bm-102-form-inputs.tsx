"use client";

/**
 * BM-102 — QĐ huỷ bỏ QĐ (khởi tố / thay đổi / bổ sung / phục hồi / đình chỉ)
 * Stage: KHOI_TO, Group: G02. TT 03/2026-VKSTC, Mẫu số 102/HS.
 *
 * Căn cứ: Điều 36, 176, 177, 178 BLTTHS.
 * Nghiệp vụ: VKS huỷ bỏ QĐ đã ban hành khi phát hiện không có căn cứ / trái pháp luật.
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
type DecisionCancelForm = {
  procedureArticlesLine: string;
  decisionInfoLine: string;
  reasonLine: string;
  personName: string;
  offenseName: string;
  newDecisionLine: string;
};
type RecipientsForm = { archiveLine: string };
type SignatureForm = { signMode: string; positionTitle: string; signerName: string };

type Bm102Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  decisionCancel: DecisionCancelForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
};

type RenderPayload = Record<string, any>;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = "";

const EMPTY_FORM: Bm102Form = {
  agency: {
    parentName: "",
    name: "",
  },
  document: {
    documentCode: "102/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateIso: "2026-05-26",
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  decisionCancel: {
    procedureArticlesLine: "Căn cứ các điều 36, 176, 177, 178 của Bộ luật Tố tụng hình sự;",
    decisionInfoLine: "Quyết định số 85/QĐ-VKSKV7 ngày 01/05/2026",
    reasonLine: "",
    personName: "",
    offenseName: "",
    newDecisionLine: "",
  },
  recipients: {
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
};

const REQUIRED_FIELDS: ReadonlyArray<[keyof Bm102Form, string, string]> = [
  ["agency", "parentName", "Viện kiểm sát cấp trên"],
  ["agency", "name", "Viện kiểm sát ban hành"],
  ["document", "documentCode", "Số quyết định"],
  ["document", "issuePlace", "Địa danh ban hành"],
  ["document", "issueDateIso", "Ngày ban hành"],
  ["official", "issuerTitle", "Chủ thể ban hành"],
  ["decisionCancel", "procedureArticlesLine", "Căn cứ tố tụng"],
  ["decisionCancel", "decisionInfoLine", "Quyết định cũ"],
  ["decisionCancel", "reasonLine", "Lý do thay đổi"],
  ["decisionCancel", "personName", "Tên bị can"],
  ["decisionCancel", "offenseName", "Tội danh"],
  ["recipients", "archiveLine", "Lưu hồ sơ"],
  ["signature", "signMode", "Chế độ ký"],
  ["signature", "positionTitle", "Chức vụ ký"],
  ["signature", "signerName", "Người ký"],
];

function cleanText(value: unknown): string {
  return value == null ? "" : String(value).trim();
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

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseDateToIso(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${pad2(Number(slash[2]))}-${pad2(Number(slash[1]))}`;
  const vn = raw.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);
  if (vn) return `${vn[3]}-${pad2(Number(vn[2]))}-${pad2(Number(vn[1]))}`;
  return "";
}

function toVietnameseDateText(isoDate: string): string {
  return vnDateLine(isoDate, isoDate || "");
}

function toSlashDateText(isoDate: string): string {
  return isoDateToVnSlash(isoDate) || isoDate || "";
}

function issuePlaceFromLine(value: string): string {
  const raw = cleanText(value);
  const index = raw.toLowerCase().indexOf(", ngày");
  return index > 0 ? raw.slice(0, index).trim() : "";
}

function buildIssuePlaceAndDateLine(form: Bm102Form): string {
  return issuePlaceDateLine(form.document.issuePlace, form.document.issueDateIso);
}

function buildReasonLine(form: Bm102Form): string {
  const data = form.decisionCancel;
  if (!data.reasonLine.trim()) {
    return `Xét thấy việc thay đổi quyết định khởi tố bị can là cần thiết.`;
  }
  return data.reasonLine.trim();
}

function buildNewDecisionLine(form: Bm102Form): string {
  const data = form.decisionCancel;
  if (!data.newDecisionLine.trim()) {
    return `Thay đổi Quyết định khởi tố bị can đối với ${data.personName.trim()} về tội "${data.offenseName.trim()}".`;
  }
  return data.newDecisionLine.trim();
}

function normalizeFormInputs(payload: RenderPayload | null): Bm102Form {
  const issuePlaceAndDateLine = nested(payload, "document.issuePlaceAndDateLine");
  const signerName = nested(payload, "signature.signerName") || DEFAULT_SIGNER_NAME;

  return {
    agency: {
      parentName: nested(payload, "agency.parentName") || EMPTY_FORM.agency.parentName,
      name: nested(payload, "agency.name") || EMPTY_FORM.agency.name,
    },
    document: {
      documentCode: nested(payload, "document.documentCode") || EMPTY_FORM.document.documentCode,
      issuePlace:
        nested(payload, "agency.issuePlace") ||
        issuePlaceFromLine(issuePlaceAndDateLine) ||
        EMPTY_FORM.document.issuePlace,
      issueDateIso:
        parseDateToIso(nested(payload, "document.issueDate")) ||
        parseDateToIso(nested(payload, "document.issueDateText")) ||
        parseDateToIso(issuePlaceAndDateLine) ||
        EMPTY_FORM.document.issueDateIso,
    },
    official: {
      issuerTitle: nested(payload, "official.issuerTitle") || EMPTY_FORM.official.issuerTitle,
    },
    decisionCancel: {
      procedureArticlesLine:
        nested(payload, "decisionCancel.procedureArticlesLine") ||
        EMPTY_FORM.decisionCancel.procedureArticlesLine,
      decisionInfoLine:
        nested(payload, "decisionCancel.decisionInfoLine") ||
        EMPTY_FORM.decisionCancel.decisionInfoLine,
      reasonLine:
        nested(payload, "decisionCancel.reasonLine") ||
        EMPTY_FORM.decisionCancel.reasonLine,
      personName:
        nested(payload, "decisionCancel.personName") ||
        nested(payload, "person.fullName") ||
        EMPTY_FORM.decisionCancel.personName,
      offenseName:
        nested(payload, "decisionCancel.offenseName") ||
        nested(payload, "offense.offenseName") ||
        EMPTY_FORM.decisionCancel.offenseName,
      newDecisionLine:
        nested(payload, "decisionCancel.newDecisionLine") ||
        EMPTY_FORM.decisionCancel.newDecisionLine,
    },
    recipients: {
      archiveLine: nested(payload, "recipients.archiveLine") || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: nested(payload, "signature.signMode") || EMPTY_FORM.signature.signMode,
      positionTitle:
        nested(payload, "signature.positionTitle") || EMPTY_FORM.signature.positionTitle,
      signerName,
    },
  };
}

function validateForm(form: Bm102Form): string[] {
  return REQUIRED_FIELDS.filter(([section, key]) => {
    const sectionValue = form[section] as unknown as Record<string, string>;
    return !String(sectionValue?.[key] ?? "").trim();
  }).map(([, , label]) => label);
}

function buildSaveBody(form: Bm102Form) {
  const signerName = form.signature.signerName.trim() || DEFAULT_SIGNER_NAME;
  const issuePlaceAndDateLine = buildIssuePlaceAndDateLine(form);

  const agency = {
    parentName: form.agency.parentName,
    name: form.agency.name,
    issuePlace: form.document.issuePlace,
  };

  const document = {
    documentCode: form.document.documentCode,
    documentNo: form.document.documentCode,
    issueDate: toSlashDateText(form.document.issueDateIso),
    issueDateText: toVietnameseDateText(form.document.issueDateIso).replace(/^ngày\s+/iu, ""),
    issuePlaceAndDateLine,
    issuePlaceDateLine: issuePlaceAndDateLine,
  };

  const official = {
    issuerTitle: form.official.issuerTitle,
  };

  const decisionCancel = {
    procedureArticlesLine: form.decisionCancel.procedureArticlesLine,
    decisionInfoLine: form.decisionCancel.decisionInfoLine,
    reasonLine: buildReasonLine(form),
    personName: form.decisionCancel.personName,
    offenseName: form.decisionCancel.offenseName,
    newDecisionLine: buildNewDecisionLine(form),
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
    decisionCancel,
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

export function Bm102FormInputsPanel({
  documentId,
  onSaved,
}: {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<Bm102Form>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const issuePlaceAndDateLine = useMemo(() => buildIssuePlaceAndDateLine(form), [form]);
  const reasonLine = useMemo(() => buildReasonLine(form), [form]);
  const newDecisionLine = useMemo(() => buildNewDecisionLine(form), [form]);

  const patch = <S extends keyof Bm102Form, K extends keyof Bm102Form[S]>(
    section: S,
    key: K,
    value: Bm102Form[S][K],
  ) => {
    setForm((current) => ({
      ...current,
      [section]: { ...(current[section] as Record<string, unknown>), [key]: value },
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
        throw new Error(bodyText || `Không tải được render-payload. HTTP ${response.status}`);
      }
      const payload = (await response.json()) as RenderPayload;
      setForm(normalizeFormInputs(payload));
      setMessage("Đã tải lại dữ liệu BM-102 từ backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = () => {
    setForm({
      agency: { ...EMPTY_FORM.agency },
      document: { ...EMPTY_FORM.document },
      official: { ...EMPTY_FORM.official },
      decisionCancel: { ...EMPTY_FORM.decisionCancel },
      recipients: { ...EMPTY_FORM.recipients },
      signature: { ...EMPTY_FORM.signature },
    });
    setError(null);
    setMessage("Đã điền dữ liệu mẫu BM-102.");
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
        throw new Error(bodyText || `Không lưu được dữ liệu biểu mẫu. HTTP ${response.status}`);
      }
      await reloadFromBackend();
      setMessage("Đã lưu dữ liệu BM-102. Các dòng tự sinh đã đồng bộ.");
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
        templateCode="BM-102"
        title="Dữ liệu biểu mẫu QĐ huỷ bỏ QĐ (khởi tố / thay đổi / bổ sung / phục hồi / đình chỉ)"
        subtitle="Biểu mẫu TT 03/2026-VKSTC · Mẫu số 102/HS · Stage KHOI_TO (G02). Căn cứ Điều 36, 176, 177, 178 BLTTHS."
        isDirty={Boolean(message?.includes("mẫu") || message?.includes("đồng bộ"))}
        isLoading={loading}
        isSaving={saving}
        savedAt={null}
        errorMessage={error ?? undefined}
        warningMessage={status.kind === "warning" ? status.text : undefined}
        successMessage={status.kind === "success" ? status.text : undefined}
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-102"}
        onPrimary={handleSave}
        primaryDisabled={saving || loading}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
        onSecondary={reloadFromBackend}
        extraActions={
          <>
            <BmFormCasePayloadButton<Bm102Form>
              templateCode="BM-102"
              form={form}
              onApply={(next) => {
                setForm(next);
                setMessage("Đã lấy dữ liệu từ vụ án. Bấm lưu để ghi vào backend.");
              }}
            />
            <button
              type="button"
              className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-60"
              onClick={handleFillSample}
              disabled={loading || saving}
            >
              Điền dữ liệu mẫu
            </button>
          </>
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
        <BmFieldTextarea
          label="Dòng địa danh/ngày tháng tự sinh"
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
        title="2. Nội dung phê chuẩn"
        description="Chỉ nhập thông tin cốt lõi. Các dòng dài trong văn bản sẽ tự sinh."
      >
        <BmFieldTextarea
          label="Căn cứ tố tụng"
          required
          value={form.decisionCancel.procedureArticlesLine}
          onChange={(v) => patch("decisionCancel", "procedureArticlesLine", v)}
          rows={2}
        />
        <BmFieldText
          label="Quyết định khởi tố bị can cũ"
          required
          value={form.decisionCancel.decisionInfoLine}
          onChange={(v) => patch("decisionCancel", "decisionInfoLine", v)}
        />
        <BmFieldTextarea
          label="Lý do thay đổi"
          required
          value={form.decisionCancel.reasonLine}
          onChange={(v) => patch("decisionCancel", "reasonLine", v)}
          rows={3}
        />
        <BmFieldText
          label="Tên bị can"
          required
          value={form.decisionCancel.personName}
          onChange={(v) => patch("decisionCancel", "personName", v)}
        />
        <BmFieldText
          label="Tội danh"
          required
          value={form.decisionCancel.offenseName}
          onChange={(v) => patch("decisionCancel", "offenseName", v)}
        />
        <BmFieldTextarea
          label="Nội dung quyết định thay đổi (tự sinh nếu trống)"
          value={form.decisionCancel.newDecisionLine}
          onChange={(v) => patch("decisionCancel", "newDecisionLine", v)}
          rows={3}
        />
      </BmFormSection>

      <BmFormSection
        title="3. Nội dung tự sinh"
        description="Các dòng này không cần nhập tay. Đổi ô chính ở trên thì nội dung dưới đổi theo."
      >
        <BmFieldTextarea
          label="Dòng xét thấy tự sinh"
          value={reasonLine}
          readOnly
          onChange={() => undefined}
          rows={3}
        />
        <BmFieldTextarea
          label="Dòng quyết định tự sinh"
          value={newDecisionLine}
          readOnly
          onChange={() => undefined}
          rows={3}
        />
      </BmFormSection>

      <BmFormSection title="4. Nơi nhận và chữ ký">
        <BmFieldText
          label="Lưu hồ sơ"
          required
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
        primaryLabel={saving ? "Đang lưu..." : "Lưu dữ liệu BM-102"}
        primaryDisabled={saving || loading}
        onSecondary={reloadFromBackend}
        secondaryLabel={loading ? "Đang tải..." : "Tải lại từ backend"}
      />
    </div>
  );
}
