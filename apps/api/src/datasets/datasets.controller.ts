import { BadRequestException, Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import {
  AssignDatasetVersionAssetsRequestSchema,
  CreateDatasetRequestSchema,
  CreateDatasetVersionRequestSchema,
  DatasetListResponseSchema,
  DatasetSummarySchema,
  DatasetVersionListResponseSchema,
  DatasetVersionSummarySchema,
  LockDatasetVersionResponseSchema,
  CocoExportResponseSchema,
} from '@visionflow/contracts';
import { DatasetsService } from './datasets.service';
import { CocoExportService } from './coco-export.service';

@ApiTags('datasets')
@Controller('projects/:projectId')
export class DatasetsController {
  constructor(
    @Inject(DatasetsService) private readonly datasetsService: DatasetsService,
    @Inject(CocoExportService) private readonly cocoExportService: CocoExportService
  ) {}

  @Post('datasets')
  @ApiBody({
    schema: {
      example: {
        name: 'Parking Lot Dataset',
        description: 'Curated parking lot frames for detector evaluation.',
      },
    },
  })
  @ApiOkResponse({
    description: 'Create a mutable dataset identity for a project.',
  })
  async createDataset(@Param('projectId') projectId: string, @Body() body: unknown) {
    const dto = parseBody(CreateDatasetRequestSchema, body);
    return DatasetSummarySchema.parse(await this.datasetsService.createDataset(projectId, dto));
  }

  @Get('datasets')
  @ApiOkResponse({
    description: 'List datasets with version and asset counts.',
  })
  async listDatasets(@Param('projectId') projectId: string) {
    return DatasetListResponseSchema.parse({
      datasets: await this.datasetsService.listDatasets(projectId),
    });
  }

  @Post('datasets/:datasetId/versions')
  @ApiBody({
    schema: {
      example: {
        parentVersionId: 'dataset_version_v1',
      },
    },
  })
  @ApiOkResponse({
    description: 'Create a draft immutable-snapshot candidate for a dataset.',
  })
  async createVersion(
    @Param('projectId') projectId: string,
    @Param('datasetId') datasetId: string,
    @Body() body: unknown
  ) {
    const dto = parseBody(CreateDatasetVersionRequestSchema, body ?? {});
    return DatasetVersionSummarySchema.parse(
      await this.datasetsService.createVersion(projectId, datasetId, dto)
    );
  }

  @Get('datasets/:datasetId/versions')
  @ApiOkResponse({
    description: 'List dataset version timeline entries with computed split summaries.',
  })
  async listVersions(@Param('projectId') projectId: string, @Param('datasetId') datasetId: string) {
    return DatasetVersionListResponseSchema.parse({
      versions: await this.datasetsService.listVersions(projectId, datasetId),
    });
  }

  @Post('dataset-versions/:versionId/assets')
  @ApiBody({
    schema: {
      example: {
        assets: [
          {
            assetId: 'asset_frame_1482',
            split: 'TRAIN',
          },
        ],
      },
    },
  })
  @ApiOkResponse({
    description: 'Assign media assets to a draft dataset version.',
  })
  async assignAssets(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body() body: unknown
  ) {
    const dto = parseBody(AssignDatasetVersionAssetsRequestSchema, body);
    return DatasetVersionSummarySchema.parse(
      await this.datasetsService.assignAssets(projectId, versionId, dto)
    );
  }

  @Post('dataset-versions/:versionId/lock')
  @ApiOkResponse({
    description: 'Lock a draft dataset version so it becomes immutable.',
  })
  async lockVersion(@Param('projectId') projectId: string, @Param('versionId') versionId: string) {
    return LockDatasetVersionResponseSchema.parse({
      version: await this.datasetsService.lockVersion(projectId, versionId),
    });
  }

  @Get('dataset-versions/:versionId/export/coco')
  @ApiOkResponse({
    description: 'Export a locked dataset version as deterministic COCO JSON.',
  })
  async exportCoco(@Param('projectId') projectId: string, @Param('versionId') versionId: string) {
    return CocoExportResponseSchema.parse(
      await this.cocoExportService.exportCoco(projectId, versionId)
    );
  }
}

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException({
      message: 'Invalid dataset request body.',
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  return parsed.data;
}
