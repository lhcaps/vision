/**
 * Inspector type definitions.
 * These types define what data each contextual inspector receives.
 */

import type { InferenceJobSummary } from '@visionflow/contracts';

export interface MediaInspectorData {
  selectedAssetId: string | null;
  selectedAssetName: string | null;
  selectedAssetMime: string | null;
  selectedAssetWidth: number | null;
  selectedAssetHeight: number | null;
  selectedAssetChecksum: string | null;
  selectedAssetStorageKey: string | null;
  selectedAssetProcessingState: string | null;
}

export interface DatasetInspectorData {
  selectedVersionId: string | null;
  selectedVersionLabel: string | null;
  selectedVersionStatus: 'DRAFT' | 'LOCKED' | null;
  selectedVersionAssetCount: number;
  splitSummary: { train: number; valid: number; test: number; unassigned: number };
  canMutate: boolean;
}

export interface JobInspectorData {
  job: InferenceJobSummary | null;
  jobError: string | null;
  jobLogs: string[];
  hasPredictions: boolean;
  hasEvaluationReport: boolean;
}
