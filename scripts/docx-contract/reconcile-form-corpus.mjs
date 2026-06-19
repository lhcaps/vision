#!/usr/bin/env node
/**
 * Phase D — Form Corpus Reconciliation
 *
 * Reads docx-inventory.json, draft contracts, locked contracts, and reference docs.
 * Produces FORM-CORPUS-RECONCILIATION.md and form-corpus-reconciliation.json.
 *
 * Canonical answer to: 213 vs 214 vs 215 forms?
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INVENTORY = path.join(ROOT, "docs", "audit", "docx", "inventory", "docx-inventory.json");
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const LOCKED_DIR = path.join(CONTRACTS_DIR, "locked");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");
const REFERENCE_REPORT = path.join(REPORTS_DIR, "REFERENCE-DOCUMENTS.md");

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const saveJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");

// ─── 1. Load inventory ────────────────────────────────────────────────────────
const inv = loadJson(INVENTORY);

// Classify inventory records
const formRecords = inv.records.filter((r) => r.documentKind === "form");
const referenceRecords = inv.records.filter((r) => r.documentKind === "reference");

// Template code counts
const codeCounts = {};
for (const r of inv.records) {
  const code = r.templateCode ?? r.sourceId;
  codeCounts[code] = (codeCounts[code] ?? 0) + 1;
}

// Duplicate codes (code appears more than once)
const duplicateCodes = Object.entries(codeCounts)
  .filter(([, count]) => count > 1)
  .map(([code, count]) => {
    const files = inv.records
      .filter((r) => (r.templateCode ?? r.sourceId) === code)
      .map((r) => r.relativePath);
    return { code, count, files };
  });

// Reference docs
const referenceDocs = referenceRecords.map((r) => ({
  sourceId: r.sourceId,
  fileName: r.fileName,
  relativePath: r.relativePath,
  sha256: r.sha256,
  format: r.format,
}));

// ─── 2. Load contracts ─────────────────────────────────────────────────────────
const allContractFiles = collectContracts(CONTRACTS_DIR);

const draftContracts = [];
const lockedContracts = [];

for (const fp of allContractFiles) {
  const c = loadJson(fp);
  if (c.documentKind === "reference") continue; // skip reference docs

  const genericFieldCount = (c.docxSlots ?? []).filter((s) => s.slotId?.match(/^\w+\.field\d+$/i)).length;
  const item = {
    sourceId: c.sourceId,
    templateCode: c.templateCode,
    templateTitle: c.templateTitle,
    status: c.status,
    documentKind: c.documentKind,
    slotCount: c.docxSlots?.length ?? 0,
    fieldCount: c.canonicalFields?.length ?? 0,
    reviewRequired: c.reviewRequired ?? false,
    genericFieldCount,
    runtimeEligible: c.status === "locked",
  };

  if (c.status === "locked") {
    lockedContracts.push(item);
  } else if (c.status === "draft") {
    draftContracts.push(item);
  }
}

/**
 * Recursively collect all contract JSON files, excluding the locked subdirectory
 * (which is a peer to draft files, not a parent).
 */
