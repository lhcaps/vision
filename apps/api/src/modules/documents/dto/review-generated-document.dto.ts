import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const REVIEW_ACTIONS = [
  'APPROVE',
  'REQUEST_REVISION',
  'MARK_WAITING_REVIEW',
  'CANCEL',
  'FINAL_EXPORT',
] as const;

export class ReviewGeneratedDocumentDto {
  @ApiProperty({
    enum: REVIEW_ACTIONS,
    example: 'APPROVE',
    description:
      'APPROVE = duyệt, REQUEST_REVISION = yêu cầu sửa, MARK_WAITING_REVIEW = đưa lại về chờ duyệt, CANCEL = hủy, FINAL_EXPORT = đánh dấu xuất chính thức.',
  })
  @IsIn(REVIEW_ACTIONS)
  reviewAction!: string;

  @ApiPropertyOptional({
    example: 'Tên người dùng từ phiên đăng nhập',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reviewerName?: string;

  @ApiPropertyOptional({
    example: 'Biểu mẫu đã kiểm tra, nội dung đúng.',
  })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
