import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { DocumentPreExportService } from './document-pre-export.service';
import { DocumentRendererService } from './document-renderer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConvertGeneratedDocumentPdfDto } from './dto/convert-generated-document-pdf.dto';

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

function safeFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

@Injectable()
export class DocumentPdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentRendererService: DocumentRendererService,
    private readonly documentPreExportService: DocumentPreExportService,
    private readonly paths: WorkspacePathsService,
    private readonly config: AppConfigService,
  ) {}

  async convertLatestDocxToPdf(
    documentIdRaw: string,
    dto: ConvertGeneratedDocumentPdfDto,
  ) {
    const documentId = parseBigIntId(documentIdRaw, 'documentId');

    const generatedDocument = await this.prisma.generated_documents.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!generatedDocument) {
      throw new NotFoundException('Không tìm thấy biểu mẫu đã tạo.');
    }

    const existingPdf = await this.prisma.generated_document_files.findFirst({
      where: {
        generated_document_id: generatedDocument.id,
        file_format: 'PDF',
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (existingPdf && !dto.force) {
      return {
        skipped: true,
        message: 'Biểu mẫu đã có PDF. Truyền force=true để convert lại.',
        file: {
          id: toPublicId(existingPdf.id),
          fileFormat: existingPdf.file_format,
          fileName: existingPdf.file_name,
          filePath: existingPdf.file_path,
          fileSizeBytes: String(existingPdf.file_size_bytes),
          checksum: existingPdf.checksum,
          isFinal: existingPdf.is_final,
        },
      };
    }

    const latestDocx = await this.prisma.generated_document_files.findFirst({
      where: {
        generated_document_id: generatedDocument.id,
        file_format: 'DOCX',
      },
      orderBy: {
        id: 'desc',
      },
    });

    const caseItem = await this.prisma.cases.findUnique({
      where: {
        id: generatedDocument.case_id,
      },
    });

    const caseCode = caseItem?.case_code || `CASE-${generatedDocument.case_id}`;

    const outputDir = path.join(
      this.getProjectRoot(),
      'storage',
      'generated',
      'cases',
      safeFileName(caseCode),
      'pdf',
    );

    fs.mkdirSync(outputDir, {
      recursive: true,
    });

    const configState =
      await this.documentPreExportService.loadNormalizedConfigForDocumentId(
        documentIdRaw,
      );
    const customizationWarnings: string[] = [];
    const shouldUseCustomizedSource =
      this.documentPreExportService.hasEnabledCustomizations(
        configState.config,
      );
    let docxPath = '';
    let latestDocxBaseName = latestDocx
      ? path.basename(latestDocx.file_name, path.extname(latestDocx.file_name))
      : `document-${generatedDocument.id}`;
    let preExportCustomizationMeta: Record<string, unknown> | null = null;
    let tempDocxPath: string | null = null;

    if (shouldUseCustomizedSource) {
      const preparedRender =
        await this.documentRendererService.buildFinalRenderedDocxForDocument(
          documentIdRaw,
        );

      latestDocxBaseName =
        latestDocxBaseName ||
        [
          safeFileName(preparedRender.template.template_code || 'BM'),
          safeFileName(
            generatedDocument.document_title || 'generated-document',
          ),
        ]
          .filter(Boolean)
          .join('_');

      tempDocxPath = path.join(
        outputDir,
        `${latestDocxBaseName}__pdf-source.docx`,
      );
      fs.writeFileSync(tempDocxPath, preparedRender.buffer);
      docxPath = tempDocxPath;
      customizationWarnings.push(...preparedRender.customizationWarnings);
      preExportCustomizationMeta = {
        applied: preparedRender.customizationApplied,
        warnings: preparedRender.customizationWarnings,
        matchedStyleCount: preparedRender.matchedStyleCount,
        replacedBlankCount: preparedRender.replacedBlankCount,
        source: 'temporary-customized-docx',
      };
    } else {
      customizationWarnings.push(...configState.warnings);

      if (!latestDocx) {
        throw new BadRequestException(
          'Biểu mẫu chưa có file DOCX. Hãy render DOCX trước khi convert PDF.',
        );
      }

      docxPath = this.resolveProjectPath(latestDocx.file_path);

      if (!fs.existsSync(docxPath)) {
        throw new NotFoundException(
          `Không tìm thấy file DOCX trên ổ đĩa: ${docxPath}`,
        );
      }
    }

    const pdfFileName = `${latestDocxBaseName}.pdf`;
    const pdfPath = path.join(outputDir, pdfFileName);

    try {
      await this.convertDocxToPdf(
        docxPath,
        pdfPath,
        String(generatedDocument.id),
      );
    } finally {
      if (tempDocxPath && fs.existsSync(tempDocxPath)) {
        fs.unlinkSync(tempDocxPath);
      }
    }

    if (!fs.existsSync(pdfPath)) {
      throw new BadRequestException(
        `Convert xong nhưng không thấy file PDF: ${pdfPath}`,
      );
    }

    const fileSizeBytes = fs.statSync(pdfPath).size;
    const checksum = this.sha256(pdfPath);
    const relativePath = this.toProjectRelativePath(pdfPath);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.generated_document_files.updateMany({
        where: {
          generated_document_id: generatedDocument.id,
          file_format: 'PDF',
        },
        data: {
          is_final: false,
        },
      });

      const storedFile = await tx.stored_files.create({
        data: {
          file_category: 'GENERATED_PDF',
          original_file_name: pdfFileName,
          stored_file_name: pdfFileName,
          file_ext: 'pdf',
          mime_type: 'application/pdf',
          file_size_bytes: BigInt(fileSizeBytes),
          relative_path: relativePath,
          absolute_path: pdfPath,
          checksum,
          related_entity_type: 'generated_documents',
          related_entity_id: generatedDocument.id,
          created_by_name:
            dto.convertedByName || generatedDocument.generated_by_name || null,
        },
      });

      const generatedFile = await tx.generated_document_files.create({
        data: {
          generated_document_id: generatedDocument.id,
          stored_file_id: storedFile.id,
          file_format: 'PDF',
          file_name: pdfFileName,
          file_path: relativePath,
          file_size_bytes: BigInt(fileSizeBytes),
          checksum,
          is_final: true,
        },
      });

      await tx.generated_documents.update({
        where: {
          id: generatedDocument.id,
        },
        data: {
          validation_result: {
            status: 'RENDERED_PDF_READY',
            convertedAt: new Date().toISOString(),
            convertedByName: dto.convertedByName ?? null,
            sourceDocxFileId: latestDocx ? toPublicId(latestDocx.id) : null,
            outputFilePath: relativePath,
            checksum,
            preExportCustomization: preExportCustomizationMeta ?? {
              applied: false,
              warnings: customizationWarnings,
            },
          } as any,
        },
      });

      await tx.case_events.create({
        data: {
          case_id: generatedDocument.case_id,
          event_type: 'DOCUMENT_PDF_CONVERTED',
          event_title: 'Chuyển biểu mẫu sang PDF',
          event_description: `Đã chuyển biểu mẫu "${generatedDocument.document_title}" sang PDF.`,
          stage_code: null,
          status_before: generatedDocument.review_status,
          status_after: generatedDocument.review_status,
          created_by_name: dto.convertedByName || null,
        },
      });

      return {
        storedFile,
        generatedFile,
      };
    });

    return {
      skipped: false,
      documentId: toPublicId(generatedDocument.id),
      warnings: customizationWarnings,
      sourceDocxFile: latestDocx
        ? {
            id: toPublicId(latestDocx.id),
            fileName: latestDocx.file_name,
            filePath: latestDocx.file_path,
          }
        : null,
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
  }

  private async convertDocxToPdf(
    docxPath: string,
    pdfPath: string,
    documentId: string,
  ): Promise<void> {
    const projectRoot = this.getProjectRoot();
    const scriptsDir = path.join(projectRoot, 'apps', 'api', 'scripts');

    const wordComHelperPath = path.join(scriptsDir, 'pdf-convert-word-com.ps1');

    const fallbackHelperPath = path.join(
      scriptsDir,
      'pdf-convert-fallback.ps1',
    );

    if (
      !fs.existsSync(wordComHelperPath) &&
      !fs.existsSync(fallbackHelperPath)
    ) {
      throw new BadRequestException(
        `Không tìm thấy helper convert PDF. Word COM: ${wordComHelperPath}; fallback: ${fallbackHelperPath}`,
      );
    }

    fs.mkdirSync(path.dirname(pdfPath), {
      recursive: true,
    });

    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    let result: { stdout: string; stderr: string } | null = null;

    const wordComArgs = [
      '-NoProfile',
      '-STA',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      wordComHelperPath,
      '-SourceDocx',
      docxPath,
      '-TargetPdf',
      pdfPath,
    ];

    const fallbackArgs = [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      fallbackHelperPath,
      '-SourceDocx',
      docxPath,
      '-TargetPdf',
      pdfPath,
    ];

    if (process.platform === 'win32' && fs.existsSync(wordComHelperPath)) {
      try {
        result = await this.runCommand('powershell.exe', wordComArgs);
      } catch (wordComError: any) {
        const wordComMessage = String(
          wordComError?.message ?? wordComError ?? '',
        );

        if (!fs.existsSync(fallbackHelperPath)) {
          throw new BadRequestException(
            `Word COM convert PDF lỗi và không có LibreOffice fallback. documentId=${documentId}; error=${wordComMessage}`,
          );
        }

        const fallbackResult = await this.runCommand(
          'powershell.exe',
          fallbackArgs,
        );

        result = {
          stdout: [
            '[WORD_COM_FAILED]',
            wordComMessage,
            '[FALLBACK_STDOUT]',
            fallbackResult.stdout,
          ].join('\n'),
          stderr: fallbackResult.stderr,
        };
      }
    } else {
      result = await this.runCommand('powershell.exe', fallbackArgs);
    }

    if (!fs.existsSync(pdfPath)) {
      throw new BadRequestException(
        `Convert PDF xong nhưng không thấy file PDF: ${pdfPath}; stdout=${result?.stdout ?? ''}; stderr=${result?.stderr ?? ''}`,
      );
    }

    const fileSizeBytes = fs.statSync(pdfPath).size;

    if (fileSizeBytes <= 0) {
      throw new BadRequestException(
        `Convert PDF tạo file rỗng: ${pdfPath}; stdout=${result?.stdout ?? ''}; stderr=${result?.stderr ?? ''}`,
      );
    }
  }
  private runCommand(
    command: string,
    args: string[],
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(command, args, {
        windowsHide: true,
      });

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8');
      });

      child.on('error', (error) => {
        reject(
          new BadRequestException(
            `Không chạy được lệnh convert PDF: ${error.message}`,
          ),
        );
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            stdout,
            stderr,
          });
          return;
        }

        reject(
          new BadRequestException(
            `Lệnh convert PDF lỗi. exitCode=${code}; stdout=${stdout}; stderr=${stderr}`,
          ),
        );
      });
    });
  }

  private getLibreOfficePath(): string {
    const fromEnv = this.config.libreOfficePath;

    if (fromEnv && fs.existsSync(fromEnv)) {
      return fromEnv;
    }

    const candidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];

    const found = candidates.find((candidate) => fs.existsSync(candidate));

    if (found) {
      return found;
    }

    throw new BadRequestException(
      'Không tìm thấy LibreOffice soffice.exe. Hãy cài LibreOffice hoặc cấu hình LIBREOFFICE_PATH trong .env.',
    );
  }

  private getProjectRoot(): string {
    return this.paths.repoRoot;
  }

  private resolveProjectPath(storedPath: string): string {
    if (path.isAbsolute(storedPath)) {
      return path.normalize(storedPath);
    }

    return path.resolve(this.getProjectRoot(), storedPath);
  }

  private toProjectRelativePath(fullPath: string): string {
    return path.relative(this.getProjectRoot(), fullPath).replace(/\\/g, '/');
  }

  private sha256(filePath: string): string {
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  }
}
