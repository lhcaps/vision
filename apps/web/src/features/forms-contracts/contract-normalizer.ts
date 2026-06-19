/**
 * Phase D — Pure normalization utilities for form contracts.
 *
 * These functions are safe to use on both server and client sides
 * because they operate on in-memory objects, not the filesystem.
 *
 * The actual file loading (Node.js `fs`) lives in the API service.
 */

import type {
  FormContract,
  LoadedFormContract,
  FormCatalogItem,
  FormCatalogQuery,
} from "./contract-types";
import { getStageForBm } from "./contract-types";

const GENERIC_FIELD_PATTERN = /^\w+\.field\d+$/i;

/**
 * Normalize a raw `FormContract` into a `LoadedFormContract`.
 * This function does NOT mutate the input contract.
 */
export function normalizeContract(contract: FormContract): LoadedFormContract {
  const slots = contract.docxSlots ?? [];
  const fields = contract.canonicalFields ?? [];

  const genericFieldCount = slots.filter(
    (s) => GENERIC_FIELD_PATTERN.test(s.slotId),
  ).length;

  const fieldsNeedingReviewCount = fields.filter(
    (f) => f.source === "unknown" || GENERIC_FIELD_PATTERN.test(f.path),
  ).length;

  const needsReview = genericFieldCount > 0 || fieldsNeedingReviewCount > 0;

  const stage = getStageForBm(contract.templateCode);

  return {
    sourceId: contract.sourceId,
    templateCode: contract.templateCode,
    title: contract.templateTitle,
    status: contract.status,
    documentKind: "form",
    stage: stage
      ? { code: stage.code, label: stage.label }
      : undefined,
    docxSlots: slots,
    canonicalFields: fields,
    renderBindings: contract.renderBindings ?? [],
    formInputHints: contract.formInputHints,
    renderFormatHints: contract.renderFormatHints,
    reportingHints: contract.reportingHints,
    runtimeEligible: contract.status === "locked",
    needsReview,
    genericFieldCount,
    fieldsNeedingReviewCount,
    lockedAt: contract.lockedAt,
  };
}

/**
 * Build the form catalog from loaded contracts.
 * Supports filtering by stage, search query, and status.
 */
export function buildFormCatalog(
  contracts: LoadedFormContract[],
  query: FormCatalogQuery = {},
): FormCatalogItem[] {
  let items: FormCatalogItem[] = contracts.map((c) => ({
    sourceId: c.sourceId,
    templateCode: c.templateCode,
    title: c.title,
    stageCode: c.stage?.code,
    stageLabel: c.stage?.label,
    status: c.status,
    runtimeEligible: c.runtimeEligible,
    reviewRequired: c.needsReview,
    genericFieldCount: c.genericFieldCount,
    lockedAt: c.lockedAt,
  }));

  if (query.sourceId) {
    items = items.filter((i) => i.sourceId === query.sourceId);
  }

  if (query.status) {
    items = items.filter((i) => i.status === query.status);
  }

  if (query.stage) {
    items = items.filter((i) => i.stageCode === query.stage);
  }

  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter(
      (i) =>
        i.templateCode.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        (i.stageLabel?.toLowerCase().includes(q) ?? false),
    );
  }

  return items;
}
