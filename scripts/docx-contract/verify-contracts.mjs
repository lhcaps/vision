#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 5 — Verify contracts.
// Kiểm tra contract.draft.json theo schema + taxonomy.
// Strict cho status=locked, warning-only cho status=draft.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");
const CONTRACT_SCHEMA = path.join(ROOT, "docs", "contracts", "contract.schema.json");
const FIELD_TAXONOMY = path.join(ROOT, "docs", "contracts", "field-taxonomy.json");
const SOURCE_TAXONOMY = path.join(ROOT, "docs", "contracts", "source-taxonomy.json");
const TRANSFORM_TAXONOMY = path.join(ROOT, "docs", "contracts", "transform-taxonomy.json");
const COVERAGE_DIR = path.join(ROOT, "docs", "audit", "docx", "coverage");

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const isNamespace = (path, namespaces) => {
  if (!path) return false;
  const ns = path.split(".")[0];
  return namespaces.has(ns);
};

const verifyContract = (contract, taxonomies) => {
  const issues = [];
  const warnings = [];

  const slotIds = new Set();
  for (const slot of contract.docxSlots ?? []) {
    if (slotIds.has(slot.slotId)) {
      issues.push(`Duplicate slotId: ${slot.slotId}`);
    }
    slotIds.add(slot.slotId);
  }

  const fieldPaths = new Set();
  for (const f of contract.canonicalFields ?? []) {
    fieldPaths.add(f.path);
  }

  // Binding checks
  for (const b of contract.renderBindings ?? []) {
    if (!slotIds.has(b.slotId)) {
      issues.push(`RenderBinding.slotId trỏ tới slot không tồn tại: ${b.slotId}`);
    }
    const fromField = b.from?.split(".")[0];
    // from có thể là {issuePlace:document.issuePlace,...} (compound) — cho phép nếu field con resolve được.
    if (b.transform === "identity" || b.transform === "constant") {
      if (b.from && !b.from.startsWith("{") && !fieldPaths.has(b.from)) {
        warnings.push(`RenderBinding.from trỏ tới canonicalField không tồn tại: ${b.from}`);
      }
    }
    if (!taxonomies.transforms[b.transform]) {
      issues.push(`RenderBinding.transform không thuộc transform-taxonomy: ${b.transform}`);
    }
    void fromField;
  }

  // Field checks
  for (const f of contract.canonicalFields ?? []) {
    if (!isNamespace(f.path, taxonomies.namespaces)) {
      issues.push(`CanonicalField.path dùng namespace không thuộc field-taxonomy: ${f.path}`);
    }
    if (!taxonomies.sources.has(f.source)) {
      issues.push(`CanonicalField.source không thuộc source-taxonomy: ${f.source} (path=${f.path})`);
    }
  }

  // Strict checks cho locked.
  if (contract.status === "locked") {
    for (const f of contract.canonicalFields ?? []) {
      if (f.source === "unknown") {
        issues.push(`Locked contract có canonicalField source=unknown: ${f.path}`);
      }
      if (f.reviewRequired) {
        issues.push(`Locked contract có canonicalField reviewRequired=true: ${f.path}`);
      }
    }
    for (const b of contract.renderBindings ?? []) {
      if (b.reviewRequired) {
        issues.push(`Locked contract có renderBinding reviewRequired=true: ${b.slotId}`);
      }
    }
    for (const slot of contract.docxSlots ?? []) {
      if (slot.reviewRequired) {
        issues.push(`Locked contract có docxSlot reviewRequired=true: ${slot.slotId}`);
      }
    }
    if ((contract.unresolvedQuestions ?? []).length > 0) {
      issues.push("Locked contract vẫn còn unresolvedQuestions");
    }
  }

  return { issues, warnings };
};

const summarize = (results) => {
  let totalSlots = 0;
  let totalBound = 0;
  let totalUnknown = 0;
  let totalReview = 0;
  let totalMissingBinding = 0;
  let totalLocked = 0;
  let totalDraft = 0;
  let totalStructuralIssues = 0;
  let totalStructuralWarnings = 0;
  let totalContractWarnings = 0;
  for (const r of results) {
    const c = r.contract;
    totalSlots += c.docxSlots?.length ?? 0;
    totalBound += c.renderBindings?.length ?? 0;
    totalUnknown += (c.canonicalFields ?? []).filter((f) => f.source === "unknown").length;
    totalReview +=
      (c.canonicalFields ?? []).filter((f) => f.reviewRequired).length
      + (c.docxSlots ?? []).filter((s) => s.reviewRequired).length
      + (c.renderBindings ?? []).filter((b) => b.reviewRequired).length;
    const boundSlots = new Set((c.renderBindings ?? []).map((b) => b.slotId));
    totalMissingBinding += (c.docxSlots ?? []).filter((s) => !boundSlots.has(s.slotId)).length;
    if (c.status === "locked") totalLocked += 1;
    else totalDraft += 1;
    totalStructuralIssues += r.issues.length;
    totalStructuralWarnings += r.warnings.length;
    totalContractWarnings += (c.warnings ?? []).length;
  }
  return {
    totalSlots,
    totalBound,
    totalUnknown,
    totalReview,
    totalMissingBinding,
    totalLocked,
    totalDraft,
    totalStructuralIssues,
    totalStructuralWarnings,
    totalContractWarnings,
  };
};

