import type { InferenceJobStatus } from '@visionflow/contracts';

interface StatusPillProps {
  status: InferenceJobStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const tone =
    status === 'SUCCEEDED'
      ? 'pill-signal'
      : status === 'RUNNING'
        ? 'pill-scan'
        : status === 'FAILED'
          ? 'pill-red'
          : 'pill-amber';

  return (
    <span className={`pill-base inline-flex items-center gap-2 ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
