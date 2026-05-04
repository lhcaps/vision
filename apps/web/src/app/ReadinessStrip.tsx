import {
  ActivityIcon as Activity,
  CheckCircleIcon as CheckCircle,
  DatabaseIcon as Database,
  StackIcon as Stack,
} from '@phosphor-icons/react';
import { type JobUiState } from '../features/inference/inference.types';

interface ReadinessStripProps {
  job: JobUiState;
}

export function ReadinessStrip({ job }: ReadinessStripProps) {
  const items = [
    { label: 'API', value: 'OpenAPI ready', icon: CheckCircle, tone: 'text-signal-300' },
    { label: 'Schema', value: 'Prisma domain mapped', icon: Database, tone: 'text-scan-300' },
    {
      label: 'Queue',
      value:
        job.source === 'api'
          ? job.status === 'RUNNING'
            ? 'Worker active'
            : 'Redis stream ready'
          : job.source === 'loading'
            ? 'Syncing jobs'
            : 'API fallback',
      icon: Stack,
      tone: 'text-amber-300',
    },
    { label: 'CV', value: 'Mock detector mounted', icon: Activity, tone: 'text-neutral-300' },
  ];

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="inner-border-subtle rounded-md bg-white/[0.035] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Icon className={item.tone} size={16} weight="duotone" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                {item.label}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-200">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}
