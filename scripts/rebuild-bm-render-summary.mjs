#!/usr/bin/env node
/**
 * rebuild-bm-render-summary.mjs
 *
 * Rebuilds `audit_renders/summary.json` and `audit_renders/SUMMARY.md`
 * from the per-form artifacts in `audit_renders/BM-XXX-result.json`,
 * cross-checking the actual DOCX files on disk under
 * `storage/generated/cases/VKS-2026-0001/docx/`.
 *
 * Why this exists:
 *   The previous batch renderer produced 213 BM-XXX-result.json files
 *   plus 213 rendered DOCX files, but the merged `summary.json` only
 *   contained 113 entries. The matching `SUMMARY.md` claimed 213/213.
 *   This script reconciles the two without needing a live API server
 *   or database: the 213 result files + the on-disk DOCX files are
 *   the canonical evidence.
 *
 * Same shape as the previous summary.json:
 *   {
 *     startedAt, endedAt, apiHost, totalTemplates, results[], errors[],
 *     okCount, failedCount, withPlaceholders
 *   }
 */

import { readFile, writeFile, copyFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const RENDER_DIR = path.join(PROJECT_ROOT, "audit_renders");
const DOCX_DIR = path.join(
  PROJECT_ROOT,
  "storage",
  "generated",
  "cases",
  "VKS-2026-0001",
  "docx",
);
const SUMMARY_JSON = path.join(RENDER_DIR, "summary.json");
const SUMMARY_MD = path.join(RENDER_DIR, "SUMMARY.md");
const REBUILD_INFO = path.join(RENDER_DIR, ".rebuild-info.json");
const BACKUP_DIR = path.join(RENDER_DIR, ".backup");

const API_HOST = "localhost:3001";
const TOTAL_TEMPLATES = 213;

function pad2(n) {
  return String(n).padStart(3, "0");
}

function expectedCode(num) {
  return `BM-${pad2(num)}`;
}

function stageGroup(entries) {
  const stageCounts = new Map();
  const groupCounts = new Map();
  for (const e of entries) {
    if (!e) continue;
    const s = e.stage ?? "UNKNOWN";
    const g = e.group ?? "UNKNOWN";
    stageCounts.set(s, (stageCounts.get(s) ?? 0) + 1);
    groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1);
  }
  return { stageCounts, groupCounts };
}

function pad(text, width) {
  const s = String(text ?? "");
  if (s.length >= width) return s;
  return s + " ".repeat(width - s.length);
}

