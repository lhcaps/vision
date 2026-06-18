"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";
import {
  BmFieldText,
  BmFieldTextarea,
  BmFormSection,
} from "./bm-form";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const DEFAULT_SIGNER_NAME = '';

type JsonObject = Record<string, unknown>;

type AgencyForm = {
  parentName: string;
  name: string;
  bodyName: string;
  shortName: string;
};

type DocumentForm = {
  documentCode: string;
  issuePlace: string;
  issueDateText: string;
  issuePlaceAndDateLine: string;
};

type OfficialForm = {
  issuerTitle: string;
};

type LegalBasisForm = {
  procedureArticlesLine: string;
};

type SourceMaterialRequestForm = {
  sourceProvider: string;
  sourceProviderReceivedDateLine: string;
  caseSummary: string;
  deadlineDaysText: string;
  reasonLine: string;
  article1Line: string;
  documentItem1Line: string;
  documentItem2Line: string;
  documentItem3Line: string;
  additionalDocumentItemsLine: string;
  deadlineLine: string;
};

type RecipientsForm = {
  primaryLine: string;
  archiveLine: string;
};

type SignatureForm = {
  positionTitle: string;
  signerName: string;
};

type Bm007Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  sourceMaterialRequest: SourceMaterialRequestForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm007FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const textareaClass =
  "min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const labelClass = "text-xs font-semibold text-slate-600";

const EMPTY_FORM: Bm007Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "07/YC-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: "30/05/2026",
    issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 30 tháng 5 năm 2026",
  },
  official: {
    issuerTitle: "",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 42 và 160 của Bộ luật Tố tụng hình sự;",
  },
  sourceMaterialRequest: {
    sourceProvider: "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    sourceProviderReceivedDateLine: "ngày 30 tháng 5 năm 2026",
    caseSummary:
      "vụ việc có dấu hiệu Đánh bạc xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    deadlineDaysText: "03 ngày",
    reasonLine:
      "Để kiểm sát việc giải quyết nguồn tin về tội phạm đối với vụ việc có dấu hiệu Đánh bạc xảy ra tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh, được Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây tiếp nhận ngày 30 tháng 5 năm 2026,",
    article1Line:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây cung cấp cho Viện kiểm sát nhân dân khu vực 7 các tài liệu liên quan đến việc giải quyết nguồn tin về tội phạm, cụ thể như sau:",
    documentItem1Line:
      "Tài liệu tiếp nhận, phân loại, xử lý ban đầu đối với nguồn tin về tội phạm.",
    documentItem2Line:
      "Biên bản làm việc, lời khai, tài liệu xác minh ban đầu có liên quan đến vụ việc.",
    documentItem3Line:
      "Tài liệu, đồ vật, dữ liệu điện tử hoặc chứng cứ khác đã thu thập được trong quá trình giải quyết nguồn tin.",
    additionalDocumentItemsLine:
      "d) Các tài liệu khác có liên quan đến việc giải quyết nguồn tin về tội phạm, nếu có.",
    deadlineLine:
      "Thời hạn cung cấp tài liệu là: 03 ngày, kể từ ngày Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây nhận được Yêu cầu này./.",
  },
  recipients: {
    primaryLine: "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    archiveLine: "Lưu: HSVV, HSKS, VP",
  },
  signature: {
    positionTitle: "KIỂM SÁT VIÊN",
    signerName: DEFAULT_SIGNER_NAME,
  },
  updatedByName: DEFAULT_SIGNER_NAME,
  renderedByName: DEFAULT_SIGNER_NAME,
  convertedByName: DEFAULT_SIGNER_NAME,
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function readPath(root: unknown, path: string): { found: boolean; value: unknown } {
  const parts = path.split(".").filter(Boolean);
  let current: unknown = root;

  for (const part of parts) {
    const obj = asRecord(current);
    if (!Object.prototype.hasOwnProperty.call(obj, part)) {
      return { found: false, value: undefined };
    }
    current = obj[part];
  }

  return { found: true, value: current };
}

