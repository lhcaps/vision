# Master DOCX Audit Report

Sinh lúc: 2026-06-19T07:39:52.606Z

## Summary

- Tổng DOCX tìm thấy trong folder nguồn: **216** (3 .docx + 213 .doc)
- Biểu mẫu (form): **214** | Tài liệu tham chiếu (Thông tư/Danh mục): **2**
- Tổng BM codes detect được: **213** (BM-001..BM-213 đầy đủ, 0 missing)
- Duplicate BM code: **1** (BM-139 có 2 file — reviewer phải chọn canonical source)
- File không detect được code: **2** (2 file Thông tư — xem REFERENCE-DOCUMENTS.md)
- File lỗi/corrupt: **0**
- Extract success count: **216/216**
- Draft contract count: **214** | locked: **0**
- Tổng docxSlots: **1802**
- Tổng unknown sources: **1526**
- Tổng review-required items (slot+field+binding): **5130**
- Tổng missing binding (slot không có renderBinding): **0**
- Tổng BESPOKE files so sánh: **213**
  - Có contract: **213**
  - Stub (GenericPanel): **68**
  - UI gene violations: **481**

## Methodology

Pipeline DOCX-first gồm 6 bước:

```txt
DOCX gốc (.doc / .docx)
  → inventory (Phase 1): SHA-256, detect BM code
  → extract (Phase 2): trích paragraph + table + blank candidate
  → draft contract (Phase 3): docxSlot + canonicalField + renderBinding
  → verify (Phase 5): check schema, taxonomy, locked strict
  → compare bespoke (Phase 6): slot coverage + UI gene audit
  → master report (Phase 10): tổng hợp
```

Mỗi bước đều idempotent, không crash khi 1 file lỗi, output UTF-8 no BOM.

## Vì sao cách verify BESPOKE cũ chưa đủ

- Audit cũ (xem `.planning/VERIFY-145-BESPOKE.md`) chỉ đếm theo field-name 1-1 → 0/21 file match 100% contract.
- Nguyên nhân: BESPOKE thường dùng `reception.startedAtDate` (ISO date) trong khi contract dùng `reception.startedAtDay/Month/Year` (split date). Nếu có render binding split date thì vẫn đúng.
- Phase 6 của pipeline này đã xử lý: so sánh theo slot coverage + transform tương đương, không so 1-1.
- Tuy nhiên Phase 6 vẫn có limitation: BESPOKE dùng nested TypeScript type qua `import { EmptyBm001FormInputs } from './bm001-form-inputs-api'`, regex không thấy các field path trong file form-inputs.tsx. Cần tool có AST thật (ts-morph) để giải quyết triệt để.

## Current risk level

- **Cao**: 0/214 contract locked, 100% source=unknown, 100% reviewRequired=true.
- **Trung bình**: 481 UI gene violations tổng cộng (chủ yếu ở BM-002, BM-003, BM-039, BM-097, BM-156 vẫn dùng custom shell).
- **Cao**: 68 BESPOKE dùng GenericTemplateFormInputsPanel (stub), chưa có contract cho từng BM này.
- **Thấp**: 0 file lỗi extract — pipeline ổn định, idempotent.

## Pilot BM-001..BM-004 findings

Xem chi tiết tại `docs/audit/docx/review/BM-001.review.md` .. `BM-004.review.md`.

Tóm tắt:

| SourceId | BM | Tên | Paragraphs | Blanks | Slots | Fields | Review |
|---|---|---|---:|---:|---:|---:|---|
| BM-001__f4c2aa3682d3 | BM-001 | Biên bản tiếp nhận nguồn tin về tội phạm | 38 | 0 | 28 | 28 | Tất cả slot+field đều reviewRequired=true |
| BM-002__f78301178da7 | BM-002 | Phiếu chuyển nguồn tin về tội phạm | 36 | 0 | 32 | 29 | Tất cả slot+field đều reviewRequired=true |
| BM-003__bb64990bc49b | BM-003 | QĐ phân công THQCT, KS việc tiếp nhận, giải quyết nguồn tin về tội phạm | 26 | 0 | 10 | 10 | Tất cả slot+field đều reviewRequired=true |
| BM-004__2775520fd22c | BM-004 | QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin | 24 | 45 | 50 | 46 | Tất cả slot+field đều reviewRequired=true |

## Recommended migration strategy

