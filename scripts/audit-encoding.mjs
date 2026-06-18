import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

const root = process.cwd();

const excludedDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  '.codex-runlogs',
  'agent-tools',
  'coverage',
  'dist',
  'harness',
  'node_modules',
  'out',
]);

const textExtensions = new Set([
  '.cjs',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);

const textBasenames = new Set([
  '.env.docker.example',
  '.env.example',
  '.gitignore',
  'Dockerfile',
]);

const suspiciousSequences = [
  'Ãƒ',
  'Ã‚',
  'Ã¡Âº',
  'Ã†',
  'Ã„â€˜',
];

function isExcludedDirectory(name) {
  return excludedDirectories.has(name);
}

function isExcludedPath(displayPath) {
  return (
    displayPath.startsWith('docs/templates/') ||
    displayPath.startsWith('docs/Biểu mẫu/')
  );
}

function isCandidateFile(filePath) {
  const name = basename(filePath);
  if (textBasenames.has(name)) return true;
  return textExtensions.has(extname(name));
}

function isBinary(buffer) {
  return buffer.includes(0);
}

function scanFile(filePath) {
  if (!isCandidateFile(filePath)) return [];

  const findings = [];
  const buffer = readFileSync(filePath);
  const displayPath = relative(root, filePath).replaceAll('\\', '/');
  if (isExcludedPath(displayPath)) return findings;

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    findings.push(`${displayPath}: UTF-8 BOM`);
  }

  if (isBinary(buffer)) return findings;

  const text = buffer.toString('utf8');
  if (text.includes(String.fromCharCode(0xfffd))) {
    findings.push(`${displayPath}: replacement character U+FFFD`);
  }

  if (displayPath === 'scripts/audit-encoding.mjs') {
    return findings;
  }

  for (const sequence of suspiciousSequences) {
    if (text.includes(sequence)) {
      findings.push(`${displayPath}: suspicious mojibake sequence ${sequence}`);
    }
  }

  return findings;
}

function walk(directory) {
  const findings = [];
  for (const entry of readdirSync(directory)) {
    if (isExcludedDirectory(entry)) continue;

    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findings.push(...walk(fullPath));
      continue;
    }

    if (stat.isFile()) {
      findings.push(...scanFile(fullPath));
    }
  }

  return findings;
}

const findings = walk(root);

if (findings.length > 0) {
  console.error('Encoding audit failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log('Encoding audit passed: no BOM, replacement characters, or configured mojibake sequences found.');
