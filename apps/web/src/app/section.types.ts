import type { DatasetSplit } from '@visionflow/contracts';

export type SectionId =
  | 'overview'
  | 'media'
  | 'datasets'
  | 'annotate'
  | 'pipeline'
  | 'jobs'
  | 'timeline'
  | 'diff';

export type DatasetSourceState = 'loading' | 'api' | 'fallback';
export type PipelineSourceState = 'loading' | 'api' | 'fallback';

export type DatasetActionState = {
  busy: boolean;
  message: string | null;
  error: string | null;
};

export const datasetSplits: DatasetSplit[] = ['TRAIN', 'VALID', 'TEST', 'UNASSIGNED'];
