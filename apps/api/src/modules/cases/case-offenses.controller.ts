import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AddCaseOffenseDto } from './dto/add-case-offense.dto';
import { UpdateCaseOffenseDto } from './dto/update-case-offense.dto';
import { CaseOffensesService } from './case-offenses.service';

@ApiTags('Cases — Offenses')
@Controller('cases/:caseId/offenses')
export class CaseOffensesController {
  constructor(private readonly service: CaseOffensesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách tội danh trong hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  list(@Param('caseId') caseId: string) {
    return this.service.list(caseId);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm tội danh vào hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiBody({ type: AddCaseOffenseDto })
  add(@Param('caseId') caseId: string, @Body() body: AddCaseOffenseDto) {
    return this.service.add(caseId, body);
  }

  @Patch(':caseOffenseId')
  @ApiOperation({ summary: 'Cập nhật tội danh trong hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiParam({ name: 'caseOffenseId', description: 'ID case_offenses.' })
  @ApiBody({ type: UpdateCaseOffenseDto })
  update(
    @Param('caseId') caseId: string,
    @Param('caseOffenseId') caseOffenseId: string,
    @Body() body: UpdateCaseOffenseDto,
  ) {
    return this.service.update(caseId, caseOffenseId, body);
  }

  @Delete(':caseOffenseId')
  @ApiOperation({
    summary: 'Xoá mềm tội danh khỏi hồ sơ (is_deleted=true)',
  })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiParam({ name: 'caseOffenseId', description: 'ID case_offenses.' })
  softDelete(
    @Param('caseId') caseId: string,
    @Param('caseOffenseId') caseOffenseId: string,
  ) {
    return this.service.softDelete(caseId, caseOffenseId);
  }
}
