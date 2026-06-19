import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateDocumentGenerationBatchDto } from './dto/create-document-generation-batch.dto';
import { DocumentsService } from './documents.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('cases/:caseId/available-templates')
  @ApiOperation({
    summary: 'Lấy danh sách biểu mẫu có thể tạo cho một hồ sơ',
  })
  @ApiParam({
    name: 'caseId',
    description: 'ID hồ sơ.',
  })
  getAvailableTemplates(@Param('caseId') caseId: string) {
    return this.documentsService.getAvailableTemplates(caseId);
  }

  @Post('cases/:caseId/plan')
  @ApiOperation({
    summary: 'Xem trước kế hoạch tạo biểu mẫu theo render_scope',
  })
  @ApiParam({
    name: 'caseId',
    description: 'ID hồ sơ.',
  })
  @ApiBody({
    type: CreateDocumentGenerationBatchDto,
  })
  buildPlan(
    @Param('caseId') caseId: string,
    @Body() body: CreateDocumentGenerationBatchDto,
  ) {
    return this.documentsService.buildPlan(caseId, body);
  }

  @Post('cases/:caseId/batches')
  @ApiOperation({
    summary: 'Tạo batch biểu mẫu chờ duyệt cho hồ sơ',
  })
  @ApiParam({
    name: 'caseId',
    description: 'ID hồ sơ.',
  })
  @ApiBody({
    type: CreateDocumentGenerationBatchDto,
  })
  createBatch(
    @Param('caseId') caseId: string,
    @Body() body: CreateDocumentGenerationBatchDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.documentsService.createBatch(caseId, {
      ...body,
      createdByName: user.fullName,
    });
  }

  @Get('batches/:batchId')
  @ApiOperation({
    summary: 'Lấy chi tiết batch biểu mẫu đã tạo',
  })
  @ApiParam({
    name: 'batchId',
    description: 'ID batch.',
  })
  findBatch(@Param('batchId') batchId: string) {
    return this.documentsService.findBatch(batchId);
  }
}
