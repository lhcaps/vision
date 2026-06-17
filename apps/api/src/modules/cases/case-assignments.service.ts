import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCaseAssignmentDto } from './dto/add-case-assignment.dto';
import { UpdateCaseAssignmentDto } from './dto/update-case-assignment.dto';

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

@Injectable()
export class CaseAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCaseExists(caseId: bigint) {
    const existingCase = await this.prisma.cases.findFirst({
      where: {
        id: caseId,
        is_deleted: false,
      },
    });
    if (!existingCase) {
      throw new NotFoundException('Không tìm thấy hồ sơ.');
    }
    return existingCase;
  }

  async list(caseIdRaw: string) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    await this.assertCaseExists(caseId);

    const rows = await this.prisma.case_assignments.findMany({
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

    const officialIds: bigint[] = rows
      .map((row) => row.official_id)
      .filter((id): id is bigint => id !== null && id !== undefined);
    const officials = officialIds.length
      ? await this.prisma.officials.findMany({
          where: {
            id: { in: officialIds },
          },
        })
      : [];
    const officialsById = new Map(
      officials.map((official) => [String(official.id), official]),
    );

    return rows.map((row) => {
      const official = officialsById.get(String(row.official_id));
      return {
        id: toPublicId(row.id),
        caseId: toPublicId(row.case_id),
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
    });
  }

  async add(caseIdRaw: string, dto: AddCaseAssignmentDto) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const existingCase = await this.assertCaseExists(caseId);

    const officialId = dto.officialId
      ? parseBigIntId(dto.officialId, 'officialId')
      : null;

    if (officialId !== null) {
      const official = await this.prisma.officials.findFirst({
        where: {
          id: officialId,
          is_active: true,
        },
      });
      if (!official) {
        throw new NotFoundException('Không tìm thấy cán bộ được phân công.');
      }
    }

    if (!dto.assignmentRole?.trim()) {
      throw new BadRequestException('Cần truyền assignmentRole.');
    }

    const created = await this.prisma.case_assignments.create({
      data: {
        case_id: caseId,
        official_id: officialId,
        assignment_role: dto.assignmentRole.trim(),
        assigned_date: toDateOnly(dto.assignedDate),
        ended_date: toDateOnly(dto.endedDate),
        decision_no: dto.decisionNo || null,
        decision_date: toDateOnly(dto.decisionDate),
        note: dto.note || null,
        is_active: true,
      },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_ASSIGNMENT_ADDED',
        event_title: 'Phân công cán bộ',
        event_description: `Phân công ${created.assignment_role}${
          dto.officialId ? ` cho cán bộ #${dto.officialId}` : ''
        }`,
        stage_code: existingCase.current_stage,
        created_by_name:
          existingCase.updated_by_name || existingCase.created_by_name || null,
      },
    });

    return {
      id: toPublicId(created.id),
      caseId: toPublicId(created.case_id),
      officialId: toPublicId(created.official_id),
      assignmentRole: created.assignment_role,
      assignedDate: created.assigned_date,
      endedDate: created.ended_date,
      decisionNo: created.decision_no,
      decisionDate: created.decision_date,
      isActive: created.is_active,
      note: created.note,
    };
  }

  async update(
    caseIdRaw: string,
    assignmentIdRaw: string,
    dto: UpdateCaseAssignmentDto,
  ) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const assignmentId = parseBigIntId(assignmentIdRaw, 'assignmentId');
    await this.assertCaseExists(caseId);

    const existing = await this.prisma.case_assignments.findFirst({
      where: {
        id: assignmentId,
        case_id: caseId,
        is_active: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy phân công trong hồ sơ.');
    }

    const data: any = {};
    if (dto.officialId !== undefined) {
      data.official_id = dto.officialId
        ? parseBigIntId(dto.officialId, 'officialId')
        : null;
    }
    if (dto.assignmentRole !== undefined) {
      data.assignment_role = dto.assignmentRole;
    }
    if (dto.assignedDate !== undefined) {
      data.assigned_date = toDateOnly(dto.assignedDate);
    }
    if (dto.endedDate !== undefined) {
      data.ended_date = toDateOnly(dto.endedDate);
    }
    if (dto.decisionNo !== undefined) {
      data.decision_no = dto.decisionNo || null;
    }
    if (dto.decisionDate !== undefined) {
      data.decision_date = toDateOnly(dto.decisionDate);
    }
    if (dto.note !== undefined) {
      data.note = dto.note || null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    const updated = await this.prisma.case_assignments.update({
      where: { id: assignmentId },
      data,
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_ASSIGNMENT_UPDATED',
        event_title: 'Cập nhật phân công',
        event_description: `Cập nhật phân công #${assignmentId}`,
      },
    });

    return {
      id: toPublicId(updated.id),
      caseId: toPublicId(updated.case_id),
      officialId: toPublicId(updated.official_id),
      assignmentRole: updated.assignment_role,
      assignedDate: updated.assigned_date,
      endedDate: updated.ended_date,
      decisionNo: updated.decision_no,
      decisionDate: updated.decision_date,
      isActive: updated.is_active,
      note: updated.note,
    };
  }

  async softDelete(caseIdRaw: string, assignmentIdRaw: string) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const assignmentId = parseBigIntId(assignmentIdRaw, 'assignmentId');
    await this.assertCaseExists(caseId);

    const existing = await this.prisma.case_assignments.findFirst({
      where: {
        id: assignmentId,
        case_id: caseId,
        is_active: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy phân công trong hồ sơ.');
    }

    const updated = await this.prisma.case_assignments.update({
      where: { id: assignmentId },
      data: { is_active: false },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_ASSIGNMENT_REMOVED',
        event_title: 'Xoá phân công',
        event_description: `Xoá mềm phân công #${assignmentId}`,
      },
    });

    return {
      id: toPublicId(updated.id),
      caseId: toPublicId(updated.case_id),
      officialId: toPublicId(updated.official_id),
      assignmentRole: updated.assignment_role,
      isActive: updated.is_active,
    };
  }
}
