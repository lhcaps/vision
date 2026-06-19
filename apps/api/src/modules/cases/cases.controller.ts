import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CasesService } from './cases.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

@ApiTags('Cases')
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách hồ sơ vụ án',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Tìm theo mã hồ sơ, mã quốc gia, tên vụ án hoặc mô tả.',
  })
  @ApiQuery({
    name: 'stage',
    required: false,
    description: 'Giai đoạn hồ sơ, ví dụ RECEPTION, INVESTIGATION.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Trạng thái hồ sơ, ví dụ DRAFT, IN_PROGRESS.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Trang hiện tại.',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Số dòng mỗi trang.',
  })
  findAll(
    @Query('q') q?: string,
    @Query('stage') stage?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.casesService.findAll({
      q,
      stage,
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('reports/summary')
  @ApiOperation({
    summary: 'Báo cáo hồ sơ theo tuần/tháng, phường và tội danh',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Kỳ báo cáo: WEEK hoặc MONTH.',
  })
  @ApiQuery({
    name: 'anchorDate',
    required: false,
    description: 'Ngày neo kỳ báo cáo theo định dạng YYYY-MM-DD.',
  })
  getReportSummary(
    @Query('period') period?: string,
    @Query('anchorDate') anchorDate?: string,
  ) {
    return this.casesService.getReportSummary({
      period,
      anchorDate,
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo hồ sơ vụ án',
  })
  @ApiBody({
    type: CreateCaseDto,
  })
  create(
    @Body() body: CreateCaseDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.casesService.create({
      ...body,
      createdByName: user.fullName,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết hồ sơ vụ án',
  })
  @ApiParam({
    name: 'id',
    description: 'ID hồ sơ.',
  })
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật hồ sơ vụ án',
  })
  @ApiParam({
    name: 'id',
    description: 'ID hồ sơ.',
  })
  @ApiBody({
    type: UpdateCaseDto,
  })
  update(
    @Param('id') id: string,
    @Body() body: UpdateCaseDto,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.casesService.update(id, {
      ...body,
      updatedByName: user.fullName,
    });
  }
}
