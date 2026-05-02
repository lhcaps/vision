import { PlayIcon as Play, ArrowCounterClockwiseIcon as RotateCcw } from '@phosphor-icons/react';
import type { InferenceJobSummary } from '@visionflow/contracts';
import { InspectorShell, InspectorRow } from './MediaInspector';
import { ActionHint } from '../../shared/ui/ActionHint';
import { DisabledReason } from '../../shared/ui/DisabledReason';

interface JobInspectorProps {
  job: InferenceJobSummary | null;
  jobError: string | null;
  jobLogs: string[];
  hasPredictions: boolean;
  hasEvaluationReport: boolean;
  canRunInference: boolean;
  canRunInferenceReason: string | null;
  onRetry?: () => void;
  onRunEvaluation?: () => void;
  onCopyJobId?: () => void;
}

export function JobInspector({
  job,
  jobError,
  jobLogs,
  hasPredictions,
  hasEvaluationReport,
  canRunInference,
  canRunInferenceReason,
  onRetry,
  onRunEvaluation,
  onCopyJobId,
}: JobInspectorProps) {
  if (!job) {
    return (
      <div className="space-y-4">
        <InspectorShell title="Job Inspector" section="jobs">
          <div className="p-4">
            <ActionHint
              label="No job"
              description="Run an inference job to see job details here."
              tone="neutral"
            />
          </div>
        </InspectorShell>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InspectorShell title="Job Inspector" section="jobs">
        <div className="divide-y divide-graphite-200">
          <InspectorRow label="Job ID" value={job.id} mono truncate />
          <InspectorRow label="Status" value={job.status} mono />
          {job.startedAt && (
            <InspectorRow
              label="Started"
              value={new Date(job.startedAt).toLocaleTimeString()}
              mono
            />
          )}
          {job.completedAt && (
            <InspectorRow
              label="Completed"
              value={new Date(job.completedAt).toLocaleTimeString()}
              mono
            />
          )}
          <InspectorRow label="Progress" value={`${job.progress ?? 0}%`} mono />
          <InspectorRow label="Dataset" value={job.datasetVersionId} mono truncate />
          <InspectorRow label="Pipeline" value={job.pipelineId} mono truncate />
          <InspectorRow label="Predictions" value={hasPredictions ? 'Yes' : 'No'} mono />
          <InspectorRow
            label="Evaluation"
            value={hasEvaluationReport ? 'Available' : 'Not yet'}
            mono
          />
          {jobError && (
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-red-300">Error</p>
              <p className="mt-1 text-xs text-red-200/80">{jobError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 p-4">
          {onCopyJobId && (
            <button
              type="button"
              onClick={onCopyJobId}
              className="version-header-action version-header-action-muted"
            >
              Copy ID
            </button>
          )}
          {onRetry && job.status !== 'RUNNING' && (
            <button
              type="button"
              onClick={onRetry}
              disabled={!canRunInference}
              className="version-header-action version-header-action-lock"
            >
              <RotateCcw size={14} />
              Retry
            </button>
          )}
        </div>

        {!canRunInference && canRunInferenceReason && (
          <div className="px-4 pb-4">
            <DisabledReason reason={canRunInferenceReason} />
          </div>
        )}
      </InspectorShell>

      {/* Logs */}
      {jobLogs.length > 0 && (
        <InspectorShell title="Worker Logs" section="jobs">
          <div
            className="logs-scroll mx-4 mb-4 max-h-[120px] overflow-y-auto rounded-md bg-graphite-950 p-3"
            style={{ maxHeight: 120 }}
          >
            {jobLogs.map((line, i) => (
              <p key={i} className="font-mono text-[11px] text-neutral-400">
                {line}
              </p>
            ))}
          </div>
        </InspectorShell>
      )}
    </div>
  );
}
