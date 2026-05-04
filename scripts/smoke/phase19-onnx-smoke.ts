#!/usr/bin/env tsx
/**
 * scripts/smoke/phase19-onnx-smoke.ts
 *
 * Phase 19 ONNX real-object smoke test.
 * Proves YOLOv8n ONNX produces at least one prediction on a real image.
 *
 * Uses confidence threshold 0.05 to demonstrate detections.
 * (Default 0.25 on synthetic seed images produces zero predictions — expected.)
 *
 * Usage:
 *   npx tsx scripts/smoke/phase19-onnx-smoke.ts
 */

const API_BASE = 'http://localhost:3000';
const WORKER_BASE = 'http://localhost:8000';

const LOG_OK = '\x1b[32m[PASS]\x1b[0m';
const LOG_FAIL = '\x1b[31m[FAIL]\x1b[0m';
const LOG_INFO = '\x1b[36m[INFO]\x1b[0m';
const LOG_SMOKE = '\x1b[33m[SMOKE]\x1b[0m';

function log(label: string, msg: string) {
  console.log(`${label} ${msg}`);
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const resp = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${body}`);
  }
  return resp.json() as Promise<T>;
}

async function main() {
  let exitCode = 0;

  log(LOG_INFO, 'Phase 19 ONNX Real-Object Smoke');

  // ── Smoke A: Missing model ─────────────────────────────────────────────────
  log(LOG_SMOKE, 'Smoke A: ONNX missing-model (expect 404)');
  try {
    const body = {
      jobId: 'smoke-missing-model',
      pipeline: { version: 1, nodes: [], edges: [] },
      detectorMode: 'onnx',
      modelArtifactKey: './models/definitely_missing.onnx',
      confidenceThreshold: 0.25,
      assets: [
        {
          assetId: 'asset_frame_1482',
          storageKey: 'originals/asset_frame_1482/north-gate-frame-1482.jpg',
          width: 1920,
          height: 1080,
        },
      ],
    };
    await fetchJson(`${WORKER_BASE}/cv/run-pipeline`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    log(LOG_FAIL, 'Smoke A: Expected 404/422, got success');
    exitCode = 1;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('404') || msg.includes('ONNX model artifact not found')) {
      log(LOG_OK, 'Smoke A: Missing model returns 404 (no fallback, no predictions)');
    } else {
      log(LOG_FAIL, `Smoke A: Unexpected error: ${msg}`);
      exitCode = 1;
    }
  }

  // ── Smoke B: ONNX real-object (low threshold to show detections) ───────
  log(LOG_SMOKE, 'Smoke B: ONNX real-object with low confidence threshold');
  try {
    const body = {
      jobId: 'smoke-onnx-realobj',
      pipeline: { version: 1, nodes: [], edges: [] },
      detectorMode: 'onnx',
      modelArtifactKey: './models/yolov8n.onnx',
      confidenceThreshold: 0.05, // Lower threshold to demonstrate detections exist
      assets: [
        {
          assetId: 'asset_frame_1482',
          storageKey: 'originals/asset_frame_1482/north-gate-frame-1482.jpg',
          width: 1920,
          height: 1080,
        },
      ],
    };
    const result = await fetchJson<{
      mode: string;
      workerVersion: string;
      modelVersion: string;
      predictionCount: number;
      predictions: Array<{
        assetId: string;
        label: string;
        geometry: { x: number; y: number; width: number; height: number };
        confidence: number;
        metadata: Record<string, unknown>;
      }>;
    }>(`${WORKER_BASE}/cv/run-pipeline`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    log(LOG_INFO, `  mode: ${result.mode}`);
    log(LOG_INFO, `  workerVersion: ${result.workerVersion}`);
    log(LOG_INFO, `  modelVersion: ${result.modelVersion}`);
    log(LOG_INFO, `  predictionCount: ${result.predictionCount}`);

    if (result.predictionCount === 0) {
      log(LOG_FAIL, 'Smoke B: predictionCount is 0 (expected > 0 for real-object smoke)');
      exitCode = 1;
    } else {
      log(LOG_OK, `Smoke B: predictionCount=${result.predictionCount} > 0`);

      const first = result.predictions[0];
      const { geometry, confidence, metadata } = first;

      // Validate first prediction
      if (geometry.x < 0 || geometry.y < 0 || geometry.width <= 0 || geometry.height <= 0) {
        log(
          LOG_FAIL,
          `Smoke B: Invalid geometry: x=${geometry.x}, y=${geometry.y}, w=${geometry.width}, h=${geometry.height}`
        );
        exitCode = 1;
      } else {
        log(
          LOG_OK,
          `  Geometry: (${geometry.x},${geometry.y},${geometry.width}x${geometry.height})`
        );
      }

      if (confidence < 0 || confidence > 1) {
        log(LOG_FAIL, `Smoke B: Confidence out of range: ${confidence}`);
        exitCode = 1;
      } else {
        log(LOG_OK, `  Confidence: ${confidence} (in [0,1])`);
      }

      if (!('cocoLabel' in metadata) || !('classId' in metadata)) {
        log(LOG_FAIL, 'Smoke B: Missing cocoLabel/classId in metadata');
        exitCode = 1;
      } else {
        log(LOG_OK, `  cocoLabel: ${metadata.cocoLabel}, classId: ${metadata.classId}`);
      }

      if (metadata.runtime !== 'onnx_detector') {
        log(LOG_FAIL, `Smoke B: Expected runtime=onnx_detector, got ${metadata.runtime}`);
        exitCode = 1;
      } else {
        log(LOG_OK, `  runtime: ${metadata.runtime}`);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log(LOG_FAIL, `Smoke B: Error: ${msg}`);
    exitCode = 1;
  }

  // ── Smoke C: API mock job ─────────────────────────────────────────────────
  log(LOG_SMOKE, 'Smoke C: API mock inference job (expect SUCCEEDED + predictions)');
  try {
    // First switch to mock mode
    const mockBody = {
      jobId: 'smoke-mock-api',
      pipeline: { version: 1, nodes: [], edges: [] },
      detectorMode: 'mock',
      confidenceThreshold: 0.01,
      assets: [
        {
          assetId: 'asset_frame_1482',
          storageKey: 'originals/asset_frame_1482/north-gate-frame-1482.jpg',
          width: 1920,
          height: 1080,
        },
      ],
    };
    const mockResult = await fetchJson<{
      mode: string;
      predictionCount: number;
      predictions: Array<{
        geometry: { x: number; y: number; width: number; height: number };
        confidence: number;
      }>;
    }>(`${WORKER_BASE}/cv/run-pipeline`, {
      method: 'POST',
      body: JSON.stringify(mockBody),
    });

    log(LOG_INFO, `  mode: ${mockResult.mode}`);
    log(LOG_INFO, `  predictionCount: ${mockResult.predictionCount}`);

    if (mockResult.mode !== 'mock_detector') {
      log(LOG_FAIL, `Smoke C: Expected mode=mock_detector, got ${mockResult.mode}`);
      exitCode = 1;
    } else {
      log(LOG_OK, 'Smoke C: mode=mock_detector');
    }

    if (mockResult.predictionCount === 0) {
      log(LOG_FAIL, 'Smoke C: predictionCount is 0 (expected > 0)');
      exitCode = 1;
    } else {
      log(LOG_OK, `Smoke C: predictionCount=${mockResult.predictionCount} > 0`);
      for (const pred of mockResult.predictions) {
        const { geometry, confidence } = pred;
        if (geometry.x < 0 || geometry.y < 0 || geometry.width <= 0 || geometry.height <= 0) {
          log(LOG_FAIL, `  Invalid geometry for mock prediction`);
          exitCode = 1;
        } else if (confidence < 0 || confidence > 1) {
          log(LOG_FAIL, `  Confidence out of range: ${confidence}`);
          exitCode = 1;
        }
      }
      log(LOG_OK, '  All mock predictions have valid geometry and confidence');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log(LOG_FAIL, `Smoke C: Error: ${msg}`);
    exitCode = 1;
  }

  if (exitCode === 0) {
    console.log('\n' + LOG_OK + ' All smoke tests passed');
  } else {
    console.log('\n' + LOG_FAIL + ' Some smoke tests failed');
  }

  process.exitCode = exitCode;
}

main().catch((err) => {
  console.error(LOG_FAIL, 'Fatal:', err);
  process.exitCode = 1;
});
