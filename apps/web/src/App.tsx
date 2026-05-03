import {
  ActivityIcon as Activity,
  ArrowsLeftRightIcon as ArrowsLeftRight,
  BoundingBoxIcon as BoundingBox,
  CheckCircleIcon as CheckCircle,
  DatabaseIcon as Database,
  GitBranchIcon as GitBranch,
  GraphIcon as Graph,
  ImageSquareIcon as ImageSquare,
  PlayCircleIcon as PlayCircle,
  PlayIcon as Play,
  SlidersHorizontalIcon as SlidersHorizontal,
  StackIcon as Stack,
  TerminalWindowIcon as TerminalWindow,
  TimerIcon as Timer,
  UploadSimpleIcon as UploadSimple,
  WarningCircleIcon as WarningCircle,
} from '@phosphor-icons/react';
import {
  Background,
  Controls,
  Edge as FlowEdge,
  MarkerType,
  Node as FlowNode,
  Position,
  ReactFlow,
} from '@xyflow/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AnnotationSummary,
  DatasetSplit,
  DatasetSummary,
  DatasetVersionSummary,
  EvaluationReport,
  InferenceJobEvent,
  InferenceJobSummary,
  InferenceJobStatus,
  MediaUploadStatus,
  PipelineDefinition,
  PipelineNode,
  PipelineSummary,
  PipelineValidationIssue,
  PipelineValidationResult,
  PredictionSummary,
} from '@visionflow/contracts';
import {
  createEmptySplitSummary,
  InferenceJobEventSchema,
  isTerminalJobStatus,
  SplitSummary,
  summarizeDatasetSplits,
  validatePipelineDefinition,
  validateMediaMime,
} from '@visionflow/contracts';
import { motionTokens } from '@visionflow/motion';
import { demoSnapshot, logs } from './data/demo';
import {
  AnnotationEnginePanel,
  createSeedAnnotationSummaries,
} from './features/annotations/AnnotationEngine';
import { EvaluationMetricsPanel, PredictionOverlayCanvas } from './features/evaluation';
import {
  TimelineReplayPanel,
  DatasetVersionDiff,
  PipelineExecutionFlow,
} from './features/timeline';
import {
  AnnotationInspector,
  DatasetInspector,
  InspectorRouter,
  JobInspector,
  MediaInspector,
  PipelineInspector,
} from './features/inspector';
import {
  assignDatasetVersionAssets,
  createDataset,
  createDatasetVersion,
  listDatasetVersions,
  listProjectDatasets,
  lockDatasetVersion,
} from './lib/datasets';
import { checksumFile, uploadMediaFile, type MediaUploadRow } from './features/media';
import {
  createProjectPipeline,
  listProjectPipelines,
  updateProjectPipeline,
  validateProjectPipeline,
} from './lib/pipelines';
import {
  createInferenceJob,
  getEvaluationReport,
  getInferenceJob,
  getJobPredictions,
  listInferenceJobs,
  mergeJobEvent,
  openInferenceJobEvents,
  runEvaluation,
  type JobUiState,
  type JobSourceState,
} from './features/inference';
import {
  EmptyState,
  EvaluationEmptyState,
  MediaEmptyState,
  DatasetEmptyState,
  PredictionsEmptyState,
} from './shared/ui/EmptyState';
import { ErrorState, FailedJobErrorState } from './shared/ui/ErrorState';
import { ActionHint } from './shared/ui/ActionHint';
import { type WorkbenchRuntimeState } from './shared/state/workbench-runtime';
import {
  canRunInference,
  canRunEvaluation,
  canShowPredictionOverlay,
  shouldShowPipelineExecution,
} from './shared/state/runtime-selectors';

type SectionId =
  | 'overview'
  | 'media'
  | 'datasets'
  | 'annotate'
  | 'pipeline'
  | 'jobs'
  | 'timeline'
  | 'diff';

type DatasetSourceState = 'loading' | 'api' | 'fallback';
type PipelineSourceState = 'loading' | 'api' | 'fallback';

type DatasetActionState = {
  busy: boolean;
  message: string | null;
  error: string | null;
};

const datasetSplits: DatasetSplit[] = ['TRAIN', 'VALID', 'TEST', 'UNASSIGNED'];

// Helpers to derive inspector data from App-level state
function buildMediaInspectorData(
  mediaRows: MediaUploadRow[],
  selectedMediaAssetId: string | null
): {
  selectedAssetId: string | null;
  selectedAssetName: string | null;
  selectedAssetMime: string | null;
  selectedAssetWidth: number | null;
  selectedAssetHeight: number | null;
  selectedAssetChecksum: string | null;
  selectedAssetStorageKey: string | null;
  selectedAssetProcessingState: string | null;
} {
  const selected = selectedMediaAssetId
    ? (mediaRows.find((r) => r.id === selectedMediaAssetId) ?? null)
    : null;

  return {
    selectedAssetId: selected?.id ?? null,
    selectedAssetName: selected?.name ?? null,
    selectedAssetMime: selected?.type ?? null,
    selectedAssetWidth: selected?.width ?? null,
    selectedAssetHeight: selected?.height ?? null,
    selectedAssetChecksum: selected?.checksum ?? null,
    selectedAssetStorageKey: null,
    selectedAssetProcessingState:
      selected?.status === 'indexed'
        ? 'processed'
        : selected?.status === 'failed'
          ? 'failed'
          : selected?.status === 'uploading' || selected?.status === 'hashing'
            ? 'processing'
            : (selected?.status ?? null),
  };
}

function buildDatasetInspectorData(
  selectedDatasetVersionId: string | null,
  versions: DatasetVersionSummary[],
  sourceState: 'loading' | 'api' | 'fallback'
): {
  selectedVersionId: string | null;
  selectedVersionLabel: string | null;
  selectedVersionStatus: 'DRAFT' | 'LOCKED' | null;
  selectedVersionAssetCount: number;
  splitSummary: { train: number; valid: number; test: number; unassigned: number };
  canMutate: boolean;
} {
  const selected = selectedDatasetVersionId
    ? (versions.find((v) => v.id === selectedDatasetVersionId) ?? null)
    : null;

  return {
    selectedVersionId: selected?.id ?? null,
    selectedVersionLabel: selected?.label ?? null,
    selectedVersionStatus: selected?.status === 'ARCHIVED' ? null : (selected?.status ?? null),
    selectedVersionAssetCount: selected?.assetCount ?? 0,
    splitSummary: selected?.splitSummary
      ? {
          train: selected.splitSummary.TRAIN ?? 0,
          valid: selected.splitSummary.VALID ?? 0,
          test: selected.splitSummary.TEST ?? 0,
          unassigned: selected.splitSummary.UNASSIGNED ?? 0,
        }
      : { train: 0, valid: 0, test: 0, unassigned: 0 },
    canMutate: selected?.status === 'DRAFT',
  };
}

const sections: Array<{
  id: SectionId;
  label: string;
  icon: typeof Activity;
}> = [
  { id: 'overview', label: 'Command', icon: Activity },
  { id: 'media', label: 'Media', icon: ImageSquare },
  { id: 'datasets', label: 'Versions', icon: GitBranch },
  { id: 'annotate', label: 'Annotate', icon: BoundingBox },
  { id: 'pipeline', label: 'Pipeline', icon: Graph },
  { id: 'jobs', label: 'Jobs', icon: Timer },
  { id: 'timeline', label: 'Replay', icon: PlayCircle },
  { id: 'diff', label: 'Diff', icon: ArrowsLeftRight },
];

