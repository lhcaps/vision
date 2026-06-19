import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RenderGeneratedDocumentDto } from './dto/render-generated-document.dto';
import { ScanGeneratedDocumentPreExportBlanksDto } from './dto/scan-generated-document-pre-export-blanks.dto';
import { UpdateGeneratedDocumentFormInputsDto } from './dto/update-generated-document-form-inputs.dto';
import { UpdateGeneratedDocumentPreExportConfigDto } from './dto/update-generated-document-pre-export-config.dto';
import { DocumentRendererService } from './document-renderer.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';
import { RenderGeneratedDocumentUseCase } from './rendering/application/render-generated-document.use-case';

@ApiTags('Documents')
@Controller('documents')
export class DocumentRendererController {
  constructor(
    private readonly documentRendererService: DocumentRendererService,
    private readonly renderGeneratedDocument: RenderGeneratedDocumentUseCase,
  ) {}

  @Get('generated/:documentId/render-payload')
  @ApiOperation({
    summary: 'Xem payload dữ liệu sẽ dùng để render biểu mẫu',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  getRenderPayload(
    @Param('documentId') documentId: string,
    @CurrentUserDecorator() user: CurrentUser | null,
  ) {
    return this.documentRendererService.getRenderPayload(documentId, user);
  }

  @Get('generated/:documentId/pre-export-config')
  @ApiOperation({
    summary: 'Lấy tùy chỉnh trước khi xuất của biểu mẫu đã tạo',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  getPreExportConfig(@Param('documentId') documentId: string) {
    return this.documentRendererService.getPreExportConfig(documentId);
  }

  @Put('generated/:documentId/pre-export-config')
  @ApiOperation({
    summary: 'Lưu tùy chỉnh trước khi xuất của biểu mẫu đã tạo',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: UpdateGeneratedDocumentPreExportConfigDto,
  })
  savePreExportConfig(
    @Param('documentId') documentId: string,
    @Body() body: UpdateGeneratedDocumentPreExportConfigDto,
  ) {
    return this.documentRendererService.savePreExportConfig(documentId, body);
  }

  @Post('generated/:documentId/pre-export-config/scan-blanks')
  @ApiOperation({
    summary: 'Quét các chỗ trống thủ công có thể cần điền trong file Word',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: ScanGeneratedDocumentPreExportBlanksDto,
  })
  scanPreExportBlankCandidates(
    @Param('documentId') documentId: string,
    @Body() body: ScanGeneratedDocumentPreExportBlanksDto,
  ) {
    return this.documentRendererService.scanPreExportBlankCandidates(
      documentId,
      body,
    );
  }

  @Post('generated/:documentId/form-inputs')
  @ApiOperation({
    summary: 'Cập nhật dữ liệu riêng của biểu mẫu trước khi render',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: UpdateGeneratedDocumentFormInputsDto,
  })
  updateFormInputs(
    @Param('documentId') documentId: string,
    @Body() body: UpdateGeneratedDocumentFormInputsDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.documentRendererService.updateFormInputs(documentId, {
      ...body,
      updatedByName: user.fullName,
    });
  }

  @Post('generated/:documentId/render-docx')
  @ApiOperation({
    summary: 'Render biểu mẫu đã tạo ra file DOCX',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: RenderGeneratedDocumentDto,
  })
  renderDocx(
    @Param('documentId') documentId: string,
    @Body() body: RenderGeneratedDocumentDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.renderGeneratedDocument.execute({
      documentId,
      options: {
        ...body,
        renderedByName: user.fullName,
      },
      actor: user,
    });
  }
}
