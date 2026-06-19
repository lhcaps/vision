// Test cho Unicode blank detector (Phase A — stabilize pipeline).
// Phải match cả 3 dạng date line:
//   - "ngày ... tháng ... năm ..."
//   - "ngày …… tháng …… năm ……"
//   - "ngày … tháng … năm …"
// Cũng phải match ellipsis đơn lẻ, underscore, numbered blank.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const BLANK_PATTERN = String.raw`(?:\.{3,}|…+|…+|_{3,})`;

const detectBlanksText = (text) => {
  const blanks = [];
  const patterns = [
    { regex: /\.{3,}/gu, kind: "ellipsis-dots" },
    { regex: /…+/gu, kind: "ellipsis-unicode" },
    { regex: /_{3,}/gu, kind: "underscore" },
    {
      regex: new RegExp(`ngày\\s*${BLANK_PATTERN}\\s*tháng\\s*${BLANK_PATTERN}\\s*năm\\s*${BLANK_PATTERN}`, "giu"),
      kind: "vn-date-line",
    },
    { regex: /(?:\(\s*\d+\s*\))\.{2,}/gu, kind: "numbered-blank" },
  ];
  for (const { regex, kind } of patterns) {
    let m;
    while ((m = regex.exec(text))) {
      blanks.push({ kind, raw: m[0] });
    }
  }
  return blanks;
};

describe("Unicode blank detector", () => {
  it("matches dotted ellipsis date line", () => {
    const r = detectBlanksText("ngày ... tháng ... năm ...");
    const dateLine = r.find((b) => b.kind === "vn-date-line");
    assert.ok(dateLine, "vn-date-line phải match");
    assert.equal(dateLine.raw, "ngày ... tháng ... năm ...");
  });

  it("matches Unicode ellipsis (multi-dot ……) date line", () => {
    const r = detectBlanksText("ngày …… tháng …… năm ……");
    const dateLine = r.find((b) => b.kind === "vn-date-line");
    assert.ok(dateLine, "vn-date-line phải match với dấu ……");
    assert.equal(dateLine.raw, "ngày …… tháng …… năm ……");
  });

  it("matches Unicode ellipsis (single …) date line", () => {
    const r = detectBlanksText("ngày … tháng … năm …");
    const dateLine = r.find((b) => b.kind === "vn-date-line");
    assert.ok(dateLine, "vn-date-line phải match với dấu …");
    assert.equal(dateLine.raw, "ngày … tháng … năm …");
  });

  it("matches underscore blanks", () => {
    const r = detectBlanksText("Ô trống: ___ nội dung ___");
    const underscores = r.filter((b) => b.kind === "underscore");
    assert.equal(underscores.length, 2);
  });

  it("matches numbered blanks", () => {
    const r = detectBlanksText("(1).. text");
    const numbered = r.find((b) => b.kind === "numbered-blank");
    assert.ok(numbered, "numbered-blank phải match");
    assert.equal(numbered.raw, "(1)..");
  });

  it("matches ellipsis in text without date line", () => {
    const r = detectBlanksText("Hôm nay, ngày … tháng … năm 2026");
    const unicodeEllipsis = r.filter((b) => b.kind === "ellipsis-unicode");
    assert.equal(unicodeEllipsis.length, 2);
  });
});

describe("SourceId derivation", () => {
  it("uses BM-XXX__<sha12> for forms", async () => {
    const { deriveSourceId } = await import("../../scripts/docx-contract/lib/source-id.mjs");
    const id = deriveSourceId({
      templateCode: "BM-001",
      sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    });
    assert.equal(id, "BM-001__abcdef123456");
  });

  it("uses REF__<slug>__<sha12> for reference docs", async () => {
    const { deriveSourceId } = await import("../../scripts/docx-contract/lib/source-id.mjs");
    const id = deriveSourceId({
      templateCode: null,
      fileName: "Thong tu so 03-2026-VKSTC.docx",
      sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    });
    assert.equal(id, "REF__thong-tu-so-03-2026-vkstc__abcdef123456");
  });

  it("produces unique IDs for duplicate BM codes with different SHA", async () => {
    const { deriveSourceId } = await import("../../scripts/docx-contract/lib/source-id.mjs");
    const a = deriveSourceId({
      templateCode: "BM-139",
      sha256: "1111111111111111111111111111111111111111111111111111111111111111",
    });
    const b = deriveSourceId({
      templateCode: "BM-139",
      sha256: "2222222222222222222222222222222222222222222222222222222222222222",
    });
    assert.notEqual(a, b);
  });
});
