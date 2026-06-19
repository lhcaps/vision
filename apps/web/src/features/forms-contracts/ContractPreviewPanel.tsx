"use client";

/**
 * Phase D — Contract preview panel.
 *
 * Shows a live preview of how the filled form data would look in the DOCX document.
 * Uses `renderBindings` from the contract to resolve slot values.
 *
 * Rules:
 * - Resolve `renderBindings`.
 * - Constant values from DOCX show as readonly.
 * - Missing required data shows placeholder or warning.
 * - Draft/generic field shows review badge.
 * - No fake legal correctness claim.
 */

import type {
  LoadedFormContract,
  RenderBinding,
} from "./contract-types";
import { resolveRenderBinding } from "./form-schema-generator";

export interface ContractPreviewPanelProps {
  /** The contract driving the preview. */
  contract: LoadedFormContract;
  /** Current form data from the user. */
  formData: Record<string, unknown>;
  /** Show slot IDs as debug labels. Default: false. */
  debugSlotIds?: boolean;
}

interface SlotPreview {
  slotId: string;
  label: string;
  value: string;
  hasData: boolean;
  isStale: boolean;
  isConstant: boolean;
  isReviewRequired: boolean;
  context: string;
}

export function ContractPreviewPanel({
  contract,
  formData,
  debugSlotIds = false,
}: ContractPreviewPanelProps) {
  const slots: SlotPreview[] = [];

  for (const slot of contract.docxSlots ?? []) {
    // Find matching render binding
    const binding = contract.renderBindings?.find(
      (b) => b.slotId === slot.slotId,
    );

    let resolved: ReturnType<typeof resolveRenderBinding>;

    if (binding) {
      resolved = resolveRenderBinding(binding, formData);
    } else {
      // No binding — check if formData has a matching key
      const raw = formData[slot.slotId];
      const hasData = raw !== undefined && raw !== null && raw !== "";
      resolved = {
        slotId: slot.slotId,
        value: hasData ? String(raw) : "",
        isStale: false,
        hasData,
      };
    }

    // Determine if this slot is constant (no user-editable binding)
    const isConstant =
      binding?.transform === "constant" ||
      slot.slotId.includes(".constant") ||
      false;

    slots.push({
      slotId: slot.slotId,
      label: slot.label,
      value: resolved.value,
      hasData: resolved.hasData,
      isStale: resolved.isStale,
      isConstant,
      isReviewRequired: slot.reviewRequired,
      context: slot.context,
    });
  }

  // Group by section
  const slotBySection = new Map<string, SlotPreview[]>();
  for (const slot of slots) {
    const section = slot.slotId.split(".")[0] ?? "other";
    if (!slotBySection.has(section)) slotBySection.set(section, []);
    slotBySection.get(section)!.push(slot);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-lg font-semibold">
          Preview — {contract.templateCode}
        </h2>
        <p className="text-sm text-gray-600">{contract.title}</p>
        <p className="mt-1 text-xs text-gray-400">
          Đây là preview từ contract binding. Dữ liệu được hiển thị theo cấu
          trúc DOCX thực tế.
        </p>
      </div>

      {/* Slot previews grouped by section */}
      {Array.from(slotBySection.entries()).map(([section, sectionSlots]) => (
        <div key={section} className="rounded border border-gray-200 p-3">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {section}
          </h3>
          <div className="flex flex-col gap-2">
            {sectionSlots.map((slot) => (
              <SlotPreviewRow
                key={slot.slotId}
                slot={slot}
                debugSlotIds={debugSlotIds}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Missing data summary */}
      <MissingDataSummary slots={slots} />
    </div>
  );
}

// ─── Slot row ─────────────────────────────────────────────────────────────────

interface SlotPreviewRowProps {
  slot: SlotPreview;
  debugSlotIds: boolean;
}

function SlotPreviewRow({ slot, debugSlotIds }: SlotPreviewRowProps) {
  const hasValue = slot.value && slot.value.trim().length > 0;
  const isEmpty = !hasValue;

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        {/* Label */}
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{slot.label}</span>
          {slot.isReviewRequired && (
            <span className="rounded bg-yellow-100 px-1 py-0.5 text-xs text-yellow-700">
              Cần review
            </span>
          )}
          {slot.isConstant && (
            <span className="rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-700">
              Hằng số DOCX
            </span>
          )}
        </div>

        {/* Value */}
        <div
          className={`mt-1 rounded border px-2 py-1 text-sm ${
            isEmpty
              ? "border-dashed border-gray-300 bg-gray-50 text-gray-400 italic"
              : slot.isStale
                ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                : "border-gray-200 bg-white text-gray-900"
          }`}
        >
          {isEmpty ? (
            <span className="text-gray-400">
              {slot.context || "(chưa nhập)"}
            </span>
          ) : (
            slot.value
          )}
        </div>
      </div>

      {/* Debug slot ID */}
      {debugSlotIds && (
        <code className="shrink-0 text-xs text-gray-400">{slot.slotId}</code>
      )}
    </div>
  );
}

// ─── Missing data summary ──────────────────────────────────────────────────────

interface MissingDataSummaryProps {
  slots: SlotPreview[];
}

function MissingDataSummary({ slots }: MissingDataSummaryProps) {
  const missing = slots.filter(
    (s) =>
      s.slotId &&
      !s.isConstant &&
      !s.hasData &&
      !s.isReviewRequired,
  );

  if (missing.length === 0) return null;

  return (
    <div className="rounded border border-orange-200 bg-orange-50 p-3">
      <h4 className="text-sm font-semibold text-orange-800">
        Thiếu dữ liệu ({missing.length} trường)
      </h4>
      <ul className="mt-1 flex list-disc flex-wrap gap-x-4 gap-y-1 pl-4 text-xs text-orange-700">
        {missing.slice(0, 10).map((s) => (
          <li key={s.slotId}>{s.label || s.slotId}</li>
        ))}
        {missing.length > 10 && (
          <li className="italic">
            ...và {missing.length - 10} trường khác
          </li>
        )}
      </ul>
    </div>
  );
}
