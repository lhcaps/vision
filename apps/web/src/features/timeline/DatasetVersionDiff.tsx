import {
  PlusIcon as Plus,
  MinusIcon as Minus,
  ArrowsLeftRightIcon as ArrowsLeftRight,
  CheckCircleIcon as CheckCircle,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import type { AnnotationSummary } from "@visionflow/contracts";
import { demoSnapshot } from "../../data/demo";
import { motionTokens } from "@visionflow/motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type DatasetVersionDiffProps = {
  className?: string;
};

type DiffType = "added" | "removed" | "changed";

interface VersionOption {
  id: string;
  label: string;
  status: "DRAFT" | "LOCKED";
  annotationCount: number;
}

interface DiffBox {
  id: string;
  geometry: { x: number; y: number; width: number; height: number };
  label: string;
  color: string;
  labelClassId: string;
  assetId: string;
  diffType: DiffType;
  oldGeometry?: { x: number; y: number; width: number; height: number };
}

interface AssetDiffEntry {
  assetId: string;
  assetName: string;
  diffTypes: DiffType[];
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_VERSIONS: VersionOption[] = [
  {
    id: "v3",
    label: "v3",
    status: "DRAFT",
    annotationCount: 3,
  },
  {
    id: "v2",
    label: "v2",
    status: "LOCKED",
    annotationCount: 2,
  },
  {
    id: "v1",
    label: "v1",
    status: "LOCKED",
    annotationCount: 1,
  },
];

// v3 (DRAFT): all 3 annotations from demo.ts (ann_01, ann_02, ann_03)
const V3_ANNOTATIONS: AnnotationSummary[] = [
  {
    id: "ann_01",
    annotationSetId: "annset_v3",
    assetId: "asset_frame_1482",
    labelClassId: "label_proj_parking_lot_car",
    label: "car",
    color: "#6ad9a1",
    type: "BBOX",
    geometry: { x: 318, y: 284, width: 344, height: 188 },
    source: "MANUAL",
    confidence: null,
    createdAt: "2026-04-28T12:52:00.000Z",
    updatedAt: "2026-04-28T12:52:00.000Z",
  },
  {
    id: "ann_02",
    annotationSetId: "annset_v3",
    assetId: "asset_frame_1482",
    labelClassId: "label_proj_parking_lot_van",
    label: "van",
    color: "#5cc8ff",
    type: "BBOX",
    geometry: { x: 1014, y: 352, width: 278, height: 162 },
    source: "MANUAL",
    confidence: null,
    createdAt: "2026-04-28T12:53:00.000Z",
    updatedAt: "2026-04-28T12:53:00.000Z",
  },
  {
    id: "ann_03",
    annotationSetId: "annset_v3",
    assetId: "asset_frame_1482",
    labelClassId: "label_proj_parking_lot_truck",
    label: "truck",
    color: "#f5b85d",
    type: "BBOX",
    geometry: { x: 1396, y: 298, width: 260, height: 216 },
    source: "MANUAL",
    confidence: null,
    createdAt: "2026-04-28T12:54:00.000Z",
    updatedAt: "2026-04-28T12:54:00.000Z",
  },
];

// v2 (LOCKED): 2 annotations — ann_01 at different position, no ann_02, no ann_03
const V2_ANNOTATIONS: AnnotationSummary[] = [
  {
    id: "ann_01",
    annotationSetId: "annset_v2",
    assetId: "asset_frame_1482",
    labelClassId: "label_proj_parking_lot_car",
    label: "car",
    color: "#6ad9a1",
    type: "BBOX",
    geometry: { x: 308, y: 274, width: 354, height: 198 }, // Slightly different position
    source: "MANUAL",
    confidence: null,
    createdAt: "2026-04-28T12:45:00.000Z",
    updatedAt: "2026-04-28T12:45:00.000Z",
  },
  {
    id: "ann_02",
    annotationSetId: "annset_v2",
    assetId: "asset_frame_1482",
    labelClassId: "label_proj_parking_lot_van",
    label: "van",
    color: "#5cc8ff",
    type: "BBOX",
    geometry: { x: 1024, y: 342, width: 268, height: 172 }, // Different geometry
    source: "MANUAL",
    confidence: null,
    createdAt: "2026-04-28T12:46:00.000Z",
    updatedAt: "2026-04-28T12:46:00.000Z",
  },
];

// v1 (LOCKED): 1 annotation (ann_01 only)
const V1_ANNOTATIONS: AnnotationSummary[] = [
  {
    id: "ann_01",
    annotationSetId: "annset_v1",
    assetId: "asset_frame_1482",
    labelClassId: "label_proj_parking_lot_car",
    label: "car",
    color: "#6ad9a1",
    type: "BBOX",
    geometry: { x: 320, y: 290, width: 340, height: 180 },
    source: "MANUAL",
    confidence: null,
    createdAt: "2026-04-28T12:40:00.000Z",
    updatedAt: "2026-04-28T12:40:00.000Z",
  },
];

const VERSION_ANNOTATIONS: Record<string, AnnotationSummary[]> = {
  v3: V3_ANNOTATIONS,
  v2: V2_ANNOTATIONS,
  v1: V1_ANNOTATIONS,
};

// ─── IoU Computation ──────────────────────────────────────────────────────────

function computeIoU(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 <= x1 || y2 <= y1) {
    return 0;
  }

