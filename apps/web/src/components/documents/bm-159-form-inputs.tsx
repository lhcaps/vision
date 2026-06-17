"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

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

type SubordinateProcuracyTrialAssignmentForm = {
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

type RecipientsForm = {
  assignedProcuracyLine: string;
  courtLine: string;
  archiveLine: string;
};

type SignatureForm = {
  signMode: string;
  positionTitle: string;
  signerName: string;
};

type Bm159Form = {
  agency: AgencyForm;
  document: DocumentForm;
  official: OfficialForm;
  legalBasis: LegalBasisForm;
  subordinateProcuracyTrialAssignment: SubordinateProcuracyTrialAssignmentForm;
  recipients: RecipientsForm;
  signature: SignatureForm;
  updatedByName: string;
  renderedByName: string;
  convertedByName: string;
};

type Bm159FormInputsPanelProps = {
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

function todayDateLine(): string {
  const now = new Date();

  return `ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
}

function todayIssuePlaceAndDateLine(issuePlace = "TP. Hồ Chí Minh"): string {
  const now = new Date();

  return `${cleanText(issuePlace)}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
}

const EMPTY_FORM: Bm159Form = {
  agency: {
    parentName: "",
    name: "",
    bodyName: "",
    shortName: "VKSKV7",
  },
  document: {
    documentCode: "159/QĐ-VKSKV7",
    issuePlace: "TP. Hồ Chí Minh",
    issueDateText: todayDisplayDateText(),
    issuePlaceAndDateLine: todayIssuePlaceAndDateLine("TP. Hồ Chí Minh"),
  },
  official: {
    issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ Điều 41 và Điều 239 của Bộ luật Tố tụng hình sự;",
  },
  subordinateProcuracyTrialAssignment: {
    assignedProcuracy: "Viện kiểm sát nhân dân khu vực 3",
    issuingProcuracy: "Viện kiểm sát nhân dân khu vực 7",
    caseName: "vụ án  cùng đồng phạm",
    offenseName: "",
    offenseLegalLine: "quy định tại khoản 1 Điều 321 của Bộ luật Hình sự",
    indictmentCode: "159/CT-VKSKV7",
    indictmentDateLine: todayDateLine(),
    indictmentLine:
      "Căn cứ Cáo trạng số 159/CT-VKSKV7 " +
      todayDateLine() +
      " của Viện kiểm sát nhân dân khu vực 7,",
    article1Line:
      "Phân công Viện kiểm sát nhân dân khu vực 3 thực hành quyền công tố, kiểm sát xét xử sơ thẩm vụ án  cùng đồng phạm về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự.",
    article2Line:
      "Viện kiểm sát nhân dân khu vực 3 thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.",
  },
  recipients: {
    assignedProcuracyLine: "Viện kiểm sát nhân dân khu vực 3",
    courtLine: "Tòa án có thẩm quyền xét xử",
    archiveLine: "Lưu: HSVA, HSKS, VP",
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

function buildGeneratedLines(
  form: Bm159Form,
): Partial<SubordinateProcuracyTrialAssignmentForm> {
  const assignment = form.subordinateProcuracyTrialAssignment;

  const assignedProcuracy =
    cleanText(assignment.assignedProcuracy) ||
    EMPTY_FORM.subordinateProcuracyTrialAssignment.assignedProcuracy;

  const issuingProcuracy =
    cleanText(assignment.issuingProcuracy) ||
    EMPTY_FORM.subordinateProcuracyTrialAssignment.issuingProcuracy;

  const caseName =
    cleanText(assignment.caseName) ||
    EMPTY_FORM.subordinateProcuracyTrialAssignment.caseName;

  const offenseName =
    cleanText(assignment.offenseName) ||
    EMPTY_FORM.subordinateProcuracyTrialAssignment.offenseName;

  const offenseLegalLine =
    cleanText(assignment.offenseLegalLine) ||
    EMPTY_FORM.subordinateProcuracyTrialAssignment.offenseLegalLine;

  const indictmentCode =
    cleanText(assignment.indictmentCode) ||
    EMPTY_FORM.subordinateProcuracyTrialAssignment.indictmentCode;

  const indictmentDateLine =
    cleanText(assignment.indictmentDateLine) ||
    EMPTY_FORM.subordinateProcuracyTrialAssignment.indictmentDateLine;

  return {
    indictmentLine:
      `Căn cứ Cáo trạng số ${indictmentCode} ${indictmentDateLine} của ${issuingProcuracy},`,
    article1Line:
      `Phân công ${assignedProcuracy} thực hành quyền công tố, kiểm sát xét xử sơ thẩm ${caseName} về tội ${offenseName} ${offenseLegalLine}.`,
    article2Line:
      `${assignedProcuracy} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.`,
  };
}

function normalizeFormInputs(form: Bm159Form): Bm159Form & {
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
    },
    subordinateProcuracyTrialAssignment: {
      assignedProcuracy: cleanText(
        form.subordinateProcuracyTrialAssignment.assignedProcuracy,
      ),
      issuingProcuracy: cleanText(
        form.subordinateProcuracyTrialAssignment.issuingProcuracy,
      ),
      caseName: cleanText(form.subordinateProcuracyTrialAssignment.caseName),
      offenseName: cleanText(
        form.subordinateProcuracyTrialAssignment.offenseName,
      ),
      offenseLegalLine: cleanText(
        form.subordinateProcuracyTrialAssignment.offenseLegalLine,
      ),
      indictmentCode: cleanText(
        form.subordinateProcuracyTrialAssignment.indictmentCode,
      ),
      indictmentDateLine: cleanText(
        form.subordinateProcuracyTrialAssignment.indictmentDateLine,
      ),
      indictmentLine: cleanText(
        form.subordinateProcuracyTrialAssignment.indictmentLine,
      ),
      article1Line: cleanText(
        form.subordinateProcuracyTrialAssignment.article1Line,
      ),
      article2Line: cleanText(
        form.subordinateProcuracyTrialAssignment.article2Line,
      ),
    },
    recipients: {
      assignedProcuracyLine: stripRecipientLine(
        form.recipients.assignedProcuracyLine,
      ),
      courtLine: stripRecipientLine(form.recipients.courtLine),
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

function buildFormFromPayload(payload: unknown): Bm159Form {
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
      procedureArticlesLine: pickString(
        formInputs,
        payload,
        "legalBasis.procedureArticlesLine",
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
    },
    subordinateProcuracyTrialAssignment: {
      assignedProcuracy: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.assignedProcuracy",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.assignedProcuracy,
      ),
      issuingProcuracy: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.issuingProcuracy",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.issuingProcuracy,
      ),
      caseName: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.caseName",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.caseName,
      ),
      offenseName: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.offenseName",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.offenseName,
      ),
      offenseLegalLine: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.offenseLegalLine",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.offenseLegalLine,
      ),
      indictmentCode: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.indictmentCode",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.indictmentCode,
      ),
      indictmentDateLine: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.indictmentDateLine",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.indictmentDateLine,
      ),
      indictmentLine: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.indictmentLine",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.indictmentLine,
      ),
      article1Line: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.article1Line",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.article1Line,
      ),
      article2Line: pickString(
        formInputs,
        payload,
        "subordinateProcuracyTrialAssignment.article2Line",
        EMPTY_FORM.subordinateProcuracyTrialAssignment.article2Line,
      ),
    },
    recipients: {
      assignedProcuracyLine: pickString(
        formInputs,
        payload,
        "recipients.assignedProcuracyLine",
        EMPTY_FORM.recipients.assignedProcuracyLine,
      ),
      courtLine: pickString(
        formInputs,
        payload,
        "recipients.courtLine",
        EMPTY_FORM.recipients.courtLine,
      ),
      archiveLine: pickString(
        formInputs,
        payload,
        "recipients.archiveLine",
        EMPTY_FORM.recipients.archiveLine,
      ),
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

export function Bm159FormInputsPanel({
  documentId,
  onSaved,
}: Bm159FormInputsPanelProps) {
  const [form, setForm] = useState<Bm159Form>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPayload() {
      setStatus("loading");
      setMessage("Đang tải dữ liệu BM-159 từ backend...");

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
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-159.");
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

  function updateAssignment<K extends keyof SubordinateProcuracyTrialAssignmentForm>(
    key: K,
    value: SubordinateProcuracyTrialAssignmentForm[K],
    regenerateLines = false,
  ) {
    setForm((current) => {
      const nextForm = {
        ...current,
        subordinateProcuracyTrialAssignment: {
          ...current.subordinateProcuracyTrialAssignment,
          [key]: value,
        },
      };

      if (!regenerateLines) return nextForm;

      return {
        ...nextForm,
        subordinateProcuracyTrialAssignment: {
          ...nextForm.subordinateProcuracyTrialAssignment,
          ...buildGeneratedLines(nextForm),
        },
      };
    });
  }

  function updateRecipients<K extends keyof RecipientsForm>(
    key: K,
    value: RecipientsForm[K],
  ) {
    setForm((current) => ({
      ...current,
      recipients: { ...current.recipients, [key]: value },
    }));
  }

  function updateSignature<K extends keyof SignatureForm>(
    key: K,
    value: SignatureForm[K],
  ) {
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
      subordinateProcuracyTrialAssignment: {
        ...current.subordinateProcuracyTrialAssignment,
        ...buildGeneratedLines(current),
      },
      recipients: {
        ...current.recipients,
        assignedProcuracyLine:
          current.subordinateProcuracyTrialAssignment.assignedProcuracy,
      },
    }));
  }

  function fillCustomerSample() {
    setForm(normalizeFormInputs(EMPTY_FORM));
    setStatus("success");
    setMessage("Đã điền dữ liệu mẫu BM-159.");
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
    setMessage("Đang lưu formInputs BM-159...");

    try {
      const ready = normalizeFormInputs(form);

      const body = {
        ...ready,
        templateCode: "BM-159",
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
          result.text || `Không lưu được BM-159. HTTP ${result.status}`,
        );
      }

      setForm(ready);
      setStatus("success");
      setMessage("Đã lưu BM-159. Dữ liệu khách nhập sẽ được dùng khi render DOCX/PDF.");

      await onSaved?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lưu BM-159 thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Dữ liệu biểu mẫu BM-159
        </p>
        <h2 className="mt-2 text-xl font-bold text-blue-950">
          Quyết định phân công VKS cấp dưới THQCT, kiểm sát xét xử sơ thẩm
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
          Form này chỉ phục vụ BM-159. Dữ liệu chính nằm trong nhóm{" "}
          <span className="font-semibold">subordinateProcuracyTrialAssignment</span>,
          gồm cáo trạng, Viện kiểm sát được phân công, vụ án, tội danh, Điều 1,
          Điều 2, nơi nhận và chữ ký.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Điền dữ liệu mẫu BM-159
          </button>
          <button
            type="button"
            onClick={regenerateLines}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Tự sinh lại Cáo trạng / Điều 1 / Điều 2
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving" || status === "loading"}
            className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Đang lưu..." : "Lưu dữ liệu BM-159"}
          </button>
        </div>

        <div className="mt-4">
          <StatusMessage status={status} message={message} />
        </div>
      </section>

      <SectionCard
        title="1. Cơ quan / văn bản"
        description="Nếu chưa có dữ liệu đã lưu, ngày ban hành tự lấy ngày hôm nay."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cơ quan cấp trên" value={form.agency.parentName} onChange={(value) => updateAgency("parentName", value)} />
          <Field label="Viện kiểm sát ban hành" value={form.agency.name} onChange={(value) => updateAgency("name", value)} />
          <Field label="Tên cơ quan trong thân văn bản" value={form.agency.bodyName} onChange={(value) => updateAgency("bodyName", value)} />
          <Field label="Tên viết tắt" value={form.agency.shortName} onChange={(value) => updateAgency("shortName", value)} />
          <Field label="Số quyết định" value={form.document.documentCode} onChange={(value) => updateDocument("documentCode", value)} />
          <Field label="Địa danh" value={form.document.issuePlace} onChange={(value) => updateDocument("issuePlace", value)} />
          <Field label="Ngày ban hành DD/MM/YYYY" value={form.document.issueDateText} onChange={(value) => updateDocument("issueDateText", value)} />
          <Field label="Dòng địa danh, ngày tháng" value={form.document.issuePlaceAndDateLine} onChange={(value) => updateDocument("issuePlaceAndDateLine", value)} />
        </div>
      </SectionCard>

      <SectionCard title="2. Chủ thể ban hành / căn cứ">
        <div className="grid gap-4">
          <Field label="Chủ thể ban hành" value={form.official.issuerTitle} onChange={(value) => updateOfficial("issuerTitle", value)} />
          <TextAreaField label="Căn cứ pháp lý" value={form.legalBasis.procedureArticlesLine} onChange={(value) => updateLegalBasis("procedureArticlesLine", value)} rows={2} />
        </div>
      </SectionCard>

      <SectionCard title="3. Cáo trạng / vụ án / tội danh">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Viện kiểm sát được phân công" value={form.subordinateProcuracyTrialAssignment.assignedProcuracy} onChange={(value) => updateAssignment("assignedProcuracy", value, true)} />
          <Field label="Viện kiểm sát ban hành cáo trạng" value={form.subordinateProcuracyTrialAssignment.issuingProcuracy} onChange={(value) => updateAssignment("issuingProcuracy", value, true)} />
          <Field label="Số cáo trạng" value={form.subordinateProcuracyTrialAssignment.indictmentCode} onChange={(value) => updateAssignment("indictmentCode", value, true)} />
          <Field label="Ngày cáo trạng" value={form.subordinateProcuracyTrialAssignment.indictmentDateLine} onChange={(value) => updateAssignment("indictmentDateLine", value, true)} />
          <Field label="Tên vụ án" value={form.subordinateProcuracyTrialAssignment.caseName} onChange={(value) => updateAssignment("caseName", value, true)} />
          <Field label="Tội danh" value={form.subordinateProcuracyTrialAssignment.offenseName} onChange={(value) => updateAssignment("offenseName", value, true)} />
          <Field label="Điều luật tội danh" value={form.subordinateProcuracyTrialAssignment.offenseLegalLine} onChange={(value) => updateAssignment("offenseLegalLine", value, true)} />
        </div>
      </SectionCard>

      <SectionCard title="4. Nội dung quyết định">
        <div className="grid gap-4">
          <TextAreaField label="Dòng căn cứ Cáo trạng" value={form.subordinateProcuracyTrialAssignment.indictmentLine} onChange={(value) => updateAssignment("indictmentLine", value)} rows={3} />
          <TextAreaField label="Điều 1" value={form.subordinateProcuracyTrialAssignment.article1Line} onChange={(value) => updateAssignment("article1Line", value)} rows={4} />
          <TextAreaField label="Điều 2" value={form.subordinateProcuracyTrialAssignment.article2Line} onChange={(value) => updateAssignment("article2Line", value)} rows={3} />
        </div>
      </SectionCard>

      <SectionCard title="5. Nơi nhận / chữ ký">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="VKS được phân công" value={form.recipients.assignedProcuracyLine} onChange={(value) => updateRecipients("assignedProcuracyLine", value)} />
          <Field label="Tòa án" value={form.recipients.courtLine} onChange={(value) => updateRecipients("courtLine", value)} />
          <Field label="Lưu hồ sơ" value={form.recipients.archiveLine} onChange={(value) => updateRecipients("archiveLine", value)} />
          <Field label="Chế độ ký" value={form.signature.signMode} onChange={(value) => updateSignature("signMode", value)} />
          <Field label="Chức vụ người ký" value={form.signature.positionTitle} onChange={(value) => updateSignature("positionTitle", value)} />
          <Field label="Người ký" value={form.signature.signerName} onChange={(value) => updateSignature("signerName", value)} />
        </div>
      </SectionCard>

      <SectionCard title="Preview dữ liệu sẽ lưu">
        <div className="space-y-3 rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          <p><span className="font-bold">Số:</span> {preview.document.documentCode}</p>
          <p><span className="font-bold">Ngày:</span> {preview.document.issuePlaceAndDateLine}</p>
          <p><span className="font-bold">Cáo trạng:</span> {preview.subordinateProcuracyTrialAssignment.indictmentLine}</p>
          <p><span className="font-bold">VKS được phân công:</span> {preview.subordinateProcuracyTrialAssignment.assignedProcuracy}</p>
          <p><span className="font-bold">Vụ án:</span> {preview.subordinateProcuracyTrialAssignment.caseName}</p>
          <p><span className="font-bold">Điều 1:</span> {preview.subordinateProcuracyTrialAssignment.article1Line}</p>
          <p><span className="font-bold">Chữ ký:</span> {preview.signature.signMode} / {preview.signature.positionTitle} / {preview.signature.signerName}</p>
        </div>
      </SectionCard>
    </div>
  );
}
