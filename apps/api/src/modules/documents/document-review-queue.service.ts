import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type RawReviewQueueRow = {
  document_id: bigint;
  case_id: bigint;
  case_code: string | null;
  case_title: string | null;
  template_code: string | null;
  template_name: string | null;
  document_code: string | null;
  document_title: string | null;
  target_scope: string | null;
  target_person_id: bigint | null;
  target_person_name: string | null;
  review_status: string | null;
  generated_by_name: string | null;
  approved_by_name: string | null;
  generated_at: Date | string | null;
  approved_at: Date | string | null;
  note: string | null;

  latest_docx_file_id: bigint | null;
  latest_docx_file_name: string | null;
  latest_docx_file_size_bytes: bigint | null;
  latest_docx_is_final: boolean | number | null;
  latest_docx_created_at: Date | string | null;

  latest_pdf_file_id: bigint | null;
  latest_pdf_file_name: string | null;
  latest_pdf_file_size_bytes: bigint | null;
  latest_pdf_is_final: boolean | number | null;
  latest_pdf_created_at: Date | string | null;

  last_review_action: string | null;
  last_reviewer_name: string | null;
  last_review_note: string | null;
  last_reviewed_at: Date | string | null;
};

type CurrentDocumentStatusRow = {
  id: bigint;
  review_status: string;
};

type UpdateReviewStatusInput = {
  nextStatus?: string;
  reviewStatus?: string;
  reviewerName?: string;
  reviewNote?: string;
};

const ALLOWED_REVIEW_STATUSES = new Set([
  'DRAFT',
  'GENERATED',
  'WAITING_REVIEW',
  'APPROVED',
  'NEEDS_REVISION',
  'FINAL_EXPORTED',
  'CANCELLED',
]);

function toPublicId(value: bigint | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function formatDateTime(
  value: Date | string | null | undefined,
): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toISOString();
}

function reviewStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'DRAFT':
      return 'Bản nháp';
    case 'GENERATED':
      return 'Đã sinh biểu mẫu';
    case 'WAITING_REVIEW':
      return 'Cần phê duyệt';
    case 'APPROVED':
      return 'Đã duyệt';
    case 'NEEDS_REVISION':
      return 'Cần sửa';
    case 'FINAL_EXPORTED':
      return 'Đã xuất cuối';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return 'Chưa xác định';
  }
}

function reviewActionForStatus(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'APPROVE';
    case 'NEEDS_REVISION':
      return 'REQUEST_REVISION';
    case 'FINAL_EXPORTED':
      return 'FINAL_EXPORT';
    case 'CANCELLED':
      return 'CANCEL';
    case 'WAITING_REVIEW':
      return 'REOPEN_REVIEW';
    default:
      return 'STATUS_CHANGE';
  }
}

function fileInfo(row: RawReviewQueueRow, format: 'DOCX' | 'PDF') {
  const id =
    format === 'DOCX' ? row.latest_docx_file_id : row.latest_pdf_file_id;

  if (!id) return null;

  const fileName =
    format === 'DOCX' ? row.latest_docx_file_name : row.latest_pdf_file_name;
  const fileSizeBytes =
    format === 'DOCX'
      ? row.latest_docx_file_size_bytes
      : row.latest_pdf_file_size_bytes;
  const isFinal =
    format === 'DOCX' ? row.latest_docx_is_final : row.latest_pdf_is_final;
  const createdAt =
    format === 'DOCX' ? row.latest_docx_created_at : row.latest_pdf_created_at;

  return {
    id: toPublicId(id),
    fileFormat: format,
    fileName: fileName ?? '',
    fileSizeBytes: fileSizeBytes ? String(fileSizeBytes) : '0',
    isFinal: Boolean(isFinal),
    createdAt: formatDateTime(createdAt),
  };
}

@Injectable()
export class DocumentReviewQueueService {
  constructor(private readonly prisma: PrismaService) {}

