#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 2 — Extract.
// Đọc DOCX (OOXML zip) hoặc DOC (Word 97-2003 OLE binary) trong folder gốc.
// Với mỗi file sinh extract.json (cấu trúc) + extract.md (text người đọc).

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { extractDocText } from "./lib/ole-doc-reader.mjs";

const require = createRequire(import.meta.url);
const PizZip = require("../../apps/api/node_modules/pizzip");

const ROOT = process.cwd();
const SOURCE_DIR = path.join(
  ROOT,
  "docs",
  "Biểu mẫu",
  "Full",
  "0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC",
);
const INVENTORY = path.join(ROOT, "docs", "audit", "docx", "inventory", "docx-inventory.json");
const OUT_DIR = path.join(ROOT, "docs", "audit", "docx", "extracted");

// Pattern cùng với inventory.
const CODE_PATTERNS = [
  /\bBM[-_](\d{1,3})\b/iu,
  /Mẫu\s*số\s*(\d{1,3})/iu,
  /Mau\s*so\s*(\d{1,3})/iu,
  /Mẫu\s*(\d{1,3})/iu,
  /Mau\s*(\d{1,3})/iu,
  /^(\d{1,3})[\s\-_.]/u,
];

const NORMALIZE_NUM = (raw) => {
  const digits = String(raw).replace(/\D/gu, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 1 || n > 999) return null;
  return String(n).padStart(3, "0");
};

const detectBmCode = (fileName) => {
  for (const regex of CODE_PATTERNS) {
    const m = fileName.match(regex);
    if (m) {
      const code = NORMALIZE_NUM(m[1]);
      if (code) return `BM-${code}`;
    }
  }
  return null;
};

const inferGroup = (relativePath) => {
  const parts = relativePath.split(/[\\/]/u);
  return parts.length > 1 ? parts[0] : "(root)";
};

const detectTitle = (fileName) =>
  fileName
    .replace(/\.(docx?|tmp)$/iu, "")
    .replace(/^[\s\d\.\-_]+/u, "")
    .replace(/\s+/gu, " ")
    .trim() || fileName;

// ============ DOCX (OOXML) processing ============

const NAMESPACES = {
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
};

const wAttr = (node, name) => {
  if (!node) return null;
  const v = node.getAttribute(`w:${name}`);
  if (v != null) return v;
  return node.getAttribute(name);
};

const readDocxParagraphs = (xmlText) => {
  // Dùng regex nhanh để tách <w:p>...</w:p> thay vì parse XML đầy đủ.
  // Đủ cho audit, không cần DOM parser.
  const blocks = [];
  let blockId = 0;
  const paraRe = /<w:p\b([^>]*)>([\s\S]*?)<\/w:p>/gu;
  const runTextRe = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/gu;
  const tabRe = /<w:tab\b[^/]*\/?>/gu;
  const brRe = /<w:br\b[^/]*\/?>/gu;
  const styleRe = /<w:pStyle\s+w:val="([^"]+)"\s*\/>/u;
  let m;
  while ((m = paraRe.exec(xmlText))) {
    blockId += 1;
    const attrs = m[1] ?? "";
    const inner = m[2] ?? "";
    const styleMatch = inner.match(styleRe);
    const style = styleMatch ? styleMatch[1] : null;
    // Extract text content từ <w:t>...</w:t>, ghép lại.
    const textParts = [];
    let rm;
    const reRun = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/gu;
    while ((rm = reRun.exec(inner))) {
      const run = rm[1];
      let tm;
      runTextRe.lastIndex = 0;
      while ((tm = runTextRe.exec(run))) {
        textParts.push(decodeXmlEntities(tm[1]));
      }
      if (tabRe.test(run)) textParts.push("\t");
      if (brRe.test(run)) textParts.push("\n");
      tabRe.lastIndex = 0;
    }
    const text = textParts.join("").trim();
    if (!text && !style) continue;
    blocks.push({
      blockId: `P${String(blockId).padStart(4, "0")}`,
      kind: "paragraph",
      text,
      style: style ?? null,
    });
    void attrs;
  }
  return blocks;
};

const decodeXmlEntities = (s) =>
  s
    .replace(/&amp;/gu, "&")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'");

