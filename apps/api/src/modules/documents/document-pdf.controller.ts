import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ConvertGeneratedDocumentPdfDto } from './dto/convert-generated-document-pdf.dto';
import { DocumentPdfService } from './document-pdf.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

@ApiTags('Documents')
@Controller('documents')
export class DocumentPdfController {
  constructor(private readonly documentPdfService: DocumentPdfService) {}

  @Post('generated/:documentId/convert-pdf')
  @ApiOperation({
    summary: 'Chuyển file DOCX mới nhất của biểu mẫu sang PDF',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: ConvertGeneratedDocumentPdfDto,
  })
  convertPdf(
    @Param('documentId') documentId: string,
    @Body() body: ConvertGeneratedDocumentPdfDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.documentPdfService.convertLatestDocxToPdf(documentId, {
      ...body,
      convertedByName: user.fullName,
    });
  }
}
