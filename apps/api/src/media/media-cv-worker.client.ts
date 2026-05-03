import { Injectable } from '@nestjs/common';
import { createLogger, getCurrentRequestId } from '../common/logging/structured-logger';
import {
  CvWorkerCreateThumbnailResponseSchema,
  CvWorkerCreateThumbnailResponse,
  CvWorkerExtractFramesResponseSchema,
  CvWorkerExtractFramesResponse,
  CvWorkerMediaProcessingRequestSchema,
} from '@visionflow/contracts';

const logger = createLogger('MediaCvWorkerClient');

@Injectable()
export class MediaCvWorkerClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (process.env.CV_WORKER_URL ?? '').replace(/\/+$/, '');
  }

  private get timeout(): number {
    return Number(process.env.CV_WORKER_TIMEOUT_MS ?? '30000');
  }

  async createThumbnail(request: {
    jobId: string;
    assetId: string;
    storageKey: string;
    targetKey: string;
    mimeType: string;
    width: number | null;
    height: number | null;
  }): Promise<CvWorkerCreateThumbnailResponse> {
    const payload = CvWorkerMediaProcessingRequestSchema.parse(request);
    const correlationId = getCurrentRequestId();
    const startMs = Date.now();

    if (!this.baseUrl) {
      logger.warn(
        { jobId: payload.jobId, correlationId },
        'CV_WORKER_URL not configured; media processing cannot proceed. Worker must be running.'
      );
      throw new Error(
        'CV_WORKER_URL is not configured. Media processing requires the FastAPI CV worker to be running at CV_WORKER_URL.'
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/cv/create-thumbnail`, {
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
        const errorMsg = await this.readWorkerError(response);
        logger.error(
          { jobId: payload.jobId, correlationId, statusCode: response.status, durationMs },
          `CV worker create-thumbnail failed: ${errorMsg}`
        );
        throw new Error(
          `CV worker create-thumbnail failed with HTTP ${response.status}: ${errorMsg}`
        );
      }

      logger.info(
        { jobId: payload.jobId, correlationId, statusCode: response.status, durationMs },
        'CV worker create-thumbnail completed'
      );

      return CvWorkerCreateThumbnailResponseSchema.parse(await response.json());
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(
          { jobId: payload.jobId, correlationId, durationMs: Date.now() - startMs },
          'CV worker create-thumbnail timed out'
        );
        throw new Error(`CV worker create-thumbnail timed out after ${this.timeout}ms.`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  async extractFrames(request: {
    jobId: string;
    assetId: string;
    storageKey: string;
    targetKey: string;
    mimeType: string;
    width: number | null;
    height: number | null;
  }): Promise<CvWorkerExtractFramesResponse> {
    const payload = CvWorkerMediaProcessingRequestSchema.parse(request);
    const correlationId = getCurrentRequestId();
    const startMs = Date.now();

    if (!this.baseUrl) {
      throw new Error(
        'CV_WORKER_URL is not configured. Frame extraction requires the FastAPI CV worker.'
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/cv/extract-frames`, {
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
        const errorMsg = await this.readWorkerError(response);
        logger.error(
          { jobId: payload.jobId, correlationId, statusCode: response.status, durationMs },
          `CV worker extract-frames failed: ${errorMsg}`
        );
        throw new Error(
          `CV worker extract-frames failed with HTTP ${response.status}: ${errorMsg}`
        );
      }

      logger.info(
        { jobId: payload.jobId, correlationId, statusCode: response.status, durationMs },
        'CV worker extract-frames completed'
      );

      return CvWorkerExtractFramesResponseSchema.parse(await response.json());
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(
          { jobId: payload.jobId, correlationId, durationMs: Date.now() - startMs },
          'CV worker extract-frames timed out'
        );
        throw new Error(`CV worker extract-frames timed out after ${this.timeout}ms.`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readWorkerError(response: Response): Promise<string> {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { detail?: unknown; message?: unknown };
      const detail = parsed.detail ?? parsed.message;
      return typeof detail === 'string' ? detail : JSON.stringify(detail);
    } catch {
      return text || response.statusText;
    }
  }
}