const readDocxTables = (xmlText) => {
  const tables = [];
  let tableId = 0;
  const tableRe = /<w:tbl\b[\s\S]*?<\/w:tbl>/gu;
  const rowRe = /<w:tr\b([^>]*)>([\s\S]*?)<\/w:tr>/gu;
  const cellRe = /<w:tc\b([^>]*)>([\s\S]*?)<\/w:tc>/gu;
  const tRe = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/gu;
  let m;
  while ((m = tableRe.exec(xmlText))) {
    tableId += 1;
    const tbl = m[0];
    const rows = [];
    let rowIndex = 0;
    let rm;
    rowRe.lastIndex = 0;
    while ((rm = rowRe.exec(tbl))) {
      rowIndex += 1;
      const tr = rm[2];
      const cells = [];
      let cm;
      let cellIndex = 0;
      cellRe.lastIndex = 0;
      while ((cm = cellRe.exec(tr))) {
        cellIndex += 1;
        const tcAttrs = cm[1] ?? "";
        const tcInner = cm[2] ?? "";
        const cellText = [];
        let tm;
        tRe.lastIndex = 0;
        while ((tm = tRe.exec(tcInner))) {
          cellText.push(decodeXmlEntities(tm[1]));
        }
        const gridSpanMatch = tcAttrs.match(/<w:gridSpan\s+w:val="(\d+)"/u);
        const vMergeMatch = tcAttrs.match(/<w:vMerge(?:\s+w:val="([^"]+)")?\s*\/>/u);
        const cellId = `T${String(tableId).padStart(4, "0")}.R${String(rowIndex).padStart(4, "0")}.C${String(cellIndex).padStart(4, "0")}`;
        cells.push({
          cellId,
          text: cellText.join(" ").replace(/\s+/gu, " ").trim(),
          gridSpan: gridSpanMatch ? parseInt(gridSpanMatch[1], 10) : 1,
          vMerge: vMergeMatch ? vMergeMatch[1] ?? "continue" : null,
        });
      }
      rows.push({ rowIndex, cells });
    }
    tables.push({ tableId: `T${String(tableId).padStart(4, "0")}`, rows });
  }
  return tables;
};

const extractDocx = (buf) => {
  const zip = new PizZip(buf);
  const names = Object.keys(zip.files);
  const parts = [];
  const text = {};
  for (const name of names) {
    const entry = zip.file(name);
    if (!entry) continue;
    const content = entry.asText();
    parts.push({
      partName: name,
      rawTextLength: content.length,
      paragraphCount: 0,
      tableCount: 0,
    });
  }
  const mainDoc = zip.file("word/document.xml")?.asText() ?? "";
  const paragraphs = readDocxParagraphs(mainDoc);
  const tables = readDocxTables(mainDoc);

  // Headers/footers
  for (const name of names) {
    if (!/^word\/(header|footer)\d*\.xml$/u.test(name)) continue;
    const content = zip.file(name)?.asText() ?? "";
    const ps = readDocxParagraphs(content);
    text[name] = ps.map((p) => p.text).join("\n");
  }
  text["word/document.xml"] = paragraphs.map((p) => p.text).join("\n");

  // Count paragraphs/tables per part.
  const docPart = parts.find((p) => p.partName === "word/document.xml");
  if (docPart) {
    docPart.paragraphCount = paragraphs.length;
    docPart.tableCount = tables.length;
  }

  // Detect placeholders in document.xml.
  const placeholders = detectPlaceholdersDocx(mainDoc);

  // Metadata
  let metadata = {};
  const core = zip.file("docProps/core.xml");
  if (core) {
    const coreXml = core.asText();
    const title = (coreXml.match(/<dc:title>([\s\S]*?)<\/dc:title>/u) ?? [])[1];
    const creator = (coreXml.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/u) ?? [])[1];
    const created = (coreXml.match(/<dcterms:created[^>]*>([\s\S]*?)<\/dcterms:created>/u) ?? [])[1];
    const modified = (coreXml.match(/<dcterms:modified[^>]*>([\s\S]*?)<\/dcterms:modified>/u) ?? [])[1];
    metadata = {
      title: title ? decodeXmlEntities(title) : null,
      creator: creator ? decodeXmlEntities(creator) : null,
      created: created ?? null,
      modified: modified ?? null,
    };
  }

  return {
    method: "docx-ooxml",
    metadata,
    parts,
    textBlocks: paragraphs,
    tables,
    headers: Object.fromEntries(
      Object.entries(text).filter(([k]) => k.startsWith("word/header") || k.startsWith("word/footer")),
    ),
    documentText: text["word/document.xml"] ?? "",
    placeholders,
  };
};

