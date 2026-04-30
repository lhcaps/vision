import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import {
  CvWorkerRunPipelinePayload,
  CvWorkerRunPipelineRequest,
  CvWorkerRunPipelineRequestSchema,
  CvWorkerRunPipelineResponse,
  CvWorkerRunPipelineResponseSchema,
} from "@visionflow/contracts";

@Injectable()
export class CvWorkerClient {
  async runPipeline(request: CvWorkerRunPipelineRequest): Promise<CvWorkerRunPipelineResponse> {
    const payload = CvWorkerRunPipelineRequestSchema.parse(request);
    const baseUrl = process.env.CV_WORKER_URL?.replace(/\/+$/, "");

    if (!baseUrl || baseUrl === "mock") {
      return this.runFallback(payload);
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number(process.env.CV_WORKER_TIMEOUT_MS ?? "3500"),
    );

    try {
      const response = await fetch(`${baseUrl}/cv/run-pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `CV worker run-pipeline failed with HTTP ${response.status}: ${await readWorkerError(
            response,
          )}`,
        );
      }

      return CvWorkerRunPipelineResponseSchema.parse(await response.json());
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("CV worker run-pipeline timed out.");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private runFallback(payload: CvWorkerRunPipelinePayload): CvWorkerRunPipelineResponse {
    if (payload.detectorMode === "onnx") {
      throw new Error("ONNX detector mode requires a configured CV_WORKER_URL.");
    }

    const predictions = payload.assets
      .map((asset) => mockPrediction(payload.jobId, asset))
      .filter((prediction) =>
        payload.confidenceThreshold === undefined
          ? true
          : prediction.confidence >= payload.confidenceThreshold,
      );

    return CvWorkerRunPipelineResponseSchema.parse({
      jobId: payload.jobId,
      mode: "mock_detector",
      workerVersion: "api-fallback",
      assetCount: payload.assets.length,
      predictionCount: predictions.length,
      predictions,
      warnings: ["CV_WORKER_URL not configured; used API in-process mock worker fallback."],
    });
  }
}

function mockPrediction(
  jobId: string,
  asset: CvWorkerRunPipelinePayload["assets"][number],
): CvWorkerRunPipelineResponse["predictions"][number] {
  const digest = createHash("sha256").update(`${jobId}:${asset.assetId}`).digest();
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
      runtime: "api_fallback_mock_detector",
      storageKey: asset.storageKey,
    },
  };
}

async function readWorkerError(response: Response): Promise<string> {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text) as { detail?: unknown; message?: unknown };
    const detail = parsed.detail ?? parsed.message;

    return typeof detail === "string" ? detail : JSON.stringify(detail);
  } catch {
    return text || response.statusText;
  }
}
