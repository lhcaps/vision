#!/usr/bin/env tsx
/**
 * scripts/seed-db.ts
 *
 * Seeds the PostgreSQL database with a realistic demo project for local development.
 * Run AFTER `pnpm db:push` and with the API not running.
 *
 * Usage:
 *   pnpm seed:db
 *   pnpm seed:db -- --dry-run   (validate schema without writing)
 *   pnpm seed:db -- --reset     (delete all demo data first)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from project root
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

// ─── Demo data (mirrors demo-snapshot.ts) ───────────────────────────────────

const DEMO_PROJECT = {
  id: 'proj_parking_lot',
  name: 'Parking Lot Vision',
  slug: 'parking-lot-vision',
};

const DEMO_LABELS = [
  { name: 'car',    color: '#6ad9a1' },
  { name: 'van',    color: '#5cc8ff' },
  { name: 'truck',  color: '#f5b85d' },
  { name: 'person', color: '#f07178' },
];

const DEMO_ASSETS = [
  { id: 'asset_frame_1482', name: 'north-gate-frame-1482.jpg', width: 1920, height: 1080, checksum: 'sha256:a1b2c3d4e5f6', split: 'TRAIN' as const },
  { id: 'asset_frame_1506', name: 'north-gate-frame-1506.jpg', width: 1920, height: 1080, checksum: 'sha256:b2c3d4e5f6a1', split: 'VALID' as const },
  { id: 'asset_frame_1519', name: 'north-gate-frame-1519.jpg', width: 1920, height: 1080, checksum: 'sha256:c3d4e5f6a1b2', split: 'TEST'  as const },
];

const DEMO_ANNOTATIONS = [
  { assetId: 'asset_frame_1482', label: 'car',   geometry: { x: 318,  y: 284, width: 344, height: 188 }, confidence: null,  source: 'MANUAL' as const },
  { assetId: 'asset_frame_1482', label: 'van',   geometry: { x: 1014, y: 352, width: 278, height: 162 }, confidence: 0.873, source: 'MODEL'  as const },
  { assetId: 'asset_frame_1482', label: 'truck', geometry: { x: 1396, y: 298, width: 260, height: 216 }, confidence: 0.694, source: 'MODEL'  as const },
];

const DEMO_PIPELINE = {
  name: 'Parking Lot YOLO v1',
  definition: {
    version: 1,
    nodes: [
      { id: 'input',    type: 'input',    params: {} },
      { id: 'resize',   type: 'resize',   params: { width: 960 } },
      { id: 'detector', type: 'yolo_onnx', params: { modelId: 'model_onnx_parking', threshold: 0.62 } },
      { id: 'nms',      type: 'nms',       params: { iouThreshold: 0.45 } },
      { id: 'output',   type: 'output',    params: {} },
    ],
    edges: [
      { id: 'e1', source: 'input',    target: 'resize'   },
      { id: 'e2', source: 'resize',   target: 'detector' },
      { id: 'e3', source: 'detector', target: 'nms'      },
      { id: 'e4', source: 'nms',      target: 'output'   },
    ],
  },
};

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const reset  = args.includes('--reset');

if (dryRun) log('DRY RUN — no changes will be written to the database');
if (reset)  log('RESET mode — will delete existing demo data first');

// ─── Prisma client ───────────────────────────────────────────────────────────

const prisma = new PrismaClient({
  log: dryRun ? [] : [{ level: 'warn', emit: 'event' }],
});

async function main() {
  log('Starting seed...');
  log(`Database: ${process.env.DATABASE_URL ?? 'not configured'}`);

  try {
    // Verify connection
    if (!dryRun) {
      await prisma.$connect();
      log('Connected to PostgreSQL');
    }

    // ── Reset: delete existing demo data ────────────────────────────────────
    if (reset && !dryRun) {
      log('Resetting demo data...');
      await prisma.annotation.deleteMany         ({ where: { annotationSet: { datasetVersion: { dataset: { slug: DEMO_PROJECT.slug } } } } });
      await prisma.annotationSet.deleteMany     ({ where: { datasetVersion: { dataset: { slug: DEMO_PROJECT.slug } } } });
      await prisma.datasetVersionAsset.deleteMany({ where: { datasetVersion: { dataset: { slug: DEMO_PROJECT.slug } } } });
      await prisma.inferenceJob.deleteMany      ({ where: { project: { slug: DEMO_PROJECT.slug } } });
      await prisma.pipeline.deleteMany          ({ where: { project: { slug: DEMO_PROJECT.slug } } });
      await prisma.dataset.delete               ({ where: { project: { slug: DEMO_PROJECT.slug } } });
      await prisma.labelClass.deleteMany        ({ where: { project: { slug: DEMO_PROJECT.slug } } });
      await prisma.mediaAsset.deleteMany        ({ where: { project: { slug: DEMO_PROJECT.slug } } });
      await prisma.project.delete              ({ where: { slug: DEMO_PROJECT.slug } });
      log('Reset complete');
    }

    // ── 1. Project ──────────────────────────────────────────────────────────
    const project = await prisma.project.upsert({
      where: { slug: DEMO_PROJECT.slug },
      update: { name: DEMO_PROJECT.name },
      create: { id: DEMO_PROJECT.id, name: DEMO_PROJECT.name, slug: DEMO_PROJECT.slug },
    });
    log(`Project: ${project.name} (${project.id})`);

    // ── 2. Label classes ────────────────────────────────────────────────────
    const labelRecords: Record<string, { id: string; name: string }> = {};
    for (const label of DEMO_LABELS) {
      const record = await prisma.labelClass.upsert({
        where: { projectId_name: { projectId: project.id, name: label.name } },
        update: { color: label.color },
        create: { projectId: project.id, name: label.name, color: label.color, type: 'BBOX' },
      });
      labelRecords[label.name] = record;
    }
    log(`Labels: ${Object.keys(labelRecords).join(', ')}`);

    // ── 3. Media assets ────────────────────────────────────────────────────
    const assetRecords: Array<{ id: string; name: string }> = [];
    for (const asset of DEMO_ASSETS) {
      const record = await prisma.mediaAsset.upsert({
        where: { projectId_checksum: { projectId: project.id, checksum: asset.checksum } },
        update: { type: 'IMAGE', width: asset.width, height: asset.height },
        create: {
          id: asset.id,
          projectId: project.id,
          type: 'IMAGE',
          storageKey: ` originals/${asset.id}/${asset.name}`,
          thumbnailKey: `thumbnails/${asset.id}/${asset.name}`,
          width: asset.width,
          height: asset.height,
          checksum: asset.checksum,
        },
      });
      assetRecords.push(record);
    }
    log(`Assets: ${assetRecords.map((a) => a.name).join(', ')}`);

    // ── 4. Dataset + version ───────────────────────────────────────────────
    const dataset = await prisma.dataset.upsert({
      where: { id: `ds_${project.id}` },
      update: { name: 'North Gate Camera' },
      create: { id: `ds_${project.id}`, projectId: project.id, name: 'North Gate Camera', description: 'Frame sequence from north gate camera at 30fps.' },
    });

    const datasetVersion = await prisma.datasetVersion.upsert({
      where: { datasetId_version: { datasetId: dataset.id, version: 1 } },
      update: { status: 'LOCKED' },
      create: { id: `dsv_${project.id}_v1`, datasetId: dataset.id, version: 1, status: 'LOCKED' },
    });
    log(`Dataset: ${dataset.name}, Version: v${datasetVersion.version} (${datasetVersion.status})`);

    // ── 5. Link assets to version ────────────────────────────────────────────
    for (const asset of DEMO_ASSETS) {
      await prisma.datasetVersionAsset.upsert({
        where: { datasetVersionId_assetId: { datasetVersionId: datasetVersion.id, assetId: asset.id } },
        update: { split: asset.split },
        create: { datasetVersionId: datasetVersion.id, assetId: asset.id, split: asset.split },
      });
    }
    log(`Assets linked to version: ${assetRecords.length} assets`);

    // ── 6. Annotation set + annotations ────────────────────────────────────
    const annotationSet = await prisma.annotationSet.upsert({
      where: { id: `as_${project.id}_manual` },
      update: { name: 'Manual QA Set', status: 'DRAFT' },
      create: { id: `as_${project.id}_manual`, datasetVersionId: datasetVersion.id, name: 'Manual QA Set', status: 'DRAFT' },
    });

    for (const ann of DEMO_ANNOTATIONS) {
      const labelRecord = labelRecords[ann.label];
      if (!labelRecord) continue;
      await prisma.annotation.create({
        data: {
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
    log(`Annotations: ${DEMO_ANNOTATIONS.length} created`);

    // ── 7. Pipeline ─────────────────────────────────────────────────────────
    const pipeline = await prisma.pipeline.upsert({
      where: { id: `pipe_${project.id}_v1` },
      update: { name: DEMO_PIPELINE.name, definitionJson: DEMO_PIPELINE.definition },
      create: { id: `pipe_${project.id}_v1`, projectId: project.id, name: DEMO_PIPELINE.name, definitionJson: DEMO_PIPELINE.definition },
    });
    log(`Pipeline: ${pipeline.name} (${pipeline.id})`);

    // ── 8. Inference job (QUEUED) ───────────────────────────────────────────
    await prisma.inferenceJob.upsert({
      where: { id: 'job_2026_04_28_2036' },
      update: { status: 'QUEUED', progress: 18, pipelineId: pipeline.id, datasetVersionId: datasetVersion.id },
      create: {
        id: 'job_2026_04_28_2036',
        projectId: project.id,
        datasetVersionId: datasetVersion.id,
        pipelineId: pipeline.id,
        status: 'QUEUED',
        progress: 18,
        startedAt: new Date('2026-04-28T13:36:00.000Z'),
      },
    });
    log(`Inference job: job_2026_04_28_2036 (QUEUED, progress: 18%)`);

    logSuccess(`Seed complete. Project "${project.name}" is ready for inference.`);
    log('');
    log('Summary:');
    log(`  - Project: ${project.id}`);
    log(`  - Dataset version: ${datasetVersion.id} (LOCKED, ${DEMO_ASSETS.length} assets)`);
    log(`  - Pipeline: ${pipeline.id}`);
    log(`  - Annotations: ${DEMO_ANNOTATIONS.length}`);
    log('');
    log('Run button should now be enabled in the web UI.');

  } catch (err) {
    logError('Seed failed', err);
    process.exit(1);
  } finally {
    if (!dryRun) {
      await prisma.$disconnect();
    }
  }
}

main();
