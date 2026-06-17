import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddEvidenceDto {
  @ApiProperty({
    example: 'Tang vật 1 - Dao nhọn',
  })
  @IsString()
  @MaxLength(500)
  evidenceName!: string;

  @ApiPropertyOptional({
    example: 'VT-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  evidenceCode?: string;

  @ApiPropertyOptional({
    example: 'WEAPON',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  evidenceType?: string;

  @ApiPropertyOptional({
    example: '1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  quantity?: string;

  @ApiPropertyOptional({
    example: 'chiếc',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: 'RECORDED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  currentStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  storageLocation?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'ID người giữ/liên quan (people.id).',
  })
  @IsOptional()
  @IsString()
  ownerPersonId?: string;

  @ApiPropertyOptional({
    example: '2026-01-20',
  })
  @IsOptional()
  @IsDateString()
  collectedDate?: string;
}
