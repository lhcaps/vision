import { z } from 'zod';

export const CocoInfoSchema = z.object({
  description: z.string(),
  version: z.string(),
  year: z.number().int(),
  date_created: z.string(),
});

export const CocoLicenseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  url: z.string().optional(),
});

export const CocoImageSchema = z.object({
  id: z.number().int().positive(),
  file_name: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const CocoCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  supercategory: z.string().optional(),
});

export const CocoAnnotationSchema = z.object({
  id: z.number().int().positive(),
  image_id: z.number().int().positive(),
  category_id: z.number().int().positive(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  area: z.number().nonnegative(),
  iscrowd: z.literal(0),
});

export const CocoDatasetSchema = z.object({
  info: CocoInfoSchema,
  images: z.array(CocoImageSchema).min(1),
  annotations: z.array(CocoAnnotationSchema),
  categories: z.array(CocoCategorySchema).min(1),
});

export const CocoExportMetadataSchema = z.object({
  projectId: z.string().min(1),
  datasetId: z.string().min(1),
  datasetVersionId: z.string().min(1),
  datasetVersion: z.number().int().positive(),
  status: z.literal('LOCKED'),
  assetCount: z.number().int().nonnegative(),
  annotationCount: z.number().int().nonnegative(),
  categoryCount: z.number().int().nonnegative(),
  splits: z.object({
    TRAIN: z.number().int().nonnegative(),
    VALID: z.number().int().nonnegative(),
    TEST: z.number().int().nonnegative(),
    UNASSIGNED: z.number().int().nonnegative(),
  }),
  deterministicHash: z.string().min(1),
});

export const CocoExportResponseSchema = CocoDatasetSchema.extend({
  metadata: CocoExportMetadataSchema,
});

export type CocoInfo = z.infer<typeof CocoInfoSchema>;
export type CocoLicense = z.infer<typeof CocoLicenseSchema>;
export type CocoImage = z.infer<typeof CocoImageSchema>;
export type CocoCategory = z.infer<typeof CocoCategorySchema>;
export type CocoAnnotation = z.infer<typeof CocoAnnotationSchema>;
export type CocoDataset = z.infer<typeof CocoDatasetSchema>;
export type CocoExportMetadata = z.infer<typeof CocoExportMetadataSchema>;
export type CocoExportResponse = z.infer<typeof CocoExportResponseSchema>;

export function buildCocoInfo(): CocoInfo {
  const now = new Date();
  return {
    description: 'VisionFlow COCO export',
    version: '1.0',
    year: now.getFullYear(),
    date_created: now.toISOString(),
  };
}
