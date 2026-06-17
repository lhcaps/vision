import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Bm031DirectService } from './bm031-direct.service';

/**
 * Controller cho các BM-031 direct routes.
 * Thay thế legacy Express handlers trong main.ts.
 *
 * Routes:
 *  - GET  /api/v1/documents/generated/:documentId
 *  - GET  /api/v1/documents/generated/:id/render-payload
 *  - POST /api/v1/documents/generated/:id/bm031-direct-form-inputs
 *  - GET  /api/v1/documents/generated/:id/bm031-direct-render-payload
 */
@ApiTags('BM-031 Direct')
@Controller({ path: 'documents/generated' })
export class Bm031DirectController {
  private readonly logger = new Logger(Bm031DirectController.name);

  constructor(private readonly service: Bm031DirectService) {}

  /**
   * GET detail document (kèm BM-031 normalize).
   * Không raise 404 khi không phải BM-031: trả về null để client fallback về standard detail.
   */
  @Get(':documentId')
  @ApiOperation({
    summary: 'Lấy document detail (BM-031 normalized nếu áp dụng)',
  })
  async getDetail(@Param('documentId') documentId: string): Promise<unknown> {
    const id = await this.service.resolveDocumentId(documentId);
    const detail = await this.service.getDocumentDetail(id);
    if (!detail) {
      // Không phải BM-031 hoặc không tồn tại: trả về null cho client tự xử lý.
      return null;
    }
    return detail;
  }

  @Get(':id/render-payload')
  @ApiOperation({ summary: 'Lấy render payload (BM-031 override)' })
  async getRenderPayload(@Param('id') id: string): Promise<unknown> {
    const documentId = await this.service.resolveDocumentId(id);
    const payload = await this.service.getRenderPayloadOverride(documentId);
    if (!payload) {
      throw new NotFoundException(
        'Render payload không tồn tại hoặc không phải BM-031.',
      );
    }
    return payload;
  }

  @Get(':id/bm031-direct-render-payload')
  @ApiOperation({ summary: 'Lấy BM-031 direct render payload' })
  async getDirectRenderPayload(@Param('id') id: string): Promise<unknown> {
    const documentId = await this.service.resolveDocumentId(id);
    const payload = await this.service.getDirectRenderPayload(documentId);
    if (!payload) {
      throw new NotFoundException(
        'BM-031 direct render payload không tồn tại.',
      );
    }
    return payload;
  }

  @Post(':id/bm031-direct-form-inputs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lưu form inputs cho BM-031 (legacy direct)' })
  async saveFormInputs(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Body phải là object.');
    }
    const documentId = await this.service.resolveDocumentId(id);
    return this.service.saveFormInputs(documentId, body);
  }
}
