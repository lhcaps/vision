import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';

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

function normalizeHeaderFileName(fileName: string): string {
  return fileName.replace(/[\r\n"]/g, '').trim();
}

@Injectable()
export class DocumentFilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getGeneratedFileForDownload(documentIdRaw: string, fileIdRaw: string) {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');
    const fileId = parseBigIntId(fileIdRaw, 'fileId');

    const file = await this.prisma.generated_document_files.findFirst({
      where: {
        id: fileId,
        generated_document_id: documentId,
      },
    });

    if (!file) {
      throw new NotFoundException('Không tìm thấy file của biểu mẫu.');
    }

    const fullPath = this.resolveProjectPath(file.file_path);

    if (!this.isInsideProject(fullPath)) {
      throw new BadRequestException('Đường dẫn file không hợp lệ.');
    }

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File không tồn tại trên ổ đĩa: ${fullPath}`);
    }

    const stat = fs.statSync(fullPath);

    if (!stat.isFile()) {
      throw new BadRequestException('Đường dẫn không phải là file hợp lệ.');
    }

    const fileName = normalizeHeaderFileName(file.file_name);

    return {
      file,
      fullPath,
      fileName,
      fileSizeBytes: stat.size,
      mimeType: this.getMimeType(file.file_format),
    };
  }

  async deleteGeneratedFile(
    documentIdRaw: string,
    fileIdRaw: string,
    deletePhysical = true,
  ) {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');
    const fileId = parseBigIntId(fileIdRaw, 'fileId');

    const file = await this.prisma.generated_document_files.findFirst({
      where: {
        id: fileId,
        generated_document_id: documentId,
      },
    });

    if (!file) {
      throw new NotFoundException('Không tìm thấy file đã xuất.');
    }

    const physicalFile = deletePhysical
      ? this.deletePhysicalFile(file.file_path)
      : {
          deleted: false,
          skipped: true,
          reason: 'SKIPPED_BY_REQUEST',
        };

    await this.prisma.$transaction(async (tx) => {
      await tx.generated_document_files.delete({
        where: {
          id: file.id,
        },
      });

      if (file.stored_file_id) {
        await tx.stored_files.deleteMany({
          where: {
            id: file.stored_file_id,
          },
        });
      }
    });

    return {
      deleted: true,
      fileId: String(file.id),
      storedFileId: file.stored_file_id ? String(file.stored_file_id) : null,
      fileFormat: file.file_format,
      fileName: file.file_name,
      filePath: file.file_path,
      physicalFile,
    };
  }

  async bulkDeleteGeneratedFiles(
    documentIdRaw: string,
    fileIdRaws: string[],
    deletePhysical = true,
  ) {
    if (!Array.isArray(fileIdRaws) || fileIdRaws.length === 0) {
      throw new BadRequestException('Danh sách file cần xóa không được rỗng.');
    }

    const uniqueFileIds = Array.from(new Set(fileIdRaws.map((item) => item)));

    const results = [];

    for (const fileIdRaw of uniqueFileIds) {
      results.push(
        await this.deleteGeneratedFile(
          documentIdRaw,
          fileIdRaw,
          deletePhysical,
        ),
      );
    }

    return {
      deletedCount: results.length,
      results,
    };
  }

  async cleanupGeneratedFiles(
    documentIdRaw: string,
    options?: {
      keepLatestDocx?: boolean;
      keepLatestPdf?: boolean;
      deletePhysical?: boolean;
    },
  ) {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');

    const keepLatestDocx = options?.keepLatestDocx ?? true;
    const keepLatestPdf = options?.keepLatestPdf ?? true;
    const deletePhysical = options?.deletePhysical ?? true;

    const files = await this.prisma.generated_document_files.findMany({
      where: {
        generated_document_id: documentId,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (files.length === 0) {
      return {
        deletedCount: 0,
        keptCount: 0,
        keptFiles: [],
        deletedFiles: [],
      };
    }

    const keepIds = new Set<string>();

    if (keepLatestDocx) {
      const latestDocx = files.find((file) => file.file_format === 'DOCX');

      if (latestDocx) {
        keepIds.add(String(latestDocx.id));
      }
    }

    if (keepLatestPdf) {
      const latestPdf = files.find((file) => file.file_format === 'PDF');

      if (latestPdf) {
        keepIds.add(String(latestPdf.id));
      }
    }

    const filesToDelete = files.filter((file) => !keepIds.has(String(file.id)));

    const deletedFiles = [];

    for (const file of filesToDelete) {
      deletedFiles.push(
        await this.deleteGeneratedFile(
          documentIdRaw,
          String(file.id),
          deletePhysical,
        ),
      );
    }

    const keptFiles = files
      .filter((file) => keepIds.has(String(file.id)))
      .map((file) => ({
        id: String(file.id),
        storedFileId: file.stored_file_id ? String(file.stored_file_id) : null,
        fileFormat: file.file_format,
        fileName: file.file_name,
        filePath: file.file_path,
        fileSizeBytes: String(file.file_size_bytes),
        checksum: file.checksum,
        isFinal: file.is_final,
      }));

    return {
      deletedCount: deletedFiles.length,
      keptCount: keptFiles.length,
      keptFiles,
      deletedFiles,
    };
  }

  private deletePhysicalFile(filePath: string | null | undefined): {
    deleted: boolean;
    skipped?: boolean;
    reason?: string;
  } {
    if (!filePath) {
      return {
        deleted: false,
        skipped: true,
        reason: 'EMPTY_FILE_PATH',
      };
    }

    const fullPath = this.resolveProjectPath(filePath);

    if (!this.isInsideProject(fullPath)) {
      throw new BadRequestException('Không được xóa file ngoài project.');
    }

    if (!fs.existsSync(fullPath)) {
      return {
        deleted: false,
        skipped: true,
        reason: 'FILE_NOT_FOUND',
      };
    }

    const stat = fs.statSync(fullPath);

    if (!stat.isFile()) {
      throw new BadRequestException('Đường dẫn cần xóa không phải là file.');
    }

    try {
      fs.rmSync(fullPath, {
        force: true,
      });

      return {
        deleted: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      throw new BadRequestException(
        `Không xóa được file vật lý. Có thể file đang được mở bởi Word/Edge/File Explorer. Đóng file rồi thử lại. Path=${fullPath}. Error=${message}`,
      );
    }
  }

  private getMimeType(fileFormat: string): string {
    switch (fileFormat) {
      case 'DOCX':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'PDF':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  private getProjectRoot(): string {
    return path.resolve(process.cwd(), '..', '..');
  }

  private resolveProjectPath(storedPath: string): string {
    if (path.isAbsolute(storedPath)) {
      return path.normalize(storedPath);
    }

    return path.resolve(this.getProjectRoot(), storedPath);
  }

  private isInsideProject(fullPath: string): boolean {
    const projectRoot = this.getProjectRoot();
    const normalizedRoot = path.normalize(projectRoot);
    const normalizedFile = path.normalize(fullPath);

    if (
      normalizedFile !== normalizedRoot &&
      !normalizedFile.startsWith(normalizedRoot + path.sep)
    ) {
      return false;
    }

    // Resolve symlink để chống symlink attack
    try {
      const realFile = fs.realpathSync.native
        ? fs.realpathSync.native(normalizedFile)
        : fs.realpathSync(normalizedFile);
      const realRoot = fs.realpathSync.native
        ? fs.realpathSync.native(normalizedRoot)
        : fs.realpathSync(normalizedRoot);
      return realFile === realRoot || realFile.startsWith(realRoot + path.sep);
    } catch {
      // Nếu file không tồn tại, vẫn cho phép (sẽ skip ở bước existsSync)
      return true;
    }
  }
}
