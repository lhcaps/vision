import { createHash } from 'node:crypto';
import {
  AcceptedMediaMime,
  classifyMediaType,
  createDerivativeObjectKey,
  createMediaObjectKey,
  MediaAssetType,
  MediaProcessingJobType,
  validateMediaMime,
} from '@visionflow/contracts';
import { validateMagicBytes } from '../common/utils/magic-bytes';
import { validateMediaIntegrity } from '../common/utils/media-integrity';

export type MediaIngestionInput = {
  projectId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
};

export type MediaIngestionPlan = {
  projectId: string;
  originalName: string;
  mimeType: AcceptedMediaMime;
  mediaType: MediaAssetType;
  checksum: string;
  storageKey: string;
  sizeBytes: number;
  processingJobType: MediaProcessingJobType;
};

export async function buildMediaIngestionPlan(input: MediaIngestionInput): Promise<MediaIngestionPlan> {
  const mimeType = validateMediaMime(input.mimeType);
  const checksum = createHash('sha256').update(input.buffer).digest('hex');
  const mediaType = classifyMediaType(mimeType);

  if (!validateMagicBytes(input.buffer, mimeType)) {
    throw new Error('Magic bytes do not match declared MIME type');
  }

  await validateMediaIntegrity(input.buffer, mimeType);

  return {
    projectId: input.projectId,
    originalName: input.originalName,
    mimeType,
    mediaType,
    checksum,
    storageKey: createMediaObjectKey(input.projectId, checksum, mimeType),
    sizeBytes: input.sizeBytes,
    processingJobType: mediaType === 'IMAGE' ? 'THUMBNAIL' : 'EXTRACT_FRAMES',
  };
}

export function buildProcessingTargetKey(
  projectId: string,
  assetId: string,
  type: MediaProcessingJobType
): string {
  return createDerivativeObjectKey(projectId, assetId, type);
}
