import type { Icon } from '@phosphor-icons/react';

interface OverviewStateRowProps {
  label: string;
  value: string;
  tone: 'scan' | 'neutral' | 'amber' | 'signal';
  icon: Icon;
}

const toneClass: Record<OverviewStateRowProps['tone'], string> = {
  scan: 'text-scan-300',
  neutral: 'text-neutral-300',
  amber: 'text-amber-300',
  signal: 'text-signal-300',
};

export function OverviewStateRow({ label, value, tone, icon: Icon }: OverviewStateRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className={`mt-0.5 shrink-0 ${toneClass[tone]}`} size={16} weight="duotone" />
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-neutral-300">{value}</p>
      </div>
    </div>
  );
}
