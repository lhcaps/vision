/**
 * Inspector type definitions.
 * These types define what data each contextual inspector receives.
 */

import type { AnnotationSummary, InferenceJobSummary } from '@visionflow/contracts';

// SectionId must be kept in sync with App.tsx
export type SectionId =
  | 'overview'
  | 'media'
  | 'datasets'
  | 'annotate'
  | 'pipeline'
  | 'jobs'
  | 'timeline'
  | 'diff';

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

export interface AnnotationInspectorData {
  selectedAnnotation: AnnotationSummary | null;
  canSave: boolean;
  isDirty: boolean;
}

export interface PipelineInspectorData {
  selectedNodeId: string | null;
  selectedNodeType: string | null;
  selectedNodeParams: Record<string, unknown> | null;
  isValid: boolean;
  validationIssues: Array<{ message: string; severity: string }>;
}

export interface JobInspectorData {
  job: InferenceJobSummary | null;
  jobError: string | null;
  jobLogs: string[];
  hasPredictions: boolean;
  hasEvaluationReport: boolean;
}
