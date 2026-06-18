# PLAN — Tự động điền biểu mẫu theo vụ án (213 BM)

> Tạo 2026-06-17. Đã chốt với user:
> **Approach = infra_first** (hạ tầng → default → lấy từ vụ án → template nội dung)
> **Template content = header_plus_legal** (mô tả đầu trang + căn cứ BLTTHS + điều luật)
> **Scope = all_126/213 BM**
> **Populate field = empty_manual** (nút "Lấy từ vụ án", không tự điền)
> **Case context = cần fetch qua documentId** (route `/documents/[documentId]` đã có sẵn, `render-payload` đã trả `case` + `person`)

## Vấn đề cần giải

Mỗi biểu mẫu BM-XXX hiện tại:
- Mở ra trống trơn → user phải gõ lại toàn bộ thông tin đã có trong hồ sơ vụ án.
- Không có sẵn các trường "mặc định" thường gặp (cơ quan, ngày lập, địa danh…).
- Không có gợi ý nội dung biểu mẫu (căn cứ pháp lý, điều luật, lời mở đầu).

## Mục tiêu

- User mở BM trong context 1 vụ án → 1 cú click chuột → form được populate sẵn các field suy ra từ vụ án.
- Mỗi BM có sẵn: (a) default values hợp lý, (b) nút "Lấy từ vụ án", (c) mô tả căn cứ pháp lý + điều luật ngay đầu form.

## Nguyên tắc (Karpathy + coding-style)

- **Touch only what you must.** Không sửa form logic đang chạy đúng, chỉ thêm default + nút + nội dung.
- **Surgical.** Mỗi phase 1 PR. Mỗi commit 1 logical change.
- **Goal-driven.** Phase nào có test, lint, e2e pass trước khi qua phase sau.
- **Simplicity.** Tránh abstraction tổng quát nếu chỉ phục vụ 1 lần.

---

## Phase 1 — Hạ tầng dữ liệu (Foundation)

**Mục tiêu:** Mọi form có sẵn `payload` chứa thông tin vụ án + con người + tội danh. **Không thay đổi UI form**, chỉ mở rộng hạ tầng.

### Files thay đổi

| File | Thay đổi |
|---|---|
| `apps/api/src/modules/documents/document-renderer.service.ts` | Query thêm `case_assignments` + `officials`; payload trả `case.agency`, `people[]`, `offenses[]`, `assignments[]` |
| `apps/web/src/lib/case-payload-normalizer.ts` | Normalizer thuần chuyển `render-payload` sang `CasePayload` mà không làm mất các field BE đã trả |
| `apps/web/src/lib/case-payload-context.tsx` | `CasePayloadProvider` + `useCasePayload()` hook; re-export type cho Phase 2/3 |
| `apps/web/src/components/documents/generated-document-workspace.tsx` | Fetch `render-payload`, build `CasePayload`, wrap workspace bằng `CasePayloadProvider` |
| `apps/web/src/components/documents/bm-XXX-form-inputs.tsx` × 213 | **Không sửa trong Phase 1.** Form signature và logic giữ nguyên; Phase 2/3 đọc context khi cần |

### Verify

- Unit: `node --test src/lib/case-payload-normalizer.test.mjs` trong `apps/web` phải pass; test cover payload rỗng và payload đầy đủ `case/agency/people/offenses/assignments`.
- Web typecheck: `pnpm exec tsc --noEmit` trong `apps/web` phải pass.
- Web lint: `pnpm exec eslint .` trong `apps/web` phải pass.
- API typecheck/lint/test: giữ gate cũ của Phase 1 (`pnpm exec tsc --noEmit`, `pnpm exec eslint .`, `pnpm test` trong `apps/api`).
- E2E thủ công khi có dev server + DB: `GET /documents/generated/{id}/render-payload` trả JSON có `case.agency.agencyName`, `people[]`, `offenses[]`, `assignments[].official.fullName`.
- Harness-aware check: chạy `node --test test/*.test.mjs` và `node cli/harness.mjs doctor && node cli/harness.mjs diff` trong `harness/` để xác nhận harness nền không hỏng.

### Risks

- BE query thêm bảng có thể tăng latency `render-payload`; đo p95 khi có dữ liệu thật.
- Context type có thể khai báo field nhưng normalizer drop field về `null`; guard bằng test `case-payload-normalizer.test.mjs`.
- Working tree hiện có nhiều WIP ngoài Phase 1; chỉ review/stage các file Phase 1, không gom WIP cũ vào PR.

