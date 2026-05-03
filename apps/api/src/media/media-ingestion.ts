import { BadRequestException } from '@nestjs/common';
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
import { validateMediaIntegrity, extractImageMetadata } from '../common/utils/media-integrity';

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
  width: number | null;
  height: number | null;
};

export async function buildMediaIngestionPlan(
  input: MediaIngestionInput
): Promise<MediaIngestionPlan> {
  const mimeType = validateMediaMime(input.mimeType);
  const checksum = createHash('sha256').update(input.buffer).digest('hex');
  const mediaType = classifyMediaType(mimeType);

  if (!validateMagicBytes(input.buffer, mimeType)) {
    throw new Error('Magic bytes do not match declared MIME type');
  }

  await validateMediaIntegrity(input.buffer, mimeType);

  let width: number | null = null;
  let height: number | null = null;

  if (mediaType === 'IMAGE') {
    const meta = await extractImageMetadata(input.buffer, input.mimeType);
    width = meta.width;
    height = meta.height;
  }

  return {
    projectId: input.projectId,
    originalName: input.originalName,
    mimeType,
    mediaType,
    checksum,
    storageKey: createMediaObjectKey(input.projectId, checksum, mimeType),
    sizeBytes: input.sizeBytes,
    processingJobType: mediaType === 'IMAGE' ? 'THUMBNAIL' : 'EXTRACT_FRAMES',
    width,
    height,
  };
}

export function buildProcessingTargetKey(
  projectId: string,
  assetId: string,
  type: MediaProcessingJobType
): string {
  return createDerivativeObjectKey(projectId, assetId, type);
}
