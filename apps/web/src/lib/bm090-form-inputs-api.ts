const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type JsonObject = Record<string, unknown>;

export type Bm090FormInputs = {
  agency: {
    parentName: string;
    name: string;
    shortName: string;
    issuePlace: string;
    phone: string;
  };
  official: {
    fullName: string;
    positionTitle: string;
    prosecutorName: string;
  };
  document: {
    documentNo: string;
    documentCode: string;
    issueDate: string;
  };
  caseDecision: {
    decisionNo: string;
    issueDate: string;
    issuedBy: string;
  };
  accusedDecision: {
    decisionNo: string;
    issueDate: string;
    issuedBy: string;
  };
  offense: {
    offenseName: string;
    legalArticle: string;
    criminalCodeText: string;
  };
  person: {
    fullName: string;
  };
  recipients: {
    personLine: string;
    investigationUnitLine: string;
    archiveLine: string;
    noteLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
};

export type Bm090RenderPayload = {
  formInputs?: Partial<Bm090FormInputs>;
  renderPayloadSnapshot?: {
    formInputs?: Partial<Bm090FormInputs>;
  };
  render_payload_snapshot?: {
    formInputs?: Partial<Bm090FormInputs>;
  };
  agency?: Partial<Bm090FormInputs["agency"]>;
  official?: Partial<Bm090FormInputs["official"]>;
  document?: Partial<Bm090FormInputs["document"]> & {
    fullDocumentCode?: string | null;
    issuePlaceDateLine?: string | null;
  };
  caseDecision?: Partial<Bm090FormInputs["caseDecision"]> & {
    legalBasisLine?: string | null;
  };
  accusedDecision?: Partial<Bm090FormInputs["accusedDecision"]> & {
    requestLine?: string | null;
    approvalArticle1Line?: string | null;
    investigationRequestLine?: string | null;
  };
  offense?: Partial<Bm090FormInputs["offense"]>;
  person?: Partial<Bm090FormInputs["person"]>;
  recipients?: Partial<Bm090FormInputs["recipients"]>;
  signature?: Partial<Bm090FormInputs["signature"]>;
  approval?: {
    assessmentLine?: string | null;
  };
  [key: string]: unknown;
};

export const EMPTY_BM090_FORM_INPUTS: Bm090FormInputs = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
    issuePlace: "",
    phone: "",
  },
  official: {
    fullName: "",
    positionTitle: "",
    prosecutorName: "",
  },
  document: {
    documentNo: "",
    documentCode: "",
    issueDate: "",
  },
  caseDecision: {
    decisionNo: "",
    issueDate: "",
    issuedBy: "",
  },
  accusedDecision: {
    decisionNo: "",
    issueDate: "",
    issuedBy: "",
  },
  offense: {
    offenseName: "",
    legalArticle: "",
    criminalCodeText: "",
  },
  person: {
    fullName: "",
  },
  recipients: {
    personLine: "",
    investigationUnitLine: "",
    archiveLine: "- Lưu: HSVA, HSKS, VP.",
    noteLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
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
  section: keyof Bm090FormInputs,
): unknown {
  if (isJsonObject(formInputs[section])) {
    return formInputs[section];
  }

  if (isJsonObject(root[section])) {
    return root[section];
  }

  return {};
}

export function normalizeBm090FormInputs(payload: unknown): Bm090FormInputs {
  const root = isJsonObject(payload) ? payload : {};
  const formInputs = getNestedFormInputs(root);

  const normalized: Bm090FormInputs = {
    agency: mergeSection(
      EMPTY_BM090_FORM_INPUTS.agency,
      pickSection(root, formInputs, "agency"),
    ),
    official: mergeSection(
      EMPTY_BM090_FORM_INPUTS.official,
      pickSection(root, formInputs, "official"),
    ),
    document: mergeSection(
      EMPTY_BM090_FORM_INPUTS.document,
      pickSection(root, formInputs, "document"),
      ["issueDate"],
    ),
    caseDecision: mergeSection(
      EMPTY_BM090_FORM_INPUTS.caseDecision,
      pickSection(root, formInputs, "caseDecision"),
      ["issueDate"],
    ),
    accusedDecision: mergeSection(
      EMPTY_BM090_FORM_INPUTS.accusedDecision,
      pickSection(root, formInputs, "accusedDecision"),
      ["issueDate"],
    ),
    offense: mergeSection(
      EMPTY_BM090_FORM_INPUTS.offense,
      pickSection(root, formInputs, "offense"),
    ),
    person: mergeSection(
      EMPTY_BM090_FORM_INPUTS.person,
      pickSection(root, formInputs, "person"),
    ),
    recipients: mergeSection(
      EMPTY_BM090_FORM_INPUTS.recipients,
      pickSection(root, formInputs, "recipients"),
    ),
    signature: mergeSection(
      EMPTY_BM090_FORM_INPUTS.signature,
      pickSection(root, formInputs, "signature"),
    ),
  };

  if (!normalized.document.documentCode) {
    normalized.document.documentCode = asString(
      (root.document as JsonObject | undefined)?.documentCode,
    );
  }

  if (!normalized.person.fullName) {
    normalized.person.fullName = asString(
      (root.person as JsonObject | undefined)?.fullName,
    );
  }

  if (!normalized.recipients.investigationUnitLine) {
    normalized.recipients.investigationUnitLine = asString(
      (root.recipients as JsonObject | undefined)?.investigationUnitLine,
    );
  }

  if (!normalized.recipients.personLine) {
    const fullName = normalized.person.fullName.trim();
    normalized.recipients.personLine = fullName ? `- ${fullName};` : "";
  }

  return normalized;
}

export async function getBm090RenderPayload(
  documentId: string | number,
): Promise<Bm090RenderPayload> {
  return readApi<Bm090RenderPayload>(
    `/documents/generated/${documentId}/render-payload`,
  );
}

export async function saveBm090FormInputs(
  documentId: string | number,
  formInputs: Bm090FormInputs,
): Promise<void> {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

  const normalizedInputs = JSON.parse(JSON.stringify(formInputs)) as Bm090FormInputs;

  const response = await fetch(
    `${apiBase}/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...normalizedInputs,
        formInputs: normalizedInputs,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      message || "Không lưu được dữ liệu biểu mẫu BM-090.",
    );
  }
}
