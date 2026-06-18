#!/usr/bin/env node
/**
 * Merge all per-template JSON results in audit_renders/ into a single SUMMARY.md
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'audit_renders');
const files = fs.readdirSync(DIR).filter((f) => /-result\.json$/.test(f));
const results = files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
results.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));

const ok = results.filter((r) => r.status === 'OK');
const failed = results.filter((r) => r.status !== 'OK');
const withPlaceholders = results.filter((r) => (r.placeholderCount || 0) > 0 || (r.docxPlaceholders && r.docxPlaceholders.found));
const withDocxPlaceholders = results.filter((r) => r.docxPlaceholders && r.docxPlaceholders.found);

const md = [];
md.push(`# BM Render Verification — Final report`);
md.push(`*Merged: ${new Date().toLocaleString('vi-VN')}*`);
md.push('');
md.push(`## Tổng quan`);
md.push('');
md.push(`| Metric | Count |`);
md.push(`|---|---|`);
md.push(`| Tổng templates | **${results.length}** |`);
md.push(`| Render OK | **${ok.length}** |`);
md.push(`| Failed | **${failed.length}** |`);
md.push(`| Còn placeholder trong payload | **${results.filter((r) => (r.placeholderCount || 0) > 0).length}** |`);
md.push(`| Còn placeholder trong DOCX (sau render) | **${withDocxPlaceholders.length}** |`);
md.push('');
md.push('## Phân bố theo Stage');
md.push('');
const byStage = {};
for (const r of results) {
  const k = r.stage || 'UNKNOWN';
  byStage[k] = byStage[k] || { ok: 0, fail: 0 };
  byStage[k].ok += r.status === 'OK' ? 1 : 0;
  byStage[k].fail += r.status === 'OK' ? 0 : 1;
}
md.push('| Stage | OK | Failed |');
md.push('|---|---|---|');
for (const [s, c] of Object.entries(byStage)) {
  md.push(`| ${s} | ${c.ok} | ${c.fail} |`);
}
md.push('');
md.push('## Phân bố theo Group');
md.push('');
const byGroup = {};
for (const r of results) {
  const k = r.group || 'UNKNOWN';
  byGroup[k] = byGroup[k] || { ok: 0, fail: 0 };
  byGroup[k].ok += r.status === 'OK' ? 1 : 0;
  byGroup[k].fail += r.status === 'OK' ? 0 : 1;
}
md.push('| Group | OK | Failed |');
md.push('|---|---|---|');
for (const [g, c] of Object.entries(byGroup)) {
  md.push(`| ${g} | ${c.ok} | ${c.fail} |`);
}
md.push('');
md.push('## Failed');
md.push('');
if (failed.length === 0) {
  md.push('_Không có biểu mẫu nào render thất bại._');
} else {
  md.push('| Mã BM | Tên | Stage | Lý do |');
  md.push('|---|---|---|---|');
  for (const r of failed) {
    md.push(`| ${r.code} | ${r.name} | ${r.stage} | ${r.status}: ${(r.error || '').slice(0, 80)} |`);
  }
}
md.push('');
md.push('## Biểu mẫu còn placeholder');
md.push('');
if (withPlaceholders.length === 0) {
  md.push('_Không phát hiện placeholder nào chưa được thay thế trong payload hoặc DOCX._');
} else {
  md.push('| Mã BM | Tên | Stage | Số placeholder (payload) | Số placeholder (DOCX) |');
  md.push('|---|---|---|---|---|');
  for (const r of withPlaceholders) {
    md.push(`| ${r.code} | ${r.name} | ${r.stage} | ${r.placeholderCount || 0} | ${(r.docxPlaceholders && r.docxPlaceholders.count) || 0} |`);
  }
}
md.push('');
md.push('## Chi tiết (213 biểu mẫu)');
md.push('');
md.push('| # | Mã BM | Stage | Group | Status | Payload PH | DOCX PH | File |');
md.push('|---|---|---|---|---|---|---|---|');
results.forEach((r, i) => {
  const ph = r.placeholderCount || 0;
  const dph = r.docxPlaceholders ? r.docxPlaceholders.count : '-';
  const fn = r.renderedFile ? r.renderedFile.fileName : '-';
  md.push(`| ${i + 1} | ${r.code} | ${r.stage || '-'} | ${r.group || '-'} | ${r.status} | ${ph} | ${dph} | ${fn} |`);
});

const out = md.join('\n');
fs.writeFileSync(path.join(DIR, 'SUMMARY.md'), out);
console.log(`Merged ${results.length} results into SUMMARY.md`);
console.log(`  OK: ${ok.length}, Failed: ${failed.length}`);
console.log(`  Placeholders: payload=${results.filter((r) => (r.placeholderCount || 0) > 0).length}, docx=${withDocxPlaceholders.length}`);
