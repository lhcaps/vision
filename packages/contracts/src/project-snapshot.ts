import { z } from "zod";
import { BBoxGeometrySchema } from "./geometry";
import { InferenceJobStatusSchema } from "./jobs";
import { MediaAssetTypeSchema, MediaUploadStatusSchema } from "./media";
import { PipelineDefinitionSchema } from "./pipeline";

export const ProjectSnapshotSchema = z.object({
  project: z.object({
    id: z.string(),
    name: z.string(),
    assetCount: z.number().int().nonnegative(),
    datasetVersion: z.string(),
  }),
  media: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: MediaAssetTypeSchema,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      checksum: z.string(),
      sizeBytes: z.number().int().nonnegative().optional(),
      thumbnailKey: z.string().nullable().optional(),
      split: z.enum(["TRAIN", "VALID", "TEST", "UNASSIGNED"]),
      status: MediaUploadStatusSchema,
    }),
  ),
  annotations: z.array(
    z.object({
      id: z.string(),
      assetId: z.string(),
      label: z.string(),
      color: z.string(),
      geometry: BBoxGeometrySchema,
      source: z.enum(["MANUAL", "MODEL", "IMPORT"]),
      confidence: z.number().min(0).max(1).optional(),
    }),
  ),
  pipeline: PipelineDefinitionSchema,
  job: z.object({
    id: z.string(),
    status: InferenceJobStatusSchema,
    progress: z.number().int().min(0).max(100),
    startedAt: z.string().optional(),
  }),
});

export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>;
