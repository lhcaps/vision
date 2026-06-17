/**
 * API cho /cases/:caseId detail page.
 *
 * `getCaseDetail` gọi `GET /cases/:id` (đã có sẵn) — backend `findOne` trả
 * về payload đầy đủ: thông tin case + people + offenses + assignments +
 * evidence + recentGeneratedDocuments + events.
 */

import { readApi } from "./api-client";

import type {
  CaseAssignment,
  CaseOffense,
  CasePerson,
  EvidenceItem,
} from "./cases-api";

export type CaseEvent = {
  id: string;
  eventType: string;
  eventTitle: string;
  eventDescription: string | null;
  stageCode: string | null;
  statusBefore: string | null;
  statusAfter: string | null;
  eventDate: string;
  relatedPersonId: string | null;
  createdByName: string | null;
};

export type RecentGeneratedDocument = {
  id: string;
  templateId: string;
  documentCode: string | null;
  documentTitle: string;
  targetScope: string;
  targetPersonId: string | null;
  reviewStatus: string;
  generatedAt: string;
  approvedAt: string | null;
};

export type CaseDetail = {
  id: string;
  caseCode: string;
  nationalCaseCode: string | null;
  caseTitle: string;
  caseSummary: string | null;
  caseType: string;
  sourceType: string | null;
  currentStage: string;
  currentStatus: string;
  wardId: string | null;
  agencyId: string | null;
  receivedDate: string | null;
  acceptedDate: string | null;
  prosecutedDate: string | null;
  closedDate: string | null;
  priority: string;
  note: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
  people: CasePerson[];
  offenses: CaseOffense[];
  assignments: CaseAssignment[];
  evidence: EvidenceItem[];
  recentGeneratedDocuments: RecentGeneratedDocument[];
  events: CaseEvent[];
};

export function getCaseDetail(caseId: string): Promise<CaseDetail> {
  return readApi<CaseDetail>(`/cases/${caseId}`, { noStore: true });
}
