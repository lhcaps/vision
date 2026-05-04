import { createHash } from 'node:crypto';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  EvaluationReport,
  EvaluationReportSchema,
  EvaluationMatchSchema,
  PredictionSummary,
  RunEvaluationRequestSchema,
} from '@visionflow/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { isDatabaseMode } from '../config/app-mode';
import { demoSnapshot } from '../projects/demo-snapshot';
import { resolvePredictionClass } from './label-mapper';
import {
  ALGORITHM_VERSION,
  DEFAULT_IOU_THRESHOLD,
  computeEvaluationInputHash,
  computeEvaluationMetricsHash,
  type EvaluationGroundTruth,
  type EvaluationPrediction,
  type EvaluationMatch,
} from './evaluation-hash';
import { computeEvaluationMetrics, type EvaluationResult } from './evaluation-algorithm';

@Injectable()
export class EvaluationService {
  private readonly prisma: PrismaClient;

  constructor(private readonly ps: PrismaService) {
    this.prisma = ps as PrismaClient;
  }

  async getEvaluationReport(jobId: string): Promise<EvaluationReport | null> {
    if (!isDatabaseMode()) {
      return null;
    }

    const row = await this.prisma.evaluationReport.findFirst({
      where: { inferenceJobId: jobId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        datasetVersionId: true,
        pipelineId: true,
        modelId: true,
        algorithmVersion: true,
        iouThreshold: true,
        inputHash: true,
        metricsHash: true,
        metricsJson: true,
      },
    });

    if (!row) return null;

    const raw = row.metricsJson as Record<string, unknown>;

    // First: try strict parse of the full schema.
    const strictResult = EvaluationReportSchema.safeParse(raw);
    if (strictResult.success) {
      // Cross-check row scalar columns against parsed JSON payload.
      // If any column/JSON mismatch is detected, treat the report as corrupt
      // and return null rather than silently returning inconsistent data.
      const report = strictResult.data;
      const mismatch =
        row.inputHash !== report.inputHash ||
        row.metricsHash !== report.metricsHash ||
        row.datasetVersionId !== report.datasetVersionId ||
        row.algorithmVersion !== report.algorithmVersion ||
        row.iouThreshold !== report.iouThreshold;

      if (mismatch) {
        return null;
      }
      return report;
    }

    // Second: legacy adapter for known partial/old shapes.
    // Only adapters for reports that are MISSING the optional `matches` field
    // but have ALL required summary fields. Returns null if the report cannot
    // be safely adapted to a valid full schema.
    const legacyResult = EvaluationReportSchema.partial().safeParse(raw);
    if (legacyResult.success) {
      const partial = legacyResult.data;

      // Required summary fields — if any are missing, the report is unrecoverable.
      const requiredSummaryFields = [
        'id',
        'jobId',
        'datasetVersionId',
        'pipelineId',
        'modelId',
        'algorithmVersion',
        'iouThreshold',
        'inputHash',
        'metricsHash',
        'precision',
        'recall',
        'f1',
        'meanIoU',
        'truePositives',
        'falsePositives',
        'falseNegatives',
        'predictionCount',
        'groundTruthCount',
        'assetCount',
        'evaluatedAt',
      ];

      const missingSummary = requiredSummaryFields.filter((f) => !(f in partial));
      if (missingSummary.length === 0 && partial.perClassMetrics) {
        // All required summary fields present — safe to construct full report.
        const adapted: EvaluationReport = {
          id: partial.id as string,
          jobId: partial.jobId as string,
          datasetVersionId: partial.datasetVersionId as string,
          pipelineId: (partial.pipelineId as string | null) ?? null,
          modelId: (partial.modelId as string | null) ?? null,
          algorithmVersion: partial.algorithmVersion as string,
          iouThreshold: partial.iouThreshold as number,
          inputHash: partial.inputHash as string,
          metricsHash: partial.metricsHash as string,
          precision: partial.precision as number,
          recall: partial.recall as number,
          f1: partial.f1 as number,
          meanIoU: partial.meanIoU as number,
          truePositives: partial.truePositives as number,
          falsePositives: partial.falsePositives as number,
          falseNegatives: partial.falseNegatives as number,
          predictionCount: partial.predictionCount as number,
          groundTruthCount: partial.groundTruthCount as number,
          assetCount: partial.assetCount as number,
          evaluatedAt: partial.evaluatedAt as string,
          perClassMetrics: partial.perClassMetrics as EvaluationReport['perClassMetrics'],
          matches: partial.matches as EvaluationReport['matches'],
        };

        // Validate the adapted object against the full schema.
        const adaptedResult = EvaluationReportSchema.safeParse(adapted);
        if (adaptedResult.success) {
          return adaptedResult.data;
        }
      }
    }

    // Neither strict nor legacy adapter succeeded — report is corrupt or unknown shape.
    return null;
  }

