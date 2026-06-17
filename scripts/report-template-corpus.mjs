import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  buildTemplateCorpusFindings,
  buildTemplateCorpusRows,
  buildTemplateCorpusSnapshot,
} from './template-foundation-utils.mjs';

const root = process.cwd();
const snapshot = buildTemplateCorpusSnapshot(root);
const rows = buildTemplateCorpusRows(snapshot);
const findings = buildTemplateCorpusFindings(snapshot);
const reportPath = join(root, 'docs', 'templates', 'TEMPLATE_CORPUS_AUDIT.md');

const readyRows = rows.filter((row) => rowIsReady(row));
const specificPanelRows = rows.filter((row) => row.hasSpecificWorkspacePanel);
const genericPanelRows = rows.filter((row) => row.usesGenericWorkspacePanel);
const stageCounts = new Map();
const warnings = buildWarnings(rows);

for (const row of rows) {
  const stage = row.stageNo || 'unknown';
  const current = stageCounts.get(stage) ?? { total: 0, ready: 0 };
  current.total += 1;
  if (rowIsReady(row)) current.ready += 1;
  stageCounts.set(stage, current);
}

const lines = [
  '# Template Corpus Audit',
  '',
  'Generated from local repository state.',
  '',
  '## Summary',
  '',
  '- Source folder: `docs/`',
  `- Source BM codes: ${rows.length}`,
  `- Corpus-ready BM codes: ${readyRows.length}/${rows.length}`,
  `- Specific FE panels: ${specificPanelRows.length}/${rows.length}`,
  `- Generic FE fallback panels: ${genericPanelRows.length}/${rows.length}`,
  `- Findings: ${findings.length}`,
  `- Warnings: ${warnings.length}`,
  '',
  '## Stage Coverage',
  '',
  '| Stage | Ready | Total |',
  '| --- | ---: | ---: |',
  ...[...stageCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([stage, value]) => `| ${stage} | ${value.ready} | ${value.total} |`),
  '',
  '## Findings',
  '',
  ...(findings.length
    ? findings.map((finding) => `- ${finding}`)
    : ['- No blocking corpus items detected.']),
  '',
  '## Warnings',
  '',
  ...(warnings.length
    ? warnings.map((warning) => `- ${warning}`)
    : ['- No non-blocking warnings.']),
  '',
  '## Form Matrix',
  '',
  [
    '| Code | Stage | Source | Variants | Catalog | Impl Code | FE Panel | Workspace | Normalized DOCX | Placeholders | DOCX XML |',
    '| --- | --- | --- | ---: | --- | --- | --- | --- | --- | ---: | --- |',
    ...rows.map((row) =>
      `| ${[
        row.code,
        row.stageNo || '',
        row.sourceExt ? `${row.sourceExt.toUpperCase()} source` : 'NO',
        String(row.sourceVariantCount),
        bool(row.inCatalog && row.catalogEntryCount === 1 && row.isImplemented),
        bool(row.inImplementedCodes),
        row.hasSpecificComponent ? 'specific' : row.hasFePanel ? 'generic' : 'NO',
        row.hasSpecificWorkspacePanel ? 'specific' : row.hasWorkspacePanel ? 'generic' : 'NO',
        bool(row.hasNormalizedDocx && row.docxStatus === 'ok'),
        String(row.placeholderCount),
        row.xmlMojibakeCount === 0 ? 'clean' : `${row.xmlMojibakeCount} mojibake marker(s)`,
      ].join(' | ')} |`,
    ),
  ].join('\n'),
  '',
];

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');

if (findings.length) {
  console.error(`Template corpus report written with ${findings.length} finding(s): ${reportPath}`);
  process.exit(1);
}

console.log(`Template corpus report passed: ${readyRows.length}/${rows.length} BM codes ready.`);
console.log(`Report written: ${reportPath}`);

function rowIsReady(row) {
  return (
    row.inCatalog &&
    row.catalogEntryCount === 1 &&
    row.inImplementedCodes &&
    row.isImplemented &&
    row.hasFePanel &&
    row.hasWorkspacePanel &&
    row.hasNormalizedDocx &&
    row.docxStatus === 'ok' &&
    row.xmlMojibakeCount === 0
  );
}

function buildWarnings(rows) {
  const warnings = [];

  for (const row of rows) {
    if (row.sourceVariantCount > 1) {
      warnings.push(`${row.code}: ${row.sourceVariantCount} source variants; using ${row.sourcePath}`);
    }
  }

  return warnings;
}

function bool(value) {
  return value ? 'yes' : 'NO';
}
