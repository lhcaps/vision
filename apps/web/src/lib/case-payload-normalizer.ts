// Normalizes render-payload case data for BM auto-populate context.

export type CasePayloadAgency = {
  id: string | null;
  agencyCode: string | null;
  agencyName: string | null;
  agencyType: string | null;
  parentAgencyId: string | null;
  parentAgencyName: string | null;
  address: string | null;
  phone: string | null;
};

export type CasePayloadCase = {
  id: string | null;
  caseCode: string | null;
  nationalCaseCode: string | null;
  caseTitle: string | null;
  caseSummary: string | null;
  caseType: string | null;
  sourceType: string | null;
  currentStage: string | null;
  currentStatus: string | null;
  priority: string | null;
  receivedDate: string | null;
  acceptedDate: string | null;
  prosecutedDate: string | null;
  closedDate: string | null;
  note: string | null;
  agency: CasePayloadAgency | null;
};

export type CasePayloadPerson = {
  casePersonId: string | null;
  id: string | null;
  fullName: string | null;
  roleType: string | null;
  legalStatus: string | null;
  isPrimary: boolean;
  personOrder: number;
  birthYear: number | null;
  currentAddress: string | null;
  residenceAddress: string | null;
};

export type CasePayloadOffense = {
  id: string | null;
  personId: string | null;
  offenseId: string | null;
  offenseName: string | null;
  offenseCode: string | null;
  offenseGroup: string | null;
  legalArticle: string | null;
  isPrimary: boolean;
};

export type CasePayloadAssignmentOfficial = {
  id: string | null;
  fullName: string | null;
  positionTitle: string | null;
  rankTitle: string | null;
  phone: string | null;
};

export type CasePayloadAssignment = {
  id: string | null;
  roleType: string | null;
  legalStatus: string | null;
  isPrimary: boolean;
  personOrder: number;
  assignedDate: string | null;
  endedDate: string | null;
  decisionNo: string | null;
  decisionDate: string | null;
  note: string | null;
  official: CasePayloadAssignmentOfficial | null;
};

export type CasePayload = {
  case: CasePayloadCase | null;
  people: CasePayloadPerson[];
  offenses: CasePayloadOffense[];
  assignments: CasePayloadAssignment[];
};

export type CasePayloadAgencyWire = Partial<CasePayloadAgency>;

export type CasePayloadCaseWire = {
  id?: string | null;
  caseCode?: string | null;
  nationalCaseCode?: string | null;
  caseTitle?: string | null;
  caseSummary?: string | null;
  caseType?: string | null;
  sourceType?: string | null;
  currentStage?: string | null;
  currentStatus?: string | null;
  priority?: string | null;
  receivedDate?: string | null;
  acceptedDate?: string | null;
  prosecutedDate?: string | null;
  closedDate?: string | null;
  note?: string | null;
  agency?: CasePayloadAgencyWire | null;
};

export type CasePayloadPersonWire = {
  casePersonId?: string | null;
  personId?: string | null;
  roleType?: string | null;
  legalStatus?: string | null;
  isPrimary?: boolean;
  personOrder?: number;
  fullName?: string | null;
  birthYear?: number | null;
  currentAddress?: string | null;
  residenceAddress?: string | null;
};

export type CasePayloadOffenseWire = {
  id?: string | null;
  personId?: string | null;
  offenseId?: string | null;
  offenseName?: string | null;
  offenseCode?: string | null;
  offenseGroup?: string | null;
  legalArticle?: string | null;
  isPrimary?: boolean;
};

export type CasePayloadAssignmentOfficialWire =
  Partial<CasePayloadAssignmentOfficial>;

export type CasePayloadAssignmentWire = {
  id?: string | null;
  roleType?: string | null;
  legalStatus?: string | null;
  isPrimary?: boolean;
  personOrder?: number;
  assignedDate?: string | null;
  endedDate?: string | null;
  decisionNo?: string | null;
  decisionDate?: string | null;
  note?: string | null;
  official?: CasePayloadAssignmentOfficialWire | null;
};

