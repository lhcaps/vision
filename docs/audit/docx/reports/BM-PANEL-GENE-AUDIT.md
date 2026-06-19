# BM Panel Gene Audit

Sinh lúc: 2026-06-19T00:17:55.543Z

## Tổng quan

- Tổng BESPOKE files: **213**
- File có violation: **145**
- Tổng violation: **481**

## Vi phạm theo rule

| Rule | Label | Số file vi phạm |
|---|---|---:|
| `local-inputClass` | Khai báo inputClass local | 16 |
| `local-textareaClass` | Khai báo textareaClass local | 15 |
| `local-labelClass` | Khai báo labelClass local | 15 |
| `local-Section-component` | Function Section() tự định nghĩa | 5 |
| `local-SectionCard-component` | Function SectionCard() tự định nghĩa | 15 |
| `local-Field-component` | Function Field() tự định nghĩa | 26 |
| `local-TextAreaField-component` | Function TextAreaField() tự định nghĩa | 11 |
| `local-StatusMessage-component` | Function StatusMessage() tự định nghĩa | 12 |
| `direct-fetch` | Dùng fetch() trực tiếp trong component | 141 |
| `API_BASE_URL` | Dùng API_BASE_URL | 139 |
| `bg-slate-950` | Dùng bg-slate-950 (màu tùy biến) | 46 |
| `bg-blue-50` | Dùng bg-blue-50 (màu tùy biến) | 40 |

## Top 30 BESPOKE vi phạm nhiều nhất

| BM | File | Số violation | Chi tiết |
|---|---|---:|---|
| BM-003 | apps/web/src/components/documents/bm-003-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-006 | apps/web/src/components/documents/bm-006-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-007 | apps/web/src/components/documents/bm-007-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-011 | apps/web/src/components/documents/bm-011-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-014 | apps/web/src/components/documents/bm-014-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-016 | apps/web/src/components/documents/bm-016-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-018 | apps/web/src/components/documents/bm-018-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-046 | apps/web/src/components/documents/bm-046-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-086 | apps/web/src/components/documents/bm-086-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-170 | apps/web/src/components/documents/bm-170-form-inputs.tsx | 11 | local-inputClass, local-textareaClass, local-labelClass, local-SectionCard-component, local-Field-component, local-TextAreaField-component, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-002 | apps/web/src/components/documents/bm-002-form-inputs.tsx | 8 | local-inputClass, local-textareaClass, local-labelClass, local-Section-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-008 | apps/web/src/components/documents/bm-008-form-inputs.tsx | 8 | local-inputClass, local-textareaClass, local-labelClass, local-Section-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-012 | apps/web/src/components/documents/bm-012-form-inputs.tsx | 8 | local-inputClass, local-textareaClass, local-labelClass, local-Section-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-015 | apps/web/src/components/documents/bm-015-form-inputs.tsx | 8 | local-inputClass, local-textareaClass, local-labelClass, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-030 | apps/web/src/components/documents/bm-030-form-inputs.tsx | 8 | local-inputClass, local-textareaClass, local-labelClass, local-StatusMessage-component, direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-150 | apps/web/src/components/documents/bm-150-form-inputs.tsx | 6 | local-inputClass, local-Section-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-009 | apps/web/src/components/documents/bm-009-form-inputs.tsx | 5 | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-blue-50 |
| BM-023 | apps/web/src/components/documents/bm-023-form-inputs.tsx | 5 | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-054 | apps/web/src/components/documents/bm-054-form-inputs.tsx | 5 | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-055 | apps/web/src/components/documents/bm-055-form-inputs.tsx | 5 | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-058 | apps/web/src/components/documents/bm-058-form-inputs.tsx | 5 | local-SectionCard-component, local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-047 | apps/web/src/components/documents/bm-047-form-inputs.tsx | 4 | direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-056 | apps/web/src/components/documents/bm-056-form-inputs.tsx | 4 | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-057 | apps/web/src/components/documents/bm-057-form-inputs.tsx | 4 | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-070 | apps/web/src/components/documents/bm-070-form-inputs.tsx | 4 | direct-fetch, API_BASE_URL, bg-slate-950, bg-blue-50 |
| BM-148 | apps/web/src/components/documents/bm-148-form-inputs.tsx | 4 | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-166 | apps/web/src/components/documents/bm-166-form-inputs.tsx | 4 | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-169 | apps/web/src/components/documents/bm-169-form-inputs.tsx | 4 | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-171 | apps/web/src/components/documents/bm-171-form-inputs.tsx | 4 | local-Field-component, direct-fetch, API_BASE_URL, bg-slate-950 |
| BM-172 | apps/web/src/components/documents/bm-172-form-inputs.tsx | 4 | local-Section-component, local-TextAreaField-component, bg-slate-950, bg-blue-50 |

## Kết quả kỳ vọng

- **BM-001**: bị report nhẹ về `bg-slate-950` (button Lưu). Đã dùng shared kit.
- **BM-002, BM-003, BM-039, BM-097, BM-156**: bị report nặng (custom shell, direct fetch, local classes).
- **BM-004**: nên không bị report nặng nếu đã dùng shared kit.

## Cách fix

1. Dùng shared component từ `bm-form/`:
   ```ts
   import { BmFormSection, BmFieldText, BmFieldTextarea, BmFieldDate, BmFieldSelect, BmFormStatus, BmFormActions, BmFormMetaBar } from "@/components/documents/bm-form";
   ```
2. Nếu cần màu tùy biến, dùng `BM_FORM_CLASSES` từ `bm-form/classes.ts`.
3. Nếu bắt buộc phải dùng pattern bị cấm, thêm comment:
   ```ts
   // bm-gene-audit-allow: lý do cụ thể
   ```
