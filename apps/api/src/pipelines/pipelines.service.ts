import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreatePipelineRequest,
  PipelineSummary,
  PipelineValidationResult,
  UpdatePipelineRequest,
  validatePipelineDefinition,
} from '@visionflow/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineRepository } from '../repositories/pipeline.repository';
import { PIPELINE_REPOSITORY } from '../config/provider-tokens';

@Injectable()
export class PipelinesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PIPELINE_REPOSITORY) private readonly pipelineRepo: PipelineRepository
  ) {}

  async listPipelines(projectId: string): Promise<PipelineSummary[]> {
    return this.pipelineRepo.listByProject(projectId);
  }

  async createPipeline(projectId: string, dto: CreatePipelineRequest): Promise<PipelineSummary> {
    const validation = this.validateDefinition(dto.definition);
    this.assertValid(validation);
    return this.pipelineRepo.create({ projectId, dto, validation });
  }

  async updatePipeline(
    projectId: string,
    pipelineId: string,
    dto: UpdatePipelineRequest
  ): Promise<PipelineSummary> {
    const existing = await this.pipelineRepo.findById(projectId, pipelineId);
    if (!existing) throw new NotFoundException('Pipeline not found for this project.');
    const definition = dto.definition ?? existing.definition;
    const validation = this.validateDefinition(definition);
    this.assertValid(validation);
    return this.pipelineRepo.update({ projectId, pipelineId, dto, validation });
  }

  validateDefinition(definition: unknown): PipelineValidationResult {
    return validatePipelineDefinition(definition);
  }

  private assertValid(validation: PipelineValidationResult): void {
    if (!validation.ok) {
      throw new BadRequestException({
        message: 'Invalid pipeline graph.',
        issues: validation.issues,
      });
    }
  }
}