  const intersection = (x2 - x1) * (y2 - y1);
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

const IOU_THRESHOLD = 0.3;

// ─── Diff Computation ──────────────────────────────────────────────────────────

function computeDiff(
  versionA: AnnotationSummary[],
  versionB: AnnotationSummary[],
): { diffBoxes: DiffBox[]; added: number; removed: number; changed: number; assetDiffs: AssetDiffEntry[] } {
  const diffBoxes: DiffBox[] = [];
  const matchedB = new Set<string>();

  // Find changed and removed
  for (const annA of versionA) {
    const matchB = versionB.find(
      (b) =>
        b.labelClassId === annA.labelClassId &&
        b.assetId === annA.assetId,
    );

    if (!matchB) {
      // Removed: in A but not in B
      diffBoxes.push({
        id: annA.id,
        geometry: annA.geometry,
        label: annA.label,
        color: annA.color,
        labelClassId: annA.labelClassId,
        assetId: annA.assetId,
        diffType: "removed",
      });
    } else {
      matchedB.add(matchB.id);
      const iou = computeIoU(annA.geometry, matchB.geometry);

      if (iou < IOU_THRESHOLD) {
        // Changed: same labelClassId but different geometry
        diffBoxes.push({
          id: annA.id,
          geometry: matchB.geometry,
          label: annA.label,
          color: annA.color,
          labelClassId: annA.labelClassId,
          assetId: annA.assetId,
          diffType: "changed",
          oldGeometry: annA.geometry,
        });
      }
    }
  }

  // Find added
  for (const annB of versionB) {
    if (!matchedB.has(annB.id)) {
      // Added: in B but not matched in A
      diffBoxes.push({
        id: annB.id,
        geometry: annB.geometry,
        label: annB.label,
        color: annB.color,
        labelClassId: annB.labelClassId,
        assetId: annB.assetId,
        diffType: "added",
      });
    }
  }

  const added = diffBoxes.filter((b) => b.diffType === "added").length;
  const removed = diffBoxes.filter((b) => b.diffType === "removed").length;
  const changed = diffBoxes.filter((b) => b.diffType === "changed").length;

  // Build asset-level diff
  const assetMap = new Map<string, AssetDiffEntry>();

  for (const box of diffBoxes) {
    const existing = assetMap.get(box.assetId);
    const assetName =
      demoSnapshot.media.find((m) => m.id === box.assetId)?.name ?? box.assetId;

    if (existing) {
      if (!existing.diffTypes.includes(box.diffType)) {
        existing.diffTypes.push(box.diffType);
      }
    } else {
      assetMap.set(box.assetId, {
        assetId: box.assetId,
        assetName,
        diffTypes: [box.diffType],
      });
    }
  }

  const assetDiffs = Array.from(assetMap.values());

  return { diffBoxes, added, removed, changed, assetDiffs };
}

// ─── Diff Badge Component ─────────────────────────────────────────────────────

function DiffBadge({ type, count }: { type: DiffType; count: number }) {
  if (count === 0) return null;

  const config = {
    added: {
      label: `+${count} added`,
      bg: "bg-[oklch(0.8_0.13_152/0.10)]",
      text: "text-[oklch(0.8_0.13_152)]",
      border: "border-[oklch(0.8_0.13_152/0.20)]",
      icon: Plus,
    },
    removed: {
      label: `-${count} removed`,
      bg: "bg-[oklch(0.76_0.14_25/0.10)]",
      text: "text-[oklch(0.76_0.14_25)]",
      border: "border-[oklch(0.76_0.14_25/0.20)]",
      icon: Minus,
    },
    changed: {
      label: `~${count} changed`,
      bg: "bg-[oklch(0.82_0.13_88/0.10)]",
      text: "text-[oklch(0.82_0.13_88)]",
      border: "border-[oklch(0.82_0.13_88/0.20)]",
      icon: ArrowsLeftRight,
    },
  };

  const { label, bg, text, border, icon: Icon } = config[type];

  return (
    <motion.span
      className={[
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs",
        bg,
        text,
        border,
      ].join(" ")}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={motionTokens.springSoft}
    >
      <Icon size={13} weight="bold" />
      {label}
    </motion.span>
  );
}

// ─── Version Pill Component ───────────────────────────────────────────────────

function VersionPill({
  version,
  isActive,
  onClick,
}: {
  version: VersionOption;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs transition-colors duration-160",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300",
        "active:scale-[0.97]",
        isActive
          ? version.status === "DRAFT"
            ? "bg-[oklch(0.82_0.13_88/0.12)] text-[oklch(0.82_0.13_88)] shadow-[inset_0_0_0_1px_oklch(0.82_0.13_88/0.28),inset_0_1px_0_oklch(0.98_0.006_180/0.06)]"
            : "bg-[oklch(0.8_0.13_152/0.12)] text-[oklch(0.8_0.13_152)] shadow-[inset_0_0_0_1px_oklch(0.8_0.13_152/0.28),inset_0_1px_0_oklch(0.98_0.006_180/0.06)]"
          : "inner-border-subtle bg-white/[0.04] text-neutral-300 hover:bg-white/[0.07]",
      ].join(" ")}
    >
      <span>{version.label}</span>
      <span
        className={[
          "rounded-sm px-1 py-0.5 text-[10px] uppercase tracking-wider",
          version.status === "DRAFT"
            ? "bg-[oklch(0.82_0.13_88/0.15)] text-[oklch(0.82_0.13_88)]"
            : "bg-white/[0.08] text-neutral-400",
        ].join(" ")}
      >
        {version.status}
      </span>
    </button>
  );
}

