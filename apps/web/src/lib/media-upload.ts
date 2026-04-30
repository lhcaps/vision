import { MediaUploadResponse } from '@visionflow/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';

export async function uploadMediaFile(projectId: string, file: File): Promise<MediaUploadResponse> {
  const body = new FormData();
  body.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/media/upload`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as MediaUploadResponse;
}

export async function checksumFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string | string[] | { message?: string; detail?: string };
      error?: string;
      detail?: string;
    };

    if (typeof body.message === 'string') {
      return body.message;
    }

    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }

    if (typeof body.message === 'object' && body.message?.message) {
      return body.message.detail
        ? `${body.message.message}: ${body.message.detail}`
        : body.message.message;
    }

    return body.detail ?? body.error ?? `Upload failed with HTTP ${response.status}`;
  } catch {
    return `Upload failed with HTTP ${response.status}`;
  }
}
