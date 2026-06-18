"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFieldSelect,
  BmFieldCheckbox,
  BmFormSection,
  BmFormMetaBar,
} from "./bm-form";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type TextRecord = Record<string, string>;

type Bm042FormInputs = {
  agency: TextRecord;
  document: TextRecord;
  official: TextRecord;
  legalBasis: TextRecord;
  measure: TextRecord;
  recipients: TextRecord;
  signature: TextRecord;
};

type SectionKey = keyof Bm042FormInputs;

type RequiredField = {
  section: SectionKey;
  field: string;
  label: string;
};

type Bm042FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: Bm042FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
    phone: "",
  },
  document: {
    documentCodeLine: "",
    documentCode: "",
    documentNo: "",
    fullDocumentCode: "",
    issuePlaceAndDateLine: "",
    issueDate: "",
  },
  official: {
    issuerTitle: "",
  },
  legalBasis: {
    baseProcedureLine: "",
    isJuvenile: "true",
    juvenileLegalBasisLine: "",
    requestExtensionLine: "",
  },
  measure: {
    extensionRoundText: "",
    detentionOrderCode: "",
    detentionOrderIssueDateText: "",
    detentionOrderLegalBasisLine: "",
    previousExtensionDecisionLegalBasisLine: "",
    reasonLine: "",
    article1Line: "",
    article2Line: "",
    article3Line: "",
  },
  recipients: {
    superiorProcuracyLine: "",
    investigationUnitLine: "",
    personLine: "",
    detentionFacilityLine: "",
    archiveLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentName", label: "Cơ quan cấp trên" },
  { section: "agency", field: "name", label: "Viện kiểm sát ban hành" },
  { section: "document", field: "documentCodeLine", label: "Số quyết định" },
  { section: "document", field: "issuePlaceAndDateLine", label: "Địa danh, ngày ban hành" },
  { section: "measure", field: "extensionRoundText", label: "Lần gia hạn" },
  { section: "official", field: "issuerTitle", label: "Chủ thể ban hành" },
  { section: "legalBasis", field: "baseProcedureLine", label: "Căn cứ Bộ luật Tố tụng hình sự" },
  { section: "measure", field: "detentionOrderLegalBasisLine", label: "Căn cứ lệnh tạm giam" },
  { section: "legalBasis", field: "requestExtensionLine", label: "Xét hồ sơ đề nghị gia hạn" },
  { section: "measure", field: "reasonLine", label: "Dòng nhận thấy" },
  { section: "measure", field: "article1Line", label: "Điều 1" },
  { section: "measure", field: "article2Line", label: "Điều 2" },
  { section: "measure", field: "article3Line", label: "Điều 3" },
  { section: "recipients", field: "superiorProcuracyLine", label: "Nơi nhận - VKS cấp trên" },
  { section: "recipients", field: "investigationUnitLine", label: "Nơi nhận - cơ quan điều tra" },
  { section: "recipients", field: "personLine", label: "Nơi nhận - bị can" },
  { section: "recipients", field: "detentionFacilityLine", label: "Nơi nhận - nơi tạm giam" },
  { section: "recipients", field: "archiveLine", label: "Nơi nhận - lưu" },
  { section: "signature", field: "signMode", label: "Chế độ ký" },
  { section: "signature", field: "positionTitle", label: "Chức vụ người ký" },
  { section: "signature", field: "signerName", label: "Họ tên người ký" },
];

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getNestedValue(source: unknown, path: string): string {
  let current: unknown = source;

  for (const part of path.split(".")) {
    if (!current || typeof current !== "object") {
      return "";
    }

    current = (current as Record<string, unknown>)[part];
  }

  return toText(current);
}

function pickText(payload: Record<string, unknown>, ...paths: string[]): string {
  for (const path of paths) {
    const value = getNestedValue(payload, path).trim();

    if (
      value.length > 0 &&
      value.toLowerCase() !== "null" &&
      value.toLowerCase() !== "undefined"
    ) {
      return value;
    }
  }

  return "";
}

