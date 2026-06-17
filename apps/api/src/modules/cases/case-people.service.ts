import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCasePersonDto } from './dto/add-case-person.dto';
import { UpdateCasePersonDto } from './dto/update-case-person.dto';

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
export class CasePeopleService {
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

    const rows = await this.prisma.case_people.findMany({
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
      ...new Set(rows.map((row) => row.person_id).filter(Boolean)),
    ];
    const people = personIds.length
      ? await this.prisma.people.findMany({
          where: {
            id: { in: personIds },
            is_deleted: false,
          },
        })
      : [];
    const peopleById = new Map(
      people.map((person) => [String(person.id), person]),
    );

    return rows.map((row) => {
      const person = peopleById.get(String(row.person_id));
      return {
        id: toPublicId(row.id),
        caseId: toPublicId(row.case_id),
        personId: toPublicId(row.person_id),
        roleType: row.role_type,
        personOrder: row.person_order,
        legalStatus: row.legal_status,
        isPrimary: row.is_primary,
        isActive: row.is_active,
        note: row.note,
        person: person ? normalizePerson(person) : null,
      };
    });
  }

  async add(caseIdRaw: string, dto: AddCasePersonDto) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const existingCase = await this.assertCaseExists(caseId);

    let personId: bigint;

    if (dto.personId) {
      personId = parseBigIntId(dto.personId, 'personId');
      const existingPerson = await this.prisma.people.findFirst({
        where: {
          id: personId,
          is_deleted: false,
        },
      });
      if (!existingPerson) {
        throw new NotFoundException('Không tìm thấy người liên quan.');
      }
    } else {
      if (!dto.fullName?.trim()) {
        throw new BadRequestException(
          'Cần truyền fullName nếu không có personId.',
        );
      }
      const createdPerson = await this.prisma.people.create({
        data: {
          full_name: dto.fullName.trim(),
          other_name: dto.otherName || null,
          gender: dto.gender || 'UNKNOWN',
          date_of_birth: toDateOnly(dto.dateOfBirth),
          birth_year: dto.birthYear || null,
          place_of_birth: dto.placeOfBirth || null,
          identity_no: dto.identityNo || null,
          occupation: dto.occupation || null,
          permanent_address: dto.permanentAddress || null,
          current_address: dto.currentAddress || null,
          residence_address: dto.residenceAddress || null,
          note: dto.note || null,
        },
      });
      personId = createdPerson.id;
    }

    const roleType = dto.roleType || 'ACCUSED';

    const existingLink = await this.prisma.case_people.findFirst({
      where: {
        case_id: caseId,
        person_id: personId,
        role_type: roleType,
      },
    });

    if (existingLink) {
      throw new BadRequestException(
        'Người này đã được gắn vào hồ sơ với vai trò tương ứng.',
      );
    }

    const currentCount = await this.prisma.case_people.count({
      where: {
        case_id: caseId,
        is_active: true,
      },
    });

    const link = await this.prisma.case_people.create({
      data: {
        case_id: caseId,
        person_id: personId,
        role_type: roleType,
        person_order: dto.personOrder || currentCount + 1,
        legal_status: dto.legalStatus || null,
        is_primary: dto.isPrimary ?? currentCount === 0,
        is_active: true,
        note: dto.note || null,
      },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_PERSON_ADDED',
        event_title: 'Thêm người liên quan/bị can',
        event_description: `Thêm người vào hồ sơ với vai trò ${roleType}`,
        stage_code: existingCase.current_stage,
        related_person_id: personId,
        created_by_name:
          existingCase.updated_by_name || existingCase.created_by_name || null,
      },
    });

    return {
      id: toPublicId(link.id),
      caseId: toPublicId(link.case_id),
      personId: toPublicId(link.person_id),
      roleType: link.role_type,
      personOrder: link.person_order,
      legalStatus: link.legal_status,
      isPrimary: link.is_primary,
      isActive: link.is_active,
      note: link.note,
    };
  }

  async update(
    caseIdRaw: string,
    casePersonIdRaw: string,
    dto: UpdateCasePersonDto,
  ) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const casePersonId = parseBigIntId(casePersonIdRaw, 'casePersonId');
    await this.assertCaseExists(caseId);

    const existing = await this.prisma.case_people.findFirst({
      where: {
        id: casePersonId,
        case_id: caseId,
        is_active: true,
      },
    });
    if (!existing) {
      throw new NotFoundException(
        'Không tìm thấy người liên quan trong hồ sơ.',
      );
    }

    const data: any = {};
    if (dto.legalStatus !== undefined) data.legal_status = dto.legalStatus;
    if (dto.personOrder !== undefined) data.person_order = dto.personOrder;
    if (dto.isPrimary !== undefined) data.is_primary = dto.isPrimary;
    if (dto.note !== undefined) data.note = dto.note;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    const updated = await this.prisma.case_people.update({
      where: { id: casePersonId },
      data,
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_PERSON_UPDATED',
        event_title: 'Cập nhật người liên quan',
        event_description: `Cập nhật thông tin người liên quan #${casePersonId}`,
        related_person_id: updated.person_id,
      },
    });

    return {
      id: toPublicId(updated.id),
      caseId: toPublicId(updated.case_id),
      personId: toPublicId(updated.person_id),
      roleType: updated.role_type,
      personOrder: updated.person_order,
      legalStatus: updated.legal_status,
      isPrimary: updated.is_primary,
      isActive: updated.is_active,
      note: updated.note,
    };
  }

  async softDelete(caseIdRaw: string, casePersonIdRaw: string) {
    const caseId = parseBigIntId(caseIdRaw, 'caseId');
    const casePersonId = parseBigIntId(casePersonIdRaw, 'casePersonId');
    await this.assertCaseExists(caseId);

    const existing = await this.prisma.case_people.findFirst({
      where: {
        id: casePersonId,
        case_id: caseId,
        is_active: true,
      },
    });
    if (!existing) {
      throw new NotFoundException(
        'Không tìm thấy người liên quan trong hồ sơ.',
      );
    }

    const updated = await this.prisma.case_people.update({
      where: { id: casePersonId },
      data: { is_active: false },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: caseId,
        event_type: 'CASE_PERSON_REMOVED',
        event_title: 'Xoá người liên quan',
        event_description: `Xoá mềm người liên quan #${casePersonId}`,
        related_person_id: updated.person_id,
      },
    });

    return {
      id: toPublicId(updated.id),
      caseId: toPublicId(updated.case_id),
      personId: toPublicId(updated.person_id),
      roleType: updated.role_type,
      personOrder: updated.person_order,
      legalStatus: updated.legal_status,
      isPrimary: updated.is_primary,
      isActive: updated.is_active,
      note: updated.note,
    };
  }
}
