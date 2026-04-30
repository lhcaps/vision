# Phase 9: Timeline Replay and Motion Polish — UI Design Contract

Status: completed
Phase: 9
Date: 2026-05-01

## Design Register

Product UI. Design serves repeated technical workflows — the CV engineer needs to inspect how annotations evolve across frames, compare dataset versions at a glance, and see the pipeline execute in real time. Motion explains state, never decorates.

## Design Settings

- DESIGN_VARIANCE: 8
- MOTION_INTENSITY: 7
- VISUAL_DENSITY: 8

## Color Strategy (Phase 9 Additions)

Restrained technical palette with diff-specific colors:

- Added: `oklch(80% 0.13 152)` (signal green)
- Removed: `oklch(76% 0.14 25)` (red)
- Changed: `oklch(82% 0.13 88)` (amber)
- Running node: `oklch(78% 0.12 205)` (scan cyan)
- Complete node: `oklch(80% 0.13 152)` (signal green)

No new color additions. Reuse existing tokens.

## Timeline Replay Panel

### Layout

Two-row layout:

- Top row (flex-1): Canvas with morphing BBoxes
- Middle row (auto): Playback controls + scrubber
- Bottom row (auto): Frame strip (horizontal scroll)

### Canvas Area

Reuse the atmospheric canvas design from PredictionOverlayCanvas:

- Radial gradient base (green accent)
- Atmospheric edge fade
- Frame indicator badge (top-left)
- BBox morphing layers with Framer Motion

### Playback Controls Bar

Background: `bg-graphite-950/84 backdrop-blur`, top border `border-white/[0.06]`

Controls (left to right):

1. **Step backward** — icon button, `ChevronLeft`
2. **Play/Pause** — icon button (large, centered), `Play` / `Pause`
3. **Step forward** — icon button, `ChevronRight`
4. **Speed selector** — pill group: `0.5x`, `1x`, `2x` — active pill uses `bg-signal-300/10` + inner glow
5. **Frame counter** — `frame 3 / 20` in monospace
6. **GT/Pred toggle** — two-pill toggle group

All icon buttons use the established inner-glow pattern (NO border).

### Scrubber

- Full-width track with `bg-white/10` background
- Thumb: signal green circle with glow
- Track fill: signal green gradient
- Tick marks at frame boundaries
- Drag: smooth spring snapping to nearest frame

### Frame Strip

- Horizontal scroll container
- Frame thumbnails: 80x48px with `inner-border-subtle`, rounded-md
- Active frame: signal green inner glow + slight scale
- Frame number badge below each thumbnail
- Hover: scale 1.04 + brightness increase
- Scroll: momentum-based on touch devices

## Dataset Version Diff Panel

### Layout

Three-row layout:

- Top: Version selectors + summary strip
- Middle: Canvas with diff overlay
- Bottom: Asset-level diff list

### Version Selectors

Two dropdown-style controls side by side:

- Left: "Compare" version (source)
- Right: "Against" version (target)
- Format: `[Version pill] ↔ [Version pill]`
- Active version pills use `inner-border-subtle` with monospace label

### Summary Strip

Horizontal row of count badges:

- `+N added` — green badge
- `-N removed` — red badge
- `~N changed` — amber badge

Badge style: small rounded pills, no border, colored background tint matching the diff type.

### Diff Canvas

Same atmospheric canvas as PredictionOverlayCanvas but with diff coloring:

- Added boxes: dashed green border, green tint fill
- Removed boxes: solid red border, red tint fill, label with strikethrough
- Changed boxes: solid amber border, amber tint fill + ghost outline at old position
- Overlapping GT/Pred: intersection shown as before

### Ghost Outline (Changed Boxes)

For each changed box, render:

1. Ghost outline at old position: dashed border, `opacity: 0.35`, no fill
2. New position: solid border + fill as normal
3. Connector line between old and new center points: dashed line, `opacity: 0.5`

## Pipeline Execution Flow

### Layout

Single compact row:

- Mini pipeline graph (center, ~60% width)
- Timing strip below nodes
- Log snippet panel (collapsible, below graph)

### Mini Pipeline Graph

Simplified visual (not full React Flow):