// ─── Ghost Outline Component ─────────────────────────────────────────────────

function GhostOutline({
  geometry,
  color,
  imageWidth,
  imageHeight,
}: {
  geometry: { x: number; y: number; width: number; height: number };
  color: string;
  imageWidth: number;
  imageHeight: number;
}) {
  const style = {
    left: `${(geometry.x / imageWidth) * 100}%`,
    top: `${(geometry.y / imageHeight) * 100}%`,
    width: `${(geometry.width / imageWidth) * 100}%`,
    height: `${(geometry.height / imageHeight) * 100}%`,
    border: `1.5px dashed ${color}`,
    backgroundColor: "transparent",
    opacity: 0.35,
  };

  return <div className="pointer-events-none absolute rounded-sm" style={style} />;
}

// ─── Connector Line Component ────────────────────────────────────────────────

function ConnectorLine({
  from,
  to,
  color,
  imageWidth,
  imageHeight,
}: {
  from: { x: number; y: number; width: number; height: number };
  to: { x: number; y: number; width: number; height: number };
  color: string;
  imageWidth: number;
  imageHeight: number;
}) {
  const x1 = ((from.x + from.width / 2) / imageWidth) * 100;
  const y1 = ((from.y + from.height / 2) / imageHeight) * 100;
  const x2 = ((to.x + to.width / 2) / imageWidth) * 100;
  const y2 = ((to.y + to.height / 2) / imageHeight) * 100;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ overflow: "visible" }}
    >
      <line
        x1={`${x1}%`}
        y1={`${y1}%`}
        x2={`${x2}%`}
        y2={`${y2}%`}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="4 4"
        opacity={0.5}
      />
    </svg>
  );
}

