import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentGenerationBatchDto } from './dto/create-document-generation-batch.dto';

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

function normalizeTemplateNo(value: string | null): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableTemplates(caseIdRaw: string) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');

    const caseItem = await this.prisma.cases.findFirst({
      where: {
        id: caseId,
        is_deleted: false,
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy hồ sơ.');
    }

    const [templates, groups, casePeople] = await Promise.all([
      this.prisma.templates.findMany({
        where: {
          is_active: true,
        },
      }),
      this.prisma.template_groups.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          group_order: 'asc',
        },
      }),
      this.prisma.case_people.findMany({
        where: {
          case_id: caseId,
          is_active: true,
        },
        orderBy: [
          {
            person_order: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      }),
    ]);

    const peopleIds = casePeople.map((item) => item.person_id);

    const people = peopleIds.length
      ? await this.prisma.people.findMany({
          where: {
            id: {
              in: peopleIds,
            },
            is_deleted: false,
          },
        })
      : [];

    const peopleById = new Map(
      people.map((person) => [String(person.id), person]),
    );
    const groupById = new Map(groups.map((group) => [String(group.id), group]));

    const sortedTemplates = [...templates].sort((a, b) => {
      const diff =
        normalizeTemplateNo(a.template_no) - normalizeTemplateNo(b.template_no);
      return diff !== 0 ? diff : Number(a.id - b.id);
    });

    return {
      case: {
        id: toPublicId(caseItem.id),
        caseCode: caseItem.case_code,
        caseTitle: caseItem.case_title,
        currentStage: caseItem.current_stage,
        currentStatus: caseItem.current_status,
      },
      targets: {
        people: casePeople.map((link) => {
          const person = peopleById.get(String(link.person_id));

          return {
            casePersonId: toPublicId(link.id),
            personId: toPublicId(link.person_id),
            roleType: link.role_type,
            legalStatus: link.legal_status,
            isPrimary: link.is_primary,
            personOrder: link.person_order,
            fullName: person?.full_name ?? null,
            birthYear: person?.birth_year ?? null,
            residenceAddress: person?.residence_address ?? null,
          };
        }),
      },
      templates: sortedTemplates.map((template) => {
        const group = template.group_id
          ? groupById.get(String(template.group_id))
          : null;

        const targetMode =
          template.render_scope === 'CASE_LEVEL'
            ? 'Tạo 1 biểu mẫu cho toàn bộ hồ sơ'
            : template.render_scope === 'PERSON_LEVEL'
              ? 'Tạo biểu mẫu riêng theo từng bị can/người liên quan'
              : template.render_scope === 'SELECTED_PERSONS'
                ? 'Tạo theo người được chọn'
                : template.render_scope === 'EVIDENCE_LEVEL'
                  ? 'Tạo theo vật chứng'
                  : 'Tạo theo sự kiện nghiệp vụ';

        return {
          id: toPublicId(template.id),
          templateCode: template.template_code,
          templateNo: template.template_no,
          templateName: template.template_name,
          renderScope: template.render_scope,
          outputStrategy: template.output_strategy,
          stageCode: template.stage_code,
          defaultOutputFormats: template.default_output_formats,
          requiresReview: template.requires_review,
          targetMode,
          group: group
            ? {
                id: toPublicId(group.id),
                groupCode: group.group_code,
                groupName: group.group_name,
                groupOrder: group.group_order,
              }
            : null,
        };
      }),
    };
  }

  async buildPlan(caseIdRaw: string, dto: CreateDocumentGenerationBatchDto) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');

    const caseItem = await this.prisma.cases.findFirst({
      where: {
        id: caseId,
        is_deleted: false,
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy hồ sơ.');
    }

    const templateIds = dto.templateIds.map((id) =>
      parseBigIntId(id, 'templateId'),
    );

    const templates = await this.prisma.templates.findMany({
      where: {
        id: {
          in: templateIds,
        },
        is_active: true,
      },
    });

    if (templates.length !== templateIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều biểu mẫu không tồn tại hoặc đã bị tắt.',
      );
    }

    const requestedPersonIds = dto.targetPersonIds?.length
      ? dto.targetPersonIds.map((id) => parseBigIntId(id, 'personId'))
      : [];

    const casePeople = await this.prisma.case_people.findMany({
      where: {
        case_id: caseId,
        is_active: true,
        ...(requestedPersonIds.length
          ? {
              person_id: {
                in: requestedPersonIds,
              },
            }
          : {
              role_type: {
                in: ['ACCUSED', 'DEFENDANT'],
              },
            }),
      },
      orderBy: [
        {
          person_order: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });

    const peopleIds = casePeople.map((item) => item.person_id);

    const people = peopleIds.length
      ? await this.prisma.people.findMany({
          where: {
            id: {
              in: peopleIds,
            },
            is_deleted: false,
          },
        })
      : [];

    const peopleById = new Map(
      people.map((person) => [String(person.id), person]),
    );

    const items: any[] = [];
    const warnings: string[] = [];

    const sortedTemplates = [...templates].sort((a, b) => {
      const diff =
        normalizeTemplateNo(a.template_no) - normalizeTemplateNo(b.template_no);
      return diff !== 0 ? diff : Number(a.id - b.id);
    });

    for (const template of sortedTemplates) {
      if (template.render_scope === 'CASE_LEVEL') {
        items.push({
          templateId: toPublicId(template.id),
          templateCode: template.template_code,
          templateNo: template.template_no,
          templateName: template.template_name,
          renderScope: template.render_scope,
          outputStrategy: template.output_strategy,
          targetPersonId: null,
          targetPersonName: null,
          documentTitle: `${template.template_name} - ${caseItem.case_code}`,
        });
        continue;
      }

      if (
        template.render_scope === 'PERSON_LEVEL' ||
        template.render_scope === 'SELECTED_PERSONS'
      ) {
        if (!casePeople.length) {
          warnings.push(
            `Biểu mẫu ${template.template_code} cần bị can/người liên quan nhưng hồ sơ chưa có dữ liệu phù hợp.`,
          );
          continue;
        }

        for (const link of casePeople) {
          const person = peopleById.get(String(link.person_id));

          items.push({
            templateId: toPublicId(template.id),
            templateCode: template.template_code,
            templateNo: template.template_no,
            templateName: template.template_name,
            renderScope: template.render_scope,
            outputStrategy: template.output_strategy,
            targetPersonId: toPublicId(link.person_id),
            targetPersonName: person?.full_name ?? null,
            documentTitle: `${template.template_name} - ${person?.full_name ?? 'Người liên quan'} - ${caseItem.case_code}`,
          });
        }

        continue;
      }

      warnings.push(
        `Biểu mẫu ${template.template_code} có render_scope ${template.render_scope}; phase hiện tại chưa hỗ trợ tạo tự động.`,
      );
    }

    const ALLOWED_FORMATS = new Set(['DOCX', 'PDF']);
    const requestedFormats = dto.formats?.length
      ? dto.formats
      : ['DOCX', 'PDF'];
    const formats = requestedFormats.filter((f) =>
      ALLOWED_FORMATS.has(String(f).toUpperCase()),
    );

    if (formats.length === 0) {
      throw new BadRequestException(
        `Định dạng xuất không hợp lệ. Chỉ chấp nhận: ${[...ALLOWED_FORMATS].join(', ')}.`,
      );
    }

    return {
      case: {
        id: toPublicId(caseItem.id),
        caseCode: caseItem.case_code,
        caseTitle: caseItem.case_title,
        currentStage: caseItem.current_stage,
        currentStatus: caseItem.current_status,
      },
      formats,
      totalDocuments: items.length,
      items,
      warnings,
    };
  }

  async createBatch(caseIdRaw: string, dto: CreateDocumentGenerationBatchDto) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const plan = await this.buildPlan(caseIdRaw, dto);

    if (plan.totalDocuments === 0) {
      throw new BadRequestException('Không có biểu mẫu nào đủ điều kiện tạo.');
    }

    const caseItem = await this.prisma.cases.findFirst({
      where: {
        id: caseId,
        is_deleted: false,
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy hồ sơ.');
    }

    const batchCode = `DGB-${new Date().getFullYear()}-${Date.now()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const batch = await tx.document_generation_batches.create({
        data: {
          case_id: caseId,
          batch_code: batchCode,
          requested_formats: plan.formats as any,
          selected_templates_snapshot: dto.templateIds as any,
          target_selection_snapshot: {
            targetPersonIds: dto.targetPersonIds ?? [],
          } as any,
          status: 'PROCESSING',
          total_documents: plan.totalDocuments,
          success_documents: 0,
          failed_documents: 0,
          created_by_name: dto.createdByName || null,
        },
      });

      const createdDocuments = [];

      for (const item of plan.items) {
        const document = await tx.generated_documents.create({
          data: {
            batch_id: batch.id,
            case_id: caseId,
            template_id: parseBigIntId(item.templateId, 'templateId'),
            template_version_id: null,
            document_code: `${item.templateCode}-${Date.now()}`,
            document_title: item.documentTitle,
            target_scope: item.renderScope,
            target_person_id: item.targetPersonId
              ? parseBigIntId(item.targetPersonId, 'targetPersonId')
              : null,
            target_evidence_id: null,
            target_event_id: null,
            review_status: 'WAITING_REVIEW',
            render_payload_snapshot: {
              case: {
                id: toPublicId(caseItem.id),
                caseCode: caseItem.case_code,
                caseTitle: caseItem.case_title,
                currentStage: caseItem.current_stage,
                currentStatus: caseItem.current_status,
              },
              target: {
                personId: item.targetPersonId,
                personName: item.targetPersonName,
              },
              template: {
                id: item.templateId,
                templateCode: item.templateCode,
                templateNo: item.templateNo,
                templateName: item.templateName,
                renderScope: item.renderScope,
              },
              formats: plan.formats,
            } as any,
            validation_result: {
              status: 'NOT_RENDERED_YET',
              message:
                'Phase hiện tại mới tạo bản ghi biểu mẫu chờ duyệt, chưa render DOCX/PDF.',
            } as any,
            generated_by_name: dto.createdByName || null,
            note: dto.note || null,
          },
        });

        createdDocuments.push(document);
      }

      const updatedBatch = await tx.document_generation_batches.update({
        where: {
          id: batch.id,
        },
        data: {
          status: 'COMPLETED',
          success_documents: createdDocuments.length,
          failed_documents: 0,
          completed_at: new Date(),
        },
      });

      await tx.case_events.create({
        data: {
          case_id: caseId,
          event_type: 'DOCUMENT_BATCH_CREATED',
          event_title: 'Tạo batch biểu mẫu',
          event_description: `Tạo ${createdDocuments.length} biểu mẫu chờ duyệt từ ${dto.templateIds.length} mẫu được chọn.`,
          stage_code: caseItem.current_stage,
          status_before: null,
          status_after: caseItem.current_status,
          created_by_name: dto.createdByName || null,
        },
      });

      return {
        batch: updatedBatch,
        documents: createdDocuments,
      };
    });

    return this.findBatch(String(result.batch.id));
  }

  async findBatch(batchIdRaw: string) {
    const batchId = parseBigIntId(batchIdRaw, 'batchId');

    const batch = await this.prisma.document_generation_batches.findUnique({
      where: {
        id: batchId,
      },
    });

    if (!batch) {
      throw new NotFoundException('Không tìm thấy batch biểu mẫu.');
    }

    const documents = await this.prisma.generated_documents.findMany({
      where: {
        batch_id: batch.id,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const templateIds = documents.map((item) => item.template_id);

    const templates = templateIds.length
      ? await this.prisma.templates.findMany({
          where: {
            id: {
              in: templateIds,
            },
          },
        })
      : [];

    const templateById = new Map(
      templates.map((template) => [String(template.id), template]),
    );

    return {
      id: toPublicId(batch.id),
      batchCode: batch.batch_code,
      caseId: toPublicId(batch.case_id),
      requestedFormats: batch.requested_formats,
      selectedTemplatesSnapshot: batch.selected_templates_snapshot,
      targetSelectionSnapshot: batch.target_selection_snapshot,
      status: batch.status,
      totalDocuments: batch.total_documents,
      successDocuments: batch.success_documents,
      failedDocuments: batch.failed_documents,
      errorMessage: batch.error_message,
      createdByName: batch.created_by_name,
      createdAt: batch.created_at,
      completedAt: batch.completed_at,
      documents: documents.map((document) => {
        const template = templateById.get(String(document.template_id));

        return {
          id: toPublicId(document.id),
          templateId: toPublicId(document.template_id),
          templateCode: template?.template_code ?? null,
          templateNo: template?.template_no ?? null,
          templateName: template?.template_name ?? null,
          documentCode: document.document_code,
          documentTitle: document.document_title,
          targetScope: document.target_scope,
          targetPersonId: toPublicId(document.target_person_id),
          reviewStatus: document.review_status,
          generatedAt: document.generated_at,
          approvedAt: document.approved_at,
          note: document.note,
        };
      }),
    };
  }
}
