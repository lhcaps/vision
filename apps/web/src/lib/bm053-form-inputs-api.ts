const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type JsonObject = Record<string, unknown>;

export type Bm053FormInputs = {
  agency: {
    parentName: string;
    name: string;
    shortName: string;
    issuePlace: string;
    phone: string;
    monitoringUnitName: string;
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
    genderLabel: string;
    otherName: string;
    dateOfBirth: string;
    birthYear: string;
    placeOfBirth: string;
    nationality: string;
    ethnicity: string;
    religion: string;
    occupation: string;
    identityType: string;
    identityNo: string;
    identityIssuedDate: string;
    identityIssuedPlace: string;
    permanentAddress: string;
    temporaryAddress: string;
    currentAddress: string;
    residenceAddress: string;
  };
  measure: {
    durationText: string;
    fromDate: string;
    toDate: string;
    residencePlace: string;
  };
  monitoring: {
    unitName: string;
    phone: string;
    prosecutorName: string;
  };
  recipients: {
    monitoringUnitLine: string;
    personLine: string;
    archiveLine: string;
    noteLine: string;
  };
  signature: {
    signMode: string;
    positionTitle: string;
    signerName: string;
  };
  delivery: {
    deliveredAtText: string;
    receiverTitle: string;
  };
};

export type Bm053RenderPayload = {
  formInputs?: Partial<Bm053FormInputs>;
  renderPayloadSnapshot?: {
    formInputs?: Partial<Bm053FormInputs>;
  };
  render_payload_snapshot?: {
    formInputs?: Partial<Bm053FormInputs>;
  };
  agency?: Partial<Bm053FormInputs["agency"]>;
  official?: Partial<Bm053FormInputs["official"]>;
  document?: Partial<Bm053FormInputs["document"]>;
  caseDecision?: Partial<Bm053FormInputs["caseDecision"]>;
  accusedDecision?: Partial<Bm053FormInputs["accusedDecision"]>;
  offense?: Partial<Bm053FormInputs["offense"]>;
  person?: Partial<Bm053FormInputs["person"]>;
  measure?: Partial<Bm053FormInputs["measure"]>;
  monitoring?: Partial<Bm053FormInputs["monitoring"]>;
  recipients?: Partial<Bm053FormInputs["recipients"]>;
  signature?: Partial<Bm053FormInputs["signature"]>;
  delivery?: Partial<Bm053FormInputs["delivery"]>;
  [key: string]: unknown;
};

export const EMPTY_BM053_FORM_INPUTS: Bm053FormInputs = {
  agency: {
    parentName: "",
    name: "",
    shortName: "",
    issuePlace: "",
    phone: "",
    monitoringUnitName: "",
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
    genderLabel: "",
    otherName: "",
    dateOfBirth: "",
    birthYear: "",
    placeOfBirth: "",
    nationality: "",
    ethnicity: "",
    religion: "",
    occupation: "",
    identityType: "Thẻ CCCD",
    identityNo: "",
    identityIssuedDate: "",
    identityIssuedPlace: "",
    permanentAddress: "",
    temporaryAddress: "",
    currentAddress: "",
    residenceAddress: "",
  },
  measure: {
    durationText: "",
    fromDate: "",
    toDate: "",
    residencePlace: "",
  },
  monitoring: {
    unitName: "",
    phone: "",
    prosecutorName: "",
  },
  recipients: {
    monitoringUnitLine: "",
    personLine: "",
    archiveLine: "",
    noteLine: "",
  },
  signature: {
    signMode: "",
    positionTitle: "",
    signerName: "",
  },
  delivery: {
    deliveredAtText: "",
    receiverTitle: "",
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
  section: keyof Bm053FormInputs,
): unknown {
  if (isJsonObject(formInputs[section])) {
    return formInputs[section];
  }

  if (isJsonObject(root[section])) {
    return root[section];
  }

  return {};
}

export function normalizeBm053FormInputs(payload: unknown): Bm053FormInputs {
  const root = isJsonObject(payload) ? payload : {};
  const formInputs = getNestedFormInputs(root);

  return {
    agency: mergeSection(
      EMPTY_BM053_FORM_INPUTS.agency,
      pickSection(root, formInputs, "agency"),
    ),
    official: mergeSection(
      EMPTY_BM053_FORM_INPUTS.official,
      pickSection(root, formInputs, "official"),
    ),
    document: mergeSection(
      EMPTY_BM053_FORM_INPUTS.document,
      pickSection(root, formInputs, "document"),
      ["issueDate"],
    ),
    caseDecision: mergeSection(
      EMPTY_BM053_FORM_INPUTS.caseDecision,
      pickSection(root, formInputs, "caseDecision"),
      ["issueDate"],
    ),
    accusedDecision: mergeSection(
      EMPTY_BM053_FORM_INPUTS.accusedDecision,
      pickSection(root, formInputs, "accusedDecision"),
      ["issueDate"],
    ),
    offense: mergeSection(
      EMPTY_BM053_FORM_INPUTS.offense,
      pickSection(root, formInputs, "offense"),
    ),
    person: mergeSection(
      EMPTY_BM053_FORM_INPUTS.person,
      pickSection(root, formInputs, "person"),
      ["dateOfBirth", "identityIssuedDate"],
    ),
    measure: mergeSection(
      EMPTY_BM053_FORM_INPUTS.measure,
      pickSection(root, formInputs, "measure"),
      ["fromDate", "toDate"],
    ),
    monitoring: mergeSection(
      EMPTY_BM053_FORM_INPUTS.monitoring,
      pickSection(root, formInputs, "monitoring"),
    ),
    recipients: mergeSection(
      EMPTY_BM053_FORM_INPUTS.recipients,
      pickSection(root, formInputs, "recipients"),
    ),
    signature: mergeSection(
      EMPTY_BM053_FORM_INPUTS.signature,
      pickSection(root, formInputs, "signature"),
    ),
    delivery: mergeSection(
      EMPTY_BM053_FORM_INPUTS.delivery,
      pickSection(root, formInputs, "delivery"),
    ),
  };
}

export async function getBm053RenderPayload(
  documentId: string | number,
): Promise<Bm053RenderPayload> {
  return readApi<Bm053RenderPayload>(
    `/documents/generated/${documentId}/render-payload`,
  );
}

export async function saveBm053FormInputs(
  documentId: string | number,
  formInputs: Bm053FormInputs,
): Promise<Bm053RenderPayload> {
  return readApi<Bm053RenderPayload>(
    `/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formInputs,
      }),
    },
  );
}
