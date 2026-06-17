import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AddCaseAssignmentDto {
  @ApiPropertyOptional({
    example: '1',
    description: 'ID Kiểm sát viên/điều tra viên. Bỏ trống nếu chưa chọn.',
  })
  @IsOptional()
  @IsString()
  officialId?: string;

  @ApiPropertyOptional({
    example: 'PROSECUTOR',
    description: 'Vai trò phân công, ví dụ PROSECUTOR, INVESTIGATOR, REVIEWER.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignmentRole?: string;

  @ApiPropertyOptional({
    example: '2026-01-15',
  })
  @IsOptional()
  @IsDateString()
  assignedDate?: string;

  @ApiPropertyOptional({
    example: '2026-03-15',
  })
  @IsOptional()
  @IsDateString()
  endedDate?: string;

  @ApiPropertyOptional({
    example: '12/QĐ-VKS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  decisionNo?: string;

  @ApiPropertyOptional({
    example: '2026-01-10',
  })
  @IsOptional()
  @IsDateString()
  decisionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  personOrder?: number;
}
