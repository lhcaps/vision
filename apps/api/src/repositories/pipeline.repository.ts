import {
  CreatePipelineRequest,
  PipelineSummary,
  PipelineValidationResult,
  UpdatePipelineRequest,
} from '@visionflow/contracts';

export interface PipelineRepository {
  listByProject(projectId: string): Promise<PipelineSummary[]>;
  findById(
    projectId: string,
    pipelineId: string
  ): Promise<(PipelineSummary & { definition: unknown }) | null>;
  create(args: {
    projectId: string;
    dto: CreatePipelineRequest;
    validation: PipelineValidationResult;
  }): Promise<PipelineSummary>;
  update(args: {
    projectId: string;
    pipelineId: string;
    dto: UpdatePipelineRequest;
    validation: PipelineValidationResult;
  }): Promise<PipelineSummary>;
}
