"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { readApi } from "@/lib/api-client";

type CaseItem = {
  id: string;
  caseCode: string;
  nationalCaseCode: string | null;
  caseTitle: string;
  caseSummary: string | null;
  currentStage: string;
  currentStatus: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
  receivedDate: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

type CasesResponse = {
  items: CaseItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const stageOptions = [
  { value: "", label: "Tất cả giai đoạn" },
  { value: "RECEPTION", label: "Tiếp nhận" },
  { value: "INVESTIGATION", label: "Điều tra" },
  { value: "PROSECUTION", label: "Truy tố" },
  { value: "TRIAL_PREPARATION", label: "Chuẩn bị xét xử" },
  { value: "CLOSED", label: "Kết thúc" },
];

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Nháp" },
  { value: "RECEIVED", label: "Đã tiếp nhận" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "WAITING_REVIEW", label: "Chờ duyệt" },
  { value: "CLOSED", label: "Đã đóng" },
];

function statusTone(status: string) {
  if (status === "CLOSED") return "bg-slate-100 text-slate-700";
  if (status === "WAITING_REVIEW") return "bg-amber-50 text-amber-700";
  if (status === "IN_PROGRESS") return "bg-blue-50 text-blue-700";
  if (status === "RECEIVED") return "bg-emerald-50 text-emerald-700";
  return "bg-slate-50 text-slate-600";
}

function priorityTone(priority: string) {
  if (priority === "URGENT") return "bg-rose-50 text-rose-700";
  if (priority === "HIGH") return "bg-orange-50 text-orange-700";
  if (priority === "LOW") return "bg-slate-50 text-slate-500";
  return "bg-blue-50 text-blue-700";
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <CasesPageContent />
    </Suspense>
  );
}

function CasesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [pagination, setPagination] = useState<CasesResponse["pagination"] | null>(null);
  const [q, setQ] = useState(initialQ);
  const [stage, setStage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    caseCode: "",
    caseTitle: "",
    caseSummary: "",
    receivedDate: "",
    priority: "NORMAL",
  });

  const loadCases = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (stage) params.set("stage", stage);
      if (status) params.set("status", status);
      params.set("pageSize", "20");

      const data = await readApi<CasesResponse>(`/cases?${params.toString()}`, {
        noStore: true,
      });
      setCases(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được hồ sơ.");
    } finally {
      setIsLoading(false);
    }
  }, [q, stage, status]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  useEffect(() => {
    if (q === initialQ) return;
    const next = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      next.set("q", q.trim());
    } else {
      next.delete("q");
    }
    const qs = next.toString();
    router.replace(`/cases${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [q, initialQ, router, searchParams]);

  const totalLabel = useMemo(() => {
    if (!pagination) return "0 hồ sơ";
    return `${pagination.total} hồ sơ`;
  }, [pagination]);

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.caseTitle.trim()) return;

    setIsCreating(true);
    setError("");
    try {
      await readApi<CaseItem>("/cases", {
        method: "POST",
        body: JSON.stringify({
          caseCode: draft.caseCode.trim() || undefined,
          caseTitle: draft.caseTitle.trim(),
          caseSummary: draft.caseSummary.trim() || undefined,
          receivedDate: draft.receivedDate || undefined,
          currentStage: "RECEPTION",
          currentStatus: "DRAFT",
          priority: draft.priority,
        }),
      });
      setDraft({
        caseCode: "",
        caseTitle: "",
        caseSummary: "",
        receivedDate: "",
        priority: "NORMAL",
      });
      await loadCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được hồ sơ.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-950">Hồ sơ vụ án</h1>
              <p className="mt-1 text-sm text-slate-600">
                Quản lý danh sách hồ sơ, lọc theo giai đoạn/trạng thái và tạo hồ sơ mới.
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
              {totalLabel}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row">
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void loadCases();
                }}
                placeholder="Tìm mã hồ sơ, tên vụ án, mô tả..."
                className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
              >
                {stageOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void loadCases()}
                className="h-10 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Lọc
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">Mã hồ sơ</th>
                    <th className="px-4 py-3 font-black">Tên vụ án</th>
                    <th className="px-4 py-3 font-black">Giai đoạn</th>
                    <th className="px-4 py-3 font-black">Trạng thái</th>
                    <th className="px-4 py-3 font-black">Ưu tiên</th>
                    <th className="px-4 py-3 font-black">Ngày nhận</th>
                    <th className="px-4 py-3 font-black text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        Đang tải hồ sơ...
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading && cases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        Chưa có hồ sơ phù hợp.
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading &&
                    cases.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-3 font-bold text-slate-950">
                          {item.caseCode}
                          {item.nationalCaseCode ? (
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {item.nationalCaseCode}
                            </div>
                          ) : null}
                        </td>
                        <td className="max-w-md px-4 py-3">
                          <div className="font-semibold text-slate-900">{item.caseTitle}</div>
                          {item.caseSummary ? (
                            <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {item.caseSummary}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.currentStage}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusTone(item.currentStatus)}`}>
                            {item.currentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityTone(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(item.receivedDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => router.push(`/cases/${item.id}`)}
                            className="rounded-md bg-blue-700 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-800"
                          >
                            Mở
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={createCase} className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-base font-black text-slate-950">Tạo hồ sơ mới</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Mã hồ sơ</span>
                <input
                  value={draft.caseCode}
                  onChange={(event) => setDraft((value) => ({ ...value, caseCode: event.target.value }))}
                  placeholder="Để trống để tự sinh"
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Tên vụ án</span>
                <input
                  required
                  value={draft.caseTitle}
                  onChange={(event) => setDraft((value) => ({ ...value, caseTitle: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Ngày tiếp nhận</span>
                <input
                  type="date"
                  value={draft.receivedDate}
                  onChange={(event) => setDraft((value) => ({ ...value, receivedDate: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Ưu tiên</span>
                <select
                  value={draft.priority}
                  onChange={(event) => setDraft((value) => ({ ...value, priority: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400"
                >
                  <option value="LOW">Thấp</option>
                  <option value="NORMAL">Bình thường</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Tóm tắt</span>
                <textarea
                  value={draft.caseSummary}
                  onChange={(event) => setDraft((value) => ({ ...value, caseSummary: event.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={isCreating || !draft.caseTitle.trim()}
              className="mt-4 h-10 w-full rounded-md bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isCreating ? "Đang tạo..." : "Tạo hồ sơ"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
