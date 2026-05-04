import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  EvaluationReport,
  EvaluationReportSchema,
  EvaluationReportSummarySchema,
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
  computeEvaluationMetrics,
  computeInputHash,
  type EvaluationGroundTruth,
  type EvaluationPrediction,
  type EvaluationResult,
} from './evaluation-algorithm';

function metricsHash(report: EvaluationReport): string {
  return createHash('sha256')
    .update(
      [
        report.jobId,
        report.inputHash,
        String(report.truePositives),
        String(report.falsePositives),
        String(report.falseNegatives),
        report.precision.toFixed(6),
        report.recall.toFixed(6),
        report.f1.toFixed(6),
        report.meanIoU.toFixed(6),
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

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
    });

    if (!row) return null;

    const raw = row.metricsJson as Record<string, unknown>;
    const report = EvaluationReportSchema.partial().safeParse(raw);

    if (report.success) {
      return report.data as EvaluationReport;
    }

    const legacy = EvaluationReportSummarySchema.partial().safeParse(raw);
    if (legacy.success) {
      return legacy.data as unknown as EvaluationReport;
    }

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

    const versionAssets = await this.prisma.datasetVersionAsset.findMany({
      where: { datasetVersionId: job.datasetVersionId },
      include: {
        asset: {
          include: {
            annotations: {
              where: { source: 'MANUAL' },
              include: { labelClass: true },
            },
          },
        },
      },
    });

    if (versionAssets.length === 0) {
      throw new NotFoundException('Dataset version has no assets. Cannot run evaluation.');
    }

    const labelClasses = await this.prisma.labelClass.findMany({
      where: { projectId: job.projectId },
    });

    const labelClassMap = new Map<string, { id: string; name: string; color: string }>();
    for (const lc of labelClasses) {
      labelClassMap.set(lc.id, { id: lc.id, name: lc.name, color: lc.color });
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

    const groundTruth: EvaluationGroundTruth[] = [];
    for (const link of versionAssets) {
      for (const ann of link.asset.annotations) {
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
    };

    report.metricsHash = metricsHash(report);

    const validated = EvaluationReportSchema.parse(report);

    await this.prisma.evaluationReport.create({
      data: {
        inferenceJobId: jobId,
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
    };

    report.metricsHash = metricsHash(report);

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
