/**
 * Phase D — Sample data provider, separated from persisted data.
 *
 * Rules:
 * - Sample data only used to prefill demo/new form if user explicitly asks.
 * - Save path must use current form state, not sample data.
 * - Render path must use persisted/current form state.
 * - Sample data is namespaced by `templateCode` and `sourceId`.
 *
 * This module provides:
 * - `getSampleData(templateCode)` — get sample data for prefilling.
 * - `mergeWithSampleData(existing, sample)` — merge, with existing data taking precedence.
 * - `clearSampleData(data)` — strip sample data markers.
 *
 * In production, sample data may come from an API or static fixtures.
 * It is NOT hard-coded in save/render paths.
 */

import type { LoadedFormContract } from "./contract-types";

/**
 * Namespace key for sample data.
 */
export type SampleDataKey = {
  templateCode: string;
  sourceId: string;
};

/**
 * Generic sample data record.
 * Values are safe defaults suitable for demo/preview only.
 */
export type SampleData = Record<string, string | number | boolean>;

// ─── Sample data registry ───────────────────────────────────────────────────────

// Safe sample values for common fields.
// These are intentionally generic and legal-sounding.
// They MUST NOT be used in production save/render paths.

const SAMPLE_REGISTRY: Record<string, SampleData> = {
  "BM-001": {
    "agency.parentName": "Viện Kiểm sát nhân dân TP. Hồ Chí Minh",
    "agency.name": "Viện Kiểm sát nhân dân khu vực 7",
    "document.issuePlaceAndDateLine": "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
    "receiver.fullName": "Nguyễn Văn A",
    "receiver.positionTitle": "Kiểm sát viên",
    "receiver.departmentName": "Phòng 1",
    "informant.fullName": "Trần Thị B",
    "informant.genderLabel": "Nữ",
    "informant.birthDate": "1980-01-01",
    "informant.currentAddress": "Quận 1, TP. Hồ Chí Minh",
    "informant.identityNo": "012345678901",
    "informant.phoneNumber": "0901234567",
    "informant.occupation": "Công nhân",
    "crimeReport.content":
      "Tố giác hành vi trộm cắp tài sản xảy ra vào ngày 25/12/2025 tại Quận 1.",
    " improvisedReport.startedAtDate": "2025-12-26",
    "improvisedReport.startedAtTimeText": "08:00",
    "improvisedReport.endedAtTimeText": "10:00",
    "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  },
  "BM-002": {
    "agency.parentName": "Viện Kiểm sát nhân dân TP. Hồ Chí Minh",
    "agency.name": "Viện Kiểm sát nhân dân khu vực 7",
    "document.documentCode": "001/QĐ-VKS",
    "document.issueDate": "2026-01-01",
    "receiver.fullName": "Nguyễn Văn A",
    "receiver.positionTitle": "Kiểm sát viên",
    "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  },
  "BM-003": {
    "agency.parentName": "Viện Kiểm sát nhân dân TP. Hồ Chí Minh",
    "agency.name": "Viện Kiểm sát nhân dân khu vực 7",
    "document.documentCode": "001/QĐ-VKS",
    "document.issueDate": "2026-01-01",
    "legalBasisLine": "Căn cứ Điều 36 và Điều 37 Bộ luật Tố tụng hình sự 2015",
    "signature.positionTitle": "PHÓ VIỆN TRƯỞNG",
    "signature.signMode": "KT. VIỆN TRƯỞNG",
    "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  },
};

/**
 * Get sample data for a template code.
 * Returns an empty object if no sample data is available.
 */
export function getSampleData(templateCode: string): SampleData {
  return SAMPLE_REGISTRY[templateCode] ?? {};
}

/**
 * Merge existing form data with sample data.
 * Existing (user-entered) data takes precedence.
 * Sample data only fills empty fields.
 *
 * This is used ONLY when the user explicitly requests to prefill with sample data.
 * It is NOT called during normal save/render flows.
 */
export function mergeWithSampleData(
  existing: Record<string, unknown>,
  sample: SampleData,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...existing };

  for (const [key, value] of Object.entries(sample)) {
    if (result[key] === undefined || result[key] === null || result[key] === "") {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Clear sample data markers from form data.
 * After user edits a field that was pre-filled with sample data,
 * the edited value is persisted — sample data markers are irrelevant.
 *
 * This function is a no-op in practice (sample data has no special markers),
 * but exists for semantic clarity and future extensibility.
 */
export function clearSampleData(data: Record<string, unknown>): Record<string, unknown> {
  // Currently, sample data values are just strings — no special marker.
  // If we introduce a `__sample: true` marker, this would strip it.
  return { ...data };
}

/**
 * Check whether form data contains any non-empty values.
 * Useful for detecting "empty form" state.
 */
export function hasUserData(data: Record<string, unknown>): boolean {
  return Object.values(data).some(
    (v) => v !== undefined && v !== null && v !== "",
  );
}

/**
 * Extract reporting index from form data based on contract hints.
 * Does NOT use sample data — only actual user-entered values.
 */
export function extractReportingIndex(
  data: Record<string, unknown>,
  contract: LoadedFormContract,
): { time?: string; ward?: string; offense?: string } {
  const hints = contract.reportingHints ?? {};
  const result: { time?: string; ward?: string; offense?: string } = {};

  if (hints.timeField && data[hints.timeField]) {
    result.time = String(data[hints.timeField]);
  }
  if (hints.wardField && data[hints.wardField]) {
    result.ward = String(data[hints.wardField]);
  }
  if (hints.offenseField && data[hints.offenseField]) {
    result.offense = String(data[hints.offenseField]);
  }

  return result;
}
