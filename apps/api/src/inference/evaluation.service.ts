import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  CvWorkerEvaluationObject,
  CvWorkerEvaluationResponse,
  EvaluationReport,
  intersectionOverUnion,
  PerClassMetric,
  PredictionSummary,
  RunEvaluationRequestSchema,
} from "@visionflow/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { demoSnapshot } from "../projects/demo-snapshot";
import { CvWorkerClient } from "./cv-worker.client";

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvWorkerClient: CvWorkerClient,
  ) {}

  async getEvaluationReport(jobId: string): Promise<EvaluationReport | null> {
    if (!process.env.DATABASE_URL) {
      return memoryEvalCache.get(jobId) ?? null;
    }

    const row = await this.prisma.evaluationReport.findFirst({
      where: { inferenceJobId: jobId },
      orderBy: { createdAt: "desc" },
    });

    if (!row) return null;

    return row.metricsJson as EvaluationReport;
  }

  async runEvaluation(dto: unknown): Promise<EvaluationReport> {
    const body = RunEvaluationRequestSchema.parse(dto);
    const { jobId } = body;

    if (!process.env.DATABASE_URL) {
      return this.runMemoryEvaluation(jobId);
    }

    const job = await this.prisma.inferenceJob.findUnique({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException("Inference job not found.");
    }

    const [predictionRows, versionAssetLinks] = await Promise.all([
      this.prisma.prediction.findMany({
        where: { inferenceJobId: jobId },
        include: { labelClass: true },
      }),
      this.prisma.datasetVersionAsset.findMany({
        where: { datasetVersionId: job.datasetVersionId },
        include: {
          asset: {
            include: {
              annotations: {
                where: { source: "MANUAL" },
                include: { labelClass: true },
              },
            },
          },
        },
      }),
    ]);

    const predictions: Array<{
      assetId: string;
      labelClassId: string | null;
      geometry: { x: number; y: number; width: number; height: number };
      confidence: number;
    }> = predictionRows.map((row) => ({
      assetId: row.assetId,
      labelClassId: row.labelClassId,
      geometry: row.geometryJson as { x: number; y: number; width: number; height: number },
      confidence: row.confidence,
    }));

    const groundTruth: Array<{
      assetId: string;
      labelClassId: string | null;
      geometry: { x: number; y: number; width: number; height: number };
    }> = [];

    for (const link of versionAssetLinks) {
      for (const ann of link.asset.annotations) {
        groundTruth.push({
          assetId: ann.assetId,
          labelClassId: ann.labelClassId,
          geometry: ann.geometryJson as { x: number; y: number; width: number; height: number },
        });
      }
    }

    const cvResult = await this.cvWorkerClient.evaluate({
      jobId,
      iouThreshold: 0.5,
      predictions,
      groundTruth,
    });

    const report = this.buildReport(jobId, cvResult);

    await this.prisma.evaluationReport.create({
      data: {
        inferenceJobId: jobId,
        metricsJson: report as unknown as Prisma.InputJsonValue,
        confusionMatrixJson: undefined,
      },
    });

    return report;
  }

  async getPredictionsForJob(jobId: string): Promise<PredictionSummary[]> {
    if (!process.env.DATABASE_URL) {
      return this.getMemoryPredictions(jobId);
    }

    const job = await this.prisma.inferenceJob.findUnique({ where: { id: jobId } });

    if (!job) {
      throw new NotFoundException("Inference job not found.");
    }

    const rows = await this.prisma.prediction.findMany({
      where: { inferenceJobId: jobId },
      include: { labelClass: true },
    });

    return rows.map((row) => ({
      id: row.id,
      assetId: row.assetId,
      labelClassId: row.labelClassId,
      label: row.labelClass?.name ?? "unknown",
      color: row.labelClass?.color ?? "#94a3b8",
      geometry: row.geometryJson as PredictionSummary["geometry"],
      confidence: row.confidence,
    }));
  }

  private async runMemoryEvaluation(jobId: string): Promise<EvaluationReport> {
    const gtByAsset = new Map<string, (typeof demoSnapshot.annotations)[number][]>();

    for (const ann of demoSnapshot.annotations) {
      if (ann.source !== "MANUAL") continue;

      if (!gtByAsset.has(ann.assetId)) {
        gtByAsset.set(ann.assetId, []);
      }

      gtByAsset.get(ann.assetId)!.push(ann);
    }

    const predictions: CvWorkerEvaluationObject[] = [];

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
          assetId,
          labelClassId: gtAnns[0]?.label ?? null,
          geometry: { x, y, width: w, height: h },
          confidence,
        });
      }
    }

    const groundTruth: CvWorkerEvaluationObject[] = [];

    for (const [, anns] of gtByAsset) {
      for (const ann of anns) {
        groundTruth.push({
          assetId: ann.assetId,
          labelClassId: null,
          geometry: ann.geometry,
        });
      }
    }

    const cvResult = this.computeIoU(jobId, predictions, groundTruth);

    return this.buildReport(jobId, cvResult);
  }

  private computeIoU(
    jobId: string,
    predictions: CvWorkerEvaluationObject[],
    groundTruth: CvWorkerEvaluationObject[],
  ): CvWorkerEvaluationResponse {
    const IO_U_THRESHOLD = 0.5;
    const matchedGt = new Set<number>();
    const matches: CvWorkerEvaluationResponse["matches"] = [];

    for (let pi = 0; pi < predictions.length; pi++) {
      const pred = predictions[pi];

      for (let gi = 0; gi < groundTruth.length; gi++) {
        if (matchedGt.has(gi)) continue;

        const gt = groundTruth[gi];

        if (pred.assetId !== gt.assetId) continue;

        const iou = intersectionOverUnion(pred.geometry, gt.geometry);

        if (iou >= IO_U_THRESHOLD) {
          matchedGt.add(gi);
          matches.push({ predictionIndex: pi, groundTruthIndex: gi, assetId: pred.assetId, iou });
          break;
        }
      }
    }

    const tp = matches.length;
    const fp = predictions.length - tp;
    const fn = groundTruth.length - tp;
    const precision = predictions.length > 0 ? tp / predictions.length : 0;
    const recall = groundTruth.length > 0 ? tp / groundTruth.length : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const meanIou = matches.length > 0 ? matches.reduce((s, m) => s + m.iou, 0) / matches.length : 0;

    return {
      jobId,
      iouThreshold: IO_U_THRESHOLD,
      truePositive: tp,
      falsePositive: fp,
      falseNegative: fn,
      precision,
      recall,
      f1,
      meanIou,
      matches,
    };
  }

  private buildReport(jobId: string, cvResult: CvWorkerEvaluationResponse): EvaluationReport {
    const reportId = `eval_${Date.now()}_${jobId.replace(/[^a-z0-9]/gi, "")}`;

    const classMap = new Map<string, PerClassMetric>();

    for (const match of cvResult.matches) {
      const label = "vehicle";

      if (!classMap.has(label)) {
        classMap.set(label, {
          label,
          precision: 0,
          recall: 0,
          f1: 0,
          truePositives: 0,
          falsePositives: 0,
          falseNegatives: 0,
          count: 0,
        });
      }

      const m = classMap.get(label)!;
      m.truePositives++;
      m.count++;
      m.precision = m.truePositives / (m.truePositives + m.falsePositives);
      m.recall = m.truePositives / (m.truePositives + m.falseNegatives);
      m.f1 =
        m.precision + m.recall > 0 ? (2 * m.precision * m.recall) / (m.precision + m.recall) : 0;
    }

    const totalGt = cvResult.truePositive + cvResult.falseNegative;

    if (!classMap.has("vehicle") && cvResult.falsePositive > 0) {
      classMap.set("vehicle", {
        label: "vehicle",
        precision: 0,
        recall: cvResult.truePositive > 0 ? cvResult.truePositive / totalGt : 0,
        f1: 0,
        truePositives: cvResult.truePositive,
        falsePositives: cvResult.falsePositive,
        falseNegatives: cvResult.falseNegative,
        count: totalGt,
      });
    }

    const report: EvaluationReport = {
      id: reportId,
      jobId,
      precision: cvResult.precision,
      recall: cvResult.recall,
      f1: cvResult.f1,
      meanIoU: cvResult.meanIou,
      truePositives: cvResult.truePositive,
      falsePositives: cvResult.falsePositive,
      falseNegatives: cvResult.falseNegative,
      evaluatedAt: new Date().toISOString(),
      assetCount: new Set(cvResult.matches.map((m) => m.assetId)).size || 1,
      perClassMetrics: [...classMap.values()],
    };

    memoryEvalCache.set(jobId, report);

    return report;
  }

  private getMemoryPredictions(jobId: string): PredictionSummary[] {
    const cached = memoryEvalCache.get(jobId);

    if (cached) return [];

    const targetAsset = demoSnapshot.media.find((m) => m.id === "asset_frame_1482");

    if (!targetAsset) return [];

    const digest = sha256(`${jobId}:${targetAsset.id}`);

    return [
      {
        id: `pred_${targetAsset.id}_0`,
        assetId: targetAsset.id,
        labelClassId: null,
        label: "mock",
        color: "#ffb74d",
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

const memoryEvalCache = new Map<string, EvaluationReport>();

function sha256(input: string): Buffer {
  return createHash("sha256").update(input).digest();
}
