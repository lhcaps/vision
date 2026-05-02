import { PredictionSummary } from '@visionflow/contracts';

export interface PredictionRepository {
  findByJob(jobId: string): Promise<PredictionSummary[]>;
  deleteByJob(jobId: string): Promise<void>;
  createMany(
    jobId: string,
    predictions: Array<{
      assetId: string;
      labelClassId: string | null;
      geometry: unknown;
      confidence: number;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<number>;
}
