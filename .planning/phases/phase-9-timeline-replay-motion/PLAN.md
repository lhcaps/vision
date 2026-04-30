# Phase 9 Plan — Timeline Replay and Motion Polish

Status: completed
Date: 2026-05-01
Completed: 2026-05-01

## Goal

Deliver Phase 9: timeline replay with BBox morphing between frames, dataset version diffs, and pipeline node execution flow. Build on the Phase 8 prediction overlay and evaluation foundation, adding motion that explains state transitions.

## Design Register

Product UI. Design serves repeated technical workflows. Phase 9 is the "signature moment" phase — timeline replay morphs boxes between frames, dataset diffs make added/removed/changed annotations visible, and pipeline edges pulse because data is flowing.

Design follows the established dark technical aesthetic with restrained motion. Motion intensity: 7/10. No gratuitous animation. Every motion explains state.

## Wave 1 — Timeline Replay & BBox Morphs

### 1. TimelineReplayPanel Component

<read_first>

- apps/web/src/features/annotations/AnnotationEngine.tsx (existing canvas pattern)
- apps/web/src/features/evaluation/PredictionOverlayCanvas.tsx (overlay rendering pattern)
- apps/web/src/index.css
- apps/web/src/data/demo.ts
- DESIGN.md
  </read_first>

<action>
Create `apps/web/src/features/timeline/TimelineReplayPanel.tsx`.

Props:

```typescript
type Props = {
  mediaAssets: MediaAssetRow[];
  annotations: AnnotationSummary[];
  groundTruth: AnnotationSummary[];
  predictions: PredictionSummary[];
  onFrameChange?: (assetId: string) => void;
};
```

Feature:

1. **Frame strip** — horizontal scrollable row of thumbnail/frame indicators at the bottom
2. **Timeline scrubber** — a draggable scrubber above the frame strip with a progress indicator
3. **BBox morph engine** — when scrubbing between frames, bounding boxes interpolate position/size smoothly using spring physics (Framer Motion layout animations)
4. **Frame counter** — shows current frame index and total frame count in monospace
5. **Playback controls** — play/pause button, frame step forward/backward, playback speed selector (0.5x, 1x, 2x)
6. **Annotation mode toggle** — switch between "GT view" and "Pred view" during replay

Layout:

- Top: the canvas (PredictionOverlayCanvas or AnnotationCanvas) showing the current frame with morphing BBoxes
- Middle: scrubber + playback controls
- Bottom: frame strip (horizontal scroll, thumbnails with frame numbers)

BBox morph implementation:

- Use Framer Motion's `layoutId` to connect the same-label BBoxes across frames
- On frame change, the BBox smoothly animates from previous geometry to new geometry
- Use `AnimatePresence` for entering/exiting boxes
- Spring config: `stiffness: 280, damping: 28` for smooth, snappy morphs
- Use `useReducedMotion` to collapse morphs to instant opacity transitions

Animation layers:

- BBox position/size morph: Framer Motion layout animation with spring
- Frame transition: crossfade via AnimatePresence
- Scrubber: smooth drag with spring snapping
- Play button: scale pulse on click (1.0 → 0.94 → 1.0)
- Frame thumbnail hover: scale 1.04 with brightness increase
  </action>

<acceptance_criteria>

- Frame strip shows all media assets as thumbnails with frame numbers
- Dragging the scrubber morphs BBoxes smoothly between adjacent frames
- Play button auto-advances frames at the selected speed
- Step forward/backward navigates one frame at a time
- GT/Pred toggle switches the overlay layer during replay
- Reduced-motion users see instant opacity transitions, no morphs
- Typecheck passes
  </acceptance_criteria>

### 2. DatasetVersionDiffPanel Component

<read_first>

- apps/web/src/App.tsx (DatasetPanel pattern)
- apps/web/src/features/annotations/AnnotationEngine.tsx
- apps/web/src/data/demo.ts
  </read_first>

<action>
Create `apps/web/src/features/timeline/DatasetVersionDiff.tsx`.

Feature:

1. **Version selector** — two dropdowns to select "Compare" and "Against" versions
2. **Diff engine** — compute added, removed, and changed annotations between two versions
3. **Diff visualization** — boxes colored by diff type:
   - Added: solid green border + translucent green fill (new boxes)
   - Removed: red border + translucent red fill with strikethrough on label
   - Changed: amber border + translucent amber fill (same label, different geometry)
4. **Summary strip** — "+N added / -N removed / ~N changed" count badges at the top
5. **Asset-level diff list** — scrollable list of assets with diff indicators

