import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export type SeedAdminConfig = {
  fullName: string;
  username: string;
  password: string;
  positionTitle: string;
};

export type TemplateCatalogEntry = {
  code: string;
  number: number;
  title: string;
  stageNo: string;
  fileName: string;
  sourcePath: string;
  isImplemented?: boolean;
};

export type SeedTemplateVersionDefinition = {
  original_file_path: string | null;
  normalized_docx_path: string;
  output_name_pattern: string;
};

export type SeedTemplateDefinition = {
  template_code: string;
  template_no: string;
  template_name: string;
  group_code: string;
  stage_code: string;
  source_file_name: string;
  render_scope: string;
  output_strategy: string;
  default_output_formats: string[];
  description: string;
  version: SeedTemplateVersionDefinition | null;
};

const STAGE_MAP: Record<string, { groupCode: string; stageCode: string }> = {
  '01': { groupCode: 'G01', stageCode: 'TIEP_NHAN' },
  '02': { groupCode: 'G02', stageCode: 'BP_NGAN_CHAN' },
  '03': { groupCode: 'G02', stageCode: 'NGUOI_THAM_GIA' },
  '04': { groupCode: 'G02', stageCode: 'DIEU_TRA' },
  '05': { groupCode: 'G03', stageCode: 'TRUY_TO' },
  '06': { groupCode: 'G04', stageCode: 'VAT_CHUNG' },
  '07': { groupCode: 'G04', stageCode: 'DIEU_TRA_DAC_BIET' },
  '08': { groupCode: 'G04', stageCode: 'THU_TUC_DAC_BIET' },
  '09': { groupCode: 'G04', stageCode: 'NGUOI_CHUA_THANH_NIEN' },
};

export function getSeedAdminConfig(
  env: Record<string, string | undefined> = process.env,
): SeedAdminConfig {
  return {
    fullName: env.SEED_ADMIN_FULL_NAME?.trim() || 'Admin',
    username: (env.SEED_ADMIN_USERNAME?.trim() || 'admin').toLowerCase(),
    password: env.SEED_ADMIN_PASSWORD?.trim() || 'admin123',
    positionTitle: env.SEED_ADMIN_POSITION?.trim() || 'Quan tri he thong',
  };
}

export function discoverImplementedTemplateCodes(componentsDir: string) {
  if (!existsSync(componentsDir)) return [];

  return readdirSync(componentsDir)
    .map((name) => name.match(/^bm-(\d{3})-form-inputs\.tsx$/)?.[1])
    .filter((code): code is string => Boolean(code))
    .map((code) => `BM-${code}`)
    .sort();
}

export function discoverImplementedCatalogCodes(
  catalog: TemplateCatalogEntry[],
) {
  return [
    ...new Set(
      catalog
        .filter((item) => item.code && item.isImplemented)
        .map((item) => item.code)
        .sort(),
    ),
  ];
}

export function discoverNormalizedDocxByCode(
  normalizedRoot: string,
  repoRoot: string,
) {
  const result = new Map<string, string>();
  if (!existsSync(normalizedRoot)) return result;

  for (const entry of readdirSync(normalizedRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^BM-\d{3}$/.test(entry.name)) continue;

    const filePath = join(
      normalizedRoot,
      entry.name,
      `${entry.name}_normalized.docx`,
    );
    if (existsSync(filePath)) {
      result.set(entry.name, toPortableRelative(repoRoot, filePath));
    }
  }

  return result;
}

export function discoverOriginalTemplateFilesByCode(
  sourceDir: string,
  repoRoot: string,
) {
  const result = new Map<string, string>();
  if (!existsSync(sourceDir)) return result;

  for (const fileName of readdirSync(sourceDir).sort()) {
    if (!/\.(doc|docx)$/iu.test(fileName)) continue;

    const number = fileName.match(/^(\d{1,3})/u)?.[1];
    if (!number) continue;

    const code = `BM-${number.padStart(3, '0')}`;
    result.set(code, toPortableRelative(repoRoot, join(sourceDir, fileName)));
  }

  return result;
}

export function discoverCorpusOriginalTemplateFilesByCode(
  sourceRoot: string,
  repoRoot: string,
) {
  const result = new Map<string, { path: string; score: number }>();
  if (!existsSync(sourceRoot)) return new Map<string, string>();

  for (const filePath of walkFiles(sourceRoot)) {
    const fileName = filePath.split(/[\\/]/).pop() ?? '';
    if (fileName.startsWith('~$') || !/\.(doc|docx)$/iu.test(fileName))
      continue;

    const number = fileName.match(/^(\d{1,3})(?=[-.\s]|$)/u)?.[1];
    if (!number) continue;

    const code = `BM-${number.padStart(3, '0')}`;
    const portablePath = toPortableRelative(repoRoot, filePath);
    const score = getCorpusSourceScore(portablePath, fileName);
    const current = result.get(code);

    if (!current || score > current.score || portablePath < current.path) {
      result.set(code, { path: portablePath, score });
    }
  }

  return new Map(
    [...result.entries()].map(([code, value]) => [code, value.path]),
  );
}

export function buildSeedTemplates(input: {
  implementedCodes: string[];
  catalog: TemplateCatalogEntry[];
  normalizedDocxByCode: Map<string, string>;
  originalPathByCode?: Map<string, string>;
}): SeedTemplateDefinition[] {
  const catalogByCode = new Map(input.catalog.map((item) => [item.code, item]));
  const codes = [...new Set(input.implementedCodes)].sort();

  return codes.map((code) => {
    const catalog = catalogByCode.get(code);
    const stage = STAGE_MAP[catalog?.stageNo ?? ''] ?? {
      groupCode: 'G04',
      stageCode: 'KHAC',
    };
    const number = catalog?.number ?? Number(code.slice(3));
    const templateNo = Number.isFinite(number)
      ? String(number).padStart(3, '0')
      : code.slice(3);
    const normalizedPath = input.normalizedDocxByCode.get(code) ?? null;

    return {
      template_code: code,
      template_no: templateNo,
      template_name: catalog?.title?.trim() || code,
      group_code: stage.groupCode,
      stage_code: stage.stageCode,
      source_file_name: catalog?.fileName?.trim() || `${code}.docx`,
      render_scope: 'CASE_LEVEL',
      output_strategy: 'ONE_FILE_PER_CASE',
      default_output_formats: ['docx', 'pdf'],
      description: catalog?.sourcePath?.trim() || `Template ${code}`,
      version: normalizedPath
        ? {
            original_file_path: input.originalPathByCode?.get(code) ?? null,
            normalized_docx_path: normalizedPath,
            output_name_pattern: `${code}_{{case.caseCode}}_{{yyyyMMdd}}`,
          }
        : null,
    };
  });
}

function toPortableRelative(root: string, target: string) {
  return relative(root, target).split(sep).join('/');
}

function* walkFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const filePath = join(dir, entry);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      yield* walkFiles(filePath);
    } else if (stat.isFile()) {
      yield filePath;
    }
  }
}

function getCorpusSourceScore(portablePath: string, fileName: string) {
  let score = 0;
  if (portablePath.includes('/Full/')) score += 100;
  if (portablePath.includes('0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC')) {
    score += 50;
  }
  if (portablePath.includes('/Biểu mẫu/Biểu mẫu/')) score += 20;
  if (fileName.toLowerCase().endsWith('.docx')) score += 5;
  return score;
}
