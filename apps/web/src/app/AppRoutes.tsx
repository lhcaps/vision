import { AnimatePresence, motion } from 'motion/react';
import { motionTokens } from '@visionflow/motion';
import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  DatasetVersionSummary,
  EvaluationReport,
  PredictionSummary,
} from '@visionflow/contracts';
import type { DatasetSourceState, SectionId } from './section.types';
import type { RuntimeReadiness } from '../features/runtime/runtime.types';
import type { MediaUploadRow } from '../features/media';
import type { JobUiState } from '../features/inference';
import { demoSnapshot } from '../data/demo';
import { buildDatasetInspectorData, buildMediaInspectorData } from './inspector-builders';
import { OverviewPanel } from './OverviewPanel';
import { DatasetPanel } from './DatasetPanel';
import { JobsPanel } from './JobsPanel';
import { MediaPanel, seededMediaRows } from './MediaPanel';
import { PipelinePanel } from './PipelinePanel';
import { ReadinessStrip } from './ReadinessStrip';
import {
  AnnotationEnginePanel,
  createSeedAnnotationSummaries,
} from '../features/annotations/AnnotationEngine';
import { DatasetVersionDiff, TimelineReplayPanel } from '../features/timeline';
import { InspectorRouter } from '../features/inspector';

interface AppRoutesProps {
  section: SectionId;
  job: JobUiState;
  onRun: () => void;
  inferenceEligibility: { ok: boolean; reason: string | null };
  evaluationEligibility: { ok: boolean; reason: string | null };
  mediaUploads: MediaUploadRow[];
  setMediaUploads: Dispatch<SetStateAction<MediaUploadRow[]>>;
  selectedMediaAssetId: string | null;
  onSelectAsset: (id: string | null) => void;
  selectedDatasetVersionId: string | null;
  onSelectVersion: (id: string | null) => void;
  datasetVersions: DatasetVersionSummary[];
  onVersionsChange: Dispatch<SetStateAction<DatasetVersionSummary[]>>;
  datasetSourceState: DatasetSourceState;
  onSourceStateChange: Dispatch<SetStateAction<DatasetSourceState>>;
  evaluationReport: EvaluationReport | null;
  isEvaluating: boolean;
  evaluationError: string | null;
  predictions: PredictionSummary[];
  onRunEvaluation: () => void;
  setSection: Dispatch<SetStateAction<SectionId>>;
  runtimeReadiness: RuntimeReadiness;
}

export function AppRoutes({
  section,
  job,
  onRun,
  inferenceEligibility,
  evaluationEligibility,
  mediaUploads,
  setMediaUploads,
  selectedMediaAssetId,
  onSelectAsset,
  selectedDatasetVersionId,
  onSelectVersion,
  datasetVersions,
  onVersionsChange,
  datasetSourceState,
  onSourceStateChange,
  evaluationReport,
  isEvaluating,
  evaluationError,
  predictions,
  onRunEvaluation,
  setSection,
  runtimeReadiness,
}: AppRoutesProps) {
  const seededGroundTruth = useMemo(() => createSeedAnnotationSummaries(), []);
  const visibleMediaRows = [...mediaUploads, ...seededMediaRows()];
  const mediaInspectorData = buildMediaInspectorData(visibleMediaRows, selectedMediaAssetId);
  const datasetInspectorData = buildDatasetInspectorData(
    selectedDatasetVersionId,
    datasetVersions,
    datasetSourceState
  );

  return (
    <div className="mx-auto grid max-w-[1500px] gap-4 px-4 pb-5 pt-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0">
        <ReadinessStrip readiness={runtimeReadiness} job={job} />
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeScan }}
          >
            {section === 'overview' && (
              <OverviewPanel onRun={onRun} inferenceEligibility={inferenceEligibility} />
            )}
            {section === 'media' && (
              <MediaPanel
                uploads={mediaUploads}
                setUploads={setMediaUploads}
                selectedAssetId={selectedMediaAssetId}
                onSelectAsset={onSelectAsset}
              />
            )}
            {section === 'datasets' && (
              <DatasetPanel
                mediaRows={visibleMediaRows}
                selectedVersionId={selectedDatasetVersionId}
                onSelectVersion={onSelectVersion}
                versions={datasetVersions}
                onVersionsChange={onVersionsChange}
                sourceState={datasetSourceState}
                onSourceStateChange={onSourceStateChange}
              />
            )}
            {section === 'annotate' && <AnnotationEnginePanel mediaRows={visibleMediaRows} />}
            {section === 'pipeline' && <PipelinePanel />}
            {section === 'jobs' && (
              <JobsPanel
                job={job}
                onRun={onRun}
                evaluationReport={evaluationReport}
                isEvaluating={isEvaluating}
                evaluationError={evaluationError}
                predictions={predictions}
                groundTruth={seededGroundTruth}
                onRunEvaluation={onRunEvaluation}
                evaluationEligibility={evaluationEligibility}
                inferenceEligibility={inferenceEligibility}
                onOpenVersions={() => setSection('datasets')}
              />
            )}
            {section === 'timeline' && (
              <TimelineReplayPanel
                mediaAssets={demoSnapshot.media}
                groundTruth={seededGroundTruth}
                predictions={predictions}
              />
            )}
            {section === 'diff' && <DatasetVersionDiff />}
          </motion.div>
        </AnimatePresence>
      </section>
      <InspectorRouter
        active={section}
        job={job}
        predictions={predictions}
        mediaInspectorData={mediaInspectorData}
        datasetInspectorData={datasetInspectorData}
        projectName={demoSnapshot.project.name}
      />
    </div>
  );
}