export type RenderPayloadForCaseContext = {
  case?: CasePayloadCaseWire | null;
  people?: CasePayloadPersonWire[] | null;
  offenses?: CasePayloadOffenseWire[] | null;
  assignments?: CasePayloadAssignmentWire[] | null;
};

function items<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function buildAgency(
  agency: CasePayloadAgencyWire | null | undefined,
): CasePayloadAgency | null {
  if (!agency) return null;

  return {
    id: agency.id ?? null,
    agencyCode: agency.agencyCode ?? null,
    agencyName: agency.agencyName ?? null,
    agencyType: agency.agencyType ?? null,
    parentAgencyId: agency.parentAgencyId ?? null,
    parentAgencyName: agency.parentAgencyName ?? null,
    address: agency.address ?? null,
    phone: agency.phone ?? null,
  };
}

/**
 * Converts a render-payload response into the stable context shape.
 *
 * Example:
 * `buildCasePayloadFromRenderPayload({ case: { caseCode: "VKS-1" } }).case?.caseCode`
 * returns `"VKS-1"`.
 */
export function buildCasePayloadFromRenderPayload(
  payload: RenderPayloadForCaseContext | null | undefined,
): CasePayload {
  const wireCase = payload?.case ?? null;

  return {
    case: wireCase
      ? {
          id: wireCase.id ?? null,
          caseCode: wireCase.caseCode ?? null,
          nationalCaseCode: wireCase.nationalCaseCode ?? null,
          caseTitle: wireCase.caseTitle ?? null,
          caseSummary: wireCase.caseSummary ?? null,
          caseType: wireCase.caseType ?? null,
          sourceType: wireCase.sourceType ?? null,
          currentStage: wireCase.currentStage ?? null,
          currentStatus: wireCase.currentStatus ?? null,
          priority: wireCase.priority ?? null,
          receivedDate: wireCase.receivedDate ?? null,
          acceptedDate: wireCase.acceptedDate ?? null,
          prosecutedDate: wireCase.prosecutedDate ?? null,
          closedDate: wireCase.closedDate ?? null,
          note: wireCase.note ?? null,
          agency: buildAgency(wireCase.agency),
        }
      : null,
    people: items(payload?.people).map((item) => ({
      casePersonId: item.casePersonId ?? null,
      id: item.personId ?? null,
      fullName: item.fullName ?? null,
      roleType: item.roleType ?? null,
      legalStatus: item.legalStatus ?? null,
      isPrimary: item.isPrimary ?? false,
      personOrder: item.personOrder ?? 0,
      birthYear: item.birthYear ?? null,
      currentAddress: item.currentAddress ?? null,
      residenceAddress: item.residenceAddress ?? null,
    })),
    offenses: items(payload?.offenses).map((item) => ({
      id: item.id ?? null,
      personId: item.personId ?? null,
      offenseId: item.offenseId ?? null,
      offenseName: item.offenseName ?? null,
      offenseCode: item.offenseCode ?? null,
      offenseGroup: item.offenseGroup ?? null,
      legalArticle: item.legalArticle ?? null,
      isPrimary: item.isPrimary ?? false,
    })),
    assignments: items(payload?.assignments).map((item) => ({
      id: item.id ?? null,
      roleType: item.roleType ?? null,
      legalStatus: item.legalStatus ?? null,
      isPrimary: item.isPrimary ?? false,
      personOrder: item.personOrder ?? 0,
      assignedDate: item.assignedDate ?? null,
      endedDate: item.endedDate ?? null,
      decisionNo: item.decisionNo ?? null,
      decisionDate: item.decisionDate ?? null,
      note: item.note ?? null,
      official: item.official
        ? {
            id: item.official.id ?? null,
            fullName: item.official.fullName ?? null,
            positionTitle: item.official.positionTitle ?? null,
            rankTitle: item.official.rankTitle ?? null,
            phone: item.official.phone ?? null,
          }
        : null,
    })),
  };
}
