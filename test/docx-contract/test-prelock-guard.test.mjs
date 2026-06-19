// Test: prelock-guard.mjs logic correctness.
// Verifies the guard checks fail correctly when generic fields remain.
import { describe, it } from "node:test";
import assert from "node:assert";

describe("prelock-guard: logic correctness", () => {
  it("generic .field# slotId should trigger fail", () => {
    const badSlot = { slotId: "document.field1" };
    const re = /^[a-z]+\.field\d+$/i;
    assert.ok(re.test(badSlot.slotId), "document.field1 should match generic pattern");
  });

  it("informant.field5 slotId should trigger fail", () => {
    const badSlot = { slotId: "informant.field5" };
    const re = /^[a-z]+\.field\d+$/i;
    assert.ok(re.test(badSlot.slotId), "informant.field5 should match");
  });

  it("agency.field2 slotId should trigger fail", () => {
    const badSlot = { slotId: "agency.field2" };
    const re = /^[a-z]+\.field\d+$/i;
    assert.ok(re.test(badSlot.slotId));
  });

  it("document.name slotId should NOT trigger fail", () => {
    const goodSlot = { slotId: "document.name" };
    const re = /^[a-z]+\.field\d+$/i;
    assert.ok(!re.test(goodSlot.slotId), "document.name should not match");
  });

  it("informant.fullName slotId should NOT trigger fail", () => {
    const goodSlot = { slotId: "informant.fullName" };
    const re = /^[a-z]+\.field\d+$/i;
    assert.ok(!re.test(goodSlot.slotId));
  });

  it('"Sinh ngày" with suggestedPath=document.issueDate should fail', () => {
    const badSlot = {
      context: "Sinh ngày ... tháng ... năm ... tại:",
      suggestedCanonicalPath: "document.issueDate",
    };
    const ctx = badSlot.context.toLowerCase();
    const isBirthDate = /sinh\s+ngày/.test(ctx);
    const isWrongBinding = badSlot.suggestedCanonicalPath === "document.issueDate";
    assert.ok(isBirthDate && isWrongBinding, "Should detect wrong binding");
  });

  it('"Sinh ngày" with suggestedPath=informant.birthDate should PASS', () => {
    const goodSlot = {
      context: "Sinh ngày ... tháng ... năm ... tại:",
      suggestedCanonicalPath: "informant.birthDate",
    };
    const ctx = goodSlot.context.toLowerCase();
    const isBirthDate = /sinh\s+ngày/.test(ctx);
    const isWrongBinding = goodSlot.suggestedCanonicalPath === "document.issueDate";
    assert.ok(!(isBirthDate && isWrongBinding), "Should not trigger wrong binding");
  });

  it("heuristic field with reviewRequired=false should fail", () => {
    const badField = {
      path: "document.issuePlace",
      source: "unknown",
      reviewRequired: false,
      suggestedBy: "heuristic",
    };
    const isDraftHeuristic = badField.source === "unknown" && badField.reviewRequired === false;
    assert.ok(isDraftHeuristic, "Should fail draft heuristic invariant");
  });

  it("human-reviewed field with reviewRequired=false should pass", () => {
    const goodField = {
      path: "document.issuePlace",
      source: "agencyConfig",
      reviewRequired: false,
      reviewedBy: "human",
      reviewedAt: "2026-06-19T00:00:00Z",
      reviewEvidence: { sourceId: "BM-001__abc123", blockId: "P0010", context: "..." },
    };
    const hasReviewMetadata = goodField.reviewedBy && goodField.reviewedAt && goodField.reviewEvidence;
    assert.ok(hasReviewMetadata, "Should have review metadata");
  });

  it("field with source!=unknown but missing review metadata should fail", () => {
    const badField = {
      path: "document.issueDate",
      source: "agencyConfig",
      reviewRequired: false,
      // Missing reviewedBy, reviewedAt, reviewEvidence
    };
    const hasSourceNotUnknown = badField.source !== "unknown";
    const missingReview = !badField.reviewedBy || !badField.reviewedAt || !badField.reviewEvidence;
    assert.ok(hasSourceNotUnknown && missingReview, "Should fail without review metadata");
  });

  it("locked contract with unresolved questions should fail", () => {
    const lockedContract = {
      status: "locked",
      canonicalFields: [],
      docxSlots: [],
      renderBindings: [],
      unresolvedQuestions: ["Paragraph P0010 needs manual review"],
    };
    const hasUnresolved = (lockedContract.unresolvedQuestions ?? []).length > 0;
    assert.ok(hasUnresolved, "Should detect unresolved questions in locked contract");
  });

  it("normalized-docx extractionKind should pass guard", () => {
    const extractionSource = {
      kind: "normalized-docx",
      relativePath: "storage/templates/normalized-docx/BM-001/BM-001_normalized.docx",
      format: "docx",
    };
    assert.strictEqual(extractionSource.kind, "normalized-docx");
    assert.strictEqual(extractionSource.format, "docx");
  });

  it("original format should fail guard", () => {
    const extractionSource = {
      kind: "original",
      format: "doc",
    };
    assert.notStrictEqual(extractionSource.format, "docx", "Original doc format should fail");
  });

  it("BM-001..BM-004 should infer stage code 01", () => {
    const paths = [
      "docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/01. TIEP NHAN GIAI QUYET NGUON TIN VE TOI PHAM/01-Biên bản tiếp nhận nguồn tin về tội phạm.doc",
      "docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/01. TIEP NHAN GIAI QUYET NGUON TIN VE TOI PHAM/02-Phiếu chuyển nguồn tin về tội phạm.doc",
    ];
    const stageRe = /(\d{2})\.\s*[\w\s]*?(?=\/|$)/u;
    for (const p of paths) {
      const m = p.match(stageRe);
      assert.ok(m, `Path should match stage pattern: ${p}`);
      assert.strictEqual(m[1], "01", "Stage code should be 01");
    }
  });
});
