import {
  PauseIcon as Pause,
  PlayIcon as Play,
  SkipBackIcon as SkipBack,
  SkipForwardIcon as SkipForward,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnnotationSummary, PredictionSummary } from "@visionflow/contracts";
import { motionTokens } from "@visionflow/motion";

const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 1080;

type OverlayMode = "gt" | "pred" | "both";

type BBoxData = {
  id: string;
  label: string;
  color: string;
  confidence?: number | null;
  isGroundTruth: boolean;
  geometry: { x: number; y: number; width: number; height: number };
};

type FrameData = {
  id: string;
  name: string;
  yOffset: number;
};

type TimelineReplayPanelProps = {
  mediaAssets?: Array<{ id: string; name: string; width: number; height: number }>;
  groundTruth?: AnnotationSummary[];
  predictions?: PredictionSummary[];
};

// Generate simulated multi-frame data from demo annotations
function useFrameSequence(groundTruth: AnnotationSummary[]) {
  return useMemo<FrameData[]>(() => {
    if (groundTruth.length === 0) {
      return [
        { id: "frame_1482", name: "north-gate-frame-1482.jpg", yOffset: 0 },
        { id: "frame_1506", name: "north-gate-frame-1506.jpg", yOffset: 12 },
        { id: "frame_1519", name: "north-gate-frame-1519.jpg", yOffset: 24 },
      ];
    }

    return [
      { id: "frame_1482", name: "north-gate-frame-1482.jpg", yOffset: 0 },
      { id: "frame_1506", name: "north-gate-frame-1506.jpg", yOffset: 12 },
      { id: "frame_1519", name: "north-gate-frame-1519.jpg", yOffset: 24 },
    ];
  }, [groundTruth]);
}

function buildBBoxesForFrame(
  groundTruth: AnnotationSummary[],
  predictions: PredictionSummary[],
  frame: FrameData,
): BBoxData[] {
  const boxes: BBoxData[] = [];

  for (const gt of groundTruth) {
    boxes.push({
      id: gt.id,
      label: gt.label,
      color: gt.color ?? "#6ad9a1",
      confidence: gt.confidence,
      isGroundTruth: true,
      geometry: {
        x: gt.geometry.x,
        y: gt.geometry.y + frame.yOffset,
        width: gt.geometry.width,
        height: gt.geometry.height,
      },
    });
  }

  for (const pred of predictions) {
    boxes.push({
      id: pred.id,
      label: pred.label,
      color: pred.color ?? "#ffb74d",
      confidence: pred.confidence,
      isGroundTruth: false,
      geometry: {
        x: pred.geometry.x,
        y: pred.geometry.y + frame.yOffset,
        width: pred.geometry.width,
        height: pred.geometry.height,
      },
    });
  }

  return boxes;
}

const MORPH_SPRING = { stiffness: 280, damping: 28 };
const SCRUB_SPRING = { stiffness: 400, damping: 36 };

