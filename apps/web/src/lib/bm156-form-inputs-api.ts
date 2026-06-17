const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type JsonObject = Record<string, unknown>;

export type Bm156FormInputs = {
  agency: {
    parentName: string;
    name: string;
    shortName: string;
    issuePlace: string;
  };
  document: {
    documentNo: string;
    fullDocumentCode: string;
    issueDate: string;
  };
  official: {
    issuerTitle: string;
  };
  legalBasis: {
    procedureArticlesLine: string;
  };
  caseDecision: {
    legalBasisLine: string;
  };
  accusedDecision: {
    legalBasisLine: string;
  };
  caseJoinder: {
    legalBasisLine: string;
  };
  caseRecovery: {
    legalBasisLine: string;
  };
  investigationConclusion: {
    legalBasisLine: string;
  };
  indictment: {
    legalBasesSection: string;
    factFindingsSection: string;
    evidenceConclusionLine: string;
    conclusionSection: string;
    prosecutionDecisionLine: string;
    replacementLine: string;
  };
  attachments: {
    caseFileLine: string;
    evidenceListLine: string;
    courtSummonsListLine: string;
  };
  recipients: {
    courtLine: string;
    accusedLine: string;
    investigationUnitLine: string;
    superiorProcuracyLine: string;
    otherRecipientsLine: string;
    archiveLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
};

export type Bm156RenderPayload = {
  formInputs?: Partial<Bm156FormInputs>;
  renderPayloadSnapshot?: {
    formInputs?: Partial<Bm156FormInputs>;
  };
  render_payload_snapshot?: {
    formInputs?: Partial<Bm156FormInputs>;
  };
  agency?: Partial<Bm156FormInputs["agency"]>;
  document?: Partial<Bm156FormInputs["document"]>;
  official?: Partial<Bm156FormInputs["official"]>;
  legalBasis?: Partial<Bm156FormInputs["legalBasis"]>;
  caseDecision?: Partial<Bm156FormInputs["caseDecision"]>;
  accusedDecision?: Partial<Bm156FormInputs["accusedDecision"]>;
  caseJoinder?: Partial<Bm156FormInputs["caseJoinder"]>;
  caseRecovery?: Partial<Bm156FormInputs["caseRecovery"]>;
  investigationConclusion?: Partial<Bm156FormInputs["investigationConclusion"]>;
  indictment?: Partial<Bm156FormInputs["indictment"]>;
  attachments?: Partial<Bm156FormInputs["attachments"]>;
  recipients?: Partial<Bm156FormInputs["recipients"]>;
  signature?: Partial<Bm156FormInputs["signature"]>;
  [key: string]: unknown;
};

export const EMPTY_BM156_FORM_INPUTS: Bm156FormInputs = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
    issuePlace: "",
  },
  document: {
    documentNo: "",
    fullDocumentCode: "",
    issueDate: "",
  },
  official: {
    issuerTitle: "",
  },
  legalBasis: {
    procedureArticlesLine: "",
  },
  caseDecision: {
    legalBasisLine: "",
  },
  accusedDecision: {
    legalBasisLine: "",
  },
  caseJoinder: {
    legalBasisLine: "",
  },
  caseRecovery: {
    legalBasisLine: "",
  },
  investigationConclusion: {
    legalBasisLine: "",
  },
  indictment: {
    legalBasesSection: "",
    factFindingsSection: "",
    evidenceConclusionLine: "",
    conclusionSection: "",
    prosecutionDecisionLine: "",
    replacementLine: "",
  },
  attachments: {
    caseFileLine: "",
    evidenceListLine: "",
    courtSummonsListLine: "",
  },
  recipients: {
    courtLine: "",
    accusedLine: "",
    investigationUnitLine: "",
    superiorProcuracyLine: "",
    otherRecipientsLine: "",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
  },
  signature: {
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "",
  },
};

class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapApiData<T>(json: unknown): T {
  if (isJsonObject(json)) {
    if ("data" in json && json.data !== undefined) {
      return json.data as T;
    }

    if ("result" in json && json.result !== undefined) {
      return json.result as T;
    }
  }

  return json as T;
}

