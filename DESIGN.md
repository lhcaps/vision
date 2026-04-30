# VisionFlow Studio Design Context

## Design Register

Product UI. Design serves repeated technical workflows. The interface should be dense but readable, using familiar app patterns with distinctive state-driven motion.

## Design Settings

- DESIGN_VARIANCE: 8
- MOTION_INTENSITY: 7
- VISUAL_DENSITY: 8

## Theme Scene

A computer vision engineer is reviewing inference quality on a large monitor in a focused evening workspace. The UI can be dark and high-contrast, but it should avoid generic dark-blue SaaS styling.

## Color Strategy

Restrained technical palette with tinted near-black neutrals, graphite surfaces, surgical green for success/active states, amber for warnings, red for failed states, and cool cyan only for scan/data-flow signals. Accent use should communicate state, selection, or progress rather than decoration.

Avoid:

- Purple-blue AI gradients.
- Decorative glows.
- Generic hero metric blocks.
- Repetitive equal card grids.
- Glassmorphism as a default material.
- **White/light borders for selection and hover states.** Selection communicates via background tint, inner shadow, and scale — NOT white outlines.
- **Generic card look (border + shadow + background) on every panel.** Cards should exist only when elevation communicates hierarchy.

## Border and Selection Policy

**No white/light borders for selection.** The primary interaction signal is background tint + inner glow + subtle scale, never white outlines.

Selection states (nav item, icon button, list item, table row):

- Background shifts to tinted surface (e.g. `bg-signal-300/10`)
- Inner glow via inset box-shadow (e.g. `shadow-[inset_0_0_0_1px_oklch(80%_0.13_152/0.24)]`)
- Subtle scale for tactile feedback (`scale-[0.99]` on press)
- No border color change — borders stay transparent or match the neutral surface

Hover states:

- Background tint shift (e.g. `bg-white/[0.04]` to `bg-white/[0.07]`)
- No border brightening

Focus states:

- Ring via `focus-visible:ring-2 focus-visible:ring-signal-300` — no border tricks

Dividers between sections:

- `border-white/5` or `border-white/[0.06]` — barely visible, structural only
- Never use `border-white/10` or brighter for decorative dividers

## Typography

Use a high-quality sans UI stack. Prefer Geist or system UI for dense app surfaces, with JetBrains Mono or a similar monospace for IDs, logs, metrics, coordinates, and runtime data.

Rules:

- Fixed rem scale, not viewport-scaled type.
- UI labels stay compact and deliberate.
- Numbers and logs use monospace.
- No serif fonts in the product app.

## Layout Model

Primary app layout:

- Left navigation rail.
- Top command/status bar.
- Dense workbench canvas.
- Right detail/inspector panels where useful.
- Tables and timelines use lines, spacing, and grouped rows rather than generic card stacks.

Cards are allowed only for individual repeated entities or framed tools. Page sections should rely on panels, rails, tabs, lists, and canvases.

## Motion Rules

Motion must explain state:

- BBox appears: scan reveal.
- BBox selected: handles fade/scale.
- Pipeline node running: edge particle flow.
- Job progress: smooth progress fill.
- Timeline scrub: bbox morph.
- Selection: scale pulse (1.0 -> 1.02 -> 1.0) with spring physics

Respect reduced motion. Animate transform and opacity first. Avoid layout-property animation.

## Component State Bar

Every important frontend surface needs:

- Loading state.
- Empty state.
- Error state.
- Active/selected state (background tint + inner glow, NO white border).
- Focus-visible state.
- Reduced-motion fallback.

## Interaction Priorities

- Annotation surfaces must preserve coordinate clarity.
- Pipeline builder must validate graph quality and show actionable errors.
- Job detail must make async state and worker output visible.
- Export and evaluation flows should feel inspectable and reproducible.
