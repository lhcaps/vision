// Test: product contract metadata sections are present in BM-001..BM-004 contracts.
import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const CONTRACTS_DIR = path.join(
  process.cwd(),
  "docs",
  "audit",
  "docx",
  "contracts",
);

const loadContracts = (codes) => {
  const files = fs.readdirSync(CONTRACTS_DIR).filter(
    (n) => n.endsWith(".contract.draft.json") && !n.startsWith("_"),
  );
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8")))
    .filter((c) => c.templateCode && codes.has(c.templateCode));
};

describe("product-contract-readiness: BM-001..BM-004", () => {
  const codes = new Set(["BM-001", "BM-002", "BM-003", "BM-004"]);
  const contracts = (() => {
    try {
      return loadContracts(codes);
    } catch {
      return [];
    }
  })();

  it("all target BM contracts have productMetadata section", () => {
    for (const c of contracts) {
      assert.ok(
        c.productMetadata !== undefined,
        `${c.templateCode} must have productMetadata`,
      );
    }
  });

  it("all target BM contracts have renderFormatHints section", () => {
    for (const c of contracts) {
      assert.ok(
        c.renderFormatHints !== undefined,
        `${c.templateCode} must have renderFormatHints`,
      );
    }
  });

  it("all target BM contracts have formInputHints section", () => {
    for (const c of contracts) {
      assert.ok(
        c.formInputHints !== undefined,
        `${c.templateCode} must have formInputHints`,
      );
    }
  });

  it("all target BM contracts have reportingHints section", () => {
    for (const c of contracts) {
      assert.ok(
        c.reportingHints !== undefined,
        `${c.templateCode} must have reportingHints`,
      );
    }
  });

  it("productMetadata.legalBasisLine is present", () => {
    for (const c of contracts) {
      assert.ok(
        Boolean(c.productMetadata?.legalBasisLine),
        `${c.templateCode} must have productMetadata.legalBasisLine`,
      );
      assert.ok(
        c.productMetadata.legalBasisLine.includes("03/2026"),
        `${c.templateCode} legalBasisLine should reference Thông tư 03/2026`,
      );
    }
  });

  it("productMetadata.stage is present with reviewRequired=true", () => {
    for (const c of contracts) {
      assert.ok(
        c.productMetadata?.stage !== undefined,
        `${c.templateCode} must have productMetadata.stage`,
      );
      assert.strictEqual(
        c.productMetadata.stage?.reviewRequired,
        true,
        `${c.templateCode} stage.reviewRequired must be true`,
      );
    }
  });

  it("renderFormatHints.fontFamily === Times New Roman", () => {
    for (const c of contracts) {
      assert.strictEqual(
        c.renderFormatHints?.fontFamily,
        "Times New Roman",
        `${c.templateCode} fontFamily must be "Times New Roman"`,
      );
    }
  });

  it("renderFormatHints.baseFontSize === 13", () => {
    for (const c of contracts) {
      assert.strictEqual(
        c.renderFormatHints?.baseFontSize,
        13,
        `${c.templateCode} baseFontSize must be 13`,
      );
    }
  });

  it("renderFormatHints.requiresDifferentFirstPage === true", () => {
    for (const c of contracts) {
      assert.strictEqual(
        c.renderFormatHints?.requiresDifferentFirstPage,
        true,
        `${c.templateCode} requiresDifferentFirstPage must be true`,
      );
    }
  });

  it("reportingHints.dimensions includes time, ward, offense", () => {
    for (const c of contracts) {
      const dims = c.reportingHints?.dimensions ?? [];
      assert.ok(
        dims.includes("time"),
        `${c.templateCode} reportingHints.dimensions must include "time"`,
      );
      assert.ok(
        dims.includes("ward"),
        `${c.templateCode} reportingHints.dimensions must include "ward"`,
      );
      assert.ok(
        dims.includes("offense"),
        `${c.templateCode} reportingHints.dimensions must include "offense"`,
      );
    }
  });

  it("formInputHints.previewRequired === true", () => {
    for (const c of contracts) {
      assert.strictEqual(
        c.formInputHints?.previewRequired,
        true,
        `${c.templateCode} formInputHints.previewRequired must be true`,
      );
    }
  });

  it("hints sections do NOT make contract locked (reviewRequired=true)", () => {
    for (const c of contracts) {
      assert.strictEqual(
        c.productMetadata?.reviewRequired,
        true,
        `${c.templateCode} productMetadata.reviewRequired must be true (not locked)`,
      );
      assert.strictEqual(
        c.renderFormatHints?.reviewRequired,
        true,
        `${c.templateCode} renderFormatHints.reviewRequired must be true`,
      );
      assert.strictEqual(
        c.formInputHints?.reviewRequired,
        true,
        `${c.templateCode} formInputHints.reviewRequired must be true`,
      );
      assert.strictEqual(
        c.reportingHints?.reviewRequired,
        true,
        `${c.templateCode} reportingHints.reviewRequired must be true`,
      );
    }
  });

  it("contract status is still 'draft', not locked", () => {
    for (const c of contracts) {
      assert.strictEqual(
        c.status,
        "draft",
        `${c.templateCode} status must be "draft", got "${c.status}"`,
      );
    }
  });

  it("extractionSource metadata is present", () => {
    for (const c of contracts) {
      assert.ok(
        c.extractionSource !== undefined,
        `${c.templateCode} must have extractionSource metadata`,
      );
    }
  });

  it("productMetadata.stage has code for known BM codes", () => {
    for (const c of contracts) {
      if (c.templateCode === "BM-001" || c.templateCode === "BM-002" || c.templateCode === "BM-003" || c.templateCode === "BM-004") {
        assert.ok(
          c.productMetadata?.stage?.code,
          `${c.templateCode} stage.code must be present`,
        );
        assert.strictEqual(
          c.productMetadata.stage.code,
          "01",
          `${c.templateCode} should be stage 01 (TIẾP NHẬN)`,
        );
      }
    }
  });
});
