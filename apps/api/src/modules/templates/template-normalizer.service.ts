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
import { PrismaService } from '../../prisma/prisma.service';

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

function normalizeSlash(value: string): string {
  return value.replace(/\\/g, '/');
}

@Injectable()
export class TemplateNormalizerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paths: WorkspacePathsService,
    private readonly config: AppConfigService,
  ) {}

  async normalizeMvp(force = false) {
    const mvpCodes = ['BM-001', 'BM-053', 'BM-090', 'BM-097', 'BM-156'];

    const templates = await this.prisma.templates.findMany({
      where: {
        template_code: {
          in: mvpCodes,
        },
      },
    });

    const templateIds = templates.map((item) => item.id);

    const versions = await this.prisma.template_versions.findMany({
      where: {
        template_id: {
          in: templateIds,
        },
        is_active: true,
        is_default: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    const results = [];

    for (const version of versions) {
      try {
        results.push(await this.normalizeVersion(String(version.id), force));
      } catch (error) {
        results.push({
          versionId: toPublicId(version.id),
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      total: results.length,
      success: results.filter((item: any) => item.ok).length,
      failed: results.filter((item: any) => !item.ok).length,
      results,
    };
  }

  async normalizeVersion(versionIdRaw: string, force = false) {
    const versionId = parseBigIntId(versionIdRaw, 'versionId');

    const version = await this.prisma.template_versions.findUnique({
      where: {
        id: versionId,
      },
    });

    if (!version) {
      throw new NotFoundException('Không tìm thấy template version.');
    }

    const template = await this.prisma.templates.findUnique({
      where: {
        id: version.template_id,
      },
    });

    if (!template) {
      throw new NotFoundException('Không tìm thấy biểu mẫu tương ứng.');
    }

    if (!version.original_file_path) {
      throw new BadRequestException(
        'Template version chưa có original_file_path.',
      );
    }

    if (!version.normalized_docx_path) {
      throw new BadRequestException(
        'Template version chưa có normalized_docx_path.',
      );
    }

    const originalPath = this.resolveProjectPath(version.original_file_path);
    const normalizedPath = this.resolveProjectPath(
      version.normalized_docx_path,
    );

    if (!fs.existsSync(originalPath)) {
      throw new BadRequestException(`Không tìm thấy file gốc: ${originalPath}`);
    }

    fs.mkdirSync(path.dirname(normalizedPath), {
      recursive: true,
    });

    const alreadyExists = fs.existsSync(normalizedPath);

    if (alreadyExists && !force) {
      const checksum = this.sha256(normalizedPath);

      await this.prisma.template_versions.update({
        where: {
          id: version.id,
        },
        data: {
          checksum,
          placeholder_summary: {
            status: 'NORMALIZED_DOCX_READY',
            normalizedAt: new Date().toISOString(),
            skipped: true,
            reason: 'File .docx đã tồn tại, không convert lại.',
          } as any,
        },
      });

      return {
        ok: true,
        skipped: true,
        versionId: toPublicId(version.id),
        templateCode: template.template_code,
        templateName: template.template_name,
        originalFilePath: normalizeSlash(version.original_file_path),
        normalizedDocxPath: normalizeSlash(version.normalized_docx_path),
        checksum,
      };
    }

    const ext = path.extname(originalPath).toLowerCase();

    if (ext === '.docx') {
      fs.copyFileSync(originalPath, normalizedPath);
    } else if (ext === '.doc') {
      await this.convertDocToDocx(
        originalPath,
        normalizedPath,
        String(version.id),
      );
    } else {
      throw new BadRequestException(`Không hỗ trợ định dạng template: ${ext}`);
    }

    if (!fs.existsSync(normalizedPath)) {
      throw new BadRequestException(
        `Convert xong nhưng không thấy file .docx: ${normalizedPath}`,
      );
    }

    const checksum = this.sha256(normalizedPath);

    await this.prisma.template_versions.update({
      where: {
        id: version.id,
      },
      data: {
        checksum,
        placeholder_summary: {
          status: 'NORMALIZED_DOCX_READY',
          normalizedAt: new Date().toISOString(),
          originalExt: ext,
          originalFilePath: normalizeSlash(version.original_file_path),
          normalizedDocxPath: normalizeSlash(version.normalized_docx_path),
          checksum,
        } as any,
      },
    });

    return {
      ok: true,
      skipped: false,
      versionId: toPublicId(version.id),
      templateCode: template.template_code,
      templateName: template.template_name,
      originalFilePath: normalizeSlash(version.original_file_path),
      normalizedDocxPath: normalizeSlash(version.normalized_docx_path),
      checksum,
    };
  }

  private async convertDocToDocx(
    originalPath: string,
    normalizedPath: string,
    versionId: string,
  ): Promise<void> {
    const sofficePath = this.getLibreOfficePath();

    const projectRoot = this.getProjectRoot();
    const tempDir = path.join(
      projectRoot,
      'storage',
      'temp',
      'template-normalizer',
      `version-${versionId}-${Date.now()}`,
    );

    fs.mkdirSync(tempDir, {
      recursive: true,
    });

    const args = [
      '--headless',
      '--convert-to',
      'docx',
      '--outdir',
      tempDir,
      originalPath,
    ];

    const result = await this.runCommand(sofficePath, args);

    const converted = fs
      .readdirSync(tempDir)
      .filter((name) => name.toLowerCase().endsWith('.docx'))
      .map((name) => path.join(tempDir, name))[0];

    if (!converted || !fs.existsSync(converted)) {
      throw new BadRequestException(
        `LibreOffice không tạo được file .docx. stdout=${result.stdout}; stderr=${result.stderr}`,
      );
    }

    fs.copyFileSync(converted, normalizedPath);

    fs.rmSync(tempDir, {
      recursive: true,
      force: true,
    });
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
            `Không chạy được LibreOffice: ${error.message}`,
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
            `LibreOffice convert lỗi. exitCode=${code}; stdout=${stdout}; stderr=${stderr}`,
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

  private resolveProjectPath(storedPath: string): string {
    if (path.isAbsolute(storedPath)) {
      return storedPath;
    }

    return path.resolve(this.getProjectRoot(), storedPath);
  }

  private getProjectRoot(): string {
    return this.paths.repoRoot;
  }

  private sha256(filePath: string): string {
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  }
}