---

## Phase 2 — Default values cho 213 BM

**Mục tiêu:** Mỗi form có nút "Điền dữ liệu mẫu" (giống `fillCustomerSample()` của BM-001) + giá trị mặc định hợp lý cho các field thường gặp.

### Công việc

1. **Tạo `scripts/generate-bm-defaults.mjs`** (Node, no deps, có `--dry-run` mặc định): đọc 213 file `bm-XXX-form-inputs.tsx`, tìm `EMPTY_XXX_FORM_INPUTS` constant, sinh bản mở rộng với giá trị mặc định an toàn:
   - `agency.name = "Viện kiểm sát nhân dân khu vực 7"`
   - `agency.parentName = "Viện Kiểm sát nhân dân TP. Hồ Chí Minh"`
   - `agency.issuePlace = "TP. Hồ Chí Minh"`
   - `document.issueDate = hôm nay`
   - `recipients.archiveLine = "Lưu: HSVV, VP."`
   - Các field khác: để trống (user tự điền)
2. Chạy dry-run và xuất report file nào match/skip/diff. Không ghi file nếu còn pattern lạ.
3. Thêm test cho helper generate trên 2 fixture nhỏ trước khi chạy trên 213 file.
4. Thêm hàm `fillDefault()` vào từng form (script inject, không viết tay 213 file).
5. Thêm nút "Điền dữ liệu mẫu" cạnh nút "Tải lại từ backend" (nếu chưa có).

### Verify

- `node --test` cho script generator pass trước khi ghi file thật.
- Script dry-run chạy không lỗi, output report đúng format.
- Lint pass (script tuân thủ ESLint config).
- Mở thử 5 BM bất kỳ → bấm nút → form có sẵn default values.

### Risks

- Tự động inject code vào 213 file có thể dính eslint/style lệch tay. Cần review 3-5 file đầu tiên.

---

## Phase 3 — Nút "Lấy từ vụ án" cho 213 BM

**Mục tiêu:** User bấm nút → form tự populate các field suy ra từ `payload.case`.

### Công việc

1. **Tạo `apps/web/src/lib/case-form-mapping.ts`** — bảng mapping field-form ↔ case-property:
   ```ts
   export const CASE_FIELD_MAPPING: Record<string, FieldMapping[]> = {
     "BM-001": [
       { formSection: "agency", formField: "name", casePath: "case.agency.name" },
       { formSection: "reception", formField: "locationName", casePath: "case.agency.name" },
       // ...
     ],
     "BM-023": [
       { formSection: "case", formField: "caseTitle", casePath: "case.caseTitle" },
       { formSection: "offense", formField: "offenseName", casePath: "case.offenses[0].offenseName" },
       // ...
     ],
     // 213 entry
   };
   ```
2. **Tạo component `<CaseContextBar />`** ở `apps/web/src/components/documents/case-context-bar.tsx`:
   - Hiển thị thông tin vụ án (mã HS, tên VA, bị can chính, tội danh chính).
   - Nút "Lấy từ vụ án" → gọi `applyCaseMapping(payload, mapping, currentForm)` → trả form mới.
3. **Inject `<CaseContextBar />` vào đầu mỗi form** (script generate, tương tự phase 2).
4. **Inject nút "Lấy từ vụ án"** vào panel header (cạnh nút "Điền dữ liệu mẫu").

### Verify

- E2E: mở BM-001 của case VKS-2026-0001 → bấm "Lấy từ vụ án" → form có tên VKS, tên bị can, tội danh, ngày thụ lý.
- E2E: 5 case demo × 7 BM có generated_documents (BM-001, BM-023, BM-053, BM-058, BM-090, BM-097, BM-156) đều pass.
- 213 form mở lên không crash nếu `payload` không có (trường hợp form generic).

### Risks

- Mapping 213 BM tốn công. Có thể dùng AI để sinh draft mapping, sau đó review theo cụm (5-10 BM/lần).
- Một số BM không liên quan đến vụ án (vd: biểu mẫu hành chính) → không cần mapping, vẫn có nút nhưng disabled với tooltip "BM này không gắn với vụ án".

---

## Phase 4 — Template nội dung mẫu (căn cứ + điều luật) cho 213 BM

