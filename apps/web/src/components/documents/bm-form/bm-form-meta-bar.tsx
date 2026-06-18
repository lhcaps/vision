"use client";

import type { ReactNode } from "react";
import { BM_FORM_CLASSES } from "./classes";

type BmFormMetaBarProps = {
  title: string;
  subtitle: string;
  templateCode: string;
  isDirty: boolean;
  isSaving?: boolean;
  isLoading?: boolean;
  savedAt?: Date | null;
  errorMessage?: string;
  warningMessage?: string;
  successMessage?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  extraActions?: ReactNode;
  meta?: ReactNode;
};

/**
 * Meta bar dùng chung cho mọi BM form.
 * Hiển thị:
 *  - title/subtitle của biểu
 *  - badge trạng thái (đã đồng bộ / có thay đổi chưa lưu)
 *  - banner lỗi / cảnh báo / thành công
 *  - nút hành động chính (Lưu) + nút phụ (Tải lại / Điền mẫu)
 *  - meta phụ (số trường còn thiếu, thời gian lưu cuối, ...)
 */
export function BmFormMetaBar({
  title,
  subtitle,
  templateCode,
  isDirty,
  isSaving,
  isLoading,
  savedAt,
  errorMessage,
  warningMessage,
  successMessage,
  primaryLabel = "Lưu dữ liệu",
  onPrimary,
  primaryDisabled,
  secondaryLabel = "Tải lại",
  onSecondary,
  extraActions,
  meta,
}: BmFormMetaBarProps) {
  const dirtyLabel = isSaving
    ? "Đang lưu..."
    : isLoading
      ? "Đang tải..."
      : isDirty
        ? "Có thay đổi chưa lưu"
        : "Đã đồng bộ";

  const dirtyClass = isDirty
    ? "font-semibold text-amber-700"
    : "font-semibold text-emerald-700";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
              {templateCode}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {dirtyLabel}
            </span>
            {savedAt ? (
              <span className="text-xs text-slate-500">
                Lưu lúc {savedAt.toLocaleTimeString("vi-VN")}
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-xl font-bold text-slate-950 md:text-2xl">
            {title}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            {subtitle}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:items-end">
          <span className={dirtyClass}>{dirtyLabel}</span>
          {meta}
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {warningMessage ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {warningMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {extraActions}

        {onSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            disabled={isSaving || isLoading}
            className={BM_FORM_CLASSES.buttonSecondary}
          >
            {secondaryLabel}
          </button>
        ) : null}

        {onPrimary ? (
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled || isSaving || isLoading}
            className={BM_FORM_CLASSES.buttonPrimary}
          >
            {isSaving ? (
              <span className={BM_FORM_CLASSES.spinner} aria-hidden />
            ) : null}
            {primaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