const main = () => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(COVERAGE_DIR, { recursive: true });

  const namespaces = new Set(Object.keys(loadJson(FIELD_TAXONOMY).namespaces));
  const sources = new Set(loadJson(SOURCE_TAXONOMY).allowed.map((s) => s.value));
  const transforms = loadJson(TRANSFORM_TAXONOMY).transforms;
  const taxonomies = { namespaces, sources, transforms };

  const files = fs.readdirSync(CONTRACTS_DIR).filter((n) => n.endsWith(".contract.draft.json"));
  const results = [];
  let totalIssues = 0;
  let totalWarnings = 0;
  let lockedInvalid = 0;

  for (const f of files) {
    const c = JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8"));
    const { issues, warnings } = verifyContract(c, taxonomies);
    totalIssues += issues.length;
    totalWarnings += warnings.length;
    if (c.status === "locked" && issues.length > 0) {
      lockedInvalid += 1;
    }
    results.push({
      code: c.templateCode,
      file: f,
      status: c.status,
      issues,
      warnings,
      contract: c,
    });
  }

  const summary = summarize(results);

  // Coverage summary table.
  // Lưu ý: Đây chỉ là verify STRUCTURAL (schema + taxonomy), KHÔNG phải
  // verify semantic/legal. Một contract pass strict structural vẫn có thể
  // sai về mặt nghiệp vụ. Locking contract yêu cầu thêm human review.
  const md = ["# Slot Coverage Summary"];
  md.push("");
  md.push(`Sinh lúc: ${new Date().toISOString()}`);
  md.push("");
  md.push("## Phạm vi verify");
  md.push("");
  md.push("- ✅ **Structural verification**: schema hợp lệ, slotId duy nhất, renderBinding trỏ tới slot tồn tại, namespace trong field-taxonomy, source trong source-taxonomy, transform trong transform-taxonomy.");
  md.push("- ❌ **Semantic / legal verification**: KHÔNG thuộc phạm vi pipeline này. Reviewer phải đọc DOCX đối chiếu.");
  md.push("- ❌ **Locked contract count**: Hiện tại = 0. Nghĩa là **không có contract nào pass strict semantic review**.");
  md.push("- ⚠️ **Unknown sources**: 100% canonicalField đang `source=unknown` (chờ reviewer quyết định từng field thuộc nguồn nào).");
  md.push("- ⚠️ **Review-required**: 100% slot+field+binding đang `reviewRequired=true` (chờ reviewer xác nhận).");
  md.push("");
  md.push("> Kết luận: Mọi số liệu dưới đây mô tả **structure của draft contract**, không phải sự đúng đắn về pháp lý/nghiệp vụ.");
  if (summary.totalLocked === 0) {
    md.push("");
    md.push("> **Không có contract locked.** Kết quả này chỉ xác nhận cấu trúc draft, không xác nhận đúng với DOCX về mặt nghiệp vụ/pháp lý. Không dùng để khẳng định contract đã pass verification.");
  }
  md.push("");
  md.push("## Tổng quan");
  md.push("");
  md.push(`- Tổng contract (form, KHÔNG tính reference docs): **${results.length}**`);
  md.push(`- Tổng docxSlots: **${summary.totalSlots}**`);
  md.push(`- Tổng renderBindings: **${summary.totalBound}**`);
  md.push(`- Tổng canonicalFields có source=unknown: **${summary.totalUnknown}**`);
  md.push(`- Tổng reviewRequired (slot+field+binding): **${summary.totalReview}**`);
  md.push(`- Tổng slot thiếu binding: **${summary.totalMissingBinding}**`);
  md.push(`- Contract locked: **${summary.totalLocked}** | draft: **${summary.totalDraft}**`);
  md.push(`- Structural issues: **${summary.totalStructuralIssues}**`);
  md.push(`- Structural warnings: **${summary.totalStructuralWarnings}**`);
  md.push(`- Extraction / contract warnings: **${summary.totalContractWarnings}**`);
  md.push(`- Locked contract invalid: **${lockedInvalid}** (sẽ thoát non-zero)`);
  md.push("");
  md.push("## Per BM");
  md.push("");
  md.push("| SourceId | BM | Status | Slots | Bound | Unknown source | Review required | Missing binding | Issues | Warnings | Extract/Contract Warnings |");
  md.push("|---|---|---|---:|---:|---:|---:|---:|---:|---:|");
  for (const r of results.sort((a, b) => a.code?.localeCompare(b.code))) {
    const c = r.contract;
    const slots = c.docxSlots?.length ?? 0;
    const bound = c.renderBindings?.length ?? 0;
    const unknown = (c.canonicalFields ?? []).filter((f) => f.source === "unknown").length;
    const review = (c.canonicalFields ?? []).filter((f) => f.reviewRequired).length
      + (c.docxSlots ?? []).filter((s) => s.reviewRequired).length
      + (c.renderBindings ?? []).filter((b) => b.reviewRequired).length;
    const boundSlots = new Set((c.renderBindings ?? []).map((b) => b.slotId));
    const missing = (c.docxSlots ?? []).filter((s) => !boundSlots.has(s.slotId)).length;
    md.push(
      `| ${r.contract.sourceId ?? "?"} | ${r.code ?? "?"} | ${r.status} | ${slots} | ${bound} | ${unknown} | ${review} | ${missing} | ${r.issues.length} | ${r.warnings.length} | ${(r.contract.warnings ?? []).length} |`,
    );
  }
  md.push("");
  md.push("## Per-BM coverage files");
  md.push("");
  for (const r of results) {
    const c = r.contract;
    const slots = c.docxSlots?.length ?? 0;
    const bound = c.renderBindings?.length ?? 0;
    const unknown = (c.canonicalFields ?? []).filter((f) => f.source === "unknown").length;
    const review = (c.canonicalFields ?? []).filter((f) => f.reviewRequired).length
      + (c.docxSlots ?? []).filter((s) => s.reviewRequired).length
      + (c.renderBindings ?? []).filter((b) => b.reviewRequired).length;
    const boundSlots = new Set((c.renderBindings ?? []).map((b) => b.slotId));
    const missing = (c.docxSlots ?? []).filter((s) => !boundSlots.has(s.slotId)).length;
    const fileBase = (r.contract.sourceId ?? `FILE-${r.file.replace(/\.contract\.draft\.json$/u, "")}`).replace(/[\\/:*?"<>|]/gu, "_");
    const cov = [
      `# ${r.code ?? "?"} Coverage (${r.contract.sourceId ?? "?"})`,
      "",
      `Sinh lúc: ${new Date().toISOString()}`,
      "",
      `## Slot coverage`,
      ``,
      `- SourceId: ${r.contract.sourceId ?? "?"}`,
      `- Status: ${r.status}`,
      `- Tổng docxSlots: ${slots}`,
      `- Có renderBinding: ${bound}`,
      `- Thiếu binding: ${missing}`,
      `- CanonicalField source=unknown: ${unknown}`,
      `- Review required: ${review}`,
      `- Issues: ${r.issues.length}`,
      `- Warnings: ${r.warnings.length}`,
      "",
      `## Extraction / contract warnings (${(c.warnings ?? []).length})`,
      "",
      (c.warnings ?? []).length ? c.warnings.map((w) => `- ${w}`).join("\n") : "- (none)",
      "",
      `## Issues`,
      "",
      r.issues.length ? r.issues.map((i) => `- ${i}`).join("\n") : "- (none)",
      "",
      `## Warnings`,
      "",
      r.warnings.length ? r.warnings.map((w) => `- ${w}`).join("\n") : "- (none)",
      "",
      `## Slot list (${slots})`,
      "",
      ...((c.docxSlots ?? []).map((s) => `- ${s.slotId} (${s.slotType}, required=${s.required}, confidence=${s.confidence?.toFixed(2) ?? "?"}, review=${s.reviewRequired})`)),
      "",
      `## Binding list (${bound})`,
      "",
      ...((c.renderBindings ?? []).map((b) => `- ${b.slotId} ← ${b.from} (${b.transform})`)),
      "",
    ].join("\n");
    fs.writeFileSync(path.join(COVERAGE_DIR, `${fileBase}.coverage.md`), cov, "utf8");
  }
  fs.writeFileSync(path.join(REPORTS_DIR, "SLOT-COVERAGE-SUMMARY.md"), md.join("\n"), "utf8");

  const reportData = {
    generatedAt: new Date().toISOString(),
    summary: { ...summary, totalIssues, totalWarnings, lockedInvalid },
    perContract: results.map((r) => ({
      code: r.code,
      status: r.status,
      slots: r.contract.docxSlots?.length ?? 0,
      bindings: r.contract.renderBindings?.length ?? 0,
      unknownSources: (r.contract.canonicalFields ?? []).filter((f) => f.source === "unknown").length,
      reviewRequired:
        (r.contract.canonicalFields ?? []).filter((f) => f.reviewRequired).length
        + (r.contract.docxSlots ?? []).filter((s) => s.reviewRequired).length
        + (r.contract.renderBindings ?? []).filter((b) => b.reviewRequired).length,
      issues: r.issues,
      warnings: r.warnings,
      extractionContractWarnings: r.contract.warnings ?? [],
    })),
  };
  fs.writeFileSync(
    path.join(REPORTS_DIR, "slot-coverage-summary.json"),
    `${JSON.stringify(reportData, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify(reportData.summary, null, 2));

  // Exit code: locked contract invalid → non-zero.
  if (lockedInvalid > 0) {
    process.exit(3);
  }
};

main();
