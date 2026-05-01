import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  MediaAssetSummary,
  MediaProcessingJobSummary,
  MediaUploadResponse,
} from '@visionflow/contracts';
import { buildMediaIngestionPlan } from './media-ingestion';
import { MediaRepository } from '../repositories/media.repository';
import { STORAGE_REPOSITORY } from '../config/provider-tokens';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepo: MediaRepository,
    @Inject(STORAGE_REPOSITORY) private readonly storage: { putOriginal(key: string, buffer: Buffer, mimeType: string): Promise<void> }
  ) {}

  async upload(projectId: string, file: UploadedFile | undefined): Promise<MediaUploadResponse> {
    if (!file) {
      throw new BadRequestException("Missing multipart file field named 'file'.");
    }

    let plan: Awaited<ReturnType<typeof buildMediaIngestionPlan>>;

    try {
      plan = await buildMediaIngestionPlan({
        projectId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        buffer: file.buffer,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Magic bytes')) {
        throw new BadRequestException(
          'File content does not match declared file type. The file may be corrupted or misnamed.'
        );
      }
      throw new BadRequestException(`Unsupported media MIME type: ${file.mimetype || 'unknown'}.`);
    }

    const existing = await this.mediaRepo.findByChecksum(projectId, plan.checksum);
    if (existing) {
      return {
        asset: { ...existing, status: 'duplicate' },
        processingJob: null,
        deduplicated: true,
      };
    }

    await this.storage.putOriginal(plan.storageKey, file.buffer, plan.mimeType);

    const asset = await this.mediaRepo.create({
      projectId,
      name: plan.originalName,
      type: plan.mediaType,
      storageKey: plan.storageKey,
      checksum: plan.checksum,
      mimeType: plan.mimeType,
      sizeBytes: plan.sizeBytes,
      originalName: plan.originalName,
    });

    const processingJob = await this.mediaRepo.createProcessingJob({
      projectId,
      assetId: asset.id,
      type: plan.processingJobType,
      storageKey: plan.storageKey,
      mimeType: plan.mimeType,
    });

    return {
      asset,
      processingJob,
      deduplicated: false,
    };
  }

  async list(projectId: string): Promise<MediaAssetSummary[]> {
    return this.mediaRepo.findByProject(projectId);
  }

  async findAsset(projectId: string, assetId: string): Promise<MediaAssetSummary | null> {
    return this.mediaRepo.findById(projectId, assetId);
  }
}