  async runEvaluation(dto: unknown): Promise<EvaluationReport> {
    const body = RunEvaluationRequestSchema.parse(dto);
    const { jobId, iouThreshold = DEFAULT_IOU_THRESHOLD } = body;

    if (!isDatabaseMode()) {
      return this.runMemoryEvaluation(jobId, iouThreshold);
    }

    const job = await this.prisma.inferenceJob.findUnique({
      where: { id: jobId },
      include: { model: true, pipeline: true },
    });

    if (!job) {
      throw new NotFoundException('Inference job not found.');
    }

    if (job.status !== 'SUCCEEDED') {
      throw new ConflictException(
        `Evaluation requires a SUCCEEDED job. Current status: ${job.status}.`
      );
    }

    // ── 4.2: Enforce LOCKED dataset version ───────────────────────────────────
    const datasetVersion = await this.prisma.datasetVersion.findUnique({
      where: { id: job.datasetVersionId },
    });

    if (!datasetVersion) {
      throw new NotFoundException('Dataset version not found.');
    }

    if (datasetVersion.status !== 'LOCKED') {
      throw new ConflictException(
        `Evaluation requires a LOCKED dataset version. Current status: ${datasetVersion.status}.`
      );
    }

    // ── 4.3: Load version assets ─────────────────────────────────────────────
    const versionAssets = await this.prisma.datasetVersionAsset.findMany({
      where: { datasetVersionId: job.datasetVersionId },
      select: { assetId: true },
    });

    const versionAssetIds = new Set(versionAssets.map((v) => v.assetId));

    if (versionAssetIds.size === 0) {
      throw new NotFoundException('Dataset version has no assets. Cannot run evaluation.');
    }

    // ── 4.3: Load GT annotations scoped to this DatasetVersion's AnnotationSets
    // Ground truth must come only from AnnotationSets attached to this version.
    // We load the version with its annotationSets, filter by source=MANUAL,
    // and ensure each annotation's assetId belongs to the version.
    const versionWithAnnotations = await this.prisma.datasetVersion.findUnique({
      where: { id: job.datasetVersionId },
      include: {
        annotationSets: {
          include: {
            annotations: {
              where: { source: 'MANUAL' },
              include: { labelClass: true },
            },
          },
        },
      },
    });

    const labelClasses = await this.prisma.labelClass.findMany({
      where: { projectId: job.projectId },
    });

    const labelClassMap = new Map<string, { id: string; name: string; color: string }>();
    for (const lc of labelClasses) {
      labelClassMap.set(lc.id, { id: lc.id, name: lc.name, color: lc.color });
    }

    // Collect GT from annotationSets, filtering to assets in this version only.
    const groundTruth: EvaluationGroundTruth[] = [];
    if (versionWithAnnotations) {
      for (const annotationSet of versionWithAnnotations.annotationSets) {
        for (const ann of annotationSet.annotations) {
          // Guard: only include annotations whose asset belongs to this version.
          if (!versionAssetIds.has(ann.assetId)) continue;

          const lc = labelClassMap.get(ann.labelClassId);
          if (!lc) {
            throw new Error(
              `Ground truth annotation ${ann.id} references unknown labelClassId ${ann.labelClassId}.`
            );
          }
          groundTruth.push({
            id: ann.id,
            assetId: ann.assetId,
            classKey: lc.name,
            label: lc.name,
            geometry: ann.geometryJson as { x: number; y: number; width: number; height: number },
          });
        }
      }
    }

    const predictionRows = await this.prisma.prediction.findMany({
      where: { inferenceJobId: jobId },
    });

    const predictions: EvaluationPrediction[] = predictionRows.map((row) => {
      const geometry = row.geometryJson as { x: number; y: number; width: number; height: number };
      const metadata = row.metadataJson as Record<string, unknown>;
      const { classKey, label } = resolvePredictionClass(
        { labelClassId: row.labelClassId, metadataJson: metadata },
        labelClasses
      );
      return {
        id: row.id,
        assetId: row.assetId,
        classKey,
        label,
        geometry,
        confidence: row.confidence,
        pipelineId: metadata.pipelineId as string | undefined,
        modelId: metadata.modelId as string | undefined,
      };
    });

    if (predictions.length === 0 && groundTruth.length === 0) {
      throw new ConflictException(
        'No predictions and no ground-truth annotations found. Cannot run evaluation.'
      );
    }

    const result: EvaluationResult = computeEvaluationMetrics(
      predictions,
      groundTruth,
      jobId,
      job.datasetVersionId,
      { iouThreshold, algorithmVersion: ALGORITHM_VERSION }
    );

    const evaluatedAt = new Date().toISOString();

    const report: EvaluationReport = {
      id: `eval_${result.inputHash}_${jobId.replace(/[^a-z0-9]/gi, '')}`,
      jobId,
      datasetVersionId: job.datasetVersionId,
      pipelineId: job.pipelineId ?? null,
      modelId: job.modelId ?? null,
      algorithmVersion: result.algorithmVersion,
      iouThreshold: result.iouThreshold,
      inputHash: result.inputHash,
      metricsHash: '',
      precision: result.precision,
      recall: result.recall,
      f1: result.f1,
      meanIoU: result.meanIou,
      truePositives: result.truePositive,
      falsePositives: result.falsePositive,
      falseNegatives: result.falseNegative,
      predictionCount: result.predictionCount,
      groundTruthCount: result.groundTruthCount,
      assetCount: new Set([...predictions, ...groundTruth].map((p) => p.assetId)).size,
      evaluatedAt,
      perClassMetrics: result.perClassMetrics.map((m) => ({
        classKey: m.classKey,
        label: m.label,
        precision: m.precision,
        recall: m.recall,
        f1: m.f1,
        truePositives: m.truePositives,
        falsePositives: m.falsePositives,
        falseNegatives: m.falseNegatives,
        count: m.count,
        meanIou: m.meanIou,
      })),
      matches: result.matches.map((m) => ({
        predictionId: m.predictionId,
        groundTruthId: m.groundTruthId,
        assetId: m.assetId,
        classKey: m.classKey,
        iou: m.iou,
      })),
    };

    report.metricsHash = computeEvaluationMetricsHash(
      report as Parameters<typeof computeEvaluationMetricsHash>[0]
    );

    const validated = EvaluationReportSchema.parse(report);

    // Upsert by compound unique [inferenceJobId, inputHash].
    // Re-running the same job with identical inputs updates the existing row
    // rather than creating a duplicate, ensuring exactly 1 row per unique input.
    const inferenceJobId_inputHash = {
      inferenceJobId: jobId,
      inputHash: validated.inputHash,
    };

    await this.prisma.evaluationReport.upsert({
      where: { inferenceJobId_inputHash },
      update: {
        datasetVersionId: validated.datasetVersionId,
        pipelineId: validated.pipelineId,
        modelId: validated.modelId,
        algorithmVersion: validated.algorithmVersion,
        iouThreshold: validated.iouThreshold,
        metricsHash: validated.metricsHash,
        metricsJson: validated as unknown as Prisma.InputJsonValue,
        confusionMatrixJson: Prisma.JsonNull,
      },
      create: {
        inferenceJobId: jobId,
        datasetVersionId: validated.datasetVersionId,
        pipelineId: validated.pipelineId,
        modelId: validated.modelId,
        algorithmVersion: validated.algorithmVersion,
        iouThreshold: validated.iouThreshold,
        inputHash: validated.inputHash,
        metricsHash: validated.metricsHash,
        metricsJson: validated as unknown as Prisma.InputJsonValue,
        confusionMatrixJson: Prisma.JsonNull,
      },
    });

    return validated;
  }

