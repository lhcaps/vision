import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class NormalizeTemplateVersionDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Nếu true, convert lại kể cả khi file .docx đã tồn tại.',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
