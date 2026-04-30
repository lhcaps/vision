import { CaretDownIcon as ChevronDown, PlayIcon as Play, ArrowCounterClockwiseIcon as RotateCcw } from "@phosphor-icons/react";
import { useReducer } from "react";
import { motion } from "motion/react";
import type { EvaluationReport, PerClassMetric } from "@visionflow/contracts";

interface EvaluationMetricsPanelProps {
  report: EvaluationReport | null;
  isLoading: boolean;
  error: string | null;
  onRunEvaluation: () => void;
  isEvaluating: boolean;
  className?: string;
}

type MetricTone = "signal" | "amber" | "red";

function metricTone(value: number): MetricTone {
  if (value >= 0.8) return "signal";
  if (value >= 0.5) return "amber";
  return "red";
}

function metricColorClass(tone: MetricTone): string {
  if (tone === "signal") return "text-signal-300";
  if (tone === "amber") return "text-amber-300";
  return "text-red-300";
}

function MetricCard({
  label,
  value,
  unit = "",
  precision = 3,
}: {
  label: string;
  value: number;
  unit?: string;
  precision?: number;
}) {
  const tone = metricTone(value);

  return (
    <div
      className="rounded-md p-3"
      style={{ background: "oklch(94% 0.006 180 / 0.03)" }}
    >
      <p
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500"
        style={{}}
      >
        {label}
      </p>
      <p className={["mt-2 font-mono text-2xl font-semibold", metricColorClass(tone)].join(" ")}>
        {value.toFixed(precision)}
        {unit && <span className="ml-0.5 text-sm opacity-60">{unit}</span>}
      </p>
    </div>
  );
}

function CountTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "signal" | "amber" | "red";
}) {
  const colorClass =
    tone === "signal"
      ? "text-signal-300"
      : tone === "amber"
        ? "text-amber-300"
        : "text-red-300";

  const bgClass =
    tone === "signal"
      ? "bg-[rgba(106,217,161,0.08)]"
      : tone === "amber"
        ? "bg-[rgba(255,183,77,0.08)]"
        : "bg-[rgba(239,68,68,0.08)]";

  return (
    <div
      className={["flex flex-col items-center gap-1 rounded-md p-2.5", bgClass].join(" ")}
    >
      <p className={["font-mono text-lg font-semibold tabular-nums", colorClass].join(" ")}>
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
    </div>
  );
}

function SkeletonCard({ lines = 1 }: { lines?: number }) {
  return (
    <div className="space-y-2 rounded-md p-3" style={{ background: "oklch(94% 0.006 180 / 0.03)" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded-sm"
          style={{
            width: i === 0 ? "60%" : i === lines - 1 ? "40%" : "80%",
            background: "oklch(94% 0.006 180 / 0.06)",
          }}
        />
      ))}
    </div>
  );
}

function PerClassTable({
  metrics,
  expanded,
  onToggle,
}: {
  metrics: PerClassMetric[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (metrics.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]"
      >
        <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
          Per-class breakdown
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-neutral-500">{metrics.length} class</span>
          <ChevronDown
            size={14}
            className={[
              "text-neutral-500 transition-transform duration-200",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <table className="w-full">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  Class
                </th>
                {["P", "R", "F1", "n"].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-neutral-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const pTone = metricTone(m.precision);
                const rTone = metricTone(m.recall);
                const f1Tone = metricTone(m.f1);

                return (
                  <tr
                    key={m.label}
                    className="border-b transition-colors duration-100 hover:bg-white/[0.025]"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-neutral-200">{m.label}</span>
                    </td>
                    <td className={["px-2 py-2.5 text-right font-mono text-xs tabular-nums", metricColorClass(pTone)].join(" ")}>
                      {m.precision.toFixed(2)}
                    </td>
                    <td className={["px-2 py-2.5 text-right font-mono text-xs tabular-nums", metricColorClass(rTone)].join(" ")}>
                      {m.recall.toFixed(2)}
                    </td>
                    <td className={["px-2 py-2.5 text-right font-mono text-xs tabular-nums", metricColorClass(f1Tone)].join(" ")}>
                      {m.f1.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-neutral-500 tabular-nums">
                      {m.count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function EvaluationMetricsPanel({
  report,
  isLoading,
  error,
  onRunEvaluation,
  isEvaluating,
  className = "",
}: EvaluationMetricsPanelProps) {
  const [perClassExpanded, togglePerClass] = useReducer((v) => !v, false);

  if (isEvaluating || isLoading) {
    return (
      <div className={["space-y-3", className].join(" ")}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <div className="grid grid-cols-3 gap-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div
          className="rounded-md p-4"
          style={{
            background: "rgba(239,68,68,0.07)",
            boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.18)",
          }}
        >
          <p className="font-mono text-sm text-red-300">{error}</p>
        </div>
        <button
          type="button"
          onClick={onRunEvaluation}
          className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 font-medium transition-all duration-160 active:translate-y-px"
          style={{
            background: "oklch(94% 0.006 180 / 0.04)",
            color: "oklch(72% 0.006 180)",
            boxShadow: "inset 0 0 0 1px oklch(94% 0.006 180 / 0.1)",
          }}
        >
          <RotateCcw size={15} />
          Retry evaluation
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="font-mono text-sm text-neutral-400">
            No evaluation data available.
          </p>
          <p className="font-mono text-xs text-neutral-600">
            Run evaluation to see precision, recall, and F1 metrics.
          </p>
        </div>
        <button
          type="button"
          onClick={onRunEvaluation}
          className="flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold transition-all duration-160 active:translate-y-px"
          style={{
            background: "oklch(80% 0.13 152)",
            color: "oklch(13.5% 0.008 180)",
            boxShadow: "0 0 0 1px rgba(106,217,161,0.2),0 12px 24px -12px rgba(106,217,161,0.5)",
          }}
        >
          <Play size={15} weight="fill" />
          Run evaluation
        </button>
      </div>
    );
  }

  const tpCount = report.truePositives;
  const fpCount = report.falsePositives;
  const fnCount = report.falseNegatives;
  const totalCount = tpCount + fpCount + fnCount;

  return (
    <div className={["space-y-3", className].join(" ")}>
      {/* Primary metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard label="Precision" value={report.precision} precision={3} />
        <MetricCard label="Recall" value={report.recall} precision={3} />
        <MetricCard label="F1" value={report.f1} precision={3} />
      </div>

      {/* Mean IoU */}
      <MetricCard label="Mean IoU" value={report.meanIoU} precision={3} />

      {/* TP / FP / FN counts */}
      <div className="grid grid-cols-3 gap-2">
        <CountTile label="TP" value={tpCount} tone="signal" />
        <CountTile label="FP" value={fpCount} tone="amber" />
        <CountTile label="FN" value={fnCount} tone="red" />
      </div>

      {/* Evaluated at */}
      <div className="rounded-md px-3 py-2" style={{ background: "oklch(94% 0.006 180 / 0.025)" }}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            Evaluated
          </span>
          <span className="font-mono text-[11px] text-neutral-400">
            {new Date(report.evaluatedAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            Assets
          </span>
          <span className="font-mono text-[11px] text-neutral-400">{report.assetCount}</span>
        </div>
      </div>

      {/* Per-class table */}
      {report.perClassMetrics.length > 0 && (
        <PerClassTable
          metrics={report.perClassMetrics}
          expanded={perClassExpanded}
          onToggle={togglePerClass}
        />
      )}
    </div>
  );
}
