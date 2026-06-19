# DOCX Contract Audit Pipeline

Pipeline DOCX-first để audit 213 biểu mẫu theo TT 03/2026-VKSTC. Thay vì so sánh
field-name 1-1 giữa BESPOKE form và DOCX, pipeline này:

1. Trích cấu trúc DOCX/OOXML (paragraph, table, blank candidate, placeholder).
2. Sinh draft contract cho từng BM (docxSlot + canonicalField + renderBinding).
3. Verify theo schema + taxonomy.
4. So sánh BESPOKE với contract theo slot coverage (không 1-1).
5. Báo cáo UI gene violations + rollout plan.

## Nguyên tắc

- **DOCX gốc là nguồn sự thật duy nhất** (folder `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC`).
- **Không bịa field, không hardcode tên/ngày/case vào production logic**.
- **Tiếng Việt là ngôn ngữ chính** cho mọi report, label, decision log.
- **Mọi script đều idempotent** (chạy nhiều lần cho cùng kết quả).
- **Mọi script đều batch-safe** (1 file lỗi không crash cả batch).
- **UTF-8 no BOM** cho mọi output.

## Scripts

| Script | Phase | Mô tả |
|---|---|---|
| `inventory-docx.mjs` | 1 | Quét folder nguồn, sinh SHA-256, detect BM code, phát hiện duplicate/missing. |
| `extract-docx-structure.mjs` | 2 | Trích paragraph/table/placeholder từ DOCX (OOXML) hoặc DOC (OLE binary). |
| `draft-contracts.mjs` | 3 | Sinh contract.draft.json cho từng BM. Mọi source=unknown, reviewRequired=true. |
| `verify-contracts.mjs` | 5 | Verify theo schema + taxonomy. Strict cho locked, warning cho draft. |
| `compare-bespoke-to-contracts.mjs` | 6 | So sánh BESPOKE với contract theo slot coverage + UI gene audit. |
| `generate-pilot-reviews.mjs` | 8 | Sinh review.md cho BM-001..BM-004. |
| `generate-audit-report.mjs` | 10+ | Sinh master report + missing + UI plan + golden test + taxonomy gaps + rollout. |
| `lib/ole-doc-reader.mjs` | helper | Pure Node OLE CFB reader + Word .doc text extractor. |

## Cách chạy

```bash
# Chạy đầy đủ pipeline:
pnpm audit:docx

# Hoặc từng bước:
pnpm audit:docx:inventory
pnpm audit:docx:extract
pnpm audit:docx:draft
pnpm audit:docx:verify
pnpm audit:docx:compare
pnpm audit:docx:report
pnpm audit:docx:pilot
pnpm audit:bm:gene
```

## Output

| Path | Phase | Mô tả |
|---|---|---|
| `docs/audit/docx/inventory/` | 1 | docx-inventory.json + docx-inventory.md |
| `docs/audit/docx/extracted/BM-XXX.extract.{json,md}` | 2 | Trích xuất cấu trúc DOCX |
| `docs/audit/docx/contracts/BM-XXX.contract.draft.json` | 3 | Draft contract |
| `docs/audit/docx/coverage/BM-XXX.coverage.md` | 5 | Per-BM coverage report |
| `docs/audit/docx/reports/MASTER-DOCX-AUDIT.md` | 10 | Báo cáo tổng thể |
| `docs/audit/docx/reports/SLOT-COVERAGE-SUMMARY.md` | 5 | Bảng tổng hợp slot coverage |
| `docs/audit/docx/reports/BESPOKE-VS-DOCX-CONTRACT.md` | 6 | So sánh BESPOKE vs contract |
| `docs/audit/docx/reports/MISSING-CONTRACTS.md` | 10 | Missing/duplicate file |
| `docs/audit/docx/reports/FIELD-TAXONOMY-GAPS.md` | 10 | Field naming convention gaps |
| `docs/audit/docx/reports/CONTRACT-DRIVEN-UI-PLAN.md` | 7 | Plan cho contract-driven UI |
| `docs/audit/docx/reports/CONTRACT-DRIVEN-UI-ROLLOUT.md` | 12 | Rollout plan với feature flag |
| `docs/audit/docx/reports/GOLDEN-TEST-PLAN.md` | 9 | Golden test plan |
| `docs/audit/docx/reports/BM-PANEL-GENE-AUDIT.md` | 11 | UI gene audit |
| `docs/audit/docx/review/BM-001..004.review.md` | 8 | Pilot review cho 4 biểu mẫu đầu tiên |

## Schema & taxonomy

| File | Mô tả |
|---|---|
| `docs/contracts/contract.schema.json` | JSON Schema cho contract |
| `docs/contracts/field-taxonomy.json` | Canonical field namespaces (agency, document, ...) |
| `docs/contracts/source-taxonomy.json` | Allowed source values (manual, casePayload, ...) |
| `docs/contracts/transform-taxonomy.json` | Render transform definitions (date.day, ...) |

## Limitations đã thừa nhận

Xem chi tiết trong `MASTER-DOCX-AUDIT.md`. Tóm tắt:

- DOC binary Clx parser fail cho tất cả 213 file `.doc` (Clxt tag không theo spec chuẩn). Extractor fallback scan UTF-16LE — vẫn trích được text tiếng Việt có nghĩa.
- BESPOKE field extraction dùng regex đơn giản — không thấy field path từ file dùng nested TypeScript type qua `import`. Cần `ts-morph` để phân tích AST đầy đủ.
- Canonical field name auto-generated từ blank candidate dùng pattern generic (`document.field7`). Reviewer phải map sang field name theo `field-taxonomy.json`.
- Không render DOCX thật ở phase này — smoke test render cần pipeline riêng (xem `GOLDEN-TEST-PLAN.md`).

## Không được

- Không viết lại 213 React form bằng tay.
- Không coi code BESPOKE hiện tại là sự thật.
- Không coi contract cũ là sự thật nếu không truy vết được về DOCX gốc.
- Không hardcode tên người, ngày, vụ án vào production logic.
- Không dùng sample data làm production default.
- Không claim 100% đúng khi chưa có slot coverage + review evidence.
