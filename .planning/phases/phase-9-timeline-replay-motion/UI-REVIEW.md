# Phase 9 UI Review — Timeline Replay and Motion Polish

**Review Date:** 2026-05-01
**Reviewer:** Design Engineering Audit (Emil Kowalski philosophy + impeccable standards)
**Scope:** `TimelineReplayPanel.tsx`, `DatasetVersionDiff.tsx`, `PipelineExecutionFlow.tsx`, `index.css`

---

## 6-Pillar Summary Scores

| Pillar | Score | Verdict |
|---|---|---|
| **Visual Hierarchy & Typography** | PASS | Tight scale, monospace counters, restrained weight contrast |
| **Color (oklch Consistency)** | PASS | All tokens use oklch; no raw hex except edge cases |
| **Motion & Animation Quality** | FLAG | Spring physics present; reduced-motion gaps exist |
| **Component Structure & Reusability** | FLAG | Well-isolated sub-components; some logic leakage |
| **Interaction Polish** | PASS | Active states, focus rings, hover feedback all present |
| **Anti-Patterns** | FLAG | `transition: all` leaks; keyboard animation missing guard |

---

## Component-by-Component Findings

---

### 1. `TimelineReplayPanel.tsx`

#### Strengths

- **Spring physics**: `MORPH_SPRING = { stiffness: 280, damping: 28 }` and `SCRUB_SPRING = { stiffness: 400, damping: 36 }` follow the Apple-recommended spring format. Excellent.
- **Scale-from-press**: `whileTap={{ scale: 0.94 }}` on PlayPauseButton gives immediate tactile feedback.
- **Reduced motion respected**: `useReducedMotion()` gates BBox entry/exit animations and scanline.
- **Pointer capture**: `setPointerCapture()` on scrubber and thumb is implemented correctly for drag continuity.
- **Oklch color**: All color values use `oklch()` — no raw `#hex` for design tokens.
- **Easing**: Custom cubic-bezier `[0.22, 1, 0.36, 1]` is used throughout, stronger than default CSS easings.
- **`AnimatePresence mode="popLayout"`**: Correct choice for BBox morphing — exiting items collapse space before entering items.
- **Frame strip**: Staggered scroll-to-center with `block: "nearest"` prevents jank.
- **Custom scrollbar**: `scrollbarColor` on frame strip respects theme.

#### Findings

| # | Category | Issue | Before | After | Why | Priority |
|---|---|---|---|---|---|---|
| 1 | Motion | `transition: all` on speed buttons and overlay mode toggle | `transition-all duration-160` | `transition: transform 160ms ease-out, color 160ms ease-out` | `all` triggers layout recalculation; transforms are GPU-accelerated | MEDIUM |
| 2 | Motion | `transition: all` on frame thumbnail buttons | `transition-all duration-160` | `transition: transform 160ms ease-out, box-shadow 160ms ease-out, opacity 160ms ease-out` | Only animate `transform`, `opacity`, `box-shadow` — avoid `all` | MEDIUM |
| 3 | Motion | `transition: all` on ControlButton | `transition-all duration-160` | `transition: color 160ms ease-out, background-color 160ms ease-out, transform 160ms ease-out` | Restrict to actual changed properties | MEDIUM |
| 4 | Motion | No reduced-motion guard on scrubber thumb scale | `animate={{ scale: isDragging ? 1.2 : 1 }}` | `animate={{ scale: shouldReduceMotion ? 1 : isDragging ? 1.2 : 1 }}` | Scrubber thumb scale is decorative; should pause for reduced-motion users | LOW |
| 5 | Motion | `Scanline` animation not gated by `shouldReduceMotion` | `{isPlaying && !shouldReduceMotion && <div className="scanline" />}` | Keep as is | Already correct — scanline is gated. No change needed | — |
| 6 | Interaction | Speed button uses `active:translate-y-px` (Tailwind) | `active:translate-y-px` | `active:scale-[0.97]` or CSS `transform: scale(0.97)` | Emil Kowalski: `scale(0.97)` on press feels more like a physical button than `translate-y-px` | MEDIUM |
| 7 | Interaction | Overlay mode toggle uses `active:translate-y-px` | `active:translate-y-px` | `active:scale-[0.97]` | Same reason as above — consistent press feel across all buttons | MEDIUM |
| 8 | Interaction | ControlButton uses `active:translate-y-px` | `active:translate-y-px` | `active:scale-[0.97]` | Scale feedback is more tactile than vertical shift | MEDIUM |
| 9 | Animation | `MorphingBBox` uses `exit={{ opacity: 0, scale: 0.96 }}` | `scale: 0.96` | `scale: 0.95` | Emil rule: nothing in real world appears from nothing. `scale(0.94)` is ideal; `0.96` is acceptable but `0.95` is safer | LOW |
| 10 | Accessibility | No `prefers-reduced-motion` media query in component-level CSS | No media query | Add `@media (prefers-reduced-motion: reduce)` gate for scrubber animation | Global CSS has it, but scrubber-specific animations need it too | MEDIUM |