// ─── Diff Box Component ───────────────────────────────────────────────────────

function DiffBoxOverlay({
  box,
  imageWidth,
  imageHeight,
  reducedMotion,
}: {
  box: DiffBox;
  imageWidth: number;
  imageHeight: number;
  reducedMotion: boolean;
}) {
  const style = {
    left: `${(box.geometry.x / imageWidth) * 100}%`,
    top: `${(box.geometry.y / imageHeight) * 100}%`,
    width: `${(box.geometry.width / imageWidth) * 100}%`,
    height: `${(box.geometry.height / imageHeight) * 100}%`,
  };

  const config = {
    added: {
      border: "1.5px solid oklch(80% 0.13 152)",
      background: "rgba(106,217,161,0.15)",
      labelBg: "oklch(80% 0.13 152)",
      textDecoration: "none",
    },
    removed: {
      border: "1.5px solid oklch(76% 0.14 25)",
      background: "rgba(239,68,68,0.15)",
      labelBg: "oklch(76% 0.14 25)",
      textDecoration: "line-through",
    },
    changed: {
      border: "1.5px solid oklch(82% 0.13 88)",
      background: "rgba(255,183,77,0.15)",
      labelBg: "oklch(82% 0.13 88)",
      textDecoration: "none",
    },
  };

  const { border, background, labelBg, textDecoration } = config[box.diffType];

  return (
    <motion.div
      key={box.id}
      className="absolute rounded-sm"
      style={{
        ...style,
        border,
        backgroundColor: background,
      }}
      initial={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.94 }
      }
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : box.diffType === "changed"
            ? { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            : motionTokens.springSoft
      }
    >
      {/* Ghost outline for changed boxes */}
      {box.diffType === "changed" && box.oldGeometry && (
        <>
          <GhostOutline
            geometry={box.oldGeometry}
            color="oklch(82% 0.13 88)"
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
          <ConnectorLine
            from={box.oldGeometry}
            to={box.geometry}
            color="oklch(82% 0.13 88)"
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        </>
      )}

      {/* Label */}
      <span
        className="absolute -top-6 left-0 rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-950"
        style={{
          backgroundColor: labelBg,
          textDecoration,
        }}
      >
        {box.label}
      </span>
    </motion.div>
  );
}

// ─── Diff Canvas Component ───────────────────────────────────────────────────

function DiffCanvas({
  diffBoxes,
  assetId,
  imageWidth,
  imageHeight,
}: {
  diffBoxes: DiffBox[];
  assetId?: string;
  imageWidth?: number;
  imageHeight?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const canvasAssetId = assetId ?? "asset_frame_1482";
  const canvasImageWidth = imageWidth ?? 1920;
  const canvasImageHeight = imageHeight ?? 1080;

  const visibleBoxes = diffBoxes.filter((box) => box.assetId === canvasAssetId);
  const reducedMotion = Boolean(shouldReduceMotion);

  return (
    <div
      className="relative overflow-hidden bg-graphite-950"
      style={{ minHeight: 420 }}
    >
      {/* Radial gradient base — green accent */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 28% 22%,rgba(106,217,161,0.07),transparent 32%)",
        }}
      />

      {/* Atmospheric edge fade */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top,rgba(5,13,12,0.88),transparent 30%),linear-gradient(to bottom,transparent 0%,rgba(5,13,12,0.4) 12%),linear-gradient(to left,rgba(5,13,12,0.88),transparent 18%),linear-gradient(to right,rgba(5,13,12,0.88),transparent 18%)",
        }}
      />

      {/* Frame area */}
      <div
        className="absolute left-[8%] top-[14%] h-[72%] w-[84%]"
        style={{
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.4)",
        }}
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

        {/* Diff boxes */}
        {visibleBoxes.map((box) => (
          <DiffBoxOverlay
            key={box.id}
            box={box}
            imageWidth={canvasImageWidth}
            imageHeight={canvasImageHeight}
            reducedMotion={reducedMotion}
          />
        ))}

        {/* Scanline */}
        {visibleBoxes.length > 0 && !shouldReduceMotion && (
          <div className="scanline pointer-events-none" />
        )}
      </div>

      {/* Frame indicator */}
      <div
        className="absolute left-4 top-3 rounded-md px-2.5 py-1.5 font-mono text-[11px] text-neutral-500"
        style={{
          background: "rgba(14,18,17,0.72)",
          backdropFilter: "blur(8px)",
        }}
      >
        {canvasAssetId} / {canvasImageWidth} x {canvasImageHeight}
      </div>

      {/* Diff type legend */}
      <div
        className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-end gap-3 rounded-md px-3 py-2"
        style={{
          background: "rgba(14,18,17,0.84)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ border: "1.5px solid oklch(80% 0.13 152)" }}
          />
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
            Added
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ border: "1.5px solid oklch(76% 0.14 25)" }}
          />
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
            Removed
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ border: "1.5px solid oklch(82% 0.13 88)" }}
          />
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
            Changed
          </span>
        </span>
      </div>
    </div>
  );
}

