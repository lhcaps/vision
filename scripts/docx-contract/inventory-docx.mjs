#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 1 — Inventory.
// Quét toàn bộ DOCX/DOC trong folder gốc, sinh inventory + SHA-256 + detect BM code.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(
  ROOT,
  "docs",
  "Biểu mẫu",
  "Full",
  "0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC",
);
const OUT_DIR = path.join(ROOT, "docs", "audit", "docx", "inventory");
const OUT_JSON = path.join(OUT_DIR, "docx-inventory.json");
const OUT_MD = path.join(OUT_DIR, "docx-inventory.md");

const { deriveSourceId, slugifyForId } = await import("./lib/source-id.mjs");

const TEMP_PREFIX = "~$";
const EXCLUDE_DIR_NAMES = new Set(["backup", "backups", "format-edit-backup", "header-fix-backup", "complete-fix-backup", "complete-data-fix-backup", "article3-signature-fix-backup", "final-format-backup"]);

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

// Pattern ưu tiên để detect BM code. Tên file thực tế có dạng
// "01-Biên bản tiếp nhận..." hoặc "BM-001-...". Mỗi pattern được thử
// theo thứ tự; pattern nào ăn khớp và ra số 1..213 thì thắng.
const CODE_PATTERNS = [
  { regex: /\bBM[-_](\d{1,3})\b/iu, group: 1, label: "BM-NNN" },
  { regex: /Mẫu\s*số\s*(\d{1,3})/iu, group: 1, label: "Mẫu số NNN" },
  { regex: /Mau\s*so\s*(\d{1,3})/iu, group: 1, label: "Mau so NNN" },
  { regex: /Mẫu\s*(\d{1,3})/iu, group: 1, label: "Mẫu NNN" },
  { regex: /Mau\s*(\d{1,3})/iu, group: 1, label: "Mau NNN" },
  // Số BM ở đầu tên file: "01-..." / "1_..." / "001 " (theo sau là separator
  // hoặc khoảng trắng). Bắt riêng, chỉ nhận 1-3 chữ số ở đầu.
  { regex: /^(\d{1,3})[\s\-_.]/u, group: 1, label: "leading-NNN" },
];

const NORMALIZE_NUM = (raw) => {
  const digits = String(raw).replace(/\D/gu, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 1 || n > 999) return null;
  return String(n).padStart(3, "0");
};

const detectBmCode = (fileName) => {
  for (const { regex, group, label } of CODE_PATTERNS) {
    const m = fileName.match(regex);
    if (m) {
      const code = NORMALIZE_NUM(m[group]);
      if (code) {
        return { code: `BM-${code}`, matched: m[0], pattern: label };
      }
    }
  }
  return { code: null, matched: null, pattern: null };
};

const isDocxLike = (fileName) => {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".docx") || lower.endsWith(".doc");
};

const walk = (dir, out) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }
  for (const ent of entries) {
    if (ent.name.startsWith(TEMP_PREFIX)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(ent.name)) continue;
      walk(full, out);
    } else if (isDocxLike(ent.name)) {
      out.push(full);
    }
  }
};

const detectTitle = (fileName) => {
  // Bỏ phần số BM ở đầu + phần mở rộng, giữ phần tên tiếng Việt.
  const stem = fileName.replace(/\.(docx?|tmp)$/iu, "");
  return stem
    .replace(/^[\s\d\.\-_]+/u, "")
    .replace(/\s+/gu, " ")
    .trim() || stem;
};

const inferGroup = (relativePath) => {
  const parts = relativePath.split(/[\\/]/u);
  return parts.length > 1 ? parts[0] : "(root)";
};

const safeStat = (full) => {
  try {
    return fs.statSync(full);
  } catch {
    return null;
  }
};

