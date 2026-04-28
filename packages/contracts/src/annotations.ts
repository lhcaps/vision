import { z } from "zod";
import { BBoxGeometrySchema } from "./geometry";
import { DatasetSplitSchema, MediaAssetTypeSchema, MediaUploadStatusSchema } from "./media";

export const LabelTypeSchema = z.enum(["BBOX", "MASK", "KEYPOINT"]);
export const AnnotationSourceSchema = z.enum(["MANUAL", "MODEL", "IMPORT"]);
export const AnnotationSetStatusSchema = z.enum(["DRAFT", "REVIEWING", "APPROVED", "REJECTED"]);

export const AnnotationLabelSummarySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  type: LabelTypeSchema,
});

export const AnnotationSetSummarySchema = z.object({
  id: z.string().min(1),
  datasetVersionId: z.string().min(1),
  name: z.string().min(1),
  status: AnnotationSetStatusSchema,
  createdAt: z.string().min(1),
});

export const AnnotationSummarySchema = z.object({
  id: z.string().min(1),
  annotationSetId: z.string().min(1),
  assetId: z.string().min(1),
  labelClassId: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1),
  type: z.literal("BBOX"),
  geometry: BBoxGeometrySchema,
  source: AnnotationSourceSchema,
  confidence: z.number().min(0).max(1).nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const AnnotationAssetSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: MediaAssetTypeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  split: DatasetSplitSchema,
  status: MediaUploadStatusSchema,
});

export const AnnotationWorkspaceResponseSchema = z.object({
  annotationSet: AnnotationSetSummarySchema,
  asset: AnnotationAssetSummarySchema.nullable(),
  labels: z.array(AnnotationLabelSummarySchema),
  annotations: z.array(AnnotationSummarySchema),
  imageWidth: z.number().int().positive(),
  imageHeight: z.number().int().positive(),
});

export const CreateAnnotationRequestSchema = z.object({
  assetId: z.string().trim().min(1),
  labelClassId: z.string().trim().min(1),
  geometry: BBoxGeometrySchema,
});

export const UpdateAnnotationRequestSchema = z
  .object({
    labelClassId: z.string().trim().min(1).optional(),
    geometry: BBoxGeometrySchema.optional(),
  })
  .refine((body) => body.labelClassId !== undefined || body.geometry !== undefined, {
    message: "Update annotation request must include labelClassId or geometry.",
  });

export const DeleteAnnotationResponseSchema = z.object({
  deletedId: z.string().min(1),
});

export const AnnotationSaveOperationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create"),
    clientId: z.string().min(1),
    body: CreateAnnotationRequestSchema,
  }),
  z.object({
    kind: z.literal("update"),
    annotationId: z.string().min(1),
    body: UpdateAnnotationRequestSchema,
  }),
  z.object({
    kind: z.literal("delete"),
    annotationId: z.string().min(1),
  }),
]);

export const AnnotationSaveStatusSchema = z.enum(["queued", "saving", "saved", "failed"]);

export const AnnotationSaveQueueItemSchema = z.object({
  id: z.string().min(1),
  operation: AnnotationSaveOperationSchema,
  status: AnnotationSaveStatusSchema,
  error: z.string().min(1).optional(),
});

export type LabelType = z.infer<typeof LabelTypeSchema>;
export type AnnotationSource = z.infer<typeof AnnotationSourceSchema>;
export type AnnotationSetStatus = z.infer<typeof AnnotationSetStatusSchema>;
export type AnnotationLabelSummary = z.infer<typeof AnnotationLabelSummarySchema>;
export type AnnotationSetSummary = z.infer<typeof AnnotationSetSummarySchema>;
export type AnnotationSummary = z.infer<typeof AnnotationSummarySchema>;
export type AnnotationAssetSummary = z.infer<typeof AnnotationAssetSummarySchema>;
export type AnnotationWorkspaceResponse = z.infer<typeof AnnotationWorkspaceResponseSchema>;
export type CreateAnnotationRequest = z.infer<typeof CreateAnnotationRequestSchema>;
export type UpdateAnnotationRequest = z.infer<typeof UpdateAnnotationRequestSchema>;
export type DeleteAnnotationResponse = z.infer<typeof DeleteAnnotationResponseSchema>;
export type AnnotationSaveOperation = z.infer<typeof AnnotationSaveOperationSchema>;
export type AnnotationSaveStatus = z.infer<typeof AnnotationSaveStatusSchema>;
export type AnnotationSaveQueueItem = z.infer<typeof AnnotationSaveQueueItemSchema>;
