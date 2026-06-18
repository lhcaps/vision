#!/usr/bin/env node
/**
 * Wire the 83 new stub components into generated-document-workspace.tsx
 * - Add imports after the existing import block
 * - Add entries into BM_PANEL_BY_CODE map
 */
const fs = require('fs');
const path = require('path');

const MISSING_CODES = [
  'BM-004','BM-013','BM-019','BM-020','BM-021','BM-022','BM-024','BM-025','BM-026','BM-027','BM-028','BM-029',
  'BM-032','BM-034','BM-035','BM-036','BM-041','BM-048','BM-049','BM-050','BM-051','BM-052','BM-060','BM-061','BM-062','BM-063','BM-064','BM-065','BM-066','BM-067','BM-068','BM-069',
  'BM-073','BM-075','BM-077','BM-079','BM-080','BM-082',
  'BM-162','BM-163','BM-164','BM-165','BM-167',
  'BM-174','BM-175','BM-176','BM-177','BM-178',
  'BM-179','BM-180','BM-181','BM-182','BM-183','BM-184',
  'BM-185','BM-186','BM-187','BM-188','BM-189','BM-190','BM-191','BM-192','BM-193','BM-194','BM-195','BM-196','BM-197','BM-198','BM-199','BM-200','BM-201','BM-202','BM-203','BM-204','BM-205','BM-206','BM-207','BM-208','BM-209','BM-210','BM-211','BM-212','BM-213',
];

const FILE = path.join(__dirname, '..', 'apps', 'web', 'src', 'components', 'documents', 'generated-document-workspace.tsx');
let src = fs.readFileSync(FILE, 'utf8');

// 1. Generate import statements (alphabetical after existing ones)
const newImports = MISSING_CODES
  .map((c) => {
    const num = c.split('-')[1];
    return `import { Bm${num}FormInputsPanel } from "@/components/documents/bm-${num}-form-inputs";`;
  })
  .sort();

// Find where to insert: after the last existing import
// We insert before the `type GeneratedDocumentWorkspaceProps` line
const insertBefore = 'type GeneratedDocumentWorkspaceProps';
const idx = src.indexOf(insertBefore);
if (idx < 0) {
  throw new Error('Could not find insertion anchor');
}
const importBlock = newImports.join('\n') + '\n';
src = src.slice(0, idx) + importBlock + src.slice(idx);

// 2. Add entries to BM_PANEL_BY_CODE map (before the closing brace of the map)
const mapEndMarker = '};';
const mapIdx = src.indexOf('BM_PANEL_BY_CODE: Record<string, BmPanelComponent> = {');
if (mapIdx < 0) throw new Error('Could not find BM_PANEL_BY_CODE map');
// Find the matching closing brace of that map declaration
let depth = 0;
let mapStart = src.indexOf('{', mapIdx);
let mapEnd = -1;
for (let i = mapStart; i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') {
    depth--;
    if (depth === 0) { mapEnd = i; break; }
  }
}
if (mapEnd < 0) throw new Error('Could not find end of map');

const newEntries = MISSING_CODES
  .map((c) => {
    const num = c.split('-')[1];
    return `  "${c}": Bm${num}FormInputsPanel,`;
  })
  .join('\n');

// Insert before the closing brace
src = src.slice(0, mapEnd) + newEntries + '\n' + src.slice(mapEnd);

fs.writeFileSync(FILE, src, 'utf8');
console.log(`Wired ${MISSING_CODES.length} new panel components into the dispatcher.`);
