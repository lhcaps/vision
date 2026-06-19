# Contract-Driven UI Plan

Sinh lúc: 2026-06-19T07:39:52.751Z

## Mục tiêu

Đề xuất kiến trúc thay vì viết tay 213 form bespoke. Chuỗi:

```txt
213 DOCX
  → 213 contract JSON (đã có 215 draft, 213 cho BM-001..213 + 2 cho Thông tư)
  → 1 ContractDrivenFormPanel
  → plugin registry cho form đặc biệt
```

## Component đề xuất

```tsx
// ContractDrivenFormPanel: đọc contract, render form.
// ContractFormMeta: header card (BM code + title + status).
// ContractFormSection: BmFormSection theo từng section trong contract.
// ContractFieldRenderer: switch theo uiComponent → BmFieldText/Textarea/Date/Select.
// ContractFormActions: BmFormActions (Lưu/Tải lại).
// ContractFormStatus: BmFormStatus (error/success/warning).
// BmPluginRegistry: cho plugin đặc biệt (BM-001 multi-date, BM-003 articles, BM-156 large form).
```

## Bắt buộc dùng shared UI

```ts
import {
  BmFormMetaBar,
  BmFormSection,
  BmFieldText,
  BmFieldTextarea,
  BmFieldDate,
  BmFieldSelect,
  BmFormStatus,
  BmFormActions,
} from "@/components/documents/bm-form";
```

## Handoff UI rõ ràng

Mỗi phần phải khai báo token/component cụ thể:

- **Layout grid**: BmFormSection dùng `grid grid-cols-1 md:grid-cols-2 gap-4` (1 cột mobile, 2 cột md+).
- **Breakpoint**: Tailwind 4 default (sm 640, md 768, lg 1024).
- **Spacing scale**: gap-4 giữa field, gap-5 giữa section, py-5 cho outer card.
- **Button hierarchy**: Primary `bg-slate-950 text-white` (BmFormActions); secondary `border-slate-200 bg-white text-slate-700`.
- **Field density**: BmFieldText height 48px (h-12), BmFieldTextarea min 96px (rows=4).
- **State design**: loading (skeleton), success (border-emerald-200 bg-emerald-50), error (border-red-200 bg-red-50), warning (border-amber-200 bg-amber-50), dirty (text-amber-700), saved (text-emerald-700).
- **Responsive behavior**: Full width mobile, chia 2 cột md+.
- **Empty state**: 1 dòng mặc định từ contract.default hoặc để trống nếu required=false.
- **Long text behavior**: Textarea tự grow rows=4 → rows=12 nếu user dán > 200 chars.

## Plugin registry (chỉ dùng khi thật sự cần)

- `BM-001` → `MultiDateRangePlugin` (reception.startedAt/endedAt với 2 date riêng).
- `BM-003` → `AssignmentArticlePlugin` (article1/2/3 với article2 conditional).
- `BM-141`, `BM-144` → `DeadlineExtensionPlugin` (BM gia hạn có giamHan.deadline).
- `BM-156` → `CaoTrangPlugin` (form lớn 30+ field với 4 nhóm: caseInfo, decision, indictment, recipients).
- Nhóm có nhiều bị can/tang vật → `DynamicListPlugin` (vd BM-039 danh sách người bị bắt).
- Nhóm có chữ ký kép → `DualSignaturePlugin` (vd BM-156 có 2 KSV ký).
- Nhóm có conditional legal clauses → `ConditionalLegalClausePlugin`.

## Migration path

1. **Pilot**: Bật `ContractDrivenFormPanel` cho BM-001..BM-004 trong `next.config.ts` + env `NEXT_PUBLIC_CONTRACT_UI_BM_CODES=BM-001,BM-002,BM-003,BM-004`.
2. **Snapshot test**: Trước khi pilot, ghi lại payload POST `/form-inputs` từ bespoke hiện tại cho 5 case demo (VKS-2026-0001..0005).
3. **Pilot review**: Cho 4 KSV dùng thử trên 4 biểu pilot. So sánh payload identical (≤ 1 field khác biệt về default value).
4. **Refactor legacy**: Với 68 BESPOKE dùng GenericPanel, viết contract trước (reviewer-driven), sau đó switch sang contract-driven UI.
5. **Refactor local shell**: Với BM-002, BM-003, BM-039, BM-097, BM-156 (custom shell), refactor sang shared kit + plugin trước khi lock contract.
6. **Lock wave**: Sau mỗi wave, mark contract thành `status: "locked"` nếu đã pass verify strict (xem `verify-contracts.mjs`).
7. **Cleanup**: Sau khi 100% contract locked, có thể xóa bespoke UI cũ (1 commit per BM theo `.cursor/rules/30-tooling.mdc`).

## Feature flag

```ts
const CONTRACT_UI_ENABLED_BM_CODES = process.env.NEXT_PUBLIC_CONTRACT_UI_BM_CODES?.split(",") ?? [];
```

Default: BESPOKE hiện tại. Nếu code nằm trong enabled list → render ContractDrivenFormPanel.
