import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { NormalizeTemplateVersionDto } from './dto/normalize-template-version.dto';
import { TemplateNormalizerService } from './template-normalizer.service';

@ApiTags('Templates')
@Controller('templates')
export class TemplateNormalizerController {
  constructor(
    private readonly templateNormalizerService: TemplateNormalizerService,
  ) {}

  @Post('versions/:versionId/normalize-docx')
  @ApiOperation({
    summary: 'Chuẩn hóa một template version từ .doc/.docx sang .docx',
  })
  @ApiParam({
    name: 'versionId',
    description: 'ID của template_versions.',
  })
  @ApiBody({
    type: NormalizeTemplateVersionDto,
  })
  normalizeVersion(
    @Param('versionId') versionId: string,
    @Body() body: NormalizeTemplateVersionDto,
  ) {
    return this.templateNormalizerService.normalizeVersion(
      versionId,
      body.force ?? false,
    );
  }

  @Post('normalize-mvp-docx')
  @ApiOperation({
    summary: 'Chuẩn hóa 5 biểu mẫu MVP từ .doc sang .docx',
  })
  @ApiBody({
    type: NormalizeTemplateVersionDto,
  })
  normalizeMvp(@Body() body: NormalizeTemplateVersionDto) {
    return this.templateNormalizerService.normalizeMvp(body.force ?? false);
  }
}
