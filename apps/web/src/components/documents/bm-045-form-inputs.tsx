"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type SectionName =
  | "agency"
  | "document"
  | "legalBasis"
  | "bailApproval"
  | "recipients"
  | "signature";

type Bm045FormInputs = {
  agency: {
    parentNameUpper: string;
    nameUpper: string;
    issuePlace: string;
  };
  document: {
    documentCode: string;
    issueDate: string;
    issuePlaceAndDateLine: string;
  };
  legalBasis: {
    procedureArticlesLine: string;
    juvenileJusticeLine: string;
  };
  bailApproval: {
    includeJuvenileJusticeLine: boolean;

    accusedName: string;
    offenseName: string;
    legalArticle: string;
    investigationAgency: string;

    caseDecisionCode: string;
    caseDecisionIssueDateText: string;
    accusedDecisionCode: string;
    accusedDecisionIssueDateText: string;

    bailDecisionCode: string;
    bailDecisionIssueDateText: string;
    bailDecisionAgencyName: string;
    bailReceiverLine: string;

    caseDecisionLegalBasisLine: string;
    accusedDecisionLegalBasisLine: string;
    proposalLine: string;
    reasonLine: string;
    article1Line: string;
    article2Line: string;
  };
  recipients: {
    executionAgencyLine: string;
    personRepresentativeLine: string;
    bailReceiverLine: string;
    archiveLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
};

type Bm045FormInputsPanelProps = {
  documentId: string | number;
  onSaved?: () => void;
};

type RequiredField = {
  section: SectionName;
  field: string;
  label: string;
};

const DEFAULT_PERSON_NAME = '';
const DEFAULT_OFFENSE_NAME = '';
const DEFAULT_LEGAL_ARTICLE = "khoản 1 Điều 321 Bộ luật Hình sự";
const DEFAULT_INVESTIGATION_AGENCY =
  "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";
const DEFAULT_SIGNER_NAME = '';

const EMPTY_FORM: Bm045FormInputs = {
  agency: {
    parentNameUpper: "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    nameUpper: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    issuePlace: "TP. Hồ Chí Minh",
  },
  document: {
    documentCode: "45/QĐ-VKSKV7",
    issueDate: "26/05/2026",
    issuePlaceAndDateLine: "TP. Hồ Chí Minh, ngày 26 tháng 5 năm 2026",
  },
  legalBasis: {
    procedureArticlesLine:
      "Căn cứ các điều 41, 121 và 165 của Bộ luật Tố tụng hình sự;",
    juvenileJusticeLine:
      "Căn cứ Điều 135 của Luật Tư pháp người chưa thành niên;",
  },
  bailApproval: {
    includeJuvenileJusticeLine: true,

    accusedName: DEFAULT_PERSON_NAME,
    offenseName: DEFAULT_OFFENSE_NAME,
    legalArticle: DEFAULT_LEGAL_ARTICLE,
    investigationAgency: DEFAULT_INVESTIGATION_AGENCY,

    caseDecisionCode: "",
    caseDecisionIssueDateText: "ngày 6 tháng 5 năm 2026",
    accusedDecisionCode: "",
    accusedDecisionIssueDateText: "ngày 6 tháng 5 năm 2026",

    bailDecisionCode: "18/QĐ-CSĐT",
    bailDecisionIssueDateText: "ngày 26 tháng 5 năm 2026",
    bailDecisionAgencyName: DEFAULT_INVESTIGATION_AGENCY,
    bailReceiverLine: "- Cơ quan, tổ chức, cá nhân nhận bảo lĩnh cho bị can;",

    caseDecisionLegalBasisLine: "",
    accusedDecisionLegalBasisLine: "",
    proposalLine: "",
    reasonLine: "",
    article1Line: "",
    article2Line: "",
  },
  recipients: {
    executionAgencyLine: "",
    personRepresentativeLine: "",
    bailReceiverLine: "",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: DEFAULT_SIGNER_NAME,
  },
};

const REQUIRED_FIELDS: RequiredField[] = [
  { section: "agency", field: "parentNameUpper", label: "Cơ quan cấp trên" },
  { section: "agency", field: "nameUpper", label: "Viện kiểm sát ban hành" },
  { section: "document", field: "documentCode", label: "Số quyết định" },
  { section: "document", field: "issuePlaceAndDateLine", label: "Địa danh, ngày tháng năm" },
  { section: "legalBasis", field: "procedureArticlesLine", label: "Căn cứ BLTTHS" },
  { section: "bailApproval", field: "accusedName", label: "Tên bị can" },
  { section: "bailApproval", field: "offenseName", label: "Tên tội" },
  { section: "bailApproval", field: "legalArticle", label: "Điều luật" },
  { section: "bailApproval", field: "bailDecisionCode", label: "Số Quyết định bảo lĩnh" },
  { section: "bailApproval", field: "bailDecisionAgencyName", label: "Cơ quan ra quyết định bảo lĩnh" },
  { section: "signature", field: "signerName", label: "Người ký" },
];

function section(payload: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = payload[key];

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function pickText(...values: unknown[]): string {
  for (const value of values) {
    const nextValue = text(value);

    if (
      nextValue.length > 0 &&
      nextValue.toLowerCase() !== "null" &&
      nextValue.toLowerCase() !== "undefined"
    ) {
      return nextValue;
    }
  }

  return "";
}

function parseBool(value: unknown, defaultValue: boolean): boolean {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const raw = String(value).trim().toLowerCase();

  if (["false", "0", "no", "off"].includes(raw)) {
    return false;
  }

  if (["true", "1", "yes", "on"].includes(raw)) {
    return true;
  }

  return defaultValue;
}

function stripListLine(value: unknown): string {
  return text(value)
    .replace(/^-+\s*/u, "")
    .replace(/;$/u, "")
    .trim();
}

function toLegalDateText(value: string): string {
  const raw = value.trim();

  if (!raw) {
    return "";
  }

  if (raw.includes("ngày") && raw.includes("tháng") && raw.includes("năm")) {
    return raw;
  }

  const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);

  if (!match) {
    return raw;
  }

  return `ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
}

function buildIssuePlaceAndDateLine(issuePlace: string, issueDate: string): string {
  const legalDate = toLegalDateText(issueDate);

  if (!legalDate) {
    return text(issuePlace);
  }

  return `${text(issuePlace) || "TP. Hồ Chí Minh"}, ${legalDate}`;
}

function buildOffenseClause(offenseName: string, legalArticle: string): string {
  return `về tội “${pickText(offenseName, DEFAULT_OFFENSE_NAME)}” quy định tại ${pickText(
    legalArticle,
    DEFAULT_LEGAL_ARTICLE,
  )}`;
}

function getValue(
  form: Bm045FormInputs,
  sectionName: SectionName,
  fieldName: string,
): string {
  const group = form[sectionName] as Record<string, string>;
  return group[fieldName] ?? "";
}

function buildSyncedForm(input: Bm045FormInputs): Bm045FormInputs {
  const form: Bm045FormInputs = JSON.parse(JSON.stringify(input)) as Bm045FormInputs;
  const bail = form.bailApproval;

  const accusedName = pickText(bail.accusedName, DEFAULT_PERSON_NAME);
  const offenseName = pickText(bail.offenseName, DEFAULT_OFFENSE_NAME);
  const legalArticle = pickText(bail.legalArticle, DEFAULT_LEGAL_ARTICLE);
  const offenseClause = buildOffenseClause(offenseName, legalArticle);

  const investigationAgency = pickText(
    bail.investigationAgency,
    DEFAULT_INVESTIGATION_AGENCY,
  );

  const bailDecisionCode = pickText(bail.bailDecisionCode, "18/QĐ-CSĐT");
  const bailDecisionIssueDateText = toLegalDateText(
    pickText(bail.bailDecisionIssueDateText, form.document.issueDate),
  );
  const bailDecisionAgencyName = pickText(
    bail.bailDecisionAgencyName,
    investigationAgency,
  );

  const caseDecisionCode = pickText(bail.caseDecisionCode, "");
  const caseDecisionIssueDateText = toLegalDateText(
    pickText(bail.caseDecisionIssueDateText, form.document.issueDate),
  );

  const accusedDecisionCode = pickText(bail.accusedDecisionCode, "");
  const accusedDecisionIssueDateText = toLegalDateText(
    pickText(bail.accusedDecisionIssueDateText, form.document.issueDate),
  );

  const includeJuvenileJusticeLine = bail.includeJuvenileJusticeLine === true;

  form.document.issuePlaceAndDateLine = buildIssuePlaceAndDateLine(
    form.agency.issuePlace,
    form.document.issueDate,
  );

  form.legalBasis.procedureArticlesLine =
    "Căn cứ các điều 41, 121 và 165 của Bộ luật Tố tụng hình sự;";

  form.legalBasis.juvenileJusticeLine = includeJuvenileJusticeLine
    ? "Căn cứ Điều 135 của Luật Tư pháp người chưa thành niên;"
    : "";

  form.bailApproval = {
    ...bail,
    includeJuvenileJusticeLine,
    accusedName,
    offenseName,
    legalArticle,
    investigationAgency,
    caseDecisionCode,
    caseDecisionIssueDateText,
    accusedDecisionCode,
    accusedDecisionIssueDateText,
    bailDecisionCode,
    bailDecisionIssueDateText,
    bailDecisionAgencyName,
    bailReceiverLine: pickText(
      bail.bailReceiverLine,
      "- Cơ quan, tổ chức, cá nhân nhận bảo lĩnh cho bị can;",
    ),

    caseDecisionLegalBasisLine:
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ${caseDecisionIssueDateText} của ${investigationAgency} ${offenseClause};`,

    accusedDecisionLegalBasisLine:
      `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ${accusedDecisionIssueDateText} của ${investigationAgency} đối với ${accusedName} ${offenseClause};`,

    proposalLine:
      `Xét hồ sơ đề nghị phê chuẩn Quyết định về việc bảo lĩnh số ${bailDecisionCode} ${bailDecisionIssueDateText} của ${bailDecisionAgencyName};`,

    reasonLine:
      `Nhận thấy có đủ căn cứ, điều kiện áp dụng biện pháp bảo lĩnh đối với bị can ${accusedName},`,

    article1Line:
      `Phê chuẩn Quyết định về việc bảo lĩnh số ${bailDecisionCode} ${bailDecisionIssueDateText} của ${bailDecisionAgencyName} đối với bị can ${accusedName}.`,

    article2Line:
      `Yêu cầu ${bailDecisionAgencyName} thi hành Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.`,
  };

  form.recipients = {
    executionAgencyLine: `- ${bailDecisionAgencyName};`,
    personRepresentativeLine: `- ${accusedName}, người đại diện của bị can;`,
    bailReceiverLine: form.bailApproval.bailReceiverLine,
    archiveLine: pickText(form.recipients.archiveLine, "- Lưu: HSVA, HSKS, VP."),
  };

  form.signature = {
    signMode: pickText(form.signature.signMode, "KT. VIỆN TRƯỞNG"),
    positionTitle: pickText(form.signature.positionTitle, "PHÓ VIỆN TRƯỞNG"),
    signerName: pickText(form.signature.signerName, DEFAULT_SIGNER_NAME),
  };

  return form;
}

