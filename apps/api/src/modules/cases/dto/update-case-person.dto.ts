import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const LEGAL_STATUSES = [
  'NOT_PROSECUTED',
  'PROSECUTED',
  'DETAINED',
  'TEMPORARY_DETENTION',
  'RESIDENCE_BAN',
  'BAIL',
  'SUSPENDED',
  'TERMINATED',
  'OTHER',
] as const;

export class UpdateCasePersonDto {
  @ApiPropertyOptional({
    enum: LEGAL_STATUSES,
  })
  @IsOptional()
  @IsIn(LEGAL_STATUSES)
  legalStatus?: string;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  personOrder?: number;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
