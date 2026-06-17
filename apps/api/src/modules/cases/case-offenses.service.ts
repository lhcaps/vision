import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCaseOffenseDto } from './dto/add-case-offense.dto';
import { UpdateCaseOffenseDto } from './dto/update-case-offense.dto';

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

@Injectable()
export class CaseOffensesService {
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

    const rows = await this.prisma.case_offenses.findMany({
      where: {
        case_id: caseId,
        is_deleted: false,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const offenseIds = [
      ...new Set(rows.map((row) => row.offense_id).filter(Boolean)),
    ];
    const offenses = offenseIds.length
      ? await this.prisma.offenses.findMany({
          where: {
            id: { in: offenseIds },
          },
        })
      : [];
    const offensesById = new Map(
      offenses.map((offense) => [String(offense.id), offense]),
    );

    return rows.map((row) => {
      const offense = offensesById.get(String(row.offense_id));
      return {
        id: toPublicId(row.id),
        caseId: toPublicId(row.case_id),
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
    });
  }

  async add(caseIdRaw: string, dto: AddCaseOffenseDto) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const existingCase = await this.assertCaseExists(caseId);

    const offenseName = dto.offenseName.trim();

    let offense = await this.prisma.offenses.findFirst({
      where: {
        offense_name: offenseName,
      },
    });

    if (!offense) {
      offense = await this.prisma.offenses.create({
        data: {
          offense_code: dto.offenseCode || null,
          offense_name: offenseName,
          offense_group: dto.offenseGroup || null,
          description: dto.offenseDescription || null,
          is_active: true,
        },
      });
    }

    const personId = dto.personId
      ? parseBigIntId(dto.personId, 'personId')
      : null;

    const caseOffense = await this.prisma.case_offenses.create({
      data: {
        case_id: caseId,
        person_id: personId,
        offense_id: offense.id,
        legal_article_id: null,
        offense_description: dto.offenseDescription || null,
        is_primary: true,
        is_deleted: false,
      },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_OFFENSE_ADDED',
        event_title: 'Thêm tội danh',
        event_description: `Thêm tội danh ${offense.offense_name}`,
        stage_code: existingCase.current_stage,
        related_person_id: personId,
        created_by_name:
          existingCase.updated_by_name || existingCase.created_by_name || null,
      },
    });

    return {
      id: toPublicId(caseOffense.id),
      caseId: toPublicId(caseOffense.case_id),
      personId: toPublicId(caseOffense.person_id),
      offenseId: toPublicId(caseOffense.offense_id),
      legalArticleId: toPublicId(caseOffense.legal_article_id),
      offenseDescription: caseOffense.offense_description,
      isPrimary: caseOffense.is_primary,
      isDeleted: caseOffense.is_deleted,
      offense: {
        id: toPublicId(offense.id),
        offenseCode: offense.offense_code,
        offenseName: offense.offense_name,
        offenseGroup: offense.offense_group,
        description: offense.description,
      },
    };
  }

  async update(
    caseIdRaw: string,
    caseOffenseIdRaw: string,
    dto: UpdateCaseOffenseDto,
  ) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const caseOffenseId = parseBigIntId(caseOffenseIdRaw, 'caseOffenseId');
    await this.assertCaseExists(caseId);

    const existing = await this.prisma.case_offenses.findFirst({
      where: {
        id: caseOffenseId,
        case_id: caseId,
        is_deleted: false,
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy tội danh trong hồ sơ.');
    }

    const data: any = {};
    if (dto.offenseDescription !== undefined) {
      data.offense_description = dto.offenseDescription;
    }
    if (dto.personId !== undefined) {
      data.person_id = dto.personId
        ? parseBigIntId(dto.personId, 'personId')
        : null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    const updated = await this.prisma.case_offenses.update({
      where: { id: caseOffenseId },
      data,
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_OFFENSE_UPDATED',
        event_title: 'Cập nhật tội danh',
        event_description: `Cập nhật tội danh #${caseOffenseId}`,
        related_person_id: updated.person_id,
      },
    });

    return {
      id: toPublicId(updated.id),
      caseId: toPublicId(updated.case_id),
      personId: toPublicId(updated.person_id),
      offenseId: toPublicId(updated.offense_id),
      legalArticleId: toPublicId(updated.legal_article_id),
      offenseDescription: updated.offense_description,
      isPrimary: updated.is_primary,
      isDeleted: updated.is_deleted,
    };
  }

  async softDelete(caseIdRaw: string, caseOffenseIdRaw: string) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const caseOffenseId = parseBigIntId(caseOffenseIdRaw, 'caseOffenseId');
    await this.assertCaseExists(caseId);

    const existing = await this.prisma.case_offenses.findFirst({
      where: {
        id: caseOffenseId,
        case_id: caseId,
        is_deleted: false,
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy tội danh trong hồ sơ.');
    }

    const updated = await this.prisma.case_offenses.update({
      where: { id: caseOffenseId },
      data: { is_deleted: true },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_OFFENSE_REMOVED',
        event_title: 'Xoá tội danh',
        event_description: `Xoá mềm tội danh #${caseOffenseId}`,
      },
    });

    return {
      id: toPublicId(updated.id),
      caseId: toPublicId(updated.case_id),
      personId: toPublicId(updated.person_id),
      offenseId: toPublicId(updated.offense_id),
      isDeleted: updated.is_deleted,
    };
  }
}
