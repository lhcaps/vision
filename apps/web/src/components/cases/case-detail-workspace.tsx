"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchOfficials } from "@/lib/auth-client";
import {
  addCaseAssignment,
  addCaseEvidence,
  addCaseOffense,
  addCasePerson,
  listCaseAssignments,
  listCaseEvidence,
  listCaseOffenses,
  listCasePeople,
  removeCaseAssignment,
  removeCaseEvidence,
  removeCaseOffense,
  removeCasePerson,
  updateCaseAssignment,
  updateCaseEvidence,
  updateCaseOffense,
  updateCasePerson,
  type AddCaseAssignmentPayload,
  type AddCaseOffensePayload,
  type AddCasePersonPayload,
  type AddEvidencePayload,
  type CaseAssignment,
  type CaseOffense,
  type CasePerson,
  type EvidenceItem,
  type UpdateCaseAssignmentPayload,
  type UpdateCaseOffensePayload,
  type UpdateCasePersonPayload,
  type UpdateEvidencePayload,
} from "@/lib/cases-api";
import {
  getCaseDetail,
  type CaseDetail,
  type CaseEvent,
  type RecentGeneratedDocument,
} from "@/lib/case-detail-api";

// =========================================================================
// Tab definitions
// =========================================================================

type TabId = "overview" | "people" | "offenses" | "assignments" | "evidence" | "documents";

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: "overview", label: "Tổng quan" },
  { id: "people", label: "Người liên quan" },
  { id: "offenses", label: "Tội danh" },
  { id: "assignments", label: "Phân công" },
  { id: "evidence", label: "Tang vật" },
  { id: "documents", label: "Biểu mẫu đã tạo" },
] as const;

const ROLE_OPTIONS = [
  { value: "ACCUSED", label: "Bị can" },
  { value: "DEFENDANT", label: "Bị cáo" },
  { value: "VICTIM", label: "Bị hại" },
  { value: "REPORTER", label: "Người tố giác" },
  { value: "WITNESS", label: "Nhân chứng" },
  { value: "RELATED_PERSON", label: "Người liên quan" },
  { value: "GUARANTOR", label: "Người bảo lĩnh" },
  { value: "LEGAL_REPRESENTATIVE", label: "Người bảo hộ" },
  { value: "OTHER", label: "Khác" },
] as const;

const LEGAL_STATUS_OPTIONS = [
  { value: "NOT_PROSECUTED", label: "Chưa khởi tố" },
  { value: "PROSECUTED", label: "Đã khởi tố" },
  { value: "DETAINED", label: "Tạm giữ" },
  { value: "TEMPORARY_DETENTION", label: "Tạm giam" },
  { value: "RESIDENCE_BAN", label: "Cấm cư trú" },
  { value: "BAIL", label: "Bảo lĩnh" },
  { value: "SUSPENDED", label: "Tạm đình chỉ" },
  { value: "TERMINATED", label: "Đình chỉ" },
  { value: "OTHER", label: "Khác" },
] as const;

// =========================================================================
// Helpers
// =========================================================================

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

function confirmAction(message: string): boolean {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}

type OfficialOption = {
  id: string;
  fullName: string;
  positionTitle: string | null;
};

// =========================================================================
// Modal shell
// =========================================================================

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-black text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// =========================================================================
// Root component
// =========================================================================

type CaseDetailWorkspaceProps = {
  caseId: string;
};

