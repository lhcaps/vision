import {
  ActivityIcon as Activity,
  CheckCircleIcon as CheckCircle,
  StackIcon as Stack,
  WarningCircleIcon as WarningCircle,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { PlayIcon as Play } from '@phosphor-icons/react';
import { demoSnapshot } from '../data/demo';
import { Panel } from './ui/Panel';
import { VisionPreview } from './ui/VisionPreview';
import { OverviewStateRow } from './ui/OverviewStateRow';

interface OverviewPanelProps {
  onRun: () => void;
  inferenceEligibility: { ok: boolean; reason: string | null };
}

export function OverviewPanel({ onRun, inferenceEligibility }: OverviewPanelProps) {
  const canRun = inferenceEligibility.ok;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
      <Panel className="overflow-hidden">
        <div className="divider px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                Active project
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-100">
                {demoSnapshot.project.name}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                title={
                  !canRun && inferenceEligibility.reason
                    ? inferenceEligibility.reason
                    : 'Queue inference job'
                }
                aria-label="Queue inference job"
                onClick={onRun}
                disabled={!canRun}
                className="btn-signal-outline inline-flex items-center gap-2 px-3 py-2 text-sm font-medium active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play size={16} weight="fill" />
                Queue job
              </button>
              {!canRun && inferenceEligibility.reason && (
                <p className="max-w-[28ch] text-right font-mono text-[10px] text-amber-300">
                  {inferenceEligibility.reason}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="grid min-h-[480px] gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="divider p-4 lg:border-b-0 lg:border-r">
            <VisionPreview />
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Vertical slice</h3>
            <div className="mt-4 space-y-3">
              {[
                ['Upload', '20 assets indexed, checksum dedupe pending'],
                ['Version', 'Dataset v1.3 locked with train/valid/test splits'],
                ['Annotate', '3 visible boxes, image-coordinate storage'],
                ['Pipeline', 'Open Pipeline to inspect graph validation'],
                ['Inference', 'Mock detector path ready for async orchestration'],
                ['Evaluate', 'Precision, recall, F1 surface seeded'],
              ].map(([label, value], index) => (
                <motion.div
                  key={label}
                  className="inner-border-subtle grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3 rounded-md bg-white/[0.03] p-3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.035, duration: 0.2 }}
                >
                  <span className="font-mono text-xs text-scan-300">{label}</span>
                  <span className="text-sm text-neutral-300">{value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="divider px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">System states</h2>
        </div>
        <div className="divide-y divide-graphite-200">
          <OverviewStateRow
            label="Loading"
            value="Skeleton rows match table density"
            tone="scan"
            icon={Activity}
          />
          <OverviewStateRow
            label="Empty"
            value="Dataset and media surfaces reserve first-run states"
            tone="neutral"
            icon={Stack}
          />
          <OverviewStateRow
            label="Error"
            value="Pipeline and job failures surface actionable messages"
            tone="amber"
            icon={WarningCircle}
          />
          <OverviewStateRow
            label="Reduced motion"
            value="Scan and flow effects collapse to static state color"
            tone="signal"
            icon={CheckCircle}
          />
        </div>
      </Panel>
    </div>
  );
}
