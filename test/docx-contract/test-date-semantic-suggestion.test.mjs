// Test: date semantic suggestion separates detection from semantic binding.
// "Sinh ngày" → informant.birthDate (NOT document.issueDate).
// "Cấp ngày" near ID docs → informant.idDocument.issueDate (NOT document.issueDate).
// Header date line → document.issueDate (still reviewRequired).
import { describe, it } from "node:test";
import assert from "node:assert";
import { suggestDateSemantic } from "../../scripts/docx-contract/lib/date-semantic.mjs";

describe("date-semantic: suggestDateSemantic", () => {
  it("Sinh ngày → informant.birthDate", () => {
    const r = suggestDateSemantic(
      "Sinh ngày ... tháng ... năm ... tại:",
      [],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "informant.birthDate");
    assert.strictEqual(r.suggestedBy, "heuristic");
  });

  it("Sinh ngày with wider context → informant.birthDate", () => {
    const r = suggestDateSemantic(
      "Sinh ngày ... tháng ... năm ... tại:",
      ["Họ và tên: Nguyễn Văn A", "Nghề nghiệp: Công nhân"],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "informant.birthDate");
  });

  it("Cấp ngày near CMND → informant.idDocument.issueDate", () => {
    const r = suggestDateSemantic(
      "Cấp ngày ... tháng ... năm ...",
      ["Số CMND: 012345678"],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "informant.idDocument.issueDate");
  });

  it("Cấp ngày near CCCD → informant.idDocument.issueDate", () => {
    const r = suggestDateSemantic(
      "Ngày cấp: ... tháng ... năm ...",
      ["Số CCCD: 001234567890"],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "informant.idDocument.issueDate");
  });

  it("Cấp ngày near hộ chiếu → informant.idDocument.issueDate", () => {
    const r = suggestDateSemantic(
      "Cấp ngày ... tháng ... năm ... nơi cấp:",
      ["Hộ chiếu số: AB123456"],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "informant.idDocument.issueDate");
  });

  it("Header date line near agency name → document.issueDate", () => {
    const r = suggestDateSemantic(
      "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH, ngày ... tháng ... năm ...",
      ["Số: QĐ-VKSKV7"],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "document.issueDate");
  });

  it("Header date line near 'Độc lập - Tự do - Hạnh phúc' → document.issueDate", () => {
    const r = suggestDateSemantic(
      "Độc lập - Tự do - Hạnh phúc, ngày ... tháng ... năm ...",
      [],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "document.issueDate");
  });

  it("kết thúc → document.completedAt", () => {
    const r = suggestDateSemantic(
      "Thời gian kết thúc: ... tháng ... năm ...",
      [],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "document.completedAt");
  });

  it("hết hạn → document.expirationDate", () => {
    const r = suggestDateSemantic(
      "Thời hạn tạm giam: ... tháng ... năm ...",
      [],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "document.expirationDate");
  });

  it("generic date → document.dateCandidate", () => {
    const r = suggestDateSemantic(
      "Ngày làm việc: ... tháng ... năm ...",
      [],
    );
    assert.strictEqual(r.suggestedCanonicalPath, "document.dateCandidate");
  });

  it("returns suggestedBy=heuristic for all paths", () => {
    const cases = [
      "Sinh ngày ... tháng ... năm ... tại:",
      "Cấp ngày ... tháng ... năm ... - CMND 012345678",
      "Độc lập - Tự do - Hạnh phúc, ngày ... tháng ... năm ...",
      "Thời gian kết thúc:",
      "Thời hạn:",
    ];
    for (const ctx of cases) {
      const r = suggestDateSemantic(ctx, []);
      assert.strictEqual(
        r.suggestedBy,
        "heuristic",
        `suggestedBy should be heuristic for: ${ctx.slice(0, 40)}`,
      );
    }
  });

  it("all suggestions have suggestedReason", () => {
    const cases = [
      "Sinh ngày ... tháng ... năm ... tại:",
      "Cấp ngày ... tháng ... năm ... Số CCCD:",
      "Độc lập - Tự do, ngày ... tháng ... năm ...",
    ];
    for (const ctx of cases) {
      const r = suggestDateSemantic(ctx, []);
      assert.ok(
        Boolean(r.suggestedReason),
        `suggestedReason should be present for: ${ctx.slice(0, 30)}`,
      );
      assert.ok(
        r.suggestedCanonicalPath.includes("."),
        "suggestedCanonicalPath should be namespaced",
      );
    }
  });
});