export function CaseDetailWorkspace({ caseId }: CaseDetailWorkspaceProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getCaseDetail(caseId);
      setDetail(data);
    } catch (err) {
      setError(errorMessage(err, "Không tải được hồ sơ."));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/cases"
                className="text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                ← Quay lại danh sách
              </Link>
              <h1 className="mt-2 text-2xl font-black text-slate-950">
                {detail?.caseTitle ?? "Đang tải..."}
              </h1>
              {detail ? (
                <p className="mt-1 text-sm text-slate-600">
                  Mã hồ sơ: <span className="font-bold">{detail.caseCode}</span>
                  {detail.nationalCaseCode ? (
                    <span className="ml-2 text-xs text-slate-500">
                      ({detail.nationalCaseCode})
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
            {detail ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  {detail.currentStage}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  {detail.currentStatus}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  {detail.priority}
                </span>
              </div>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <nav className="flex flex-wrap gap-2 border-b border-slate-200">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`-mb-px rounded-t-md border border-b-0 px-4 py-2 text-sm font-bold transition ${
                tab === item.id
                  ? "border-slate-200 bg-white text-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          {isLoading || !detail ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Đang tải dữ liệu hồ sơ...
            </div>
          ) : tab === "overview" ? (
            <OverviewTab detail={detail} />
          ) : tab === "people" ? (
            <PeopleTab caseId={caseId} onChanged={load} />
          ) : tab === "offenses" ? (
            <OffensesTab caseId={caseId} onChanged={load} />
          ) : tab === "assignments" ? (
            <AssignmentsTab caseId={caseId} onChanged={load} />
          ) : tab === "evidence" ? (
            <EvidenceTab caseId={caseId} onChanged={load} />
          ) : (
            <DocumentsTab recent={detail.recentGeneratedDocuments} />
          )}
        </section>
      </div>
    </main>
  );
}

// =========================================================================
// Overview tab
// =========================================================================

function OverviewTab({ detail }: { detail: CaseDetail }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">
            Thông tin chung
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Giai đoạn" value={detail.currentStage} />
            <Field label="Trạng thái" value={detail.currentStatus} />
            <Field label="Ưu tiên" value={detail.priority} />
            <Field label="Loại vụ án" value={detail.caseType} />
            <Field label="Ngày tiếp nhận" value={formatDate(detail.receivedDate)} />
            <Field label="Ngày chấp nhận" value={formatDate(detail.acceptedDate)} />
            <Field label="Ngày truy tố" value={formatDate(detail.prosecutedDate)} />
            <Field label="Ngày đóng" value={formatDate(detail.closedDate)} />
            <Field label="Người tạo" value={detail.createdByName ?? "—"} />
            <Field label="Người cập nhật" value={detail.updatedByName ?? "—"} />
          </dl>
          {detail.caseSummary ? (
            <div className="mt-4">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">
                Tóm tắt
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                {detail.caseSummary}
              </p>
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">
            Timeline sự kiện
          </h2>
          {detail.events.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Chưa có sự kiện nào.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {detail.events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <Stat label="Người liên quan" value={detail.people.length} />
        <Stat label="Tội danh" value={detail.offenses.length} />
        <Stat label="Phân công" value={detail.assignments.length} />
        <Stat label="Tang vật" value={detail.evidence.length} />
        <Stat label="Biểu mẫu đã tạo" value={detail.recentGeneratedDocuments.length} />
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function EventRow({ event }: { event: CaseEvent }) {
  return (
    <li className="flex gap-3 border-l-2 border-blue-300 pl-3">
      <div className="flex-1">
        <div className="text-sm font-bold text-slate-900">{event.eventTitle}</div>
        {event.eventDescription ? (
          <div className="mt-0.5 text-xs text-slate-600">
            {event.eventDescription}
          </div>
        ) : null}
        <div className="mt-1 text-xs text-slate-400">
          {event.eventType} · {formatDateTime(event.eventDate)}
          {event.createdByName ? ` · ${event.createdByName}` : ""}
        </div>
      </div>
    </li>
  );
}

// =========================================================================
// People tab
// =========================================================================

function PeopleTab({
  caseId,
  onChanged,
}: {
  caseId: string;
  onChanged: () => Promise<void> | void;
}) {
  const [items, setItems] = useState<CasePerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<CasePerson | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const rows = await listCasePeople(caseId);
      setItems(rows);
    } catch (err) {
      setError(errorMessage(err, "Không tải được danh sách người liên quan."));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(row: CasePerson) {
    if (!confirmAction(`Xoá người liên quan "${row.person?.fullName ?? row.id}"?`)) return;
    try {
      await removeCasePerson(caseId, row.id);
      await load();
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, "Không xoá được."));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-950">
          Danh sách người liên quan ({items.length})
        </h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-800"
        >
          + Thêm người liên quan
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-slate-500">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Chưa có người liên quan.
        </p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-black">#</th>
              <th className="px-3 py-2 font-black">Họ tên</th>
              <th className="px-3 py-2 font-black">Vai trò</th>
              <th className="px-3 py-2 font-black">Trạng thái PL</th>
              <th className="px-3 py-2 font-black">Chính</th>
              <th className="px-3 py-2 font-black">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{row.personOrder}</td>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {row.person?.fullName ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">{row.roleType}</td>
                <td className="px-3 py-2 text-slate-600">
                  {row.legalStatus ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {row.isPrimary ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                      Chính
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold hover:bg-slate-50"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(row)}
                    className="rounded-md border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <PersonFormModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={async (payload) => {
          await addCasePerson(caseId, payload);
          setAdding(false);
          await load();
          await onChanged();
        }}
        onUpdate={async (payload) => {
          if (!editing) return;
          await updateCasePerson(caseId, editing.id, payload);
          setEditing(null);
          await load();
          await onChanged();
        }}
      />
      <PersonFormModal
        open={editing !== null}
        editing={editing}
        onClose={() => setEditing(null)}
        onAdd={async (payload) => {
          await addCasePerson(caseId, payload);
          setAdding(false);
          await load();
          await onChanged();
        }}
        onUpdate={async (payload) => {
          if (!editing) return;
          await updateCasePerson(caseId, editing.id, payload);
          setEditing(null);
          await load();
          await onChanged();
        }}
      />
    </div>
  );
}

function PersonFormModal({
  open,
  editing,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  editing?: CasePerson | null;
  onClose: () => void;
  onAdd: (payload: AddCasePersonPayload) => Promise<void>;
  onUpdate: (payload: UpdateCasePersonPayload) => Promise<void>;
}) {
  const isEdit = Boolean(editing);
  const [form, setForm] = useState<AddCasePersonPayload>({
    fullName: "",
    roleType: "ACCUSED",
    legalStatus: "",
    note: "",
    personOrder: undefined,
    isPrimary: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        fullName: editing.person?.fullName ?? "",
        roleType: editing.roleType,
        legalStatus: editing.legalStatus ?? "",
        note: editing.note ?? "",
        personOrder: editing.personOrder,
        isPrimary: editing.isPrimary,
      });
    } else {
      setForm({
        fullName: "",
        roleType: "ACCUSED",
        legalStatus: "",
        note: "",
        personOrder: undefined,
        isPrimary: false,
      });
    }
  }, [editing, open]);

  async function submit() {
    setIsSubmitting(true);
    setError("");
    try {
      if (isEdit) {
        await onUpdate({
          legalStatus: form.legalStatus || undefined,
          personOrder: form.personOrder,
          isPrimary: form.isPrimary,
          note: form.note || undefined,
        });
      } else {
        await onAdd({
          fullName: form.fullName?.trim() || undefined,
          roleType: form.roleType,
          legalStatus: form.legalStatus || undefined,
          personOrder: form.personOrder,
          isPrimary: form.isPrimary,
          note: form.note || undefined,
        });
      }
    } catch (err) {
      setError(errorMessage(err, "Không lưu được."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Cập nhật người liên quan" : "Thêm người liên quan"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting}
            className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-800 disabled:bg-slate-300"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="space-y-3">
        {!isEdit ? (
          <FormField label="Họ tên">
            <input
              value={form.fullName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
        ) : null}
        <FormField label="Vai trò">
          <select
            value={form.roleType ?? "ACCUSED"}
            disabled={isEdit}
            onChange={(e) => setForm((f) => ({ ...f, roleType: e.target.value }))}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Trạng thái pháp lý">
          <select
            value={form.legalStatus ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, legalStatus: e.target.value }))}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
          >
            <option value="">— Không —</option>
            {LEGAL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Thứ tự">
          <input
            type="number"
            min={1}
            value={form.personOrder ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                personOrder: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPrimary ?? false}
            onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
          />
          Là đối tượng chính
        </label>
        <FormField label="Ghi chú">
          <textarea
            value={form.note ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
          />
        </FormField>
      </div>
    </Modal>
  );
}

// =========================================================================
// Offenses tab
// =========================================================================

function OffensesTab({
  caseId,
  onChanged,
}: {
  caseId: string;
  onChanged: () => Promise<void> | void;
}) {
  const [items, setItems] = useState<CaseOffense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CaseOffense | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const rows = await listCaseOffenses(caseId);
      setItems(rows);
    } catch (err) {
      setError(errorMessage(err, "Không tải được danh sách tội danh."));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(row: CaseOffense) {
    const name = row.offense?.offenseName ?? row.id;
    if (!confirmAction(`Xoá tội danh "${name}"?`)) return;
    try {
      await removeCaseOffense(caseId, row.id);
      await load();
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, "Không xoá được."));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-950">
          Danh sách tội danh ({items.length})
        </h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-800"
        >
          + Thêm tội danh
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-slate-500">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Chưa có tội danh.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-black">#</th>
              <th className="px-3 py-2 font-black">Tên tội danh</th>
              <th className="px-3 py-2 font-black">Mô tả</th>
              <th className="px-3 py-2 font-black">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{row.id}</td>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {row.offense?.offenseName ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {row.offenseDescription ?? "—"}
                </td>
                <td className="px-3 py-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold hover:bg-slate-50"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(row)}
                    className="rounded-md border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <OffenseFormModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={async (payload) => {
          await addCaseOffense(caseId, payload);
          setAdding(false);
          await load();
          await onChanged();
        }}
        onUpdate={async (payload) => {
          if (!editing) return;
          await updateCaseOffense(caseId, editing.id, payload);
          setEditing(null);
          await load();
          await onChanged();
        }}
      />
      <OffenseFormModal
        open={editing !== null}
        editing={editing}
        onClose={() => setEditing(null)}
        onAdd={async (payload) => {
          await addCaseOffense(caseId, payload);
          setAdding(false);
          await load();
          await onChanged();
        }}
        onUpdate={async (payload) => {
          if (!editing) return;
          await updateCaseOffense(caseId, editing.id, payload);
          setEditing(null);
          await load();
          await onChanged();
        }}
      />
    </div>
  );
}

function OffenseFormModal({
  open,
  editing,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  editing?: CaseOffense | null;
  onClose: () => void;
  onAdd: (payload: AddCaseOffensePayload) => Promise<void>;
  onUpdate: (payload: UpdateCaseOffensePayload) => Promise<void>;
}) {
  const isEdit = Boolean(editing);
  const [form, setForm] = useState<AddCaseOffensePayload>({
    offenseName: "",
    offenseCode: "",
    offenseGroup: "",
    offenseDescription: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        offenseName: editing.offense?.offenseName ?? "",
        offenseDescription: editing.offenseDescription ?? "",
      });
    } else {
      setForm({
        offenseName: "",
        offenseCode: "",
        offenseGroup: "",
        offenseDescription: "",
      });
    }
  }, [editing, open]);

  async function submit() {
    setIsSubmitting(true);
    setError("");
    try {
      if (isEdit) {
        await onUpdate({
          offenseDescription: form.offenseDescription || undefined,
        });
      } else {
        if (!form.offenseName.trim()) {
          setError("Cần nhập tên tội danh.");
          setIsSubmitting(false);
          return;
        }
        await onAdd({
          offenseName: form.offenseName.trim(),
          offenseCode: form.offenseCode || undefined,
          offenseGroup: form.offenseGroup || undefined,
          offenseDescription: form.offenseDescription || undefined,
        });
      }
    } catch (err) {
      setError(errorMessage(err, "Không lưu được."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Cập nhật tội danh" : "Thêm tội danh"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting}
            className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-800 disabled:bg-slate-300"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="space-y-3">
        <FormField label="Tên tội danh *">
          <input
            disabled={isEdit}
            value={form.offenseName}
            onChange={(e) => setForm((f) => ({ ...f, offenseName: e.target.value }))}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm disabled:bg-slate-100"
          />
        </FormField>
        {!isEdit ? (
          <>
            <FormField label="Mã tội danh">
              <input
                value={form.offenseCode ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, offenseCode: e.target.value }))}
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
              />
            </FormField>
            <FormField label="Nhóm tội danh">
              <input
                value={form.offenseGroup ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, offenseGroup: e.target.value }))}
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
              />
            </FormField>
          </>
        ) : null}
        <FormField label="Mô tả">
          <textarea
            value={form.offenseDescription ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, offenseDescription: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
          />
        </FormField>
      </div>
    </Modal>
  );
}

// =========================================================================
// Assignments tab
// =========================================================================

function AssignmentsTab({
  caseId,
  onChanged,
}: {
  caseId: string;
  onChanged: () => Promise<void> | void;
}) {
  const [items, setItems] = useState<CaseAssignment[]>([]);
  const [officials, setOfficials] = useState<OfficialOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CaseAssignment | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [rows, officialsRows] = await Promise.all([
        listCaseAssignments(caseId),
        fetchOfficials().catch(() => [] as OfficialOption[]),
      ]);
      setItems(rows);
      setOfficials(officialsRows);
    } catch (err) {
      setError(errorMessage(err, "Không tải được danh sách phân công."));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(row: CaseAssignment) {
    if (!confirmAction(`Xoá phân công "${row.assignmentRole}"?`)) return;
    try {
      await removeCaseAssignment(caseId, row.id);
      await load();
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, "Không xoá được."));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-950">
          Phân công trong hồ sơ ({items.length})
        </h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-800"
        >
          + Thêm phân công
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-slate-500">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Chưa có phân công.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-black">Vai trò</th>
              <th className="px-3 py-2 font-black">Cán bộ</th>
              <th className="px-3 py-2 font-black">Ngày bắt đầu</th>
              <th className="px-3 py-2 font-black">Ngày kết thúc</th>
              <th className="px-3 py-2 font-black">QĐ số</th>
              <th className="px-3 py-2 font-black">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {row.assignmentRole}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {row.official?.fullName ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">{formatDate(row.assignedDate)}</td>
                <td className="px-3 py-2 text-slate-600">{formatDate(row.endedDate)}</td>
                <td className="px-3 py-2 text-slate-600">{row.decisionNo ?? "—"}</td>
                <td className="px-3 py-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold hover:bg-slate-50"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(row)}
                    className="rounded-md border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AssignmentFormModal
        open={adding}
        officials={officials}
        onClose={() => setAdding(false)}
        onAdd={async (payload) => {
          await addCaseAssignment(caseId, payload);
          setAdding(false);
          await load();
          await onChanged();
        }}
        onUpdate={async (payload) => {
          if (!editing) return;
          await updateCaseAssignment(caseId, editing.id, payload);
          setEditing(null);
          await load();
          await onChanged();
        }}
      />
      <AssignmentFormModal
        open={editing !== null}
        editing={editing}
        officials={officials}
        onClose={() => setEditing(null)}
        onAdd={async (payload) => {
          await addCaseAssignment(caseId, payload);
          setAdding(false);
          await load();
          await onChanged();
        }}
        onUpdate={async (payload) => {
          if (!editing) return;
          await updateCaseAssignment(caseId, editing.id, payload);
          setEditing(null);
          await load();
          await onChanged();
        }}
      />
    </div>
  );
}

function AssignmentFormModal({
  open,
  editing,
  officials,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  editing?: CaseAssignment | null;
  officials: OfficialOption[];
  onClose: () => void;
  onAdd: (payload: AddCaseAssignmentPayload) => Promise<void>;
  onUpdate: (payload: UpdateCaseAssignmentPayload) => Promise<void>;
}) {
  const isEdit = Boolean(editing);
  const [form, setForm] = useState<AddCaseAssignmentPayload>({
    officialId: "",
    assignmentRole: "PROSECUTOR",
    assignedDate: "",
    endedDate: "",
    decisionNo: "",
    decisionDate: "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        officialId: editing.officialId ?? "",
        assignmentRole: editing.assignmentRole,
        assignedDate: editing.assignedDate
          ? editing.assignedDate.slice(0, 10)
          : "",
        endedDate: editing.endedDate ? editing.endedDate.slice(0, 10) : "",
        decisionNo: editing.decisionNo ?? "",
        decisionDate: editing.decisionDate
          ? editing.decisionDate.slice(0, 10)
          : "",
        note: editing.note ?? "",
      });
    } else {
      setForm({
        officialId: "",
        assignmentRole: "PROSECUTOR",
        assignedDate: "",
        endedDate: "",
        decisionNo: "",
        decisionDate: "",
        note: "",
      });
    }
  }, [editing, open]);

  async function submit() {
    setIsSubmitting(true);
    setError("");
    try {
      if (!form.assignmentRole?.trim()) {
        setError("Cần nhập vai trò phân công.");
        setIsSubmitting(false);
        return;
      }
      await onAdd({
        officialId: form.officialId || undefined,
        assignmentRole: form.assignmentRole?.trim(),
        assignedDate: form.assignedDate || undefined,
        endedDate: form.endedDate || undefined,
        decisionNo: form.decisionNo || undefined,
        decisionDate: form.decisionDate || undefined,
        note: form.note || undefined,
      });
    } catch (err) {
      setError(errorMessage(err, "Không lưu được."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Cập nhật phân công" : "Thêm phân công"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting}
            className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-800 disabled:bg-slate-300"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="space-y-3">
        <FormField label="Vai trò *">
          <input
            value={form.assignmentRole ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, assignmentRole: e.target.value }))}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
          />
        </FormField>
        <FormField label="Cán bộ">
          <select
            value={form.officialId ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, officialId: e.target.value }))}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
          >
            <option value="">— Chưa chọn —</option>
            {officials.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName}
                {o.positionTitle ? ` (${o.positionTitle})` : ""}
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Ngày bắt đầu">
            <input
              type="date"
              value={form.assignedDate ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, assignedDate: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
          <FormField label="Ngày kết thúc">
            <input
              type="date"
              value={form.endedDate ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, endedDate: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Số QĐ">
            <input
              value={form.decisionNo ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, decisionNo: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
          <FormField label="Ngày QĐ">
            <input
              type="date"
              value={form.decisionDate ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, decisionDate: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
        </div>
        <FormField label="Ghi chú">
          <textarea
            value={form.note ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
          />
        </FormField>
      </div>
    </Modal>
  );
}

// =========================================================================
// Evidence tab
// =========================================================================

function EvidenceTab({
  caseId,
  onChanged,
}: {
  caseId: string;
  onChanged: () => Promise<void> | void;
}) {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EvidenceItem | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const rows = await listCaseEvidence(caseId);
      setItems(rows);
    } catch (err) {
      setError(errorMessage(err, "Không tải được danh sách tang vật."));
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(row: EvidenceItem) {
    if (!confirmAction(`Xoá tang vật "${row.evidenceName}"?`)) return;
    try {
      await removeCaseEvidence(caseId, row.id);
      await load();
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, "Không xoá được."));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-950">
          Tang vật/vật chứng ({items.length})
        </h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-800"
        >
          + Thêm tang vật
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-slate-500">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Chưa có tang vật.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-black">Tên tang vật</th>
              <th className="px-3 py-2 font-black">Loại</th>
              <th className="px-3 py-2 font-black">Số lượng</th>
              <th className="px-3 py-2 font-black">Nơi lưu</th>
              <th className="px-3 py-2 font-black">Trạng thái</th>
              <th className="px-3 py-2 font-black">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {row.evidenceName}
                </td>
                <td className="px-3 py-2 text-slate-600">{row.evidenceType ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600">
                  {row.quantity ?? "—"} {row.unit ?? ""}
                </td>
                <td className="px-3 py-2 text-slate-600">{row.storageLocation ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600">{row.currentStatus}</td>
                <td className="px-3 py-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold hover:bg-slate-50"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(row)}
                    className="rounded-md border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <EvidenceFormModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={async (payload) => {
          await addCaseEvidence(caseId, payload);
          setAdding(false);
          await load();
          await onChanged();
        }}
        onUpdate={async (payload) => {
          if (!editing) return;
          await updateCaseEvidence(caseId, editing.id, payload);
          setEditing(null);
          await load();
          await onChanged();
        }}
      />
      <EvidenceFormModal
        open={editing !== null}
        editing={editing}
        onClose={() => setEditing(null)}
        onAdd={async (payload) => {
          await addCaseEvidence(caseId, payload);
          setAdding(false);
          await load();
          await onChanged();
        }}
        onUpdate={async (payload) => {
          if (!editing) return;
          await updateCaseEvidence(caseId, editing.id, payload);
          setEditing(null);
          await load();
          await onChanged();
        }}
      />
    </div>
  );
}

function EvidenceFormModal({
  open,
  editing,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  editing?: EvidenceItem | null;
  onClose: () => void;
  onAdd: (payload: AddEvidencePayload) => Promise<void>;
  onUpdate: (payload: UpdateEvidencePayload) => Promise<void>;
}) {
  const isEdit = Boolean(editing);
  const [form, setForm] = useState<AddEvidencePayload>({
    evidenceName: "",
    evidenceCode: "",
    evidenceType: "",
    quantity: "",
    unit: "",
    description: "",
    currentStatus: "RECORDED",
    storageLocation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        evidenceName: editing.evidenceName,
        evidenceCode: editing.evidenceCode ?? "",
        evidenceType: editing.evidenceType ?? "",
        quantity: editing.quantity ?? "",
        unit: editing.unit ?? "",
        description: editing.description ?? "",
        currentStatus: editing.currentStatus,
        storageLocation: editing.storageLocation ?? "",
      });
    } else {
      setForm({
        evidenceName: "",
        evidenceCode: "",
        evidenceType: "",
        quantity: "",
        unit: "",
        description: "",
        currentStatus: "RECORDED",
        storageLocation: "",
      });
    }
  }, [editing, open]);

  async function submit() {
    setIsSubmitting(true);
    setError("");
    try {
      if (!isEdit && !form.evidenceName.trim()) {
        setError("Cần nhập tên tang vật.");
        setIsSubmitting(false);
        return;
      }
      if (isEdit) {
        await onUpdate({
          evidenceName: form.evidenceName.trim(),
          evidenceCode: form.evidenceCode || undefined,
          evidenceType: form.evidenceType || undefined,
          quantity: form.quantity || undefined,
          unit: form.unit || undefined,
          description: form.description || undefined,
          currentStatus: form.currentStatus || undefined,
          storageLocation: form.storageLocation || undefined,
        });
      } else {
        await onAdd({
          evidenceName: form.evidenceName.trim(),
          evidenceCode: form.evidenceCode || undefined,
          evidenceType: form.evidenceType || undefined,
          quantity: form.quantity || undefined,
          unit: form.unit || undefined,
          description: form.description || undefined,
          currentStatus: form.currentStatus || undefined,
          storageLocation: form.storageLocation || undefined,
        });
      }
    } catch (err) {
      setError(errorMessage(err, "Không lưu được."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Cập nhật tang vật" : "Thêm tang vật"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold hover:bg-slate-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting}
            className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-800 disabled:bg-slate-300"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="space-y-3">
        <FormField label="Tên tang vật *">
          <input
            value={form.evidenceName}
            onChange={(e) => setForm((f) => ({ ...f, evidenceName: e.target.value }))}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
          />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Mã tang vật">
            <input
              value={form.evidenceCode ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, evidenceCode: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
          <FormField label="Loại">
            <input
              value={form.evidenceType ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, evidenceType: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Số lượng">
            <input
              value={form.quantity ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
          <FormField label="Đơn vị">
            <input
              value={form.unit ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
            />
          </FormField>
        </div>
        <FormField label="Trạng thái">
          <input
            value={form.currentStatus ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, currentStatus: e.target.value }))}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
          />
        </FormField>
        <FormField label="Nơi lưu">
          <input
            value={form.storageLocation ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, storageLocation: e.target.value }))}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
          />
        </FormField>
        <FormField label="Mô tả">
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
          />
        </FormField>
      </div>
    </Modal>
  );
}

// =========================================================================
// Documents tab
// =========================================================================

function DocumentsTab({ recent }: { recent: RecentGeneratedDocument[] }) {
  const sorted = useMemo(
    () =>
      [...recent].sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
      ),
    [recent],
  );

  if (sorted.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Chưa có biểu mẫu nào được tạo cho hồ sơ này.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-3 py-2 font-black">Mã BM</th>
          <th className="px-3 py-2 font-black">Tiêu đề</th>
          <th className="px-3 py-2 font-black">Trạng thái</th>
          <th className="px-3 py-2 font-black">Ngày tạo</th>
          <th className="px-3 py-2 font-black">Mở</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((doc) => (
          <tr key={doc.id} className="border-t border-slate-100">
            <td className="px-3 py-2 font-mono text-xs text-slate-500">
              {doc.documentCode ?? "—"}
            </td>
            <td className="px-3 py-2 font-semibold text-slate-900">
              {doc.documentTitle}
            </td>
            <td className="px-3 py-2 text-slate-600">{doc.reviewStatus}</td>
            <td className="px-3 py-2 text-slate-600">
              {formatDateTime(doc.generatedAt)}
            </td>
            <td className="px-3 py-2">
              <Link
                href={`/documents/${doc.id}`}
                className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
              >
                Mở
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// =========================================================================
// Form helpers
// =========================================================================

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
