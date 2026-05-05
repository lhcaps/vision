export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ??
  'http://localhost:3000';

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as T;
}

export async function readApiError(response: Response): Promise<string> {
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

    return body.detail ?? body.error ?? `Request failed with HTTP ${response.status}`;
  } catch {
    return `Request failed with HTTP ${response.status}`;
  }
}

export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as T;
}
