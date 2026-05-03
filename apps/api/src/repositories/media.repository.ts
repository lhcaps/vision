import { MediaAssetSummary, MediaProcessingJobSummary } from '@visionflow/contracts';

export interface MediaRepository {
  findByProject(projectId: string): Promise<MediaAssetSummary[]>;
  findById(projectId: string, assetId: string): Promise<MediaAssetSummary | null>;
  findByChecksum(projectId: string, checksum: string): Promise<MediaAssetSummary | null>;
  create(data: {
    projectId: string;
    name: string;
    type: 'IMAGE' | 'VIDEO' | 'FRAME';
    storageKey: string;
    checksum: string;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
    width?: number | null;
    height?: number | null;
  }): Promise<MediaAssetSummary>;
  createProcessingJob(data: {
    projectId: string;
    assetId: string;
    type: 'THUMBNAIL' | 'EXTRACT_FRAMES';
    storageKey: string;
    mimeType: string;
  }): Promise<MediaProcessingJobSummary>;
}
