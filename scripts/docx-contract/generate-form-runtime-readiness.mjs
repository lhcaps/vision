#!/usr/bin/env node
/**
 * Phase D — Form runtime readiness report.
 *
 * Analyzes all draft contracts and produces a readiness scorecard:
 * - Total forms
 * - Locked / draft counts
 * - Generic field counts
 * - Forms grouped by stage
 * - Top 20 forms with highest generic field count
 * - Recommended next review batch
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const LOCKED_DIR = path.join(CONTRACTS_DIR, "locked");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const saveJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");

const FORM_STAGES = [
  { code: "01", label: "Tiếp nhận và giải quyết nguồn tin", bmRange: [1, 30] },
  { code: "02", label: "Biện pháp ngăn chặn, cưỡng chế", bmRange: [31, 69] },
  { code: "03", label: "Người tham gia tố tụng", bmRange: [70, 84] },
  { code: "04", label: "Giai đoạn điều tra", bmRange: [85, 140] },
  { code: "05", label: "Giai đoạn truy tố", bmRange: [141, 168] },
  { code: "06", label: "Vật chứng", bmRange: [169, 173] },
  { code: "07", label: "Biện pháp điều tra đặc biệt", bmRange: [174, 178] },
  { code: "08", label: "Thủ tục đặc biệt", bmRange: [179, 184] },
  { code: "09", label: "Người chưa thành niên", bmRange: [185, 213] },
];

function getStage(bmCode) {
  const match = (bmCode ?? "").match(/^BM-(\d+)/);
  if (!match) return "00";
  const n = parseInt(match[1], 10);
  const s = FORM_STAGES.find((s) => n >= s.bmRange[0] && n <= s.bmRange[1]);
  return s?.code ?? "00";
}

function collectContracts(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "locked") results.push(...collectContracts(full));
    } else if (/\.contract\.(draft|locked)\.json$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function analyzeContract(fp) {
  const c = loadJson(fp);
  if (c.documentKind === "reference") return null;

  const slots = c.docxSlots ?? [];
  const fields = c.canonicalFields ?? [];
  const genericFieldCount = slots.filter(
    (s) => /^\w+\.field\d+$/i.test(s.slotId),
  ).length;
  const unknownFields = fields.filter((f) => f.source === "unknown").length;
  const reviewRequiredSlots = slots.filter((s) => s.reviewRequired).length;

  return {
    sourceId: c.sourceId,
    templateCode: c.templateCode,
    templateTitle: c.templateTitle,
    status: c.status,
    slotCount: slots.length,
    fieldCount: fields.length,
    genericFieldCount,
    unknownFields,
    reviewRequiredSlots,
    runtimeEligible: c.status === "locked",
    stage: getStage(c.templateCode),
  };
}

function main() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const allFiles = collectContracts(CONTRACTS_DIR);
  const contracts = allFiles
    .map((fp) => analyzeContract(fp))
    .filter(Boolean);

  // Prefer locked over draft for each template code
  const byCode = {};
  for (const c of contracts) {
    const key = c.templateCode;
    if (!byCode[key] || c.status === "locked") {
      byCode[key] = c;
    }
  }

  const all = Object.values(byCode);
  const locked = all.filter((c) => c.status === "locked");
  const draft = all.filter((c) => c.status === "draft");

  // Generic field stats
  const withGeneric = draft.filter((c) => c.genericFieldCount > 0);
  const zeroGeneric = draft.filter((c) => c.genericFieldCount === 0);
  const totalGeneric = draft.reduce((sum, c) => sum + c.genericFieldCount, 0);

  // Top 20 by generic field count
  const top20 = [...draft]
    .sort((a, b) => b.genericFieldCount - a.genericFieldCount)
    .slice(0, 20);

  // By stage
  const byStage = {};
  for (const s of FORM_STAGES) {
    byStage[s.code] = {
      stageCode: s.code,
      stageLabel: s.label,
      locked: [],
      draft: [],
    };
  }

  for (const c of all) {
    const stage = c.stage ?? "00";
    if (!byStage[stage]) {
      byStage[stage] = { stageCode: stage, stageLabel: "Không xác định", locked: [], draft: [] };
    }
    if (c.status === "locked") {
      byStage[stage].locked.push(c.templateCode);
    } else {
      byStage[stage].draft.push(c.templateCode);
    }
  }

  // Unknown source count
  const unknownSourceCount = draft.reduce((sum, c) => sum + c.unknownFields, 0);

  // Review required count
  const reviewRequiredCount = draft.reduce((sum, c) => sum + c.reviewRequiredSlots, 0);

  // Recommended next batch: forms with fewest generic fields (easiest to lock)
  const easyBatch = [...draft]
    .filter((c) => c.genericFieldCount > 0)
    .sort((a, b) => a.genericFieldCount - b.genericFieldCount)
    .slice(0, 10);

  const counts = {
    total: all.length,
    locked: locked.length,
    draft: draft.length,
    genericFieldCount: totalGeneric,
    unknownSourceCount,
    reviewRequiredCount,
    runtimeEligible: locked.length,
    blockedForms: draft.length,
  };

  const json = {
    generatedAt: new Date().toISOString(),
    counts,
    byStage: Object.values(byStage).sort((a, b) =>
      a.stageCode.localeCompare(b.stageCode),
    ),
    top20ByGenericFields: top20.map((c) => ({
      templateCode: c.templateCode,
      title: c.templateTitle,
      genericFieldCount: c.genericFieldCount,
      stage: c.stage,
    })),
    easyBatch: easyBatch.map((c) => ({
      templateCode: c.templateCode,
      title: c.templateTitle,
      genericFieldCount: c.genericFieldCount,
      stage: c.stage,
    })),
  };

  saveJson(path.join(REPORTS_DIR, "form-runtime-readiness.json"), json);

  const md = [];
  md.push("# Form Runtime Readiness Report");
  md.push("");
  md.push(`Sinh lúc: ${new Date().toISOString()}`);
  md.push("");
  md.push("## Summary");
  md.push("");
  md.push(`- Total forms: **${counts.total}**`);
  md.push(`- Locked (runtime-eligible): **${counts.locked}**`);
  md.push(`- Draft (needs review): **${counts.draft}**`);
  md.push(`- Total generic \`.field#\` slots across drafts: **${counts.genericFieldCount}**`);
  md.push(`- Unknown source field count: **${counts.unknownSourceCount}**`);
  md.push(`- Review-required slots: **${counts.reviewRequiredCount}**`);
  md.push("");
  md.push("## Runtime Eligibility");
  md.push("");
  md.push("| Status | Count | Notes |");
  md.push("|--------|-------|-------|");
  md.push(`| **Locked** (production-ready) | ${counts.locked} | ${counts.locked > 0 ? "BM-001, BM-002, BM-003" : "None"} |`);
  md.push(`| **Draft** (needs human review) | ${counts.draft} | Not eligible for production create/save/render |`);
  md.push(`| **Reference docs** | 2 | Excluded from form runtime |`);
  md.push("");
  md.push("## Forms by Stage");
  md.push("");
  md.push("| Stage | Label | Locked | Draft | Total |");
  md.push("|-------|-------|--------|-------|-------|");
  for (const [stageCode, data] of Object.entries(byStage).sort(([a], [b]) => a.localeCompare(b))) {
    const total = (data.locked?.length ?? 0) + (data.draft?.length ?? 0);
    md.push(`| ${stageCode} | ${data.stageLabel} | ${data.locked?.length ?? 0} | ${data.draft?.length ?? 0} | ${total} |`);
  }
  md.push("");
  md.push("## Top 20 Forms with Highest Generic Field Count");
  md.push("");
  md.push("These forms need the most field mapping work before they can be locked.");
  md.push("");
  md.push("| # | Template Code | Title | Generic Fields | Stage |");
  md.push("|---|--------------|-------|----------------|-------|");
  top20.forEach((c, i) => {
    md.push(`| ${i + 1} | ${c.templateCode} | ${c.templateTitle} | ${c.genericFieldCount} | ${c.stage} |`);
  });
  md.push("");
  md.push("## Recommended Next Review Batch");
  md.push("");
  md.push("Forms with **fewest generic fields** are the easiest to lock next.");
  md.push("Priority order (by ascending generic field count):");
  md.push("");
  md.push("| # | Template Code | Title | Generic Fields | Stage |");
  md.push("|---|--------------|-------|----------------|-------|");
  easyBatch.forEach((c, i) => {
    md.push(`| ${i + 1} | ${c.templateCode} | ${c.templateTitle} | ${c.genericFieldCount} | ${c.stage} |`);
  });
  md.push("");
  md.push("## Batch Unlock Path");
  md.push("");
  md.push("To go from **3 locked** → **213 locked** (full corpus):");
  md.push("");
  md.push("1. **Easy batch** (~10 forms): Most fields already named, just verification needed.");
  md.push("2. **Medium batch** (~50 forms): Some \`.field#\` patterns, moderate mapping work.");
  md.push("3. **Hard batch** (~150 forms): Complex forms with many generic fields, domain knowledge required.");
  md.push("");
  md.push(`Current progress: **${counts.locked}/${counts.total}** forms locked (**${((counts.locked / counts.total) * 100).toFixed(1)}%**).`);

  fs.writeFileSync(path.join(REPORTS_DIR, "FORM-RUNTIME-READINESS.md"), md.join("\n"), "utf8");

  console.log("Form runtime readiness complete.");
  console.log(`  Total forms: ${counts.total}`);
  console.log(`  Locked: ${counts.locked}`);
  console.log(`  Draft: ${counts.draft}`);
  console.log(`  Total generic fields: ${counts.genericFieldCount}`);
  console.log("");
  console.log("Reports written:");
  console.log(`  docs/audit/docx/reports/FORM-RUNTIME-READINESS.md`);
  console.log(`  docs/audit/docx/reports/form-runtime-readiness.json`);
}

main();
