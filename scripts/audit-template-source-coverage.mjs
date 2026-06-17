import {
  buildTemplateCorpusFindings,
  buildTemplateCorpusSnapshot,
} from './template-foundation-utils.mjs';

const root = process.cwd();
const snapshot = buildTemplateCorpusSnapshot(root);
const findings = buildTemplateCorpusFindings(snapshot);

if (findings.length) {
  console.error('Template source coverage audit failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(
  `Template source coverage audit passed: ${snapshot.sourceForms.size} TT 03/2026 template codes have catalog flags, FE panels and clean normalized DOCX.`,
);
