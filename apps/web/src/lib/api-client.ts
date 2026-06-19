/**
 * API client thống nhất cho QUANLYVKS Web.
 *
 * Mục đích: gom các helper fetch + unwrap + normalize mà trước đây mỗi
 * file *-api.ts tự định nghĩa, để:
 *  - Dùng nhất quán credentials: 'include' (gửi cookie session)
 *  - Single place để sửa base URL, headers, error handling
 *  - Phát hiện 401 từ bất kỳ API call nào → emit AuthEvent("unauthorized")
 *    để AuthProvider chuyển trạng thái về unauthenticated.
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

const API_FETCH_DEFAULTS_MARKER = "__qvksApiFetchDefaultsInstalled";

function isLoopbackHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return trimTrailingSlash(API_BASE_URL);
  }

  try {
    const configured = new URL(API_BASE_URL);
    const pageHost = window.location.hostname;

    if (isLoopbackHost(configured.hostname) && isLoopbackHost(pageHost)) {
      configured.hostname = pageHost;
    }

    return trimTrailingSlash(configured.toString());
  } catch {
    return trimTrailingSlash(API_BASE_URL);
  }
}

function getRequestUrl(input: RequestInfo | URL): string | null {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  return null;
}

function hasApiPath(url: URL, apiBase: URL) {
  return url.pathname.startsWith(apiBase.pathname.replace(/\/$/, ""));
}

function isSameLoopbackApiOrigin(url: URL, apiBase: URL) {
  return (
    isLoopbackHost(url.hostname) &&
    isLoopbackHost(apiBase.hostname) &&
    url.protocol === apiBase.protocol &&
    url.port === apiBase.port
  );
}

function isApiRequestUrl(urlText: string) {
  try {
    const url = new URL(urlText, typeof window === "undefined" ? API_BASE_URL : window.location.href);
    const configuredApiBase = new URL(API_BASE_URL);
    const resolvedApiBase = new URL(getApiBaseUrl());

    return [configuredApiBase, resolvedApiBase].some(
      (apiBase) =>
        hasApiPath(url, apiBase) &&
        (url.origin === apiBase.origin || isSameLoopbackApiOrigin(url, apiBase)),
    );
  } catch {
    return false;
  }
}

function rewriteApiRequestHost(urlText: string) {
  if (typeof window === "undefined") return urlText;

  try {
    const url = new URL(urlText, window.location.href);
    if (!isApiRequestUrl(url.toString())) {
      return urlText;
    }

    const configuredApiBase = new URL(API_BASE_URL);
    const apiBase = new URL(getApiBaseUrl());
    if (isSameLoopbackApiOrigin(url, configuredApiBase)) {
      url.protocol = apiBase.protocol;
      url.hostname = apiBase.hostname;
      url.port = apiBase.port;
    }

    return url.toString();
  } catch {
    return urlText;
  }
}

export function withApiFetchDefaults(
  input: RequestInfo | URL,
  init?: RequestInit,
): [RequestInfo | URL, RequestInit | undefined] {
  const requestUrl = getRequestUrl(input);
  if (!requestUrl || !isApiRequestUrl(requestUrl)) {
    return [input, init];
  }

  const nextInit: RequestInit = {
    ...(init ?? {}),
    credentials: init?.credentials ?? "include",
  };

  if (typeof input === "string") {
    return [rewriteApiRequestHost(input), nextInit];
  }

  if (input instanceof URL) {
    return [new URL(rewriteApiRequestHost(input.toString())), nextInit];
  }

  if (typeof Request !== "undefined" && input instanceof Request) {
    return [new Request(rewriteApiRequestHost(input.url), input), nextInit];
  }

  return [input, nextInit];
}

export function installApiFetchDefaults() {
  if (typeof window === "undefined") return;

  const target = window as Window & {
    [API_FETCH_DEFAULTS_MARKER]?: boolean;
  };

  if (target[API_FETCH_DEFAULTS_MARKER]) return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const [nextInput, nextInit] = withApiFetchDefaults(input, init);
    const responsePromise = originalFetch(nextInput, nextInit);

    if (isApiRequestUrl(getRequestUrl(nextInput) ?? "")) {
      // Lazy import tránh circular: auth-events dùng từ api-client, không ngược lại,
      // nhưng tách ra để tree-shaking tốt và tránh kéo module ở server build.
      void import("./auth-events")
        .then(({ emitAuthEvent }) => {
          void responsePromise.then((response) => {
            if (
              response.status === 401 &&
              !isAuthProbeRequest(getRequestUrl(nextInput) ?? "")
            ) {
              emitAuthEvent({ type: "unauthorized" });
            }
          });
        })
        .catch(() => {
          // best-effort: skip event emission nếu module lỗi
        });
    }

    return responsePromise;
  };
  target[API_FETCH_DEFAULTS_MARKER] = true;
}

const AUTH_PROBE_PATHS = ["/auth/login", "/auth/logout", "/auth/me"];

function isAuthProbeRequest(urlText: string) {
  try {
    const url = new URL(urlText, window.location.href);
    return AUTH_PROBE_PATHS.some(
      (probe) => url.pathname === probe || url.pathname.endsWith(probe),
    );
  } catch {
    return false;
  }
}

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
  if (!params) return `${getApiBaseUrl()}${cleanPath}`;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return `${getApiBaseUrl()}${cleanPath}${qs ? `?${qs}` : ""}`;
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

  const response = await fetch(`${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
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
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
