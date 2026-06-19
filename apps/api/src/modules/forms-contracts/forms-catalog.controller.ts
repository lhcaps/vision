/**
 * Phase D — Forms catalog controller.
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiParam, ApiTags } from '@nestjs/swagger';
import { ResourceNotFoundError } from '../../common/application-error';
import { Public } from '../auth/public.decorator';
import { FormsCatalogService } from './application/forms-catalog.service';

@ApiTags('Forms Catalog')
@Public()
@Controller('forms')
export class FormsCatalogController {
  constructor(private readonly catalogService: FormsCatalogService) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'Lấy danh sách biểu mẫu theo contract',
    description:
      'Trả danh sách tất cả biểu mẫu từ contract. Hỗ trợ lọc theo giai đoạn, tìm kiếm, và trạng thái.',
  })
  @ApiQuery({
    name: 'stage',
    required: false,
    description: 'Mã giai đoạn (01-09)',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'status', required: false, description: 'locked | draft' })
  getCatalog(
    @Query('stage') stage?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.catalogService.getCatalog({
      stage,
      q,
      status: status as 'locked' | 'draft',
    });
  }

  @Get('catalog/by-stage')
  @ApiOperation({
    summary: 'Lấy danh sách biểu mẫu theo giai đoạn',
  })
  getCatalogByStage() {
    return this.catalogService.getCatalogByStage();
  }

  @Get('catalog/:sourceId')
  @ApiOperation({
    summary: 'Lấy chi tiết một contract biểu mẫu',
  })
  @ApiParam({
    name: 'sourceId',
    description:
      'SourceId đầy đủ (VD: BM-001__f4c2aa3682d3) hoặc mã BM (VD: BM-001)',
  })
  async getContract(@Param('sourceId') sourceId: string) {
    const contract = await this.catalogService.getContract(sourceId);
    if (!contract) {
      throw new ResourceNotFoundError(
        'FORM_CONTRACT_NOT_FOUND',
        `Contract not found: ${sourceId}`,
      );
    }
    return contract;
  }
}
