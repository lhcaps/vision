#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 8 — Pilot review BM-001..BM-004.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXTRACT_DIR = path.join(ROOT, "docs", "audit", "docx", "extracted");
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const REVIEW_DIR = path.join(ROOT, "docs", "audit", "docx", "review");
const COMPARE_JSON = path.join(ROOT, "docs", "audit", "docx", "reports", "bespoke-vs-docx-contract.json");
const FORM_INPUTS_DIR = path.join(ROOT, "apps", "web", "src", "components", "documents");

const PILOT = ["BM-001", "BM-002", "BM-003", "BM-004"];

const loadJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const buildReview = (code) => {
  // Tìm file extract/contract dựa trên templateCode (có thể có duplicateIndex
  // khác nhau cho cùng code, vd 2 file BM-139).
  const EXTRACT_DIR = path.join(ROOT, "docs", "audit", "docx", "extracted");
  const CONTRACTS_DIR_LOCAL = path.join(ROOT, "docs", "audit", "docx", "contracts");
  const allExtracts = fs
    .readdirSync(EXTRACT_DIR)
    .filter((n) => n.endsWith(".extract.json"))
    .map((n) => JSON.parse(fs.readFileSync(path.join(EXTRACT_DIR, n), "utf8")));
  const allContracts = fs
    .readdirSync(CONTRACTS_DIR_LOCAL)
    .filter((n) => n.endsWith(".contract.draft.json"))
    .map((n) => JSON.parse(fs.readFileSync(path.join(CONTRACTS_DIR_LOCAL, n), "utf8")));
  const extMatches = allExtracts.filter((e) => e.templateCode === code);
  if (extMatches.length === 0) {
    const md = [`# ${code} Review`, "", "_Chưa có file extract cho code này._"];
    return md.join("\n");
  }
  // Nếu có nhiều file (duplicate), lấy file đầu tiên cho pilot; ghi chú các file khác.
  const ext = extMatches[0];
  const con = allContracts.find((c) => c.sourceId === ext.sourceId) ?? allContracts.find((c) => c.templateCode === code) ?? null;
  const cmp = loadJson(COMPARE_JSON).rows.find((r) => r.code === code) ?? null;
  const bespokeFile = path.join(FORM_INPUTS_DIR, `bm-${code.replace("BM-", "")}-form-inputs.tsx`);
  const bespokeText = fs.existsSync(bespokeFile) ? fs.readFileSync(bespokeFile, "utf8") : null;
  const bespokeLines = bespokeText ? bespokeText.split(/\r?\n/u).length : 0;

  const md = [];
  md.push(`# ${code} Review`);
  md.push("");
  md.push(`Sinh lúc: ${new Date().toISOString()}`);
  md.push("");
  md.push("## 1. Nguồn DOCX");
  md.push("");
  md.push(`- SourceId: \`${ext.sourceId}\``);
  if (extMatches.length > 1) {
    md.push(`- ⚠️ Có ${extMatches.length} file cùng code (duplicate). Pilot dùng file đầu tiên.`);
    for (const m of extMatches) {
      md.push(`  - ${m.sourceId} → ${m.relativePath}`);
    }
  }
  md.push(`- File: \`${ext.relativePath}\``);
  md.push(`- SHA256: \`${ext.sha256 ?? "?"}\``);
  md.push(`- Mã biểu mẫu: ${code}`);
  md.push(`- Tiêu đề detect được: ${ext.detectedTitle}`);
  md.push(`- Định dạng: ${ext.format}`);
  md.push(`- Phương pháp trích text: ${ext.method}`);
  if (ext.warnings && ext.warnings.length) {
    md.push(`- Warnings extractor: ${ext.warnings.join("; ")}`);
  }
  md.push("");
  if (!con) {
    md.push("> ⚠️ Chưa có contract draft cho sourceId này (chưa chạy draft-contracts).");
    md.push("");
    return md.join("\n");
  }
  md.push("## 2. Slot DOCX phát hiện");
  md.push("");
  md.push("| Slot ID | Location | Context (rút gọn) | Required | Source proposal | Review needed |");
  md.push("|---|---|---|:-:|---|:-:|");
  for (const slot of con.docxSlots) {
    md.push(
      `| ${slot.slotId} | ${slot.location.partName} / ${slot.location.blockId ?? "?"} | ${slot.context.slice(0, 60).replace(/\|/gu, "\\|")} | ${slot.required ? "✓" : ""} | ${slot.slotType} | ${slot.reviewRequired ? "✓" : ""} |`,
    );
  }
  md.push("");
  md.push("## 3. Canonical fields đề xuất");
  md.push("");
  md.push("> Lưu ý: `suggestedNamespace` và `suggestedBy: heuristic` chỉ là ĐỀ XUẤT máy, không phải truth.");
  md.push("");
  md.push("| Field | Type | Source | UI component | Section | Required |");
  md.push("|---|---|---|---|---|:-:|");
  for (const f of con.canonicalFields) {
    md.push(
      `| ${f.path} | ${f.type} | ${f.source} | ${f.uiComponent} | ${f.section ?? "?"} | ${f.required ? "✓" : ""} |`,
    );
  }
  md.push("");
  md.push("## 4. Render bindings");
  md.push("");
  md.push("| Slot | Field | Transform | Fallback | Review |");
  md.push("|---|---|---|---|:-:|");
  for (const b of con.renderBindings) {
    md.push(
      `| ${b.slotId} | ${b.from} | ${b.transform} | ${b.fallback ?? ""} | ${b.reviewRequired ? "✓" : ""} |`,
    );
  }
  md.push("");
  md.push("## 5. Equivalent representations");
  md.push("");
  if (cmp && cmp.comparison?.equivalent?.length) {
    md.push("- Field BESPOKE ↔ slot DOCX tương đương:");
    for (const e of cmp.comparison.equivalent) {
      md.push(`  - ${e}`);
    }
  } else {
    md.push("- (Không có match tự động — cần reviewer đối chiếu thủ công)");
  }
  md.push("");
  md.push("## 6. True missing fields trong BESPOKE hiện tại");
  md.push("");
  if (cmp && cmp.comparison?.missing?.length) {
    for (const m of cmp.comparison.missing) {
      md.push(`- ${m}`);
    }
  } else {
    md.push("- (Không phát hiện missing — có thể do BESPOKE dùng nested type qua import)");
  }
  md.push("");
  md.push("## 7. Extra fields trong BESPOKE hiện tại");
  md.push("");
  if (cmp && cmp.comparison?.extraSuspicious?.length) {
    for (const e of cmp.comparison.extraSuspicious) {
      md.push(`- ${e}`);
    }
  } else {
    md.push("- (Không có — hoặc BESPOKE dùng nested type qua import không thấy qua regex)");
  }
  md.push("");
  md.push("## 8. UI gene issues");
  md.push("");
  md.push(`- File BESPOKE: \`${bespokeFile.replaceAll(path.sep, "/")}\``);
  md.push(`- Số dòng: ${bespokeLines}`);
  md.push(`- Sử dụng shared kit (BmFormSection/BmFieldText/...): ${cmp?.usesSharedKit ? "Có" : "Không"}`);
  md.push(`- Dùng GenericTemplateFormInputsPanel (stub): ${cmp?.usesGenericPanel ? "Có" : "Không"}`);
  if (cmp?.geneViolations?.length) {
    md.push("- Forbidden patterns phát hiện:");
    for (const v of cmp.geneViolations) md.push(`  - \`${v}\``);
  } else {
    md.push("- Forbidden patterns: (không có)");
  }
  md.push("");
  md.push("## 9. Câu hỏi cần human review");
  md.push("");
  if (con.unresolvedQuestions?.length) {
    for (const q of con.unresolvedQuestions) md.push(`- ${q}`);
  } else {
    md.push("- Nội dung DOCX có dòng `……………………………` (chuỗi chấm) và pattern `ngày … tháng … năm …` cần reviewer xác nhận đó là placeholder hay dấu trang trang trí.");
    md.push("- Contract dùng field name generic (vd `document.field7`). Reviewer cần map lại sang canonical field name theo field-taxonomy.");
    md.push("- Source mặc định là `unknown` — reviewer cần quyết định từng field thuộc `manual` / `manualOrDefault` / `casePayload` / `agencyConfig` / `officialConfig` / `systemDate` / `constantFromDocx` / `derived`.");
    md.push("- Extractor dùng fallback scan UTF-16LE (không parse được Clx đầy đủ). Cần cross-check với LibreOffice/antiword khi có sự cố về text.");
  }
  md.push("");
  md.push("## 10. Recommendation");
  md.push("");
  md.push("- **Có nên lock contract chưa?** KHÔNG. Contract hiện là draft, mọi canonicalField đều `source=unknown`.");
  md.push("- **Cần sửa code ở bước sau:**");
  md.push("  - Sau khi reviewer xác nhận source, chuyển `unknown` → taxonomy hợp lệ.");
  md.push("  - Nếu DOCX có thêm field chuyên biệt (vd BM-001 có `crimeReport`, BM-003 có `sourceAssignment`), thêm namespace mới vào `field-taxonomy.json`.");
  md.push("  - Nếu BESPOKE đang dùng pattern tự code (BM-002, BM-003 thường gặp), refactor sang shared kit `bm-form/` trước khi lock.");
  md.push("  - Nếu BESPOKE đang dùng generic panel (stub), cần viết bespoke theo contract trước khi lock.");
  md.push("- **Có cần plugin riêng không?**");
  if (code === "BM-001") {
    md.push("  - BM-001 có `Bm001DateField` riêng (Ngày/Tháng/Năm). Có thể giữ hoặc migrate sang `BmFieldDate` chung + transform split date.");
    md.push("  - Có nhiều section ký tên (`signerName` ở cả receiver & informant). Có thể cần plugin `MultiSignatureSection`.");
  } else if (code === "BM-002") {
    md.push("  - Có 2 loại người (reporter + receiver). Có thể cần plugin `PersonBlock` cho mỗi loại.");
  } else if (code === "BM-003") {
    md.push("  - Có 3 điều (article1/2/3), điều 2 optional. Có thể cần plugin `ArticleListSection` với conditional.");
    md.push("  - Đã có PLACEHOLDER_CONTRACT.md từ trước — dùng làm nguồn tham khảo.");
  } else if (code === "BM-004") {
    md.push("  - Tương tự BM-003 nhưng về thay đổi người phân công. Có thể dùng chung plugin `AssignmentChangeSection`.");
  }
  md.push("");
  return md.join("\n");
};

const main = () => {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  for (const code of PILOT) {
    const md = buildReview(code);
    fs.writeFileSync(path.join(REVIEW_DIR, `${code}.review.md`), md, "utf8");
    console.log(`Wrote review/${code}.review.md`);
  }
};

main();
