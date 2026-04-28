import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import {
  CreatePipelineRequestSchema,
  PipelineListResponseSchema,
  PipelineSummarySchema,
  PipelineValidationResponseSchema,
  UpdatePipelineRequestSchema,
  ValidatePipelineRequestSchema,
} from "@visionflow/contracts";
import { PipelinesService } from "./pipelines.service";

@ApiTags("pipelines")
@Controller("projects/:projectId/pipelines")
export class PipelinesController {
  constructor(@Inject(PipelinesService) private readonly pipelinesService: PipelinesService) {}

  @Get()
  @ApiOkResponse({
    description: "List persisted pipeline definitions with validation summaries.",
  })
  async listPipelines(@Param("projectId") projectId: string) {
    return PipelineListResponseSchema.parse({
      pipelines: await this.pipelinesService.listPipelines(projectId),
    });
  }

  @Post("validate")
  @ApiBody({
    schema: {
      example: {
        definition: {
          version: 1,
          nodes: [
            { id: "input", type: "input", params: {} },
            {
              id: "detector",
              type: "yolo_onnx",
              params: { modelId: "model_onnx_parking", threshold: 0.62 },
            },
            { id: "output", type: "output", params: {} },
          ],
          edges: [
            { id: "e1", source: "input", target: "detector" },
            { id: "e2", source: "detector", target: "output" },
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Validate a pipeline graph without persisting it.",
  })
  validatePipeline(@Body() body: unknown) {
    const dto = parseBody(ValidatePipelineRequestSchema, body, "Invalid pipeline validation body.");

    return PipelineValidationResponseSchema.parse({
      validation: this.pipelinesService.validateDefinition(dto.definition),
    });
  }

  @Post()
  @ApiBody({
    schema: {
      example: {
        name: "Parking detector pipeline",
        definition: {
          version: 1,
          nodes: [
            { id: "input", type: "input", params: {} },
            { id: "resize", type: "resize", params: { width: 960 } },
            {
              id: "detector",
              type: "yolo_onnx",
              params: { modelId: "model_onnx_parking", threshold: 0.62 },
            },
            { id: "nms", type: "nms", params: { iouThreshold: 0.45 } },
            { id: "output", type: "output", params: {} },
          ],
          edges: [
            { id: "e1", source: "input", target: "resize" },
            { id: "e2", source: "resize", target: "detector" },
            { id: "e3", source: "detector", target: "nms" },
            { id: "e4", source: "nms", target: "output" },
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Persist a validated pipeline definition.",
  })
  async createPipeline(@Param("projectId") projectId: string, @Body() body: unknown) {
    const dto = parseBody(CreatePipelineRequestSchema, body, "Invalid pipeline create body.");

    return PipelineSummarySchema.parse(await this.pipelinesService.createPipeline(projectId, dto));
  }

  @Patch(":pipelineId")
  @ApiBody({
    schema: {
      example: {
        name: "Parking detector pipeline",
      },
    },
  })
  @ApiOkResponse({
    description: "Update a persisted pipeline after backend validation.",
  })
  async updatePipeline(
    @Param("projectId") projectId: string,
    @Param("pipelineId") pipelineId: string,
    @Body() body: unknown,
  ) {
    const dto = parseBody(UpdatePipelineRequestSchema, body, "Invalid pipeline update body.");

    return PipelineSummarySchema.parse(
      await this.pipelinesService.updatePipeline(projectId, pipelineId, dto),
    );
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
