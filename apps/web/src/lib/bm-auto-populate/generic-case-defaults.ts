// Per-BM adapter for the 83 generic wrapper BMs that share
// `GenericTemplateFormInputsPanel`. The 5-section shape is fixed:
// agency / document / caseInfo / content / recipients / signature.

import { applyCasePayloadToForm } from "./apply-case-payload-to-form";
import type { CasePayload } from "../case-payload-normalizer";
import type { FieldTarget } from "./bm-field-map";

export type GenericCaseFormInputs = {
  agency: Record<string, string>;
  document: Record<string, string>;
  caseInfo: Record<string, string>;
  content: Record<string, string>;
  recipients: Record<string, string>;
  signature: Record<string, string>;
};

export type ApplyCasePayloadToGenericFormOptions = {
  form: GenericCaseFormInputs;
  casePayload: CasePayload | null | undefined;
  overwrite?: boolean;
};

export type ApplyCasePayloadToGenericFormResult = {
  form: GenericCaseFormInputs;
  appliedFields: string[];
};

// Single source of truth for the generic panel's case-derived fields.
// Mirrors the field set that was hand-coded in this module before the
// central adapter existed; existing tests depend on these targets.
const GENERIC_TARGETS: FieldTarget<string, string>[] = [
  { section: "agency", field: "parentName", from: "agency.parentName" },
  { section: "agency", field: "name", from: "agency.name" },
  { section: "caseInfo", field: "caseCode", from: "case.code" },
  { section: "caseInfo", field: "caseTitle", from: "case.title" },
  { section: "caseInfo", field: "accusedName", from: "person.fullName" },
  { section: "caseInfo", field: "offenseName", from: "offense.name" },
  { section: "caseInfo", field: "legalArticle", from: "offense.legalArticle" },
  { section: "content", field: "summaryLine", from: "case.summary" },
  { section: "signature", field: "signerName", from: "assignment.official.fullName" },
];

export function applyCasePayloadToGenericForm({
  form,
  casePayload,
  overwrite = false,
}: ApplyCasePayloadToGenericFormOptions): ApplyCasePayloadToGenericFormResult {
  const result = applyCasePayloadToForm({
    form: form as unknown as Record<string, Record<string, unknown>>,
    casePayload,
    targets: GENERIC_TARGETS,
    overwrite,
  });
  return {
    form: result.form as unknown as GenericCaseFormInputs,
    appliedFields: result.appliedFields,
  };
}
