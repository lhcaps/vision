#!/usr/bin/env node
// Phase C: verify locked contracts.
// Checks docs/audit/docx/contracts/locked/*.contract.locked.json

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");
const FIELD_TAXONOMY = path.join(ROOT, "docs", "contracts", "field-taxonomy.json");
const SOURCE_TAXONOMY = path.join(ROOT, "docs", "contracts", "source-taxonomy.json");
const TRANSFORM_TAXONOMY = path.join(ROOT, "docs", "contracts", "transform-taxonomy.json");

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const PASS = [];
const FAIL = [];
const WARN = [];

const check = (label, condition, detail) => {
  if (condition) {
    PASS.push({ label, detail: null });
  } else {
    FAIL.push({ label, detail: detail ?? null });
  }
};

const warn = (label, detail) => {
  WARN.push({ label, detail: detail ?? null });
};

const main = () => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const namespaces = new Set(Object.keys(loadJson(FIELD_TAXONOMY).namespaces));
  const allowedSources = new Set(loadJson(SOURCE_TAXONOMY).allowed.map((s) => s.value));
  const transforms = loadJson(TRANSFORM_TAXONOMY).transforms;

  if (!fs.existsSync(LOCKED_DIR)) {
    console.error("Locked contracts directory does not exist: " + LOCKED_DIR);
    process.exit(1);
  }

  const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
    (n) => n.endsWith(".contract.locked.json") && !n.startsWith("_"),
  );

  if (lockedFiles.length === 0) {
    console.error("No locked contracts found in " + LOCKED_DIR);
    process.exit(1);
  }

  const results = [];

  for (const f of lockedFiles) {
    const lockedPath = path.join(LOCKED_DIR, f);
    let contract;
    try {
      contract = loadJson(lockedPath);
    } catch (e) {
      FAIL.push({ label: `[${f}] Failed to parse JSON`, detail: e.message });
      results.push({ file: f, status: "error", error: e.message });
      continue;
    }

    const bm = contract.templateCode ?? f;

    // Schema-level checks
    check(`[${bm}] status === "locked"`, contract.status === "locked",
      "got: " + contract.status);
    check(`[${bm}] schemaVersion === "1.0"`, contract.schemaVersion === "1.0",
      "got: " + contract.schemaVersion);
    check(`[${bm}] templateCode present`, Boolean(contract.templateCode),
      contract.templateCode ?? "(missing)");
    check(`[${bm}] docxSlots present`, Array.isArray(contract.docxSlots),
      typeof contract.docxSlots);
    check(`[${bm}] canonicalFields present`, Array.isArray(contract.canonicalFields),
      typeof contract.canonicalFields);
    check(`[${bm}] renderBindings present`, Array.isArray(contract.renderBindings),
      typeof contract.renderBindings);

    // Lock criteria checks
    const unknownSource = (contract.canonicalFields ?? []).filter((f) => f.source === "unknown");
    check(`[${bm}] No source=unknown`, unknownSource.length === 0,
      unknownSource.length > 0 ? unknownSource.map((f) => f.path).join(", ") : null);

    const reviewRequiredFields = (contract.canonicalFields ?? []).filter((f) => f.reviewRequired === true);
    check(`[${bm}] No reviewRequired=true on canonicalFields`, reviewRequiredFields.length === 0,
      reviewRequiredFields.length > 0 ? reviewRequiredFields.map((f) => f.path).join(", ") : null);

    const reviewRequiredSlots = (contract.docxSlots ?? []).filter((s) => s.reviewRequired === true);
    check(`[${bm}] No reviewRequired=true on docxSlots`, reviewRequiredSlots.length === 0,
      reviewRequiredSlots.length > 0 ? reviewRequiredSlots.map((s) => s.slotId).join(", ") : null);

    const reviewRequiredBindings = (contract.renderBindings ?? []).filter((b) => b.reviewRequired === true);
    check(`[${bm}] No reviewRequired=true on renderBindings`, reviewRequiredBindings.length === 0,
      reviewRequiredBindings.length > 0 ? reviewRequiredBindings.map((b) => b.slotId).join(", ") : null);

    const genericSlots = (contract.docxSlots ?? []).filter((s) => /^[a-z]+\.field\d+$/i.test(s.slotId));
    check(`[${bm}] No generic .field# slotIds`, genericSlots.length === 0,
      genericSlots.length > 0 ? genericSlots.map((s) => s.slotId).join(", ") : null);

    const genericFields = (contract.canonicalFields ?? []).filter((f) => /\.field\d+$/.test(f.path));
    check(`[${bm}] No generic .field# canonicalFields`, genericFields.length === 0,
      genericFields.length > 0 ? genericFields.map((f) => f.path).join(", ") : null);

    const unresolved = (contract.unresolvedQuestions ?? []).filter((q) => q && q.trim().length > 0);
    check(`[${bm}] No unresolvedQuestions`, unresolved.length === 0,
      unresolved.length > 0 ? unresolved.join("; ") : null);

    // Review metadata checks
    check(`[${bm}] reviewedBy present`, Boolean(contract.reviewedBy),
      contract.reviewedBy ?? "(missing)");
    check(`[${bm}] reviewedAt present`, Boolean(contract.reviewedAt),
      contract.reviewedAt ?? "(missing)");
    check(`[${bm}] reviewedAt is ISO date`, /^\d{4}-\d{2}-\d{2}T/.test(contract.reviewedAt ?? ""),
      contract.reviewedAt ?? "(missing)");

    // Taxonomy checks
    for (const field of contract.canonicalFields ?? []) {
      const ns = (field.path ?? "").split(".")[0];
      if (ns && !namespaces.has(ns)) {
        FAIL.push({ label: `[${bm}] Non-taxonomy namespace: ${field.path}`, detail: null });
      }
      if (!allowedSources.has(field.source)) {
        FAIL.push({ label: `[${bm}] Non-taxonomy source "${field.source}": ${field.path}`, detail: null });
      }
    }

    for (const b of contract.renderBindings ?? []) {
      if (!transforms[b.transform]) {
        FAIL.push({ label: `[${bm}] Non-taxonomy transform "${b.transform}": ${b.slotId}`, detail: null });
      }
    }

    // SlotId uniqueness
    const slotIds = new Set();
    for (const s of contract.docxSlots ?? []) {
      if (slotIds.has(s.slotId)) {
        FAIL.push({ label: `[${bm}] Duplicate slotId: ${s.slotId}`, detail: null });
      }
      slotIds.add(s.slotId);
    }

    // RenderBinding.slotId must exist in docxSlots
    for (const b of contract.renderBindings ?? []) {
      if (!slotIds.has(b.slotId)) {
        FAIL.push({ label: `[${bm}] RenderBinding slotId not in docxSlots: ${b.slotId}`, detail: null });
      }
    }

    // RenderBinding.from must reference an existing canonicalField path
    const fieldPaths = new Set((contract.canonicalFields ?? []).map((f) => f.path));
    for (const b of contract.renderBindings ?? []) {
      // Simple binding: "canonical.path"
      if (b.from && !b.from.startsWith("{") && !fieldPaths.has(b.from)) {
        FAIL.push({
          label: `[${bm}] RenderBinding.from not in canonicalFields: ${b.slotId} -> ${b.from}`,
          detail: null,
        });
      }
      // Compound binding: "{a:field1,b:field2}"
      if (b.from && b.from.startsWith("{") && b.from.endsWith("}")) {
        const compoundFields = b.from
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().split(":")[1] ?? s.trim());
        for (const cf of compoundFields) {
          if (cf && !fieldPaths.has(cf)) {
            FAIL.push({
              label: `[${bm}] Compound binding field not in canonicalFields: ${b.slotId} -> ${cf}`,
              detail: null,
            });
          }
        }
      }
    }

    // All canonicalFields should be referenced by at least one binding
    const boundFields = new Set();
    for (const b of contract.renderBindings ?? []) {
      if (b.from && !b.from.startsWith("{")) {
        boundFields.add(b.from);
      }
      // Compound binding: "{a:field1,b:field2}"
      if (b.from && b.from.startsWith("{") && b.from.endsWith("}")) {
        const compoundFields = b.from
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().split(":")[1] ?? s.trim());
        for (const cf of compoundFields) {
          if (cf) boundFields.add(cf);
        }
      }
    }
    const unbound = (contract.canonicalFields ?? []).filter((f) => !boundFields.has(f.path));
    if (unbound.length > 0) {
      warn(`[${bm}] CanonicalField(s) not referenced by any binding: ${unbound.map((f) => f.path).join(", ")}`);
    }

    results.push({
      file: f,
      templateCode: contract.templateCode,
      status: contract.status,
      slots: contract.docxSlots?.length ?? 0,
      fields: contract.canonicalFields?.length ?? 0,
      bindings: contract.renderBindings?.length ?? 0,
      unknownSources: unknownSource.length,
      reviewRequired: reviewRequiredFields.length + reviewRequiredSlots.length + reviewRequiredBindings.length,
      genericFields: genericFields.length,
      unresolved: unresolved.length,
    });
  }

  const total = PASS.length + FAIL.length;
  const passRate = total > 0 ? ((PASS.length / total) * 100).toFixed(1) : 0;

  const md = ["# Locked Contracts Verification Report"];
  md.push("");
  md.push("Generated: " + new Date().toISOString());
  md.push("Locked directory: " + LOCKED_DIR);
  md.push("Files checked: " + lockedFiles.length);
  md.push("");
  md.push("## Summary");
  md.push("");
  md.push("- **Pass: " + PASS.length + "** / " + total + " (" + passRate + "%)");
  md.push("- **Fail: " + FAIL.length + "**");
  md.push("- **Warn: " + WARN.length + "**");
  md.push("");

  if (FAIL.length > 0) {
    md.push("## Failed checks");
    md.push("");
    for (const f of FAIL) {
      md.push("- \u274c " + f.label);
      if (f.detail) md.push("  - " + f.detail);
    }
    md.push("");
  }

  if (WARN.length > 0) {
    md.push("## Warnings");
    md.push("");
    for (const w of WARN) {
      md.push("- \u26a0\ufe0f " + w.label);
      if (w.detail) md.push("  - " + w.detail);
    }
    md.push("");
  }

  md.push("## Per-file summary");
  md.push("");
  md.push("| File | BM | Slots | Fields | Bindings | Unknown src | reviewRequired | Generic | Unresolved |");
  md.push("|---|---|---|---:|---:|---:|---:|---:|---:|");
  for (const r of results) {
    md.push(`| ${r.file} | ${r.templateCode ?? "?"} | ${r.slots} | ${r.fields} | ${r.bindings} | ${r.unknownSources} | ${r.reviewRequired} | ${r.genericFields} | ${r.unresolved} |`);
  }

  fs.writeFileSync(path.join(REPORTS_DIR, "LOCKED-CONTRACTS-SUMMARY.md"), md.join("\n"), "utf8");

  console.log("\nLocked contracts verified: " + lockedFiles.length);
  console.log("Pass: " + PASS.length + " | Fail: " + FAIL.length + " | Warn: " + WARN.length);
  console.log("Report: " + path.join(REPORTS_DIR, "LOCKED-CONTRACTS-SUMMARY.md"));

  if (FAIL.length > 0) {
    console.error("\nFailing checks found:");
    for (const f of FAIL) {
      console.error("  \u274c " + f.label + (f.detail ? " — " + f.detail : ""));
    }
    process.exit(1);
  }

  if (results.length === 0) {
    console.error("No locked contracts found.");
    process.exit(1);
  }
};

main();