const THUMBNAIL_WIDTH = 80;
const THUMBNAIL_HEIGHT = 48;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function TimelineReplayPanel({
  mediaAssets = [],
  groundTruth = [],
  predictions = [],
}: TimelineReplayPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const scrubberRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frames = useFrameSequence(groundTruth);
  const totalFrames = frames.length;

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("both");
  const [isDragging, setIsDragging] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);

  const currentFrame = frames[currentFrameIndex];
  const currentBoxes = useMemo(
    () => buildBBoxesForFrame(groundTruth, predictions, currentFrame),
    [groundTruth, predictions, currentFrame],
  );

  const frameIds = useMemo(() => frames.map((f) => f.id), [frames]);

  // Sync scrub position with frame index
  useEffect(() => {
    if (!isDragging) {
      setScrubPosition(totalFrames > 1 ? currentFrameIndex / (totalFrames - 1) : 0);
    }
  }, [currentFrameIndex, totalFrames, isDragging]);

  // Playback loop
  useEffect(() => {
    if (isPlaying && totalFrames > 1) {
      const interval = 1000 / playbackSpeed;
      playbackRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % totalFrames);
      }, interval);
    } else {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
        playbackRef.current = null;
      }
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalFrames]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (stripRef.current) {
      const thumbEl = stripRef.current.querySelector(`[data-frame-index="${currentFrameIndex}"]`);
      if (thumbEl) {
        thumbEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentFrameIndex]);

  const handleScrubStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      updateScrubPosition(clientX);
    },
    [],
  );

  const handleScrubMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      updateScrubPosition(clientX);
    },
    [isDragging],
  );

  const handleScrubEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const snappedIndex = Math.round(scrubPosition * (totalFrames - 1));
    setCurrentFrameIndex(clamp(snappedIndex, 0, totalFrames - 1));
  }, [isDragging, scrubPosition, totalFrames]);

  const updateScrubPosition = useCallback(
    (clientX: number) => {
      if (!scrubberRef.current) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const rawPosition = clamp(relativeX / rect.width, 0, 1);
      setScrubPosition(rawPosition);
      const nearestIndex = Math.round(rawPosition * (totalFrames - 1));
      setCurrentFrameIndex(nearestIndex);
    },
    [totalFrames],
  );

  const handleStepBackward = useCallback(() => {
    setCurrentFrameIndex((prev) => clamp(prev - 1, 0, totalFrames - 1));
  }, [totalFrames]);

  const handleStepForward = useCallback(() => {
    setCurrentFrameIndex((prev) => clamp(prev + 1, 0, totalFrames - 1));
  }, [totalFrames]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleThumbnailClick = useCallback(
    (index: number) => {
      setCurrentFrameIndex(index);
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    handleScrubEnd();
  }, [handleScrubEnd]);

  // Global pointer events for drag
  useEffect(() => {
    if (isDragging) {
      const onMove = (e: PointerEvent) => handleScrubMove(e.clientX);
      const onUp = () => handleScrubEnd();
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }
  }, [isDragging, handleScrubMove, handleScrubEnd]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleStepBackward();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleStepForward();
      } else if (e.key === " ") {
        e.preventDefault();
        handleTogglePlay();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleStepBackward, handleStepForward, handleTogglePlay]);

  const showGT = overlayMode === "gt" || overlayMode === "both";
  const showPred = overlayMode === "pred" || overlayMode === "both";
  const visibleBoxes = currentBoxes.filter((box) => (box.isGroundTruth ? showGT : showPred));

  const speeds: Array<0.5 | 1 | 2> = [0.5, 1, 2];

  return (
    <div
      className="flex flex-col gap-0 overflow-hidden rounded-md inner-border-subtle bg-graphite-900/75"
      style={{ minHeight: 520 }}
    >
      {/* Header */}
      <div className="divider flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">Timeline replay</h2>
          <p className="mt-1 font-mono text-xs text-neutral-500">
            {currentFrame.name} / {IMAGE_WIDTH} x {IMAGE_HEIGHT}
          </p>
        </div>
        <span className="font-mono text-xs text-signal-300">
          frame {currentFrameIndex + 1} / {totalFrames}
        </span>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 overflow-hidden bg-graphite-950" style={{ minHeight: 360 }}>
        {/* Atmospheric radial gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 28% 22%,rgba(106,217,161,0.07),transparent 32%)",
          }}
        />

        {/* Edge fade */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top,rgba(5,13,12,0.88),transparent 30%),linear-gradient(to bottom,transparent 0%,rgba(5,13,12,0.4) 12%),linear-gradient(to left,rgba(5,13,12,0.88),transparent 18%),linear-gradient(to right,rgba(5,13,12,0.88),transparent 18%)",
          }}
        />

        {/* Frame */}
        <div
          className="absolute left-[8%] top-[10%] h-[80%] w-[84%]"
          style={{ boxShadow: "inset 0 0 80px rgba(0,0,0,0.4)" }}
        >
          {/* Grid overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "linear-gradient(to bottom, transparent 8%, black 16%, black 84%, transparent 92%),linear-gradient(to right, transparent 4%, black 8%, black 92%, transparent 96%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 8%, black 16%, black 84%, transparent 92%),linear-gradient(to right, transparent 4%, black 8%, black 92%, transparent 96%)",
            }}
          />

          {/* Road element */}
          <div className="absolute left-[11%] top-[52%] h-[28%] w-[78%] rounded-sm" style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
          }} />

          {/* BBox Morph Layer */}
          <AnimatePresence mode="popLayout">
            {visibleBoxes.map((box) => (
              <MorphingBBox
                key={box.id}
                box={box}
                imageWidth={IMAGE_WIDTH}
                imageHeight={IMAGE_HEIGHT}
                reducedMotion={Boolean(shouldReduceMotion)}
              />
            ))}
          </AnimatePresence>

          {/* Scanline */}
          {isPlaying && !shouldReduceMotion && <div className="scanline" />}
        </div>

        {/* Frame indicator badge */}
        <div
          className="absolute left-4 top-3 rounded-md px-2.5 py-1.5 font-mono text-[11px] text-neutral-500"
          style={{
            background: "rgba(14,18,17,0.72)",
            backdropFilter: "blur(8px)",
          }}
        >
          {currentFrame.name}
        </div>

        {/* Y-offset indicator for demo */}
        {currentFrame.yOffset > 0 && (
          <div
            className="absolute right-4 top-3 rounded-md px-2.5 py-1.5 font-mono text-[11px] text-signal-300"
            style={{
              background: "rgba(14,18,17,0.72)",
              backdropFilter: "blur(8px)",
            }}
          >
            +{currentFrame.yOffset}px
          </div>
        )}
      </div>

      {/* Playback Controls Bar */}
      <div
        className="divider flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        style={{
          background: "rgba(14,18,17,0.84)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Left: step controls + play */}
        <div className="flex items-center gap-1">
          <ControlButton
            icon={SkipBack}
            label="Step backward"
            onClick={handleStepBackward}
            disabled={currentFrameIndex === 0}
          />
          <PlayPauseButton isPlaying={isPlaying} onClick={handleTogglePlay} />
          <ControlButton
            icon={SkipForward}
            label="Step forward"
            onClick={handleStepForward}
            disabled={currentFrameIndex === totalFrames - 1}
          />
        </div>

        {/* Center: speed selector */}
        <div className="flex items-center gap-1 rounded-md px-1 py-1" style={{
          background: "rgba(255,255,255,0.06)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}>
          {speeds.map((speed) => (
            <button
              key={speed}
              type="button"
              aria-pressed={playbackSpeed === speed}
              onClick={() => setPlaybackSpeed(speed)}
            className={[
              "inline-flex h-7 min-w-[44px] items-center justify-center rounded px-2 font-mono text-[11px] font-medium transition-colors duration-160 active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
              playbackSpeed === speed
                ? "bg-[rgba(106,217,161,0.10)] text-signal-300 shadow-[inset_0_0_0_1px_rgba(106,217,161,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
                : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]",
            ].join(" ")}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Right: overlay mode toggle */}
        <div className="flex items-center gap-1 rounded-md px-1 py-1" style={{
          background: "rgba(255,255,255,0.06)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}>
          {(["gt", "pred", "both"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={overlayMode === mode}
              onClick={() => setOverlayMode(mode)}
            className={[
              "inline-flex h-7 min-w-[44px] items-center justify-center rounded px-2 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors duration-160 active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
              overlayMode === mode
                  ? mode === "gt"
                    ? "bg-[rgba(106,217,161,0.10)] text-signal-300 shadow-[inset_0_0_0_1px_rgba(106,217,161,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : mode === "pred"
                      ? "bg-[rgba(255,183,77,0.10)] text-amber-300 shadow-[inset_0_0_0_1px_rgba(255,183,77,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "bg-[rgba(106,217,161,0.10)] text-signal-300 shadow-[inset_0_0_0_1px_rgba(106,217,161,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]",
              ].join(" ")}
            >
              {mode === "gt" ? "GT" : mode === "pred" ? "PRED" : "BOTH"}
            </button>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <div className="divider px-4 py-3">
        <div
          ref={scrubberRef}
          className="relative h-8 cursor-pointer select-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            handleScrubStart(e.clientX);
          }}
        >
          {/* Track */}
          <div
            className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full"
            style={{ background: "rgba(255,255,255,0.10)" }}
          />

          {/* Fill */}
          <motion.div
            className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full"
            style={{ background: "oklch(80% 0.13 152)" }}
            animate={{ width: `${scrubPosition * 100}%` }}
            transition={isDragging ? { duration: 0 } : MORPH_SPRING}
          />

          {/* Tick marks */}
          {frames.map((_, index) => (
            <div
              key={index}
              className="absolute top-1/2 h-2.5 w-px -translate-y-1/2"
              style={{
                left: `${(index / Math.max(totalFrames - 1, 1)) * 100}%`,
                background: index === currentFrameIndex ? "oklch(80% 0.13 152)" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}

          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full"
            style={{
              left: `${scrubPosition * 100}%`,
              background: "oklch(80% 0.13 152)",
              boxShadow: "0 0 0 3px rgba(106,217,161,0.14), 0 0 12px 2px rgba(106,217,161,0.35)",
            }}
            animate={{
              scale: isDragging ? 1.2 : 1,
            }}
            transition={isDragging ? { duration: 0 } : SCRUB_SPRING}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              handleScrubStart(e.clientX);
            }}
          />
        </div>
      </div>

      {/* Frame Strip */}
      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto px-4 py-3"
        style={{
          scrollbarColor: "oklch(62% 0.018 180 / 0.42) transparent",
          scrollbarWidth: "thin",
          maxHeight: 96,
        }}
      >
        {frames.map((frame, index) => {
          const isActive = index === currentFrameIndex;
          const boxes = buildBBoxesForFrame(groundTruth, predictions, frame);

          return (
            <button
              key={frame.id}
              data-frame-index={index}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              className={[
                "group relative shrink-0 cursor-pointer rounded-md transition-transform duration-160 active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
                isActive
                  ? "scale-[1.02] shadow-[inset_0_0_0_1.5px_rgba(106,217,161,0.45),0_0_12px_rgba(106,217,161,0.2)]"
                  : "hover:scale-[1.04] hover:brightness-110",
              ].join(" ")}
              style={{
                width: THUMBNAIL_WIDTH,
                height: THUMBNAIL_HEIGHT,
                background: getThumbnailGradient(index),
                boxShadow: isActive
                  ? undefined
                  : "inset 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              {/* Mini BBox indicators */}
              <svg
                className="absolute inset-0"
                viewBox={`0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}`}
                preserveAspectRatio="none"
              >
                {boxes.map((box) => {
                  const x = (box.geometry.x / IMAGE_WIDTH) * THUMBNAIL_WIDTH;
                  const y = (box.geometry.y / IMAGE_HEIGHT) * THUMBNAIL_HEIGHT;
                  const w = (box.geometry.width / IMAGE_WIDTH) * THUMBNAIL_WIDTH;
                  const h = (box.geometry.height / IMAGE_HEIGHT) * THUMBNAIL_HEIGHT;

                  return (
                    <rect
                      key={box.id}
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill="none"
                      stroke={box.color}
                      strokeWidth={0.8}
                      strokeDasharray={box.isGroundTruth ? "2 1" : undefined}
                      opacity={isActive ? 1 : 0.6}
                    />
                  );
                })}
              </svg>

              {/* Frame number badge */}
              <span
                className={[
                  "absolute bottom-0 left-0 right-0 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
                  isActive ? "text-signal-300" : "text-neutral-400",
                ].join(" ")}
                style={{ textAlign: "center" }}
              >
                {index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MorphingBBox({
  box,
  imageWidth,
  imageHeight,
  reducedMotion,
}: {
  box: BBoxData;
  imageWidth: number;
  imageHeight: number;
  reducedMotion: boolean;
}) {
  const left = (box.geometry.x / imageWidth) * 100;
  const top = (box.geometry.y / imageHeight) * 100;
  const width = (box.geometry.width / imageWidth) * 100;
  const height = (box.geometry.height / imageHeight) * 100;

  const borderStyle = box.isGroundTruth
    ? `1.5px dashed ${box.color}`
    : `1.5px solid ${box.color}`;

  return (
    <motion.div
      layoutId={box.id}
      className="absolute text-left outline-none"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        backgroundColor: box.isGroundTruth
          ? `${box.color}20`
          : `${box.color}20`,
        border: borderStyle,
      }}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : {
              layout: MORPH_SPRING,
              opacity: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
            }
      }
    >
      <span
        className="absolute -top-6 left-0 max-w-full truncate rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{
          backgroundColor: box.color,
          color: "#050d0c",
        }}
      >
        {box.label}
        {box.confidence != null && (
          <span className="ml-1 opacity-80">{(box.confidence * 100).toFixed(0)}%</span>
        )}
      </span>
    </motion.div>
  );
}

function PlayPauseButton({ isPlaying, onClick }: { isPlaying: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      title={isPlaying ? "Pause" : "Play"}
      aria-label={isPlaying ? "Pause" : "Play"}
      onClick={onClick}
      className={[
        "relative flex h-10 w-10 items-center justify-center rounded-md transition-all duration-160",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
        "shadow-[inset_0_0_0_1px_rgba(106,217,161,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]",
      ].join(" ")}
      style={{
        background: isPlaying
          ? "rgba(106,217,161,0.15)"
          : "rgba(106,217,161,0.12)",
      }}
      whileTap={{ scale: 0.94 }}
      animate={isPlaying ? { boxShadow: "0 0 0 3px rgba(106,217,161,0.18), 0 0 14px rgba(106,217,161,0.25)" } : {}}
      transition={{ duration: 0.18 }}
    >
      {isPlaying ? (
        <Pause size={18} weight="fill" className="text-signal-300" />
      ) : (
        <Play size={18} weight="fill" className="text-signal-300" />
      )}
    </motion.button>
  );
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: typeof SkipBack;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-160 active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
        "disabled:cursor-not-allowed disabled:opacity-40",
        disabled
          ? "text-neutral-600"
          : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.05]",
      ].join(" ")}
    >
      <Icon size={17} />
    </button>
  );
}

function getThumbnailGradient(frameIndex: number): string {
  const hues = [152, 190, 88];
  const hue = hues[frameIndex % hues.length];
  return `linear-gradient(135deg, oklch(80% 0.13 ${hue} / 0.12), oklch(78% 0.12 ${hue + 30} / 0.07)), oklch(94% 0.006 180 / 0.025)`;
}
