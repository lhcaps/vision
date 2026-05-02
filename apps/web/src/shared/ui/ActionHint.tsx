/**
 * ActionHint — inline hint that guides the user toward the next correct action.
 */

interface ActionHintProps {
  label: string;
  description: string;
  tone?: 'signal' | 'scan' | 'amber' | 'neutral';
  className?: string;
}

export function ActionHint({
  label,
  description,
  tone = 'neutral',
  className = '',
}: ActionHintProps) {
  const textColor = {
    signal: 'text-signal-300',
    scan: 'text-scan-300',
    amber: 'text-amber-300',
    neutral: 'text-neutral-400',
  }[tone];

  const labelColor = {
    signal: 'text-scan-300',
    scan: 'text-signal-300',
    amber: 'text-amber-300',
    neutral: 'text-neutral-500',
  }[tone];

  return (
    <div
      className={`flex items-start gap-3 rounded-md px-3 py-2.5 ${className}`}
      style={{
        background: 'oklch(94% 0.006 180 / 0.03)',
        boxShadow: 'inset 0 0 0 1px oklch(94% 0.006 180 / 0.06)',
      }}
    >
      <p className={`min-w-0 font-mono text-[11px] uppercase tracking-[0.14em] ${labelColor}`}>
        {label}
      </p>
      <p className={`min-w-0 flex-1 text-sm ${textColor}`}>{description}</p>
    </div>
  );
}
