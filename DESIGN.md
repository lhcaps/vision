# VisionFlow Studio Design Context

## Design Register

Product UI. Design serves repeated technical workflows. The interface should be dense but readable, using familiar app patterns with distinctive state-driven motion.

## Design Settings

- DESIGN_VARIANCE: 7
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
- Dataset diff: add/remove/change transitions.

Respect reduced motion. Animate transform and opacity first. Avoid layout-property animation.

## Component State Bar

Every important frontend surface needs:

- Loading state.
- Empty state.
- Error state.
- Active/selected state.
- Focus-visible state.
- Reduced-motion fallback.

## Interaction Priorities

- Annotation surfaces must preserve coordinate clarity.
- Pipeline builder must validate graph quality and show actionable errors.
- Job detail must make async state and worker output visible.
- Export and evaluation flows should feel inspectable and reproducible.
