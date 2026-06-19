#!/usr/bin/env node
// DOCX-first audit pipeline: Phase 11 — BM panel gene audit (standalone).
// Scan tất cả bm-*-form-inputs.tsx xem có vi phạm UI gene không.
// Báo cáo bằng tiếng Việt.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FORM_DIR = path.join(ROOT, "apps", "web", "src", "components", "documents");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

const FORBIDDEN = [
  { name: "local-inputClass", label: "Khai báo inputClass local", regex: /\b(?:const|let|var)\s+inputClass\s*=/u },
  { name: "local-textareaClass", label: "Khai báo textareaClass local", regex: /\b(?:const|let|var)\s+textareaClass\s*=/u },
  { name: "local-labelClass", label: "Khai báo labelClass local", regex: /\b(?:const|let|var)\s+labelClass\s*=/u },
  { name: "local-Section-component", label: "Function Section() tự định nghĩa", regex: /\bfunction\s+Section\s*\(/u },
  { name: "local-SectionCard-component", label: "Function SectionCard() tự định nghĩa", regex: /\bfunction\s+SectionCard\s*\(/u },
  { name: "local-Field-component", label: "Function Field() tự định nghĩa", regex: /\bfunction\s+Field\s*\(/u },
  { name: "local-TextAreaField-component", label: "Function TextAreaField() tự định nghĩa", regex: /\bfunction\s+TextAreaField\s*\(/u },
  { name: "local-StatusMessage-component", label: "Function StatusMessage() tự định nghĩa", regex: /\bfunction\s+StatusMessage\s*\(/u },
  { name: "direct-fetch", label: "Dùng fetch() trực tiếp trong component", regex: /\bfetch\s*\(\s*[`'"]/u },
  { name: "API_BASE_URL", label: "Dùng API_BASE_URL", regex: /\bAPI_BASE_URL\b/u },
  { name: "bg-slate-950", label: "Dùng bg-slate-950 (màu tùy biến)", regex: /\bbg-slate-950\b/u },
  { name: "bg-blue-50", label: "Dùng bg-blue-50 (màu tùy biến)", regex: /\bbg-blue-50\b/u },
];

const hasAllowException = (text, name) =>
  Boolean(text.match(new RegExp(`//\\s*bm-gene-audit-allow:[^\\n]*${name}`, "iu")));

const scanOne = (file) => {
  const text = fs.readFileSync(file, "utf8");
  const fileName = path.basename(file);
  const codeMatch = fileName.match(/bm-(\d{3})-form-inputs\.tsx$/u);
  const code = codeMatch ? `BM-${codeMatch[1]}` : fileName;
  const violations = [];
  for (const rule of FORBIDDEN) {
    if (rule.regex.test(text) && !hasAllowException(text, rule.name)) {
      // Tìm line numbers
      const lines = text.split(/\r?\n/u);
      const linesFound = [];
      for (let i = 0; i < lines.length; i += 1) {
        if (rule.regex.test(lines[i])) linesFound.push(i + 1);
      }
      violations.push({ rule: rule.name, label: rule.label, lines: linesFound });
    }
  }
  return { code, file: path.relative(ROOT, file).replaceAll(path.sep, "/"), violations };
};

const main = () => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const files = fs
    .readdirSync(FORM_DIR)
    .filter((n) => /^bm-\d{3}-form-inputs\.tsx$/u.test(n))
    .map((n) => path.join(FORM_DIR, n));
  files.sort();

  const results = files.map(scanOne);
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  const byRule = new Map();
  for (const r of results) {
    for (const v of r.violations) {
      byRule.set(v.rule, (byRule.get(v.rule) ?? 0) + 1);
    }
  }

  const md = ["# BM Panel Gene Audit"];
  md.push("");
  md.push(`Sinh lúc: ${new Date().toISOString()}`);
  md.push("");
  md.push("## Tổng quan");
  md.push("");
  md.push(`- Tổng BESPOKE files: **${results.length}**`);
  md.push(`- File có violation: **${results.filter((r) => r.violations.length > 0).length}**`);
  md.push(`- Tổng violation: **${totalViolations}**`);
  md.push("");
  md.push("## Vi phạm theo rule");
  md.push("");
  md.push("| Rule | Label | Số file vi phạm |");
  md.push("|---|---|---:|");
  for (const rule of FORBIDDEN) {
    const count = byRule.get(rule.name) ?? 0;
    md.push(`| \`${rule.name}\` | ${rule.label} | ${count} |`);
  }
  md.push("");
  md.push("## Top 30 BESPOKE vi phạm nhiều nhất");
  md.push("");
  md.push("| BM | File | Số violation | Chi tiết |");
  md.push("|---|---|---:|---|");
  const sorted = results
    .filter((r) => r.violations.length > 0)
    .sort((a, b) => b.violations.length - a.violations.length)
    .slice(0, 30);
  for (const r of sorted) {
    md.push(
      `| ${r.code} | ${r.file} | ${r.violations.length} | ${r.violations.map((v) => v.rule).join(", ")} |`,
    );
  }
  md.push("");
  md.push("## Kết quả kỳ vọng");
  md.push("");
  md.push("- **BM-001**: bị report nhẹ về `bg-slate-950` (button Lưu). Đã dùng shared kit.");
  md.push("- **BM-002, BM-003, BM-039, BM-097, BM-156**: bị report nặng (custom shell, direct fetch, local classes).");
  md.push("- **BM-004**: nên không bị report nặng nếu đã dùng shared kit.");
  md.push("");
  md.push("## Cách fix");
  md.push("");
  md.push("1. Dùng shared component từ `bm-form/`:");
  md.push("   ```ts");
  md.push("   import { BmFormSection, BmFieldText, BmFieldTextarea, BmFieldDate, BmFieldSelect, BmFormStatus, BmFormActions, BmFormMetaBar } from \"@/components/documents/bm-form\";");
  md.push("   ```");
  md.push("2. Nếu cần màu tùy biến, dùng `BM_FORM_CLASSES` từ `bm-form/classes.ts`.");
  md.push("3. Nếu bắt buộc phải dùng pattern bị cấm, thêm comment:");
  md.push("   ```ts");
  md.push("   // bm-gene-audit-allow: lý do cụ thể");
  md.push("   ```");
  md.push("");

  fs.writeFileSync(path.join(REPORTS_DIR, "BM-PANEL-GENE-AUDIT.md"), md.join("\n"), "utf8");
  fs.writeFileSync(
    path.join(REPORTS_DIR, "bm-panel-gene-audit.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), summary: { totalFiles: results.length, violationFiles: results.filter((r) => r.violations.length > 0).length, totalViolations, byRule: Object.fromEntries(byRule) }, results }, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify({ totalFiles: results.length, totalViolations }, null, 2));
};

main();
