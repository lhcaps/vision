const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type JsonObject = Record<string, unknown>;

export type Bm001FormInputs = {
  agency: {
    parentName: string;
    name: string;
    issuePlace: string;
  };
  document: {
    issueDate: string;
  };
  reception: {
    startedAtTimeText: string;
    startedAtDate: string;
    locationName: string;
    endedAtTimeText: string;
    endedAtDate: string;
  };
  receiver: {
    fullName: string;
    positionTitle: string;
    departmentName: string;
    signerName: string;
  };
  informant: {
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
    identityNo: string;
    identityIssuedDate: string;
    identityIssuedPlace: string;
    permanentAddress: string;
    temporaryAddress: string;
    currentAddress: string;
    phone: string;
    representedOrganization: string;
    signerName: string;
  };
  crimeReport: {
    content: string;
    attachedItemsDescription: string;
  };
  recipients: {
    archiveLine: string;
  };
};

export type Bm001RenderPayload = {
  formInputs?: Partial<Bm001FormInputs>;
  renderPayloadSnapshot?: {
    formInputs?: Partial<Bm001FormInputs>;
  };
  render_payload_snapshot?: {
    formInputs?: Partial<Bm001FormInputs>;
  };
  agency?: Partial<Bm001FormInputs["agency"]>;
  document?: Partial<Bm001FormInputs["document"]>;
  reception?: Partial<Bm001FormInputs["reception"]>;
  receiver?: Partial<Bm001FormInputs["receiver"]>;
  informant?: Partial<Bm001FormInputs["informant"]>;
  crimeReport?: Partial<Bm001FormInputs["crimeReport"]>;
  recipients?: Partial<Bm001FormInputs["recipients"]>;
  [key: string]: unknown;
};

export const EMPTY_BM001_FORM_INPUTS: Bm001FormInputs = {
  agency: {
    parentName: "",
    name: "",
    issuePlace: "",
  },
  document: {
    issueDate: "",
  },
  reception: {
    startedAtTimeText: "",
    startedAtDate: "",
    locationName: "",
    endedAtTimeText: "",
    endedAtDate: "",
  },
  receiver: {
    fullName: "",
    positionTitle: "",
    departmentName: "",
    signerName: "",
  },
  informant: {
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
    identityNo: "",
    identityIssuedDate: "",
    identityIssuedPlace: "",
    permanentAddress: "",
    temporaryAddress: "",
    currentAddress: "",
    phone: "",
    representedOrganization: "",
    signerName: "",
  },
  crimeReport: {
    content: "",
    attachedItemsDescription: "",
  },
  recipients: {
    archiveLine: "Lưu: HSVV, VP.",
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

  const day = String(dayNumber).padStart(2, "0");
  const month = String(monthNumber).padStart(2, "0");

  return `${yearRaw}-${month}-${day}`;
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
  section: keyof Bm001FormInputs,
): unknown {
  if (isJsonObject(formInputs[section])) {
    return formInputs[section];
  }

  if (isJsonObject(root[section])) {
    return root[section];
  }

  return {};
}

export function normalizeBm001FormInputs(payload: unknown): Bm001FormInputs {
  const root = isJsonObject(payload) ? payload : {};
  const formInputs = getNestedFormInputs(root);

  const rootDocument = isJsonObject(root.document) ? root.document : {};
  const rootReception = isJsonObject(root.reception) ? root.reception : {};
  const rootInformant = isJsonObject(root.informant) ? root.informant : {};

  const agency = mergeSection(
    EMPTY_BM001_FORM_INPUTS.agency,
    pickSection(root, formInputs, "agency"),
  );

  const document = mergeSection(
    EMPTY_BM001_FORM_INPUTS.document,
    pickSection(root, formInputs, "document"),
    ["issueDate"],
  );

  const reception = mergeSection(
    EMPTY_BM001_FORM_INPUTS.reception,
    pickSection(root, formInputs, "reception"),
    ["startedAtDate", "endedAtDate"],
  );

  const receiver = mergeSection(
    EMPTY_BM001_FORM_INPUTS.receiver,
    pickSection(root, formInputs, "receiver"),
  );

  const informant = mergeSection(
    EMPTY_BM001_FORM_INPUTS.informant,
    pickSection(root, formInputs, "informant"),
    ["dateOfBirth", "identityIssuedDate"],
  );

  const crimeReport = mergeSection(
    EMPTY_BM001_FORM_INPUTS.crimeReport,
    pickSection(root, formInputs, "crimeReport"),
  );

  const recipients = mergeSection(
    EMPTY_BM001_FORM_INPUTS.recipients,
    pickSection(root, formInputs, "recipients"),
  );

  return {
    agency,
    document: {
      ...document,
      issueDate:
        document.issueDate ||
        normalizeDate(rootDocument.issueDate) ||
        normalizeDate(rootDocument.issueDateText),
    },
    reception: {
      ...reception,
      startedAtDate:
        reception.startedAtDate ||
        buildIsoDateFromParts(
          rootReception.startedAtDay,
          rootReception.startedAtMonth,
          rootReception.startedAtYear,
        ),
      endedAtDate:
        reception.endedAtDate ||
        buildIsoDateFromParts(
          rootReception.endedAtDay,
          rootReception.endedAtMonth,
          rootReception.endedAtYear,
        ),
    },
    receiver,
    informant: {
      ...informant,
      dateOfBirth:
        informant.dateOfBirth ||
        buildIsoDateFromParts(
          rootInformant.birthDay,
          rootInformant.birthMonth,
          rootInformant.birthYear,
        ),
      birthYear:
        informant.birthYear ||
        asString(rootInformant.birthYear),
    },
    crimeReport,
    recipients,
  };
}

export async function getBm001RenderPayload(
  documentId: string | number,
): Promise<Bm001RenderPayload> {
  return readApi<Bm001RenderPayload>(
    `/documents/generated/${documentId}/render-payload`,
  );
}

export async function saveBm001FormInputs(
  documentId: string | number,
  formInputs: Bm001FormInputs,
): Promise<Bm001RenderPayload> {
  return readApi<Bm001RenderPayload>(
    `/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      body: JSON.stringify({
        ...formInputs,
        updatedByName: "Huy",
      }),
    },
  );
}