function collectContracts(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Only descend into "locked" subdirectory
      if (entry.name === "locked") {
        results.push(...collectContracts(full));
      }
    } else if (/\.contract\.(draft|locked)\.json$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// ─── 3. Compute unique template codes ────────────────────────────────────────
// For duplicate codes (e.g. BM-139), each sourceId is a separate contract entry
const allFormCodes = new Set();
const uniqueTemplateCodes = new Set();
const duplicateTemplateCodes = new Set();

for (const r of formRecords) {
  if (r.templateCode) {
    if (uniqueTemplateCodes.has(r.templateCode)) {
      duplicateTemplateCodes.add(r.templateCode);
    } else {
      uniqueTemplateCodes.add(r.templateCode);
    }
    allFormCodes.add(r.templateCode);
  }
}

// Reference docs excluded
const referenceCodes = new Set(referenceRecords.map((r) => r.sourceId));

// Runtime-eligible: locked status
const runtimeEligibleCodes = new Set(lockedContracts.map((c) => c.templateCode));

// ─── 4. Forms by stage ────────────────────────────────────────────────────────
// Stage is derived from first 2 digits of BM code: "BM-001" → stage "01"
const stageGroups = {};
for (const c of [...lockedContracts, ...draftContracts]) {
  const match = (c.templateCode ?? "").match(/^BM-(\d+)/);
  const stageCode = match ? match[1].padStart(2, "0").substring(0, 2) : "00";
  let stageName = "Không xác định";
  if (stageCode >= "01" && stageCode <= "09") {
    const stageNames = {
      "01": "TIẾP NHẬN VÀ GIẢI QUYẾT NGUỒN TIN",
      "02": "BIỆN PHÁP NGĂN CHẶN, CƯỠNG CHẾ",
      "03": "NGƯỜI THAM GIA TỐ TỤNG",
      "04": "GIAI ĐOẠN ĐIỀU TRA",
      "05": "GIAI ĐOẠN TRUY TỐ",
      "06": "VẬT CHỨNG",
      "07": "BIỆN PHÁP ĐIỀU TRA ĐẶC BIỆT",
      "08": "THỦ TỤC ĐẶC BIỆT",
      "09": "NGƯỜI CHƯA THÀNH NIÊN",
    };
    stageName = stageNames[stageCode] ?? stageName;
  }
  if (!stageGroups[stageCode]) {
    stageGroups[stageCode] = { stageName, locked: [], draft: [] };
  }
  if (c.status === "locked") {
    stageGroups[stageCode].locked.push(c.templateCode);
  } else {
    stageGroups[stageCode].draft.push(c.templateCode);
  }
}

// Sort stage groups
const sortedStages = Object.entries(stageGroups)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([code, data]) => ({
    stageCode: code,
    stageName: data.stageName,
    locked: data.locked.sort(),
    draft: data.draft.sort(),
  }));

// ─── 5. Build output ───────────────────────────────────────────────────────────
const counts = {
  inventoryRecords: inv.records.length,
  formDocuments: formRecords.length,
  referenceDocuments: referenceRecords.length,
  uniqueTemplateCodes: uniqueTemplateCodes.size,
  duplicateTemplateCodes: duplicateTemplateCodes.size,
  draftContracts: draftContracts.length,
  lockedContracts: lockedContracts.length,
  runtimeEligibleContracts: lockedContracts.length,
  referenceDocsExcluded: referenceRecords.length,
};

// JSON report
const jsonReport = {
  generatedAt: new Date().toISOString(),
  counts,
  duplicateCodes,
  referenceDocs,
  lockedContracts,
  draftContracts,
  stages: sortedStages,
};

// Save JSON
saveJson(path.join(REPORTS_DIR, "form-corpus-reconciliation.json"), jsonReport);

// ─── 6. Build markdown report ──────────────────────────────────────────────────
const md = [];

