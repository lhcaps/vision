#!/usr/bin/env tsx
/**
 * scripts/seed-db.ts
 *
 * Seeds the PostgreSQL database with a deterministic demo project for local development.
 * Run AFTER `pnpm db:push` and with the API not running.
 *
 * The seed intentionally resets demo inference jobs on every boot. A queued job seeded
 * before the NestJS worker starts is not actually present in BullMQ, so it will never
 * complete and will permanently disable the Run button in the UI.
 *
 * Usage:
 *   pnpm seed:db
 *   pnpm seed:db -- --dry-run
 *   pnpm seed:db -- --reset
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const rootEnv = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnv)) {
  loadEnv({ path: rootEnv });
}

const LOG_PREFIX = '[seed-db]';

function log(msg: string, data?: unknown) {
  if (data) {
    console.log(`${LOG_PREFIX} ${msg}`, data);
  } else {
    console.log(`${LOG_PREFIX} ${msg}`);
  }
}

function logSuccess(msg: string) {
  console.log(`\x1b[32m${LOG_PREFIX} ${msg}\x1b[0m`);
}

function logError(msg: string, err?: unknown) {
  console.error(`\x1b[31m${LOG_PREFIX} ${msg}\x1b[0m`, err ?? '');
}

// ─── Demo data (must stay aligned with apps/web/src/data/demo.ts) ─────────────

const DEMO_PROJECT = {
  id: 'proj_parking_lot',
  name: 'Parking Lot Vision',
  slug: 'parking-lot-vision',
};

const DEMO_DATASET_ID = `ds_${DEMO_PROJECT.id}`;
const DEMO_DATASET_VERSION_ID = 'dataset_proj_parking_lot_parking_v3';
const DEMO_ANNOTATION_SET_ID = `annset_${DEMO_DATASET_VERSION_ID}_manual`;
const DEMO_PIPELINE_ID = 'pipeline_proj_parking_lot_parking_detector';
const DEMO_JOB_ID = 'job_2026_04_28_2036';
const DEMO_JOB_STARTED_AT = new Date('2026-04-28T13:36:00.000Z');
const DEMO_JOB_COMPLETED_AT = new Date('2026-04-28T13:37:30.000Z');

const LEGACY_DATASET_VERSION_ID = `dsv_${DEMO_PROJECT.id}_v1`;
const LEGACY_PIPELINE_ID = `pipe_${DEMO_PROJECT.id}_v1`;
const SEED_ALGORITHM_VERSION = 'eval-v1-iou-0.5-greedy-class-aware';

const DEMO_LABELS = [
  { name: 'car', color: '#6ad9a1' },
  { name: 'van', color: '#5cc8ff' },
  { name: 'truck', color: '#f5b85d' },
  { name: 'person', color: '#f07178' },
];

const DEMO_ASSETS = [
  {
    id: 'asset_frame_1482',
    name: 'north-gate-frame-1482.jpg',
    width: 1920,
    height: 1080,
    checksum: 'sha256:8d1e7a2f',
    split: 'TRAIN' as const,
    status: 'indexed' as const,
  },
  {
    id: 'asset_frame_1506',
    name: 'north-gate-frame-1506.jpg',
    width: 1920,
    height: 1080,
    checksum: 'sha256:40be9c11',
    split: 'VALID' as const,
    status: 'indexed' as const,
  },
  {
    id: 'asset_frame_1519',
    name: 'north-gate-frame-1519.jpg',
    width: 1920,
    height: 1080,
    checksum: 'sha256:7bb31c44',
    split: 'TEST' as const,
    status: 'queued' as const,
  },
];

const DEMO_ANNOTATIONS = [
  {
    id: 'ann_01',
    assetId: 'asset_frame_1482',
    label: 'car',
    geometry: { x: 318, y: 284, width: 344, height: 188 },
    confidence: null,
    source: 'MANUAL' as const,
  },
  {
    id: 'ann_02',
    assetId: 'asset_frame_1482',
    label: 'van',
    geometry: { x: 1014, y: 352, width: 278, height: 162 },
    confidence: null,
    source: 'MANUAL' as const,
  },
  {
    id: 'ann_03',
    assetId: 'asset_frame_1482',
    label: 'truck',
    geometry: { x: 1396, y: 298, width: 260, height: 216 },
    confidence: null,
    source: 'MANUAL' as const,
  },
];

const DEMO_PREDICTIONS = [
  {
    id: 'pred_demo_01',
    assetId: 'asset_frame_1482',
    label: 'car',
    geometry: { x: 318, y: 284, width: 344, height: 188 },
    confidence: 0.941,
  },
  {
    id: 'pred_demo_02',
    assetId: 'asset_frame_1482',
    label: 'van',
    geometry: { x: 1014, y: 352, width: 278, height: 162 },
    confidence: 0.887,
  },
  {
    id: 'pred_demo_03',
    assetId: 'asset_frame_1482',
    label: 'truck',
    geometry: { x: 1396, y: 298, width: 260, height: 216 },
    confidence: 0.731,
  },
];

const DEMO_PIPELINE = {
  name: 'Parking Lot YOLO v1',
  definition: {
    version: 1,
    nodes: [
      { id: 'input', type: 'input', params: {} },
      { id: 'resize', type: 'resize', params: { width: 960 } },
      {
        id: 'detector',
        type: 'yolo_onnx',
        params: { modelId: 'model_onnx_yolov8n_v1', threshold: 0.62 },
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
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const reset = args.includes('--reset');

if (dryRun) log('DRY RUN — no changes will be written to the database');
if (reset) log('RESET mode — will delete existing demo data first');

const prisma = new PrismaClient({
  log: dryRun ? [] : [{ level: 'warn', emit: 'event' }],
});

async function main() {
  log('Starting seed...');
  log(`Database: ${process.env.DATABASE_URL ?? 'not configured'}`);

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured. Copy .env.example to .env first.');
    }

    if (dryRun) {
      log('Dry run completed. Environment is readable and script parsed successfully.');
      return;
    }

    await prisma.$connect();
    log('Connected to PostgreSQL');

    if (reset) {
      await resetDemoProjectBySlug(DEMO_PROJECT.slug);
    }

    // ── 1. Project ──────────────────────────────────────────────────────────
    const project = await prisma.project.upsert({
      where: { slug: DEMO_PROJECT.slug },
      update: { id: DEMO_PROJECT.id, name: DEMO_PROJECT.name },
      create: { id: DEMO_PROJECT.id, name: DEMO_PROJECT.name, slug: DEMO_PROJECT.slug },
    });
    log(`Project: ${project.name} (${project.id})`);

    // ── 2. Label classes ────────────────────────────────────────────────────
    const labelRecords: Record<string, { id: string; name: string; color: string }> = {};
    for (const label of DEMO_LABELS) {
      const record = await prisma.labelClass.upsert({
        where: { projectId_name: { projectId: project.id, name: label.name } },
        update: { color: label.color, type: 'BBOX' },
        create: { projectId: project.id, name: label.name, color: label.color, type: 'BBOX' },
      });
      labelRecords[label.name] = record;
    }
    log(`Labels: ${Object.keys(labelRecords).join(', ')}`);

    // ── 3. Media assets ────────────────────────────────────────────────────
    const assetRecords: Array<{ id: string; name: string }> = [];
    for (const asset of DEMO_ASSETS) {
      const record = await prisma.mediaAsset.upsert({
        where: { id: asset.id },
        update: {
          projectId: project.id,
          type: 'IMAGE',
          storageKey: `originals/${asset.id}/${asset.name}`,
          thumbnailKey: `thumbnails/${asset.id}/${asset.name}`,
          width: asset.width,
          height: asset.height,
          checksum: asset.checksum,
          metadataJson: {
            originalName: asset.name,
            split: asset.split,
            status: asset.status,
          },
        },
        create: {
          id: asset.id,
          projectId: project.id,
          type: 'IMAGE',
          storageKey: `originals/${asset.id}/${asset.name}`,
          thumbnailKey: `thumbnails/${asset.id}/${asset.name}`,
          width: asset.width,
          height: asset.height,
          checksum: asset.checksum,
          metadataJson: {
            originalName: asset.name,
            split: asset.split,
            status: asset.status,
          },
        },
      });
      assetRecords.push({ id: record.id, name: asset.name });
    }
    log(`Assets: ${assetRecords.map((a) => a.name).join(', ')}`);

    // ── 4. Dataset + deterministic version ID ───────────────────────────────
    const dataset = await prisma.dataset.upsert({
      where: { id: DEMO_DATASET_ID },
      update: {
        projectId: project.id,
        name: 'North Gate Camera',
        description: 'Frame sequence from north gate camera at 30fps.',
      },
      create: {
        id: DEMO_DATASET_ID,
        projectId: project.id,
        name: 'North Gate Camera',
        description: 'Frame sequence from north gate camera at 30fps.',
      },
    });

    const existingVersionOne = await prisma.datasetVersion.findUnique({
      where: { datasetId_version: { datasetId: dataset.id, version: 1 } },
      select: { id: true },
    });

    if (existingVersionOne && existingVersionOne.id !== DEMO_DATASET_VERSION_ID) {
      log(
        `Replacing legacy dataset version ${existingVersionOne.id} with ${DEMO_DATASET_VERSION_ID}`
      );
      await deleteDatasetVersionGraph(existingVersionOne.id);
    }

    const datasetVersion = await prisma.datasetVersion.upsert({
      where: { id: DEMO_DATASET_VERSION_ID },
      update: { datasetId: dataset.id, version: 1, status: 'LOCKED' },
      create: {
        id: DEMO_DATASET_VERSION_ID,
        datasetId: dataset.id,
        version: 1,
        status: 'LOCKED',
      },
    });
    log(`Dataset: ${dataset.name}, Version: ${datasetVersion.id} (${datasetVersion.status})`);

    // ── 5. Link assets to version ────────────────────────────────────────────
    for (const asset of DEMO_ASSETS) {
      await prisma.datasetVersionAsset.upsert({
        where: {
          datasetVersionId_assetId: { datasetVersionId: datasetVersion.id, assetId: asset.id },
        },
        update: { split: asset.split },
        create: { datasetVersionId: datasetVersion.id, assetId: asset.id, split: asset.split },
      });
    }
    log(`Assets linked to version: ${assetRecords.length} assets`);

    // ── 6. Annotation set + deterministic annotations ───────────────────────
    const annotationSet = await prisma.annotationSet.upsert({
      where: { id: DEMO_ANNOTATION_SET_ID },
      update: { datasetVersionId: datasetVersion.id, name: 'Manual QA Set', status: 'DRAFT' },
      create: {
        id: DEMO_ANNOTATION_SET_ID,
        datasetVersionId: datasetVersion.id,
        name: 'Manual QA Set',
        status: 'DRAFT',
      },
    });

    await prisma.annotation.deleteMany({ where: { annotationSetId: annotationSet.id } });

    for (const ann of DEMO_ANNOTATIONS) {
      const labelRecord = labelRecords[ann.label];
      if (!labelRecord) continue;

      await prisma.annotation.create({
        data: {
          id: ann.id,
          annotationSetId: annotationSet.id,
          assetId: ann.assetId,
          labelClassId: labelRecord.id,
          type: 'BBOX',
          geometryJson: ann.geometry,
          confidence: ann.confidence,
          source: ann.source,
        },
      });
    }
    log(`Annotations: ${DEMO_ANNOTATIONS.length} deterministic rows`);

    // ── 7. Pipeline ─────────────────────────────────────────────────────────
    await prisma.pipeline.deleteMany({ where: { id: LEGACY_PIPELINE_ID } });

    const pipeline = await prisma.pipeline.upsert({
      where: { id: DEMO_PIPELINE_ID },
      update: {
        projectId: project.id,
        name: DEMO_PIPELINE.name,
        definitionJson: DEMO_PIPELINE.definition,
      },
      create: {
        id: DEMO_PIPELINE_ID,
        projectId: project.id,
        name: DEMO_PIPELINE.name,
        definitionJson: DEMO_PIPELINE.definition,
      },
    });
    log(`Pipeline: ${pipeline.name} (${pipeline.id})`);

    // ── 8. Model artifact ───────────────────────────────────────────────────
    const modelArtifact = await prisma.modelArtifact.upsert({
      where: { id: 'model_onnx_yolov8n_v1' },
      update: {
        projectId: project.id,
        name: 'YOLOv8n',
        type: 'DETECTION',
        runtime: 'ONNX',
        artifactKey: './models/yolov8n.onnx',
        configJson: {
          inputSize: 640,
          confidenceThreshold: 0.25,
          nmsIouThreshold: 0.45,
          classCount: 80,
        },
      },
      create: {
        id: 'model_onnx_yolov8n_v1',
        projectId: project.id,
        name: 'YOLOv8n',
        type: 'DETECTION',
        runtime: 'ONNX',
        artifactKey: './models/yolov8n.onnx',
        configJson: {
          inputSize: 640,
          confidenceThreshold: 0.25,
          nmsIouThreshold: 0.45,
          classCount: 80,
        },
      },
    });
    log(`Model artifact: ${modelArtifact.name} (${modelArtifact.id})`);

    // ── 9. Stable completed job + predictions ───────────────────────────────
    await deleteJobsForProject(project.id);

    const job = await prisma.inferenceJob.create({
      data: {
        id: DEMO_JOB_ID,
        projectId: project.id,
        datasetVersionId: datasetVersion.id,
        pipelineId: pipeline.id,
        modelId: modelArtifact.id,
        status: 'SUCCEEDED',
        progress: 100,
        startedAt: DEMO_JOB_STARTED_AT,
        completedAt: DEMO_JOB_COMPLETED_AT,
        errorMessage: null,
      },
    });

    for (const pred of DEMO_PREDICTIONS) {
      await prisma.prediction.create({
        data: {
          id: pred.id,
          inferenceJobId: job.id,
          assetId: pred.assetId,
          labelClassId: labelRecords[pred.label]?.id ?? null,
          geometryJson: pred.geometry,
          confidence: pred.confidence,
          metadataJson: { source: 'seed-demo' },
        },
      });
    }

    const seedPredictions = DEMO_PREDICTIONS;
    const seedAnnotations = DEMO_ANNOTATIONS.filter((a) => a.source === 'MANUAL');

    const seedInputHash = computeInputHash(
      DEMO_JOB_ID,
      datasetVersion.id,
      seedPredictions.map((p) => ({
        id: p.id,
        assetId: p.assetId,
        label: p.label,
        geometry: p.geometry,
        confidence: p.confidence,
      })),
      seedAnnotations.map((a) => ({
        id: a.id,
        assetId: a.assetId,
        label: a.label,
        geometry: a.geometry,
      })),
      0.5,
      SEED_ALGORITHM_VERSION
    );

    const evaluationReport = {
      id: `eval_seed_${seedInputHash}_${DEMO_JOB_ID.replace(/[^a-z0-9]/gi, '')}`,
      jobId: DEMO_JOB_ID,
      datasetVersionId: datasetVersion.id,
      pipelineId: pipeline.id,
      modelId: modelArtifact.id,
      algorithmVersion: SEED_ALGORITHM_VERSION,
      iouThreshold: 0.5,
      inputHash: seedInputHash,
      metricsHash: 'seed_placeholder',
      precision: 1,
      recall: 1,
      f1: 1,
      meanIoU: 1,
      truePositives: seedPredictions.length,
      falsePositives: 0,
      falseNegatives: 0,
      predictionCount: seedPredictions.length,
      groundTruthCount: seedAnnotations.length,
      assetCount: 1,
      evaluatedAt: DEMO_JOB_COMPLETED_AT.toISOString(),
      perClassMetrics: [
        {
          classKey: 'car',
          label: 'car',
          precision: 1,
          recall: 1,
          f1: 1,
          truePositives: 1,
          falsePositives: 0,
          falseNegatives: 0,
          count: 1,
          meanIou: 1,
        },
        {
          classKey: 'van',
          label: 'van',
          precision: 1,
          recall: 1,
          f1: 1,
          truePositives: 1,
          falsePositives: 0,
          falseNegatives: 0,
          count: 1,
          meanIou: 1,
        },
        {
          classKey: 'truck',
          label: 'truck',
          precision: 1,
          recall: 1,
          f1: 1,
          truePositives: 1,
          falsePositives: 0,
          falseNegatives: 0,
          count: 1,
          meanIou: 1,
        },
      ],
      matches: [
        {
          predictionId: 'pred_demo_01',
          groundTruthId: 'ann_01',
          assetId: 'asset_frame_1482',
          classKey: 'car',
          iou: 1,
        },
        {
          predictionId: 'pred_demo_02',
          groundTruthId: 'ann_02',
          assetId: 'asset_frame_1482',
          classKey: 'van',
          iou: 1,
        },
        {
          predictionId: 'pred_demo_03',
          groundTruthId: 'ann_03',
          assetId: 'asset_frame_1482',
          classKey: 'truck',
          iou: 1,
        },
      ],
    };

    await prisma.evaluationReport.create({
      data: {
        inferenceJobId: job.id,
        metricsJson: evaluationReport as Prisma.InputJsonValue,
        confusionMatrixJson: undefined,
      },
    });

    log(`Inference job: ${job.id} (SUCCEEDED, progress: 100%)`);
    log(`Predictions: ${DEMO_PREDICTIONS.length} seeded`);

    logSuccess(`Seed complete. Project "${project.name}" is ready for local development.`);
    log('');
    log('Summary:');
    log(`  - Project: ${project.id}`);
    log(`  - Dataset version: ${datasetVersion.id} (LOCKED, ${DEMO_ASSETS.length} assets)`);
    log(`  - Annotation workspace: ${DEMO_ANNOTATION_SET_ID}`);
    log(`  - Pipeline: ${pipeline.id}`);
    log(`  - Inference job: ${job.id} (SUCCEEDED)`);
    log('');
    log('Run button should be enabled because no non-terminal seeded job exists.');
  } catch (err) {
    logError('Seed failed', err);
    process.exit(1);
  } finally {
    if (!dryRun) {
      await prisma.$disconnect();
    }
  }
}

async function resetDemoProjectBySlug(slug: string): Promise<void> {
  const existingProject = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existingProject) {
    log('No existing demo project to reset.');
    return;
  }

  log(`Resetting demo project ${existingProject.id}...`);

  await deleteJobsForProject(existingProject.id);

  const datasetIds = (
    await prisma.dataset.findMany({
      where: { projectId: existingProject.id },
      select: { id: true },
    })
  ).map((dataset) => dataset.id);
  const datasetVersionIds = datasetIds.length
    ? (
        await prisma.datasetVersion.findMany({
          where: { datasetId: { in: datasetIds } },
          select: { id: true },
        })
      ).map((version) => version.id)
    : [];
  const annotationSetIds = datasetVersionIds.length
    ? (
        await prisma.annotationSet.findMany({
          where: { datasetVersionId: { in: datasetVersionIds } },
          select: { id: true },
        })
      ).map((set) => set.id)
    : [];
  const assetIds = (
    await prisma.mediaAsset.findMany({
      where: { projectId: existingProject.id },
      select: { id: true },
    })
  ).map((asset) => asset.id);

  if (annotationSetIds.length) {
    await prisma.annotation.deleteMany({ where: { annotationSetId: { in: annotationSetIds } } });
  }
  if (datasetVersionIds.length) {
    await prisma.annotationSet.deleteMany({
      where: { datasetVersionId: { in: datasetVersionIds } },
    });
    await prisma.datasetVersionAsset.deleteMany({
      where: { datasetVersionId: { in: datasetVersionIds } },
    });
    await prisma.datasetVersion.deleteMany({ where: { id: { in: datasetVersionIds } } });
  }
  if (assetIds.length) {
    await prisma.assetDerivative.deleteMany({ where: { assetId: { in: assetIds } } });
  }

  await prisma.dataset.deleteMany({ where: { projectId: existingProject.id } });
  await prisma.pipeline.deleteMany({ where: { projectId: existingProject.id } });
  await prisma.modelArtifact.deleteMany({ where: { projectId: existingProject.id } });
  await prisma.mediaProcessingJob.deleteMany({ where: { projectId: existingProject.id } });
  await prisma.mediaAsset.deleteMany({ where: { projectId: existingProject.id } });
  await prisma.labelClass.deleteMany({ where: { projectId: existingProject.id } });
  await prisma.auditLog.deleteMany({ where: { projectId: existingProject.id } });
  await prisma.project.delete({ where: { id: existingProject.id } });

  log('Reset complete');
}

async function deleteDatasetVersionGraph(datasetVersionId: string): Promise<void> {
  const jobIds = (
    await prisma.inferenceJob.findMany({ where: { datasetVersionId }, select: { id: true } })
  ).map((job) => job.id);

  if (jobIds.length) {
    await prisma.evaluationReport.deleteMany({ where: { inferenceJobId: { in: jobIds } } });
    await prisma.prediction.deleteMany({ where: { inferenceJobId: { in: jobIds } } });
    await prisma.inferenceJob.deleteMany({ where: { id: { in: jobIds } } });
  }

  const annotationSetIds = (
    await prisma.annotationSet.findMany({ where: { datasetVersionId }, select: { id: true } })
  ).map((set) => set.id);

  if (annotationSetIds.length) {
    await prisma.annotation.deleteMany({ where: { annotationSetId: { in: annotationSetIds } } });
  }

  await prisma.annotationSet.deleteMany({ where: { datasetVersionId } });
  await prisma.datasetVersionAsset.deleteMany({ where: { datasetVersionId } });
  await prisma.datasetVersion.delete({ where: { id: datasetVersionId } });
}

async function deleteJobsForProject(projectId: string): Promise<void> {
  const jobIds = (
    await prisma.inferenceJob.findMany({ where: { projectId }, select: { id: true } })
  ).map((job) => job.id);

  if (!jobIds.length) return;

  await prisma.evaluationReport.deleteMany({ where: { inferenceJobId: { in: jobIds } } });
  await prisma.prediction.deleteMany({ where: { inferenceJobId: { in: jobIds } } });
  await prisma.inferenceJob.deleteMany({ where: { id: { in: jobIds } } });
}

function canonicalPredId(p: {
  id: string;
  assetId: string;
  label: string;
  geometry: { x: number; y: number; width: number; height: number };
  confidence: number;
}): string {
  const g = p.geometry;
  return [
    p.id,
    p.assetId,
    p.label,
    g.x.toFixed(1),
    g.y.toFixed(1),
    g.width.toFixed(1),
    g.height.toFixed(1),
    p.confidence.toFixed(3),
  ].join('|');
}

function canonicalGtId(gt: {
  id: string;
  assetId: string;
  label: string;
  geometry: { x: number; y: number; width: number; height: number };
}): string {
  const g = gt.geometry;
  return [
    gt.id,
    gt.assetId,
    gt.label,
    g.x.toFixed(1),
    g.y.toFixed(1),
    g.width.toFixed(1),
    g.height.toFixed(1),
  ].join('|');
}

function computeInputHash(
  jobId: string,
  datasetVersionId: string,
  predictions: Array<{
    id: string;
    assetId: string;
    label: string;
    geometry: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>,
  groundTruth: Array<{
    id: string;
    assetId: string;
    label: string;
    geometry: { x: number; y: number; width: number; height: number };
  }>,
  iouThreshold: number,
  algorithmVersion: string
): string {
  const sortedPreds = [...predictions]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(canonicalPredId);
  const sortedGt = [...groundTruth].sort((a, b) => a.id.localeCompare(b.id)).map(canonicalGtId);
  const content = [
    jobId,
    datasetVersionId,
    iouThreshold.toString(),
    algorithmVersion,
    sortedPreds.join('#'),
    sortedGt.join('#'),
  ].join('||');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

main();