- Horizontal row of 5 node cards
- Node cards: 64x48px, `inner-border-subtle`, monospace label
- Edge arrows between nodes: thin SVG lines

Node states:

- `idle`: `bg-graphite-900/50`, `text-neutral-500`
- `running`: `bg-scan-300/10`, pulsing cyan border, `text-scan-300`
- `complete`: `bg-signal-300/10`, signal green border, `text-signal-300`
- `error`: `bg-red-300/10`, red border, `text-red-300`

Edge flow animation:

- Active edge: dashed line with animated `stroke-dashoffset`
- Color: scan cyan
- Speed: 0.8s linear loop

### Timing Strip

Below each node card:

- Monospace ms value: `12ms`
- Separator: thin horizontal line

### Log Snippet Panel

Collapsible drawer below the graph:

- Trigger: "Worker logs" toggle button
- Content: monospace log lines with timestamps
- Max height: 160px with scroll
- Background: `bg-graphite-950`

## Motion Specifications

### BBox Morph (Timeline Replay)

```typescript
// Framer Motion spring for morphing
const morphSpring = { stiffness: 280, damping: 28 };

// Exit animation
const exitTransition = { duration: 0.12, ease: [0.22, 1, 0.36, 1] };

// Enter animation
const enterTransition = { duration: 0.16, ease: [0.22, 1, 0.36, 1] };
```

### Scrubber Drag

```typescript
// Scrubber thumb snap
const scrubSpring = { stiffness: 400, damping: 36 };
```

### Node Pulse (Pipeline Flow)

```css
@keyframes node-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(92, 200, 255, 0);
  }
  50% {
    box-shadow: 0 0 12px 2px rgba(92, 200, 255, 0.4);
  }
}
.running-node {
  animation: node-pulse 1.2s ease-in-out infinite;
}
```

### Edge Flow (Pipeline Flow)

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

### Button Press Feedback

All interactive buttons:

```css
button:active {
  transform: translateY(1px);
}
```

### Stagger Entrance (Nav Rail)

```typescript
// Nav items stagger on mount
const staggerDelay = 0.03; // seconds between items
```

## Component Inventory

### TimelineReplayPanel

- Props: mediaAssets, annotations, groundTruth, predictions, onFrameChange
- States: loading, populated, empty (no multi-frame data)
- Sections: canvas, scrubber, playback controls, frame strip

### FrameStrip

- Props: frames[], activeIndex, onSelect
- Horizontal scroll with momentum
- Active frame highlighted
- Thumbnail hover scale effect

### PlaybackControls

- Props: isPlaying, speed, currentFrame, totalFrames, onPlay, onPause, onStep, onSpeedChange
- Play/pause toggle, step buttons, speed selector, frame counter

### Scrubber

- Props: currentFrame, totalFrames, onScrub
- Draggable thumb with spring snapping
- Frame tick marks

### DatasetVersionDiff

- Props: versions[], annotations
- States: no-selection, comparing, no-differences, with-differences
- Sections: version selectors, summary strip, diff canvas, asset list

### DiffBadge

- Props: type ('added'|'removed'|'changed'), count
- Colored pill matching diff type

### GhostOutline

- Props: oldGeometry, newGeometry, imageWidth, imageHeight, color
- Renders ghost border + connector line

### PipelineExecutionFlow

- Props: definition, executionState, logs
- States: idle, running, complete
- Sections: mini graph, timing strip, log panel

### ExecutionNode

- Props: node, state, elapsedMs
- Idle/running/complete/error visual states

### FlowingEdge

- Props: from, to, active
- Animated dashed line when active

## Responsive Behavior

- Desktop (> 1024px): Full layout with all controls
- Tablet (768–1024px): Frame strip scrollable, controls stack if needed
- Mobile (< 768px): Single-column, playback controls compact, frame strip as horizontal scroll
- No horizontal overflow on any viewport width

## Design Anti-Patterns to Avoid (Phase 9)

- **NO white borders** on any new element
- **NO generic card borders** — use inner-border-subtle pattern
- **NO animation on keyboard-initiated actions** (frame stepping via arrow keys)
- **NO jarring transitions** — all motion uses spring physics
- **NO distracting particle effects** — edge flow is subtle, not flashy
- **NO purple-blue gradients** — reuse existing color tokens only