function getValue(form: Bm042FormInputs, section: SectionKey, field: string): string {
  return form[section][field] ?? "";
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm042FormInputs {
  const documentCode = pickText(
    payload,
    "document.documentCodeLine",
    "document.documentNo",
    "document.documentCode",
    "document.fullDocumentCode",
  );

  const juvenileLegalBasisLine = pickText(
    payload,
    "legalBasis.juvenileLegalBasisLine",
    "legalBasis.juvenileJusticeLine",
  );

  return {
    agency: {
      parentName: pickText(payload, "agency.parentName"),
      name: pickText(payload, "agency.name"),
      issuePlace: pickText(payload, "agency.issuePlace"),
      phone: pickText(payload, "agency.phone"),
    },
    document: {
      documentCodeLine: documentCode,
      documentCode,
      documentNo: documentCode,
      fullDocumentCode: documentCode,
      issuePlaceAndDateLine: pickText(
        payload,
        "document.issuePlaceAndDateLine",
        "document.issuePlaceDateLine",
      ),
      issueDate: pickText(payload, "document.issueDate"),
    },
    official: {
      issuerTitle: pickText(payload, "official.issuerTitle"),
    },
    legalBasis: {
      baseProcedureLine:
        pickText(payload, "legalBasis.baseProcedureLine") ||
        "Căn cứ các điều 41, 165 và 173 của Bộ luật Tố tụng hình sự;",
      isJuvenile: juvenileLegalBasisLine ? "true" : "false",
      juvenileLegalBasisLine:
        juvenileLegalBasisLine ||
        "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;",
      requestExtensionLine: pickText(payload, "legalBasis.requestExtensionLine"),
    },
    measure: {
      extensionRoundText: pickText(payload, "measure.extensionRoundText"),
      detentionOrderCode: pickText(
        payload,
        "measure.detentionOrderCode",
        "measure.detentionOrderNo",
        "measure.relatedOrderCode",
      ),
      detentionOrderIssueDateText: pickText(
        payload,
        "measure.detentionOrderIssueDateText",
        "measure.orderIssueDateText",
      ),
      detentionOrderLegalBasisLine: pickText(payload, "measure.detentionOrderLegalBasisLine"),
      previousExtensionDecisionLegalBasisLine: pickText(
        payload,
        "measure.previousExtensionDecisionLegalBasisLine",
      ),
      reasonLine: pickText(payload, "measure.reasonLine"),
      article1Line: pickText(payload, "measure.article1Line"),
      article2Line: pickText(payload, "measure.article2Line"),
      article3Line: pickText(payload, "measure.article3Line"),
    },
    recipients: {
      superiorProcuracyLine: pickText(payload, "recipients.superiorProcuracyLine"),
      investigationUnitLine: pickText(payload, "recipients.investigationUnitLine"),
      personLine: pickText(payload, "recipients.personLine", "recipients.accusedLine"),
      detentionFacilityLine: pickText(payload, "recipients.detentionFacilityLine"),
      archiveLine: pickText(payload, "recipients.archiveLine"),
    },
    signature: {
      signMode: pickText(payload, "signature.signMode"),
      positionTitle: pickText(payload, "signature.positionTitle"),
      signerName: pickText(payload, "signature.signerName"),
    },
  };
}

async function getBm042RenderPayload(documentId: string | number): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/render-payload`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Không tải được render-payload BM-042. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm042FormInputs(
  documentId: string | number,
  form: Bm042FormInputs,
): Promise<void> {
  const normalizedForm: Bm042FormInputs = {
    ...form,
    legalBasis: {
      ...form.legalBasis,
      juvenileLegalBasisLine:
        form.legalBasis.isJuvenile === "true"
          ? form.legalBasis.juvenileLegalBasisLine
          : "",
    },
  };

  const editableDocumentCode =
    normalizedForm.document.documentCodeLine?.trim() ||
    normalizedForm.document.documentCode?.trim() ||
    normalizedForm.document.documentNo?.trim() ||
    "";

  const savePayload: Bm042FormInputs = {
    ...normalizedForm,
    document: {
      ...normalizedForm.document,
      documentCodeLine: editableDocumentCode,
      documentCode: editableDocumentCode,
      documentNo: editableDocumentCode,
      fullDocumentCode: editableDocumentCode,
    },
  };

  const updatedByName =
    savePayload.signature.signerName?.trim() || "";

  const response = await fetch(`${API_BASE_URL}/documents/generated/${documentId}/form-inputs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      updatedByName,
      formInputs: savePayload,
      ...savePayload,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Không lưu được dữ liệu BM-042. HTTP ${response.status}`);
  }
}


function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
  rows = 3,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

export function Bm042FormInputsPanel({
  documentId,
  onSaved,
}: Bm042FormInputsPanelProps) {
  const [form, setForm] = useState<Bm042FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const isDirty = currentSnapshot !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      if (
        item.section === "legalBasis" &&
        item.field === "juvenileLegalBasisLine" &&
        form.legalBasis.isJuvenile !== "true"
      ) {
        return false;
      }

      return !getValue(form, item.section, item.field).trim();
    });
  }, [form]);

  async function loadForm() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = await getBm042RenderPayload(documentId);
      const nextForm = normalizeFormInputs(payload);

      setForm(nextForm);
      setInitialSnapshot(JSON.stringify(nextForm));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không tải được dữ liệu biểu mẫu BM-042.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadForm();
     
  }, [documentId]);

  function updateField(sectionKey: SectionKey, field: string, value: string) {
    setForm((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [field]: value,
      },
    }));
  }

  function fillCustomerSample() {
    const sample: Bm042FormInputs = {
      agency: {
        parentName: "",
        name: "",
        issuePlace: "TP. Hồ Chí Minh",
        phone: "",
      },
      document: {
        documentCodeLine: "42/QĐ-VKSKV7",
        documentCode: "42/QĐ-VKSKV7",
        documentNo: "42/QĐ-VKSKV7",
        fullDocumentCode: "42/QĐ-VKSKV7",
        issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 23 tháng 5 năm 2026",
        issueDate: "23/05/2026",
      },
      official: {
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      },
      legalBasis: {
        baseProcedureLine:
          "Căn cứ các điều 41, 165 và 173 của Bộ luật Tố tụng hình sự;",
        isJuvenile: "true",
        juvenileLegalBasisLine:
          "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;",
        requestExtensionLine:
          "Xét hồ sơ đề nghị gia hạn tạm giam của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với  về tội “Đánh bạc” quy định tại khoản 1 Điều 321 Bộ luật Hình sự;",
      },
      measure: {
        extensionRoundText: "nhất",
        detentionOrderCode: "17/LTG-VKSKV7",
        detentionOrderIssueDateText: "ngày 23 tháng 5 năm 2026",
        detentionOrderLegalBasisLine:
          "Căn cứ Lệnh tạm giam/Lệnh bắt bị can để tạm giam số 17/LTG-VKSKV7 ngày 23 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        previousExtensionDecisionLegalBasisLine:
          "Căn cứ Quyết định gia hạn tạm giam lần thứ nhất số 42/QĐ-VKSKV7 ngày 23 tháng 5 năm 2026 của Viện kiểm sát nhân dân khu vực 7 (nếu có);",
        reasonLine:
          "Nhận thấy việc gia hạn tạm giam đối với bị can  là có căn cứ và cần thiết,",
        article1Line:
          "Gia hạn tạm giam lần thứ nhất đối với  trong thời hạn 02 tháng, kể từ ngày 23 tháng 5 năm 2026 đến ngày 23 tháng 7 năm 2026.",
        article2Line:
          "Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự.",
        article3Line:
          "Yêu cầu Trại tạm giam Công an Thành phố Hồ Chí Minh tiếp tục tạm giam bị can  theo quy định của Bộ luật Tố tụng hình sự./.",
      },
      recipients: {
        superiorProcuracyLine: "- VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH;",
        investigationUnitLine: "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
        personLine: "- ;",
        detentionFacilityLine: "- Trại tạm giam Công an Thành phố Hồ Chí Minh;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
      },
      signature: {
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "",
      },
    };

    setForm(sample);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await saveBm042FormInputs(documentId, form);

      setInitialSnapshot(JSON.stringify(form));
      setSavedAt(new Date());
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không lưu được dữ liệu biểu mẫu BM-042.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải dữ liệu BM-042...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-042" form={form} onApply={(next) => setForm(next as typeof form)} />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          BM-042
        </p>

        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Dữ liệu Quyết định gia hạn tạm giam
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Form này chỉ phục vụ BM-042: quyết định gia hạn tạm giam, căn cứ lệnh
              tạm giam, quyết định gia hạn trước đó nếu có, hồ sơ đề nghị gia hạn,
              Điều 1/2/3, nơi nhận và chữ ký. Không dùng logic cấm đi khỏi nơi cư trú.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadForm}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Tải lại từ backend
            </button>

            <button
              type="button"
              onClick={fillCustomerSample}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              Điền dữ liệu mẫu BM-042
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Còn thiếu {missingFields.length} trường bắt buộc:{" "}
            {missingFields.map((field) => field.label).join(", ")}.
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Đã đủ trường bắt buộc để lưu và render BM-042.
          </div>
        )}
      </div>

      <BmFormSection title="1. Cơ quan / thông tin quyết định">
        <BmFieldText
          label="Cơ quan cấp trên"
          value={form.agency.parentName}
          onChange={(value) => updateField("agency", "parentName", value)}
          required
        />
        <BmFieldText
          label="Viện kiểm sát ban hành"
          value={form.agency.name}
          onChange={(value) => updateField("agency", "name", value)}
          required
        />
        <BmFieldText
          label="Số quyết định"
          value={form.document.documentCodeLine}
          onChange={(value) => updateField("document", "documentCodeLine", value)}
          required
          placeholder="42/QĐ-VKSKV7"
        />
        <BmFieldText
          label="Địa danh, ngày ban hành"
          value={form.document.issuePlaceAndDateLine}
          onChange={(value) => updateField("document", "issuePlaceAndDateLine", value)}
          required
        />
      </BmFormSection>

      <BmFormSection title="2. Chủ thể ban hành / căn cứ pháp lý">
        <BmFieldText
          label="Chủ thể ban hành"
          value={form.official.issuerTitle}
          onChange={(value) => updateField("official", "issuerTitle", value)}
          required
        />

        <BmFieldText
          label="Lần gia hạn"
          value={form.measure.extensionRoundText}
          onChange={(value) => updateField("measure", "extensionRoundText", value)}
          required
          placeholder="nhất / hai / ba"
        />

        <BmFieldTextarea
          label="Căn cứ Bộ luật Tố tụng hình sự"
          value={form.legalBasis.baseProcedureLine}
          onChange={(value) => updateField("legalBasis", "baseProcedureLine", value)}
          required
          rows={2}
          fullWidth
        />

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
          <input
            type="checkbox"
            checked={form.legalBasis.isJuvenile === "true"}
            onChange={(event) =>
              updateField("legalBasis", "isJuvenile", event.target.checked ? "true" : "false")
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm font-semibold text-slate-700">
            Có áp dụng căn cứ Luật Tư pháp người chưa thành niên
          </span>
        </label>

        {form.legalBasis.isJuvenile === "true" ? (
          <BmFieldTextarea
            label="Căn cứ Luật Tư pháp người chưa thành niên"
            value={form.legalBasis.juvenileLegalBasisLine}
            onChange={(value) => updateField("legalBasis", "juvenileLegalBasisLine", value)}
            rows={2}
            fullWidth
          />
        ) : null}

        <BmFieldTextarea
          label="Căn cứ lệnh tạm giam"
          value={form.measure.detentionOrderLegalBasisLine}
          onChange={(value) => updateField("measure", "detentionOrderLegalBasisLine", value)}
          required
          rows={3}
          fullWidth
        />

        <BmFieldTextarea
          label="Căn cứ quyết định gia hạn trước đó nếu có"
          value={form.measure.previousExtensionDecisionLegalBasisLine}
          onChange={(value) =>
            updateField("measure", "previousExtensionDecisionLegalBasisLine", value)
          }
          rows={3}
          fullWidth
        />

        <BmFieldTextarea
          label="Xét hồ sơ đề nghị gia hạn"
          value={form.legalBasis.requestExtensionLine}
          onChange={(value) => updateField("legalBasis", "requestExtensionLine", value)}
          required
          rows={4}
          fullWidth
        />

        <BmFieldTextarea
          label="Nhận thấy"
          value={form.measure.reasonLine}
          onChange={(value) => updateField("measure", "reasonLine", value)}
          required
          rows={3}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection title="3. Nội dung quyết định">
        <BmFieldTextarea
          label="Điều 1"
          value={form.measure.article1Line}
          onChange={(value) => updateField("measure", "article1Line", value)}
          required
          rows={4}
          fullWidth
        />

        <BmFieldTextarea
          label="Điều 2"
          value={form.measure.article2Line}
          onChange={(value) => updateField("measure", "article2Line", value)}
          required
          rows={3}
          fullWidth
        />

        <BmFieldTextarea
          label="Điều 3"
          value={form.measure.article3Line}
          onChange={(value) => updateField("measure", "article3Line", value)}
          required
          rows={3}
          fullWidth
        />
      </BmFormSection>

      <BmFormSection title="4. Nơi nhận">
        <BmFieldText
          label="Viện kiểm sát cấp trên"
          value={form.recipients.superiorProcuracyLine}
          onChange={(value) => updateField("recipients", "superiorProcuracyLine", value)}
          required
        />
        <BmFieldText
          label="Cơ quan điều tra"
          value={form.recipients.investigationUnitLine}
          onChange={(value) => updateField("recipients", "investigationUnitLine", value)}
          required
        />
        <BmFieldText
          label="Bị can"
          value={form.recipients.personLine}
          onChange={(value) => updateField("recipients", "personLine", value)}
          required
        />
        <BmFieldText
          label="Nơi tạm giam"
          value={form.recipients.detentionFacilityLine}
          onChange={(value) => updateField("recipients", "detentionFacilityLine", value)}
          required
        />
        <BmFieldText
          label="Lưu"
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
          required
        />
      </BmFormSection>

      <BmFormSection title="5. Chữ ký">
        <BmFieldText
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          required
        />
        <BmFieldText
          label="Chức vụ"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          required
        />
        <BmFieldText
          label="Người ký"
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          required
        />
      </BmFormSection>

      <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            {savedAt ? (
              <span>
                Đã lưu lúc{" "}
                <strong className="font-semibold text-slate-900">
                  {savedAt.toLocaleTimeString("vi-VN")}
                </strong>
              </span>
            ) : (
              <span>Chưa lưu thay đổi trong phiên này.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-042"}
          </button>
        </div>
      </div>
    </section>
  );
}