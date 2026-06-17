# QLLaw - Biểu mẫu Audit Report

**Generated:** 2026-06-16
**Updated:** 2026-06-16 (post-Phase 3 implementation)
**Scope:** 214 templates across 9 stages

---

## 1. Tổng quan trạng thái

| Stage | Tên | Tổng | FE Component | BE Renderer | Catalog `isImplemented` |
|-------|-----|------|-------------|-------------|------------------------|
| 01 | Tiếp nhận nguồn tin | 30 | 15 | **DONE (BM-001, BM-003)** | **2** |
| 02 | Biện pháp ngăn chặn | 39 | 19 | **DONE (BM-031, BM-033..047, BM-053..059)** | 7 |
| 03 | Người có thẩm quyền | 15 | 4 | PARTIAL | 1 |
| 04 | Giai đoạn điều tra | 57 | 5 | PARTIAL (BM-090, BM-097) | 2 |
| 05 | Giai đoạn truy tố | 28 | 9 | PARTIAL | 3 |
| 06 | Xử lý vật chứng | 5 | 5 | PARTIAL (BM-172) | 0 |
| 07 | Biện pháp điều tra đặc biệt | 5 | 0 | MISSING | 0 |
| 08 | Thủ tục đặc biệt | 6 | 0 | MISSING | 0 |
| 09 | Người chưa thành niên | 29 | 1 | MISSING | 0 |
| **Tổng** | | **214** | **~58** | **~15 full + ~10 partial** | **15** |

---

## 2. Backend renderer - Implemented helpers

| Template | Save Hook | Payload Fix | Final Overlay | Notes |
|----------|-----------|-------------|--------------|-------|
| BM-001 | YES | YES | YES | Full |
| BM-003 | **YES (NEW)** | YES | YES | Just implemented |
| BM-031 | YES | YES | YES | Full |
| BM-033 | YES | YES | YES | |
| BM-037 | YES | YES | YES | |
| BM-038 | YES | YES | YES | |
| BM-039 | YES | YES | YES | |
| BM-040 | YES | YES | YES | |
| BM-042 | YES | YES | YES | |
| BM-043 | YES | YES | YES | |
| BM-044 | YES | YES | YES | |
| BM-045 | YES | YES | YES | |
| BM-046 | YES | YES | YES | |
| BM-047 | YES | YES | YES | |
| BM-053..059 | YES | YES | YES | |
| BM-090 | YES | YES | YES | |
| BM-097 | YES | YES | YES | |
| BM-156 | YES | YES | YES | |
| BM-172 | YES | YES | YES | |
| BM-005 | PARTIAL | — | — | Save hooks for `sourceVerification` |
| BM-009 | PARTIAL | — | — | Save hooks for `sourceResolutionExtension` |
| BM-017 | PARTIAL | — | — | `caseInitiationRequest` save hook |
| BM-085 | PARTIAL | — | — | `caseInvestigationTransfer` save hook |
| BM-141 | PARTIAL | — | — | `prosecutionTransfer` in payload |

---

## 3. Priority for implementation (updated)

### Tier 1 — Backend BE render + FE form DONE:
- BM-001, BM-003 (Phase 3), BM-031, BM-033, BM-037, BM-038, BM-039, BM-040, BM-042, BM-043, BM-044, BM-045, BM-046, BM-047, BM-053..059, BM-090, BM-097, BM-156

### Tier 2 — FE form exists, BE renderer exists, need saved inputs overlay:
- **BM-002** (FE form shape mismatch — uses `sourceReport` vs backend `sourceVerification`)

### Tier 3 — FE exists, BE partial (save hooks exist, need full render logic):
- BM-005, BM-009, BM-014, BM-015, BM-016, BM-017, BM-018
- BM-070, BM-071, BM-085, BM-086
- BM-103, BM-104, BM-141, BM-144, BM-145, BM-146, BM-148, BM-149, BM-150, BM-159
- BM-166, BM-168, BM-169, BM-170, BM-171, BM-173

### Tier 4 — FE + BE missing (Stage 03-09, ~140 templates):
- BM-004, BM-006, BM-007, BM-008, BM-010, BM-011, BM-012
- BM-024..030 (Stage 01)
- BM-034..036, BM-041, BM-048..052, BM-060..069 (Stage 02)
- BM-072..084 (Stage 03)
- BM-087..089, BM-091..096, BM-098..102, BM-105..140 (Stage 04)
- BM-142..143, BM-147, BM-151..155, BM-157..165 (Stage 05)
- BM-174..BM-212 (Stage 07-09)

---

## 4. Backend DTO coverage

`UpdateGeneratedDocumentFormInputsDto` groups:
- `agency`, `document`, `official`, `caseDecision`, `accusedDecision`
- `offense`, `person`, `measure`, `monitoring`, `assignment`
- `recipients`, `signature`, `delivery`, `legalBasis`
- `investigationRecovery`, `investigationExtension`, `proposal`, `approval`
- `investigation`, `caseJoinder`, `caseRecovery`, `investigationConclusion`
- `indictment`, `attachments`, `reception`, `receiver`
- `informant`, `crimeReport`, `sourceVerification`, `notification`
- `prosecutionTransfer`, `prosecutionExtension`, `prosecutionSupplementReturn`
- **`sourceAssignment`** **(NEW — added Phase 3)**

---

## 5. Changes Made

### Phase 1 — DB Migration
- `apps/api/prisma/migrations/20260616000000_add_officials_role/migration.sql` — **NEW**
- `apps/api/prisma/schema.prisma` — Added `role String @default("OFFICIAL") @db.VarChar(20)`
- `apps/api/src/modules/auth/auth.service.ts` — Reads from `role` column, fallback to heuristic
- `apps/api/prisma/seed.ts` — Sets `role: 'ADMIN'` for seed admin

### Phase 3 — BM-003 Backend Renderer
- `apps/api/src/modules/documents/dto/update-generated-document-form-inputs.dto.ts` — Added `sourceAssignment`
- `apps/api/src/modules/documents/document-renderer.service.ts`:
  - Save hook, input parsing, `isBm003Template` flag
  - Payload `sourceAssignment` group with default text
  - Saved inputs merge block
  - Default agency name, parent name, issue place, legal basis for BM-003
- `apps/web/src/lib/vks-template-catalog.ts` — Marked BM-003 as implemented (isImplemented: true, count: 2)

---

## 6. Known issues

- 5 pre-existing TS errors in `bm031-direct/bm031-clean.helpers.ts` and `bm031-direct.service.ts` (spread operator on unknown type)
- BM-002 FE form uses `sourceReport` group but backend expects `sourceVerification` — needs shape reconciliation
- ~140 templates across Stage 03-09 have neither FE form nor BE renderer