  async getPredictionsForJob(jobId: string): Promise<PredictionSummary[]> {
    if (!isDatabaseMode()) {
      return this.getMemoryPredictions(jobId);
    }

    const job = await this.prisma.inferenceJob.findUnique({
      where: { id: jobId },
      include: { model: true },
    });

    if (!job) {
      throw new NotFoundException('Inference job not found.');
    }

    const labelClasses = await this.prisma.labelClass.findMany({
      where: { projectId: job.projectId },
    });

    const labelClassMap = new Map<string, { id: string; name: string; color: string }>();
    for (const lc of labelClasses) {
      labelClassMap.set(lc.id, { id: lc.id, name: lc.name, color: lc.color });
    }

    const rows = await this.prisma.prediction.findMany({
      where: { inferenceJobId: jobId },
      include: { labelClass: true },
    });

    return rows.map((row) => {
      const geometry = row.geometryJson as { x: number; y: number; width: number; height: number };
      const metadata = row.metadataJson as Record<string, unknown>;
      const { classKey, label } = resolvePredictionClass(
        { labelClassId: row.labelClassId, metadataJson: metadata },
        labelClasses
      );
      const lc = row.labelClass ?? labelClassMap.get(row.labelClassId ?? '');
      return {
        id: row.id,
        assetId: row.assetId,
        labelClassId: row.labelClassId,
        label,
        color: lc?.color ?? '#94a3b8',
        geometry,
        confidence: row.confidence,
        metadata: metadata as Record<string, unknown>,
      };
    });
  }

