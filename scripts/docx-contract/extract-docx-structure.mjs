#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 2 — Extract.
// Đọc DOCX (OOXML zip) hoặc DOC (Word 97-2003 OLE binary) trong folder gốc.
// Với mỗi file sinh extract.json (cấu trúc) + extract.md (text người đọc).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import PizZip from "pizzip";
import { extractDocText } from "./lib/ole-doc-reader.mjs";
import { deriveSourceId } from "./lib/source-id.mjs";
import { detectBlanksInBlocks } from "./lib/blank-detector.mjs";

const computeSha256Sync = (filePath) => {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch {
    return "unknown";
  }
};

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
const NORMALIZED_DOCX_ROOT = path.join(ROOT, "storage", "templates", "normalized-docx");

// BM-001..BM-004 pilot codes that should prefer normalized DOCX when available.
const NORMALIZED_PILOT_CODES = new Set(["BM-001", "BM-002", "BM-003", "BM-004"]);

const resolveNormalizedDocx = (templateCode) => {
  if (!templateCode || !NORMALIZED_PILOT_CODES.has(templateCode)) return null;
  const normPath = path.join(NORMALIZED_DOCX_ROOT, templateCode, `${templateCode}_normalized.docx`);
  if (fs.existsSync(normPath)) return normPath;
  return null;
};

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
  // gridSpan và vMerge nằm trong <w:tcPr> bên trong cell, KHÔNG phải attr của <w:tc>.
  const tcPrRe = /<w:tcPr>([\s\S]*?)<\/w:tcPr>/u;
  const gridSpanRe = /<w:gridSpan\s+w:val="(\d+)"/u;
  const vMergeRe = /<w:vMerge(?:\s+w:val="([^"]+)")?\s*\/>/u;
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
        // Parse gridSpan/vMerge từ <w:tcPr> bên trong cell.
        // Nếu thiếu <w:tcPr>, fallback sang parse trong tcAttrs (một số DOCX generate sai).
        let gridSpan = 1;
        let vMerge = null;
        const tcPrMatch = tcInner.match(tcPrRe);
        const tcPrBlock = tcPrMatch ? tcPrMatch[1] : "";
        const gridSpanMatch = tcPrBlock.match(gridSpanRe)
          ?? tcAttrs.match(gridSpanRe);
        const vMergeMatch = tcPrBlock.match(vMergeRe)
          ?? tcAttrs.match(vMergeRe);
        if (gridSpanMatch) gridSpan = parseInt(gridSpanMatch[1], 10);
        if (vMergeMatch) vMerge = vMergeMatch[1] ?? "continue";
        const cellId = `T${String(tableId).padStart(4, "0")}.R${String(rowIndex).padStart(4, "0")}.C${String(cellIndex).padStart(4, "0")}`;
        cells.push({
          cellId,
          text: cellText.join(" ").replace(/\s+/gu, " ").trim(),
          gridSpan,
          vMerge,
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

  // Detect placeholders and blanks using block-aware detection.
  const placeholders = detectPlaceholdersDocx(mainDoc);
  const blankCandidates = detectBlanksInBlocks(paragraphs, tables);

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
    blankCandidates,
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

// ============ DOC (OLE) processing ============

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
  // Blank detection using block-aware helper (no tables for DOC fallback).
  const blankCandidates = detectBlanksInBlocks(paragraphs, []);
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
    blankCandidates,
  };
};

// ============ Main ============

const extractOne = (record) => {
  // Step 1: resolve source
  let sourcePath = path.join(ROOT, record.relativePath);
  let extractionKind = "original";

  // Step 2: check if we should use normalized DOCX for pilot codes
  if (record.templateCode && NORMALIZED_PILOT_CODES.has(record.templateCode)) {
    const normPath = resolveNormalizedDocx(record.templateCode);
    if (normPath) {
      sourcePath = normPath;
      extractionKind = "normalized-docx";
    }
  }

  let buf;
  try {
    buf = fs.readFileSync(sourcePath);
  } catch (err) {
    return {
      error: `Không đọc được: ${err.message}`,
    };
  }
  try {
    if (sourcePath.endsWith(".docx")) {
      const result = extractDocx(buf);
      return { ...result, extractionKind };
    }
    const result = extractDoc(buf);
    return { ...result, extractionKind };
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
    // Re-derive sourceId theo cùng convention với inventory để output 1-1.
    const sourceId = deriveSourceId({
      templateCode: r.templateCode,
      fileName: r.fileName,
      sha256: r.sha256,
    });
    const fullResult = {
      sourceId,
      templateCode: r.templateCode,
      documentKind: r.documentKind ?? (r.templateCode ? "form" : "reference"),
      duplicateIndex: r.duplicateIndex ?? 1,
      duplicateCount: r.duplicateCount ?? 1,
      isDuplicateCode: r.isDuplicateCode ?? false,
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
      // Original DOC/DOCX source (preserved for contract lineage)
      docxOriginal: {
        relativePath: r.relativePath,
        sha256: r.sha256,
        format: r.format,
      },
      // Which source was used for extraction (may be normalized-docx for pilot BM)
      extractionSource: (() => {
        if (result.extractionKind === "normalized-docx") {
          // normalized path is the resolved normPath from extractOne
          const normPath = resolveNormalizedDocx(r.templateCode);
          const sha = normPath ? computeSha256Sync(normPath) : r.sha256;
          return {
            kind: "normalized-docx",
            relativePath: normPath
              ? path.relative(ROOT, normPath)
              : `storage/templates/normalized-docx/${r.templateCode}/${r.templateCode}_normalized.docx`,
            sha256: sha,
            format: "docx",
          };
        }
        return {
          kind: "original",
          relativePath: r.relativePath,
          sha256: r.sha256,
          format: r.format,
        };
      })(),
      extractionKind: result.extractionKind ?? "original",
      extractedAt: new Date().toISOString(),
    };

    const outName = `${sourceId}.extract.json`;
    const outPath = path.join(OUT_DIR, outName);
    fs.writeFileSync(outPath, `${JSON.stringify(fullResult, null, 2)}\n`, "utf8");

    const md = buildExtractMd(fullResult);
    const mdPath = path.join(OUT_DIR, `${sourceId}.extract.md`);
    fs.writeFileSync(mdPath, md, "utf8");

    if (result.error) {
      failed += 1;
      failedList.push({ sourceId, code, file: r.relativePath, error: result.error });
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
