import { z } from "zod";
import { DatasetSplitSchema } from "./media";

export const DatasetVersionStatusSchema = z.enum(["DRAFT", "LOCKED", "ARCHIVED"]);

export const SplitSummarySchema = z.object({
  TRAIN: z.number().int().nonnegative(),
  VALID: z.number().int().nonnegative(),
  TEST: z.number().int().nonnegative(),
  UNASSIGNED: z.number().int().nonnegative(),
});

export const DatasetSummarySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  versionCount: z.number().int().nonnegative(),
  draftVersionCount: z.number().int().nonnegative(),
  lockedVersionCount: z.number().int().nonnegative(),
  assetCount: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
});

export const DatasetVersionSummarySchema = z.object({
  id: z.string().min(1),
  datasetId: z.string().min(1),
  version: z.number().int().positive(),
  label: z.string().min(1),
  status: DatasetVersionStatusSchema,
  parentVersionId: z.string().min(1).nullable(),
  assetCount: z.number().int().nonnegative(),
  splitSummary: SplitSummarySchema,
  createdAt: z.string().min(1),
});

export const CreateDatasetRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
});

export const CreateDatasetVersionRequestSchema = z.object({
  parentVersionId: z.string().trim().min(1).nullable().optional(),
});

export const DatasetVersionAssetAssignmentSchema = z.object({
  assetId: z.string().trim().min(1),
  split: DatasetSplitSchema,
});

export const AssignDatasetVersionAssetsRequestSchema = z.object({
  assets: z.array(DatasetVersionAssetAssignmentSchema).min(1).max(500),
});

export const DatasetListResponseSchema = z.object({
  datasets: z.array(DatasetSummarySchema),
});

export const DatasetVersionListResponseSchema = z.object({
  versions: z.array(DatasetVersionSummarySchema),
});

export const LockDatasetVersionResponseSchema = z.object({
  version: DatasetVersionSummarySchema,
});

export type DatasetVersionStatus = z.infer<typeof DatasetVersionStatusSchema>;
export type DatasetSplit = z.infer<typeof DatasetSplitSchema>;
export type SplitSummary = z.infer<typeof SplitSummarySchema>;
export type DatasetSummary = z.infer<typeof DatasetSummarySchema>;
export type DatasetVersionSummary = z.infer<typeof DatasetVersionSummarySchema>;
export type CreateDatasetRequest = z.infer<typeof CreateDatasetRequestSchema>;
export type CreateDatasetVersionRequest = z.infer<typeof CreateDatasetVersionRequestSchema>;
export type DatasetVersionAssetAssignment = z.infer<typeof DatasetVersionAssetAssignmentSchema>;
export type AssignDatasetVersionAssetsRequest = z.infer<
  typeof AssignDatasetVersionAssetsRequestSchema
>;
export type DatasetListResponse = z.infer<typeof DatasetListResponseSchema>;
export type DatasetVersionListResponse = z.infer<typeof DatasetVersionListResponseSchema>;
export type LockDatasetVersionResponse = z.infer<typeof LockDatasetVersionResponseSchema>;

export function createEmptySplitSummary(): SplitSummary {
  return {
    TRAIN: 0,
    VALID: 0,
    TEST: 0,
    UNASSIGNED: 0,
  };
}

export function summarizeDatasetSplits(rows: Array<{ split: DatasetSplit }>): SplitSummary {
  return rows.reduce<SplitSummary>((summary, row) => {
    summary[row.split] += 1;
    return summary;
  }, createEmptySplitSummary());
}

export function assertDraftDatasetVersion(status: DatasetVersionStatus): void {
  if (status !== "DRAFT") {
    throw new Error(`Dataset version is immutable once ${status.toLowerCase()}.`);
  }
}
