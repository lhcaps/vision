import type {
  AnnotationSummary,
  InferenceJobSummary,
  PipelineDefinition,
  PipelineNode,
  PipelineValidationResult,
  PredictionSummary,
} from '@visionflow/contracts';
import {
  AnnotationInspector,
  DatasetInspector,
  JobInspector,
  MediaInspector,
  PipelineInspector,
} from './index';
import type { MediaInspectorData } from './inspector.types';

type SectionId =
  | 'overview'
  | 'media'
  | 'datasets'
  | 'annotate'
  | 'pipeline'
  | 'jobs'
  | 'timeline'
  | 'diff';

type JobUiState = InferenceJobSummary & {
  logs: string[];
  source: 'loading' | 'api' | 'fallback';
  error: string | null;
};

export type InspectorRouterProps = {
  active: SectionId;
  annotations: AnnotationSummary[];
  selectedAnnotation: string;
  setSelectedAnnotation: (id: string) => void;
  threshold: number;
  setThreshold: (v: number) => void;
  job: JobUiState;
  predictions: PredictionSummary[];
  pipelineSelectedNodeId: string;
  pipelineDefinition: PipelineDefinition;
  pipelineValidation: PipelineValidationResult;
  mediaInspectorData: MediaInspectorData;
  datasetInspectorData: {
    selectedVersionId: string | null;
    selectedVersionLabel: string | null;
    selectedVersionStatus: 'DRAFT' | 'LOCKED' | null;
    selectedVersionAssetCount: number;
    splitSummary: { train: number; valid: number; test: number; unassigned: number };
    canMutate: boolean;
  };
  projectName: string;
};

export function InspectorRouter({
  active,
  annotations,
  selectedAnnotation,
  threshold,
  setThreshold,
  job,
  predictions,
  pipelineSelectedNodeId,
  pipelineDefinition,
  pipelineValidation,
  mediaInspectorData,
  datasetInspectorData,
  projectName,
}: InspectorRouterProps) {
  const selectedAnn = annotations.find((a) => a.id === selectedAnnotation) ?? null;

  if (active === 'media') {
    return <MediaInspector data={mediaInspectorData} />;
  }

  if (active === 'datasets') {
    return <DatasetInspector data={datasetInspectorData} />;
  }

  if (active === 'annotate') {
    return (
      <AnnotationInspector
        selectedAnnotation={selectedAnn}
        threshold={threshold}
        onThresholdChange={setThreshold}
      />
    );
  }

  if (active === 'pipeline') {
    const selectedNode: PipelineNode | null =
      pipelineDefinition.nodes.find((n) => n.id === pipelineSelectedNodeId) ??
      pipelineDefinition.nodes[0] ??
      null;

    return <PipelineInspector selectedNode={selectedNode} validation={pipelineValidation} />;
  }

  if (active === 'jobs') {
    return (
      <JobInspector
        job={job}
        jobError={job.error}
        jobLogs={job.logs}
        hasPredictions={predictions.length > 0}
        hasEvaluationReport={false}
        canRunInference={job.status !== 'RUNNING' && job.status !== 'QUEUED'}
        canRunInferenceReason={
          job.status === 'RUNNING'
            ? 'Inference already running.'
            : job.status === 'QUEUED'
              ? 'Inference already queued.'
              : null
        }
      />
    );
  }

  return (
    <InspectorShell title="Inspector" section={active}>
      <div className="divide-y divide-graphite-200">
        <InspectorRow label="Project" value={projectName} />
        <InspectorRow label="Job" value={`${job.status} ${job.progress}%`} />
        {job.error ? (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-red-300">Error</p>
            <p className="mt-1 text-xs text-red-200/80">{job.error}</p>
          </div>
        ) : null}
      </div>
    </InspectorShell>
  );
}

function InspectorShell({
  title,
  section,
  children,
}: {
  title: string;
  section: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-graphite-900/75 inner-border-subtle min-w-0 rounded-md shadow-panel"
      style={{ width: 320 }}
    >
      <div className="divider px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          {section}
        </p>
      </div>
      {children}
    </div>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 px-4 py-3 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className="truncate text-neutral-200">{value}</span>
    </div>
  );
}
