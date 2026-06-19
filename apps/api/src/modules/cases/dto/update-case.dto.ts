import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateCaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationalCaseCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caseTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseSummary?: string;

  @ApiPropertyOptional({
    enum: CASE_TYPES,
  })
  @IsOptional()
  @IsIn(CASE_TYPES)
  caseType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceType?: string;

  @ApiPropertyOptional({
    enum: CASE_STAGES,
  })
  @IsOptional()
  @IsIn(CASE_STAGES)
  currentStage?: string;

  @ApiPropertyOptional({
    enum: CASE_STATUSES,
  })
  @IsOptional()
  @IsIn(CASE_STATUSES)
  currentStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  acceptedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  prosecutedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({
    enum: PRIORITIES,
  })
  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  updatedByName?: string;
}
