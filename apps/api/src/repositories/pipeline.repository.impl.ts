import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { demoSnapshot } from '../projects/demo-snapshot';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineRepository } from './pipeline.repository';
import {
  CreatePipelineRequest,
  PipelineDefinition,
  PipelineDefinitionSchema,
  PipelineSummary,
  PipelineValidationResult,
  UpdatePipelineRequest,
  validatePipelineDefinition,
} from '@visionflow/contracts';
import { PRISMA_SERVICE } from '../config/provider-tokens';

type MemoryPipeline = {
  id: string;
  projectId: string;
  name: string;
  definition: PipelineDefinition;
  createdAt: string;
  updatedAt: string;
};

const memoryPipelines = new Map<string, MemoryPipeline>();

function toMemoryPipelineSummary(row: MemoryPipeline): PipelineSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    definition: row.definition,
    validation: validatePipelineDefinition(row.definition),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'project';
}

@Injectable()
export class PrismaPipelineRepository implements PipelineRepository {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService) {}

  async listByProject(projectId: string): Promise<PipelineSummary[]> {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
    return pipelines.map((p) => toPipelineSummary(p));
  }

  async findById(projectId: string, pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, projectId },
    });
    if (!pipeline) return null;
    return toPipelineSummary(pipeline);
  }

  async create(args: {
    projectId: string;
    dto: CreatePipelineRequest;
    validation: PipelineValidationResult;
  }): Promise<PipelineSummary> {
    await this.ensureProject(args.projectId);
    const pipeline = await this.prisma.pipeline.create({
      data: {
        projectId: args.projectId,
        name: args.dto.name,
        definitionJson: args.dto.definition as Prisma.InputJsonValue,
      },
    });
    await this.writeAudit(args.projectId, 'PIPELINE_CREATED', 'Pipeline', pipeline.id, {
      name: pipeline.name,
      nodeCount: args.validation.summary.nodeCount,
      edgeCount: args.validation.summary.edgeCount,
    });
    return toPipelineSummary(pipeline);
  }

  async update(args: {
    projectId: string;
    pipelineId: string;
    dto: UpdatePipelineRequest;
    validation: PipelineValidationResult;
  }): Promise<PipelineSummary> {
    const existing = await this.prisma.pipeline.findFirst({
      where: { id: args.pipelineId, projectId: args.projectId },
    });
    if (!existing) throw new NotFoundException('Pipeline not found for this project.');
    const pipeline = await this.prisma.pipeline.update({
      where: { id: args.pipelineId },
      data: {
        ...(args.dto.name ? { name: args.dto.name } : {}),
        ...(args.dto.definition
          ? { definitionJson: args.dto.definition as Prisma.InputJsonValue }
          : {}),
      },
    });
    await this.writeAudit(args.projectId, 'PIPELINE_UPDATED', 'Pipeline', pipeline.id, {
      name: pipeline.name,
      nodeCount: args.validation.summary.nodeCount,
      edgeCount: args.validation.summary.edgeCount,
    });
    return toPipelineSummary(pipeline);
  }

  private async ensureProject(projectId: string): Promise<void> {
    await this.prisma.project.upsert({
      where: { id: projectId },
      create: {
        id: projectId,
        slug: projectId,
        name: projectId === demoSnapshot.project.id ? demoSnapshot.project.name : projectId,
      },
      update: {},
    });
  }

  private async writeAudit(
    projectId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadataJson: object
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: { projectId, action, targetType, targetId, metadataJson },
    });
  }
}

function toPipelineSummary(row: {
  id: string;
  projectId: string;
  name: string;
  definitionJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}): PipelineSummary {
  const definition = PipelineDefinitionSchema.parse(row.definitionJson);
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    definition,
    validation: validatePipelineDefinition(definition),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class MemoryPipelineRepository implements PipelineRepository {
  async listByProject(projectId: string): Promise<PipelineSummary[]> {
    this.ensureMemorySeed(projectId);
    return [...memoryPipelines.values()]
      .filter((p) => p.projectId === projectId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toMemoryPipelineSummary);
  }

  async findById(projectId: string, pipelineId: string) {
    this.ensureMemorySeed(projectId);
    const pipeline = memoryPipelines.get(pipelineId);
    if (!pipeline || pipeline.projectId !== projectId) return null;
    return toMemoryPipelineSummary(pipeline);
  }

  async create(args: {
    projectId: string;
    dto: CreatePipelineRequest;
    validation: PipelineValidationResult;
  }): Promise<PipelineSummary> {
    const now = new Date().toISOString();
    const pipeline: MemoryPipeline = {
      id: `pipeline_${sanitizeId(args.projectId)}_${Date.now()}`,
      projectId: args.projectId,
      name: args.dto.name,
      definition: args.dto.definition,
      createdAt: now,
      updatedAt: now,
    };
    memoryPipelines.set(pipeline.id, pipeline);
    return toMemoryPipelineSummary(pipeline);
  }

  async update(args: {
    projectId: string;
    pipelineId: string;
    dto: UpdatePipelineRequest;
    validation: PipelineValidationResult;
  }): Promise<PipelineSummary> {
    const existing = memoryPipelines.get(args.pipelineId);
    if (!existing || existing.projectId !== args.projectId) {
      throw new NotFoundException('Pipeline not found for this project.');
    }
    const updated: MemoryPipeline = {
      ...existing,
      name: args.dto.name ?? existing.name,
      definition: args.dto.definition ?? existing.definition,
      updatedAt: new Date().toISOString(),
    };
    memoryPipelines.set(updated.id, updated);
    return toMemoryPipelineSummary(updated);
  }

  private ensureMemorySeed(projectId: string): void {
    const hasProjectPipeline = [...memoryPipelines.values()].some((p) => p.projectId === projectId);
    if (hasProjectPipeline) return;
    const now = new Date('2026-04-29T09:00:00.000Z').toISOString();
    const pipeline: MemoryPipeline = {
      id: `pipeline_${sanitizeId(projectId)}_parking_detector`,
      projectId,
      name: 'Parking detector pipeline',
      definition: demoSnapshot.pipeline,
      createdAt: now,
      updatedAt: now,
    };
    memoryPipelines.set(pipeline.id, pipeline);
  }
}
