import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import {
  buildCaseReportSummary,
  type CaseReportPeriod,
} from './case-report-summary';

type FindCasesQuery = {
  q?: string;
  stage?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

type CaseReportSummaryQuery = {
  period?: string;
  anchorDate?: string;
};

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

function toDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeCase(item: any) {
  return {
    id: toPublicId(item.id),
    caseCode: item.case_code,
    nationalCaseCode: item.national_case_code,
    caseTitle: item.case_title,
    caseSummary: item.case_summary,
    caseType: item.case_type,
    sourceType: item.source_type,
    currentStage: item.current_stage,
    currentStatus: item.current_status,
    wardId: toPublicId(item.ward_id),
    agencyId: toPublicId(item.agency_id),
    receivedDate: item.received_date,
    acceptedDate: item.accepted_date,
    prosecutedDate: item.prosecuted_date,
    closedDate: item.closed_date,
    priority: item.priority,
    note: item.note,
    createdByName: item.created_by_name,
    updatedByName: item.updated_by_name,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function normalizePerson(item: any) {
  return {
    id: toPublicId(item.id),
    fullName: item.full_name,
    otherName: item.other_name,
    gender: item.gender,
    dateOfBirth: item.date_of_birth,
    birthYear: item.birth_year,
    placeOfBirth: item.place_of_birth,
    identityNo: item.identity_no,
    identityIssuedDate: item.identity_issued_date,
    identityIssuedPlace: item.identity_issued_place,
    nationality: item.nationality,
    ethnicity: item.ethnicity,
    religion: item.religion,
    occupation: item.occupation,
    workplace: item.workplace,
    permanentAddress: item.permanent_address,
    currentAddress: item.current_address,
    residenceAddress: item.residence_address,
    phone: item.phone,
    note: item.note,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindCasesQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || 20)));

    const andConditions: any[] = [
      {
        is_deleted: false,
      },
    ];

    if (query.stage) {
      andConditions.push({
        current_stage: query.stage,
      });
    }

    if (query.status) {
      andConditions.push({
        current_status: query.status,
      });
    }

    if (query.q?.trim()) {
      const keyword = query.q.trim();

      andConditions.push({
        OR: [
          {
            case_code: {
              contains: keyword,
            },
          },
          {
            national_case_code: {
              contains: keyword,
            },
          },
          {
            case_title: {
              contains: keyword,
            },
          },
          {
            case_summary: {
              contains: keyword,
            },
          },
        ],
      });
    }

    const where = {
      AND: andConditions,
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.cases.count({
        where,
      }),
      this.prisma.cases.findMany({
        where,
        orderBy: [
          {
            created_at: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map(normalizeCase),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getReportSummary(query: CaseReportSummaryQuery) {
    const period: CaseReportPeriod = query.period === 'WEEK' ? 'WEEK' : 'MONTH';

    const rows = await this.prisma.cases.findMany({
      where: {
        is_deleted: false,
      },
      include: {
        wards: true,
        case_offenses: {
          include: {
            offenses: true,
          },
        },
      },
      orderBy: [
        {
          received_date: 'desc',
        },
        {
          created_at: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    return buildCaseReportSummary(
      rows.map((row) => ({
        id: String(row.id),
        receivedDate: row.received_date,
        createdAt: row.created_at,
        wardName: row.wards?.ward_name ?? null,
        offenseNames: row.case_offenses
          .map((caseOffense) => caseOffense.offenses?.offense_name)
          .filter((name): name is string => Boolean(name)),
      })),
      {
        period,
        anchorDate: query.anchorDate,
      },
    );
  }

  async create(dto: CreateCaseDto) {
    const caseCode =
      dto.caseCode?.trim() || `VKS-${new Date().getFullYear()}-${Date.now()}`;

    const created = await this.prisma.cases.create({
      data: {
        case_code: caseCode,
        national_case_code: dto.nationalCaseCode || null,
        case_title: dto.caseTitle,
        case_summary: dto.caseSummary || null,
        case_type: dto.caseType || 'CRIMINAL_CASE',
        source_type: dto.sourceType || null,
        current_stage: dto.currentStage || 'RECEPTION',
        current_status: dto.currentStatus || 'DRAFT',
        ward_id: dto.wardId ? parseBigIntId(dto.wardId, 'wardId') : null,
        agency_id: dto.agencyId
          ? parseBigIntId(dto.agencyId, 'agencyId')
          : null,
        received_date: toDateOnly(dto.receivedDate),
        priority: dto.priority || 'NORMAL',
        note: dto.note || null,
        created_by_name: dto.createdByName || null,
        updated_by_name: dto.createdByName || null,
      },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: created.id,
        event_type: 'CASE_CREATED',
        event_title: 'Tạo hồ sơ',
        event_description: `Tạo hồ sơ ${created.case_code}`,
        stage_code: created.current_stage,
        status_after: created.current_status,
        created_by_name: dto.createdByName || null,
      },
    });

    return this.findOne(String(created.id));
  }

  async findOne(id: string) {
    const caseId = parseBigIntId(id, 'caseId');

    const item = await this.prisma.cases.findFirst({
      where: {
        id: caseId,
        is_deleted: false,
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy hồ sơ.');
    }

    const casePeople = await this.prisma.case_people.findMany({
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
    });

    const personIds = [
      ...new Set(casePeople.map((row) => row.person_id).filter(Boolean)),
    ];

    const people = personIds.length
      ? await this.prisma.people.findMany({
          where: {
            id: {
              in: personIds,
            },
            is_deleted: false,
          },
        })
      : [];

    const peopleById = new Map(
      people.map((person) => [String(person.id), person]),
    );

    const caseOffenses = await this.prisma.case_offenses.findMany({
      where: {
        case_id: caseId,
        is_deleted: false,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const offenseIds = [
      ...new Set(caseOffenses.map((row) => row.offense_id).filter(Boolean)),
    ];

    const offenses = offenseIds.length
      ? await this.prisma.offenses.findMany({
          where: {
            id: {
              in: offenseIds,
            },
          },
        })
      : [];

    const offensesById = new Map(
      offenses.map((offense) => [String(offense.id), offense]),
    );

    const caseAssignments = await this.prisma.case_assignments.findMany({
      where: {
        case_id: caseId,
        is_active: true,
      },
      orderBy: [
        {
          assigned_date: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    const assignmentOfficialIds: bigint[] = caseAssignments
      .map((row) => row.official_id)
      .filter((id): id is bigint => id !== null && id !== undefined);
    const assignmentOfficials = assignmentOfficialIds.length
      ? await this.prisma.officials.findMany({
          where: {
            id: { in: assignmentOfficialIds },
          },
        })
      : [];
    const officialsById = new Map(
      assignmentOfficials.map((official) => [String(official.id), official]),
    );

    const evidenceItems = await this.prisma.evidence_items.findMany({
      where: {
        case_id: caseId,
        is_deleted: false,
      },
      orderBy: [
        {
          created_at: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    const evidenceOwnerIds: bigint[] = evidenceItems
      .map((row) => row.owner_person_id)
      .filter((id): id is bigint => id !== null && id !== undefined);
    const evidenceOwners = evidenceOwnerIds.length
      ? await this.prisma.people.findMany({
          where: {
            id: { in: evidenceOwnerIds },
          },
        })
      : [];
    const evidenceOwnersById = new Map(
      evidenceOwners.map((p) => [String(p.id), p]),
    );

    const generatedDocuments = await this.prisma.generated_documents.findMany({
      where: {
        case_id: caseId,
      },
      orderBy: {
        generated_at: 'desc',
      },
      take: 20,
    });

    const events = await this.prisma.case_events.findMany({
      where: {
        case_id: caseId,
      },
      orderBy: {
        event_date: 'desc',
      },
      take: 50,
    });

    return {
      ...normalizeCase(item),
      people: casePeople.map((row) => {
        const person = peopleById.get(String(row.person_id));

        return {
          id: toPublicId(row.id),
          personId: toPublicId(row.person_id),
          roleType: row.role_type,
          personOrder: row.person_order,
          legalStatus: row.legal_status,
          isPrimary: row.is_primary,
          isActive: row.is_active,
          note: row.note,
          person: person ? normalizePerson(person) : null,
        };
      }),
      offenses: caseOffenses.map((row) => {
        const offense = offensesById.get(String(row.offense_id));

        return {
          id: toPublicId(row.id),
          personId: toPublicId(row.person_id),
          offenseId: toPublicId(row.offense_id),
          legalArticleId: toPublicId(row.legal_article_id),
          offenseDescription: row.offense_description,
          isPrimary: row.is_primary,
          isDeleted: row.is_deleted,
          offense: offense
            ? {
                id: toPublicId(offense.id),
                offenseCode: offense.offense_code,
                offenseName: offense.offense_name,
                offenseGroup: offense.offense_group,
                description: offense.description,
                isActive: offense.is_active,
              }
            : null,
        };
      }),
      assignments: caseAssignments.map((row) => {
        const official = officialsById.get(String(row.official_id));
        return {
          id: toPublicId(row.id),
          officialId: toPublicId(row.official_id),
          assignmentRole: row.assignment_role,
          assignedDate: row.assigned_date,
          endedDate: row.ended_date,
          decisionNo: row.decision_no,
          decisionDate: row.decision_date,
          isActive: row.is_active,
          note: row.note,
          official: official
            ? {
                id: toPublicId(official.id),
                fullName: official.full_name,
                positionTitle: official.position_title,
                rankTitle: official.rank_title,
              }
            : null,
        };
      }),
      evidence: evidenceItems.map((row) => {
        const owner = evidenceOwnersById.get(String(row.owner_person_id));
        return {
          id: toPublicId(row.id),
          evidenceCode: row.evidence_code,
          evidenceName: row.evidence_name,
          evidenceType: row.evidence_type,
          quantity: row.quantity,
          unit: row.unit,
          description: row.description,
          currentStatus: row.current_status,
          storageLocation: row.storage_location,
          ownerPersonId: toPublicId(row.owner_person_id),
          isDeleted: row.is_deleted,
          owner: owner
            ? {
                id: toPublicId(owner.id),
                fullName: owner.full_name,
              }
            : null,
        };
      }),
      recentGeneratedDocuments: generatedDocuments.map((document) => ({
        id: toPublicId(document.id),
        templateId: toPublicId(document.template_id),
        documentCode: document.document_code,
        documentTitle: document.document_title,
        targetScope: document.target_scope,
        targetPersonId: toPublicId(document.target_person_id),
        reviewStatus: document.review_status,
        generatedAt: document.generated_at,
        approvedAt: document.approved_at,
      })),
      events: events.map((event) => ({
        id: toPublicId(event.id),
        eventType: event.event_type,
        eventTitle: event.event_title,
        eventDescription: event.event_description,
        stageCode: event.stage_code,
        statusBefore: event.status_before,
        statusAfter: event.status_after,
        eventDate: event.event_date,
        relatedPersonId: toPublicId(event.related_person_id),
        createdByName: event.created_by_name,
      })),
    };
  }

  async update(id: string, dto: UpdateCaseDto) {
    const caseId = parseBigIntId(id, 'caseId');

    const current = await this.prisma.cases.findFirst({
      where: {
        id: caseId,
        is_deleted: false,
      },
    });

    if (!current) {
      throw new NotFoundException('Không tìm thấy hồ sơ.');
    }

    const data: any = {};

    if (dto.nationalCaseCode !== undefined)
      data.national_case_code = dto.nationalCaseCode || null;
    if (dto.caseTitle !== undefined) data.case_title = dto.caseTitle;
    if (dto.caseSummary !== undefined)
      data.case_summary = dto.caseSummary || null;
    if (dto.caseType !== undefined) data.case_type = dto.caseType;
    if (dto.sourceType !== undefined) data.source_type = dto.sourceType || null;
    if (dto.currentStage !== undefined) data.current_stage = dto.currentStage;
    if (dto.currentStatus !== undefined)
      data.current_status = dto.currentStatus;
    if (dto.receivedDate !== undefined)
      data.received_date = toDateOnly(dto.receivedDate);
    if (dto.acceptedDate !== undefined)
      data.accepted_date = toDateOnly(dto.acceptedDate);
    if (dto.prosecutedDate !== undefined)
      data.prosecuted_date = toDateOnly(dto.prosecutedDate);
    if (dto.closedDate !== undefined)
      data.closed_date = toDateOnly(dto.closedDate);
    if (dto.wardId !== undefined)
      data.ward_id = dto.wardId ? parseBigIntId(dto.wardId, 'wardId') : null;
    if (dto.agencyId !== undefined)
      data.agency_id = dto.agencyId
        ? parseBigIntId(dto.agencyId, 'agencyId')
        : null;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.note !== undefined) data.note = dto.note || null;
    if (dto.updatedByName !== undefined)
      data.updated_by_name = dto.updatedByName || null;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    const updated = await this.prisma.cases.update({
      where: {
        id: caseId,
      },
      data,
    });

    if (
      current.current_stage !== updated.current_stage ||
      current.current_status !== updated.current_status
    ) {
      await this.prisma.case_events.create({
        data: {
          case_id: caseId,
          event_type: 'CASE_STATUS_CHANGED',
          event_title: 'Cập nhật trạng thái/giai đoạn hồ sơ',
          event_description: `Cập nhật từ ${current.current_stage}/${current.current_status} sang ${updated.current_stage}/${updated.current_status}`,
          stage_code: updated.current_stage,
          status_before: current.current_status,
          status_after: updated.current_status,
          created_by_name: dto.updatedByName || null,
        },
      });
    }

    return this.findOne(id);
  }
}
