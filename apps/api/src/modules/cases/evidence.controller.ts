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
import { AddEvidenceDto } from './dto/add-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { EvidenceService } from './evidence.service';

@ApiTags('Cases — Evidence')
@Controller('cases/:caseId/evidence')
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách tang vật/vật chứng trong hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  list(@Param('caseId') caseId: string) {
    return this.service.list(caseId);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm tang vật/vật chứng vào hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiBody({ type: AddEvidenceDto })
  add(@Param('caseId') caseId: string, @Body() body: AddEvidenceDto) {
    return this.service.add(caseId, body);
  }

  @Patch(':evidenceId')
  @ApiOperation({ summary: 'Cập nhật tang vật/vật chứng trong hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiParam({ name: 'evidenceId', description: 'ID evidence_items.' })
  @ApiBody({ type: UpdateEvidenceDto })
  update(
    @Param('caseId') caseId: string,
    @Param('evidenceId') evidenceId: string,
    @Body() body: UpdateEvidenceDto,
  ) {
    return this.service.update(caseId, evidenceId, body);
  }

  @Delete(':evidenceId')
  @ApiOperation({
    summary: 'Xoá mềm tang vật/vật chứng khỏi hồ sơ (is_deleted=true)',
  })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiParam({ name: 'evidenceId', description: 'ID evidence_items.' })
  softDelete(
    @Param('caseId') caseId: string,
    @Param('evidenceId') evidenceId: string,
  ) {
    return this.service.softDelete(caseId, evidenceId);
  }
}
