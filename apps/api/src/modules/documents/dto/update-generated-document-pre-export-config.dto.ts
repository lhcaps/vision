import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsObject, IsOptional, Min } from 'class-validator';

export class UpdateGeneratedDocumentPreExportConfigDto {
  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  pageSetup?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: true,
    },
  })
  @IsOptional()
  @IsArray()
  styleRules?: Array<Record<string, unknown>>;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: true,
    },
  })
  @IsOptional()
  @IsArray()
  manualBlankFields?: Array<Record<string, unknown>>;
}
