# PLAN — Hoàn thiện 213 biểu mẫu (BM)

> Viết 2026-06-19 sau audit 213 form.
> Bám sát: `docs/BM_CANONICAL_SPEC.md` + `.planning/PLAN-bm-auto-populate.md` (Phase 5).
> Tổng cộng cần xử lý **113 biểu** (78 WRAPPER + 34 LEGACY + 1 EMPTY-thực-chất-là-LEGACY-misclass).
> Không bao gồm 100 BESPOKE hiện tại (đã đúng SPEC) và 100 BM bespoke chưa wire BM_FIELD_MAP (Hướng 2 độc lập).

## 0. Tóm tắt 1 phút

| Loại | Số | Cần làm gì | Rủi ro | Effort ước lượng |
|---|---|---|---|---|
| **BESPOKE** | 100 | Đã đúng SPEC. Wire thêm nút "Lấy từ vụ án" + BM_FIELD_MAP cho ~50 form còn thiếu (Hướng 2). | Thấp | 1-2 ngày (script injection) |
| **WRAPPER** | 78 | Stub dùng `GenericTemplateFormInputsPanel`. Refactor → BESPOKE dùng `BmFormSection/BmField*`. | Trung bình (cần đọc DOCX + map 8 nhóm) | 6-8 tuần (1 PR/biểu) |
| **LEGACY** | 34 | Tự code `Field/SelectField/SectionCard` local. Refactor → dùng `bm-form/`. UI thật đang chạy → phải giữ nguyên hành vi. | Cao (regress production) | 3-4 tuần (1 PR/biểu) |
| **EMPTY (thực tế)** | 1 | BM-156: 1500 dòng code đầy đủ, audit script classify sai vì không match pattern. Cần sửa audit script. File KHÔNG lỗi. | Thấp | 15 phút (fix audit) |
| **Tổng còn lại** | **113** | | | **~10-12 tuần (1 người fulltime)** |

**Sự thật cần thừa nhận**: 113 biểu × ~300-500 dòng bespoke = **~30.000-50.000 dòng code mới**, 1 PR mỗi biểu, mỗi PR cần `tsc --noEmit` + `eslint` + `audit:bm` xanh. 1 turn AI không thể "hoàn thiện hết". Turn này chỉ tạo PLAN. Execution sẽ là nhiều session/tuần.

---

## 1. Phát hiện mới (2026-06-19, fix ngay)

### 1.1. BM-156 KHÔNG EMPTY — audit script có bug

**Bằng chứng:**
- File `bm-156-form-inputs.tsx` = **56.137 bytes / 1500 dòng** (đo lúc 04:39 ICT).
- Audit `scripts/audit_bespoke.py` đếm `len(text) < 800` (ký tự, không phải dòng) → file này rõ ràng > 800 ký tự.
- Nhưng classify trả EMPTY vì:
  - `PATTERN_GENERIC` không match (BM-156 có code thật, không dùng `GenericTemplateFormInputsPanel`).
  - `PATTERN_LEGACY` không match (BM-156 dùng `function TextInput`/`function TextArea`/`function SectionBox` chứ không phải `function Field`/`function SectionCard`).
  - `PATTERN_PRIMITIVES` không match (BM-156 không dùng `BmFormSection/BmFieldText/BmFieldDate/...`).
  - Rơi vào `return "EMPTY"` cuối hàm.

→ **Sửa audit script trước khi làm bất cứ việc gì khác.** Đề xuất thêm 1 loại: `CUSTOM_LOCAL` (BM-156 style: tự code UI component nhưng không theo LEGACY pattern hay BESPOKE pattern).

**Fix mẫu (PR nhỏ ~5 dòng):**

```python
PATTERN_CUSTOM_LOCAL = re.compile(
    r"function\s+(TextInput|TextArea|SectionBox|OptionalTextArea|DateSelectField|PreviewBox)\b"
)
def classify(text: str) -> str:
    if PATTERN_CUSTOM_LOCAL.search(text) and not PATTERN_PRIMITIVES.search(text):
        return "CUSTOM_LOCAL"
    if PATTERN_GENERIC.search(text):
        return "WRAPPER"
    if PATTERN_LEGACY.search(text) and not PATTERN_PRIMITIVES.search(text):
        return "LEGACY"
    if PATTERN_PRIMITIVES.search(text):
        return "BESPOKE"
    return "EMPTY"
```

