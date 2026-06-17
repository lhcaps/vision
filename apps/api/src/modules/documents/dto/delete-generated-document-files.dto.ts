import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class DeleteGeneratedDocumentFilesDto {
  @ApiProperty({
    example: ['29', '30'],
    description: 'Danh sách ID file trong bảng generated_document_files.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fileIds!: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Nếu true, xóa cả file vật lý trên ổ đĩa.',
  })
  @IsOptional()
  @IsBoolean()
  deletePhysical?: boolean;
}

export class CleanupGeneratedDocumentFilesDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Giữ lại DOCX mới nhất.',
  })
  @IsOptional()
  @IsBoolean()
  keepLatestDocx?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Giữ lại PDF mới nhất.',
  })
  @IsOptional()
  @IsBoolean()
  keepLatestPdf?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Nếu true, xóa cả file vật lý trên ổ đĩa.',
  })
  @IsOptional()
  @IsBoolean()
  deletePhysical?: boolean;
}
