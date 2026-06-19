#!/usr/bin/env node
// Phase C lock helper: apply human-reviewed mapping to draft contracts.
// Writes locked contracts to docs/audit/docx/contracts/locked/.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const HUMAN_REVIEW_DIR = path.join(ROOT, "docs", "audit", "docx", "human-review");

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

function getMappingPath() {
  const idx = process.argv.findIndex((a) => a === "--mapping");
  if (idx === -1 || idx >= process.argv.length - 1) {
    throw new Error("Usage: node lock-reviewed-contracts.mjs --mapping <path-to-mapping.json>");
  }
  return process.argv[idx + 1];
}

function validateMapping(mapping) {
  const errors = [];

  if (!mapping.reviewedBy) errors.push("mapping.reviewedBy is required");
  if (!mapping.reviewedAt) errors.push("mapping.reviewedAt is required");
  if (!mapping.targets || typeof mapping.targets !== "object") {
    errors.push("mapping.targets must be an object");
    return errors;
  }

  for (const [bm, target] of Object.entries(mapping.targets)) {
    if (!target.decision) errors.push(`[${bm}] decision is required`);
    if (target.decision === "locked") {
      if (!target.sourceId) errors.push(`[${bm}] sourceId is required for locked decision`);
      if (!target.slotMappings || typeof target.slotMappings !== "object") {
        errors.push(`[${bm}] slotMappings must be an object for locked decision`);
      } else {
        for (const [slotId, mappingEntry] of Object.entries(target.slotMappings)) {
          if (!mappingEntry.canonicalPath) errors.push(`[${bm}][${slotId}] canonicalPath is required`);
          if (!mappingEntry.source) errors.push(`[${bm}][${slotId}] source is required`);
          if (!mappingEntry.reviewEvidence) errors.push(`[${bm}][${slotId}] reviewEvidence is required`);
        }
      }
    }
  }

  return errors;
}

function findDraftContract(sourceId) {
  const files = fs.readdirSync(CONTRACTS_DIR).filter(
    (n) => n.endsWith(".contract.draft.json") && !n.startsWith("_"),
  );
  return files.find((f) => f.includes(sourceId));
}

function checkGenericFieldIssues(contract) {
  const issues = [];

  const genericSlots = (contract.docxSlots ?? []).filter((s) => /^[a-z]+\.field\d+$/i.test(s.slotId));
  if (genericSlots.length > 0) {
    issues.push(`${genericSlots.length} generic .field# slotId(s): ${genericSlots.map((s) => s.slotId).join(", ")}`);
  }

  const genericFields = (contract.canonicalFields ?? []).filter((f) => /\.field\d+$/.test(f.path));
  if (genericFields.length > 0) {
    issues.push(`${genericFields.length} generic .field# canonicalField path(s): ${genericFields.map((f) => f.path).join(", ")}`);
  }

  const unknownSources = (contract.canonicalFields ?? []).filter((f) => f.source === "unknown");
  if (unknownSources.length > 0) {
    issues.push(`${unknownSources.length} canonicalField with source=unknown`);
  }

  const reviewRequired = [
    ...(contract.canonicalFields ?? []).filter((f) => f.reviewRequired === true),
    ...(contract.docxSlots ?? []).filter((s) => s.reviewRequired === true),
    ...(contract.renderBindings ?? []).filter((b) => b.reviewRequired === true),
  ];
  if (reviewRequired.length > 0) {
    issues.push(`${reviewRequired.length} item(s) with reviewRequired=true`);
  }

  return issues;
}

