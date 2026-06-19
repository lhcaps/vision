// Regression test: blank candidates must not map to wrong blockId.
// Scenario: paragraph A has long dots, paragraph B has "Sinh ngày...", paragraph C has dots.
// Candidate C must stay in block C, not be incorrectly mapped to block A.
import { describe, it } from "node:test";
import assert from "node:assert";
import { detectBlanksInBlock, detectBlanksInBlocks, BLANK_PATTERN } from "../../scripts/docx-contract/lib/blank-detector.mjs";

describe("blank-detector: block location regression", () => {
  it("paragraph C dots must NOT map to paragraph A", () => {
    // Paragraph A: long dots (first occurrence)
    const paraA = ".................................................";
    // Paragraph B: date line
    const paraB = "Sinh ngày ... tháng ... năm ...";
    // Paragraph C: dots with label prefix
    const paraC = "Nơi tạm trú: ................................";

    const blocks = [
      { blockId: "P0001", text: paraA },
      { blockId: "P0002", text: paraB },
      { blockId: "P0003", text: paraC },
    ];

    const result = detectBlanksInBlocks(blocks, []);

    // Para C dots should be detected in P0003
    const paraCDots = result.filter(
      (b) => b.blockId === "P0003" && b.kind === "ellipsis-dots",
    );
    assert.ok(paraCDots.length > 0, "Para C dots should be detected");

    // Para A dots should be detected in P0001
    const paraADots = result.filter(
      (b) => b.blockId === "P0001" && b.kind === "ellipsis-dots",
    );
    assert.ok(paraADots.length > 0, "Para A dots should be detected");

    // Para C dots must NOT appear under P0001
    const misclassified = result.filter(
      (b) => b.blockId === "P0001" && b.context?.includes("Nơi tạm trú"),
    );
    assert.strictEqual(
      misclassified.length,
      0,
      "Para C content must not appear under P0001",
    );
  });

  it("vn-date-line in paragraph must report correct blockId", () => {
    const blocks = [
      { blockId: "P0010", text: "Sinh ngày ... tháng ... năm ... tại:" },
    ];
    const result = detectBlanksInBlocks(blocks, []);
    const dateLines = result.filter((b) => b.kind === "vn-date-line");
    assert.ok(dateLines.length > 0, "Should detect vn-date-line");
    assert.strictEqual(dateLines[0].blockId, "P0010");
    assert.ok(
      dateLines[0].startOffset >= 0,
      "Must have valid startOffset",
    );
    assert.ok(
      dateLines[0].endOffset > dateLines[0].startOffset,
      "endOffset must be > startOffset",
    );
  });

  it("underscore blanks detected with correct blockId", () => {
    const blocks = [
      { blockId: "P0050", text: "Địa chỉ: ______________________________________" },
    ];
    const result = detectBlanksInBlocks(blocks, []);
    const underscores = result.filter((b) => b.kind === "underscore");
    assert.ok(underscores.length > 0, "Should detect underscore blank");
    assert.strictEqual(underscores[0].blockId, "P0050");
  });

  it("numbered blank detected with correct blockId", () => {
    const blocks = [
      { blockId: "P0070", text: "(1)..........................." },
    ];
    const result = detectBlanksInBlocks(blocks, []);
    const numbered = result.filter((b) => b.kind === "numbered-blank");
    assert.ok(numbered.length > 0, "Should detect numbered blank");
    assert.strictEqual(numbered[0].blockId, "P0070");
  });

  it("table cell blank detected with tableCellId", () => {
    const tables = [
      {
        tableId: "T0001",
        rows: [
          {
            rowIndex: 1,
            cells: [
              {
                cellId: "T0001.R0001.C0001",
                text: "Nơi cấp: ________________________________",
                gridSpan: 1,
                vMerge: null,
              },
            ],
          },
        ],
      },
    ];
    const result = detectBlanksInBlocks([], tables);
    const underscoreBlanks = result.filter((b) => b.kind === "underscore");
    assert.ok(underscoreBlanks.length > 0, "Should detect table cell blank");
    assert.strictEqual(
      underscoreBlanks[0].tableCellId,
      "T0001.R0001.C0001",
    );
    assert.strictEqual(underscoreBlanks[0].blockId, "T0001");
  });

  it("all blank results have required fields", () => {
    const blocks = [
      { blockId: "P0001", text: "Họ tên: ___________________________________" },
      { blockId: "P0002", text: "Sinh ngày ... tháng ... năm ..." },
      { blockId: "P0003", text: "Địa chỉ: ............................" },
    ];
    const result = detectBlanksInBlocks(blocks, []);
    for (const b of result) {
      assert.ok("kind" in b, "must have kind");
      assert.ok("raw" in b, "must have raw");
      assert.ok("blockId" in b, "must have blockId");
      assert.ok("tableCellId" in b, "must have tableCellId");
      assert.ok("startOffset" in b, "must have startOffset");
      assert.ok("endOffset" in b, "must have endOffset");
      assert.ok("context" in b, "must have context");
      assert.ok(
        b.startOffset >= 0 && b.endOffset > b.startOffset,
        "offset range must be valid",
      );
    }
  });

  it("BLANK_PATTERN matches all expected forms", () => {
    const testCases = [
      "...",
      "............",
      "……",
      "………",
      "…",
      "___",
      "__________",
    ];
    const re = new RegExp(`^${BLANK_PATTERN}$`, "u");
    for (const tc of testCases) {
      assert.ok(
        re.test(tc),
        `BLANK_PATTERN should match: ${JSON.stringify(tc)}`,
      );
    }
  });

  it("detectBlanksInBlock returns empty array for text without blanks", () => {
    const result = detectBlanksInBlock(
      "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
      "P0001",
      null,
    );
    assert.strictEqual(result.length, 0);
  });
});
