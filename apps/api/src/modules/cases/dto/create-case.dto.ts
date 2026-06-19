import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const CASE_TYPES = [
  'CRIMINAL_CASE',
  'CRIME_REPORT',
  'ADMINISTRATIVE_DOSSIER',
  'CIVIL_MATTER',
  'OTHER',
] as const;

const CASE_STAGES = [
  'RECEPTION',
  'PREVENTIVE_MEASURES',
  'ASSIGNMENT',
  'INVESTIGATION',
  'PROSECUTION',
  'TRIAL_PREPARATION',
  'EVIDENCE_HANDLING',
  'SPECIAL_PROCEDURE',
  'CLOSED',
] as const;

const CASE_STATUSES = [
  'DRAFT',
  'RECEIVED',
  'WAITING_PROCESS',
  'IN_PROGRESS',
  'WAITING_REVIEW',
  'ACCEPTED',
  'HANDLING',
  'SUSPENDED',
  'TERMINATED',
  'PROSECUTED',
  'RETURNED_RESULT',
  'CLOSED',
] as const;

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export class CreateCaseDto {
  @ApiPropertyOptional({
    example: '',
    description: 'Mã hồ sơ nội bộ. Nếu bỏ trống, hệ thống tự sinh.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  caseCode?: string;

  @ApiPropertyOptional({
    example: 'QG-2026-0001',
    description: 'Mã hồ sơ quốc gia nếu có.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationalCaseCode?: string;

  @ApiProperty({
    example: 'Vụ án đánh bạc tại phường Trung Mỹ Tây',
  })
  @IsString()
  @MaxLength(500)
  caseTitle!: string;

  @ApiPropertyOptional({
    example: 'Hồ sơ tiếp nhận nguồn tin và xử lý ban đầu.',
  })
  @IsOptional()
  @IsString()
  caseSummary?: string;

  @ApiPropertyOptional({
    enum: CASE_TYPES,
    example: 'CRIMINAL_CASE',
  })
  @IsOptional()
  @IsIn(CASE_TYPES)
  caseType?: string;

  @ApiPropertyOptional({
    example: 'TIN_BAO_TOI_PHAM',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceType?: string;

  @ApiPropertyOptional({
    enum: CASE_STAGES,
    example: 'RECEPTION',
  })
  @IsOptional()
  @IsIn(CASE_STAGES)
  currentStage?: string;

  @ApiPropertyOptional({
    enum: CASE_STATUSES,
    example: 'DRAFT',
  })
  @IsOptional()
  @IsIn(CASE_STATUSES)
  currentStatus?: string;

  @ApiPropertyOptional({
    example: '2026-05-06',
  })
  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'ID địa bàn/phường xã trong bảng wards.',
  })
  @IsOptional()
  @IsString()
  wardId?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'ID cơ quan trong bảng agencies.',
  })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({
    enum: PRIORITIES,
    example: 'NORMAL',
  })
  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: string;

  @ApiPropertyOptional({
    example: 'Ghi chú nội bộ.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: 'Tên người dùng từ phiên đăng nhập',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  createdByName?: string;
}
