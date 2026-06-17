"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type ReviewStatus =
  | "DRAFT"
  | "GENERATED"
  | "WAITING_REVIEW"
  | "APPROVED"
  | "NEEDS_REVISION"
  | "FINAL_EXPORTED"
  | "CANCELLED";

type ReviewQueueFile = {
  id: string;
  fileFormat: "DOCX" | "PDF";
  fileName: string;
  fileSizeBytes: string;
  isFinal: boolean;
  createdAt: string | null;
};

type ReviewQueueItem = {
  id: string;
  caseCode: string;
  caseTitle: string;
  templateCode: string;
  templateName: string;
  documentCode: string;
  documentTitle: string;
  targetScope: string;
  targetPersonName: string;
  reviewStatus: ReviewStatus;
  reviewStatusLabel: string;
  generatedByName: string;
  approvedByName: string;
  generatedAt: string | null;
  approvedAt: string | null;
  note: string;
  latestDocxFile: ReviewQueueFile | null;
  latestPdfFile: ReviewQueueFile | null;
  hasDocx: boolean;
  hasPdf: boolean;
  lastReview: {
    action: string;
    reviewerName: string;
    reviewNote: string;
    reviewedAt: string | null;
  } | null;
};

type ReviewQueueResponse = {
  items: ReviewQueueItem[];
  summary: Record<string, number>;
};

type FilterKey = "ALL" | ReviewStatus;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "WAITING_REVIEW", label: "Cần phê duyệt" },
  { key: "NEEDS_REVISION", label: "Cần sửa" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "FINAL_EXPORTED", label: "Đã xuất cuối" },
  { key: "CANCELLED", label: "Đã hủy" },
];

function statusClass(status: ReviewStatus) {
  switch (status) {
    case "WAITING_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "NEEDS_REVISION":
      return "border-red-200 bg-red-50 text-red-700";
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FINAL_EXPORTED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "GENERATED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "DRAFT":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "Chưa có";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSize(value: string) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function downloadUrl(documentId: string, fileId: string) {
  return `${API_BASE_URL}/documents/generated/${documentId}/files/${fileId}/download`;
}

export default function TemplatesPage() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadQueue() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/document-review-queue`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Không tải được danh sách duyệt. HTTP ${response.status}`);
      }

      const data = (await response.json()) as ReviewQueueResponse;

      setItems(Array.isArray(data.items) ? data.items : []);
      setSummary(data.summary ?? {});
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách biểu mẫu cần duyệt.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updateReviewStatus(
    documentId: string,
    nextStatus: ReviewStatus,
    defaultNote: string,
  ) {
    const reviewNote =
      nextStatus === "NEEDS_REVISION"
        ? window.prompt("Nhập lý do yêu cầu sửa:", defaultNote) ?? ""
        : defaultNote;

    setUpdatingId(documentId);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/document-review-queue/${documentId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            nextStatus,
            reviewNote,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Không cập nhật được trạng thái. HTTP ${response.status}`);
      }

      await loadQueue();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không cập nhật được trạng thái duyệt.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return items.filter((item) => {
      const matchesStatus =
        activeFilter === "ALL" || item.reviewStatus === activeFilter;

      if (!matchesStatus) return false;

      if (!normalizedKeyword) return true;

      return [
        item.templateCode,
        item.templateName,
        item.documentCode,
        item.documentTitle,
        item.caseCode,
        item.caseTitle,
        item.targetPersonName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword);
    });
  }, [activeFilter, items, keyword]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
                QUANLYVKS / REVIEW QUEUE
              </p>
              <h1 className="mt-3 text-3xl font-black text-slate-950">
                Duyệt biểu mẫu đã xuất
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Biểu mẫu sau khi render DOCX/PDF sẽ xuất hiện ở đây để kiểm tra,
                mở xử lý, tải file và theo dõi trạng thái phê duyệt.
              </p>
            </div>

            <button
              type="button"
              onClick={loadQueue}
              disabled={isLoading}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Đang tải..." : "Tải lại danh sách"}
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Tổng biểu mẫu
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {summary.total ?? items.length}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase text-amber-700">
                Cần phê duyệt
              </p>
              <p className="mt-2 text-2xl font-black text-amber-800">
                {summary.WAITING_REVIEW ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-bold uppercase text-red-700">
                Cần sửa
              </p>
              <p className="mt-2 text-2xl font-black text-red-700">
                {summary.NEEDS_REVISION ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase text-emerald-700">
                Đã duyệt
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-700">
                {summary.APPROVED ?? 0}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const count =
                  filter.key === "ALL"
                    ? summary.total ?? items.length
                    : summary[filter.key] ?? 0;

                const isActive = activeFilter === filter.key;

                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={
                      isActive
                        ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                        : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    }
                  >
                    {filter.label} <span className="ml-1 opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>

            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo mã BM, số văn bản, hồ sơ, người liên quan..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 lg:max-w-md"
            />
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {errorMessage}
          </section>
        ) : null}

        {isLoading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
            Đang tải danh sách biểu mẫu cần duyệt...
          </section>
        ) : null}

        {!isLoading && filteredItems.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Không có biểu mẫu phù hợp
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Hãy render DOCX/PDF từ trang tạo biểu mẫu, hoặc đổi bộ lọc trạng thái.
            </p>
          </section>
        ) : null}

        <section className="space-y-4">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      {item.templateCode}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                        item.reviewStatus,
                      )}`}
                    >
                      {item.reviewStatusLabel}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {item.hasPdf ? "Đã có PDF" : item.hasDocx ? "Đã có DOCX" : "Chưa có file"}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-black text-slate-950">
                    {item.documentTitle || `${item.templateCode} - ${item.templateName}`}
                  </h2>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-bold text-slate-800">Ngày tạo:</span>{" "}
                      {formatDateTime(item.generatedAt)}
                    </p>
                  </div>

                  {item.note ? (
                    <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {item.note}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2 lg:w-48">
                  <a
                    href={`/documents/${item.id}`}
                    className="rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Mở xử lý
                  </a>

                  {item.reviewStatus !== "APPROVED" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void updateReviewStatus(
                          item.id,
                          "APPROVED",
                          "Đã kiểm tra nội dung và phê duyệt biểu mẫu.",
                        )
                      }
                      disabled={updatingId === item.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingId === item.id ? "Đang duyệt..." : "Phê duyệt"}
                    </button>
                  ) : null}

                  {item.reviewStatus !== "NEEDS_REVISION" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void updateReviewStatus(
                          item.id,
                          "NEEDS_REVISION",
                          "Cần kiểm tra và chỉnh sửa lại biểu mẫu.",
                        )
                      }
                      disabled={updatingId === item.id}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Yêu cầu sửa
                    </button>
                  ) : null}

                  {item.reviewStatus !== "CANCELLED" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void updateReviewStatus(
                          item.id,
                          "CANCELLED",
                          "Hủy biểu mẫu khỏi luồng phê duyệt.",
                        )
                      }
                      disabled={updatingId === item.id}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Hủy
                    </button>
                  ) : null}


                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
