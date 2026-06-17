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
import { AddCasePersonDto } from './dto/add-case-person.dto';
import { UpdateCasePersonDto } from './dto/update-case-person.dto';
import { CasePeopleService } from './case-people.service';

@ApiTags('Cases — People')
@Controller('cases/:caseId/people')
export class CasePeopleController {
  constructor(private readonly service: CasePeopleService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách người liên quan trong hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  list(@Param('caseId') caseId: string) {
    return this.service.list(caseId);
  }

  @Post()
  @ApiOperation({ summary: 'Thêm người liên quan vào hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiBody({ type: AddCasePersonDto })
  add(@Param('caseId') caseId: string, @Body() body: AddCasePersonDto) {
    return this.service.add(caseId, body);
  }

  @Patch(':casePersonId')
  @ApiOperation({ summary: 'Cập nhật thông tin người liên quan trong hồ sơ' })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiParam({ name: 'casePersonId', description: 'ID case_people.' })
  @ApiBody({ type: UpdateCasePersonDto })
  update(
    @Param('caseId') caseId: string,
    @Param('casePersonId') casePersonId: string,
    @Body() body: UpdateCasePersonDto,
  ) {
    return this.service.update(caseId, casePersonId, body);
  }

  @Delete(':casePersonId')
  @ApiOperation({
    summary: 'Xoá mềm người liên quan khỏi hồ sơ (is_active=false)',
  })
  @ApiParam({ name: 'caseId', description: 'ID hồ sơ.' })
  @ApiParam({ name: 'casePersonId', description: 'ID case_people.' })
  softDelete(
    @Param('caseId') caseId: string,
    @Param('casePersonId') casePersonId: string,
  ) {
    return this.service.softDelete(caseId, casePersonId);
  }
}
