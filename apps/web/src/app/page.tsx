"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readApi } from "@/lib/api-client";

type CaseItem = {
  id: string;
  caseCode: string;
  caseTitle: string;
  currentStage: string;
  currentStatus: string;
  priority: string;
  updatedAt: string;
};

type CasesResponse = {
  items: CaseItem[];
  pagination: {
    total: number;
  };
};

type ReviewQueueResponse = {
  items: Array<{
    id: string;
    caseCode: string;
    documentTitle: string;
    reviewStatus: string;
    generatedAt: string | null;
  }>;
  summary: Record<string, number>;
};

const modules = [
  {
    href: "/cases",
    title: "Hồ sơ vụ án",
    desc: "Tra cứu, tạo và cập nhật hồ sơ vụ án.",
  },
  {
    href: "/documents",
    title: "Tạo biểu mẫu",
    desc: "Chọn hồ sơ, chọn mẫu và tạo document chờ duyệt.",
  },
  {
    href: "/templates",
    title: "Duyệt biểu mẫu",
    desc: "Kiểm tra file đã render và cập nhật trạng thái duyệt.",
  },
  {
    href: "/imports",
    title: "Import dữ liệu",
    desc: "Đưa file nguồn vào hệ thống để tạo hồ sơ hoặc lưu tham chiếu.",
  },
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function HomePage() {
  const [casesData, setCasesData] = useState<CasesResponse | null>(null);
  const [reviewData, setReviewData] = useState<ReviewQueueResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [casesResponse, reviewResponse] = await Promise.all([
        readApi<CasesResponse>("/cases?pageSize=20", { noStore: true }),
        readApi<ReviewQueueResponse>("/document-review-queue", { noStore: true }),
      ]);
      setCasesData(casesResponse);
      setReviewData(reviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu tổng quan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const kpis = useMemo(() => {
    const caseItems = casesData?.items ?? [];
    const reviewSummary = reviewData?.summary ?? {};
    return [
      {
        label: "Tổng hồ sơ",
        value: String(casesData?.pagination.total ?? 0),
        tone: "bg-blue-50 text-blue-700",
      },
      {
        label: "Đang xử lý",
        value: String(caseItems.filter((item) => item.currentStatus === "IN_PROGRESS").length),
        tone: "bg-indigo-50 text-indigo-700",
      },
      {
        label: "Biểu mẫu chờ duyệt",
        value: String(reviewSummary.WAITING_REVIEW ?? 0),
        tone: "bg-amber-50 text-amber-700",
      },
      {
        label: "Đã duyệt",
        value: String(reviewSummary.APPROVED ?? 0),
        tone: "bg-emerald-50 text-emerald-700",
      },
    ];
  }, [casesData, reviewData]);

  const recentActivities = useMemo(() => {
    const caseActivities = (casesData?.items ?? []).slice(0, 4).map((item) => ({
      title: item.caseTitle,
      meta: `${item.caseCode} · ${item.currentStage} · ${formatDateTime(item.updatedAt)}`,
      href: "/cases",
    }));

    const reviewActivities = (reviewData?.items ?? []).slice(0, 4).map((item) => ({
      title: item.documentTitle,
      meta: `${item.caseCode} · ${item.reviewStatus} · ${formatDateTime(item.generatedAt)}`,
      href: "/templates",
    }));

    return [...caseActivities, ...reviewActivities].slice(0, 6);
  }, [casesData, reviewData]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-950">Tổng quan nghiệp vụ</h1>
              <p className="mt-1 text-sm text-slate-600">
                Dữ liệu được lấy trực tiếp từ hồ sơ và hàng đợi duyệt biểu mẫu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              {loading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {kpis.map((item) => (
            <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${item.tone}`}>
                {item.label}
              </div>
              <div className="mt-4 text-3xl font-black text-slate-950">{item.value}</div>
            </article>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950">Phân hệ nghiệp vụ</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {modules.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <h3 className="text-sm font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-base font-black text-slate-950">Hoạt động gần đây</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
              ) : null}
              {!loading && recentActivities.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">Chưa có hoạt động.</div>
              ) : null}
              {!loading &&
                recentActivities.map((item) => (
                  <Link key={`${item.href}-${item.title}-${item.meta}`} href={item.href} className="block py-3">
                    <div className="text-sm font-bold text-slate-900">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.meta}</div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
