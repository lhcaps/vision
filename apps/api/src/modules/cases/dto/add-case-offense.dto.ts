import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddCaseOffenseDto {
  @ApiProperty({
    example: 'Đánh bạc',
  })
  @IsString()
  @MaxLength(255)
  offenseName!: string;

  @ApiPropertyOptional({
    example: 'DANH_BAC',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  offenseCode?: string;

  @ApiPropertyOptional({
    example: 'Trật tự xã hội',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  offenseGroup?: string;

  @ApiPropertyOptional({
    example: 'khoản 1 Điều 321 Bộ luật Hình sự',
  })
  @IsOptional()
  @IsString()
  offenseDescription?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'Nếu tội danh áp dụng riêng cho một bị can/người liên quan.',
  })
  @IsOptional()
  @IsString()
  personId?: string;
}