**Mục tiêu:** Mỗi BM có 1 khối "Căn cứ pháp lý + điều luật" hiển thị ngay đầu form, dưới phần mô tả, dạng gợi ý text để user copy/sửa.

### Công việc

1. **Tạo `apps/web/src/lib/bm-legal-basis.ts`** — bảng dữ liệu:
   ```ts
   export const BM_LEGAL_BASIS: Record<string, LegalBasis> = {
     "BM-001": {
       legalBasis: "Bộ luật Tố tụng Hình sự 2015",
       articles: [
         "Điều 19 — Tiếp nhận nguồn tin về tội phạm",
         "Điều 20 — Kiểm tra, xác minh nguồn tin về tội phạm",
       ],
       headerDescription: "Biên bản tiếp nhận nguồn tin về tội phạm...",
     },
     "BM-023": {
       legalBasis: "Bộ luật Tố tụng Hình sự 2015",
       articles: ["Điều 123 — Khởi tố vụ án hình sự", "Điều 124 — Tội phạm ít nghiêm trọng"],
     },
     // 213 entry
   };
   ```
2. **Nguồn dữ liệu** — trích từ Thông tư 03/2026-VKSTC. Cần user cung cấp file PDF/docx Thông tư để AI trích.
3. **Tạo component `<BmLegalBasisHint />`** hiển thị ở đầu mỗi form.
4. **Inject vào 213 form** (script generate).

### Verify

- Mỗi BM hiển thị căn cứ + điều luật đúng với Thông tư 03/2026.
- Có test snapshot cho 5 BM đầu tiên.

### Risks

- **Lớn nhất:** Thông tư 03/2026-VKSTC là văn bản pháp lý thật, sai điều luật sẽ ảnh hưởng nghiệp vụ. Cần user (Kiểm sát viên) review từng entry. Không thể chỉ AI sinh.
- 213 entry × ~3-5 dòng = ~700-1000 dòng text tiếng Việt pháp lý.

---

## Thứ tự thực hiện

1. **Phase 1** (1 PR, ~3-5 files) — verify bằng e2e render-payload.
2. **Phase 2** (1 PR, ~215 files) — script generate + manual review 5 file.
3. **Phase 3** (1 PR, ~220 files) — bảng mapping + script inject + e2e 5 case demo × 7 BM.
4. **Phase 4** (1 PR, ~220 files + 213 entry legal basis) — cần user review từng entry.

**Mỗi phase 1 commit riêng, push branch riêng, e2e xanh mới qua phase sau.**

---

## Tiến độ wire case-payload button (Phase 3)

Mỗi BM bespoke được "wire" = có 2 dòng surgical trong `bm-XXX-form-inputs.tsx`:
- `import { BmFormCasePayloadButton } from "./bm-form/case-payload-button";`
- `<BmFormCasePayloadButton templateCode="BM-XXX" form={form} onApply={(next) => setForm(next as typeof form)} />`
- Kèm entry `BM_FIELD_MAP` trong `apps/web/src/lib/bm-auto-populate/bm-field-map.ts`.

| Batch | Số form wire thêm | Phương pháp | `caseContextForms` | `case-context-not-consumed` |
|---|---|---|---|---|
| Batch 1 (bespoke 17 + 4 flat) | 17 nested + 4 flat | Có sẵn từ trước | 104 | 109 |
| Batch 2 (bespoke 17) | 17 nested | Thủ công | (đã chốt trước batch 3) | (đã chốt trước batch 3) |
| **Batch 3 (nested-state bespoke 20)** | **20 nested** | **Script `scripts/wire-batch3-buttons.mjs` (2 dòng/form)** | **124** | **89** |

### Batch 3 chi tiết (2026-06-18)

- **Chọn 20 form** từ 109 missing ưu tiên nested-state có field structure giống bespoke (BM-008, 010, 012, 053, 097, 148, 156, 166, 169, 171, 173):
  - Score 5 (cả agency + signature + source): BM-007, 009, 011, 014, 015, 016, 030 (7 form)
  - Score 3 (agency + signature + person/offense): BM-017, 018, 023, 031, 033, 037, 038, 040, 042, 043, 044 (11 form)
  - Score 3.5 (prosecutionTransfer/Extension sections): BM-141, 144 (2 form)
