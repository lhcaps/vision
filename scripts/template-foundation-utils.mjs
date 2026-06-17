import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

export const SOURCE_DIR_PARTS = ['docs', 'Biểu mẫu', 'Biểu mẫu'];
export const DOCS_DIR_PARTS = ['docs'];
export const CATALOG_FILE_PARTS = ['apps', 'web', 'src', 'lib', 'vks-template-catalog.ts'];
export const COMPONENTS_DIR_PARTS = ['apps', 'web', 'src', 'components', 'documents'];
export const WORKSPACE_FILE_PARTS = [
  'apps',
  'web',
  'src',
  'components',
  'documents',
  'generated-document-workspace.tsx',
];
export const NORMALIZED_DIR_PARTS = ['storage', 'templates', 'normalized-docx'];

const MOJIBAKE_MARKERS = [
  [0x00c3, 0x0192],
  [0x00c3, 0x201a],
  [0x00c3, 0x2020],
  [0x00c3, 0x00a1],
  [0x00c3, 0x00a2],
  [0x00c3, 0x00a9],
  [0x00c3, 0x00aa],
  [0x00c3, 0x00b4],
  [0x00c3, 0x00b3],
  [0x00c3, 0x00b9],
  [0x00c3, 0x00ba],
  [0x00c3, 0x00bd],
  [0x00c4, 0x2018],
  [0x00c4, 0x0192],
  [0x00c6, 0x00b0],
  [0x00c6, 0x00a1],
  [0x00e1, 0x00bb],
  [0x00e1, 0x00ba],
  [0x00e2, 0x20ac],
  [0xfffd],
].map((codes) => String.fromCodePoint(...codes));

export function buildTemplateFoundationSnapshot(root) {
  const sourceDir = join(root, ...SOURCE_DIR_PARTS);
  const catalogFile = join(root, ...CATALOG_FILE_PARTS);
  const componentsDir = join(root, ...COMPONENTS_DIR_PARTS);
  const workspaceFile = join(root, ...WORKSPACE_FILE_PARTS);
  const normalizedDir = join(root, ...NORMALIZED_DIR_PARTS);

  return {
    root,
    sourceDir,
    catalogFile,
    componentsDir,
    workspaceFile,
    normalizedDir,
    sourceForms: discoverSourceForms(sourceDir, root),
    catalog: discoverCatalogState(catalogFile),
    componentCodes: discoverComponentCodes(componentsDir),
    workspacePanelCodes: discoverWorkspacePanelCodes(workspaceFile),
    normalized: discoverNormalizedDocx(normalizedDir, root),
  };
}

export function buildTemplateCorpusSnapshot(root) {
  const sourceDir = join(root, ...DOCS_DIR_PARTS);
  const catalogFile = join(root, ...CATALOG_FILE_PARTS);
  const componentsDir = join(root, ...COMPONENTS_DIR_PARTS);
  const workspaceFile = join(root, ...WORKSPACE_FILE_PARTS);
  const normalizedDir = join(root, ...NORMALIZED_DIR_PARTS);

  return {
    root,
    sourceDir,
    catalogFile,
    componentsDir,
    workspaceFile,
    normalizedDir,
    sourceForms: discoverCorpusSourceForms(sourceDir, root),
    catalog: discoverCatalogState(catalogFile),
    componentCodes: discoverComponentCodes(componentsDir),
    workspacePanelCodes: discoverWorkspacePanelCodes(workspaceFile),
    hasGenericWorkspacePanel: discoverGenericWorkspacePanel(workspaceFile),
    normalized: discoverNormalizedDocx(normalizedDir, root),
  };
}

export function buildTemplateFoundationRows(snapshot) {
  return [...snapshot.sourceForms.values()].sort(compareTemplateForms).map((form) => {
    const normalized = snapshot.normalized.get(form.code) ?? null;
    return {
      code: form.code,
      title: snapshot.catalog.entries.get(form.code)?.title ?? form.title,
      stageNo: snapshot.catalog.entries.get(form.code)?.stageNo ?? '',
      sourcePath: form.relativePath,
      inCatalog: snapshot.catalog.entries.has(form.code),
      inImplementedCodes: snapshot.catalog.implementedCodes.has(form.code),
      isImplemented: snapshot.catalog.implementedTrueCodes.has(form.code),
      hasComponent: snapshot.componentCodes.has(form.code),
      hasWorkspacePanel: snapshot.workspacePanelCodes.has(form.code),
      normalizedPath: normalized?.relativePath ?? '',
      hasNormalizedDocx: Boolean(normalized),
      docxStatus: normalized?.status ?? 'missing',
      placeholderCount: normalized?.placeholderCount ?? 0,
      xmlMojibakeCount: normalized?.mojibakeCount ?? 0,
    };
  });
}

