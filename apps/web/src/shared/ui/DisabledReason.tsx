/**
 * DisabledReason — explains WHY a primary action is disabled.
 *
 * Usage: wrap a disabled button with a DisabledReason to surface the recovery path.
 */

interface DisabledReasonProps {
  /** The reason this action is disabled */
  reason: string;
  className?: string;
}

export function DisabledReason({ reason, className = '' }: DisabledReasonProps) {
  return (
    <p
      className={`mt-1.5 text-xs text-neutral-500 ${className}`}
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace' }}
    >
      {reason}
    </p>
  );
}

/**
 * Inline disabled reason for a form row or action group.
 * Shown below a disabled button or action group.
 */
export function ActionDisabledNote({ reason }: { reason: string }) {
  return (
    <p
      className="mt-2 rounded-md px-3 py-2 text-xs text-neutral-500"
      style={{
        background: 'oklch(94% 0.006 180 / 0.03)',
        boxShadow: 'inset 0 0 0 1px oklch(94% 0.006 180 / 0.06)',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
      }}
    >
      {reason}
    </p>
  );
}