- **Đăng ký 20 entry mới** trong `BM_FIELD_MAP` của `bm-field-map.ts` (file mới trong `apps/web/src/lib/bm-auto-populate/`).
  - Pattern: `agency.parentName/name` (upper) ← `agency.parentName/name`; `signature.signerName` ← `assignment.official.fullName`; `document.issueDate*` ← `case.receivedDate` (formatVnDate); `*.caseSummary` (nếu section có) ← `case.summary`; `*.offenseName`/`legalArticle` (nếu section có) ← `offense.*`.
  - Riêng BM-033, 038, 044 dùng `parentNameUpper/nameUpper` thay vì `parentName/name` (đã rà từ form).
  - Riêng BM-009, 017 dùng `document.issueDateIso` thay vì `issueDateText`.
- **Wire 20 form** bằng script `wire-batch3-buttons.mjs` (surgical, 2 dòng mỗi file, idempotent). Mỗi form: 1 dòng import sau React import, 1 dòng JSX đầu tiên trong outer wrapper.
  - Lần đầu script sai indent (đặt button làm sibling của outer wrapper, dẫn đến `TS2657: JSX expressions must have one parent element`). Đã sửa bằng `rewire-batch3-buttons.mjs` (đặt button làm first child của outer wrapper).
- **Verify**:
  - `pnpm exec tsc --noEmit` trong `apps/web` → pass.
  - `pnpm exec eslint .` trong `apps/web` → pass (exit 0).
  - `node --test src/lib/bm-auto-populate/central-adapter.test.mjs src/lib/case-payload-normalizer.test.mjs` → 20/20 pass.
  - `pnpm audit:bm` → exit 0, gồm `audit:bm:auto-populate` + `audit:bm:docx-sync` + `audit:bm:specific-patterns`.
- **Số liệu audit sau batch 3** (`docs/audit/bm-auto-populate-sot/bm-auto-populate-sot.json`):
  - `caseContextForms` (hasUseCasePayload): **104 → 124** (+20) ✓ khớp kỳ vọng 121-124.
  - `case-context-not-consumed` (noTakeFromCaseControlOrContext): **109 → 89** (-20) ✓ khớp kỳ vọng 89-92.
  - `hasRegisteredBmFieldMap`: 17 + 4 + 20 = **41** entry.
- **Chưa làm** (đề xuất batch 4): 89 còn lại gồm BM-045..047, BM-054..059 (BP_NGAN_CHAN, không có agency), BM-072..161 (NGUOI_THAM_GIA + DIEU_TRA + TRUY_TO + VAT_CHUNG), BM-168, BM-170. Cần audit từng form để biết có nested-state không (nhiều form generic wrapper / DIEU_TRA chỉ có flat fields) trước khi thêm BM_FIELD_MAP entry.

---

## Phase 5 — Hoàn thiện 83 formstub (wrapper → bespoke dùng BmFormSection) [MỚI 2026-06-18]

**Bối cảnh audit 2026-06-18:**
- Tổng: 213 file `bm-XXX-form-inputs.tsx`.
- **129 LEGACY** (BM-001 style: tự code `Field/SelectField/SectionCard` local — sai SPEC, ~800-1200 dòng/file, **CÓ UI thật**).
- **83 WRAPPER** (BM-004, BM-013, BM-029, ...: chỉ import `BmFormMetaBar` rồi gọi `<GenericTemplateFormInputsPanel />` — banner cam "Đây là form stub", form rỗng).
- **0 BESPOKE đúng SPEC** (audit strict).
- **1 EMPTY** (file lỗi — TBD).

→ **"Formstub" theo nghĩa ảnh user gửi = 83 WRAPPER cần biến thành bespoke thật dùng `BmFormSection/BmField*`.**

### Mục tiêu

83 WRAPPER → 83 BESPOKE (đúng SPEC). Mỗi WRAPPER hiện tại:
- Có sẵn `BmFormMetaBar` (tiêu đề, subtitle, stage, group).
- Có sẵn type `PayloadResponse` cho render-payload.
- Có sẵn state machine `isLoading/isDirty/error/savedAt/warningMessage`.
- **Thiếu**: bespoke UI với `BmFormSection` + `BmFieldText/Textarea/Date/Select/Checkbox`.

### Quy trình (cho 1 BM)

