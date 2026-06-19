#!/usr/bin/env node
// DOCX-first audit pipeline: Phase B.5 — Prelock guard.
// Fails non-zero if target BM-001..BM-004 has issues that prevent Phase C locking.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

const parseArgs = () => {
  const targetArg = process.argv.find((a) => a.startsWith("--target="));
  const targets = targetArg
    ? targetArg.split("=")[1].split(",").map((s) => s.trim())
    : ["BM-001", "BM-002", "BM-003", "BM-004"];
  return { targets };
};

const { targets } = parseArgs();
const targetSet = new Set(targets);

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

const contractFiles = fs.readdirSync(CONTRACTS_DIR).filter(
  (n) => n.endsWith(".contract.draft.json") && !n.startsWith("_"),
);

const targetContracts = contractFiles
  .map((f) => {
    const content = fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8");
    return JSON.parse(content);
  })
  .filter((c) => c.templateCode && targetSet.has(c.templateCode));

if (targetContracts.length === 0) {
  console.error("No contracts found for targets: " + [...targetSet].join(", "));
  process.exit(1);
}

for (const c of targetContracts) {
  const bm = c.templateCode;

  check("[" + bm + "] Contract exists", Boolean(c), c.sourceId);

  if (!c) continue;

  const extractionKind = c.extractionSource?.kind ?? "unknown";
  check(
    "[" + bm + "] extractionSource.kind === \"normalized-docx\"",
    extractionKind === "normalized-docx",
    "got: \"" + extractionKind + "\" — " + (c.extractionSource?.relativePath ?? "(no path)"),
  );

  const extractionFormat = c.extractionSource?.format ?? c.docx?.format ?? "unknown";
  check(
    "[" + bm + "] extraction format is docx (not fallback doc)",
    extractionFormat === "docx",
    "got: \"" + extractionFormat + "\"",
  );

  const warnings = c.warnings ?? [];
  check(
    "[" + bm + "] No warnings",
    warnings.length === 0,
    warnings.length > 0 ? warnings.join("; ") : null,
  );

  check(
    "[" + bm + "] sourceId present",
    Boolean(c.sourceId),
    c.sourceId ?? "(missing)",
  );

  check(
    "[" + bm + "] documentKind === \"form\"",
    c.documentKind === "form",
    "got: \"" + (c.documentKind ?? "(missing)") + "\"",
  );

  check(
    "[" + bm + "] Not a reference document",
    c.documentKind !== "reference",
    "documentKind=\"" + c.documentKind + "\"",
  );

  const genericFieldSlots = (c.docxSlots ?? []).filter((s) => {
    const slotPath = s.slotId;
    const match = /^[a-z]+\.field\d+$/i.test(slotPath);
    return match;
  });
  check(
    "[" + bm + "] No generic .field# slotIds",
    genericFieldSlots.length === 0,
    genericFieldSlots.length > 0
      ? genericFieldSlots.map((s) => s.slotId).join(", ")
      : null,
  );

  const genericFieldPaths = (c.canonicalFields ?? []).filter((f) => {
    return /\.field\d+$/.test(f.path);
  });
  check(
    "[" + bm + "] No generic .field# canonicalField paths",
    genericFieldPaths.length === 0,
    genericFieldPaths.length > 0
      ? genericFieldPaths.map((f) => f.path).join(", ")
      : null,
  );

  const wrongBirthDateSlots = (c.docxSlots ?? []).filter((s) => {
    const ctx = (s.context ?? "").toLowerCase();
    const suggestedPath = s.suggestedCanonicalPath ?? "";
    const isBirthDate = /sinh\s+ngày/.test(ctx);
    const isWrongBinding = suggestedPath === "document.issueDate";
    return isBirthDate && isWrongBinding;
  });
  check(
    "[" + bm + "] \"Sinh ngày\" NOT bound to document.issueDate",
    wrongBirthDateSlots.length === 0,
    wrongBirthDateSlots.length > 0
      ? wrongBirthDateSlots.map((s) => s.slotId + " (" + (s.context?.slice(0, 40) ?? "") + ")").join("; ")
      : null,
  );

  const wrongIssueDateSlots = (c.docxSlots ?? []).filter((s) => {
    const ctx = (s.context ?? "").toLowerCase();
    const suggestedPath = s.suggestedCanonicalPath ?? "";
    const isCapNgay = /cấp\s+ngày|ngày\s+cấp/.test(ctx);
    const isWrongBinding = suggestedPath === "document.issueDate";
    return isCapNgay && isWrongBinding;
  });
  check(
    "[" + bm + "] \"Cấp ngày\" NOT bound to document.issueDate",
    wrongIssueDateSlots.length === 0,
    wrongIssueDateSlots.length > 0
      ? wrongIssueDateSlots.map((s) => s.slotId + " (" + (s.context?.slice(0, 40) ?? "") + ")").join("; ")
      : null,
  );

  const heuristicNotReviewed = (c.canonicalFields ?? []).filter((f) => {
    return f.reviewRequired === false && f.source === "unknown";
  });
  check(
    "[" + bm + "] No heuristic fields with reviewRequired=false",
    heuristicNotReviewed.length === 0,
    heuristicNotReviewed.length > 0
      ? heuristicNotReviewed.map((f) => f.path).join(", ")
      : null,
  );

  const badReviewedFields = (c.canonicalFields ?? []).filter((f) => {
    return (
      f.source !== "unknown" &&
      (f.reviewRequired !== false || !f.reviewedBy || !f.reviewedAt || !f.reviewEvidence)
    );
  });
  check(
    "[" + bm + "] Non-unknown source fields have review metadata",
    badReviewedFields.length === 0,
    badReviewedFields.length > 0
      ? badReviewedFields.map((f) => f.path + " (source=" + f.source + ")").join("; ")
      : null,
  );

  if (c.status === "locked") {
    const lockedIssues = [
      ...(c.canonicalFields ?? []).filter((f) => f.source === "unknown"),
      ...(c.canonicalFields ?? []).filter((f) => f.reviewRequired === true),
      ...(c.docxSlots ?? []).filter((s) => s.reviewRequired === true),
      ...(c.renderBindings ?? []).filter((b) => b.reviewRequired === true),
    ];
    check(
      "[" + bm + "] Locked contract has no unresolved items",
      lockedIssues.length === 0,
      lockedIssues.length > 0 ? lockedIssues.length + " unresolved item(s)" : null,
    );
  }

  if (c.productMetadata) {
    PASS.push({ label: "[" + bm + "] productMetadata present", detail: null });
    check(
      "[" + bm + "] productMetadata.stage.reviewRequired === true",
      c.productMetadata.stage?.reviewRequired === true,
      "got: " + c.productMetadata.stage?.reviewRequired,
    );
    check(
      "[" + bm + "] productMetadata.stage has code and label",
      Boolean(c.productMetadata.stage?.code) && Boolean(c.productMetadata.stage?.label),
      JSON.stringify(c.productMetadata.stage),
    );
    check(
      "[" + bm + "] productMetadata.legalBasisLine present",
      Boolean(c.productMetadata.legalBasisLine),
      c.productMetadata.legalBasisLine ?? "(missing)",
    );
  } else {
    FAIL.push({
      label: "[" + bm + "] productMetadata present",
      detail: "productMetadata missing from contract",
    });
  }

  if (c.renderFormatHints) {
    PASS.push({ label: "[" + bm + "] renderFormatHints present", detail: null });
    check(
      "[" + bm + "] renderFormatHints.fontFamily === \"Times New Roman\"",
      c.renderFormatHints.fontFamily === "Times New Roman",
      "got: \"" + c.renderFormatHints.fontFamily + "\"",
    );
    check(
      "[" + bm + "] renderFormatHints.baseFontSize === 13",
      c.renderFormatHints.baseFontSize === 13,
      "got: " + c.renderFormatHints.baseFontSize,
    );
  } else {
    FAIL.push({
      label: "[" + bm + "] renderFormatHints present",
      detail: "renderFormatHints missing from contract",
    });
  }

  if (c.formInputHints) {
    PASS.push({ label: "[" + bm + "] formInputHints present", detail: null });
  } else {
    FAIL.push({
      label: "[" + bm + "] formInputHints present",
      detail: "formInputHints missing from contract",
    });
  }

  if (c.reportingHints) {
    PASS.push({ label: "[" + bm + "] reportingHints present", detail: null });
    const dims = c.reportingHints.dimensions ?? [];
    check(
      "[" + bm + "] reportingHints.dimensions includes time/ward/offense",
      dims.includes("time") && dims.includes("ward") && dims.includes("offense"),
      JSON.stringify(dims),
    );
  } else {
    FAIL.push({
      label: "[" + bm + "] reportingHints present",
      detail: "reportingHints missing from contract",
    });
  }
}

