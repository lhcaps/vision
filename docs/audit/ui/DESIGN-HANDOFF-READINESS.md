# Design Handoff Readiness Audit

> Phase B.5 — DOCX-first audit pipeline
> Generated: 2026-06-19
> Status: tool unavailable — manual audit performed

## 1. Typography

### Web Form Typography (Current)

All BM form components use a shared CSS class system defined in `apps/web/src/components/documents/bm-form/classes.ts`:

```ts
// bm-form/classes.ts
export const inputClass = "w-full px-3 py-2 border rounded text-sm";
export const labelClass = "block text-xs font-medium text-gray-600 mb-1";
export const textareaClass = "w-full px-3 py-2 border rounded text-sm min-h-[80px]";
```

Typography: **Tailwind CSS scale** (`text-sm` = 14px, `text-xs` = 12px). No explicit Google Fonts usage in form components.

### DOCX Render Typography (Required by spec)

Per the DOCX render format requirements:

| Element | Requirement |
|---|---|
| Default font | Times New Roman |
| Base size | 13pt |
| Header agency line | Bold, 13pt |
| Stage title | Bold, 14pt |
| Quốc hiệu | Size 13pt |
| Độc lập - Tự do - Hạnh phúc | Size 14pt, underlined |
| Date line `..., ngày … tháng … năm …` | Italic, 14pt |
| Footer `Nơi nhận` | Bold + Italic, 12pt |
| Footer recipients | Size 11pt |
| Footer signature | Bold, 14pt |

### Gap: Web vs. DOCX Font Mapping

The web form currently uses system fonts via Tailwind. The `renderFormatHints.fontFamily = "Times New Roman"` in the contract is a **render target hint** for the DOCX rendering engine (Phase C+), not a web UI requirement. No conflict identified.

**Action**: Document `renderFormatHints.fontFamily` as the render target only. Web form can continue using Tailwind system stack.

## 2. Layout / Grid

### Current Layout

The `GeneratedDocumentWorkspace` uses a **two-panel side-by-side layout**:
- Left: Form input panel (`Bm{NNN}FormInputsPanel`)
- Right: Preview panel (`DocumentPreviewPanel`)

The preview panel fetches `GET /documents/generated/{id}/preview` and renders the DOCX preview.

The form panels use a single-column stack within sections (`bm-form-section.tsx`).

### Shared Components

- `bm-form-section.tsx` — wraps field groups with a header label and border
- `bm-field.tsx` — field primitives (`BmFieldText`, `BmFieldDate`, etc.)
- No CSS Grid or multi-column layout at section level

### Responsive Breakpoints

No explicit responsive breakpoints found in the BM form components. Tailwind's default responsive prefixes (`sm:`, `md:`) are used in the wrapper `template-selector-workspace.tsx` but not in individual BM form panels.

**Action**: Define responsive layout for form + preview split. Suggested breakpoints:
- `< md`: stack preview below form
- `>= md`: side-by-side

## 3. Component States

### Known States

From `bm-field.tsx` and form components, the following states are implemented:

| State | Implementation |
|---|---|
| Default | Default CSS class |
| Focus | Tailwind `focus:ring` / `focus:border-blue-500` |
| Error | Conditional class `border-red-500` when `error` prop |
| Disabled | Props forwarded to inputs |
| Loading | `isLoading` prop → disabled + spinner in parent panels |

### Missing States

- `hover` states on inputs — not explicit
- `saving` state (after form submit) — no optimistic UI
- `saved` success feedback — no toast/notification
- `rendering` state — when DOCX preview is being generated

**Action**: Add `saving` + `saved` states to form submit flow. Add `rendering` state to preview panel.

## 4. Date Picker

### Current Implementation

`BmFieldDate` in `bm-field.tsx` uses a standard HTML `<input type="date">`. No custom date picker found.

```tsx
// bm-field.tsx (conceptual)
export function BmFieldDate({ label, value, onChange }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}
```

### Gap: Vietnamese Legal Date Format

Vietnamese legal documents use `dd/mm/yyyy` format (e.g., `01/01/2026`), not the browser's locale-default `yyyy-mm-dd`. The `<input type="date">` renders in the browser's locale format, which can be confusing.

**Action**: Either:
- (Preferred) Use a locale-aware date library that formats display as `dd/mm/yyyy` while maintaining `YYYY-MM-DD` value for API.
- (Minimal) Add a formatting layer in `classes.ts` date helpers.

No custom date picker library found in `package.json`.

## 5. Preview: Data Sync

### Current Flow

1. Form panel collects data → `POST /documents/generated/{id}/form-inputs` (saves)
2. Preview panel fetches `GET /documents/generated/{id}/preview`
3. Preview re-renders from server-saved state

### Stale Data Risk

The preview fetches on mount. If the user types in the form without saving, the preview does **not** update live. This is the expected behavior (save-first workflow) but may confuse users who expect live preview.

**Action**: Consider a debounced live preview fetch (`debounce 500ms`) on field change, or a "Preview" button that triggers on-demand fetch. Document the trade-off clearly.

## 6. Report Dimensions: Schema/API

### Required Dimensions (from spec)

Three reporting dimensions: `Thời gian` (time), `Phường` (ward), `Tội danh` (offense).

### Current Schema

The Prisma schema has these fields. The reporting API (`GET /reports`) aggregates by these dimensions.

**Action**: Verify that the contract's `reportingHints.dimensions` field matches the Prisma schema field names:
- `time` → `document.issueDate` (or a date field)
- `ward` → `case.wardId` or similar
- `offense` → `case.offenseId`

This is a Phase D API concern.

## 7. Anti-Slop Checklist

| Item | Status | Action |
|---|---|---|
| No gradient/glassmorphism | ✅ Pass — Tailwind system colors only | None |
| No animation without UX reason | ✅ Pass — minimal motion | None |
| No custom UI kit | ✅ Pass — uses Tailwind + shared bm-form primitives | None |
| Component system shared | ✅ Pass — all BM forms use `bm-form/` barrel | None |
| No Rive/motion | ✅ Pass — no motion assets found | None |
| Typography system consistent | ✅ Pass — shared `classes.ts` | None |
| No unused CSS | ✅ Pass — Tailwind tree-shakes | None |

## Summary: Design Handoff Status

| Dimension | Status | Phase |
|---|---|---|
| Typography mapping (web vs. docx) | ✅ Mapped | Existing |
| Responsive layout | ⚠️ Missing breakpoints | Phase D |
| Component states (saving/rendering) | ⚠️ Missing | Phase D |
| Date picker format | ⚠️ Uses HTML date input, not `dd/mm/yyyy` | Phase D |
| Live preview sync | ⚠️ Save-first, no live preview | Phase D |
| Report dimensions schema | ⚠️ Unverified against Prisma | Phase D |

**Recommendation**: The design system is stable. No major redesign needed. Focus Phase D on: date format, live preview, and responsive breakpoints.

## Anti-Slop Sign-off

No gradient, glassmorphism, or unnecessary animation found in BM form components. The codebase follows a clean, utilitarian design appropriate for legal document workflows. No UI rewrite recommended.