// ─── Asset Diff Row Component ────────────────────────────────────────────────

function AssetDiffRow({
  asset,
  index,
}: {
  asset: AssetDiffEntry;
  index: number;
}) {
  const typeConfig = {
    added: {
      bg: "bg-[oklch(0.8_0.13_152/0.10)]",
      text: "text-[oklch(0.8_0.13_152)]",
      border: "border-[oklch(0.8_0.13_152/0.25)]",
    },
    removed: {
      bg: "bg-[oklch(0.76_0.14_25/0.10)]",
      text: "text-[oklch(0.76_0.14_25)]",
      border: "border-[oklch(0.76_0.14_25/0.25)]",
    },
    changed: {
      bg: "bg-[oklch(0.82_0.13_88/0.10)]",
      text: "text-[oklch(0.82_0.13_88)]",
      border: "border-[oklch(0.82_0.13_88/0.25)]",
    },
  };

  return (
    <motion.div
      className="flex items-center justify-between gap-3 rounded-md px-4 py-3 transition-colors hover:bg-white/[0.03]"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        {/* Thumbnail placeholder */}
        <div
          className="h-10 w-14 rounded-md"
          style={{
            background:
              "linear-gradient(135deg, rgba(106,217,161,0.08), rgba(92,200,255,0.05)), rgba(255,255,255,0.02)",
          }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-100">
            {asset.assetName}
          </p>
          <p className="font-mono text-[11px] text-neutral-500">{asset.assetId}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {asset.diffTypes.map((type) => {
          const { bg, text, border } = typeConfig[type];
          return (
            <span
              key={type}
              className={[
                "rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                bg,
                text,
                border,
              ].join(" ")}
            >
              {type}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DatasetVersionDiff({ className = "" }: DatasetVersionDiffProps) {
  const shouldReduceMotion = useReducedMotion();
  const [compareVersionId, setCompareVersionId] = useState("v3");
  const [againstVersionId, setAgainstVersionId] = useState("v2");

  const compareVersion = DEMO_VERSIONS.find((v) => v.id === compareVersionId) ?? DEMO_VERSIONS[0];
  const againstVersion = DEMO_VERSIONS.find((v) => v.id === againstVersionId) ?? DEMO_VERSIONS[1];

  const { diffBoxes, added, removed, changed, assetDiffs } = useMemo(() => {
    const versionA = VERSION_ANNOTATIONS[compareVersionId] ?? [];
    const versionB = VERSION_ANNOTATIONS[againstVersionId] ?? [];
    return computeDiff(versionA, versionB);
  }, [compareVersionId, againstVersionId]);

  const hasDifferences = added > 0 || removed > 0 || changed > 0;

  return (
    <div className={["min-w-0", className].join(" ")}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">Dataset version diff</h2>
          <p className="mt-1 font-mono text-xs text-neutral-500">
            Compare annotation changes between versions
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-md px-3 py-2"
          style={{
            background: "rgba(106,217,161,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(106,217,161,0.14)",
          }}
        >
          <ArrowsLeftRight size={16} className="text-[oklch(80%_0.13_152)]" weight="duotone" />
          <span className="font-mono text-xs text-[oklch(80%_0.13_152)]">
            Version comparison mode
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main diff panel */}
        <div className="overflow-hidden rounded-md inner-border-subtle bg-graphite-900/75 shadow-panel">
          {/* Version selector bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
            style={{ borderBottom: "1px solid oklch(94% 0.006 180 / 0.08)" }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                Compare
              </span>
              <div className="flex flex-wrap gap-2">
                {DEMO_VERSIONS.map((version) => (
                  <VersionPill
                    key={version.id}
                    version={version}
                    isActive={compareVersionId === version.id}
                    onClick={() => setCompareVersionId(version.id)}
                  />
                ))}
              </div>
            </div>

            <div
              className="flex items-center gap-2 text-neutral-400"
              style={{ color: "oklch(72% 0.006 180)" }}
            >
              <span className="font-mono text-xs">vs</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                Against
              </span>
              <div className="flex flex-wrap gap-2">
                {DEMO_VERSIONS.map((version) => (
                  <VersionPill
                    key={version.id}
                    version={version}
                    isActive={againstVersionId === version.id}
                    onClick={() => setAgainstVersionId(version.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div
            className="flex flex-wrap items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid oklch(94% 0.006 180 / 0.06)" }}
          >
            {shouldReduceMotion ? (
              <>
                <DiffBadge type="added" count={added} />
                <DiffBadge type="removed" count={removed} />
                <DiffBadge type="changed" count={changed} />
              </>
            ) : (
              <>
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0, ...motionTokens.springSoft }}
                >
                  <DiffBadge type="added" count={added} />
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, ...motionTokens.springSoft }}
                >
                  <DiffBadge type="removed" count={removed} />
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, ...motionTokens.springSoft }}
                >
                  <DiffBadge type="changed" count={changed} />
                </motion.span>
              </>
            )}

            {hasDifferences && (
              <span className="ml-auto font-mono text-[11px] text-neutral-500">
                {compareVersion.label} → {againstVersion.label}
              </span>
            )}
          </div>

          {/* Diff canvas */}
          <div className="p-4">
            {hasDifferences ? (
              <DiffCanvas diffBoxes={diffBoxes} />
            ) : (
              <div
                className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-md"
                style={{
                  background: "rgba(106,217,161,0.04)",
                  boxShadow: "inset 0 0 0 1px rgba(106,217,161,0.10)",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(106,217,161,0.10)",
                    boxShadow: "inset 0 0 0 1px rgba(106,217,161,0.18)",
                  }}
                >
                  <ArrowsLeftRight size={22} className="text-[oklch(80%_0.13_152)]" weight="duotone" />
                </div>
                <p className="text-sm font-medium text-neutral-100">No differences found</p>
                <p className="font-mono text-xs text-neutral-500">
                  {compareVersion.label} and {againstVersion.label} are identical
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Asset diff list panel */}
        <div className="overflow-hidden rounded-md inner-border-subtle bg-graphite-900/75 shadow-panel">
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid oklch(94% 0.006 180 / 0.08)" }}
          >
            <h3 className="text-sm font-semibold text-neutral-100">Asset diffs</h3>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              {assetDiffs.length} asset{assetDiffs.length === 1 ? "" : "s"} with changes
            </p>
          </div>

          <div
            className="divide-y"
            style={{ borderTop: "1px solid oklch(94% 0.006 180 / 0.06)" }}
          >
            {assetDiffs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
                <CheckCircle size={24} className="text-[oklch(80%_0.13_152)]" weight="duotone" />
                <p className="text-sm text-neutral-400">All assets match</p>
              </div>
            ) : (
              assetDiffs.map((asset, index) => (
                <AssetDiffRow key={asset.assetId} asset={asset} index={index} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export for use in other components
export type { DiffBox, DiffType, VersionOption, AssetDiffEntry };