function normalizeFormInputs(payload: Record<string, unknown>): Bm045FormInputs {
  const agency = section(payload, "agency");
  const document = section(payload, "document");
  const legalBasis = section(payload, "legalBasis");
  const bailApproval = section(payload, "bailApproval");
  const person = section(payload, "person");
  const offense = section(payload, "offense");
  const caseDecision = section(payload, "caseDecision");
  const accusedDecision = section(payload, "accusedDecision");
  const recipients = section(payload, "recipients");
  const signature = section(payload, "signature");

  return buildSyncedForm({
    agency: {
      parentNameUpper: pickText(
        agency.parentNameUpper,
        agency.parentName,
        EMPTY_FORM.agency.parentNameUpper,
      ),
      nameUpper: pickText(agency.nameUpper, agency.name, EMPTY_FORM.agency.nameUpper),
      issuePlace: pickText(agency.issuePlace, EMPTY_FORM.agency.issuePlace),
    },
    document: {
      documentCode: pickText(
        document.documentCode,
        document.documentNo,
        EMPTY_FORM.document.documentCode,
      ),
      issueDate: pickText(document.issueDate, EMPTY_FORM.document.issueDate),
      issuePlaceAndDateLine: pickText(
        document.issuePlaceAndDateLine,
        EMPTY_FORM.document.issuePlaceAndDateLine,
      ),
    },
    legalBasis: {
      procedureArticlesLine: pickText(
        legalBasis.procedureArticlesLine,
        EMPTY_FORM.legalBasis.procedureArticlesLine,
      ),
      juvenileJusticeLine: pickText(
        legalBasis.juvenileJusticeLine,
        EMPTY_FORM.legalBasis.juvenileJusticeLine,
      ),
    },
    bailApproval: {
      includeJuvenileJusticeLine: parseBool(
        bailApproval.includeJuvenileJusticeLine,
        pickText(legalBasis.juvenileJusticeLine).trim().length > 0,
      ),

      accusedName: pickText(bailApproval.accusedName, person.fullName, DEFAULT_PERSON_NAME),
      offenseName: pickText(bailApproval.offenseName, offense.offenseName, DEFAULT_OFFENSE_NAME),
      legalArticle: pickText(bailApproval.legalArticle, offense.legalArticle, DEFAULT_LEGAL_ARTICLE),
      investigationAgency: pickText(
        bailApproval.investigationAgency,
        stripListLine(recipients.investigatingAgencyLine),
        DEFAULT_INVESTIGATION_AGENCY,
      ),

      caseDecisionCode: pickText(
        bailApproval.caseDecisionCode,
        caseDecision.decisionNo,
        EMPTY_FORM.bailApproval.caseDecisionCode,
      ),
      caseDecisionIssueDateText: pickText(
        bailApproval.caseDecisionIssueDateText,
        caseDecision.issueDateText,
        caseDecision.issueDate,
        EMPTY_FORM.bailApproval.caseDecisionIssueDateText,
      ),
      accusedDecisionCode: pickText(
        bailApproval.accusedDecisionCode,
        accusedDecision.decisionNo,
        EMPTY_FORM.bailApproval.accusedDecisionCode,
      ),
      accusedDecisionIssueDateText: pickText(
        bailApproval.accusedDecisionIssueDateText,
        accusedDecision.issueDateText,
        accusedDecision.issueDate,
        EMPTY_FORM.bailApproval.accusedDecisionIssueDateText,
      ),

      bailDecisionCode: pickText(
        bailApproval.bailDecisionCode,
        EMPTY_FORM.bailApproval.bailDecisionCode,
      ),
      bailDecisionIssueDateText: pickText(
        bailApproval.bailDecisionIssueDateText,
        EMPTY_FORM.bailApproval.bailDecisionIssueDateText,
      ),
      bailDecisionAgencyName: pickText(
        bailApproval.bailDecisionAgencyName,
        stripListLine(recipients.executionAgencyLine),
        DEFAULT_INVESTIGATION_AGENCY,
      ),
      bailReceiverLine: pickText(
        bailApproval.bailReceiverLine,
        recipients.bailReceiverLine,
        EMPTY_FORM.bailApproval.bailReceiverLine,
      ),

      caseDecisionLegalBasisLine: pickText(bailApproval.caseDecisionLegalBasisLine),
      accusedDecisionLegalBasisLine: pickText(bailApproval.accusedDecisionLegalBasisLine),
      proposalLine: pickText(bailApproval.proposalLine),
      reasonLine: pickText(bailApproval.reasonLine),
      article1Line: pickText(bailApproval.article1Line),
      article2Line: pickText(bailApproval.article2Line),
    },
    recipients: {
      executionAgencyLine: pickText(recipients.executionAgencyLine),
      personRepresentativeLine: pickText(recipients.personRepresentativeLine),
      bailReceiverLine: pickText(recipients.bailReceiverLine),
      archiveLine: pickText(recipients.archiveLine, EMPTY_FORM.recipients.archiveLine),
    },
    signature: {
      signMode: pickText(signature.signMode, EMPTY_FORM.signature.signMode),
      positionTitle: pickText(signature.positionTitle, EMPTY_FORM.signature.positionTitle),
      signerName: pickText(signature.signerName, DEFAULT_SIGNER_NAME),
    },
  });
}

