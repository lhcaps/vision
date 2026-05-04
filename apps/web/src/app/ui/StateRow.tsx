import type { Icon } from '@phosphor-icons/react';

interface StateRowProps {
  label: string;
  value: string;
  tone: 'signal' | 'scan' | 'amber' | 'neutral';
  icon: Icon;
}

export function StateRow({ label, value, tone, icon: Icon }: StateRowProps) {
  const toneClass =
    tone === 'signal'
      ? 'text-signal-300'
      : tone === 'scan'
        ? 'text-scan-300'
        : tone === 'amber'
          ? 'text-amber-300'
          : 'text-neutral-400';

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className={toneClass} size={18} weight="duotone" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-100">{label}</p>
        <p className="mt-1 text-sm text-neutral-500">{value}</p>
      </div>
    </div>
  );
}
