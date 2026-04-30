import { z } from 'zod';

export const MediaAssetTypeSchema = z.enum(['IMAGE', 'VIDEO', 'FRAME']);
export const DatasetSplitSchema = z.enum(['TRAIN', 'VALID', 'TEST', 'UNASSIGNED']);
export const MediaUploadStatusSchema = z.enum(['indexed', 'queued', 'failed', 'duplicate']);
export const MediaProcessingJobTypeSchema = z.enum(['THUMBNAIL', 'EXTRACT_FRAMES']);
export const MediaProcessingJobStatusSchema = z.enum(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED']);

export const AcceptedMediaMimeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
]);

export const MediaAssetSummarySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  type: MediaAssetTypeSchema,
  mimeType: AcceptedMediaMimeSchema,
  storageKey: z.string().min(1),
  thumbnailKey: z.string().min(1).nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
  frameCount: z.number().int().nonnegative().nullable(),
  checksum: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  status: MediaUploadStatusSchema,
  createdAt: z.string().min(1),
});

export const MediaProcessingJobSummarySchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  type: MediaProcessingJobTypeSchema,
  status: MediaProcessingJobStatusSchema,
  targetKey: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
});

export const MediaUploadResponseSchema = z.object({
  asset: MediaAssetSummarySchema,
  processingJob: MediaProcessingJobSummarySchema.nullable(),
  deduplicated: z.boolean(),
});

export type AcceptedMediaMime = z.infer<typeof AcceptedMediaMimeSchema>;
export type MediaAssetType = z.infer<typeof MediaAssetTypeSchema>;
export type MediaUploadStatus = z.infer<typeof MediaUploadStatusSchema>;
export type MediaProcessingJobType = z.infer<typeof MediaProcessingJobTypeSchema>;
export type MediaProcessingJobStatus = z.infer<typeof MediaProcessingJobStatusSchema>;
export type MediaAssetSummary = z.infer<typeof MediaAssetSummarySchema>;
export type MediaProcessingJobSummary = z.infer<typeof MediaProcessingJobSummarySchema>;
export type MediaUploadResponse = z.infer<typeof MediaUploadResponseSchema>;

const extensionByMime: Record<AcceptedMediaMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

export function classifyMediaType(mimeType: AcceptedMediaMime): MediaAssetType {
  return mimeType.startsWith('image/') ? 'IMAGE' : 'VIDEO';
}

export function getMediaExtension(mimeType: AcceptedMediaMime): string {
  return extensionByMime[mimeType];
}

export function validateMediaMime(mimeType: string): AcceptedMediaMime {
  return AcceptedMediaMimeSchema.parse(mimeType);
}

export function createMediaObjectKey(
  projectId: string,
  checksum: string,
  mimeType: AcceptedMediaMime
): string {
  return `projects/${projectId}/originals/${checksum}.${getMediaExtension(mimeType)}`;
}

export function createDerivativeObjectKey(
  projectId: string,
  assetId: string,
  type: MediaProcessingJobType
): string {
  const suffix = type === 'THUMBNAIL' ? 'thumb.webp' : 'frames.json';

  return `projects/${projectId}/derivatives/${assetId}/${suffix}`;
}
