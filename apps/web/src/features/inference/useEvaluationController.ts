import { useCallback, useEffect, useState } from 'react';
import type { EvaluationReport, PredictionSummary } from '@visionflow/contracts';
import { getEvaluationReport, getJobPredictions, runEvaluation } from './inference.api';
import type { JobUiState } from './inference.types';

export interface UseEvaluationControllerResult {
  evaluationReport: EvaluationReport | null;
  isEvaluating: boolean;
  evaluationError: string | null;
  predictions: PredictionSummary[];
  handleRunEvaluation: () => Promise<void>;
}

export function useEvaluationController(job: JobUiState): UseEvaluationControllerResult {
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionSummary[]>([]);

  // Fetch evaluation report and predictions when a completed job is available
  useEffect(() => {
    if (job.status !== 'SUCCEEDED' || !job.id) return;

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
  }, [job.id, job.projectId, job.status]);

  const handleRunEvaluation = useCallback(async () => {
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
  }, [job.id, job.projectId, isEvaluating]);

  return {
    evaluationReport,
    isEvaluating,
    evaluationError,
    predictions,
    handleRunEvaluation,
  };
}