const safeReadHead = (full, bytes) => {
  try {
    const fd = fs.openSync(full, "r");
    try {
      const buf = Buffer.alloc(bytes);
      const read = fs.readSync(fd, buf, 0, bytes, 0);
      return buf.slice(0, read);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return Buffer.alloc(0);
  }
};

const main = () => {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source folder not found: ${SOURCE_DIR}`);
    process.exit(2);
  }

  const files = [];
  walk(SOURCE_DIR, files);
  files.sort();

  const records = files.map((full) => {
    const rel = path.relative(ROOT, full);
    const fileName = path.basename(full);
    const ext = path.extname(full).toLowerCase();
    const stat = safeStat(full);
    const { code, matched, pattern } = detectBmCode(fileName);
    const issues = [];

    if (!code) {
      issues.push("Không xác định chắc mã biểu mẫu");
    }

    let sha = null;
    let sizeBytes = null;
    let modifiedTime = null;
    let readError = null;
    if (stat) {
      sizeBytes = stat.size;
      modifiedTime = stat.mtime.toISOString();
      try {
        const buf = fs.readFileSync(full);
        sha = sha256(buf);
      } catch (err) {
        readError = err.message;
        issues.push(`Không đọc được file: ${err.message}`);
      }
    } else {
      issues.push("Không stat được file");
    }

    const formatKind = ext === ".docx" ? "docx" : ext === ".doc" ? "doc" : "unknown";

    return {
      templateCode: code,
      fileName,
      relativePath: rel.replaceAll(path.sep, "/"),
      absolutePath: full,
      sha256: sha,
      sizeBytes,
      modifiedTime,
      format: formatKind,
      detectedTitle: detectTitle(fileName),
      group: inferGroup(rel),
      matchedCodePattern: matched,
      matchedCodeRule: pattern,
      status: readError ? "error" : code ? "inventoried" : "needs-review",
      issues,
      readError,
    };
  });

  // Summary stats.
  const codes = new Set();
  const byCode = new Map();
  for (const rec of records) {
    if (rec.templateCode) {
      if (codes.has(rec.templateCode)) {
        rec.issues.push(`Duplicate BM code với file khác (${rec.templateCode})`);
      } else {
        codes.add(rec.templateCode);
      }
      const list = byCode.get(rec.templateCode) ?? [];
      list.push(rec);
      byCode.set(rec.templateCode, list);
    }
  }

  // Gán sourceId + duplicateIndex cho mỗi record. Mỗi file = 1 sourceId duy nhất,
  // kể cả khi trùng templateCode (BM-139 duplicate). Output downstream phải dùng
  // sourceId để tránh ghi đè lẫn nhau.
  for (const rec of records) {
    if (rec.templateCode) {
      const sameCode = byCode.get(rec.templateCode) ?? [];
      const idx = sameCode.indexOf(rec) + 1;
      rec.duplicateIndex = idx;
      rec.duplicateCount = sameCode.length;
      rec.isDuplicateCode = sameCode.length > 1;
      rec.sourceId = deriveSourceId({
        templateCode: rec.templateCode,
        sha256: rec.sha256,
        duplicateIndex: idx,
      });
      rec.documentKind = "form";
    } else {
      rec.duplicateIndex = 1;
      rec.duplicateCount = 1;
      rec.isDuplicateCode = false;
      rec.sourceId = deriveSourceId({
        templateCode: null,
        fileName: rec.fileName,
        sha256: rec.sha256,
      });
      rec.documentKind = "reference";
    }
  }

  const allBmNumbers = new Set();
  for (const code of codes) {
    const n = parseInt(code.replace("BM-", ""), 10);
    if (Number.isFinite(n)) allBmNumbers.add(n);
  }
  const missing = [];
  for (let i = 1; i <= 213; i += 1) {
    if (!allBmNumbers.has(i)) missing.push(i);
  }

  const errored = records.filter((r) => r.status === "error");
  const needsReview = records.filter((r) => r.status === "needs-review");
  const duplicates = [];
  for (const [code, list] of byCode) {
    if (list.length > 1) duplicates.push({ code, count: list.length, files: list.map((r) => r.relativePath) });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceDir: path.relative(ROOT, SOURCE_DIR).replaceAll(path.sep, "/"),
    totalFiles: records.length,
    totalDocx: records.filter((r) => r.format === "docx").length,
    totalDoc: records.filter((r) => r.format === "doc").length,
    distinctCodes: codes.size,
    missingCount: missing.length,
    missingCodes: missing,
    duplicateCount: duplicates.length,
    duplicates,
    errorCount: errored.length,
    needsReviewCount: needsReview.length,
    needsReview: needsReview.map((r) => r.relativePath),
    referenceCount: records.filter((r) => r.documentKind === "reference").length,
    formCount: records.filter((r) => r.documentKind === "form").length,
    errored: errored.map((r) => ({ file: r.relativePath, error: r.readError })),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify({ summary, records }, null, 2)}\n`, "utf8");

  // Markdown.
  const md = [];
  md.push("# DOCX Inventory — Audit 213 biểu mẫu theo TT 03/2026-VKSTC");
  md.push("");
  md.push(`Sinh lúc: ${summary.generatedAt}`);
  md.push("");
  md.push("## Tổng quan");
  md.push("");
  md.push(`- Folder nguồn: \`${summary.sourceDir}\``);
  md.push(`- Tổng file tìm thấy (.docx + .doc, loại trừ Office temp, loại trừ backup): **${summary.totalFiles}**`);
  md.push(`  - File định dạng .docx (OOXML zip): **${summary.totalDocx}**`);
  md.push(`  - File định dạng .doc (Word 97-2003 binary OLE): **${summary.totalDoc}**`);
  md.push(`- Tổng DOCX hợp lệ (đọc được + có SHA-256): **${records.length - errored.length}**`);
  md.push(`- Số BM code detect được: **${summary.distinctCodes}**`);
  md.push(`- Số BM code duplicate (nhiều file cùng code): **${summary.duplicateCount}**`);
  md.push(`- Số file không detect được code: **${summary.needsReviewCount}**`);
  md.push(`- Số file lỗi / corrupt / không đọc được: **${summary.errorCount}**`);
  md.push(`- Số BM code thiếu (so với 1..213): **${summary.missingCount}**`);
  md.push(`- Số file là biểu mẫu (form): **${summary.formCount}**`);
  md.push(`- Số file là tài liệu tham chiếu (Thông tư/Danh mục): **${summary.referenceCount}**`);
  md.push("");
  md.push("## SourceId — định danh duy nhất cho mỗi file");
  md.push("");
  md.push("Mỗi file có `sourceId` dùng cho output downstream. Format:");
  md.push("- Form: `<BM-XXX>__<sha12>` (vd `BM-139__23306e6022bd`).");
  md.push("- Reference: `REF__<slug>__<sha12>` (vd `REF__thong-tu-03__9795f14f931c`).");
  md.push("Reviewer dùng sourceId để phân biệt các biến thể trùng BM code (vd 2 file BM-139).");
  md.push("");
  if (summary.duplicateCount > 0) {
    md.push("## Duplicate BM code — cần human chọn canonical source");
    md.push("");
    for (const dup of summary.duplicates) {
      md.push(`- **${dup.code}** (${dup.count} file):`);
      for (const f of dup.files) md.push(`  - ${f}`);
    }
    md.push("");
    md.push("> Pipeline KHÔNG tự chọn file canonical cho BM duplicate. Reviewer phải quyết định.");
    md.push("");
  }
  if (summary.needsReviewCount > 0) {
    md.push("## File không detect được code");
    md.push("");
    for (const f of summary.needsReview) md.push(`- ${f}`);
    md.push("");
  }
  if (summary.errorCount > 0) {
    md.push("## File lỗi / corrupt");
    md.push("");
    for (const e of summary.errored) md.push(`- ${e.file}: ${e.error ?? "(unknown)"}`);
    md.push("");
  }
  if (missing.length > 0) {
    md.push("## Missing BM codes (so với 1..213)");
    md.push("");
    md.push(`Tổng ${missing.length} mã không tìm thấy file trong folder nguồn. Liệt kê đầy đủ:`);
    md.push("");
    md.push("```txt");
    md.push(missing.join(", "));
    md.push("```");
    md.push("");
  }
  md.push("## Danh sách file");
  md.push("");
  md.push("| # | SourceId | BM code | Kind | File | Định dạng | Size (bytes) | Group | SHA-256 | Status | Issues |");
  md.push("|---|---|---|---|---|---:|---|---|---|---|---|");
  records.forEach((r, idx) => {
    const issueText = r.issues.length > 0 ? r.issues.join("; ") : "-";
    const shaShort = r.sha256 ? r.sha256.slice(0, 12) + "…" : "-";
    md.push(
      `| ${idx + 1} | ${r.sourceId ?? "?"} | ${r.templateCode ?? "(?)"} | ${r.documentKind ?? "?"} | ${r.relativePath} | ${r.format} | ${r.sizeBytes ?? "-"} | ${r.group} | ${shaShort} | ${r.status} | ${issueText} |`,
    );
  });
  md.push("");
  fs.writeFileSync(OUT_MD, md.join("\n"), "utf8");

  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
  console.log(JSON.stringify(summary, null, 2));
};

main();