const detectPlaceholdersDocx = (xmlText) => {
  const candidates = [];
  const patterns = [
    { regex: /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/gu, kind: "mustache" },
    { regex: /\$\{\s*([a-zA-Z0-9_.]+)\s*\}/gu, kind: "shell" },
    { regex: /<<\s*([a-zA-Z0-9_.]+)\s*>>/gu, kind: "double-angle" },
    { regex: /\bMERGEFIELD\s+([a-zA-Z0-9_]+)/giu, kind: "merge-field" },
  ];
  for (const { regex, kind } of patterns) {
    let m;
    while ((m = regex.exec(xmlText))) {
      candidates.push({ kind, value: m[1], raw: m[0] });
    }
  }
  return candidates;
};

// ============ DOC (OLE) processing ============

const detectPlaceholdersText = (text) => {
  const candidates = [];
  const patterns = [
    { regex: /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/gu, kind: "mustache" },
    { regex: /\$\{\s*([a-zA-Z0-9_.]+)\s*\}/gu, kind: "shell" },
    { regex: /<<\s*([a-zA-Z0-9_.]+)\s*>>/gu, kind: "double-angle" },
  ];
  for (const { regex, kind } of patterns) {
    let m;
    while ((m = regex.exec(text))) {
      candidates.push({ kind, value: m[1], raw: m[0] });
    }
  }
  return candidates;
};

const detectBlanksText = (text) => {
  const blanks = [];
  const patterns = [
    { regex: /\.{3,}/gu, kind: "ellipsis" },
    { regex: /_{3,}/gu, kind: "underscore" },
    { regex: /ngày\s*\.{3,}\s*tháng\s*\.{3,}\s*năm\s*\.{3,}/giu, kind: "vn-date-line" },
    { regex: /(?:\(\s*\d+\s*\))\.{2,}/gu, kind: "numbered-blank" },
  ];
  for (const { regex, kind } of patterns) {
    let m;
    while ((m = regex.exec(text))) {
      blanks.push({ kind, raw: m[0] });
    }
  }
  return blanks;
};

const extractDoc = (buf) => {
  const r = extractDocText(buf);
  const text = r.text;
  // Tách paragraph theo newline.
  const lines = text.split(/\n+/u).map((s) => s.trim()).filter(Boolean);
  const paragraphs = lines.map((line, idx) => ({
    blockId: `P${String(idx + 1).padStart(4, "0")}`,
    kind: "paragraph",
    text: line,
    style: null,
  }));
  // DOC binary thường không có table structure rõ ràng từ text scan.
  return {
    method: r.method,
    warnings: r.warnings,
    streams: r.streams,
    metadata: {},
    parts: [
      {
        partName: "WordDocument",
        rawTextLength: text.length,
        paragraphCount: paragraphs.length,
        tableCount: 0,
      },
    ],
    textBlocks: paragraphs,
    tables: [],
    headers: {},
    documentText: text,
    placeholders: detectPlaceholdersText(text),
    blankCandidates: detectBlanksText(text),
  };
};

// ============ Main ============

const extractOne = (record) => {
  const full = path.join(ROOT, record.relativePath);
  let buf;
  try {
    buf = fs.readFileSync(full);
  } catch (err) {
    return {
      error: `Không đọc được: ${err.message}`,
    };
  }
  try {
    if (record.format === "docx") {
      return extractDocx(buf);
    }
    return extractDoc(buf);
  } catch (err) {
    return { error: `Extract fail: ${err.message}` };
  }
};

