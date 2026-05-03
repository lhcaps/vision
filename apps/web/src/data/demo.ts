import { ProjectSnapshot, validatePipelineDefinition } from '@visionflow/contracts';

export const demoSnapshot: ProjectSnapshot = {
  project: {
    id: 'proj_parking_lot',
    name: 'Parking Lot Vision',
    assetCount: 20,
    datasetVersion: 'v1.3 locked',
  },
  media: [
    {
      id: 'asset_frame_1482',
      name: 'north-gate-frame-1482.jpg',
      type: 'IMAGE',
      width: 1920,
      height: 1080,
      checksum: 'sha256:8d1e7a2f',
      split: 'TRAIN',
      status: 'indexed',
    },
    {
      id: 'asset_frame_1506',
      name: 'north-gate-frame-1506.jpg',
      type: 'IMAGE',
      width: 1920,
      height: 1080,
      checksum: 'sha256:40be9c11',
      split: 'VALID',
      status: 'indexed',
    },
    {
      id: 'asset_frame_1519',
      name: 'north-gate-frame-1519.jpg',
      type: 'IMAGE',
      width: 1920,
      height: 1080,
      checksum: 'sha256:7bb31c44',
      split: 'TEST',
      status: 'queued',
    },
  ],
  annotations: [
    {
      id: 'ann_01',
      assetId: 'asset_frame_1482',
      label: 'car',
      color: '#6ad9a1',
      geometry: { x: 318, y: 284, width: 344, height: 188 },
      source: 'MANUAL',
    },
    {
      id: 'ann_02',
      assetId: 'asset_frame_1482',
      label: 'van',
      color: '#5cc8ff',
      geometry: { x: 1014, y: 352, width: 278, height: 162 },
      source: 'MODEL',
      confidence: 0.873,
    },
    {
      id: 'ann_03',
      assetId: 'asset_frame_1482',
      label: 'truck',
      color: '#f5b85d',
      geometry: { x: 1396, y: 298, width: 260, height: 216 },
      source: 'MODEL',
      confidence: 0.694,
    },
  ],
  pipeline: {
    version: 1,
    nodes: [
      { id: 'input', type: 'input', params: {} },
      { id: 'resize', type: 'resize', params: { width: 960 } },
      {
        id: 'detector',
        type: 'yolo_onnx',
        params: { modelId: 'model_onnx_parking', threshold: 0.62 },
      },
      { id: 'nms', type: 'nms', params: { iouThreshold: 0.45 } },
      { id: 'output', type: 'output', params: {} },
    ],
    edges: [
      { id: 'e1', source: 'input', target: 'resize' },
      { id: 'e2', source: 'resize', target: 'detector' },
      { id: 'e3', source: 'detector', target: 'nms' },
      { id: 'e4', source: 'nms', target: 'output' },
    ],
  },
  job: {
    id: 'job_2026_04_28_2036',
    status: 'SUCCEEDED',
    progress: 100,
    startedAt: '2026-04-28T13:36:00.000Z',
  },
};

export const pipelineValidation = validatePipelineDefinition(demoSnapshot.pipeline);

export const logs = [
  'seeded demo job completed successfully',
  'dataset version v1.3 locked, 3 demo assets resolved',
  'cv-worker mode selected: mock_detector',
  'prediction persistence ready for batched createMany',
];
