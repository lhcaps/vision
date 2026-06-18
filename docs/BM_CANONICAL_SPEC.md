# BM Canonical Spec — "Tinh chỉnh thông minh hợp lý" theo TT 03/2026-VKSTC

> Mọi biểu mẫu (BM-001..BM-213) trong hệ thống QUANLYVKS phải tuân thủ spec này.
> Viết ngày 2026-06-17 sau audit tổng thể 213 templates seed trong DB và 130 form-inputs components trong repo.

## 0. Tại sao cần spec

Trước khi có spec:
- 130 biểu có form-inputs, 83 biểu còn thiếu (fallback về `GenericTemplateFormInputsPanel`)
- Mỗi file tự định nghĩa `inputClass`, `labelClass`, `textareaClass` → drift UX/UI
- Field name không thống nhất (vd: `informant.fullName` vs `reporter.fullName` cho cùng ngữ nghĩa)
- Smart defaults (issue date, archive line, agency name) rải rác, thiếu chỗ này có chỗ kia
- Validation không nhất quán

Sau spec này:
- 100% form-inputs dùng chung component từ `bm-form/`
- Field name theo taxonomy 8 nhóm dưới đây
- Smart defaults áp dụng tự động
- Validation: required + regex + date coherence tại một nơi

## 1. 8 nhóm field chuẩn

Mọi biểu mẫu BM đều có thể phân rã vào 8 nhóm sau. Một biểu mẫu cụ thể chỉ dùng một số nhóm.

| Nhóm | Mục đích | Field chuẩn (snake_case) |
|---|---|---|
| `agency` | Cơ quan ban hành | `parentName`, `name`, `bodyName`, `shortName`, `issuePlace` |
| `document` | Số văn bản + ngày | `documentCode`, `issueDate`, `issuePlace`, `issuePlaceAndDateLine` |
| `case` | Vụ án/vụ việc | `caseCode`, `caseTitle`, `caseName`, `summary`, `receivedDate` |
| `offense` | Tội danh + điều luật | `offenseName`, `legalArticle`, `criminalCodeText` |
| `person` | Bị can / người liên quan | `fullName`, `genderLabel`, `birthDate`, `birthPlace`, `nationality`, `occupation`, `identityNo`, `identityIssueDate`, `identityIssuePlace`, `currentAddress`, `phone` |
| `content` | Phần nội dung văn bản | `legalBasisLine`, `summaryLine`, `decisionLine`, `article1Line`, `article2Line`, `article3Line` |
| `recipients` | Nơi nhận + dòng lưu | `primaryLine`, `archiveLine` |
| `signature` | Chức danh + người ký | `signMode`, `positionTitle`, `signerName` |

Mỗi nhóm = 1 `BmFormSection` trong UI. Mỗi field = 1 `BmFieldText` / `BmFieldTextarea` / `BmFieldDate` / `BmFieldSelect` / `BmFieldCheckbox`.

## 2. Mapping theo nhóm biểu mẫu (theo TT 03/2026-VKSTC)

| Nhóm BM | Phạm vi | Cấu trúc |
|---|---|---|
| 01 TIEP_NHAN (BM-001..030) | Tiếp nhận nguồn tin về tội phạm | agency + document + case + person (informant/receiver) + content + recipients + signature |
| 02 BP_NGAN_CHAN (BM-031..069) | Biện pháp ngăn chặn / cưỡng chế | agency + document + case + person (bị can) + offense + content + recipients + signature |
| 03 NGUOI_THAM_GIA (BM-070..084) | Người tham gia tố tụng | agency + document + case + person (KSV/phiên dịch/giám định/...) + content + recipients + signature |
| 04 DIEU_TRA (BM-085..140) | Giai đoạn điều tra | agency + document + case + person (bị can) + offense + content + recipients + signature |
| 05 TRUY_TO (BM-141..168) | Giai đoạn truy tố | agency + document + case + person (bị can) + offense + content + recipients + signature |
| 06 VAT_CHUNG (BM-169..173) | Xử lý vật chứng | agency + document + case + content + recipients + signature |
| 07 DIEU_TRA_DAC_BIET (BM-174..178) | Biện pháp điều tra đặc biệt | agency + document + case + person + offense + content + recipients + signature |
| 08 THU_TUC_DAC_BIET (BM-179..184) | Thủ tục đặc biệt | agency + document + case + person + offense + content + recipients + signature |
| 09 NGUOI_CHUA_THANH_NIEN (BM-185..213) | Người chưa thành niên | agency + document + case + person (NCTN) + content + recipients + signature |

## 3. Smart defaults (áp dụng khi người dùng mở form)

| Field | Default rule |
|---|---|
| `agency.issuePlace` | `agency.name` nếu trống |
| `document.issueDate` | Hôm nay (ISO `YYYY-MM-DD`) |
| `document.issuePlace` | `agency.issuePlace` nếu trống |
| `document.issuePlaceAndDateLine` | Tự sinh: `${issuePlace}, ngày ${dd} tháng ${mm} năm ${yyyy}` |
| `recipients.archiveLine` | `"Lưu: HSVA, HSKS, VP."` |
| `signature.signMode` | `"KT. VIỆN TRƯỞNG"` |
| `signature.positionTitle` | `"PHÓ VIỆN TRƯỞNG"` |
| `signature.signerName` | Tên KSV đang đăng nhập |

