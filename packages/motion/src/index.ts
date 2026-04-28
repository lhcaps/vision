export const motionTokens = {
  springFast: { type: "spring", stiffness: 420, damping: 32 },
  springSoft: { type: "spring", stiffness: 260, damping: 26 },
  easeScan: [0.22, 1, 0.36, 1],
  durationFast: 0.18,
  durationBase: 0.32,
  durationSlow: 0.7,
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
