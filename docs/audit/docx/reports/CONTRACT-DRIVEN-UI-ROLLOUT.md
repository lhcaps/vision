# Contract-Driven UI Rollout Plan

Sinh lúc: 2026-06-19T07:39:52.751Z

## Nguyên tắc

- Mặc định: BESPOKE UI hiện tại giữ nguyên.
- Bật contract-driven UI theo `templateCode` qua env.
- Bật theo user role nếu cần (vd: chỉ KSV cấp cao được dùng contract-driven trong giai đoạn pilot).
- Pilot BM-001..BM-004 trước. Nếu fail thì fallback về bespoke panel.
- Không tắt bespoke cho đến khi contract-driven đã pass smoke test + user review.

## Env

```bash
# .env.local
NEXT_PUBLIC_CONTRACT_UI_BM_CODES=BM-001,BM-002,BM-003,BM-004
NEXT_PUBLIC_CONTRACT_UI_USER_ROLES=ADMIN,PROSECUTOR
```

## Code switching

```ts
// apps/web/src/components/documents/contract-driven-form-panel.tsx
import { Bm001FormInputsPanel } from "./bm-001-form-inputs";
// ...import các panel khác

const ENABLED_CODES = new Set(
  (process.env.NEXT_PUBLIC_CONTRACT_UI_BM_CODES ?? "").split(",").map(s=>s.trim()).filter(Boolean)
);

export function isContractDrivenEnabled(code: string, role?: string): boolean {
  if (!ENABLED_CODES.has(code)) return false;
  const allowedRoles = (process.env.NEXT_PUBLIC_CONTRACT_UI_USER_ROLES ?? "").split(",").map(s=>s.trim());
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) return false;
  return true;
}
```

## Rollout phases

| Phase | Scope | Mục tiêu | Exit criteria |
|---|---|---|---|
| 0 | Dev only | ContractDrivenFormPanel render thử 4 BM | Không crash, render đúng fields |
| 1 | Pilot admin | Bật cho 1 admin, dùng BM-001..BM-004 | Lưu/load OK, payload identical bespoke |
| 2 | Pilot KSV | Bật cho 2 KSV thật, dùng 4 biểu pilot | KSV đồng ý UI mới dùng được |
| 3 | Wave 1 | Mở rộng cho G01 TIEP_NHAN (BM-001..BM-030) | Tất cả BM trong nhóm pass smoke |
| 4 | Wave 2-9 | Mở rộng cho G02..G09 | Mỗi wave tương ứng 1 group SPEC |
| 5 | Cleanup | Sau khi 100% contract locked, xóa bespoke UI cũ | Codebase giảm ~30-50K dòng |

## Rollback

- Env `NEXT_PUBLIC_CONTRACT_UI_BM_CODES=` (rỗng) → tắt hoàn toàn.
- Per-BM: bỏ code khỏi env list → bespoke UI quay lại ngay.
- Không cần restart server, vì logic dựa trên env đọc lúc runtime.

## Không implement production rollout nếu chưa có contract lock

- Rollout chỉ bắt đầu khi ≥ 1 contract đã `status: locked`.
- Lock = pass strict verify (`verify-contracts.mjs` exit 0).
- Nếu 0 contract locked, rollout = false dù env có set.
