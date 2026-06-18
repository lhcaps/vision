"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

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
  jurisdictionCircularLine: string;
};

type ProsecutionJurisdictionTransferForm = {
  caseName: string;
  matterName: string;
  sourceProcuracy: string;
  targetProcuracy: string;
  investigationAuthority: string;
  detentionFacility: string;
  considerationLine: string;
  article1Line: string;
  article2Line: string;
};

type RecipientsForm = {
  sourceProcuracyLine: string;
  targetProcuracyLine: string;
  investigationAuthorityLine: string;
  detentionFacilityLine: string;
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm086Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  prosecutionJurisdictionTransfer: ProsecutionJurisdictionTransferForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm086FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void | Promise<void>;
};

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const textareaClass =
  "min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const labelClass = "text-xs font-semibold text-slate-600";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function todayDisplayDateText(): string {
  const now = new Date();

  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function todayIssuePlaceAndDateLine(issuePlace = "TP. Hồ Chí Minh"): string {
  const now = new Date();

  return `${cleanText(issuePlace)}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
}

const EMPTY_FORM: Bm086Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "86/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine: "Căn cứ Điều 41 của Bộ luật Tố tụng hình sự;",
    jurisdictionCircularLine:
      "Căn cứ khoản 2 Điều 10 của Thông tư số 02/2025/TT-VKSTC ngày 30/6/2025 của Viện trưởng Viện kiểm sát nhân dân tối cao quy định thẩm quyền của Viện kiểm sát nhân dân các cấp trong thực hành quyền công tố và kiểm sát việc tuân theo pháp luật trong giải quyết vụ việc, vụ án hình sự;",
  },
  prosecutionJurisdictionTransfer: {
    caseName: "vụ án  cùng đồng phạm về tội Đánh bạc",
    matterName: "vụ án  cùng đồng phạm về tội Đánh bạc",
    sourceProcuracy: "Viện kiểm sát nhân dân khu vực 7",
    targetProcuracy: "Viện kiểm sát nhân dân khu vực 3",
    investigationAuthority:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    detentionFacility: "Cơ sở giam giữ, nếu có",
    considerationLine:
      "Xét thấy vụ án  cùng đồng phạm về tội Đánh bạc không thuộc thẩm quyền thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự của Viện kiểm sát nhân dân khu vực 7 mà thuộc thẩm quyền thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự của Viện kiểm sát nhân dân khu vực 3,",
    article1Line:
      "Chuyển việc thực hiện thẩm quyền thực hành quyền công tố, kiểm sát việc giải quyết vụ án  cùng đồng phạm về tội Đánh bạc đến Viện kiểm sát nhân dân khu vực 3 để tiếp tục thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự theo thẩm quyền.",
    article2Line:
      "Chuyển kèm theo là hồ sơ, tài liệu, kết quả thực hành quyền công tố, kiểm sát việc giải quyết vụ án  cùng đồng phạm về tội Đánh bạc của Viện kiểm sát nhân dân khu vực 7 đến Viện kiểm sát nhân dân khu vực 3./.",
  },
  recipients: {
    sourceProcuracyLine: "Viện kiểm sát nhân dân khu vực 7",
    targetProcuracyLine: "Viện kiểm sát nhân dân khu vực 3",
    investigationAuthorityLine:
      "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    detentionFacilityLine: "Cơ sở giam giữ, nếu có",
    archiveLine: "Lưu: HSVV/HSVA, HSKS, VP",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
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

  return `${cleanText(issuePlace)}, ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
}

function stripRecipientLine(value: string): string {
  return cleanText(value)
    .replace(/^-\s*/u, "")
    .replace(/[;.]\s*$/u, "")
    .trim();
}

