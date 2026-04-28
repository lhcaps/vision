import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  CreatePipelineRequest,
  PipelineDefinition,
  PipelineDefinitionSchema,
  PipelineSummary,
  PipelineValidationResult,
  UpdatePipelineRequest,
  validatePipelineDefinition,
} from "@visionflow/contracts";
import { PrismaService } from "../prisma/prisma.service";
import { demoSnapshot } from "../projects/demo-snapshot";

type PipelineRow = {
  id: string;
  projectId: string;
  name: string;
  definitionJson: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type MemoryPipeline = {
  id: string;
  projectId: string;
  name: string;
  definition: PipelineDefinition;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class PipelinesService {
  private readonly memoryPipelines = new Map<string, MemoryPipeline>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listPipelines(projectId: string): Promise<PipelineSummary[]> {
    if (process.env.DATABASE_URL) {
      const pipelines = await this.prisma.pipeline.findMany({
        where: { projectId },
        orderBy: { updatedAt: "desc" },
      });

      return pipelines.map((pipeline) => toPipelineSummary(pipeline));
    }

    this.ensureMemorySeed(projectId);

    return [...this.memoryPipelines.values()]
      .filter((pipeline) => pipeline.projectId === projectId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((pipeline) => toMemoryPipelineSummary(pipeline));
  }

  async createPipeline(projectId: string, dto: CreatePipelineRequest): Promise<PipelineSummary> {
    const validation = this.validateDefinition(dto.definition);
    this.assertValid(validation);

    if (process.env.DATABASE_URL) {
      await this.ensureProject(projectId);

      const pipeline = await this.prisma.pipeline.create({
        data: {
          projectId,
          name: dto.name,
          definitionJson: dto.definition as Prisma.InputJsonValue,
        },
      });

      await this.writeAudit(projectId, "PIPELINE_CREATED", "Pipeline", pipeline.id, {
        name: pipeline.name,
        nodeCount: validation.summary.nodeCount,
        edgeCount: validation.summary.edgeCount,
      });

      return toPipelineSummary(pipeline);
    }

    const now = new Date().toISOString();
    const pipeline: MemoryPipeline = {
      id: `pipeline_${sanitizeId(projectId)}_${this.memoryPipelines.size + 1}`,
      projectId,
      name: dto.name,
      definition: dto.definition,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryPipelines.set(pipeline.id, pipeline);

    return toMemoryPipelineSummary(pipeline);
  }

  async updatePipeline(
    projectId: string,
    pipelineId: string,
    dto: UpdatePipelineRequest,
  ): Promise<PipelineSummary> {
    if (process.env.DATABASE_URL) {
      const existing = await this.prisma.pipeline.findFirst({
        where: {
          id: pipelineId,
          projectId,
        },
      });

      if (!existing) {
        throw new NotFoundException("Pipeline not found for this project.");
      }

      const definition = dto.definition ?? PipelineDefinitionSchema.parse(existing.definitionJson);
      const validation = this.validateDefinition(definition);
      this.assertValid(validation);

      const pipeline = await this.prisma.pipeline.update({
        where: { id: pipelineId },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.definition ? { definitionJson: dto.definition as Prisma.InputJsonValue } : {}),
        },
      });

      await this.writeAudit(projectId, "PIPELINE_UPDATED", "Pipeline", pipeline.id, {
        name: pipeline.name,
        nodeCount: validation.summary.nodeCount,
        edgeCount: validation.summary.edgeCount,
      });

      return toPipelineSummary(pipeline);
    }

    this.ensureMemorySeed(projectId);

    const existing = this.memoryPipelines.get(pipelineId);

    if (!existing || existing.projectId !== projectId) {
      throw new NotFoundException("Pipeline not found for this project.");
    }

    const definition = dto.definition ?? existing.definition;
    const validation = this.validateDefinition(definition);
    this.assertValid(validation);

    const updated: MemoryPipeline = {
      ...existing,
      name: dto.name ?? existing.name,
      definition,
      updatedAt: new Date().toISOString(),
    };

    this.memoryPipelines.set(updated.id, updated);

    return toMemoryPipelineSummary(updated);
  }

  validateDefinition(definition: unknown): PipelineValidationResult {
    return validatePipelineDefinition(definition);
  }

  private assertValid(validation: PipelineValidationResult): void {
    if (!validation.ok) {
      throw new BadRequestException({
        message: "Invalid pipeline graph.",
        issues: validation.issues,
      });
    }
  }

  private ensureMemorySeed(projectId: string): void {
    const hasProjectPipeline = [...this.memoryPipelines.values()].some(
      (pipeline) => pipeline.projectId === projectId,
    );

    if (hasProjectPipeline) {
      return;
    }

    const now = new Date("2026-04-29T09:00:00.000Z").toISOString();
    const pipeline: MemoryPipeline = {
      id: `pipeline_${sanitizeId(projectId)}_parking_detector`,
      projectId,
      name: "Parking detector pipeline",
      definition: demoSnapshot.pipeline,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryPipelines.set(pipeline.id, pipeline);
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
    metadataJson: Prisma.InputJsonObject,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        projectId,
        action,
        targetType,
        targetId,
        metadataJson,
      },
    });
  }
}

function toPipelineSummary(row: PipelineRow): PipelineSummary {
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
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "project";
}