export function buildTemplateCorpusRows(snapshot) {
  return [...snapshot.sourceForms.values()].sort(compareTemplateForms).map((form) => {
    const normalized = snapshot.normalized.get(form.code) ?? null;
    const catalogEntry = snapshot.catalog.entries.get(form.code);
    const hasSpecificComponent = snapshot.componentCodes.has(form.code);
    const hasSpecificWorkspacePanel = snapshot.workspacePanelCodes.has(form.code);
    const hasGenericWorkspacePanel = Boolean(snapshot.hasGenericWorkspacePanel);

    return {
      code: form.code,
      title: catalogEntry?.title ?? form.title,
      stageNo: catalogEntry?.stageNo ?? '',
      sourcePath: form.relativePath,
      sourceExt: form.fileExt,
      sourceVariantCount: form.sourceVariantCount,
      duplicateSourcePaths: form.duplicateSourcePaths,
      inCatalog: snapshot.catalog.entries.has(form.code),
      catalogEntryCount: snapshot.catalog.entryCounts.get(form.code) ?? 0,
      inImplementedCodes: snapshot.catalog.implementedCodes.has(form.code),
      isImplemented: snapshot.catalog.implementedTrueCodes.has(form.code),
      hasSpecificComponent,
      hasFePanel: hasSpecificComponent || hasGenericWorkspacePanel,
      hasSpecificWorkspacePanel,
      hasWorkspacePanel: hasSpecificWorkspacePanel || hasGenericWorkspacePanel,
      usesGenericWorkspacePanel: !hasSpecificWorkspacePanel && hasGenericWorkspacePanel,
      normalizedPath: normalized?.relativePath ?? '',
      hasNormalizedDocx: Boolean(normalized),
      docxStatus: normalized?.status ?? 'missing',
      placeholderCount: normalized?.placeholderCount ?? 0,
      xmlMojibakeCount: normalized?.mojibakeCount ?? 0,
    };
  });
}

function compareTemplateForms(a, b) {
  return getTemplateNumber(a.code) - getTemplateNumber(b.code);
}

function getTemplateNumber(code) {
  return Number(code.match(/\d+/u)?.[0] ?? 0);
}

export function buildTemplateFoundationFindings(snapshot) {
  const sourceCodes = new Set(snapshot.sourceForms.keys());
  const rows = buildTemplateFoundationRows(snapshot);
  const findings = [];

  if (sourceCodes.size === 0) {
    findings.push(`No source .doc/.docx files found under ${relative(snapshot.root, snapshot.sourceDir)}`);
  }

  for (const row of rows) {
    if (!row.inCatalog) findings.push(`${row.code}: missing catalog entry`);
    if (!row.inImplementedCodes) findings.push(`${row.code}: missing implementedTemplateCodes entry`);
    if (!row.isImplemented) findings.push(`${row.code}: catalog isImplemented is not true`);
    if (!row.hasComponent) findings.push(`${row.code}: missing frontend form component`);
    if (!row.hasWorkspacePanel) findings.push(`${row.code}: missing BM_PANEL_BY_CODE mapping`);
    if (!row.hasNormalizedDocx) findings.push(`${row.code}: missing normalized DOCX`);
    if (row.docxStatus !== 'ok') findings.push(`${row.code}: normalized DOCX status is ${row.docxStatus}`);
    if (row.xmlMojibakeCount > 0) {
      findings.push(`${row.code}: normalized DOCX XML contains ${row.xmlMojibakeCount} mojibake marker(s)`);
    }
  }

  return findings;
}

