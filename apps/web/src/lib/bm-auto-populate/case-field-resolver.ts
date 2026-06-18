// Pure resolver: CasePayload -> canonical field values.
//
// This is the single source of truth for what we can extract from a
// case payload. Each helper returns "" (not null/undefined) when the
// payload lacks the data, so callers can safely use `trim()` and treat
// empty as "no value".
//
// We intentionally do not throw on missing data: the auto-populate
// pipeline must degrade gracefully when the backend only returns a
// partial payload (e.g. a brand-new case before any offenses are
// added).

import type {
  CasePayload,
  CasePayloadAssignment,
  CasePayloadOffense,
  CasePayloadPerson,
} from "../case-payload-normalizer";

export type CaseFieldName =
  | "agency.parentName"
  | "agency.name"
  | "agency.address"
  | "case.code"
  | "case.title"
  | "case.summary"
  | "case.receivedDate"
  | "person.fullName"
  | "person.birthYear"
  | "person.residenceAddress"
  | "person.currentAddress"
  | "offense.name"
  | "offense.legalArticle"
  | "assignment.official.fullName"
  | "assignment.official.positionTitle"
  | "assignment.decisionNo"
  | "assignment.decisionDate";function text(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function firstByPrimaryThenOrder<T extends { isPrimary?: boolean; personOrder?: number }>(
  items: T[],
): T | null {
  if (items.length === 0) return null;

  return [...items].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    return (left.personOrder ?? 0) - (right.personOrder ?? 0);
  })[0];
}

export function selectPrimaryPerson(casePayload: CasePayload): CasePayloadPerson | null {
  return firstByPrimaryThenOrder(casePayload.people);
}

export function selectPrimaryOffense(
  casePayload: CasePayload,
  primaryPerson: CasePayloadPerson | null,
): CasePayloadOffense | null {
  if (primaryPerson?.id) {
    const personOffenses = casePayload.offenses.filter(
      (offense) => offense.personId === primaryPerson.id,
    );
    if (personOffenses.length > 0) {
      return firstByPrimaryThenOrder(personOffenses);
    }
  }

  return firstByPrimaryThenOrder(casePayload.offenses);
}

export function selectPrimaryAssignment(
  casePayload: CasePayload,
): CasePayloadAssignment | null {
  return firstByPrimaryThenOrder(casePayload.assignments);
}

export function resolveCaseField(
  field: CaseFieldName,
  casePayload: CasePayload | null | undefined,
): string {
  if (!casePayload) return "";

  const primaryPerson = selectPrimaryPerson(casePayload);
  const primaryOffense = selectPrimaryOffense(casePayload, primaryPerson);
  const primaryAssignment = selectPrimaryAssignment(casePayload);
  const agency = casePayload.case?.agency ?? null;
  const caseInfo = casePayload.case;

  switch (field) {
    case "agency.parentName":
      return text(agency?.parentAgencyName);
    case "agency.name":
      return text(agency?.agencyName);
    case "agency.address":
      return text(agency?.address);
    case "case.code":
      return text(caseInfo?.caseCode);
    case "case.title":
      return text(caseInfo?.caseTitle);
    case "case.summary":
      return text(caseInfo?.caseSummary);
    case "case.receivedDate":
      return text(caseInfo?.receivedDate);
    case "person.fullName":
      return text(primaryPerson?.fullName);
    case "person.birthYear":
      return text(primaryPerson?.birthYear);
    case "person.residenceAddress":
      return text(primaryPerson?.residenceAddress);
    case "person.currentAddress":
      return text(primaryPerson?.currentAddress);
    case "offense.name":
      return text(primaryOffense?.offenseName);
    case "offense.legalArticle":
      return text(primaryOffense?.legalArticle);
    case "assignment.official.fullName":
      return text(primaryAssignment?.official?.fullName);
    case "assignment.official.positionTitle":
      return text(primaryAssignment?.official?.positionTitle);
    case "assignment.decisionNo":
      return text(primaryAssignment?.decisionNo);
    case "assignment.decisionDate":
      return text(primaryAssignment?.decisionDate);
    default: {
      const exhaustiveCheck: never = field;
      return exhaustiveCheck;
    }
  }
}
