import { PlayIcon as Play } from '@phosphor-icons/react';
import { ActionHint } from '../shared/ui/ActionHint';
import { demoSnapshot } from '../data/demo';
import { StatusPill } from './StatusPill';
import { type JobUiState } from '../features/inference/inference.types';

interface ShellHeaderProps {
  job: JobUiState;
  threshold: number;
  onRun: () => void;
  inferenceEligibility: { ok: boolean; reason: string | null };
}

export function ShellHeader({ job, threshold, onRun, inferenceEligibility }: ShellHeaderProps) {
  const isRunDisabled = !inferenceEligibility.ok;

  return (
    <header className="divider bg-graphite-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
            {demoSnapshot.project.id} / {demoSnapshot.project.datasetVersion}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-neutral-100">
            VisionFlow Studio
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={job.status} />
          <span className="inner-border-subtle rounded-md bg-white/[0.04] px-3 py-2 font-mono text-xs text-neutral-300">
            threshold {(threshold / 100).toFixed(2)}
          </span>
          <button
            type="button"
            title={
              isRunDisabled && inferenceEligibility.reason
                ? inferenceEligibility.reason
                : 'Run inference'
            }
            aria-label="Run inference"
            onClick={onRun}
            disabled={
              !inferenceEligibility.ok ||
              job.source === 'loading' ||
              job.status === 'RUNNING' ||
              job.status === 'QUEUED'
            }
            className="inline-flex items-center gap-2 rounded-md bg-signal-300 px-3 py-2 text-sm font-semibold text-graphite-950 transition hover:bg-signal-400 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={16} weight="fill" />
            Run
          </button>
        </div>
      </div>
      {isRunDisabled && inferenceEligibility.reason && (
        <div className="mx-auto max-w-[1500px] px-4 pb-2">
          <ActionHint label="Run disabled" description={inferenceEligibility.reason} tone="amber" />
        </div>
      )}
    </header>
  );
}