export function buildTemplateCorpusFindings(snapshot) {
  const sourceCodes = new Set(snapshot.sourceForms.keys());
  const rows = buildTemplateCorpusRows(snapshot);
  const findings = [];

  if (sourceCodes.size === 0) {
    findings.push(`No source .doc/.docx files found under ${relative(snapshot.root, snapshot.sourceDir)}`);
  }

  for (const row of rows) {
    if (!row.inCatalog) findings.push(`${row.code}: missing catalog entry`);
    if (row.catalogEntryCount !== 1) findings.push(`${row.code}: catalog has ${row.catalogEntryCount} entries`);
    if (!row.inImplementedCodes) findings.push(`${row.code}: missing implementedTemplateCodes entry`);
    if (!row.isImplemented) findings.push(`${row.code}: catalog isImplemented is not true`);
    if (!row.hasFePanel) findings.push(`${row.code}: missing frontend form panel or generic fallback`);
    if (!row.hasWorkspacePanel) findings.push(`${row.code}: missing BM_PANEL_BY_CODE mapping and generic fallback`);
    if (!row.hasNormalizedDocx) findings.push(`${row.code}: missing normalized DOCX`);
    if (row.docxStatus !== 'ok') findings.push(`${row.code}: normalized DOCX status is ${row.docxStatus}`);
    if (row.xmlMojibakeCount > 0) {
      findings.push(`${row.code}: normalized DOCX XML contains ${row.xmlMojibakeCount} mojibake marker(s)`);
    }
  }

  for (const code of snapshot.catalog.implementedCodes) {
    if (!sourceCodes.has(code)) {
      findings.push(`${code}: implementedTemplateCodes entry is not backed by ${relative(snapshot.root, snapshot.sourceDir)}`);
    }
  }

  for (const code of snapshot.catalog.implementedTrueCodes) {
    if (!sourceCodes.has(code)) {
      findings.push(`${code}: catalog isImplemented=true but source file is not in ${relative(snapshot.root, snapshot.sourceDir)}`);
    }
  }

  return findings;
}

export function getMojibakeCount(text) {
  let count = 0;
  for (const marker of MOJIBAKE_MARKERS) {
    count += text.split(marker).length - 1;
  }
  return count;
}

function discoverCorpusSourceForms(dir, root) {
  const candidatesByCode = new Map();
  if (!existsSync(dir)) return candidatesByCode;

  for (const filePath of walkFiles(dir)) {
    const fileName = filePath.split(/[\\/]/u).pop() ?? '';
    if (fileName.startsWith('~$') || !/\.(doc|docx)$/iu.test(fileName)) continue;

    const number = fileName.match(/^(\d{1,3})(?=[-.\s]|$)/u)?.[1];
    if (!number) continue;

    const code = `BM-${number.padStart(3, '0')}`;
    const fileExt = fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'doc';
    const relativePath = toPortableRelative(root, filePath);
    const candidate = {
      code,
      fileName,
      fileExt,
      title: fileName.replace(/\.(doc|docx)$/iu, ''),
      relativePath,
      score: getCorpusSourceScore(relativePath, fileExt),
    };

    const current = candidatesByCode.get(code) ?? [];
    current.push(candidate);
    candidatesByCode.set(code, current);
  }

  const forms = new Map();
  for (const [code, candidates] of candidatesByCode) {
    const sorted = [...candidates].sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.relativePath.localeCompare(right.relativePath);
    });
    const primary = sorted[0];
    forms.set(code, {
      ...primary,
      sourceVariantCount: sorted.length,
      duplicateSourcePaths: sorted.slice(1).map((item) => item.relativePath),
    });
  }

  return forms;
}

function getCorpusSourceScore(relativePath, fileExt) {
  let score = 0;
  if (relativePath.includes('/Full/')) score += 100;
  if (relativePath.includes('0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC')) score += 50;
  if (relativePath.includes('/Biểu mẫu/Biểu mẫu/')) score += 20;
  if (fileExt === 'docx') score += 5;
  return score;
}

function discoverSourceForms(dir, root) {
  const forms = new Map();
  if (!existsSync(dir)) return forms;

  for (const fileName of readdirSync(dir).sort()) {
    if (!/\.(doc|docx)$/iu.test(fileName)) continue;
    const number = fileName.match(/^(\d{1,3})/u)?.[1];
    if (!number) continue;

    const code = `BM-${number.padStart(3, '0')}`;
    const filePath = join(dir, fileName);
    forms.set(code, {
      code,
      fileName,
      title: fileName.replace(/\.(doc|docx)$/iu, ''),
      relativePath: toPortableRelative(root, filePath),
    });
  }

  return forms;
}

