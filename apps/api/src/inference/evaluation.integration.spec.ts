/**
 * apps/api/src/inference/evaluation.integration.spec.ts
 *
 * DB-backed integration tests for Phase 20D Evaluation Persistence & CI Hardening.
 *
 * These tests use the real Prisma client against the database to verify:
 *   1. DRAFT dataset version evaluation throws ConflictException (409)
 *   2. Annotation leak: two dataset versions sharing the same asset each
 *      have their own GT — evaluating version A must NOT count version B's annotations
 *   3. Upsert-by-hash: running same evaluation twice with identical inputs
 *      creates exactly 1 row (no duplicates)
 *
 * These tests are read-write (they create test data) and should be run
 * against a test database, not against the seeded development database.
 *
 * They are designed to run with `pnpm --filter @visionflow/api test`
 * when DATABASE_URL is set to a test database.
 *
 * Usage (manual, for CI see harness job):
 *   DATABASE_URL=postgresql://... npx vitest run src/inference/evaluation.integration.spec.ts
 */

import { describe, expect, it, afterEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { EvaluationService } from './evaluation.service';
import { PrismaService } from '../prisma/prisma.service';
import { isDatabaseMode } from '../config/app-mode';

const TEST_PREFIX = `vf20d_${Date.now()}`;

function makePrismaService(): PrismaService {
  return new PrismaService() as unknown as PrismaService;
}

let prisma!: PrismaClient;
try {
  const url = process.env.DATABASE_URL;
  if (url) {
    prisma = new PrismaClient({ datasources: { db: { url } } });
  }
} catch {
  // DATABASE_URL not set — tests will be skipped
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function cleanupProject(id: string) {
  if (!prisma) return;
  try {
    await prisma.$executeRaw`DELETE FROM "EvaluationReport" WHERE "inferenceJobId" IN (
      SELECT id FROM "InferenceJob" WHERE "projectId" = ${id}
    )`;
    await prisma.$executeRaw`DELETE FROM "Prediction" WHERE "inferenceJobId" IN (
      SELECT id FROM "InferenceJob" WHERE "projectId" = ${id}
    )`;
    await prisma.$executeRaw`DELETE FROM "InferenceJob" WHERE "projectId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "AnnotationSet" WHERE "datasetVersionId" IN (
      SELECT id FROM "DatasetVersion" WHERE "datasetId" IN (
        SELECT id FROM "Dataset" WHERE "projectId" = ${id}
      )
    )`;
    await prisma.$executeRaw`DELETE FROM "DatasetVersionAsset" WHERE "datasetVersionId" IN (
      SELECT id FROM "DatasetVersion" WHERE "datasetId" IN (
        SELECT id FROM "Dataset" WHERE "projectId" = ${id}
      )
    )`;
    await prisma.$executeRaw`DELETE FROM "DatasetVersion" WHERE "datasetId" IN (
      SELECT id FROM "Dataset" WHERE "projectId" = ${id}
    )`;
    await prisma.$executeRaw`DELETE FROM "MediaAsset" WHERE "projectId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "Dataset" WHERE "projectId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "LabelClass" WHERE "projectId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "Pipeline" WHERE "projectId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "ModelArtifact" WHERE "projectId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "Project" WHERE id = ${id}`;
  } catch {
    // ignore cleanup errors
  }
}

async function seedTwoVersionsSharingAsset(
  projectId: string,
  assetId: string,
  labelClassId: string
): Promise<{
  versionA: string;
  versionB: string;
  annSetA: string;
  annSetB: string;
  jobId: string;
  pipelineId: string;
  modelId: string;
}> {
  const versionA = `${TEST_PREFIX}_verA`;
  const versionB = `${TEST_PREFIX}_verB`;
  const annSetA = `${TEST_PREFIX}_annSetA`;
  const annSetB = `${TEST_PREFIX}_annSetB`;
  const pipelineId = `${TEST_PREFIX}_pipe`;
  const modelId = `${TEST_PREFIX}_model`;
  const jobId = `${TEST_PREFIX}_job`;

  await prisma.project.create({ data: { id: projectId, name: 'Test Project', slug: projectId } });

  await prisma.labelClass.create({
    data: { id: labelClassId, projectId, name: 'car', color: '#6ad9a1', type: 'BBOX' },
  });

  await prisma.mediaAsset.create({
    data: {
      id: assetId,
      projectId,
      type: 'IMAGE',
      storageKey: `originals/${assetId}/frame.jpg`,
      width: 1920,
      height: 1080,
      checksum: `sha256:${assetId}`,
      metadataJson: {},
    },
  });

  const dataset = await prisma.dataset.create({
    data: { id: `${TEST_PREFIX}_ds`, projectId, name: 'Test Dataset' },
  });

  // Version A — LOCKED
  await prisma.datasetVersion.create({
    data: { id: versionA, datasetId: dataset.id, version: 1, status: 'LOCKED' },
  });
  await prisma.datasetVersionAsset.create({
    data: { datasetVersionId: versionA, assetId, split: 'TRAIN' },
  });
  await prisma.annotationSet.create({
    data: { id: annSetA, datasetVersionId: versionA, name: 'GT Set A', status: 'APPROVED' },
  });
  // GT A: car at (100, 100, 200, 200)
  await prisma.annotation.create({
    data: {
      id: `${TEST_PREFIX}_annA`,
      annotationSetId: annSetA,
      assetId,
      labelClassId,
      type: 'BBOX',
      geometryJson: { x: 100, y: 100, width: 200, height: 200 },
      source: 'MANUAL',
    },
  });

  // Version B — also LOCKED but has DIFFERENT GT for the same asset
  await prisma.datasetVersion.create({
    data: { id: versionB, datasetId: dataset.id, version: 2, status: 'LOCKED' },
  });
  await prisma.datasetVersionAsset.create({
    data: { datasetVersionId: versionB, assetId, split: 'TRAIN' },
  });
  await prisma.annotationSet.create({
    data: { id: annSetB, datasetVersionId: versionB, name: 'GT Set B', status: 'APPROVED' },
  });
  // GT B: car at (300, 300, 100, 100) — different position
  await prisma.annotation.create({
    data: {
      id: `${TEST_PREFIX}_annB`,
      annotationSetId: annSetB,
      assetId,
      labelClassId,
      type: 'BBOX',
      geometryJson: { x: 300, y: 300, width: 100, height: 100 },
      source: 'MANUAL',
    },
  });

  await prisma.pipeline.create({
    data: { id: pipelineId, projectId, name: 'Test Pipeline', definitionJson: {} },
  });
  await prisma.modelArtifact.create({
    data: {
      id: modelId,
      projectId,
      name: 'Test Model',
      type: 'DETECTION',
      runtime: 'MOCK',
      artifactKey: 'mock',
      configJson: {},
    },
  });

  // Job attached to version A
  await prisma.inferenceJob.create({
    data: {
      id: jobId,
      projectId,
      datasetVersionId: versionA,
      pipelineId,
      modelId,
      status: 'SUCCEEDED',
      progress: 100,
    },
  });

  // Prediction at GT A position (perfect match with version A GT)
  await prisma.prediction.create({
    data: {
      id: `${TEST_PREFIX}_pred`,
      inferenceJobId: jobId,
      assetId,
      labelClassId,
      geometryJson: { x: 100, y: 100, width: 200, height: 200 },
      confidence: 0.95,
      metadataJson: { source: 'test' },
    },
  });

  return { versionA, versionB, annSetA, annSetB, jobId, pipelineId, modelId };
}

// ── Skip if not in database mode ────────────────────────────────────────────

const describeIfDb = isDatabaseMode() && prisma ? describe : describe.skip;

describeIfDb('EvaluationService — Phase 20D Integration Tests', () => {
  const evalService = new EvaluationService(makePrismaService());

  afterEach(async () => {
    if (!prisma) return;
    await cleanupProject(`${TEST_PREFIX}_proj`);
    await cleanupProject(`${TEST_PREFIX}_projB`);
  });

  // ── Test 1: DRAFT dataset version throws ConflictException ────────────────────

  it('runEvaluation throws ConflictException when dataset version is DRAFT', async () => {
    const projectId = `${TEST_PREFIX}_proj`;

    await prisma.project.create({ data: { id: projectId, name: 'DRAFT Test', slug: projectId } });

    const labelClass = await prisma.labelClass.create({
      data: { id: `${TEST_PREFIX}_lc`, projectId, name: 'car', color: '#6ad9a1', type: 'BBOX' },
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        id: `${TEST_PREFIX}_asset`,
        projectId,
        type: 'IMAGE',
        storageKey: 'test.jpg',
        width: 1920,
        height: 1080,
        checksum: 'sha256:draft_test',
        metadataJson: {},
      },
    });

    const dataset = await prisma.dataset.create({
      data: { id: `${TEST_PREFIX}_ds`, projectId, name: 'Draft DS' },
    });

    const version = await prisma.datasetVersion.create({
      data: { id: `${TEST_PREFIX}_ver`, datasetId: dataset.id, version: 1, status: 'DRAFT' },
    });

    await prisma.datasetVersionAsset.create({
      data: { datasetVersionId: version.id, assetId: asset.id, split: 'TRAIN' },
    });

    const pipeline = await prisma.pipeline.create({
      data: { id: `${TEST_PREFIX}_pipe`, projectId, name: 'Pipe', definitionJson: {} },
    });

    const model = await prisma.modelArtifact.create({
      data: {
        id: `${TEST_PREFIX}_model`,
        projectId,
        name: 'Model',
        type: 'DETECTION',
        runtime: 'MOCK',
        artifactKey: 'mock',
        configJson: {},
      },
    });

    const job = await prisma.inferenceJob.create({
      data: {
        id: `${TEST_PREFIX}_job`,
        projectId,
        datasetVersionId: version.id,
        pipelineId: pipeline.id,
        modelId: model.id,
        status: 'SUCCEEDED',
        progress: 100,
      },
    });

    await prisma.prediction.create({
      data: {
        id: `${TEST_PREFIX}_pred`,
        inferenceJobId: job.id,
        assetId: asset.id,
        labelClassId: labelClass.id,
        geometryJson: { x: 0, y: 0, width: 100, height: 100 },
        confidence: 0.9,
        metadataJson: {},
      },
    });

    await expect(evalService.runEvaluation({ jobId: job.id })).rejects.toThrow(ConflictException);
    await expect(evalService.runEvaluation({ jobId: job.id })).rejects.toThrow(
      /Evaluation requires a LOCKED dataset version/
    );
  });

  // ── Test 2: Annotation leak — version B annotations must NOT affect version A evaluation ─

  it('evaluating job on version A uses only version A annotations — version B annotations are isolated', async () => {
    const projectId = `${TEST_PREFIX}_projB`;
    const assetId = `${TEST_PREFIX}_shared_asset`;
    const labelClassId = `${TEST_PREFIX}_lc`;

    const { jobId } = await seedTwoVersionsSharingAsset(projectId, assetId, labelClassId);

    // Run evaluation on the job (which belongs to version A)
    const report = await evalService.runEvaluation({ jobId });

    // The prediction matches version A's GT perfectly (identical box at 100,100,200,200)
    // So TP=1, FP=0, FN=0 for "car"
    expect(report.truePositives).toBe(1);
    expect(report.falsePositives).toBe(0);
    expect(report.falseNegatives).toBe(0);
    expect(report.groundTruthCount).toBe(1); // version A has exactly 1 GT annotation

    // Version B's annotation (at 300,300,100,100) must NOT be counted as a GT annotation
    // If the leak existed, we'd see groundTruthCount=2 and FN=1
    expect(report.groundTruthCount).toBe(1);

    // Verify the evaluation used version A's annotation, not version B's.
    // The prediction at (100,100,200,200) IoU=1 with GT at (100,100,200,200).
    // With the leak, the FN would appear because the prediction doesn't match
    // version B's GT at (300,300,100,100).
    expect(report.falseNegatives).toBe(0);
  });

  // ── Test 3: Upsert-by-hash — duplicate same-input evaluation creates no duplicate rows ─

  it('running same evaluation twice produces exactly 1 EvaluationReport row', async () => {
    const projectId = `${TEST_PREFIX}_proj`;

    await prisma.project.create({ data: { id: projectId, name: 'Upsert Test', slug: projectId } });

    const labelClass = await prisma.labelClass.create({
      data: { id: `${TEST_PREFIX}_lc`, projectId, name: 'car', color: '#6ad9a1', type: 'BBOX' },
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        id: `${TEST_PREFIX}_asset`,
        projectId,
        type: 'IMAGE',
        storageKey: 'test.jpg',
        width: 1920,
        height: 1080,
        checksum: 'sha256:upsert_test',
        metadataJson: {},
      },
    });

    const dataset = await prisma.dataset.create({
      data: { id: `${TEST_PREFIX}_ds`, projectId, name: 'Upsert DS' },
    });

    const version = await prisma.datasetVersion.create({
      data: { id: `${TEST_PREFIX}_ver`, datasetId: dataset.id, version: 1, status: 'LOCKED' },
    });

    await prisma.datasetVersionAsset.create({
      data: { datasetVersionId: version.id, assetId: asset.id, split: 'TRAIN' },
    });

    const annSet = await prisma.annotationSet.create({
      data: {
        id: `${TEST_PREFIX}_annset`,
        datasetVersionId: version.id,
        name: 'GT',
        status: 'APPROVED',
      },
    });

    await prisma.annotation.create({
      data: {
        id: `${TEST_PREFIX}_ann`,
        annotationSetId: annSet.id,
        assetId: asset.id,
        labelClassId: labelClass.id,
        type: 'BBOX',
        geometryJson: { x: 100, y: 100, width: 200, height: 200 },
        source: 'MANUAL',
      },
    });

    const pipeline = await prisma.pipeline.create({
      data: { id: `${TEST_PREFIX}_pipe`, projectId, name: 'Pipe', definitionJson: {} },
    });

    const model = await prisma.modelArtifact.create({
      data: {
        id: `${TEST_PREFIX}_model`,
        projectId,
        name: 'Model',
        type: 'DETECTION',
        runtime: 'MOCK',
        artifactKey: 'mock',
        configJson: {},
      },
    });

    const job = await prisma.inferenceJob.create({
      data: {
        id: `${TEST_PREFIX}_job`,
        projectId,
        datasetVersionId: version.id,
        pipelineId: pipeline.id,
        modelId: model.id,
        status: 'SUCCEEDED',
        progress: 100,
      },
    });

    await prisma.prediction.create({
      data: {
        id: `${TEST_PREFIX}_pred`,
        inferenceJobId: job.id,
        assetId: asset.id,
        labelClassId: labelClass.id,
        geometryJson: { x: 100, y: 100, width: 200, height: 200 },
        confidence: 0.95,
        metadataJson: {},
      },
    });

    // First evaluation run
    const report1 = await evalService.runEvaluation({ jobId: job.id });

    const countBefore = await prisma.evaluationReport.count({
      where: { inferenceJobId: job.id, inputHash: report1.inputHash },
    });
    expect(countBefore).toBe(1);

    // Second evaluation run with IDENTICAL inputs — should update, not create
    const report2 = await evalService.runEvaluation({ jobId: job.id });

    const countAfter = await prisma.evaluationReport.count({
      where: { inferenceJobId: job.id, inputHash: report2.inputHash },
    });

    // Exactly 1 row must exist — upsert prevents duplicates
    expect(countAfter).toBe(1);

    // Both runs return the same stable metricsHash
    expect(report2.metricsHash).toBe(report1.metricsHash);
  });
});
