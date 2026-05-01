import { Controller, Get, Param, Post, UploadedFile, UseInterceptors, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { MediaUploadResponseSchema } from '@visionflow/contracts';
import { MediaService } from './media.service';
import { SignedUrlService } from '../common/utils/signed-url';

@ApiTags('media')
@Controller('projects/:projectId/media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly signedUrlService: SignedUrlService,
  ) {}

  @Get()
  @ApiOkResponse({
    description: 'List media assets for a project.',
  })
  list(@Param('projectId') projectId: string) {
    return this.mediaService.list(projectId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 250 * 1024 * 1024,
        files: 1,
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Upload media, dedupe by checksum, store original, and queue processing.',
  })
  async upload(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File | undefined
  ) {
    return MediaUploadResponseSchema.parse(await this.mediaService.upload(projectId, file));
  }

  @Get(':assetId/file')
  @ApiOkResponse({
    description: 'Get asset file via signed URL or proxy.',
  })
  async getAssetFile(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
    @Res() res: Response,
    @Headers('accept') accept: string,
  ) {
    const asset = await this.mediaService.findAsset(projectId, assetId);
    if (!asset) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Asset not found.',
        timestamp: new Date().toISOString(),
      });
    }

    const signedUrlExpiry = Number(process.env.SIGNED_URL_EXPIRY_SECONDS ?? 0);

    if (signedUrlExpiry > 0) {
      const signedUrl = await this.signedUrlService.generateSignedUrl(
        asset.storageKey,
        signedUrlExpiry,
      );
      return res.status(302).redirect(signedUrl);
    }

    try {
      const { buffer, meta } = await this.signedUrlService.streamFile(asset.storageKey);
      res.setHeader('Content-Type', meta['Content-Type'] ?? 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${asset.name}"`,
      );
      return res.status(200).send(buffer);
    } catch {
      return res.status(502).json({
        statusCode: 502,
        message: 'Failed to retrieve asset from storage.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
