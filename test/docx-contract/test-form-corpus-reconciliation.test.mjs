/**
 * Phase D — Tests for form corpus reconciliation.
 * Uses Node.js built-in test runner (node --test).
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const REPORTS_DIR = path.join(process.cwd(), "docs", "audit", "docx", "reports");

describe("Form corpus reconciliation", () => {
  it("produces FORM-CORPUS-RECONCILIATION.md", () => {
    const mdPath = path.join(REPORTS_DIR, "FORM-CORPUS-RECONCILIATION.md");
    assert.ok(fs.existsSync(mdPath), "FORM-CORPUS-RECONCILIATION.md should exist");
    const content = fs.readFileSync(mdPath, "utf8");
    assert.ok(content.includes("Form Corpus Reconciliation"), "should have correct title");
  });

  it("produces form-corpus-reconciliation.json", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-corpus-reconciliation.json");
    assert.ok(fs.existsSync(jsonPath), "form-corpus-reconciliation.json should exist");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.ok(data.counts, "should have counts");
    assert.strictEqual(typeof data.counts.inventoryRecords, "number");
    assert.strictEqual(typeof data.counts.formDocuments, "number");
    assert.strictEqual(typeof data.counts.referenceDocuments, "number");
    assert.strictEqual(typeof data.counts.uniqueTemplateCodes, "number");
    assert.strictEqual(typeof data.counts.lockedContracts, "number");
    assert.strictEqual(typeof data.counts.draftContracts, "number");
  });

  it("excludes reference documents from form corpus", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-corpus-reconciliation.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.ok(data.referenceDocs, "should have referenceDocs");
    assert.ok(data.referenceDocs.length >= 2, "should have at least 2 reference docs");
    assert.ok(data.referenceDocs.every((r) => r.sourceId?.startsWith("REF__")),
      "all reference doc sourceIds should start with REF__");
  });

  it("reports 213 unique template codes", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-corpus-reconciliation.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.strictEqual(data.counts.uniqueTemplateCodes, 213,
      "should have exactly 213 distinct BM codes");
    assert.strictEqual(data.counts.formDocuments, 214,
      "should have 214 form document records (213 codes + 1 duplicate)");
  });

  it("marks BM-001, BM-002, BM-003 as locked", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-corpus-reconciliation.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const lockedCodes = data.lockedContracts.map((c) => c.templateCode);
    assert.ok(lockedCodes.includes("BM-001"), "BM-001 should be locked");
    assert.ok(lockedCodes.includes("BM-002"), "BM-002 should be locked");
    assert.ok(lockedCodes.includes("BM-003"), "BM-003 should be locked");
  });

  it("BM-004 is draft, not locked", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-corpus-reconciliation.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const draftContracts = data.draftContracts ?? [];
    const bm004 = draftContracts.find((c) => c.templateCode === "BM-004");
    assert.ok(bm004, "BM-004 should exist in draft contracts");
    assert.strictEqual(bm004.status, "draft", "BM-004 should be draft");
    assert.ok(bm004.genericFieldCount > 0, "BM-004 should have generic fields");
  });

  it("identifies BM-139 as duplicate", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-corpus-reconciliation.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.strictEqual(data.counts.duplicateTemplateCodes, 1, "should have 1 duplicate");
    const dup = data.duplicateCodes.find((d) => d.code === "BM-139");
    assert.ok(dup, "duplicate should be BM-139");
    assert.strictEqual(dup.count, 2, "BM-139 should have 2 files");
  });

  it("has duplicate codes tracking with sourceId", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-corpus-reconciliation.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    // BM-139 appears twice with different sourceIds
    const bm139Contracts = (data.lockedContracts ?? [])
      .concat(data.draftContracts ?? [])
      .filter((c) => c.templateCode === "BM-139");
    assert.ok(bm139Contracts.length >= 2, "BM-139 should have at least 2 entries");
    const sourceIds = new Set(bm139Contracts.map((c) => c.sourceId));
    assert.ok(sourceIds.size >= 2, "BM-139 entries should have different sourceIds");
  });
});
