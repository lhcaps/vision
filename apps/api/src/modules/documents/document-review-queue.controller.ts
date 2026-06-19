import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentReviewQueueService } from './document-review-queue.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

type UpdateReviewStatusBody = {
  nextStatus?: string;
  reviewStatus?: string;
  reviewerName?: string;
  reviewNote?: string;
};

@ApiTags('Documents')
@Controller('document-review-queue')
export class DocumentReviewQueueController {
  constructor(
    private readonly documentReviewQueueService: DocumentReviewQueueService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách biểu mẫu đã xuất/chờ duyệt',
  })
  listReviewQueue() {
    return this.documentReviewQueueService.listReviewQueue();
  }

  @Patch(':documentId/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái phê duyệt biểu mẫu',
  })
  updateReviewStatus(
    @Param('documentId') documentId: string,
    @Body() body: UpdateReviewStatusBody,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.documentReviewQueueService.updateReviewStatus(documentId, {
      ...body,
      reviewerName: user.fullName,
    });
  }
}