1. **Contract-first**: Mỗi BM có 1 contract JSON chính thức, không viết tay 213 form.
2. **Shared UI renderer**: 1 component `ContractDrivenFormPanel` đọc contract, render form bằng `BmFormSection` + `BmFieldText/Textarea/Date/Select` từ `bm-form/`.
3. **Plugin registry**: Cho những BM có logic đặc biệt (BM-001 multi-date, BM-003 articles, BM-156 30+ field), đăng ký plugin riêng.
4. **Feature flag rollout**: Mặc định giữ BESPOKE hiện tại. Bật contract-driven UI theo `templateCode` qua env `NEXT_PUBLIC_CONTRACT_UI_BM_CODES=BM-001,BM-002,BM-003,BM-004`.

Xem chi tiết: `CONTRACT-DRIVEN-UI-PLAN.md`.

## Next wave plan

- **Wave 1**: Lock BM-001..BM-004 sau khi reviewer xác nhận từng `unknown` source → taxonomy hợp lệ.
- **Wave 2**: Nhóm G01 TIEP_NHAN (BM-001..BM-030) — pilot Wave 1 trước, sau đó nhân rộng cho cả nhóm.
- **Wave 3**: G02 BP_NGAN_CHAN (BM-031..BM-069).
- **Wave 4**: G03 NGUOI_THAM_GIA (BM-070..BM-084).
- **Wave 5**: G04 DIEU_TRA (BM-085..BM-140) — nhóm lớn nhất, cần chia nhỏ.
- **Wave 6**: G05 TRUY_TO (BM-141..BM-168).
- **Wave 7**: G06 VAT_CHUNG (BM-169..BM-173).
- **Wave 8**: G07 DIEU_TRA_DAC_BIET (BM-174..BM-178).
- **Wave 9**: G08 THU_TUC_DAC_BIET (BM-179..BM-184).
- **Wave 10**: G09 NGUOI_CHƯA_THANH_NIEN (BM-185..BM-213).

## Definition of Done

- [x] 216/216 inventoried (trong folder nguồn `0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC`)
- [x] 216/216 extracted (extractor chạy hết, 0 error)
- [x] 214/214 contracts drafted (form only, 2 reference docs excluded)
- [ ] 214/214 contracts reviewed và locked (chưa — chờ reviewer)
- [ ] 0 unknown sources (hiện tại 1526)
- [ ] 0 unresolved slots (chưa — chờ reviewer)
- [ ] 214/214 render smoke pass (chưa — cần ContractDrivenFormPanel pilot)
- [ ] 214/214 PDF smoke pass (chưa — cần backend render integration)
- [ ] shared UI gene pass (chưa — 481 violations đang tồn tại)

## Limitations đã thừa nhận

- **DOC binary Clx parser thất bại** cho tất cả 213 file `.doc` (format Clxt không theo MS-DOC spec hoặc file đã được convert sang OLE compound với layout khác). Extractor fallback scan UTF-16LE — vẫn trích được text tiếng Việt có nghĩa, nhưng có thể bỏ sót một số vị trí text khi có control character.
- **BESPOKE field extraction dùng regex đơn giản** — không thấy field path từ file dùng nested TypeScript type qua `import`. Cần `ts-morph` để phân tích AST đầy đủ.
- **Canonical field name auto-generated từ blank candidate** dùng pattern generic (`document.field7`) — không có ngữ nghĩa nghiệp vụ. `suggestedNamespace` và `suggestedBy: heuristic` chỉ là ĐỀ XUẤT máy. Reviewer phải map sang field name theo `field-taxonomy.json` và quyết định source.
- **DOCX table parser** vẫn dùng regex (không phải XML parser đầy đủ). gridSpan/vMerge giờ parse đúng từ `<w:tcPr>` block, nhưng nested table hoặc style phức tạp có thể vẫn bỏ sót.
- **Không render DOCX thật** ở phase này — chỉ extract structure. Smoke test render DOCX cần pipeline riêng (xem `GOLDEN-TEST-PLAN.md`).
- **Verify chỉ là structural**: schema + taxonomy, không phải semantic/legal. Xem `SLOT-COVERAGE-SUMMARY.md` để biết rõ phạm vi.
- **Không có OCR**: nếu file là scan ảnh (không phải text), pipeline sẽ fail. Tất cả 213 file trong folder nguồn đều là text (verified bằng cách extract được paragraph).
