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
import { diskStorage } from 'multer';
import { randomBytes } from 'node:crypto';
import { createReadStream, mkdirSync } from 'node:fs';
import * as path from 'node:path';
import type { Response } from 'express';
import type { Request } from 'express';
import { ConfirmImportBatchDto } from './dto/confirm-import-batch.dto';
import { ImportsService } from './imports.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

function getTempUploadRoot(): string {
  return path.resolve(process.cwd(), '..', '..', 'storage', 'imports', '_tmp');
}

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
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (
          _req: Request,
          _file: Express.Multer.File,
          callback: (error: Error | null, destination: string) => void,
        ) => {
          const tempRoot = getTempUploadRoot();
          mkdirSync(tempRoot, {
            recursive: true,
          });
          callback(null, tempRoot);
        },
        filename: (
          _req: Request,
          file: Express.Multer.File,
          callback: (error: Error | null, filename: string) => void,
        ) => {
          const extension = path.extname(file.originalname || '').toLowerCase();
          callback(
            null,
            `${Date.now()}-${randomBytes(4).toString('hex')}${extension}`,
          );
        },
      }),
    }),
  )
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
