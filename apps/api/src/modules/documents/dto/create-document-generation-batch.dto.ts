import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

const OUTPUT_FORMATS = ['DOCX', 'PDF'] as const;

export class CreateDocumentGenerationBatchDto {
  @ApiProperty({
    example: ['1', '2', '5'],
    description: 'Danh sách ID biểu mẫu cần tạo.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  templateIds!: string[];

  @ApiPropertyOptional({
    example: ['2'],
    description:
      'Danh sách personId được áp dụng cho mẫu PERSON_LEVEL. Nếu bỏ trống, hệ thống tự lấy ACCUSED/DEFENDANT trong hồ sơ.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPersonIds?: string[];

  @ApiPropertyOptional({
    enum: OUTPUT_FORMATS,
    isArray: true,
    example: ['DOCX', 'PDF'],
  })
  @IsOptional()
  @IsArray()
  @IsIn(OUTPUT_FORMATS, { each: true })
  formats?: string[];

  @ApiPropertyOptional({
    example: 'Tên người dùng từ phiên đăng nhập',
  })
  @IsOptional()
  @IsString()
  createdByName?: string;

  @ApiPropertyOptional({
    example: 'Tạo batch biểu mẫu cho hồ sơ đang xử lý.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
