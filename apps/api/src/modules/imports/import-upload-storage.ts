import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { diskStorage, type StorageEngine } from 'multer';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';

/**
 * Create the Multer storage engine from the shared workspace path boundary.
 */
export function createImportUploadStorage(
  paths: WorkspacePathsService,
): StorageEngine {
  return diskStorage({
    destination: (_request, _file, callback) => {
      mkdirSync(paths.importsTempRoot, { recursive: true });
      callback(null, paths.importsTempRoot);
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname || '').toLowerCase();
      callback(
        null,
        `${Date.now()}-${randomBytes(4).toString('hex')}${extension}`,
      );
    },
  });
}
