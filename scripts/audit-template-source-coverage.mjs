import {
  buildTemplateFoundationFindings,
  buildTemplateFoundationSnapshot,
} from './template-foundation-utils.mjs';

const root = process.cwd();
const snapshot = buildTemplateFoundationSnapshot(root);
const findings = buildTemplateFoundationFindings(snapshot);

if (findings.length) {
  console.error('Template source coverage audit failed:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(
  `Template source coverage audit passed: ${snapshot.sourceForms.size} source forms have catalog flags, workspace panels, form components and normalized DOCX.`,
);
