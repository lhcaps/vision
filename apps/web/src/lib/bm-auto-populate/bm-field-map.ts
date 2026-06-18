// BM field map registry.
//
// Each entry tells the central adapter:
//   - which (section, field) on a BM form should receive a value
//   - which case field (resolved by `case-field-resolver`) feeds it
//   - an optional transform (e.g. uppercase the agency name)
//
// New BMs add an entry here without touching any form code. Existing
// BMs that do not declare a mapping fall back to the legacy
// per-BM adapter (e.g. `bm039-case-defaults`, `generic-case-defaults`)
// until they migrate.

import type { CaseFieldName } from "./case-field-resolver";
import type { FlatFieldTarget } from "./apply-case-payload-to-form";

export type FieldTarget<S extends string, F extends string> = {
  section: S;
  field: F;
  from: CaseFieldName;
  transform?: "upper" | "trim" | "formatVnDate";
};

export type BmFieldMap = Record<string, FieldTarget<string, string>[]>;
export type BmFlatFieldMap = Record<string, FlatFieldTarget<string>[]>;

/**
 * Mapping for the canonical 17 bespoke BMs called out in the
 * `bm-specific-panel-patterns` audit. These all share the same case
 * fields; per-BM transform differences are applied via `transform`.
 *
 * Format: each entry is `[templateCode, [...targets]]` so editors can
 * keep the list grouped and review-friendly.
 */