→ Sau fix, BM-156 sẽ từ EMPTY → CUSTOM_LOCAL. Và ta sẽ thấy **bao nhiêu file nữa rơi vào CUSTOM_LOCAL** — có thể có vài chục file LEGACY cũng đã được refactor một nửa và audit không nhận ra.

**Verify fix:**
- Chạy `py scripts/audit_bespoke.py` trước & sau fix.
- Số EMPTY phải giảm từ 1 → 0.
- Số BESPOKE+WRAPPER+LEGACY+CUSTOM_LOCAL = 213.

### 1.2. Khối lượng ước lượng (sau khi fix audit)

Có thể số sẽ thay đổi nhỏ (vài file LEGACY → CUSTOM_LOCAL). Kỳ vọng:
- BESPOKE: 100-105
- WRAPPER: 75-78
- LEGACY: 30-34
- CUSTOM_LOCAL: 1-5 (BM-156 + có thể BM-141, BM-144 nếu dùng pattern riêng)

---

## 2. Chia phase (theo 9 nhóm SPEC + theo loại)

### Phase 5.2 — G02 BP_NGAN_CHAN (bắt đầu tiếp theo BM-156 fix)

**Gốc**: 17 stub WRAPPER cần bespoke (BM-021, 022, 024-028, 032, 034-036, 041, 048-052, 060-069) + 11 LEGACY (BM-031, 039, 042, 043, 045-047, 054-058) = **28 biểu**.

**Đặc thù G02 (BP_NGAN_CHAN):**
- Không có agency (BM là quyết định áp dụng BP ngăn chặn, không phải văn bản hành chính do VKS ban hành → vẫn có agency parent/name, nhưng form ngắn hơn).
- Có `person.accused` (bị can bị áp dụng BP).
- Có `giamHan.deadline` extension (BM-141, 144).
- Có `offense.legalArticle` (BM-033, 038 đã bespoke dùng `legalArticle`).

**Pilot batch (1 tuần, 3-5 biểu):**

| # | BM | Loại | Loại biểu | BM_FIELD_MAP? | Ghi chú |
|---|---|---|---|---|---|
| 1 | BM-021 | WRAPPER | QĐ không khởi tố vụ án | Có (cần thêm) | Tương tự BM-002 về cấu trúc (agency + document + person.informant + content) |
| 2 | BM-022 | WRAPPER | QĐ không khởi tố bị can | Có (cần thêm) | Tương tự BM-021 |
| 3 | BM-024 | WRAPPER | QĐ phục hồi vụ án | Cần thêm | Có `caseRecovery.legalBasis` (BM-156 dùng pattern này) |
| 4 | BM-025 | WRAPPER | QĐ nhập vụ án | Cần thêm | Tương tự BM-024 |
| 5 | BM-026 | WRAPPER | QĐ tách vụ án | Cần thêm | |

Sau 5 biểu pilot → review với user → nhân rộng.

**Effort pilot**: 3-5 ngày (1 PR/biểu, 300-500 dòng/biểu, đọc DOCX + map field + viết + verify).

### Phase 5.3 — G03 NGUOI_THAM_GIA (12 BM)

- 3 WRAPPER (BM-073, 075, 077, 079, 080, 082) + 0 LEGACY.
- Đặc thù: form về người tham gia tố tụng (KSV, phiên dịch, giám định, bào chữa). Có `person.role` (KSV, interpreter, expert, defense counsel).

### Phase 5.4 — G04 DIEU_TRA (15 + 0 = 15 BM)

- 0 WRAPPER (tất cả bespoke!), 0 LEGACY trong group này (BM-086, 090, 097, 148, 150, 166, 169-173 là LEGACY nhưng thuộc 169-173 = VAT_CHUNG, 086/090/097/148/150/166 thuộc DIEU_TRA/TRUY_TO).
- Cần audit lại: 15 BM bespoke trong DIEU_TRA cần wire `BmFormCasePayloadButton` + `BM_FIELD_MAP` (Hướng 2).

