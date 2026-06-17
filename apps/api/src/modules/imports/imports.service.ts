import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfirmImportBatchDto } from './dto/confirm-import-batch.dto';
import { FileExtractionService } from './file-extraction.service';
import { ImportStorageService } from './import-storage.service';
import type {
  ImportBatchMetadata,
  ImportDetectedCandidate,
  ImportFileMetadata,
  ImportParsedPayload,
  ImportTargetType,
} from './import.types';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 20;

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.csv',
  '.txt',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.tif',
  '.tiff',
]);

const DANGEROUS_MIME_TYPES = new Set([
  'application/x-msdownload',
  'application/x-dosexec',
  'application/x-sh',
  'text/javascript',
  'application/javascript',
  'application/x-bat',
]);

type ImportFileRowWithStoredFile = {
  id: bigint;
  batch_id: bigint;
  stored_file_id: bigint | null;
  original_file_name: string;
  original_path: string | null;
  file_ext: string | null;
  mime_type: string | null;
  file_size_bytes: bigint;
  parse_status: string;
  raw_text: string | null;
  parsed_json: unknown;
  error_message: string | null;
  created_at: Date;
  parsed_at: Date | null;
  stored_files: {
    id: bigint;
    original_file_name: string;
    stored_file_name: string;
    file_ext: string | null;
    mime_type: string | null;
    file_size_bytes: bigint;
    relative_path: string;
    absolute_path: string | null;
    checksum: string | null;
    related_entity_type: string | null;
    related_entity_id: bigint | null;
  } | null;
};

type ImportBatchRowWithFiles = {
  id: bigint;
  batch_code: string;
  import_type: string;
  source_name: string | null;
  source_path: string | null;
  status: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  error_message: string | null;
  created_by_name: string | null;
  created_at: Date;
  completed_at: Date | null;
  import_files: ImportFileRowWithStoredFile[];
};

function toPublicId(value: bigint | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function parseBigIntId(value: string, entityName = 'ID'): bigint {
  try {
    const parsed = BigInt(value);

    if (parsed <= 0n) {
      throw new Error('Invalid id');
    }

    return parsed;
  } catch {
    throw new BadRequestException(`${entityName} không hợp lệ.`);
  }
}

function trimText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

function normalizeParsedJson(value: unknown): ImportParsedPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as ImportParsedPayload;
}

function pickFirstCandidate(
  candidates: ImportDetectedCandidate[],
  type: ImportDetectedCandidate['type'],
): string | null {
  return candidates.find((candidate) => candidate.type === type)?.value ?? null;
}

