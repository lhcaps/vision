import { useMemo, useState } from 'react';
import type { SectionId } from './app/section.types';
import { AppRoutes } from './app/AppRoutes';
import { NavRail } from './app/NavRail';
import { ShellHeader } from './app/ShellHeader';
import { demoSnapshot } from './data/demo';
import { createSeedAnnotationSummaries } from './features/annotations/AnnotationEngine';
import type {
  AnnotationSummary,
  PipelineDefinition,
  PipelineValidationResult,
} from '@visionflow/contracts';
import { validatePipelineDefinition } from '@visionflow/contracts';
import type { MediaUploadRow } from './features/media';
import type { WorkbenchRuntimeState } from './shared/state/workbench-runtime';
import { canRunInference, canRunEvaluation } from './shared/state/runtime-selectors';
import { useDatasetsController } from './features/datasets/useDatasetsController';
import { useInferenceJobController } from './features/inference/useInferenceJobController';
import { useEvaluationController } from './features/inference/useEvaluationController';

export function App() {
  const [section, setSection] = useState<SectionId>('overview');
  const [threshold, setThreshold] = useState(62);
  const [selectedAnnotation, setSelectedAnnotation] = useState('ann_02');
  const [annotationRows, setAnnotationRows] = useState<AnnotationSummary[]>(() =>
    createSeedAnnotationSummaries()
  );
  const [mediaUploads, setMediaUploads] = useState<MediaUploadRow[]>([]);

  // Tracked selection state for contextual inspectors
  const [selectedMediaAssetId, setSelectedMediaAssetId] = useState<string | null>(null);

  // Extracted controllers
  const {
    datasetVersions,
    selectedDatasetVersionId,
    setSelectedDatasetVersionId,
    datasetSourceState,
    setDatasetVersions,
    setDatasetSourceState,
  } = useDatasetsController();

  const { job, startJob } = useInferenceJobController();

  const {
    evaluationReport,
    isEvaluating,
    evaluationError,
    predictions,
    handleRunEvaluation,
  } = useEvaluationController(job);

  // Pipeline selected node — lifted from PipelinePanel so InspectorRouter can access it
  const [pipelineSelectedNodeId, setPipelineSelectedNodeId] = useState<string>('detector');
  const [pipelineDefinition, setPipelineDefinition] = useState<PipelineDefinition>(
    demoSnapshot.pipeline
  );
  const [pipelineValidation, setPipelineValidation] = useState<PipelineValidationResult>(
    validatePipelineDefinition(demoSnapshot.pipeline)
  );

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

  const handleRun = () => {
    setSection('jobs');
    startJob();
  };

  return (
    <div className="min-h-[100dvh] bg-graphite-950 text-neutral-100">
      <div className="app-grid min-h-[100dvh]">
        <NavRail active={section} onSelect={setSection} />
        <main className="min-w-0">
          <ShellHeader
            job={job}
            threshold={threshold}
            onRun={handleRun}
            inferenceEligibility={inferenceEligibility}
          />
          <AppRoutes
            section={section}
            job={job}
            threshold={threshold}
            onRun={handleRun}
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
