// Per-BM adapter for BM-039.
//
// BM-039 has a few quirks the central adapter doesn't cover yet:
//   - `agency.parentNameUpper` / `agency.nameUpper` need uppercase
//     (handled by the central adapter's `transform: "upper"`)
//   - `detentionArrest.birthYear` is a string but the payload returns
//     a number
//   - `signature.positionTitle` is a free text override, not a case
//     field
//   - We do not auto-apply the case payload to `procedureArticlesLine`
//     or `juvenileJusticeLine` - those are legal text the user authors
//
// The list of auto-applied fields is declared in `BM-039_TARGETS` and
// feeds into the central `applyCasePayloadToForm`. Adding or removing
// a field there is the only change needed when a new case field
// becomes available.

import { applyCasePayloadToForm } from "./apply-case-payload-to-form";
import { resolveCaseField, type CaseFieldName } from "./case-field-resolver";
import type { CasePayload } from "../case-payload-normalizer";
export type Bm039CaseFormInputs = {
  agency: {
    parentNameUpper: string;
    nameUpper: string;
    issuePlace: string;
  };
  document: {
    issueDate: string;
    issuePlaceAndDateLine: string;
  };
  detentionArrest: {
    accusedName: string;
    birthYear: string;
    permanentAddress: string;
    currentAddress: string;
    offenseName: string;
    legalArticle: string;
    investigationAgency: string;
  };
  recipients: {
    personLine: string;
  };
  signature: {
    signerName: string;
    positionTitle: string;
  };
};

export type ApplyCasePayloadToBm039FormOptions<TForm extends Bm039CaseFormInputs> = {
  form: TForm;
  casePayload: CasePayload | null | undefined;
  defaultForm?: Bm039CaseFormInputs;
  overwrite?: boolean;
};

export type ApplyCasePayloadToBm039FormResult<TForm extends Bm039CaseFormInputs> = {
  form: TForm;
  appliedFields: string[];
};

// The central adapter handles the priority rule, so the BM-039 list is
// just (section, field, source-field, optional transform).
type Bm039Target = {
  section: string;
  field: string;
  from: CaseFieldName;
  transform?: "upper";
};

const BM_039_TARGETS: Bm039Target[] = [
  { section: "agency", field: "parentNameUpper", from: "agency.parentName", transform: "upper" },
  { section: "agency", field: "nameUpper", from: "agency.name", transform: "upper" },
  { section: "detentionArrest", field: "accusedName", from: "person.fullName" },
  { section: "detentionArrest", field: "birthYear", from: "person.birthYear" },
  { section: "detentionArrest", field: "permanentAddress", from: "person.residenceAddress" },
  { section: "detentionArrest", field: "currentAddress", from: "person.currentAddress" },
  { section: "detentionArrest", field: "offenseName", from: "offense.name" },
  { section: "detentionArrest", field: "legalArticle", from: "offense.legalArticle" },
  { section: "signature", field: "signerName", from: "assignment.official.fullName" },
];

function text(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function fieldValue(
  form: Bm039CaseFormInputs | undefined,
  section: keyof Bm039CaseFormInputs,
  field: string,
): string {
  if (!form) return "";

  const group = form[section] as unknown as Record<string, string | undefined>;
  return text(group[field]);
}

/**
 * Returns true when the current form value equals the empty/default
 * value, so case-derived data is allowed to fill it in even when the
 * form was already populated by the empty-form default.
 */
function isAtDefaultValue(
  form: Bm039CaseFormInputs,
  defaultForm: Bm039CaseFormInputs | undefined,
  section: keyof Bm039CaseFormInputs,
  field: string,
): boolean {
  const current = fieldValue(form, section, field);
  const fallback = fieldValue(defaultForm, section, field);

  return fallback.length > 0 && current === fallback;
}

export function applyCasePayloadToBm039Form<TForm extends Bm039CaseFormInputs>({
  form,
  casePayload,
  defaultForm,
  overwrite = false,
}: ApplyCasePayloadToBm039FormOptions<TForm>): ApplyCasePayloadToBm039FormResult<TForm> {
  // Run the central adapter first. It already enforces the priority
  // rule "don't clobber a populated value unless overwrite".
  const baseResult = applyCasePayloadToForm({
    form: form as unknown as Record<string, Record<string, unknown>>,
    casePayload,
    targets: BM_039_TARGETS,
    overwrite,
  });
  // Then handle the BM-039-specific rule: if the form value is still
  // the empty/default placeholder, the central adapter skipped it
  // (because the value was non-empty). We allow case-derived data to
  // replace placeholder values even when `overwrite` is false.
  const nextForm = { ...baseResult.form } as Record<string, Record<string, unknown>>;
  const appliedFields = [...baseResult.appliedFields];

  if (casePayload) {
    for (const target of BM_039_TARGETS) {
      const key = `${target.section}.${target.field}`;
      if (appliedFields.includes(key)) continue;

      const current = fieldValue(form, target.section as keyof Bm039CaseFormInputs, target.field);
      if (
        current.length > 0 &&
        !overwrite &&
        !isAtDefaultValue(
          form as Bm039CaseFormInputs,
          defaultForm,
          target.section as keyof Bm039CaseFormInputs,
          target.field,
        )
      ) {
        continue;
      }

      if (
        current.length === 0 ||
        overwrite ||
        isAtDefaultValue(
          form as Bm039CaseFormInputs,
          defaultForm,
          target.section as keyof Bm039CaseFormInputs,
          target.field,
        )
      ) {
        const resolved = resolveCaseField(target.from as CaseFieldName, casePayload);
        if (!resolved) continue;

        const transformed = target.transform === "upper"
          ? resolved.toLocaleUpperCase("vi-VN")
          : resolved;
        if (!transformed) continue;

        if (!nextForm[target.section] || typeof nextForm[target.section] !== "object") {
          nextForm[target.section] = {};
        }
        (nextForm[target.section] as Record<string, unknown>)[target.field] = transformed;
        appliedFields.push(key);
      }
    }
  }

  return { form: nextForm as unknown as TForm, appliedFields };
}
