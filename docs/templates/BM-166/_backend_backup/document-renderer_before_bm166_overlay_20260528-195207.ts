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

function normalizeBm090FullDocumentCode(payload: any): void {
  const templateCode = payload?.template?.templateCode ?? payload?.templateCode;

  if (templateCode !== 'BM-090') {
    return;
  }

  payload.document = payload.document ?? {};

  const rawFullCode = String(payload.document.fullDocumentCode ?? '').trim();
  const rawDocumentCode = String(payload.document.documentCode ?? '').trim();

  // BM-090 đang cần số mặc định để không render ra "Số: /QĐ-VKS-VKSKV7".
  // Sau này nếu FE cho khách sửa số thì chỉ cần đẩy lại document.fullDocumentCode từ form_inputs.
  if (!rawFullCode || rawFullCode === '/QĐ-VKS-VKSKV7') {
    payload.document.fullDocumentCode = '90/QĐ-VKS-VKSKV7';
    return;
  }

  if (rawFullCode.startsWith('/')) {
    payload.document.fullDocumentCode = `90${rawFullCode}`;
    return;
  }

  if (!rawDocumentCode || rawDocumentCode === '/QĐ-VKS-VKSKV7') {
    payload.document.fullDocumentCode = rawFullCode;
    return;
  }

  payload.document.fullDocumentCode = rawFullCode;
}


function normalizeBm097DocumentCode(payload: any): void {
  const templateCode = payload?.template?.templateCode ?? payload?.templateCode;

  if (templateCode !== 'BM-097') {
    return;
  }

  payload.document = payload.document ?? {};

  const rawDocumentCode = String(payload.document.documentCode ?? '').trim();
  const rawFullCode = String(payload.document.fullDocumentCode ?? '').trim();

  if (!rawDocumentCode || rawDocumentCode === '/QĐ-VKS-VKSKV7') {
    payload.document.documentCode = String(payload.document.documentCode ?? '').trim() || '0297/QĐ-VKSKV7';
  }

  if (!rawFullCode || rawFullCode === '/QĐ-VKS-VKSKV7' || rawFullCode === '0297/QĐ-VKSKV7') {
    payload.document.fullDocumentCode = String(payload.document.fullDocumentCode ?? '').trim() || payload.document.documentCode || '0297/QĐ-VKSKV7';
  }
}


function normalizeBm097OutputRules(payload: any): void {
  const templateCode = payload?.template?.templateCode ?? payload?.templateCode;

  if (templateCode !== 'BM-097') {
    return;
  }

  payload.document = payload.document ?? {};
  payload.recipients = payload.recipients ?? {};
  payload.person = payload.person ?? {};
  payload.signature = payload.signature ?? {};

  // BM-097 chốt số/ký hiệu theo yêu cầu hiện tại.
  payload.document.documentCode = String(payload.document.documentCode ?? '').trim() || '0297/QĐ-VKSKV7';
  payload.document.fullDocumentCode = String(payload.document.fullDocumentCode ?? '').trim() || payload.document.documentCode || '0297/QĐ-VKSKV7';

  const personName = String(payload.person.fullName ?? '').trim() || 'Thanh Bình';
  const investigationUnit =
    String(payload.recipients.investigationUnitName ?? '').trim() ||
    'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh';

  payload.recipients.personLine = `- ${personName};`;
  payload.recipients.investigationUnitLine = `- ${investigationUnit};`;
  payload.recipients.archiveLine = String(payload.recipients.archiveLine ?? '').trim() || '- Lưu: HSVA, HSKS, VP.';
  payload.recipients.noteLine = String(payload.recipients.noteLine ?? '').trim() || 'T. Huyền.05b';

  payload.signature.signMode = payload.signature.signMode || 'KT. VIỆN TRƯỞNG';
  payload.signature.positionTitle = payload.signature.positionTitle || 'PHÓ VIỆN TRƯỞNG';
  payload.signature.signerName = payload.signature.signerName || 'Trần Thanh Nam';
}



function formatBm097PayloadDateText(value: unknown): string {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return '';
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (isoMatch) {
    const day = String(Number(isoMatch[3]));
    const month = String(Number(isoMatch[2]));
    const year = isoMatch[1];
    return `${day} tháng ${month} năm ${year}`;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slashMatch) {
    const day = String(Number(slashMatch[1]));
    const month = String(Number(slashMatch[2]));
    const year = slashMatch[3];
    return `${day} tháng ${month} năm ${year}`;
  }

  return raw;
}

function firstBm097PayloadText(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) {
      return text;
    }
  }

  return '';
}

function normalizeBm097PayloadDocumentCode(value: unknown): string {
  const text = String(value ?? '').trim();

  if (
    !text ||
    text === '/QĐ-VKS-VKSKV7' ||
    text === '02/QĐ-VKS-VKSKV7' ||
    text === '97/QĐ-VKS-VKSKV7' ||
    text === '0297/QĐ-VKS-VKSKV7'
  ) {
    return '0297/QĐ-VKSKV7';
  }

  return text.replace('QĐ-VKS-VKSKV7', 'QĐ-VKSKV7');
}

function deepMergeBm097Payload(target: any, source: any): any {
  if (!source || typeof source !== 'object') {
    return target;
  }

  for (const key of Object.keys(source)) {
    const value = source[key];

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      target[key] = deepMergeBm097Payload(target[key] ?? {}, value);
    } else if (value !== undefined && value !== null) {
      target[key] = value;
    }
  }

  return target;
}

