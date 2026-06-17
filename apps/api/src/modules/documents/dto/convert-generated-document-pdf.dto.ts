import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ConvertGeneratedDocumentPdfDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Nếu true, convert lại PDF kể cả khi đã có PDF trước đó.',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    example: 'Tên người dùng từ phiên đăng nhập',
  })
  @IsOptional()
  @IsString()
  convertedByName?: string;
}
