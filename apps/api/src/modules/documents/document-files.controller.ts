import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';
import {
  CleanupGeneratedDocumentFilesDto,
  DeleteGeneratedDocumentFilesDto,
} from './dto/delete-generated-document-files.dto';
import { DocumentFilesService } from './document-files.service';

@ApiTags('Documents')
@Controller('documents')
export class DocumentFilesController {
  constructor(private readonly documentFilesService: DocumentFilesService) {}

  @Get('generated/:documentId/files/:fileId/download')
  @ApiOperation({
    summary: 'Tải file DOCX/PDF đã render của biểu mẫu',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID file trong generated_document_files.',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/octet-stream',
  )
  async downloadGeneratedFile(
    @Param('documentId') documentId: string,
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const download =
      await this.documentFilesService.getGeneratedFileForDownload(
        documentId,
        fileId,
      );

    const encodedFileName = encodeURIComponent(download.fileName);

    response.set({
      'Content-Type': download.mimeType,
      'Content-Length': String(download.fileSizeBytes),
      'Content-Disposition': `attachment; filename="${download.fileName}"; filename*=UTF-8''${encodedFileName}`,
      'Cache-Control': 'no-store',
    });

    return new StreamableFile(createReadStream(download.fullPath));
  }

  @Delete('generated/:documentId/files/:fileId')
  @ApiOperation({
    summary: 'Xóa một file DOCX/PDF đã xuất của biểu mẫu',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID file trong generated_document_files.',
  })
  deleteGeneratedFile(
    @Param('documentId') documentId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.documentFilesService.deleteGeneratedFile(
      documentId,
      fileId,
      true,
    );
  }

  @Post('generated/:documentId/files/bulk-delete')
  @ApiOperation({
    summary: 'Xóa nhiều file DOCX/PDF đã chọn của biểu mẫu',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: DeleteGeneratedDocumentFilesDto,
  })
  bulkDeleteGeneratedFiles(
    @Param('documentId') documentId: string,
    @Body() body: DeleteGeneratedDocumentFilesDto,
  ) {
    return this.documentFilesService.bulkDeleteGeneratedFiles(
      documentId,
      body.fileIds,
      body.deletePhysical ?? true,
    );
  }

  @Post('generated/:documentId/files/cleanup')
  @ApiOperation({
    summary:
      'Dọn file cũ của biểu mẫu, mặc định giữ lại DOCX mới nhất và PDF mới nhất',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: CleanupGeneratedDocumentFilesDto,
  })
  cleanupGeneratedFiles(
    @Param('documentId') documentId: string,
    @Body() body: CleanupGeneratedDocumentFilesDto,
  ) {
    return this.documentFilesService.cleanupGeneratedFiles(documentId, {
      keepLatestDocx: body.keepLatestDocx ?? true,
      keepLatestPdf: body.keepLatestPdf ?? true,
      deletePhysical: body.deletePhysical ?? true,
    });
  }
}
