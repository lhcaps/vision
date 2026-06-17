import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewGeneratedDocumentDto } from './dto/review-generated-document.dto';
import { DocumentReviewsService } from './document-reviews.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

@ApiTags('Documents')
@Controller('documents')
export class DocumentReviewsController {
  constructor(
    private readonly documentReviewsService: DocumentReviewsService,
  ) {}

  @Get('generated')
  @ApiOperation({
    summary: 'Lấy danh sách biểu mẫu đã tạo/chờ duyệt',
  })
  @ApiQuery({
    name: 'caseId',
    required: false,
    description: 'Lọc theo ID hồ sơ.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'WAITING_REVIEW, APPROVED, NEEDS_REVISION, FINAL_EXPORTED, CANCELLED.',
  })
  @ApiQuery({
    name: 'templateId',
    required: false,
    description: 'Lọc theo ID biểu mẫu.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Trang (mặc định 1).',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Số bản ghi / trang (mặc định 50, tối đa 200).',
  })
  findGeneratedDocuments(
    @Query('caseId') caseId?: string,
    @Query('status') status?: string,
    @Query('templateId') templateId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.documentReviewsService.findGeneratedDocuments({
      caseId,
      status,
      templateId,
      page,
      pageSize,
    });
  }

  @Get('generated/:documentId')
  @ApiOperation({
    summary: 'Lấy chi tiết biểu mẫu đã tạo',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  findGeneratedDocument(@Param('documentId') documentId: string) {
    return this.documentReviewsService.findGeneratedDocument(documentId);
  }

  @Post('generated/:documentId/review')
  @ApiOperation({
    summary: 'Duyệt/yêu cầu sửa/hủy biểu mẫu đã tạo',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: ReviewGeneratedDocumentDto,
  })
  reviewGeneratedDocument(
    @Param('documentId') documentId: string,
    @Body() body: ReviewGeneratedDocumentDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.documentReviewsService.reviewGeneratedDocument(documentId, {
      ...body,
      reviewerName: user.fullName,
    });
  }
}
