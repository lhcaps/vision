/**
 * RowActions — a compact set of row-level actions for tables.
 */

import type { ReactNode } from 'react';

export type RowActionDef = {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'muted';
  disabled?: boolean;
  disabledReason?: string;
};

interface RowActionsProps {
  actions: RowActionDef[];
  className?: string;
}

export function RowActions({ actions, className = '' }: RowActionsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {actions.map((action, i) => (
        <RowActionButton key={i} action={action} />
      ))}
    </div>
  );
}

function RowActionButton({ action }: { action: RowActionDef }) {
  const variant = action.variant ?? 'muted';

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    borderRadius: '6px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    transition:
      'background-color 160ms cubic-bezier(0.22, 1, 0.36, 1), color 160ms cubic-bezier(0.22, 1, 0.36, 1)',
    cursor: action.disabled ? 'not-allowed' : 'pointer',
    opacity: action.disabled ? 0.4 : 1,
  };

  let bgStyle: React.CSSProperties;
  let textColor: string;

  switch (variant) {
    case 'danger':
      bgStyle = { background: 'oklch(76% 0.14 25 / 0.1)', color: 'oklch(76% 0.14 25)' };
      textColor = 'oklch(76% 0.14 25)';
      break;
    case 'default':
      bgStyle = { background: 'oklch(80% 0.13 152 / 0.1)', color: 'oklch(80% 0.13 152)' };
      textColor = 'oklch(80% 0.13 152)';
      break;
    default:
      bgStyle = { background: 'oklch(94% 0.006 180 / 0.025)', color: 'oklch(82% 0.006 180)' };
      textColor = 'oklch(82% 0.006 180)';
  }

  return (
    <button
      type="button"
      title={action.disabled ? (action.disabledReason ?? action.label) : action.label}
      aria-label={action.label}
      disabled={action.disabled}
      onClick={action.onClick}
      className="row-action-btn"
      style={{
        ...baseStyle,
        ...bgStyle,
        color: textColor,
      }}
    >
      {action.label}
    </button>
  );
}

/** Media row actions preset */
export const MEDIA_ROW_ACTIONS = {
  view: (onClick: () => void): RowActionDef => ({
    label: 'View',
    onClick,
    variant: 'default',
  }),
  copyChecksum: (onClick: () => void): RowActionDef => ({
    label: 'Copy checksum',
    onClick,
    variant: 'muted',
  }),
  addToDraft: (onClick: () => void): RowActionDef => ({
    label: 'Add to draft',
    onClick,
    variant: 'muted',
  }),
  retryProcessing: (onClick: () => void): RowActionDef => ({
    label: 'Retry',
    onClick,
    variant: 'muted',
  }),
  delete: (onClick: () => void): RowActionDef => ({
    label: 'Delete',
    onClick,
    variant: 'danger',
  }),
} as const;

/** Job row actions preset */
export const JOB_ROW_ACTIONS = {
  viewLogs: (onClick: () => void): RowActionDef => ({
    label: 'View logs',
    onClick,
    variant: 'muted',
  }),
  retry: (onClick: () => void): RowActionDef => ({
    label: 'Retry',
    onClick,
    variant: 'default',
  }),
  cancel: (onClick: () => void): RowActionDef => ({
    label: 'Cancel',
    onClick,
    variant: 'danger',
  }),
  runEvaluation: (
    onClick: () => void,
    disabled = false,
    disabledReason?: string
  ): RowActionDef => ({
    label: 'Run evaluation',
    onClick,
    variant: 'default',
    disabled,
    disabledReason,
  }),
  copyJobId: (onClick: () => void): RowActionDef => ({
    label: 'Copy ID',
    onClick,
    variant: 'muted',
  }),
} as const;