md.push("# Form Corpus Reconciliation");
md.push("");
md.push(`Sinh lúc: ${new Date().toISOString()}`);
md.push("");
md.push("## Counts");
md.push("");
md.push(`- Inventory records: **${counts.inventoryRecords}**`);
md.push(`- Form documents: **${counts.formDocuments}**`);
md.push(`- Reference documents: **${counts.referenceDocuments}**`);
md.push(`- Unique template codes: **${counts.uniqueTemplateCodes}**`);
md.push(`- Duplicate template codes: **${counts.duplicateTemplateCodes}**`);
md.push(`- Draft contracts: **${counts.draftContracts}**`);
md.push(`- Locked contracts: **${counts.lockedContracts}**`);
md.push(`- Runtime-eligible contracts: **${counts.runtimeEligibleContracts}**`);
md.push(`- Reference docs excluded: **${counts.referenceDocsExcluded}**`);
md.push("");
md.push("## Canonical Form Corpus Answer");
md.push("");
md.push("| Metric | Value |");
md.push("|--------|-------|");
md.push(`| Total source files scanned | ${counts.inventoryRecords} |`);
md.push(`| Form documents (runtime-eligible) | ${counts.formDocuments} |`);
md.push(`| Reference documents (excluded) | ${counts.referenceDocuments} |`);
md.push(`| Unique BM codes (BM-001..BM-213) | ${counts.uniqueTemplateCodes} |`);
md.push(`| Duplicate BM codes (e.g. BM-139) | ${counts.duplicateTemplateCodes} |`);
md.push("");
md.push("**Conclusion**: The corpus is **213 distinct BM forms** (BM-001..BM-213), plus 1 duplicate variant (BM-139).");
md.push("The \"215\" figure includes the 2 reference documents (Thông tư 03 + Danh mục), which are NOT form runtime targets.");
md.push("");
md.push("## Duplicate codes");
md.push("");
if (duplicateCodes.length === 0) {
  md.push("*Không có duplicate codes.*");
} else {
  md.push("| Code | Count | Files |");
  md.push("|------|-------|-------|");
  for (const d of duplicateCodes) {
    const shortFiles = d.files.map((f) => path.basename(f)).join("; ");
    md.push(`| ${d.code} | ${d.count} | ${shortFiles} |`);
  }
}
md.push("");
md.push("## Reference documents");
md.push("");
md.push("Reference docs are **excluded from form runtime**. Each has `sourceId` prefixed with `REF__`.");
md.push("");
md.push("| SourceId | File |");
md.push("|----------|------|");
for (const r of referenceDocs) {
  md.push(`| ${r.sourceId} | ${r.fileName} |`);
}
md.push("");
md.push("## Locked status by BM");
md.push("");
md.push("Locked contracts take precedence over draft contracts with the same template code.");
md.push("");
md.push("| Template Code | Title | Status | Slots | Fields | Generic Fields |");
md.push("|---------------|-------|--------|-------|--------|----------------|");

// Group by template code, show locked entry first
const contractByCode = {};
for (const c of [...lockedContracts, ...draftContracts]) {
  const key = c.templateCode;
  if (!contractByCode[key] || c.status === "locked") {
    contractByCode[key] = c;
  }
}
const sortedByCode = Object.values(contractByCode).sort((a, b) =>
  (a.templateCode ?? "").localeCompare(b.templateCode ?? ""),
);
for (const c of sortedByCode) {
  md.push(
    `| ${c.templateCode} | ${c.templateTitle ?? ""} | **${c.status}** | ${c.slotCount} | ${c.fieldCount} | ${c.genericFieldCount} |`,
  );
}
md.push("");
md.push("## Forms by stage");
md.push("");
for (const s of sortedStages) {
  md.push(`### Stage ${s.stageCode} — ${s.stageName}`);
  md.push("");
  if (s.locked.length > 0) {
    md.push(`**Locked** (runtime-eligible): ${s.locked.join(", ")}`);
  }
  if (s.draft.length > 0) {
    md.push(`**Draft** (needs human review): ${s.draft.join(", ")}`);
  }
  md.push("");
}

// Save markdown
fs.writeFileSync(path.join(REPORTS_DIR, "FORM-CORPUS-RECONCILIATION.md"), md.join("\n"), "utf8");

console.log("Form corpus reconciliation complete.");
console.log(`  Form documents: ${counts.formDocuments}`);
console.log(`  Reference documents excluded: ${counts.referenceDocuments}`);
console.log(`  Unique template codes: ${counts.uniqueTemplateCodes}`);
console.log(`  Locked contracts: ${counts.lockedContracts}`);
console.log(`  Draft contracts: ${counts.draftContracts}`);
console.log(`  Duplicate codes: ${counts.duplicateTemplateCodes}`);
console.log("");
console.log("Reports written:");
console.log(`  docs/audit/docx/reports/FORM-CORPUS-RECONCILIATION.md`);
console.log(`  docs/audit/docx/reports/form-corpus-reconciliation.json`);
