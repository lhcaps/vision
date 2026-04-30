import { CrosshairIcon as Crosshair, EyeIcon as Eye, LightningIcon as Lightning } from "@phosphor-icons/react";
import { useReducer, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { AnnotationSummary, PredictionSummary } from "@visionflow/contracts";

const GT_COLOR = "#6ad9a1";
const PRED_COLOR = "#ffb74d";
const IO_U_COLOR = "#6ad9a1";

type OverlayMode = "gt" | "pred" | "both";

interface BBoxOverlayProps {
  id: string;
  geometry: { x: number; y: number; width: number; height: number };
  label: string;
  confidence?: number | null;
  color: string;
  isSelected: boolean;
  isGroundTruth: boolean;
  imageWidth: number;
  imageHeight: number;
  onSelect?: (id: string) => void;
  iouFill?: boolean;
}

function BBoxOverlay({
  id,
  geometry,
  label,
  confidence,
  color,
  isSelected,
  isGroundTruth,
  imageWidth,
  imageHeight,
  onSelect,
  iouFill,
}: BBoxOverlayProps) {
  const shouldReduceMotion = useReducedMotion();

  const style = {
    left: `${(geometry.x / imageWidth) * 100}%`,
    top: `${(geometry.y / imageHeight) * 100}%`,
    width: `${(geometry.width / imageWidth) * 100}%`,
    height: `${(geometry.height / imageHeight) * 100}%`,
  };

  return (
    <motion.button
      key={id}
      type="button"
      title={`${label}${confidence != null ? ` (${(confidence * 100).toFixed(0)}%)` : ""}`}
      aria-label={`${isGroundTruth ? "GT" : "Pred"} ${label}`}
      onClick={() => onSelect?.(id)}
      className={[
        "absolute rounded-sm text-left outline-none transition-colors duration-100",
        "focus-visible:ring-2 focus-visible:ring-signal-300",
        isSelected
          ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_0_0_2px_rgba(106,217,161,0.32),0_18px_32px_-24px_rgba(106,217,161,0.55)]"
          : "",
      ].join(" ")}
      style={{
        ...style,
        backgroundColor: iouFill ? "rgba(106,217,161,0.35)" : isGroundTruth ? "rgba(106,217,161,0.12)" : "rgba(255,183,77,0.12)",
        border: isGroundTruth
          ? "1.5px dashed rgba(106,217,161,0.85)"
          : "1.5px solid rgba(255,183,77,0.85)",
        borderColor: color,
      }}
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: isSelected ? 1.02 : 1 }}
      transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className={[
          "absolute -top-6 left-0 rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
          "leading-none",
        ].join(" ")}
        style={{ backgroundColor: color }}
      >
        {label}
        {confidence != null && (
          <span className="ml-1 opacity-80">{(confidence * 100).toFixed(0)}%</span>
        )}
      </span>
    </motion.button>
  );
}

interface CanvasControlsBarProps {
  showGT: boolean;
  showPred: boolean;
  showIoU: boolean;
  hoveredCoords: string | null;
  onToggleGT: () => void;
  onTogglePred: () => void;
  onToggleIoU: () => void;
}

function CanvasControlsBar({
  showGT,
  showPred,
  showIoU,
  hoveredCoords,
  onToggleGT,
  onTogglePred,
  onToggleIoU,
}: CanvasControlsBarProps) {
  return (
    <div
      className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2"
      style={{
        background: "rgba(14,18,17,0.84)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          title="Toggle ground truth"
          aria-label="Toggle ground truth"
          aria-pressed={showGT}
          onClick={onToggleGT}
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-md transition-all duration-160 active:translate-y-px",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
            showGT
              ? "bg-[rgba(106,217,161,0.12)] text-[#6ad9a1] shadow-[inset_0_0_0_1px_rgba(106,217,161,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.05]",
          ].join(" ")}
        >
          <Eye size={15} />
        </button>

        <button
          type="button"
          title="Toggle predictions"
          aria-label="Toggle predictions"
          aria-pressed={showPred}
          onClick={onTogglePred}
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-md transition-all duration-160 active:translate-y-px",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
            showPred
              ? "bg-[rgba(255,183,77,0.12)] text-[#ffb74d] shadow-[inset_0_0_0_1px_rgba(255,183,77,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.05]",
          ].join(" ")}
        >
          <Crosshair size={15} />
        </button>

        <button
          type="button"
          title="Toggle IoU overlay"
          aria-label="Toggle IoU overlay"
          aria-pressed={showIoU}
          onClick={onToggleIoU}
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-md transition-all duration-160 active:translate-y-px",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
            showIoU
              ? "bg-[rgba(92,200,255,0.12)] text-[#5cc8ff] shadow-[inset_0_0_0_1px_rgba(92,200,255,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.05]",
          ].join(" ")}
        >
          <Lightning size={15} />
        </button>
      </div>

      {hoveredCoords && (
        <span className="font-mono text-[11px] text-neutral-400">{hoveredCoords}</span>
      )}

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ border: "1.5px dashed rgba(106,217,161,0.85)" }}
          />
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">GT</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ border: "1.5px solid rgba(255,183,77,0.85)" }}
          />
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">Pred</span>
        </span>
      </div>
    </div>
  );
}

