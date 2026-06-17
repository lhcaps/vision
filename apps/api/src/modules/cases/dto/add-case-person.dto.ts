import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const ROLE_TYPES = [
  'ACCUSED',
  'DEFENDANT',
  'VICTIM',
  'REPORTER',
  'WITNESS',
  'RELATED_PERSON',
  'GUARANTOR',
  'LEGAL_REPRESENTATIVE',
  'OTHER',
] as const;

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

const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const;

export class AddCasePersonDto {
  @ApiPropertyOptional({
    example: '1',
    description:
      'Nếu người đã tồn tại, truyền personId. Nếu không, truyền fullName để tạo mới.',
  })
  @IsOptional()
  @IsString()
  personId?: string;

  @ApiPropertyOptional({
    example: '',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  otherName?: string;

  @ApiPropertyOptional({
    enum: GENDERS,
    example: 'MALE',
  })
  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @ApiPropertyOptional({
    example: '1998-01-20',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 1998,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  birthYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identityNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  residenceAddress?: string;

  @ApiPropertyOptional({
    enum: ROLE_TYPES,
    example: 'ACCUSED',
  })
  @IsOptional()
  @IsIn(ROLE_TYPES)
  roleType?: string;

  @ApiPropertyOptional({
    enum: LEGAL_STATUSES,
    example: 'NOT_PROSECUTED',
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
  note?: string;
}
