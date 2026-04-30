# Phase 8: Prediction Overlay and Evaluation — UI Design Contract

Status: drafted
Phase: 8
Date: 2026-05-01

## Design Register

Product UI. Design serves repeated technical workflows — the computer vision engineer needs to inspect inference output, compare against ground truth, and evaluate model quality at a glance.

## Visual Direction

Premium dark technical interface consistent with the post-overhaul design system. No white/light borders for selection. Selection communicates via background tint, inner glow, and scale — never white outlines.

Primary interaction signals:
- Background tint (`bg-signal-300/10`) for active/selected states
- Inner glow (`box-shadow: inset 0 0 0 1px oklch(...)`) for selected surfaces
- Subtle scale for tactile press feedback
- Dividers use `border-white/[0.06]` (barely visible, structural only)

## Color Strategy

Restrained technical palette:
- Success/active: `oklch(80% 0.13 152)` (surgical green — signal)
- Warning: `oklch(82% 0.13 88)` (amber)
- Failure: `oklch(76% 0.14 25)` (red)
- Scan/data-flow: `oklch(78% 0.12 205)` (cool cyan)
- Neutral surfaces: graphite-900/950 with oklch tinting
- Background: `oklch(13.5% 0.008 180)` — not pure black

No purple-blue gradients. No decorative glows. No generic card grids.

## Typography

- Sans: Geist (via `font-sans` Tailwind class)
- Mono: JetBrains Mono (via `font-mono`)
- IDs, coordinates, metrics, logs use monospace
- Labels use sans at compact sizes
- Line lengths capped at 65–75ch for readability in text-heavy panels

## Layout

### Jobs Panel (Phase 8 primary surface)

Two-column split:
- Left (65%): Job detail — metadata, log stream, prediction overlay canvas
- Right (35%): Evaluation metrics panel

Mobile (< 768px): Single column, metrics collapse below the canvas.

### Prediction Overlay Canvas

Full-width within the left panel. Aspect ratio matches the source media asset.

Layered composition (bottom to top):
1. Media image (base layer)
2. Ground-truth BBoxes — green-tinted fill, dashed stroke, label tag
3. Prediction BBoxes — amber-tinted fill, solid stroke, label tag
4. Intersection overlay — translucent fill where GT and prediction boxes overlap
5. Hover tooltip — appears on hover with label, confidence, IoU
6. Canvas controls bar — fixed bottom strip with toggle controls

Canvas controls bar (fixed bottom):
- Background: `bg-graphite-950/84 backdrop-blur`, `border-white/[0.06]`
- Shows: GT toggle, Pred toggle, IoU overlay toggle, zoom level, coordinates
- No structural border — depth comes from backdrop blur and inset shadow

### Evaluation Metrics Panel

Metric blocks:
- Precision, Recall, F1 — large monospace numbers with tiny labels
- Mean IoU — prominent display
- TP / FP / FN — count with color coding (green/red/amber)
- Per-class breakdown — collapsible table rows

Metric block styling:
- `bg-white/[0.03]` — no border
- Inner text in signal/amber/red depending on value quality
- Selected class row: `bg-signal-300/07` + inner glow

### Job Metadata Header

Above the split:
- Job ID (monospace, truncated)
- Status pill
- Dataset version reference
- Pipeline reference
- Created at timestamp
- Action buttons: Re-run, Export

### Toggle Controls (in canvas controls bar)

Icon-button pattern:
- Inactive: no border, icon in `text-neutral-500`, hover `text-neutral-200` + `bg-white/[0.05]`
- Active: `bg-signal-300/10` + inner glow, icon in `text-signal-300`
- Press feedback: `active:translate-y-px`
- Focus: `focus-visible:ring-2 focus-visible:ring-signal-300`

No white border on any toggle state.

### Comparison Mode

When both GT and predictions are visible:
- GT boxes: `border: 1.5px dashed oklch(80% 0.13 152)`, `bg: rgba(106,217,161,0.12)`
- Pred boxes: `border: 1.5px solid oklch(82% 0.13 88)`, `bg: rgba(255,183,77,0.12)`
- Overlap region: `bg: rgba(106,217,161,0.35)` blended via CSS mix-blend-mode or explicit opacity

### Empty States

- No predictions: canvas shows media image with centered empty-state message "No predictions for this asset"
- No evaluation: metrics panel shows placeholder "Run evaluation to see metrics"
- No job selected: prompt to select a job from the Jobs list

### Loading States

- Canvas: skeleton shimmer matching the media aspect ratio
- Metrics: three skeleton metric blocks
- Logs: streaming skeleton lines

## Component Inventory

### PredictionOverlayCanvas
- Props: mediaAsset, predictions[], groundTruth[], overlayMode, selectedBBoxId
- States: loading (skeleton), empty (no predictions), populated, error
- Layered rendering with z-index stacking
- Responds to toggle controls
- Shows IoU overlay when enabled

### EvaluationMetricsPanel
- Props: evaluationReport, predictions[], groundTruth[]
- States: loading (skeleton), empty (no evaluation run), populated
- Metric blocks with color-coded values
- Per-class breakdown table (collapsible)
- Run evaluation button when no report exists

### CanvasControlsBar
- Props: showGT, showPredictions, showIoU, zoomLevel, onToggle
- Fixed bottom of canvas
- Toggle icon-buttons (inner-glow pattern)
- Coordinates display (monospace)

### BBoxOverlay (internal canvas component)
- Renders a single bounding box
- Props: box, type (GT|prediction), selected, color, confidence
- States: default, hovered (slight brightness increase), selected (inner glow + outer glow + handles)
- Label tag above the box
- Tooltip on hover with metadata

### JobDetailHeader
- Props: job, onRerun, onExport
- Shows job metadata and action buttons
- Status pill with appropriate color

### MetricsBlock (internal)
- Props: label, value, unit, tone (signal|amber|red|scan)
- Large monospace number, small uppercase label
- No border, subtle background tint for depth

## Interaction Patterns

- BBox hover: subtle brightness increase, tooltip appears after 200ms delay
- BBox click: select box, highlight in metrics panel if it matches GT/pred pair
- Canvas zoom: scroll wheel or pinch, smooth transform
- Canvas pan: drag when zoomed
- Toggle click: immediate visual feedback, canvas re-renders affected layers
- Run evaluation: button triggers API call, metrics panel transitions from skeleton to populated

## Accessibility

- All controls keyboard accessible
- Focus-visible rings on all interactive elements
- ARIA labels on icon-only buttons
- Canvas has role="img" with descriptive label
- Color is never the sole differentiator — label text and pattern (dashed vs solid) distinguish GT from prediction

## Responsive Behavior

- Desktop (> 1024px): Two-column split (65/35)
- Tablet (768–1024px): Stacked layout, canvas full width, metrics below
- Mobile (< 768px): Single column, metrics collapsed into expandable section, canvas controls adapt to smaller touch targets

## Design Anti-Patterns to Avoid

- **NO white borders** on any interactive element or panel
- **NO generic card borders** on every metric block
- **NO centered layout** — all panels left-aligned or split-screen
- **NO Inter font** — use Geist
- **NO glassmorphism** on panels — use solid graphite surfaces with backdrop blur only on overlays
- **NO excessive gradients** — muted surfaces only
- **NO emoji** in UI copy — use Phosphor icons