### Phase 5.5 — G05 TRUY_TO (9 WRAPPER + ~5 LEGACY)

- 9 WRAPPER (BM-162, 163, 164, 165, 167).
- LEGACY: BM-148, 150, 166. (~3 biểu)

### Phase 5.6 — G06 VAT_CHUNG (1 WRAPPER + ~5 LEGACY)

- 1 WRAPPER (không có trong list 78 — kiểm tra lại). Thực tế VAT_CHUNG có 5 BM, đa số đã bespoke.
- LEGACY: BM-169, 170, 171, 172, 173 (5 biểu).

### Phase 5.7 — G07 DIEU_TRA_DAC_BIET (5 WRAPPER)

- 5 WRAPPER (BM-174, 175, 176, 177, 178). Toàn bộ DIEU_TRA_DAC_BIET là stub. Effort 1 tuần.

### Phase 5.8 — G08 THU_TUC_DAC_BIET (5 WRAPPER)

- 5 WRAPPER (BM-179, 180, 181, 182, 183, 184 — list audit 78 có 6, đếm lại). 1 tuần.

### Phase 5.9 — G09 NGUOI_CHUA_THANH_NIEN (20 WRAPPER)

- 20 WRAPPER (BM-185..213 trong list 78, 19 biểu). BM-070..084 bespoke (G03 + G01), BM-185+ stub.
- Lớn nhất, ~2 tuần. Đặc thù: form về NCTN, có thêm section `minorProtection`, `familyRepresentative`.

### Phase 6 — Refactor 34 LEGACY (sau Phase 5 xong)

Mỗi LEGACY có UI thật đang chạy (800-1200 dòng) nhưng dùng `Field/SectionCard` local. Refactor sang `bm-form/` là **high risk** vì phải giữ nguyên 100% hành vi (nút Lưu, hydrate payload, default values, validation).

**Chiến lược Phase 6:**
1. **Snapshot test trước**: ghi lại payload POST `/form-inputs` từ bản LEGACY hiện tại cho mỗi form (5 case demo).
2. **Refactor 1 form pilot** (BM-002 đã được tạo ở phase trước làm pattern).
3. **So sánh payload** LEGACY cũ vs BESPOKE mới → phải identical.
4. **Mở rộng** cho 33 LEGACY còn lại.

Effort: 3-4 tuần.

---

## 3. Hướng 2 — Wire nút "Lấy từ vụ án" (song song, độc lập)

**Mục tiêu**: 154 form chưa có nút → thêm nút + BM_FIELD_MAP.

**Pattern đã có (từ batch 1-3):**

```tsx
// 1. Import
import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";

// 2. Trong JSX, đặt làm first child của outer wrapper
<BmFormCasePayloadButton
  templateCode="BM-XXX"
  form={form}
  onApply={(next) => setForm(next as typeof form)}
/>
```

**+ Thêm entry BM_FIELD_MAP** trong `apps/web/src/lib/bm-auto-populate/bm-field-map.ts`.

**Batch 4 (1-2 giờ, script injection):**
- 30 form wrapper có flat state → wire nút (không cần BM_FIELD_MAP, dùng default fallback).
- 30 form bespoke chưa có nút → wire nút + thêm BM_FIELD_MAP entry.

**Batch 5-10 (1-2 tuần):**
- 94 form còn lại → wire từng cái + thêm BM_FIELD_MAP entry theo cụm 5-10 biểu/lần, có user review.

**Effort batch 4**: 1-2 giờ (script). **Batch 5-10**: 1-2 tuần (manual review từng entry vì BM_FIELD_MAP phụ thuộc field structure mỗi form).

---

## 4. Hướng 3 — Template nội dung mẫu (căn cứ + điều luật)

**Rủi ro lớn nhất**: Thông tư 03/2026-VKSTC — cần user (KSV) review từng entry. AI không thể tự sinh.

