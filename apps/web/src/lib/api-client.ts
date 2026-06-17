/**
 * API client thống nhất cho QUANLYVKS Web.
 *
 * Mục đích: gom các helper fetch + unwrap + normalize mà trước đây mỗi
 * file *-api.ts tự định nghĩa, để:
 *  - Dùng nhất quán credentials: 'include' (gửi cookie session)
 *  - Single place để sửa base URL, headers, error handling
 *  - Code mới dùng trực tiếp; code cũ re-export cho backward-compat
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

export const DEFAULT_API_FETCH_INIT: RequestInit = {
  credentials: "include",
  headers: {
    Accept: "application/json",
  },
};

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Unwrap response: nếu có field `data` hoặc `result` ở top level thì lấy.
 * Nếu không, trả về raw response.
 */
export function unwrapApiData<T>(json: unknown): T {
  if (isJsonObject(json)) {
    if ("data" in json && json.data !== undefined) {
      return json.data as T;
    }
    if ("result" in json && json.result !== undefined) {
      return json.result as T;
    }
  }
  return json as T;
}

export function extractApiError(json: unknown, fallback: string): string {
  if (!isJsonObject(json)) return fallback;
  const { message } = json;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.map(String).join(", ");
  if (typeof json.error === "string") return json.error;
  return fallback;
}

export function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!params) return `${API_BASE_URL}${cleanPath}`;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return `${API_BASE_URL}${cleanPath}${qs ? `?${qs}` : ""}`;
}

/**
 * Chuẩn hoá Date → ISO string (nếu còn dùng).
 * Date fields từ API thường trả về string; helper này chuyển Date instance.
 */
export function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toISOString();
  }
  return String(value);
}

export interface ReadApiOptions extends Omit<RequestInit, "headers" | "credentials" | "body"> {
  body?: BodyInit | null;
  headers?: HeadersInit;
  cache?: RequestCache;
  noStore?: boolean; // alias cho cache: "no-store"
}

/**
 * Fetch JSON với credentials: 'include' (để gửi session cookie).
 * - Tự unwrap data.
 * - Tự throw Error(message) với message từ server khi response không ok.
 */
export async function readApi<T>(path: string, init: ReadApiOptions = {}): Promise<T> {
  const { body, headers, cache, noStore, ...rest } = init;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
  };
  if (body && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json; charset=utf-8";
  }
  if (headers) {
    const h = new Headers(headers);
    h.forEach((value, key) => {
      finalHeaders[key] = value;
    });
  }

  const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...rest,
    credentials: "include",
    cache: noStore ? "no-store" : cache,
    headers: finalHeaders,
    body: body ?? undefined,
  });

  const text = await response.text();
  let json: unknown = null;
  if (text.trim().length > 0) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      `${extractApiError(json, "Không gọi được API.")} [HTTP ${response.status}]`,
    );
  }
  return unwrapApiData<T>(json);
}

/**
 * Build URL trỏ thẳng tới backend (dùng cho file download, OAuth, ...).
 */
export function absoluteApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