async function getBm045RenderPayload(
  documentId: string | number,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/render-payload`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Không tải được render-payload BM-045. HTTP ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

async function saveBm045FormInputs(
  documentId: string | number,
  form: Bm045FormInputs,
): Promise<void> {
  const syncedPayload = buildSyncedForm(form);
  const includeJuvenileJusticeLine =
    form.bailApproval.includeJuvenileJusticeLine === true;

  const savePayload: Bm045FormInputs = {
    ...syncedPayload,
    legalBasis: {
      ...syncedPayload.legalBasis,
      juvenileJusticeLine: includeJuvenileJusticeLine
        ? syncedPayload.legalBasis.juvenileJusticeLine
        : "",
    },
    bailApproval: {
      ...syncedPayload.bailApproval,
      includeJuvenileJusticeLine,
    },
  };

  const updatedByName = savePayload.signature.signerName.trim() || DEFAULT_SIGNER_NAME;

  const response = await fetch(
    `${API_BASE_URL}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updatedByName,
        formInputs: savePayload,
        person: {
          fullName: savePayload.bailApproval.accusedName,
        },
        offense: {
          offenseName: savePayload.bailApproval.offenseName,
          legalArticle: savePayload.bailApproval.legalArticle,
        },
        ...savePayload,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Không lưu được dữ liệu BM-045. HTTP ${response.status}`);
  }
}

function CheckboxInput({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-6 text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
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
  required = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function PreviewArea({
  label,
  value,
  rows = 3,
}: {
  label: string;
  value: string;
  rows?: number;
}) {
  if (!value.trim()) {
    return null;
  }

  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        readOnly
        rows={rows}
        className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm leading-6 text-slate-700 shadow-sm outline-none"
      />
    </label>
  );
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
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function Bm045FormInputsPanel({
  documentId,
  onSaved,
}: Bm045FormInputsPanelProps) {
  const [form, setForm] = useState<Bm045FormInputs>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const syncedForm = useMemo(() => buildSyncedForm(form), [form]);
  const isDirty = JSON.stringify(syncedForm) !== initialSnapshot;

  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter((item) => {
      return !getValue(syncedForm, item.section, item.field).trim();
    });
  }, [syncedForm]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const payload = await getBm045RenderPayload(documentId);
        const nextForm = normalizeFormInputs(payload);

        if (!isMounted) {
          return;
        }

        setForm(nextForm);
        setInitialSnapshot(JSON.stringify(buildSyncedForm(nextForm)));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Không tải được dữ liệu BM-045.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  function updateField<TSection extends SectionName>(
    sectionName: TSection,
    fieldName: keyof Bm045FormInputs[TSection],
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [sectionName]: {
        ...current[sectionName],
        [fieldName]: value,
      },
    }));
  }

  function updateBailBoolean(value: boolean) {
    setForm((current) => ({
      ...current,
      bailApproval: {
        ...current.bailApproval,
        includeJuvenileJusticeLine: value,
      },
    }));
  }

  function fillCustomerSample() {
    const sample = buildSyncedForm(EMPTY_FORM);

    setForm(sample);
    setErrorMessage("");
    setSuccessMessage("Đã điền dữ liệu mẫu BM-045. Bấm lưu để ghi vào backend.");
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const savePayload = buildSyncedForm(form);
      await saveBm045FormInputs(documentId, savePayload);

      setForm(savePayload);
      setInitialSnapshot(JSON.stringify(savePayload));
      setSuccessMessage("Đã lưu dữ liệu BM-045. Có thể render lại DOCX/PDF.");
      onSaved?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được dữ liệu BM-045.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu BM-045...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          BM-045
        </p>
        <h2 className="mt-2 text-xl font-bold text-emerald-950">
          Dữ liệu biểu mẫu Quyết định phê chuẩn Quyết định về việc bảo lĩnh
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Nhập tên bị can, tội danh và thông tin quyết định bảo lĩnh một lần.
          Các dòng căn cứ, Điều 1, Điều 2 và nơi nhận tự đồng bộ trước khi lưu/render.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillCustomerSample}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            Điền dữ liệu mẫu BM-045
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? "Đang lưu..." : "Lưu dữ liệu BM-045"}
          </button>
        </div>

        {missingFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3 text-sm text-amber-900">
            <p className="font-semibold">Còn thiếu {missingFields.length} trường quan trọng:</p>
            <p className="mt-1">{missingFields.map((item) => item.label).join(", ")}</p>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-emerald-800">
            Đã nhập đủ các trường quan trọng.
          </p>
        )}

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </p>
        ) : null}
      </div>

      <SectionCard title="1. Tùy chọn dòng điều kiện">
        <CheckboxInput
          label="Áp dụng căn cứ Luật Tư pháp người chưa thành niên"
          checked={form.bailApproval.includeJuvenileJusticeLine}
          onChange={updateBailBoolean}
          description="Không tick thì không render dòng Căn cứ Điều 135."
        />
      </SectionCard>

      <SectionCard title="2. Văn bản / cơ quan">
        <TextInput
          label="Cơ quan cấp trên"
          value={form.agency.parentNameUpper}
          onChange={(value) => updateField("agency", "parentNameUpper", value)}
          required
        />
        <TextInput
          label="Viện kiểm sát ban hành"
          value={form.agency.nameUpper}
          onChange={(value) => updateField("agency", "nameUpper", value)}
          required
        />
        <TextInput
          label="Số quyết định"
          value={form.document.documentCode}
          onChange={(value) => updateField("document", "documentCode", value)}
          required
        />
        <TextInput
          label="Ngày ban hành"
          value={form.document.issueDate}
          onChange={(value) => updateField("document", "issueDate", value)}
          placeholder="26/05/2026"
        />
        <TextInput
          label="Địa danh"
          value={form.agency.issuePlace}
          onChange={(value) => updateField("agency", "issuePlace", value)}
        />
      </SectionCard>

      <SectionCard title="3. Bị can / tội danh">
        <TextInput
          label="Họ tên bị can"
          value={form.bailApproval.accusedName}
          onChange={(value) => updateField("bailApproval", "accusedName", value)}
          required
        />
        <TextInput
          label="Tên tội"
          value={form.bailApproval.offenseName}
          onChange={(value) => updateField("bailApproval", "offenseName", value)}
          required
        />
        <TextInput
          label="Điều luật"
          value={form.bailApproval.legalArticle}
          onChange={(value) => updateField("bailApproval", "legalArticle", value)}
          required
        />
        <TextInput
          label="Cơ quan điều tra / cơ quan đề nghị"
          value={form.bailApproval.investigationAgency}
          onChange={(value) => updateField("bailApproval", "investigationAgency", value)}
        />
      </SectionCard>

      <SectionCard title="4. Quyết định khởi tố">
        <TextInput
          label="Số Quyết định khởi tố vụ án"
          value={form.bailApproval.caseDecisionCode}
          onChange={(value) => updateField("bailApproval", "caseDecisionCode", value)}
        />
        <TextInput
          label="Ngày Quyết định khởi tố vụ án"
          value={form.bailApproval.caseDecisionIssueDateText}
          onChange={(value) =>
            updateField("bailApproval", "caseDecisionIssueDateText", value)
          }
        />
        <TextInput
          label="Số Quyết định khởi tố bị can"
          value={form.bailApproval.accusedDecisionCode}
          onChange={(value) => updateField("bailApproval", "accusedDecisionCode", value)}
        />
        <TextInput
          label="Ngày Quyết định khởi tố bị can"
          value={form.bailApproval.accusedDecisionIssueDateText}
          onChange={(value) =>
            updateField("bailApproval", "accusedDecisionIssueDateText", value)
          }
        />
      </SectionCard>

      <SectionCard title="5. Quyết định bảo lĩnh">
        <TextInput
          label="Số Quyết định bảo lĩnh"
          value={form.bailApproval.bailDecisionCode}
          onChange={(value) => updateField("bailApproval", "bailDecisionCode", value)}
          required
        />
        <TextInput
          label="Ngày Quyết định bảo lĩnh"
          value={form.bailApproval.bailDecisionIssueDateText}
          onChange={(value) =>
            updateField("bailApproval", "bailDecisionIssueDateText", value)
          }
        />
        <TextInput
          label="Cơ quan ra Quyết định bảo lĩnh"
          value={form.bailApproval.bailDecisionAgencyName}
          onChange={(value) =>
            updateField("bailApproval", "bailDecisionAgencyName", value)
          }
          required
        />
        <TextArea
          label="Dòng nơi nhận người/cơ quan nhận bảo lĩnh"
          value={form.bailApproval.bailReceiverLine}
          onChange={(value) => updateField("bailApproval", "bailReceiverLine", value)}
        />
      </SectionCard>

      <SectionCard title="6. Preview dòng sẽ render">
        <PreviewArea
          label="Căn cứ BLTTHS"
          value={syncedForm.legalBasis.procedureArticlesLine}
        />
        <PreviewArea
          label="Căn cứ người chưa thành niên"
          value={syncedForm.legalBasis.juvenileJusticeLine}
        />
        <PreviewArea
          label="Căn cứ khởi tố vụ án"
          value={syncedForm.bailApproval.caseDecisionLegalBasisLine}
          rows={4}
        />
        <PreviewArea
          label="Căn cứ khởi tố bị can"
          value={syncedForm.bailApproval.accusedDecisionLegalBasisLine}
          rows={4}
        />
        <PreviewArea
          label="Xét hồ sơ"
          value={syncedForm.bailApproval.proposalLine}
        />
        <PreviewArea
          label="Nhận thấy"
          value={syncedForm.bailApproval.reasonLine}
        />
        <PreviewArea
          label="Điều 1"
          value={syncedForm.bailApproval.article1Line}
        />
        <PreviewArea
          label="Điều 2"
          value={syncedForm.bailApproval.article2Line}
        />
      </SectionCard>

      <SectionCard title="7. Nơi nhận / chữ ký">
        <PreviewArea
          label="Nơi nhận - cơ quan ra quyết định"
          value={syncedForm.recipients.executionAgencyLine}
        />
        <PreviewArea
          label="Nơi nhận - bị can/người đại diện"
          value={syncedForm.recipients.personRepresentativeLine}
        />
        <PreviewArea
          label="Nơi nhận - người nhận bảo lĩnh"
          value={syncedForm.recipients.bailReceiverLine}
        />
        <TextInput
          label="Nơi nhận - lưu"
          value={form.recipients.archiveLine}
          onChange={(value) => updateField("recipients", "archiveLine", value)}
        />
        <TextInput
          label="Chế độ ký"
          value={form.signature.signMode}
          onChange={(value) => updateField("signature", "signMode", value)}
          required
        />
        <TextInput
          label="Chức danh"
          value={form.signature.positionTitle}
          onChange={(value) => updateField("signature", "positionTitle", value)}
          required
        />
        <TextInput
          label="Người ký"
          value={form.signature.signerName}
          onChange={(value) => updateField("signature", "signerName", value)}
          required
        />
      </SectionCard>
    </section>
  );
}