async function readApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  const text = await response.text();
  let json: unknown = null;

  if (text.trim().length > 0) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    if (isJsonObject(json)) {
      const maybeMessage = json.message;

      if (typeof maybeMessage === "string") {
        message = maybeMessage;
      } else if (Array.isArray(maybeMessage)) {
        message = maybeMessage.join(", ");
      }
    }

    throw new ApiClientError(message, response.status);
  }

  return unwrapApiData<T>(json);
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function normalizeDate(value: unknown): string {
  const raw = asString(value).trim();

  if (!raw) {
    return "";
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const vnMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vnMatch) {
    const [, dayRaw, monthRaw, year] = vnMatch;
    const day = dayRaw.padStart(2, "0");
    const month = monthRaw.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return raw;
}

function buildIsoDateFromParts(
  dayValue: unknown,
  monthValue: unknown,
  yearValue: unknown,
): string {
  const dayRaw = asString(dayValue).trim();
  const monthRaw = asString(monthValue).trim();
  const yearRaw = asString(yearValue).trim();

  if (!dayRaw || !monthRaw || !yearRaw) {
    return "";
  }

  const dayNumber = Number(dayRaw);
  const monthNumber = Number(monthRaw);

  if (
    !Number.isFinite(dayNumber) ||
    !Number.isFinite(monthNumber) ||
    dayNumber <= 0 ||
    monthNumber <= 0 ||
    yearRaw.length !== 4
  ) {
    return "";
  }

  return `${yearRaw}-${String(monthNumber).padStart(2, "0")}-${String(
    dayNumber,
  ).padStart(2, "0")}`;
}

function mergeSection<T extends Record<string, string>>(
  defaults: T,
  value: unknown,
  dateFields: readonly string[] = [],
): T {
  const result: Record<string, string> = { ...defaults };

  if (!isJsonObject(value)) {
    return result as T;
  }

  for (const key of Object.keys(defaults)) {
    result[key] = dateFields.includes(key)
      ? normalizeDate(value[key])
      : asString(value[key]);
  }

  return result as T;
}

function getNestedFormInputs(root: JsonObject): JsonObject {
  if (isJsonObject(root.formInputs)) {
    return root.formInputs;
  }

  if (
    isJsonObject(root.renderPayloadSnapshot) &&
    isJsonObject(root.renderPayloadSnapshot.formInputs)
  ) {
    return root.renderPayloadSnapshot.formInputs;
  }

  if (
    isJsonObject(root.render_payload_snapshot) &&
    isJsonObject(root.render_payload_snapshot.formInputs)
  ) {
    return root.render_payload_snapshot.formInputs;
  }

  return {};
}

function pickSection(
  root: JsonObject,
  formInputs: JsonObject,
  section: keyof Bm156FormInputs,
): unknown {
  if (isJsonObject(formInputs[section])) {
    return formInputs[section];
  }

  if (isJsonObject(root[section])) {
    return root[section];
  }

  return {};
}

export function normalizeBm156FormInputs(payload: unknown): Bm156FormInputs {
  const root = isJsonObject(payload) ? payload : {};
  const formInputs = getNestedFormInputs(root);
  const rootDocument = isJsonObject(root.document) ? root.document : {};

  return {
    agency: mergeSection(
      EMPTY_BM156_FORM_INPUTS.agency,
      pickSection(root, formInputs, "agency"),
    ),
    document: {
      ...mergeSection(
        EMPTY_BM156_FORM_INPUTS.document,
        pickSection(root, formInputs, "document"),
        ["issueDate"],
      ),
      issueDate:
        mergeSection(
          EMPTY_BM156_FORM_INPUTS.document,
          pickSection(root, formInputs, "document"),
          ["issueDate"],
        ).issueDate ||
        buildIsoDateFromParts(
          rootDocument.issueDay,
          rootDocument.issueMonth,
          rootDocument.issueYear,
        ),
    },
    official: mergeSection(
      EMPTY_BM156_FORM_INPUTS.official,
      pickSection(root, formInputs, "official"),
    ),
    legalBasis: mergeSection(
      EMPTY_BM156_FORM_INPUTS.legalBasis,
      pickSection(root, formInputs, "legalBasis"),
    ),
    caseDecision: mergeSection(
      EMPTY_BM156_FORM_INPUTS.caseDecision,
      pickSection(root, formInputs, "caseDecision"),
    ),
    accusedDecision: mergeSection(
      EMPTY_BM156_FORM_INPUTS.accusedDecision,
      pickSection(root, formInputs, "accusedDecision"),
    ),
    caseJoinder: mergeSection(
      EMPTY_BM156_FORM_INPUTS.caseJoinder,
      pickSection(root, formInputs, "caseJoinder"),
    ),
    caseRecovery: mergeSection(
      EMPTY_BM156_FORM_INPUTS.caseRecovery,
      pickSection(root, formInputs, "caseRecovery"),
    ),
    investigationConclusion: mergeSection(
      EMPTY_BM156_FORM_INPUTS.investigationConclusion,
      pickSection(root, formInputs, "investigationConclusion"),
    ),
    indictment: mergeSection(
      EMPTY_BM156_FORM_INPUTS.indictment,
      pickSection(root, formInputs, "indictment"),
    ),
    attachments: mergeSection(
      EMPTY_BM156_FORM_INPUTS.attachments,
      pickSection(root, formInputs, "attachments"),
    ),
    recipients: mergeSection(
      EMPTY_BM156_FORM_INPUTS.recipients,
      pickSection(root, formInputs, "recipients"),
    ),
    signature: mergeSection(
      EMPTY_BM156_FORM_INPUTS.signature,
      pickSection(root, formInputs, "signature"),
    ),
  };
}

export async function getBm156RenderPayload(
  documentId: string | number,
): Promise<Bm156RenderPayload> {
  return readApi<Bm156RenderPayload>(
    `/documents/generated/${documentId}/render-payload`,
  );
}

export async function saveBm156FormInputs(
  documentId: string | number,
  formInputs: Bm156FormInputs,
): Promise<Bm156RenderPayload> {
  return readApi<Bm156RenderPayload>(
    `/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      body: JSON.stringify({
        ...formInputs,
      }),
    },
  );
}