Diff computation:

- Match annotations by `(labelClassId, geometry)` — exact match = unchanged
- Match by `labelClassId` only = changed geometry
- No match on labelClassId = added (new) or removed (missing)

Visual treatment:

- Added box: `border: 1.5px solid oklch(80% 0.13 152)`, `background: rgba(106,217,161,0.15)`
- Removed box: `border: 1.5px solid oklch(76% 0.14 25)`, `background: rgba(239,68,68,0.15)`, label text with line-through
- Changed box: `border: 1.5px solid oklch(82% 0.13 88)`, `background: rgba(255,183,77,0.15)`
- Count badges: small inline pills matching the diff color

States:

- No comparison selected: prompt to select two versions
- Identical versions: "No differences found" with green checkmark
- Differences found: full diff visualization
  </action>

<acceptance_criteria>

- Version A vs Version B shows added/removed/changed annotations
- Count badges accurately reflect diff totals
- Changed boxes show both the old and new geometry visually (ghost outline for old position)
- Typecheck passes
  </acceptance_criteria>

### 3. PipelineExecutionFlow Component

<read_first>

- apps/web/src/App.tsx (PipelinePanel pattern)
- apps/web/src/data/demo.ts
  </read_first>

<action>
Create `apps/web/src/features/timeline/PipelineExecutionFlow.tsx`.

Feature:

1. **Mini pipeline graph** — simplified pipeline visualization (smaller than full React Flow)
2. **Execution state** — nodes light up as the pipeline processes (input → resize → detector → NMS → output)
3. **Edge particle flow** — animated dashed line / flowing particles along the active edge during execution
4. **Timing strip** — shows elapsed time per node
5. **Log snippet panel** — expandable panel showing worker logs for each node

Implementation:

- Use a smaller React Flow instance OR custom SVG/CSS pipeline visualization
- Node states: `idle` (dim), `running` (pulsing glow), `complete` (signal green), `error` (red)
- Edge particle flow: CSS animation on a dashed stroke-dashoffset, or SVG stroke animation
- Timing: show ms elapsed per node in monospace below each node
- Log panel: collapsible drawer at the bottom of the component

Animation details:

- Node running state: pulsing `box-shadow` animation, 1.2s ease-in-out infinite
- Edge flow: `stroke-dashoffset` animation, 0.8s linear infinite, directional (left to right)
- Node completion: scale pulse (1.0 → 1.06 → 1.0) with spring, 300ms
- Error state: shake animation (CSS keyframes), 400ms

Edge particle flow CSS:

```css
@keyframes edge-flow {
  from {
    stroke-dashoffset: 24;
  }
  to {
    stroke-dashoffset: 0;
  }
}
.flowing-edge {
  stroke-dasharray: 6 18;
  animation: edge-flow 0.8s linear infinite;
}
```

</action>

<acceptance_criteria>

- Pipeline execution flow shows sequential node activation (input → resize → detector → NMS → output)
- Active edges show flowing particle animation
- Completed nodes display elapsed time
- Error nodes show red state with log snippet
- Typecheck passes
  </acceptance_criteria>

## Wave 2 — Motion Polish

### 4. Global Motion Refinement

<read_first>

- apps/web/src/index.css (existing motion/animation system)
- apps/web/src/features/evaluation/PredictionOverlayCanvas.tsx
- apps/web/src/features/annotations/AnnotationEngine.tsx
- DESIGN.md
  </read_first>

<action>
Refine the motion system across all components per Emil Kowalski design principles:

1. **Navigation rail** — add subtle entrance animation on app load (items stagger in from left, 30ms delay between items)
2. **Section transitions** — review and refine all `AnimatePresence` transitions in App.tsx for consistency
3. **BBox interactions** — ensure all bounding boxes use spring physics with consistent stiffness/damping
4. **Button press feedback** — audit all buttons for `active:scale-[0.97]` or equivalent
5. **Hover micro-interactions** — add subtle scale/brightness changes to interactive elements
6. **Scanline refinement** — the existing scanline animation should feel atmospheric, not distracting

Consistent motion tokens (add to motion package):

```typescript
// Consistent spring configs
export const springSnappy = { stiffness: 320, damping: 30 };
export const springSoft = { stiffness: 220, damping: 26 };
export const springMorph = { stiffness: 280, damping: 28 };

// Consistent duration
export const durationInstant = 0;
export const durationFast = 0.12;
export const durationBase = 0.2;
export const durationSlow = 0.36;

// Consistent easing
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;
```