**Bước đề xuất:**
1. User cung cấp file PDF/DOCX Thông tư 03/2026-VKSTC (đã có folder `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/` — kiểm tra xem có Thông tư gốc không).
2. AI trích text → draft 213 entry BM_LEGAL_BASIS (1 entry: 1-3 dòng, ~700-1000 dòng tổng).
3. User review từng entry, chỉnh sửa.
4. AI tạo component `<BmLegalBasisHint />` hiển thị đầu form.
5. Script inject vào 213 form (Phase 4 trong PLAN cũ).

**Effort**: 2-3 tuần (chủ yếu chờ user review).

**Câu hỏi cần user trước khi bắt đầu Hướng 3**: Có file PDF/DOCX Thông tư 03/2026-VKSTC trong repo không? Nếu không, user cần cung cấp.

---

## 5. Timeline tổng (1 người fulltime, làm tuần tự)

| Tuần | Phase | Công việc | Output |
|---|---|---|---|
| 1 (hiện tại) | 5.0 | Fix audit script (BM-156 EMPTY → CUSTOM_LOCAL). Chạy lại audit, có số liệu sạch. Pilot 3-5 biểu G02. | PR #1 (audit fix) + PR #2-6 (3-5 bespoke G02) |
| 2 | 5.2 tiếp | Hoàn thành 28 biểu G02 BP_NGAN_CHAN. Wire nút batch 4. | PR #7-30 (24 bespoke G02) + PR #31 (wire batch 4) |
| 3-4 | 5.3-5.4 | G03 NGUOI_THAM_GIA (12 biểu) + wire batch 5-6. | PR #32-50 (~20 PR) |
| 5-6 | 5.5-5.6 | G05 TRUY_TO + G06 VAT_CHUNG (~15 biểu) + wire batch 7-8. | PR #51-70 |
| 7 | 5.7 | G07 DIEU_TRA_DAC_BIET (5 biểu) | PR #71-75 |
| 8 | 5.8 | G08 THU_TUC_DAC_BIET (6 biểu) | PR #76-81 |
| 9-10 | 5.9 | G09 NGUOI_CHUA_THANH_NIEN (20 biểu) | PR #82-101 |
| 11-13 | 6 | Refactor 34 LEGACY | PR #102-135 |
| 14+ | 4 (cũ) | Template nội dung mẫu | PR #136+ (sau khi user review legal basis) |

**Tổng**: 13 tuần = ~3 tháng. Có thể song song Hướng 2 (wire) với Phase 5 để giảm xuống ~10 tuần.

---

## 6. Điểm cần user review (gate không thể AI tự quyết)

1. **BM-156 fix audit**: Có muốn phân loại thành `CUSTOM_LOCAL` (1 loại mới) hay merge vào `LEGACY` (vì cùng bản chất tự-code local)?
2. **Phase 5.2 pilot 3-5 biểu**: Chọn 3-5 biểu nào ưu tiên? Đề xuất BM-021, 022, 024, 025, 026 (5 biểu G02, cùng pattern).
3. **BM_FIELD_MAP cho 154 form**: User review từng entry hay AI tự sinh + user chỉ check sampling (5-10 biểu)?
4. **Hướng 3 legal basis**: Có file PDF/DOCX Thông tư 03/2026-VKSTC trong repo không? Nếu không, user cần cung cấp trước khi bắt đầu.
5. **Tần suất commit/PR**: 1 PR/biểu (an toàn, review được) hay gộp 5-10 biểu/PR (nhanh hơn nhưng khó review)?

---

## 7. Đề xuất flow bắt đầu (tuần này)

**Ngay bây giờ (30 phút):**
1. Fix audit script (1 PR nhỏ).
2. Chạy lại audit, có số liệu sạch.
3. User review số liệu mới (BESPOKE/WRAPPER/LEGACY/CUSTOM_LOCAL/EMPTY).

**Ngày 1-2 (pilot 3 biểu):**
1. Đọc DOCX BM-021, BM-022, BM-024.
2. Map field theo 8 nhóm SPEC.
3. Viết bespoke 3 biểu (BM-021, 022, 024).
4. Wire nút + BM_FIELD_MAP.
5. Verify tsc/eslint/audit cho 3 PR.

**Ngày 3-5 (mở rộng pilot):**
- Nếu pattern OK → viết tiếp 5 biểu G02 (BM-025, 026, 027, 028, 032).
- Nếu có vấn đề (DOCX không parse được, field đặc thù) → báo user, điều chỉnh.

