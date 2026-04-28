import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { InferenceJobPreviewSchema, validatePipelineDefinition } from "@visionflow/contracts";
import { demoSnapshot } from "../projects/demo-snapshot";

@ApiTags("inference")
@Controller("projects/:projectId/inference-jobs")
export class InferenceController {
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
}