type CanvasState =
  | { status: "loading" }
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | { status: "populated" };

interface PredictionOverlayCanvasProps {
  assetId?: string;
  assetName?: string;
  imageWidth?: number;
  imageHeight?: number;
  groundTruth: AnnotationSummary[];
  predictions: PredictionSummary[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function PredictionOverlayCanvas({
  assetId = "asset_frame_1482",
  assetName = "asset_frame_1482",
  imageWidth = 1920,
  imageHeight = 1080,
  groundTruth,
  predictions,
  isLoading,
  error,
  className = "",
}: PredictionOverlayCanvasProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedBoxId, setSelectedBoxId] = useState<string | undefined>(undefined);
  const [showGT, setShowGT] = useState(true);
  const [showPred, setShowPred] = useState(true);
  const [showIoU, setShowIoU] = useState(false);
  const [hoveredCoords, setHoveredCoords] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canvasState: CanvasState = isLoading
    ? { status: "loading" }
    : error
      ? { status: "error", message: error }
      : groundTruth.length === 0 && predictions.length === 0
        ? { status: "empty", message: "No predictions or ground truth for this asset." }
        : { status: "populated" };

  const handleToggleGT = () => setShowGT((v) => !v);
  const handleTogglePred = () => setShowPred((v) => !v);
  const handleToggleIoU = () => setShowIoU((v) => !v);

  const allBoxes = [
    ...groundTruth.map((ann) => ({
      id: ann.id,
      geometry: ann.geometry,
      label: ann.label,
      confidence: ann.confidence,
      color: ann.color,
      isGroundTruth: true,
    })),
    ...predictions.map((pred) => ({
      id: pred.id,
      geometry: pred.geometry,
      label: pred.label,
      confidence: pred.confidence,
      color: pred.color,
      isGroundTruth: false,
    })),
  ];

  return (
    <div
      ref={containerRef}
      className={["relative overflow-hidden bg-graphite-950", className].join(" ")}
      style={{ minHeight: 420 }}
      onMouseLeave={() => setHoveredCoords(null)}
    >
      {/* Radial gradient base */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 28% 22%,rgba(106,217,161,0.10),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_38%)",
        }}
      />

      {/* Atmospheric bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: "linear-gradient(to top,rgba(5,13,12,0.88),transparent)" }}
      />

      {/* Frame */}
      <div
        className="absolute left-[8%] top-[14%] h-[72%] w-[84%]"
        style={{ borderTop: "1px dashed rgba(255,255,255,0.05)" }}
      >
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, transparent, black 12%, black 80%, transparent)",
          }}
        />

        {/* Loading state */}
        {canvasState.status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-8 w-8 animate-pulse rounded-md"
                style={{ background: "rgba(106,217,161,0.15)" }}
              />
              <span className="font-mono text-xs text-neutral-500">Loading overlay...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {canvasState.status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex flex-col items-center gap-3 rounded-md p-4 text-center"
              style={{
                background: "rgba(239,68,68,0.08)",
                boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.18)",
              }}
            >
              <p className="font-mono text-sm text-red-300">{canvasState.message}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {canvasState.status === "empty" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-sm text-neutral-500">{canvasState.message}</p>
          </div>
        )}

        {/* Populated state */}
        {canvasState.status === "populated" && (
          <>
            {/* Ground-truth layer */}
            {showGT &&
              groundTruth.map((ann) => (
                <BBoxOverlay
                  key={ann.id}
                  id={ann.id}
                  geometry={ann.geometry}
                  label={ann.label}
                  confidence={ann.confidence}
                  color={ann.color || GT_COLOR}
                  isSelected={selectedBoxId === ann.id}
                  isGroundTruth={true}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  onSelect={setSelectedBoxId}
                  iouFill={showIoU}
                />
              ))}

            {/* Prediction layer */}
            {showPred &&
              predictions.map((pred) => (
                <BBoxOverlay
                  key={pred.id}
                  id={pred.id}
                  geometry={pred.geometry}
                  label={pred.label}
                  confidence={pred.confidence}
                  color={pred.color || PRED_COLOR}
                  isSelected={selectedBoxId === pred.id}
                  isGroundTruth={false}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  onSelect={setSelectedBoxId}
                />
              ))}
          </>
        )}

        {/* Scanline animation */}
        {canvasState.status === "populated" && !shouldReduceMotion && (
          <div className="scanline pointer-events-none" />
        )}
      </div>

      {/* Controls bar */}
      <CanvasControlsBar
        showGT={showGT}
        showPred={showPred}
        showIoU={showIoU}
        hoveredCoords={hoveredCoords}
        onToggleGT={handleToggleGT}
        onTogglePred={handleTogglePred}
        onToggleIoU={handleToggleIoU}
      />

      {/* Asset info */}
      <div
        className="absolute left-4 top-3 rounded-md px-2.5 py-1.5 font-mono text-[11px] text-neutral-500"
        style={{
          background: "rgba(14,18,17,0.72)",
          backdropFilter: "blur(8px)",
        }}
      >
        {assetName} / {imageWidth} x {imageHeight}
      </div>
    </div>
  );
}
