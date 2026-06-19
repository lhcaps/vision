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


/* Removed duplicate syncBm001PersonAliasesBeforeSave block index 0. Kept latest implementation. */
function syncBm001PersonAliasesBeforeSave(
  formInputs: Bm001FormInputs,
): Bm001FormInputs {
  const normalizedInputs = JSON.parse(JSON.stringify(formInputs)) as Bm001FormInputs;
  const root = normalizedInputs as unknown as Record<string, any>;

  const informant =
    root.informant && typeof root.informant === "object" && !Array.isArray(root.informant)
      ? root.informant
      : {};

  root.informant = informant;

  const targets = ["crimeReport", "person", "targetPerson", "sourceProvider"];

  for (const key of targets) {
    root[key] =
      root[key] && typeof root[key] === "object" && !Array.isArray(root[key])
        ? root[key]
        : {};

    const target = root[key] as Record<string, any>;

    if (informant.fullName) {
      target.fullName = informant.fullName;
      target.name = informant.fullName;
      target.informantName = informant.fullName;
      target.accusedName = informant.fullName;
      target.subjectName = informant.fullName;
      target.involvedPersonName = informant.fullName;
      target.suspectName = informant.fullName;
      target.personName = informant.fullName;

      root.fullName = informant.fullName;
      root.informantFullName = informant.fullName;
      root.accusedName = informant.fullName;
      root.subjectName = informant.fullName;
      root.involvedPersonName = informant.fullName;
    }

    if (informant.genderLabel) {
      target.genderLabel = informant.genderLabel;
      target.gender = informant.genderLabel;
      target.genderText = informant.genderLabel;
    }

    if (informant.otherName) {
      target.otherName = informant.otherName;
      target.aliasName = informant.otherName;
    }

    if (informant.dateOfBirth) {
      target.dateOfBirth = informant.dateOfBirth;
      target.birthDate = informant.dateOfBirth;
      root.dateOfBirth = informant.dateOfBirth;
    }

    if (informant.birthYear) {
      target.birthYear = informant.birthYear;
      root.birthYear = informant.birthYear;
    }

    if (informant.placeOfBirth) {
      target.placeOfBirth = informant.placeOfBirth;
      target.birthPlace = informant.placeOfBirth;
    }

    if (informant.nationality) target.nationality = informant.nationality;
    if (informant.ethnicity) target.ethnicity = informant.ethnicity;
    if (informant.religion) target.religion = informant.religion;
    if (informant.occupation) target.occupation = informant.occupation;

    if (informant.identityNo) {
      target.identityNo = informant.identityNo;
      target.identityNumber = informant.identityNo;
      target.idNumber = informant.identityNo;
    }

    if (informant.identityIssuedDate) {
      target.identityIssuedDate = informant.identityIssuedDate;
      target.identityIssueDate = informant.identityIssuedDate;
    }

    if (informant.identityIssuedPlace) {
      target.identityIssuedPlace = informant.identityIssuedPlace;
      target.identityIssuePlace = informant.identityIssuedPlace;
    }

    if (informant.permanentAddress) {
      target.permanentAddress = informant.permanentAddress;
      target.residenceAddress = informant.permanentAddress;
      root.permanentAddress = informant.permanentAddress;
    }

    if (informant.temporaryAddress) {
      target.temporaryAddress = informant.temporaryAddress;
    }

    if (informant.currentAddress) {
      target.currentAddress = informant.currentAddress;
      target.address = informant.currentAddress;
      root.currentAddress = informant.currentAddress;
      root.address = informant.currentAddress;
    }

    if (informant.phone) {
      target.phone = informant.phone;
      target.phoneNumber = informant.phone;
    }

    if (informant.representedOrganization) {
      target.representedOrganization = informant.representedOrganization;
      target.organizationRepresentative = informant.representedOrganization;
    }

    if (informant.signerName) {
      target.signerName = informant.signerName;
    }
  }

  return normalizedInputs;
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
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

  const normalizedInputs = syncBm001PersonAliasesBeforeSave(formInputs);

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
        payloadOverrides: normalizedInputs,
        renderPayloadOverrides: normalizedInputs,
        metadata: {
          formInputs: normalizedInputs,
          payloadOverrides: normalizedInputs,
          renderPayloadOverrides: normalizedInputs,
        },
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      message || "Không lưu được dữ liệu biểu mẫu BM-001.",
    );
  }

  // Không tin render-payload trả về từ BE nếu BE còn seed cũ.
  // Source of truth sau khi lưu là dữ liệu khách vừa nhập.
  return normalizedInputs as unknown as Bm001RenderPayload;
}