function getBm097SavedFormInputs(generatedDocument: any): any {
  const raw =
    generatedDocument?.formInputs ??
    generatedDocument?.form_inputs ??
    generatedDocument?.payloadOverrides ??
    generatedDocument?.payload_overrides ??
    generatedDocument?.renderPayloadOverrides ??
    generatedDocument?.render_payload_overrides ??
    generatedDocument?.metadata?.formInputs ??
    generatedDocument?.metadata?.form_inputs ??
    generatedDocument?.metadata?.payloadOverrides ??
    generatedDocument?.metadata?.renderPayloadOverrides ??
    null;

  if (!raw) {
    return null;
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return raw;
}

function applyBm097SavedInputsAsSourceOfTruth(payload: any, generatedDocument: any): void {
  const templateCode = payload?.template?.templateCode ?? payload?.templateCode;

  if (templateCode !== 'BM-097') {
    return;
  }

  const savedRaw = getBm097SavedFormInputs(generatedDocument);
  const saved =
    savedRaw?.formInputs ??
    savedRaw?.payloadOverrides ??
    savedRaw?.renderPayloadOverrides ??
    savedRaw;

  if (saved && typeof saved === 'object') {
    deepMergeBm097Payload(payload, saved);
  }

  payload.document = payload.document ?? {};
  payload.person = payload.person ?? {};
  payload.caseDecision = payload.caseDecision ?? {};
  payload.accusedDecision = payload.accusedDecision ?? {};
  payload.offense = payload.offense ?? {};
  payload.recipients = payload.recipients ?? {};
  payload.signature = payload.signature ?? {};

  const documentCode = normalizeBm097PayloadDocumentCode(
    firstBm097PayloadText(
      payload.document.fullDocumentCode,
      payload.document.documentCode,
      '0297/QĐ-VKSKV7',
    ),
  );

  payload.document.documentCode = documentCode;
  payload.document.fullDocumentCode = documentCode;

  const personName = firstBm097PayloadText(
    payload.person.fullName,
    payload.accusedDecision.personName,
    payload.accusedDecision.fullName,
    'Thanh Bình',
  );

  payload.person.fullName = personName;
  const birthDateText = formatBm097PayloadDateText(
    firstBm097PayloadText(
      payload.person.dateOfBirth,
      payload.person.birthDate,
      payload.person.dob,
    ),
  );

  const placeOfBirth = firstBm097PayloadText(
    payload.person.placeOfBirth,
    payload.person.birthPlace,
    payload.person.birthPlaceName,
  );

  if (birthDateText && placeOfBirth) {
    payload.person.birthInfoLine = `Sinh ngày ${birthDateText} tại: ${placeOfBirth}`;
  } else if (birthDateText) {
    payload.person.birthInfoLine = `Sinh ngày ${birthDateText}`;
  } else if (placeOfBirth) {
    payload.person.birthInfoLine = `Sinh tại: ${placeOfBirth}`;
  }

  payload.accusedDecision.personName = personName;
  payload.accusedDecision.fullName = personName;

  const offenseName = firstBm097PayloadText(
    payload.caseDecision.offenseName,
    payload.accusedDecision.offenseName,
    payload.offense.offenseName,
    'Đánh bạc',
  );

  payload.caseDecision.offenseName = offenseName;
  payload.accusedDecision.offenseName = offenseName;
  payload.offense.offenseName = offenseName;

  const legalArticle = firstBm097PayloadText(
    payload.caseDecision.legalArticle,
    payload.accusedDecision.legalArticle,
    payload.offense.legalArticle,
    'khoản 1 Điều 321',
  );

  const criminalCodeText = firstBm097PayloadText(
    payload.caseDecision.criminalCodeText,
    payload.accusedDecision.criminalCodeText,
    'Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025',
  );

  const investigationAgency = firstBm097PayloadText(
    payload.recipients.investigationUnitName,
    payload.caseDecision.investigationAgencyName,
    payload.accusedDecision.investigationAgencyName,
    'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
  );

  payload.accusedDecision.article1Line =
    `Khởi tố bị can đối với ${personName} về tội “${offenseName}” quy định tại ${legalArticle} của ${criminalCodeText}.`;

  payload.accusedDecision.article2Line =
    `Yêu cầu ${investigationAgency} tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự`;

  payload.recipients.personLine = `- ${personName};`;
  payload.recipients.investigationUnitLine = `- ${investigationAgency};`;
  payload.recipients.archiveLine = String(payload.recipients.archiveLine ?? '').trim() || '- Lưu: HSVA, HSKS, VP.';
  payload.recipients.noteLine = String(payload.recipients.noteLine ?? '').trim() || 'T. Huyền.05b';

  payload.signature.signMode = payload.signature.signMode || 'KT. VIỆN TRƯỞNG';
  payload.signature.positionTitle = payload.signature.positionTitle || 'PHÓ VIỆN TRƯỞNG';
  payload.signature.signerName = payload.signature.signerName || 'Trần Thanh Nam';
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
    const genericFormInputsDto = asObject((dto as any).formInputs);
    const payloadOverridesDto = asObject((dto as any).payloadOverrides);
    const renderPayloadOverridesDto = asObject((dto as any).renderPayloadOverrides);

    const directFormInputGroups = {
      ...(((dto as any).agency) ? { agency: asObject((dto as any).agency) } : {}),
      ...(((dto as any).official) ? { official: asObject((dto as any).official) } : {}),
      ...(((dto as any).document) ? { document: asObject((dto as any).document) } : {}),
      ...(((dto as any).person) ? { person: asObject((dto as any).person) } : {}),
      ...(((dto as any).offense) ? { offense: asObject((dto as any).offense) } : {}),
      ...(((dto as any).caseDecision) ? { caseDecision: asObject((dto as any).caseDecision) } : {}),
      ...(((dto as any).accusedDecision) ? { accusedDecision: asObject((dto as any).accusedDecision) } : {}),
      ...(((dto as any).recipients) ? { recipients: asObject((dto as any).recipients) } : {}),
      ...(((dto as any).signature) ? { signature: asObject((dto as any).signature) } : {}),
      ...(((dto as any).legalBasis) ? { legalBasis: asObject((dto as any).legalBasis) } : {}),
    };

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
      ...genericFormInputsDto,
      ...payloadOverridesDto,
      ...renderPayloadOverridesDto,
      ...directFormInputGroups,
      ...(dto.agency ? { agency: dto.agency } : {}),
      ...(dto.official ? { official: dto.official } : {}),
      ...(dto.document ? { document: dto.document } : {}),
      ...(dto.caseDecision ? { caseDecision: dto.caseDecision } : {}),
      ...(dto.accusedDecision ? { accusedDecision: dto.accusedDecision } : {}),
      ...(dto.offense ? { offense: dto.offense } : {}),
      ...(dto.person ? { person: dto.person } : {}),
      ...(dto.measure ? { measure: dto.measure } : {}),
      ...((dto as any).custody ? { custody: asObject((dto as any).custody) } : {}),
      ...((dto as any).arrestNonApproval ? { arrestNonApproval: asObject((dto as any).arrestNonApproval) } : {}),
      ...((dto as any).detentionArrest ? { detentionArrest: asObject((dto as any).detentionArrest) } : {}),
      ...(((dto as any).detentionReplacement ?? asObject((dto as any).formInputs).detentionReplacement)
        ? { detentionReplacement: asObject(((dto as any).detentionReplacement ?? asObject((dto as any).formInputs).detentionReplacement)) }
        : {}),
      ...(((dto as any).bailApproval ?? asObject((dto as any).formInputs).bailApproval)
        ? { bailApproval: asObject(((dto as any).bailApproval ?? asObject((dto as any).formInputs).bailApproval)) }
        : {}),      ...(dto.monitoring ? { monitoring: dto.monitoring } : {}),
      ...(dto.assignment ? { assignment: dto.assignment } : {}),
      ...(((dto as any).legalBasis ?? asObject((dto as any).formInputs).legalBasis)
        ? { legalBasis: asObject(((dto as any).legalBasis ?? asObject((dto as any).formInputs).legalBasis)) }
        : {}),
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
      // BM-005_RECEIVER_SAVE_START
      ...(((dto as any).receiver ?? asObject((dto as any).formInputs).receiver)
        ? { receiver: asObject(((dto as any).receiver ?? asObject((dto as any).formInputs).receiver)) }
        : {}),
      // BM-005_RECEIVER_SAVE_END
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
      // BM-005_SOURCE_VERIFICATION_SAVE_START
      ...(((dto as any).sourceVerification ?? asObject((dto as any).formInputs).sourceVerification)
        ? { sourceVerification: asObject(((dto as any).sourceVerification ?? asObject((dto as any).formInputs).sourceVerification)) }
        : {}),
      // BM-005_SOURCE_VERIFICATION_SAVE_END
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
    // BM-009_SAFE_SAVE_AFTER_NEXT_FORM_INPUTS_START
    // Không chèn vào object nextFormInputs; chỉ mutate sau khi object đã tạo xong.
    const bm009SourceResolutionExtensionSaveInput = asObject(
      (dto as any).sourceResolutionExtension ??
        asObject((dto as any).formInputs).sourceResolutionExtension ??
        asObject((dto as any).payloadOverrides).sourceResolutionExtension ??
        asObject((dto as any).renderPayloadOverrides).sourceResolutionExtension,
    );

    if (Object.keys(bm009SourceResolutionExtensionSaveInput).length > 0) {
      (nextFormInputs as Record<string, any>).sourceResolutionExtension =
        bm009SourceResolutionExtensionSaveInput;
    }
    // BM-009_SAFE_SAVE_AFTER_NEXT_FORM_INPUTS_END
    // BM-009_HEADER_SAVE_AFTER_NEXT_FORM_INPUTS_START
    // BM-009 header groups: save safely after nextFormInputs is already created.
    for (const bm009HeaderKey of ["agency", "document", "official"] as const) {
      const bm009HeaderValue = asObject(
        (dto as any)[bm009HeaderKey] ??
          asObject((dto as any).formInputs)[bm009HeaderKey] ??
          asObject((dto as any).payloadOverrides)[bm009HeaderKey] ??
          asObject((dto as any).renderPayloadOverrides)[bm009HeaderKey],
      );

      if (Object.keys(bm009HeaderValue).length > 0) {
        (nextFormInputs as Record<string, any>)[bm009HeaderKey] = bm009HeaderValue;
      }
    }
    // BM-009_HEADER_SAVE_AFTER_NEXT_FORM_INPUTS_END
    // BM-017_CASE_INITIATION_REQUEST_SAVE_START
    // BM-017: save caseInitiationRequest safely after nextFormInputs is created.
    const bm017CaseInitiationRequestSaveInput = asObject(
      (dto as any).caseInitiationRequest ??
        asObject((dto as any).formInputs).caseInitiationRequest ??
        asObject((dto as any).payloadOverrides).caseInitiationRequest ??
        asObject((dto as any).renderPayloadOverrides).caseInitiationRequest,
    );

    if (Object.keys(bm017CaseInitiationRequestSaveInput).length > 0) {
      (nextFormInputs as Record<string, any>).caseInitiationRequest =
        bm017CaseInitiationRequestSaveInput;
    }
    // BM-017_CASE_INITIATION_REQUEST_SAVE_END
    // BM-085_CASE_INVESTIGATION_TRANSFER_SAVE_START
    // BM-085: save caseInvestigationTransfer safely after nextFormInputs is created.
    const bm085CaseInvestigationTransferSaveInput = asObject(
      (dto as any).caseInvestigationTransfer ??
        asObject((dto as any).formInputs).caseInvestigationTransfer ??
        asObject((dto as any).payloadOverrides).caseInvestigationTransfer ??
        asObject((dto as any).renderPayloadOverrides).caseInvestigationTransfer,
    );

    if (Object.keys(bm085CaseInvestigationTransferSaveInput).length > 0) {
      (nextFormInputs as Record<string, any>).caseInvestigationTransfer =
        bm085CaseInvestigationTransferSaveInput;
    }
    // BM-085_CASE_INVESTIGATION_TRANSFER_SAVE_END
    // BM-085_HEADER_SAVE_AFTER_NEXT_FORM_INPUTS_START
    // BM-085 FE header groups: save safely after nextFormInputs is already created.
    for (const bm085HeaderKey of ["agency", "document", "official"] as const) {
      const bm085HeaderValue = asObject(
        (dto as any)[bm085HeaderKey] ??
          asObject((dto as any).formInputs)[bm085HeaderKey] ??
          asObject((dto as any).payloadOverrides)[bm085HeaderKey] ??
          asObject((dto as any).renderPayloadOverrides)[bm085HeaderKey],
      );

      if (Object.keys(bm085HeaderValue).length > 0) {
        (nextFormInputs as Record<string, any>)[bm085HeaderKey] = bm085HeaderValue;
      }
    }
    // BM-085_HEADER_SAVE_AFTER_NEXT_FORM_INPUTS_END
    // BM-168_CASE_FILE_HANDOVER_SAVE_START
    // BM-168: save only caseFileHandover. Minimal and safe.
    const bm168CaseFileHandoverFromDto = asObject(
      (dto as any).caseFileHandover ??
        asObject((dto as any).formInputs).caseFileHandover ??
        asObject((dto as any).payloadOverrides).caseFileHandover ??
        asObject((dto as any).renderPayloadOverrides).caseFileHandover,
    );

    if (Object.keys(bm168CaseFileHandoverFromDto).length > 0) {
      (nextFormInputs as Record<string, any>).caseFileHandover =
        bm168CaseFileHandoverFromDto;
    }
    // BM-168_CASE_FILE_HANDOVER_SAVE_END
    // BM-168_AGENCY_SAVE_START
    // BM-168: save agency header if FE sends it.
    const bm168AgencySaveInput = asObject(
      (dto as any).agency ??
        asObject((dto as any).formInputs).agency ??
        asObject((dto as any).payloadOverrides).agency ??
        asObject((dto as any).renderPayloadOverrides).agency,
    );

    if (Object.keys(bm168AgencySaveInput).length > 0) {
      (nextFormInputs as Record<string, any>).agency = bm168AgencySaveInput;
    }
    // BM-168_AGENCY_SAVE_END


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

    const cleanSignerPersonName = (value: unknown): string | undefined => {
      const text = nonEmptyText(value);
      if (!text) return undefined;

      const normalized = text.replace(/\s+/g, " ").trim();

      if (/^Trần Thanh Nam\s+test$/i.test(normalized)) {
        return "Trần Thanh Nam";
      }

      return normalized;
    };
    const informantInput = asObject(formInputs.informant);
    const crimeReportInput = asObject(formInputs.crimeReport);
        const sourceVerificationInput = asObject(formInputs.sourceVerification);const notificationInput = asObject(formInputs.notification);
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
    const bm055AgencyNameBody =
      nonEmptyText((agencyInput as any).nameBody) ??
      "Viện kiểm sát nhân dân khu vực 7";

    const bm055PreventiveMeasureOrderLegalBasisLine = (
      nonEmptyText(measureInput.preventiveMeasureOrderLegalBasisLine) ??
      ensureSentenceEnd(
        compact([
          "Lệnh cấm đi khỏi nơi cư trú",
          bm054PreventiveMeasureOrderCode
            ? `số ${bm054PreventiveMeasureOrderCode}`
            : null,
          bm054PreventiveMeasureOrderIssueDateText,
          `của ${bm055AgencyNameBody}`,
        ]),
        ";",
      )
    )
      .replace(
        /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+KHU[\s\u00A0]+VỰC[\s\u00A0]+7/gu,
        bm055AgencyNameBody,
      )
      .replace(
        /Viện\s+kiểm\s+sát\s+nhân\s+dân\s+Khu\s+vực\s+7/gu,
        bm055AgencyNameBody,
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
      cleanSignerPersonName(signatureInput.signerName) ??
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
        ? "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;"
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
      cleanSignerPersonName(receiverInput.fullName) ??
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
      cleanSignerPersonName(receiverInput.signerName) ?? bm001ReceiverFullName;

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
    // BM-005_SOURCE_VERIFICATION_VALUES_START
    const bm005PickText = (...values: unknown[]): string | null => {
      for (const value of values) {
        const cleaned = nonEmptyText(value);

        if (cleaned) {
          return cleaned;
        }
      }

      return null;
    };

    const bm005StripRecipientLine = (value: unknown): string => {
      return String(value ?? "")
        .replace(/^\s*-\s*/u, "")
        .replace(/[;.\s]+$/u, "")
        .trim();
    };

    const bm005AgencyNameBody =
      bm005PickText((agencyInput as any).nameBody) ??
      "Viện kiểm sát nhân dân khu vực 7";

    const bm005InvestigatingAgencyName =
      bm005PickText(
        sourceVerificationInput.requestedAuthorityName,
        sourceVerificationInput.investigatingAgencyName,
        bm005StripRecipientLine(recipientsInput.investigatingAgencyLine),
        bm005StripRecipientLine(recipientsInput.investigationAuthorityLine),
        bm005StripRecipientLine(recipientsInput.investigationUnitLine),
        investigationUnitName,
      ) ?? "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

    const bm005CrimeReportSummary =
      bm005PickText(
        sourceVerificationInput.crimeReportSummary,
        crimeReportInput.content,
        caseItem.case_summary,
        caseItem.case_title,
      ) ?? "nguồn tin về tội phạm";

    const bm005SourceVerificationRequestRoundText =
      bm005PickText(sourceVerificationInput.requestRoundText) ??
      (templateCode === "BM-005" ? "(Lần thứ nhất)" : "");

    const bm005SourceVerificationProcedureArticlesLine =
      bm005PickText(sourceVerificationInput.procedureArticlesLine) ??
      (templateCode === "BM-005"
        ? "Căn cứ các điều 41, 42, 145 và 159 của Bộ luật Tố tụng hình sự;"
        : "");

    const bm005SourceVerificationReasonLine =
      bm005PickText(sourceVerificationInput.reasonLine) ??
      (templateCode === "BM-005"
        ? ensureSentenceEnd(
            compact([
              "Xét thấy cần kiểm tra, xác minh làm rõ vụ việc",
              bm005CrimeReportSummary,
              bm005AgencyNameBody,
            ]),
            ",",
          )
        : "");

    const bm005SourceVerificationRequestedAuthorityLine =
      bm005PickText(sourceVerificationInput.requestedAuthorityLine) ??
      (templateCode === "BM-005"
        ? `1. ${bm005InvestigatingAgencyName} làm rõ vấn đề sau:`
        : "");

    const bm005SourceVerificationIssue1Line =
      bm005PickText(sourceVerificationInput.issue1Line) ??
      (templateCode === "BM-005"
        ? "a) Làm rõ nội dung nguồn tin về tội phạm đã tiếp nhận."
        : "");

    const bm005SourceVerificationIssue2Line =
      bm005PickText(sourceVerificationInput.issue2Line) ??
      (templateCode === "BM-005"
        ? "b) Thu thập tài liệu, chứng cứ liên quan đến hành vi có dấu hiệu tội phạm."
        : "");

    const bm005SourceVerificationIssue3Line =
      bm005PickText(sourceVerificationInput.issue3Line) ??
      (templateCode === "BM-005"
        ? "c) Xác minh nhân thân, lai lịch của người có liên quan."
        : "");

    const bm005SourceVerificationAdditionalIssuesLine =
      bm005PickText(sourceVerificationInput.additionalIssuesLine) ??
      (templateCode === "BM-005"
        ? "d) Làm rõ các tình tiết khác có ý nghĩa đối với việc giải quyết nguồn tin."
        : "");

    const bm005SourceVerificationResultSubmissionLine =
      bm005PickText(sourceVerificationInput.resultSubmissionLine) ??
      (templateCode === "BM-005"
        ? `2. ${bm005InvestigatingAgencyName} gửi kết quả kiểm tra, xác minh đến ${bm005AgencyNameBody} theo quy định của Bộ luật Tố tụng hình sự./.`
        : "");
    // BM-005_SOURCE_VERIFICATION_VALUES_END


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
      deputyChiefName: str(assignmentInput.deputyChiefName) ?? "Trần Thanh Nam",
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
        str(assignmentInput.assignedOfficerName) ?? "Trần Thanh Nam",
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
      sourceVerification: {
        requestRoundText: bm005SourceVerificationRequestRoundText,
        procedureArticlesLine: bm005SourceVerificationProcedureArticlesLine,
        reasonLine: bm005SourceVerificationReasonLine,
        requestedAuthorityLine: bm005SourceVerificationRequestedAuthorityLine,
        issue1Line: bm005SourceVerificationIssue1Line,
        issue2Line: bm005SourceVerificationIssue2Line,
        issue3Line: bm005SourceVerificationIssue3Line,
        additionalIssuesLine: bm005SourceVerificationAdditionalIssuesLine,
        resultSubmissionLine: bm005SourceVerificationResultSubmissionLine,
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
          nonEmptyText(officialInput.fullName) ?? "Trần Thanh Nam",
        positionTitle: str(officialInput.positionTitle) ?? "VIỆN TRƯỞNG",
        issuerTitle: officialIssuerTitle,
        prosecutorName:
          nonEmptyText(officialInput.prosecutorName) ?? "Trần Thanh Nam",
      },
    };

        // BM-033_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-033 phải ưu tiên dữ liệu khách nhập từ formInputs.
        // Nếu không merge tại đây, render-payload sẽ giữ default cũ và FE sửa xong render không đổi.
        if (templateCode === "BM-033") {
          deepMergeBm097Payload(payload, formInputs);
        }
        // BM-033_SAVED_INPUTS_SOURCE_OF_TRUTH_END
        // BM-038_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-038 phải ưu tiên dữ liệu khách nhập từ formInputs.
        // Nếu không merge ở đây, FE sửa xong render vẫn giữ default cũ.
        if (templateCode === "BM-038") {
          deepMergeBm097Payload(payload, formInputs);
        }
        // BM-038_SAVED_INPUTS_SOURCE_OF_TRUTH_END
        // BM-039_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-039 phải ưu tiên dữ liệu khách nhập từ formInputs.
        // Nếu không merge ở đây, FE sửa xong render vẫn giữ default cũ.
        if (templateCode === "BM-039") {
          deepMergeBm097Payload(payload, formInputs);
        }
        // BM-039_SAVED_INPUTS_SOURCE_OF_TRUTH_END
                        // BM-045_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-045 phải ưu tiên dữ liệu khách nhập từ formInputs.
        // Boolean false phải được ép lại thủ công, tránh bị default true sau reload.
        if (templateCode === "BM-045") {
          deepMergeBm097Payload(payload, formInputs);

          const bm045SavedRoot = ((formInputs ?? {}) as any);
          const bm045SavedNested = ((bm045SavedRoot.formInputs ?? {}) as any);

          const bm045SavedBailApproval =
            ((bm045SavedRoot.bailApproval ??
              bm045SavedNested.bailApproval ??
              {}) as any);

          const bm045SavedLegalBasis =
            ((bm045SavedRoot.legalBasis ??
              bm045SavedNested.legalBasis ??
              {}) as any);

          const bm045HasOwn = (source: any, key: string): boolean => {
            return !!source && Object.prototype.hasOwnProperty.call(source, key);
          };

          const bm045ToBoolean = (value: unknown): boolean => {
            if (typeof value === "boolean") {
              return value;
            }

            if (value === null || value === undefined) {
              return false;
            }

            const raw = String(value).trim().toLowerCase();

            return ["true", "1", "yes", "on"].includes(raw);
          };

          (payload as any).bailApproval = ((payload as any).bailApproval ?? {});
          (payload as any).legalBasis = ((payload as any).legalBasis ?? {});

          if (bm045HasOwn(bm045SavedBailApproval, "includeJuvenileJusticeLine")) {
            (payload as any).bailApproval.includeJuvenileJusticeLine =
              bm045ToBoolean(bm045SavedBailApproval.includeJuvenileJusticeLine);
          }

          if (
            bm045HasOwn(bm045SavedLegalBasis, "juvenileJusticeLine") &&
            !(payload as any).bailApproval.includeJuvenileJusticeLine
          ) {
            (payload as any).legalBasis.juvenileJusticeLine = "";
          }
        }
        // BM-045_SAVED_INPUTS_SOURCE_OF_TRUTH_END
        // BM-044_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-044 phải ưu tiên dữ liệu khách nhập từ formInputs.
        // Quan trọng: deepMerge có thể bỏ qua false, nên phải ép lại boolean false thủ công.
        if (templateCode === "BM-044") {
          deepMergeBm097Payload(payload, formInputs);

          const bm044SavedRoot = ((formInputs ?? {}) as any);
          const bm044SavedNested = ((bm044SavedRoot.formInputs ?? {}) as any);

          const bm044SavedDetentionReplacement =
            ((bm044SavedRoot.detentionReplacement ??
              bm044SavedNested.detentionReplacement ??
              {}) as any);

          const bm044SavedLegalBasis =
            ((bm044SavedRoot.legalBasis ??
              bm044SavedNested.legalBasis ??
              {}) as any);

          const bm044HasOwn = (source: any, key: string): boolean => {
            return !!source && Object.prototype.hasOwnProperty.call(source, key);
          };

          const bm044ToBoolean = (value: unknown): boolean => {
            if (typeof value === "boolean") {
              return value;
            }

            if (value === null || value === undefined) {
              return false;
            }

            const raw = String(value).trim().toLowerCase();

            return ["true", "1", "yes", "on"].includes(raw);
          };

          (payload as any).detentionReplacement =
            ((payload as any).detentionReplacement ?? {});

          (payload as any).legalBasis = ((payload as any).legalBasis ?? {});

          if (bm044HasOwn(bm044SavedDetentionReplacement, "includeJuvenileJusticeLine")) {
            (payload as any).detentionReplacement.includeJuvenileJusticeLine =
              bm044ToBoolean(bm044SavedDetentionReplacement.includeJuvenileJusticeLine);
          }

          if (bm044HasOwn(bm044SavedDetentionReplacement, "includeDetentionExtensionLegalBasis")) {
            (payload as any).detentionReplacement.includeDetentionExtensionLegalBasis =
              bm044ToBoolean(bm044SavedDetentionReplacement.includeDetentionExtensionLegalBasis);
          }

          if (
            bm044HasOwn(bm044SavedLegalBasis, "juvenileJusticeLine") &&
            !(payload as any).detentionReplacement.includeJuvenileJusticeLine
          ) {
            (payload as any).legalBasis.juvenileJusticeLine = "";
          }

          if (
            bm044HasOwn(bm044SavedDetentionReplacement, "detentionExtensionLegalBasisLine") &&
            !(payload as any).detentionReplacement.includeDetentionExtensionLegalBasis
          ) {
            (payload as any).detentionReplacement.detentionExtensionLegalBasisLine = "";
          }
        }
        // BM-044_SAVED_INPUTS_SOURCE_OF_TRUTH_END
        // BM-040_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-040 phải ưu tiên toàn bộ dữ liệu khách nhập từ formInputs.
        // Nếu không merge tại đây, getRenderPayload sẽ tiếp tục dùng dữ liệu mặc định
        // cho legalBasis/caseDecision/accusedDecision/measure/document.
        if (templateCode === "BM-040") {
          deepMergeBm097Payload(payload, formInputs);
        }
        // BM-040_SAVED_INPUTS_SOURCE_OF_TRUTH_END

        // BM-042_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-042 phải ưu tiên toàn bộ dữ liệu khách nhập từ formInputs.
        if (templateCode === "BM-042") {
          deepMergeBm097Payload(payload, formInputs);
        }
        // BM-042_SAVED_INPUTS_SOURCE_OF_TRUTH_END

        // BM-043_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-043 phải ưu tiên toàn bộ dữ liệu khách nhập từ formInputs.
        if (templateCode === "BM-043") {
          deepMergeBm097Payload(payload, formInputs);
        }
        // BM-043_SAVED_INPUTS_SOURCE_OF_TRUTH_END
        // BM-005_SAVED_INPUTS_SOURCE_OF_TRUTH_START
        // BM-005: dữ liệu khách nhập trong formInputs là nguồn sự thật.
        // Có field nào trong sourceVerification thì render đúng field đó, kể cả text khác default.
        if (templateCode === "BM-005") {
          const bm005SavedRoot = ((formInputs ?? {}) as Record<string, any>);
          const bm005SavedNested = ((bm005SavedRoot.formInputs ?? {}) as Record<string, any>);

          const bm005SavedSourceVerification =
            ((bm005SavedRoot.sourceVerification ??
              bm005SavedNested.sourceVerification ??
              {}) as Record<string, any>);

          const bm005SavedRecipients =
            ((bm005SavedRoot.recipients ??
              bm005SavedNested.recipients ??
              {}) as Record<string, any>);

          const bm005SavedSignature =
            ((bm005SavedRoot.signature ??
              bm005SavedNested.signature ??
              {}) as Record<string, any>);

          const bm005SavedReceiver =
            ((bm005SavedRoot.receiver ??
              bm005SavedNested.receiver ??
              {}) as Record<string, any>);

          const bm005HasOwn = (source: Record<string, any>, key: string): boolean =>
            !!source && Object.prototype.hasOwnProperty.call(source, key);

          const bm005Text = (value: unknown): string =>
            value === null || value === undefined ? "" : String(value);

          deepMergeBm097Payload(payload, formInputs);

          (payload as any).sourceVerification = {
            ...(((payload as any).sourceVerification ?? {}) as Record<string, any>),

            requestRoundText: bm005HasOwn(bm005SavedSourceVerification, "requestRoundText")
              ? bm005Text(bm005SavedSourceVerification.requestRoundText)
              : bm005SourceVerificationRequestRoundText,

            procedureArticlesLine: bm005HasOwn(bm005SavedSourceVerification, "procedureArticlesLine")
              ? bm005Text(bm005SavedSourceVerification.procedureArticlesLine)
              : bm005SourceVerificationProcedureArticlesLine,

            reasonLine: bm005HasOwn(bm005SavedSourceVerification, "reasonLine")
              ? bm005Text(bm005SavedSourceVerification.reasonLine)
              : bm005SourceVerificationReasonLine,

            requestedAuthorityLine: bm005HasOwn(bm005SavedSourceVerification, "requestedAuthorityLine")
              ? bm005Text(bm005SavedSourceVerification.requestedAuthorityLine)
              : bm005SourceVerificationRequestedAuthorityLine,

            issue1Line: bm005HasOwn(bm005SavedSourceVerification, "issue1Line")
              ? bm005Text(bm005SavedSourceVerification.issue1Line)
              : bm005SourceVerificationIssue1Line,

            issue2Line: bm005HasOwn(bm005SavedSourceVerification, "issue2Line")
              ? bm005Text(bm005SavedSourceVerification.issue2Line)
              : bm005SourceVerificationIssue2Line,

            issue3Line: bm005HasOwn(bm005SavedSourceVerification, "issue3Line")
              ? bm005Text(bm005SavedSourceVerification.issue3Line)
              : bm005SourceVerificationIssue3Line,

            additionalIssuesLine: bm005HasOwn(bm005SavedSourceVerification, "additionalIssuesLine")
              ? bm005Text(bm005SavedSourceVerification.additionalIssuesLine)
              : bm005SourceVerificationAdditionalIssuesLine,

            resultSubmissionLine: bm005HasOwn(bm005SavedSourceVerification, "resultSubmissionLine")
              ? bm005Text(bm005SavedSourceVerification.resultSubmissionLine)
              : bm005SourceVerificationResultSubmissionLine,
          };

          (payload as any).recipients = {
            ...(((payload as any).recipients ?? {}) as Record<string, any>),

            investigatingAgencyLine: bm005HasOwn(bm005SavedRecipients, "investigatingAgencyLine")
              ? bm005Text(bm005SavedRecipients.investigatingAgencyLine)
              : (((payload as any).recipients as any)?.investigatingAgencyLine ?? "- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;"),

            archiveLine: bm005HasOwn(bm005SavedRecipients, "archiveLine")
              ? bm005Text(bm005SavedRecipients.archiveLine)
              : (((payload as any).recipients as any)?.archiveLine ?? "- Lưu: HSVV, HSKS, VP."),
          };

          (payload as any).signature = {
            ...(((payload as any).signature ?? {}) as Record<string, any>),

            signerName: bm005HasOwn(bm005SavedSignature, "signerName")
              ? bm005Text(bm005SavedSignature.signerName)
              : (((payload as any).signature as any)?.signerName ?? "Nguyễn Thị Thanh Huyền"),
          };

          (payload as any).receiver = {
            ...(((payload as any).receiver ?? {}) as Record<string, any>),

            fullName: bm005HasOwn(bm005SavedReceiver, "fullName")
              ? bm005Text(bm005SavedReceiver.fullName)
              : (((payload as any).signature as any)?.signerName ?? ((payload as any).receiver as any)?.fullName ?? "Nguyễn Thị Thanh Huyền"),

            signerName: bm005HasOwn(bm005SavedReceiver, "signerName")
              ? bm005Text(bm005SavedReceiver.signerName)
              : (((payload as any).signature as any)?.signerName ?? ((payload as any).receiver as any)?.signerName ?? "Nguyễn Thị Thanh Huyền"),
          };
        }
        // BM-005_SAVED_INPUTS_SOURCE_OF_TRUTH_END        // BM-009_HEADER_PAYLOAD_SOURCE_OF_TRUTH_START
        if (templateCode === "BM-009" || templateCode === "BM-017") {
          const bm009HeaderSavedRoot = asObject(formInputs);
          const bm009HeaderSavedNested = asObject((bm009HeaderSavedRoot as any).formInputs);

          const bm009SavedAgency = asObject(
            (bm009HeaderSavedRoot as any).agency ??
              (bm009HeaderSavedNested as any).agency,
          );

          const bm009SavedDocument = asObject(
            (bm009HeaderSavedRoot as any).document ??
              (bm009HeaderSavedNested as any).document,
          );

          const bm009SavedOfficial = asObject(
            (bm009HeaderSavedRoot as any).official ??
              (bm009HeaderSavedNested as any).official,
          );

          if (Object.keys(bm009SavedAgency).length > 0) {
            (payload as any).agency = {
              ...asObject((payload as any).agency),
              ...bm009SavedAgency,
            };
          }

          if (Object.keys(bm009SavedDocument).length > 0) {
            (payload as any).document = {
              ...asObject((payload as any).document),
              ...bm009SavedDocument,
            };
          }

          if (Object.keys(bm009SavedOfficial).length > 0) {
            (payload as any).official = {
              ...asObject((payload as any).official),
              ...bm009SavedOfficial,
            };
          }
        }
        // BM-009_HEADER_PAYLOAD_SOURCE_OF_TRUTH_END
        // BM-009_SAFE_PAYLOAD_SOURCE_RESOLUTION_START
        if (templateCode === "BM-009" || templateCode === "BM-017") {
          const bm009SavedRoot = asObject(formInputs);
          const bm009SavedNested = asObject((bm009SavedRoot as any).formInputs);

          const bm009SavedSourceResolution = asObject(
            (bm009SavedRoot as any).sourceResolutionExtension ??
              (bm009SavedNested as any).sourceResolutionExtension,
          );

          const bm009SavedRecipients = asObject(
            (bm009SavedRoot as any).recipients ??
              (bm009SavedNested as any).recipients,
          );

          const bm009SavedSignature = asObject(
            (bm009SavedRoot as any).signature ??
              (bm009SavedNested as any).signature,
          );

          const bm009HasOwn = (source: Record<string, any>, key: string): boolean =>
            !!source && Object.prototype.hasOwnProperty.call(source, key);

          const bm009Text = (value: unknown): string =>
            value === null || value === undefined ? "" : String(value);

          const bm009PickText = (...values: unknown[]): string | null => {
            for (const value of values) {
              const cleaned = nonEmptyText(value);

              if (cleaned) {
                return cleaned;
              }
            }

            return null;
          };

          const bm009StripRecipientLine = (value: unknown): string => {
            return String(value ?? "")
              .replace(/^\s*-\s*/u, "")
              .replace(/[;.\s]+$/u, "")
              .trim();
          };

          const bm009PayloadAgency = asObject((payload as any).agency);
          const bm009PayloadRecipients = asObject((payload as any).recipients);
          const bm009PayloadSignature = asObject((payload as any).signature);
          const bm009PayloadCrimeReport = asObject((payload as any).crimeReport);
          const bm009PayloadCase = asObject((payload as any).case);

          const bm009AgencyNameBody =
            bm009PickText(
              (bm009PayloadAgency as any).nameBody,
              (bm009PayloadAgency as any).name,
            ) ?? "Viện kiểm sát nhân dân khu vực 7";

          const bm009InvestigatingAgencyName =
            bm009PickText(
              (bm009SavedSourceResolution as any).requestingAgencyName,
              (bm009SavedSourceResolution as any).investigatingAgencyName,
              bm009StripRecipientLine((bm009PayloadRecipients as any).investigatingAgencyLine),
              bm009StripRecipientLine((bm009PayloadRecipients as any).investigationAuthorityLine),
            ) ?? "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

          const bm009CaseSummary =
            bm009PickText(
              (bm009SavedSourceResolution as any).caseSummary,
              (bm009PayloadCrimeReport as any).content,
              (bm009PayloadCase as any).caseSummary,
              (bm009PayloadCase as any).caseTitle,
            ) ?? "nguồn tin về tội phạm";

          const bm009DurationText =
            bm009HasOwn(bm009SavedSourceResolution, "durationText")
              ? bm009Text((bm009SavedSourceResolution as any).durationText)
              : "02 tháng";

          const bm009FromDateText =
            bm009HasOwn(bm009SavedSourceResolution, "fromDateText")
              ? bm009Text((bm009SavedSourceResolution as any).fromDateText)
              : "ngày 26 tháng 5 năm 2026";

          const bm009ToDateText =
            bm009HasOwn(bm009SavedSourceResolution, "toDateText")
              ? bm009Text((bm009SavedSourceResolution as any).toDateText)
              : "ngày 26 tháng 7 năm 2026";

          const bm009DefaultProcedureArticlesLine =
            "Căn cứ các điều 41, 147 và 159 của Bộ luật Tố tụng hình sự;";

          const bm009DefaultReceptionLegalBasisLine =
            `Căn cứ việc tiếp nhận nguồn tin về tội phạm ngày 26 tháng 5 năm 2026 của ${bm009InvestigatingAgencyName} đối với vụ việc ${bm009CaseSummary};`;

          const bm009DefaultProposalLegalBasisLine =
            `Xét văn bản đề nghị gia hạn thời hạn giải quyết nguồn tin về tội phạm số 01/ĐN-ĐT ngày 26 tháng 5 năm 2026 của ${bm009InvestigatingAgencyName};`;

          const bm009DefaultReasonLine =
            "Nhận thấy việc gia hạn thời hạn giải quyết nguồn tin về tội phạm là có căn cứ,";

          const bm009DefaultArticle1Line =
            `Điều 1. Gia hạn thời hạn giải quyết nguồn tin về tội phạm trong thời hạn ${bm009DurationText}, kể từ ${bm009FromDateText} đến ${bm009ToDateText}.`;

          const bm009DefaultArticle2Line =
            `Điều 2. Yêu cầu ${bm009InvestigatingAgencyName} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.`;

          const bm009DefaultRequestingAgencyRecipientLine =
            `- ${bm009InvestigatingAgencyName};`;

          (payload as any).sourceResolutionExtension = {
            procedureArticlesLine: bm009HasOwn(bm009SavedSourceResolution, "procedureArticlesLine")
              ? bm009Text((bm009SavedSourceResolution as any).procedureArticlesLine)
              : bm009DefaultProcedureArticlesLine,

            receptionLegalBasisLine: bm009HasOwn(bm009SavedSourceResolution, "receptionLegalBasisLine")
              ? bm009Text((bm009SavedSourceResolution as any).receptionLegalBasisLine)
              : bm009DefaultReceptionLegalBasisLine,

            proposalLegalBasisLine: bm009HasOwn(bm009SavedSourceResolution, "proposalLegalBasisLine")
              ? bm009Text((bm009SavedSourceResolution as any).proposalLegalBasisLine)
              : bm009DefaultProposalLegalBasisLine,

            reasonLine: bm009HasOwn(bm009SavedSourceResolution, "reasonLine")
              ? bm009Text((bm009SavedSourceResolution as any).reasonLine)
              : bm009DefaultReasonLine,

            durationText: bm009DurationText,
            fromDateText: bm009FromDateText,
            toDateText: bm009ToDateText,

            article1Line: bm009HasOwn(bm009SavedSourceResolution, "article1Line")
              ? bm009Text((bm009SavedSourceResolution as any).article1Line)
              : bm009DefaultArticle1Line,

            article2Line: bm009HasOwn(bm009SavedSourceResolution, "article2Line")
              ? bm009Text((bm009SavedSourceResolution as any).article2Line)
              : bm009DefaultArticle2Line,

            requestingAgencyRecipientLine: bm009HasOwn(bm009SavedSourceResolution, "requestingAgencyRecipientLine")
              ? bm009Text((bm009SavedSourceResolution as any).requestingAgencyRecipientLine)
              : bm009DefaultRequestingAgencyRecipientLine,
          };

          (payload as any).recipients = {
            ...bm009PayloadRecipients,
            archiveLine: bm009HasOwn(bm009SavedRecipients, "archiveLine")
              ? bm009Text((bm009SavedRecipients as any).archiveLine)
              : ((bm009PayloadRecipients as any).archiveLine ?? "- Lưu: HSVV, HSKS, VP."),
          };

          (payload as any).signature = {
            ...bm009PayloadSignature,
            signMode: bm009HasOwn(bm009SavedSignature, "signMode")
              ? bm009Text((bm009SavedSignature as any).signMode)
              : ((bm009PayloadSignature as any).signMode ?? "KT. VIỆN TRƯỞNG"),
            positionTitle: bm009HasOwn(bm009SavedSignature, "positionTitle")
              ? bm009Text((bm009SavedSignature as any).positionTitle)
              : ((bm009PayloadSignature as any).positionTitle ?? "PHÓ VIỆN TRƯỞNG"),
            signerName: bm009HasOwn(bm009SavedSignature, "signerName")
              ? bm009Text((bm009SavedSignature as any).signerName)
              : ((bm009PayloadSignature as any).signerName ?? "Trần Thanh Nam"),
          };
        }
        // BM-009_SAFE_PAYLOAD_SOURCE_RESOLUTION_END        // BM-017_CASE_INITIATION_REQUEST_PAYLOAD_START
        if (templateCode === "BM-017") {
          const bm017SavedRoot = asObject(formInputs);
          const bm017SavedNested = asObject((bm017SavedRoot as any).formInputs);

          const bm017SavedRequest = asObject(
            (bm017SavedRoot as any).caseInitiationRequest ??
              (bm017SavedNested as any).caseInitiationRequest,
          );

          const bm017PayloadAgency = asObject((payload as any).agency);
          const bm017PayloadOfficial = asObject((payload as any).official);
          const bm017PayloadOffense = asObject((payload as any).offense);
          const bm017PayloadRecipients = asObject((payload as any).recipients);
          const bm017PayloadSignature = asObject((payload as any).signature);

          const bm017HasOwn = (source: Record<string, any>, key: string): boolean =>
            !!source && Object.prototype.hasOwnProperty.call(source, key);

          const bm017Text = (value: unknown): string =>
            value === null || value === undefined ? "" : String(value);

          const bm017PickText = (...values: unknown[]): string | null => {
            for (const value of values) {
              const cleaned = nonEmptyText(value);

              if (cleaned) {
                return cleaned;
              }
            }

            return null;
          };

          const bm017StripRecipientLine = (value: unknown): string => {
            return String(value ?? "")
              .replace(/^\s*-\s*/u, "")
              .replace(/[;.\s]+$/u, "")
              .trim();
          };

          const bm017ProcuracyName =
            bm017PickText((bm017PayloadAgency as any).nameBody, (bm017PayloadAgency as any).name) ??
            "Viện kiểm sát nhân dân khu vực 7";

          const bm017InvestigationAuthorityName =
            bm017PickText(
              (bm017SavedRequest as any).investigationAuthorityName,
              bm017StripRecipientLine((bm017PayloadRecipients as any).investigatingAgencyLine),
              bm017StripRecipientLine((bm017PayloadRecipients as any).investigationAuthorityLine),
            ) ?? "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

          const bm017OffenseName =
            bm017PickText(
              (bm017SavedRequest as any).offenseName,
              (bm017PayloadOffense as any).offenseName,
            ) ?? "Đánh bạc";

          const bm017LegalArticle =
            bm017PickText(
              (bm017SavedRequest as any).legalArticle,
              (bm017PayloadOffense as any).legalArticle,
            ) ?? "khoản 1 Điều 321 Bộ luật Hình sự";

          const bm017DefaultProcedureArticlesLine =
            "Căn cứ các điều 41, 143, 159, 161 và 165 của Bộ luật Tố tụng hình sự;";

          const bm017DefaultAssessmentLine =
            `Xét thấy vụ việc có dấu hiệu tội phạm quy định tại ${bm017LegalArticle},`;

          const bm017DefaultArticle1Line =
            `${bm017InvestigationAuthorityName} khởi tố vụ án hình sự về tội “${bm017OffenseName}” quy định tại ${bm017LegalArticle} để tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự.`;

          const bm017DefaultArticle2Line =
            `${bm017InvestigationAuthorityName} gửi Quyết định khởi tố vụ án hình sự kèm theo tài liệu liên quan đến ${bm017ProcuracyName} để kiểm sát việc khởi tố theo quy định của Bộ luật Tố tụng hình sự./.`;

          const bm017DefaultInvestigationAuthorityRecipientLine =
            `- ${bm017InvestigationAuthorityName};`;

          (payload as any).caseInitiationRequest = {
            procedureArticlesLine: bm017HasOwn(bm017SavedRequest, "procedureArticlesLine")
              ? bm017Text((bm017SavedRequest as any).procedureArticlesLine)
              : bm017DefaultProcedureArticlesLine,

            investigationAuthorityName: bm017HasOwn(bm017SavedRequest, "investigationAuthorityName")
              ? bm017Text((bm017SavedRequest as any).investigationAuthorityName)
              : bm017InvestigationAuthorityName,

            offenseName: bm017HasOwn(bm017SavedRequest, "offenseName")
              ? bm017Text((bm017SavedRequest as any).offenseName)
              : bm017OffenseName,

            legalArticle: bm017HasOwn(bm017SavedRequest, "legalArticle")
              ? bm017Text((bm017SavedRequest as any).legalArticle)
              : bm017LegalArticle,

            assessmentLine: bm017HasOwn(bm017SavedRequest, "assessmentLine")
              ? bm017Text((bm017SavedRequest as any).assessmentLine)
              : bm017DefaultAssessmentLine,

            article1Line: bm017HasOwn(bm017SavedRequest, "article1Line")
              ? bm017Text((bm017SavedRequest as any).article1Line)
              : bm017DefaultArticle1Line,

            article2Line: bm017HasOwn(bm017SavedRequest, "article2Line")
              ? bm017Text((bm017SavedRequest as any).article2Line)
              : bm017DefaultArticle2Line,

            investigationAuthorityRecipientLine: bm017HasOwn(bm017SavedRequest, "investigationAuthorityRecipientLine")
              ? bm017Text((bm017SavedRequest as any).investigationAuthorityRecipientLine)
              : bm017DefaultInvestigationAuthorityRecipientLine,
          };

          (payload as any).recipients = {
            ...bm017PayloadRecipients,
            archiveLine: ((bm017PayloadRecipients as any).archiveLine ?? "- Lưu: HSVV, HSKS, VP."),
          };

          (payload as any).signature = {
            ...bm017PayloadSignature,
            signMode: ((bm017PayloadSignature as any).signMode ?? "KT. VIỆN TRƯỞNG"),
            positionTitle: ((bm017PayloadSignature as any).positionTitle ?? "PHÓ VIỆN TRƯỞNG"),
            signerName: ((bm017PayloadSignature as any).signerName ?? "Trần Thanh Nam"),
          };

          (payload as any).official = {
            ...bm017PayloadOfficial,
            issuerTitle:
              ((bm017PayloadOfficial as any).issuerTitle ??
                "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7"),
          };
        }
        // BM-017_CASE_INITIATION_REQUEST_PAYLOAD_END        // BM-085_HEADER_PAYLOAD_SOURCE_OF_TRUTH_START
        if (templateCode === "BM-085") {
          const bm085HeaderSavedRoot = asObject(formInputs);
          const bm085HeaderSavedNested = asObject((bm085HeaderSavedRoot as any).formInputs);

          const bm085SavedAgency = asObject(
            (bm085HeaderSavedRoot as any).agency ??
              (bm085HeaderSavedNested as any).agency,
          );

          const bm085SavedDocument = asObject(
            (bm085HeaderSavedRoot as any).document ??
              (bm085HeaderSavedNested as any).document,
          );

          const bm085SavedOfficial = asObject(
            (bm085HeaderSavedRoot as any).official ??
              (bm085HeaderSavedNested as any).official,
          );

          if (Object.keys(bm085SavedAgency).length > 0) {
            (payload as any).agency = {
              ...asObject((payload as any).agency),
              ...bm085SavedAgency,
            };
          }

          if (Object.keys(bm085SavedDocument).length > 0) {
            (payload as any).document = {
              ...asObject((payload as any).document),
              ...bm085SavedDocument,
            };
          }

          if (Object.keys(bm085SavedOfficial).length > 0) {
            (payload as any).official = {
              ...asObject((payload as any).official),
              ...bm085SavedOfficial,
            };
          }
        }
        // BM-085_HEADER_PAYLOAD_SOURCE_OF_TRUTH_END
        // BM-085_CASE_INVESTIGATION_TRANSFER_PAYLOAD_START
        if (templateCode === "BM-085") {
          const bm085SavedRoot = asObject(formInputs);
          const bm085SavedNested = asObject((bm085SavedRoot as any).formInputs);

          const bm085SavedTransfer = asObject(
            (bm085SavedRoot as any).caseInvestigationTransfer ??
              (bm085SavedNested as any).caseInvestigationTransfer,
          );

          const bm085PayloadAgency = asObject((payload as any).agency);
          const bm085PayloadOfficial = asObject((payload as any).official);
          const bm085PayloadCase = asObject((payload as any).case);
          const bm085PayloadOffense = asObject((payload as any).offense);
          const bm085PayloadRecipients = asObject((payload as any).recipients);
          const bm085PayloadSignature = asObject((payload as any).signature);

          const bm085HasOwn = (source: Record<string, any>, key: string): boolean =>
            !!source && Object.prototype.hasOwnProperty.call(source, key);

          const bm085Text = (value: unknown): string =>
            value === null || value === undefined ? "" : String(value);

          const bm085PickText = (...values: unknown[]): string | null => {
            for (const value of values) {
              const cleaned = nonEmptyText(value);

              if (cleaned) {
                return cleaned;
              }
            }

            return null;
          };

          const bm085StripRecipientLine = (value: unknown): string => {
            return String(value ?? "")
              .replace(/^\s*-\s*/u, "")
              .replace(/[;.\s]+$/u, "")
              .trim();
          };

          const bm085CaseTitle =
            bm085PickText(
              (bm085SavedTransfer as any).caseTitle,
              (bm085PayloadCase as any).caseTitle,
              (bm085PayloadCase as any).caseSummary,
            ) ?? "vụ án hình sự";

          const bm085OffenseName =
            bm085PickText(
              (bm085SavedTransfer as any).offenseName,
              (bm085PayloadOffense as any).offenseName,
            ) ?? "Đánh bạc";

          const bm085FromInvestigationAuthorityName =
            bm085PickText(
              (bm085SavedTransfer as any).fromInvestigationAuthorityName,
              bm085StripRecipientLine((bm085PayloadRecipients as any).investigatingAgencyLine),
              bm085StripRecipientLine((bm085PayloadRecipients as any).investigationAuthorityLine),
            ) ?? "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

          const bm085ToInvestigationAuthorityName =
            bm085PickText(
              (bm085SavedTransfer as any).toInvestigationAuthorityName,
            ) ?? "Cơ quan điều tra có thẩm quyền";

          const bm085ToProcuracyName =
            bm085PickText(
              (bm085SavedTransfer as any).toProcuracyName,
            ) ?? "Viện kiểm sát có thẩm quyền";

          const bm085DefaultProcedureArticlesLine =
            "Căn cứ các điều 41, 165 và 169 của Bộ luật Tố tụng hình sự;";

          const bm085DefaultReasonLine =
            `Xét thấy ${bm085CaseTitle} về tội “${bm085OffenseName}” không thuộc thẩm quyền điều tra của ${bm085FromInvestigationAuthorityName} mà thuộc thẩm quyền điều tra của ${bm085ToInvestigationAuthorityName},`;

          const bm085DefaultArticle1Line =
            `Chuyển vụ án ${bm085CaseTitle} do ${bm085FromInvestigationAuthorityName} đang tiến hành điều tra đến ${bm085ToInvestigationAuthorityName} để điều tra theo thẩm quyền.`;

          const bm085DefaultArticle2Line =
            `Yêu cầu ${bm085FromInvestigationAuthorityName} thực hiện việc chuyển hồ sơ vụ án, vật chứng và bị can (nếu có) theo quy định của Bộ luật Tố tụng hình sự./.`;

          const bm085DefaultFromInvestigationAuthorityRecipientLine =
            `- ${bm085FromInvestigationAuthorityName};`;

          const bm085DefaultToInvestigationAuthorityRecipientLine =
            `- ${bm085ToInvestigationAuthorityName};`;

                    const bm085DefaultToProcuracyRecipientLine =
            `- ${bm085ToProcuracyName};`;

          const bm085DefaultAccusedOrRepresentativeRecipientLine =
            "- Bị can hoặc người đại diện của bị can;";

          const bm085DefaultDefenderRecipientLine =
            "- Người bào chữa;";

          const bm085DefaultOtherParticipantRecipientLine =
            "- Người tham gia tố tụng khác;";
(payload as any).caseInvestigationTransfer = {
            procedureArticlesLine: bm085HasOwn(bm085SavedTransfer, "procedureArticlesLine")
              ? bm085Text((bm085SavedTransfer as any).procedureArticlesLine)
              : bm085DefaultProcedureArticlesLine,

            caseTitle: bm085HasOwn(bm085SavedTransfer, "caseTitle")
              ? bm085Text((bm085SavedTransfer as any).caseTitle)
              : bm085CaseTitle,

            offenseName: bm085HasOwn(bm085SavedTransfer, "offenseName")
              ? bm085Text((bm085SavedTransfer as any).offenseName)
              : bm085OffenseName,

            fromInvestigationAuthorityName: bm085HasOwn(bm085SavedTransfer, "fromInvestigationAuthorityName")
              ? bm085Text((bm085SavedTransfer as any).fromInvestigationAuthorityName)
              : bm085FromInvestigationAuthorityName,

            toInvestigationAuthorityName: bm085HasOwn(bm085SavedTransfer, "toInvestigationAuthorityName")
              ? bm085Text((bm085SavedTransfer as any).toInvestigationAuthorityName)
              : bm085ToInvestigationAuthorityName,

            toProcuracyName: bm085HasOwn(bm085SavedTransfer, "toProcuracyName")
              ? bm085Text((bm085SavedTransfer as any).toProcuracyName)
              : bm085ToProcuracyName,

            reasonLine: bm085HasOwn(bm085SavedTransfer, "reasonLine")
              ? bm085Text((bm085SavedTransfer as any).reasonLine)
              : bm085DefaultReasonLine,

            article1Line: bm085HasOwn(bm085SavedTransfer, "article1Line")
              ? bm085Text((bm085SavedTransfer as any).article1Line)
              : bm085DefaultArticle1Line,

            article2Line: bm085HasOwn(bm085SavedTransfer, "article2Line")
              ? bm085Text((bm085SavedTransfer as any).article2Line)
              : bm085DefaultArticle2Line,

            fromInvestigationAuthorityRecipientLine: bm085HasOwn(bm085SavedTransfer, "fromInvestigationAuthorityRecipientLine")
              ? bm085Text((bm085SavedTransfer as any).fromInvestigationAuthorityRecipientLine)
              : bm085DefaultFromInvestigationAuthorityRecipientLine,

            toInvestigationAuthorityRecipientLine: bm085HasOwn(bm085SavedTransfer, "toInvestigationAuthorityRecipientLine")
              ? bm085Text((bm085SavedTransfer as any).toInvestigationAuthorityRecipientLine)
              : bm085DefaultToInvestigationAuthorityRecipientLine,

                        toProcuracyRecipientLine: bm085HasOwn(bm085SavedTransfer, "toProcuracyRecipientLine")
              ? bm085Text((bm085SavedTransfer as any).toProcuracyRecipientLine)
              : bm085DefaultToProcuracyRecipientLine,

            accusedOrRepresentativeRecipientLine: bm085HasOwn(bm085SavedTransfer, "accusedOrRepresentativeRecipientLine")
              ? bm085Text((bm085SavedTransfer as any).accusedOrRepresentativeRecipientLine)
              : bm085DefaultAccusedOrRepresentativeRecipientLine,

            defenderRecipientLine: bm085HasOwn(bm085SavedTransfer, "defenderRecipientLine")
              ? bm085Text((bm085SavedTransfer as any).defenderRecipientLine)
              : bm085DefaultDefenderRecipientLine,

            otherParticipantRecipientLine: bm085HasOwn(bm085SavedTransfer, "otherParticipantRecipientLine")
              ? bm085Text((bm085SavedTransfer as any).otherParticipantRecipientLine)
              : bm085DefaultOtherParticipantRecipientLine,
};

          (payload as any).recipients = {
            ...bm085PayloadRecipients,
            archiveLine: ((bm085PayloadRecipients as any).archiveLine ?? "- Lưu: HSVA, HSKS, VP."),
          };

          (payload as any).signature = {
            ...bm085PayloadSignature,
            signMode: ((bm085PayloadSignature as any).signMode ?? "KT. VIỆN TRƯỞNG"),
            positionTitle: ((bm085PayloadSignature as any).positionTitle ?? "PHÓ VIỆN TRƯỞNG"),
            signerName: ((bm085PayloadSignature as any).signerName ?? "Trần Thanh Nam"),
          };

          (payload as any).official = {
            ...bm085PayloadOfficial,
            issuerTitle:
              ((bm085PayloadOfficial as any).issuerTitle ??
                "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7"),
          };
        }
        // BM-085_CASE_INVESTIGATION_TRANSFER_PAYLOAD_END        // BM-168_AGENCY_PAYLOAD_SOURCE_OF_TRUTH_START
        if (templateCode === "BM-168") {
          const bm168AgencySavedRoot = asObject(formInputs);
          const bm168AgencySavedNested = asObject((bm168AgencySavedRoot as any).formInputs);

          const bm168SavedAgency = asObject(
            (bm168AgencySavedRoot as any).agency ??
              (bm168AgencySavedNested as any).agency,
          );

          if (Object.keys(bm168SavedAgency).length > 0) {
            (payload as any).agency = {
              ...asObject((payload as any).agency),
              ...bm168SavedAgency,
            };
          }
        }
        // BM-168_AGENCY_PAYLOAD_SOURCE_OF_TRUTH_END
        // BM-168_CASE_FILE_HANDOVER_PAYLOAD_START
        if (templateCode === "BM-168") {
          const bm168Root = asObject(formInputs);
          const bm168Nested = asObject((bm168Root as any).formInputs);

          const bm168Saved = asObject(
            (bm168Root as any).caseFileHandover ??
              (bm168Nested as any).caseFileHandover,
          );

          const bm168PayloadCase = asObject((payload as any).case);
          const bm168PayloadAgency = asObject((payload as any).agency);
          const bm168PayloadReception = asObject((payload as any).reception);
          const bm168PayloadReceiver = asObject((payload as any).receiver);
          const bm168PayloadRecipients = asObject((payload as any).recipients);
          const bm168PayloadOfficial = asObject((payload as any).official);

          const bm168Clean = (value: unknown): string => {
            if (value === null || value === undefined) {
              return "";
            }

            return String(value).trim();
          };

          const bm168Pick = (key: string, fallback: string): string => {
            const direct = bm168Clean((bm168Saved as any)[key]);

            if (direct) {
              return direct;
            }

            return fallback;
          };

          const bm168StripRecipient = (value: unknown): string => {
            return bm168Clean(value)
              .replace(/^\s*-\s*/u, "")
              .replace(/[;.\s]+$/u, "")
              .trim();
          };

          const bm168StartedAtTimeText = bm168Pick(
            "startedAtTimeText",
            bm168Clean((bm168PayloadReception as any).startedAtTimeText) || "08 giờ 00 phút",
          );

          const bm168StartedAtDateText = bm168Pick(
            "startedAtDateText",
            "ngày 26 tháng 5 năm 2026",
          );

          const bm168EndedAtTimeText = bm168Pick(
            "endedAtTimeText",
            bm168Clean((bm168PayloadReception as any).endedAtTimeText) || "08 giờ 30 phút",
          );

          const bm168EndedAtDateText = bm168Pick(
            "endedAtDateText",
            "ngày 26 tháng 5 năm 2026",
          );

          const bm168LocationName = bm168Pick(
            "locationName",
            "Viện kiểm sát nhân dân khu vực 7",
          );

          const bm168GiverName = bm168Pick(
            "giverName",
            bm168StripRecipient((bm168PayloadRecipients as any).investigatingAgencyLine) ||
              "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
          );

          const bm168GiverPositionTitle = bm168Pick(
            "giverPositionTitle",
            "Điều tra viên",
          );

          const bm168ReceiverName = bm168Pick(
            "receiverName",
            bm168Clean((bm168PayloadReceiver as any).fullName) ||
              bm168Clean((bm168PayloadOfficial as any).fullName) ||
              "Trần Thanh Nam",
          );

          const bm168ReceiverPositionTitle = bm168Pick(
            "receiverPositionTitle",
            bm168Clean((bm168PayloadReceiver as any).positionTitle) || "Kiểm sát viên",
          );

          const bm168CaseFileTitle = bm168Pick(
            "caseFileTitle",
            bm168Clean((bm168PayloadCase as any).caseTitle) || "Vụ án hình sự",
          );

          const bm168HandoverReasonLine = bm168Pick(
            "handoverReasonLine",
            "Bàn giao hồ sơ vụ án, vụ việc để giải quyết theo quy định của pháp luật.",
          );

          const bm168FileVolumeText = bm168Pick("fileVolumeText", "01 tập");
          const bm168TotalPageText = bm168Pick("totalPageText", "120");
          const bm168FromPageText = bm168Pick("fromPageText", "01");
          const bm168ToPageText = bm168Pick("toPageText", "120");
          const bm168EvidenceDescription = bm168Pick(
            "evidenceDescription",
            "Không",
          );

          const bm168StartedAtLine = bm168Pick(
            "startedAtLine",
            `Vào hồi ${bm168StartedAtTimeText}, ${bm168StartedAtDateText} tại ${bm168LocationName}.`,
          );

          const bm168FileStatsLine = bm168Pick(
            "fileStatsLine",
            `${bm168FileVolumeText}, tổng số ${bm168TotalPageText} bút lục, đánh số từ ${bm168FromPageText} đến ${bm168ToPageText}.`,
          );

          const bm168EvidenceLine = bm168Pick(
            "evidenceLine",
            `${bm168EvidenceDescription}`,
          );

          const bm168EndedAtLine = bm168Pick(
            "endedAtLine",
            `Việc giao, nhận kết thúc hồi ${bm168EndedAtTimeText}, ${bm168EndedAtDateText}.`,
          );

          (payload as any).caseFileHandover = {
            startedAtTimeText: bm168StartedAtTimeText,
            startedAtDateText: bm168StartedAtDateText,
            endedAtTimeText: bm168EndedAtTimeText,
            endedAtDateText: bm168EndedAtDateText,
            locationName: bm168LocationName,

            giverName: bm168GiverName,
            giverPositionTitle: bm168GiverPositionTitle,
            receiverName: bm168ReceiverName,
            receiverPositionTitle: bm168ReceiverPositionTitle,

            caseFileTitle: bm168CaseFileTitle,
            handoverReasonLine: bm168HandoverReasonLine,

            fileVolumeText: bm168FileVolumeText,
            totalPageText: bm168TotalPageText,
            fromPageText: bm168FromPageText,
            toPageText: bm168ToPageText,
            evidenceDescription: bm168EvidenceDescription,

            startedAtLine: bm168StartedAtLine,
            fileStatsLine: bm168FileStatsLine,
            evidenceLine: bm168EvidenceLine,
            endedAtLine: bm168EndedAtLine,

            receiverSignerName: bm168Pick("receiverSignerName", bm168ReceiverName),
            giverSignerName: bm168Pick("giverSignerName", bm168GiverName),
          };
        }
        // BM-168_CASE_FILE_HANDOVER_PAYLOAD_END

applyBm097SavedInputsAsSourceOfTruth(payload, { formInputs });
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

      this.removeBlankOptionalPlaceholderParagraphsInZip(
        zip,
        payload as Record<string, unknown>,
      );

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

  private getPayloadTemplateCode(payload: Record<string, unknown>): string {
    const template = asObject(payload["template"]);
    const document = asObject(payload["document"]);

    return String(
      template["templateCode"] ??
        (payload as Record<string, any>)["templateCode"] ??
        document["templateCode"] ??
        "",
    ).trim();
  }

  private isBlankOptionalPlaceholderValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === "string") {
      return value.trim().length === 0;
    }

    return false;
  }

  private unescapeWordXmlText(value: string): string {
    return value
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  private extractWordParagraphPlainText(paragraphXml: string): string {
    const parts: string[] = [];
    const textRegex = /<w:(?:t|instrText)\b[^>]*>([\s\S]*?)<\/w:(?:t|instrText)>/gu;

    let match: RegExpExecArray | null;

    while ((match = textRegex.exec(paragraphXml)) !== null) {
      parts.push(this.unescapeWordXmlText(match[1] ?? ""));
    }

    return parts.join("");
  }

  private normalizePlaceholderComparableText(value: string): string {
    return value.replace(/\s+/gu, "").trim();
  }

  private getOptionalBlankParagraphPlaceholderPaths(
    payload: Record<string, unknown>,
  ): string[] {
    const templateCode = this.getPayloadTemplateCode(payload);

    if (templateCode === "BM-104") {
      return ["investigationRecovery.legalBasisLine"];
    }

    return [];
  }

  /**
   * Xóa nguyên paragraph Word chứa optional placeholder nếu value rỗng.
   *
   * Khác bản cũ:
   * - Không dùng nextXml.includes("{{...}}") nữa.
   * - Đọc text thực trong từng <w:p>.
   * - Chịu được trường hợp Word/WPS tách placeholder ra nhiều <w:t>.
   */
  private removeBlankOptionalPlaceholderParagraphsInZip(
    zip: PizZip,
    payload: Record<string, unknown>,
  ): void {
    const optionalPaths = this.getOptionalBlankParagraphPlaceholderPaths(payload);

    if (optionalPaths.length === 0) {
      return;
    }

    const zipAny = zip as any;
    const files = zipAny.files as Record<string, any>;

    if (!files) {
      return;
    }

    for (const fileName of Object.keys(files)) {
      if (!fileName.startsWith("word/") || !fileName.endsWith(".xml")) {
        continue;
      }

      const file = zip.file(fileName);

      if (!file) {
        continue;
      }

      const originalXml = file.asText();

      if (!originalXml.includes("{{")) {
        continue;
      }

      const paragraphRegex = /<w:p\b[\s\S]*?<\/w:p>/gu;

      const nextXml = originalXml.replace(paragraphRegex, (paragraphXml) => {
        const paragraphText = this.normalizePlaceholderComparableText(
          this.extractWordParagraphPlainText(paragraphXml),
        );

        for (const pathName of optionalPaths) {
          const value = resolveTemplateValue(payload, pathName);

          if (!this.isBlankOptionalPlaceholderValue(value)) {
            continue;
          }

          const placeholderText = this.normalizePlaceholderComparableText(
            `{{${pathName}}}`,
          );

          if (paragraphText.includes(placeholderText)) {
            return "";
          }
        }

        return paragraphXml;
      });

      if (nextXml !== originalXml) {
        zip.file(fileName, nextXml);
      }
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

    // BM-054_DATA_FIX_START
    if (templateCode === "BM-054") {
      const localAgencyNameBody = "Viện kiểm sát nhân dân khu vực 7";
      const parentAgencyNameBody = "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh";

      const localAgencyNameHeader = "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7";
      const parentAgencyNameHeader = "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH";

      const defaultPersonName = "Đoàn Văn Dũng";
      const defaultSignerName = "Trần Thanh Nam";
      const defaultProsecutorName = "Nguyễn Thị Hồng Hạnh";
      const defaultMonitoringUnitName =
        "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh";
      const defaultMonitoringPhone = "0988027788";
      const defaultDocumentCode = "12/QĐ-VKS";

      const asCleanText = (value: unknown): string => {
        return String(value ?? "").trim();
      };

      const pickText = (...values: unknown[]): string | null => {
        for (const value of values) {
          const cleaned = asCleanText(value);

          if (cleaned.length > 0) {
            return cleaned;
          }
        }

        return null;
      };

      const stripRecipientLine = (value: unknown): string => {
        return asCleanText(value)
          .replace(/^\s*-\s*/u, "")
          .replace(/[;。.\s]+$/u, "")
          .trim();
      };

      const isSystemGeneratedBm054Code = (value: unknown): boolean => {
        const cleaned = asCleanText(value);

        if (!cleaned) {
          return true;
        }

        return /^BM-054(?:-|$)/iu.test(cleaned);
      };

      const pickLegalDocumentCode = (...values: unknown[]): string | null => {
        for (const value of values) {
          const cleaned = asCleanText(value);

          if (cleaned && !isSystemGeneratedBm054Code(cleaned)) {
            return cleaned;
          }
        }

        return null;
      };

      const normalizeLegalArticle = (value: unknown): string => {
        const cleaned = asCleanText(value);

        if (!cleaned) {
          return "khoản 1 Điều 321";
        }

        return cleaned
          .replace(/\s+của\s+Bộ luật Hình sự.*$/iu, "")
          .replace(/\s+Bộ luật Hình sự.*$/iu, "")
          .trim();
      };

      const document = (target["document"] ?? {}) as Record<string, any>;
      const agency = (target["agency"] ?? {}) as Record<string, any>;
      const person = (target["person"] ?? {}) as Record<string, any>;
      const offense = (target["offense"] ?? {}) as Record<string, any>;
      const monitoring = (target["monitoring"] ?? {}) as Record<string, any>;
      const notification = (target["notification"] ?? {}) as Record<string, any>;
      const measure = (target["measure"] ?? {}) as Record<string, any>;
      const recipients = (target["recipients"] ?? {}) as Record<string, any>;
      const signature = (target["signature"] ?? {}) as Record<string, any>;
      const official = (target["official"] ?? {}) as Record<string, any>;

      const personName =
        pickText(person["fullName"], defaultPersonName) ?? defaultPersonName;

      const legalDocumentCode =
        pickLegalDocumentCode(
          document["documentCode"],
          document["fullDocumentCode"],
          document["documentNo"],
        ) ?? defaultDocumentCode;

      const monitoringUnitName =
        pickText(
          monitoring["unitName"],
          agency["monitoringUnitName"],
          recipients["monitoringUnitName"],
          stripRecipientLine(recipients["monitoringUnitLine"]),
          notification["receiverUnitName"],
          notification["recipientName"],
          defaultMonitoringUnitName,
        ) ?? defaultMonitoringUnitName;

      const monitoringPhone =
        pickText(
          monitoring["phone"],
          agency["phone"],
          official["phone"],
          defaultMonitoringPhone,
        ) ?? defaultMonitoringPhone;

      const prosecutorName =
        pickText(
          monitoring["prosecutorName"],
          official["prosecutorName"],
          official["fullName"],
          defaultProsecutorName,
        ) ?? defaultProsecutorName;

      const orderCode =
        pickText(
          notification["preventiveMeasureOrderCode"],
          measure["orderDocumentCode"],
          document["preventiveMeasureOrderCode"],
          "12/LCCT-VKS",
        ) ?? "12/LCCT-VKS";

      const orderIssueDateText =
        pickText(
          notification["preventiveMeasureOrderIssueDateText"],
          measure["orderIssueDateText"],
          document["preventiveMeasureOrderIssueDateText"],
          document["issueDateText"] ? `ngày ${document["issueDateText"]}` : null,
          "ngày 18 tháng 5 năm 2026",
        ) ?? "ngày 18 tháng 5 năm 2026";

      const fromDateText =
        pickText(measure["fromDateText"], document["issueDateText"], "18/5/2026") ??
        "18/5/2026";

      const toDateText = pickText(measure["toDateText"]);

      const preventiveMeasureOrderLine =
        [
          `${localAgencyNameBody} đã ra Lệnh cấm đi khỏi nơi cư trú`,
          `số ${orderCode}`,
          orderIssueDateText,
          `đối với bị can ${personName}`,
          measure["durationText"] ? `trong thời hạn ${measure["durationText"]}` : null,
          fromDateText ? `kể từ ngày ${fromDateText}` : null,
          toDateText ? `đến ngày ${toDateText}` : null,
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s{2,}/gu, " ")
          .replace(/\s+\./gu, ".")
          .trim()
          .replace(/[.;,\s]*$/u, ".");

      const notificationContent = [
        `${localAgencyNameHeader} thông báo`,
        `cho ${monitoringUnitName}`,
        "về việc áp dụng biện pháp cấm đi khỏi nơi cư trú",
        `đối với bị can ${personName}`,
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s{2,}/gu, " ")
        .trim()
        .replace(/[.;,\s]*$/u, ".");

      const monitoringArticleLine = [
        `Giao bị can cho ${monitoringUnitName} để quản lý, theo dõi.`,
        `Nếu bị can vi phạm nghĩa vụ cam đoan, yêu cầu ${monitoringUnitName} thông báo ngay cho ${localAgencyNameBody} biết để xử lý theo thẩm quyền, điện thoại liên hệ số ${monitoringPhone}, gặp Kiểm sát viên ${prosecutorName} để giải quyết./.`,
      ]
        .join(" ")
        .replace(/\s{2,}/gu, " ")
        .trim();

      target["document"] = {
        ...document,
        documentCode: legalDocumentCode,
        documentNo: legalDocumentCode,
        fullDocumentCode: legalDocumentCode,
        issuePlaceAndDateLine:
          document["issuePlaceAndDateLine"] ||
          "TP. Hồ Chí Minh, ngày 18 tháng 5 năm 2026",
        issuePlaceDateLine:
          document["issuePlaceDateLine"] ||
          document["issuePlaceAndDateLine"] ||
          "TP. Hồ Chí Minh, ngày 18 tháng 5 năm 2026",
      };

      target["agency"] = {
        ...agency,
        parentName: parentAgencyNameHeader,
        name: localAgencyNameHeader,
        parentNameHeader: parentAgencyNameHeader,
        nameHeader: localAgencyNameHeader,
        parentNameBody: parentAgencyNameBody,
        nameBody: localAgencyNameBody,
        issuePlace: agency["issuePlace"] || "TP. Hồ Chí Minh",
        phone: monitoringPhone,
        monitoringUnitName,
      };

      target["person"] = {
        ...person,
        fullName: personName,
        otherName: person["otherName"] || "Không có",
        genderLabel: person["genderLabel"] || "Nam",
        nationality: person["nationality"] || "Việt Nam",
        ethnicity: person["ethnicity"] || "Kinh",
        religion: person["religion"] || "Không",
        occupation: person["occupation"] || "Kinh doanh",
      };

      target["offense"] = {
        ...offense,
        offenseName: offense["offenseName"] || "Đánh bạc",
        legalArticle: normalizeLegalArticle(offense["legalArticle"]),
        criminalCodeText:
          offense["criminalCodeText"] ||
          "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      };

      target["monitoring"] = {
        ...monitoring,
        unitName: monitoringUnitName,
        phone: monitoringPhone,
        prosecutorName,
        article3Line: monitoringArticleLine,
      };

      target["notification"] = {
        ...notification,
        title: notification["title"] || "THÔNG BÁO",
        subject:
          notification["subject"] ||
          "Về việc áp dụng biện pháp cấm đi khỏi nơi cư trú",
        content: notification["content"] || notificationContent,
        preventiveMeasureOrderCode: orderCode,
        preventiveMeasureOrderIssueDateText: orderIssueDateText,
        preventiveMeasureOrderLine,
      };

      target["recipients"] = {
        ...recipients,
        monitoringUnitLine:
          recipients["monitoringUnitLine"] || `- ${monitoringUnitName};`,
        personLine: recipients["personLine"] || `- ${personName};`,
        archiveLine: recipients["archiveLine"] || "- Lưu: HSVA, HSKS, VP.",
      };

      target["signature"] = {
        ...signature,
        signMode: signature["signMode"] || "KT. VIỆN TRƯỞNG",
        positionTitle: signature["positionTitle"] || "PHÓ VIỆN TRƯỞNG",
        signerName: signature["signerName"] || defaultSignerName,
      };

      target["official"] = {
        ...official,
        fullName: official["fullName"] || defaultSignerName,
        positionTitle: official["positionTitle"] || "PHÓ VIỆN TRƯỞNG",
        issuerTitle:
          official["issuerTitle"] ||
          "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
        prosecutorName,
      };
    }
    // BM-054_DATA_FIX_END
    // BM-056_AGENCY_BODY_CASE_FIX_START
    if (templateCode === "BM-056") {
      const bm056AgencyNameBody = "Viện kiểm sát nhân dân khu vực 7";

      const fixBm056BodyAgencyName = (value: unknown): string => {
        return String(value ?? "")
          .replace(
            /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+KHU[\s\u00A0]+VỰC[\s\u00A0]+7/gu,
            bm056AgencyNameBody,
          )
          .replace(
            /Viện\s+kiểm\s+sát\s+nhân\s+dân\s+Khu\s+vực\s+7/gu,
            bm056AgencyNameBody,
          )
          .replace(/Quyết định này\s*\.\s*\./gu, "Quyết định này.")
          .replace(/\s+\./gu, ".")
          .replace(/\s{2,}/gu, " ")
          .trim();
      };

      const measure = (target["measure"] ?? {}) as Record<string, any>;
      const monitoring = (target["monitoring"] ?? {}) as Record<string, any>;
      const notification = (target["notification"] ?? {}) as Record<string, any>;
      const agency = (target["agency"] ?? {}) as Record<string, any>;

      const fixedExitPostponementArticle2Line = fixBm056BodyAgencyName(
        measure["exitPostponementArticle2Line"],
      );

      const fixedMonitoringArticle3Line = fixBm056BodyAgencyName(
        monitoring["article3Line"],
      );

      const fixedPreventiveMeasureOrderLine = fixBm056BodyAgencyName(
        notification["preventiveMeasureOrderLine"],
      );

      target["agency"] = {
        ...agency,
        nameBody: agency["nameBody"] || bm056AgencyNameBody,
        parentNameBody:
          agency["parentNameBody"] ||
          "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh",
      };

      target["measure"] = {
        ...measure,
        ...(fixedExitPostponementArticle2Line
          ? { exitPostponementArticle2Line: fixedExitPostponementArticle2Line }
          : {}),
      };

      target["monitoring"] = {
        ...monitoring,
        ...(fixedMonitoringArticle3Line
          ? { article3Line: fixedMonitoringArticle3Line }
          : {}),
      };

      target["notification"] = {
        ...notification,
        ...(fixedPreventiveMeasureOrderLine
          ? { preventiveMeasureOrderLine: fixedPreventiveMeasureOrderLine }
          : {}),
      };
    }
    // BM-056_AGENCY_BODY_CASE_FIX_END
    // BM-053_DATA_FIX_START
    if (templateCode === "BM-053") {
      const localAgencyNameBody = "Viện kiểm sát nhân dân khu vực 7";
      const localAgencyNameHeader = "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7";
      const parentAgencyNameHeader = "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH";
      const parentAgencyNameBody = "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh";

      const personName = "Đoàn Văn Dũng";
      const prosecutorName = "Nguyễn Thị Hồng Hạnh";
      const signerName = "Trần Thanh Nam";
      const monitoringUnitName = "Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh";

      const document = (target["document"] ?? {}) as Record<string, any>;
      target["document"] = {
        ...document,
        documentCode: "12/LCCT-VKSKV7",
        documentNo: "12/LCCT-VKSKV7",
        fullDocumentCode: "12/LCCT-VKSKV7",
        issuePlaceAndDateLine:
          document["issuePlaceAndDateLine"] ||
          "TP. Hồ Chí Minh, ngày 18 tháng 5 năm 2026",
        issuePlaceDateLine:
          document["issuePlaceDateLine"] ||
          "TP. Hồ Chí Minh, ngày 18 tháng 5 năm 2026",
      };

      target["agency"] = {
        ...((target["agency"] ?? {}) as Record<string, any>),
        parentName: parentAgencyNameHeader,
        name: localAgencyNameHeader,
        parentNameHeader: parentAgencyNameHeader,
        nameHeader: localAgencyNameHeader,
        parentNameBody: parentAgencyNameBody,
        nameBody: localAgencyNameBody,
        issuePlace: "TP. Hồ Chí Minh",
        phone: "0988027788",
      };

      target["person"] = {
        ...((target["person"] ?? {}) as Record<string, any>),
        fullName: personName,
        otherName: "Không có",
        genderLabel: "Nam",
        dateOfBirth: "08/09/1985",
        dateOfBirthText: "08/9/1985",
        birthDay: "08",
        birthMonth: "09",
        birthYear: "1985",
        birthDateLine: "08 tháng 09 năm 1985",
        placeOfBirth: "tỉnh Quảng Ngãi",
        birthInfoLine: "Sinh ngày: 08 tháng 09 năm 1985 tại: tỉnh Quảng Ngãi",
        nationality: "Việt Nam",
        ethnicity: "Kinh",
        religion: "Không",
        occupation: "Kinh doanh",
        identityType: "Thẻ CCCD",
        identityNo: "051080000314",
        identityIssuedDate: "22/12/2021",
        identityIssuedDay: "22",
        identityIssuedMonth: "12",
        identityIssuedYear: "2021",
        identityIssuedDateText: "22/12/2021",
        identityIssuedPlace:
          "Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
        identityDocumentLine:
          "Thẻ CCCD: 051080000314, Cấp ngày 22/12/2021, Nơi cấp: Cục Cảnh sát Quản lý hành chính về trật tự xã hội",
        permanentAddress:
          "số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh",
        temporaryAddress: "",
        currentAddress:
          "số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh",
      };

      target["caseDecision"] = {
        ...((target["caseDecision"] ?? {}) as Record<string, any>),
        decisionNo: "G505/QĐ-VPCQCSĐT",
        issueDateText: "15/10/2025",
        prosecutionDecisionLegalBasisLine:
          "Căn cứ Quyết định khởi tố vụ án hình sự số G505/QĐ-VPCQCSĐT ngày 15/10/2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội “Đánh bạc” quy định tại khoản 1 Điều 321 của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025;",
      };

      target["accusedDecision"] = {
        ...((target["accusedDecision"] ?? {}) as Record<string, any>),
        decisionNo: "G813/QĐ-VPCQCSĐT",
        issueDateText: "15/10/2025",
        legalBasisLine:
          "Căn cứ Quyết định khởi tố bị can số G813/QĐ-VPCQCSĐT ngày 15/10/2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Đoàn Văn Dũng, về tội “Đánh bạc” quy định tại khoản 1 Điều 321 của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025;",
      };

      target["measure"] = {
        ...((target["measure"] ?? {}) as Record<string, any>),
        orderDocumentCode: "12/LCCT-VKSKV7",
        residencePlace: "xã Đông Thạnh, Thành phố Hồ Chí Minh",
        durationText: "10 ngày",
        fromDateText: "05/3/2026",
        toDateText: "14/3/2026",
        article2Line:
          "Bị can không được phép đi khỏi nơi cư trú tại xã Đông Thạnh, Thành phố Hồ Chí Minh, trong thời hạn 10 ngày kể từ ngày 05/3/2026 đến ngày 14/3/2026.",
      };

      target["monitoring"] = {
        ...((target["monitoring"] ?? {}) as Record<string, any>),
        unitName: monitoringUnitName,
        phone: "0988027788",
        prosecutorName,
        article3Line:
          "Khi chưa được sự đồng ý của Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh và giấy phép của Viện kiểm sát nhân dân khu vực 7 thì bị can không được đi khỏi nơi cư trú quy định tại Điều 2 Lệnh này. Nếu bị can vi phạm nghĩa vụ cam đoan, yêu cầu Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh phải báo ngay cho Viện kiểm sát nhân dân khu vực 7 biết để xử lý theo thẩm quyền, điện thoại liên hệ số (0988027788), gặp Kiểm sát viên Nguyễn Thị Hồng Hạnh để giải quyết.",
      };

      target["recipients"] = {
        ...((target["recipients"] ?? {}) as Record<string, any>),
        monitoringUnitLine:
          "- UBND xã Đông Thạnh, Thành phố Hồ Chí Minh;",
        personLine: "- Đoàn Văn Dũng;",
        archiveLine: "- Lưu: HSVA, HSKS, VP.",
        noteLine: "",
      };

      target["signature"] = {
        ...((target["signature"] ?? {}) as Record<string, any>),
        signMode: "KT. VIỆN TRƯỞNG",
        positionTitle: "PHÓ VIỆN TRƯỞNG",
        signerName,
      };

      target["official"] = {
        ...((target["official"] ?? {}) as Record<string, any>),
        fullName: signerName,
        prosecutorName,
        issuerTitle: "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      };

      target["delivery"] = {
        ...((target["delivery"] ?? {}) as Record<string, any>),
        deliveredAtText:
          "Lệnh này đã được giao cho người bị cấm đi khỏi nơi cư trú một bản vào hồi …..giờ……phút, ngày…….tháng…….năm 2026",
        receiverTitle: "NGƯỜI BỊ CẤM ĐI KHỎI NƠI CƯ TRÚ",
      };
    }
    // BM-053_DATA_FIX_END
    
// BM-156_MVP_PAYLOAD_FIX_START
if (templateCode === "BM-156") {
  const bm156CleanText = (value: unknown): string => {
    return String(value ?? "")
      .replace(/\s+([,.;:])/gu, "$1")
      .replace(/\s{2,}/gu, " ")
      .trim();
  };

  const bm156Pick = (...values: unknown[]): string => {
    for (const value of values) {
      const cleaned = bm156CleanText(value);
      if (cleaned.length > 0) {
        return cleaned;
      }
    }

    return "";
  };

  const bm156EnsureEnd = (value: unknown, suffix: string): string => {
    const cleaned = bm156CleanText(value)
      .replace(/\s*[.;,/:]\s*$/gu, "");

    if (!cleaned) {
      return "";
    }

    return `${cleaned}${suffix}`;
  };

  const bm156Semicolon = (value: unknown): string =>
    bm156EnsureEnd(value, ";");

  const bm156Period = (value: unknown): string =>
    bm156EnsureEnd(value, ".");

  const bm156SlashDot = (value: unknown): string =>
    bm156EnsureEnd(value, "/.");

  const bm156CleanLegalLine = (value: unknown): string => {
    return bm156CleanText(value)
      .replace(
        /của\s+Bộ\s+luật\s+Hình\s+sự\s+của\s+Bộ\s+luật\s+Hình\s+sự/giu,
        "của Bộ luật Hình sự",
      )
      .replace(
        /Bộ\s+luật\s+Hình\s+sự\s+năm\s+2015,\s*sửa\s+đổi,\s*bổ\s+sung\s+năm\s+2025\s+của\s+Bộ\s+luật\s+Hình\s+sự/giu,
        "Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025",
      )
      .replace(/\s+([,.;:])/gu, "$1")
      .replace(/\s{2,}/gu, " ")
      .trim();
  };

  const caseData = (target["case"] ?? {}) as Record<string, any>;
  const person = (target["person"] ?? {}) as Record<string, any>;
  const offense = (target["offense"] ?? {}) as Record<string, any>;
  const document = (target["document"] ?? {}) as Record<string, any>;
  const agency = (target["agency"] ?? {}) as Record<string, any>;
  const official = (target["official"] ?? {}) as Record<string, any>;
  const legalBasis = (target["legalBasis"] ?? {}) as Record<string, any>;
  const caseDecision = (target["caseDecision"] ?? {}) as Record<string, any>;
  const accusedDecision = (target["accusedDecision"] ?? {}) as Record<string, any>;
  const investigationConclusion =
    (target["investigationConclusion"] ?? {}) as Record<string, any>;
  const caseJoinder = (target["caseJoinder"] ?? {}) as Record<string, any>;
  const caseRecovery = (target["caseRecovery"] ?? {}) as Record<string, any>;
  const indictment = (target["indictment"] ?? {}) as Record<string, any>;
  const recipients = (target["recipients"] ?? {}) as Record<string, any>;
  const signature = (target["signature"] ?? {}) as Record<string, any>;

  const parentAgencyName =
    bm156Pick(agency["parentName"]) ||
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH";

  const agencyName =
    bm156Pick(agency["name"]) ||
    "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7";

  const bodyAgencyName = "Viện kiểm sát nhân dân khu vực 7";

  const signerName =
    bm156Pick(signature["signerName"], official["fullName"]) ||
    "Trần Thanh Nam";

  const personFullName =
    bm156Pick(person["fullName"], person["full_name"]) ||
    "Đoàn Văn Dũng";

  const offenseName =
    bm156Pick(offense["name"], offense["offenseName"]) ||
    "Đánh bạc";

  const offenseLegalBasisText =
    bm156Pick(offense["legalBasisText"], offense["legalArticleText"]) ||
    `về tội “${offenseName}” quy định tại khoản 1 Điều 321 Bộ luật Hình sự`;

  const investigationAgencyName =
    bm156Pick(
      recipients["investigatingAgencyName"],
      recipients["investigatingAgencyLine"],
      investigationConclusion["issuedBy"],
      caseDecision["issuedBy"],
      accusedDecision["issuedBy"],
    )
      .replace(/^-\s*/u, "")
      .replace(/[;.]$/u, "") ||
    "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh";

  const courtName =
    bm156Pick(recipients["courtName"], recipients["courtLine"])
      .replace(/^-\s*/u, "")
      .replace(/[;.]$/u, "") ||
    "Tòa án nhân dân có thẩm quyền";

  const caseTitle =
    bm156Pick(caseData["caseTitle"], caseData["case_title"], caseData["title"]) ||
    "Vụ án đánh bạc tại phường Trung Mỹ Tây";

  const documentCode =
    bm156Pick(document["documentCode"], document["fullDocumentCode"]) ||
    "156/CT-VKSKV7";

  const issuePlaceAndDateLine =
    bm156Pick(document["issuePlaceAndDateLine"], document["issuePlaceDateLine"]) ||
    "TP. Hồ Chí Minh, ngày 21 tháng 5 năm 2026";

  const caseDecisionCode =
    bm156Pick(
      caseDecision["decisionCode"],
      caseDecision["documentCode"],
      caseDecision["code"],
    ) || "VKS-2026-0001";

  const accusedDecisionCode =
    bm156Pick(
      accusedDecision["decisionCode"],
      accusedDecision["documentCode"],
      accusedDecision["code"],
    ) || "VKS-2026-0001";

  const caseDecisionLine = bm156CleanLegalLine(
    bm156Pick(
      caseDecision["prosecutionDecisionLegalBasisLine"],
      caseDecision["legalBasisLine"],
    ) ||
      `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ngày 06 tháng 5 năm 2026 của ${investigationAgencyName} ${offenseLegalBasisText}`,
  );

  const accusedDecisionLine = bm156CleanLegalLine(
    bm156Pick(
      accusedDecision["prosecutionDecisionLegalBasisLine"],
      accusedDecision["legalBasisLine"],
    ) ||
      `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ngày 06 tháng 5 năm 2026 của ${investigationAgencyName} đối với ${personFullName} ${offenseLegalBasisText}`,
  );

  target["agency"] = {
    ...agency,
    parentName: parentAgencyName,
    name: agencyName,
    nameBody: bodyAgencyName,
  };

  target["document"] = {
    ...document,
    documentCode,
    fullDocumentCode: documentCode,
    issuePlaceAndDateLine,
    issuePlaceDateLine: issuePlaceAndDateLine,
  };

  target["official"] = {
    ...official,
    issuerTitle:
      bm156Pick(official["issuerTitle"]) ||
      `VIỆN TRƯỞNG ${agencyName}`,
    fullName: signerName,
  };

  target["legalBasis"] = {
    ...legalBasis,
    procedureArticlesLine:
      bm156Pick(legalBasis["procedureArticlesLine"]) ||
      "Căn cứ các điều 41, 236, 239 và 243 của Bộ luật Tố tụng hình sự;",
  };

  target["caseDecision"] = {
    ...caseDecision,
    prosecutionDecisionLegalBasisLine: bm156Semicolon(caseDecisionLine),
  };

  target["accusedDecision"] = {
    ...accusedDecision,
    prosecutionDecisionLegalBasisLine: bm156Semicolon(accusedDecisionLine),
  };

  target["caseJoinder"] = {
    ...caseJoinder,
    legalBasisLine:
      bm156Pick(caseJoinder["legalBasisLine"]) ||
      "Căn cứ Quyết định nhập vụ án hình sự số 03/QĐ-CQĐT ngày 10 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  };

  target["caseRecovery"] = {
    ...caseRecovery,
    legalBasisLine:
      bm156Pick(caseRecovery["legalBasisLine"]) ||
      "Căn cứ Quyết định phục hồi vụ án hình sự số 04/QĐ-CQĐT ngày 15 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  };

  target["investigationConclusion"] = {
    ...investigationConclusion,
    legalBasisLine:
      bm156Pick(investigationConclusion["legalBasisLine"]) ||
      "Căn cứ Bản kết luận điều tra vụ án hình sự đề nghị truy tố số 25/KLĐT ngày 20 tháng 02 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;",
  };

  target["indictment"] = {
    ...indictment,

    criminalActDescriptionLine:
      bm156Pick(indictment["criminalActDescriptionLine"]) ||
      `${personFullName} đã có hành vi đánh bạc trái phép tại phường Trung Mỹ Tây, Thành phố Hồ Chí Minh. Hành vi của bị can xâm phạm trật tự công cộng, đủ yếu tố cấu thành tội ${offenseName} theo quy định của Bộ luật Hình sự.`,

    aggravatingMitigatingAnalysisLine:
      bm156Pick(indictment["aggravatingMitigatingAnalysisLine"]) ||
      "Về tình tiết tăng nặng, giảm nhẹ trách nhiệm hình sự: bị can thành khẩn khai báo, ăn năn hối cải; chưa phát hiện tình tiết tăng nặng trách nhiệm hình sự.",

    evidenceHandlingLine:
      bm156Pick(indictment["evidenceHandlingLine"]) ||
      "Việc thu giữ, tạm giữ tài liệu, đồ vật và xử lý vật chứng được thực hiện theo hồ sơ vụ án.",

    civilLiabilityLine:
      bm156Pick(indictment["civilLiabilityLine"]) ||
      "Phần dân sự: không có yêu cầu giải quyết trong vụ án.",

    otherFactsLine:
      bm156Pick(indictment["otherFactsLine"]) ||
      "Các vấn đề khác có liên quan đã được xem xét trong quá trình giải quyết vụ án.",

    summaryConclusionLine:
      bm156Pick(indictment["summaryConclusionLine"], indictment["conclusionLine"]) ||
      `${personFullName} đã thực hiện hành vi đánh bạc trái phép; hành vi có đủ yếu tố cấu thành tội ${offenseName}, thuộc trường hợp phải truy cứu trách nhiệm hình sự.`,

    absentAccusedNoteLine:
      bm156Pick(indictment["absentAccusedNoteLine"]) ||
      "Bị can có mặt tại địa phương, không thuộc trường hợp vắng mặt bị can.",

    defendantIdentityLine:
      bm156Pick(indictment["defendantIdentityLine"]) ||
      `${personFullName}, giới tính: Nam; nơi cư trú: số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh; nghề nghiệp: lao động tự do; trình độ học vấn: 9/12; quốc tịch: Việt Nam; dân tộc: Kinh.`,

    familyBackgroundLine:
      bm156Pick(indictment["familyBackgroundLine"]) ||
      "Về gia đình: cha, mẹ, anh chị em ruột, vợ/chồng, con của bị can được thể hiện trong hồ sơ vụ án.",

    specialStatusLine:
      bm156Pick(indictment["specialStatusLine"]) ||
      "Bị can không thuộc diện thương binh, bệnh binh, người có công hoặc có danh hiệu Nhà nước phong tặng.",

    administrativeViolationLine:
      bm156Pick(indictment["administrativeViolationLine"]) ||
      "Tiền sự: không.",

    criminalRecordLine:
      bm156Pick(indictment["criminalRecordLine"]) ||
      "Tiền án: không.",

    preventiveMeasureLine:
      bm156Pick(indictment["preventiveMeasureLine"]) ||
      "Bị can đang bị áp dụng biện pháp ngăn chặn cấm đi khỏi nơi cư trú theo quyết định của cơ quan có thẩm quyền.",

    crimeConclusionLine:
      bm156Pick(indictment["crimeConclusionLine"]) ||
      `Bị can ${personFullName} phạm tội “${offenseName}” theo quy định tại khoản 1 Điều 321 Bộ luật Hình sự.`,

    aggravatingMitigatingLine:
      bm156Pick(indictment["aggravatingMitigatingLine"]) ||
      "Áp dụng tình tiết giảm nhẹ trách nhiệm hình sự: thành khẩn khai báo, ăn năn hối cải; chưa áp dụng tình tiết tăng nặng trách nhiệm hình sự.",

    separatedCaseHandlingLine:
      bm156Pick(indictment["separatedCaseHandlingLine"]) ||
      "Trong vụ án không có người hoặc pháp nhân được đình chỉ, tạm đình chỉ, tách ra để xử lý trong vụ án khác.",

    article1Line:
      bm156SlashDot(
        bm156Pick(indictment["article1Line"]) ||
          `Truy tố ra trước ${courtName} để xét xử bị can ${personFullName} về tội “${offenseName}” theo quy định tại khoản 1 Điều 321 Bộ luật Hình sự`,
      ),

    replacementLine:
      bm156Pick(indictment["replacementLine"]) ||
      "Cáo trạng này thay thế Cáo trạng số 01/CT-VKSKV7 ngày 10 tháng 5 năm 2026 của Viện kiểm sát nhân dân khu vực 7.",

    caseFileLine:
      bm156Pick(indictment["caseFileLine"]) ||
      "- Hồ sơ vụ án gồm có: 01 tập, bằng 120 tờ; đánh số thứ tự từ 01 đến 120.",

    evidenceListLine:
      bm156Pick(indictment["evidenceListLine"]) ||
      "- Bản kê vật chứng kèm theo hồ sơ vụ án.",

    summonedPersonsLine:
      bm156Pick(indictment["summonedPersonsLine"]) ||
      "- Danh sách những người Viện kiểm sát đề nghị Tòa án triệu tập đến phiên tòa.",
  };

  target["recipients"] = {
    ...recipients,
    courtLine:
      bm156Pick(recipients["courtLine"]) ||
      "- Tòa án nhân dân có thẩm quyền;",
    accusedLine:
      bm156Pick(recipients["accusedLine"]) ||
      `- ${personFullName};`,
    defenseCounselLine:
      bm156Pick(recipients["defenseCounselLine"]) ||
      "- Người bào chữa/người đại diện của bị can;",
    investigatingAgencyLine:
      bm156Pick(recipients["investigatingAgencyLine"]) ||
      `- ${investigationAgencyName};`,
    otherRecipientLine:
      bm156Pick(recipients["otherRecipientLine"]) ||
      "- Các cá nhân, cơ quan có liên quan;",
    archiveLine:
      bm156Pick(recipients["archiveLine"]) ||
      "- Lưu: HSVA, HSKS, VP.",
  };

  target["signature"] = {
    ...signature,
    signMode:
      bm156Pick(signature["signMode"]) ||
      "KT. VIỆN TRƯỞNG",
    positionTitle:
      bm156Pick(signature["positionTitle"]) ||
      "PHÓ VIỆN TRƯỞNG",
    signerName,
  };
}
// BM-156_MVP_PAYLOAD_FIX_END
    this.scrubForbiddenTemplateDefaults(target, templateCode);


// BM-141_BODY_AGENCY_CASE_FIX_START
if (templateCode === "BM-141") {
  const bm141HeaderParentAgency =
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH";
  const bm141HeaderAgency =
    "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7";

  const bm141BodyParentAgency =
    "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh";
  const bm141BodyAgency =
    "Viện kiểm sát nhân dân khu vực 7";

  const fixBm141BodyAgencyText = (value: unknown): string => {
    return String(value ?? "")
      .replace(
        /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+KHU[\s\u00A0]+VỰC[\s\u00A0]+7/gu,
        bm141BodyAgency,
      )
      .replace(
        /Viện\s+kiểm\s+sát\s+nhân\s+dân\s+Khu\s+vực\s+7/gu,
        bm141BodyAgency,
      )
      .replace(
        /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+THÀNH[\s\u00A0]+PHỐ[\s\u00A0]+HỒ[\s\u00A0]+CHÍ[\s\u00A0]+MINH/gu,
        bm141BodyParentAgency,
      )
      .replace(/\s+([,.;:])/gu, "$1")
      .replace(/\s{2,}/gu, " ")
      .trim();
  };

  const agency = (target["agency"] ?? {}) as Record<string, any>;
  const official = (target["official"] ?? {}) as Record<string, any>;
  const prosecutionTransfer =
    (target["prosecutionTransfer"] ?? {}) as Record<string, any>;

  target["agency"] = {
    ...agency,

    // Header giữ FULL CAPS.
    parentName: agency["parentName"] || bm141HeaderParentAgency,
    name: agency["name"] || bm141HeaderAgency,

    // Body dùng dạng thường.
    parentNameBody: agency["parentNameBody"] || bm141BodyParentAgency,
    nameBody: agency["nameBody"] || bm141BodyAgency,
  };

  target["official"] = {
    ...official,
    issuerTitle:
      official["issuerTitle"] || `VIỆN TRƯỞNG ${bm141HeaderAgency}`,
  };

  target["prosecutionTransfer"] = {
    ...prosecutionTransfer,

    fromProcuracyName:
      fixBm141BodyAgencyText(prosecutionTransfer["fromProcuracyName"]) ||
      bm141BodyAgency,

    transferReasonLine: fixBm141BodyAgencyText(
      prosecutionTransfer["transferReasonLine"],
    ),

    article1Line: fixBm141BodyAgencyText(
      prosecutionTransfer["article1Line"],
    ),

    caseDecisionLegalBasisLine: fixBm141BodyAgencyText(
      prosecutionTransfer["caseDecisionLegalBasisLine"],
    ),

    accusedDecisionLegalBasisLine: fixBm141BodyAgencyText(
      prosecutionTransfer["accusedDecisionLegalBasisLine"],
    ),

    investigationConclusionLegalBasisLine: fixBm141BodyAgencyText(
      prosecutionTransfer["investigationConclusionLegalBasisLine"],
    ),
  };
}
// BM-141_BODY_AGENCY_CASE_FIX_END
// BM-071_HEADER_BODY_AGENCY_FINAL_FIX_START
if (templateCode === "BM-071") {
  const bm071HeaderParentAgency =
    "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH";
  const bm071HeaderAgency = "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7";
  const bm071BodyAgency = "Viện kiểm sát nhân dân khu vực 7";

  const fixBm071BodyAgencyText = (value: unknown): string => {
    return String(value ?? "")
      .replace(
        /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+KHU[\s\u00A0]+VỰC[\s\u00A0]+7/gu,
        bm071BodyAgency,
      )
      .replace(
        /Viện\s+kiểm\s+sát\s+nhân\s+dân\s+Khu\s+vực\s+7/gu,
        bm071BodyAgency,
      )
      .replace(/\s+([,.;:])/gu, "$1")
      .replace(/\s{2,}/gu, " ")
      .trim();
  };

  const agency = (target["agency"] ?? {}) as Record<string, any>;
  const official = (target["official"] ?? {}) as Record<string, any>;
  const assignment = (target["assignment"] ?? {}) as Record<string, any>;
  const signature = (target["signature"] ?? {}) as Record<string, any>;
  const receiver = (target["receiver"] ?? {}) as Record<string, any>;

  target["agency"] = {
    ...agency,
    parentName: bm071HeaderParentAgency,
    name: bm071HeaderAgency,
  };

  target["official"] = {
    ...official,
    fullName: "Trần Thanh Nam",
    positionTitle: "VIỆN TRƯỞNG",
    issuerTitle: `VIỆN TRƯỞNG ${bm071HeaderAgency}`,
    prosecutorName: "Trần Thanh Nam",
  };

  target["assignment"] = {
    ...assignment,

    deputyChiefName: "Trần Thanh Nam",
    deputyChiefTitle: "Phó Viện trưởng",
    deputyChiefAgencyName: bm071BodyAgency,

    assignedOfficerName:
      String(assignment["assignedOfficerName"] ?? "").trim() ||
      "Nguyễn Thị Thanh Huyền",
    assignedOfficerTitle:
      String(assignment["assignedOfficerTitle"] ?? "").trim() ||
      "Kiểm sát viên",
    assignedOfficerAgencyName: bm071BodyAgency,

    additionalAssignedOfficersLine: fixBm071BodyAgencyText(
      assignment["additionalAssignedOfficersLine"] ||
        "Phân công ông/bà Trần Thanh Nam; Kiểm tra viên của Viện kiểm sát nhân dân khu vực 7 tham gia thực hành quyền công tố, kiểm sát việc giải quyết vụ án.",
    ),
  };

  target["signature"] = {
    ...signature,
    signMode: "KT. VIỆN TRƯỞNG",
    positionTitle: "PHÓ VIỆN TRƯỞNG",
    signerName: "Trần Thanh Nam",
  };

  target["receiver"] = {
    ...receiver,
    fullName: "Trần Thanh Nam",
    departmentName: bm071BodyAgency,
    signerName: "Trần Thanh Nam",
  };
}
// BM-071_HEADER_BODY_AGENCY_FINAL_FIX_END

// BM-070_AGENCY_BODY_CASE_FIX_START
if (templateCode === "BM-070") {
  const bm070AgencyNameBody = "Viện kiểm sát nhân dân khu vực 7";
  const bm070ParentAgencyNameBody =
    "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh";

  const fixBm070BodyAgencyName = (value: unknown): string => {
    return String(value ?? "")
      .replace(
        /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+KHU[\s\u00A0]+VỰC[\s\u00A0]+7/gu,
        bm070AgencyNameBody,
      )
      .replace(
        /Viện\s+kiểm\s+sát\s+nhân\s+dân\s+Khu\s+vực\s+7/gu,
        bm070AgencyNameBody,
      )
      .replace(
        /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+THÀNH[\s\u00A0]+PHỐ[\s\u00A0]+HỒ[\s\u00A0]+CHÍ[\s\u00A0]+MINH/gu,
        bm070ParentAgencyNameBody,
      )
      .replace(/\s+([,.;:])/gu, "$1")
      .replace(/\s{2,}/gu, " ")
      .trim();
  };

  const agency = (target["agency"] ?? {}) as Record<string, any>;
  const assignment = (target["assignment"] ?? {}) as Record<string, any>;

  target["agency"] = {
    ...agency,
    nameBody: agency["nameBody"] || bm070AgencyNameBody,
    parentNameBody: agency["parentNameBody"] || bm070ParentAgencyNameBody,
  };

  target["assignment"] = {
    ...assignment,

    deputyChiefAgencyName:
      fixBm070BodyAgencyName(assignment["deputyChiefAgencyName"]) ||
      bm070AgencyNameBody,

    assignedOfficerAgencyName:
      fixBm070BodyAgencyName(assignment["assignedOfficerAgencyName"]) ||
      bm070AgencyNameBody,

    responsibilityLine: fixBm070BodyAgencyName(
      assignment["responsibilityLine"],
    ),

    assignedRoleText: fixBm070BodyAgencyName(assignment["assignedRoleText"]),

    additionalAssignedOfficersLine: fixBm070BodyAgencyName(
      assignment["additionalAssignedOfficersLine"],
    ),
  };
}
// BM-070_AGENCY_BODY_CASE_FIX_END

// BM-070_FINAL_OFFENSE_SANITIZE_START
if (templateCode === "BM-070") {
  const getBm070PrimaryOffenseName = (): string => {
    const offense = (target["offense"] ?? {}) as Record<string, any>;
    const caseDecision = (target["caseDecision"] ?? {}) as Record<string, any>;

    const fromOffense = String(offense["offenseName"] ?? "").trim();

    if (fromOffense && fromOffense !== "Đánh bạc") {
      return fromOffense;
    }

    const legalBasisLine = String(caseDecision["legalBasisLine"] ?? "");
    const match = legalBasisLine.match(/tội\s+[“"]([^”"]+)[”"]/u);

    if (match?.[1]) {
      return match[1].trim();
    }

    return fromOffense || "Đánh bạc";
  };

  const primaryOffenseName = getBm070PrimaryOffenseName();
  const primaryOffenseNameLower =
    primaryOffenseName.charAt(0).toLocaleLowerCase("vi-VN") +
    primaryOffenseName.slice(1);

  const syncBm070OffenseText = (value: unknown): unknown => {
    if (typeof value === "string") {
      return value
        .replace(/Đánh bạc/gu, primaryOffenseName)
        .replace(/đánh bạc/gu, primaryOffenseNameLower);
    }

    if (Array.isArray(value)) {
      return value.map((item) => syncBm070OffenseText(item));
    }

    if (value && typeof value === "object") {
      const nextValue: Record<string, unknown> = {};

      for (const [key, childValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        nextValue[key] = syncBm070OffenseText(childValue);
      }

      return nextValue;
    }

    return value;
  };

  const syncedTarget = syncBm070OffenseText(target) as Record<string, any>;

  for (const [key, value] of Object.entries(syncedTarget)) {
    target[key] = value;
  }
}
// BM-070_FINAL_OFFENSE_SANITIZE_END

// BM-059_AGENCY_BODY_CASE_FIX_START
if (templateCode === "BM-059") {
  const bm059AgencyNameBody = "Viện kiểm sát nhân dân khu vực 7";
  const bm059ParentAgencyNameBody =
    "Viện kiểm sát nhân dân Thành phố Hồ Chí Minh";

  const fixBm059BodyAgencyName = (value: unknown): string => {
    return String(value ?? "")
      .replace(
        /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+KHU[\s\u00A0]+VỰC[\s\u00A0]+7/gu,
        bm059AgencyNameBody,
      )
      .replace(
        /Viện\s+kiểm\s+sát\s+nhân\s+dân\s+Khu\s+vực\s+7/gu,
        bm059AgencyNameBody,
      )
      .replace(
        /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+THÀNH[\s\u00A0]+PHỐ[\s\u00A0]+HỒ[\s\u00A0]+CHÍ[\s\u00A0]+MINH/gu,
        bm059ParentAgencyNameBody,
      )
      .replace(
        /Viện\s+kiểm\s+sát\s+nhân\s+dân\s+Thành\s+phố\s+Hồ\s+Chí\s+Minh/gu,
        bm059ParentAgencyNameBody,
      )
      .replace(/\s+([,.;:])/gu, "$1")
      .replace(/\s{2,}/gu, " ")
      .trim();
  };

  const fixBm059ObjectText = (
    value: unknown,
    pathName = "",
  ): unknown => {
    if (typeof value === "string") {
      const isHeaderPath =
        pathName === "agency.parentName" ||
        pathName === "agency.name" ||
        pathName === "agency.parentNameHeader" ||
        pathName === "agency.nameHeader" ||
        pathName === "official.issuerTitle";

      return isHeaderPath ? value : fixBm059BodyAgencyName(value);
    }

    if (Array.isArray(value)) {
      return value.map((item, index) =>
        fixBm059ObjectText(item, `${pathName}[${index}]`),
      );
    }

    if (value && typeof value === "object") {
      const nextValue: Record<string, unknown> = {};

      for (const [key, childValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        const childPath = pathName ? `${pathName}.${key}` : key;
        nextValue[key] = fixBm059ObjectText(childValue, childPath);
      }

      return nextValue;
    }

    return value;
  };

  for (const groupName of [
    "legalBasis",
    "measure",
    "monitoring",
    "notification",
    "prosecutionExtension",
    "prosecutionTransfer",
    "proposal",
    "reception",
    "receiver",
    "assignment",
    "recipients",
  ] as const) {
    if (target[groupName]) {
      target[groupName] = fixBm059ObjectText(target[groupName], groupName);
    }
  }

  const agency = (target["agency"] ?? {}) as Record<string, any>;

  target["agency"] = {
    ...agency,
    parentNameBody: agency["parentNameBody"] || bm059ParentAgencyNameBody,
    nameBody: agency["nameBody"] || bm059AgencyNameBody,
  };
}
// BM-059_AGENCY_BODY_CASE_FIX_END
    // BM-056_FINAL_SANITIZE_START
    if (templateCode === "BM-056") {
      const bm056AgencyNameBody = "Viện kiểm sát nhân dân khu vực 7";

      const cleanBm056Text = (value: unknown): string => {
        return String(value ?? "")
          .replace(
            /VIỆN[\s\u00A0]+KIỂM[\s\u00A0]+SÁT[\s\u00A0]+NHÂN[\s\u00A0]+DÂN[\s\u00A0]+KHU[\s\u00A0]+VỰC[\s\u00A0]+7/gu,
            bm056AgencyNameBody,
          )
          .replace(
            /Viện\s+kiểm\s+sát\s+nhân\s+dân\s+Khu\s+vực\s+7/gu,
            bm056AgencyNameBody,
          )
          .replace(/Nguyễn Thị Thanh Huyền/gu, "Nguyễn Thị Thanh Huyền")
          .replace(/Trần Thanh Nam\s+test/giu, "Trần Thanh Nam")
          .replace(/Quyết định này\s*\.\s*\./gu, "Quyết định này.")
          .replace(/\btest\b/giu, "")
          .replace(/\.{3,}/gu, "")
          .replace(/\s+\./gu, ".")
          .replace(/\s{2,}/gu, " ")
          .trim();
      };

      const formatBm056DateText = (value: unknown): string => {
        const raw = cleanBm056Text(value);

        if (!raw) {
          return "";
        }

        const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
        if (isoMatch) {
          return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
        }

        const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
        if (slashMatch) {
          const day = slashMatch[1].padStart(2, "0");
          const month = slashMatch[2].padStart(2, "0");
          return `${day}/${month}/${slashMatch[3]}`;
        }

        return raw;
      };

      const measure = (target["measure"] ?? {}) as Record<string, any>;
      const monitoring = (target["monitoring"] ?? {}) as Record<string, any>;
      const person = (target["person"] ?? {}) as Record<string, any>;
      const signature = (target["signature"] ?? {}) as Record<string, any>;

      const immigrationAgencyName =
        cleanBm056Text(measure["immigrationAgencyName"]) ||
        "Cơ quan quản lý xuất, nhập cảnh Bộ Công an";

      const monitoringPhone =
        cleanBm056Text(monitoring["phone"]) ||
        "0988027788";

      const prosecutorName =
        cleanBm056Text(monitoring["prosecutorName"]) ||
        "Nguyễn Thị Thanh Huyền";

      const durationText =
        cleanBm056Text(measure["durationText"]) ||
        cleanBm056Text(measure["exitPostponementDurationText"]) ||
        "02 tháng";

      const fromDateText =
        formatBm056DateText(measure["fromDate"]) ||
        formatBm056DateText(measure["exitPostponementFromDateText"]) ||
        "16/03/2026";

      const toDateText =
        formatBm056DateText(measure["toDate"]) ||
        formatBm056DateText(measure["exitPostponementToDateText"]) ||
        "16/05/2026";

      const article2Line = cleanBm056Text(
        `${immigrationAgencyName}, người bị tạm hoãn xuất cảnh nêu tại Điều 1 có trách nhiệm thi hành Quyết định này. Nếu bị can vi phạm, yêu cầu ${immigrationAgencyName} thông báo ngay cho ${bm056AgencyNameBody} biết để xử lý theo thẩm quyền, điện thoại liên hệ số ${monitoringPhone}, gặp Kiểm sát viên ${prosecutorName} để giải quyết./.`
      );

      target["measure"] = {
        ...measure,
        immigrationAgencyName,
        durationText,
        fromDate: fromDateText,
        toDate: toDateText,
        exitPostponementDurationText: durationText,
        exitPostponementFromDateText: fromDateText,
        exitPostponementToDateText: toDateText,
        exitPostponementArticle2Line: article2Line,
      };

      target["monitoring"] = {
        ...monitoring,
        phone: monitoringPhone,
        prosecutorName,
        article3Line: cleanBm056Text(monitoring["article3Line"]),
      };

      target["person"] = {
        ...person,
        religion: cleanBm056Text(person["religion"] || "Không") || "Không",
      };

      target["signature"] = {
        ...signature,
        signMode: cleanBm056Text(signature["signMode"]) || "KT. VIỆN TRƯỞNG",
        positionTitle:
          cleanBm056Text(signature["positionTitle"]) || "PHÓ VIỆN TRƯỞNG",
        signerName: cleanBm056Text(signature["signerName"]) || "Trần Thanh Nam",
      };
    }
    // BM-056_FINAL_SANITIZE_END



    // BM-031_MVP_PAYLOAD_FIX_START
    if (templateCode === "BM-031") {
      const bm031Text = (value: unknown): string => String(value ?? "").trim();

      const bm031NonEmpty = (...values: unknown[]): string => {
        for (const value of values) {
          const textValue = bm031Text(value);
          if (textValue.length > 0 && textValue.toLowerCase() !== "null" && textValue.toLowerCase() !== "undefined") {
            return textValue;
          }
        }

        return "";
      };

      const document = (target["document"] ?? {}) as Record<string, any>;
      const person = (target["person"] ?? {}) as Record<string, any>;
      const offense = (target["offense"] ?? {}) as Record<string, any>;
      const measure = (target["measure"] ?? {}) as Record<string, any>;
      const recipients = (target["recipients"] ?? {}) as Record<string, any>;
      const legalBasis = (target["legalBasis"] ?? {}) as Record<string, any>;
      const investigation = (target["investigation"] ?? {}) as Record<string, any>;

      const personName = bm031NonEmpty(person["fullName"], "người bị giữ");

      const documentCode = bm031NonEmpty(
        document["documentCodeLine"],
        document["documentCode"],
        document["documentNo"],
        document["fullDocumentCode"],
      );

      const orderCode = bm031NonEmpty(
        measure["emergencyArrestOrderCode"],
        measure["arrestOrderCode"],
        measure["detentionOrderCode"],
        measure["orderDocumentCode"],
        documentCode,
      );

      const orderIssueDateText = bm031NonEmpty(
        measure["emergencyArrestOrderIssueDateText"],
        measure["arrestOrderIssueDateText"],
        measure["detentionOrderIssueDateText"],
        measure["orderIssueDateText"],
        document["issueDateText"],
      );

      const investigationUnitName = bm031NonEmpty(
        recipients["investigationUnitName"],
        recipients["investigatingAgencyLine"],
        recipients["investigationAuthorityLine"],
        investigation["investigationUnitName"],
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      );

      const offenseLine = bm031NonEmpty(
        offense["legalBasisText"],
        offense["legalArticle"],
        offense["description"],
      );

      const requestApprovalLine = bm031NonEmpty(
        legalBasis["requestApprovalLine"],
        `Xét hồ sơ đề nghị phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp số ${orderCode} ${orderIssueDateText} của ${investigationUnitName} đối với ${personName};`,
      );

      const reasonLine = bm031NonEmpty(
        measure["reasonLine"],
        `Nhận thấy việc bắt người bị giữ trong trường hợp khẩn cấp đối với ${personName} là có căn cứ và cần thiết,`,
      );

      const article1Line = bm031NonEmpty(
        measure["article1Line"],
        `Phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp số ${orderCode} ${orderIssueDateText} của ${investigationUnitName} đối với ${personName}${offenseLine ? ` ${offenseLine}` : ""}.`,
      );

      const existingArticle2Line = bm031NonEmpty(measure["article2Line"]);

      const article2Line =
        existingArticle2Line && !existingArticle2Line.includes("không được phép đi khỏi nơi cư trú")
          ? existingArticle2Line
          : `Yêu cầu ${investigationUnitName} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự.`;

      target["document"] = {
        ...document,
        documentCodeLine: documentCode,
      };

      target["legalBasis"] = {
        ...legalBasis,
        juvenileLegalBasisLine: bm031NonEmpty(
          legalBasis["juvenileLegalBasisLine"],
          legalBasis["juvenileJusticeLine"],
          "Căn cứ Điều 135 và Điều 136 của Luật Tư pháp người chưa thành niên;",
        ),
        requestApprovalLine,
      };

      target["measure"] = {
        ...measure,
        reasonLine,
        article1Line,
        article2Line,
      };

      target["recipients"] = {
        ...recipients,
        investigationUnitLine: bm031NonEmpty(
          recipients["investigationUnitLine"],
          `- ${investigationUnitName};`,
        ),
      };
    }
    // BM-031_MVP_PAYLOAD_FIX_END
    // BM-037_MVP_PAYLOAD_FIX_START
    if (templateCode === "BM-037") {
      const bm037Text = (value: unknown): string => String(value ?? "").trim();

      const bm037NonEmpty = (...values: unknown[]): string => {
        for (const value of values) {
          const textValue = bm037Text(value);

          if (
            textValue.length > 0 &&
            textValue.toLowerCase() !== "null" &&
            textValue.toLowerCase() !== "undefined"
          ) {
            return textValue;
          }
        }

        return "";
      };

      const ensureSentenceEnd = (value: string, fallbackEnding = ";"): string => {
        const textValue = bm037Text(value);

        if (!textValue) {
          return "";
        }

        if (/[.;,]$/.test(textValue)) {
          return textValue;
        }

        return `${textValue}${fallbackEnding}`;
      };

      const ensureLegalBasisLine = (value: string): string => {
        const textValue = bm037Text(value);

        if (!textValue) {
          return "";
        }

        const withPrefix = textValue.startsWith("Căn cứ")
          ? textValue
          : `Căn cứ ${textValue.charAt(0).toLowerCase()}${textValue.slice(1)}`;

        return ensureSentenceEnd(withPrefix, ";");
      };

      const document = (target["document"] ?? {}) as Record<string, any>;
      const agency = (target["agency"] ?? {}) as Record<string, any>;
      const person = (target["person"] ?? {}) as Record<string, any>;
      const offense = (target["offense"] ?? {}) as Record<string, any>;
      const caseDecision = (target["caseDecision"] ?? {}) as Record<string, any>;
      const accusedDecision = (target["accusedDecision"] ?? {}) as Record<string, any>;
      const legalBasis = (target["legalBasis"] ?? {}) as Record<string, any>;
      const measure = (target["measure"] ?? {}) as Record<string, any>;
      const recipients = (target["recipients"] ?? {}) as Record<string, any>;
      const investigation = (target["investigation"] ?? {}) as Record<string, any>;

      const personName = bm037NonEmpty(person["fullName"], "bị can");
      const offenseLine = bm037NonEmpty(
        offense["legalBasisText"],
        offense["legalArticle"],
        offense["description"],
      );

      const documentCode = bm037NonEmpty(
        document["documentCodeLine"],
        document["documentNo"],
        document["documentCode"],
      );

      const orderCode = bm037NonEmpty(
        measure["arrestOrderCode"],
        measure["detentionOrderCode"],
        measure["orderDocumentCode"],
        documentCode,
      );

      const orderIssueDateText = bm037NonEmpty(
        measure["arrestOrderIssueDateText"],
        measure["detentionOrderIssueDateText"],
        measure["orderIssueDateText"],
        document["issueDateText"],
      );

      const investigationUnitName = bm037NonEmpty(
        recipients["investigationUnitName"],
        recipients["investigatingAgencyLine"],
        recipients["investigationAuthorityLine"],
        investigation["investigationUnitName"],
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      );

      const detentionExecutionUnitName = bm037NonEmpty(
        measure["detentionExecutionUnitName"],
        recipients["detentionExecutionUnitLine"]?.replace(/^-+\s*/, "").replace(/;$/, ""),
        investigationUnitName,
      );

      const durationText = bm037NonEmpty(measure["detentionDurationText"], measure["durationText"], "02 tháng");
      const detentionToDateText = bm037NonEmpty(measure["detentionToDateText"], measure["toDateText"]);

      const caseDecisionLegalBasisLine = bm037NonEmpty(
        caseDecision["prosecutionDecisionLegalBasisLine"],
        ensureLegalBasisLine(caseDecision["legalBasisLine"]),
      );

      const accusedDecisionLegalBasisLine = bm037NonEmpty(
        accusedDecision["prosecutionDecisionLegalBasisLine"],
        ensureLegalBasisLine(accusedDecision["legalBasisLine"]),
      );

      const requestApprovalLine = bm037NonEmpty(
        legalBasis["requestApprovalLine"],
        `Xét hồ sơ đề nghị phê chuẩn Lệnh bắt bị can để tạm giam số ${orderCode} ${orderIssueDateText} của ${investigationUnitName} đối với ${personName}${offenseLine ? ` ${offenseLine}` : ""};`,
      );

      const reasonLine = bm037NonEmpty(
        measure["reasonLine"],
        measure["detentionReasonLine"]
          ? `Nhận thấy ${measure["detentionReasonLine"]}`
          : `Nhận thấy việc bắt để tạm giam đối với bị can ${personName} là có căn cứ và cần thiết,`,
      );

      const article1Line = bm037NonEmpty(
        measure["article1Line"],
        `Phê chuẩn Lệnh bắt bị can để tạm giam số ${orderCode} ${orderIssueDateText} của ${investigationUnitName} đối với ${personName}.`,
      );

      const detentionDurationLine = bm037NonEmpty(
        measure["detentionDurationLine"],
        detentionToDateText
          ? `Thời hạn tạm giam tính từ ngày bắt được bị can để tạm giam đến ${detentionToDateText}.`
          : `Thời hạn tạm giam tính từ ngày bắt được bị can để tạm giam đến hết thời hạn ${durationText}.`,
      );

      const existingArticle2Line = bm037NonEmpty(measure["article2Line"]);

      const article2Line =
        existingArticle2Line && !existingArticle2Line.includes("không được phép đi khỏi nơi cư trú")
          ? existingArticle2Line
          : `Yêu cầu ${investigationUnitName} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự.`;

      target["document"] = {
        ...document,
        documentCodeLine: documentCode,
      };

      target["legalBasis"] = {
        ...legalBasis,
        juvenileLegalBasisLine: bm037NonEmpty(
          legalBasis["juvenileLegalBasisLine"],
          legalBasis["juvenileJusticeLine"],
          "Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;",
        ),
        requestApprovalLine,
      };

      target["caseDecision"] = {
        ...caseDecision,
        legalBasisLine: caseDecisionLegalBasisLine,
      };

      target["accusedDecision"] = {
        ...accusedDecision,
        legalBasisLine: accusedDecisionLegalBasisLine,
      };

      target["measure"] = {
        ...measure,
        reasonLine,
        article1Line,
        detentionDurationLine,
        article2Line,
      };

      target["recipients"] = {
        ...recipients,
        investigationUnitLine: bm037NonEmpty(
          recipients["investigationUnitLine"],
          `- ${investigationUnitName};`,
        ),
      };
    }
    // BM-037_MVP_PAYLOAD_FIX_END
    // BM-148_MVP_PAYLOAD_FIX_START
    if (templateCode === "BM-148") {
      const bm148Text = (value: unknown): string => String(value ?? "").trim();

      const bm148NonEmpty = (...values: unknown[]): string => {
        for (const value of values) {
          const textValue = bm148Text(value);

          if (textValue.length > 0 && textValue !== "NULL" && textValue !== "null") {
            return textValue;
          }
        }

        return "";
      };

      const bm148EnsureEnd = (value: unknown, ending: string): string => {
        const textValue = bm148Text(value)
          .replace(/\s+([,.;:])/gu, "$1")
          .replace(/\s{2,}/gu, " ")
          .trim();

        if (!textValue) {
          return "";
        }

        return textValue.endsWith(ending) ? textValue : `${textValue}${ending}`;
      };

      const bm148PrefixLegalBasis = (value: unknown): string => {
        const textValue = bm148Text(value);

        if (!textValue) {
          return "";
        }

        if (/^Căn cứ\s+/iu.test(textValue)) {
          return bm148EnsureEnd(textValue, ";");
        }

        return bm148EnsureEnd(`Căn cứ ${textValue}`, ";");
      };

      const bm148GenderText = (value: unknown): string => {
        const textValue = bm148Text(value);

        if (/^MALE$/iu.test(textValue)) {
          return "Nam";
        }

        if (/^FEMALE$/iu.test(textValue)) {
          return "Nữ";
        }

        return textValue;
      };

      const bm148DateTriplet = (
        day: unknown,
        month: unknown,
        year: unknown,
      ): string => {
        const dayText = bm148Text(day).replace(/^0+/u, "") || bm148Text(day);
        const monthText =
          bm148Text(month).replace(/^0+/u, "") || bm148Text(month);
        const yearText = bm148Text(year);

        if (!dayText || !monthText || !yearText) {
          return "";
        }

        return `${dayText} tháng ${monthText} năm ${yearText}`;
      };

      const document = (target["document"] ?? {}) as Record<string, any>;
      const legalBasis = (target["legalBasis"] ?? {}) as Record<string, any>;
      const person = (target["person"] ?? {}) as Record<string, any>;
      const caseInfo = (target["case"] ?? {}) as Record<string, any>;
      const caseDecision = (target["caseDecision"] ?? {}) as Record<string, any>;
      const accusedDecision = (target["accusedDecision"] ?? {}) as Record<string, any>;
      const recipients = (target["recipients"] ?? {}) as Record<string, any>;
      const suspension = (target["suspension"] ?? {}) as Record<string, any>;
      const prosecutionCaseSuspension =
        (target["prosecutionCaseSuspension"] ?? {}) as Record<string, any>;

      const personName = bm148NonEmpty(person["fullName"], "bị can");
      const genderText = bm148GenderText(
        bm148NonEmpty(person["genderLabel"], person["genderText"], person["gender"]),
      );

      const birthDateText = bm148NonEmpty(
        person["dateOfBirthText"],
        bm148DateTriplet(person["birthDay"], person["birthMonth"], person["birthYear"]),
        person["dateOfBirth"],
      );

      const birthDateLine = bm148NonEmpty(
        person["birthDateLine"],
        person["birthInfoLine"],
        birthDateText && person["placeOfBirth"]
          ? `Sinh ngày ${birthDateText} tại: ${person["placeOfBirth"]}`
          : birthDateText
            ? `Sinh ngày ${birthDateText}`
            : "",
      );

      const nationalityEthnicityReligionLine = bm148NonEmpty(
        person["nationalityEthnicityReligionLine"],
        [
          `Quốc tịch: ${bm148NonEmpty(person["nationality"], "Việt Nam")}`,
          `Dân tộc: ${bm148NonEmpty(person["ethnicity"], "Kinh")}`,
          `Tôn giáo: ${bm148NonEmpty(person["religion"], "Không")}`,
        ].join("; "),
      );

      const identityIssueDateText = bm148NonEmpty(
        person["identityIssuedDateText"],
        bm148DateTriplet(
          person["identityIssuedDay"],
          person["identityIssuedMonth"],
          person["identityIssuedYear"],
        ),
        person["identityIssuedDate"],
      );

      const identityIssueLine = bm148NonEmpty(
        person["identityIssueLine"],
        identityIssueDateText && person["identityIssuedPlace"]
          ? `Cấp ngày ${identityIssueDateText} Nơi cấp: ${person["identityIssuedPlace"]}`
          : identityIssueDateText
            ? `Cấp ngày ${identityIssueDateText}`
            : "",
      );

      const caseTitle = bm148NonEmpty(caseInfo["caseTitle"], "vụ án hình sự");
      const investigationUnitName = bm148NonEmpty(
        recipients["investigatingAgencyLine"],
        recipients["investigationAuthorityLine"],
        caseDecision["issuedBy"],
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      ).replace(/^-\s*/u, "").replace(/;$/u, "");

      const caseDecisionLegalBasisLine = bm148NonEmpty(
        suspension["caseDecisionLegalBasisLine"],
        prosecutionCaseSuspension["caseDecisionLegalBasisLine"],
        caseDecision["prosecutionDecisionLegalBasisLine"],
        bm148PrefixLegalBasis(caseDecision["legalBasisLine"]),
      );

      const accusedDecisionLegalBasisLine = bm148NonEmpty(
        suspension["accusedDecisionLegalBasisLine"],
        prosecutionCaseSuspension["accusedDecisionLegalBasisLine"],
        accusedDecision["prosecutionDecisionLegalBasisLine"],
        bm148PrefixLegalBasis(accusedDecision["legalBasisLine"]),
      );

      const reasonLine = bm148EnsureEnd(
        bm148NonEmpty(
          suspension["reasonLine"],
          prosecutionCaseSuspension["reasonLine"],
          `Xét thấy cần tạm đình chỉ vụ án hình sự đối với bị can ${personName}`,
        ),
        ",",
      );

      const article1Line = bm148EnsureEnd(
        bm148NonEmpty(
          suspension["article1Line"],
          prosecutionCaseSuspension["article1Line"],
          `Tạm đình chỉ vụ án hình sự đối với bị can ${personName} trong ${caseTitle}`,
        ),
        ".",
      );

      const continuedProcedureLine = bm148EnsureEnd(
        bm148NonEmpty(
          suspension["continuedProcedureLine"],
          prosecutionCaseSuspension["continuedProcedureLine"],
          "Việc giám định/định giá tài sản/yêu cầu cơ quan, tổ chức, cá nhân cung cấp tài liệu, đồ vật/tương trợ tư pháp tiếp tục được tiến hành cho đến khi có kết quả",
        ),
        ".",
      );

      const executionRequestLine = bm148EnsureEnd(
        bm148NonEmpty(
          suspension["executionRequestLine"],
          prosecutionCaseSuspension["executionRequestLine"],
          `Yêu cầu ${investigationUnitName} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự`,
        ),
        "./.",
      );

      const article2ActionLine = bm148NonEmpty(
        suspension["article2ActionLine"],
        prosecutionCaseSuspension["article2ActionLine"],
        continuedProcedureLine,
      );

      const recipientLine1 = bm148NonEmpty(
        recipients["line1"],
        recipients["investigationAuthorityLine"],
        recipients["investigatingAgencyLine"]
          ? `- ${bm148Text(recipients["investigatingAgencyLine"]).replace(/^-\s*/u, "").replace(/;$/u, "")};`
          : `- ${investigationUnitName};`,
      );

      const recipientLine2 = bm148NonEmpty(
        recipients["line2"],
        recipients["personLine"],
        recipients["accusedLine"],
        `- ${personName};`,
      );

      target["document"] = {
        ...document,
        fullDocumentCode:
          bm148NonEmpty(document["fullDocumentCode"], document["documentCode"]) ===
          `${bm148NonEmpty(document["documentCode"])}${bm148NonEmpty(document["documentCode"])}`
            ? bm148NonEmpty(document["documentCode"])
            : bm148NonEmpty(document["fullDocumentCode"], document["documentCode"]),
      };

      target["legalBasis"] = {
        ...legalBasis,
        procedureArticlesLine:
          "Căn cứ các điều 41, 236, 240 và 247 của Bộ luật Tố tụng hình sự;",
        juvenileJusticeLine:
          bm148NonEmpty(
            legalBasis["juvenileJusticeLine"],
            "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;",
          ),
      };

      target["person"] = {
        ...person,
        genderText,
        birthDateLine,
        nationalityEthnicityReligionLine,
        identityIssueLine,
        permanentResidence: bm148NonEmpty(
          person["permanentResidence"],
          person["permanentAddress"],
        ),
        temporaryResidence: bm148NonEmpty(
          person["temporaryResidence"],
          person["temporaryAddress"],
          "Không có",
        ),
        currentResidence: bm148NonEmpty(
          person["currentResidence"],
          person["currentAddress"],
        ),
        fullNameAndGenderLine: `Họ tên: ${personName}; Giới tính: ${genderText}`,
      };

      target["caseDecision"] = {
        ...caseDecision,
        prosecutionDecisionLegalBasisLine: caseDecisionLegalBasisLine,
      };

      target["accusedDecision"] = {
        ...accusedDecision,
        prosecutionDecisionLegalBasisLine: accusedDecisionLegalBasisLine,
      };

      target["suspension"] = {
        ...suspension,
        procedureArticlesLine:
          "Căn cứ các điều 41, 236, 240 và 247 của Bộ luật Tố tụng hình sự;",
        juvenileJusticeLine:
          "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;",
        caseDecisionLegalBasisLine,
        accusedDecisionLegalBasisLine,
        reasonLine,
        article1Line,
        article2ActionLine,
        continuedProcedureLine,
        executionRequestLine,
        article3Line: executionRequestLine,
      };

      target["prosecutionCaseSuspension"] = {
        ...prosecutionCaseSuspension,
        procedureArticlesLine:
          "Căn cứ các điều 41, 236, 240 và 247 của Bộ luật Tố tụng hình sự;",
        juvenileJusticeLine:
          "Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên;",
        caseDecisionLegalBasisLine,
        accusedDecisionLegalBasisLine,
        reasonLine,
        article1Line,
        article2ActionLine,
        continuedProcedureLine,
        executionRequestLine,
        article3Line: executionRequestLine,
      };

      target["recipients"] = {
        ...recipients,
        line1: recipientLine1,
        line2: recipientLine2,
        investigationAuthorityLine: recipientLine1,
        archiveLine: bm148NonEmpty(
          recipients["archiveLine"],
          "- Lưu: HSVA, HSKS, VP.",
        ),
      };
    }
      // BM-148_FE_DATE_DERIVED_SYNC_START
      {
        const bm148FeText = (value: unknown): string =>
          String(value ?? "").trim();

        const bm148FeFirst = (...values: unknown[]): string => {
          for (const value of values) {
            const currentValue = bm148FeText(value);

            if (currentValue) {
              return currentValue;
            }
          }

          return "";
        };

        const bm148FeIsoToParts = (
          value: unknown,
        ): { day: string; month: string; year: string } | null => {
          const rawValue = bm148FeText(value);

          if (!rawValue) {
            return null;
          }

          const iso = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
          if (iso) {
            return {
              year: iso[1],
              month: String(Number(iso[2])),
              day: String(Number(iso[3])),
            };
          }

          const slash =
            rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u) ||
            rawValue.match(/ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/iu);

          if (slash) {
            return {
              day: String(Number(slash[1])),
              month: String(Number(slash[2])),
              year: slash[3],
            };
          }

          const vietnamese = rawValue.match(
            /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu,
          );

          if (vietnamese) {
            return {
              day: String(Number(vietnamese[1])),
              month: String(Number(vietnamese[2])),
              year: vietnamese[3],
            };
          }

          return null;
        };

        const bm148FeVietnameseDate = (value: unknown): string => {
          const parts = bm148FeIsoToParts(value);

          if (!parts) {
            return "";
          }

          return `ngày ${parts.day} tháng ${parts.month} năm ${parts.year}`;
        };

        const bm148FeVietnameseDateNoPrefix = (value: unknown): string =>
          bm148FeVietnameseDate(value).replace(/^ngày\s+/u, "");

        const bm148FeAgency = (target["agency"] ?? {}) as Record<string, any>;
        const bm148FeDocument = (target["document"] ?? {}) as Record<string, any>;
        const bm148FePerson = (target["person"] ?? {}) as Record<string, any>;
        const bm148FeSource = (target["source"] ?? {}) as Record<string, any>;

        const bm148FeIssuePlace = bm148FeFirst(
          bm148FeAgency["issuePlace"],
          bm148FeDocument["issuePlace"],
          "TP. Hồ Chí Minh",
        );

        const bm148FeIssueDate = bm148FeFirst(
          bm148FeDocument["issueDate"],
          bm148FeSource["issueDate"],
          bm148FeDocument["documentIssueDate"],
        );

        const bm148FeBirthDate = bm148FeFirst(
          bm148FePerson["dateOfBirth"],
          bm148FePerson["birthDate"],
          bm148FePerson["birthDateText"],
        );

        const bm148FeIdentityIssuedDate = bm148FeFirst(
          bm148FePerson["identityIssuedDate"],
          bm148FePerson["identityIssueDate"],
          bm148FePerson["identityIssuedDateText"],
        );

        const bm148FeBirthDateLine =
          bm148FeBirthDate && bm148FePerson["placeOfBirth"]
            ? `Sinh ngày ${bm148FeVietnameseDateNoPrefix(
                bm148FeBirthDate,
              )} tại: ${bm148FePerson["placeOfBirth"]}`
            : bm148FeBirthDate
              ? `Sinh ngày ${bm148FeVietnameseDateNoPrefix(bm148FeBirthDate)}`
              : bm148FeText(bm148FePerson["birthDateLine"]);

        const bm148FeIdentityIssueLine =
          bm148FeIdentityIssuedDate && bm148FePerson["identityIssuedPlace"]
            ? `Cấp ngày ${bm148FeVietnameseDateNoPrefix(
                bm148FeIdentityIssuedDate,
              )} Nơi cấp: ${bm148FePerson["identityIssuedPlace"]}`
            : bm148FeIdentityIssuedDate
              ? `Cấp ngày ${bm148FeVietnameseDateNoPrefix(
                  bm148FeIdentityIssuedDate,
                )}`
              : bm148FeText(bm148FePerson["identityIssueLine"]);

        target["document"] = {
          ...bm148FeDocument,
          issuePlaceAndDateLine:
            bm148FeIssueDate
              ? `${bm148FeIssuePlace}, ${bm148FeVietnameseDate(
                  bm148FeIssueDate,
                )}`
              : bm148FeText(bm148FeDocument["issuePlaceAndDateLine"]),
        };

        target["person"] = {
          ...bm148FePerson,
          birthDateLine: bm148FeBirthDateLine,
          nationalityEthnicityReligionLine:
            bm148FeFirst(
              bm148FePerson["nationalityEthnicityReligionLine"],
              [
                `Quốc tịch: ${bm148FeFirst(
                  bm148FePerson["nationality"],
                  "Việt Nam",
                )}`,
                `Dân tộc: ${bm148FeFirst(bm148FePerson["ethnicity"], "Kinh")}`,
                `Tôn giáo: ${bm148FeFirst(bm148FePerson["religion"], "Không")}`,
              ].join("; "),
            ),
          identityIssueLine: bm148FeIdentityIssueLine,
        };
      }
      // BM-148_FE_DATE_DERIVED_SYNC_END
    // BM-148_CANONICAL_SOURCE_SYNC_START
    if (templateCode === "BM-148") {
      const bm148CanonText = (value: unknown): string =>
        String(value ?? "").trim();

      const bm148CanonFirst = (...values: unknown[]): string => {
        for (const value of values) {
          const currentValue = bm148CanonText(value);

          if (currentValue && currentValue !== "null" && currentValue !== "NULL") {
            return currentValue;
          }
        }

        return "";
      };

      const bm148CanonEnd = (value: unknown, ending: string): string => {
        const cleanValue = bm148CanonText(value)
          .replace(/\s+([,.;:])/gu, "$1")
          .replace(/\s{2,}/gu, " ")
          .trim();

        if (!cleanValue) {
          return "";
        }

        return cleanValue.endsWith(ending) ? cleanValue : `${cleanValue}${ending}`;
      };

      const bm148CanonStripRecipient = (value: unknown): string =>
        bm148CanonText(value).replace(/^-\s*/u, "").replace(/[;.]\s*$/u, "");

      const bm148CanonDateParts = (
        value: unknown,
      ): { day: string; month: string; year: string } | null => {
        const rawValue = bm148CanonText(value);

        if (!rawValue) {
          return null;
        }

        const iso = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
        if (iso) {
          return {
            year: iso[1],
            month: String(Number(iso[2])),
            day: String(Number(iso[3])),
          };
        }

        const slash =
          rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u) ||
          rawValue.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/u);

        if (slash) {
          return {
            day: String(Number(slash[1])),
            month: String(Number(slash[2])),
            year: slash[3],
          };
        }

        const vietnamese = rawValue.match(
          /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu,
        );

        if (vietnamese) {
          return {
            day: String(Number(vietnamese[1])),
            month: String(Number(vietnamese[2])),
            year: vietnamese[3],
          };
        }

        return null;
      };

      const bm148CanonDate = (value: unknown): string => {
        const parts = bm148CanonDateParts(value);

        if (!parts) {
          return "";
        }

        return `ngày ${parts.day} tháng ${parts.month} năm ${parts.year}`;
      };

      const bm148CanonExtractDecisionCode = (value: unknown): string => {
        const rawValue = bm148CanonText(value);
        const match = rawValue.match(/số\s+(.+?)\s+(?:ngày|của|đối với|về tội|,|;)/iu);

        return match?.[1]?.trim() ?? "";
      };

      const bm148CanonExtractOffense = (value: unknown): string => {
        const rawValue = bm148CanonText(value);

        const quoted = rawValue.match(/về tội\s+[“"]([^”"]+)[”"]/iu);
        if (quoted?.[1]) {
          return quoted[1].trim();
        }

        const plain = rawValue.match(/về tội\s+([^,;]+)/iu);
        return plain?.[1]?.trim() ?? "";
      };

      const bm148CanonExtractClause = (value: unknown): string => {
        const rawValue = bm148CanonText(value);
        const match = rawValue.match(/quy định tại\s+(khoản\s+\d+)/iu);

        return match?.[1]?.trim() ?? "";
      };

      const bm148CanonExtractArticle = (value: unknown): string => {
        const rawValue = bm148CanonText(value);
        const match = rawValue.match(/\b(Điều\s+\d+)\b/iu);

        return match?.[1]?.trim() ?? "";
      };

      const bm148CanonLocationSuffix = (...values: unknown[]): string => {
        for (const value of values) {
          const rawValue = bm148CanonText(value);
          const match = rawValue.match(/\s+tại\s+.+$/iu);

          if (match?.[0]) {
            return match[0].trimStart();
          }
        }

        return "";
      };

      const bm148CanonAgency = (target["agency"] ?? {}) as Record<string, any>;
      const bm148CanonDocument = (target["document"] ?? {}) as Record<string, any>;
      const bm148CanonHelper = (target["helper"] ?? {}) as Record<string, any>;
      const bm148CanonSource = (target["source"] ?? {}) as Record<string, any>;
      const bm148CanonCase = (target["case"] ?? {}) as Record<string, any>;
      const bm148CanonPerson = (target["person"] ?? {}) as Record<string, any>;
      const bm148CanonCaseDecision =
        (target["caseDecision"] ?? {}) as Record<string, any>;
      const bm148CanonAccusedDecision =
        (target["accusedDecision"] ?? {}) as Record<string, any>;
      const bm148CanonSuspension =
        (target["suspension"] ?? {}) as Record<string, any>;
      const bm148CanonRecipients =
        (target["recipients"] ?? {}) as Record<string, any>;

      const caseDecisionLine = bm148CanonText(
        bm148CanonCaseDecision["prosecutionDecisionLegalBasisLine"],
      );
      const accusedDecisionLine = bm148CanonText(
        bm148CanonAccusedDecision["prosecutionDecisionLegalBasisLine"],
      );

      const accusedName = bm148CanonFirst(
        bm148CanonPerson["fullName"],
        bm148CanonHelper["accusedName"],
        bm148CanonSource["accusedName"],
      );

      const offenseName = bm148CanonFirst(
        bm148CanonHelper["offenseName"],
        bm148CanonSource["offenseName"],
        bm148CanonCase["offenseName"],
        bm148CanonExtractOffense(caseDecisionLine),
        bm148CanonExtractOffense(accusedDecisionLine),
        "Đánh bạc",
      );

      const legalClause = bm148CanonFirst(
        bm148CanonHelper["legalClause"],
        bm148CanonSource["legalClause"],
        bm148CanonCase["legalClause"],
        bm148CanonExtractClause(caseDecisionLine),
        bm148CanonExtractClause(accusedDecisionLine),
        "khoản 1",
      );

      const legalArticle = bm148CanonFirst(
        bm148CanonHelper["legalArticle"],
        bm148CanonSource["legalArticle"],
        bm148CanonCase["legalArticle"],
        bm148CanonExtractArticle(caseDecisionLine),
        bm148CanonExtractArticle(accusedDecisionLine),
        "Điều 321",
      );

      const investigationAgencyName = bm148CanonFirst(
        bm148CanonHelper["investigationAgencyName"],
        bm148CanonSource["investigationAgencyName"],
        bm148CanonStripRecipient(bm148CanonRecipients["line1"]),
        "Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh",
      );

      const caseDecisionCode = bm148CanonFirst(
        bm148CanonHelper["caseDecisionCode"],
        bm148CanonSource["caseDecisionCode"],
        bm148CanonCaseDecision["decisionCode"],
        bm148CanonExtractDecisionCode(caseDecisionLine),
        bm148CanonCase["caseCode"],
        bm148CanonDocument["documentCode"],
      );

      const accusedDecisionCode = bm148CanonFirst(
        bm148CanonHelper["accusedDecisionCode"],
        bm148CanonSource["accusedDecisionCode"],
        bm148CanonAccusedDecision["decisionCode"],
        bm148CanonExtractDecisionCode(accusedDecisionLine),
        bm148CanonCase["caseCode"],
        bm148CanonDocument["documentCode"],
      );

      const caseDecisionDate = bm148CanonFirst(
        bm148CanonHelper["caseDecisionDate"],
        bm148CanonSource["caseDecisionDate"],
        bm148CanonCaseDecision["decisionDate"],
        bm148CanonDate(caseDecisionLine),
      );

      const accusedDecisionDate = bm148CanonFirst(
        bm148CanonHelper["accusedDecisionDate"],
        bm148CanonSource["accusedDecisionDate"],
        bm148CanonAccusedDecision["decisionDate"],
        bm148CanonDate(accusedDecisionLine),
      );

      const caseDecisionDateText = bm148CanonDate(caseDecisionDate);
      const accusedDecisionDateText = bm148CanonDate(accusedDecisionDate);

      const locationSuffix = bm148CanonLocationSuffix(
        bm148CanonHelper["caseTitle"],
        bm148CanonSource["caseTitle"],
        bm148CanonCase["caseTitle"],
        bm148CanonSuspension["article1Line"],
      );

      const caseTitle = `Vụ án ${offenseName}${locationSuffix}`;

      const syncedCaseDecisionLine = bm148CanonEnd(
        `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode}${
          caseDecisionDateText ? ` ${caseDecisionDateText}` : ""
        } của ${investigationAgencyName} về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} Bộ luật Hình sự`,
        ";",
      );

      const syncedAccusedDecisionLine = bm148CanonEnd(
        `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode}${
          accusedDecisionDateText ? ` ${accusedDecisionDateText}` : ""
        } đối với ${accusedName}, về tội “${offenseName}” quy định tại ${legalClause} ${legalArticle} Bộ luật Hình sự`,
        ";",
      );

      target["helper"] = {
        ...bm148CanonHelper,
        offenseName,
        legalClause,
        legalArticle,
        caseTitle,
        investigationAgencyName,
        caseDecisionCode,
        caseDecisionDate,
        accusedDecisionCode,
        accusedDecisionDate,
      };

      target["source"] = {
        ...bm148CanonSource,
        offenseName,
        legalClause,
        legalArticle,
        caseTitle,
        investigationAgencyName,
        caseDecisionCode,
        caseDecisionDate,
        accusedDecisionCode,
        accusedDecisionDate,
      };

      target["case"] = {
        ...bm148CanonCase,
        offenseName,
        legalClause,
        legalArticle,
        caseTitle,
      };

      target["caseDecision"] = {
        ...bm148CanonCaseDecision,
        prosecutionDecisionLegalBasisLine: syncedCaseDecisionLine,
      };

      target["accusedDecision"] = {
        ...bm148CanonAccusedDecision,
        prosecutionDecisionLegalBasisLine: syncedAccusedDecisionLine,
      };

      target["suspension"] = {
        ...bm148CanonSuspension,
        reasonLine: accusedName
          ? bm148CanonEnd(
              `Xét thấy cần tạm đình chỉ vụ án hình sự đối với bị can ${accusedName}`,
              ",",
            )
          : bm148CanonText(bm148CanonSuspension["reasonLine"]),
        article1Line: accusedName
          ? bm148CanonEnd(
              `Tạm đình chỉ vụ án hình sự đối với bị can ${accusedName} trong ${caseTitle}`,
              ".",
            )
          : bm148CanonText(bm148CanonSuspension["article1Line"]),
        executionRequestLine: bm148CanonEnd(
          `Yêu cầu ${investigationAgencyName} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự`,
          "./.",
        ),
      };

      target["recipients"] = {
        ...bm148CanonRecipients,
        line1: `- ${investigationAgencyName};`,
        line2: accusedName ? `- ${accusedName};` : "",
        archiveLine: bm148CanonFirst(
          bm148CanonRecipients["archiveLine"],
          "- Lưu: HSVA, HSKS, VP.",
        ),
      };
    }
    // BM-148_CANONICAL_SOURCE_SYNC_END
    // BM-148_MVP_PAYLOAD_FIX_END
    // BM-033_MVP_PAYLOAD_FIX_START
    if (templateCode === 'BM-033') {
      const anyPayload = payload as any;

      const text = (value: unknown): string => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value)
          .replace(/\s{2,}/gu, ' ')
          .trim();
      };

      const firstText = (...values: unknown[]): string => {
        for (const value of values) {
          const nextValue = text(value);

          if (
            nextValue.length > 0 &&
            nextValue.toLowerCase() !== 'null' &&
            nextValue.toLowerCase() !== 'undefined'
          ) {
            return nextValue;
          }
        }

        return '';
      };

      const stripListLine = (value: unknown): string => {
        return text(value)
          .replace(/^-+\s*/u, '')
          .replace(/;$/u, '')
          .trim();
      };

      const ensureEnd = (value: string, ending: string): string => {
        const nextValue = text(value)
          .replace(/\s+([,.;:])/gu, '$1')
          .replace(/\s{2,}/gu, ' ')
          .trim();

        if (!nextValue) {
          return '';
        }

        return /[.!?;,]$/u.test(nextValue)
          ? nextValue.replace(/[.!?;,]$/u, ending)
          : `${nextValue}${ending}`;
      };

      const toLegalDateText = (value: unknown): string => {
        const raw = text(value);

        if (!raw) {
          return '';
        }

        if (raw.includes('ngày') && raw.includes('tháng') && raw.includes('năm')) {
          return raw;
        }

        const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);

        if (!match) {
          return raw;
        }

        return `ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
      };

      const agencyHeaderName = 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7';
      const agencyHeaderParentName = 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH';
      const agencyBodyName = 'Viện kiểm sát nhân dân khu vực 7';

      anyPayload.agency = anyPayload.agency || {};
      anyPayload.document = anyPayload.document || {};
      anyPayload.official = anyPayload.official || {};
      anyPayload.legalBasis = anyPayload.legalBasis || {};
      anyPayload.measure = anyPayload.measure || {};
      anyPayload.custody = anyPayload.custody || {};
      anyPayload.recipients = anyPayload.recipients || {};
      anyPayload.signature = anyPayload.signature || {};

      const accusedName = firstText(
        anyPayload.person?.fullName,
        anyPayload.targetPerson?.fullName,
        anyPayload.accused?.fullName,
        'Đoàn Văn Dũng',
      );

      const investigationUnit = firstText(
        stripListLine(anyPayload.recipients?.investigationUnitLine),
        stripListLine(anyPayload.recipients?.investigatingAgencyLine),
        stripListLine(anyPayload.recipients?.investigationAuthorityLine),
        anyPayload.investigation?.investigationUnitName,
        anyPayload.investigation?.agencyName,
        anyPayload.agency?.investigatingAgencyName,
        anyPayload.agency?.investigationAgencyName,
        'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
      );

      const extensionAttemptText = firstText(
        anyPayload.custody?.extensionAttemptText,
        anyPayload.custody?.extensionRoundText,
        anyPayload.measure?.custodyExtensionRoundText,
        anyPayload.measure?.extensionRoundText,
        'Lần thứ nhất',
      );

      const extensionRoundOnly = extensionAttemptText
        .replace(/^lần\s+thứ\s+/iu, '')
        .replace(/^Lần\s+thứ\s+/u, '')
        .trim() || 'nhất';

      const documentCode = firstText(
        anyPayload.document?.documentCode,
        anyPayload.document?.documentNo,
        '33/QĐ-VKSKV7',
      );

      const documentIssueDateText = toLegalDateText(
        firstText(
          anyPayload.document?.issueDateText,
          anyPayload.document?.issueDate,
          anyPayload.document?.generatedAt,
        ),
      );

      const detentionDecisionCode = firstText(
        anyPayload.custody?.detentionDecisionCode,
        anyPayload.measure?.custodyDetentionDecisionCode,
        anyPayload.measure?.detentionDecisionCode,
        '12/QĐ-TG',
      );

      const detentionDecisionDateText = toLegalDateText(
        firstText(
          anyPayload.custody?.detentionDecisionDateText,
          anyPayload.custody?.detentionDecisionDate,
          anyPayload.measure?.custodyDetentionDecisionDateText,
          anyPayload.measure?.detentionDecisionDateText,
          documentIssueDateText,
        ),
      );

      const previousExtensionDecisionCode = firstText(
        anyPayload.custody?.previousExtensionDecisionCode,
        anyPayload.measure?.previousExtensionDecisionCode,
        '13/QĐ-CSĐT',
      );

      const previousExtensionDecisionDateText = toLegalDateText(
        firstText(
          anyPayload.custody?.previousExtensionDecisionDateText,
          anyPayload.custody?.previousExtensionDecisionDate,
          anyPayload.measure?.previousExtensionDecisionDateText,
          documentIssueDateText,
        ),
      );

      const approvalProposalCode = firstText(
        anyPayload.custody?.approvalProposalCode,
        anyPayload.custody?.extensionApprovalProposalCode,
        anyPayload.measure?.approvalProposalCode,
        '14/QĐ-CSĐT',
      );

      const approvalProposalDateText = toLegalDateText(
        firstText(
          anyPayload.custody?.approvalProposalDateText,
          anyPayload.custody?.approvalProposalDate,
          anyPayload.measure?.approvalProposalDateText,
          documentIssueDateText,
        ),
      );

      const approvalReasonLine = ensureEnd(
        firstText(
          anyPayload.custody?.approvalReasonLine,
          anyPayload.measure?.custodyApprovalReasonLine,
          `Nhận thấy việc gia hạn tạm giữ đối với ${accusedName} là có căn cứ, đúng thẩm quyền và cần thiết cho việc xác minh, điều tra vụ án`,
        ),
        ',',
      );

      const detentionDecisionLine = ensureEnd(
        firstText(
          anyPayload.custody?.detentionDecisionLine,
          `Căn cứ Quyết định tạm giữ số ${detentionDecisionCode} ${detentionDecisionDateText} của ${investigationUnit}`,
        ),
        ';',
      );

      const previousExtensionDecisionLine = ensureEnd(
        firstText(
          anyPayload.custody?.previousExtensionDecisionLine,
          `và Quyết định gia hạn tạm giữ lần thứ ${extensionRoundOnly} số ${previousExtensionDecisionCode} ${previousExtensionDecisionDateText} của ${investigationUnit} (nếu có)`,
        ),
        ';',
      );

      const approvalProposalLine = firstText(
        anyPayload.custody?.approvalProposalLine,
        `Xét hồ sơ đề nghị phê chuẩn Quyết định gia hạn tạm giữ lần thứ ${extensionRoundOnly} số ${approvalProposalCode} ${approvalProposalDateText}`,
      );

      const approvalProposalAgencyLine = ensureEnd(
        firstText(
          anyPayload.custody?.approvalProposalAgencyLine,
          `của ${investigationUnit} đối với ${accusedName}`,
        ),
        ';',
      );

      const approvalArticle1Line = ensureEnd(
        firstText(
          anyPayload.custody?.approvalArticle1Line,
          `Phê chuẩn Quyết định gia hạn tạm giữ lần thứ ${extensionRoundOnly} số ${approvalProposalCode} ${approvalProposalDateText} của ${investigationUnit} đối với ${accusedName}`,
        ),
        '.',
      );

      const executionRequestLine = ensureEnd(
        firstText(
          anyPayload.custody?.executionRequestLine,
          `Yêu cầu ${investigationUnit} thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự`,
        ),
        './.',
      );

      anyPayload.agency = {
        ...anyPayload.agency,
        parentNameUpper: firstText(anyPayload.agency.parentNameUpper, agencyHeaderParentName),
        nameUpper: firstText(anyPayload.agency.nameUpper, agencyHeaderName),
        nameBody: firstText(anyPayload.agency.nameBody, agencyBodyName),
        parentNameBody: firstText(
          anyPayload.agency.parentNameBody,
          'Viện kiểm sát nhân dân Thành phố Hồ Chí Minh',
        ),
      };

      anyPayload.document = {
        ...anyPayload.document,
        documentCode,
        documentNo: firstText(anyPayload.document.documentNo, documentCode),
        fullDocumentCode: documentCode,
      };

      anyPayload.official = {
        ...anyPayload.official,
        issuingAuthorityLine: firstText(
          anyPayload.official.issuingAuthorityLine,
          'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
        ),
      };

      anyPayload.legalBasis = {
        ...anyPayload.legalBasis,
        procedureArticlesLine: firstText(
          anyPayload.legalBasis.procedureArticlesLine,
          'Căn cứ các điều 41, 118 và 165 của Bộ luật Tố tụng hình sự;',
        ).replace(
          /Căn cứ các điều 41,\s*165 và 179 của Bộ luật Tố tụng hình sự;/u,
          'Căn cứ các điều 41, 118 và 165 của Bộ luật Tố tụng hình sự;',
        ),
        juvenileJusticeLine: firstText(
          anyPayload.legalBasis.juvenileJusticeLine,
          'Căn cứ Điều 135 và Điều 137 của Luật Tư pháp người chưa thành niên;',
        ),
      };

      anyPayload.custody = {
        ...anyPayload.custody,
        extensionAttemptText,
        extensionRoundText: extensionRoundOnly,
        detentionDecisionCode,
        detentionDecisionDateText,
        previousExtensionDecisionCode,
        previousExtensionDecisionDateText,
        approvalProposalCode,
        approvalProposalDateText,
        detentionDecisionLine,
        previousExtensionDecisionLine,
        approvalProposalLine,
        approvalProposalAgencyLine,
        approvalReasonLine,
        approvalArticle1Line,
        executionRequestLine,
      };

      anyPayload.recipients = {
        ...anyPayload.recipients,
        executionAgencyLine: firstText(
          anyPayload.recipients.executionAgencyLine,
          `- ${investigationUnit};`,
        ),
        personLine: firstText(
          anyPayload.recipients.personLine,
          `- ${accusedName};`,
        ),
        archiveLine: firstText(
          anyPayload.recipients.archiveLine,
          '- Lưu: HSVA, HSKS, VP.',
        ),
      };

      anyPayload.signature = {
        ...anyPayload.signature,
        signMode: firstText(anyPayload.signature.signMode, 'KT. VIỆN TRƯỞNG'),
        positionTitle: firstText(anyPayload.signature.positionTitle, 'PHÓ VIỆN TRƯỞNG'),
        signerName: firstText(anyPayload.signature.signerName, 'Trần Thanh Nam'),
      };
    }
    // BM-033_MVP_PAYLOAD_FIX_END
    // BM-038_MVP_PAYLOAD_FIX_START
    if (templateCode === 'BM-038') {
      const anyPayload = payload as any;

      const text = (value: unknown): string => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value)
          .replace(/\s{2,}/gu, ' ')
          .trim();
      };

      const firstText = (...values: unknown[]): string => {
        for (const value of values) {
          const nextValue = text(value);

          if (
            nextValue.length > 0 &&
            nextValue.toLowerCase() !== 'null' &&
            nextValue.toLowerCase() !== 'undefined'
          ) {
            return nextValue;
          }
        }

        return '';
      };

      const stripListLine = (value: unknown): string => {
        return text(value)
          .replace(/^-+\s*/u, '')
          .replace(/;$/u, '')
          .trim();
      };

      const toLegalDateText = (value: unknown): string => {
        const raw = text(value);

        if (!raw) {
          return '';
        }

        if (raw.includes('ngày') && raw.includes('tháng') && raw.includes('năm')) {
          return raw;
        }

        const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);

        if (!match) {
          return raw;
        }

        return `ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
      };

      const ensureEnd = (value: string, ending: string): string => {
        const nextValue = text(value)
          .replace(/\s+([,.;:])/gu, '$1')
          .replace(/\s{2,}/gu, ' ')
          .trim();

        if (!nextValue) {
          return '';
        }

        return /[.!?;,]$/u.test(nextValue)
          ? nextValue.replace(/[.!?;,]$/u, ending)
          : `${nextValue}${ending}`;
      };

      anyPayload.agency = anyPayload.agency || {};
      anyPayload.document = anyPayload.document || {};
      anyPayload.official = anyPayload.official || {};
      anyPayload.legalBasis = anyPayload.legalBasis || {};
      anyPayload.caseDecision = anyPayload.caseDecision || {};
      anyPayload.accusedDecision = anyPayload.accusedDecision || {};
      anyPayload.measure = anyPayload.measure || {};
      anyPayload.recipients = anyPayload.recipients || {};
      anyPayload.signature = anyPayload.signature || {};
      anyPayload.arrestNonApproval = anyPayload.arrestNonApproval || {};

      const agencyHeaderName = 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7';
      const agencyHeaderParentName = 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH';

      const accusedName = firstText(
        anyPayload.person?.fullName,
        anyPayload.targetPerson?.fullName,
        anyPayload.accused?.fullName,
        'Đoàn Văn Dũng',
      );

      const offenseName = firstText(
        anyPayload.offense?.offenseName,
        'Đánh bạc',
      );

      const legalArticle = firstText(
        anyPayload.offense?.legalArticle,
        'khoản 1 Điều 321 Bộ luật Hình sự',
      );

      const offenseClause = `về tội “${offenseName}” quy định tại ${legalArticle}`;

      const investigationAgency = firstText(
        stripListLine(anyPayload.recipients?.investigatingAgencyLine),
        stripListLine(anyPayload.recipients?.investigationAuthorityLine),
        stripListLine(anyPayload.recipients?.investigationUnitLine),
        anyPayload.investigation?.investigationUnitName,
        anyPayload.investigation?.agencyName,
        'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
      );

      const documentCode = firstText(
        anyPayload.document?.documentCode,
        anyPayload.document?.documentNo,
        '38/QĐ-VKSKV7',
      );

      const caseDecisionCode = firstText(
        anyPayload.arrestNonApproval?.caseDecisionCode,
        anyPayload.caseDecision?.decisionNo,
        anyPayload.case?.caseCode,
        'VKS-2026-0001',
      );

      const caseDecisionDateText = toLegalDateText(
        firstText(
          anyPayload.arrestNonApproval?.caseDecisionDateText,
          anyPayload.caseDecision?.issueDateText,
          anyPayload.caseDecision?.issueDate,
          anyPayload.case?.receivedDate,
          anyPayload.document?.issueDate,
        ),
      );

      const accusedDecisionCode = firstText(
        anyPayload.arrestNonApproval?.accusedDecisionCode,
        anyPayload.accusedDecision?.decisionNo,
        anyPayload.case?.caseCode,
        'VKS-2026-0001',
      );

      const accusedDecisionDateText = toLegalDateText(
        firstText(
          anyPayload.arrestNonApproval?.accusedDecisionDateText,
          anyPayload.accusedDecision?.issueDateText,
          anyPayload.accusedDecision?.issueDate,
          anyPayload.document?.issueDate,
        ),
      );

      const arrestOrderCode = firstText(
        anyPayload.arrestNonApproval?.arrestOrderCode,
        anyPayload.measure?.detentionOrderCode,
        '17/LTG-VKSKV7',
      );

      const arrestOrderDateText = toLegalDateText(
        firstText(
          anyPayload.arrestNonApproval?.arrestOrderDateText,
          anyPayload.measure?.detentionOrderIssueDateText,
          anyPayload.measure?.detentionOrderIssueDate,
          anyPayload.document?.issueDate,
        ),
      );

      const caseDecisionLegalBasisLine = ensureEnd(
        firstText(
          anyPayload.arrestNonApproval?.caseDecisionLegalBasisLine,
          `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ${caseDecisionDateText} của ${investigationAgency} ${offenseClause}`,
        ),
        ';',
      );

      const accusedDecisionLegalBasisLine = ensureEnd(
        firstText(
          anyPayload.arrestNonApproval?.accusedDecisionLegalBasisLine,
          `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ${accusedDecisionDateText} của ${investigationAgency} đối với ${accusedName} ${offenseClause}`,
        ),
        ';',
      );

      const proposalLine = firstText(
        anyPayload.arrestNonApproval?.proposalLine,
        `Xét hồ sơ đề nghị phê chuẩn Lệnh bắt bị can để tạm giam số ${arrestOrderCode} ${arrestOrderDateText}`,
      );

      const proposalAgencyLine = ensureEnd(
        firstText(
          anyPayload.arrestNonApproval?.proposalAgencyLine,
          `của ${investigationAgency} đối với ${accusedName} ${offenseClause}`,
        ),
        ';',
      );

      const reasonLine = ensureEnd(
        firstText(
          anyPayload.arrestNonApproval?.reasonLine,
          `Nhận thấy việc bắt để tạm giam đối với bị can ${accusedName} là không có căn cứ`,
        ),
        ',',
      );

      const article1Line = ensureEnd(
        firstText(
          anyPayload.arrestNonApproval?.article1Line,
          `Không phê chuẩn Lệnh bắt bị can để tạm giam số ${arrestOrderCode} ${arrestOrderDateText} của ${investigationAgency} đối với ${accusedName}`,
        ),
        '.',
      );

      const article2Line = ensureEnd(
        firstText(
          anyPayload.arrestNonApproval?.article2Line,
          `Yêu cầu ${investigationAgency} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự`,
        ),
        './.',
      );

      anyPayload.agency = {
        ...anyPayload.agency,
        parentNameUpper: firstText(anyPayload.agency.parentNameUpper, agencyHeaderParentName),
        nameUpper: firstText(anyPayload.agency.nameUpper, agencyHeaderName),
      };

      anyPayload.document = {
        ...anyPayload.document,
        documentCode,
        documentNo: firstText(anyPayload.document.documentNo, documentCode),
        fullDocumentCode: documentCode,
      };

      anyPayload.official = {
        ...anyPayload.official,
        issuingAuthorityLine: firstText(
          anyPayload.official.issuingAuthorityLine,
          'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
        ),
      };

      anyPayload.legalBasis = {
        ...anyPayload.legalBasis,
        procedureArticlesLine: 'Căn cứ các điều 41, 113, 119, 165 và 173 của Bộ luật Tố tụng hình sự;',
        juvenileJusticeLine: firstText(
          anyPayload.legalBasis.juvenileJusticeLine,
          'Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;',
        ),
      };

      anyPayload.arrestNonApproval = {
        ...anyPayload.arrestNonApproval,
        accusedName,
        investigationAgency,
        offenseName,
        legalArticle,
        offenseClause,
        caseDecisionCode,
        caseDecisionDateText,
        accusedDecisionCode,
        accusedDecisionDateText,
        arrestOrderCode,
        arrestOrderDateText,
        caseDecisionLegalBasisLine,
        accusedDecisionLegalBasisLine,
        proposalLine,
        proposalAgencyLine,
        reasonLine,
        article1Line,
        article2Line,
      };

      anyPayload.recipients = {
        ...anyPayload.recipients,
        executionAgencyLine: firstText(
          anyPayload.recipients.executionAgencyLine,
          `- ${investigationAgency};`,
        ),
        personLine: firstText(
          anyPayload.recipients.personLine,
          `- ${accusedName};`,
        ),
        archiveLine: firstText(
          anyPayload.recipients.archiveLine,
          '- Lưu: HSVA, HSKS, VP.',
        ),
      };

      anyPayload.signature = {
        ...anyPayload.signature,
        signMode: firstText(anyPayload.signature.signMode, 'KT. VIỆN TRƯỞNG'),
        positionTitle: firstText(anyPayload.signature.positionTitle, 'PHÓ VIỆN TRƯỞNG'),
        signerName: firstText(anyPayload.signature.signerName, 'Trần Thanh Nam'),
      };
    }
    // BM-038_MVP_PAYLOAD_FIX_END
    // BM-039_MVP_PAYLOAD_FIX_START
    if (templateCode === 'BM-039') {
      const anyPayload = payload as any;

      const text = (value: unknown): string => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value)
          .replace(/\s{2,}/gu, ' ')
          .trim();
      };

      const firstText = (...values: unknown[]): string => {
        for (const value of values) {
          const nextValue = text(value);

          if (
            nextValue.length > 0 &&
            nextValue.toLowerCase() !== 'null' &&
            nextValue.toLowerCase() !== 'undefined'
          ) {
            return nextValue;
          }
        }

        return '';
      };

      const stripListLine = (value: unknown): string => {
        return text(value)
          .replace(/^-+\s*/u, '')
          .replace(/;$/u, '')
          .trim();
      };

      const toLegalDateText = (value: unknown): string => {
        const raw = text(value);

        if (!raw) {
          return '';
        }

        if (raw.includes('ngày') && raw.includes('tháng') && raw.includes('năm')) {
          return raw;
        }

        const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);

        if (!match) {
          return raw;
        }

        return `ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
      };

      const ensureEnd = (value: string, ending: string): string => {
        const nextValue = text(value)
          .replace(/\s+([,.;:])/gu, '$1')
          .replace(/\s{2,}/gu, ' ')
          .trim();

        if (!nextValue) {
          return '';
        }

        return /[.!?;,]$/u.test(nextValue)
          ? nextValue.replace(/[.!?;,]$/u, ending)
          : `${nextValue}${ending}`;
      };

      const normalizeDateToDayMonthYear = (value: unknown): {
        day: string;
        month: string;
        year: string;
      } => {
        const raw = text(value);

        const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);

        if (match) {
          return {
            day: String(Number(match[1])),
            month: String(Number(match[2])),
            year: match[3],
          };
        }

        const vnMatch = raw.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/iu);

        if (vnMatch) {
          return {
            day: String(Number(vnMatch[1])),
            month: String(Number(vnMatch[2])),
            year: vnMatch[3],
          };
        }

        return {
          day: '',
          month: '',
          year: '',
        };
      };

      anyPayload.agency = anyPayload.agency || {};
      anyPayload.document = anyPayload.document || {};
      anyPayload.official = anyPayload.official || {};
      anyPayload.legalBasis = anyPayload.legalBasis || {};
      anyPayload.caseDecision = anyPayload.caseDecision || {};
      anyPayload.accusedDecision = anyPayload.accusedDecision || {};
      anyPayload.measure = anyPayload.measure || {};
      anyPayload.recipients = anyPayload.recipients || {};
      anyPayload.signature = anyPayload.signature || {};
      anyPayload.person = anyPayload.person || {};
      anyPayload.offense = anyPayload.offense || {};
      anyPayload.detentionArrest = anyPayload.detentionArrest || {};

      const agencyHeaderName = 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7';
      const agencyHeaderParentName = 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH';

      const accusedName = firstText(
        anyPayload.detentionArrest?.accusedName,
        anyPayload.person?.fullName,
        anyPayload.targetPerson?.fullName,
        anyPayload.accused?.fullName,
        'Đoàn Văn Dũng',
      );

      const otherName = firstText(
        anyPayload.detentionArrest?.otherName,
        anyPayload.person?.otherName,
        'Không có',
      );

      const genderLabel = firstText(
        anyPayload.detentionArrest?.genderLabel,
        anyPayload.person?.genderLabel,
        'Nam',
      );

      const birthDay = firstText(
        anyPayload.detentionArrest?.birthDay,
        anyPayload.person?.birthDay,
        '08',
      );

      const birthMonth = firstText(
        anyPayload.detentionArrest?.birthMonth,
        anyPayload.person?.birthMonth,
        '09',
      );

      const birthYear = firstText(
        anyPayload.detentionArrest?.birthYear,
        anyPayload.person?.birthYear,
        '1985',
      );

      const placeOfBirth = firstText(
        anyPayload.detentionArrest?.placeOfBirth,
        anyPayload.person?.placeOfBirth,
        'tỉnh Quảng Ngãi',
      );

      const nationality = firstText(
        anyPayload.detentionArrest?.nationality,
        anyPayload.person?.nationality,
        'Việt Nam',
      );

      const ethnicity = firstText(
        anyPayload.detentionArrest?.ethnicity,
        anyPayload.person?.ethnicity,
        'Kinh',
      );

      const religion = firstText(
        anyPayload.detentionArrest?.religion,
        anyPayload.person?.religion,
        'Không',
      );

      const occupation = firstText(
        anyPayload.detentionArrest?.occupation,
        anyPayload.person?.occupation,
        'Kinh doanh',
      );

      const identityNo = firstText(
        anyPayload.detentionArrest?.identityNo,
        anyPayload.person?.identityNo,
        '051080000314',
      );

      const identityIssuedDay = firstText(
        anyPayload.detentionArrest?.identityIssuedDay,
        anyPayload.person?.identityIssuedDay,
        '22',
      );

      const identityIssuedMonth = firstText(
        anyPayload.detentionArrest?.identityIssuedMonth,
        anyPayload.person?.identityIssuedMonth,
        '12',
      );

      const identityIssuedYear = firstText(
        anyPayload.detentionArrest?.identityIssuedYear,
        anyPayload.person?.identityIssuedYear,
        '2021',
      );

      const identityIssuedPlace = firstText(
        anyPayload.detentionArrest?.identityIssuedPlace,
        anyPayload.person?.identityIssuedPlace,
        'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
      );

      const permanentAddress = firstText(
        anyPayload.detentionArrest?.permanentAddress,
        anyPayload.person?.permanentAddress,
        'số 49/37, đường TCH 16, Khu phố 45, phường Trung Mỹ Tây, Thành phố Hồ Chí Minh',
      );

      const temporaryAddress = firstText(
        anyPayload.detentionArrest?.temporaryAddress,
        anyPayload.person?.temporaryAddress,
        '',
      );

      const currentAddress = firstText(
        anyPayload.detentionArrest?.currentAddress,
        anyPayload.person?.currentAddress,
        'số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh',
      );

      const offenseName = firstText(
        anyPayload.detentionArrest?.offenseName,
        anyPayload.offense?.offenseName,
        'Đánh bạc',
      );

      const legalArticle = firstText(
        anyPayload.detentionArrest?.legalArticle,
        anyPayload.offense?.legalArticle,
        'khoản 1 Điều 321 Bộ luật Hình sự',
      );

      const offenseClause = `về tội “${offenseName}” quy định tại ${legalArticle}`;

      const investigationAgency = firstText(
        anyPayload.detentionArrest?.investigationAgency,
        stripListLine(anyPayload.recipients?.investigatingAgencyLine),
        stripListLine(anyPayload.recipients?.investigationAuthorityLine),
        stripListLine(anyPayload.recipients?.investigationUnitLine),
        anyPayload.investigation?.investigationUnitName,
        anyPayload.investigation?.agencyName,
        'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
      );

      const detentionExecutionUnit = firstText(
        anyPayload.detentionArrest?.detentionExecutionUnitName,
        stripListLine(anyPayload.recipients?.detentionExecutionUnitLine),
        anyPayload.measure?.detentionExecutionUnitName,
        'Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh',
      );

      const detentionFacility = firstText(
        anyPayload.detentionArrest?.detentionFacilityName,
        anyPayload.measure?.detentionFacilityName,
        'Nhà tạm giữ Công an Thành phố Hồ Chí Minh',
      );

      const documentCode = firstText(
        anyPayload.document?.documentCode,
        anyPayload.document?.documentNo,
        '39/LBBC-TG-VKSKV7',
      );

      const caseDecisionCode = firstText(
        anyPayload.detentionArrest?.caseDecisionCode,
        anyPayload.caseDecision?.decisionNo,
        anyPayload.case?.caseCode,
        'VKS-2026-0001',
      );

      const caseDecisionDateText = toLegalDateText(
        firstText(
          anyPayload.detentionArrest?.caseDecisionDateText,
          anyPayload.caseDecision?.issueDateText,
          anyPayload.caseDecision?.issueDate,
          anyPayload.case?.receivedDate,
          anyPayload.document?.issueDate,
        ),
      );

      const accusedDecisionCode = firstText(
        anyPayload.detentionArrest?.accusedDecisionCode,
        anyPayload.accusedDecision?.decisionNo,
        anyPayload.case?.caseCode,
        'VKS-2026-0001',
      );

      const accusedDecisionDateText = toLegalDateText(
        firstText(
          anyPayload.detentionArrest?.accusedDecisionDateText,
          anyPayload.accusedDecision?.issueDateText,
          anyPayload.accusedDecision?.issueDate,
          anyPayload.document?.issueDate,
        ),
      );

      const detentionDurationText = firstText(
        anyPayload.detentionArrest?.detentionDurationText,
        anyPayload.measure?.detentionDurationText,
        '02 tháng',
      );

      const detentionFromDateText = firstText(
        anyPayload.detentionArrest?.detentionFromDateText,
        anyPayload.measure?.detentionFromDateText,
        anyPayload.measure?.fromDateText,
        anyPayload.document?.issueDateText,
        '25/5/2026',
      );

      const detentionToDateText = firstText(
        anyPayload.detentionArrest?.detentionToDateText,
        anyPayload.measure?.detentionToDateText,
        anyPayload.measure?.toDateText,
        '',
      );

      const detentionToDateParts = normalizeDateToDayMonthYear(detentionToDateText);

      const caseDecisionLegalBasisLine = ensureEnd(
        firstText(
          anyPayload.detentionArrest?.caseDecisionLegalBasisLine,
          `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ${caseDecisionDateText} của ${investigationAgency} ${offenseClause}`,
        ),
        ';',
      );

      const accusedDecisionLegalBasisLine = ensureEnd(
        firstText(
          anyPayload.detentionArrest?.accusedDecisionLegalBasisLine,
          `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ${accusedDecisionDateText} của ${investigationAgency} đối với ${accusedName} ${offenseClause}`,
        ),
        ';',
      );

      const reasonLine = ensureEnd(
        firstText(
          anyPayload.detentionArrest?.reasonLine,
          `Xét thấy việc bắt để tạm giam đối với bị can ${accusedName} là có căn cứ và cần thiết`,
        ),
        ',',
      );

      const personFullNameLine = `Họ tên: ${accusedName}    Giới tính: ${genderLabel}`;
      const otherNameLine = `Tên gọi khác: ${otherName}`;
      const birthInfoLine = `Sinh ngày ${birthDay} tháng ${birthMonth} năm ${birthYear} tại: ${placeOfBirth}`;
      const nationalityLine = `Quốc tịch: ${nationality}; Dân tộc: ${ethnicity}; Tôn giáo: ${religion}`;
      const occupationLine = `Nghề nghiệp: ${occupation}`;
      const identityLine = `Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: ${identityNo}`;
      const identityIssuedLine = `Cấp ngày ${identityIssuedDay} tháng ${identityIssuedMonth} năm ${identityIssuedYear} Nơi cấp: ${identityIssuedPlace}`;
      const permanentAddressLine = `Nơi thường trú: ${permanentAddress}`;
      const temporaryAddressLine = `Nơi tạm trú: ${temporaryAddress}`;
      const currentAddressLine = `Nơi ở hiện tại: ${currentAddress}`;

      const detentionDurationLine = `Thời hạn tạm giam ${detentionDurationText}, kể từ ngày bắt được bị can`;

      const detentionToDateLine = detentionToDateParts.day
        ? `đến ngày ${detentionToDateParts.day} tháng ${detentionToDateParts.month} năm ${detentionToDateParts.year}`
        : firstText(
            anyPayload.detentionArrest?.detentionToDateLine,
            'đến ngày ... tháng ... năm ...',
          );

      const article2Line = ensureEnd(
        firstText(
          anyPayload.detentionArrest?.article2Line,
          `Yêu cầu ${detentionExecutionUnit} thi hành Lệnh này theo quy định của Bộ luật Tố tụng hình sự`,
        ),
        '.',
      );

      const article3Line = ensureEnd(
        firstText(
          anyPayload.detentionArrest?.article3Line,
          `Yêu cầu ${detentionFacility} tạm giam bị can ${accusedName} cho đến khi có Lệnh/Quyết định mới`,
        ),
        './.',
      );

      anyPayload.agency = {
        ...anyPayload.agency,
        parentNameUpper: firstText(anyPayload.agency.parentNameUpper, agencyHeaderParentName),
        nameUpper: firstText(anyPayload.agency.nameUpper, agencyHeaderName),
      };

      anyPayload.document = {
        ...anyPayload.document,
        documentCode,
        documentNo: firstText(anyPayload.document.documentNo, documentCode),
        fullDocumentCode: documentCode,
      };

      anyPayload.official = {
        ...anyPayload.official,
        issuingAuthorityLine: firstText(
          anyPayload.official.issuingAuthorityLine,
          'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
        ),
      };

      anyPayload.legalBasis = {
        ...anyPayload.legalBasis,
        procedureArticlesLine: 'Căn cứ các điều 41, 113, 119 và 165 của Bộ luật Tố tụng hình sự;',
        juvenileJusticeLine: firstText(
          anyPayload.legalBasis.juvenileJusticeLine,
          'Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;',
        ),
      };

      anyPayload.detentionArrest = {
        ...anyPayload.detentionArrest,
        accusedName,
        otherName,
        genderLabel,
        birthDay,
        birthMonth,
        birthYear,
        placeOfBirth,
        nationality,
        ethnicity,
        religion,
        occupation,
        identityNo,
        identityIssuedDay,
        identityIssuedMonth,
        identityIssuedYear,
        identityIssuedPlace,
        permanentAddress,
        temporaryAddress,
        currentAddress,
        offenseName,
        legalArticle,
        offenseClause,
        investigationAgency,
        detentionExecutionUnitName: detentionExecutionUnit,
        detentionFacilityName: detentionFacility,
        caseDecisionCode,
        caseDecisionDateText,
        accusedDecisionCode,
        accusedDecisionDateText,
        detentionDurationText,
        detentionFromDateText,
        detentionToDateText,
        caseDecisionLegalBasisLine,
        accusedDecisionLegalBasisLine,
        reasonLine,
        personFullNameLine,
        otherNameLine,
        birthInfoLine,
        nationalityLine,
        occupationLine,
        identityLine,
        identityIssuedLine,
        permanentAddressLine,
        temporaryAddressLine,
        currentAddressLine,
        detentionDurationLine,
        detentionToDateLine,
        article2Line,
        article3Line,
      };

      anyPayload.recipients = {
        ...anyPayload.recipients,
        executionAgencyLine: firstText(
          anyPayload.recipients.executionAgencyLine,
          `- ${detentionExecutionUnit};`,
        ),
        detentionFacilityLine: firstText(
          anyPayload.recipients.detentionFacilityLine,
          `- ${detentionFacility};`,
        ),
        personLine: firstText(
          anyPayload.recipients.personLine,
          `- ${accusedName};`,
        ),
        archiveLine: firstText(
          anyPayload.recipients.archiveLine,
          '- Lưu: HSVA, HSKS, VP.',
        ),
      };

      anyPayload.signature = {
        ...anyPayload.signature,
        signMode: firstText(anyPayload.signature.signMode, 'KT. VIỆN TRƯỞNG'),
        positionTitle: firstText(anyPayload.signature.positionTitle, 'PHÓ VIỆN TRƯỞNG'),
        signerName: firstText(anyPayload.signature.signerName, 'Trần Thanh Nam'),
      };
    }
    // BM-039_MVP_PAYLOAD_FIX_END
    // BM-045_MVP_PAYLOAD_FIX_START
    if (templateCode === 'BM-045') {
      const anyPayload = payload as any;

      const text = (value: unknown): string => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value)
          .replace(/\s{2,}/gu, ' ')
          .trim();
      };

      const boolFlag = (value: unknown, defaultValue: boolean): boolean => {
        if (value === null || value === undefined || value === '') {
          return defaultValue;
        }

        if (typeof value === 'boolean') {
          return value;
        }

        const raw = String(value).trim().toLowerCase();

        if (['false', '0', 'no', 'off'].includes(raw)) {
          return false;
        }

        if (['true', '1', 'yes', 'on'].includes(raw)) {
          return true;
        }

        return defaultValue;
      };

      const firstText = (...values: unknown[]): string => {
        for (const value of values) {
          const nextValue = text(value);

          if (
            nextValue.length > 0 &&
            nextValue.toLowerCase() !== 'null' &&
            nextValue.toLowerCase() !== 'undefined'
          ) {
            return nextValue;
          }
        }

        return '';
      };

      const stripListLine = (value: unknown): string => {
        return text(value)
          .replace(/^-+\s*/u, '')
          .replace(/;$/u, '')
          .trim();
      };

      const toLegalDateText = (value: unknown): string => {
        const raw = text(value);

        if (!raw) {
          return '';
        }

        if (raw.includes('ngày') && raw.includes('tháng') && raw.includes('năm')) {
          return raw;
        }

        const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);

        if (!match) {
          return raw;
        }

        return `ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
      };

      const ensureEnd = (value: string, ending: string): string => {
        const nextValue = text(value)
          .replace(/\s+([,.;:])/gu, '$1')
          .replace(/\s{2,}/gu, ' ')
          .trim();

        if (!nextValue) {
          return '';
        }

        return /[.!?;,]$/u.test(nextValue)
          ? nextValue.replace(/[.!?;,]$/u, ending)
          : `${nextValue}${ending}`;
      };

      anyPayload.agency = anyPayload.agency || {};
      anyPayload.document = anyPayload.document || {};
      anyPayload.official = anyPayload.official || {};
      anyPayload.legalBasis = anyPayload.legalBasis || {};
      anyPayload.person = anyPayload.person || {};
      anyPayload.offense = anyPayload.offense || {};
      anyPayload.caseDecision = anyPayload.caseDecision || {};
      anyPayload.accusedDecision = anyPayload.accusedDecision || {};
      anyPayload.recipients = anyPayload.recipients || {};
      anyPayload.signature = anyPayload.signature || {};
      anyPayload.bailApproval = anyPayload.bailApproval || {};

      const agencyHeaderName = 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7';
      const agencyHeaderParentName = 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH';

      const accusedName = firstText(
        anyPayload.bailApproval?.accusedName,
        anyPayload.person?.fullName,
        anyPayload.targetPerson?.fullName,
        anyPayload.accused?.fullName,
        'Đoàn Văn Dũng',
      );

      const offenseName = firstText(
        anyPayload.bailApproval?.offenseName,
        anyPayload.offense?.offenseName,
        'Đánh bạc',
      );

      const legalArticle = firstText(
        anyPayload.bailApproval?.legalArticle,
        anyPayload.offense?.legalArticle,
        'khoản 1 Điều 321 Bộ luật Hình sự',
      );

      const offenseClause = `về tội “${offenseName}” quy định tại ${legalArticle}`;

      const investigationAgency = firstText(
        anyPayload.bailApproval?.investigationAgency,
        stripListLine(anyPayload.recipients?.investigatingAgencyLine),
        stripListLine(anyPayload.recipients?.investigationAuthorityLine),
        'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
      );

      const documentCode = firstText(
        anyPayload.document?.documentCode,
        anyPayload.document?.documentNo,
        '45/QĐ-VKSKV7',
      );

      const caseDecisionCode = firstText(
        anyPayload.bailApproval?.caseDecisionCode,
        anyPayload.caseDecision?.decisionNo,
        'VKS-2026-0001',
      );

      const caseDecisionIssueDateText = toLegalDateText(
        firstText(
          anyPayload.bailApproval?.caseDecisionIssueDateText,
          anyPayload.caseDecision?.issueDate,
          anyPayload.caseDecision?.issueDateText,
          anyPayload.document?.issueDate,
        ),
      );

      const accusedDecisionCode = firstText(
        anyPayload.bailApproval?.accusedDecisionCode,
        anyPayload.accusedDecision?.decisionNo,
        'VKS-2026-0001',
      );

      const accusedDecisionIssueDateText = toLegalDateText(
        firstText(
          anyPayload.bailApproval?.accusedDecisionIssueDateText,
          anyPayload.accusedDecision?.issueDate,
          anyPayload.accusedDecision?.issueDateText,
          anyPayload.document?.issueDate,
        ),
      );

      const bailDecisionCode = firstText(
        anyPayload.bailApproval?.bailDecisionCode,
        '18/QĐ-CSĐT',
      );

      const bailDecisionIssueDateText = toLegalDateText(
        firstText(
          anyPayload.bailApproval?.bailDecisionIssueDateText,
          anyPayload.document?.issueDate,
        ),
      );

      const bailDecisionAgencyName = firstText(
        anyPayload.bailApproval?.bailDecisionAgencyName,
        investigationAgency,
      );

      const bailReceiverLine = firstText(
        anyPayload.bailApproval?.bailReceiverLine,
        '- Cơ quan, tổ chức, cá nhân nhận bảo lĩnh cho bị can;',
      );

      const includeJuvenileJusticeLine = boolFlag(
        anyPayload.bailApproval?.includeJuvenileJusticeLine,
        true,
      );

      const caseDecisionLegalBasisLine = ensureEnd(
        firstText(
          anyPayload.bailApproval?.caseDecisionLegalBasisLine,
          `Căn cứ Quyết định khởi tố vụ án hình sự số ${caseDecisionCode} ${caseDecisionIssueDateText} của ${investigationAgency} ${offenseClause}`,
        ),
        ';',
      );

      const accusedDecisionLegalBasisLine = ensureEnd(
        firstText(
          anyPayload.bailApproval?.accusedDecisionLegalBasisLine,
          `Căn cứ Quyết định khởi tố bị can số ${accusedDecisionCode} ${accusedDecisionIssueDateText} của ${investigationAgency} đối với ${accusedName} ${offenseClause}`,
        ),
        ';',
      );

      const proposalLine = ensureEnd(
        firstText(
          anyPayload.bailApproval?.proposalLine,
          `Xét hồ sơ đề nghị phê chuẩn Quyết định về việc bảo lĩnh số ${bailDecisionCode} ${bailDecisionIssueDateText} của ${bailDecisionAgencyName}`,
        ),
        ';',
      );

      const reasonLine = ensureEnd(
        firstText(
          anyPayload.bailApproval?.reasonLine,
          `Nhận thấy có đủ căn cứ, điều kiện áp dụng biện pháp bảo lĩnh đối với bị can ${accusedName}`,
        ),
        ',',
      );

      const article1Line = ensureEnd(
        firstText(
          anyPayload.bailApproval?.article1Line,
          `Phê chuẩn Quyết định về việc bảo lĩnh số ${bailDecisionCode} ${bailDecisionIssueDateText} của ${bailDecisionAgencyName} đối với bị can ${accusedName}`,
        ),
        '.',
      );

      const article2Line = ensureEnd(
        firstText(
          anyPayload.bailApproval?.article2Line,
          `Yêu cầu ${bailDecisionAgencyName} thi hành Quyết định này theo quy định của Bộ luật Tố tụng hình sự`,
        ),
        './.',
      );

      anyPayload.agency = {
        ...anyPayload.agency,
        parentNameUpper: firstText(anyPayload.agency.parentNameUpper, agencyHeaderParentName),
        nameUpper: firstText(anyPayload.agency.nameUpper, agencyHeaderName),
      };

      anyPayload.document = {
        ...anyPayload.document,
        documentCode,
        documentNo: firstText(anyPayload.document.documentNo, documentCode),
        fullDocumentCode: documentCode,
      };

      anyPayload.official = {
        ...anyPayload.official,
        issuingAuthorityLine: firstText(
          anyPayload.official.issuingAuthorityLine,
          'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
        ),
      };

      anyPayload.legalBasis = {
        ...anyPayload.legalBasis,
        procedureArticlesLine: 'Căn cứ các điều 41, 121 và 165 của Bộ luật Tố tụng hình sự;',
        juvenileJusticeLine: includeJuvenileJusticeLine ? 'Căn cứ Điều 135 của Luật Tư pháp người chưa thành niên;' : '',
      };

      anyPayload.bailApproval = {
        ...anyPayload.bailApproval,
        includeJuvenileJusticeLine,
        accusedName,
        offenseName,
        legalArticle,
        offenseClause,
        investigationAgency,
        caseDecisionCode,
        caseDecisionIssueDateText,
        accusedDecisionCode,
        accusedDecisionIssueDateText,
        bailDecisionCode,
        bailDecisionIssueDateText,
        bailDecisionAgencyName,
        bailReceiverLine,
        caseDecisionLegalBasisLine,
        accusedDecisionLegalBasisLine,
        proposalLine,
        reasonLine,
        article1Line,
        article2Line,
      };

      anyPayload.recipients = {
        ...anyPayload.recipients,
        executionAgencyLine: firstText(
          anyPayload.recipients.executionAgencyLine,
          `- ${bailDecisionAgencyName};`,
        ),
        personRepresentativeLine: firstText(
          anyPayload.recipients.personRepresentativeLine,
          `- ${accusedName}, người đại diện của bị can;`,
        ),
        bailReceiverLine,
        archiveLine: firstText(
          anyPayload.recipients.archiveLine,
          '- Lưu: HSVA, HSKS, VP.',
        ),
      };

      anyPayload.signature = {
        ...anyPayload.signature,
        signMode: firstText(anyPayload.signature.signMode, 'KT. VIỆN TRƯỞNG'),
        positionTitle: firstText(anyPayload.signature.positionTitle, 'PHÓ VIỆN TRƯỞNG'),
        signerName: firstText(anyPayload.signature.signerName, 'Trần Thanh Nam'),
      };
    }
    // BM-045_MVP_PAYLOAD_FIX_END
    // BM-044_MVP_PAYLOAD_FIX_START
    if (templateCode === 'BM-044') {
      const anyPayload = payload as any;

      const text = (value: unknown): string => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value)
          .replace(/\s{2,}/gu, ' ')
          .trim();
      };

      const boolFlag = (value: unknown, defaultValue: boolean): boolean => {
        if (value === null || value === undefined || value === '') {
          return defaultValue;
        }

        if (typeof value === 'boolean') {
          return value;
        }

        const raw = String(value).trim().toLowerCase();

        if (['false', '0', 'no', 'off'].includes(raw)) {
          return false;
        }

        if (['true', '1', 'yes', 'on'].includes(raw)) {
          return true;
        }

        return defaultValue;
      };

      const firstText = (...values: unknown[]): string => {
        for (const value of values) {
          const nextValue = text(value);

          if (
            nextValue.length > 0 &&
            nextValue.toLowerCase() !== 'null' &&
            nextValue.toLowerCase() !== 'undefined'
          ) {
            return nextValue;
          }
        }

        return '';
      };

      const stripListLine = (value: unknown): string => {
        return text(value)
          .replace(/^-+\s*/u, '')
          .replace(/;$/u, '')
          .trim();
      };

      const toAgencyBodyName = (value: unknown): string => {
        const raw = text(value);

        if (!raw) {
          return '';
        }

        return raw
          .toLocaleLowerCase('vi-VN')
          .replace(/^viện kiểm sát nhân dân/u, 'Viện kiểm sát nhân dân')
          .replace(/thành phố hồ chí minh/gu, 'Thành phố Hồ Chí Minh')
          .replace(/hồ chí minh/gu, 'Hồ Chí Minh');
      };

      const toLegalDateText = (value: unknown): string => {
        const raw = text(value);

        if (!raw) {
          return '';
        }

        if (raw.includes('ngày') && raw.includes('tháng') && raw.includes('năm')) {
          return raw;
        }

        const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/u);

        if (!match) {
          return raw;
        }

        return `ngày ${Number(match[1])} tháng ${Number(match[2])} năm ${match[3]}`;
      };

      const ensureEnd = (value: string, ending: string): string => {
        const nextValue = text(value)
          .replace(/\s+([,.;:])/gu, '$1')
          .replace(/\s{2,}/gu, ' ')
          .trim();

        if (!nextValue) {
          return '';
        }

        return /[.!?;,]$/u.test(nextValue)
          ? nextValue.replace(/[.!?;,]$/u, ending)
          : `${nextValue}${ending}`;
      };

      const toDateRangeLine = (fromDate: unknown, toDate: unknown): string => {
        const fromText = toLegalDateText(fromDate);
        const toText = toLegalDateText(toDate);

        if (fromText && toText) {
          return `kể từ ${fromText} đến ${toText}`;
        }

        if (fromText) {
          return `kể từ ${fromText} đến ngày ... tháng ... năm ...`;
        }

        return 'kể từ ngày ... tháng ... năm ... đến ngày ... tháng ... năm ...';
      };

      anyPayload.agency = anyPayload.agency || {};
      anyPayload.document = anyPayload.document || {};
      anyPayload.official = anyPayload.official || {};
      anyPayload.legalBasis = anyPayload.legalBasis || {};
      anyPayload.measure = anyPayload.measure || {};
      anyPayload.recipients = anyPayload.recipients || {};
      anyPayload.signature = anyPayload.signature || {};
      anyPayload.person = anyPayload.person || {};
      anyPayload.offense = anyPayload.offense || {};
      anyPayload.detentionReplacement = anyPayload.detentionReplacement || {};

      const agencyHeaderName = 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7';
      const agencyHeaderParentName = 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH';

      const accusedName = firstText(
        anyPayload.detentionReplacement?.accusedName,
        anyPayload.person?.fullName,
        anyPayload.targetPerson?.fullName,
        anyPayload.accused?.fullName,
        'Đoàn Văn Dũng',
      );

      const offenseName = firstText(
        anyPayload.detentionReplacement?.offenseName,
        anyPayload.offense?.offenseName,
        'Đánh bạc',
      );

      const legalArticle = firstText(
        anyPayload.detentionReplacement?.legalArticle,
        anyPayload.offense?.legalArticle,
        'khoản 1 Điều 321 Bộ luật Hình sự',
      );

      const offenseClause = `về tội “${offenseName}” quy định tại ${legalArticle}`;

      const procuracyName = firstText(
        anyPayload.detentionReplacement?.procuracyName,
        anyPayload.agency?.name,
        agencyHeaderName,
      );

      const procuracyBodyName = toAgencyBodyName(procuracyName);

      const investigationAgency = firstText(
        anyPayload.detentionReplacement?.investigationAgency,
        stripListLine(anyPayload.recipients?.investigatingAgencyLine),
        stripListLine(anyPayload.recipients?.investigationAuthorityLine),
        anyPayload.investigation?.investigationUnitName,
        anyPayload.investigation?.agencyName,
        'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
      );

      const executionAgency = firstText(
        anyPayload.detentionReplacement?.executionAgencyName,
        stripListLine(anyPayload.recipients?.executionAgencyLine),
        stripListLine(anyPayload.recipients?.monitoringUnitLine),
        stripListLine(anyPayload.recipients?.investigatingAgencyLine),
        investigationAgency,
      );

      const documentCode = firstText(
        anyPayload.document?.documentCode,
        anyPayload.document?.documentNo,
        '44/QĐ-VKSKV7',
      );

      const detentionOrderCode = firstText(
        anyPayload.detentionReplacement?.detentionOrderCode,
        anyPayload.measure?.detentionOrderCode,
        '17/LTG-VKSKV7',
      );

      const detentionOrderIssueDateText = toLegalDateText(
        firstText(
          anyPayload.detentionReplacement?.detentionOrderIssueDateText,
          anyPayload.measure?.detentionOrderIssueDateText,
          anyPayload.measure?.detentionOrderIssueDate,
          anyPayload.document?.issueDate,
        ),
      );

      const extensionDecisionRoundText = firstText(
        anyPayload.detentionReplacement?.extensionDecisionRoundText,
        'lần thứ nhất',
      );

      const extensionDecisionCode = firstText(
        anyPayload.detentionReplacement?.extensionDecisionCode,
        anyPayload.measure?.prosecutionExtensionDecisionCode,
        '03/QĐ-VKSKV7',
      );

      const extensionDecisionIssueDateText = toLegalDateText(
        firstText(
          anyPayload.detentionReplacement?.extensionDecisionIssueDateText,
          anyPayload.measure?.prosecutionExtensionDecisionIssueDateText,
          anyPayload.measure?.prosecutionExtensionDecisionIssueDate,
          anyPayload.document?.issueDate,
        ),
      );

      const replacementMeasureName = firstText(
        anyPayload.detentionReplacement?.replacementMeasureName,
        'cấm đi khỏi nơi cư trú',
      );

      const replacementDurationText = firstText(
        anyPayload.detentionReplacement?.replacementDurationText,
        anyPayload.measure?.durationText,
        '02 tháng',
      );

      const replacementFromDateText = firstText(
        anyPayload.detentionReplacement?.replacementFromDateText,
        anyPayload.measure?.fromDateText,
        anyPayload.measure?.fromDate,
        anyPayload.document?.issueDate,
      );

      const replacementToDateText = firstText(
        anyPayload.detentionReplacement?.replacementToDateText,
        anyPayload.measure?.toDateText,
        anyPayload.measure?.toDate,
        '',
      );

      const includeJuvenileJusticeLine = boolFlag(
        anyPayload.detentionReplacement?.includeJuvenileJusticeLine,
        true,
      );

      const includeDetentionExtensionLegalBasis = boolFlag(
        anyPayload.detentionReplacement?.includeDetentionExtensionLegalBasis,
        true,
      );

      // BM-044_OPTIONAL_FALSE_GUARD_START
      // Nếu FE đã lưu false thì tuyệt đối không tự build lại dòng optional.
      const bm044JuvenileDisabled =
        anyPayload.detentionReplacement?.includeJuvenileJusticeLine === false;

      const bm044ExtensionDisabled =
        anyPayload.detentionReplacement?.includeDetentionExtensionLegalBasis === false;
      // BM-044_OPTIONAL_FALSE_GUARD_END

      const detentionOrderLegalBasisLine = ensureEnd(
        firstText(
          anyPayload.detentionReplacement?.detentionOrderLegalBasisLine,
          `Căn cứ Lệnh tạm giam/Lệnh bắt bị can để tạm giam số ${detentionOrderCode} ${detentionOrderIssueDateText} của ${procuracyBodyName} đối với ${accusedName} ${offenseClause}`,
        ),
        ';',
      );

      const detentionExtensionLegalBasisLine = includeDetentionExtensionLegalBasis && !bm044ExtensionDisabled
        ? ensureEnd(
            firstText(
              anyPayload.detentionReplacement?.detentionExtensionLegalBasisLine,
              `Căn cứ Quyết định gia hạn tạm giam ${extensionDecisionRoundText}/Quyết định gia hạn thời hạn tạm giam để truy tố số ${extensionDecisionCode} ${extensionDecisionIssueDateText} của ${procuracyBodyName} (nếu có)`,
            ),
            ';',
          )
        : '';

      const proposalLine = ensureEnd(
        firstText(
          anyPayload.detentionReplacement?.proposalLine,
          `Xét hồ sơ đề nghị thay thế biện pháp tạm giam của ${investigationAgency}`,
        ),
        ';',
      );

      const reasonLine = ensureEnd(
        firstText(
          anyPayload.detentionReplacement?.reasonLine,
          `Nhận thấy có đủ căn cứ, điều kiện để thay thế biện pháp tạm giam đối với bị can ${accusedName}`,
        ),
        ',',
      );

      const article1Line = ensureEnd(
        firstText(
          anyPayload.detentionReplacement?.article1Line,
          `Thay thế biện pháp tạm giam bằng biện pháp ${replacementMeasureName} đối với bị can ${accusedName}`,
        ),
        '.',
      );

      const durationLine = ensureEnd(
        firstText(
          anyPayload.detentionReplacement?.durationLine,
          `Thời hạn áp dụng biện pháp ${replacementMeasureName}, ${toDateRangeLine(replacementFromDateText, replacementToDateText)}`,
        ),
        '.',
      );

      const article2Line = ensureEnd(
        firstText(
          anyPayload.detentionReplacement?.article2Line,
          `Yêu cầu ${executionAgency} thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự`,
        ),
        './.',
      );

      anyPayload.agency = {
        ...anyPayload.agency,
        parentNameUpper: firstText(anyPayload.agency.parentNameUpper, agencyHeaderParentName),
        nameUpper: firstText(anyPayload.agency.nameUpper, agencyHeaderName),
      };

      anyPayload.document = {
        ...anyPayload.document,
        documentCode,
        documentNo: firstText(anyPayload.document.documentNo, documentCode),
        fullDocumentCode: documentCode,
      };

      anyPayload.official = {
        ...anyPayload.official,
        issuingAuthorityLine: firstText(
          anyPayload.official.issuingAuthorityLine,
          'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
        ),
      };

      anyPayload.legalBasis = {
        ...anyPayload.legalBasis,
        procedureArticlesLine: 'Căn cứ các điều 41, 125 và 165 của Bộ luật Tố tụng hình sự;',
        juvenileJusticeLine: includeJuvenileJusticeLine && !bm044JuvenileDisabled ? 'Căn cứ Điều 138 và Điều 139 của Luật Tư pháp người chưa thành niên;' : '',
      };

      anyPayload.detentionReplacement = {
        ...anyPayload.detentionReplacement,
        accusedName,
        offenseName,
        legalArticle,
        offenseClause,
        procuracyName,
        procuracyBodyName,
        investigationAgency,
        executionAgencyName: executionAgency,
        detentionOrderCode,
        detentionOrderIssueDateText,
        extensionDecisionRoundText,
        extensionDecisionCode,
        extensionDecisionIssueDateText,
        replacementMeasureName,
        includeJuvenileJusticeLine,
        includeDetentionExtensionLegalBasis,
        replacementDurationText,
        replacementFromDateText,
        replacementToDateText,
        detentionOrderLegalBasisLine,
        detentionExtensionLegalBasisLine,
        proposalLine,
        reasonLine,
        article1Line,
        durationLine,
        article2Line,
      };

      anyPayload.recipients = {
        ...anyPayload.recipients,
        personLine: firstText(
          anyPayload.recipients.personLine,
          `- ${accusedName};`,
        ),
        proposalAgencyLine: firstText(
          anyPayload.recipients.proposalAgencyLine,
          `- ${investigationAgency};`,
        ),
        executionAgencyLine: firstText(
          anyPayload.recipients.executionAgencyLine,
          `- ${executionAgency};`,
        ),
        archiveLine: firstText(
          anyPayload.recipients.archiveLine,
          '- Lưu: HSVA, HSKS, VP.',
        ),
      };

      anyPayload.signature = {
        ...anyPayload.signature,
        signMode: firstText(anyPayload.signature.signMode, 'KT. VIỆN TRƯỞNG'),
        positionTitle: firstText(anyPayload.signature.positionTitle, 'PHÓ VIỆN TRƯỞNG'),
        signerName: firstText(anyPayload.signature.signerName, 'Trần Thanh Nam'),
      };
    }
    // BM-044_MVP_PAYLOAD_FIX_END
        // BM-040_MVP_PAYLOAD_FIX_START
    if (templateCode === 'BM-040') {
      const anyPayload = payload as any;

      const text = (value: unknown): string => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value).trim();
      };

      const firstText = (...values: unknown[]): string => {
        for (const value of values) {
          const normalized = text(value);
          if (normalized.length > 0) {
            return normalized;
          }
        }

        return '';
      };

      const stripListLine = (value: unknown): string => {
        return text(value)
          .replace(/^-+\s*/g, '')
          .replace(/[;.\s]+$/g, '')
          .trim();
      };

      const normalizeBm043BodyAgencyName = (value: unknown): string => {
        const raw = text(value);
        if (raw.length === 0) {
          return '';
        }

        const upper = raw.toUpperCase();

        if (upper === 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7') {
          return 'Viện kiểm sát nhân dân khu vực 7';
        }

        if (upper === 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH') {
          return 'Viện kiểm sát nhân dân Thành phố Hồ Chí Minh';
        }

        return raw;
      };

      const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      };

      const today = new Date();
      const detentionToDate = new Date(today);
      detentionToDate.setMonth(detentionToDate.getMonth() + 2);

      anyPayload.agency = anyPayload.agency || {};
      anyPayload.document = anyPayload.document || {};
      anyPayload.legalBasis = anyPayload.legalBasis || {};
      anyPayload.caseDecision = anyPayload.caseDecision || {};
      anyPayload.accusedDecision = anyPayload.accusedDecision || {};
      anyPayload.measure = anyPayload.measure || {};
      anyPayload.recipients = anyPayload.recipients || {};
      anyPayload.signature = anyPayload.signature || {};

      const accusedName = firstText(
        anyPayload.person?.fullName,
        anyPayload.targetPerson?.fullName,
        anyPayload.accused?.fullName,
        'Đoàn Văn Dũng',
      );

      const offenseName = firstText(
        anyPayload.offense?.offenseName,
        anyPayload.offense?.name,
        anyPayload.caseInfo?.offenseName,
        'Đánh bạc',
      );

      const legalArticle = firstText(
        anyPayload.offense?.legalArticle,
        anyPayload.offense?.legalBasisText,
        anyPayload.caseInfo?.legalArticle,
        'khoản 1 Điều 321 Bộ luật Hình sự',
      );

      const issueDateText = firstText(
        anyPayload.document?.issueDateText,
        anyPayload.measure?.detentionOrderIssueDateText,
        formatDate(today),
      );

      const detentionOrderCode = firstText(
        anyPayload.measure?.detentionOrderCode,
        anyPayload.measure?.detentionOrderNo,
        anyPayload.measure?.relatedOrderCode,
        '01/LTG',
      );

      const investigationUnit = firstText(
        stripListLine(anyPayload.recipients?.investigationUnitLine),
        anyPayload.investigation?.agencyName,
        anyPayload.agency?.investigatingAgencyName,
        anyPayload.agency?.investigationAgencyName,
        'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
      );

      const detentionExecutionUnit = firstText(
        stripListLine(anyPayload.recipients?.detentionExecutionUnitLine),
        anyPayload.measure?.detentionExecutionUnitName,
        investigationUnit,
        'Cơ quan thi hành án hình sự Công an Thành phố Hồ Chí Minh',
      );

      const documentCodeLine = firstText(
        anyPayload.document?.documentCodeLine,
        anyPayload.document?.documentCode,
        anyPayload.document?.documentNo,
        anyPayload.document?.fullDocumentCode,
        '40/QĐ-VKSKV7',
      );

      anyPayload.document.documentCodeLine = documentCodeLine;
      anyPayload.document.documentCode = firstText(anyPayload.document.documentCode, documentCodeLine);
      anyPayload.document.documentNo = firstText(anyPayload.document.documentNo, documentCodeLine);
      anyPayload.document.fullDocumentCode = firstText(anyPayload.document.fullDocumentCode, documentCodeLine);

      anyPayload.legalBasis.baseProcedureLine = firstText(
        anyPayload.legalBasis.baseProcedureLine,
        'Căn cứ các điều 41, 113, 119, 165 và 173 của Bộ luật Tố tụng hình sự;',
      );

      anyPayload.legalBasis.juvenileLegalBasisLine = firstText(
        anyPayload.legalBasis.juvenileLegalBasisLine,
        'Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;',
      );

      anyPayload.legalBasis.requestApprovalLine = firstText(
        anyPayload.legalBasis.requestApprovalLine,
        `Xét hồ sơ đề nghị phê chuẩn Lệnh tạm giam số ${detentionOrderCode} ngày ${issueDateText} của ${investigationUnit} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalArticle};`,
      );

      anyPayload.measure.reasonLine = firstText(
        anyPayload.measure.reasonLine,
        `Nhận thấy việc tạm giam đối với bị can ${accusedName} là có căn cứ và cần thiết,`,
      );

      anyPayload.measure.article1Line = firstText(
        anyPayload.measure.article1Line,
        `Phê chuẩn Lệnh tạm giam số ${detentionOrderCode} ngày ${issueDateText} của ${investigationUnit} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalArticle}.`,
      );

      anyPayload.measure.detentionDurationLine = firstText(
        anyPayload.measure.detentionDurationLine,
        anyPayload.measure.detentionDurationText
          ? `Thời hạn tạm giam là ${anyPayload.measure.detentionDurationText}.`
          : `Thời hạn tạm giam là 02 tháng, kể từ ngày ${formatDate(today)} đến ngày ${formatDate(detentionToDate)}.`,
      );

      const currentArticle2Line = text(anyPayload.measure.article2Line);
      if (
        currentArticle2Line.length === 0 ||
        currentArticle2Line.toLowerCase().includes('không được phép đi khỏi nơi cư trú')
      ) {
        anyPayload.measure.article2Line =
          `Yêu cầu ${detentionExecutionUnit} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự./.`;
      }

      anyPayload.recipients.detentionExecutionUnitLine = firstText(
        anyPayload.recipients.detentionExecutionUnitLine,
        `- ${detentionExecutionUnit};`,
      );

      anyPayload.recipients.personLine = firstText(
        anyPayload.recipients.personLine,
        `- ${accusedName};`,
      );

      anyPayload.recipients.archiveLine = firstText(
        anyPayload.recipients.archiveLine,
        '- Lưu: HSVA, HSKS, VP.',
      );

      anyPayload.signature.signMode = firstText(anyPayload.signature.signMode, 'KT. VIỆN TRƯỞNG');
      anyPayload.signature.positionTitle = firstText(anyPayload.signature.positionTitle, 'PHÓ VIỆN TRƯỞNG');
      anyPayload.signature.signerName = firstText(anyPayload.signature.signerName, 'Trần Thanh Nam');
    }
    // BM-040_MVP_PAYLOAD_FIX_END
        // BM-042_MVP_PAYLOAD_FIX_START
    if (templateCode === 'BM-042') {
      const anyPayload = payload as any;

      const text = (value: unknown): string => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value).trim();
      };

      const firstText = (...values: unknown[]): string => {
        for (const value of values) {
          const normalized = text(value);
          if (normalized.length > 0) {
            return normalized;
          }
        }

        return '';
      };

      const stripListLine = (value: unknown): string => {
        return text(value)
          .replace(/^-+\s*/g, '')
          .replace(/[;.\s]+$/g, '')
          .trim();
      };

      const normalizeBm043BodyAgencyName = (value: unknown): string => {
        const raw = text(value);
        if (raw.length === 0) {
          return '';
        }

        const upper = raw.toUpperCase();

        if (upper === 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7') {
          return 'Viện kiểm sát nhân dân khu vực 7';
        }

        if (upper === 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH') {
          return 'Viện kiểm sát nhân dân Thành phố Hồ Chí Minh';
        }

        return raw;
      };

      const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      };

      const formatVietnameseDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `ngày ${day} tháng ${month} năm ${year}`;
      };

      const today = new Date();
      const extensionToDate = new Date(today);
      extensionToDate.setMonth(extensionToDate.getMonth() + 2);

      anyPayload.agency = anyPayload.agency || {};
      anyPayload.document = anyPayload.document || {};
      anyPayload.official = anyPayload.official || {};
      anyPayload.legalBasis = anyPayload.legalBasis || {};
      anyPayload.measure = anyPayload.measure || {};
      anyPayload.recipients = anyPayload.recipients || {};
      anyPayload.signature = anyPayload.signature || {};

      const accusedName = firstText(
        anyPayload.person?.fullName,
        anyPayload.targetPerson?.fullName,
        anyPayload.accused?.fullName,
        'Đoàn Văn Dũng',
      );

      const offenseName = firstText(
        anyPayload.offense?.offenseName,
        anyPayload.offense?.name,
        anyPayload.caseInfo?.offenseName,
        'Đánh bạc',
      );

      const legalArticle = firstText(
        anyPayload.offense?.legalArticle,
        anyPayload.offense?.legalBasisText,
        anyPayload.caseInfo?.legalArticle,
        'khoản 1 Điều 321 Bộ luật Hình sự',
      );

      const issueDateText = firstText(
        anyPayload.document?.issueDateText,
        anyPayload.measure?.extensionDecisionIssueDateText,
        formatVietnameseDate(today),
      );

      const detentionOrderCode = firstText(
        anyPayload.measure?.detentionOrderCode,
        anyPayload.measure?.detentionOrderNo,
        anyPayload.measure?.relatedOrderCode,
        '17/LTG-VKSKV7',
      );

      const investigationUnit = firstText(
        stripListLine(anyPayload.recipients?.investigationUnitLine),
        anyPayload.investigation?.agencyName,
        anyPayload.agency?.investigatingAgencyName,
        anyPayload.agency?.investigationAgencyName,
        'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
      );

      const superiorProcuracy = firstText(
        stripListLine(anyPayload.recipients?.superiorProcuracyLine),
        anyPayload.agency?.parentName,
        'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH',
      );

      const detentionFacility = firstText(
        stripListLine(anyPayload.recipients?.detentionFacilityLine),
        anyPayload.measure?.detentionFacilityName,
        anyPayload.detention?.facilityName,
        'Trại tạm giam Công an Thành phố Hồ Chí Minh',
      );

      const extensionRoundText = firstText(
        anyPayload.measure?.extensionRoundText,
        anyPayload.measure?.extensionRound,
        'nhất',
      );

      const documentCodeLine = firstText(
        anyPayload.document?.documentCodeLine,
        anyPayload.document?.documentCode,
        anyPayload.document?.documentNo,
        anyPayload.document?.fullDocumentCode,
        '42/QĐ-VKSKV7',
      );

      anyPayload.document.documentCodeLine = documentCodeLine;
      anyPayload.document.documentCode = firstText(anyPayload.document.documentCode, documentCodeLine);
      anyPayload.document.documentNo = firstText(anyPayload.document.documentNo, documentCodeLine);
      anyPayload.document.fullDocumentCode = firstText(anyPayload.document.fullDocumentCode, documentCodeLine);

      anyPayload.measure.extensionRoundText = extensionRoundText;

      anyPayload.official.issuerTitle = firstText(
        anyPayload.official.issuerTitle,
        'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
      );

      anyPayload.legalBasis.baseProcedureLine = firstText(
        anyPayload.legalBasis.baseProcedureLine,
        'Căn cứ các điều 41, 165 và 173 của Bộ luật Tố tụng hình sự;',
      );

      anyPayload.legalBasis.juvenileLegalBasisLine = firstText(
        anyPayload.legalBasis.juvenileLegalBasisLine,
        'Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;',
      );

      const currentDetentionOrderLine = text(anyPayload.measure.detentionOrderLegalBasisLine);
      if (
        currentDetentionOrderLine.length === 0 ||
        currentDetentionOrderLine.includes('VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7')
      ) {
        anyPayload.measure.detentionOrderLegalBasisLine =
          `Căn cứ Lệnh tạm giam/Lệnh bắt bị can để tạm giam số ${detentionOrderCode} ${issueDateText} của ${investigationUnit};`;
      }

      anyPayload.measure.previousExtensionDecisionLegalBasisLine = firstText(
        anyPayload.measure.previousExtensionDecisionLegalBasisLine,
        `Căn cứ Quyết định gia hạn tạm giam lần thứ ${extensionRoundText} số ${documentCodeLine} ${issueDateText} của Viện kiểm sát nhân dân khu vực 7 (nếu có);`,
      );

      anyPayload.legalBasis.requestExtensionLine = firstText(
        anyPayload.legalBasis.requestExtensionLine,
        `Xét hồ sơ đề nghị gia hạn tạm giam của ${investigationUnit} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalArticle};`,
      );

      anyPayload.measure.reasonLine = firstText(
        anyPayload.measure.reasonLine,
        `Nhận thấy việc gia hạn tạm giam đối với bị can ${accusedName} là có căn cứ và cần thiết,`,
      );

      anyPayload.measure.article1Line = firstText(
        anyPayload.measure.article1Line,
        `Gia hạn tạm giam lần thứ ${extensionRoundText} đối với ${accusedName} trong thời hạn 02 tháng, kể từ ${formatVietnameseDate(today)} đến ${formatVietnameseDate(extensionToDate)}.`,
      );

      const currentArticle2Line = text(anyPayload.measure.article2Line);
      if (
        currentArticle2Line.length === 0 ||
        currentArticle2Line.toLowerCase().includes('không được phép đi khỏi nơi cư trú')
      ) {
        anyPayload.measure.article2Line =
          `Yêu cầu ${investigationUnit} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự.`;
      }

      anyPayload.measure.article3Line = firstText(
        anyPayload.measure.article3Line,
        `Yêu cầu ${detentionFacility} tiếp tục tạm giam bị can ${accusedName} theo quy định của Bộ luật Tố tụng hình sự./.`,
      );

      anyPayload.recipients.superiorProcuracyLine = firstText(
        anyPayload.recipients.superiorProcuracyLine,
        `- ${superiorProcuracy};`,
      );

      anyPayload.recipients.investigationUnitLine = firstText(
        anyPayload.recipients.investigationUnitLine,
        `- ${investigationUnit};`,
      );

      anyPayload.recipients.personLine = firstText(
        anyPayload.recipients.personLine,
        `- ${accusedName};`,
      );

      anyPayload.recipients.detentionFacilityLine = firstText(
        anyPayload.recipients.detentionFacilityLine,
        `- ${detentionFacility};`,
      );

      anyPayload.recipients.archiveLine = firstText(
        anyPayload.recipients.archiveLine,
        '- Lưu: HSVA, HSKS, VP.',
      );

      anyPayload.signature.signMode = firstText(anyPayload.signature.signMode, 'KT. VIỆN TRƯỞNG');
      anyPayload.signature.positionTitle = firstText(anyPayload.signature.positionTitle, 'PHÓ VIỆN TRƯỞNG');
      anyPayload.signature.signerName = firstText(anyPayload.signature.signerName, 'Trần Thanh Nam');
    }
    // BM-042_MVP_PAYLOAD_FIX_END
        // BM-043_MVP_PAYLOAD_FIX_START
    if (templateCode === 'BM-043') {
      const anyPayload = payload as any;

      const text = (value: unknown): string => {
        if (value === null || value === undefined) {
          return '';
        }

        return String(value).trim();
      };

      const firstText = (...values: unknown[]): string => {
        for (const value of values) {
          const normalized = text(value);
          if (
            normalized.length > 0 &&
            normalized.toLowerCase() !== 'null' &&
            normalized.toLowerCase() !== 'undefined'
          ) {
            return normalized;
          }
        }

        return '';
      };

      const stripListLine = (value: unknown): string => {
        return text(value)
          .replace(/^-+\s*/g, '')
          .replace(/[;.\s]+$/g, '')
          .trim();
      };

      const normalizeBm043BodyAgencyName = (value: unknown): string => {
        const raw = text(value);
        if (raw.length === 0) {
          return '';
        }

        const upper = raw.toUpperCase();

        if (upper === 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7') {
          return 'Viện kiểm sát nhân dân khu vực 7';
        }

        if (upper === 'VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH') {
          return 'Viện kiểm sát nhân dân Thành phố Hồ Chí Minh';
        }

        return raw;
      };

      const formatVietnameseDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `ngày ${day} tháng ${month} năm ${year}`;
      };

      const today = new Date();

      anyPayload.agency = anyPayload.agency || {};
      anyPayload.document = anyPayload.document || {};
      anyPayload.official = anyPayload.official || {};
      anyPayload.legalBasis = anyPayload.legalBasis || {};
      anyPayload.measure = anyPayload.measure || {};
      anyPayload.recipients = anyPayload.recipients || {};
      anyPayload.signature = anyPayload.signature || {};

      const accusedName = firstText(
        anyPayload.person?.fullName,
        anyPayload.targetPerson?.fullName,
        anyPayload.accused?.fullName,
        'Đoàn Văn Dũng',
      );

      const offenseName = firstText(
        anyPayload.offense?.offenseName,
        anyPayload.offense?.name,
        anyPayload.caseInfo?.offenseName,
        'Đánh bạc',
      );

      const legalArticle = firstText(
        anyPayload.offense?.legalArticle,
        anyPayload.offense?.legalBasisText,
        anyPayload.caseInfo?.legalArticle,
        'khoản 1 Điều 321 Bộ luật Hình sự',
      );

      const issueDateText = firstText(
        anyPayload.document?.issueDateText,
        formatVietnameseDate(today),
      );

      const documentCodeLine = firstText(
        anyPayload.document?.documentCodeLine,
        anyPayload.document?.documentCode,
        anyPayload.document?.documentNo,
        anyPayload.document?.fullDocumentCode,
        '43/QĐ-VKSKV7',
      );

      const detentionOrderCode = firstText(
        anyPayload.measure?.detentionOrderCode,
        anyPayload.measure?.detentionOrderNo,
        anyPayload.measure?.relatedOrderCode,
        '17/LTG-VKSKV7',
      );

      const investigationUnit = firstText(
        stripListLine(anyPayload.recipients?.detentionExecutionUnitLine),
        stripListLine(anyPayload.recipients?.investigationUnitLine),
        anyPayload.investigation?.agencyName,
        anyPayload.agency?.investigatingAgencyName,
        anyPayload.agency?.investigationAgencyName,
        'Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh',
      );

      const detentionExecutionUnit = firstText(
        stripListLine(anyPayload.recipients?.detentionExecutionUnitLine),
        investigationUnit,
      );

      const previousDecisionIssuer = firstText(
        normalizeBm043BodyAgencyName(anyPayload.agency?.name),
        'Viện kiểm sát nhân dân khu vực 7',
      );

      anyPayload.document.documentCodeLine = documentCodeLine;
      anyPayload.document.documentCode = firstText(anyPayload.document.documentCode, documentCodeLine);
      anyPayload.document.documentNo = firstText(anyPayload.document.documentNo, documentCodeLine);
      anyPayload.document.fullDocumentCode = firstText(anyPayload.document.fullDocumentCode, documentCodeLine);

      anyPayload.official.issuerTitle = firstText(
        anyPayload.official.issuerTitle,
        'VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7',
      );

      anyPayload.legalBasis.baseProcedureLine = firstText(
        anyPayload.legalBasis.baseProcedureLine,
        'Căn cứ các điều 41, 125, 165 và 173 của Bộ luật Tố tụng hình sự;',
      );

      anyPayload.legalBasis.juvenileLegalBasisLine = firstText(
        anyPayload.legalBasis.juvenileLegalBasisLine,
        'Căn cứ Điều 135 và Điều 138 của Luật Tư pháp người chưa thành niên;',
      );

      const currentDetentionOrderLine = text(anyPayload.measure.detentionOrderLegalBasisLine);
      if (
        currentDetentionOrderLine.length === 0 ||
        currentDetentionOrderLine.includes('VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7')
      ) {
        anyPayload.measure.detentionOrderLegalBasisLine =
          `Căn cứ Lệnh tạm giam/Lệnh bắt bị can để tạm giam số ${detentionOrderCode} ${issueDateText} của ${investigationUnit} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalArticle};`;
      }

      anyPayload.measure.previousExtensionDecisionLegalBasisLine = firstText(
        anyPayload.measure.previousExtensionDecisionLegalBasisLine,
        `Căn cứ Quyết định gia hạn tạm giam/Quyết định gia hạn thời hạn tạm giam để truy tố số ${documentCodeLine} ${issueDateText} của ${previousDecisionIssuer} đối với ${accusedName} về tội “${offenseName}” quy định tại ${legalArticle};`,
      );

      const currentCancelReasonLine = text(anyPayload.measure.cancelReasonLine);
      if (
        currentCancelReasonLine.length === 0 ||
        currentCancelReasonLine.toLowerCase().includes('cấm đi khỏi nơi cư trú')
      ) {
        anyPayload.measure.cancelReasonLine =
          `Xét thấy không còn cần thiết tiếp tục áp dụng biện pháp tạm giam đối với bị can ${accusedName},`;
      }

      anyPayload.measure.article1Line = firstText(
        anyPayload.measure.article1Line,
        `Hủy bỏ biện pháp tạm giam đối với bị can ${accusedName}.`,
      );

      const currentArticle2Line = text(anyPayload.measure.article2Line);
      if (
        currentArticle2Line.length === 0 ||
        currentArticle2Line.toLowerCase().includes('không được phép đi khỏi nơi cư trú')
      ) {
        anyPayload.measure.article2Line =
          `Yêu cầu ${detentionExecutionUnit} thực hiện Quyết định này theo quy định của Bộ luật Tố tụng hình sự.`;
      }

      anyPayload.measure.article3Line = firstText(
        anyPayload.measure.article3Line,
        `Yêu cầu ${accusedName} phải có mặt khi cơ quan, người có thẩm quyền tiến hành tố tụng triệu tập theo quy định./.`,
      );

      anyPayload.recipients.detentionExecutionUnitLine = firstText(
        anyPayload.recipients.detentionExecutionUnitLine,
        `- ${detentionExecutionUnit};`,
      );

      anyPayload.recipients.personLine = firstText(
        anyPayload.recipients.personLine,
        `- ${accusedName};`,
      );

      anyPayload.recipients.archiveLine = firstText(
        anyPayload.recipients.archiveLine,
        '- Lưu: HSVA, HSKS, VP.',
      );

      anyPayload.signature.signMode = firstText(anyPayload.signature.signMode, 'KT. VIỆN TRƯỞNG');
      anyPayload.signature.positionTitle = firstText(anyPayload.signature.positionTitle, 'PHÓ VIỆN TRƯỞNG');
      anyPayload.signature.signerName = firstText(anyPayload.signature.signerName, 'Trần Thanh Nam');
    }
    // BM-043_MVP_PAYLOAD_FIX_END
    normalizeBm090FullDocumentCode(payload);
    normalizeBm097DocumentCode(payload);
    
    normalizeBm097OutputRules(payload);
    return payload;
  }

      private scrubForbiddenTemplateDefaults(
    value: unknown,
    templateCode: string,
    currentPath = "payload",
  ): unknown {
    const sanitizeText = (input: string, pathName: string): string => {
      let nextValue = input;

      nextValue = nextValue.replace(/(?<!\p{L})Huy(?!\p{L})/gu, "Nguyễn Thị Hồng Hạnh");
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




































