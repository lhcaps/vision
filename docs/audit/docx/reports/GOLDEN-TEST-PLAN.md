# Golden Test Plan

Sinh lúc: 2026-06-19T01:19:42.451Z

## Mục tiêu

Đảm bảo contract-driven UI render DOCX đúng, không còn placeholder, không còn fake data.

## Test categories

### 1. Contract validation test

```bash
node scripts/docx-contract/verify-contracts.mjs
# Expect: locked contracts có 0 issues
# Expect: draft contracts có warnings nhưng exit 0
```

### 2. Render DOCX smoke test

Pilot cho BM-001..BM-004:

```bash
# Bước 1: tạo canonical payload hợp lệ
cat > test/fixtures/bm-001.payload.json <<'EOF'
{
  "agency": { "parentName": "VKSND TP.HCM", "name": "VKSND KV7", "issuePlace": "TP. Hồ Chí Minh" },
  "document": { "issueDate": "2026-03-04" },
  "reception": { "startedAtTimeText": "08 giờ 00 phút", "startedAtDate": "2026-03-04", ... },
  "receiver": { ... },
  "informant": { ... },
  "crimeReport": { ... },
  "recipients": { ... }
}
EOF

# Bước 2: render DOCX
pnpm --filter api start:dev
curl -X POST http://localhost:3000/api/v1/documents/generated/{id}/render \
  -H "Content-Type: application/json" \
  -d @test/fixtures/bm-001.payload.json
```

### 3. Unresolved placeholder test

Sau khi render, extract text từ DOCX output và assert:

```js
const forbidden = ["{{...}}", "${...}", "<<...>>", "MERGEFIELD", "…………………", "…, ngày … tháng … năm …"];
for (const f of forbidden) {
  if (text.includes(f)) throw new Error(`Còn placeholder: ${f}`);
}
```

### 4. Rendered DOCX text extraction test

Extract text từ rendered DOCX bằng extractor trong Phase 2. Assert:

- Tên, ngày, nội dung từ payload xuất hiện đúng trong text.
- Không còn chuỗi placeholder.
- Số dòng text gần bằng số dòng của DOCX gốc (chênh lệch ≤ 10%).

### 5. PDF conversion smoke test

```bash
soffice --headless --convert-to pdf output.docx --outdir ./test/output/
ls -la test/output/output.pdf
# Assert: file tồn tại, size > 0 byte
```

### 6. UI smoke test

```bash
pnpm --filter web exec playwright test tests/e2e/contract-driven-bm-001.spec.ts
```

Test cases:
- Mở workspace → chọn template BM-001 → bấm "Chỉnh sửa".
- Form ContractDrivenFormPanel render đủ field.
- Điền payload từ fixture.
- Bấm Lưu → assert success state.
- Tải lại → assert payload giữ nguyên.
- Bấm "Render" → assert PDF tạo OK.
- Console không có error.

### 7. No hardcoded production data test

```bash
# Scan tất cả contract draf.json xem có field nào có sample-like data
node scripts/audit-bm-production-readiness.mjs
```

### 8. UI gene audit test

```bash
pnpm audit:bm:gene
# Expect: 0 violation trong pilot BM-001..BM-004 sau khi refactor sang contract-driven
```

## Pilot test scope

Chỉ chạy cho BM-001..BM-004 trong giai đoạn này. Mở rộng theo wave sau khi pilot pass.

Pilot per BM:

1. Sample canonical payload hợp lệ (đặt tại `test/fixtures/bm-XXX.payload.json`).
2. Render DOCX qua API.
3. Extract text từ DOCX render.
4. Assert tên/ngày/nội dung xuất hiện đúng.
5. Assert không còn `{{...}}`, `${...}`, `<<...>>`.
6. Convert PDF (soffice).
7. Assert PDF tồn tại, size > 0.
8. Open UI panel (Playwright).
9. Save/reload.
10. No console error.

## Không cần implement full golden test suite cho 213 BM trong task này
