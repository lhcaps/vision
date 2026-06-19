import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const scanRoots = ['apps/api/src', 'apps/web/src'];
const extensions = new Set(['.ts', '.tsx', '.css']);

const forbiddenSubstrings = [
  'demo-data',
  '/demo/',
  'DEFAULT_CASE_ID',
  'vks@example',
  'Hồ sơ demo',
  'Nguyễn Văn A',
  'Đoàn Văn Dũng',
  'Nguyễn Văn Bảo',
  'Trần Thanh Nam',
  'Nguyễn Thị Thanh Huyền',
  'Thanh Bình',
  '0988027788',
  'VKS-2026-0001',
  'G813/QĐ-VPCQCSĐT',
];

const actorFieldPattern =
  /\b(createdByName|updatedByName|reviewerName|renderedByName|convertedByName):\s*"(?!")([^"]+)"/g;

const findings = [];

for (const dir of scanRoots) {
  for (const file of walk(join(root, dir))) {
    if (!extensions.has(file.slice(file.lastIndexOf('.')))) continue;

    const rel = relative(root, file).split('\\').join('/');
    if (isAuditExcluded(rel)) continue;

    const text = readFileSync(file, 'utf8');

    for (const needle of forbiddenSubstrings) {
      if (text.includes(needle)) {
        findings.push(`${rel}: contains forbidden runtime marker "${needle}"`);
      }
    }

    for (const match of text.matchAll(actorFieldPattern)) {
      findings.push(`${rel}: hardcoded actor field ${match[1]}="${match[2]}"`);
    }
  }
}

if (findings.length) {
  console.error('Runtime hardcode audit failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Runtime hardcode audit passed.');

function isAuditExcluded(relativePath) {
  return (
    /\.(spec|test)\.tsx?$/u.test(relativePath) ||
    relativePath ===
      'apps/web/src/features/forms-contracts/sample-data.ts'
  );
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) {
      yield* walk(file);
    } else if (stat.isFile()) {
      yield file;
    }
  }
}
