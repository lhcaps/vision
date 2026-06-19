import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class RenderGeneratedDocumentDto {
  @ApiPropertyOptional({
    example: true,
    description:
      'Nếu true, render lại và tạo file DOCX mới kể cả khi đã có file trước đó.',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    example: 'Tên người dùng từ phiên đăng nhập',
  })
  @IsOptional()
  @IsString()
  renderedByName?: string;
}
