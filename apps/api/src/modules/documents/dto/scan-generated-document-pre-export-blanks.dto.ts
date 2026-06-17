import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ScanGeneratedDocumentPreExportBlanksDto {
  @ApiPropertyOptional({
    example: false,
    description:
      'Nếu true thì vẫn trả về các chỗ trống có dấu hiệu ngày/tháng/năm. Mặc định là false.',
  })
  @IsOptional()
  @IsBoolean()
  includeDateLike?: boolean;
}
