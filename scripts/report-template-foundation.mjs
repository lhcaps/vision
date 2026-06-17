import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  buildTemplateFoundationFindings,
  buildTemplateFoundationRows,
  buildTemplateFoundationSnapshot,
} from './template-foundation-utils.mjs';

const root = process.cwd();
const snapshot = buildTemplateFoundationSnapshot(root);
const rows = buildTemplateFoundationRows(snapshot);
const findings = buildTemplateFoundationFindings(snapshot);
const reportPath = join(root, 'docs', 'templates', 'TEMPLATE_FOUNDATION_AUDIT.md');

const readyRows = rows.filter((row) => rowIsReady(row));
const stageCounts = new Map();

for (const row of rows) {
  const stage = row.stageNo || 'unknown';
  const current = stageCounts.get(stage) ?? { total: 0, ready: 0 };
  current.total += 1;
  if (rowIsReady(row)) current.ready += 1;
  stageCounts.set(stage, current);
}

const lines = [
  '# Template Foundation Audit',
  '',
  `Generated from local repository state.`,
  '',
  '## Summary',
  '',
  `- Source folder: \`docs/Biểu mẫu/Biểu mẫu\``,
  `- Source forms: ${rows.length}`,
  `- Foundation-ready forms: ${readyRows.length}/${rows.length}`,
  `- Findings: ${findings.length}`,
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
    : ['- No missing foundation items detected for the 60 source forms.']),
  '',
  '## Form Matrix',
  '',
  [
    '| Code | Stage | Source | Catalog | Impl Code | FE Component | Workspace Panel | Normalized DOCX | Placeholders | DOCX XML |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |',
    ...rows.map((row) =>
      `| ${[
        row.code,
        row.stageNo || '',
        ok(row.sourcePath),
        bool(row.inCatalog && row.isImplemented),
        bool(row.inImplementedCodes),
        bool(row.hasComponent),
        bool(row.hasWorkspacePanel),
        bool(row.hasNormalizedDocx && row.docxStatus === 'ok'),
        String(row.placeholderCount),
        row.xmlMojibakeCount === 0 ? 'clean' : `${row.xmlMojibakeCount} mojibake marker(s)`,
      ].join(' | ')} |`,
    ),
  ].join('\n'),
  '',
  '## Expansion Note',
  '',
  'This report remains scoped to the original 60 commonly used forms in `docs/Biểu mẫu/Biểu mẫu`. Full TT 03/2026 corpus coverage is audited in `docs/templates/TEMPLATE_CORPUS_AUDIT.md`.',
  '',
];

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');

if (findings.length) {
  console.error(`Template foundation report written with ${findings.length} finding(s): ${reportPath}`);
  process.exit(1);
}

console.log(`Template foundation report passed: ${readyRows.length}/${rows.length} forms ready.`);
console.log(`Report written: ${reportPath}`);

function rowIsReady(row) {
  return (
    row.inCatalog &&
    row.inImplementedCodes &&
    row.isImplemented &&
    row.hasComponent &&
    row.hasWorkspacePanel &&
    row.hasNormalizedDocx &&
    row.docxStatus === 'ok' &&
    row.xmlMojibakeCount === 0
  );
}

function bool(value) {
  return value ? 'yes' : 'NO';
}

function ok(value) {
  return value ? 'yes' : 'NO';
}
