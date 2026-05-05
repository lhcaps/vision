#!/usr/bin/env tsx
/**
 * scripts/fixtures/visionflow-fixtures.ts
 *
 * Canonical fixture IDs for the VisionFlow demo project.
 *
 * These constants are the single source of truth for all hard-coded IDs
 * used across seed scripts, harnesses, and smoke commands.
 * They are verified against the seeded database state in the Phase 22A harness.
 *
 * Usage:
 *   import { FIXTURE_IDS } from './fixtures/visionflow-fixtures';
 */

export const FIXTURE_IDS = {
  project: {
    id: 'proj_parking_lot',
    name: 'Parking Lot Vision',
    slug: 'parking-lot-vision',
  },

  dataset: {
    id: 'ds_proj_parking_lot',
  },

  datasetVersion: {
    id: 'dataset_proj_parking_lot_parking_v3',
    version: 1,
    status: 'LOCKED' as const,
  },

  annotationWorkspace: {
    annotationSetId: 'annset_dataset_proj_parking_lot_parking_v3_manual',
    assetId: 'asset_frame_1482',
  },

  assets: [
    {
      id: 'asset_frame_1482',
      name: 'north-gate-frame-1482.jpg',
      width: 1920,
      height: 1080,
      split: 'TRAIN' as const,
    },
    {
      id: 'asset_frame_1506',
      name: 'north-gate-frame-1506.jpg',
      width: 1920,
      height: 1080,
      split: 'VALID' as const,
    },
    {
      id: 'asset_frame_1519',
      name: 'north-gate-frame-1519.jpg',
      width: 1920,
      height: 1080,
      split: 'TEST' as const,
    },
  ],

  pipeline: {
    id: 'pipeline_proj_parking_lot_parking_detector',
    name: 'Parking Lot YOLO v1',
    modelId: 'model_onnx_yolov8n_v1',
  },

  modelArtifact: {
    id: 'model_onnx_yolov8n_v1',
    name: 'YOLOv8n',
    type: 'DETECTION' as const,
    runtime: 'ONNX' as const,
    inputSize: 640,
    confidenceThreshold: 0.25,
    nmsIouThreshold: 0.45,
  },

  inferenceJob: {
    id: 'job_2026_04_28_2036',
    status: 'SUCCEEDED' as const,
  },

  evaluation: {
    // inputHash and metricsHash are computed dynamically from full report payload
    // via computeEvaluationMetricsHash() — verified by Phase 22A harness Check 15
    // Note: actual seeded values differ from Phase 20C artifact (which captured
    // intermediate state). Current seed produces inputHash=04c479cae541f764,
    // metricsHash=aaeb4afcf040b08f — verified by live harness run.
    inputHash: '04c479cae541f764',
    algorithmVersion: 'eval-v1-iou-0.5-greedy-class-aware',
    iouThreshold: 0.5,
    predictionCount: 3,
    groundTruthCount: 3,
  },

  annotations: [
    { id: 'ann_01', assetId: 'asset_frame_1482', label: 'car' },
    { id: 'ann_02', assetId: 'asset_frame_1482', label: 'van' },
    { id: 'ann_03', assetId: 'asset_frame_1482', label: 'truck' },
  ],

  predictions: [
    { id: 'pred_demo_01', assetId: 'asset_frame_1482', label: 'car' },
    { id: 'pred_demo_02', assetId: 'asset_frame_1482', label: 'van' },
    { id: 'pred_demo_03', assetId: 'asset_frame_1482', label: 'truck' },
  ],

  labels: [
    { name: 'car', color: '#6ad9a1' },
    { name: 'van', color: '#5cc8ff' },
    { name: 'truck', color: '#f5b85d' },
    { name: 'person', color: '#f07178' },
  ],
} as const;

export type FixtureIds = typeof FIXTURE_IDS;