---

### 2. `DatasetVersionDiff.tsx`

#### Strengths

- **Stagger animation**: Summary badges animate in with `delay: 0`, `0.05`, `0.1` stagger — creates a cascade that feels intentional.
- **Ghost outline pattern**: Dashed ghost + connector line for changed boxes is a clever visualization of geometry drift. The `opacity: 0.35` on ghost keeps it subordinate.
- **Reduced motion branching**: Component branches on `shouldReduceMotion` to skip all entrance animations while keeping opacity for comprehension.
- **IoU-based diff computation**: Semantic diff (IoU threshold of 0.3) is more accurate than label-only matching. This is correct CV domain logic.
- **Oklch color system**: All three diff colors (green/red/amber) use oklch consistently.
- **`motionTokens.springSoft`**: Reuses shared motion tokens from `@visionflow/motion` — good token discipline.
- **Empty state**: "No differences found" and "All assets match" states are handled gracefully with contextual iconography.
- **Grid layout**: `xl:grid-cols-[minmax(0,1fr)_320px]` is responsive and avoids overflow.

#### Findings

| # | Category | Issue | Before | After | Why | Priority |
|---|---|---|---|---|---|---|
| 1 | Motion | `transition: all` on VersionPill | `transition-all duration-160` | `transition: background-color 160ms ease-out, color 160ms ease-out, box-shadow 160ms ease-out` | Restrict to changed properties only | MEDIUM |
| 2 | Animation | Stagger delay of 50ms per badge | `delay: 0.05` (50ms) | `delay: 0.03` (30ms) | Emil rule: stagger delays should be 30-80ms. 30ms is tighter and feels snappier for badge entries | LOW |
| 3 | Motion | `DiffBoxOverlay` exit animation uses `scale: 0.94` on exit only | `exit={{ opacity: 0, scale: 0.94 }}` | `exit={{ opacity: 0, scale: 0.96 }}` and `initial={{ opacity: 0, scale: 0.94 }}` | Asymmetric enter/exit: enter should be slightly slower (0.94) than exit (0.96) for a snappy feel | LOW |
| 4 | Animation | `DiffBadge` uses `scale: 0.9` as entry | `initial={{ opacity: 0, scale: 0.9 }}` | `initial={{ opacity: 0, scale: 0.95 }}` | `0.9` is borderline too small — elements appearing from nothing look jarring. `0.95` is the minimum acceptable | MEDIUM |
| 5 | Motion | `AssetDiffRow` uses `transition: { delay: index * 0.05, duration: 0.2 }` | `duration: 0.2` | `duration: 0.18` | UI animations should stay under 300ms. 200ms is acceptable but 180ms feels more responsive | LOW |
| 6 | Animation | No `prefers-reduced-motion` on `DiffBoxOverlay` | No reduced-motion guard on box overlays | Add `reducedMotion={Boolean(shouldReduceMotion)}` to `DiffBoxOverlay` props and gate scale/opacity animations | Diff boxes animate in when version changes; these should respect reduced motion | MEDIUM |
| 7 | Layout | `DiffCanvas` frame area uses `top-[14%]` vs `top-[10%]` in TimelineReplayPanel | `top-[14%]` | `top-[10%]` | Inconsistent frame positioning between diff canvas and replay canvas. One baseline should be established | LOW |

---

### 3. `PipelineExecutionFlow.tsx`

#### Strengths

- **Node state machine**: Clear `idle → running → complete/error` states with distinct visual treatments.
- **Log accordion**: `AnimatePresence` with height collapse is correctly implemented for the logs drawer.
- **Edge flow animation**: `stroke-dashoffset` animation on SVG edges creates a "data flowing" effect. `stroke-dasharray: 6 18` with 0.8s linear is appropriately subtle.
- **Node completion pulse**: The `[1, 1.05, 1]` scale bounce on complete nodes is a nice "done" confirmation without being flashy.
- **Auto-restart**: `setTimeout` re-fires execution after 3 seconds — good for demo scenarios. Should be configurable for production.
- **Auto-start on mount**: Execution begins automatically via `useEffect` with 800ms delay.
- **Execution status pill**: Visual status indicator (`idle`/`running`/`complete`) is immediately scannable.

#### Findings