function buildGeneratedLines(form: Bm086Form): Partial<ProsecutionJurisdictionTransferForm> {
  const transfer = form.prosecutionJurisdictionTransfer;

  const caseName =
    cleanText(transfer.caseName) ||
    cleanText(transfer.matterName) ||
    EMPTY_FORM.prosecutionJurisdictionTransfer.caseName;

  const sourceProcuracy =
    cleanText(transfer.sourceProcuracy) ||
    EMPTY_FORM.prosecutionJurisdictionTransfer.sourceProcuracy;

  const targetProcuracy =
    cleanText(transfer.targetProcuracy) ||
    EMPTY_FORM.prosecutionJurisdictionTransfer.targetProcuracy;

  return {
    matterName: caseName,
    considerationLine:
      `Xét thấy ${caseName} không thuộc thẩm quyền thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự của ${sourceProcuracy} mà thuộc thẩm quyền thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự của ${targetProcuracy},`,
    article1Line:
      `Chuyển việc thực hiện thẩm quyền thực hành quyền công tố, kiểm sát việc giải quyết ${caseName} đến ${targetProcuracy} để tiếp tục thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự theo thẩm quyền.`,
    article2Line:
      `Chuyển kèm theo là hồ sơ, tài liệu, kết quả thực hành quyền công tố, kiểm sát việc giải quyết ${caseName} của ${sourceProcuracy} đến ${targetProcuracy}./.`,
  };
}

function normalizeFormInputs(form: Bm086Form): Bm086Form & {
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
      issuerTitle:
        cleanText(form.official.issuerTitle) ||
        EMPTY_FORM.official.issuerTitle,
    },
    legalBasis: {
      procedureArticlesLine:
        cleanText(form.legalBasis.procedureArticlesLine) ||
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      jurisdictionCircularLine:
        cleanText(form.legalBasis.jurisdictionCircularLine) ||
        EMPTY_FORM.legalBasis.jurisdictionCircularLine,
    },
    prosecutionJurisdictionTransfer: {
      caseName: cleanText(form.prosecutionJurisdictionTransfer.caseName),
      matterName:
        cleanText(form.prosecutionJurisdictionTransfer.matterName) ||
        cleanText(form.prosecutionJurisdictionTransfer.caseName),
      sourceProcuracy: cleanText(
        form.prosecutionJurisdictionTransfer.sourceProcuracy,
      ),
      targetProcuracy: cleanText(
        form.prosecutionJurisdictionTransfer.targetProcuracy,
      ),
      investigationAuthority: cleanText(
        form.prosecutionJurisdictionTransfer.investigationAuthority,
      ),
      detentionFacility: cleanText(
        form.prosecutionJurisdictionTransfer.detentionFacility,
      ),
      considerationLine: cleanText(
        form.prosecutionJurisdictionTransfer.considerationLine,
      ),
      article1Line: cleanText(form.prosecutionJurisdictionTransfer.article1Line),
      article2Line: cleanText(form.prosecutionJurisdictionTransfer.article2Line),
    },
    recipients: {
      sourceProcuracyLine: stripRecipientLine(form.recipients.sourceProcuracyLine),
      targetProcuracyLine: stripRecipientLine(form.recipients.targetProcuracyLine),
      investigationAuthorityLine: stripRecipientLine(
        form.recipients.investigationAuthorityLine,
      ),
      detentionFacilityLine: stripRecipientLine(form.recipients.detentionFacilityLine),
      archiveLine: stripRecipientLine(form.recipients.archiveLine),
    },
    signature: {
      signMode: cleanText(form.signature.signMode),
      positionTitle: cleanText(form.signature.positionTitle),
      signerName: cleanText(form.signature.signerName),
    },
    updatedByName: cleanText(form.updatedByName) || DEFAULT_SIGNER_NAME,
    renderedByName: cleanText(form.renderedByName) || DEFAULT_SIGNER_NAME,
    convertedByName: cleanText(form.convertedByName) || DEFAULT_SIGNER_NAME,
  };
}