**Cuối tuần 1 (sau pilot):**
- User review 5-8 bespoke mới.
- Audit lại: kỳ vọng BESPOKE tăng 100 → 107, WRAPPER giảm 78 → 70, LEGACY giảm 34 → 34, EMPTY 1 → 0.
- Quyết định tiếp tục pattern hay điều chỉnh.

---

## 8. Tài nguyên đã có (từ PLAN cũ)

- `apps/web/src/components/documents/bm-form/`: `BmFormSection`, `BmFieldText/Textarea/Date/Select/Checkbox`, `BmFormStatus`, `BmFormActions`, `BmFormMetaBar` (`classes.ts` có smart-defaults `todayIsoDate`, `vnDateLine`, `issuePlaceDateLine`, `defaultArchiveLine`).
- `apps/web/src/components/documents/bm-form/case-payload-button.tsx`: nút "Lấy từ vụ án" (đã wire 41 bespoke).
- `docs/BM_CANONICAL_SPEC.md`: spec 8 nhóm field + UX/UI chuẩn.
- `docs/templates/BM-XXX/BM-XXX_PLACEHOLDER_CONTRACT.md`: 21 biểu quan trọng đã có spec sẵn.
- `scripts/read_doc.py`: đọc `.doc` gốc bằng `olefile`.
- `scripts/audit_bespoke.py`: classifier (cần fix).
- `scripts/wire-batch3-buttons.mjs`: pattern script injection 2 dòng.
- `apps/web/src/lib/bm-auto-populate/bm-field-map.ts`: 41 entry hiện tại.
- `apps/web/src/lib/bm-auto-populate/central-adapter.test.mjs`: test pattern cho BM_FIELD_MAP.

---

## 9. Risks tổng hợp

1. **Volume**: 113 biểu × 1-2 PR/biểu × 300-500 dòng/PR = ~30.000-50.000 dòng mới. **Cần ~3 tháng 1 người fulltime**, không thể "1 turn".
2. **Refactor LEGACY**: 34 biểu có UI thật đang chạy production. Snapshot test trước, so sánh payload identical trước/sau.
3. **DOCX garbage**: `olefile` cho text có nhiều control characters. Cần cleanup regex.
4. **DOCX coverage**: Chỉ 1 số BM có DOCX gốc. Những BM còn lại dùng `BM-XXX_PLACEHOLDER_CONTRACT.md` (21 biểu) hoặc phải derive từ template đã seed trong DB.
5. **Field đặc thù**: BM-141/144 (gia hạn tạm giam có `giamHan.deadline`) cần extension section. BM-156 có 30+ custom field — phải bespoke tỉ mỉ.
6. **Legal basis (Hướng 3)**: Không thể AI tự sinh, phải có user review từng entry. Có thể batch lớn nhưng 700-1000 dòng pháp lý cần người có chuyên môn kiểm.
7. **BM_FIELD_MAP scale**: 154 entry mới × mỗi entry 10-20 dòng mapping. AI có thể sinh draft nhưng user phải review.
8. **Race với audit số liệu**: Cứ mỗi batch xong phải chạy lại audit, số liệu cũ trong `bm-auto-populate-sot.json` sẽ stale.

---

## 10. Câu hỏi cần user trả lời TRƯỚC khi bắt đầu

1. **Có chấp nhận thêm loại `CUSTOM_LOCAL` trong audit không?** (BM-156 + có thể vài file nữa rơi vào đây).
2. **Có muốn làm tuần tự từng biểu (1 PR/biểu) hay gộp (5 biểu/PR)?** Tuần tự an toàn hơn, gộp nhanh hơn.
3. **Có thể cung cấp PDF/DOCX Thông tư 03/2026-VKSTC không?** Cần cho Hướng 3.
4. **Wire nút "Lấy từ vụ án" cho batch 4 (~30 form, 1-2 giờ) có ưu tiên chạy song song không?**
5. **Có muốn pilot 3 biểu G02 trước (BM-021, 022, 024) rồi review, hay nhảy vào BM-156 luôn?**
