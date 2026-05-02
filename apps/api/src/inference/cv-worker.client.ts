import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createLogger, getCurrentRequestId } from '../common/logging/structured-logger';
import {
  CvWorkerEvaluationPayload,
  CvWorkerEvaluationRequestSchema,
  CvWorkerEvaluationResponse,
  CvWorkerRunPipelinePayload,
  CvWorkerRunPipelineRequest,
  CvWorkerRunPipelineRequestSchema,
  CvWorkerRunPipelineResponse,
  CvWorkerRunPipelineResponseSchema,
} from '@visionflow/contracts';

const logger = createLogger('CvWorkerClient');

@Injectable()
export class CvWorkerClient {
  async runPipeline(request: CvWorkerRunPipelineRequest): Promise<CvWorkerRunPipelineResponse> {
    const payload = CvWorkerRunPipelineRequestSchema.parse(request);
    const baseUrl = process.env.CV_WORKER_URL?.replace(/\/+$/, '');
    const correlationId = getCurrentRequestId();
    const startMs = Date.now();

    if (!baseUrl || baseUrl === 'mock') {
      logger.info(
        { jobId: payload.jobId, correlationId, mode: 'mock' },
        'Using mock CV worker fallback',
      );
      return this.runPipelineFallback(payload);
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number(process.env.CV_WORKER_TIMEOUT_MS ?? '3500')
    );

    try {
      const response = await fetch(`${baseUrl}/cv/run-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(correlationId ? { 'x-correlation-id': correlationId } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const durationMs = Date.now() - startMs;

      if (!response.ok) {
        const errorMsg = await readWorkerError(response);
        logger.error(
          { jobId: payload.jobId, correlationId, statusCode: response.status, durationMs },
          `CV worker run-pipeline failed: ${errorMsg}`,
        );
        throw new Error(`CV worker run-pipeline failed with HTTP ${response.status}: ${errorMsg}`);
      }

      logger.info(
        { jobId: payload.jobId, correlationId, statusCode: response.status, durationMs },
        'CV worker run-pipeline completed',
      );

      return CvWorkerRunPipelineResponseSchema.parse(await response.json());
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(
          { jobId: payload.jobId, correlationId, durationMs: Date.now() - startMs },
          'CV worker run-pipeline timed out',
        );
        throw new Error('CV worker run-pipeline timed out.');
      }
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  async evaluate(request: CvWorkerEvaluationPayload): Promise<CvWorkerEvaluationResponse> {
    const payload = CvWorkerEvaluationRequestSchema.parse(request);
    const baseUrl = process.env.CV_WORKER_URL?.replace(/\/+$/, '');
    const correlationId = getCurrentRequestId();
    const startMs = Date.now();
    const jobId = payload.jobId ?? '-';

    if (!baseUrl || baseUrl === 'mock') {
      return this.evaluateFallback(payload);
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number(process.env.CV_WORKER_TIMEOUT_MS ?? '3500')
    );

    try {
      const response = await fetch(`${baseUrl}/cv/evaluate-detections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(correlationId ? { 'x-correlation-id': correlationId } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const durationMs = Date.now() - startMs;

      if (!response.ok) {
        const errorMsg = await readWorkerError(response);
        logger.error(
          { jobId, correlationId, statusCode: response.status, durationMs },
          `CV worker evaluate failed: ${errorMsg}`,
        );
        throw new Error(`CV worker evaluate failed with HTTP ${response.status}: ${errorMsg}`);
      }

      logger.info(
        { jobId, correlationId, statusCode: response.status, durationMs },
        'CV worker evaluate completed',
      );

      return (await response.json()) as CvWorkerEvaluationResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(
          { jobId, correlationId, durationMs: Date.now() - startMs },
          'CV worker evaluate timed out',
        );
        throw new Error('CV worker evaluate timed out.');
      }
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  private runPipelineFallback(payload: CvWorkerRunPipelinePayload): CvWorkerRunPipelineResponse {
    if (payload.detectorMode === 'onnx') {
      throw new Error('ONNX detector mode requires a configured CV_WORKER_URL.');
    }

    const predictions = payload.assets
      .map((asset) => mockPrediction(payload.jobId, asset))
      .filter((prediction) =>
        payload.confidenceThreshold === undefined
          ? true
          : prediction.confidence >= payload.confidenceThreshold
      );

    return CvWorkerRunPipelineResponseSchema.parse({
      jobId: payload.jobId,
      mode: 'mock_detector',
      workerVersion: 'api-fallback',
      assetCount: payload.assets.length,
      predictionCount: predictions.length,
      predictions,
      warnings: ['CV_WORKER_URL not configured; used API in-process mock worker fallback.'],
    });
  }

  private evaluateFallback(payload: CvWorkerEvaluationPayload): CvWorkerEvaluationResponse {
    const IO_U_THRESHOLD = payload.iouThreshold ?? 0.5;
    const matchedGt = new Set<number>();
    const matchedPred = new Set<number>();
    const matches: CvWorkerEvaluationResponse['matches'] = [];

    for (let pi = 0; pi < payload.predictions.length; pi++) {
      const pred = payload.predictions[pi];

      for (let gi = 0; gi < payload.groundTruth.length; gi++) {
        if (matchedGt.has(gi)) continue;

        const gt = payload.groundTruth[gi];

        if (pred.assetId !== gt.assetId) continue;

        const iou = boxIntersectionOverUnion(pred.geometry, gt.geometry);

        if (iou >= IO_U_THRESHOLD) {
          matchedGt.add(gi);
          matchedPred.add(pi);
          matches.push({ predictionIndex: pi, groundTruthIndex: gi, assetId: pred.assetId, iou });
          break;
        }
      }
    }

    const truePositives = matches.length;
    const falsePositives = payload.predictions.length - truePositives;
    const falseNegatives = payload.groundTruth.length - truePositives;
    const precision =
      payload.predictions.length > 0 ? truePositives / payload.predictions.length : 0;
    const recall = payload.groundTruth.length > 0 ? truePositives / payload.groundTruth.length : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const meanIou =
      matches.length > 0 ? matches.reduce((sum, m) => sum + m.iou, 0) / matches.length : 0;

    return {
      jobId: payload.jobId ?? null,
      iouThreshold: IO_U_THRESHOLD,
      truePositive: truePositives,
      falsePositive: falsePositives,
      falseNegative: falseNegatives,
      precision,
      recall,
      f1,
      meanIou,
      matches,
    };
  }
}

function mockPrediction(
  jobId: string,
  asset: CvWorkerRunPipelinePayload['assets'][number]
): CvWorkerRunPipelineResponse['predictions'][number] {
  const digest = createHash('sha256').update(`${jobId}:${asset.assetId}`).digest();
  const width = Math.min(asset.width, Math.max(36, Math.floor(asset.width / 5), 1));
  const height = Math.min(asset.height, Math.max(32, Math.floor(asset.height / 6), 1));
  const maxX = Math.max(0, asset.width - width);
  const maxY = Math.max(0, asset.height - height);
  const x = maxX === 0 ? 0 : digest.readUInt16BE(0) % (maxX + 1);
  const y = maxY === 0 ? 0 : digest.readUInt16BE(2) % (maxY + 1);
  const confidence = 0.62 + (digest[4] / 255) * 0.33;

  return {
    assetId: asset.assetId,
    labelClassId: null,
    geometry: {
      x,
      y,
      width,
      height,
    },
    confidence: Number(confidence.toFixed(3)),
    metadata: {
      runtime: 'api_fallback_mock_detector',
      storageKey: asset.storageKey,
    },
  };
}

function boxIntersectionOverUnion(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const areaA = Math.max(0, a.width) * Math.max(0, a.height);
  const areaB = Math.max(0, b.width) * Math.max(0, b.height);
  const union = areaA + areaB - intersection;

  return union === 0 ? 0 : intersection / union;
}

async function readWorkerError(response: Response): Promise<string> {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text) as { detail?: unknown; message?: unknown };
    const detail = parsed.detail ?? parsed.message;

    return typeof detail === 'string' ? detail : JSON.stringify(detail);
  } catch {
    return text || response.statusText;
  }
}
