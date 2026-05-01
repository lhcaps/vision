import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import {
  AnnotationSummarySchema,
  AnnotationWorkspaceResponseSchema,
  CreateAnnotationRequestSchema,
  DeleteAnnotationResponseSchema,
  UpdateAnnotationRequestSchema,
} from '@visionflow/contracts';
import { validateAnnotationGeometry } from '../validation/annotation-geometry.validator';
import { AnnotationsService } from './annotations.service';

@ApiTags('annotations')
@Controller('projects/:projectId')
export class AnnotationsController {
  constructor(
    @Inject(AnnotationsService) private readonly annotationsService: AnnotationsService
  ) {}

  @Get('dataset-versions/:versionId/annotation-workspace')
  @ApiQuery({
    name: 'assetId',
    required: false,
  })
  @ApiOkResponse({
    description: 'Load the annotation set, labels, selected asset, and BBox rows for an asset.',
  })
  async getWorkspace(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Query('assetId') assetId?: string
  ) {
    return AnnotationWorkspaceResponseSchema.parse(
      await this.annotationsService.loadWorkspace(projectId, versionId, assetId)
    );
  }

  @Post('annotation-sets/:annotationSetId/annotations')
  @ApiBody({
    schema: {
      example: {
        assetId: 'asset_frame_1482',
        labelClassId: 'label_car',
        geometry: {
          x: 318,
          y: 284,
          width: 344,
          height: 188,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Create a manual BBox annotation in image coordinates.',
  })
  async createAnnotation(
    @Param('projectId') projectId: string,
    @Param('annotationSetId') annotationSetId: string,
    @Body() body: unknown
  ) {
    const dto = parseBody(CreateAnnotationRequestSchema, body, 'Invalid annotation create body.');
    validateAnnotationGeometry(dto.geometry);

    return AnnotationSummarySchema.parse(
      await this.annotationsService.createAnnotation(projectId, annotationSetId, dto)
    );
  }

  @Patch('annotations/:annotationId')
  @ApiBody({
    schema: {
      example: {
        labelClassId: 'label_van',
        geometry: {
          x: 1014,
          y: 352,
          width: 278,
          height: 162,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Update a BBox annotation label or image-coordinate geometry.',
  })
  async updateAnnotation(
    @Param('projectId') projectId: string,
    @Param('annotationId') annotationId: string,
    @Body() body: unknown
  ) {
    const dto = parseBody(UpdateAnnotationRequestSchema, body, 'Invalid annotation update body.');
    if (dto.geometry) {
      validateAnnotationGeometry(dto.geometry);
    }

    return AnnotationSummarySchema.parse(
      await this.annotationsService.updateAnnotation(projectId, annotationId, dto)
    );
  }

  @Delete('annotations/:annotationId')
  @ApiOkResponse({
    description: 'Delete a BBox annotation.',
  })
  async deleteAnnotation(
    @Param('projectId') projectId: string,
    @Param('annotationId') annotationId: string
  ) {
    return DeleteAnnotationResponseSchema.parse(
      await this.annotationsService.deleteAnnotation(projectId, annotationId)
    );
  }
}

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown, message: string): T {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException({
      message,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  return parsed.data;
}