Button press feedback audit:

- All `bg-signal-300` buttons: add `active:translate-y-px` or `active:scale-[0.97]`
- All icon buttons: ensure `focus-visible:ring-2 focus-visible:ring-signal-300`

Nav entrance stagger:

```typescript
const navItems = sections.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03, ...motionTokens.springSoft }}
  />
));
```

</action>

<acceptance_criteria>

- All section transitions use consistent motion tokens
- Button press feedback is applied consistently across the app
- Nav rail has staggered entrance animation
- Motion system is cohesive and not distracting
- `useReducedMotion` collapses all motion appropriately
- Typecheck passes
  </acceptance_criteria>

### 5. App.tsx Timeline Integration

<read_first>

- apps/web/src/App.tsx (full file)
- apps/web/src/features/timeline/TimelineReplayPanel.tsx (from step 1)
- apps/web/src/features/timeline/DatasetVersionDiff.tsx (from step 2)
- apps/web/src/features/timeline/PipelineExecutionFlow.tsx (from step 3)
  </read_first>

<action>
Integrate all three new components into App.tsx:

1. Add new `SectionId` type: `"timeline" | "diff"`
2. Add nav items:
   - `{ id: "timeline", label: "Replay", icon: PlayCircle }`
   - `{ id: "diff", label: "Diff", icon: GitCompare }`
3. Add Timeline panel that uses the seeded demo data from `demoSnapshot` and annotations from state
4. Add Diff panel that shows version comparisons using the seeded version data
5. Keep all existing sections (overview, media, datasets, annotate, pipeline, jobs) working
6. Ensure the pipeline execution flow can be triggered from the Jobs panel when a job is running

State additions:

- `activeAssetIndex: number` — current frame in timeline replay
- `isPlaying: boolean` — playback state
- `playbackSpeed: number` — 0.5 | 1 | 2
- `compareVersionId: string | null` — diff comparison source
- `againstVersionId: string | null` — diff comparison target

API integration (later phases):

- Timeline replay fetches media assets and annotations from the API
- Diff fetches two version snapshots from the API
- Pipeline execution flow subscribes to job SSE events
- For V1: all data comes from seeded demo state
  </action>

<acceptance_criteria>

- New Timeline and Diff sections appear in the nav rail and workbench
- Timeline replay shows all seeded frames with BBox morphing
- Diff panel shows version comparison with added/removed/changed boxes
- All existing sections continue to work correctly
- Typecheck passes
- No horizontal overflow on mobile for new sections
  </acceptance_criteria>

## Wave 3 — Integration and Verification

### 6. Verification

<action>
Run the full verification suite:
1. `pnpm verify` — typecheck, tests, production build for all packages
2. `pnpm --filter @visionflow/contracts test`
3. `pnpm --filter @visionflow/api test`
4. `pnpm --filter @visionflow/web typecheck`
5. Playwright smoke — navigate to Timeline and Diff sections, verify no console errors

Browser smoke targets:

- Timeline section: frame strip, scrubber, playback controls
- Diff section: version selector, diff visualization
- Pipeline section: execution flow animation
- Jobs section: edge particle flow during pipeline execution
  </action>

<acceptance_criteria>

- All packages typecheck clean
- All tests pass
- Production build succeeds
- Playwright smoke passes for new sections
- No console errors on new pages
  </acceptance_criteria>

## Key Files Modified/Created

Created:

- `apps/web/src/features/timeline/TimelineReplayPanel.tsx`
- `apps/web/src/features/timeline/DatasetVersionDiff.tsx`
- `apps/web/src/features/timeline/PipelineExecutionFlow.tsx`
- `apps/web/src/features/timeline/index.ts`
- `.planning/phases/phase-9-timeline-replay-motion/PLAN.md`
- `.planning/phases/phase-9-timeline-replay-motion/UI-SPEC.md`

Modified:

- `apps/web/src/App.tsx`
- `apps/web/src/index.css`
- `packages/motion/src/index.ts` (motion tokens)

## Key Decisions

1. **Demo-seeded data for V1** — Timeline and Diff use seeded demo data, not API calls. API integration deferred to future phases.
2. **Framer Motion for all BBox morphs** — uses `layoutId` for seamless interpolation, `AnimatePresence` for enter/exit.
3. **Custom SVG pipeline visualization** — simpler than full React Flow for the execution flow component.
4. **Consistent motion tokens** — all spring configs and durations centralized in `packages/motion`.
5. **Ghost outline for changed boxes** — shows both old and new geometry to make diffs immediately legible.
