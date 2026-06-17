"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readApi } from "@/lib/api-client";

type ReportPeriod = "WEEK" | "MONTH";

type ReportRow = {
  time: string;
  wardName: string;
  offenseName: string;
  caseCount: number;
};

type ReportSummary = {
  period: ReportPeriod;
  range: {
    from: string;
    to: string;
  };
  totalCases: number;
  byWard: Array<{ wardName: string; caseCount: number }>;
  byOffense: Array<{ offenseName: string; caseCount: number }>;
  rows: ReportRow[];
};

type ReviewQueueResponse = {
  summary: Record<string, number>;
};

function todayForInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDate(value?: string) {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatRange(summary: ReportSummary | null) {
  if (!summary) return "--";
  return `${formatDate(summary.range.from)} - ${formatDate(summary.range.to)}`;
}

function buildReportPath(period: ReportPeriod, anchorDate: string) {
  const params = new URLSearchParams({
    period,
    anchorDate,
  });
  return `/cases/reports/summary?${params.toString()}`;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("MONTH");
  const [anchorDate, setAnchorDate] = useState(todayForInput);
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [reviewData, setReviewData] = useState<ReviewQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reportResponse, reviewResponse] = await Promise.all([
        readApi<ReportSummary>(buildReportPath(period, anchorDate), {
          noStore: true,
        }),
        readApi<ReviewQueueResponse>("/document-review-queue", {
          noStore: true,
        }),
      ]);
      setReportData(reportResponse);
      setReviewData(reviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [anchorDate, period]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const approvedDocuments = reviewData?.summary.APPROVED ?? 0;
  const waitingDocuments = reviewData?.summary.WAITING_REVIEW ?? 0;

  const totalGroupedRows = useMemo(
    () =>
      reportData?.rows.reduce((total, item) => total + item.caseCount, 0) ?? 0,
    [reportData],
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="flex flex-col gap-4 border-b border-zinc-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-black text-zinc-950">
              Báo cáo - Thống kê
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Dữ liệu được tổng hợp trực tiếp từ hồ sơ, phường và tội danh đã lưu.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div>
              <label className="text-xs font-black uppercase text-zinc-500">
                Kỳ báo cáo
              </label>
              <div className="mt-2 grid h-10 grid-cols-2 overflow-hidden rounded-md border border-zinc-200 bg-white">
                {(["WEEK", "MONTH"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    className={`px-4 text-sm font-bold transition ${
                      period === value
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {value === "WEEK" ? "Tuần" : "Tháng"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="report-anchor-date"
                className="text-xs font-black uppercase text-zinc-500"
              >
                Ngày neo
              </label>
              <input
                id="report-anchor-date"
                type="date"
                value={anchorDate}
                onChange={(event) => setAnchorDate(event.target.value)}
                className="mt-2 h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none transition focus:border-zinc-400"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadReports()}
              className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-black text-zinc-800 transition hover:bg-zinc-100"
            >
              {loading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-4">
          <article className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs font-black uppercase text-zinc-500">
              Hồ sơ trong kỳ
            </div>
            <div className="mt-3 text-3xl font-black text-zinc-950">
              {reportData?.totalCases ?? 0}
            </div>
            <div className="mt-2 text-xs font-semibold text-zinc-500">
              {formatRange(reportData)}
            </div>
          </article>

          <article className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs font-black uppercase text-zinc-500">
              Dòng thống kê
            </div>
            <div className="mt-3 text-3xl font-black text-sky-700">
              {totalGroupedRows}
            </div>
            <div className="mt-2 text-xs font-semibold text-zinc-500">
              Theo ngày, phường, tội danh
            </div>
          </article>

          <article className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs font-black uppercase text-zinc-500">
              Chờ duyệt biểu mẫu
            </div>
            <div className="mt-3 text-3xl font-black text-amber-700">
              {waitingDocuments}
            </div>
            <div className="mt-2 text-xs font-semibold text-zinc-500">
              Từ hàng đợi duyệt
            </div>
          </article>

          <article className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs font-black uppercase text-zinc-500">
              Đã duyệt biểu mẫu
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-700">
              {approvedDocuments}
            </div>
            <div className="mt-2 text-xs font-semibold text-zinc-500">
              Từ hàng đợi duyệt
            </div>
          </article>
        </section>

        <section className="rounded-md border border-zinc-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-base font-black text-zinc-950">
              Chi tiết theo thời gian, phường và tội danh
            </h2>
            <div className="text-sm font-bold text-zinc-500">
              {formatRange(reportData)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-100">
                <tr className="text-left text-xs font-black uppercase text-zinc-500">
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Phường</th>
                  <th className="px-4 py-3">Tội danh</th>
                  <th className="px-4 py-3 text-right">Số hồ sơ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-zinc-500" colSpan={4}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : null}

                {!loading && reportData?.rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-zinc-500" colSpan={4}>
                      Chưa có hồ sơ trong kỳ này.
                    </td>
                  </tr>
                ) : null}

                {!loading
                  ? reportData?.rows.map((item) => (
                      <tr key={`${item.time}-${item.wardName}-${item.offenseName}`}>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-800">
                          {formatDate(item.time)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-700">
                          {item.wardName}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {item.offenseName}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-zinc-950">
                          {item.caseCount}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <RankList
            title="Theo phường"
            emptyLabel="Chưa có dữ liệu phường."
            items={(reportData?.byWard ?? []).map((item) => ({
              label: item.wardName,
              count: item.caseCount,
            }))}
          />

          <RankList
            title="Theo tội danh"
            emptyLabel="Chưa có dữ liệu tội danh."
            items={(reportData?.byOffense ?? []).map((item) => ({
              label: item.offenseName,
              count: item.caseCount,
            }))}
          />
        </section>
      </div>
    </main>
  );
}

function RankList({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: Array<{ label: string; count: number }>;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <h2 className="text-base font-black text-zinc-950">{title}</h2>
      <div className="mt-3 divide-y divide-zinc-100">
        {items.length === 0 ? (
          <div className="py-6 text-sm text-zinc-500">{emptyLabel}</div>
        ) : null}

        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 py-3 text-sm"
          >
            <span className="min-w-0 font-semibold text-zinc-700">
              {item.label}
            </span>
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 font-black text-zinc-800">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
