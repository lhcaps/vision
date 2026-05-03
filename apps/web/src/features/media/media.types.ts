import type { MediaUploadStatus } from '@visionflow/contracts';

export type MediaUploadRow = {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'FRAME';
  checksum: string;
  split: string;
  status: MediaUploadStatus | 'hashing' | 'uploading' | 'duplicate';
  progress: number;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  error?: string;
  processingJob?: string;
};

export type MediaUploadAsset = {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'FRAME';
  checksum: string;
  split: string;
  status: MediaUploadStatus;
  sizeBytes?: number;
  width?: number | null;
  height?: number | null;
};
