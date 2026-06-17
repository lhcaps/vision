import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { PrismaService } from "../../prisma/prisma.service";
import { RenderGeneratedDocumentDto } from "./dto/render-generated-document.dto";
import { UpdateGeneratedDocumentFormInputsDto } from "./dto/update-generated-document-form-inputs.dto";

function toPublicId(value: bigint | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function parseBigIntId(value: string, entityName = "ID"): bigint {
  try {
    const parsed = BigInt(value);

    if (parsed <= 0n) {
      throw new Error("Invalid positive id");
    }

    return parsed;
  } catch {
    throw new BadRequestException(
      `${entityName} không hợp lệ.`,
    );
  }
}

function safeFileName(value: string): string {
  const normalized = String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (normalized || "unknown").slice(0, 180);
}

function buildTimestampForFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  const datePart = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("");

  const timePart = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");

  return `${datePart}-${timePart}`;
}

function formatRenderNo(value: number): string {
  return `v${String(value).padStart(3, "0")}`;
}
function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00.000Z`)
        : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());

  return `${day}/${month}/${year}`;
}

function dateParts(value: Date | string | null | undefined) {
  if (!value) {
    return {
      full: null,
      day: null,
      month: null,
      year: null,
    };
  }

  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00.000Z`)
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      full: null,
      day: null,
      month: null,
      year: null,
    };
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());

  return {
    full: `${day}/${month}/${year}`,
    day,
    month,
    year,
  };
}

function genderLabel(value: string | null | undefined): string | null {
  switch (value) {
    case "MALE":
      return "Nam";
    case "FEMALE":
      return "Nữ";
    case "OTHER":
      return "Khác";
    case "UNKNOWN":
      return "";
    default:
      return value ?? null;
  }
}

function asObject(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, any>;
}

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function resolveTemplateValue(scope: unknown, tag: string): unknown {
  const normalizedTag = tag.trim();

  if (!normalizedTag) return null;
  if (normalizedTag === ".") return scope;

  const parts = normalizedTag.split(".").filter(Boolean);
  let current: any = scope;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(Object(current), part)) {
      current = current[part];
      continue;
    }

    return null;
  }

  return current ?? null;
}
@Injectable()
export class DocumentRendererService {
  private static readonly renderLocks = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  async updateFormInputs(
    documentIdRaw: string,
    dto: UpdateGeneratedDocumentFormInputsDto,
  ) {
    const documentId = parseBigIntId(documentIdRaw, "documentId");

    const generatedDocument = await this.prisma.generated_documents.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!generatedDocument) {
      throw new NotFoundException(
        "Không tìm thấy biểu mẫu đã tạo.",
      );
    }

    const currentSnapshot = asObject(generatedDocument.render_payload_snapshot);
    const currentFormInputs = asObject(currentSnapshot.formInputs);

    const bm001FormInputsDto = dto as UpdateGeneratedDocumentFormInputsDto & {
      reception?: Record<string, unknown>;
      receiver?: Record<string, unknown>;
      informant?: Record<string, unknown>;
      crimeReport?: Record<string, unknown>;
    };

    const bm156FormInputsDto = dto as UpdateGeneratedDocumentFormInputsDto & {
      legalBasis?: Record<string, unknown>;
      caseJoinder?: Record<string, unknown>;
      caseRecovery?: Record<string, unknown>;
      investigationConclusion?: Record<string, unknown>;
      indictment?: Record<string, unknown>;
      attachments?: Record<string, unknown>;
    };

    const bm103FormInputsDto = dto as UpdateGeneratedDocumentFormInputsDto & {
      investigationExtension?: Record<string, unknown>;
      proposal?: Record<string, unknown>;
    };

    
    const bm144FormInputsDto = dto as UpdateGeneratedDocumentFormInputsDto & {
      prosecutionExtension?: Record<string, unknown>;
    };

    const bm141FormInputsDto = dto as UpdateGeneratedDocumentFormInputsDto & {
      prosecutionTransfer?: Record<string, unknown>;
    };

    const bm054FormInputsDto = dto as UpdateGeneratedDocumentFormInputsDto & {
      notification?: Record<string, unknown>;
    };

const nextFormInputs = {
      ...currentFormInputs,
      ...(dto.agency ? { agency: dto.agency } : {}),
      ...(dto.official ? { official: dto.official } : {}),
      ...(dto.document ? { document: dto.document } : {}),
      ...(dto.caseDecision ? { caseDecision: dto.caseDecision } : {}),
      ...(dto.accusedDecision ? { accusedDecision: dto.accusedDecision } : {}),
      ...(dto.offense ? { offense: dto.offense } : {}),
      ...(dto.person ? { person: dto.person } : {}),
      ...(dto.measure ? { measure: dto.measure } : {}),
      ...(dto.monitoring ? { monitoring: dto.monitoring } : {}),
      ...(dto.assignment ? { assignment: dto.assignment } : {}),
      ...(dto.legalBasis ? { legalBasis: dto.legalBasis } : {}),
      ...((dto as any).investigationRecovery
        ? { investigationRecovery: (dto as any).investigationRecovery }
        : {}),
      ...(bm103FormInputsDto.investigationExtension
        ? { investigationExtension: bm103FormInputsDto.investigationExtension }
        : {}),
      ...(bm103FormInputsDto.proposal
        ? { proposal: bm103FormInputsDto.proposal }
        : {}),
      ...(bm141FormInputsDto.prosecutionTransfer
        ? { prosecutionTransfer: bm141FormInputsDto.prosecutionTransfer }
        : {}),
      ...(bm144FormInputsDto.prosecutionExtension
        ? { prosecutionExtension: bm144FormInputsDto.prosecutionExtension }
        : {}),
      ...((dto as any).prosecutionSupplementReturn
        ? { prosecutionSupplementReturn: (dto as any).prosecutionSupplementReturn }
        : {}),
      ...(dto.recipients ? { recipients: dto.recipients } : {}),
      ...(dto.signature ? { signature: dto.signature } : {}),
      ...(dto.delivery ? { delivery: dto.delivery } : {}),
      ...(bm054FormInputsDto.notification
        ? { notification: bm054FormInputsDto.notification }
        : {}),
      ...(bm001FormInputsDto.reception
        ? { reception: bm001FormInputsDto.reception }
        : {}),
      ...(bm001FormInputsDto.receiver
        ? { receiver: bm001FormInputsDto.receiver }
        : {}),
      ...(bm001FormInputsDto.informant
        ? { informant: bm001FormInputsDto.informant }
        : {}),
      ...(bm001FormInputsDto.crimeReport
        ? { crimeReport: bm001FormInputsDto.crimeReport }
        : {}),
      ...(bm156FormInputsDto.legalBasis
        ? { legalBasis: bm156FormInputsDto.legalBasis }
        : {}),
      ...(bm156FormInputsDto.caseJoinder
        ? { caseJoinder: bm156FormInputsDto.caseJoinder }
        : {}),
      ...(bm156FormInputsDto.caseRecovery
        ? { caseRecovery: bm156FormInputsDto.caseRecovery }
        : {}),
      ...(bm156FormInputsDto.investigationConclusion
        ? { investigationConclusion: bm156FormInputsDto.investigationConclusion }
        : {}),
      ...(bm156FormInputsDto.indictment
        ? { indictment: bm156FormInputsDto.indictment }
        : {}),
      ...(bm156FormInputsDto.attachments
        ? { attachments: bm156FormInputsDto.attachments }
        : {}),
    };
    const nextSnapshot = {
      ...currentSnapshot,
      formInputs: nextFormInputs,
      formInputsUpdatedAt: new Date().toISOString(),
      formInputsUpdatedByName: dto.updatedByName ?? null,
    };

    await this.prisma.generated_documents.update({
      where: {
        id: generatedDocument.id,
      },
      data: {
        render_payload_snapshot: nextSnapshot as any,
        validation_result: {
          status: "FORM_INPUTS_UPDATED",
          message:
            "Đã cập nhật dữ liệu riêng của biểu mẫu. Cần render lại DOCX để áp dụng.",
          updatedAt: new Date().toISOString(),
          updatedByName: dto.updatedByName ?? null,
        } as any,
      },
    });

    await this.prisma.case_events.create({
      data: {
        case_id: generatedDocument.case_id,
        event_type: "DOCUMENT_FORM_INPUTS_UPDATED",
        event_title:
          "Cập nhật dữ liệu biểu mẫu",
        event_description: `Cập nhật dữ liệu riêng cho biểu mẫu "${generatedDocument.document_title}".`,
        status_before: generatedDocument.review_status,
        status_after: generatedDocument.review_status,
        created_by_name: dto.updatedByName ?? null,
      },
    });

    return this.getRenderPayload(documentIdRaw);
  }

  async getRenderPayload(documentIdRaw: string) {
    const documentId = parseBigIntId(documentIdRaw, "documentId");

    const generatedDocument = await this.prisma.generated_documents.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!generatedDocument) {
      throw new NotFoundException(
        "Không tìm thấy biểu mẫu đã tạo.",
      );
    }

    const [caseItem, template, targetPerson] = await Promise.all([
      this.prisma.cases.findUnique({
        where: {
          id: generatedDocument.case_id,
        },
      }),
      this.prisma.templates.findUnique({
        where: {
          id: generatedDocument.template_id,
        },
      }),
      generatedDocument.target_person_id
        ? this.prisma.people.findUnique({
            where: {
              id: generatedDocument.target_person_id,
            },
          })
        : null,
    ]);

    if (!caseItem) {
      throw new NotFoundException(
        "Không tìm thấy hồ sơ của biểu mẫu.",
      );
    }

    if (!template) {
      throw new NotFoundException(
        "Không tìm thấy template của biểu mẫu.",
      );
    }

    const snapshot = asObject(generatedDocument.render_payload_snapshot);
    const formInputs = asObject(snapshot.formInputs);

    const agencyInput = asObject(formInputs.agency);
    const officialInput = asObject(formInputs.official);
    const documentInput = asObject(formInputs.document);
    const caseDecisionInput = asObject(formInputs.caseDecision);
    const accusedDecisionInput = asObject(formInputs.accusedDecision);
    const offenseInput = asObject(formInputs.offense);
    const personInput = asObject(formInputs.person);
    const measureInput = asObject(formInputs.measure);
    const monitoringInput = asObject(formInputs.monitoring);
    const assignmentInput = asObject(formInputs.assignment);
    const recipientsInput = asObject(formInputs.recipients);
    const signatureInput = asObject(formInputs.signature);
    const deliveryInput = asObject(formInputs.delivery);
    const legalBasisInput = asObject(formInputs.legalBasis);
    const investigationRecoveryInput = asObject(formInputs.investigationRecovery);
    const investigationExtensionInput = asObject(formInputs.investigationExtension);
    const proposalInput = asObject(formInputs.proposal);
    const approvalInput = asObject(formInputs.approval);
    const investigationInput = asObject(formInputs.investigation);
    const caseJoinderInput = asObject(formInputs.caseJoinder);
    const caseRecoveryInput = asObject(formInputs.caseRecovery);
    const investigationConclusionInput = asObject(formInputs.investigationConclusion);
    const indictmentInput = asObject(formInputs.indictment);
    const attachmentsInput = asObject(formInputs.attachments);
    const receptionInput = asObject(formInputs.reception);
    const receiverInput = asObject(formInputs.receiver);
    const informantInput = asObject(formInputs.informant);
    const crimeReportInput = asObject(formInputs.crimeReport);
    const notificationInput = asObject(formInputs.notification);
    const prosecutionTransferInput = asObject(formInputs.prosecutionTransfer);
    const prosecutionExtensionInput = asObject(formInputs.prosecutionExtension);

    const prosecutionSupplementReturnInput = asObject(
      formInputs.prosecutionSupplementReturn,
    );
    const agencyFromDb = caseItem.agency_id
      ? await this.prisma.agencies.findUnique({
          where: {
            id: caseItem.agency_id,
          },
        })
      : null;

    const agencyParentFromDb = agencyFromDb?.parent_agency_id
      ? await this.prisma.agencies.findUnique({
          where: {
            id: agencyFromDb.parent_agency_id,
          },
        })
      : null;