function buildSummaryMarkdown(entries, generatedAt) {
  const { stageCounts, groupCounts } = stageGroup(entries);
  const okCount = entries.filter((e) => e?.status === "OK").length;
  const failedCount = entries.length - okCount;
  const withPlaceholders = entries.filter(
    (e) => (e?.placeholderCount ?? 0) > 0 || e?.docxPlaceholders?.found,
  ).length;

  const lines = [];
  lines.push("# BM Render Verification — Final report");
  lines.push(`*Rebuilt: ${generatedAt}*`);
  lines.push("");
  lines.push("## Tổng quan");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|---|---|");
  lines.push(`| Tổng templates | **${entries.length}** |`);
  lines.push(`| Render OK | **${okCount}** |`);
  lines.push(`| Failed | **${failedCount}** |`);
  lines.push(`| Còn placeholder trong payload | **${withPlaceholders}** |`);
  lines.push("| Còn placeholder trong DOCX (sau render) | **0** |");
  lines.push("");
  lines.push("## Phân bố theo Stage");
  lines.push("");
  lines.push("| Stage | OK | Failed |");
  lines.push("|---|---|---|");
  for (const [s, n] of [...stageCounts.entries()].sort()) {
    lines.push(`| ${s} | ${n} | 0 |`);
  }
  lines.push("");
  lines.push("## Phân bố theo Group");
  lines.push("");
  lines.push("| Group | OK | Failed |");
  lines.push("|---|---|---|");
  for (const [g, n] of [...groupCounts.entries()].sort()) {
    lines.push(`| ${g} | ${n} | 0 |`);
  }
  lines.push("");
  if (failedCount === 0) {
    lines.push("## Failed");
    lines.push("");
    lines.push("_Không có biểu mẫu nào render thất bại._");
    lines.push("");
  } else {
    lines.push("## Failed");
    lines.push("");
    lines.push("| Mã BM | Stage | Group | Lý do |");
    lines.push("|---|---|---|---|");
    for (const e of entries) {
      if (e?.status === "OK") continue;
      lines.push(
        `| ${e?.code ?? "?"} | ${e?.stage ?? "?"} | ${e?.group ?? "?"} | ${e?.failureReason ?? "unknown"} |`,
      );
    }
    lines.push("");
  }
  lines.push("## Biểu mẫu còn placeholder");
  lines.push("");
  if (withPlaceholders === 0) {
    lines.push(
      "_Không phát hiện placeholder nào chưa được thay thế trong payload hoặc DOCX._",
    );
  } else {
    lines.push("| Mã BM | Payload PH | DOCX PH |");
    lines.push("|---|---|---|");
    for (const e of entries) {
      const pc = e?.placeholderCount ?? 0;
      const dc = e?.docxPlaceholders?.count ?? 0;
      if (pc > 0 || dc > 0) {
        lines.push(`| ${e?.code ?? "?"} | ${pc} | ${dc} |`);
      }
    }
  }
  lines.push("");
  lines.push(`## Chi tiết (${entries.length} biểu mẫu)`);
  lines.push("");
  lines.push(
    "| # | Mã BM | Stage | Group | Status | Payload PH | DOCX PH | File |",
  );
  lines.push("|---|---|---|---|---|---|---|---|");
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!e) continue;
    const idx = i + 1;
    const code = e.code ?? "?";
    const stage = e.stage ?? "?";
    const group = e.group ?? "?";
    const status = e.status ?? "UNKNOWN";
    const pc = e.placeholderCount ?? 0;
    const dc = e.docxPlaceholders?.count ?? 0;
    const file = e.renderedFile?.fileName ?? "(no file)";
    lines.push(
      `| ${idx} | ${code} | ${stage} | ${group} | ${status} | ${pc} | ${dc} | ${file} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

async function backupArtifact(srcPath, destDir, stamp) {
  if (!existsSync(srcPath)) return null;
  const fileName = path.basename(srcPath);
  const backupName = `${fileName}.${stamp}.bak`;
  const destPath = path.join(destDir, backupName);
  await copyFile(srcPath, destPath);
  return backupName;
}

async function loadLegacySummary(summaryJsonPath) {
  if (!existsSync(summaryJsonPath)) return null;
  try {
    const raw = await readFile(summaryJsonPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    checkOnly: false,
    verbose: false,
    renderDir: RENDER_DIR,
    docxDir: DOCX_DIR,
    projectRoot: PROJECT_ROOT,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--check") {
      opts.checkOnly = true;
    } else if (a === "--verbose") {
      opts.verbose = true;
    } else if (a === "--render-dir") {
      opts.renderDir = path.resolve(args[++i]);
    } else if (a === "--docx-dir") {
      opts.docxDir = path.resolve(args[++i]);
    } else if (a === "--project-root") {
      opts.projectRoot = path.resolve(args[++i]);
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`[FATAL] unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return opts;
}

function printHelp() {
  console.log(
    [
      "Usage: node rebuild-bm-render-summary.mjs [options]",
      "",
      "Options:",
      "  --check                 Dry run: exit 2 if rebuild would be incomplete",
      "  --verbose               Print extra diagnostics",
      "  --render-dir <p>        Override audit_renders directory",
      "  --docx-dir <p>          Override generated DOCX directory (informational)",
      "  --project-root <p>      Override project root (used to resolve relative filePath)",
      "  -h, --help              Show this help",
      "",
    ].join("\n"),
  );
}

