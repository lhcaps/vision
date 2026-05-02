import type { ReactNode } from 'react';

interface ErrorStateProps {
  /** What went wrong */
  title: string;
  /** Human-readable explanation */
  message: string;
  /** Optional recovery action */
  action?: ReactNode;
  className?: string;
}

export function ErrorState({ title, message, action, className = '' }: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-start gap-4 rounded-md p-4 ${className}`}
      style={{
        background: 'oklch(76% 0.14 25 / 0.07)',
        boxShadow: 'inset 0 0 0 1px oklch(76% 0.14 25 / 0.18)',
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-red-300">{title}</p>
        <p className="text-sm text-red-200/80">{message}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/** Error state for failed inference jobs with recovery path */
export function FailedJobErrorState({
  reason,
  onRetry,
  onOpenVersions,
}: {
  reason: string;
  onRetry: () => void;
  onOpenVersions: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-md p-4"
      style={{
        background: 'oklch(76% 0.14 25 / 0.07)',
        boxShadow: 'inset 0 0 0 1px oklch(76% 0.14 25 / 0.18)',
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-300" />
          <p className="text-sm font-semibold text-red-300">Job failed</p>
        </div>
        <p className="text-sm text-red-200/80">{reason}</p>
      </div>

      <div
        className="flex flex-col gap-2 rounded-md p-3"
        style={{ background: 'oklch(13.5% 0.008 180 / 0.4)' }}
      >
        <p className="text-xs font-semibold text-neutral-300">Recovery path:</p>
        <ol className="flex list-inside list-decimal flex-col gap-1 text-xs text-neutral-400">
          <li>Open Versions and inspect your dataset.</li>
          <li>Add at least one asset to a draft version.</li>
          <li>Lock the dataset version.</li>
          <li>Run inference again.</li>
        </ol>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpenVersions}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition active:translate-y-px"
          style={{
            background: 'oklch(94% 0.006 180 / 0.04)',
            color: 'oklch(82% 0.006 180)',
            boxShadow: 'inset 0 0 0 1px oklch(94% 0.006 180 / 0.1)',
          }}
        >
          Open Versions
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-200 transition active:translate-y-px"
          style={{
            background: 'oklch(76% 0.14 25 / 0.14)',
            boxShadow: 'inset 0 0 0 1px oklch(76% 0.14 25 / 0.22)',
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
