"use client";

function withPdfCacheBuster(url: string | null | undefined): string {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
}


import { useEffect, useMemo, useState } from "react";
import {
  bulkDeleteGeneratedDocumentFiles,
  cleanupGeneratedDocumentFiles,
  type GeneratedDocumentDetail,
  type GeneratedDocumentFile,
  getGeneratedDocument,
  getGeneratedDocumentDownloadUrl,
} from "@/lib/generated-documents-api";
import { PreExportCustomizationPanel } from "@/components/documents/pre-export-customization-panel";

type Props = {
  documentId: string;
};

function formatBytes(value: string | number): string {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes < 0) {
    return `${value} bytes`;
  }

  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}

function sortFiles(files: GeneratedDocumentFile[]): GeneratedDocumentFile[] {
  return [...files].sort((a, b) => Number(b.id) - Number(a.id));
}

export function GeneratedDocumentActionPanel({ documentId }: Props) {
  const [data, setData] = useState<GeneratedDocumentDetail | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const files = useMemo(() => sortFiles(data?.files ?? []), [data?.files]);

  const latestDocx = useMemo(() => {
    return files.find((file) => file.fileFormat === "DOCX");
  }, [files]);

  const latestPdf = useMemo(() => {
    return files.find((file) => file.fileFormat === "PDF");
  }, [files]);

  const allVisibleSelected =
    files.length > 0 &&
    files.every((file) => selectedFileIds.has(String(file.id)));

  async function load() {
    try {
      setError(null);
      setLoading(true);

      const result = await getGeneratedDocument(documentId);

      setData(result);
      setSelectedFileIds((current) => {
        const existingIds = new Set((result.files ?? []).map((file) => String(file.id)));
        const next = new Set<string>();

        for (const id of current) {
          if (existingIds.has(id)) {
            next.add(id);
          }
        }

        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
     
  }, [documentId]);

  function toggleFile(fileId: string) {
    setSelectedFileIds((current) => {
      const next = new Set(current);

      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }

      return next;
    });
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedFileIds(new Set());
      return;
    }

    setSelectedFileIds(new Set(files.map((file) => String(file.id))));
  }

  async function handleDeleteSelected() {
    const fileIds = Array.from(selectedFileIds);

    if (fileIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn chắc chắn muốn xóa ${fileIds.length} file đã chọn? File sẽ bị xóa khỏi database và ổ đĩa.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading("DELETE_SELECTED");
      setError(null);
      setSuccessMessage(null);

      await bulkDeleteGeneratedDocumentFiles(documentId, fileIds);
      setSelectedFileIds(new Set());
      await load();

      setSuccessMessage(`Đã xóa ${fileIds.length} file đã chọn.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Xóa tệp đã chọn thất bại.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCleanupOldFiles() {
    const confirmed = window.confirm(
      "Dọn tệp cũ sẽ giữ lại DOCX mới nhất và PDF mới nhất, xóa toàn bộ file còn lại. Tiếp tục?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading("CLEANUP");
      setError(null);
      setSuccessMessage(null);

      const result = await cleanupGeneratedDocumentFiles(documentId);

      setSelectedFileIds(new Set());
      await load();

      setSuccessMessage(
        `Đã dọn ${result.deletedCount} file cũ. Giữ lại ${result.keptCount} file mới nhất.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dọn tệp cũ thất bại.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Đang tải biểu mẫu...</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Biểu mẫu đã tạo
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          {data?.documentTitle || `Document #${documentId}`}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Trạng thái: <span className="font-medium">{data?.reviewStatus}</span>
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <PreExportCustomizationPanel
        documentId={documentId}
        onFilesChanged={load}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <a
          href={
            latestDocx
              ? getGeneratedDocumentDownloadUrl(documentId, latestDocx.id)
              : "#"
          }
          className={`rounded-lg border px-4 py-2 text-center text-sm font-semibold ${
            latestDocx
              ? "border-slate-300 text-slate-800"
              : "pointer-events-none border-slate-200 text-slate-400"
          }`}
        >
          Tải DOCX mới nhất
        </a>

        <a
          href={withPdfCacheBuster(
            latestPdf
              ? getGeneratedDocumentDownloadUrl(documentId, latestPdf.id)
              : "#"
          )}
          className={`rounded-lg border px-4 py-2 text-center text-sm font-semibold ${
            latestPdf
              ? "border-slate-300 text-slate-800"
              : "pointer-events-none border-slate-200 text-slate-400"
          }`}
        >
          Tải PDF mới nhất
        </a>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Tệp đã tạo</p>
            <p className="text-xs text-slate-500">
              Chọn tệp để xóa thủ công hoặc dọn nhanh tệp cũ.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={files.length === 0 || actionLoading !== null}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {allVisibleSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedFileIds.size === 0 || actionLoading !== null}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === "DELETE_SELECTED"
                ? "Đang xóa..."
                : `Xóa tệp đã chọn (${selectedFileIds.size})`}
            </button>

            <button
              type="button"
              onClick={handleCleanupOldFiles}
              disabled={files.length <= 2 || actionLoading !== null}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading === "CLEANUP" ? "Đang dọn..." : "Dọn tệp cũ"}
            </button>
          </div>
        </div>

        {files.length ? (
          <div className="space-y-2">
            {files.map((file) => {
              const isSelected = selectedFileIds.has(String(file.id));
              const isLatestDocx = latestDocx?.id === file.id;
              const isLatestPdf = latestPdf?.id === file.id;

              return (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    isSelected
                      ? "border-slate-400 bg-slate-100"
                      : "bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFile(String(file.id))}
                    className="h-4 w-4 rounded border-slate-300"
                    aria-label={`Chọn file ${file.fileName}`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-medium text-slate-900">
                      {file.fileFormat} - {file.fileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID: {file.id} · Size: {formatBytes(file.fileSizeBytes)}
                      {isLatestDocx ? " · DOCX mới nhất" : ""}
                      {isLatestPdf ? " · PDF mới nhất" : ""}
                    </p>
                  </div>

                  <a
                    href={getGeneratedDocumentDownloadUrl(documentId, file.id)}
                    className="shrink-0 text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Tải
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
            Chưa có file nào. Hãy dùng mục &quot;Tùy chỉnh trước khi xuất&quot; ở trên để tạo Word hoặc PDF.
          </p>
        )}
      </div>
    </section>
  );
}
