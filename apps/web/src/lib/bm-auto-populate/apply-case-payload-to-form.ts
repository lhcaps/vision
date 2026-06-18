// Central adapter: CasePayload + targets -> updated form.
//
// This is the only place that knows how to merge a case payload into a
// BM form. Per-BM modules (`bm039-case-defaults`,
// `generic-case-defaults`, future ones) call into this adapter
// instead of reimplementing the merge rules.
//
// Two form shapes are supported:
//   - nested: `Record<section, Record<field, string>>` (most BMs)
//   - flat:   `Record<field, string>` (BM-070, 071, 090, 172, ...)
//
// Merge contract (in priority order, lowest -> highest):
//   1. existing form value (already in the form, possibly user-edited)
//   2. case-derived value (resolved from CasePayload)
//   3. overwrite flag (when true, the case value always wins)
//
// Empty case values never clobber a populated form value, matching
// the requirement DOCX: "data may be prefilled but must not be
// hard-patched so Save/render keeps stale data".

import { resolveCaseField } from "./case-field-resolver";
import type { CaseFieldName } from "./case-field-resolver";
import type { CasePayload } from "../case-payload-normalizer";
import type { FieldTarget } from "./bm-field-map";

export type ApplyCasePayloadOptions<TForm> = {
  form: TForm;
  casePayload: CasePayload | null | undefined;
  targets: readonly FieldTarget<string, string>[];
  overwrite?: boolean;
};

export type ApplyCasePayloadResult<TForm> = {
  form: TForm;
  appliedFields: string[];
};

export type FlatFieldTarget<F extends string = string> = {
  field: F;
  from: CaseFieldName;
  transform?: "upper" | "trim" | "formatVnDate";
};

export type ApplyCasePayloadToFlatOptions = {
  form: Record<string, string>;
  casePayload: CasePayload | null | undefined;
  targets: readonly FlatFieldTarget<string>[];
  overwrite?: boolean;
};

export type ApplyCasePayloadToFlatResult = {
  form: Record<string, string>;
  appliedFields: string[];
};

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function transformValue(value: string, transform: FieldTarget<string, string>["transform"]): string {
  if (!value) return "";

  if (transform === "upper") {
    return value.toLocaleUpperCase("vi-VN");
  }

  if (transform === "formatVnDate") {
    return formatIsoToVnDisplayDate(value);
  }

  if (transform === "trim") {
    return value.trim();
  }

  return value;
}

function formatIsoToVnDisplayDate(value: string): string {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/u.exec(value.trim());
  if (!match) return value;
  const day = match[3].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  return `${day}/${month}/${match[1]}`;
}

function readField(form: unknown, section: string, field: string): string {
  if (!form || typeof form !== "object") return "";

  const sections = (form as Record<string, unknown>)[section];
  if (!sections || typeof sections !== "object") return "";

  const value = (sections as Record<string, unknown>)[field];
  return text(value);
}

function writeField(
  form: Record<string, Record<string, unknown>>,
  section: string,
  field: string,
  value: string,
) {
  if (!form[section] || typeof form[section] !== "object") {
    form[section] = {};
  }

  form[section][field] = value;
}

/**
 * Applies a list of case-derived targets to a form, honoring the
 * priority rule "case value wins only when the form is empty or
 * `overwrite` is set".
 *
 * The input form is treated as a `Record<string, Record<string, unknown>>`
 * shape (a sections-of-fields object) which matches every existing BM
 * in this repo. Per-BM modules that need stricter typing can wrap this
 * helper and project the result back into their typed shape - the
 * test suite proves the wire format is correct.
 */
export function applyCasePayloadToForm<TForm extends Record<string, Record<string, unknown>>>(
  options: ApplyCasePayloadOptions<TForm>,
): ApplyCasePayloadResult<TForm> {
  const { form, casePayload, targets, overwrite = false } = options;
  const appliedFields: string[] = [];

  // Always clone section-by-section to avoid mutating React state in
  // place. Use a structured clone that preserves unknown keys.
  const nextForm = { ...form } as Record<string, Record<string, unknown>>;
  for (const section of Object.keys(form)) {
    nextForm[section] = { ...form[section] };
  }

  if (!casePayload || targets.length === 0) {
    return { form: nextForm as TForm, appliedFields };
  }

  for (const target of targets) {
    const resolvedRaw = resolveCaseField(target.from, casePayload);
    const resolved = transformValue(resolvedRaw, target.transform);

    if (!resolved) continue;

    const current = readField(nextForm, target.section, target.field);
    if (current.length > 0 && !overwrite) continue;

    writeField(nextForm, target.section, target.field, resolved);
    appliedFields.push(`${target.section}.${target.field}`);
  }

  return { form: nextForm as TForm, appliedFields };
}

/**
 * Same merge contract as `applyCasePayloadToForm`, but for the flat
 * form shape used by a handful of bespoke BMs (e.g. BM-070, BM-071,
 * BM-090, BM-172). The form is treated as a `Record<field, string>`
 * and the target's `field` is the top-level key.
 */
export function applyCasePayloadToFlatForm(
  options: ApplyCasePayloadToFlatOptions,
): ApplyCasePayloadToFlatResult {
  const { form, casePayload, targets, overwrite = false } = options;
  const appliedFields: string[] = [];

  const nextForm: Record<string, string> = { ...form };

  if (!casePayload || targets.length === 0) {
    return { form: nextForm, appliedFields };
  }

  for (const target of targets) {
    const resolvedRaw = resolveCaseField(target.from, casePayload);
    const resolved = transformValue(resolvedRaw, target.transform);

    if (!resolved) continue;

    const current = text(nextForm[target.field]);
    if (current.length > 0 && !overwrite) continue;

    nextForm[target.field] = resolved;
    appliedFields.push(target.field);
  }

  return { form: nextForm, appliedFields };
}
