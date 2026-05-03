import type { MediaUploadResponse } from '@visionflow/contracts';
import { apiUpload } from '../../shared/api';

export async function uploadMediaFile(projectId: string, file: File): Promise<MediaUploadResponse> {
  const body = new FormData();
  body.append('file', file);
  return apiUpload<MediaUploadResponse>(`/api/projects/${projectId}/media/upload`, body);
}

export async function checksumFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