const casePeople = await this.prisma.case_people.findMany({
      where: {
        case_id: caseItem.id,
        is_active: true,
      },
      orderBy: [
        {
          person_order: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    const personIds = casePeople.map((item) => item.person_id);

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
        case_id: caseItem.id,
      },
      orderBy: [
        {
          is_primary: "desc",
        },
        {
          id: "asc",
        },
      ],
    });

    const offenseIds = caseOffenses.map((item) => item.offense_id);

    const offenses = offenseIds.length
      ? await this.prisma.offenses.findMany({
          where: {
            id: {
              in: offenseIds,
            },
          },
        })
      : [];

    const offenseById = new Map(
      offenses.map((offense) => [String(offense.id), offense]),
    );

    const primaryCaseOffense = caseOffenses[0] ?? null;
    const primaryOffense = primaryCaseOffense
      ? offenseById.get(String(primaryCaseOffense.offense_id))
      : null;

    const selectedPerson = targetPerson ?? people[0] ?? null;

    const text = (value: unknown): string => str(value) ?? "";

    const nonEmptyText = (value: unknown): string | null => {
      const valueText = str(value)?.trim();

      return valueText && valueText.length > 0 ? valueText : null;
    };

    const compact = (parts: Array<string | null | undefined>): string =>
      parts
        .map((item) => text(item))
        .filter((item) => item.length > 0)
        .join(" ");

    const monthNoZero = (value: unknown): string => {
      const raw = text(value);

      if (!raw) {
        return "";
      }

      const numeric = Number(raw);

      return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : raw;
    };

    const dateSlashText = (parts: {
      full?: unknown;
      day?: unknown;
      month?: unknown;
      year?: unknown;
    }): string => {
      const day = text(parts.day);
      const month = monthNoZero(parts.month);
      const year = text(parts.year);

      if (day && month && year) {
        return `${day}/${month}/${year}`;
      }

      return text(parts.full);
    };

    const legalDateText = (parts: {
      full?: unknown;
      day?: unknown;
      month?: unknown;
      year?: unknown;
    }): string => {
      const day = text(parts.day);
      const month = monthNoZero(parts.month);
      const year = text(parts.year);

      if (day && month && year) {
        return `ngày ${day} tháng ${month} năm ${year}`;
      }

      const fallback = text(parts.full);
      return fallback ? `ngày ${fallback}` : "";
    };

    const ensureSentenceEnd = (
      value: string,
      mark: "." | ";" | ",",
    ): string => {
      const normalized = value
        .replace(/\s+([,.;])/g, "$1")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (!normalized) return normalized;
      if (/[.;,]$/.test(normalized)) return normalized;

      return `${normalized}${mark}`;
    };

    const truthyFlag = (value: unknown): boolean => {
      const normalized = text(value).trim().toLowerCase();
      return ["1", "true", "yes", "y", "co", "có"].includes(normalized);
    };

    const templateCode = template.template_code;
    const isBm054Template = templateCode === "BM-054";
    const isBm001Template = templateCode === "BM-001";
    const isBm156Template = templateCode === "BM-156";
    const isBm090Template = templateCode === "BM-090";
    const isBm097Template = templateCode === "BM-097";
    const isBm058Template = templateCode === "BM-058";
    const isBm059Template = templateCode === "BM-059";
    const isBm070Template = templateCode === "BM-070";
    const isBm103Template = templateCode === "BM-103";
    const isBm141Template = templateCode === "BM-141";
    const isBm144Template = templateCode === "BM-144";
    const isDecisionTemplate = isBm090Template || isBm097Template;

    const rawDocumentIssueDate =
      str(documentInput.issueDate) ?? generatedDocument.generated_at;

    const currentVietnamIssueDate = (() => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date());

      const day =
        parts.find((part) => part.type === "day")?.value ??
        String(new Date().getDate()).padStart(2, "0");
      const month =
        parts.find((part) => part.type === "month")?.value ??
        String(new Date().getMonth() + 1).padStart(2, "0");
      const year =
        parts.find((part) => part.type === "year")?.value ??
        String(new Date().getFullYear());

      return `${year}-${month}-${day}`;
    })();

    const documentIssueDate = currentVietnamIssueDate;
    const documentIssueParts = dateParts(documentIssueDate);

    const caseDecisionIssueDate =
      str(caseDecisionInput.issueDate) ?? caseItem.received_date;
    const caseDecisionParts = dateParts(caseDecisionIssueDate);

    const accusedDecisionIssueDate =
      str(accusedDecisionInput.issueDate) ?? caseItem.received_date;
    const accusedDecisionParts = dateParts(accusedDecisionIssueDate);

    const measureFromDate = str(measureInput.fromDate) ?? rawDocumentIssueDate;
    const measureToDate = str(measureInput.toDate);
    const measureFromParts = dateParts(measureFromDate);
    const measureToParts = dateParts(measureToDate);

    const personDateOfBirth =
      str(personInput.dateOfBirth) ?? selectedPerson?.date_of_birth ?? null;
    const personBirthParts = dateParts(personDateOfBirth);

    const identityIssuedDate =
      str(personInput.identityIssuedDate) ??
      selectedPerson?.identity_issued_date ??
      null;
    const identityIssuedParts = dateParts(identityIssuedDate);

    const offenseName =
      str(offenseInput.offenseName) ?? primaryOffense?.offense_name ?? null;

    const offenseLegalArticle =
      str(offenseInput.legalArticle) ??
      primaryCaseOffense?.offense_description ??
      primaryOffense?.description ??
      null;

    const criminalCodeText =
      str(offenseInput.criminalCodeText) ??
      "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025";

    const offenseLegalBasisText = compact([
      offenseName ? `về tội “${offenseName}”` : null,
      offenseLegalArticle ? `quy định tại ${offenseLegalArticle}` : null,
      criminalCodeText ? `của ${criminalCodeText}` : null,
    ]);

    const personFullName =
      str(personInput.fullName) ?? selectedPerson?.full_name ?? null;

    const personGenderLabel =
      str(personInput.genderLabel) ??
      (selectedPerson ? genderLabel(selectedPerson.gender) : null);

    const personOtherName =
      str(personInput.otherName) ?? selectedPerson?.other_name ?? null;

    const personBirthDay = str(personInput.birthDay) ?? personBirthParts.day;
    const personBirthMonth =
      str(personInput.birthMonth) ?? personBirthParts.month;
    const personBirthYear =
      str(personInput.birthYear) ??
      selectedPerson?.birth_year ??
      personBirthParts.year;

    const personPlaceOfBirth =
      str(personInput.placeOfBirth) ?? selectedPerson?.place_of_birth ?? null;

    const personNationality =
      str(personInput.nationality) ?? selectedPerson?.nationality ?? null;

    const personEthnicity =
      str(personInput.ethnicity) ?? selectedPerson?.ethnicity ?? null;

    const personReligion =
      str(personInput.religion) ?? selectedPerson?.religion ?? null;

    const personOccupation =
      str(personInput.occupation) ?? selectedPerson?.occupation ?? null;

    const personIdentityType = str(personInput.identityType) ?? "Thẻ CCCD";

    const personIdentityNo =
      str(personInput.identityNo) ?? selectedPerson?.identity_no ?? null;

    const personIdentityIssuedPlace =
      str(personInput.identityIssuedPlace) ??
      selectedPerson?.identity_issued_place ??
      null;

    const personPermanentAddress =
      str(personInput.permanentAddress) ??
      selectedPerson?.permanent_address ??
      null;

    const personTemporaryAddress = str(personInput.temporaryAddress);

    const personCurrentAddress =
      str(personInput.currentAddress) ??
      selectedPerson?.current_address ??
      null;

    const personResidenceAddress =
      str(personInput.residenceAddress) ??
      selectedPerson?.residence_address ??
      personCurrentAddress ??
      null;

    const personCriminalRecordLine = str(personInput.criminalRecordLine) ?? "Không";

    const birthInfoLine = (() => {
      if (personBirthDay && personBirthMonth && personBirthYear) {
        return compact([
          `Sinh ngày: ${personBirthDay} tháng ${monthNoZero(
            personBirthMonth,
          )} năm ${personBirthYear}`,
          personPlaceOfBirth ? `tại: ${personPlaceOfBirth}` : null,
        ]);
      }

      if (personBirthYear) {
        return compact([
          `Sinh năm ${personBirthYear}`,
          personPlaceOfBirth ? `tại: ${personPlaceOfBirth}` : null,
        ]);
      }

      if (personPlaceOfBirth) {
        return `Sinh tại: ${personPlaceOfBirth}`;
      }

      return "Sinh ngày: ........ tháng ........ năm ........ tại: ................................";
    })();

    const identityDocumentLine = (() => {
      if (!personIdentityNo) {
        return "Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu:";
      }

      return [
        `${personIdentityType}: ${personIdentityNo}`,
        identityIssuedParts.full
          ? `Cấp ngày ${dateSlashText(identityIssuedParts)}`
          : null,
        personIdentityIssuedPlace
          ? `Nơi cấp: ${personIdentityIssuedPlace}`
          : null,
      ]
        .filter(Boolean)
        .join(", ");
    })();

    const defaultAgencyParentName =
      isBm001Template || isBm156Template || isBm058Template || isBm059Template || isBm144Template || isBm141Template || isBm144Template
        ? "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH"
        : null;

    const defaultAgencyName =
      isBm001Template || isBm156Template || isBm058Template || isBm059Template
        ? "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7"
        : null;

    const agencyParentName =
      nonEmptyText(agencyInput.parentName) ??
      nonEmptyText(agencyParentFromDb?.agency_name) ??
      defaultAgencyParentName;

    const agencyName =
      nonEmptyText(agencyInput.name) ??
      nonEmptyText(agencyFromDb?.agency_name) ??
      defaultAgencyName;

    const agencyShortName =
      nonEmptyText(agencyInput.shortName) ??
      nonEmptyText(agencyFromDb?.agency_code);

    const agencyPhone =
      nonEmptyText(agencyInput.phone) ?? nonEmptyText(agencyFromDb?.phone);

    const documentIssuePlace =
      nonEmptyText(agencyInput.issuePlace) ??
      nonEmptyText((agencyFromDb as any)?.issue_place) ??
      nonEmptyText(agencyFromDb?.address) ??
      (isBm001Template || isBm156Template || isBm058Template || isBm059Template
        ? "TP. Hồ Chí Minh"
        : "");

    const issuePlaceAndDateLine =
      documentIssueParts.day &&
      documentIssueParts.month &&
      documentIssueParts.year
        ? compact([
            documentIssuePlace ? `${documentIssuePlace},` : null,
            `ngày ${documentIssueParts.day} tháng ${monthNoZero(
              documentIssueParts.month,
            )} năm ${documentIssueParts.year}`,
          ])
        : dateSlashText(documentIssueParts);

    const caseDecisionNo =
      str(caseDecisionInput.decisionNo) ?? caseItem.case_code;

    const caseDecisionIssuedBy = str(caseDecisionInput.issuedBy);

    const rawCaseDecisionLegalBasisLine = compact([
      caseDecisionNo
        ? `Quyết định khởi tố vụ án hình sự số ${caseDecisionNo}`
        : "Quyết định khởi tố vụ án hình sự",
      caseDecisionParts.full
        ? isDecisionTemplate
          ? legalDateText(caseDecisionParts)
          : `ngày ${dateSlashText(caseDecisionParts)}`
        : null,
      caseDecisionIssuedBy ? `của ${caseDecisionIssuedBy}` : null,
      offenseLegalBasisText,
    ]);

    const caseDecisionLegalBasisLine = isDecisionTemplate
      ? ensureSentenceEnd(`Căn cứ ${rawCaseDecisionLegalBasisLine}`, ";")
      : rawCaseDecisionLegalBasisLine;

    const bm070AssignmentProcedureArticlesLine =
      nonEmptyText(legalBasisInput.assignmentProcedureArticlesLine) ??
      (isBm070Template
        ? "Căn cứ các điều 41, 165 và 236 của Bộ luật Tố tụng hình sự;"
        : "");

    const bm070CaseProsecutionDecisionLine =
      nonEmptyText(caseDecisionInput.caseProsecutionDecisionLine) ??
      (isBm070Template ? caseDecisionLegalBasisLine : "");

    const bm070DeputyChiefName =
      nonEmptyText(assignmentInput.deputyChiefName) ??
      nonEmptyText(officialInput.deputyChiefName) ??
      (isBm070Template ? nonEmptyText(generatedDocument.generated_by_name) ?? "" : "");

    const bm070DeputyChiefTitle =
      nonEmptyText(assignmentInput.deputyChiefTitle) ??
      (isBm070Template ? "Phó Viện trưởng" : "");

    const bm070DeputyChiefAgencyName =
      nonEmptyText(assignmentInput.deputyChiefAgencyName) ??
      (isBm070Template ? agencyName ?? "" : "");

    const bm070ResponsibilityLine =
      nonEmptyText(assignmentInput.responsibilityLine) ??
      (isBm070Template
        ? "thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự"
        : "");

    const bm070InvestigationAuthorityLine =
      nonEmptyText(recipientsInput.investigationAuthorityLine) ??
      (isBm070Template ? "- Cơ quan, người có thẩm quyền điều tra;" : "");

    const bm070AssignedPersonLine =
      nonEmptyText(recipientsInput.assignedPersonLine) ??
      (isBm070Template ? "- Như Điều 2;" : "");

    const accusedDecisionNo =
      str(accusedDecisionInput.decisionNo) ?? caseItem.case_code;

    const accusedDecisionIssuedBy = str(accusedDecisionInput.issuedBy);

    const investigationUnitName =
      str(investigationInput.investigationUnitName) ??
      str(investigationInput.unitName) ??
      accusedDecisionIssuedBy ??
      caseDecisionIssuedBy ??
      null;

    const accusedDecisionLegalBasisLine = compact([
      accusedDecisionNo
        ? `Quyết định khởi tố bị can số ${accusedDecisionNo}`
        : "Quyết định khởi tố bị can",
      accusedDecisionParts.full
        ? `ngày ${dateSlashText(accusedDecisionParts)}`
        : null,
      accusedDecisionIssuedBy ? `của ${accusedDecisionIssuedBy}` : null,
      personFullName ? `đối với ${personFullName},` : null,
      offenseLegalBasisText,
    ]);

    const accusedDecisionRequestLine =
      str(accusedDecisionInput.requestLine) ??
      ensureSentenceEnd(
        compact([
          "Xét hồ sơ đề nghị phê chuẩn Quyết định khởi tố bị can",
          accusedDecisionNo ? `số ${accusedDecisionNo}` : null,
          accusedDecisionParts.full
            ? legalDateText(accusedDecisionParts)
            : null,
          accusedDecisionIssuedBy ? `của ${accusedDecisionIssuedBy}` : null,
          personFullName ? `đối với ${personFullName}` : null,
          offenseLegalBasisText,
        ]),
        ";",
      );

    const accusedDecisionApprovalArticle1Line =
      str(accusedDecisionInput.approvalArticle1Line) ??
      ensureSentenceEnd(
        compact([
          "Phê chuẩn Quyết định khởi tố bị can",
          accusedDecisionNo ? `số ${accusedDecisionNo}` : null,
          accusedDecisionParts.full
            ? legalDateText(accusedDecisionParts)
            : null,
          accusedDecisionIssuedBy ? `của ${accusedDecisionIssuedBy}` : null,
          personFullName ? `đối với ${personFullName}` : null,
          offenseLegalBasisText,
        ]),
        ".",
      );

    const accusedDecisionInvestigationRequestLine =
      str(accusedDecisionInput.investigationRequestLine) ??
      ensureSentenceEnd(
        compact([
          "Yêu cầu",
          accusedDecisionIssuedBy ??
            "cơ quan, người có thẩm quyền ra Quyết định khởi tố bị can",
          "tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự",
        ]),
        ".",
      );

    const approvalAssessmentLine =
      str(approvalInput.assessmentLine) ??
      ensureSentenceEnd(
        compact([
          "Nhận thấy việc khởi tố bị can",
          personFullName ? `đối với ${personFullName}` : null,
          "là có căn cứ",
        ]),
        ",",
      );

    const accusedDecisionSufficientGroundsLine =
      str(accusedDecisionInput.sufficientGroundsLine) ??
      "Sau khi nghiên cứu tài liệu trong hồ sơ vụ án, xét thấy có đủ căn cứ xác định:";

    const accusedDecisionArticle1Line =
      str(accusedDecisionInput.article1Line) ??
      ensureSentenceEnd(
        compact([
          "Khởi tố bị can",
          personFullName ? `đối với ${personFullName}` : null,
          offenseLegalBasisText,
        ]),
        ".",
      );

    const accusedDecisionArticle2Line =
      str(accusedDecisionInput.article2Line) ??
      compact([
        "Yêu cầu",
        investigationUnitName ?? "cơ quan, người có thẩm quyền điều tra",
        "tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự",
      ]);

    const measureDurationText = str(measureInput.durationText);

    const measureResidencePlace =
      str(measureInput.residencePlace) ??
      personResidenceAddress ??
      personCurrentAddress ??
      null;

    const measureArticle2Line = compact([
      "Bị can không được phép đi khỏi nơi cư trú",
      measureResidencePlace ? `tại ${measureResidencePlace},` : null,
      measureDurationText ? `trong thời hạn ${measureDurationText}` : null,
      measureFromParts.full
        ? `kể từ ngày ${dateSlashText(measureFromParts)}`
        : null,
      measureToParts.full ? `đến ngày ${dateSlashText(measureToParts)}.` : null,
    ]);

    // agencyName, agencyShortName and agencyPhone are resolved before issuePlaceAndDateLine.

    const monitoringUnitName =
      str(monitoringInput.unitName) ??
      str(agencyInput.monitoringUnitName) ??
      null;

    const monitoringPhone = str(monitoringInput.phone) ?? agencyPhone ?? null;

    const monitoringProsecutorName =
      str(monitoringInput.prosecutorName) ??
      str(officialInput.prosecutorName) ??
      generatedDocument.generated_by_name ??
      null;

    const monitoringPermissionLine = compact([
      monitoringUnitName
        ? `Khi chưa được sự đồng ý của ${monitoringUnitName}`
        : "Khi chưa được sự đồng ý của đơn vị được giao quản lý",
      agencyName ? `và giấy phép của ${agencyName}` : null,
      "thì bị can không được đi khỏi nơi cư trú quy định tại Điều 2 Lệnh này.",
    ]);

    const monitoringViolationBase = compact([
      "Nếu bị can vi phạm nghĩa vụ cam đoan, yêu cầu",
      monitoringUnitName ?? "đơn vị được giao quản lý",
      agencyName
        ? `phải báo ngay cho ${agencyName} biết để xử lý theo thẩm quyền`
        : "phải báo ngay cho Viện kiểm sát biết để xử lý theo thẩm quyền",
    ]);

    const monitoringPhonePart = monitoringPhone
      ? `, điện thoại liên hệ số (${monitoringPhone})`
      : "";

    const monitoringProsecutorPart = monitoringProsecutorName
      ? `, gặp Kiểm sát viên ${monitoringProsecutorName} để giải quyết.`
      : ", gặp Kiểm sát viên thụ lý vụ án để giải quyết.";

    const monitoringArticle3Line =
      `${monitoringPermissionLine} ${monitoringViolationBase}${monitoringPhonePart}${monitoringProsecutorPart}`
        .replace(/\s+,/g, ",")
        .replace(/\s+\./g, ".")
        .replace(/\s{2,}/g, " ")
        .trim();


    const bm054PreventiveMeasureOrderCode =
      nonEmptyText(notificationInput.preventiveMeasureOrderCode) ??
      nonEmptyText(measureInput.orderDocumentCode) ??
      nonEmptyText(documentInput.preventiveMeasureOrderCode) ??
      "12/LCCT-VKS";

    const bm054PreventiveMeasureOrderIssueDate =
      nonEmptyText(notificationInput.preventiveMeasureOrderIssueDate) ??
      nonEmptyText(measureInput.orderIssueDate) ??
      nonEmptyText(documentInput.preventiveMeasureOrderIssueDate) ??
      documentIssueDate;

    const bm054PreventiveMeasureOrderIssueParts = dateParts(
      bm054PreventiveMeasureOrderIssueDate,
    );

    const bm054PreventiveMeasureOrderIssueDateText =
      nonEmptyText(notificationInput.preventiveMeasureOrderIssueDateText) ??
      nonEmptyText(measureInput.orderIssueDateText) ??
      nonEmptyText(documentInput.preventiveMeasureOrderIssueDateText) ??
      (bm054PreventiveMeasureOrderIssueParts.full
        ? legalDateText(bm054PreventiveMeasureOrderIssueParts)
        : "");

    const bm054PreventiveMeasureOrderLine =
      nonEmptyText(notificationInput.preventiveMeasureOrderLine) ??
      ensureSentenceEnd(
        compact([
          agencyName ?? "Viện kiểm sát",
          "đã ra Lệnh cấm đi khỏi nơi cư trú",
          bm054PreventiveMeasureOrderCode
            ? `số ${bm054PreventiveMeasureOrderCode}`
            : null,
          bm054PreventiveMeasureOrderIssueDateText,
          personFullName ? `đối với bị can ${personFullName}` : null,
          measureDurationText ? `trong thời hạn ${measureDurationText}` : null,
          measureFromParts.full
            ? `kể từ ngày ${dateSlashText(measureFromParts)}`
            : null,
          measureToParts.full
            ? `đến ngày ${dateSlashText(measureToParts)}`
            : null,
        ]),
        ".",
      );

    const bm054NotificationTitle =
      nonEmptyText(notificationInput.title) ??
      (isBm054Template ? "THÔNG BÁO" : "");

    const bm054NotificationSubject =
      nonEmptyText(notificationInput.subject) ??
      (isBm054Template
        ? "Về việc áp dụng biện pháp cấm đi khỏi nơi cư trú"
        : "");

    const bm054NotificationContent =
      nonEmptyText(notificationInput.content) ??
      (isBm054Template
        ? ensureSentenceEnd(
            compact([
              agencyName ?? "Viện kiểm sát",
              "thông báo",
              monitoringUnitName ? `cho ${monitoringUnitName}` : null,
              "về việc áp dụng biện pháp cấm đi khỏi nơi cư trú",
              personFullName ? `đối với bị can ${personFullName}` : null,
            ]),
            ".",
          )
        : "");


    const bm055PreventiveMeasureOrderLegalBasisLine =
      nonEmptyText(measureInput.preventiveMeasureOrderLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Lệnh cấm đi khỏi nơi cư trú",
          bm054PreventiveMeasureOrderCode
            ? `số ${bm054PreventiveMeasureOrderCode}`
            : null,
          bm054PreventiveMeasureOrderIssueDateText,
          agencyName ? `của ${agencyName}` : null,
        ]),
        ";",
      );

    const bm055CancelReasonLine =
      nonEmptyText(measureInput.cancelReasonLine) ??
      ensureSentenceEnd(
        compact([
          "Xét thấy có đủ căn cứ, điều kiện hủy bỏ biện pháp cấm đi khỏi nơi cư trú",
          personFullName ? `đối với bị can ${personFullName}` : null,
        ]),
        ",",
      );

    const bm055CancellationArticle1Line =
      nonEmptyText(measureInput.cancellationArticle1Line) ??
      ensureSentenceEnd(
        compact([
          "Hủy bỏ biện pháp cấm đi khỏi nơi cư trú đối với",
          personFullName ? `bị can ${personFullName}` : "bị can",
        ]),
        ".",
      );

    const bm055CancellationArticle2Line =
      nonEmptyText(measureInput.cancellationArticle2Line) ??
      ensureSentenceEnd(
        compact([
          "Yêu cầu",
          monitoringUnitName ?? investigationUnitName ?? "cơ quan, tổ chức có liên quan",
          "thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự",
        ]),
        ".",
      );

    const bm056ImmigrationAgencyName =
      nonEmptyText(measureInput.immigrationAgencyName) ??
      nonEmptyText(recipientsInput.immigrationAgencyName) ??
      "Cơ quan quản lý xuất, nhập cảnh Bộ Công an";

    const bm056ImmigrationUnitLine =
      nonEmptyText(recipientsInput.immigrationUnitLine) ??
      `- ${bm056ImmigrationAgencyName};`;

    const bm056ExitPostponementDurationText =
      nonEmptyText(measureInput.exitPostponementDurationText) ??
      measureDurationText ??
      "";

    const bm056ExitPostponementFromDateText =
      nonEmptyText(measureInput.exitPostponementFromDateText) ??
      dateSlashText(measureFromParts);

    const bm056ExitPostponementToDateText =
      nonEmptyText(measureInput.exitPostponementToDateText) ??
      dateSlashText(measureToParts);

    const bm056ExitPostponementReasonLine =
      nonEmptyText(measureInput.exitPostponementReasonLine) ??
      ensureSentenceEnd(
        compact([
          "có đủ căn cứ, điều kiện áp dụng biện pháp tạm hoãn xuất cảnh",
          personFullName ? `đối với bị can ${personFullName}` : null,
        ]),
        ",",
      );

    const bm056ExitPostponementArticle1Line =
      nonEmptyText(measureInput.exitPostponementArticle1Line) ??
      ensureSentenceEnd(
        compact([
          "Tạm hoãn xuất cảnh đối với",
          personFullName ? `bị can ${personFullName}` : "bị can",
        ]),
        ".",
      );

    const bm056ExitPostponementArticle2Line =
      nonEmptyText(measureInput.exitPostponementArticle2Line) ??
      ensureSentenceEnd(
        compact([
          bm056ImmigrationAgencyName ? `${bm056ImmigrationAgencyName},` : null,
          "người bị tạm hoãn xuất cảnh nêu tại Điều 1 có trách nhiệm thi hành Quyết định này",
        ]),
        ".",
      );

    const bm057ExitPostponementDecisionCode =
      nonEmptyText(measureInput.exitPostponementDecisionCode) ??
      nonEmptyText(documentInput.exitPostponementDecisionCode) ??
      "15/QĐ-VKSKV7";

    const bm057ExitPostponementDecisionIssueDate =
      nonEmptyText(measureInput.exitPostponementDecisionIssueDate) ??
      nonEmptyText(documentInput.exitPostponementDecisionIssueDate) ??
      measureFromDate ??
      documentIssueDate;

    const bm057ExitPostponementDecisionIssueParts = dateParts(
      bm057ExitPostponementDecisionIssueDate,
    );

    const bm057ExitPostponementDecisionIssueDateText =
      nonEmptyText(measureInput.exitPostponementDecisionIssueDateText) ??
      nonEmptyText(documentInput.exitPostponementDecisionIssueDateText) ??
      (bm057ExitPostponementDecisionIssueParts.full
        ? legalDateText(bm057ExitPostponementDecisionIssueParts)
        : "");

    const bm057ExitPostponementDecisionLegalBasisLine =
      nonEmptyText(measureInput.exitPostponementDecisionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Quyết định tạm hoãn xuất cảnh",
          bm057ExitPostponementDecisionCode
            ? `số ${bm057ExitPostponementDecisionCode}`
            : null,
          bm057ExitPostponementDecisionIssueDateText,
          agencyName ? `của ${agencyName}` : null,
          personFullName ? `đối với ${personFullName}` : null,
        ]),
        ";",
      );

    const bm057ExitPostponementCancelReasonLine =
      nonEmptyText(measureInput.exitPostponementCancelReasonLine) ??
      nonEmptyText(measureInput.cancelReasonLine) ??
      ensureSentenceEnd(
        compact([
          "không còn cần thiết tiếp tục áp dụng biện pháp tạm hoãn xuất cảnh",
          personFullName ? `đối với bị can ${personFullName}` : null,
        ]),
        ",",
      );

    const bm057ExitPostponementCancellationArticle1Line =
      nonEmptyText(measureInput.exitPostponementCancellationArticle1Line) ??
      nonEmptyText(measureInput.cancellationArticle1Line) ??
      ensureSentenceEnd(
        compact([
          "Hủy bỏ biện pháp tạm hoãn xuất cảnh đối với",
          personFullName ? `bị can ${personFullName}` : "bị can",
        ]),
        ".",
      );

    const bm057ExitPostponementCancellationArticle2Line =
      nonEmptyText(measureInput.exitPostponementCancellationArticle2Line) ??
      nonEmptyText(measureInput.cancellationArticle2Line) ??
      ensureSentenceEnd(
        compact([
          "Yêu cầu",
          bm056ImmigrationAgencyName,
          "thực hiện Quyết định này theo quy định của pháp luật",
        ]),
        ".",
      );
    const bm058DetentionDurationText =
      nonEmptyText(measureInput.detentionDurationText) ??
      measureDurationText ??
      "02 tháng";

    const bm058DetentionFromDateText =
      nonEmptyText(measureInput.detentionFromDateText) ??
      dateSlashText(measureFromParts);

    const bm058DetentionToDateText =
      nonEmptyText(measureInput.detentionToDateText) ??
      dateSlashText(measureToParts);

    const bm058DetentionExecutionUnitName =
      nonEmptyText(measureInput.detentionExecutionUnitName) ??
      nonEmptyText(recipientsInput.detentionExecutionUnitName) ??
      nonEmptyText(investigationInput.detentionExecutionUnitName) ??
      "Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh";

    const bm058DetentionReasonLine =
      nonEmptyText(measureInput.detentionReasonLine) ??
      ensureSentenceEnd(
        compact([
          "việc tạm giam",
          personFullName ? `đối với bị can ${personFullName}` : "đối với bị can",
          "là có căn cứ và cần thiết",
        ]),
        ",",
      );

    const bm058DetentionArticle1Line =
      nonEmptyText(measureInput.detentionArticle1Line) ??
      ensureSentenceEnd(
        compact([
          "Tạm giam đối với",
          personFullName ? `bị can ${personFullName}` : "bị can",
        ]),
        ".",
      );

    const bm058DetentionArticle2Line =
      nonEmptyText(measureInput.detentionArticle2Line) ??
      ensureSentenceEnd(
        compact([
          "Yêu cầu",
          bm058DetentionExecutionUnitName,
          "thi hành Lệnh này theo quy định của Bộ luật Tố tụng hình sự",
        ]),
        ".",
      );

    const bm058DetentionExecutionUnitLine =
      nonEmptyText(recipientsInput.detentionExecutionUnitLine) ??
      `- ${bm058DetentionExecutionUnitName};`;

    const bm058DeliveryDeliveredAtText =
      nonEmptyText(deliveryInput.detentionDeliveredAtText) ??
      nonEmptyText(deliveryInput.deliveredAtText) ??
      `Lệnh này đã được giao cho người bị tạm giam một bản vào hồi ... giờ ... ngày ... tháng ... năm ${documentIssueParts.year ?? "20..."}`;

    const bm058DeliveryReceiverTitle =
      nonEmptyText(deliveryInput.detentionReceiverTitle) ??
      nonEmptyText(deliveryInput.receiverTitle) ??
      "NGƯỜI BỊ TẠM GIAM";

    const bm059DetentionOrderCode =
      nonEmptyText(measureInput.detentionOrderCode) ??
      nonEmptyText(measureInput.detentionOrderDocumentCode) ??
      nonEmptyText(documentInput.detentionOrderCode) ??
      "17/LTG-VKSKV7";

    const bm059DetentionOrderIssueDate =
      nonEmptyText(measureInput.detentionOrderIssueDate) ??
      nonEmptyText(documentInput.detentionOrderIssueDate) ??
      measureFromDate ??
      documentIssueDate;

    const bm059DetentionOrderIssueParts = dateParts(bm059DetentionOrderIssueDate);

    const bm059DetentionOrderIssueDateText =
      nonEmptyText(measureInput.detentionOrderIssueDateText) ??
      (bm059DetentionOrderIssueParts.full
        ? legalDateText(bm059DetentionOrderIssueParts)
        : "");

    const bm059DetentionOrderLegalBasisLine =
      nonEmptyText(measureInput.detentionOrderLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Lệnh bắt bị can để tạm giam/Lệnh tạm giam",
          bm059DetentionOrderCode ? `số ${bm059DetentionOrderCode}` : null,
          bm059DetentionOrderIssueDateText,
          agencyName ? `của ${agencyName}` : "của Viện kiểm sát",
        ]),
        ";",
      );

    const bm059ProsecutionExtensionDecisionCode =
      nonEmptyText(measureInput.prosecutionExtensionDecisionCode) ??
      nonEmptyText(documentInput.prosecutionExtensionDecisionCode) ??
      "03/QĐ-VKSKV7";

    const bm059ProsecutionExtensionDecisionIssueDate =
      nonEmptyText(measureInput.prosecutionExtensionDecisionIssueDate) ??
      nonEmptyText(documentInput.prosecutionExtensionDecisionIssueDate) ??
      documentIssueDate;

    const bm059ProsecutionExtensionDecisionIssueParts = dateParts(
      bm059ProsecutionExtensionDecisionIssueDate,
    );

    const bm059ProsecutionExtensionDecisionIssueDateText =
      nonEmptyText(measureInput.prosecutionExtensionDecisionIssueDateText) ??
      (bm059ProsecutionExtensionDecisionIssueParts.full
        ? legalDateText(bm059ProsecutionExtensionDecisionIssueParts)
        : "");

    const bm059ProsecutionExtensionDecisionLegalBasisLine =
      nonEmptyText(measureInput.prosecutionExtensionDecisionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Quyết định gia hạn thời hạn quyết định việc truy tố",
          bm059ProsecutionExtensionDecisionCode
            ? `số ${bm059ProsecutionExtensionDecisionCode}`
            : null,
          bm059ProsecutionExtensionDecisionIssueDateText,
          agencyName ? `của ${agencyName}` : "của Viện kiểm sát",
          personFullName ? `đối với ${personFullName}` : null,
        ]),
        ";",
      );

    const bm059DetentionExtensionDurationText =
      nonEmptyText(measureInput.detentionExtensionDurationText) ??
      nonEmptyText(measureInput.detentionDurationText) ??
      measureDurationText ??
      "15 ngày";

    const bm059DetentionExtensionFromDateText =
      nonEmptyText(measureInput.detentionExtensionFromDateText) ??
      nonEmptyText(measureInput.detentionFromDateText) ??
      dateSlashText(measureFromParts);

    const bm059DetentionExtensionToDateText =
      nonEmptyText(measureInput.detentionExtensionToDateText) ??
      nonEmptyText(measureInput.detentionToDateText) ??
      dateSlashText(measureToParts);

    const bm059DetentionExtensionReasonLine =
      nonEmptyText(measureInput.detentionExtensionReasonLine) ??
      ensureSentenceEnd(
        compact([
          "việc gia hạn thời hạn tạm giam để quyết định việc truy tố",
          personFullName ? `đối với bị can ${personFullName}` : "đối với bị can",
          "là có căn cứ và cần thiết",
        ]),
        ",",
      );

    const bm059DetentionExtensionArticle1Line =
      nonEmptyText(measureInput.detentionExtensionArticle1Line) ??
      ensureSentenceEnd(
        compact([
          "Gia hạn tạm giam đối với",
          personFullName ? `bị can ${personFullName}` : "bị can",
        ]),
        ".",
      );

    const bm059DetentionExtensionArticle2Line =
      nonEmptyText(measureInput.detentionExtensionArticle2Line) ??
      ensureSentenceEnd(
        compact([
          "Yêu cầu",
          bm058DetentionExecutionUnitName,
          "thi hành Quyết định này theo quy định của Bộ luật Tố tụng hình sự",
        ]),
        ".",
      );

    const bm059DeliveryDeliveredAtText =
      nonEmptyText(deliveryInput.detentionExtensionDeliveredAtText) ??
      nonEmptyText(deliveryInput.detentionDeliveredAtText) ??
      nonEmptyText(deliveryInput.deliveredAtText) ??
      `Quyết định này đã được giao cho người bị tạm giam một bản vào hồi ... giờ ... ngày ... tháng ... năm ${documentIssueParts.year ?? "20..."}`;

    const bm059DeliveryReceiverTitle =
      nonEmptyText(deliveryInput.detentionExtensionReceiverTitle) ??
      nonEmptyText(deliveryInput.detentionReceiverTitle) ??
      nonEmptyText(deliveryInput.receiverTitle) ??
      "NGƯỜI BỊ TẠM GIAM";

    const signatureSignMode = str(signatureInput.signMode) ?? "KT. VIỆN TRƯỞNG";

    const signaturePositionTitle =
      str(signatureInput.positionTitle) ??
      str(officialInput.positionTitle) ??
      "PHÓ VIỆN TRƯỞNG";

    const signatureSignerName =
      nonEmptyText(signatureInput.signerName) ??
      nonEmptyText(officialInput.fullName) ??
      "Nguyễn Thanh Nam";

    const inputDocumentCode = str(documentInput.documentCode);
    const defaultDecisionDocumentCode = agencyShortName
      ? `/QĐ-VKS-${agencyShortName}`
      : "/QĐ-VKS";

    const documentNoText =
      str(documentInput.documentNo) ??
      (isDecisionTemplate ? "" : generatedDocument.document_code);
    const documentCodeText = isDecisionTemplate
      ? inputDocumentCode && !inputDocumentCode.includes("/LCCT")
        ? inputDocumentCode
        : defaultDecisionDocumentCode
      : (inputDocumentCode ?? generatedDocument.document_code);

    const documentFullDocumentCode =
      str(documentInput.fullDocumentCode) ??
      [documentNoText, documentCodeText].filter(Boolean).join("");

    const rawOfficialIssuerTitle = nonEmptyText(officialInput.issuerTitle);

    const officialIssuerTitle =
      isDecisionTemplate &&
      rawOfficialIssuerTitle &&
      rawOfficialIssuerTitle.trim() !== "VIỆN TRƯỞNG"
        ? rawOfficialIssuerTitle
        : isDecisionTemplate && agencyName
          ? `VIỆN TRƯỞNG ${agencyName}`
          : rawOfficialIssuerTitle ??
            (agencyName
              ? `VIỆN TRƯỞNG ${agencyName}`
              : "VIỆN TRƯỞNG VIỆN KIỂM SÁT");

    const legalEntityArticleLine =
      str(legalBasisInput.legalEntityArticleLine) ??
      (truthyFlag(legalBasisInput.isLegalEntity) ||
      truthyFlag(personInput.isLegalEntity)
        ? "Căn cứ Điều 433 của Bộ luật Tố tụng hình sự;"
        : "");

    const juvenileJusticeLine =
      str(legalBasisInput.juvenileJusticeLine) ??
      (truthyFlag(legalBasisInput.isJuvenile) ||
      truthyFlag(personInput.isJuvenile)
        ? "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;"
        : "");

    const procedureArticlesLine =
      str(legalBasisInput.procedureArticlesLine) ??
      (isBm156Template
        ? "Căn cứ các điều 41, 236, 239 và 243 của Bộ luật Tố tụng hình sự;"
        : isBm058Template
          ? "Căn cứ các điều 41, 119 và 165 của Bộ luật Tố tụng hình sự;"
          : isBm059Template
            ? "Căn cứ các điều 41, 119, 236, 240 và 241 của Bộ luật Tố tụng hình sự;"
            : "Căn cứ các điều 41, 165 và 179 của Bộ luật Tố tụng hình sự;");

    const offenseActDescriptionLine =
      str(offenseInput.actDescriptionLine) ??
      ensureSentenceEnd(
        compact([
          "đã có hành vi",
          offenseName ? offenseName.toLowerCase() : null,
        ]),
        ",",
      );

    const recipientsInvestigationUnitLine =
      str(recipientsInput.investigationUnitLine) ??
      (investigationUnitName ? `- ${investigationUnitName};` : null);

    const bm156DocumentFullDocumentCode =
      nonEmptyText(documentInput.fullDocumentCode) ??
      nonEmptyText(documentInput.documentNo) ??
      (agencyShortName ? "01/CT-VKS-" + agencyShortName : "01/CT-VKS-KV7");

    const bm156CaseDecisionLegalBasisLine =
      str(caseDecisionInput.legalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Quyết định khởi tố vụ án hình sự",
          caseDecisionNo ? "số " + caseDecisionNo : null,
          caseDecisionParts.full ? legalDateText(caseDecisionParts) : null,
          caseDecisionIssuedBy ? "của " + caseDecisionIssuedBy : null,
          offenseLegalBasisText,
        ]),
        ";",
      );

    const bm156AccusedDecisionLegalBasisLine =
      str(accusedDecisionInput.legalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Quyết định khởi tố bị can",
          accusedDecisionNo ? "số " + accusedDecisionNo : null,
          accusedDecisionParts.full ? legalDateText(accusedDecisionParts) : null,
          accusedDecisionIssuedBy ? "của " + accusedDecisionIssuedBy : null,
          personFullName ? "đối với " + personFullName : null,
          offenseLegalBasisText,
        ]),
        ";",
      );

    const bm156CaseJoinderLegalBasisLine =
      str(caseJoinderInput.legalBasisLine) ?? "";

    const bm156CaseRecoveryLegalBasisLine =
      str(caseRecoveryInput.legalBasisLine) ?? "";

    const bm156InvestigationConclusionLegalBasisLine =
      str(investigationConclusionInput.legalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
          nonEmptyText(investigationConclusionInput.conclusionNo)
            ? "số " + nonEmptyText(investigationConclusionInput.conclusionNo)
            : null,
          nonEmptyText(investigationConclusionInput.issueDate)
            ? "ngày " + nonEmptyText(investigationConclusionInput.issueDate)
            : null,
          investigationUnitName ? "của " + investigationUnitName : null,
        ]),
        ";",
      );

    const bm156LegalBasesSection = [
      procedureArticlesLine,
      bm156CaseDecisionLegalBasisLine,
      bm156AccusedDecisionLegalBasisLine,
      bm156CaseJoinderLegalBasisLine,
      bm156CaseRecoveryLegalBasisLine,
      bm156InvestigationConclusionLegalBasisLine,
    ]
      .map((item) => nonEmptyText(item))
      .filter(Boolean)
      .join("\n");
    const bm156AccusedProfileLine = compact([
      personFullName ? "Bị can " + personFullName + "," : "Bị can,",
      personOtherName ? "tên gọi khác: " + personOtherName + "," : null,
      personGenderLabel ? "giới tính: " + personGenderLabel + "," : null,
      birthInfoLine ? birthInfoLine + "," : null,
      personPlaceOfBirth ? "nơi sinh: " + personPlaceOfBirth + "," : null,
      personCurrentAddress ? "nơi ở hiện tại: " + personCurrentAddress + "," : null,
      personNationality ? "quốc tịch: " + personNationality + "," : null,
      personEthnicity ? "dân tộc: " + personEthnicity + "," : null,
      personReligion ? "tôn giáo: " + personReligion + "," : null,
      personOccupation ? "nghề nghiệp: " + personOccupation + "." : null,
    ]);

    const bm156OffenseConclusionLine = ensureSentenceEnd(
      compact([
        personFullName ? "Bị can " + personFullName : "Bị can",
        offenseName ? "phạm tội “" + offenseName + "”" : "phạm tội",
        offenseLegalArticle ? "theo " + offenseLegalArticle : null,
        criminalCodeText ? "của " + criminalCodeText : null,
      ]),
      ".",
    );

    const bm156FactFindingsSection =
      str(indictmentInput.factFindingsSection) ??
      [
        "Trên cơ sở kết quả điều tra đã xác định được như sau:",
        caseItem.case_summary,
        personFullName && offenseName
          ? "Bị can " + personFullName + " có hành vi " + offenseName.toLowerCase() + "."
          : null,
        "Việc thu giữ, tạm giữ tài liệu, đồ vật; xử lý vật chứng và phần dân sự sẽ được cập nhật theo hồ sơ vụ án.",
      ]
        .filter(Boolean)
        .join("\n");

    const bm156EvidenceConclusionLine =
      str(indictmentInput.evidenceConclusionLine) ??
      "Căn cứ vào các tình tiết và chứng cứ nêu trên,";

    const bm156ConclusionSection =
      str(indictmentInput.conclusionSection) ??
      [
        "Như vậy có đủ căn cứ để xác định bị can có lý lịch dưới đây đã phạm tội:",
        bm156AccusedProfileLine,
        "Tiền sự: Không.",
        "Tiền án: " + (personCriminalRecordLine || "Không") + ".",
        bm156OffenseConclusionLine,
        "Tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự được xem xét theo quy định của Bộ luật Hình sự.",
      ]
        .filter(Boolean)
        .join("\n");

    const bm156ProsecutionDecisionLine =
      str(indictmentInput.prosecutionDecisionLine) ??
      ensureSentenceEnd(
        compact([
          "Truy tố ra trước Tòa án nhân dân có thẩm quyền để xét xử bị can",
          personFullName,
          offenseName ? "về tội “" + offenseName + "”" : null,
          offenseLegalArticle ? "theo " + offenseLegalArticle : null,
          criminalCodeText ? "của " + criminalCodeText : null,
        ]),
        ".",
      );

    const bm156ReplacementLine =
      str(indictmentInput.replacementLine) ?? "";

    const bm156CaseFileLine =
      str(attachmentsInput.caseFileLine) ??
      "Hồ sơ vụ án gồm có: 01 tập, bằng các tờ tài liệu được đánh số thứ tự theo hồ sơ.";

    const bm156EvidenceListLine =
      str(attachmentsInput.evidenceListLine) ??
      "Bản kê vật chứng kèm theo nếu có.";

    const bm156CourtSummonsListLine =
      str(attachmentsInput.courtSummonsListLine) ??
      "Danh sách những người Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa.";

    const bm156CourtLine =
      str(recipientsInput.courtLine) ??
      "- Tòa án nhân dân có thẩm quyền;";

    const bm156AccusedRecipientLine =
      str(recipientsInput.accusedLine) ??
      (personFullName ? "- " + personFullName + ";" : "- Bị can;");

    const bm156SuperiorProcuracyLine =
      str(recipientsInput.superiorProcuracyLine) ?? "";

    const bm156OtherRecipientsLine =
      str(recipientsInput.otherRecipientsLine) ?? "";

    const bm103InvestigationUnitName =
      nonEmptyText(proposalInput.investigatingAgencyName) ??
      nonEmptyText(proposalInput.requestingAgencyName) ??
      nonEmptyText(recipientsInput.investigatingAgencyLine) ??
      nonEmptyText(investigationInput.investigationUnitName) ??
      nonEmptyText(investigationInput.unitName) ??
      caseDecisionIssuedBy ??
      "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

    const bm141ProcedureArticlesLine =
      nonEmptyText(prosecutionTransferInput.procedureArticlesLine) ??
      "Căn cứ các điều 41, 236 và 239 của Bộ luật Tố tụng hình sự;";

    const bm141FromProcuracyName =
      nonEmptyText(prosecutionTransferInput.fromProcuracyName) ??
      agencyName ??
      "Viện kiểm sát";

    const bm141ToProcuracyName =
      nonEmptyText(prosecutionTransferInput.toProcuracyName) ??
      "Viện kiểm sát có thẩm quyền";

    const bm141CaseDecisionLegalBasisLine =
      nonEmptyText(prosecutionTransferInput.caseDecisionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Quyết định khởi tố vụ án hình sự",
          caseDecisionNo ? "số " + caseDecisionNo : null,
          caseDecisionParts.full ? legalDateText(caseDecisionParts) : null,
          caseDecisionIssuedBy
            ? "của " + caseDecisionIssuedBy
            : bm103InvestigationUnitName
              ? "của " + bm103InvestigationUnitName
              : null,
          offenseLegalBasisText,
        ]),
        ";",
      );

    const bm141AccusedDecisionLegalBasisLine =
      nonEmptyText(prosecutionTransferInput.accusedDecisionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Quyết định khởi tố bị can",
          accusedDecisionNo ? "số " + accusedDecisionNo : null,
          accusedDecisionParts.full ? legalDateText(accusedDecisionParts) : null,
          accusedDecisionIssuedBy
            ? "của " + accusedDecisionIssuedBy
            : bm103InvestigationUnitName
              ? "của " + bm103InvestigationUnitName
              : null,
          personFullName ? "đối với " + personFullName : null,
          offenseLegalBasisText,
        ]),
        ";",
      );

    const bm141InvestigationConclusionNo =
      nonEmptyText(prosecutionTransferInput.investigationConclusionNo) ??
      nonEmptyText(investigationConclusionInput.conclusionNo);

    const bm141InvestigationConclusionIssueDate =
      nonEmptyText(prosecutionTransferInput.investigationConclusionIssueDate) ??
      nonEmptyText(investigationConclusionInput.issueDate);

    const bm141InvestigationConclusionIssueParts = dateParts(
      bm141InvestigationConclusionIssueDate,
    );

    const bm141InvestigationConclusionAgencyName =
      nonEmptyText(prosecutionTransferInput.investigationConclusionAgencyName) ??
      nonEmptyText(investigationConclusionInput.issuingAgencyName) ??
      bm103InvestigationUnitName;

    const bm141InvestigationConclusionLegalBasisLine =
      nonEmptyText(prosecutionTransferInput.investigationConclusionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
          bm141InvestigationConclusionNo
            ? "số " + bm141InvestigationConclusionNo
            : null,
          bm141InvestigationConclusionIssueParts.full
            ? legalDateText(bm141InvestigationConclusionIssueParts)
            : null,
          bm141InvestigationConclusionAgencyName
            ? "của " + bm141InvestigationConclusionAgencyName
            : null,
        ]),
        ";",
      );

    const bm141TransferReasonLine =
      nonEmptyText(prosecutionTransferInput.transferReasonLine) ??
      ensureSentenceEnd(
        compact([
          "Xét thấy vụ án không thuộc thẩm quyền truy tố của",
          bm141FromProcuracyName,
          "mà thuộc thẩm quyền truy tố của",
          bm141ToProcuracyName,
        ]),
        ",",
      );

    const bm141Article1BaseLine =
      nonEmptyText(prosecutionTransferInput.article1Line) ??
      ensureSentenceEnd(
        compact([
          "Chuyển vụ án",
          caseItem.case_title,
          "đến",
          bm141ToProcuracyName,
          "để truy tố theo thẩm quyền",
        ]),
        ".",
      );

    const bm141Article1Line = bm141Article1BaseLine.endsWith("./.")
      ? bm141Article1BaseLine
      : bm141Article1BaseLine.replace(/\.$/, "./.");

    const bm141ToProcuracyRecipientLine =
      nonEmptyText(prosecutionTransferInput.toProcuracyRecipientLine) ??
      "- " + bm141ToProcuracyName + ";";

    const bm141DetentionFacilityRecipientLine =
      nonEmptyText(prosecutionTransferInput.detentionFacilityRecipientLine) ??
      "- Cơ sở giam giữ (nếu có);";

    const bm144ProcedureArticlesLine =
      nonEmptyText(prosecutionExtensionInput.procedureArticlesLine) ??
      "Căn cứ các điều 41, 236 và 240 của Bộ luật Tố tụng hình sự;";

    const bm144JuvenileJusticeLine =
      nonEmptyText(prosecutionExtensionInput.juvenileJusticeLine) ?? "";

    const bm144CaseDecisionLegalBasisLine =
      nonEmptyText(prosecutionExtensionInput.caseDecisionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Quyết định khởi tố vụ án hình sự",
          caseDecisionNo ? "số " + caseDecisionNo : null,
          caseDecisionParts.full ? legalDateText(caseDecisionParts) : null,
          caseDecisionIssuedBy
            ? "của " + caseDecisionIssuedBy
            : bm103InvestigationUnitName
              ? "của " + bm103InvestigationUnitName
              : null,
          offenseLegalBasisText,
        ]),
        ";",
      );

    const bm144AccusedDecisionLegalBasisLine =
      nonEmptyText(prosecutionExtensionInput.accusedDecisionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Quyết định khởi tố bị can",
          accusedDecisionNo ? "số " + accusedDecisionNo : null,
          accusedDecisionParts.full ? legalDateText(accusedDecisionParts) : null,
          accusedDecisionIssuedBy
            ? "của " + accusedDecisionIssuedBy
            : bm103InvestigationUnitName
              ? "của " + bm103InvestigationUnitName
              : null,
          personFullName ? "đối với " + personFullName : null,
          offenseLegalBasisText,
        ]),
        ";",
      );

    const bm144InvestigationConclusionNo =
      nonEmptyText(prosecutionExtensionInput.investigationConclusionNo) ??
      nonEmptyText(investigationConclusionInput.conclusionNo);

    const bm144InvestigationConclusionIssueDate =
      nonEmptyText(prosecutionExtensionInput.investigationConclusionIssueDate) ??
      nonEmptyText(investigationConclusionInput.issueDate);

    const bm144InvestigationConclusionIssueParts = dateParts(
      bm144InvestigationConclusionIssueDate,
    );

    const bm144InvestigationConclusionAgencyName =
      nonEmptyText(prosecutionExtensionInput.investigationConclusionAgencyName) ??
      nonEmptyText(investigationConclusionInput.issuingAgencyName) ??
      bm103InvestigationUnitName;

    const bm144InvestigationConclusionLegalBasisLine =
      nonEmptyText(prosecutionExtensionInput.investigationConclusionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
          bm144InvestigationConclusionNo
            ? "số " + bm144InvestigationConclusionNo
            : null,
          bm144InvestigationConclusionIssueParts.full
            ? legalDateText(bm144InvestigationConclusionIssueParts)
            : null,
          bm144InvestigationConclusionAgencyName
            ? "của " + bm144InvestigationConclusionAgencyName
            : null,
        ]),
        ";",
      );

    const bm144ReasonLine =
      nonEmptyText(prosecutionExtensionInput.reasonLine) ??
      "Xét thấy cần gia hạn thời hạn quyết định việc truy tố để nghiên cứu, đánh giá đầy đủ hồ sơ vụ án,";

    const bm144DurationDaysText =
      nonEmptyText(prosecutionExtensionInput.durationDaysText) ?? "15 ngày";

    const bm144FromDateText =
      nonEmptyText(prosecutionExtensionInput.fromDateText) ??
      (documentIssueParts.full ? legalDateText(documentIssueParts) : "");

    const bm144ToDateText =
      nonEmptyText(prosecutionExtensionInput.toDateText) ?? "";

    const bm144Article1Line =
      nonEmptyText(prosecutionExtensionInput.article1Line) ??
      compact([
        "Gia hạn thời hạn quyết định việc truy tố trong thời hạn",
        bm144DurationDaysText + ",",
        bm144FromDateText ? "kể từ " + bm144FromDateText : null,
        bm144ToDateText ? "đến " + bm144ToDateText : null,
      ]) + "./.";
    const bm145ReturnRoundLine =
      nonEmptyText(prosecutionSupplementReturnInput.returnRoundLine) ??
      "(Lần thứ nhất)";

    const bm145ProcedureArticlesLine =
      nonEmptyText(prosecutionSupplementReturnInput.procedureArticlesLine) ??
      "Căn cứ các điều 41, 174, 240 và 245 của Bộ luật Tố tụng hình sự;";

    const bm145InvestigationConclusionNo =
      nonEmptyText(prosecutionSupplementReturnInput.investigationConclusionNo) ??
      nonEmptyText(investigationConclusionInput.conclusionNo) ??
      "01/KLĐT";

    const bm145InvestigationConclusionIssueDate =
      nonEmptyText(
        prosecutionSupplementReturnInput.investigationConclusionIssueDate,
      ) ??
      nonEmptyText(investigationConclusionInput.issueDate) ??
      documentIssueDate;

    const bm145InvestigationConclusionIssueParts = dateParts(
      bm145InvestigationConclusionIssueDate,
    );

    const bm145InvestigationConclusionAgencyName =
      nonEmptyText(
        prosecutionSupplementReturnInput.investigationConclusionAgencyName,
      ) ??
      nonEmptyText(investigationConclusionInput.issuingAgencyName) ??
      bm103InvestigationUnitName;

    const bm145InvestigationConclusionLegalBasisLine =
      nonEmptyText(
        prosecutionSupplementReturnInput.investigationConclusionLegalBasisLine,
      ) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố",
          bm145InvestigationConclusionNo
            ? "số " + bm145InvestigationConclusionNo
            : null,
          bm145InvestigationConclusionIssueParts.full
            ? legalDateText(bm145InvestigationConclusionIssueParts)
            : null,
          bm145InvestigationConclusionAgencyName
            ? "của " + bm145InvestigationConclusionAgencyName
            : null,
        ]),
        ";",
      );

    const bm145CourtReturnDecisionCode =
      nonEmptyText(prosecutionSupplementReturnInput.courtReturnDecisionCode) ??
      "01/2026/QĐST-HS";

    const bm145CourtReturnDecisionIssueDate =
      nonEmptyText(
        prosecutionSupplementReturnInput.courtReturnDecisionIssueDate,
      ) ?? documentIssueDate;

    const bm145CourtReturnDecisionIssueParts = dateParts(
      bm145CourtReturnDecisionIssueDate,
    );

    const bm145CourtName =
      nonEmptyText(prosecutionSupplementReturnInput.courtName) ??
      nonEmptyText(recipientsInput.courtName) ??
      "Tòa án nhân dân có thẩm quyền";

    const bm145CourtReturnDecisionLegalBasisLine =
      nonEmptyText(
        prosecutionSupplementReturnInput.courtReturnDecisionLegalBasisLine,
      ) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Quyết định trả hồ sơ vụ án để điều tra bổ sung",
          bm145CourtReturnDecisionCode
            ? "số " + bm145CourtReturnDecisionCode
            : null,
          bm145CourtReturnDecisionIssueParts.full
            ? legalDateText(bm145CourtReturnDecisionIssueParts)
            : null,
          bm145CourtName ? "của " + bm145CourtName : null,
        ]),
        ";",
      );

    const bm145ReasonLine =
      nonEmptyText(prosecutionSupplementReturnInput.reasonLine) ??
      "Xét thấy cần điều tra bổ sung để làm rõ đầy đủ chứng cứ, tài liệu và các tình tiết có ý nghĩa đối với việc giải quyết vụ án,";

    const bm145Article1IntroLine =
      nonEmptyText(prosecutionSupplementReturnInput.article1IntroLine) ??
      compact([
        "Trả hồ sơ vụ án hình sự",
        caseItem.case_title,
        offenseLegalBasisText,
        "cho",
        bm103InvestigationUnitName,
        "để điều tra bổ sung những vấn đề sau",
      ]) + ":";

    const bm145SupplementIssue1Line =
      nonEmptyText(prosecutionSupplementReturnInput.supplementIssue1Line) ??
      "Làm rõ vai trò, hành vi cụ thể của từng người tham gia trong vụ án.";

    const bm145SupplementIssue2Line =
      nonEmptyText(prosecutionSupplementReturnInput.supplementIssue2Line) ??
      "Bổ sung tài liệu, chứng cứ liên quan đến số tiền, phương tiện dùng vào việc phạm tội.";

    const bm145SupplementIssue3Line =
      nonEmptyText(prosecutionSupplementReturnInput.supplementIssue3Line) ??
      "Làm rõ các tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự nếu có.";

    const bm145SupplementDurationText =
      nonEmptyText(prosecutionSupplementReturnInput.durationText) ??
      nonEmptyText(prosecutionSupplementReturnInput.supplementDurationText) ??
      "02 tháng";

    const bm145Article2Line =
      nonEmptyText(prosecutionSupplementReturnInput.article2Line) ??
      ensureSentenceEnd(
        compact([
          "Thời hạn điều tra bổ sung không quá",
          bm145SupplementDurationText + ",",
          "kể từ ngày",
          bm103InvestigationUnitName,
          "nhận hồ sơ vụ án và Quyết định này",
        ]),
        ".",
      );

    const bm145Article3Line =
      nonEmptyText(prosecutionSupplementReturnInput.article3Line) ??
      ensureSentenceEnd(
        compact([
          "Yêu cầu",
          bm103InvestigationUnitName,
          "thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự",
        ]),
        ".",
      );

    const bm145InvestigationAuthorityRecipientLine =
      nonEmptyText(
        prosecutionSupplementReturnInput.investigationAuthorityRecipientLine,
      ) ??
      "- " + bm103InvestigationUnitName + ";";


    const bm103SuperiorProcuracyName =
      nonEmptyText(recipientsInput.superiorProcuracyName) ??
      nonEmptyText(recipientsInput.superiorProcuracyLine) ??
      nonEmptyText(agencyParentName) ??
      "Viện kiểm sát nhân dân cấp trên";

    const bm103CaseDecisionProsecutionDecisionLegalBasisLine =
      nonEmptyText(caseDecisionInput.prosecutionDecisionLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Căn cứ Quyết định khởi tố vụ án hình sự",
          caseDecisionNo ? `số ${caseDecisionNo}` : null,
          caseDecisionParts.full ? legalDateText(caseDecisionParts) : null,
          bm103InvestigationUnitName ? `của ${bm103InvestigationUnitName}` : null,
          offenseLegalBasisText,
        ]),
        ";",
      );

    const bm103CaseDecisionProsecutionDecisionSummaryLine =
      nonEmptyText(caseDecisionInput.prosecutionDecisionSummaryLine) ??
      compact([
        "Quyết định khởi tố vụ án hình sự",
        caseDecisionNo ? `số ${caseDecisionNo}` : null,
        caseDecisionParts.full ? legalDateText(caseDecisionParts) : null,
        bm103InvestigationUnitName ? `của ${bm103InvestigationUnitName}` : null,
        offenseLegalBasisText,
      ]);

    const bm103InvestigationExtensionPreviousDecisionLegalBasisLine =
      nonEmptyText(investigationExtensionInput.previousDecisionLegalBasisLine) ?? "";

    const bm103InvestigationExtensionRequestRoundText =
      nonEmptyText(investigationExtensionInput.requestRoundText) ?? "lần thứ hai";

    const bm103InvestigationExtensionDurationText =
      nonEmptyText(investigationExtensionInput.durationText) ?? "02 tháng";

    const bm103InvestigationExtensionFromDateText =
      nonEmptyText(investigationExtensionInput.fromDateText) ??
      (documentIssueParts.full ? legalDateText(documentIssueParts) : "");

    const bm103InvestigationExtensionToDateText =
      nonEmptyText(investigationExtensionInput.toDateText) ?? "";

    const bm103ProposalRequestingDocumentLine =
      nonEmptyText(proposalInput.requestingDocumentLine) ??
      ensureSentenceEnd(
        compact([
          "Xét văn bản đề nghị gia hạn thời hạn điều tra vụ án hình sự",
          bm103InvestigationUnitName ? `của ${bm103InvestigationUnitName}` : null,
          "nhận thấy việc gia hạn thời hạn điều tra là có căn cứ và cần thiết",
        ]),
        ",",
      );

    const bm103ProposalProposingProcuracyName =
      nonEmptyText(proposalInput.proposingProcuracyName) ??
      nonEmptyText(agencyName) ??
      "Viện kiểm sát";

    const bm103InvestigatingAgencyLine =
      nonEmptyText(recipientsInput.investigatingAgencyLine) ??
      bm103InvestigationUnitName;

    const bm104InvestigationRecoveryLegalBasisLine =
      nonEmptyText(investigationRecoveryInput.legalBasisLine) ?? "";

    const bm104InvestigationExtensionReasonLine =
      nonEmptyText(investigationExtensionInput.reasonLine) ??
      "Nhận thấy việc gia hạn thời hạn điều tra vụ án hình sự là có căn cứ và cần thiết,";

    const bm104InvestigationExtensionDecisionArticle1Line =
      nonEmptyText(investigationExtensionInput.decisionArticle1Line) ??
      compact([
        "Gia hạn thời hạn điều tra vụ án hình sự",
        bm103InvestigationExtensionRequestRoundText,
        "với thời hạn điều tra là",
        bm103InvestigationExtensionDurationText,
        bm103InvestigationExtensionFromDateText
          ? `, kể từ ${bm103InvestigationExtensionFromDateText}`
          : null,
        bm103InvestigationExtensionToDateText
          ? `đến ${bm103InvestigationExtensionToDateText}.`
          : null,
      ]);

    const bm104InvestigationExtensionDecisionArticle2Line =
      nonEmptyText(investigationExtensionInput.decisionArticle2Line) ??
      ensureSentenceEnd(
        compact([
          "Yêu cầu",
          bm103InvestigatingAgencyLine,
          "thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự",
        ]),
        ".",
      );
    const bm001ReceptionStartedAtDate =
      nonEmptyText(receptionInput.startedAtDate) ?? documentIssueDate;
    const bm001ReceptionStartedParts = dateParts(bm001ReceptionStartedAtDate);

    const bm001ReceptionEndedAtDate =
      nonEmptyText(receptionInput.endedAtDate) ?? bm001ReceptionStartedAtDate;
    const bm001ReceptionEndedParts = dateParts(bm001ReceptionEndedAtDate);

    const bm001StartedAtTimeText =
      nonEmptyText(receptionInput.startedAtTimeText) ??
      nonEmptyText(receptionInput.startTimeText) ??
      "08 giờ 00 phút";

    const bm001EndedAtTimeText =
      nonEmptyText(receptionInput.endedAtTimeText) ??
      nonEmptyText(receptionInput.endTimeText) ??
      "08 giờ 30 phút";

    const bm001ReceptionLocationName =
      nonEmptyText(receptionInput.locationName) ??
      agencyName ??
      "Viện kiểm sát";

    const bm001ReceiverFullName =
      nonEmptyText(receiverInput.fullName) ??
      signatureSignerName ??
      nonEmptyText(officialInput.fullName) ??
      generatedDocument.generated_by_name ??
      "Nguyễn T. H. Hạnh";

    const bm001ReceiverPositionTitle =
      nonEmptyText(receiverInput.positionTitle) ??
      nonEmptyText(officialInput.receiverPositionTitle) ??
      "Kiểm sát viên";

    const bm001ReceiverDepartmentName =
      nonEmptyText(receiverInput.departmentName) ??
      agencyName ??
      "Viện kiểm sát";

    const bm001ReceiverSignerName =
      nonEmptyText(receiverInput.signerName) ?? bm001ReceiverFullName;

    const bm001InformantDateOfBirthInput =
      nonEmptyText(informantInput.dateOfBirth);

    const bm001InformantDateOfBirth =
      bm001InformantDateOfBirthInput ?? personDateOfBirth;

    const bm001InformantBirthParts = dateParts(bm001InformantDateOfBirth);

    const bm001HasFullDateOfBirth = Boolean(bm001InformantDateOfBirthInput);

    const bm001InformantIdentityIssuedDate =
      nonEmptyText(informantInput.identityIssuedDate) ?? identityIssuedDate;
    const bm001InformantIdentityIssuedParts = dateParts(
      bm001InformantIdentityIssuedDate,
    );

    const bm001InformantFullName =
      nonEmptyText(informantInput.fullName) ??
      personFullName ??
      "Người cung cấp nguồn tin";

    const bm001InformantGenderLabel =
      nonEmptyText(informantInput.genderLabel) ?? personGenderLabel ?? "";

    const bm001InformantOtherName =
      nonEmptyText(informantInput.otherName) ?? personOtherName ?? "Không";

    const bm001InformantBirthDay =
      nonEmptyText(informantInput.birthDay) ??
      bm001InformantBirthParts.day ??
      personBirthDay;

    const bm001InformantBirthMonth =
      nonEmptyText(informantInput.birthMonth) ??
      bm001InformantBirthParts.month ??
      personBirthMonth;

    const bm001InformantBirthYear =
      bm001HasFullDateOfBirth
        ? bm001InformantBirthParts.year
        : nonEmptyText(informantInput.birthYear) ??
          bm001InformantBirthParts.year ??
          personBirthYear;

    const bm001InformantPlaceOfBirth =
      nonEmptyText(informantInput.placeOfBirth) ?? personPlaceOfBirth ?? "";

    const bm001InformantNationality =
      nonEmptyText(informantInput.nationality) ?? personNationality ?? "Việt Nam";

    const bm001InformantEthnicity =
      nonEmptyText(informantInput.ethnicity) ?? personEthnicity ?? "";

    const bm001InformantReligion =
      nonEmptyText(informantInput.religion) ?? personReligion ?? "";

    const bm001InformantOccupation =
      nonEmptyText(informantInput.occupation) ?? personOccupation ?? "";

    const bm001InformantIdentityNo =
      nonEmptyText(informantInput.identityNo) ?? personIdentityNo ?? "";

    const bm001InformantIdentityIssuedPlace =
      nonEmptyText(informantInput.identityIssuedPlace) ??
      personIdentityIssuedPlace ??
      "";

    const bm001InformantPermanentAddress =
      nonEmptyText(informantInput.permanentAddress) ??
      personPermanentAddress ??
      "";

    const bm001InformantTemporaryAddress =
      nonEmptyText(informantInput.temporaryAddress) ??
      personTemporaryAddress ??
      "";

    const bm001InformantCurrentAddress =
      nonEmptyText(informantInput.currentAddress) ??
      personCurrentAddress ??
      personResidenceAddress ??
      "";

    const bm001InformantPhone =
      nonEmptyText(informantInput.phone) ??
      nonEmptyText((selectedPerson as any)?.phone) ??
      "";

    const bm001InformantRepresentedOrganization =
      nonEmptyText(informantInput.representedOrganization) ?? "Không";

    const bm001InformantSignerName =
      nonEmptyText(informantInput.signerName) ?? bm001InformantFullName;

    const bm001CrimeReportContent =
      nonEmptyText(crimeReportInput.content) ??
      nonEmptyText(caseItem.case_summary) ??
      ensureSentenceEnd(
        compact([
          "Nguồn tin liên quan đến",
          caseItem.case_title,
          offenseName ? `có dấu hiệu tội “${offenseName}”` : null,
        ]),
        ".",
      );

    const bm001CrimeReportAttachedItemsDescription =
      nonEmptyText(crimeReportInput.attachedItemsDescription) ??
      nonEmptyText(crimeReportInput.attachedItems) ??
      "Không";

    const payload = {
      case: {
        id: toPublicId(caseItem.id),
        caseCode: caseItem.case_code,
        nationalCaseCode: caseItem.national_case_code,
        caseTitle: caseItem.case_title,
        caseSummary: caseItem.case_summary,
        caseType: caseItem.case_type,
        sourceType: caseItem.source_type,
        currentStage: caseItem.current_stage,
        currentStatus: caseItem.current_status,
        priority: caseItem.priority,
        receivedDate: formatDate(caseItem.received_date),
        acceptedDate: formatDate(caseItem.accepted_date),
        prosecutedDate: formatDate(caseItem.prosecuted_date),
        closedDate: formatDate(caseItem.closed_date),
        note: caseItem.note,
      },
      person:
        selectedPerson || Object.keys(personInput).length > 0
          ? {
              id: selectedPerson ? toPublicId(selectedPerson.id) : null,
              fullName: personFullName,
              otherName: personOtherName,
              gender: selectedPerson?.gender ?? null,
              genderLabel: personGenderLabel,
              dateOfBirth: personBirthParts.full,
              birthDay: personBirthDay,
              birthMonth: personBirthMonth,
              birthYear: personBirthYear,
              dateOfBirthText: dateSlashText(personBirthParts),
              placeOfBirth: personPlaceOfBirth,
              birthInfoLine,
              identityType: personIdentityType,
              identityNo: personIdentityNo,
              identityIssuedDate: identityIssuedParts.full,
              identityIssuedDay: identityIssuedParts.day,
              identityIssuedMonth: identityIssuedParts.month,
              identityIssuedYear: identityIssuedParts.year,
              identityIssuedDateText: dateSlashText(identityIssuedParts),
              identityIssuedPlace: personIdentityIssuedPlace,
              identityDocumentLine,
              occupation: personOccupation,
              permanentAddress: personPermanentAddress,
              temporaryAddress: personTemporaryAddress,
              currentAddress: personCurrentAddress,
              residenceAddress: personResidenceAddress,
              criminalRecordLine: personCriminalRecordLine,
              nationality: personNationality,
              ethnicity: personEthnicity,
              religion: personReligion,
              note: selectedPerson?.note ?? null,
            }
          : null,
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
          currentAddress: person?.current_address ?? null,
          residenceAddress: person?.residence_address ?? null,
        };
      }),
      offense:
        primaryOffense || Object.keys(offenseInput).length > 0
          ? {
              id: primaryOffense ? toPublicId(primaryOffense.id) : null,
              offenseCode: primaryOffense?.offense_code ?? null,
              offenseName,
              offenseGroup: primaryOffense?.offense_group ?? null,
              legalArticle: offenseLegalArticle,
              criminalCodeText,
              legalBasisText: offenseLegalBasisText,
              actDescriptionLine: offenseActDescriptionLine,
              description: primaryOffense?.description ?? null,
            }
          : null,
      offenses: caseOffenses.map((item) => {
        const offense = offenseById.get(String(item.offense_id));

        return {
          id: toPublicId(item.id),
          personId: toPublicId(item.person_id),
          offenseId: toPublicId(item.offense_id),
          offenseName: offense?.offense_name ?? null,
          offenseCode: offense?.offense_code ?? null,
          offenseGroup: offense?.offense_group ?? null,
          legalArticle:
            item.offense_description ?? offense?.description ?? null,
          isPrimary: item.is_primary,
        };
      }),
      document: {
        id: toPublicId(generatedDocument.id),
        documentNo: documentNoText,
        documentCode: documentCodeText,
        fullDocumentCode: isBm156Template
          ? bm156DocumentFullDocumentCode
          : documentFullDocumentCode,
        documentTitle: generatedDocument.document_title,
        targetScope: generatedDocument.target_scope,
        reviewStatus: generatedDocument.review_status,
        generatedAt: formatDate(generatedDocument.generated_at),
        approvedAt: formatDate(generatedDocument.approved_at),
        issueDate: documentIssueParts.full,
        issueDay: documentIssueParts.day,
        issueMonth: documentIssueParts.month,
        issueYear: documentIssueParts.year,
        issueDateText: dateSlashText(documentIssueParts),
        issuePlaceAndDateLine,
        issuePlaceDateLine: issuePlaceAndDateLine,
      },
      caseDecision: {
        decisionNo: caseDecisionNo,
        issueDate: caseDecisionParts.full,
        issueDay: caseDecisionParts.day,
        issueMonth: caseDecisionParts.month,
        issueYear: caseDecisionParts.year,
        issueDateText: dateSlashText(caseDecisionParts),
        issuedBy: caseDecisionIssuedBy,
        legalBasisLine: isBm156Template
          ? bm156CaseDecisionLegalBasisLine
          : caseDecisionLegalBasisLine,
        caseProsecutionDecisionLine: bm070CaseProsecutionDecisionLine,
        prosecutionDecisionLegalBasisLine:
          bm103CaseDecisionProsecutionDecisionLegalBasisLine,
        prosecutionDecisionSummaryLine:
          bm103CaseDecisionProsecutionDecisionSummaryLine,
      },
      accusedDecision: {
        decisionNo: accusedDecisionNo,
        issueDate: accusedDecisionParts.full,
        issueDay: accusedDecisionParts.day,
        issueMonth: accusedDecisionParts.month,
        issueYear: accusedDecisionParts.year,
        issueDateText: dateSlashText(accusedDecisionParts),
        issuedBy: accusedDecisionIssuedBy,
        legalBasisLine: isBm156Template
          ? bm156AccusedDecisionLegalBasisLine
          : accusedDecisionLegalBasisLine,
        requestLine: accusedDecisionRequestLine,
        approvalArticle1Line: accusedDecisionApprovalArticle1Line,
        investigationRequestLine: accusedDecisionInvestigationRequestLine,
        sufficientGroundsLine: accusedDecisionSufficientGroundsLine,
        article1Line: accusedDecisionArticle1Line,
        article2Line: accusedDecisionArticle2Line,
      },
      legalBasis: {
        procedureArticlesLine,
        assignmentProcedureArticlesLine: bm070AssignmentProcedureArticlesLine,
      staffAssignmentProcedureArticlesLine:
        str(legalBasisInput.staffAssignmentProcedureArticlesLine) ??
        "Căn cứ các điều 41, 42, 43, 165 và 236 của Bộ luật Tố tụng hình sự;",

        legalEntityArticleLine,
        juvenileJusticeLine,
      },    assignment: {
      deputyChiefName: str(assignmentInput.deputyChiefName) ?? "Nguyễn Thanh Nam",
      deputyChiefTitle:
        str(assignmentInput.deputyChiefTitle) ?? "Phó Viện trưởng",
      deputyChiefAgencyName:
        str(assignmentInput.deputyChiefAgencyName) ??
        str(agencyInput.name) ??
        "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",

      assignedRoleText:
        str(assignmentInput.assignedRoleText) ??
        "Kiểm sát viên/Kiểm tra viên",
      assignedOfficerName:
        str(assignmentInput.assignedOfficerName) ?? "Nguyễn Thanh Nam",
      assignedOfficerTitle:
        str(assignmentInput.assignedOfficerTitle) ?? "Kiểm sát viên",
      assignedOfficerAgencyName:
        str(assignmentInput.assignedOfficerAgencyName) ??
        str(agencyInput.name) ??
        "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      additionalAssignedOfficersLine:
        str(assignmentInput.additionalAssignedOfficersLine) ?? "",

      responsibilityLine:
        str(assignmentInput.responsibilityLine) ??
        "thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự",
      },
      approval: {
        assessmentLine: approvalAssessmentLine,
      },
      investigation: {
        investigationUnitName,
        article2Line: accusedDecisionArticle2Line,
      },      investigationRecovery: {
        legalBasisLine: bm104InvestigationRecoveryLegalBasisLine,
      },

      investigationExtension: {
        previousDecisionLegalBasisLine:
          bm103InvestigationExtensionPreviousDecisionLegalBasisLine,
        requestRoundText: bm103InvestigationExtensionRequestRoundText,
        durationText: bm103InvestigationExtensionDurationText,
        fromDateText: bm103InvestigationExtensionFromDateText,
        toDateText: bm103InvestigationExtensionToDateText,
        reasonLine: bm104InvestigationExtensionReasonLine,
        decisionArticle1Line: bm104InvestigationExtensionDecisionArticle1Line,
        decisionArticle2Line: bm104InvestigationExtensionDecisionArticle2Line,
      },
      proposal: {
        requestingDocumentLine: bm103ProposalRequestingDocumentLine,
        proposingProcuracyName: bm103ProposalProposingProcuracyName,
      },
      measure: {
        durationText: measureDurationText,
        fromDate: measureFromParts.full,
        fromDay: measureFromParts.day,
        fromMonth: measureFromParts.month,
        fromYear: measureFromParts.year,
        fromDateText: dateSlashText(measureFromParts),
        toDate: measureToParts.full,
        toDay: measureToParts.day,
        toMonth: measureToParts.month,
        toYear: measureToParts.year,
        toDateText: dateSlashText(measureToParts),
        residencePlace: measureResidencePlace,
        article2Line: measureArticle2Line,
        orderDocumentCode: bm054PreventiveMeasureOrderCode,
        orderIssueDate: bm054PreventiveMeasureOrderIssueParts.full,
        orderIssueDateText: bm054PreventiveMeasureOrderIssueDateText,
        preventiveMeasureOrderLegalBasisLine:
          bm055PreventiveMeasureOrderLegalBasisLine,
        cancelReasonLine: bm055CancelReasonLine,
        cancellationArticle1Line: bm055CancellationArticle1Line,
        cancellationArticle2Line: bm055CancellationArticle2Line,
        exitPostponementReasonLine: bm056ExitPostponementReasonLine,
        exitPostponementArticle1Line: bm056ExitPostponementArticle1Line,
        exitPostponementArticle2Line: bm056ExitPostponementArticle2Line,
        exitPostponementDurationText: bm056ExitPostponementDurationText,
        exitPostponementFromDateText: bm056ExitPostponementFromDateText,
        exitPostponementToDateText: bm056ExitPostponementToDateText,
        immigrationAgencyName: bm056ImmigrationAgencyName,
        exitPostponementDecisionCode: bm057ExitPostponementDecisionCode,
        exitPostponementDecisionIssueDate:
          bm057ExitPostponementDecisionIssueParts.full,
        exitPostponementDecisionIssueDateText:
          bm057ExitPostponementDecisionIssueDateText,
        exitPostponementDecisionLegalBasisLine:
          bm057ExitPostponementDecisionLegalBasisLine,
        exitPostponementCancelReasonLine:
          bm057ExitPostponementCancelReasonLine,
        exitPostponementCancellationArticle1Line:
          bm057ExitPostponementCancellationArticle1Line,        exitPostponementCancellationArticle2Line:
          bm057ExitPostponementCancellationArticle2Line,
        detentionDurationText: bm058DetentionDurationText,
        detentionFromDateText: bm058DetentionFromDateText,
        detentionToDateText: bm058DetentionToDateText,
        detentionReasonLine: bm058DetentionReasonLine,
        detentionArticle1Line: bm058DetentionArticle1Line,
        detentionArticle2Line: bm058DetentionArticle2Line,
        detentionExecutionUnitName: bm058DetentionExecutionUnitName,

        detentionOrderCode: bm059DetentionOrderCode,
        detentionOrderIssueDate: bm059DetentionOrderIssueParts.full,
        detentionOrderIssueDateText: bm059DetentionOrderIssueDateText,
        detentionOrderLegalBasisLine: bm059DetentionOrderLegalBasisLine,
        prosecutionExtensionDecisionCode: bm059ProsecutionExtensionDecisionCode,
        prosecutionExtensionDecisionIssueDate:
          bm059ProsecutionExtensionDecisionIssueParts.full,
        prosecutionExtensionDecisionIssueDateText:
          bm059ProsecutionExtensionDecisionIssueDateText,
        prosecutionExtensionDecisionLegalBasisLine:
          bm059ProsecutionExtensionDecisionLegalBasisLine,
        detentionExtensionDurationText: bm059DetentionExtensionDurationText,
        detentionExtensionFromDateText: bm059DetentionExtensionFromDateText,
        detentionExtensionToDateText: bm059DetentionExtensionToDateText,
        detentionExtensionReasonLine: bm059DetentionExtensionReasonLine,
        detentionExtensionArticle1Line: bm059DetentionExtensionArticle1Line,
        detentionExtensionArticle2Line: bm059DetentionExtensionArticle2Line,},
      monitoring: {
        unitName: monitoringUnitName,
        phone: monitoringPhone,
        prosecutorName: monitoringProsecutorName,
        article3Line: monitoringArticle3Line,
      },
      notification: {
        title: bm054NotificationTitle,
        subject: bm054NotificationSubject,
        content: bm054NotificationContent,
        preventiveMeasureOrderCode: bm054PreventiveMeasureOrderCode,
        preventiveMeasureOrderIssueDate:
          bm054PreventiveMeasureOrderIssueParts.full,
        preventiveMeasureOrderIssueDateText:
          bm054PreventiveMeasureOrderIssueDateText,
        preventiveMeasureOrderLine: bm054PreventiveMeasureOrderLine,
      },
      recipients: {
        superiorProcuracyName: bm103SuperiorProcuracyName,
        courtLine: bm156CourtLine,
        accusedLine: bm156AccusedRecipientLine,
        superiorProcuracyLine: bm156SuperiorProcuracyLine,
        otherRecipientsLine: bm156OtherRecipientsLine,
        investigationAuthorityLine: bm070InvestigationAuthorityLine,
        investigatingAgencyLine: bm103InvestigatingAgencyLine,
        assignedPersonLine: bm070AssignedPersonLine,
        investigationUnitLine: recipientsInvestigationUnitLine,        detentionExecutionUnitLine: bm058DetentionExecutionUnitLine,
        immigrationUnitLine: bm056ImmigrationUnitLine,
        monitoringUnitLine:
          str(recipientsInput.monitoringUnitLine) ??
          (monitoringUnitName ? `- ${monitoringUnitName};` : null),
        personLine:
          str(recipientsInput.personLine) ??
          (personFullName ? `- ${personFullName};` : null),
        archiveLine:
          str(recipientsInput.archiveLine) ??
          (isBm001Template ? "Lưu: HSVV, VP." : "- Lưu: HSVA, HSKS, VP."),
        noteLine: str(recipientsInput.noteLine),
      },
      signature: {
        signMode: signatureSignMode,
        positionTitle: signaturePositionTitle,
        signerName: signatureSignerName,
      },
      delivery: {
        deliveredAtText: isBm059Template
          ? bm059DeliveryDeliveredAtText
          : isBm058Template
            ? bm058DeliveryDeliveredAtText
            : str(deliveryInput.deliveredAtText) ??
            "Lệnh này đã được giao cho người bị cấm đi khỏi nơi cư trú một bản vào hồi …..giờ……phút, ngày…….tháng…….năm 2026",
        receiverTitle: isBm059Template
          ? bm059DeliveryReceiverTitle
          : isBm058Template
            ? bm058DeliveryReceiverTitle
            : str(deliveryInput.receiverTitle) ?? "NGƯỜI BỊ CẤM ĐI KHỎI NƠI CƯ TRÚ",
      },
      caseJoinder: {
        legalBasisLine: bm156CaseJoinderLegalBasisLine,
      },
      caseRecovery: {
        legalBasisLine: bm156CaseRecoveryLegalBasisLine,
      },
      investigationConclusion: {
        legalBasisLine: bm156InvestigationConclusionLegalBasisLine,
      },
      prosecutionSupplementReturn: {
        returnRoundLine: bm145ReturnRoundLine,
        procedureArticlesLine: bm145ProcedureArticlesLine,
        investigationConclusionLegalBasisLine:
          bm145InvestigationConclusionLegalBasisLine,
        courtReturnDecisionLegalBasisLine:
          bm145CourtReturnDecisionLegalBasisLine,
        reasonLine: bm145ReasonLine,
        article1IntroLine: bm145Article1IntroLine,
        supplementIssue1Line: bm145SupplementIssue1Line,
        supplementIssue2Line: bm145SupplementIssue2Line,
        supplementIssue3Line: bm145SupplementIssue3Line,
        durationText: bm145SupplementDurationText,
        article2Line: bm145Article2Line,
        article3Line: bm145Article3Line,
        investigationAuthorityRecipientLine:
          bm145InvestigationAuthorityRecipientLine,
      },
      prosecutionCaseSuspension: {
        ...(((snapshot as any)?.prosecutionCaseSuspension ?? {}) as Record<string, unknown>),
        ...(((snapshot as any)?.formInputs?.prosecutionCaseSuspension ?? {}) as Record<string, unknown>),
        ...(((formInputs as any)?.prosecutionCaseSuspension ?? {}) as Record<string, unknown>),
      },
      prosecutionCaseTermination: {
        ...(((snapshot as any)?.prosecutionCaseTermination ?? {}) as Record<string, unknown>),
        ...(((snapshot as any)?.formInputs?.prosecutionCaseTermination ?? {}) as Record<string, unknown>),
        ...(((formInputs as any)?.prosecutionCaseTermination ?? {}) as Record<string, unknown>),
      },
      prosecutionExtension: {
        procedureArticlesLine: bm144ProcedureArticlesLine,
        juvenileJusticeLine: bm144JuvenileJusticeLine,
        caseDecisionLegalBasisLine: bm144CaseDecisionLegalBasisLine,
        accusedDecisionLegalBasisLine: bm144AccusedDecisionLegalBasisLine,
        investigationConclusionLegalBasisLine:
          bm144InvestigationConclusionLegalBasisLine,
        reasonLine: bm144ReasonLine,
        durationDaysText: bm144DurationDaysText,
        fromDateText: bm144FromDateText,
        toDateText: bm144ToDateText,
        article1Line: bm144Article1Line,
      },
      prosecutionTransfer: {
        procedureArticlesLine: bm141ProcedureArticlesLine,
        caseDecisionLegalBasisLine: bm141CaseDecisionLegalBasisLine,
        accusedDecisionLegalBasisLine: bm141AccusedDecisionLegalBasisLine,
        investigationConclusionLegalBasisLine:
          bm141InvestigationConclusionLegalBasisLine,
        fromProcuracyName: bm141FromProcuracyName,
        toProcuracyName: bm141ToProcuracyName,
        toProcuracyRecipientLine: bm141ToProcuracyRecipientLine,
        detentionFacilityRecipientLine: bm141DetentionFacilityRecipientLine,
        transferReasonLine: bm141TransferReasonLine,
        article1Line: bm141Article1Line,
      },
      indictment: {
        legalBasesSection: bm156LegalBasesSection,
        factFindingsSection: bm156FactFindingsSection,
        evidenceConclusionLine: bm156EvidenceConclusionLine,
        conclusionSection: bm156ConclusionSection,
        prosecutionDecisionLine: bm156ProsecutionDecisionLine,
        replacementLine: bm156ReplacementLine,
      },
      attachments: {
        caseFileLine: bm156CaseFileLine,
        evidenceListLine: bm156EvidenceListLine,
        courtSummonsListLine: bm156CourtSummonsListLine,
      },
      reception: {
        startedAtTimeText: bm001StartedAtTimeText,
        startedAtDay:
          nonEmptyText(receptionInput.startedAtDay) ??
          bm001ReceptionStartedParts.day ??
          documentIssueParts.day,
        startedAtMonth:
          nonEmptyText(receptionInput.startedAtMonth) ??
          bm001ReceptionStartedParts.month ??
          documentIssueParts.month,
        startedAtYear:
          nonEmptyText(receptionInput.startedAtYear) ??
          bm001ReceptionStartedParts.year ??
          documentIssueParts.year,
        locationName: bm001ReceptionLocationName,
        endedAtTimeText: bm001EndedAtTimeText,
        endedAtDay:
          nonEmptyText(receptionInput.endedAtDay) ??
          bm001ReceptionEndedParts.day ??
          documentIssueParts.day,
        endedAtMonth:
          nonEmptyText(receptionInput.endedAtMonth) ??
          bm001ReceptionEndedParts.month ??
          documentIssueParts.month,
        endedAtYear:
          nonEmptyText(receptionInput.endedAtYear) ??
          bm001ReceptionEndedParts.year ??
          documentIssueParts.year,
      },
      receiver: {
        fullName: bm001ReceiverFullName,
        positionTitle: bm001ReceiverPositionTitle,
        departmentName: bm001ReceiverDepartmentName,
        signerName: bm001ReceiverSignerName,
      },
      informant: {
        fullName: bm001InformantFullName,
        genderLabel: bm001InformantGenderLabel,
        otherName: bm001InformantOtherName,
        birthDay: bm001InformantBirthDay,
        birthMonth: bm001InformantBirthMonth,
        birthYear: bm001InformantBirthYear,
        placeOfBirth: bm001InformantPlaceOfBirth,
        nationality: bm001InformantNationality,
        ethnicity: bm001InformantEthnicity,
        religion: bm001InformantReligion,
        occupation: bm001InformantOccupation,
        identityNo: bm001InformantIdentityNo,
        identityIssuedDay:
          nonEmptyText(informantInput.identityIssuedDay) ??
          bm001InformantIdentityIssuedParts.day,
        identityIssuedMonth:
          nonEmptyText(informantInput.identityIssuedMonth) ??
          bm001InformantIdentityIssuedParts.month,
        identityIssuedYear:
          nonEmptyText(informantInput.identityIssuedYear) ??
          bm001InformantIdentityIssuedParts.year,
        identityIssuedPlace: bm001InformantIdentityIssuedPlace,
        permanentAddress: bm001InformantPermanentAddress,
        temporaryAddress: bm001InformantTemporaryAddress,
        currentAddress: bm001InformantCurrentAddress,
        phone: bm001InformantPhone,
        representedOrganization: bm001InformantRepresentedOrganization,
        signerName: bm001InformantSignerName,
      },
      crimeReport: {
        content: bm001CrimeReportContent,
        attachedItemsDescription: bm001CrimeReportAttachedItemsDescription,
      },
      template: {
        id: toPublicId(template.id),
        templateCode: template.template_code,
        templateNo: template.template_no,
        templateName: template.template_name,
        renderScope: template.render_scope,
        outputStrategy: template.output_strategy,
      },
      agency: {
        parentName: agencyParentName,
        name: agencyName,
        shortName: agencyShortName,
        issuePlace: documentIssuePlace,
        phone: agencyPhone,
        monitoringUnitName,
      },
      official: {
        fullName:
          nonEmptyText(officialInput.fullName) ?? "Nguyễn Thanh Nam",
        positionTitle: str(officialInput.positionTitle) ?? "VIỆN TRƯỞNG",
        issuerTitle: officialIssuerTitle,
        prosecutorName:
          nonEmptyText(officialInput.prosecutorName) ?? "Nguyễn Thanh Nam",
      },
    };

    return this.applyTemplateSpecificPayloadOverrides(payload);
  }

  async renderDocx(documentIdRaw: string, dto: RenderGeneratedDocumentDto) {
    const documentId = parseBigIntId(documentIdRaw, "documentId");
    const renderLockKey = String(documentId);

    if (DocumentRendererService.renderLocks.has(renderLockKey)) {
      throw new BadRequestException(
        "Biểu mẫu này đang được render. Vui lòng đợi render hiện tại hoàn tất rồi thử lại.",
      );
    }

    DocumentRendererService.renderLocks.add(renderLockKey);

    try {
      const generatedDocument =
        await this.prisma.generated_documents.findUnique({
          where: {
            id: documentId,
          },
        });

      if (!generatedDocument) {
        throw new NotFoundException(
          "Không tìm thấy biểu mẫu đã tạo.",
        );
      }

      if (generatedDocument.review_status === "CANCELLED") {
        throw new BadRequestException(
          "Biểu mẫu đã bị hủy, không thể render.",
        );
      }

      const template = await this.prisma.templates.findUnique({
        where: {
          id: generatedDocument.template_id,
        },
      });

      if (!template) {
        throw new NotFoundException(
          "Không tìm thấy template.",
        );
      }

      const templateVersion = await this.prisma.template_versions.findFirst({
        where: {
          template_id: template.id,
          is_default: true,
          is_active: true,
        },
        orderBy: {
          version_no: "desc",
        },
      });

      if (!templateVersion) {
        throw new BadRequestException(
          "Template chưa có version mặc định.",
        );
      }

      if (!templateVersion.normalized_docx_path) {
        throw new BadRequestException(
          "Template version chưa có normalized_docx_path.",
        );
      }

      const normalizedPath = this.resolveProjectPath(
        String(templateVersion.normalized_docx_path),
      );

      if (!fs.existsSync(normalizedPath)) {
        throw new BadRequestException(
          `Không tìm thấy file .docx template: ${normalizedPath}`,
        );
      }

      const existingFile = await this.prisma.generated_document_files.findFirst(
        {
          where: {
            generated_document_id: generatedDocument.id,
            file_format: "DOCX",
            is_final: false,
          },
          orderBy: {
            id: "desc",
          },
        },
      );

      if (existingFile && !dto.force) {
        return {
          skipped: true,
          message:
            "Biểu mẫu đã có file DOCX. Truyền force=true để render lại.",
          file: {
            id: toPublicId(existingFile.id),
            fileName: existingFile.file_name,
            filePath: existingFile.file_path,
            fileFormat: existingFile.file_format,
            fileSizeBytes: String(existingFile.file_size_bytes),
          },
        };
      }

      const payload = await this.getRenderPayload(documentIdRaw);
      const renderedBuffer = this.renderDocxBuffer(normalizedPath, payload);

      const existingDocxFileCount =
        await this.prisma.generated_document_files.count({
          where: {
            generated_document_id: generatedDocument.id,
            file_format: "DOCX",
          },
        });

      const renderNo = existingDocxFileCount + 1;
      const renderVersionForFile = formatRenderNo(renderNo);
      const timestampForFile = buildTimestampForFileName();

      const nonBlank = (value: unknown, fallback: string): string => {
        const textValue = str(value)?.trim();

        return textValue && textValue.length > 0 ? textValue : fallback;
      };

      const templateCodeForFile = nonBlank(
        payload.template?.templateCode ?? template.template_code,
        "BM",
      );

      const templateNameForFile = nonBlank(
        payload.template?.templateName ?? template.template_name,
        "Bieu-mau",
      );

      const caseCodeForFile = nonBlank(
        payload.case?.caseCode,
        `CASE-${generatedDocument.case_id}`,
      );

      const personNameForFile =
        payload.document?.targetScope === "CASE_LEVEL"
          ? "Ho-so"
          : nonBlank(payload.person?.fullName, "Nguoi-lien-quan");

      const renderDocumentTitle = [
        templateCodeForFile,
        templateNameForFile,
        caseCodeForFile,
        personNameForFile,
        renderVersionForFile,
      ]
        .filter(Boolean)
        .join(" - ");

      const fileBaseName = [
        templateCodeForFile,
        safeFileName(templateNameForFile),
        safeFileName(caseCodeForFile),
        safeFileName(personNameForFile),
        renderVersionForFile,
        timestampForFile,
      ]
        .filter(Boolean)
        .join("_");

      const outputFileName = `${fileBaseName}.docx`;

      const outputDir = path.join(
        this.getProjectRoot(),
        "storage",
        "generated",
        "cases",
        safeFileName(caseCodeForFile),
        "docx",
      );

      fs.mkdirSync(outputDir, {
        recursive: true,
      });

      const outputPath = path.join(outputDir, outputFileName);

      fs.writeFileSync(outputPath, renderedBuffer);

      const relativePath = this.toProjectRelativePath(outputPath);
      const checksum = this.sha256(outputPath);
      const fileSizeBytes = fs.statSync(outputPath).size;

      const result = await this.runWithDeadlockRetry(
        () =>
          this.prisma.$transaction(async (tx) => {
            const storedFile = await tx.stored_files.create({
              data: {
                file_category: "GENERATED_DOCX",
                original_file_name: outputFileName,
                stored_file_name: outputFileName,
                file_ext: "docx",
                mime_type:
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                file_size_bytes: BigInt(fileSizeBytes),
                relative_path: relativePath,
                absolute_path: outputPath,
                checksum,
                related_entity_type: "generated_documents",
                related_entity_id: generatedDocument.id,
                created_by_name:
                  dto.renderedByName ||
                  generatedDocument.generated_by_name ||
                  null,
              },
            });

            const generatedFile = await tx.generated_document_files.create({
              data: {
                generated_document_id: generatedDocument.id,
                stored_file_id: storedFile.id,
                file_format: "DOCX",
                file_name: outputFileName,
                file_path: relativePath,
                file_size_bytes: BigInt(fileSizeBytes),
                checksum,
                is_final: false,
              },
            });

            const stableDocumentTitle = [
              templateCodeForFile,
              templateNameForFile,
              caseCodeForFile,
              personNameForFile,
            ]
              .filter(Boolean)
              .join(" - ");

            await tx.generated_documents.update({
              where: {
                id: generatedDocument.id,
              },
              data: {
                document_title: stableDocumentTitle,
                validation_result: {
                  status: "RENDERED_DOCX_READY",
                  renderedAt: new Date().toISOString(),
                  renderedByName: dto.renderedByName ?? null,
                  outputFilePath: relativePath,
                  checksum,
                  renderVersion: renderVersionForFile,
                  renderedDocumentTitle: renderDocumentTitle,
                } as any,
              },
            });

            await tx.case_events.create({
              data: {
                case_id: generatedDocument.case_id,
                event_type: "DOCUMENT_DOCX_RENDERED",
                event_title: "Render file DOCX",
                event_description: `Đã render DOCX cho biểu mẫu "${generatedDocument.document_title}".`,
                stage_code: null,
                status_before: generatedDocument.review_status,
                status_after: generatedDocument.review_status,
                created_by_name: dto.renderedByName || null,
              },
            });

            return {
              storedFile,
              generatedFile,
            };
          }),
        "renderDocx transaction",
      );

      return {
        skipped: false,
        documentId: toPublicId(generatedDocument.id),
        templateCode: template.template_code,
        documentTitle: renderDocumentTitle,
        payload,
        file: {
          id: toPublicId(result.generatedFile.id),
          storedFileId: toPublicId(result.storedFile.id),
          fileFormat: result.generatedFile.file_format,
          fileName: result.generatedFile.file_name,
          filePath: result.generatedFile.file_path,
          fileSizeBytes: String(result.generatedFile.file_size_bytes),
          checksum: result.generatedFile.checksum,
          isFinal: result.generatedFile.is_final,
        },
      };
    } finally {
      DocumentRendererService.renderLocks.delete(renderLockKey);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isDeadlockError(error: any): boolean {
    return (
      error?.code === "P2034" ||
      error?.meta?.driverAdapterError?.cause?.originalCode === "1213" ||
      String(error?.message || "").includes("deadlock") ||
      String(error?.message || "").includes("write conflict")
    );
  }

  private async runWithDeadlockRetry<T>(
    operation: () => Promise<T>,
    label: string,
    maxAttempts = 3,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (!this.isDeadlockError(error) || attempt === maxAttempts) {
          throw error;
        }

        const delayMs = 150 * attempt;
        console.warn(
          `[DB_RETRY] ${label} gặp deadlock/write-conflict. Retry ${attempt}/${maxAttempts} sau ${delayMs}ms`,
        );

        await this.sleep(delayMs);
      }
    }

    throw lastError;
  }
    private renderDocxBuffer(templatePath: string, payload: unknown): Buffer {
    try {
      const binary = fs.readFileSync(templatePath, "binary");
      const zip = new PizZip(binary);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: "{{",
          end: "}}",
        },
        parser: (tag: string) => ({
          get: (scope: Record<string, unknown>) =>
            resolveTemplateValue(scope, tag),
        }),
        nullGetter: () => "",
      });

      doc.render(payload as Record<string, unknown>);

      const renderedZip = doc.getZip();

      // Fallback quan trọng:
      // Một số template Word/WPS giữ placeholder theo kiểu Docxtemplater không bắt được.
      // Nếu sau doc.render() XML vẫn còn {{...}}, thay tiếp trực tiếp bằng payload.
      this.replaceRemainingTemplateTagsInZip(
        renderedZip,
        payload as Record<string, unknown>,
      );

      return renderedZip.generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });
    } catch (error: any) {
      const detail =
        error?.properties?.errors
          ?.map((item: any) => {
            return [
              item?.properties?.id,
              item?.properties?.explanation,
              item?.properties?.xtag,
              item?.properties?.context,
              item?.message,
            ]
              .filter(Boolean)
              .join(" | ");
          })
          ?.filter(Boolean)
          ?.join(" || ") ||
        error?.properties?.explanation ||
        error?.properties?.id ||
        error?.message ||
        String(error);

      console.error("[DOCX_RENDER_ERROR]", detail);

      throw new BadRequestException(
        `Render DOCX lỗi. Kiểm tra placeholder trong file Word: ${detail}`,
      );
    }
  }


  private replaceRemainingTemplateTagsInZip(
    zip: PizZip,
    payload: Record<string, unknown>,
  ): void {
    const zipAny = zip as any;
    const files = zipAny.files as Record<string, any>;

    if (!files) {
      return;
    }

    for (const fileName of Object.keys(files)) {
      if (!fileName.endsWith(".xml")) {
        continue;
      }

      const file = zip.file(fileName);

      if (!file) {
        continue;
      }

      const xml = file.asText();

      if (!xml.includes("{{")) {
        continue;
      }

      const replacedXml = xml.replace(
        /\{\{\s*([^{}]+?)\s*\}\}/gu,
        (_match: string, rawTag: string) => {
          const tag = String(rawTag ?? "").trim();
          const value = resolveTemplateValue(payload, tag);

          if (value === null || value === undefined) {
            return "";
          }

          return this.escapeXmlText(String(value));
        },
      );

      if (replacedXml !== xml) {
        zip.file(fileName, replacedXml);
      }
    }
  }

  private escapeXmlText(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  private getProjectRoot(): string {
    return path.resolve(process.cwd(), "..", "..");
  }

  private resolveProjectPath(storedPath: string): string {
    if (path.isAbsolute(storedPath)) {
      return storedPath;
    }

    return path.resolve(this.getProjectRoot(), storedPath);
  }

  private toProjectRelativePath(fullPath: string): string {
    return path.relative(this.getProjectRoot(), fullPath).replace(/\\/g, "/");
  }

  private sha256(filePath: string): string {
    return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  }

      private applyTemplateSpecificPayloadOverrides<TPayload extends Record<string, any>>(payload: TPayload): TPayload {
    if (!payload || typeof payload !== "object") {
      return payload;
    }

    const target = payload as Record<string, any>;
    const template = (target["template"] ?? {}) as Record<string, any>;
    const templateCode = String(template["templateCode"] ?? "");

    if (templateCode === "BM-001") {
      const localAgencyNameBody = "Viện kiểm sát nhân dân khu vực 7";
      const parentAgencyNameBody = "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh";

      const localAgencyNameHeader = "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7";
      const parentAgencyNameHeader = "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH";

      const originalPerson = (target["person"] ?? {}) as Record<string, any>;

      target["person"] = {
        ...originalPerson,
        fullName: "Đoàn Văn Dũng",
      };

      const person = target["person"] as Record<string, any>;
      const informant = (target["informant"] ?? {}) as Record<string, any>;

      // QUAN TRỌNG:
      // Template header BM-001 hiện vẫn có thể đang dùng {{agency.parentName}} và {{agency.name}}.
      // Vì vậy agency.parentName/name phải để FULL CAPS cho header.
      // Body tuyệt đối không dùng agency.name nữa, dùng reception.locationName / receiver.departmentName.
      target["agency"] = {
        ...((target["agency"] ?? {}) as Record<string, any>),

        parentName: parentAgencyNameHeader,
        name: localAgencyNameHeader,

        parentNameHeader: parentAgencyNameHeader,
        nameHeader: localAgencyNameHeader,

        parentNameBody: parentAgencyNameBody,
        nameBody: localAgencyNameBody,
      };

      target["reception"] = {
        ...((target["reception"] ?? {}) as Record<string, any>),
        locationName: localAgencyNameBody,
      };

      target["receiver"] = {
        ...((target["receiver"] ?? {}) as Record<string, any>),
        fullName: "Nguyễn Thị Hồng Hạnh",
        positionTitle: "Kiểm sát viên",
        departmentName: localAgencyNameBody,
        signerName: "Trần Thanh Nam",
      };

      target["informant"] = {
        ...informant,
        fullName: "Đoàn Văn Dũng",
        genderLabel: person["genderLabel"] || "Nam",
        otherName: person["otherName"] || "Không có",
        birthDay: person["birthDay"] || "08",
        birthMonth: person["birthMonth"] || "09",
        birthYear: person["birthYear"] || "1985",
        placeOfBirth: person["placeOfBirth"] || "tỉnh Quảng Ngãi",
        nationality: person["nationality"] || "Việt Nam",
        ethnicity: person["ethnicity"] || "Kinh",
        religion: person["religion"] || "Không",
        occupation: person["occupation"] || "Kinh doanh",
        identityNo: person["identityNo"] || "",
        identityIssuedDay: person["identityIssuedDay"] || "",
        identityIssuedMonth: person["identityIssuedMonth"] || "",
        identityIssuedYear: person["identityIssuedYear"] || "",
        identityIssuedPlace: person["identityIssuedPlace"] || "",
        permanentAddress: person["permanentAddress"] || "",
        temporaryAddress: person["temporaryAddress"] || "",
        currentAddress: person["currentAddress"] || "",
        phone: informant["phone"] || "",
        representedOrganization: informant["representedOrganization"] || "Không",
        signerName: "Nguyễn Thị Hồng Hạnh",
      };

      const accused = (target["accused"] ?? {}) as Record<string, any>;
      target["accused"] = {
        ...accused,
        fullName: accused["fullName"] || "Đoàn Văn Dũng",
      };

      const suspect = (target["suspect"] ?? {}) as Record<string, any>;
      target["suspect"] = {
        ...suspect,
        fullName: suspect["fullName"] || "Đoàn Văn Dũng",
      };

      const defendant = (target["defendant"] ?? {}) as Record<string, any>;
      target["defendant"] = {
        ...defendant,
        fullName: defendant["fullName"] || "Đoàn Văn Dũng",
      };

      target["signature"] = {
        ...((target["signature"] ?? {}) as Record<string, any>),
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName: "Trần Thanh Nam",
      };

      target["official"] = {
        ...((target["official"] ?? {}) as Record<string, any>),
        fullName: "Trần Thanh Nam",
        prosecutorName: "Nguyễn Thị Hồng Hạnh",
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      };

      target["monitoring"] = {
        ...((target["monitoring"] ?? {}) as Record<string, any>),
        prosecutorName: "Nguyễn Thị Hồng Hạnh",
      };
    }

    this.scrubForbiddenTemplateDefaults(target, templateCode);

    return payload;
  }

      private scrubForbiddenTemplateDefaults(
    value: unknown,
    templateCode: string,
    currentPath = "payload",
  ): unknown {
    const sanitizeText = (input: string, pathName: string): string => {
      let nextValue = input;

      nextValue = nextValue.replace(/\bHuy\b/gu, "Nguyễn Thị Hồng Hạnh");
      nextValue = nextValue.replace(/Nguyễn\s+Thanh\s+Nam/gu, "Trần Thanh Nam");

      if (templateCode === "BM-001") {
        const isAgencyHeaderPath =
          pathName === "payload.agency.parentName" ||
          pathName === "payload.agency.name" ||
          pathName === "payload.agency.parentNameHeader" ||
          pathName === "payload.agency.nameHeader" ||
          pathName === "payload.official.issuerTitle";

        if (!isAgencyHeaderPath) {
          nextValue = nextValue
            .replace(
              /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+KHU[\s\u00A0]+VỰC[\s\u00A0]+7/gu,
              "Viện kiểm sát nhân dân khu vực 7",
            )
            .replace(
              /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+THÀNH[\s\u00A0]+PHỐ[\s\u00A0]+HỒ[\s\u00A0]+CHÍ[\s\u00A0]+MINH/gu,
              "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
            );
        }
      }

      return nextValue;
    };

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      return sanitizeText(value, currentPath);
    }

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        value[index] = this.scrubForbiddenTemplateDefaults(
          value[index],
          templateCode,
          `${currentPath}[${index}]`,
        );
      }

      return value;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;

      for (const key of Object.keys(record)) {
        record[key] = this.scrubForbiddenTemplateDefaults(
          record[key],
          templateCode,
          `${currentPath}.${key}`,
        );
      }

      return record;
    }

    return value;
  }
}




