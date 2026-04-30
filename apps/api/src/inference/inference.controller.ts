import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Sse,
} from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { map } from "rxjs";
import { z } from "zod";
import {
  CreateInferenceJobRequestSchema,
  CreateInferenceJobResponseSchema,
  EvaluationReportListResponseSchema,
  EvaluationReportSchema,
  EvaluationRunResponseSchema,
  InferenceJobListResponseSchema,
  InferenceJobPreviewSchema,
  InferenceJobSummarySchema,
  PredictionListResponseSchema,
  validatePipelineDefinition,
} from "@visionflow/contracts";
import { demoSnapshot } from "../projects/demo-snapshot";
import { EvaluationService } from "./evaluation.service";
import { InferenceService } from "./inference.service";

@ApiTags("inference")
@Controller("projects/:projectId/inference-jobs")
export class InferenceController {
  constructor(
    @Inject(InferenceService) private readonly inferenceService: InferenceService,
    @Inject(EvaluationService) private readonly evaluationService: EvaluationService,
  ) {}

  @Get()
  @ApiOkResponse({
    description: "List queued and recently completed inference jobs for a project.",
  })
  async listJobs(@Param("projectId") projectId: string) {
    return InferenceJobListResponseSchema.parse({
      jobs: await this.inferenceService.listJobs(projectId),
    });
  }

  @Post()
  @ApiBody({
    schema: {
      example: {
        datasetVersionId: "dataset_proj_parking_lot_parking_v3",
        pipelineId: "pipeline_proj_parking_lot_parking_detector",
        modelId: null,
      },
    },
  })
  @ApiOkResponse({
    description: "Create an inference job and enqueue it for worker execution.",
  })
  async createJob(@Param("projectId") projectId: string, @Body() body: unknown) {
    const dto = parseBody(CreateInferenceJobRequestSchema, body, "Invalid inference job body.");

    return CreateInferenceJobResponseSchema.parse({
      job: await this.inferenceService.createJob(projectId, dto),
    });
  }

  @Get(":jobId")
  @ApiOkResponse({
    description: "Read a single inference job snapshot.",
  })
  async getJob(@Param("projectId") projectId: string, @Param("jobId") jobId: string) {
    return InferenceJobSummarySchema.parse(await this.inferenceService.getJob(projectId, jobId));
  }

  @Sse(":jobId/events")
  streamJob(@Param("projectId") projectId: string, @Param("jobId") jobId: string) {
    return this.inferenceService
      .streamJob(projectId, jobId)
      .pipe(map((event) => ({ data: event })));
  }

  @Post("preview")
  @ApiBody({
    schema: {
      example: {
        datasetVersionId: "dataset_version_v1_3",
        pipelineId: "pipeline_parking_detector",
        modelId: "model_onnx_parking",
      },
    },
  })
  @ApiOkResponse({
    description: "Validates a job request and returns the queued preview shape.",
  })
  createPreviewJob(@Param("projectId") projectId: string, @Body() body: unknown) {
    const dto = InferenceJobPreviewSchema.parse({
      projectId,
      ...(body as object),
    });
    const pipeline = validatePipelineDefinition(demoSnapshot.pipeline);

    if (!pipeline.ok) {
      return {
        ok: false,
        errors: pipeline.errors,
      };
    }

    return {
      ok: true,
      job: {
        id: `preview_${Date.now()}`,
        projectId: dto.projectId,
        datasetVersionId: dto.datasetVersionId,
        pipelineId: dto.pipelineId,
        modelId: dto.modelId ?? null,
        status: "QUEUED",
        progress: 0,
      },
    };
  }

  @Get(":jobId/evaluation")
  @ApiOkResponse({
    description: "Get the most recent evaluation report for an inference job.",
  })
  async getEvaluation(@Param("jobId") jobId: string) {
    const report = await this.evaluationService.getEvaluationReport(jobId);

    return EvaluationRunResponseSchema.parse({ report });
  }

  @Post("evaluate")
  @ApiBody({
    schema: {
      example: {
        jobId: "job_2026_04_28_2036",
      },
    },
  })
  @ApiOkResponse({
    description: "Run evaluation for an inference job and return the evaluation report.",
  })
  async runEvaluation(@Body() body: unknown) {
    const report = await this.evaluationService.runEvaluation(body);

    return EvaluationRunResponseSchema.parse({ report });
  }

  @Get(":jobId/predictions")
  @ApiOkResponse({
    description: "Get all prediction rows for an inference job.",
  })
  async getPredictions(@Param("jobId") jobId: string) {
    const predictions = await this.evaluationService.getPredictionsForJob(jobId);

    return PredictionListResponseSchema.parse({ predictions });
  }
}

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown, message: string): T {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException({
      message,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return parsed.data;
}
