import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewGeneratedDocumentDto } from './dto/review-generated-document.dto';

function toPublicId(value: bigint | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function parseBigIntId(value: string, entityName = 'ID'): bigint {
  try {
    const parsed = BigInt(value);

    if (parsed <= 0n) {
      throw new Error('Invalid positive id');
    }

    return parsed;
  } catch {
    throw new BadRequestException(`${entityName} không hợp lệ.`);
  }
}

function mapReviewActionToStatus(action: string): string {
  switch (action) {
    case 'APPROVE':
      return 'APPROVED';
    case 'REQUEST_REVISION':
      return 'NEEDS_REVISION';
    case 'MARK_WAITING_REVIEW':
      return 'WAITING_REVIEW';
    case 'CANCEL':
      return 'CANCELLED';
    case 'FINAL_EXPORT':
      return 'FINAL_EXPORTED';
    default:
      throw new BadRequestException('Hành động duyệt biểu mẫu không hợp lệ.');
  }
}

@Injectable()
export class DocumentReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findGeneratedDocuments(query: {
    caseId?: string;
    status?: string;
    templateId?: string;
    page?: string | number;
    pageSize?: string | number;
  }) {
    const where: Record<string, unknown> = {};

    if (query.caseId) {
      where.case_id = parseBigIntId(query.caseId, 'caseId');
    }

    if (query.status) {
      where.review_status = query.status;
    }

    if (query.templateId) {
      where.template_id = parseBigIntId(query.templateId, 'templateId');
    }

    // Pagination: mặc định page=1, pageSize=50; tối đa 200 để bảo vệ memory
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize) || 50));
    const skip = (page - 1) * pageSize;

    const [documents, total] = await Promise.all([
      this.prisma.generated_documents.findMany({
        where,
        orderBy: [
          {
            generated_at: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        skip,
        take: pageSize,
      }),
      this.prisma.generated_documents.count({ where }),
    ]);

    const caseIds = [
      ...new Set(documents.map((item) => item.case_id).filter(Boolean)),
    ];

    const templateIds = [
      ...new Set(documents.map((item) => item.template_id).filter(Boolean)),
    ];

    const personIds = [
      ...new Set(
        documents
          .map((item) => item.target_person_id)
          .filter((id): id is bigint => id !== null),
      ),
    ];

    const [cases, templates, people] = await Promise.all([
      caseIds.length
        ? this.prisma.cases.findMany({
            where: {
              id: {
                in: caseIds,
              },
            },
          })
        : [],
      templateIds.length
        ? this.prisma.templates.findMany({
            where: {
              id: {
                in: templateIds,
              },
            },
          })
        : [],
      personIds.length
        ? this.prisma.people.findMany({
            where: {
              id: {
                in: personIds,
              },
            },
          })
        : [],
    ]);

    const caseById = new Map(cases.map((item) => [String(item.id), item]));
    const templateById = new Map(
      templates.map((item) => [String(item.id), item]),
    );
    const personById = new Map(people.map((item) => [String(item.id), item]));

    return {
      items: documents.map((document) => {
        const caseItem = caseById.get(String(document.case_id));
        const template = templateById.get(String(document.template_id));
        const person = document.target_person_id
          ? personById.get(String(document.target_person_id))
          : null;

        return {
          id: toPublicId(document.id),
          caseId: toPublicId(document.case_id),
          caseCode: caseItem?.case_code ?? null,
          caseTitle: caseItem?.case_title ?? null,
          templateId: toPublicId(document.template_id),
          templateCode: template?.template_code ?? null,
          templateNo: template?.template_no ?? null,
          templateName: template?.template_name ?? null,
          documentCode: document.document_code,
          documentTitle: document.document_title,
          targetScope: document.target_scope,
          targetPersonId: toPublicId(document.target_person_id),
          targetPersonName: person?.full_name ?? null,
          reviewStatus: document.review_status,
          generatedByName: document.generated_by_name,
          approvedByName: document.approved_by_name,
          generatedAt: document.generated_at,
          approvedAt: document.approved_at,
          note: document.note,
        };
      }),
      total,
      page,
      pageSize,
    };
  }

  async findGeneratedDocument(documentIdRaw: string) {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');

    const document = await this.prisma.generated_documents.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!document) {
      throw new NotFoundException('Không tìm thấy biểu mẫu đã tạo.');
    }

    const [caseItem, template, person, files, reviews] = await Promise.all([
      this.prisma.cases.findUnique({
        where: {
          id: document.case_id,
        },
      }),
      this.prisma.templates.findUnique({
        where: {
          id: document.template_id,
        },
      }),
      document.target_person_id
        ? this.prisma.people.findUnique({
            where: {
              id: document.target_person_id,
            },
          })
        : null,
      this.prisma.generated_document_files.findMany({
        where: {
          generated_document_id: document.id,
        },
        orderBy: {
          id: 'asc',
        },
      }),
      this.prisma.document_reviews.findMany({
        where: {
          generated_document_id: document.id,
        },
        orderBy: {
          reviewed_at: 'desc',
        },
      }),
    ]);

    return {
      id: toPublicId(document.id),
      batchId: toPublicId(document.batch_id),
      caseId: toPublicId(document.case_id),
      case: caseItem
        ? {
            id: toPublicId(caseItem.id),
            caseCode: caseItem.case_code,
            caseTitle: caseItem.case_title,
            currentStage: caseItem.current_stage,
            currentStatus: caseItem.current_status,
          }
        : null,
      templateId: toPublicId(document.template_id),
      template: template
        ? {
            id: toPublicId(template.id),
            templateCode: template.template_code,
            templateNo: template.template_no,
            templateName: template.template_name,
            renderScope: template.render_scope,
            outputStrategy: template.output_strategy,
          }
        : null,
      documentCode: document.document_code,
      documentTitle: document.document_title,
      targetScope: document.target_scope,
      targetPersonId: toPublicId(document.target_person_id),
      targetPerson: person
        ? {
            id: toPublicId(person.id),
            fullName: person.full_name,
            birthYear: person.birth_year,
            residenceAddress: person.residence_address,
          }
        : null,
      reviewStatus: document.review_status,
      renderPayloadSnapshot: document.render_payload_snapshot,
      validationResult: document.validation_result,
      generatedByName: document.generated_by_name,
      approvedByName: document.approved_by_name,
      generatedAt: document.generated_at,
      approvedAt: document.approved_at,
      note: document.note,
      files: files.map((file) => ({
        id: toPublicId(file.id),
        storedFileId: toPublicId(file.stored_file_id),
        fileFormat: file.file_format,
        fileName: file.file_name,
        filePath: file.file_path,
        fileSizeBytes: file.file_size_bytes
          ? String(file.file_size_bytes)
          : '0',
        checksum: file.checksum,
        isFinal: file.is_final,
        createdAt: file.created_at,
      })),
      reviews: reviews.map((review) => ({
        id: toPublicId(review.id),
        reviewAction: review.review_action,
        reviewerName: review.reviewer_name,
        reviewNote: review.review_note,
        oldStatus: review.old_status,
        newStatus: review.new_status,
        reviewedAt: review.reviewed_at,
      })),
    };
  }

  async reviewGeneratedDocument(
    documentIdRaw: string,
    dto: ReviewGeneratedDocumentDto,
  ) {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');

    const current = await this.prisma.generated_documents.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!current) {
      throw new NotFoundException('Không tìm thấy biểu mẫu đã tạo.');
    }

    const newStatus = mapReviewActionToStatus(dto.reviewAction);

    if (current.review_status === 'CANCELLED') {
      throw new BadRequestException(
        'Biểu mẫu đã hủy, không thể cập nhật duyệt.',
      );
    }

    if (
      dto.reviewAction === 'FINAL_EXPORT' &&
      current.review_status !== 'APPROVED'
    ) {
      throw new BadRequestException(
        'Chỉ có thể xuất chính thức sau khi biểu mẫu đã được duyệt.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.generated_documents.update({
        where: {
          id: current.id,
        },
        data: {
          review_status: newStatus,
          approved_by_name:
            dto.reviewAction === 'APPROVE' ||
            dto.reviewAction === 'FINAL_EXPORT'
              ? dto.reviewerName || null
              : current.approved_by_name,
          approved_at:
            dto.reviewAction === 'APPROVE' ||
            dto.reviewAction === 'FINAL_EXPORT'
              ? new Date()
              : current.approved_at,
        },
      });

      await tx.document_reviews.create({
        data: {
          generated_document_id: current.id,
          review_action: dto.reviewAction,
          reviewer_name: dto.reviewerName || null,
          review_note: dto.reviewNote || null,
          old_status: current.review_status,
          new_status: newStatus,
        },
      });

      await tx.case_events.create({
        data: {
          case_id: current.case_id,
          event_type: 'DOCUMENT_REVIEWED',
          event_title: 'Cập nhật trạng thái duyệt biểu mẫu',
          event_description: `Biểu mẫu "${current.document_title}" chuyển từ ${current.review_status} sang ${newStatus}.`,
          stage_code: null,
          status_before: current.review_status,
          status_after: newStatus,
          created_by_name: dto.reviewerName || null,
        },
      });

      return updated;
    });

    return this.findGeneratedDocument(String(result.id));
  }
}
