import type { InferenceJobSummary, InferenceJobEvent } from '@visionflow/contracts';

export type JobSourceState = 'loading' | 'api' | 'fallback';

export type JobUiState = InferenceJobSummary & {
  logs: string[];
  source: JobSourceState;
  error: string | null;
};

export type { InferenceJobSummary, InferenceJobEvent };