const total = PASS.length + FAIL.length;
const passRate = total > 0 ? ((PASS.length / total) * 100).toFixed(1) : 0;

const md = [];
md.push("# Prelock Guard Report");
md.push("");
md.push("Generated: " + new Date().toISOString());
md.push("Target: " + [...targetSet].join(", "));
md.push("Contracts checked: " + targetContracts.length);
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
    if (f.detail) md.push("  - Detail: " + f.detail);
  }
  md.push("");
}

if (WARN.length > 0) {
  md.push("## Warnings");
  md.push("");
  for (const w of WARN) {
    md.push("- \u26a0\ufe0f " + w.label);
    if (w.detail) md.push("  - Detail: " + w.detail);
  }
  md.push("");
}

md.push("## Passed checks");
md.push("");
for (const p of PASS) {
  md.push("- \u2705 " + p.label);
}
md.push("");
md.push("## Phase C readiness");
md.push("");
if (FAIL.length > 0) {
  md.push("**NOT ready for Phase C.** " + FAIL.length + " blocking issue(s) must be fixed first.");
  md.push("");
  md.push("### Blocking issues");
  for (const f of FAIL) {
    md.push("- " + f.label);
  }
} else {
  md.push("**Ready for Phase C** (no blocking issues). Note: prelock guard is permissive in draft phase.");
}

fs.mkdirSync(REPORTS_DIR, { recursive: true });
const reportPath = path.join(REPORTS_DIR, "PRELOCK-GUARD.md");
fs.writeFileSync(reportPath, md.join("\n"), "utf8");

console.log("\nPrelock Guard: " + PASS.length + " pass, " + FAIL.length + " fail, " + WARN.length + " warn");
console.log("Report: " + reportPath);

const output = {
  generatedAt: new Date().toISOString(),
  targets: [...targetSet],
  contractsChecked: targetContracts.length,
  passCount: PASS.length,
  failCount: FAIL.length,
  warnCount: WARN.length,
  fails: FAIL,
  warns: WARN,
  passes: PASS,
};
console.log(JSON.stringify(output, null, 2));

if (FAIL.length > 0) {
  process.exit(1);
}
