// Shared toolbar button for "Lấy từ vụ án".
//
// Renders a single button (or hides itself if no case payload is in
// scope) that, when clicked, applies the BM-specific case-derived
// targets from `BM_FIELD_MAP` / `BM_FLAT_FIELD_MAP` to the form and
// shows a success / no-op message.
//
// Two variants exist:
//   - `BmFormCasePayloadButton` for nested forms
//   - `BmFlatFormCasePayloadButton` for flat-state forms
//
// Both forward the merged form to `onApply` (typed) so the panel
// can run any cross-section sync after the merge. The button itself
// owns only the success / no-op feedback.

"use client";

import { useCallback, useState } from "react";

import {
  useApplyCasePayloadToForm,
  useApplyCasePayloadToFlatForm,
} from "@/lib/bm-auto-populate/use-apply-case-payload";

const BUTTON_BASE =
  "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

type NestedApplyHandler<TForm> = (form: TForm, appliedFields: string[]) => void;

export function BmFormCasePayloadButton<TForm>({
  templateCode,
  form,
  onApply,
  label = "Lấy từ vụ án",
}: {
  templateCode: string;
  form: TForm;
  onApply: NestedApplyHandler<TForm>;
  label?: string;
}) {
  const [apply, hasCasePayload] = useApplyCasePayloadToForm<TForm>(templateCode);
  const [feedback, setFeedback] = useState<string>("");

  const handleClick = useCallback(() => {
    const result = apply(form as never);
    if (result.appliedFields.length === 0) {
      setFeedback("Không có trường trống nào để lấy thêm từ vụ án.");
      return;
    }
    onApply(result.form as unknown as TForm, result.appliedFields);
    setFeedback(
      `Đã lấy ${result.appliedFields.length} trường từ vụ án. Bấm lưu để ghi vào backend.`,
    );
  }, [apply, form, onApply]);

  if (!hasCasePayload) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className={BUTTON_BASE}
        onClick={handleClick}
        aria-label={label}
      >
        {label}
      </button>
      {feedback ? (
        <p className="text-[11px] leading-4 text-slate-500">{feedback}</p>
      ) : null}
    </div>
  );
}

type FlatApplyHandler<TForm> = (form: TForm, appliedFields: string[]) => void;

export function BmFlatFormCasePayloadButton<TForm>({
  templateCode,
  form,
  onApply,
  label = "Lấy từ vụ án",
}: {
  templateCode: string;
  form: TForm;
  onApply: FlatApplyHandler<TForm>;
  label?: string;
}) {
  const [apply, hasCasePayload] = useApplyCasePayloadToFlatForm(templateCode);
  const [feedback, setFeedback] = useState<string>("");

  const handleClick = useCallback(() => {
    const result = apply(form as unknown as Record<string, string>);
    if (result.appliedFields.length === 0) {
      setFeedback("Không có trường trống nào để lấy thêm từ vụ án.");
      return;
    }
    onApply(result.form as unknown as TForm, result.appliedFields);
    setFeedback(
      `Đã lấy ${result.appliedFields.length} trường từ vụ án. Bấm lưu để ghi vào backend.`,
    );
  }, [apply, form, onApply]);

  if (!hasCasePayload) return null;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className={BUTTON_BASE}
        onClick={handleClick}
        aria-label={label}
      >
        {label}
      </button>
      {feedback ? (
        <p className="text-[11px] leading-4 text-slate-500">{feedback}</p>
      ) : null}
    </div>
  );
}
