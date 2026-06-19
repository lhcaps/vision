import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';
import { ConfirmImportBatchDto } from './dto/confirm-import-batch.dto';
import { ImportsService } from './imports.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

@ApiTags('Imports')
@Controller('import')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Tải lên một hoặc nhiều tệp để import dữ liệu',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        createdByName: {
          type: 'string',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 20))
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    if (!files?.length) {
      throw new BadRequestException('Vui lòng chọn ít nhất một tệp để import.');
    }

    return this.importsService.uploadFiles(files, user.fullName);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Lấy lịch sử import dữ liệu',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Trang hiện tại.',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Số bản ghi mỗi trang.',
  })
  history(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.importsService.getHistory(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 12,
    );
  }

  @Get('batches/:batchId')
  @ApiOperation({
    summary: 'Lấy chi tiết một lô import',
  })
  @ApiParam({
    name: 'batchId',
    description: 'Mã lô import hoặc ID số.',
  })
  batch(@Param('batchId') batchId: string) {
    return this.importsService.getBatch(batchId);
  }

  @Post('batches/:batchId/confirm')
  @ApiOperation({
    summary: 'Xác nhận import vào nơi lưu đã chọn',
  })
  @ApiParam({
    name: 'batchId',
    description: 'Mã lô import hoặc ID số.',
  })
  @ApiBody({
    type: ConfirmImportBatchDto,
  })
  confirm(
    @Param('batchId') batchId: string,
    @Body() body: ConfirmImportBatchDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.importsService.confirmBatch(batchId, {
      ...body,
      createdByName: user.fullName,
    });
  }

  @Get('files/:fileId/download')
  @ApiOperation({
    summary: 'Tải file import gốc',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID file import.',
  })
  @ApiProduces('application/octet-stream')
  async download(
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const download = await this.importsService.getFileDownload(fileId);
    const encodedFileName = encodeURIComponent(download.fileName);

    response.set({
      'Content-Type': download.mimeType,
      'Content-Length': String(download.fileSizeBytes),
      'Content-Disposition': `attachment; filename="${download.fileName}"; filename*=UTF-8''${encodedFileName}`,
      'Cache-Control': 'no-store',
    });

    return new StreamableFile(createReadStream(download.fullPath));
  }
}