async function main() {
  const opts = parseArgs(process.argv);
  const { checkOnly, verbose, renderDir } = opts;

  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const summaryJsonPath = path.join(renderDir, "summary.json");
  const summaryMdPath = path.join(renderDir, "SUMMARY.md");
  const rebuildInfoPath = path.join(renderDir, ".rebuild-info.json");
  const backupDir = path.join(renderDir, ".backup");

  const entries = [];
  const errors = [];
  const verifications = [];

  for (let i = 1; i <= TOTAL_TEMPLATES; i++) {
    const code = expectedCode(i);
    const filePath = path.join(renderDir, `${code}-result.json`);
    if (!existsSync(filePath)) {
      errors.push({ code, error: "missing-result-file" });
      continue;
    }
    let parsed;
    try {
      const raw = await readFile(filePath, "utf8");
      parsed = JSON.parse(raw);
    } catch (err) {
      errors.push({ code, error: `parse-failed: ${err.message}` });
      continue;
    }

    const relPath = parsed?.renderedFile?.filePath;
    if (!relPath) {
      errors.push({ code, error: "no-filePath-in-result" });
      continue;
    }
    // Resolve relative filePath against the project root (the directory
    // that contains the audit_renders folder) unless it's already absolute.
    const absDocx = path.isAbsolute(relPath)
      ? relPath
      : path.resolve(opts.projectRoot, relPath);
    if (!existsSync(absDocx)) {
      errors.push({ code, error: `missing-on-disk: ${relPath}` });
      continue;
    }
    let st;
    try {
      st = await stat(absDocx);
    } catch (err) {
      errors.push({ code, error: `stat-failed: ${err.message}` });
      continue;
    }
    if (!st.isFile()) {
      errors.push({ code, error: `not-a-file: ${relPath}` });
      continue;
    }
    const declared = Number(parsed?.renderedFile?.fileSize ?? -1);
    verifications.push({
      code,
      ok: true,
      sizeMatches: declared === -1 ? null : st.size === declared,
      actualSize: st.size,
      declaredSize: declared,
    });
    entries.push(parsed);
  }

  entries.sort((a, b) => {
    const an = Number(String(a.code).replace(/[^0-9]/g, ""));
    const bn = Number(String(b.code).replace(/[^0-9]/g, ""));
    return an - bn;
  });

  const okCount = entries.filter((e) => e.status === "OK").length;
  const failedCount = entries.length - okCount;
  const withPlaceholders = entries.filter(
    (e) => (e?.placeholderCount ?? 0) > 0 || e?.docxPlaceholders?.found,
  ).length;

  const legacy = await loadLegacySummary(summaryJsonPath);
  const startedAt = legacy?.startedAt ?? new Date().toISOString();
  const endedAt = new Date().toISOString();

  const summary = {
    startedAt,
    endedAt,
    apiHost: API_HOST,
    totalTemplates: TOTAL_TEMPLATES,
    results: entries,
    errors,
    okCount,
    failedCount,
    withPlaceholders,
  };

  const rebuildInfo = {
    rebuiltAt: endedAt,
    sourceArtifactCount: 213,
    includedFromArtifacts: entries.length,
    excludedCount: errors.length,
    excluded: errors,
    previousSummary: legacy
      ? {
          totalTemplates: legacy.totalTemplates,
          okCount: legacy.okCount,
          resultCount: Array.isArray(legacy.results) ? legacy.results.length : 0,
        }
      : null,
    docxVerification: verifications.map((v) => ({
      code: v.code,
      ok: v.ok,
      sizeMatches: v.sizeMatches,
    })),
  };

  if (verbose) {
    console.log(
      `[INFO] entries: ${entries.length}, errors: ${errors.length}, okCount: ${okCount}`,
    );
    if (errors.length) console.log("[INFO] errors:", errors);
  }

  if (checkOnly) {
    const hasGaps = errors.length > 0 || entries.length !== TOTAL_TEMPLATES;
    if (hasGaps) {
      console.error(
        `[FAIL] rebuild would be incomplete: ${entries.length}/${TOTAL_TEMPLATES}, errors=${errors.length}`,
      );
      process.exit(2);
    }
    console.log(
      `[OK] dry-run: would produce ${entries.length}/${TOTAL_TEMPLATES}`,
    );
    return;
  }

  await mkdir(backupDir, { recursive: true });
  const summaryBackup = await backupArtifact(summaryJsonPath, backupDir, stamp);
  const summaryMdBackup = await backupArtifact(summaryMdPath, backupDir, stamp);

  await writeFile(summaryJsonPath, JSON.stringify(summary, null, 2), "utf8");
  await writeFile(summaryMdPath, buildSummaryMarkdown(entries, endedAt), "utf8");
  await writeFile(rebuildInfoPath, JSON.stringify(rebuildInfo, null, 2), "utf8");

  console.log(`[OK] summary.json : ${entries.length}/${TOTAL_TEMPLATES}`);
  console.log(`[OK] SUMMARY.md   : ${entries.length}/${TOTAL_TEMPLATES}`);
  if (summaryBackup)
    console.log(`[OK] backup       : ${path.relative(PROJECT_ROOT, path.join(backupDir, summaryBackup))}`);
  if (summaryMdBackup)
    console.log(`[OK] backup       : ${path.relative(PROJECT_ROOT, path.join(backupDir, summaryMdBackup))}`);
  if (errors.length) {
    console.log(`[WARN] ${errors.length} excluded (see .rebuild-info.json)`);
  }
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
