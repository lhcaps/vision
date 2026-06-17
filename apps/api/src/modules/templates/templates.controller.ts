import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { TemplatesService } from './templates.service';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('groups')
  @ApiOperation({
    summary: 'Lấy danh sách nhóm biểu mẫu',
  })
  getGroups() {
    return this.templatesService.getGroups();
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách biểu mẫu',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Tìm theo mã, số, tên biểu mẫu hoặc tên file gốc.',
  })
  @ApiQuery({
    name: 'groupCode',
    required: false,
    description: 'Mã nhóm biểu mẫu, ví dụ G01_RECEPTION.',
  })
  @ApiQuery({
    name: 'renderScope',
    required: false,
    description:
      'CASE_LEVEL, PERSON_LEVEL, SELECTED_PERSONS, EVIDENCE_LEVEL, EVENT_LEVEL.',
  })
  @ApiQuery({
    name: 'stageCode',
    required: false,
    description:
      'RECEPTION, PREVENTIVE_MEASURES, INVESTIGATION, PROSECUTION...',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    description: 'true/false. Mặc định true.',
  })
  @ApiQuery({
    name: 'mine',
    required: false,
    description: 'true để chỉ lấy biểu mẫu do tài khoản hiện tại đăng/seed.',
  })
  findAll(
    @Query('q') q?: string,
    @Query('groupCode') groupCode?: string,
    @Query('renderScope') renderScope?: string,
    @Query('stageCode') stageCode?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('mine') mine?: string,
    @CurrentUser() user?: CurrentUserType | null,
  ) {
    return this.templatesService.findAll({
      q,
      groupCode,
      renderScope,
      stageCode,
      activeOnly: activeOnly === undefined ? true : activeOnly !== 'false',
      createdByOfficialId: mine === 'true' ? user?.id : undefined,
    });
  }

  @Get('mine')
  @ApiOperation({
    summary: 'Lấy các biểu mẫu do tài khoản hiện tại đăng/seed',
  })
  findMine(@CurrentUser() user?: CurrentUserType | null) {
    return this.templatesService.findAll({
      activeOnly: true,
      createdByOfficialId: user?.id,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một biểu mẫu',
  })
  @ApiParam({
    name: 'id',
    description: 'ID biểu mẫu.',
  })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }
}