  private async runMemoryEvaluation(
    jobId: string,
    iouThreshold = DEFAULT_IOU_THRESHOLD
  ): Promise<EvaluationReport> {
    const gtByAsset = new Map<string, (typeof demoSnapshot.annotations)[number][]>();

    for (const ann of demoSnapshot.annotations) {
      if (ann.source !== 'MANUAL') continue;
      if (!gtByAsset.has(ann.assetId)) {
        gtByAsset.set(ann.assetId, []);
      }
      gtByAsset.get(ann.assetId)!.push(ann);
    }

    const predictions: EvaluationPrediction[] = [];
    const groundTruth: EvaluationGroundTruth[] = [];

    for (const [, anns] of gtByAsset) {
      for (const ann of anns) {
        groundTruth.push({
          id: ann.id,
          assetId: ann.assetId,
          classKey: ann.label ?? 'unknown',
          label: ann.label ?? 'unknown',
          geometry: ann.geometry,
        });
      }
    }

    for (const [assetId, gtAnns] of gtByAsset) {
      const asset = demoSnapshot.media.find((m) => m.id === assetId);
      if (!asset) continue;
      const digest = sha256(`${jobId}:${assetId}`);
      for (let i = 0; i < Math.min(gtAnns.length, 2); i++) {
        const w = Math.min(asset.width, Math.max(80, Math.floor(asset.width / 4)));
        const h = Math.min(asset.height, Math.max(60, Math.floor(asset.height / 5)));
        const maxX = Math.max(0, asset.width - w);
        const maxY = Math.max(0, asset.height - h);
        const x = maxX === 0 ? 0 : digest.readUInt16BE(i * 4) % (maxX + 1);
        const y = maxY === 0 ? 0 : digest.readUInt16BE(i * 4 + 2) % (maxY + 1);
        const confidence = Number((0.65 + (digest[i + 8] / 255) * 0.3).toFixed(3));

        predictions.push({
          id: `pred_${assetId}_${i}`,
          assetId,
          classKey: gtAnns[0]?.label ?? 'unknown',
          label: gtAnns[0]?.label ?? 'unknown',
          geometry: { x, y, width: w, height: h },
          confidence,
        });
      }
    }

    const result = computeEvaluationMetrics(
      predictions,
      groundTruth,
      jobId,
      'memory_dataset_version',
      { iouThreshold, algorithmVersion: ALGORITHM_VERSION }
    );

    const evaluatedAt = new Date().toISOString();

    const report: EvaluationReport = {
      id: `eval_${result.inputHash}_${jobId.replace(/[^a-z0-9]/gi, '')}`,
      jobId,
      datasetVersionId: 'memory_dataset_version',
      pipelineId: null,
      modelId: null,
      algorithmVersion: result.algorithmVersion,
      iouThreshold: result.iouThreshold,
      inputHash: result.inputHash,
      metricsHash: '',
      precision: result.precision,
      recall: result.recall,
      f1: result.f1,
      meanIoU: result.meanIou,
      truePositives: result.truePositive,
      falsePositives: result.falsePositive,
      falseNegatives: result.falseNegative,
      predictionCount: result.predictionCount,
      groundTruthCount: result.groundTruthCount,
      assetCount: new Set([...predictions, ...groundTruth].map((p) => p.assetId)).size,
      evaluatedAt,
      perClassMetrics: result.perClassMetrics.map((m) => ({
        classKey: m.classKey,
        label: m.label,
        precision: m.precision,
        recall: m.recall,
        f1: m.f1,
        truePositives: m.truePositives,
        falsePositives: m.falsePositives,
        falseNegatives: m.falseNegatives,
        count: m.count,
        meanIou: m.meanIou,
      })),
      matches: result.matches.map((m) => ({
        predictionId: m.predictionId,
        groundTruthId: m.groundTruthId,
        assetId: m.assetId,
        classKey: m.classKey,
        iou: m.iou,
      })),
    };

    report.metricsHash = computeEvaluationMetricsHash(
      report as Parameters<typeof computeEvaluationMetricsHash>[0]
    );

    return EvaluationReportSchema.parse(report);
  }

  private getMemoryPredictions(jobId: string): PredictionSummary[] {
    const targetAsset = demoSnapshot.media.find((m) => m.id === 'asset_frame_1482');
    if (!targetAsset) return [];

    const digest = sha256(`${jobId}:${targetAsset.id}`);

    return [
      {
        id: `pred_${targetAsset.id}_0`,
        assetId: targetAsset.id,
        labelClassId: null,
        label: 'mock',
        color: '#ffb74d',
        geometry: {
          x: Math.max(0, digest.readUInt16BE(0) % (targetAsset.width - 200)),
          y: Math.max(0, digest.readUInt16BE(2) % (targetAsset.height - 200)),
          width: Math.floor(targetAsset.width / 4),
          height: Math.floor(targetAsset.height / 5),
        },
        confidence: Number((0.65 + (digest[8] / 255) * 0.3).toFixed(3)),
      },
    ];
  }
}

function sha256(input: string): Buffer {
  return createHash('sha256').update(input).digest();
}
