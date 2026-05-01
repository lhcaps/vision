import { EvaluationReport } from '@visionflow/contracts';

export interface EvaluationRepository {
  findByJob(jobId: string): Promise<EvaluationReport | null>;
  create(jobId: string, metrics: EvaluationReport): Promise<void>;
}
