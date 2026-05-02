import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Centerpiece — what is missing */
  title: string;
  /** What to do to resolve */
  description: string;
  /** Optional action CTA */
  action?: ReactNode;
  /** Icon or visual element */
  visual?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  visual,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 rounded-md py-10 text-center ${className}`}
      style={{
        background: 'oklch(94% 0.006 180 / 0.018)',
        boxShadow: 'inset 0 0 0 1px oklch(94% 0.006 180 / 0.06)',
      }}
    >
      {visual && <div className="opacity-60">{visual}</div>}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold text-neutral-100">{title}</p>
        <p className="max-w-[40ch] text-sm text-neutral-500">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Preset empty state copy for evaluation */
export function EvaluationEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      title="No evaluation report yet."
      description="Run a successful inference job first, then start evaluation."
      action={
        onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition active:translate-y-px"
            style={{
              background: 'oklch(80% 0.13 152)',
              color: 'oklch(13.5% 0.008 180)',
              boxShadow: '0 0 0 1px rgba(106,217,161,0.2),0 12px 24px -12px rgba(106,217,161,0.5)',
            }}
          >
            Run inference first
          </button>
        ) : undefined
      }
    />
  );
}

/** Preset empty state copy for media */
export function MediaEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      title="No media uploaded yet."
      description="Upload JPG, PNG, WebP, MP4, or MOV to start building a dataset."
      action={
        onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition active:translate-y-px"
            style={{
              background: 'oklch(79% 0.12 190 / 0.12)',
              color: 'oklch(79% 0.12 190)',
              boxShadow: 'inset 0 0 0 1px oklch(79% 0.12 190 / 0.2)',
            }}
          >
            Upload media
          </button>
        ) : undefined
      }
    />
  );
}

/** Preset empty state copy for dataset */
export function DatasetEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      title="No dataset version yet."
      description="Create a draft version and assign media assets to it."
      action={
        onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition active:translate-y-px"
            style={{
              background: 'oklch(82% 0.13 88 / 0.12)',
              color: 'oklch(82% 0.13 88)',
              boxShadow: 'inset 0 0 0 1px oklch(82% 0.13 88 / 0.2)',
            }}
          >
            Create version
          </button>
        ) : undefined
      }
    />
  );
}

/** Preset empty state copy for predictions */
export function PredictionsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      title="No predictions available."
      description="Run a successful inference job to generate prediction boxes."
      action={
        onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition active:translate-y-px"
            style={{
              background: 'oklch(80% 0.13 152)',
              color: 'oklch(13.5% 0.008 180)',
              boxShadow: '0 0 0 1px rgba(106,217,161,0.2),0 12px 24px -12px rgba(106,217,161,0.5)',
            }}
          >
            Run inference
          </button>
        ) : undefined
      }
    />
  );
}
