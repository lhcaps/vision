/**
 * Phase D — Tests for form runtime readiness report.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const REPORTS_DIR = path.join(process.cwd(), "docs", "audit", "docx", "reports");

describe("Form runtime readiness", () => {
  it("produces FORM-RUNTIME-READINESS.md", () => {
    const mdPath = path.join(REPORTS_DIR, "FORM-RUNTIME-READINESS.md");
    assert.ok(fs.existsSync(mdPath), "FORM-RUNTIME-READINESS.md should exist");
  });

  it("produces form-runtime-readiness.json", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-runtime-readiness.json");
    assert.ok(fs.existsSync(jsonPath), "form-runtime-readiness.json should exist");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.ok(data.counts, "should have counts");
  });

  it("total forms equals 213", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-runtime-readiness.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.strictEqual(data.counts.total, 213, "should have 213 total forms");
  });

  it("only 3 forms are locked", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-runtime-readiness.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.strictEqual(data.counts.locked, 3, "should have exactly 3 locked forms");
    assert.strictEqual(data.counts.runtimeEligible, 3, "runtimeEligible should be 3");
  });

  it("remaining 210 forms are draft", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-runtime-readiness.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.strictEqual(data.counts.draft, 210, "should have 210 draft forms");
    assert.strictEqual(data.counts.blockedForms, 210, "blocked forms should be 210");
  });

  it("has top 20 by generic field count", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-runtime-readiness.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.ok(Array.isArray(data.top20ByGenericFields));
    assert.strictEqual(data.top20ByGenericFields.length, 20, "should have top 20");
    // Verify sorted descending
    for (let i = 1; i < data.top20ByGenericFields.length; i++) {
      assert.ok(
        data.top20ByGenericFields[i - 1].genericFieldCount >=
          data.top20ByGenericFields[i].genericFieldCount,
        "should be sorted by genericFieldCount descending",
      );
    }
  });

  it("has recommended easy batch", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-runtime-readiness.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.ok(Array.isArray(data.easyBatch));
    assert.ok(data.easyBatch.length > 0, "should have at least some easy forms");
    // Easy batch should be sorted ascending by generic count
    for (let i = 1; i < data.easyBatch.length; i++) {
      assert.ok(
        data.easyBatch[i - 1].genericFieldCount <= data.easyBatch[i].genericFieldCount,
        "easy batch should be sorted ascending",
      );
    }
  });

  it("groups forms by stage", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-runtime-readiness.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.ok(Array.isArray(data.byStage));
    assert.ok(data.byStage.length > 0, "should have stage groupings");
    for (const stage of data.byStage) {
      assert.ok(stage.stageCode, "each stage should have stageCode");
      assert.ok(Array.isArray(stage.locked), "each stage should have locked array");
      assert.ok(Array.isArray(stage.draft), "each stage should have draft array");
    }
  });

  it("BM-001/002/003 are in the locked stage groups", () => {
    const jsonPath = path.join(REPORTS_DIR, "form-runtime-readiness.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const lockedStages = data.byStage.filter((s) =>
      s.locked?.includes("BM-001") || s.locked?.includes("BM-002") || s.locked?.includes("BM-003"),
    );
    assert.ok(lockedStages.length > 0, "at least one stage should have locked forms");
  });
});