export function App() {
  const [section, setSection] = useState<SectionId>('overview');
  const [threshold, setThreshold] = useState(62);
  const [selectedAnnotation, setSelectedAnnotation] = useState('ann_02');
  const [annotationRows, setAnnotationRows] = useState<AnnotationSummary[]>(() =>
    createSeedAnnotationSummaries()
  );
  const [mediaUploads, setMediaUploads] = useState<MediaUploadRow[]>([]);
  const [job, setJob] = useState<JobUiState>(() =>
    toJobUiState(seededJobSummary(), 'fallback', logs.slice(0, 2))
  );
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionSummary[]>([]);
  const visibleMediaRows = useMemo(() => [...mediaUploads, ...seededMediaRows()], [mediaUploads]);

  // Tracked selection state for contextual inspectors
  const [selectedMediaAssetId, setSelectedMediaAssetId] = useState<string | null>(null);
  const [selectedDatasetVersionId, setSelectedDatasetVersionId] = useState<string | null>(null);
  const [datasetVersions, setDatasetVersions] = useState<DatasetVersionSummary[]>([]);
  const [datasetSourceState, setDatasetSourceState] = useState<'loading' | 'api' | 'fallback'>(
    'loading'
  );

  // Load datasets + versions from the API on mount so Run button eligibility
  // can be determined from real data (locked version + assets).
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const datasetsResponse = await listProjectDatasets(demoSnapshot.project.id);

        if (cancelled) return;

        // Fetch all versions in parallel
        const versionResponses = await Promise.all(
          datasetsResponse.datasets.map((ds) => listDatasetVersions(demoSnapshot.project.id, ds.id))
        );

        if (cancelled) return;

        // Flatten all versions across datasets
        const allVersions: DatasetVersionSummary[] = versionResponses.flatMap((vr) => vr.versions);

        setDatasetVersions(allVersions);

        // Auto-select the first LOCKED version with assets if nothing selected yet
        if (allVersions.length > 0) {
          const lockedWithAssets = allVersions.find(
            (v) => v.status === 'LOCKED' && v.assetCount > 0
          );
          if (lockedWithAssets) {
            setSelectedDatasetVersionId(lockedWithAssets.id);
          }
        }

        setDatasetSourceState('api');
      } catch {
        if (cancelled) return;
        setDatasetVersions([]);
        setDatasetSourceState('fallback');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Pipeline selected node — lifted from PipelinePanel so InspectorRouter can access it
  const [pipelineSelectedNodeId, setPipelineSelectedNodeId] = useState<string>('detector');
  const [pipelineDefinition, setPipelineDefinition] = useState<PipelineDefinition>(
    demoSnapshot.pipeline
  );
  const [pipelineValidation, setPipelineValidation] = useState<PipelineValidationResult>(
    validatePipelineDefinition(demoSnapshot.pipeline)
  );

  useEffect(() => {
    let cancelled = false;

    setJob((current) => ({
      ...current,
      source: 'loading',
      error: null,
      logs: ['Syncing inference jobs from API.'],
    }));

    void listInferenceJobs(demoSnapshot.project.id)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const latest = response.jobs[0];

        setJob(
          latest
            ? toJobUiState(latest, 'api', ['API returned the latest inference job snapshot.'])
            : {
                id: '',
                projectId: demoSnapshot.project.id,
                datasetVersionId: '',
                pipelineId: '',
                modelId: null,
                status: 'NONE',
                progress: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                startedAt: null,
                completedAt: null,
                errorMessage: null,
                source: 'api' as const,
                logs: ['No inference jobs queued yet.'],
                error: null,
              }
        );
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setJob((current) => ({
          ...current,
          source: 'fallback',
          error: formatUiError(error),
          logs: ['API unavailable. Job controls will not fake progress.'],
        }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (job.source !== 'api' || !job.id || isTerminalJobStatus(job.status)) {
      return;
    }

    const source = openInferenceJobEvents(demoSnapshot.project.id, job.id);

    source.onmessage = (event) => {
      const parsed = parseJobEvent(event.data);

      if (!parsed || parsed.jobId !== job.id) {
        return;
      }

      setJob((current) =>
        current.id === parsed.jobId
          ? {
              ...mergeJobEvent(current, parsed),
              source: current.source,
              error: parsed.type === 'error' ? parsed.message : null,
              logs: [...current.logs, parsed.message].slice(-8),
            }
          : current
      );

      if (parsed.type === 'complete' || parsed.type === 'error') {
        source.close();
      }
    };

    source.onerror = () => {
      void getInferenceJob(demoSnapshot.project.id, job.id)
        .then((latest) => {
          setJob((current) =>
            current.id === latest.id
              ? toJobUiState(
                  latest,
                  'api',
                  [
                    ...current.logs,
                    isTerminalJobStatus(latest.status)
                      ? `Job resynced after stream close: ${latest.status}.`
                      : 'Progress stream disconnected. Resynced latest job snapshot.',
                  ].slice(-8)
                )
              : current
          );
        })
        .catch(() => {
          setJob((current) =>
            current.id === job.id && !isTerminalJobStatus(current.status)
              ? {
                  ...current,
                  error: 'Progress stream disconnected. Refresh the job list to resync.',
                  logs: [...current.logs, 'Progress stream disconnected.'].slice(-8),
                }
              : current
          );
        })
        .finally(() => source.close());
    };

    return () => source.close();
  }, [job.id, job.source, job.status]);

  // Polling fallback: SSE is a realtime optimization, not the source of truth.
  // If SSE closes before job reaches terminal state, poll the API every second.
  useEffect(() => {
    if (job.source !== 'api' || !job.id || isTerminalJobStatus(job.status)) {
      return;
    }

    const timer = window.setInterval(() => {
      void getInferenceJob(demoSnapshot.project.id, job.id)
        .then((latest) => {
          setJob((current) =>
            current.id === latest.id
              ? {
                  ...toJobUiState(latest, 'api', current.logs),
                  error: latest.errorMessage,
                }
              : current
          );
        })
        .catch(() => {
          // SSE already surfaces connection errors. Polling stays quiet.
        });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [job.id, job.source, job.status]);

  // Fetch evaluation report and predictions when a completed job is available
  useEffect(() => {
    if (job.status !== 'SUCCEEDED' || !job.id) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [existingReport, predData] = await Promise.all([
          getEvaluationReport(job.projectId, job.id),
          getJobPredictions(job.projectId, job.id),
        ]);

        if (cancelled) return;

        if (existingReport) {
          setEvaluationReport(existingReport);
        }

        setPredictions(predData.predictions);
      } catch {
        // Evaluation or predictions not available yet - normal before first run
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [job.id, job.status]);

  const handleRunEvaluation = async () => {
    if (!job.id || isEvaluating) return;

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const report = await runEvaluation(job.projectId, job.id);
      setEvaluationReport(report);

      const predData = await getJobPredictions(job.projectId, job.id);
      setPredictions(predData.predictions);
    } catch (err) {
      setEvaluationError(err instanceof Error ? err.message : 'Evaluation failed.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Derive runtime state from resolved API data — THIS is the single source of truth.
  // Every selector (canRunInference, canRunEvaluation, etc.) consumes this state.
  const runtimeState = useMemo((): WorkbenchRuntimeState => {
    const selectedVersion = datasetVersions.find((v) => v.id === selectedDatasetVersionId) ?? null;
    const isLocked = selectedVersion?.status === 'LOCKED' && selectedVersion.assetCount > 0;

    const apiHealth =
      job.source === 'loading'
        ? ('loading' as const)
        : job.source === 'api'
          ? ('connected' as const)
          : ('unavailable' as const);

    const jobStatus = job.id ? (job.status as WorkbenchRuntimeState['latestJobStatus']) : 'NONE';
    const jobError = job.error;

    return {
      mode: job.source === 'loading' ? 'loading' : job.source === 'api' ? 'api' : 'fallback',
      projectId: demoSnapshot.project.id,
      selectedDatasetVersionId: selectedDatasetVersionId,
      selectedDatasetVersionLabel: selectedVersion?.label ?? null,
      lockedDatasetWithAssets: isLocked,
      latestJobId: job.id || null,
      latestJobStatus: jobStatus,
      latestJobError: jobError,
      hasPredictions: predictions.length > 0,
      hasEvaluationReport: evaluationReport !== null,
      health: {
        api: apiHealth,
        database: 'unknown',
        queue: job.source === 'fallback' ? 'fallback' : 'unknown',
        worker: 'unknown',
      },
    };
  }, [job, predictions, evaluationReport, datasetVersions, selectedDatasetVersionId]);

  // Resolve eligibility from runtime state
  const inferenceEligibility = useMemo(() => canRunInference(runtimeState), [runtimeState]);
  const evaluationEligibility = useMemo(() => canRunEvaluation(runtimeState), [runtimeState]);
  const showPipelineExecution = useMemo(
    () => shouldShowPipelineExecution(runtimeState),
    [runtimeState]
  );

  const startJob = async () => {
    setSection('jobs');
    setJob((current) => ({
      ...current,
      status: 'QUEUED',
      progress: 0,
      source: current.source === 'fallback' ? 'loading' : current.source,
      error: null,
      logs: ['Resolving locked dataset version and persisted pipeline.'],
    }));

    try {
      const target = await resolveInferenceRunTarget(demoSnapshot.project.id);
      const response = await createInferenceJob(demoSnapshot.project.id, {
        datasetVersionId: target.datasetVersionId,
        pipelineId: target.pipelineId,
        modelId: null,
      });

      setJob(
        toJobUiState(response.job, 'api', [
          'Queue accepted inference payload with IDs only.',
          `Dataset ${target.datasetVersionLabel} and pipeline ${target.pipelineName} selected.`,
        ])
      );
    } catch (error) {
      const message = formatUiError(error);

      setJob((current) => ({
        ...current,
        status: 'FAILED',
        progress: 100,
        source: 'fallback',
        error: message,
        logs: [`Run failed: ${message}`].slice(-8),
      }));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-graphite-950 text-neutral-100">
      <div className="app-grid min-h-[100dvh]">
        <NavRail active={section} onSelect={setSection} />
        <main className="min-w-0">
          <ShellHeader
            job={job}
            threshold={threshold}
            onRun={startJob}
            inferenceEligibility={inferenceEligibility}
          />
          <div className="mx-auto grid max-w-[1500px] gap-4 px-4 pb-5 pt-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0">
              <ReadinessStrip job={job} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeScan }}
                >
                  {section === 'overview' && (
                    <OverviewPanel
                      onRun={startJob}
                      inferenceEligibility={inferenceEligibility}
                      pipelineValidation={pipelineValidation}
                    />
                  )}
                  {section === 'media' && (
                    <MediaPanel
                      uploads={mediaUploads}
                      setUploads={setMediaUploads}
                      selectedAssetId={selectedMediaAssetId}
                      onSelectAsset={setSelectedMediaAssetId}
                    />
                  )}
                  {section === 'datasets' && (
                    <DatasetPanel
                      mediaRows={visibleMediaRows}
                      selectedVersionId={selectedDatasetVersionId}
                      onSelectVersion={setSelectedDatasetVersionId}
                      versions={datasetVersions}
                      onVersionsChange={setDatasetVersions}
                      sourceState={datasetSourceState}
                      onSourceStateChange={setDatasetSourceState}
                    />
                  )}
                  {section === 'annotate' && (
                    <AnnotationEnginePanel
                      annotations={annotationRows}
                      setAnnotations={setAnnotationRows}
                      selectedAnnotationId={selectedAnnotation}
                      onSelectAnnotation={setSelectedAnnotation}
                      threshold={threshold}
                      setThreshold={setThreshold}
                      mediaRows={visibleMediaRows}
                    />
                  )}
                  {section === 'pipeline' && (
                    <PipelinePanel
                      selectedNodeId={pipelineSelectedNodeId}
                      onSelectNode={setPipelineSelectedNodeId}
                      definition={pipelineDefinition}
                      onDefinitionChange={setPipelineDefinition}
                      validation={pipelineValidation}
                      onValidationChange={setPipelineValidation}
                    />
                  )}
                  {section === 'jobs' && (
                    <JobsPanel
                      job={job}
                      threshold={threshold}
                      onRun={startJob}
                      evaluationReport={evaluationReport}
                      isEvaluating={isEvaluating}
                      evaluationError={evaluationError}
                      predictions={predictions}
                      groundTruth={annotationRows}
                      onRunEvaluation={handleRunEvaluation}
                      evaluationEligibility={evaluationEligibility}
                      inferenceEligibility={inferenceEligibility}
                      onOpenVersions={() => setSection('datasets')}
                    />
                  )}
                  {section === 'timeline' && (
                    <TimelineReplayPanel
                      mediaAssets={demoSnapshot.media}
                      groundTruth={annotationRows}
                      predictions={predictions}
                    />
                  )}
                  {section === 'diff' && <DatasetVersionDiff />}
                </motion.div>
              </AnimatePresence>
            </section>
            <InspectorRouter
              active={section}
              annotations={annotationRows}
              selectedAnnotation={selectedAnnotation}
              setSelectedAnnotation={setSelectedAnnotation}
              threshold={threshold}
              setThreshold={setThreshold}
              job={job}
              predictions={predictions}
              pipelineSelectedNodeId={pipelineSelectedNodeId}
              pipelineDefinition={pipelineDefinition}
              pipelineValidation={pipelineValidation}
              mediaInspectorData={buildMediaInspectorData(visibleMediaRows, selectedMediaAssetId)}
              datasetInspectorData={buildDatasetInspectorData(
                selectedDatasetVersionId,
                datasetVersions,
                datasetSourceState
              )}
              projectName={demoSnapshot.project.name}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

async function resolveInferenceRunTarget(projectId: string): Promise<{
  datasetVersionId: string;
  datasetVersionLabel: string;
  pipelineId: string;
  pipelineName: string;
}> {
  const [datasetResponse, pipelineResponse] = await Promise.all([
    listProjectDatasets(projectId),
    listProjectPipelines(projectId),
  ]);
  const pipeline = pipelineResponse.pipelines.find((item) => item.validation.ok);

  if (!pipeline) {
    throw new Error('No valid persisted pipeline is available for inference.');
  }

  for (const dataset of datasetResponse.datasets) {
    const versions = await listDatasetVersions(projectId, dataset.id);
    const locked = versions.versions.find(
      (version) => version.status === 'LOCKED' && version.assetCount > 0
    );

    if (locked) {
      return {
        datasetVersionId: locked.id,
        datasetVersionLabel: `${dataset.name} ${locked.label}`,
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
      };
    }
  }

  throw new Error('No locked dataset version with assets is available for inference.');
}

function seededJobSummary(): InferenceJobSummary {
  return {
    id: demoSnapshot.job.id,
    projectId: demoSnapshot.project.id,
    datasetVersionId: 'dataset_proj_parking_lot_parking_v3',
    pipelineId: 'pipeline_proj_parking_lot_parking_detector',
    modelId: null,
    status: demoSnapshot.job.status,
    progress: demoSnapshot.job.progress,
    createdAt: '2026-04-28T13:35:40.000Z',
    updatedAt: '2026-04-28T13:35:40.000Z',
    startedAt: demoSnapshot.job.startedAt ?? null,
    completedAt: null,
    errorMessage: null,
  };
}

function toJobUiState(
  summary: InferenceJobSummary,
  source: JobSourceState,
  jobLogs: string[]
): JobUiState {
  return {
    ...summary,
    source,
    error: summary.errorMessage,
    logs: jobLogs,
  };
}

function parseJobEvent(value: string): InferenceJobEvent | null {
  try {
    const parsed = InferenceJobEventSchema.safeParse(JSON.parse(value));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function formatUiError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function NavRail({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (section: SectionId) => void;
}) {
  return (
    <aside className="nav-rail divider-right px-2.5 py-3">
      <div className="nav-logo mb-5 flex h-10 w-10 items-center justify-center rounded-md text-signal-300">
        <BoundingBox size={21} weight="duotone" />
      </div>
      <nav className="flex flex-col gap-1.5" aria-label="VisionFlow workbench">
        {sections.map((item, index) => {
          const Icon = item.icon;
          const selected = item.id === active;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.03,
                duration: motionTokens.durationFast,
                ease: motionTokens.easeScan,
              }}
            >
              <button
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-pressed={selected}
                onClick={() => onSelect(item.id)}
                className="nav-button group relative flex h-10 w-10 items-center justify-center rounded-md text-sm transition active:translate-y-px"
              >
                {selected && (
                  <>
                    <motion.span
                      layoutId="nav-active"
                      className="nav-active-surface absolute inset-0 rounded-md"
                      transition={motionTokens.springFast}
                    />
                    <span className="nav-active-rail" />
                  </>
                )}
                <Icon
                  className="relative z-10"
                  size={21}
                  weight={selected ? 'duotone' : 'regular'}
                />
              </button>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}

function ShellHeader({
  job,
  threshold,
  onRun,
  inferenceEligibility,
}: {
  job: JobUiState;
  threshold: number;
  onRun: () => void;
  inferenceEligibility: { ok: boolean; reason: string | null };
}) {
  const isRunDisabled = !inferenceEligibility.ok;

  return (
    <header className="divider bg-graphite-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
            {demoSnapshot.project.id} / {demoSnapshot.project.datasetVersion}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-neutral-100">
            VisionFlow Studio
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={job.status} />
          <span className="inner-border-subtle rounded-md bg-white/[0.04] px-3 py-2 font-mono text-xs text-neutral-300">
            threshold {(threshold / 100).toFixed(2)}
          </span>
          <button
            type="button"
            title={
              isRunDisabled && inferenceEligibility.reason
                ? inferenceEligibility.reason
                : 'Run inference'
            }
            aria-label="Run inference"
            onClick={onRun}
            disabled={
              !inferenceEligibility.ok ||
              job.source === 'loading' ||
              job.status === 'RUNNING' ||
              job.status === 'QUEUED'
            }
            className="inline-flex items-center gap-2 rounded-md bg-signal-300 px-3 py-2 text-sm font-semibold text-graphite-950 transition hover:bg-signal-400 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={16} weight="fill" />
            Run
          </button>
        </div>
      </div>
      {isRunDisabled && inferenceEligibility.reason && (
        <div className="mx-auto max-w-[1500px] px-4 pb-2">
          <ActionHint label="Run disabled" description={inferenceEligibility.reason} tone="amber" />
        </div>
      )}
    </header>
  );
}

function ReadinessStrip({ job }: { job: JobUiState }) {
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

function OverviewPanel({
  onRun,
  inferenceEligibility,
  pipelineValidation,
}: {
  onRun: () => void;
  inferenceEligibility: { ok: boolean; reason: string | null };
  pipelineValidation: PipelineValidationResult;
}) {
  const canRun = inferenceEligibility.ok;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
      <Panel className="overflow-hidden">
        <div className="divider px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                Active project
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-100">
                {demoSnapshot.project.name}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                title={
                  !canRun && inferenceEligibility.reason
                    ? inferenceEligibility.reason
                    : 'Queue inference job'
                }
                aria-label="Queue inference job"
                onClick={onRun}
                disabled={!canRun}
                className="btn-signal-outline inline-flex items-center gap-2 px-3 py-2 text-sm font-medium active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play size={16} weight="fill" />
                Queue job
              </button>
              {!canRun && inferenceEligibility.reason && (
                <p className="max-w-[28ch] text-right font-mono text-[10px] text-amber-300">
                  {inferenceEligibility.reason}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="grid min-h-[480px] gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="divider p-4 lg:border-b-0 lg:border-r">
            <VisionPreview />
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Vertical slice</h3>
            <div className="mt-4 space-y-3">
              {[
                ['Upload', '20 assets indexed, checksum dedupe pending'],
                ['Version', 'Dataset v1.3 locked with train/valid/test splits'],
                ['Annotate', '3 visible boxes, image-coordinate storage'],
                [
                  'Pipeline',
                  pipelineValidation.ok ? 'Graph passes V1 validation' : 'Graph needs review',
                ],
                ['Inference', 'Mock detector path ready for async orchestration'],
                ['Evaluate', 'Precision, recall, F1 surface seeded'],
              ].map(([label, value], index) => (
                <motion.div
                  key={label}
                  className="inner-border-subtle grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3 rounded-md bg-white/[0.03] p-3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.035, duration: 0.2 }}
                >
                  <span className="font-mono text-xs text-scan-300">{label}</span>
                  <span className="text-sm text-neutral-300">{value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="divider px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">System states</h2>
        </div>
        <div className="divide-y divide-graphite-200">
          <StateRow
            label="Loading"
            value="Skeleton rows match table density"
            tone="scan"
            icon={Activity}
          />
          <StateRow
            label="Empty"
            value="Dataset and media surfaces reserve first-run states"
            tone="neutral"
            icon={Stack}
          />
          <StateRow
            label="Error"
            value="Pipeline and job failures surface actionable messages"
            tone="amber"
            icon={WarningCircle}
          />
          <StateRow
            label="Reduced motion"
            value="Scan and flow effects collapse to static state color"
            tone="signal"
            icon={CheckCircle}
          />
        </div>
      </Panel>
    </div>
  );
}

function MediaPanel({
  uploads,
  setUploads,
  selectedAssetId,
  onSelectAsset,
}: {
  uploads: MediaUploadRow[];
  setUploads: Dispatch<SetStateAction<MediaUploadRow[]>>;
  selectedAssetId: string | null;
  onSelectAsset: (id: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const allRows = useMemo(() => [...uploads, ...seededMediaRows()], [uploads]);
  const queuedCount = uploads.filter(
    (row) => row.status === 'uploading' || row.status === 'hashing'
  ).length;
  const failedCount = uploads.filter((row) => row.status === 'failed').length;
  const duplicateCount = uploads.filter((row) => row.status === 'duplicate').length;

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = [...fileList];

    for (const file of files) {
      await ingestFile(file, allRows, setUploads);
    }
  };

  return (
    <Panel className="media-panel overflow-hidden">
      <div className="divider flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">Media ingestion</h2>
          <p className="mt-1 text-sm text-neutral-500">
            MIME validation, SHA-256 dedupe, MinIO storage, metadata rows, and processing jobs.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={(event) => {
            if (event.currentTarget.files) {
              void handleFiles(event.currentTarget.files);
            }
            event.currentTarget.value = '';
          }}
        />
        <button
          type="button"
          title="Upload media"
          aria-label="Upload media"
          onClick={() => inputRef.current?.click()}
          className="version-header-action version-header-action-muted inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.07] active:translate-y-px"
        >
          <UploadSimple size={16} />
          Upload
        </button>
      </div>
      <div className="divider grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <label
          className={[
            'inner-border m-4 flex min-h-44 cursor-pointer flex-col justify-between rounded-md p-4 transition',
            dragActive
              ? 'border-[oklch(0.8_0.13_152)] bg-[oklch(0.8_0.13_152/0.1)]'
              : 'bg-white/[0.025] hover:bg-white/[0.04]',
          ].join(' ')}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            void handleFiles(event.dataTransfer.files);
          }}
        >
          <span>
            <span className="btn-signal-outline flex h-10 w-10 items-center justify-center rounded-md">
              <UploadSimple size={20} weight="duotone" />
            </span>
            <span className="mt-4 block text-base font-semibold text-neutral-100">
              Drop images or video here
            </span>
            <span className="mt-2 block max-w-[62ch] text-sm leading-6 text-neutral-500">
              Supported: JPG, PNG, WebP, MP4, MOV. The client hashes first so duplicate files are
              caught before storage work.
            </span>
          </span>
          <span className="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-signal-300">
            Select files
          </span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            onChange={(event) => {
              if (event.currentTarget.files) {
                void handleFiles(event.currentTarget.files);
              }
              event.currentTarget.value = '';
            }}
          />
        </label>
        <div className="divider-top p-4 lg:border-l lg:border-t-0">
          <h3 className="text-sm font-semibold text-neutral-100">Upload state</h3>
          <div className="mt-4 grid gap-2">
            <UploadStateMetric label="new queue" value={queuedCount} tone="scan" />
            <UploadStateMetric label="duplicates" value={duplicateCount} tone="signal" />
            <UploadStateMetric label="failed" value={failedCount} tone="amber" />
          </div>
        </div>
      </div>
      <div className="media-assets-scroll">
        <table className="media-assets-table w-full border-collapse text-sm">
          <thead className="bg-white/[0.025] text-left font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Shape</th>
              <th className="px-4 py-3 font-medium">Split</th>
              <th className="px-4 py-3 font-medium">Checksum</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Processing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-200">
            {allRows.map((asset) => (
              <tr
                key={asset.id}
                className={[
                  'cursor-pointer text-neutral-300 transition',
                  selectedAssetId === asset.id
                    ? 'bg-signal-400/10 inner-border-subtle'
                    : 'hover:bg-white/[0.03]',
                ].join(' ')}
                onClick={() => onSelectAsset(selectedAssetId === asset.id ? null : asset.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="media-asset-thumb" />
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-100">{asset.name}</p>
                      <p className="media-asset-meta font-mono text-xs text-neutral-500">
                        <span>{asset.id}</span>
                        <span className="media-asset-shape-inline">{formatMediaShape(asset)}</span>
                      </p>
                      {asset.error ? (
                        <p className="mt-1 max-w-[34ch] text-xs text-red-300">{asset.error}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{formatMediaShape(asset)}</td>
                <td className="px-4 py-3">
                  <SplitPill split={asset.split} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{asset.checksum}</td>
                <td className="px-4 py-3">
                  <MediaStatusPill status={asset.status} />
                </td>
                <td className="px-4 py-3">
                  <UploadProgress row={asset} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

async function ingestFile(
  file: File,
  existingRows: MediaUploadRow[],
  setUploads: Dispatch<SetStateAction<MediaUploadRow[]>>
) {
  const rowId = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    validateMediaMime(file.type);
  } catch {
    setUploads((current) => [
      {
        id: rowId,
        name: file.name,
        type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        checksum: 'invalid-mime',
        split: 'UNASSIGNED',
        status: 'failed',
        progress: 0,
        sizeBytes: file.size,
        width: null,
        height: null,
        error: `Unsupported MIME type: ${file.type || 'unknown'}`,
      },
      ...current,
    ]);
    return;
  }

  setUploads((current) => [
    {
      id: rowId,
      name: file.name,
      type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      checksum: 'hashing',
      split: 'UNASSIGNED',
      status: 'hashing',
      progress: 10,
      sizeBytes: file.size,
      width: null,
      height: null,
    },
    ...current,
  ]);

  const checksum = await checksumFile(file);
  const duplicate = existingRows.some((row) => row.checksum === checksum);

  if (duplicate) {
    setUploads((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              checksum,
              status: 'duplicate',
              progress: 100,
              error: 'Checksum already exists in this project.',
            }
          : row
      )
    );
    return;
  }

  setUploads((current) =>
    current.map((row) =>
      row.id === rowId ? { ...row, checksum, status: 'uploading', progress: 42 } : row
    )
  );

  try {
    const response = await uploadMediaFile(demoSnapshot.project.id, file);

    setUploads((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              id: response.asset.id,
              name: response.asset.name,
              type: response.asset.type,
              checksum: response.asset.checksum,
              status: response.deduplicated ? 'duplicate' : response.asset.status,
              progress: 100,
              sizeBytes: response.asset.sizeBytes,
              width: response.asset.width,
              height: response.asset.height,
              processingJob: response.processingJob?.type ?? undefined,
            }
          : row
      )
    );
  } catch (error) {
    setUploads((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              status: 'failed',
              progress: 100,
              error: error instanceof Error ? error.message : String(error),
            }
          : row
      )
    );
  }
}

function seededMediaRows(): MediaUploadRow[] {
  return demoSnapshot.media.map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    checksum: asset.checksum,
    split: asset.split,
    status: asset.status,
    progress: asset.status === 'queued' ? 64 : 100,
    sizeBytes: asset.sizeBytes ?? 1_486_400,
    width: asset.width,
    height: asset.height,
    processingJob: asset.status === 'queued' ? 'THUMBNAIL' : 'complete',
  }));
}

function UploadStateMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'signal' | 'scan' | 'amber';
}) {
  const toneClass =
    tone === 'signal' ? 'text-signal-300' : tone === 'scan' ? 'text-scan-300' : 'text-amber-300';

  return (
    <div className="inner-border-subtle flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

function MediaStatusPill({ status }: { status: MediaUploadRow['status'] }) {
  const tone =
    status === 'indexed'
      ? 'media-status-pill-signal'
      : status === 'uploading' || status === 'hashing' || status === 'queued'
        ? 'media-status-pill-scan'
        : status === 'duplicate'
          ? 'media-status-pill-amber'
          : 'media-status-pill-red';

  return <span className={`media-status-pill ${tone}`}>{status}</span>;
}

function UploadProgress({ row }: { row: MediaUploadRow }) {
  return (
    <div className="min-w-32">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={[
            'h-full',
            row.status === 'failed'
              ? 'bg-red-300'
              : row.status === 'duplicate'
                ? 'bg-amber-300'
                : 'bg-signal-300',
          ].join(' ')}
          initial={false}
          animate={{ width: `${row.progress}%` }}
          transition={motionTokens.springSoft}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-neutral-500">
        {row.processingJob ?? (row.status === 'indexed' ? 'audit logged' : row.status)}
      </p>
    </div>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatMediaShape(asset: MediaUploadRow): string {
  return asset.width && asset.height
    ? `${asset.width} x ${asset.height}`
    : formatBytes(asset.sizeBytes);
}

function DatasetPanel({
  mediaRows,
  selectedVersionId: externalSelectedVersionId,
  onSelectVersion,
  versions: externalVersions,
  onVersionsChange,
  sourceState: externalSourceState,
  onSourceStateChange,
}: {
  mediaRows: MediaUploadRow[];
  selectedVersionId?: string | null;
  onSelectVersion?: (id: string | null) => void;
  versions?: DatasetVersionSummary[];
  onVersionsChange?: (v: DatasetVersionSummary[]) => void;
  sourceState?: 'loading' | 'api' | 'fallback';
  onSourceStateChange?: (s: 'loading' | 'api' | 'fallback') => void;
}) {
  const projectId = demoSnapshot.project.id;
  const shouldReduceMotion = useReducedMotion();
  const fallbackDatasetId = createFallbackDatasetId(projectId);
  const fallbackDatasets = useMemo(
    () => createFallbackDatasets(projectId, fallbackDatasetId, mediaRows),
    [fallbackDatasetId, mediaRows, projectId]
  );
  const fallbackVersions = useMemo(
    () => createFallbackVersions(fallbackDatasetId, mediaRows),
    [fallbackDatasetId, mediaRows]
  );
  const [sourceState, _setSourceState] = useState<'loading' | 'api' | 'fallback'>(
    externalSourceState ?? 'loading'
  );
  const setSourceState = (s: 'loading' | 'api' | 'fallback') => {
    _setSourceState(s);
    onSourceStateChange?.(s);
  };
  const [datasets, setDatasets] = useState<DatasetSummary[]>(fallbackDatasets);
  const [versions, _setVersions] = useState<DatasetVersionSummary[]>(
    externalVersions ?? fallbackVersions
  );
  const setVersions = (
    v: DatasetVersionSummary[] | ((prev: DatasetVersionSummary[]) => DatasetVersionSummary[])
  ) => {
    if (typeof v === 'function') {
      _setVersions((prev) => {
        const next = v(prev);
        onVersionsChange?.(next);
        return next;
      });
    } else {
      _setVersions(v);
      onVersionsChange?.(v);
    }
  };
  const [selectedDatasetId, setSelectedDatasetId] = useState(fallbackDatasetId);
  const [selectedVersionId, _setSelectedVersionId] = useState(
    externalSelectedVersionId ?? fallbackVersions[0]?.id ?? ''
  );

  const setSelectedVersionId = (id: string) => {
    _setSelectedVersionId(id);
    onSelectVersion?.(id);
  };
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    mediaRows.slice(0, 2).map((row) => row.id)
  );
  const [targetSplit, setTargetSplit] = useState<DatasetSplit>('TRAIN');
  const [localAssignments, setLocalAssignments] = useState<Record<string, string[]>>({});
  const [actionState, setActionState] = useState<DatasetActionState>({
    busy: false,
    message: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDatasets() {
      setSourceState('loading');

      try {
        const datasetResponse = await listProjectDatasets(projectId);

        if (cancelled) {
          return;
        }

        if (datasetResponse.datasets.length === 0) {
          setSourceState('fallback');
          setDatasets(fallbackDatasets);
          setVersions(fallbackVersions);
          return;
        }

        const dataset = datasetResponse.datasets[0];
        const versionResponse = await listDatasetVersions(projectId, dataset.id);

        if (cancelled) {
          return;
        }

        setDatasets(datasetResponse.datasets);
        setSelectedDatasetId(dataset.id);
        setVersions(versionResponse.versions);
        setSelectedVersionId(versionResponse.versions[0]?.id ?? '');
        setSourceState('api');
        setActionState({ busy: false, message: 'Dataset API synchronized.', error: null });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSourceState('fallback');
        setDatasets(fallbackDatasets);
        setSelectedDatasetId(fallbackDatasetId);
        setVersions(fallbackVersions);
        setSelectedVersionId(fallbackVersions[0]?.id ?? '');
        setActionState({
          busy: false,
          message: null,
          error: error instanceof Error ? error.message : 'Dataset API unavailable.',
        });
      }
    }

    void loadDatasets();

    return () => {
      cancelled = true;
    };
    // Initial API handshake only. Local fallback state remains interactive after load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions]
  );
  const selectedDataset =
    datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0];
  const selectedVersion =
    sortedVersions.find((version) => version.id === selectedVersionId) ?? sortedVersions[0];
  const draftVersion =
    selectedVersion?.status === 'DRAFT'
      ? selectedVersion
      : sortedVersions.find((version) => version.status === 'DRAFT');
  const selectedAssetRows = mediaRows.filter((row) => selectedAssetIds.includes(row.id));
  const canAssign = Boolean(draftVersion) && selectedAssetRows.length > 0 && !actionState.busy;
  const canLock = selectedVersion?.status === 'DRAFT' && !actionState.busy;

  const replaceVersion = (version: DatasetVersionSummary) => {
    setVersions((current) => {
      const next = [version, ...current.filter((item) => item.id !== version.id)].sort(
        (a, b) => b.version - a.version
      );
      setDatasets((datasetState) =>
        datasetState.map((dataset) =>
          dataset.id === version.datasetId ? recalculateDatasetCounts(dataset, next) : dataset
        )
      );
      return next;
    });
    setSelectedVersionId(version.id);
  };

  const handleCreateDraft = async () => {
    setActionState({ busy: true, message: null, error: null });

    try {
      let dataset = selectedDataset;

      if (!dataset && sourceState === 'api') {
        dataset = await createDataset(projectId, {
          name: 'Parking Lot Dataset',
          description: 'Curated parking lot frames for detector evaluation.',
        });
        setDatasets([dataset]);
        setSelectedDatasetId(dataset.id);
      }

      if (!dataset) {
        throw new Error('No dataset target available.');
      }

      const parentVersionId = sortedVersions[0]?.id ?? null;
      const version =
        sourceState === 'api'
          ? await createDatasetVersion(projectId, dataset.id, { parentVersionId })
          : createLocalDraftVersion(dataset.id, sortedVersions);

      replaceVersion(version);
      setActionState({ busy: false, message: `${version.label} draft created.`, error: null });
    } catch (error) {
      setActionState({
        busy: false,
        message: null,
        error: error instanceof Error ? error.message : 'Draft creation failed.',
      });
    }
  };

  const handleAssignAssets = async () => {
    if (!draftVersion) {
      return;
    }

    setActionState({ busy: true, message: null, error: null });

    try {
      const assets = selectedAssetRows.map((row) => ({
        assetId: row.id,
        split: targetSplit,
      }));
      const version =
        sourceState === 'api'
          ? await assignDatasetVersionAssets(projectId, draftVersion.id, { assets })
          : assignLocalAssets(draftVersion, assets, localAssignments[draftVersion.id] ?? []);

      if (sourceState !== 'api') {
        setLocalAssignments((current) => ({
          ...current,
          [draftVersion.id]: [
            ...(current[draftVersion.id] ?? []),
            ...assets.map((asset) => asset.assetId),
          ],
        }));
      }

      replaceVersion(version);
      setActionState({
        busy: false,
        message: `${assets.length} asset${assets.length === 1 ? '' : 's'} assigned to ${version.label}.`,
        error: null,
      });
    } catch (error) {
      setActionState({
        busy: false,
        message: null,
        error: error instanceof Error ? error.message : 'Asset assignment failed.',
      });
    }
  };

  const handleLockVersion = async () => {
    if (!selectedVersion) {
      return;
    }

    setActionState({ busy: true, message: null, error: null });

    try {
      const version =
        sourceState === 'api'
          ? (await lockDatasetVersion(projectId, selectedVersion.id)).version
          : { ...selectedVersion, status: 'LOCKED' as const };

      replaceVersion(version);
      setActionState({ busy: false, message: `${version.label} locked.`, error: null });
    } catch (error) {
      setActionState({
        busy: false,
        message: null,
        error: error instanceof Error ? error.message : 'Version lock failed.',
      });
    }
  };

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId]
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.86fr)_minmax(380px,1.14fr)]">
      <Panel className="overflow-hidden">
        <div className="divider flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Dataset timeline</h2>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              {selectedDataset?.name ?? 'No dataset'} / {sortedVersions.length} versions
            </p>
          </div>
          <DatasetSourcePill state={sourceState} />
        </div>
        <div className="divider px-4 py-3">
          <DatasetSourceNotice state={sourceState} error={actionState.error} />
        </div>
        <div className="p-4">
          <div className="relative space-y-3 pl-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
            {sortedVersions.map((version, index) => {
              const selected = version.id === selectedVersion?.id;

              return (
                <motion.button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={[
                    'version-card relative w-full rounded-md p-3 text-left transition focus-visible:outline-none active:translate-y-px',
                    selected ? 'version-card-selected' : '',
                  ].join(' ')}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.025, duration: motionTokens.durationFast }}
                >
                  <span
                    className={[
                      'absolute -left-[18px] top-4 h-3 w-3 rounded-full border bg-graphite-950',
                      version.status === 'DRAFT' ? 'border-amber-300' : 'border-signal-300',
                    ].join(' ')}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-neutral-100">
                      {version.label}
                    </span>
                    <DatasetStatusPill status={version.status} />
                  </div>
                  <p className="mt-2 font-mono text-xs text-neutral-500">
                    {version.assetCount} assets / parent {version.parentVersionId ?? 'none'}
                  </p>
                  <div className="mt-3">
                    <SplitSummaryBars summary={version.splitSummary} compact />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel className="version-builder-panel overflow-hidden">
        <div className="divider flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Version builder</h2>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              {selectedVersion
                ? `${selectedVersion.label} / ${selectedVersion.status}`
                : 'No version'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              title="Create draft"
              aria-label="Create draft"
              onClick={handleCreateDraft}
              disabled={actionState.busy}
              className="version-header-action version-header-action-muted"
            >
              <GitBranch size={16} />
              New draft
            </button>
            <button
              type="button"
              title="Lock version"
              aria-label="Lock version"
              onClick={handleLockVersion}
              disabled={!canLock}
              className="version-header-action version-header-action-lock"
            >
              <CheckCircle size={16} weight="duotone" />
              Lock version
            </button>
          </div>
        </div>

        {selectedVersion ? (
          <>
            <div className="divider grid gap-3 p-4 md:grid-cols-4">
              <DatasetMetric label="assets" value={selectedVersion.assetCount} tone="signal" />
              <DatasetMetric
                label="train"
                value={selectedVersion.splitSummary.TRAIN}
                tone="signal"
              />
              <DatasetMetric label="valid" value={selectedVersion.splitSummary.VALID} tone="scan" />
              <DatasetMetric label="test" value={selectedVersion.splitSummary.TEST} tone="amber" />
            </div>
            <div className="divider p-4">
              <SplitSummaryBars summary={selectedVersion.splitSummary} />
            </div>
          </>
        ) : (
          <p className="divider p-4 text-sm text-neutral-500">No dataset version available.</p>
        )}

        <div className="version-builder-grid">
          <div className="version-assets-scroll">
            <table className="version-assets-table w-full border-collapse text-sm">
              <thead className="bg-white/[0.025] text-left font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="version-select-cell px-4 py-3 font-medium">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Current split</th>
                  <th className="px-4 py-3 font-medium">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-200">
                {mediaRows.slice(0, 6).map((asset) => {
                  const selectedAsset = selectedAssetIds.includes(asset.id);

                  return (
                    <tr
                      key={asset.id}
                      className={[
                        'version-asset-row text-neutral-300',
                        selectedAsset ? 'version-asset-row-selected' : '',
                      ].join(' ')}
                    >
                      <td className="version-select-cell px-4 py-3">
                        <label className="asset-select-control">
                          <input
                            type="checkbox"
                            aria-label={`Select ${asset.name}`}
                            checked={selectedAsset}
                            onChange={() => toggleAsset(asset.id)}
                            className="sr-only"
                          />
                          <span
                            className={[
                              'asset-select-box',
                              selectedAsset ? 'asset-select-box-selected' : '',
                            ].join(' ')}
                            aria-hidden="true"
                          />
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-100">{asset.name}</p>
                        <p className="font-mono text-xs text-neutral-500">{asset.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <SplitPill split={asset.split} />
                      </td>
                      <td className="px-4 py-3">
                        <MediaStatusPill status={asset.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="version-builder-actions divider-top p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Assign split</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {datasetSplits.map((split) => (
                <button
                  key={split}
                  type="button"
                  aria-pressed={targetSplit === split}
                  onClick={() => setTargetSplit(split)}
                  className={[
                    'version-split-option',
                    targetSplit === split ? 'version-split-option-selected' : '',
                  ].join(' ')}
                >
                  {split}
                </button>
              ))}
            </div>
            <button
              type="button"
              title="Assign to draft"
              aria-label="Assign to draft"
              onClick={handleAssignAssets}
              disabled={!canAssign}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-signal-300 px-3 py-2 text-sm font-semibold text-graphite-950 transition hover:bg-signal-400 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Stack size={16} weight="duotone" />
              Assign to draft
            </button>
            <p className="mt-3 font-mono text-xs text-neutral-500">
              Target {draftVersion?.label ?? 'none'} / {selectedAssetRows.length} selected
            </p>
            <AnimatePresence mode="popLayout">
              {actionState.message || actionState.error ? (
                <motion.p
                  key={actionState.message ?? actionState.error}
                  className={[
                    'version-action-message',
                    actionState.error
                      ? 'version-action-message-error'
                      : 'version-action-message-ok',
                  ].join(' ')}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: motionTokens.durationFast }}
                >
                  {actionState.error ?? actionState.message}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function DatasetSourcePill({ state }: { state: DatasetSourceState }) {
  const tone = state === 'api' ? 'pill-signal' : state === 'loading' ? 'pill-scan' : 'pill-amber';

  return <span className={`pill-base ${tone}`}>{state === 'api' ? 'api' : state}</span>;
}

function DatasetSourceNotice({
  state,
  error,
}: {
  state: DatasetSourceState;
  error: string | null;
}) {
  const Icon = state === 'api' ? CheckCircle : state === 'loading' ? Activity : WarningCircle;
  const tone =
    state === 'api' ? 'text-signal-300' : state === 'loading' ? 'text-scan-300' : 'text-amber-300';
  const text =
    state === 'api'
      ? 'API-backed dataset versions'
      : state === 'loading'
        ? 'Syncing dataset versions'
        : error
          ? `Local demo fallback: ${error}`
          : 'Local demo fallback';

  return (
    <div className="flex items-start gap-2">
      <Icon className={tone} size={17} weight="duotone" />
      <p className="min-w-0 text-sm text-neutral-400">{text}</p>
    </div>
  );
}

function DatasetStatusPill({ status }: { status: DatasetVersionSummary['status'] }) {
  const tone =
    status === 'LOCKED'
      ? 'dataset-version-pill-locked'
      : status === 'DRAFT'
        ? 'dataset-version-pill-draft'
        : 'dataset-version-pill-neutral';

  return <span className={`dataset-version-pill ${tone}`}>{status}</span>;
}

function DatasetMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'signal' | 'scan' | 'amber';
}) {
  const toneClass =
    tone === 'signal' ? 'text-signal-300' : tone === 'scan' ? 'text-scan-300' : 'text-amber-300';

  return (
    <div className="inner-border-subtle rounded-md bg-white/[0.03] p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function SplitSummaryBars({
  summary,
  compact = false,
}: {
  summary: SplitSummary;
  compact?: boolean;
}) {
  const total = Math.max(
    1,
    datasetSplits.reduce((sum, split) => sum + summary[split], 0)
  );
  const segments: Array<{ split: DatasetSplit; className: string; label: string }> = [
    { split: 'TRAIN', className: 'bg-signal-300', label: 'train' },
    { split: 'VALID', className: 'bg-scan-300', label: 'valid' },
    { split: 'TEST', className: 'bg-amber-300', label: 'test' },
    { split: 'UNASSIGNED', className: 'bg-neutral-500', label: 'open' },
  ];

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        {segments.map((segment) => {
          const count = summary[segment.split];

          return count > 0 ? (
            <span
              key={segment.split}
              className={segment.className}
              style={{ width: `${(count / total) * 100}%` }}
            />
          ) : null;
        })}
      </div>
      {!compact && (
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {segments.map((segment) => (
            <div key={segment.split} className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                {segment.label}
              </span>
              <span className="font-mono text-xs text-neutral-300">{summary[segment.split]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function createFallbackDatasetId(projectId: string): string {
  return `dataset_${projectId.replace(/[^a-zA-Z0-9]+/g, '_')}_parking`;
}

function createFallbackDatasets(
  projectId: string,
  datasetId: string,
  mediaRows: MediaUploadRow[]
): DatasetSummary[] {
  const versions = createFallbackVersions(datasetId, mediaRows);

  return [
    recalculateDatasetCounts(
      {
        id: datasetId,
        projectId,
        name: 'Parking Lot Dataset',
        description: 'Curated media grouped into immutable detector evaluation snapshots.',
        versionCount: versions.length,
        draftVersionCount: 1,
        lockedVersionCount: 3,
        assetCount: mediaRows.length,
        createdAt: '2026-04-28T12:00:00.000Z',
      },
      versions
    ),
  ];
}

function createFallbackVersions(
  datasetId: string,
  mediaRows: MediaUploadRow[]
): DatasetVersionSummary[] {
  const indexableRows = mediaRows.filter((row) => row.status !== 'failed');
  const v1Rows = indexableRows.slice(0, 1);
  const v2Rows = indexableRows.slice(0, 2);
  const v3Rows = indexableRows.slice(0, 3);

  return [
    createVersionSummary(datasetId, 4, 'DRAFT', `${datasetId}_v3`, []),
    createVersionSummary(datasetId, 3, 'LOCKED', `${datasetId}_v2`, v3Rows),
    createVersionSummary(datasetId, 2, 'LOCKED', `${datasetId}_v1`, v2Rows),
    createVersionSummary(datasetId, 1, 'LOCKED', null, v1Rows),
  ];
}

function createVersionSummary(
  datasetId: string,
  version: number,
  status: DatasetVersionSummary['status'],
  parentVersionId: string | null,
  rows: MediaUploadRow[]
): DatasetVersionSummary {
  return {
    id: `${datasetId}_v${version}`,
    datasetId,
    version,
    label: `v${version}`,
    status,
    parentVersionId,
    assetCount: rows.length,
    splitSummary:
      rows.length > 0
        ? summarizeDatasetSplits(rows.map((row) => ({ split: normalizeDatasetSplit(row.split) })))
        : createEmptySplitSummary(),
    createdAt: new Date(2026, 3, 28, 12, version * 7).toISOString(),
  };
}

function createLocalDraftVersion(
  datasetId: string,
  versions: DatasetVersionSummary[]
): DatasetVersionSummary {
  const latest = versions.reduce((max, version) => Math.max(max, version.version), 0);

  return {
    id: `${datasetId}_v${latest + 1}_${Date.now()}`,
    datasetId,
    version: latest + 1,
    label: `v${latest + 1}`,
    status: 'DRAFT',
    parentVersionId: versions[0]?.id ?? null,
    assetCount: 0,
    splitSummary: createEmptySplitSummary(),
    createdAt: new Date().toISOString(),
  };
}

function assignLocalAssets(
  version: DatasetVersionSummary,
  assets: Array<{ assetId: string; split: DatasetSplit }>,
  existingAssetIds: string[]
): DatasetVersionSummary {
  if (version.status !== 'DRAFT') {
    throw new Error('Version is locked and cannot be modified.');
  }

  if (assets.some((asset) => existingAssetIds.includes(asset.assetId))) {
    throw new Error('Assets cannot be assigned twice to the same version.');
  }

  const splitSummary = { ...version.splitSummary };

  assets.forEach((asset) => {
    splitSummary[asset.split] += 1;
  });

  return {
    ...version,
    assetCount: version.assetCount + assets.length,
    splitSummary,
  };
}

function recalculateDatasetCounts(
  dataset: DatasetSummary,
  versions: DatasetVersionSummary[]
): DatasetSummary {
  const ownVersions = versions.filter((version) => version.datasetId === dataset.id);

  return {
    ...dataset,
    versionCount: ownVersions.length,
    draftVersionCount: ownVersions.filter((version) => version.status === 'DRAFT').length,
    lockedVersionCount: ownVersions.filter((version) => version.status === 'LOCKED').length,
    assetCount: ownVersions.reduce((max, version) => Math.max(max, version.assetCount), 0),
  };
}

function normalizeDatasetSplit(split: string): DatasetSplit {
  return datasetSplits.includes(split as DatasetSplit) ? (split as DatasetSplit) : 'UNASSIGNED';
}

function AnnotationPanel({
  selectedAnnotation,
  setSelectedAnnotation,
  threshold,
  setThreshold,
}: {
  selectedAnnotation: string;
  setSelectedAnnotation: (id: string) => void;
  threshold: number;
  setThreshold: (value: number) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="overflow-hidden">
        <div className="divider flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Annotation workbench</h2>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              image coordinates, 1920 x 1080
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ToolButton label="Pan" icon={SlidersHorizontal} active />
            <ToolButton label="BBox" icon={BoundingBox} active={false} />
          </div>
        </div>
        <VisionPreview
          selectedAnnotation={selectedAnnotation}
          onSelectAnnotation={setSelectedAnnotation}
        />
      </Panel>
      <Panel>
        <div className="divider px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Labels</h2>
        </div>
        <div className="divide-y divide-graphite-200">
          {demoSnapshot.annotations.map((annotation) => (
            <button
              key={annotation.id}
              type="button"
              onClick={() => setSelectedAnnotation(annotation.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04] active:translate-y-px"
            >
              <span>
                <span className="block text-sm font-medium text-neutral-100">
                  {annotation.label}
                </span>
                <span className="font-mono text-xs text-neutral-500">{annotation.id}</span>
              </span>
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: annotation.color }} />
            </button>
          ))}
        </div>
        <div className="divider-top p-4">
          <label className="block text-sm font-medium text-neutral-200" htmlFor="threshold">
            Confidence threshold
          </label>
          <input
            id="threshold"
            type="range"
            min="40"
            max="95"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="mt-3 w-full accent-[oklch(80%_0.13_152)]"
          />
          <p className="mt-2 font-mono text-xs text-neutral-500">{(threshold / 100).toFixed(2)}</p>
        </div>
      </Panel>
    </div>
  );
}

function PipelinePanel({
  selectedNodeId: externalSelectedNodeId,
  onSelectNode,
  definition: externalDefinition,
  onDefinitionChange,
  validation: externalValidation,
  onValidationChange,
}: {
  selectedNodeId?: string;
  onSelectNode?: (id: string) => void;
  definition?: PipelineDefinition;
  onDefinitionChange?: (d: PipelineDefinition) => void;
  validation?: PipelineValidationResult;
  onValidationChange?: (v: PipelineValidationResult) => void;
}) {
  const projectId = demoSnapshot.project.id;
  const shouldReduceMotion = useReducedMotion();
  const compactPipeline = useCompactPipelineLayout();
  const [sourceState, setSourceState] = useState<PipelineSourceState>('loading');
  const [pipeline, setPipeline] = useState<PipelineSummary | null>(null);
  const [definition, _setDefinition] = useState(externalDefinition ?? demoSnapshot.pipeline);

  const setDefinition = (
    d: PipelineDefinition | ((prev: PipelineDefinition) => PipelineDefinition)
  ) => {
    if (typeof d === 'function') {
      _setDefinition((prev) => {
        const next = d(prev);
        onDefinitionChange?.(next);
        return next;
      });
    } else {
      _setDefinition(d);
      onDefinitionChange?.(d);
    }
  };

  const [validation, _setValidation] = useState<PipelineValidationResult>(
    externalValidation ?? validatePipelineDefinition(demoSnapshot.pipeline)
  );

  const setValidation = (v: PipelineValidationResult) => {
    _setValidation(v);
    onValidationChange?.(v);
  };

  const [selectedNodeId, _setSelectedNodeId] = useState(externalSelectedNodeId ?? 'detector');

  const setSelectedNodeId = (id: string) => {
    _setSelectedNodeId(id);
    onSelectNode?.(id);
  };
  const [actionState, setActionState] = useState<DatasetActionState>({
    busy: false,
    message: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPipelines() {
      setSourceState('loading');

      try {
        const response = await listProjectPipelines(projectId);

        if (cancelled) {
          return;
        }

        const persistedPipeline = response.pipelines[0] ?? null;

        if (!persistedPipeline) {
          setSourceState('api');
          setActionState({
            busy: false,
            message: 'API ready for first persisted graph.',
            error: null,
          });
          return;
        }

        setPipeline(persistedPipeline);
        setDefinition(persistedPipeline.definition);
        setValidation(persistedPipeline.validation);
        setSourceState('api');
        setActionState({
          busy: false,
          message: 'Pipeline API synchronized.',
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSourceState('fallback');
        setPipeline(null);
        setDefinition(demoSnapshot.pipeline);
        setValidation(validatePipelineDefinition(demoSnapshot.pipeline));
        setActionState({
          busy: false,
          message: null,
          error: error instanceof Error ? error.message : 'Pipeline API unavailable.',
        });
      }
    }

    void loadPipelines();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setValidation(validatePipelineDefinition(definition));
  }, [definition]);

  const selectedNode =
    definition.nodes.find((item) => item.id === selectedNodeId) ?? definition.nodes[0] ?? null;
  const nodes = useMemo<FlowNode[]>(
    () =>
      definition.nodes.map((item, index) =>
        pipelineNode(item, index, compactPipeline, {
          selected: item.id === selectedNode?.id,
          hasIssue: validation.issues.some((issue) => issue.nodeId === item.id),
        })
      ),
    [compactPipeline, definition.nodes, selectedNode?.id, validation.issues]
  );

  const edges = useMemo<FlowEdge[]>(
    () =>
      definition.edges.map((item) =>
        pipelineEdge(
          item.id,
          item.source,
          item.target,
          isDetectorPath(item, definition),
          validation.issues.some((issue) => issue.edgeId === item.id)
        )
      ),
    [definition, validation.issues]
  );
  const canSave = validation.ok && !actionState.busy && sourceState !== 'loading';

  const updateNode = (nodeId: string, updater: (node: PipelineNode) => PipelineNode) => {
    setDefinition((current) => ({
      ...current,
      nodes: current.nodes.map((item) => (item.id === nodeId ? updater(item) : item)),
    }));
    setActionState({ busy: false, message: 'Graph draft changed.', error: null });
  };

  const handleValidateGraph = async () => {
    setActionState({ busy: true, message: null, error: null });

    try {
      const nextValidation =
        sourceState === 'api'
          ? (await validateProjectPipeline(projectId, { definition })).validation
          : validatePipelineDefinition(definition);

      setValidation(nextValidation);
      setActionState({
        busy: false,
        message: nextValidation.ok
          ? 'Backend validation passed.'
          : `${nextValidation.errors.length} graph blocker${
              nextValidation.errors.length === 1 ? '' : 's'
            } found.`,
        error: null,
      });
    } catch (error) {
      setActionState({
        busy: false,
        message: null,
        error: error instanceof Error ? error.message : 'Pipeline validation failed.',
      });
    }
  };

  const handleSaveGraph = async () => {
    setActionState({ busy: true, message: null, error: null });

    try {
      const nextValidation =
        sourceState === 'api'
          ? (await validateProjectPipeline(projectId, { definition })).validation
          : validatePipelineDefinition(definition);

      setValidation(nextValidation);

      if (!nextValidation.ok) {
        setActionState({
          busy: false,
          message: null,
          error: 'Resolve graph blockers before saving.',
        });
        return;
      }

      if (sourceState === 'api') {
        const saved = pipeline
          ? await updateProjectPipeline(projectId, pipeline.id, {
              name: pipeline.name,
              definition,
            })
          : await createProjectPipeline(projectId, {
              name: 'Parking detector pipeline',
              definition,
            });

        setPipeline(saved);
        setDefinition(saved.definition);
        setValidation(saved.validation);
        setActionState({ busy: false, message: 'Pipeline persisted.', error: null });
        return;
      }

      const now = new Date().toISOString();
      setPipeline({
        id: pipeline?.id ?? 'pipeline_local_parking_detector',
        projectId,
        name: pipeline?.name ?? 'Parking detector pipeline',
        definition,
        validation: nextValidation,
        createdAt: pipeline?.createdAt ?? now,
        updatedAt: now,
      });
      setActionState({
        busy: false,
        message: 'Local graph saved in fallback state.',
        error: null,
      });
    } catch (error) {
      setActionState({
        busy: false,
        message: null,
        error: error instanceof Error ? error.message : 'Pipeline save failed.',
      });
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_320px]">
      <Panel className="pipeline-panel overflow-hidden">
        <div className="divider flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Visual pipeline</h2>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              {pipeline?.name ?? 'Parking detector pipeline'} / {validation.summary.nodeCount} nodes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PipelineSourcePill state={sourceState} />
            <button
              type="button"
              title="Validate graph"
              aria-label="Validate graph"
              onClick={handleValidateGraph}
              disabled={actionState.busy || sourceState === 'loading'}
              className="version-header-action version-header-action-muted"
            >
              <CheckCircle size={16} />
              Validate
            </button>
            <button
              type="button"
              title="Save pipeline"
              aria-label="Save pipeline"
              onClick={handleSaveGraph}
              disabled={!canSave}
              className="version-header-action version-header-action-lock"
            >
              <Database size={16} weight="duotone" />
              Save
            </button>
          </div>
        </div>
        <div className="divider px-4 py-3">
          <PipelineSourceNotice state={sourceState} error={actionState.error} />
        </div>
        <div className="pipeline-canvas h-[560px] bg-graphite-950">
          <ReactFlow
            key={compactPipeline ? 'pipeline-compact' : 'pipeline-wide'}
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, item) => setSelectedNodeId(item.id)}
            fitView
            fitViewOptions={{ padding: compactPipeline ? 0.12 : 0.08 }}
            minZoom={0.2}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
          >
            <Background color="rgba(255,255,255,0.08)" gap={22} size={1} />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>
      </Panel>

      {/* Contextual PipelineInspector — shows selected node params and graph checks */}
      <PipelineInspector
        selectedNode={selectedNode}
        validation={validation}
        onValidate={handleValidateGraph}
        onSave={canSave ? handleSaveGraph : undefined}
        onClearModel={
          selectedNode?.type === 'yolo_onnx'
            ? () =>
                updateNode(selectedNode.id, (node) =>
                  node.type === 'yolo_onnx'
                    ? { ...node, params: { ...node.params, modelId: null } }
                    : node
                )
            : undefined
        }
      />
    </div>
  );
}

function PipelineSourcePill({ state }: { state: PipelineSourceState }) {
  const tone = state === 'api' ? 'pill-signal' : state === 'loading' ? 'pill-scan' : 'pill-amber';

  return <span className={`pill-base ${tone}`}>{state === 'api' ? 'api' : state}</span>;
}

function PipelineSourceNotice({
  state,
  error,
}: {
  state: PipelineSourceState;
  error: string | null;
}) {
  const Icon = state === 'api' ? CheckCircle : state === 'loading' ? Activity : WarningCircle;
  const tone =
    state === 'api' ? 'text-signal-300' : state === 'loading' ? 'text-scan-300' : 'text-amber-300';
  const text =
    state === 'api'
      ? 'API-backed pipeline definitions'
      : state === 'loading'
        ? 'Syncing pipeline definitions'
        : error
          ? `Local demo fallback: ${error}`
          : 'Local demo fallback';

  return (
    <div className="flex items-start gap-2">
      <Icon className={tone} size={17} weight="duotone" />
      <p className="min-w-0 text-sm text-neutral-400">{text}</p>
    </div>
  );
}

function PipelineMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'signal' | 'scan' | 'amber';
}) {
  const toneClass =
    tone === 'signal' ? 'text-signal-300' : tone === 'scan' ? 'text-scan-300' : 'text-amber-300';

  return (
    <div className="inner-border-subtle rounded-md bg-white/[0.03] p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={`mt-2 font-mono text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function PipelineIssueRow({ issue }: { issue: PipelineValidationIssue }) {
  return (
    <StateRow
      label={issue.severity === 'error' ? 'Blocker' : 'Warning'}
      value={issue.message}
      tone={issue.severity === 'error' ? 'amber' : 'neutral'}
      icon={issue.severity === 'error' ? WarningCircle : Activity}
    />
  );
}

function PipelineNodeInspector({
  node,
  shouldReduceMotion,
  onResizeWidthChange,
  onDetectorThresholdChange,
  onDetectorModelChange,
  onNmsThresholdChange,
}: {
  node: PipelineNode | null;
  shouldReduceMotion: boolean;
  onResizeWidthChange: (width: number) => void;
  onDetectorThresholdChange: (threshold: number) => void;
  onDetectorModelChange: (modelId: string | null) => void;
  onNmsThresholdChange: (iouThreshold: number) => void;
}) {
  if (!node) {
    return <p className="p-4 text-sm text-neutral-500">No node selected.</p>;
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">{nodeLabel(node)}</h3>
          <p className="mt-1 font-mono text-xs text-neutral-500">{node.id}</p>
        </div>
        <span className="inner-border-subtle rounded-md bg-white/[0.035] px-2 py-1 font-mono text-xs uppercase text-neutral-400">
          {node.type}
        </span>
      </div>

      {node.type === 'resize' && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[640, 960, 1280].map((width) => (
            <button
              key={width}
              type="button"
              aria-pressed={node.params.width === width}
              onClick={() => onResizeWidthChange(width)}
              className={[
                'version-split-option',
                node.params.width === width ? 'version-split-option-selected' : '',
              ].join(' ')}
            >
              {width}
            </button>
          ))}
        </div>
      )}

      {node.type === 'yolo_onnx' && (
        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-200">Confidence</span>
              <span className="font-mono text-xs text-signal-300">
                {node.params.threshold.toFixed(2)}
              </span>
            </div>
            <input
              aria-label="Detector confidence"
              type="range"
              min="25"
              max="95"
              value={Math.round(node.params.threshold * 100)}
              onChange={(event) => onDetectorThresholdChange(Number(event.target.value) / 100)}
              style={thresholdRangeStyle(Math.round(node.params.threshold * 100), 25, 95)}
              className="threshold-range"
            />
          </div>
          <button
            type="button"
            onClick={() => onDetectorModelChange(node.params.modelId ? null : 'model_onnx_parking')}
            className="version-header-action version-header-action-muted w-full justify-center"
          >
            <Database size={16} />
            {node.params.modelId ? 'Clear model' : 'Bind ONNX model'}
          </button>
        </div>
      )}

      {node.type === 'nms' && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-neutral-200">IoU threshold</span>
            <span className="font-mono text-xs text-scan-300">
              {node.params.iouThreshold.toFixed(2)}
            </span>
          </div>
          <input
            aria-label="NMS IoU threshold"
            type="range"
            min="20"
            max="80"
            value={Math.round(node.params.iouThreshold * 100)}
            onChange={(event) => onNmsThresholdChange(Number(event.target.value) / 100)}
            style={thresholdRangeStyle(Math.round(node.params.iouThreshold * 100), 20, 80)}
            className="threshold-range"
          />
        </div>
      )}

      {node.type === 'input' || node.type === 'output' || node.type === 'hsv_filter' ? (
        <p className="mt-4 text-sm leading-6 text-neutral-500">{nodeCaption(node)}</p>
      ) : null}

      {shouldReduceMotion && (
        <p className="inner-border-subtle mt-4 rounded-md bg-white/[0.025] px-3 py-2 text-sm text-neutral-500">
          Reduced motion is active.
        </p>
      )}
    </div>
  );
}

function useCompactPipelineLayout(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setCompact(media.matches);

    update();
    media.addEventListener('change', update);

    return () => media.removeEventListener('change', update);
  }, []);

  return compact;
}

function JobsPanel({
  job,
  threshold,
  onRun,
  evaluationReport,
  isEvaluating,
  evaluationError,
  predictions,
  groundTruth,
  onRunEvaluation,
  evaluationEligibility,
  inferenceEligibility,
  onOpenVersions,
}: {
  job: JobUiState;
  threshold: number;
  onRun: () => void;
  evaluationReport: EvaluationReport | null;
  isEvaluating: boolean;
  evaluationError: string | null;
  predictions: PredictionSummary[];
  groundTruth: AnnotationSummary[];
  onRunEvaluation: () => void;
  evaluationEligibility: { ok: boolean; reason: string | null };
  inferenceEligibility: { ok: boolean; reason: string | null };
  onOpenVersions: () => void;
}) {
  const jobFailed = job.status === 'FAILED';
  const jobRunning = job.status === 'RUNNING';
  const showPipelineExecution = job.status === 'RUNNING' || job.status === 'SUCCEEDED';
  const isRunDisabled = !inferenceEligibility.ok || jobRunning || job.status === 'QUEUED';

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Panel>
        <div className="divider flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-100">Inference job</h2>
            <p className="mt-1 truncate font-mono text-xs text-neutral-500">{job.id}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <JobSourcePill source={job.source} />
            <button
              type="button"
              title={
                isRunDisabled && inferenceEligibility.reason
                  ? inferenceEligibility.reason
                  : jobFailed && job.error
                    ? job.error
                    : 'Queue inference job'
              }
              aria-label="Queue inference job"
              onClick={onRun}
              disabled={isRunDisabled}
              className="version-header-action version-header-action-lock"
            >
              <Play size={16} weight="fill" />
              Run
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <StatusPill status={job.status} />
            <span className="font-mono text-sm text-neutral-300">{job.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-signal-300"
              initial={false}
              animate={{ width: `${job.progress}%` }}
              transition={motionTokens.springSoft}
            />
          </div>
          {jobFailed && job.error ? (
            <FailedJobErrorState
              reason={job.error}
              onRetry={onRun}
              onOpenVersions={onOpenVersions}
            />
          ) : job.error ? (
            <p className="version-action-message version-action-message-error mt-4">{job.error}</p>
          ) : null}
          <div className="inner-border-subtle mt-5 rounded-md bg-graphite-950 p-3 font-mono text-xs text-neutral-400">
            {job.logs.length > 0 ? (
              job.logs.map((line, index) => (
                <motion.p
                  key={`${line}-${index}`}
                  className="py-1"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: motionTokens.durationFast }}
                >
                  {line}
                </motion.p>
              ))
            ) : (
              <p className="py-1 text-neutral-500">No worker logs yet.</p>
            )}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <JobStageStep label="Queued" active={job.progress >= 0} complete={job.progress > 8} />
            <JobStageStep label="Worker" active={job.progress >= 8} complete={job.progress >= 84} />
            <JobStageStep
              label="Complete"
              active={job.progress === 100}
              complete={job.status === 'SUCCEEDED'}
            />
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="divider px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Prediction overlay</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {jobFailed
              ? 'Overlay hidden — inference failed.'
              : jobRunning
                ? 'Running inference...'
                : `Ground truth and detector boxes at threshold ${(threshold / 100).toFixed(2)}.`}
          </p>
        </div>
        <PredictionOverlayCanvas
          groundTruth={jobFailed || jobRunning ? [] : groundTruth}
          predictions={jobFailed || jobRunning ? [] : predictions}
          isLoading={jobRunning}
          error={jobFailed ? (job.error ?? 'Inference failed.') : null}
        />
      </Panel>

      <Panel className="overflow-hidden">
        <div className="divider px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Evaluation</h2>
          <p className="mt-1 font-mono text-xs text-neutral-500">
            {evaluationReport
              ? `Precision ${evaluationReport.precision.toFixed(3)} / Recall ${evaluationReport.recall.toFixed(3)}`
              : 'No evaluation run yet'}
          </p>
        </div>
        <div className="p-4">
          {!evaluationEligibility.ok && evaluationEligibility.reason && (
            <div className="mb-3">
              <ActionHint
                label="Evaluation disabled"
                description={evaluationEligibility.reason}
                tone="amber"
              />
            </div>
          )}
          <EvaluationMetricsPanel
            report={evaluationReport}
            isLoading={false}
            error={evaluationError}
            onRunEvaluation={evaluationEligibility.ok ? onRunEvaluation : () => {}}
            isEvaluating={isEvaluating}
          />
        </div>
      </Panel>

      {/* PipelineExecutionFlow: only shown when running or succeeded — NOT when failed */}
      {showPipelineExecution && (
        <Panel className="overflow-hidden">
          <PipelineExecutionFlow />
        </Panel>
      )}
    </div>
  );
}

function JobSourcePill({ source }: { source: JobSourceState }) {
  const tone = source === 'api' ? 'pill-signal' : source === 'loading' ? 'pill-scan' : 'pill-amber';

  return <span className={`pill-base ${tone}`}>{source}</span>;
}

function JobStageStep({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={[complete ? 'step-complete' : active ? 'step-active' : 'step-inactive'].join(' ')}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em]">{label}</p>
    </div>
  );
}

function thresholdRangeStyle(value: number, min = 40, max = 95): CSSProperties {
  return {
    '--threshold-progress': `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`,
  } as CSSProperties;
}

function VisionPreview({
  selectedAnnotation = 'ann_02',
  onSelectAnnotation,
  running = false,
}: {
  selectedAnnotation?: string;
  onSelectAnnotation?: (id: string) => void;
  running?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="vision-stage relative min-h-[420px] overflow-hidden bg-graphite-950">
      <div className="bg-[radial-gradient(circle_at_28%_22%,rgba(106,217,161,0.12),transparent_32%)]} absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,13,12,0.88),transparent_30%),linear-gradient(to_bottom,transparent_0%,rgba(5,13,12,0.4)_12%),linear-gradient(to_left,rgba(5,13,12,0.88),transparent_18%),linear-gradient(to_right,rgba(5,13,12,0.88),transparent_18%)]" />
      <div
        className="absolute left-[8%] top-[22%] h-[42%] w-[84%]"
        style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)' }}
      >
        <div className="absolute inset-x-0 top-[55%] border-t border-dashed border-graphite-100" />
        <div className="absolute bottom-[18%] left-[7%] h-[12%] w-[86%] rounded-sm bg-white/[0.025]" />
        {demoSnapshot.annotations.map((annotation) => {
          const selected = annotation.id === selectedAnnotation;
          const style = {
            left: `${(annotation.geometry.x / 1920) * 100}%`,
            top: `${(annotation.geometry.y / 1080) * 100}%`,
            width: `${(annotation.geometry.width / 1920) * 100}%`,
            height: `${(annotation.geometry.height / 1080) * 100}%`,
            borderColor: annotation.color,
          };

          return (
            <motion.button
              key={annotation.id}
              type="button"
              title={annotation.label}
              aria-label={annotation.label}
              onClick={() => onSelectAnnotation?.(annotation.id)}
              className={[
                'bbox absolute rounded-sm border-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-signal-300',
                selected ? 'bbox-selected' : '',
              ].join(' ')}
              style={style}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: selected ? 1.02 : 1 }}
              transition={motionTokens.springSoft}
            >
              <span
                className="absolute -top-6 left-0 rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-950"
                style={{ backgroundColor: annotation.color }}
              >
                {annotation.label}
              </span>
            </motion.button>
          );
        })}
        {(running || !shouldReduceMotion) && <div className="scanline" />}
      </div>
      <div className="inner-border-subtle bg-graphite-950/80 absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 backdrop-blur">
        <span className="font-mono text-xs text-neutral-400">asset_frame_1482 / 1920 x 1080</span>
        <span className="font-mono text-xs text-signal-300">image-coordinate mode</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: InferenceJobStatus }) {
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

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-graphite-900/75 inner-border-subtle min-w-0 rounded-md shadow-panel ${className}`}
    >
      {children}
    </div>
  );
}

function StateRow({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: 'signal' | 'scan' | 'amber' | 'neutral';
  icon: typeof Activity;
}) {
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

function SplitPill({ split }: { split: string }) {
  return <span className="split-pill">{split}</span>;
}

function DiffMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="inner-border-subtle rounded-md bg-white/[0.03] p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={`mt-3 font-mono text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function ToolButton({
  label,
  icon: Icon,
  active,
}: {
  label: string;
  icon: typeof Activity;
  active: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-md transition active:translate-y-px',
        active
          ? 'bg-[oklch(0.8_0.13_152/0.1)] text-[oklch(0.8_0.13_152)] shadow-[inset_0_0_0_1px_oklch(80%_0.13_152/0.24),inset_0_1px_0_oklch(98%_0.006_180/0.06)]'
          : 'text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-200',
      ].join(' ')}
    >
      <Icon size={17} />
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 px-4 py-3 text-sm">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className="truncate text-neutral-200">{value}</span>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.03] px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className="font-mono text-sm text-neutral-100">{value}</span>
    </div>
  );
}

function pipelineNode(
  item: PipelineNode,
  index: number,
  compact: boolean,
  state: { selected: boolean; hasIssue: boolean }
): FlowNode {
  const position = compact ? { x: 0, y: index * 124 } : { x: index * 220, y: index % 2 ? 36 : 92 };
  const orientation = compact ? 'vertical' : 'horizontal';
  const tone = pipelineNodeTone(item, state.hasIssue);
  const color =
    tone === 'signal'
      ? 'oklch(80% 0.13 152)'
      : tone === 'scan'
        ? 'oklch(78% 0.12 205)'
        : tone === 'amber'
          ? 'oklch(82% 0.13 88)'
          : 'oklch(72% 0.006 180)';

  return {
    id: item.id,
    position,
    sourcePosition: orientation === 'vertical' ? Position.Bottom : Position.Right,
    targetPosition: orientation === 'vertical' ? Position.Top : Position.Left,
    data: {
      label: (
        <div
          className={[
            'pipeline-node-card min-w-[156px] rounded-md bg-graphite-900 px-3 py-2',
            state.selected ? 'pipeline-node-card-selected' : '',
            state.hasIssue ? 'pipeline-node-card-issue' : '',
          ].join(' ')}
        >
          <p className="text-sm font-semibold text-neutral-100">{nodeLabel(item)}</p>
          <p className="mt-1 font-mono text-[11px] text-neutral-500">{nodeCaption(item)}</p>
          <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: color }} />
        </div>
      ),
    },
    style: {
      background: 'transparent',
      border: 'none',
      padding: 0,
      color: 'inherit',
    },
  };
}

function pipelineEdge(
  id: string,
  source: string,
  target: string,
  animated = false,
  hasIssue = false
): FlowEdge {
  const stroke = hasIssue
    ? 'oklch(82% 0.13 88)'
    : animated
      ? 'oklch(78% 0.12 205)'
      : 'oklch(72% 0.006 180 / 0.52)';

  return {
    id,
    source,
    target,
    animated: animated && !hasIssue,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: stroke,
    },
    style: {
      stroke,
      strokeWidth: animated || hasIssue ? 2 : 1.4,
    },
  };
}

function pipelineNodeTone(
  node: PipelineNode,
  hasIssue: boolean
): 'signal' | 'scan' | 'neutral' | 'amber' {
  if (hasIssue) {
    return 'amber';
  }

  if (node.type === 'input' || node.type === 'output') {
    return 'signal';
  }

  if (node.type === 'yolo_onnx') {
    return 'scan';
  }

  return 'neutral';
}

function nodeLabel(node: PipelineNode): string {
  const labels: Record<PipelineNode['type'], string> = {
    input: 'Input',
    resize: 'Resize',
    hsv_filter: 'HSV filter',
    yolo_onnx: 'Detector',
    nms: 'NMS',
    output: 'Output',
  };

  return labels[node.type];
}

function nodeCaption(node: PipelineNode): string {
  if (node.type === 'resize') {
    return `${node.params.width}px width`;
  }

  if (node.type === 'hsv_filter') {
    return `H ${node.params.hMin}-${node.params.hMax}`;
  }

  if (node.type === 'yolo_onnx') {
    return node.params.modelId ?? 'model unbound';
  }

  if (node.type === 'nms') {
    return `IoU ${node.params.iouThreshold.toFixed(2)}`;
  }

  if (node.type === 'input') {
    return 'MediaAsset stream';
  }

  return 'Predictions';
}

function isDetectorPath(edge: { source: string; target: string }, definition: PipelineDefinition) {
  const source = definition.nodes.find((node) => node.id === edge.source);
  const target = definition.nodes.find((node) => node.id === edge.target);

  return source?.type === 'yolo_onnx' || target?.type === 'yolo_onnx';
}