const buildExtractMd = (rec) => {
  const md = [];
  md.push(`# ${rec.templateCode ?? "BM-???"} Extract`);
  md.push("");
  md.push(`## Metadata`);
  md.push(`- File: \`${rec.relativePath}\``);
  md.push(`- SHA256: \`${rec.sha256 ?? "?"}\``);
  md.push(`- Định dạng: ${rec.format}`);
  md.push(`- Group: ${rec.group}`);
  md.push(`- Detected title: ${rec.detectedTitle ?? "?"}`);
  if (rec.metadata) {
    md.push(`- Title: ${rec.metadata.title ?? "?"}`);
    md.push(`- Creator: ${rec.metadata.creator ?? "?"}`);
  }
  md.push(`- Method: ${rec.method ?? "?"}`);
  if (rec.warnings && rec.warnings.length) {
    md.push(`- Warnings: ${rec.warnings.join("; ")}`);
  }
  md.push("");
  if (rec.error) {
    md.push("## Lỗi");
    md.push(rec.error);
    return md.join("\n");
  }
  md.push(`## Paragraphs (${rec.textBlocks.length})`);
  md.push("");
  for (const p of rec.textBlocks.slice(0, 200)) {
    md.push(`- **${p.blockId}**${p.style ? ` _(${p.style})_` : ""}: ${p.text}`);
  }
  if (rec.textBlocks.length > 200) {
    md.push(`- ... _(${rec.textBlocks.length - 200} paragraph còn lại bị cắt)_`);
  }
  md.push("");
  if (rec.tables.length) {
    md.push(`## Tables (${rec.tables.length})`);
    md.push("");
    for (const t of rec.tables) {
      md.push(`### ${t.tableId}`);
      md.push("");
      for (const row of t.rows.slice(0, 50)) {
        md.push(
          `- ${row.cells.map((c) => `[${c.cellId}] ${c.text || "(empty)"}`).join(" | ")}`,
        );
      }
      if (t.rows.length > 50) {
        md.push(`- ... _(${t.rows.length - 50} row còn lại bị cắt)_`);
      }
      md.push("");
    }
  }
  md.push(`## Placeholder candidates (${rec.placeholders.length})`);
  md.push("");
  for (const p of rec.placeholders.slice(0, 50)) {
    md.push(`- \`${p.raw}\` (${p.kind})`);
  }
  if (rec.placeholders.length > 50) {
    md.push(`- ... _(${rec.placeholders.length - 50} candidate còn lại bị cắt)_`);
  }
  md.push("");
  if (rec.blankCandidates && rec.blankCandidates.length) {
    md.push(`## Blank candidates (${rec.blankCandidates.length})`);
    md.push("");
    for (const b of rec.blankCandidates.slice(0, 30)) {
      md.push(`- \`${b.raw}\` (${b.kind})`);
    }
    if (rec.blankCandidates.length > 30) {
      md.push(`- ... _(${rec.blankCandidates.length - 30} candidate còn lại bị cắt)_`);
    }
    md.push("");
  }
  return md.join("\n");
};

const main = () => {
  if (!fs.existsSync(INVENTORY)) {
    console.error("Run inventory first");
    process.exit(2);
  }
  const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
  const records = inventory.records;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let failed = 0;
  const failedList = [];

  for (const r of records) {
    const code = r.templateCode ?? `FILE-${r.fileName.replace(/\s+/gu, "_")}`;
    const result = extractOne(r);
    const fullResult = {
      templateCode: r.templateCode,
      fileName: r.fileName,
      relativePath: r.relativePath,
      group: r.group,
      detectedTitle: r.detectedTitle,
      sha256: r.sha256,
      sizeBytes: r.sizeBytes,
      format: r.format,
      method: result.method ?? null,
      warnings: result.warnings ?? [],
      error: result.error ?? null,
      metadata: result.metadata ?? {},
      parts: result.parts ?? [],
      textBlocks: result.textBlocks ?? [],
      tables: result.tables ?? [],
      headers: result.headers ?? {},
      placeholders: result.placeholders ?? [],
      blankCandidates: result.blankCandidates ?? [],
      extractedAt: new Date().toISOString(),
    };

    const outName = `${code.replace(/^BM-/, "BM-")}.extract.json`;
    const outPath = path.join(OUT_DIR, outName);
    fs.writeFileSync(outPath, `${JSON.stringify(fullResult, null, 2)}\n`, "utf8");

    const md = buildExtractMd(fullResult);
    const mdPath = path.join(OUT_DIR, `${code.replace(/^BM-/, "BM-")}.extract.md`);
    fs.writeFileSync(mdPath, md, "utf8");

    if (result.error) {
      failed += 1;
      failedList.push({ code, file: r.relativePath, error: result.error });
    } else {
      ok += 1;
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totalRecords: records.length,
    extractedOk: ok,
    extractedFailed: failed,
    failed: failedList,
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
};

main();
