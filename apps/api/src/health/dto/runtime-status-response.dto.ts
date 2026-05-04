export class RuntimeStatusResponseDto {
  api!: {
    ok: boolean;
    mode: 'database' | 'memory' | 'unknown';
  };
  database!: {
    ok: boolean | null;
    status: 'ready' | 'unavailable' | 'unknown';
  };
  queue!: {
    ok: boolean | null;
    mode: 'bullmq' | 'memory' | 'unknown';
    status: 'ready' | 'fallback' | 'unavailable' | 'unknown';
  };
  cvWorker!: {
    ok: boolean;
    configured: boolean;
    url: string | null;
    requestedDetectorMode: 'onnx' | 'mock';
    activeDetectorMode: string | null;
    onnxAvailable: boolean | null;
    modelVersion: string | null;
    modelPath: string | null;
    frameExtractionAvailable: boolean | null;
    error: string | null;
  };
}