export const BM_FIELD_MAP: BmFieldMap = Object.freeze({
  "BM-001": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "informant", field: "fullName", from: "person.fullName" },
    { section: "informant", field: "currentAddress", from: "person.currentAddress" },
    { section: "reception", field: "locationName", from: "agency.address" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "reception", field: "startedAtDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  "BM-002": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "reporter", field: "fullName", from: "person.fullName" },
    { section: "reporter", field: "permanentResidence", from: "person.residenceAddress" },
    { section: "reporter", field: "currentResidence", from: "person.currentAddress" },
    { section: "sourceReport", field: "receivedDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  "BM-003": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceAssignment", field: "caseSummary", from: "case.summary" },
    { section: "sourceAssignment", field: "prosecutorName", from: "assignment.official.fullName" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-005": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceVerification", field: "reasonLine", from: "case.summary" },
    { section: "receiver", field: "fullName", from: "assignment.official.fullName" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-006": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceRequest", field: "caseSummary", from: "case.summary" },
    { section: "sourceRequest", field: "receiverName", from: "assignment.official.fullName" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-008": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceTransfer", field: "caseSummary", from: "case.summary" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-010": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceSuspension", field: "caseSummary", from: "case.summary" },
    { section: "sourceSuspension", field: "receivedDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-012": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceRecovery", field: "caseSummary", from: "case.summary" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-039": [
    { section: "agency", field: "parentNameUpper", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "nameUpper", from: "agency.name", transform: "upper" },
    { section: "detentionArrest", field: "accusedName", from: "person.fullName" },
    { section: "detentionArrest", field: "birthYear", from: "person.birthYear" },
    { section: "detentionArrest", field: "permanentAddress", from: "person.residenceAddress" },
    { section: "detentionArrest", field: "currentAddress", from: "person.currentAddress" },
    { section: "detentionArrest", field: "offenseName", from: "offense.name" },
    { section: "detentionArrest", field: "legalArticle", from: "offense.legalArticle" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-053": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "person", field: "fullName", from: "person.fullName" },
    { section: "person", field: "currentAddress", from: "person.currentAddress" },
    { section: "person", field: "permanentAddress", from: "person.residenceAddress" },
    { section: "offense", field: "offenseName", from: "offense.name" },
    { section: "offense", field: "legalArticle", from: "offense.legalArticle" },
    { section: "caseDecision", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  "BM-097": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "person", field: "fullName", from: "person.fullName" },
    { section: "person", field: "currentAddress", from: "person.currentAddress" },
    { section: "person", field: "permanentAddress", from: "person.residenceAddress" },
    { section: "offense", field: "offenseName", from: "offense.name" },
    { section: "offense", field: "legalArticle", from: "offense.legalArticle" },
    { section: "caseDecision", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  "BM-148": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "helper", field: "offenseName", from: "offense.name" },
    { section: "helper", field: "legalArticle", from: "offense.legalArticle" },
    { section: "helper", field: "caseTitle", from: "case.title" },
    { section: "caseDecision", field: "decisionDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "accusedDecision", field: "decisionDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  "BM-156": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "caseInfo", field: "accusedName", from: "person.fullName" },
    { section: "caseInfo", field: "offenseName", from: "offense.name" },
    { section: "caseInfo", field: "legalArticle", from: "offense.legalArticle" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  "BM-166": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "returnInvestigation", field: "caseTitle", from: "case.title" },
    { section: "returnInvestigation", field: "offenseName", from: "offense.name" },
    { section: "returnInvestigation", field: "legalArticle", from: "offense.legalArticle" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  "BM-169": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "caseDecision", field: "decisionDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "accusedDecision", field: "decisionDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "accusedDecision", field: "accusedName", from: "person.fullName" },
  ],
  "BM-171": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "caseDecision", field: "decisionDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "accusedDecision", field: "decisionDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "accusedDecision", field: "accusedName", from: "person.fullName" },
  ],
  "BM-172": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "caseInfo", field: "crimeName", from: "offense.name" },
    { section: "caseInfo", field: "crimeArticle", from: "offense.legalArticle" },
    { section: "caseInfo", field: "caseInitiationDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "defendantInfo", field: "defendantName", from: "person.fullName" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  "BM-173": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "evidenceTransfer", field: "offenseName", from: "offense.name" },
    { section: "evidenceTransfer", field: "caseTitle", from: "case.title" },
    { section: "evidenceTransfer", field: "prosecutionDecisionDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
  // ---------------------------------------------------------------------
  // Batch 3 (added 2026-06-18): 20 nested forms that share the bespoke
  // agency + signature + document shape. Only the lowest-risk fields
  // are mapped: agency name (uppercased), signer name, document issue
  // date in `dd/MM/yyyy`. Per-section `caseSummary` and `receivedDate`
  // are added where the form has a stable, well-named slot to receive
  // them so we never overwrite user-edited text.
  // ---------------------------------------------------------------------
  "BM-007": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceMaterialRequest", field: "caseSummary", from: "case.summary" },
    { section: "document", field: "issueDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-009": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceResolutionExtension", field: "caseSummary", from: "case.summary" },
    { section: "document", field: "issueDateIso", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-011": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceSuspensionCancellation", field: "caseSummary", from: "case.summary" },
    { section: "document", field: "issueDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-014": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceDirectInspection", field: "inspectedAgency", from: "agency.name" },
    { section: "document", field: "issueDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-015": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceDirectInspectionPlan", field: "inspectedAgency", from: "agency.name" },
    { section: "document", field: "issueDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-016": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceDirectInspectionConclusion", field: "inspectedAgency", from: "agency.name" },
    { section: "document", field: "issueDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-017": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "caseInitiationRequest", field: "incidentSummary", from: "case.summary" },
    { section: "caseInitiationRequest", field: "offenseName", from: "offense.name" },
    { section: "caseInitiationRequest", field: "legalArticle", from: "offense.legalArticle" },
    { section: "document", field: "issueDateIso", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-018": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "caseInitiationChangeRequest", field: "currentOffenseName", from: "offense.name" },
    { section: "caseInitiationChangeRequest", field: "newOffenseName", from: "offense.name" },
    { section: "caseInitiationChangeRequest", field: "currentOffenseLegalLine", from: "offense.legalArticle" },
    { section: "caseInitiationChangeRequest", field: "newOffenseLegalLine", from: "offense.legalArticle" },
    { section: "document", field: "issueDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-023": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "crimeReport", field: "content", from: "case.summary" },
    { section: "case", field: "caseTitle", from: "case.title" },
    { section: "case", field: "caseSummary", from: "case.summary" },
    { section: "offense", field: "offenseName", from: "offense.name" },
    { section: "offense", field: "legalArticle", from: "offense.legalArticle" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-030": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "sourceResolutionNotice", field: "caseSummary", from: "case.summary" },
    { section: "sourceResolutionNotice", field: "sourceProviderName", from: "agency.name" },
    { section: "document", field: "issueDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-031": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "principal", field: "personName", from: "person.fullName" },
    { section: "principal", field: "investigationAuthorityName", from: "agency.name" },
    { section: "offense", field: "offenseName", from: "offense.name" },
    { section: "offense", field: "legalArticle", from: "offense.legalArticle" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-033": [
    { section: "agency", field: "parentNameUpper", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "nameUpper", from: "agency.name", transform: "upper" },
    { section: "investigation", field: "accusedName", from: "person.fullName" },
    { section: "investigation", field: "offenseName", from: "offense.name" },
    { section: "investigation", field: "legalArticle", from: "offense.legalArticle" },
    { section: "custody", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-037": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "principal", field: "accusedName", from: "person.fullName" },
    { section: "principal", field: "personName", from: "person.fullName" },
    { section: "principal", field: "investigationAuthorityName", from: "agency.name" },
    { section: "offense", field: "offenseName", from: "offense.name" },
    { section: "offense", field: "legalArticle", from: "offense.legalArticle" },
    { section: "caseDecision", field: "decisionDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-038": [
    { section: "agency", field: "parentNameUpper", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "nameUpper", from: "agency.name", transform: "upper" },
    { section: "person", field: "fullName", from: "person.fullName" },
    { section: "offense", field: "offenseName", from: "offense.name" },
    { section: "offense", field: "legalArticle", from: "offense.legalArticle" },
    { section: "arrestNonApproval", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-040": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "principal", field: "accusedName", from: "person.fullName" },
    { section: "offense", field: "offenseName", from: "offense.name" },
    { section: "offense", field: "legalArticle", from: "offense.legalArticle" },
    { section: "caseDecision", field: "decisionDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-042": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "measure", field: "accusedName", from: "person.fullName" },
    { section: "measure", field: "offenseName", from: "offense.name" },
    { section: "measure", field: "legalArticle", from: "offense.legalArticle" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-043": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "measure", field: "accusedName", from: "person.fullName" },
    { section: "measure", field: "offenseName", from: "offense.name" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-044": [
    { section: "agency", field: "parentNameUpper", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "nameUpper", from: "agency.name", transform: "upper" },
    { section: "detentionReplacement", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-141": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "prosecutionTransfer", field: "fromProcuracyName", from: "agency.name" },
    { section: "prosecutionTransfer", field: "toProcuracyName", from: "agency.name" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-144": [
    { section: "agency", field: "parentName", from: "agency.parentName", transform: "upper" },
    { section: "agency", field: "name", from: "agency.name", transform: "upper" },
    { section: "prosecutionExtension", field: "fromDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "prosecutionExtension", field: "toDateText", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "document", field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { section: "signature", field: "signerName", from: "assignment.official.fullName" },
  ],
});

/**
 * Mapping for the 4 bespoke BMs that use a flat form shape
 * (e.g. `agencyParentName`, `signerName` as top-level keys rather
 * than nested under `agency`/`signature`).
 *
 * These cannot share `BM_FIELD_MAP` because their state is flat.
 * The flat adapter (`applyCasePayloadToFlatForm`) reads from this
 * registry. All 4 forms share the same agency-name + signer + case
 * fields, so the entries are intentionally similar.
 */
export const BM_FLAT_FIELD_MAP: BmFlatFieldMap = Object.freeze({
  "BM-070": [
    { field: "agencyParentName", from: "agency.parentName", transform: "upper" },
    { field: "agencyName", from: "agency.name", transform: "upper" },
    { field: "offenseName", from: "offense.name" },
    { field: "legalArticle", from: "offense.legalArticle" },
    { field: "caseDecisionIssueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-071": [
    { field: "agencyParentName", from: "agency.parentName", transform: "upper" },
    { field: "agencyName", from: "agency.name", transform: "upper" },
    { field: "offenseName", from: "offense.name" },
    { field: "legalArticle", from: "offense.legalArticle" },
    { field: "caseDecisionIssueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { field: "assignedOfficerName", from: "assignment.official.fullName" },
    { field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-090": [
    { field: "agencyParentName", from: "agency.parentName", transform: "upper" },
    { field: "agencyName", from: "agency.name", transform: "upper" },
    { field: "accusedName", from: "person.fullName" },
    { field: "offenseName", from: "offense.name" },
    { field: "legalArticle", from: "offense.legalArticle" },
    { field: "caseDecisionIssueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { field: "accusedDecisionIssueDate", from: "case.receivedDate", transform: "formatVnDate" },
    { field: "signerName", from: "assignment.official.fullName" },
  ],
  "BM-172": [
    { field: "issuingAgencyParent", from: "agency.parentName", transform: "upper" },
    { field: "issuingAgency", from: "agency.name", transform: "upper" },
    { field: "crimeName", from: "offense.name" },
    { field: "crimeArticle", from: "offense.legalArticle" },
    { field: "caseInitiationDate", from: "case.receivedDate", transform: "formatVnDate" },
    { field: "defendantName", from: "person.fullName" },
    { field: "issueDate", from: "case.receivedDate", transform: "formatVnDate" },
  ],
});

/**
 * Targets shared by all 83 generic wrapper BMs. The
 * `GenericTemplateFormInputsPanel` already uses the same 5-section
 * shape, so a single entry list covers all of them. We keep it as a
 * shared list (not a per-BM record) so the audit can report coverage
 * by counting callers without inflating the registry.
 */
export const GENERIC_FIELD_MAP: readonly FieldTarget<string, string>[] = Object.freeze([
  { section: "agency", field: "parentName", from: "agency.parentName" },
  { section: "agency", field: "name", from: "agency.name" },
  { section: "caseInfo", field: "caseCode", from: "case.code" },
  { section: "caseInfo", field: "caseTitle", from: "case.title" },
  { section: "caseInfo", field: "accusedName", from: "person.fullName" },
  { section: "caseInfo", field: "offenseName", from: "offense.name" },
  { section: "caseInfo", field: "legalArticle", from: "offense.legalArticle" },
  { section: "content", field: "summaryLine", from: "case.summary" },
  { section: "signature", field: "signerName", from: "assignment.official.fullName" },
]);

/**
 * Returns the per-BM bespoke mapping if one is registered, otherwise
 * an empty list. Callers (form panels) decide themselves whether they
 * are a generic wrapper or a specific BM, and pass the right targets
 * to `applyCasePayloadToForm`.
 */
export function getBmFieldMap(templateCode: string): readonly FieldTarget<string, string>[] {
  return BM_FIELD_MAP[templateCode] ?? [];
}

export function getBmFlatFieldMap(templateCode: string): readonly FlatFieldTarget<string>[] {
  return BM_FLAT_FIELD_MAP[templateCode] ?? [];
}

/**
 * Template codes for which the BESPOKE form intentionally does NOT
 * receive any case-payload field. The form panel may still render the
 * case-payload button (for visual consistency) but the adapter will
 * no-op because the mapping is empty. This is the canonical
 * "skip-this-BM" registry - the audit script treats these as covered.
 */
export const INTENTIONALLY_NO_AUTOFILL: ReadonlySet<string> = new Set([
  // Phase 1: forms whose data comes from sources other than the case
  // (e.g. system-level metadata, free-text decisions) - the BESPOKE UI
  // shows the button for consistency but the case has nothing useful
  // to push. The owning team must replace each entry with a real
  // mapping once case-payload coverage is extended. Remove the entry
  // (and ideally add a real mapping) when the form is migrated.
  "BM-004",
  "BM-013",
  "BM-019",
  "BM-020",
  "BM-029",
  "BM-047",
  "BM-072",
  "BM-074",
  "BM-078",
  "BM-081",
  "BM-083",
  "BM-085",
  "BM-087",
  "BM-088",
  "BM-089",
  "BM-091",
  "BM-092",
  "BM-093",
  "BM-094",
  "BM-095",
  "BM-096",
  "BM-098",
  "BM-099",
  "BM-100",
  "BM-101",
  "BM-102",
]);

export function isIntentionallyNoAutofill(templateCode: string): boolean {
  return INTENTIONALLY_NO_AUTOFILL.has(templateCode);
}