| # | Category | Issue | Before | After | Why | Priority |
|---|---|---|---|---|---|---|
| 1 | Motion | `running-node` infinite animation not gated by `prefers-reduced-motion` | `animation: node-pulse 1.2s ease-in-out infinite` | Add to `index.css` reduced-motion overrides: `.running-node { animation: none; }` | Infinite pulse animation on "running" state can cause motion sickness. Should be disabled | HIGH |
| 2 | Motion | `flowing-edge` infinite animation not gated by `prefers-reduced-motion` | `animation: edge-flow 0.8s linear infinite` | Already handled in CSS (`@media (prefers-reduced-motion: reduce) { .flowing-edge, .running-node { animation: none; } }`) | **Already correct** — CSS handles this | — |
| 3 | Animation | Node completion bounce: `scale: [1, 1.05, 1]` on every completion | `animate={state === "complete" && !shouldReduceMotion ? { scale: [1, 1.05, 1] } : {}}` | Same — keep conditional on `!shouldReduceMotion` | Correctly gated; no change needed | — |
| 4 | Interaction | `getNodeClasses` uses `transition: all duration-200` | `transition: all duration-200` | `transition: background-color 200ms ease-out, color 200ms ease-out, box-shadow 200ms ease-out` | `all` causes layout recalculation; specify exact properties | MEDIUM |
| 5 | Animation | Log entry animation uses `duration: 0.15` | `transition={{ duration: 0.15 }}` | Keep as is | 150ms is appropriate for rapid log entries — fast feedback | — |
| 6 | Animation | Logs drawer uses `height: 0 → auto` | `animate={{ height: "auto" }}` with `AnimatePresence` | Keep as is; this is correct CSS-transition approach | Height animation is layout property — but since it's on a contained accordion, this is acceptable here | — |
| 7 | Motion | No explicit `ease-out` on node card transitions | `transition-all duration-200` (Tailwind default) | Use `cubic-bezier(0.22, 1, 0.36, 1)` explicitly via inline style or Tailwind's `ease-out` | Emil rule: custom easing curves are stronger than default CSS easings | LOW |
| 8 | Animation | ArrowDown chevron rotation: `transition={{ duration: 0.2 }}` | `transition={{ duration: 0.2 }}` | `transition={{ duration: 0.15 }}` | 200ms for a chevron rotation is slightly slow; 150ms feels more responsive | LOW |

---

### 4. `index.css` — Global Styles

#### Strengths

- **Oklch throughout**: Every color uses oklch with proper chroma calibration at extremes. The base `oklch(13.5% 0.008 180)` avoids pure black.
- **`color-scheme: dark`**: Declared in `:root` — browsers render dark inputs and scrollbars correctly.
- **Inner-border pattern**: `.inner-border` and `.inner-border-subtle` use `box-shadow: inset` rather than borders — a premium technique that avoids actual border rendering issues.
- **Custom easing**: `cubic-bezier(0.22, 1, 0.36, 1)` is used consistently across all component transitions — this is the correct strong ease-out curve.
- **`prefers-reduced-motion`**: Global override sets `animation-duration: 0.001ms` and `transition-duration: 0.001ms`. This is aggressive but effective.
- **Scrollbar styling**: Custom webkit scrollbar with gradient thumb looks premium.
- **No pure `#000` or `#fff`**: Explicitly avoided throughout the token system.

#### Findings

| # | Category | Issue | Before | After | Why | Priority |
|---|---|---|---|---|---|---|
| 1 | Anti-pattern | Duplicate `@keyframes edge-flow` defined twice | Lines 1037-1049 and 1213-1217 | Remove duplicate; keep only one definition | Code duplication causes confusion and potential CSS cascade issues | LOW |
| 2 | Anti-pattern | Duplicate `@keyframes node-pulse` defined twice | Lines 1055-1063 and 1219-1222 | Remove duplicate | Same as above | LOW |
| 3 | Performance | `.scanline` animation uses `@keyframes scan` — layout-triggering properties | `transform: translateY(270px)` | Keep as is; `translateY` is GPU-accelerated and safe | No change needed | — |
| 4 | Motion | `.running-node` infinite pulse is not in the CSS reduced-motion block | Lines 1320-1325 | Add `.running-node { animation: none; }` inside the `@media (prefers-reduced-motion: reduce)` block | Currently the global block at 851-863 handles this, but the CSS-defined `.running-node` class at 1229-1231 also needs explicit override | HIGH |
| 5 | Motion | CSS `.scanline` display:none in reduced-motion | `display: none` | Keep as is | Correctly hides scanline for reduced-motion users | — |
| 6 | Typography | No `@font-face` or font-display strategy | Implicit system font stack | Consider adding `font-display: swap` if custom fonts are loaded | Not critical for Geist (system), but worth noting | LOW |
| 7 | Accessibility | No `scroll-behavior: smooth` override for reduced-motion | `scroll-behavior: auto !important` in reduced-motion | Already correct | No change needed | — |

---

## Critical Issues (Require Immediate Attention)

### BLOCK-1: Infinite Animation Missing Reduced-Motion Guard

**File:** `index.css` + `PipelineExecutionFlow.tsx`

