export const motionTokens = {
  springFast: { type: "spring" as const, stiffness: 420, damping: 32 },
  springSoft: { type: "spring" as const, stiffness: 220, damping: 26 },
  springMorph: { type: "spring" as const, stiffness: 280, damping: 28 },
  springSnap: { type: "spring" as const, stiffness: 400, damping: 36 },
  springSnappy: { type: "spring" as const, stiffness: 320, damping: 30 },
  easeOut: [0.22, 1, 0.36, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  easeScan: [0.22, 1, 0.36, 1] as const,
  easeDraw: [0.32, 0.72, 0, 1] as const,
  durationInstant: 0,
  durationFast: 0.12,
  durationBase: 0.2,
  durationSlow: 0.36,
  durationMorph: 0.16,
} as const;

export const pipelineMotion = {
  nodePulse: { duration: 1.2, ease: "easeInOut" },
  edgeFlow: { duration: 0.8, ease: "linear" },
  nodeComplete: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  nodeError: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
} as const;

export const stateMotion = {
  bbox: {
    idle: "opacity-60",
    drawing: "border-cyan-300",
    selected: "border-emerald-300 shadow-[inset_0_0_0_1px_rgba(106,217,161,0.55)]",
    scanning: "border-cyan-300",
    locked: "border-emerald-300",
    lowConfidence: "border-amber-300",
    rejected: "border-red-300",
  },
  pipelineNode: {
    idle: "border-neutral-700",
    queued: "border-amber-400",
    active: "border-cyan-300",
    succeeded: "border-emerald-300",
    failed: "border-red-300",
  },
} as const;
