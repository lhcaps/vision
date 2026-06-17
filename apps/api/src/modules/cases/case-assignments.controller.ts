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
import { AddCaseAssignmentDto } from './dto/add-case-assignment.dto';
import { UpdateCaseAssignmentDto } from './dto/update-case-assignment.dto';
import { CaseAssignmentsService } from './case-assignments.service';

@ApiTags('Cases — Assignments')
@Controller('cases/:caseId/assignments')
export class CaseAssignmentsController {
  constructor(private readonly service: CaseAssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phân công trong hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  list(@Param('caseId') caseId: string) {
    return this.service.list(caseId);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm phân công cán bộ vào hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiBody({ type: AddCaseAssignmentDto })
  add(@Param('caseId') caseId: string, @Body() body: AddCaseAssignmentDto) {
    return this.service.add(caseId, body);
  }

  @Patch(':assignmentId')
  @ApiOperation({ summary: 'Cập nhật phân công cán bộ trong hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiParam({ name: 'assignmentId', description: 'ID case_assignments.' })
  @ApiBody({ type: UpdateCaseAssignmentDto })
  update(
    @Param('caseId') caseId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: UpdateCaseAssignmentDto,
  ) {
    return this.service.update(caseId, assignmentId, body);
  }

  @Delete(':assignmentId')
  @ApiOperation({
    summary: 'Xoá mềm phân công cán bộ khỏi hồ sơ (is_active=false)',
  })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiParam({ name: 'assignmentId', description: 'ID case_assignments.' })
  softDelete(
    @Param('caseId') caseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.service.softDelete(caseId, assignmentId);
  }
}