function toDateOnly(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function fileNameWithoutExtension(value: string): string {
  const index = value.lastIndexOf('.');
  return index >= 0 ? value.slice(0, index) : value;
}

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ImportStorageService,
    private readonly extraction: FileExtractionService,
  ) {}

  async uploadFiles(
    files: Express.Multer.File[],
    createdByName?: string,
  ): Promise<any> {
    if (!files.length) {
      throw new BadRequestException('Vui lòng chọn ít nhất một tệp để import.');
    }

    if (files.length > MAX_FILES_PER_BATCH) {
      throw new BadRequestException(
        `Chỉ được import tối đa ${MAX_FILES_PER_BATCH} tệp trong một lần.`,
      );
    }

    const now = new Date();
    const batchCode = this.storage.createBatchCode(now);
    const batchDirectory = this.storage.createBatchDirectory(batchCode, now);

    const batch = await this.prisma.import_batches.create({
      data: {
        batch_code: batchCode,
        import_type: 'MANUAL_UPLOAD',
        source_name: 'Import dữ liệu',
        source_path: batchDirectory.relativePath,
        status: 'UPLOADED',
        total_files: files.length,
        processed_files: 0,
        failed_files: 0,
        total_rows: 0,
        valid_rows: 0,
        invalid_rows: 0,
        created_by_name: trimText(createdByName),
      },
    });

    const metadataFiles: ImportFileMetadata[] = [];
    const batchWarnings: string[] = [];
    let processedFiles = 0;
    let failedFiles = 0;
    let totalRows = 0;

    for (const [index, file] of files.entries()) {
      const fileResult = await this.processUploadedFile(
        batch.id,
        batchCode,
        file,
        index,
      );

      metadataFiles.push(fileResult.metadata);
      totalRows += fileResult.totalRows;

      if (
        fileResult.metadata.parseStatus === 'FAILED' ||
        fileResult.metadata.parseStatus === 'REJECTED'
      ) {
        failedFiles += 1;
      } else {
        processedFiles += 1;
      }

      batchWarnings.push(...fileResult.metadata.warnings);
    }

    const status =
      processedFiles === 0 ? 'FAILED' : failedFiles > 0 ? 'PARTIAL' : 'PARSED';

    const metadata: ImportBatchMetadata = {
      version: 1,
      batchCode,
      createdAt: batch.created_at.toISOString(),
      updatedAt: now.toISOString(),
      status,
      warnings: Array.from(new Set(batchWarnings)),
      target: null,
      files: metadataFiles,
    };

    await this.storage.writeBatchMetadata(
      batchDirectory.relativePath,
      metadata,
    );

    await this.prisma.import_batches.update({
      where: {
        id: batch.id,
      },
      data: {
        status,
        processed_files: processedFiles,
        failed_files: failedFiles,
        total_rows: totalRows,
        valid_rows: totalRows,
        invalid_rows: 0,
        error_message:
          status === 'FAILED'
            ? 'Không có tệp hợp lệ nào được xử lý thành công.'
            : null,
      },
    });

    return this.getBatch(batchCode);
  }

  async getBatch(batchId: string): Promise<any> {
    const batch = await this.findBatch(batchId);
    const metadata = await this.storage.readBatchMetadata(batch.source_path);

    return this.normalizeBatchDetail(batch, metadata);
  }

  async getHistory(page = 1, pageSize = 12): Promise<any> {
    const safePage = Math.max(1, Number(page || 1));
    const safePageSize = Math.min(50, Math.max(1, Number(pageSize || 12)));

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.import_batches.count(),
      this.prisma.import_batches.findMany({
        orderBy: [
          {
            created_at: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        include: {
          import_files: {
            include: {
              stored_files: true,
            },
            orderBy: {
              id: 'asc',
            },
          },
        },
      }),
    ]);

    const items = await Promise.all(
      rows.map(async (batch) => {
        const metadata = await this.storage.readBatchMetadata(
          batch.source_path,
        );
        const detail = this.normalizeBatchDetail(batch, metadata);

        return {
          batchId: detail.batchId,
          status: detail.status,
          createdAt: detail.createdAt,
          confirmedAt: detail.confirmedAt,
          sourceName: detail.sourceName,
          target: detail.target,
          fileCount: detail.fileCount,
          processedFiles: detail.processedFiles,
          failedFiles: detail.failedFiles,
          warnings: detail.warnings,
          files: detail.files.slice(0, 3).map((file: any) => ({
            fileId: file.fileId,
            fileName: file.fileName,
            parseStatus: file.parseStatus,
          })),
        };
      }),
    );

    return {
      items,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.ceil(total / safePageSize),
      },
    };
  }

  async confirmBatch(
    batchId: string,
    dto: ConfirmImportBatchDto,
  ): Promise<any> {
    const batch = await this.findBatch(batchId);

    if (batch.status === 'CONFIRMED') {
      return this.getBatch(batch.batch_code);
    }

    const metadata =
      (await this.storage.readBatchMetadata(batch.source_path)) ??
      this.createEmptyMetadata(batch);

    const validStoredFileIds = batch.import_files
      .map((item) => item.stored_file_id)
      .filter((value): value is bigint => Boolean(value));

    let targetId: string | null = null;
    const targetWarnings = [...metadata.warnings];
    const confirmedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (dto.targetType === 'EXISTING_CASE') {
        const caseId = parseBigIntId(dto.existingCaseId || '', 'caseId');
        const existingCase = await tx.cases.findFirst({
          where: {
            id: caseId,
            is_deleted: false,
          },
        });

        if (!existingCase) {
          throw new NotFoundException('Không tìm thấy hồ sơ cần gắn tệp.');
        }

        targetId = String(existingCase.id);

        if (validStoredFileIds.length) {
          await tx.stored_files.updateMany({
            where: {
              id: {
                in: validStoredFileIds,
              },
            },
            data: {
              related_entity_type: 'cases',
              related_entity_id: caseId,
            },
          });
        }

        await tx.case_events.create({
          data: {
            case_id: caseId,
            event_type: 'IMPORT_FILE_ATTACHED',
            event_title: 'Gắn tài liệu import',
            event_description: `Đã gắn lô import ${batch.batch_code} vào hồ sơ.`,
            stage_code: existingCase.current_stage,
            status_after: existingCase.current_status,
            created_by_name: trimText(dto.createdByName),
          },
        });
      }

      if (dto.targetType === 'NEW_CASE') {
        const suggested = this.buildSuggestedNewCase(
          metadata.files,
          batch.batch_code,
        );
        const requestedCaseCode =
          trimText(dto.newCase?.caseCode) ?? suggested.caseCode ?? null;
        const uniqueCaseCode = await this.ensureUniqueCaseCode(
          tx,
          requestedCaseCode ?? `VKS-${new Date().getFullYear()}-${Date.now()}`,
        );

        if (requestedCaseCode && requestedCaseCode !== uniqueCaseCode) {
          targetWarnings.push(
            `Mã hồ sơ ${requestedCaseCode} đã trùng, hệ thống đổi thành ${uniqueCaseCode}.`,
          );
        }

        const createdCase = await tx.cases.create({
          data: {
            case_code: uniqueCaseCode,
            case_title:
              trimText(dto.newCase?.caseTitle) ??
              suggested.caseTitle ??
              `Hồ sơ import ${batch.batch_code}`,
            case_summary:
              trimText(dto.note) ?? `Tạo từ lô import ${batch.batch_code}`,
            case_type: 'CRIMINAL_CASE',
            source_type: 'IMPORT',
            current_stage: 'RECEPTION',
            current_status: 'DRAFT',
            received_date:
              toDateOnly(dto.newCase?.createdDate) ??
              toDateOnly(suggested.createdDate) ??
              new Date(),
            priority: 'NORMAL',
            created_by_name: trimText(dto.createdByName),
            updated_by_name: trimText(dto.createdByName),
          },
        });

        targetId = String(createdCase.id);

        await tx.case_events.create({
          data: {
            case_id: createdCase.id,
            event_type: 'CASE_CREATED',
            event_title: 'Tạo hồ sơ từ import',
            event_description: `Tạo hồ sơ từ lô import ${batch.batch_code}.`,
            stage_code: createdCase.current_stage,
            status_after: createdCase.current_status,
            created_by_name: trimText(dto.createdByName),
          },
        });

        const relatedPersonName =
          trimText(dto.newCase?.relatedPersonName) ??
          suggested.relatedPersonName;

        let createdPersonId: bigint | null = null;

        if (relatedPersonName) {
          const person = await tx.people.create({
            data: {
              full_name: relatedPersonName,
              gender: 'UNKNOWN',
            },
          });

          createdPersonId = person.id;

          await tx.case_people.create({
            data: {
              case_id: createdCase.id,
              person_id: person.id,
              role_type: 'ACCUSED',
              person_order: 1,
              legal_status: null,
              is_primary: true,
              is_active: true,
              note: 'Tạo từ dữ liệu import',
            },
          });
        }

        const offenseName =
          trimText(dto.newCase?.offenseName) ?? suggested.offenseName;

        if (offenseName) {
          let offense = await tx.offenses.findFirst({
            where: {
              offense_name: offenseName,
            },
          });

          if (!offense) {
            offense = await tx.offenses.create({
              data: {
                offense_name: offenseName,
                offense_code: null,
                offense_group: null,
                description: 'Tạo từ dữ liệu import',
                is_active: true,
              },
            });
          }

          await tx.case_offenses.create({
            data: {
              case_id: createdCase.id,
              person_id: createdPersonId,
              offense_id: offense.id,
              legal_article_id: null,
              offense_description: 'Tạo từ dữ liệu import',
              is_primary: true,
            },
          });
        }

        if (validStoredFileIds.length) {
          await tx.stored_files.updateMany({
            where: {
              id: {
                in: validStoredFileIds,
              },
            },
            data: {
              related_entity_type: 'cases',
              related_entity_id: createdCase.id,
            },
          });
        }
      }

      await tx.import_batches.update({
        where: {
          id: batch.id,
        },
        data: {
          status: 'CONFIRMED',
          completed_at: confirmedAt,
        },
      });
    });

    metadata.updatedAt = confirmedAt.toISOString();
    metadata.status = 'CONFIRMED';
    metadata.warnings = Array.from(new Set(targetWarnings));
    metadata.target = {
      type: dto.targetType,
      targetId,
      summary: this.buildTargetSummary(dto.targetType, targetId),
      confirmedAt: confirmedAt.toISOString(),
    };

    try {
      await this.storage.writeBatchMetadata(batch.source_path || '', metadata);
    } catch (error: any) {
      this.logger.warn(
        `Không thể cập nhật metadata cho lô ${batch.batch_code}: ${error?.message || error}`,
      );
    }

    return this.getBatch(batch.batch_code);
  }

  async getFileDownload(fileId: string): Promise<{
    fileName: string;
    mimeType: string;
    fullPath: string;
    fileSizeBytes: number;
  }> {
    const importFileId = parseBigIntId(fileId, 'fileId');
    const file = await this.prisma.import_files.findFirst({
      where: {
        id: importFileId,
      },
      include: {
        stored_files: true,
      },
    });

    if (!file?.stored_files) {
      throw new NotFoundException('Không tìm thấy file import gốc.');
    }

    const resolvedPath = this.storage.resolveProjectPath(
      file.stored_files.relative_path,
    );

    if (!resolvedPath) {
      throw new NotFoundException('Không tìm thấy đường dẫn file import.');
    }

    return {
      fileName: file.original_file_name,
      mimeType: trimText(file.mime_type) ?? 'application/octet-stream',
      fullPath: resolvedPath,
      fileSizeBytes: Number(file.file_size_bytes || 0n),
    };
  }

  private async processUploadedFile(
    batchId: bigint,
    batchCode: string,
    file: Express.Multer.File,
    index: number,
  ): Promise<{
    metadata: ImportFileMetadata;
    totalRows: number;
  }> {
    const originalName = file.originalname || `tep-tin-${index + 1}`;
    const extension = this.normalizeExtension(originalName);
    const mimeType = trimText(file.mimetype);

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      await this.storage.deleteFileIfExists(file.path);
      const importFile = await this.prisma.import_files.create({
        data: {
          batch_id: batchId,
          original_file_name: originalName,
          original_path: null,
          file_ext: extension || null,
          mime_type: mimeType,
          file_size_bytes: BigInt(file.size || 0),
          parse_status: 'REJECTED',
          raw_text: null,
          parsed_json: Prisma.DbNull,
          error_message: 'Định dạng tệp không được hỗ trợ.',
        },
      });

      return {
        metadata: {
          importFileId: String(importFile.id),
          originalName,
          safeName: null,
          extension,
          mimeType,
          sizeBytes: Number(file.size || 0),
          checksumSha256: null,
          parseStatus: 'REJECTED',
          storagePath: null,
          previewText: null,
          warnings: [
            'Chỉ chấp nhận PDF, Word, Excel, CSV, TXT, JSON và hình ảnh.',
          ],
          errorMessage: 'Định dạng tệp không được hỗ trợ.',
          candidates: [],
          parsedJson: null,
        },
        totalRows: 0,
      };
    }

    if (mimeType && DANGEROUS_MIME_TYPES.has(mimeType)) {
      await this.storage.deleteFileIfExists(file.path);
      const importFile = await this.prisma.import_files.create({
        data: {
          batch_id: batchId,
          original_file_name: originalName,
          original_path: null,
          file_ext: extension,
          mime_type: mimeType,
          file_size_bytes: BigInt(file.size || 0),
          parse_status: 'REJECTED',
          raw_text: null,
          parsed_json: Prisma.DbNull,
          error_message: 'Loại tệp này không được phép tải lên.',
        },
      });

      return {
        metadata: {
          importFileId: String(importFile.id),
          originalName,
          safeName: null,
          extension,
          mimeType,
          sizeBytes: Number(file.size || 0),
          checksumSha256: null,
          parseStatus: 'REJECTED',
          storagePath: null,
          previewText: null,
          warnings: ['Loại tệp này không được phép tải lên.'],
          errorMessage: 'Loại tệp này không được phép tải lên.',
          candidates: [],
          parsedJson: null,
        },
        totalRows: 0,
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      await this.storage.deleteFileIfExists(file.path);
      const importFile = await this.prisma.import_files.create({
        data: {
          batch_id: batchId,
          original_file_name: originalName,
          original_path: null,
          file_ext: extension,
          mime_type: mimeType,
          file_size_bytes: BigInt(file.size || 0),
          parse_status: 'FAILED',
          raw_text: null,
          parsed_json: Prisma.DbNull,
          error_message: 'Tệp vượt quá giới hạn 50MB.',
        },
      });

      return {
        metadata: {
          importFileId: String(importFile.id),
          originalName,
          safeName: null,
          extension,
          mimeType,
          sizeBytes: Number(file.size || 0),
          checksumSha256: null,
          parseStatus: 'FAILED',
          storagePath: null,
          previewText: null,
          warnings: ['Tệp vượt quá giới hạn 50MB và không được xử lý.'],
          errorMessage: 'Tệp vượt quá giới hạn 50MB.',
          candidates: [],
          parsedJson: null,
        },
        totalRows: 0,
      };
    }

    const batchDirectory = this.storage.createBatchDirectory(batchCode);
    const safeName = this.storage.makeSafeFileName(originalName, index);
    const destinationPath = `${batchDirectory.fullPath}/${safeName}`;

    await this.storage.moveTempFile(file.path, destinationPath);

    const relativePath = this.storage.toProjectRelativePath(destinationPath);
    const checksum = this.storage.sha256(destinationPath);
    const extraction = await this.extraction.extractFile(
      destinationPath,
      extension,
      mimeType,
    );

    const storedFile = await this.prisma.stored_files.create({
      data: {
        file_category: 'IMPORT_ORIGINAL',
        original_file_name: originalName,
        stored_file_name: safeName,
        file_ext: extension,
        mime_type: mimeType,
        file_size_bytes: BigInt(file.size || 0),
        relative_path: relativePath,
        absolute_path: destinationPath,
        checksum,
        related_entity_type: 'import_batches',
        related_entity_id: batchId,
      },
    });

    const importFile = await this.prisma.import_files.create({
      data: {
        batch_id: batchId,
        stored_file_id: storedFile.id,
        original_file_name: originalName,
        original_path: relativePath,
        file_ext: extension,
        mime_type: mimeType,
        file_size_bytes: BigInt(file.size || 0),
        parse_status: extraction.extractionStatus,
        raw_text: extraction.rawText,
        parsed_json: extraction.parsedJson ?? Prisma.DbNull,
        error_message: extraction.errorMessage,
        parsed_at:
          extraction.extractionStatus === 'FAILED' ||
          extraction.extractionStatus === 'REJECTED'
            ? null
            : new Date(),
      },
    });

    return {
      metadata: {
        importFileId: String(importFile.id),
        originalName,
        safeName,
        extension,
        mimeType,
        sizeBytes: Number(file.size || 0),
        checksumSha256: checksum,
        parseStatus: extraction.extractionStatus,
        storagePath: relativePath,
        previewText: extraction.previewText,
        warnings: extraction.warnings,
        errorMessage: extraction.errorMessage,
        candidates: extraction.candidates,
        parsedJson: extraction.parsedJson,
      },
      totalRows: extraction.totalRows,
    };
  }

  private async findBatch(batchId: string): Promise<ImportBatchRowWithFiles> {
    const where =
      /^\d+$/.test(batchId) && !batchId.startsWith('0')
        ? {
            id: parseBigIntId(batchId, 'batchId'),
          }
        : {
            batch_code: batchId,
          };

    const batch = await this.prisma.import_batches.findFirst({
      where,
      include: {
        import_files: {
          include: {
            stored_files: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Không tìm thấy lô import.');
    }

    return batch;
  }

  private normalizeBatchDetail(
    batch: ImportBatchRowWithFiles,
    metadata: ImportBatchMetadata | null,
  ) {
    const files = batch.import_files.map((item) =>
      this.normalizeImportFile(item, metadata),
    );

    const warnings = Array.from(
      new Set([
        ...(metadata?.warnings ?? []),
        ...files.flatMap((file) => file.warnings),
      ]),
    );

    const suggestedNewCase = this.buildSuggestedNewCase(
      files,
      batch.batch_code,
    );

    return {
      batchId: batch.batch_code,
      numericId: toPublicId(batch.id),
      status: batch.status,
      sourceName: batch.source_name ?? 'Import dữ liệu',
      importType: batch.import_type,
      createdAt: batch.created_at.toISOString(),
      confirmedAt:
        batch.completed_at?.toISOString() ??
        metadata?.target?.confirmedAt ??
        null,
      createdByName: batch.created_by_name,
      fileCount: batch.total_files,
      processedFiles: batch.processed_files,
      failedFiles: batch.failed_files,
      totalRows: batch.total_rows,
      warnings,
      errorMessage: batch.error_message,
      target: metadata?.target
        ? {
            type: metadata.target.type,
            targetId: metadata.target.targetId,
            summary: metadata.target.summary,
          }
        : null,
      files,
      suggestedNewCase,
    };
  }

  private normalizeImportFile(
    item: ImportFileRowWithStoredFile,
    metadata: ImportBatchMetadata | null,
  ) {
    const metadataEntry = metadata?.files.find(
      (entry) => entry.importFileId === String(item.id),
    );

    return {
      fileId: String(item.id),
      storedFileId: toPublicId(item.stored_file_id),
      fileName: item.original_file_name,
      safeName:
        metadataEntry?.safeName ?? item.stored_files?.stored_file_name ?? null,
      fileType: item.file_ext ?? item.mime_type ?? 'unknown',
      mimeType: item.mime_type,
      sizeBytes: Number(item.file_size_bytes || 0n),
      parseStatus: item.parse_status,
      downloadAvailable: Boolean(item.stored_files),
      storagePath: item.stored_files?.relative_path ?? item.original_path,
      checksumSha256:
        item.stored_files?.checksum ?? metadataEntry?.checksumSha256 ?? null,
      previewText:
        metadataEntry?.previewText ??
        (item.raw_text ? String(item.raw_text).slice(0, 4000) : null),
      warnings: metadataEntry?.warnings ?? [],
      errorMessage: item.error_message ?? metadataEntry?.errorMessage ?? null,
      candidates: metadataEntry?.candidates ?? [],
      parsedJson:
        metadataEntry?.parsedJson ?? normalizeParsedJson(item.parsed_json),
      createdAt: item.created_at.toISOString(),
      parsedAt: item.parsed_at?.toISOString() ?? null,
    };
  }

  private buildSuggestedNewCase(
    files: Array<{
      fileName?: string;
      originalName?: string;
      candidates?: ImportDetectedCandidate[] | null;
    }>,
    batchCode: string,
  ) {
    const allCandidates = files.flatMap((file) => file.candidates ?? []);
    const today = new Date().toISOString().slice(0, 10);
    const fallbackTitle =
      fileNameWithoutExtension(
        files[0]?.fileName || files[0]?.originalName || '',
      ).trim() || `Hồ sơ import ${batchCode}`;

    return {
      caseCode: pickFirstCandidate(allCandidates, 'caseCode') ?? '',
      caseTitle: fallbackTitle,
      relatedPersonName: pickFirstCandidate(allCandidates, 'personName') ?? '',
      offenseName: pickFirstCandidate(allCandidates, 'offense') ?? '',
      createdDate:
        this.normalizeSuggestedDate(
          pickFirstCandidate(allCandidates, 'date'),
        ) ?? today,
    };
  }

  private normalizeSuggestedDate(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());

    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
    }

    const vietnameseMatch =
      /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i.exec(value);

    if (vietnameseMatch) {
      return `${vietnameseMatch[3]}-${vietnameseMatch[2].padStart(2, '0')}-${vietnameseMatch[1].padStart(2, '0')}`;
    }

    return null;
  }

  private buildTargetSummary(
    targetType: ImportTargetType,
    targetId: string | null,
  ): string {
    switch (targetType) {
      case 'NEW_CASE':
        return targetId
          ? `Đã tạo hồ sơ mới #${targetId}.`
          : 'Đã tạo hồ sơ mới.';
      case 'EXISTING_CASE':
        return targetId
          ? `Đã gắn tệp vào hồ sơ #${targetId}.`
          : 'Đã gắn tệp vào hồ sơ có sẵn.';
      case 'TEMPLATE_SOURCE':
        return 'Đã lưu làm nguồn biểu mẫu để tham khảo.';
      case 'RAW_REFERENCE':
      default:
        return 'Đã lưu làm tài liệu tham khảo.';
    }
  }

  private createEmptyMetadata(
    batch: ImportBatchRowWithFiles,
  ): ImportBatchMetadata {
    return {
      version: 1,
      batchCode: batch.batch_code,
      createdAt: batch.created_at.toISOString(),
      updatedAt: batch.created_at.toISOString(),
      status: batch.status,
      warnings: [],
      target: null,
      files: [],
    };
  }

  private normalizeExtension(fileName: string): string {
    const extension = fileName.includes('.')
      ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
      : '';

    return extension;
  }

  private async ensureUniqueCaseCode(tx: any, input: string): Promise<string> {
    const normalized =
      trimText(input) ?? `VKS-${new Date().getFullYear()}-${Date.now()}`;
    const existing = await tx.cases.findFirst({
      where: {
        case_code: normalized,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return normalized;
    }

    return `${normalized}-IMP${Date.now().toString().slice(-6)}`;
  }
}
