import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddEvidenceDto } from './dto/add-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';

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
export class EvidenceService {
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

    const rows = await this.prisma.evidence_items.findMany({
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

    const ownerIds: bigint[] = rows
      .map((row) => row.owner_person_id)
      .filter((id): id is bigint => id !== null && id !== undefined);
    const owners = ownerIds.length
      ? await this.prisma.people.findMany({
          where: {
            id: { in: ownerIds },
          },
        })
      : [];
    const ownersById = new Map(owners.map((p) => [String(p.id), p]));

    return rows.map((row) => {
      const owner = ownersById.get(String(row.owner_person_id));
      return {
        id: toPublicId(row.id),
        caseId: toPublicId(row.case_id),
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
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        owner: owner
          ? {
              id: toPublicId(owner.id),
              fullName: owner.full_name,
            }
          : null,
      };
    });
  }

  async add(caseIdRaw: string, dto: AddEvidenceDto) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const existingCase = await this.assertCaseExists(caseId);

    const ownerPersonId = dto.ownerPersonId
      ? parseBigIntId(dto.ownerPersonId, 'ownerPersonId')
      : null;

    if (ownerPersonId !== null) {
      const owner = await this.prisma.people.findFirst({
        where: {
          id: ownerPersonId,
          is_deleted: false,
        },
      });
      if (!owner) {
        throw new NotFoundException('Không tìm thấy người giữ tang vật.');
      }
    }

    if (!dto.evidenceName?.trim()) {
      throw new BadRequestException('Cần truyền evidenceName.');
    }

    const created = await this.prisma.evidence_items.create({
      data: {
        case_id: caseId,
        evidence_code: dto.evidenceCode || null,
        evidence_name: dto.evidenceName.trim(),
        evidence_type: dto.evidenceType || null,
        quantity: dto.quantity || null,
        unit: dto.unit || null,
        description: dto.description || null,
        current_status: dto.currentStatus || 'RECORDED',
        storage_location: dto.storageLocation || null,
        owner_person_id: ownerPersonId,
        is_deleted: false,
      },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'EVIDENCE_ADDED',
        event_title: 'Thêm tang vật/vật chứng',
        event_description: `Thêm tang vật ${created.evidence_name}`,
        stage_code: existingCase.current_stage,
        created_by_name:
          existingCase.updated_by_name || existingCase.created_by_name || null,
      },
    });

    return {
      id: toPublicId(created.id),
      caseId: toPublicId(created.case_id),
      evidenceCode: created.evidence_code,
      evidenceName: created.evidence_name,
      evidenceType: created.evidence_type,
      quantity: created.quantity,
      unit: created.unit,
      description: created.description,
      currentStatus: created.current_status,
      storageLocation: created.storage_location,
      ownerPersonId: toPublicId(created.owner_person_id),
      isDeleted: created.is_deleted,
    };
  }

  async update(
    caseIdRaw: string,
    evidenceIdRaw: string,
    dto: UpdateEvidenceDto,
  ) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const evidenceId = parseBigIntId(evidenceIdRaw, 'evidenceId');
    await this.assertCaseExists(caseId);

    const existing = await this.prisma.evidence_items.findFirst({
      where: {
        id: evidenceId,
        case_id: caseId,
        is_deleted: false,
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy tang vật trong hồ sơ.');
    }

    const data: any = {};
    if (dto.evidenceCode !== undefined)
      data.evidence_code = dto.evidenceCode || null;
    if (dto.evidenceName !== undefined) data.evidence_name = dto.evidenceName;
    if (dto.evidenceType !== undefined)
      data.evidence_type = dto.evidenceType || null;
    if (dto.quantity !== undefined) data.quantity = dto.quantity || null;
    if (dto.unit !== undefined) data.unit = dto.unit || null;
    if (dto.description !== undefined)
      data.description = dto.description || null;
    if (dto.currentStatus !== undefined)
      data.current_status = dto.currentStatus;
    if (dto.storageLocation !== undefined)
      data.storage_location = dto.storageLocation || null;
    if (dto.ownerPersonId !== undefined) {
      data.owner_person_id = dto.ownerPersonId
        ? parseBigIntId(dto.ownerPersonId, 'ownerPersonId')
        : null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    const updated = await this.prisma.evidence_items.update({
      where: { id: evidenceId },
      data,
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'EVIDENCE_UPDATED',
        event_title: 'Cập nhật tang vật',
        event_description: `Cập nhật tang vật #${evidenceId}`,
      },
    });

    return {
      id: toPublicId(updated.id),
      caseId: toPublicId(updated.case_id),
      evidenceCode: updated.evidence_code,
      evidenceName: updated.evidence_name,
      evidenceType: updated.evidence_type,
      quantity: updated.quantity,
      unit: updated.unit,
      description: updated.description,
      currentStatus: updated.current_status,
      storageLocation: updated.storage_location,
      ownerPersonId: toPublicId(updated.owner_person_id),
      isDeleted: updated.is_deleted,
    };
  }

  async softDelete(caseIdRaw: string, evidenceIdRaw: string) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const evidenceId = parseBigIntId(evidenceIdRaw, 'evidenceId');
    await this.assertCaseExists(caseId);

    const existing = await this.prisma.evidence_items.findFirst({
      where: {
        id: evidenceId,
        case_id: caseId,
        is_deleted: false,
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy tang vật trong hồ sơ.');
    }

    const updated = await this.prisma.evidence_items.update({
      where: { id: evidenceId },
      data: { is_deleted: true },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'EVIDENCE_REMOVED',
        event_title: 'Xoá tang vật',
        event_description: `Xoá mềm tang vật #${evidenceId}`,
      },
    });

    return {
      id: toPublicId(updated.id),
      caseId: toPublicId(updated.case_id),
      evidenceName: updated.evidence_name,
      isDeleted: updated.is_deleted,
    };
  }
}
