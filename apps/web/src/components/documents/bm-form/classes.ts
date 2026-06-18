/**
 * BM form shared components — dùng chung cho tất cả biểu mẫu theo TT 03/2026-VKSTC.
 *
 * Mục đích: đồng bộ UX/UI cho 213+ biểu mẫu mà không phải định nghĩa lại
 * className ở mỗi file bm-XXX-form-inputs.tsx.
 *
 * Quy ước:
 *  - Section: Gom nhóm field theo nghiệp vụ (cơ quan, văn bản, vụ án, ...)
 *  - Field:   Một ô nhập liệu (text/textarea/date/select/checkbox)
 *  - Status:  Banner trạng thái (lưu/lỗi/thành công)
 *  - Actions: Hàng nút Lưu/Tải lại
 */

export const BM_FORM_CLASSES = {
  // Section
  section:
    "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8",
  sectionHeader: "flex flex-col gap-1.5 border-b border-slate-100 pb-4",
  sectionTitle:
    "text-lg font-bold text-slate-950 md:text-xl flex items-center gap-2",
  sectionDescription: "text-sm leading-6 text-slate-600",
  sectionBadge:
    "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600",
  sectionRequiredCount:
    "text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full",
  sectionBody: "mt-5 grid grid-cols-1 gap-4 md:grid-cols-2",

  // Field
  fieldGroup: "flex flex-col gap-1.5",
  fieldFullWidth: "md:col-span-2",
  label:
    "text-xs font-semibold uppercase tracking-wide text-slate-700 flex items-center gap-1",
  requiredMark: "text-rose-600 font-bold",
  helperText: "text-xs leading-5 text-slate-500",
  errorText: "text-xs font-semibold text-rose-600",

  input:
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
  inputError: "border-rose-400 focus:border-rose-500 focus:ring-rose-200",
  textarea:
    "min-h-[88px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
  select:
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50",

  // Checkbox
  checkboxRow:
    "flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50 cursor-pointer",
  checkboxRowChecked: "border-slate-900 bg-slate-50",
  checkbox:
    "mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-200",
  checkboxLabel: "text-sm font-semibold text-slate-800",
  checkboxDescription: "text-xs leading-5 text-slate-500",

  // Status / banner
  statusIdle: "hidden",
  statusLoading:
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex items-center gap-2",
  statusSuccess:
    "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2",
  statusError:
    "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 flex items-center gap-2",
  statusWarning:
    "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 flex items-center gap-2",

  // Actions
  actionsRow:
    "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
  actionsLeft: "flex flex-wrap items-center gap-2",
  actionsRight: "flex flex-wrap items-center gap-2",
  buttonPrimary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300",
  buttonSecondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400",
  buttonGhost:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400",

  // Spinner
  spinner:
    "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
} as const;

/**
 * Smart default helpers — áp dụng thông minh dựa trên context.
 *
 * Quy tắc:
 *  - issueDate mặc định = hôm nay nếu trống
 *  - issuePlace mặc định = tên viện nếu trống
 *  - documentCode giữ nguyên (do backend sinh), không auto-fill
 *  - archiveLine mặc định = "Lưu: HSVA, HSKS, VP." nếu trống
 */

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isoDateToVnSlash(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").trim());
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function vnSlashToIsoDate(value: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? "").trim());
  if (!m) return "";
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  return `${m[3]}-${month}-${day}`;
}

export function vnDateLine(value: string, fallback = "..."): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").trim());
  if (!m) return fallback;
  return `ngày ${Number(m[3])} tháng ${Number(m[2])} năm ${m[1]}`;
}

export function issuePlaceDateLine(
  place: string,
  date: string,
  placeFallback = "TP. Hồ Chí Minh",
): string {
  const p = String(place ?? "").trim() || placeFallback;
  return `${p}, ${vnDateLine(date, "ngày ... tháng ... năm ...")}`;
}

export function defaultArchiveLine(): string {
  return "Lưu: HSVA, HSKS, VP.";
}

/**
 * Smart helpers for VN-style DD/MM/YYYY strings (used by BM-005 and a few others
 * that display dates in slash form for the on-screen user).
 */
export function todaySlashDate(): string {
  return isoDateToVnSlash(todayIsoDate());
}

export function normalizeSlashDate(value: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (iso) {
    return `${iso[3].padStart(2, "0")}/${iso[2].padStart(2, "0")}/${iso[1]}`;
  }
  const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (vn) {
    return `${vn[1].padStart(2, "0")}/${vn[2].padStart(2, "0")}/${vn[3]}`;
  }
  return raw;
}