1. **Đọc DOCX gốc**: `apps/web/scripts/read_doc.py` (đã viết, dùng `olefile`) trích text từ `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/<group>/<XX>-<tên>.doc`. Output có garbage nhưng text chính đủ để map field theo 8 nhóm SPEC.
2. **Map field DOCX → 8 nhóm** (agency/document/case/offense/person/content/recipients/signature + extension).
3. **Viết bespoke panel** dùng `BmFormSection` + `BmField*` từ `apps/web/src/components/documents/bm-form/`. Pattern tham khảo: BM-005 (`bm-005-form-inputs.tsx`, 905 dòng) — type theo 8 nhóm, EMPTY_FORM, REQUIRED_FIELDS, normalize, render.
4. **Wire vào `BM_PANEL_BY_CODE`** (nếu cần) trong `apps/web/src/components/documents/generated-document-workspace.tsx`.
5. **Verify**:
   - `pnpm exec tsc --noEmit` trong `apps/web` → pass.
   - `pnpm exec eslint .` trong `apps/web` → pass.
   - `py -X utf8 scripts/audit_bespoke.py` → file chuyển từ WRAPPER → BESPOKE.

### Chia phase (9 phase theo 9 nhóm SPEC)

| Phase | Nhóm | Số stub | BM đầu tiên pilot |
|---|---|---|---|
| 5.1 | G01 TIEP_NHAN | 8 | BM-029, BM-013, BM-017 |
| 5.2 | G02 BP_NGAN_CHAN | 17 | (chọn sau) |
| 5.3 | G03 NGUOI_THAM_GIA | 3 | (chọn sau) |
| 5.4 | G04 DIEU_TRA | 15 | (chọn sau) |
| 5.5 | G05 TRUY_TO | 9 | (chọn sau) |
| 5.6 | G06 VAT_CHUNG | 1 | (chọn sau) |
| 5.7 | G07 DIEU_TRA_DAC_BIET | 5 | (chọn sau) |
| 5.8 | G08 THU_TUC_DAC_BIET | 5 | (chọn sau) |
| 5.9 | G09 NGUOI_CHUA_THANH_NIEN | 20 | (chọn sau) |

**Workflow**: 1 branch + 1 PR mỗi BM (theo `.cursor/rules/30-tooling.mdc`).

### Risks

- **Lớn nhất:** 83 biểu × ~300-500 dòng bespoke = **~30.000 dòng code mới**, mất nhiều tuần. Mỗi biểu phải đọc DOCX + map 8 nhóm + viết + verify.
- DOCX đọc bằng `olefile` có garbage; cần manual cleanup hoặc parse tốt hơn (sau này có thể viết regex extractor).
- Một số BM có field đặc thù (BM-141: gia hạn tạm giam có `giamHan.deadline` extension) → bespoke cần thêm extension section, không fit 8 nhóm cơ sở.
- Sau khi 83 BM xong, vẫn còn 129 LEGACY chưa đúng SPEC → Phase 6 refactor LEGACY → BESPOKE dùng `BmFormSection`.

### Tài nguyên đã có

- `apps/web/src/components/documents/bm-form/`: `BmFormSection`, `BmFieldText/Textarea/Date/Select/Checkbox`, `BmFormStatus`, `BmFormActions`, `BmFormMetaBar` (`classes.ts` có smart-defaults `todayIsoDate`, `vnDateLine`, `issuePlaceDateLine`, `defaultArchiveLine`).
- `apps/web/src/components/documents/bm-form/case-payload-button.tsx`: nút "Lấy từ vụ án" (đã wire 41/130 bespoke ở Phase 3 batch 1-3).
- `docs/BM_CANONICAL_SPEC.md`: spec 8 nhóm field + UX/UI chuẩn.
- `docs/templates/BM-XXX/BM-XXX_PLACEHOLDER_CONTRACT.md`: 21 biểu quan trọng đã có spec sẵn.
- `scripts/read_doc.py`: đọc .doc gốc bằng `olefile` (đã cài `pip install --user olefile`).
- `scripts/audit_bespoke.py`: classify WRAPPER/LEGACY/BESPOKE/EMPTY.

---

## Mở rộng tương lai (out of scope 5 phase này)

- Phase 5: AI-suggested text cho nội dung dài (câu hỏi hỏi cung, diễn giải tội danh) dựa trên LLM.
- Phase 6: Auto-fill không cần bấm nút (sau khi user quen với 4 phase trên).
- Phase 7: Multi-language (English) cho căn cứ pháp lý.