The `.running-node` CSS class applies an infinite pulse animation that is **not explicitly listed** in the `@media (prefers-reduced-motion: reduce)` block in the Pipeline Execution section. While the global block (line 851) has a broad override, the pipeline-specific block (line 1320) only targets `.flowing-edge` and `.running-node`. This means the infinite pulse may not be disabled consistently.

**Fix:** Ensure `.running-node { animation: none; }` is present in the reduced-motion media query at line 1320-1325.

### BLOCK-2: DiffBoxOverlay Missing ReducedMotion Gate

**File:** `DatasetVersionDiff.tsx` lines 488-538

`DiffBoxOverlay` accepts `reducedMotion` prop but does **not** use it to gate the `initial` and `animate`/`transition` animations. When the user switches versions, diff boxes animate in even if `prefers-reduced-motion` is enabled.

**Fix:** Add `disabledMotion` gating logic:

```tsx
initial={
  reducedMotion
    ? false
    : { opacity: 0, scale: 0.94 }
}
animate={{ opacity: 1, scale: 1 }}
transition={
  reducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
}
```

---

## Medium-Priority Issues

| # | Component | Issue |
|---|---|---|
| M1 | All buttons | `active:translate-y-px` should be `active:scale-[0.97]` for more tactile press feedback |
| M2 | All buttons | `transition: all` should be replaced with explicit property lists |
| M3 | `DiffBadge` | `initial={{ scale: 0.9 }}` should be `scale: 0.95` minimum |
| M4 | `PipelineExecutionFlow` | `transition-all` in `getNodeClasses` should be explicit property list |
| M5 | `index.css` | Two duplicate `@keyframes edge-flow` and two duplicate `@keyframes node-pulse` definitions |

---

## Low-Priority / Polish Issues

| # | Component | Issue |
|---|---|---|
| L1 | `TimelineReplayPanel` | Scrubber thumb scale animation should respect `shouldReduceMotion` |
| L2 | `DatasetVersionDiff` | Stagger delay of 50ms could be tightened to 30ms for snappier feel |
| L3 | `PipelineExecutionFlow` | Chevron rotation 200ms → 150ms for snappier accordion feel |
| L4 | `DatasetVersionDiff` | `DiffCanvas` frame area uses `top-[14%]` vs `top-[10%]` in replay canvas — establish single baseline |

---

## Anti-Pattern Audit

| Anti-Pattern | Status | Location |
|---|---|---|
| `transition: all` | **FOUND** | Speed buttons, overlay toggle, frame thumbnails, ControlButton, VersionPill, node cards |
| `scale(0)` entry animation | **CLEAR** | All components start from `scale(0.94)` or `scale(0.9)` minimum |
| `ease-in` on UI element | **CLEAR** | All transitions use `ease-out` or custom cubic-bezier |
| `transform-origin: center` on popover | **N/A** | No popovers in Phase 9 components |
| Animation on keyboard action | **CLEAR** | Arrow keys call `setCurrentFrameIndex` directly without animation |
| Duration > 300ms on UI element | **CLEAR** | All durations are 100-200ms |
| Hover animation without media query | **FLAG** | `hover:scale-[1.04]` on thumbnails — consider gating with `@media (hover: hover)` |
| Elements all appear at once | **CLEAR** | Stagger animations present in badge entries |
| Pure `#000` or `#fff` | **CLEAR** | All colors use oklch tokens |
| White borders | **CLEAR** | Inner-border-subtle pattern used throughout |
| Purple/blue gradient | **CLEAR** | No gradient text or neon glows |

---

## Summary Table

| Component | Finding Count | BLOCK | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| `TimelineReplayPanel.tsx` | 10 | 0 | 0 | 6 | 4 |
| `DatasetVersionDiff.tsx` | 7 | 1 | 0 | 3 | 3 |
| `PipelineExecutionFlow.tsx` | 8 | 1 | 1 | 2 | 5 |
| `index.css` | 7 | 1 | 1 | 1 | 4 |
| **Total** | **32** | **3** | **2** | **12** | **16** |

---

## Recommendations (Priority Order)

1. **Immediate**: Add `.running-node { animation: none; }` to the pipeline's reduced-motion block in `index.css`
2. **Immediate**: Gate `DiffBoxOverlay` animations with the `reducedMotion` prop
3. **Next sprint**: Replace all `transition: all` with explicit property lists across all three components
4. **Next sprint**: Replace `active:translate-y-px` with `active:scale-[0.97]` on all pressable buttons
5. **Polish**: Raise `DiffBadge` initial scale from `0.9` to `0.95`
6. **Polish**: Deduplicate `@keyframes edge-flow` and `@keyframes node-pulse` in `index.css`
7. **Polish**: Tighten stagger delays from 50ms to 30ms on badge entrances
