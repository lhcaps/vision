import type { SectionId } from './app/section.types';
import { AppRoutes } from './app/AppRoutes';
import { NavRail } from './app/NavRail';
import { ShellHeader } from './app/ShellHeader';
import { useEffect, useMemo, useState } from 'react';
import type {
  AnnotationSummary,
  DatasetVersionSummary,
  EvaluationReport,
  InferenceJobEvent,
  InferenceJobSummary,
  PipelineDefinition,
  PipelineValidationResult,
  PredictionSummary,
} from '@visionflow/contracts';
import {
  InferenceJobEventSchema,
  isTerminalJobStatus,
  validatePipelineDefinition,
} from '@visionflow/contracts';
import { demoSnapshot, logs } from './data/demo';
import { listDatasetVersions, listProjectDatasets } from './lib/datasets';
import type { MediaUploadRow } from './features/media';
import { createSeedAnnotationSummaries } from './features/annotations/AnnotationEngine';
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
import { listProjectPipelines } from './lib/pipelines';
import { type WorkbenchRuntimeState } from './shared/state/workbench-runtime';
import { canRunInference, canRunEvaluation } from './shared/state/runtime-selectors';

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
          <AppRoutes
            section={section}
            job={job}
            threshold={threshold}
            onRun={startJob}
            inferenceEligibility={inferenceEligibility}
            evaluationEligibility={evaluationEligibility}
            annotationRows={annotationRows}
            setAnnotationRows={setAnnotationRows}
            selectedAnnotation={selectedAnnotation}
            setSelectedAnnotation={setSelectedAnnotation}
            setThreshold={setThreshold}
            mediaUploads={mediaUploads}
            setMediaUploads={setMediaUploads}
            selectedMediaAssetId={selectedMediaAssetId}
            onSelectAsset={setSelectedMediaAssetId}
            selectedDatasetVersionId={selectedDatasetVersionId}
            onSelectVersion={setSelectedDatasetVersionId}
            datasetVersions={datasetVersions}
            onVersionsChange={setDatasetVersions}
            datasetSourceState={datasetSourceState}
            onSourceStateChange={setDatasetSourceState}
            pipelineSelectedNodeId={pipelineSelectedNodeId}
            onSelectNode={setPipelineSelectedNodeId}
            pipelineDefinition={pipelineDefinition}
            onDefinitionChange={setPipelineDefinition}
            pipelineValidation={pipelineValidation}
            onValidationChange={setPipelineValidation}
            evaluationReport={evaluationReport}
            isEvaluating={isEvaluating}
            evaluationError={evaluationError}
            predictions={predictions}
            onRunEvaluation={handleRunEvaluation}
            setSection={setSection}
          />
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
