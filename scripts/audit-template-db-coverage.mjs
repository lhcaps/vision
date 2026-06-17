import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const repoRoot = findRepoRoot(process.cwd());
const requireFromApi = createRequire(join(repoRoot, 'apps', 'api', 'package.json'));
const { PrismaClient } = requireFromApi('@prisma/client');

loadEnvFile(resolve(repoRoot, '.env'));
loadEnvFile(resolve(repoRoot, 'apps', 'api', '.env'), true);

const sourceDir = join(repoRoot, 'docs', 'Biểu mẫu', 'Biểu mẫu');
const sourceCodes = discoverSourceCodes(sourceDir);
const findings = [];

if (sourceCodes.length === 0) {
  findings.push('No source form files found for DB coverage audit.');
}

const prisma = new PrismaClient();

try {
  const templates = await prisma.templates.findMany({
    where: {
      template_code: {
        in: sourceCodes,
      },
    },
    include: {
      template_versions: true,
    },
  });

  const byCode = new Map(templates.map((template) => [template.template_code, template]));

  for (const code of sourceCodes) {
    const template = byCode.get(code);
    if (!template) {
      findings.push(`${code}: missing templates row`);
      continue;
    }

    const activeVersion = template.template_versions.find(
      (version) => version.is_active && version.normalized_docx_path,
    );

    if (!activeVersion) {
      findings.push(`${code}: missing active template version with normalized_docx_path`);
      continue;
    }

    if (!activeVersion.original_file_path) {
      findings.push(`${code}: missing original_file_path`);
    }
  }
} finally {
  await prisma.$disconnect();
}

if (findings.length) {
  console.error('Template DB coverage audit failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(
  `Template DB coverage audit passed: ${sourceCodes.length} source forms are seeded with active versions and original paths.`,
);

function discoverSourceCodes(dir) {
  if (!existsSync(dir)) return [];

  return [
    ...new Set(
      readdirSync(dir)
        .filter((fileName) => /\.(doc|docx)$/iu.test(fileName))
        .map((fileName) => fileName.match(/^(\d{1,3})/u)?.[1])
        .filter(Boolean)
        .map((number) => `BM-${number.padStart(3, '0')}`),
    ),
  ].sort();
}

function loadEnvFile(filePath, override = false) {
  if (!existsSync(filePath)) return;

  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex <= 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = stripQuotes(trimmed.slice(equalsIndex + 1).trim());

    if (override || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function findRepoRoot(startDir) {
  let current = resolve(startDir);

  while (true) {
    const packagePath = join(current, 'package.json');
    if (existsSync(packagePath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        if (packageJson.name === 'quanlyvks') {
          return current;
        }
      } catch {
        // Keep walking up.
      }
    }

    const parent = resolve(current, '..');
    if (parent === current) {
      return resolve(startDir);
    }
    current = parent;
  }
}