function buildFormFromPayload(payload: unknown): Bm086Form {
  const formInputs = firstExistingRecord(payload, [
    "formInputs",
    "renderPayloadSnapshot.formInputs",
    "metadata.formInputs",
  ]);

  const hasSavedFormInputs = Object.keys(formInputs).length > 0;

  const issuePlace = pickString(
    formInputs,
    payload,
    "document.issuePlace",
    pickString(formInputs, payload, "agency.issuePlace", EMPTY_FORM.document.issuePlace),
  );

  const issueDateText = hasSavedFormInputs
    ? normalizeDisplayDate(
        pickString(
          formInputs,
          payload,
          "document.issueDateText",
          pickString(formInputs, payload, "document.issueDate", todayDisplayDateText()),
        ),
      )
    : todayDisplayDateText();

  const issueLine = hasSavedFormInputs
    ? pickString(
        formInputs,
        payload,
        "document.issuePlaceAndDateLine",
        issuePlaceAndDateLine(issuePlace, issueDateText),
      )
    : issuePlaceAndDateLine(issuePlace, issueDateText);

  return normalizeFormInputs({
    agency: {
      parentName: pickString(formInputs, payload, "agency.parentName", EMPTY_FORM.agency.parentName),
      name: pickString(formInputs, payload, "agency.name", EMPTY_FORM.agency.name),
      bodyName: pickString(formInputs, payload, "agency.bodyName", EMPTY_FORM.agency.bodyName),
      shortName: pickString(formInputs, payload, "agency.shortName", EMPTY_FORM.agency.shortName),
    },
    document: {
      documentCode: pickString(formInputs, payload, "document.documentCode", EMPTY_FORM.document.documentCode),
      issuePlace,
      issueDateText,
      issuePlaceAndDateLine: issueLine,
    },
    official: {
      issuerTitle: pickString(formInputs, payload, "official.issuerTitle", EMPTY_FORM.official.issuerTitle),
    },
    legalBasis: {
      procedureArticlesLine: pickString(formInputs, payload, "legalBasis.procedureArticlesLine", EMPTY_FORM.legalBasis.procedureArticlesLine),
      jurisdictionCircularLine: pickString(formInputs, payload, "legalBasis.jurisdictionCircularLine", EMPTY_FORM.legalBasis.jurisdictionCircularLine),
    },
    prosecutionJurisdictionTransfer: {
      caseName: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.caseName", EMPTY_FORM.prosecutionJurisdictionTransfer.caseName),
      matterName: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.matterName", EMPTY_FORM.prosecutionJurisdictionTransfer.matterName),
      sourceProcuracy: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.sourceProcuracy", EMPTY_FORM.prosecutionJurisdictionTransfer.sourceProcuracy),
      targetProcuracy: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.targetProcuracy", EMPTY_FORM.prosecutionJurisdictionTransfer.targetProcuracy),
      investigationAuthority: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.investigationAuthority", EMPTY_FORM.prosecutionJurisdictionTransfer.investigationAuthority),
      detentionFacility: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.detentionFacility", EMPTY_FORM.prosecutionJurisdictionTransfer.detentionFacility),
      considerationLine: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.considerationLine", EMPTY_FORM.prosecutionJurisdictionTransfer.considerationLine),
      article1Line: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.article1Line", EMPTY_FORM.prosecutionJurisdictionTransfer.article1Line),
      article2Line: pickString(formInputs, payload, "prosecutionJurisdictionTransfer.article2Line", EMPTY_FORM.prosecutionJurisdictionTransfer.article2Line),
    },
    recipients: {
      sourceProcuracyLine: pickString(formInputs, payload, "recipients.sourceProcuracyLine", EMPTY_FORM.recipients.sourceProcuracyLine),
      targetProcuracyLine: pickString(formInputs, payload, "recipients.targetProcuracyLine", EMPTY_FORM.recipients.targetProcuracyLine),
      investigationAuthorityLine: pickString(formInputs, payload, "recipients.investigationAuthorityLine", EMPTY_FORM.recipients.investigationAuthorityLine),
      detentionFacilityLine: pickString(formInputs, payload, "recipients.detentionFacilityLine", EMPTY_FORM.recipients.detentionFacilityLine),
      archiveLine: pickString(formInputs, payload, "recipients.archiveLine", EMPTY_FORM.recipients.archiveLine),
    },
    signature: {
      signMode: pickString(formInputs, payload, "signature.signMode", EMPTY_FORM.signature.signMode),
      positionTitle: pickString(formInputs, payload, "signature.positionTitle", EMPTY_FORM.signature.positionTitle),
      signerName: pickString(formInputs, payload, "signature.signerName", EMPTY_FORM.signature.signerName),
    },
    updatedByName: pickString(formInputs, payload, "updatedByName", DEFAULT_SIGNER_NAME),
    renderedByName: pickString(formInputs, payload, "renderedByName", DEFAULT_SIGNER_NAME),
    convertedByName: pickString(formInputs, payload, "convertedByName", DEFAULT_SIGNER_NAME),
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        value={value}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className={labelClass}>{label}</span>
      <textarea
        className={textareaClass}
        rows={rows}
        value={value}
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

export function Bm086FormInputsPanel({
  documentId,
  onSaved,
}: Bm086FormInputsPanelProps) {
  const [form, setForm] = useState<Bm086Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-086 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-086.");
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

  function updateTransfer<K extends keyof ProsecutionJurisdictionTransferForm>(
    key: K,
    value: ProsecutionJurisdictionTransferForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        prosecutionJurisdictionTransfer: {
          ...current.prosecutionJurisdictionTransfer,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        prosecutionJurisdictionTransfer: {
          ...nextForm.prosecutionJurisdictionTransfer,
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
      prosecutionJurisdictionTransfer: {
        ...current.prosecutionJurisdictionTransfer,
        ...buildGeneratedLines(current),
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-086.");
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
    setMessage("Đang lưu formInputs BM-086...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-086",
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
          result.text || `Không lưu được BM-086. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-086. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-086 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-086
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Quyết định chuyển việc thực hiện thẩm quyền thực hành quyền công tố, kiểm sát
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-086. Dữ liệu chính nằm trong nhóm{" "}
          <span className="font-semibold">prosecutionJurisdictionTransfer</span>,
          gồm vụ việc/vụ án, Viện kiểm sát chuyển đi, Viện kiểm sát nhận,
          căn cứ thẩm quyền, Điều 1, Điều 2, nơi nhận và chữ ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-086
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại Điều 1/Điều 2
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-086"}
          </button>
        </div>

        <div className="mt-4">
          <StatusMessage status={status} message={message} />
        </div>
      </section>

      <SectionCard title="1. Cơ quan / văn bản" description="Nếu chưa có dữ liệu đã lưu, ngày ban hành tự lấy ngày hôm nay.">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateAgency("parentName", value)} fullWidth />
          <BmFieldText label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateAgency("name", value)} fullWidth />
          <BmFieldText label="Tên cơ quan trong thân văn bản" value={form.agency.bodyName} onChange={(value) => updateAgency("bodyName", value)} fullWidth />
          <BmFieldText label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateAgency("shortName", value)} fullWidth />
          <BmFieldText label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} fullWidth />
          <BmFieldText label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} fullWidth />
          <BmFieldText label="Ngày ban hành DD/MM/YYYY" value={form.document.issueDateText} onChange={(value) => updateDocument("issueDateText", value)} fullWidth />
          <BmFieldText label="Dòng địa danh, ngày tháng" value={form.document.issuePlaceAndDateLine} onChange={(value) => updateDocument("issuePlaceAndDateLine", value)} fullWidth />
        </div>
      </SectionCard>

      <SectionCard title="2. Chủ thể ban hành / căn cứ">
        <div className="grid gap-4">
          <BmFieldText label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={(value) => updateOfficial("issuerTitle", value)} fullWidth />
          <TextAreaField label="Căn cứ Điều 41" value={form.legalBasis.procedureArticlesLine} onChange={(value) => updateLegalBasis("procedureArticlesLine", value)} rows={2} />
          <TextAreaField label="Căn cứ Thông tư thẩm quyền" value={form.legalBasis.jurisdictionCircularLine} onChange={(value) => updateLegalBasis("jurisdictionCircularLine", value)} rows={4} />
        </div>
      </SectionCard>

      <SectionCard title="3. Thông tin chuyển thẩm quyền">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="Tên vụ việc/vụ án" value={form.prosecutionJurisdictionTransfer.caseName} onChange={(value) => updateTransfer("caseName", value, true)} fullWidth />
          <BmFieldText label="Vụ việc/vụ án dùng trong mẫu" value={form.prosecutionJurisdictionTransfer.matterName} onChange={(value) => updateTransfer("matterName", value)} fullWidth />
          <BmFieldText label="Viện kiểm sát đang thụ lý/chuyển đi" value={form.prosecutionJurisdictionTransfer.sourceProcuracy} onChange={(value) => updateTransfer("sourceProcuracy", value, true)} fullWidth />
          <BmFieldText label="Viện kiểm sát nhận thẩm quyền" value={form.prosecutionJurisdictionTransfer.targetProcuracy} onChange={(value) => updateTransfer("targetProcuracy", value, true)} fullWidth />
          <BmFieldText label="Cơ quan điều tra đang giải quyết" value={form.prosecutionJurisdictionTransfer.investigationAuthority} onChange={(value) => updateTransfer("investigationAuthority", value)} fullWidth />
          <BmFieldText label="Cơ sở giam giữ" value={form.prosecutionJurisdictionTransfer.detentionFacility} onChange={(value) => updateTransfer("detentionFacility", value)} fullWidth />
        </div>
      </SectionCard>

      <SectionCard title="4. Nội dung quyết định">
        <div className="grid gap-4">
          <TextAreaField label="Dòng xét thấy" value={form.prosecutionJurisdictionTransfer.considerationLine} onChange={(value) => updateTransfer("considerationLine", value)} rows={4} />
          <TextAreaField label="Điều 1" value={form.prosecutionJurisdictionTransfer.article1Line} onChange={(value) => updateTransfer("article1Line", value)} rows={4} />
          <TextAreaField label="Điều 2" value={form.prosecutionJurisdictionTransfer.article2Line} onChange={(value) => updateTransfer("article2Line", value)} rows={4} />
        </div>
      </SectionCard>

      <SectionCard title="5. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <BmFieldText label="VKS chuyển đi" value={form.recipients.sourceProcuracyLine} onChange={(value) => updateRecipients("sourceProcuracyLine", value)} fullWidth />
          <BmFieldText label="VKS nhận" value={form.recipients.targetProcuracyLine} onChange={(value) => updateRecipients("targetProcuracyLine", value)} fullWidth />
          <BmFieldText label="Cơ quan điều tra" value={form.recipients.investigationAuthorityLine} onChange={(value) => updateRecipients("investigationAuthorityLine", value)} fullWidth />
          <BmFieldText label="Cơ sở giam giữ" value={form.recipients.detentionFacilityLine} onChange={(value) => updateRecipients("detentionFacilityLine", value)} fullWidth />
          <BmFieldText label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateRecipients("archiveLine", value)} fullWidth />
          <BmFieldText label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateSignature("signMode", value)} fullWidth />
          <BmFieldText label="Chức vụ người ký" value={form.signature.positionTitle} onChange={(value) => updateSignature("positionTitle", value)} fullWidth />
          <BmFieldText label="Người ký" value={form.signature.signerName} onChange={(value) => updateSignature("signerName", value)} fullWidth />
        </div>
      </SectionCard>

      <SectionCard title="Preview dữ liệu sẽ lưu">
        <div className="space-y-3 rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          <p><span className="font-bold">Số:</span> {preview.document.documentCode}</p>
          <p><span className="font-bold">Ngày:</span> {preview.document.issuePlaceAndDateLine}</p>
          <p><span className="font-bold">Vụ án:</span> {preview.prosecutionJurisdictionTransfer.caseName}</p>
          <p><span className="font-bold">Chuyển từ:</span> {preview.prosecutionJurisdictionTransfer.sourceProcuracy}</p>
          <p><span className="font-bold">Chuyển đến:</span> {preview.prosecutionJurisdictionTransfer.targetProcuracy}</p>
          <p><span className="font-bold">Điều 1:</span> {preview.prosecutionJurisdictionTransfer.article1Line}</p>
          <p><span className="font-bold">Chữ ký:</span> {preview.signature.signMode} / {preview.signature.positionTitle} / {preview.signature.signerName}</p>
        </div>
      </SectionCard>
    </div>
  );
}
