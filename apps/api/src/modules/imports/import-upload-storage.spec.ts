import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import { createImportUploadStorage } from './import-upload-storage';

type TestDiskStorage = {
  getDestination: (
    request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void,
  ) => void;
  getFilename: (
    request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => void;
};

describe('createImportUploadStorage', () => {
  it('stores uploads in the configured workspace import temp root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qlv-import-upload-'));
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    const paths = new WorkspacePathsService(
      new AppConfigService({
        REPO_ROOT: root,
        STORAGE_ROOT: './custom-storage',
      }),
    );
    const storage = createImportUploadStorage(
      paths,
    ) as unknown as TestDiskStorage;

    try {
      const destination = await new Promise<string>((resolve, reject) => {
        storage.getDestination(
          {},
          { originalname: 'evidence.docx' } as Express.Multer.File,
          (error, value) => (error ? reject(error) : resolve(value)),
        );
      });

      expect(destination).toBe(paths.importsTempRoot);
      expect(existsSync(destination)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('preserves a safe lower-case extension in the generated filename', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qlv-import-upload-'));
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    const paths = new WorkspacePathsService(
      new AppConfigService({ REPO_ROOT: root }),
    );
    const storage = createImportUploadStorage(
      paths,
    ) as unknown as TestDiskStorage;

    try {
      const filename = await new Promise<string>((resolve, reject) => {
        storage.getFilename(
          {},
          { originalname: 'Evidence.DOCX' } as Express.Multer.File,
          (error, value) => (error ? reject(error) : resolve(value)),
        );
      });

      expect(filename).toMatch(/^\d+-[0-9a-f]{8}\.docx$/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