function firstExistingRecord(payload: unknown, paths: string[]): JsonObject {
  for (const path of paths) {
    const result = readPath(payload, path);
    if (result.found) {
      const obj = asRecord(result.value);
      if (Object.keys(obj).length > 0) return obj;
    }
  }

  return {};
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pickString(
  formInputs: unknown,
  payload: unknown,
  path: string,
  fallback = "",
): string {
  const saved = readPath(formInputs, path);
  if (saved.found) return cleanText(saved.value);

  const root = readPath(payload, path);
  if (root.found) return cleanText(root.value);

  return fallback;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeDisplayDate(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "";

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (vn) return `${pad2(Number(vn[1]))}/${pad2(Number(vn[2]))}/${vn[3]}`;

  return raw;
}

function displayDateToIso(value: string): string {
  const raw = cleanText(value);

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return raw;

  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (!vn) return "";

  return `${vn[3]}-${pad2(Number(vn[2]))}-${pad2(Number(vn[1]))}`;
}

function issuePlaceAndDateLine(issuePlace: string, issueDateText: string): string {
  const normalizedDate = normalizeDisplayDate(issueDateText);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalizedDate);

  if (!match) {
    return `${cleanText(issuePlace)}, ngày ... tháng ... năm ...`;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3];

  return `${cleanText(issuePlace)}, ngày ${day} tháng ${month} năm ${year}`;
}

function ensureSentence(value: string, ending = "."): string {
  const text = cleanText(value).replace(/\s+([,.;:])/gu, "$1");
  if (!text) return "";
  return /[.!?;:]$/u.test(text) ? text : `${text}${ending}`;
}

function stripRecipientLine(value: string): string {
  return cleanText(value)
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function buildGeneratedLines(form: Bm007Form): Pick<
  SourceMaterialRequestForm,
  "reasonLine" | "article1Line" | "deadlineLine"
> {
  const sourceProvider =
    cleanText(form.sourceMaterialRequest.sourceProvider) ||
    EMPTY_FORM.sourceMaterialRequest.sourceProvider;

  const receivedDateLine =
    cleanText(form.sourceMaterialRequest.sourceProviderReceivedDateLine) ||
    EMPTY_FORM.sourceMaterialRequest.sourceProviderReceivedDateLine;

  const caseSummary =
    cleanText(form.sourceMaterialRequest.caseSummary) ||
    EMPTY_FORM.sourceMaterialRequest.caseSummary;

  const agencyBodyName =
    cleanText(form.agency.bodyName) || EMPTY_FORM.agency.bodyName;

  const deadlineDaysText =
    cleanText(form.sourceMaterialRequest.deadlineDaysText) ||
    EMPTY_FORM.sourceMaterialRequest.deadlineDaysText;

  return {
    reasonLine: `Để kiểm sát việc giải quyết nguồn tin về tội phạm đối với ${caseSummary}, được ${sourceProvider} tiếp nhận ${receivedDateLine},`,
    article1Line: `${sourceProvider} cung cấp cho ${agencyBodyName} các tài liệu liên quan đến việc giải quyết nguồn tin về tội phạm, cụ thể như sau:`,
    deadlineLine: `Thời hạn cung cấp tài liệu là: ${deadlineDaysText}, kể từ ngày ${sourceProvider} nhận được Yêu cầu này./.`,
  };
}

function normalizeFormInputs(form: Bm007Form): Bm007Form & {
  document: DocumentForm & { issueDate: string };
} {
  const normalizedDate = normalizeDisplayDate(form.document.issueDateText);
  const nextIssueLine = issuePlaceAndDateLine(
    form.document.issuePlace,
    normalizedDate,
  );

  return {
    ...form,
    agency: {
      parentName: cleanText(form.agency.parentName),
      name: cleanText(form.agency.name),
      bodyName: cleanText(form.agency.bodyName),
      shortName: cleanText(form.agency.shortName),
    },
    document: {
      documentCode: cleanText(form.document.documentCode),
      issuePlace: cleanText(form.document.issuePlace),
      issueDateText: normalizedDate,
      issueDate: displayDateToIso(normalizedDate),
      issuePlaceAndDateLine: nextIssueLine,
    },
    official: {
      issuerTitle: cleanText(form.official.issuerTitle),
    },
    legalBasis: {
      procedureArticlesLine:
        cleanText(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
    },
    sourceMaterialRequest: {
      sourceProvider: cleanText(form.sourceMaterialRequest.sourceProvider),
      sourceProviderReceivedDateLine: cleanText(
        form.sourceMaterialRequest.sourceProviderReceivedDateLine,
      ),
      caseSummary: cleanText(form.sourceMaterialRequest.caseSummary),
      deadlineDaysText: cleanText(form.sourceMaterialRequest.deadlineDaysText),
      reasonLine: cleanText(form.sourceMaterialRequest.reasonLine),
      article1Line: cleanText(form.sourceMaterialRequest.article1Line),
      documentItem1Line: ensureSentence(form.sourceMaterialRequest.documentItem1Line),
      documentItem2Line: ensureSentence(form.sourceMaterialRequest.documentItem2Line),
      documentItem3Line: ensureSentence(form.sourceMaterialRequest.documentItem3Line),
      additionalDocumentItemsLine: ensureSentence(
        form.sourceMaterialRequest.additionalDocumentItemsLine,
      ),
      deadlineLine: cleanText(form.sourceMaterialRequest.deadlineLine),
    },
    recipients: {
      primaryLine: stripRecipientLine(form.recipients.primaryLine),
      archiveLine: stripRecipientLine(form.recipients.archiveLine),
    },
    signature: {
      positionTitle: cleanText(form.signature.positionTitle),
      signerName: cleanText(form.signature.signerName),
    },
    updatedByName: cleanText(form.updatedByName) || DEFAULT_SIGNER_NAME,
    renderedByName: cleanText(form.renderedByName) || DEFAULT_SIGNER_NAME,
    convertedByName: cleanText(form.convertedByName) || DEFAULT_SIGNER_NAME,
  };
}

function buildFormFromPayload(payload: unknown): Bm007Form {
  const formInputs = firstExistingRecord(payload, [
    "formInputs",
    "renderPayloadSnapshot.formInputs",
    "metadata.formInputs",
  ]);

  return normalizeFormInputs({
    agency: {
      parentName: pickString(
        formInputs,
        payload,
        "agency.parentName",
        EMPTY_FORM.agency.parentName,
      ),
      name: pickString(formInputs, payload, "agency.name", EMPTY_FORM.agency.name),
      bodyName: pickString(
        formInputs,
        payload,
        "agency.bodyName",
        EMPTY_FORM.agency.bodyName,
      ),
      shortName: pickString(
        formInputs,
        payload,
        "agency.shortName",
        EMPTY_FORM.agency.shortName,
      ),
    },
    document: {
      documentCode: pickString(
        formInputs,
        payload,
        "document.documentCode",
        EMPTY_FORM.document.documentCode,
      ),
      issuePlace: pickString(
        formInputs,
        payload,
        "document.issuePlace",
        pickString(formInputs, payload, "agency.issuePlace", EMPTY_FORM.document.issuePlace),
      ),
      issueDateText: normalizeDisplayDate(
        pickString(
          formInputs,
          payload,
          "document.issueDateText",
          pickString(formInputs, payload, "document.issueDate", EMPTY_FORM.document.issueDateText),
        ),
      ),
      issuePlaceAndDateLine: pickString(
        formInputs,
        payload,
        "document.issuePlaceAndDateLine",
        EMPTY_FORM.document.issuePlaceAndDateLine,
      ),
    },
    official: {
      issuerTitle: pickString(
        formInputs,
        payload,
        "official.issuerTitle",
        EMPTY_FORM.official.issuerTitle,
      ),
    },
    legalBasis: {
      procedureArticlesLine: pickString(
        formInputs,
        payload,
        "legalBasis.procedureArticlesLine",
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
    },
    sourceMaterialRequest: {
      sourceProvider: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.sourceProvider",
        EMPTY_FORM.sourceMaterialRequest.sourceProvider,
      ),
      sourceProviderReceivedDateLine: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.sourceProviderReceivedDateLine",
        EMPTY_FORM.sourceMaterialRequest.sourceProviderReceivedDateLine,
      ),
      caseSummary: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.caseSummary",
        EMPTY_FORM.sourceMaterialRequest.caseSummary,
      ),
      deadlineDaysText: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.deadlineDaysText",
        EMPTY_FORM.sourceMaterialRequest.deadlineDaysText,
      ),
      reasonLine: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.reasonLine",
        EMPTY_FORM.sourceMaterialRequest.reasonLine,
      ),
      article1Line: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.article1Line",
        EMPTY_FORM.sourceMaterialRequest.article1Line,
      ),
      documentItem1Line: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.documentItem1Line",
        EMPTY_FORM.sourceMaterialRequest.documentItem1Line,
      ),
      documentItem2Line: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.documentItem2Line",
        EMPTY_FORM.sourceMaterialRequest.documentItem2Line,
      ),
      documentItem3Line: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.documentItem3Line",
        EMPTY_FORM.sourceMaterialRequest.documentItem3Line,
      ),
      additionalDocumentItemsLine: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.additionalDocumentItemsLine",
        EMPTY_FORM.sourceMaterialRequest.additionalDocumentItemsLine,
      ),
      deadlineLine: pickString(
        formInputs,
        payload,
        "sourceMaterialRequest.deadlineLine",
        EMPTY_FORM.sourceMaterialRequest.deadlineLine,
      ),
    },
    recipients: {
      primaryLine: pickString(
        formInputs,
        payload,
        "recipients.primaryLine",
        EMPTY_FORM.recipients.primaryLine,
      ),
      archiveLine: pickString(
        formInputs,
        payload,
        "recipients.archiveLine",
        EMPTY_FORM.recipients.archiveLine,
      ),
    },
    signature: {
      positionTitle: pickString(
        formInputs,
        payload,
        "signature.positionTitle",
        EMPTY_FORM.signature.positionTitle,
      ),
      signerName: pickString(
        formInputs,
        payload,
        "signature.signerName",
        EMPTY_FORM.signature.signerName,
      ),
    },
    updatedByName: pickString(
      formInputs,
      payload,
      "updatedByName",
      DEFAULT_SIGNER_NAME,
    ),
    renderedByName: pickString(
      formInputs,
      payload,
      "renderedByName",
      DEFAULT_SIGNER_NAME,
    ),
    convertedByName: pickString(
      formInputs,
      payload,
      "convertedByName",
      DEFAULT_SIGNER_NAME,
    ),
  });
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <textarea
        className={textareaClass}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function StatusMessage({
  status,
  message,
}: {
  status: "idle" | "loading" | "saving" | "success" | "error";
  message: string;
}) {
  if (!message) return null;

  const className =
    status === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : status === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${className}`}>
      {message}
    </div>
  );
}

export function Bm007FormInputsPanel({
  documentId,
  onSaved,
}: Bm007FormInputsPanelProps) {
  const [form, setForm] = useState<Bm007Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-007 từ backend...");

      try {
        const response = await fetch(
          `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`Không tải được render-payload. HTTP ${response.status}`);
        }

        const payload = await response.json();

        if (!cancelled) {
          setForm(buildFormFromPayload(payload));
          setStatus("idle");
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-007.");
        }
      }
    }

    void loadPayload();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const preview = useMemo(() => normalizeFormInputs(form), [form]);

  function updateAgency<K extends keyof AgencyForm>(key: K, value: AgencyForm[K]) {
    setForm((current) => ({
      ...current,
      agency: { ...current.agency, [key]: value },
    }));
  }

  function updateDocument<K extends keyof DocumentForm>(key: K, value: DocumentForm[K]) {
    setForm((current) => {
      const document = { ...current.document, [key]: value };
      return {
        ...current,
        document: {
          ...document,
          issuePlaceAndDateLine: issuePlaceAndDateLine(
            document.issuePlace,
            document.issueDateText,
          ),
        },
      };
    });
  }

  function updateOfficial<K extends keyof OfficialForm>(key: K, value: OfficialForm[K]) {
    setForm((current) => ({
      ...current,
      official: { ...current.official, [key]: value },
    }));
  }

  function updateLegalBasis<K extends keyof LegalBasisForm>(key: K, value: LegalBasisForm[K]) {
    setForm((current) => ({
      ...current,
      legalBasis: { ...current.legalBasis, [key]: value },
    }));
  }

  function updateRequest<K extends keyof SourceMaterialRequestForm>(
    key: K,
    value: SourceMaterialRequestForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        sourceMaterialRequest: {
          ...current.sourceMaterialRequest,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        sourceMaterialRequest: {
          ...nextForm.sourceMaterialRequest,
          ...buildGeneratedLines(nextForm),
        },
      };
    });
  }

  function updateRecipients<K extends keyof RecipientsForm>(key: K, value: RecipientsForm[K]) {
    setForm((current) => ({
      ...current,
      recipients: { ...current.recipients, [key]: value },
    }));
  }

  function updateSignature<K extends keyof SignatureForm>(key: K, value: SignatureForm[K]) {
    setForm((current) => ({
      ...current,
      signature: { ...current.signature, [key]: value },
      updatedByName: key === "signerName" ? value : current.updatedByName,
      renderedByName: key === "signerName" ? value : current.renderedByName,
      convertedByName: key === "signerName" ? value : current.convertedByName,
    }));
  }

  function regenerateLines() {
    setForm((current) => ({
      ...current,
      sourceMaterialRequest: {
        ...current.sourceMaterialRequest,
        ...buildGeneratedLines(current),
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-007.");
  }

  async function requestSave(method: "POST" | "PATCH", body: unknown) {
    const response = await fetch(
      `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      text,
    };
  }

  async function handleSave() {
    setStatus("saving");
    setMessage("Đang lưu formInputs BM-007...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-007",
        formInputs: ready,
        payloadOverrides: ready,
        renderPayloadOverrides: ready,
        updatedByName: ready.updatedByName,
        renderedByName: ready.renderedByName,
        convertedByName: ready.convertedByName,
      };

      let result = await requestSave("POST", body);

      if (!result.ok && (result.status === 404 || result.status === 405)) {
        result = await requestSave("PATCH", body);
      }

      if (!result.ok) {
        throw new Error(
          result.text || `Không lưu được BM-007. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-007. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-007 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <BmFormCasePayloadButton templateCode="BM-007" form={form} onApply={(next) => setForm(next as typeof form)} />
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-007
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Yêu cầu cung cấp tài liệu để kiểm sát nguồn tin về tội phạm
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-007. Dữ liệu chính được lưu vào nhóm{" "}
          <span className="font-semibold">sourceMaterialRequest</span>, gồm lý do
          yêu cầu, danh mục tài liệu, thời hạn, nơi nhận và chữ ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-007
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại lý do / Điều 1 / thời hạn
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-007"}
          </button>
        </div>

        <div className="mt-4">
          <StatusMessage status={status} message={message} />
        </div>
      </section>

      <SectionCard
        title="1. Cơ quan / văn bản"
        description="Ngày nhập theo DD/MM/YYYY để tránh lỗi đảo năm-tháng-ngày."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateAgency("parentName", value)} fullWidth />
          <BmFieldText label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateAgency("name", value)} fullWidth />
          <BmFieldText label="Tên cơ quan trong thân văn bản" value={form.agency.bodyName} onChange={(value) => updateAgency("bodyName", value)} fullWidth />
          <BmFieldText label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateAgency("shortName", value)} fullWidth />
          <BmFieldText label="Số yêu cầu" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} fullWidth />
          <BmFieldText label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} fullWidth />
          <BmFieldText label="Ngày ban hành DD/MM/YYYY" value={form.document.issueDateText} onChange={(value) => updateDocument("issueDateText", value)} fullWidth />
          <BmFieldText label="Dòng địa danh, ngày tháng" value={form.document.issuePlaceAndDateLine} onChange={(value) => updateDocument("issuePlaceAndDateLine", value)} fullWidth />
        </div>
      </SectionCard>

      <SectionCard title="2. Chủ thể / căn cứ tố tụng">
        <div className="grid gap-4">
          <BmFieldText label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={(value) => updateOfficial("issuerTitle", value)} fullWidth />
          <TextAreaField
            label="Căn cứ tố tụng"
            value={form.legalBasis.procedureArticlesLine}
            onChange={(value) => updateLegalBasis("procedureArticlesLine", value)}
            rows={2}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="3. Thông tin nguồn tin / cơ quan được yêu cầu"
        description="Sửa các ô ngắn rồi bấm 'Tự sinh lại lý do / Điều 1 / thời hạn' nếu muốn cập nhật lại các dòng dài."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Cơ quan, người có thẩm quyền được yêu cầu" value={form.sourceMaterialRequest.sourceProvider} onChange={(value) => updateRequest("sourceProvider", value, true)} fullWidth />
          <BmFieldText label="Ngày tiếp nhận nguồn tin" value={form.sourceMaterialRequest.sourceProviderReceivedDateLine} onChange={(value) =>
              updateRequest("sourceProviderReceivedDateLine", value, true)
            } fullWidth />
          <BmFieldText label="Thời hạn cung cấp" value={form.sourceMaterialRequest.deadlineDaysText} onChange={(value) => updateRequest("deadlineDaysText", value, true)} fullWidth />
          <TextAreaField
            label="Vụ việc / nguồn tin"
            value={form.sourceMaterialRequest.caseSummary}
            onChange={(value) => updateRequest("caseSummary", value, true)}
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="4. Nội dung yêu cầu">
        <div className="grid gap-4">
          <TextAreaField
            label="Lý do yêu cầu"
            value={form.sourceMaterialRequest.reasonLine}
            onChange={(value) => updateRequest("reasonLine", value)}
            rows={4}
          />
          <TextAreaField
            label="Điều 1"
            value={form.sourceMaterialRequest.article1Line}
            onChange={(value) => updateRequest("article1Line", value)}
            rows={4}
          />
          <TextAreaField
            label="a) Tài liệu thứ nhất"
            value={form.sourceMaterialRequest.documentItem1Line}
            onChange={(value) => updateRequest("documentItem1Line", value)}
            rows={3}
          />
          <TextAreaField
            label="b) Tài liệu thứ hai"
            value={form.sourceMaterialRequest.documentItem2Line}
            onChange={(value) => updateRequest("documentItem2Line", value)}
            rows={3}
          />
          <TextAreaField
            label="c) Tài liệu thứ ba"
            value={form.sourceMaterialRequest.documentItem3Line}
            onChange={(value) => updateRequest("documentItem3Line", value)}
            rows={3}
          />
          <TextAreaField
            label="Tài liệu bổ sung"
            value={form.sourceMaterialRequest.additionalDocumentItemsLine}
            onChange={(value) => updateRequest("additionalDocumentItemsLine", value)}
            rows={3}
          />
          <TextAreaField
            label="Điều 2 - Thời hạn cung cấp"
            value={form.sourceMaterialRequest.deadlineLine}
            onChange={(value) => updateRequest("deadlineLine", value)}
            rows={3}
          />
        </div>
      </SectionCard>

      <SectionCard title="5. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Nơi nhận chính" value={form.recipients.primaryLine} onChange={(value) => updateRecipients("primaryLine", value)} fullWidth />
          <BmFieldText label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateRecipients("archiveLine", value)} fullWidth />
          <BmFieldText label="Chức vụ người ký" value={form.signature.positionTitle} onChange={(value) => updateSignature("positionTitle", value)} fullWidth />
          <BmFieldText label="Người ký" value={form.signature.signerName} onChange={(value) => updateSignature("signerName", value)} fullWidth />
        </div>
      </SectionCard>

      <SectionCard title="Preview dữ liệu sẽ lưu">
        <div className="space-y-3 rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          <p>
            <span className="font-bold">Số:</span> {preview.document.documentCode}
          </p>
          <p>
            <span className="font-bold">Ngày:</span>{" "}
            {preview.document.issuePlaceAndDateLine}
          </p>
          <p>
            <span className="font-bold">Căn cứ:</span>{" "}
            {preview.legalBasis.procedureArticlesLine}
          </p>
          <p>
            <span className="font-bold">Lý do:</span>{" "}
            {preview.sourceMaterialRequest.reasonLine}
          </p>
          <p>
            <span className="font-bold">Điều 1:</span>{" "}
            {preview.sourceMaterialRequest.article1Line}
          </p>
          <p>
            <span className="font-bold">Thời hạn:</span>{" "}
            {preview.sourceMaterialRequest.deadlineLine}
          </p>
          <p>
            <span className="font-bold">Chữ ký:</span>{" "}
            {preview.signature.positionTitle} / {preview.signature.signerName}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
