"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { absoluteApiUrl, extractApiError, isJsonObject } from "@/lib/api-client";
import {
  applyCasePayloadToGenericForm,
  type GenericCaseFormInputs,
} from "@/lib/bm-auto-populate/generic-case-defaults";
import { useCasePayload } from "@/lib/case-payload-context";

type TextSection = Record<string, string>;

type GenericTemplateFormInputs = GenericCaseFormInputs & {
  agency: TextSection;
  document: TextSection;
  caseInfo: TextSection;
  content: TextSection;
  recipients: TextSection;
  signature: TextSection;
};

type GenericTemplateFormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

const EMPTY_FORM: GenericTemplateFormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
  },
  document: {
    documentCode: "",
    issueDate: "",
  },
  caseInfo: {
    caseCode: "",
    caseTitle: "",
    accusedName: "",
    offenseName: "",
    legalArticle: "",
  },
  content: {
    legalBasisLine: "",
    summaryLine: "",
    decisionLine: "",
    noteLine: "",
  },
  recipients: {
    recipientLine: "",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];
  return isRecord(value) ? value : {};
}

function normalizePayload(payload: Record<string, unknown> | null): GenericTemplateFormInputs {
  if (!payload) return EMPTY_FORM;

  const savedInputs = section(payload, "formInputs");
  const payloadOverrides = section(payload, "payloadOverrides");
  const renderPayloadOverrides = section(payload, "renderPayloadOverrides");
  const normalizedPayload = {
    ...payload,
    ...payloadOverrides,
    ...renderPayloadOverrides,
    ...savedInputs,
  };

  const agency = section(normalizedPayload, "agency");
  const document = section(normalizedPayload, "document");
  const caseInfo = section(normalizedPayload, "case");
  const explicitCaseInfo = section(normalizedPayload, "caseInfo");
  const person = section(normalizedPayload, "person");
  const offense = section(normalizedPayload, "offense");
  const content = section(normalizedPayload, "content");
  const recipients = section(normalizedPayload, "recipients");
  const signature = section(normalizedPayload, "signature");

  return {
    agency: {
      parentName: text(agency.parentName) || EMPTY_FORM.agency.parentName,
      name: text(agency.name) || EMPTY_FORM.agency.name,
      issuePlace: text(agency.issuePlace) || EMPTY_FORM.agency.issuePlace,
    },
    document: {
      documentCode:
        text(document.documentCode) ||
        text(document.documentNo) ||
        EMPTY_FORM.document.documentCode,
      issueDate: text(document.issueDate) || EMPTY_FORM.document.issueDate,
    },
    caseInfo: {
      caseCode:
        text(caseInfo.caseCode) ||
        text(explicitCaseInfo.caseCode) ||
        EMPTY_FORM.caseInfo.caseCode,
      caseTitle:
        text(caseInfo.caseTitle) ||
        text(explicitCaseInfo.caseTitle) ||
        EMPTY_FORM.caseInfo.caseTitle,
      accusedName:
        text(person.fullName) ||
        text(explicitCaseInfo.accusedName) ||
        EMPTY_FORM.caseInfo.accusedName,
      offenseName:
        text(offense.offenseName) ||
        text(explicitCaseInfo.offenseName) ||
        EMPTY_FORM.caseInfo.offenseName,
      legalArticle:
        text(offense.legalArticle) ||
        text(explicitCaseInfo.legalArticle) ||
        EMPTY_FORM.caseInfo.legalArticle,
    },
    content: {
      legalBasisLine: text(content.legalBasisLine) || EMPTY_FORM.content.legalBasisLine,
      summaryLine: text(content.summaryLine) || EMPTY_FORM.content.summaryLine,
      decisionLine: text(content.decisionLine) || EMPTY_FORM.content.decisionLine,
      noteLine: text(content.noteLine) || EMPTY_FORM.content.noteLine,
    },
    recipients: {
      recipientLine: text(recipients.recipientLine) || EMPTY_FORM.recipients.recipientLine,
      archiveLine: text(recipients.archiveLine) || EMPTY_FORM.recipients.archiveLine,
    },
    signature: {
      signMode: text(signature.signMode) || EMPTY_FORM.signature.signMode,
      positionTitle: text(signature.positionTitle) || EMPTY_FORM.signature.positionTitle,
      signerName: text(signature.signerName) || EMPTY_FORM.signature.signerName,
    },
  };
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-slate-800">
        {title}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: "text" | "date";
  className?: string;
}) {
  const classNames =
    "rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {multiline ? (
        <textarea
          className={`${classNames} min-h-[92px]`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={classNames}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function GenericTemplateFormInputsPanel({
  documentId,
  onSaved,
}: GenericTemplateFormInputsPanelProps) {
  const [form, setForm] = useState<GenericTemplateFormInputs>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDirtyRef = useRef(false);
  const casePayload = useCasePayload();

  function patch(sectionKey: keyof GenericTemplateFormInputs, field: string, value: string) {
    isDirtyRef.current = true;
    setForm((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [field]: value,
      },
    }));
  }

  async function reload(options: { force?: boolean } = {}) {
    try {
      const response = await fetch(
        absoluteApiUrl(`/documents/generated/${documentId}/render-payload`),
        {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
      );

      if (response.ok) {
        const nextForm = normalizePayload((await response.json()) as Record<string, unknown>);
        if (options.force || !isDirtyRef.current) {
          setForm(nextForm);
          isDirtyRef.current = false;
        }
      }
    } catch {
      // The form remains editable with its default values if payload loading fails.
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const formToSave = form;
      const response = await fetch(
        absoluteApiUrl(`/documents/generated/${documentId}/form-inputs`),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            ...formToSave,
            formInputs: formToSave,
            payloadOverrides: formToSave,
            renderPayloadOverrides: formToSave,
          }),
        },
      );

      if (!response.ok) {
        const responseText = await response.text();
        let responseBody: unknown = null;
        if (responseText.trim()) {
          try {
            responseBody = JSON.parse(responseText);
          } catch {
            responseBody = responseText;
          }
        }
        throw new Error(extractApiError(responseBody, `Không lưu được dữ liệu [HTTP ${response.status}]`));
      }

      const responsePayload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      setForm(responsePayload ? normalizePayload(responsePayload) : formToSave);
      isDirtyRef.current = false;
      setMessage("Đã lưu dữ liệu biểu mẫu.");
      onSaved?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lỗi khi lưu dữ liệu.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleApplyCasePayload() {
    if (!casePayload) {
      setError("Chưa có dữ liệu vụ án để điền vào biểu mẫu.");
      return;
    }

    const result = applyCasePayloadToGenericForm({
      form,
      casePayload,
    });

    if (result.appliedFields.length === 0) {
      setMessage("Không có trường trống phù hợp để lấy từ vụ án.");
      return;
    }

    isDirtyRef.current = true;
    setForm(result.form);
    setError(null);
    setMessage(`Đã lấy ${result.appliedFields.length} trường dữ liệu từ vụ án.`);
  }

  useEffect(() => {
    void reload();
  }, [documentId]);

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Form dữ liệu chung
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Trường nền tảng cho biểu mẫu TT 03/2026
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            onClick={handleApplyCasePayload}
            disabled={!casePayload}
          >
            Lấy từ vụ án
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => void reload({ force: true })}
          >
            Tải lại
          </button>
          <button
            type="button"
            className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <SectionCard title="1. Cơ quan và văn bản">
        <Field
          label="Viện kiểm sát cấp trên"
          value={form.agency.parentName}
          onChange={(value) => patch("agency", "parentName", value)}
        />
        <Field
          label="Viện kiểm sát ban hành"
          value={form.agency.name}
          onChange={(value) => patch("agency", "name", value)}
        />
        <Field
          label="Số văn bản"
          value={form.document.documentCode}
          onChange={(value) => patch("document", "documentCode", value)}
        />
        <Field
          label="Ngày ban hành"
          type="date"
          value={form.document.issueDate}
          onChange={(value) => patch("document", "issueDate", value)}
        />
        <Field
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(value) => patch("agency", "issuePlace", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="2. Hồ sơ và nội dung">
        <Field
          label="Mã hồ sơ"
          value={form.caseInfo.caseCode}
          onChange={(value) => patch("caseInfo", "caseCode", value)}
        />
        <Field
          label="Tên vụ án"
          value={form.caseInfo.caseTitle}
          onChange={(value) => patch("caseInfo", "caseTitle", value)}
        />
        <Field
          label="Người liên quan / bị can"
          value={form.caseInfo.accusedName}
          onChange={(value) => patch("caseInfo", "accusedName", value)}
        />
        <Field
          label="Tội danh"
          value={form.caseInfo.offenseName}
          onChange={(value) => patch("caseInfo", "offenseName", value)}
        />
        <Field
          label="Điều luật"
          value={form.caseInfo.legalArticle}
          onChange={(value) => patch("caseInfo", "legalArticle", value)}
        />
        <Field
          label="Căn cứ pháp lý"
          value={form.content.legalBasisLine}
          onChange={(value) => patch("content", "legalBasisLine", value)}
        />
        <Field
          label="Nội dung chính"
          multiline
          value={form.content.summaryLine}
          onChange={(value) => patch("content", "summaryLine", value)}
          className="md:col-span-2"
        />
        <Field
          label="Quyết định / yêu cầu"
          multiline
          value={form.content.decisionLine}
          onChange={(value) => patch("content", "decisionLine", value)}
          className="md:col-span-2"
        />
        <Field
          label="Ghi chú"
          multiline
          value={form.content.noteLine}
          onChange={(value) => patch("content", "noteLine", value)}
          className="md:col-span-2"
        />
      </SectionCard>

      <SectionCard title="3. Nơi nhận và chữ ký">
        <Field
          label="Nơi nhận"
          value={form.recipients.recipientLine}
          onChange={(value) => patch("recipients", "recipientLine", value)}
        />
        <Field
          label="Lưu hồ sơ"
          value={form.recipients.archiveLine}
          onChange={(value) => patch("recipients", "archiveLine", value)}
        />
        <Field
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => patch("signature", "signMode", value)}
        />
        <Field
          label="Chức vụ ký"
          value={form.signature.positionTitle}
          onChange={(value) => patch("signature", "positionTitle", value)}
        />
        <Field
          label="Người ký"
          value={form.signature.signerName}
          onChange={(value) => patch("signature", "signerName", value)}
          className="md:col-span-2"
        />
      </SectionCard>
    </div>
  );
}
