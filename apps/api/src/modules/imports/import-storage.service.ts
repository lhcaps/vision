import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promises as fsp } from 'node:fs';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import type { ImportBatchMetadata } from './import.types';

function toAsciiSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
    .toLowerCase();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

@Injectable()
export class ImportStorageService {
  constructor(private readonly paths: WorkspacePathsService) {}

  getProjectRoot(): string {
    return this.paths.repoRoot;
  }

  getImportRoot(): string {
    return path.join(this.getProjectRoot(), 'storage', 'imports');
  }

  getTempRoot(): string {
    return path.join(this.getImportRoot(), '_tmp');
  }

  ensureDirectory(dirPath: string): void {
    fs.mkdirSync(dirPath, {
      recursive: true,
    });
  }

  createBatchCode(date = new Date()): string {
    const stamp = [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate()),
      pad2(date.getHours()),
      pad2(date.getMinutes()),
      pad2(date.getSeconds()),
    ].join('');

    return `IMP-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  createBatchDirectory(batchCode: string, date = new Date()) {
    const relativePath = path
      .join(
        'storage',
        'imports',
        String(date.getFullYear()),
        pad2(date.getMonth() + 1),
        pad2(date.getDate()),
        batchCode,
      )
      .replace(/\\/g, '/');

    const fullPath = path.join(this.getProjectRoot(), relativePath);

    this.ensureDirectory(fullPath);

    return {
      relativePath,
      fullPath,
    };
  }

  makeSafeFileName(originalName: string, index: number): string {
    const extension = path.extname(originalName || '').toLowerCase();
    const baseName = path.basename(originalName || 'tep-tin', extension);
    const safeBase = toAsciiSlug(baseName) || `tep-tin-${index + 1}`;
    const suffix = randomBytes(2).toString('hex').toLowerCase();

    return `${String(index + 1).padStart(2, '0')}-${safeBase}-${suffix}${extension}`;
  }

  toProjectRelativePath(fullPath: string): string {
    return path.relative(this.getProjectRoot(), fullPath).replace(/\\/g, '/');
  }

  resolveProjectPath(storedPath: string | null | undefined): string | null {
    if (!storedPath) {
      return null;
    }

    if (path.isAbsolute(storedPath)) {
      return storedPath;
    }

    return path.resolve(this.getProjectRoot(), storedPath);
  }

  async moveTempFile(tempPath: string, destinationPath: string): Promise<void> {
    this.ensureDirectory(path.dirname(destinationPath));
    await fsp.rename(tempPath, destinationPath);
  }

  async deleteFileIfExists(filePath: string | null | undefined): Promise<void> {
    if (!filePath) {
      return;
    }

    try {
      await fsp.unlink(filePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  sha256(filePath: string): string {
    return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  }

  async writeBatchMetadata(
    batchDirectoryRelativePath: string,
    metadata: ImportBatchMetadata,
  ): Promise<string> {
    const metadataPath = path.join(
      this.resolveProjectPath(batchDirectoryRelativePath) as string,
      'metadata.json',
    );

    await fsp.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8',
    );

    return this.toProjectRelativePath(metadataPath);
  }

  async readBatchMetadata(
    batchDirectoryRelativePath: string | null | undefined,
  ): Promise<ImportBatchMetadata | null> {
    const batchPath = this.resolveProjectPath(batchDirectoryRelativePath);

    if (!batchPath) {
      return null;
    }

    const metadataPath = path.join(batchPath, 'metadata.json');

    try {
      const raw = await fsp.readFile(metadataPath, 'utf8');
      const parsed = JSON.parse(raw) as ImportBatchMetadata;

      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      return parsed;
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }
}