function* walkFiles(dir) {
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

function discoverCatalogState(filePath) {
  const state = {
    entries: new Map(),
    entryCounts: new Map(),
    implementedCodes: new Set(),
    implementedTrueCodes: new Set(),
    stageImplementedCounts: new Map(),
  };
  if (!existsSync(filePath)) return state;

  const text = readFileSync(filePath, 'utf8');
  const implementedArray = text.match(/export const implementedTemplateCodes = \[([\s\S]*?)\] as const;/u)?.[1] ?? '';
  for (const match of implementedArray.matchAll(/"(BM-\d{3})"/gu)) {
    state.implementedCodes.add(match[1]);
  }

  const stageBlock = text.match(/export const vksTemplateStages = \[([\s\S]*?)\] as VksTemplateStage\[\];/u)?.[1] ?? '';
  for (const entry of stageBlock.matchAll(/\{\s*"id"[\s\S]*?\n\s*\}/gu)) {
    const body = entry[0];
    const id = body.match(/"id"\s*:\s*"(stage-\d{2})"/u)?.[1];
    const implemented = body.match(/"implemented"\s*:\s*(\d+)/u)?.[1];
    if (id && implemented) {
      state.stageImplementedCounts.set(id, Number(implemented));
    }
  }

  for (const entry of text.matchAll(/\{\s*"id"[\s\S]*?\n\s*\}/gu)) {
    const body = entry[0];
    const code = body.match(/"code"\s*:\s*"(BM-\d{3})"/u)?.[1];
    if (!code) continue;

    const title = body.match(/"title"\s*:\s*"([^"]+)"/u)?.[1] ?? code;
    const stageNo = body.match(/"stageNo"\s*:\s*"(\d{2})"/u)?.[1] ?? '';
    const isImplemented = /"isImplemented"\s*:\s*true/u.test(body);
    state.entries.set(code, {
      code,
      title,
      stageNo,
      isImplemented,
    });
    state.entryCounts.set(code, (state.entryCounts.get(code) ?? 0) + 1);
    if (isImplemented) state.implementedTrueCodes.add(code);
  }

  return state;
}

function discoverComponentCodes(dir) {
  const codes = new Set();
  if (!existsSync(dir)) return codes;

  for (const fileName of readdirSync(dir)) {
    const code = fileName.match(/^bm-(\d{3})-form-inputs\.tsx$/u)?.[1];
    if (code) codes.add(`BM-${code}`);
  }

  return codes;
}

function discoverWorkspacePanelCodes(filePath) {
  const codes = new Set();
  if (!existsSync(filePath)) return codes;

  const text = readFileSync(filePath, 'utf8');
  const panelBlock = text.match(/const BM_PANEL_BY_CODE[\s\S]*?=\s*\{([\s\S]*?)\n\};/u)?.[1] ?? '';
  for (const match of panelBlock.matchAll(/"(BM-\d{3})"\s*:/gu)) {
    codes.add(match[1]);
  }

  return codes;
}

function discoverGenericWorkspacePanel(filePath) {
  if (!existsSync(filePath)) return false;

  const text = readFileSync(filePath, 'utf8');
  return /GenericTemplateFormInputsPanel/u.test(text);
}

function discoverNormalizedDocx(dir, root) {
  const result = new Map();
  if (!existsSync(dir)) return result;

  let PizZip = null;
  try {
    const requireFromApi = createRequire(join(root, 'apps', 'api', 'package.json'));
    PizZip = requireFromApi('pizzip');
  } catch {
    PizZip = null;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^BM-\d{3}$/u.test(entry.name)) continue;

    const filePath = join(dir, entry.name, `${entry.name}_normalized.docx`);
    if (!existsSync(filePath)) continue;

    result.set(entry.name, {
      code: entry.name,
      relativePath: toPortableRelative(root, filePath),
      ...inspectDocx(filePath, PizZip),
    });
  }

  return result;
}

function inspectDocx(filePath, PizZip) {
  if (!PizZip) {
    return {
      status: 'not-inspected',
      placeholderCount: 0,
      mojibakeCount: 0,
    };
  }

  try {
    const zip = new PizZip(readFileSync(filePath));
    const xmlFiles = Object.keys(zip.files).filter((name) => name.startsWith('word/') && name.endsWith('.xml'));
    const documentXml = zip.file('word/document.xml')?.asText() ?? '';
    const allXml = xmlFiles.map((name) => zip.file(name)?.asText() ?? '').join('\n');

    return {
      status: documentXml ? 'ok' : 'missing-document-xml',
      placeholderCount: (documentXml.match(/\{\{[^}]+\}\}/gu) ?? []).length,
      mojibakeCount: getMojibakeCount(allXml),
    };
  } catch (error) {
    return {
      status: `invalid-docx:${error instanceof Error ? error.message : String(error)}`,
      placeholderCount: 0,
      mojibakeCount: 0,
    };
  }
}

function toPortableRelative(root, target) {
  return relative(root, target).split('\\').join('/');
}