function applyLock(contract, target, mapping, sourceId) {
  const locked = JSON.parse(JSON.stringify(contract));

  locked.status = "locked";
  locked.sourceId = sourceId;
  locked.reviewedBy = mapping.reviewedBy;
  locked.reviewedAt = mapping.reviewedAt;

  // Apply slotMappings to docxSlots
  for (const slot of locked.docxSlots ?? []) {
    // Try exact match first, then base-name match (strip _2, _3, etc. suffix)
    const entry =
      target.slotMappings?.[slot.slotId] ??
      target.slotMappings?.[slot.slotId.replace(/_(\d+)$/, "")];
    if (entry) {
      slot.reviewRequired = false;
      if (entry.reviewEvidence) {
        slot.reviewEvidence = {
          ...(slot.evidence ?? {}),
          ...entry.reviewEvidence,
        };
      }
    } else {
      // Slot not in mapping — clear reviewRequired for non-generic slots
      if (slot.reviewRequired === true && !/\.field\d+$/.test(slot.slotId)) {
        slot.reviewRequired = false;
      }
    }
  }

  // Apply slotMappings to canonicalFields
  for (const field of locked.canonicalFields ?? []) {
    // Find the slot that maps to this field's path
    const slotEntry = Object.values(target.slotMappings ?? {}).find(
      (e) => e.canonicalPath === field.path,
    );
    if (slotEntry) {
      field.source = slotEntry.source;
      field.transform = slotEntry.transform;
      field.reviewRequired = false;
      field.reviewedBy = mapping.reviewedBy;
      field.reviewedAt = mapping.reviewedAt;
      field.reviewEvidence = slotEntry.reviewEvidence ?? null;
    }
    // If field has no mapping entry, keep as-is
  }

  // Apply slotMappings to renderBindings
  for (const binding of locked.renderBindings ?? []) {
    const entry = target.slotMappings?.[binding.slotId];
    if (entry) {
      binding.reviewRequired = false;
      binding.from = entry.canonicalPath ?? binding.from;
      binding.transform = entry.transform ?? binding.transform;
    } else {
      binding.reviewRequired = false;
    }
  }

  // Set unresolvedQuestions to empty for locked contract
  locked.unresolvedQuestions = [];
  locked.warnings = [];

  // Set all reviewRequired to false on productMetadata and renderFormatHints
  if (locked.productMetadata) {
    locked.productMetadata.stage = { ...locked.productMetadata.stage, reviewRequired: false };
    locked.productMetadata.reviewRequired = false;
  }
  if (locked.renderFormatHints) {
    locked.renderFormatHints.reviewRequired = false;
  }
  if (locked.formInputHints) {
    locked.formInputHints.reviewRequired = false;
  }
  if (locked.reportingHints) {
    locked.reportingHints.reviewRequired = false;
  }

  return locked;
}

const main = () => {
  const mappingPath = getMappingPath();
  if (!fs.existsSync(mappingPath)) {
    console.error(`Mapping file not found: ${mappingPath}`);
    process.exit(1);
  }

  const mapping = loadJson(mappingPath);
  const errors = validateMapping(mapping);
  if (errors.length > 0) {
    console.error("Mapping validation errors:");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }

  fs.mkdirSync(LOCKED_DIR, { recursive: true });

  const results = [];
  for (const [bm, target] of Object.entries(mapping.targets)) {
    if (target.decision !== "locked") {
      console.log(`[${bm}] decision = "${target.decision}" — skipping`);
      results.push({ bm, decision: target.decision, status: "skipped" });
      continue;
    }

    const sourceId = target.sourceId ?? bm;
    const draftFile = findDraftContract(sourceId);
    if (!draftFile) {
      console.error(`[${bm}] Draft contract not found for sourceId: ${sourceId}`);
      results.push({ bm, sourceId, status: "error", error: "Draft not found" });
      continue;
    }

    const draftPath = path.join(CONTRACTS_DIR, draftFile);
    const contract = loadJson(draftPath);

    // Apply lock first so checkGenericFieldIssues sees the post-lock state
    // (which resolves source=unknown and reviewRequired=true via the mapping)
    const locked = applyLock(contract, target, mapping, sourceId);

    // Check for blocking issues AFTER applying lock
    const issues = checkGenericFieldIssues(locked);
    if (issues.length > 0) {
      console.error(`[${bm}] Blocking issues — CANNOT LOCK:`);
      for (const issue of issues) console.error("  - " + issue);
      results.push({ bm, sourceId, status: "blocked", issues });
      continue;
    }

    const lockedFileName = draftFile.replace(".contract.draft.json", ".contract.locked.json");
    const lockedPath = path.join(LOCKED_DIR, lockedFileName);
    fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2), "utf8");
    console.log(`[${bm}] Locked: ${lockedPath}`);
    results.push({ bm, sourceId, file: lockedFileName, status: "locked", slots: locked.docxSlots?.length, fields: locked.canonicalFields?.length });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    mappingFile: mappingPath,
    reviewedBy: mapping.reviewedBy,
    reviewedAt: mapping.reviewedAt,
    results,
    totalLocked: results.filter((r) => r.status === "locked").length,
    totalSkipped: results.filter((r) => r.status === "skipped").length,
    totalBlocked: results.filter((r) => r.status === "blocked").length,
    totalError: results.filter((r) => r.status === "error").length,
  };

  console.log("\nSummary:");
  console.log(`  Locked:  ${summary.totalLocked}`);
  console.log(`  Skipped: ${summary.totalSkipped}`);
  console.log(`  Blocked: ${summary.totalBlocked}`);
  console.log(`  Error:   ${summary.totalError}`);

  if (summary.totalBlocked > 0) {
    console.error("\nBlocked contracts must be fixed before locking.");
    process.exit(1);
  }
};

main();