Quy tắc áp dụng:
- Default chỉ fill khi field trống (không ghi đè khi user đã nhập)
- Sau khi user thay đổi 1 field dependent, các field derived sẽ tự cập nhật (useEffect)
- Mọi default đều có thể override bằng tay

## 4. Validation

Mỗi biểu mẫu khai báo `requiredFields: { section, field, label }[]`. Khi user bấm Lưu:
1. Loop qua `requiredFields` — nếu rỗng → set `errorText` cho field đó
2. Validate regex/format (vd: identityNo = 9-12 chữ số, phone = 10-11 chữ số VN)
3. Validate date coherence (vd: `reception.endedAt >= reception.startedAt`, `giamHan < deadline`)
4. Nếu có lỗi → focus field đầu tiên lỗi, hiện BmFormStatus error
5. Nếu pass → POST `/documents/generated/{id}/form-inputs` rồi BmFormStatus success

## 5. UX/UI chuẩn

Mọi form-inputs.tsx dùng:
- `BmFormSection` (gom field theo nhóm)
- `BmFieldText` / `BmFieldTextarea` / `BmFieldDate` / `BmFieldSelect` / `BmFieldCheckbox` (nhập liệu)
- `BmFormActions` (nút Lưu / Tải lại)
- `BmFormStatus` (banner lỗi / thành công / đang tải)

ClassName đồng nhất qua `BM_FORM_CLASSES`. Không tự định nghĩa `inputClass` / `labelClass` local.

Cấu trúc layout:
- 1 cột khi `md-` thì chia 2 cột (full width = `md:col-span-2`)
- Section cách nhau bằng `gap-4`
- Hành động Lưu ở dưới cùng, sticky trên mobile

## 6. Naming quy ước

- File: `bm-XXX-form-inputs.tsx` (XXX = 3 chữ số, zero-pad)
- Default export: `BmXXXFormInputsPanel`
- Type: `BmXXXFormInputs = { agency: ..., document: ..., ... }`
- Component name: `BmXXXFormInputsPanel` (Panel suffix để dễ dispatch trong workspace)

## 7. Cấu trúc payload mẫu (BM-023)

```ts
type Bm023FormInputs = {
  agency: { parentName: string; name: string; shortName: string; issuePlace: string };
  document: { documentCode: string; issueDate: string; issuePlaceAndDateLine: string };
  case: { caseCode: string; caseTitle: string; caseName: string };
  offense: { offenseName: string; legalArticle: string; criminalCodeText: string };
  caseDecision: { prosecutionReasonLine: string; prosecutionDecisionLine: string; investigationRequestLine: string };
  legalBasis: { procedureArticlesLine: string; criminalCodeLine: string };
  signature: { signMode: string; positionTitle: string; signerName: string };
  recipients: { investigationAgencyLine: string; superiorProcuracyLine: string; archiveLine: string };
};
```

Mỗi biểu mẫu có thể mở rộng từ 8 nhóm cơ sở thêm các nhóm riêng (vd: BM-023 có `caseDecision` + `legalBasis`; BM-001 có `reception` + `receiver` + `informant` + `crimeReport`).

## 8. Quy trình tạo biểu mẫu mới (cho 83 BM còn thiếu)

1. Đọc `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/<group>/<source>.doc` (xem `BM-XXX_PLACEHOLDER_CONTRACT.md` nếu đã có)
2. Map field DOCX → 8 nhóm
3. Viết `bm-XXX-form-inputs.tsx` dùng `bm-form/`
4. Đăng ký vào `BM_PANEL_BY_CODE` trong `generated-document-workspace.tsx`
5. Render kiểm thử qua E2E harness
6. Commit riêng 1 BM / 1 commit (theo `.cursor/rules/30-tooling.mdc`)

## 9. Trạng thái áp dụng (2026-06-17)

| Phạm vi | Có form | Còn thiếu | Hoàn thành |
|---|---|---|---|
| Tất cả 213 BM | 130 | 83 | 61% |
| 01 TIEP_NHAN (30) | 22 | 8 | 73% |
| 02 BP_NGAN_CHAN (39) | 22 | 17 | 56% |
| 03 NGUOI_THAM_GIA (15) | 12 | 3 | 80% |
| 04 DIEU_TRA (56) | 41 | 15 | 73% |
| 05 TRUY_TO (28) | 19 | 9 | 68% |
| 06 VAT_CHUNG (5) | 4 | 1 | 80% |
| 07 DIEU_TRA_DAC_BIET (5) | 0 | 5 | 0% |
| 08 THU_TUC_DAC_BIET (6) | 1 | 5 | 17% |
| 09 NGUOI_CHUA_THANH_NIEN (29) | 9 | 20 | 31% |

Số liệu từ `audit_bm_missing.txt` (2026-06-17 19:15 ICT).

## 10. Không thuộc spec này

- Backend render payload (`document-renderer.service.ts`) — đã audit riêng (xem `.ai/harness/project_failure-log.md` 2026-06-17)
- Prisma schema / migrations
- API endpoints
- Auth, role, permission