  async listReviewQueue() {
    const rows = await this.prisma.$queryRaw<RawReviewQueueRow[]>`
      SELECT
        gd.id AS document_id,
        gd.case_id AS case_id,
        c.case_code AS case_code,
        c.case_title AS case_title,
        t.template_code AS template_code,
        t.template_name AS template_name,
        gd.document_code AS document_code,
        gd.document_title AS document_title,
        gd.target_scope AS target_scope,
        gd.target_person_id AS target_person_id,
        p.full_name AS target_person_name,
        gd.review_status AS review_status,
        gd.generated_by_name AS generated_by_name,
        gd.approved_by_name AS approved_by_name,
        gd.generated_at AS generated_at,
        gd.approved_at AS approved_at,
        gd.note AS note,

        docx.id AS latest_docx_file_id,
        docx.file_name AS latest_docx_file_name,
        docx.file_size_bytes AS latest_docx_file_size_bytes,
        docx.is_final AS latest_docx_is_final,
        docx.created_at AS latest_docx_created_at,

        pdf.id AS latest_pdf_file_id,
        pdf.file_name AS latest_pdf_file_name,
        pdf.file_size_bytes AS latest_pdf_file_size_bytes,
        pdf.is_final AS latest_pdf_is_final,
        pdf.created_at AS latest_pdf_created_at,

        last_review.review_action AS last_review_action,
        last_review.reviewer_name AS last_reviewer_name,
        last_review.review_note AS last_review_note,
        last_review.reviewed_at AS last_reviewed_at
      FROM generated_documents gd
      JOIN templates t ON t.id = gd.template_id
      JOIN cases c ON c.id = gd.case_id
      LEFT JOIN people p ON p.id = gd.target_person_id
      LEFT JOIN generated_document_files docx
        ON docx.id = (
          SELECT f.id
          FROM generated_document_files f
          WHERE f.generated_document_id = gd.id
            AND f.file_format = 'DOCX'
          ORDER BY f.is_final DESC, f.created_at DESC, f.id DESC
          LIMIT 1
        )
      LEFT JOIN generated_document_files pdf
        ON pdf.id = (
          SELECT f.id
          FROM generated_document_files f
          WHERE f.generated_document_id = gd.id
            AND f.file_format = 'PDF'
          ORDER BY f.is_final DESC, f.created_at DESC, f.id DESC
          LIMIT 1
        )
      LEFT JOIN document_reviews last_review
        ON last_review.id = (
          SELECT dr.id
          FROM document_reviews dr
          WHERE dr.generated_document_id = gd.id
          ORDER BY dr.reviewed_at DESC, dr.id DESC
          LIMIT 1
        )
      ORDER BY
        CASE gd.review_status
          WHEN 'WAITING_REVIEW' THEN 1
          WHEN 'NEEDS_REVISION' THEN 2
          WHEN 'GENERATED' THEN 3
          WHEN 'DRAFT' THEN 4
          WHEN 'APPROVED' THEN 5
          WHEN 'FINAL_EXPORTED' THEN 6
          WHEN 'CANCELLED' THEN 7
          ELSE 8
        END,
        gd.generated_at DESC,
        gd.id DESC
      LIMIT 200
    `;

    const items = rows.map((row) => {
      const latestDocxFile = fileInfo(row, 'DOCX');
      const latestPdfFile = fileInfo(row, 'PDF');

      return {
        id: toPublicId(row.document_id),
        caseId: toPublicId(row.case_id),
        caseCode: row.case_code ?? '',
        caseTitle: row.case_title ?? '',
        templateCode: row.template_code ?? '',
        templateName: row.template_name ?? '',
        documentCode: row.document_code ?? '',
        documentTitle: row.document_title ?? '',
        targetScope: row.target_scope ?? '',
        targetPersonId: toPublicId(row.target_person_id),
        targetPersonName: row.target_person_name ?? '',
        reviewStatus: row.review_status ?? 'WAITING_REVIEW',
        reviewStatusLabel: reviewStatusLabel(row.review_status),
        generatedByName: row.generated_by_name ?? '',
        approvedByName: row.approved_by_name ?? '',
        generatedAt: formatDateTime(row.generated_at),
        approvedAt: formatDateTime(row.approved_at),
        note: row.note ?? '',
        latestDocxFile,
        latestPdfFile,
        hasDocx: Boolean(latestDocxFile),
        hasPdf: Boolean(latestPdfFile),
        lastReview: row.last_review_action
          ? {
              action: row.last_review_action,
              reviewerName: row.last_reviewer_name ?? '',
              reviewNote: row.last_review_note ?? '',
              reviewedAt: formatDateTime(row.last_reviewed_at),
            }
          : null,
      };
    });

    const summary = items.reduce<Record<string, number> & { total: number }>(
      (acc, item) => {
        acc.total += 1;
        acc[item.reviewStatus] = (acc[item.reviewStatus] ?? 0) + 1;
        return acc;
      },
      { total: 0 },
    );

    return { items, summary };
  }

  async updateReviewStatus(documentId: string, input: UpdateReviewStatusInput) {
    let parsedDocumentId: bigint;

    try {
      parsedDocumentId = BigInt(documentId);
    } catch {
      throw new BadRequestException('documentId không hợp lệ.');
    }

    if (parsedDocumentId <= 0n) {
      throw new BadRequestException('documentId không hợp lệ.');
    }

    const nextStatus = (input.nextStatus ?? input.reviewStatus ?? '').trim();

    if (!ALLOWED_REVIEW_STATUSES.has(nextStatus)) {
      throw new BadRequestException('Trạng thái duyệt không hợp lệ.');
    }

    // Reviewer name: lấy từ input, fallback rỗng (audit trail dùng session user ở layer controller)
    const reviewerName = (input.reviewerName ?? '').trim();
    const reviewNote = (input.reviewNote ?? '').trim();
    const reviewAction = reviewActionForStatus(nextStatus);

    const currentRows = await this.prisma.$queryRaw<CurrentDocumentStatusRow[]>`
      SELECT id, review_status
      FROM generated_documents
      WHERE id = ${parsedDocumentId}
      LIMIT 1
    `;

    const current = currentRows[0];

    if (!current) {
      throw new NotFoundException('Không tìm thấy biểu mẫu cần duyệt.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE generated_documents
        SET
          review_status = ${nextStatus},
          approved_by_name = CASE
            WHEN ${nextStatus} = 'APPROVED' THEN ${reviewerName}
            ELSE approved_by_name
          END,
          approved_at = CASE
            WHEN ${nextStatus} = 'APPROVED' THEN CURRENT_TIMESTAMP
            ELSE approved_at
          END
        WHERE id = ${parsedDocumentId}
      `;

      await tx.$executeRaw`
        INSERT INTO document_reviews (
          generated_document_id,
          review_action,
          reviewer_name,
          review_note,
          old_status,
          new_status,
          reviewed_at
        )
        VALUES (
          ${parsedDocumentId},
          ${reviewAction},
          ${reviewerName},
          ${reviewNote},
          ${current.review_status},
          ${nextStatus},
          CURRENT_TIMESTAMP
        )
      `;
    });

    const queue = await this.listReviewQueue();
    const item = queue.items.find(
      (entry) => entry.id === String(parsedDocumentId),
    );

    return {
      item,
      summary: queue.summary,
    };
  }
}
