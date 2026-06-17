import {
  buildSeedTemplates,
  discoverOriginalTemplateFilesByCode,
  getSeedAdminConfig,
  type TemplateCatalogEntry,
} from './seed-config';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('seed config', () => {
  it('uses the required local admin defaults when env is absent', () => {
    expect(getSeedAdminConfig({})).toEqual({
      fullName: 'Admin',
      username: 'admin',
      password: 'admin123',
      positionTitle: 'Quan tri he thong',
    });
  });

  it('builds seed templates from implemented form codes and real catalog metadata', () => {
    const catalog: TemplateCatalogEntry[] = [
      {
        code: 'BM-001',
        number: 1,
        title: 'Bien ban tiep nhan nguon tin',
        stageNo: '01',
        fileName: '01-Bien-ban.doc',
        sourcePath: 'source/BM-001.doc',
      },
      {
        code: 'BM-090',
        number: 90,
        title: 'Quyet dinh phe chuan',
        stageNo: '04',
        fileName: '90-Quyet-dinh.doc',
        sourcePath: 'source/BM-090.doc',
      },
    ];

    const templates = buildSeedTemplates({
      implementedCodes: ['BM-090', 'BM-001'],
      catalog,
      normalizedDocxByCode: new Map([
        ['BM-001', 'storage/templates/normalized-docx/BM-001/BM-001_normalized.docx'],
      ]),
      originalPathByCode: new Map([
        ['BM-001', 'docs/Bieu mau/Bieu mau/01-Bien-ban.doc'],
      ]),
    });

    expect(templates).toEqual([
      expect.objectContaining({
        template_code: 'BM-001',
        template_no: '001',
        template_name: 'Bien ban tiep nhan nguon tin',
        group_code: 'G01',
        stage_code: 'TIEP_NHAN',
        version: expect.objectContaining({
          original_file_path: 'docs/Bieu mau/Bieu mau/01-Bien-ban.doc',
          normalized_docx_path:
            'storage/templates/normalized-docx/BM-001/BM-001_normalized.docx',
        }),
      }),
      expect.objectContaining({
        template_code: 'BM-090',
        template_no: '090',
        template_name: 'Quyet dinh phe chuan',
        group_code: 'G02',
        stage_code: 'DIEU_TRA',
        version: null,
      }),
    ]);
  });

  it('discovers all original source form files by BM code', () => {
    const repoRoot = mkdirTempRepo();
    const sourceDir = join(repoRoot, 'docs', 'Biểu mẫu', 'Biểu mẫu');

    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(join(sourceDir, '01-Bien-ban.doc'), 'source-001');
    writeFileSync(join(sourceDir, '103-De-nghi-gia-han.docx'), 'source-103');
    writeFileSync(join(sourceDir, 'readme.txt'), 'ignore');

    try {
      expect(discoverOriginalTemplateFilesByCode(sourceDir, repoRoot)).toEqual(
        new Map([
          ['BM-001', 'docs/Biểu mẫu/Biểu mẫu/01-Bien-ban.doc'],
          ['BM-103', 'docs/Biểu mẫu/Biểu mẫu/103-De-nghi-gia-han.docx'],
        ]),
      );
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

function mkdirTempRepo() {
  return join(
    tmpdir(),
    `quanlyvks-seed-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
}
