import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class NewCaseImportDto {
  @ApiPropertyOptional({
    description: 'Mã hồ sơ gợi ý hoặc do người dùng nhập.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  caseCode?: string;

  @ApiProperty({
    description: 'Tên hồ sơ/vụ án.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  caseTitle!: string;

  @ApiPropertyOptional({
    description: 'Tên bị can hoặc người liên quan.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  relatedPersonName?: string;

  @ApiPropertyOptional({
    description: 'Tội danh.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  offenseName?: string;

  @ApiPropertyOptional({
    description: 'Ngày tạo hồ sơ theo YYYY-MM-DD.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  createdDate?: string;
}

export class ConfirmImportBatchDto {
  @ApiProperty({
    enum: ['NEW_CASE', 'EXISTING_CASE', 'RAW_REFERENCE', 'TEMPLATE_SOURCE'],
    description: 'Nơi lưu kết quả import.',
  })
  @IsString()
  @IsIn(['NEW_CASE', 'EXISTING_CASE', 'RAW_REFERENCE', 'TEMPLATE_SOURCE'])
  targetType!:
    | 'NEW_CASE'
    | 'EXISTING_CASE'
    | 'RAW_REFERENCE'
    | 'TEMPLATE_SOURCE';

  @ApiPropertyOptional({
    description: 'ID hồ sơ hiện có nếu chọn gắn vào hồ sơ.',
  })
  @ValidateIf((value) => value.targetType === 'EXISTING_CASE')
  @IsString()
  @IsNotEmpty()
  existingCaseId?: string;

  @ApiPropertyOptional({
    description: 'Thông tin hồ sơ mới nếu chọn tạo hồ sơ mới.',
    type: NewCaseImportDto,
  })
  @ValidateIf((value) => value.targetType === 'NEW_CASE')
  @ValidateNested()
  @Type(() => NewCaseImportDto)
  newCase?: NewCaseImportDto;

  @ApiPropertyOptional({
    description: 'Ghi chú nghiệp vụ nội bộ.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({
    description: 'Tên người thao tác.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  createdByName?: string;
}
