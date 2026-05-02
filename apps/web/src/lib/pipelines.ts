import type {
  CreatePipelineRequest,
  PipelineListResponse,
  PipelineSummary,
  PipelineValidationResponse,
  UpdatePipelineRequest,
  ValidatePipelineRequest,
} from '@visionflow/contracts';
import { apiJson } from './http';

export async function listProjectPipelines(projectId: string): Promise<PipelineListResponse> {
  return apiJson<PipelineListResponse>(`/api/projects/${projectId}/pipelines`);
}

export async function validateProjectPipeline(
  projectId: string,
  body: ValidatePipelineRequest
): Promise<PipelineValidationResponse> {
  return apiJson<PipelineValidationResponse>(`/api/projects/${projectId}/pipelines/validate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function createProjectPipeline(
  projectId: string,
  body: CreatePipelineRequest
): Promise<PipelineSummary> {
  return apiJson<PipelineSummary>(`/api/projects/${projectId}/pipelines`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProjectPipeline(
  projectId: string,
  pipelineId: string,
  body: UpdatePipelineRequest
): Promise<PipelineSummary> {
  return apiJson<PipelineSummary>(`/api/projects/${projectId}/pipelines/${pipelineId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
