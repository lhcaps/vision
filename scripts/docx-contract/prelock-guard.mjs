#!/usr/bin/env node
// Phase C prelock guard: updated to support --locked-only mode.
// When --locked-only is set, validates locked contracts instead of draft contracts.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

const parseArgs = () => {
  const targetArg = process.argv.find((a) => a.startsWith("--target="));
  const lockedOnlyArg = process.argv.find((a) => a === "--locked-only");
  const targets = targetArg
    ? targetArg.split("=")[1].split(",").map((s) => s.trim())
    : ["BM-001", "BM-002", "BM-003", "BM-004"];
  return { targets, lockedOnly: Boolean(lockedOnlyArg) };
};

const { targets, lockedOnly } = parseArgs();
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

// Load contracts from draft or locked directory
const loadContracts = () => {
  if (lockedOnly) {
    if (!fs.existsSync(LOCKED_DIR)) {
      return [];
    }
    return fs.readdirSync(LOCKED_DIR)
      .filter((n) => n.endsWith(".contract.locked.json") && !n.startsWith("_"))
      .map((f) => {
        const content = fs.readFileSync(path.join(LOCKED_DIR, f), "utf8");
        return JSON.parse(content);
      })
      .filter((c) => c.templateCode && targetSet.has(c.templateCode));
  } else {
    return fs.readdirSync(CONTRACTS_DIR)
      .filter((n) => n.endsWith(".contract.draft.json") && !n.startsWith("_"))
      .map((f) => {
        const content = fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8");
        return JSON.parse(content);
      })
      .filter((c) => c.templateCode && targetSet.has(c.templateCode));
  }
};

const contracts = loadContracts();

if (contracts.length === 0) {
  if (lockedOnly) {
    console.error("No locked contracts found for targets: " + [...targetSet].join(", "));
  } else {
    console.error("No draft contracts found for targets: " + [...targetSet].join(", "));
  }
  process.exit(1);
}

for (const c of contracts) {
  const bm = c.templateCode;
  const mode = c.status === "locked" ? "locked" : "draft";

  check("[" + bm + "] Contract exists", Boolean(c), c.sourceId ?? "(missing)");

  const extractionKind = c.extractionSource?.kind ?? "unknown";
  check(
    "[" + bm + "] extractionSource.kind === \"normalized-docx\"",
    extractionKind === "normalized-docx",
    "got: \"" + extractionKind + "\"",
  );

  const warnings = c.warnings ?? [];
  check(
    "[" + bm + "] No warnings",
    warnings.length === 0,
    warnings.length > 0 ? warnings.join("; ") : null,
  );

  check("[" + bm + "] sourceId present", Boolean(c.sourceId), c.sourceId ?? "(missing)");

  check(
    "[" + bm + "] documentKind === \"form\"",
    c.documentKind === "form",
    "got: \"" + (c.documentKind ?? "(missing)") + "\"",
  );

  // Generic field checks
  const genericFieldSlots = (c.docxSlots ?? []).filter((s) => /^[a-z]+\.field\d+$/i.test(s.slotId));
  check(
    "[" + bm + "] No generic .field# slotIds",
    genericFieldSlots.length === 0,
    genericFieldSlots.length > 0
      ? genericFieldSlots.map((s) => s.slotId).join(", ")
      : null,
  );

  const genericFieldPaths = (c.canonicalFields ?? []).filter((f) => /\.field\d+$/.test(f.path));
  check(
    "[" + bm + "] No generic .field# canonicalField paths",
    genericFieldPaths.length === 0,
    genericFieldPaths.length > 0
      ? genericFieldPaths.map((f) => f.path).join(", ")
      : null,
  );

  // Wrong binding checks (draft mode only)
  if (c.status !== "locked") {
    const wrongBirthDateSlots = (c.docxSlots ?? []).filter((s) => {
      const ctx = (s.context ?? "").toLowerCase();
      const suggestedPath = s.suggestedCanonicalPath ?? "";
      return /sinh\s+ngày/.test(ctx) && suggestedPath === "document.issueDate";
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
      return /cấp\s+ngày|ngày\s+cấp/.test(ctx) && suggestedPath === "document.issueDate";
    });
    check(
      "[" + bm + "] \"Cấp ngày\" NOT bound to document.issueDate",
      wrongIssueDateSlots.length === 0,
      wrongIssueDateSlots.length > 0
        ? wrongIssueDateSlots.map((s) => s.slotId + " (" + (s.context?.slice(0, 40) ?? "") + ")").join("; ")
        : null,
    );
  }

  // Locked-mode checks
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

    check(`[${bm}] reviewedBy present`, Boolean(c.reviewedBy), c.reviewedBy ?? "(missing)");
    check(`[${bm}] reviewedAt present`, Boolean(c.reviewedAt), c.reviewedAt ?? "(missing)");
    check(
      `[${bm}] reviewedAt is ISO date`,
      /^\d{4}-\d{2}-\d{2}T/.test(c.reviewedAt ?? ""),
      c.reviewedAt ?? "(missing)",
    );

    const unresolved = (c.unresolvedQuestions ?? []).filter((q) => q && q.trim().length > 0);
    check(`[${bm}] No unresolvedQuestions`, unresolved.length === 0,
      unresolved.length > 0 ? unresolved.join("; ") : null);

    // Report that this is a locked contract being validated
    PASS.push({ label: `[" + bm + "] status === "locked"`, detail: null });
  }

  // productMetadata checks (draft mode)
  if (c.status !== "locked" && c.productMetadata) {
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
  }

  // renderFormatHints checks (draft mode)
  if (c.status !== "locked" && c.renderFormatHints) {
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
  }

  if (c.status !== "locked" && c.formInputHints) {
    PASS.push({ label: "[" + bm + "] formInputHints present", detail: null });
  }

  if (c.status !== "locked" && c.reportingHints) {
    PASS.push({ label: "[" + bm + "] reportingHints present", detail: null });
    const dims = c.reportingHints.dimensions ?? [];
    check(
      "[" + bm + "] reportingHints.dimensions includes time/ward/offense",
      dims.includes("time") && dims.includes("ward") && dims.includes("offense"),
      JSON.stringify(dims),
    );
  }
}

const total = PASS.length + FAIL.length;
const passRate = total > 0 ? ((PASS.length / total) * 100).toFixed(1) : 0;

const md = [];
md.push("# Prelock Guard Report");
md.push("");
md.push("Generated: " + new Date().toISOString());
md.push("Mode: " + (lockedOnly ? "locked-only (validates locked contracts)" : "draft (validates draft contracts)"));
md.push("Target: " + [...targetSet].join(", "));
md.push("Contracts checked: " + contracts.length);
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
    if (w.detail) md.push("  - " + w.detail);
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
  md.push("**Ready for Phase C** (no blocking issues).");
  if (lockedOnly) {
    md.push("All target contracts are locked and valid.");
  }
}

fs.mkdirSync(REPORTS_DIR, { recursive: true });
const reportPath = path.join(REPORTS_DIR, "PRELOCK-GUARD.md");
fs.writeFileSync(reportPath, md.join("\n"), "utf8");

console.log("\nPrelock Guard: " + PASS.length + " pass, " + FAIL.length + " fail, " + WARN.length + " warn");
console.log("Mode: " + (lockedOnly ? "locked-only" : "draft"));
console.log("Report: " + reportPath);

const output = {
  generatedAt: new Date().toISOString(),
  mode: lockedOnly ? "locked-only" : "draft",
  targets: [...targetSet],
  contractsChecked: contracts.length,
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
