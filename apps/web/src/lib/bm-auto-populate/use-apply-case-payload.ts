// React hook wrapper around the central adapter for BM form panels.
//
// Two variants are exported:
//   - `useApplyCasePayloadToForm` for nested forms (`Record<section, Record<field, string>>`)
//   - `useApplyCasePayloadToFlatForm` for flat forms (`Record<field, string>`)
//
// Both return a tuple of [applyFromCase, hasCasePayload] where the
// first item is a memoized callback that merges a `CasePayload` into
// the current form using the BM-specific `BM_FIELD_MAP` /
// `BM_FLAT_FIELD_MAP` targets. The hook is intentionally cheap: it
// only resolves the payload once and only recomputes the callback
// when the template code changes.

"use client";

import { useCallback, useMemo } from "react";

import { useCasePayload } from "../case-payload-context";
import {
  applyCasePayloadToForm,
  applyCasePayloadToFlatForm,
  type ApplyCasePayloadResult,
  type ApplyCasePayloadToFlatResult,
} from "./apply-case-payload-to-form";
import {
  getBmFieldMap,
  getBmFlatFieldMap,
  isIntentionallyNoAutofill,
} from "./bm-field-map";

export type UseApplyCasePayloadResult<TForm> = readonly [
  apply: (form: TForm, options?: { overwrite?: boolean }) => ApplyCasePayloadResult<TForm>,
  hasCasePayload: boolean,
];

export type UseApplyCasePayloadToFlatResult = readonly [
  apply: (form: Record<string, string>, options?: { overwrite?: boolean }) => ApplyCasePayloadToFlatResult,
  hasCasePayload: boolean,
];

export function useApplyCasePayloadToForm<TForm>(
  templateCode: string,
): UseApplyCasePayloadResult<TForm> {
  const casePayload = useCasePayload();
  const targets = useMemo(() => getBmFieldMap(templateCode), [templateCode]);

  const apply = useCallback(
    (form: TForm, options: { overwrite?: boolean } = {}): ApplyCasePayloadResult<TForm> => {
      const next = applyCasePayloadToForm({
        form: form as unknown as Record<string, Record<string, unknown>>,
        casePayload,
        targets,
        overwrite: options.overwrite,
      });
      return next as unknown as ApplyCasePayloadResult<TForm>;
    },
    [casePayload, targets],
  );

  return [apply, casePayload != null && targets.length > 0 && !isIntentionallyNoAutofill(templateCode)] as const;
}

export function useApplyCasePayloadToFlatForm(
  templateCode: string,
): UseApplyCasePayloadToFlatResult {
  const casePayload = useCasePayload();
  const targets = useMemo(() => getBmFlatFieldMap(templateCode), [templateCode]);

  const apply = useCallback(
    (form: Record<string, string>, options: { overwrite?: boolean } = {}): ApplyCasePayloadToFlatResult => {
      return applyCasePayloadToFlatForm({
        form,
        casePayload,
        targets,
        overwrite: options.overwrite,
      });
    },
    [casePayload, targets],
  );

  return [apply, casePayload != null && targets.length > 0 && !isIntentionallyNoAutofill(templateCode)] as const;
}
