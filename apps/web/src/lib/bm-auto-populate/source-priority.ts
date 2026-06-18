// Priority rules for BM form input sources.
//
// Per the audit-corrected PLAN, every BM form must fill its inputs in
// this order, from lowest to highest priority:
//
//   1. empty defaults  - the form's own `EMPTY_FORM` constant
//   2. case-derived    - values resolved from the case payload
//   3. saved inputs    - form inputs the user has already persisted
//   4. user edits      - in-flight form state from React
//
// A higher-priority source overrides a lower-priority source only when
// it has a non-empty value. Empty is a valid "I have not filled this
// field" signal and must not be used to clear a populated value.

export type FieldSource = "default" | "case" | "saved" | "user";

export type MergedField = {
  value: string;
  source: FieldSource;
};

/**
 * Merges two field values using priority: `incoming` wins when it is
 * non-empty, otherwise `existing` is preserved. The returned `source`
 * describes which input won.
 */
export function mergeByPriority(
  existing: MergedField,
  incoming: MergedField,
): MergedField {
  if (incoming.value.length > 0) {
    return incoming;
  }

  return existing;
}

/**
 * Applies a series of merges in order. Useful when iterating over the
 * priority stack:
 *
 *   applyPriorityStack([
 *     { value: "", source: "default" },
 *     { value: resolveCaseField(...), source: "case" },
 *     { value: savedInputs.accusedName, source: "saved" },
 *     { value: currentUserEdit, source: "user" },
 *   ])
 *
 * Empty values in higher-priority layers do not clobber populated
 * lower-priority layers.
 */
export function applyPriorityStack(layers: MergedField[]): MergedField {
  if (layers.length === 0) {
    return { value: "", source: "default" };
  }

  return layers.reduce<MergedField>(mergeByPriority, {
    value: "",
    source: "default",
  });
}
