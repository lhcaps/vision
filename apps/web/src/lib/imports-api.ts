const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

import {
  extractApiError as _extractApiError,
  isJsonObject as _isJsonObject,
  unwrapApiData as _unwrapApiData,
  buildUrl as _buildUrl,
  readApi as _readApi,
  normalizeDate as _normalizeDate,
} from "./api-client";

// Re-export helpers for backward-compat với code cũ dùng trực tiếp từ file này.
export const extractApiError = _extractApiError;
export const isJsonObject = _isJsonObject;
export const unwrapApiData = _unwrapApiData;
export const buildUrl = _buildUrl;
export const normalizeDate = _normalizeDate;
// readApi giữ backward-compat với `cache: "no-store"` mặc định cho import flow.
export async function readApi<T>(path: string, init?: RequestInit): Promise<T> {
  return _readApi<T>(path, { ...(init ?? {}), noStore: true });
}

export type ImportTargetType =
  | "NEW_CASE"
  | "EXISTING_CASE"
  | "RAW_REFERENCE"
  | "TEMPLATE_SOURCE";

export type ImportDetectedCandidate = {
  id: string;
  type:
    | "caseCode"
    | "documentCode"
    | "personName"
    | "offense"
    | "date"
    | "agency"
    | "address";
  label: string;
  value: string;
  confidence: "cao" | "vừa" | "thấp";
  source: string;
};

export type ImportDetectedColumn = {
  id: string;
  columnName: string;
  mappedField: string;
  confidence: "cao" | "vừa" | "thấp";
};

export type ImportTablePreview = {
  sheetName: string;
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  candidateColumns: ImportDetectedColumn[];
};

export type ImportParsedPayload =
  | {
      kind: "text";
    }
  | {
      kind: "json";
      preview: string;
      topLevelKeys: string[];
    }
  | {
      kind: "table";
      sheetNames: string[];
      tables: ImportTablePreview[];
    }
  | {
      kind: "image";
    }
  | {
      kind: "binary";
    };

export type ImportBatchFile = {
  fileId: string;
  storedFileId?: string | null;
  fileName: string;
  safeName?: string | null;
  fileType: string;
  mimeType?: string | null;
  sizeBytes: number;
  parseStatus: string;
  downloadAvailable: boolean;
  storagePath?: string | null;
  checksumSha256?: string | null;
  previewText?: string | null;
  warnings: string[];
  errorMessage?: string | null;
  candidates: ImportDetectedCandidate[];
  parsedJson?: ImportParsedPayload | null;
  createdAt: string;
  parsedAt?: string | null;
};

export type ImportBatchDetail = {
  batchId: string;
  numericId?: string | null;
  status: string;
  sourceName: string;
  importType: string;
  createdAt: string;
  confirmedAt?: string | null;
  createdByName?: string | null;
  fileCount: number;
  processedFiles: number;
  failedFiles: number;
  totalRows: number;
  warnings: string[];
  errorMessage?: string | null;
  target?: {
    type: ImportTargetType;
    targetId?: string | null;
    summary: string;
  } | null;
  files: ImportBatchFile[];
  suggestedNewCase: {
    caseCode: string;
    caseTitle: string;
    relatedPersonName: string;
    offenseName: string;
    createdDate: string;
  };
};

export type ImportHistoryItem = {
  batchId: string;
  status: string;
  createdAt: string;
  confirmedAt?: string | null;
  sourceName: string;
  target?: {
    type: ImportTargetType;
    targetId?: string | null;
    summary: string;
  } | null;
  fileCount: number;
  processedFiles: number;
  failedFiles: number;
  warnings: string[];
  files: Array<{
    fileId: string;
    fileName: string;
    parseStatus: string;
  }>;
};

export type ImportHistoryResponse = {
  items: ImportHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ConfirmImportPayload = {
  targetType: ImportTargetType;
  existingCaseId?: string;
  newCase?: {
    caseCode?: string;
    caseTitle: string;
    relatedPersonName?: string;
    offenseName?: string;
    createdDate?: string;
  };
  note?: string;
  createdByName?: string;
};

export type CaseSummary = {
  id: string;
  caseCode: string;
  caseTitle: string;
  currentStatus?: string | null;
};

type ApiCaseListResponse = {
  items: CaseSummary[];
};

export function uploadImportFiles(
  files: File[],
  options?: {
    createdByName?: string;
    onProgress?: (progress: number) => void;
  },
): Promise<ImportBatchDetail> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    xhr.open("POST", `${API_BASE_URL}/import/upload`);
    xhr.withCredentials = true;
    xhr.responseType = "text";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      options?.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onerror = () => {
      reject(new Error("Không tải được tệp lên máy chủ."));
    };

    xhr.onload = () => {
      const responseText = xhr.responseText || "";
      let json: unknown = null;

      if (responseText.trim().length > 0) {
        try {
          json = JSON.parse(responseText);
        } catch {
          json = responseText;
        }
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(
            `${extractApiError(
              json,
              "Không tải được tệp lên máy chủ.",
            )} [HTTP ${xhr.status}]`,
          ),
        );
        return;
      }

      resolve(unwrapApiData<ImportBatchDetail>(json));
    };

    xhr.send(formData);
  });
}

export async function getImportBatch(batchId: string): Promise<ImportBatchDetail> {
  return readApi<ImportBatchDetail>(`/import/batches/${batchId}`);
}

export async function getImportHistory(
  page = 1,
  pageSize = 12,
): Promise<ImportHistoryResponse> {
  return readApi<ImportHistoryResponse>(
    `/import/history?page=${page}&pageSize=${pageSize}`,
  );
}

export async function confirmImportBatch(
  batchId: string,
  payload: ConfirmImportPayload,
): Promise<ImportBatchDetail> {
  return readApi<ImportBatchDetail>(`/import/batches/${batchId}/confirm`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function searchCases(query: string): Promise<CaseSummary[]> {
  const keyword = query.trim();

  if (!keyword) {
    return [];
  }

  const response = await readApi<ApiCaseListResponse>(
    `/cases?q=${encodeURIComponent(keyword)}&page=1&pageSize=8`,
  );

  return response.items;
}

export function getImportFileDownloadUrl(fileId: string): string {
  return `${API_BASE_URL}/import/files/${fileId}/download`;
}
