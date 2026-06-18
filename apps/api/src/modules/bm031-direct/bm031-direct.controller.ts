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
 * Controller for BM-031 specific override routes. All endpoints live
 * under a dedicated `/bm031-direct/*` namespace to avoid colliding with
 * the standard `documents/generated/:documentId/*` routes defined in
 * `DocumentRendererController`. Previously this controller also
 * registered bare `:documentId` and `:id/render-payload` paths, which
 * silently shadowed the standard document routes and made the router
 * order-dependent.
 */
@ApiTags('BM-031 Direct')
@Controller({ path: 'documents/generated', version: undefined })
export class Bm031DirectController {
  private readonly logger = new Logger(Bm031DirectController.name);

  constructor(private readonly service: Bm031DirectService) {}

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
