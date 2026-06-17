"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Phase 1 — Case payload context (foundation for BM auto-populate).
 *
 * Exposes the render-payload data (case + people + offenses + assignments)
 * via React context so any BM form panel can read it via `useCasePayload()`
 * without prop drilling. Provider is mounted by `GeneratedDocumentWorkspace`.
 *
 * Data shape mirrors `GET /documents/generated/:documentId/render-payload`.
 * Optional everywhere because payload is still loading or generic.
 */

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

const CasePayloadContext = createContext<CasePayload | null>(null);

export function CasePayloadProvider({
  value,
  children,
}: {
  value: CasePayload;
  children: ReactNode;
}) {
  return (
    <CasePayloadContext.Provider value={value}>
      {children}
    </CasePayloadContext.Provider>
  );
}

/**
 * Returns the current case payload, or null if rendered outside a
 * CasePayloadProvider (e.g. tests, standalone preview). Phase 2-3 will
 * gate the "Lấy từ vụ án" button on a non-null result.
 */
export function useCasePayload(): CasePayload | null {
  return useContext(CasePayloadContext);
}
