/**
 * CRUD API cho 4 entity con của case.
 *
 * Pattern: mỗi resource có 4 function (list/add/update/remove) gọi thẳng
 * `readApi<T>` từ `api-client.ts`. Không có state, không có cache — chỉ là
 * wrapper HTTP. Component dùng hook `useState`/`useEffect` riêng.
 *
 * Endpoint shape: /cases/:caseId/<resource>
 *  - /people     -> case_people
 *  - /offenses   -> case_offenses
 *  - /assignments-> case_assignments
 *  - /evidence   -> evidence_items
 */

import { readApi } from "./api-client";

// =========================================================================
// Types
// =========================================================================

export type CasePerson = {
  id: string;
  caseId: string;
  personId: string;
  roleType: string;
  personOrder: number;
  legalStatus: string | null;
  isPrimary: boolean;
  isActive: boolean;
  note: string | null;
  person: {
    id: string;
    fullName: string;
    otherName: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    identityNo: string | null;
    occupation: string | null;
    permanentAddress: string | null;
    currentAddress: string | null;
  } | null;
};

export type AddCasePersonPayload = {
  personId?: string;
  fullName?: string;
  otherName?: string;
  gender?: string;
  dateOfBirth?: string;
  birthYear?: number;
  placeOfBirth?: string;
  identityNo?: string;
  occupation?: string;
  permanentAddress?: string;
  currentAddress?: string;
  residenceAddress?: string;
  roleType?: string;
  legalStatus?: string;
  personOrder?: number;
  isPrimary?: boolean;
  note?: string;
};

export type UpdateCasePersonPayload = {
  legalStatus?: string;
  personOrder?: number;
  isPrimary?: boolean;
  note?: string;
};

export type CaseOffense = {
  id: string;
  caseId: string;
  personId: string | null;
  offenseId: string;
  legalArticleId: string | null;
  offenseDescription: string | null;
  isPrimary: boolean;
  isDeleted: boolean;
  offense: {
    id: string;
    offenseCode: string | null;
    offenseName: string;
    offenseGroup: string | null;
    description: string | null;
    isActive: boolean;
  } | null;
};

export type AddCaseOffensePayload = {
  offenseName: string;
  offenseCode?: string;
  offenseGroup?: string;
  offenseDescription?: string;
  personId?: string;
};

export type UpdateCaseOffensePayload = {
  offenseDescription?: string;
  personId?: string | null;
};

export type CaseAssignment = {
  id: string;
  caseId: string;
  officialId: string | null;
  assignmentRole: string;
  assignedDate: string | null;
  endedDate: string | null;
  decisionNo: string | null;
  decisionDate: string | null;
  isActive: boolean;
  note: string | null;
  official: {
    id: string;
    fullName: string;
    positionTitle: string | null;
    rankTitle: string | null;
  } | null;
};

export type AddCaseAssignmentPayload = {
  officialId?: string;
  assignmentRole?: string;
  assignedDate?: string;
  endedDate?: string;
  decisionNo?: string;
  decisionDate?: string;
  note?: string;
  personOrder?: number;
};

export type UpdateCaseAssignmentPayload = Partial<AddCaseAssignmentPayload>;

export type EvidenceItem = {
  id: string;
  caseId: string;
  evidenceCode: string | null;
  evidenceName: string;
  evidenceType: string | null;
  quantity: string | null;
  unit: string | null;
  description: string | null;
  currentStatus: string;
  storageLocation: string | null;
  ownerPersonId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; fullName: string } | null;
};

export type AddEvidencePayload = {
  evidenceName: string;
  evidenceCode?: string;
  evidenceType?: string;
  quantity?: string;
  unit?: string;
  description?: string;
  currentStatus?: string;
  storageLocation?: string;
  ownerPersonId?: string;
  collectedDate?: string;
};

export type UpdateEvidencePayload = Partial<AddEvidencePayload>;

// =========================================================================
// Case People
// =========================================================================

export function listCasePeople(caseId: string): Promise<CasePerson[]> {
  return readApi<CasePerson[]>(`/cases/${caseId}/people`, { noStore: true });
}

export function addCasePerson(
  caseId: string,
  payload: AddCasePersonPayload,
): Promise<CasePerson> {
  return readApi<CasePerson>(`/cases/${caseId}/people`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCasePerson(
  caseId: string,
  casePersonId: string,
  payload: UpdateCasePersonPayload,
): Promise<CasePerson> {
  return readApi<CasePerson>(`/cases/${caseId}/people/${casePersonId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removeCasePerson(
  caseId: string,
  casePersonId: string,
): Promise<CasePerson> {
  return readApi<CasePerson>(`/cases/${caseId}/people/${casePersonId}`, {
    method: "DELETE",
  });
}

// =========================================================================
// Case Offenses
// =========================================================================

export function listCaseOffenses(caseId: string): Promise<CaseOffense[]> {
  return readApi<CaseOffense[]>(`/cases/${caseId}/offenses`, { noStore: true });
}

export function addCaseOffense(
  caseId: string,
  payload: AddCaseOffensePayload,
): Promise<CaseOffense> {
  return readApi<CaseOffense>(`/cases/${caseId}/offenses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCaseOffense(
  caseId: string,
  caseOffenseId: string,
  payload: UpdateCaseOffensePayload,
): Promise<CaseOffense> {
  return readApi<CaseOffense>(`/cases/${caseId}/offenses/${caseOffenseId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removeCaseOffense(
  caseId: string,
  caseOffenseId: string,
): Promise<CaseOffense> {
  return readApi<CaseOffense>(`/cases/${caseId}/offenses/${caseOffenseId}`, {
    method: "DELETE",
  });
}

// =========================================================================
// Case Assignments
// =========================================================================

export function listCaseAssignments(
  caseId: string,
): Promise<CaseAssignment[]> {
  return readApi<CaseAssignment[]>(`/cases/${caseId}/assignments`, {
    noStore: true,
  });
}

export function addCaseAssignment(
  caseId: string,
  payload: AddCaseAssignmentPayload,
): Promise<CaseAssignment> {
  return readApi<CaseAssignment>(`/cases/${caseId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCaseAssignment(
  caseId: string,
  assignmentId: string,
  payload: UpdateCaseAssignmentPayload,
): Promise<CaseAssignment> {
  return readApi<CaseAssignment>(
    `/cases/${caseId}/assignments/${assignmentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function removeCaseAssignment(
  caseId: string,
  assignmentId: string,
): Promise<CaseAssignment> {
  return readApi<CaseAssignment>(
    `/cases/${caseId}/assignments/${assignmentId}`,
    { method: "DELETE" },
  );
}

// =========================================================================
// Evidence
// =========================================================================

export function listCaseEvidence(caseId: string): Promise<EvidenceItem[]> {
  return readApi<EvidenceItem[]>(`/cases/${caseId}/evidence`, { noStore: true });
}

export function addCaseEvidence(
  caseId: string,
  payload: AddEvidencePayload,
): Promise<EvidenceItem> {
  return readApi<EvidenceItem>(`/cases/${caseId}/evidence`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCaseEvidence(
  caseId: string,
  evidenceId: string,
  payload: UpdateEvidencePayload,
): Promise<EvidenceItem> {
  return readApi<EvidenceItem>(`/cases/${caseId}/evidence/${evidenceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removeCaseEvidence(
  caseId: string,
  evidenceId: string,
): Promise<EvidenceItem> {
  return readApi<EvidenceItem>(`/cases/${caseId}/evidence/${evidenceId}`, {
    method: "DELETE",
  });
}
