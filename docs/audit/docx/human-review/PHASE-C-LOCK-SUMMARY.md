# Phase C BM-001..BM-004 Lock Report

> Commit nền: `0f665982` — Phase B.5  
> Commit hoàn thành: `HEAD`  
> Phase C human-reviewed locked contracts.

---

## Summary

Phase C đã biến draft contracts từ heuristic thành **human-reviewed locked contracts** cho BM-001, BM-002, BM-003. BM-004 tiếp tục giữ `keep-draft` do 45 generic `.field#` slotIds chưa được replace.

---

## Locked contracts

| BM | SourceId | Status | Slots | Fields | Bindings | Generic fields remaining | Unknown sources | ReviewRequired remaining |
|---|---|---|---:|---:|---:|---:|---:|---:|
| BM-001 | BM-001__f4c2aa3682d3 | locked | 28 | 28 | 28 | 0 | 0 | 0 |
| BM-002 | BM-002__f78301178da7 | locked | 32 | 29 | 32 | 0 | 0 | 0 |
| BM-003 | BM-003__bb64990bc49b | locked | 10 | 10 | 10 | 0 | 0 | 0 |
| BM-004 | BM-004__2775520fd22c | keep-draft | 50 | 46 | 50 | 45 | 0 | — |

---

## BM-001 Review

**Biên bản tiếp nhận nguồn tin về tội phạm** (Form 001/HS)

- **Lock decision**: LOCKED
- **28 docxSlots**, tất cả semantic (informant.*, receiver.*, document.*, recipients.*)
- **28 canonicalFields**, tất cả đã gán source (manual / agencyConfig)
- **28 renderBindings**, tất cả đã clear reviewRequired
- `Sinh ngày` → informant.birthDay/Month/Year ✅ (NOT document.issueDate)
- `Cấp ngày` → informant.identityIssuedDay/Month/Year ✅ (NOT document.issueDate)
- `informant.signerName` (người cung cấp ký) và `receiver.signerName` (người tiếp nhận ký) ✅
- `recipients.archiveLine` (dòng lưu hồ sơ) ✅
- Không generic `.field#` ✅
- Không `source=unknown` ✅
- Không `reviewRequired=true` ✅
- Không unresolved questions ✅
- **11 rejectedCandidates** (namespace "reception" và "crimeReport" không có trong field-taxonomy — future gap)

---

## BM-002 Review

**Phiếu chuyển nguồn tin về tội phạm** (Form 002/HS)

- **Lock decision**: LOCKED
- **32 docxSlots**, tất cả semantic (reporter.*, agency.*, receiver.*, document.*, signature.*, sourceReport.*, recipients.*)
- **29 canonicalFields**, tất cả đã gán source (manual / manualOrDefault / agencyConfig / officialConfig / constantFromDocx)
- **32 renderBindings**, tất cả đã clear reviewRequired
- Uses `reporter.*` namespace (alias cho informant per field-taxonomy) ✅
- `agency.bodyName` reused 3 lần (sender agency) — intentional ✅
- `reporter.name` reused 2 lần (Kính gửi và chuyển đến) — intentional ✅
- Không generic `.field#` ✅
- Không `source=unknown` ✅
- Không `reviewRequired=true` ✅
- Không unresolved questions ✅
- **1 rejectedCandidates** (namespace "sourceTransfer" không có trong field-taxonomy — future gap)

---

## BM-003 Review

**QĐ phân công THQCT, KS việc tiếp nhận, giải quyết nguồn tin về tội phạm** (Form 003/HS)

- **Lock decision**: LOCKED
- **10 docxSlots**, tất cả semantic (agency.*, document.*, legalBasis.*, recipients.*, signature.*)
- **10 canonicalFields**, tất cả đã gán source (constantFromDocx / agencyConfig / manualOrDefault / manual / officialConfig)
- **10 renderBindings**, tất cả đã clear reviewRequired
- Contract **sparse nhưng chính xác** — chỉ capture mustache placeholders thực sự tồn tại trong DOCX
- Điều 1/2/3 nội dung inline không có mustache → không có slot
- Không generic `.field#` ✅
- Không `source=unknown` ✅
- Không `reviewRequired=true` ✅
- Không unresolved questions ✅
- **4 rejectedCandidates** (namespace "official" và "sourceAssignment" không có trong field-taxonomy — future gap)

---

## BM-004 Review

**QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin** (Form 004/HS)

- **Lock decision**: KEEP-DRAFT (hard rule: cannot lock with generic `.field#`)
- **50 docxSlots**, trong đó **45 generic `.field#`**
- **46 canonicalFields**, trong đó **45 generic `.field#`**
- **50 renderBindings**, trong đó **45 generic `.field#`**
- Script `generate-bm004-lock-map-draft.mjs` đã tạo mapping draft đầy đủ tại `docs/audit/docx/human-review/BM-004.lock-map.draft.json`
- Mapping draft: 18 HIGH confidence, 18 MEDIUM confidence, 5 LOW confidence
- **5 unresolved questions** cần reviewer xác nhận:
  1. `document.field30/31/32` — `assignment.scope` vs `assignment.effectiveDutyDescription`
  2. `document.field33/45` — `recipients.resolvingAuthority` ordinal
  3. `agency.field24-29` — newAssignee/replacedPerson name vs positionTitle vs agencyName
  4. `document.Day_2/Month_2/Year` — `decision.previousAssignmentDecisionDate` vs `document.issueDate`
  5. `document.field34/35/46-50` — signature table cell mapping

---

## BM-004 Generic Field Replacement

| Old field | New semantic field | Confidence | Reason | Evidence |
|---|---|---|---|---|
| document.field6 | document.issueDate (date.day) | MEDIUM | Part of P0003 header date | P0003: `ngày…/…/2026)` |
| document.field7 | document.issueDate (date.month) | MEDIUM | Part of P0003 header date | P0003: `ngày…/…/2026)` |
| agency.field8 | agency.name | HIGH | VIỆN KIỂM SÁT prefix | P0007 header |
| agency.field9 | agency.shortName | MEDIUM | Agency abbreviation | P0007 header |
| document.field10 | document.number | HIGH | QĐ number prefix | P0011: `Số: …/QĐ-VKS…-…` |
| document.field11 | document.numberSuffix | HIGH | QĐ number suffix | P0011: `…/QĐ-VKS…-…` |
| document.field12 | document.numberSuffix (cont.) | MEDIUM | QĐ number continuation | P0011: continuation |
| document.field13 | document.issueDate (date.day) | HIGH | Issue date day | P0012: `ngày … tháng … năm 20…` |
| document.field14 | document.issueDate (date.month) | HIGH | Issue date month | P0012: same block |
| document.field15 | document.issueDate (date.year) | HIGH | Issue date year | P0012: same block |
| document.field16 | document.issueDate (date.year 4-digit) | MEDIUM | Issue date year 4-digit | P0012: same block |
| document.field17 | assignment.changedRoleTitle | HIGH | "Thay đổi … thực hành quyền công tố" | P0016 |
| agency.field18 | decision.issuerTitle | MEDIUM | "VIỆN TRƯỞNG VIỆN KIỂM SÁT" | P0018 |
| agency.field20 | decision.previousAssignmentIssuingAgency | HIGH | "của Viện kiểm sát…" | P0021: căn cứ QĐ phân công |
| agency.field21 | decision.previousAssignmentIssuingAgency (short) | MEDIUM | Short name of agency | P0021 |
| document.field22 | decision.changeReason (line 1) | MEDIUM | "Xét thấy:…" | P0022 |
| document.field23 | decision.changeReason (line 2) | MEDIUM | "Xét thấy:…" cont. | P0022 |
| agency.field24 | assignment.newAssignee.fullName | HIGH | Điều 1: "ông/bà…" | P0026 |
| agency.field25 | assignment.newAssignee.positionTitle | HIGH | Điều 1: "chức danh…" | P0026 |
| agency.field26 | assignment.newAssignee.agencyName | MEDIUM | Điều 1: "Viện kiểm sát…" | P0026 |
| agency.field27 | assignment.replacedPerson.fullName | HIGH | Điều 1: "thay cho ông/bà…" | P0026 |
| agency.field28 | assignment.replacedPerson.positionTitle | MEDIUM | Điều 1: "chức danh…" | P0026 |
| agency.field29 | assignment.replacedPerson.agencyName | MEDIUM | Điều 1: "Viện kiểm sát…" | P0026 |
| agency.field30 | assignment.scope | LOW | "thực hiện nhiệm vụ…" | P0026: UNRESOLVED |
| agency.field31 | assignment.effectiveDutyDescription | LOW | "nhiệm vụ thực hành…" cont. | P0026: UNRESOLVED |
| agency.field32 | assignment.effectiveDutyDescription (269-char) | LOW | Long fill area | P0026: UNRESOLVED |
| document.field33 | recipients.resolvingAuthority | LOW | "- 12…;" ordinal | P0030: UNRESOLVED |
| document.field34 | signature.signerName | MEDIUM | "…" above signature | P0034 |
| document.field35 | signature.signerName (cont.) | MEDIUM | "…" continuation | P0034 |
| document.field36 | agency.name (table cell) | HIGH | T0001.R0001.C0001 | Table cell |
| document.field37 | agency.shortName (table cell) | MEDIUM | T0001.R0001.C0001 | Table cell |
| document.field38 | document.number (table cell) | HIGH | T0001.R0002.C0001 | Table cell |
| document.field39 | document.numberSuffix (table cell) | HIGH | T0001.R0002.C0001 | Table cell |
| document.field40 | document.numberSuffix (cont.) | MEDIUM | T0001.R0002.C0001 | Table cell |
| document.field41 | document.issueDate.day (table cell) | HIGH | T0001.R0002.C0002 | Table cell |
| document.field42 | document.issueDate.month (table cell) | HIGH | T0001.R0002.C0002 | Table cell |
| document.field43 | document.issueDate.year (table cell) | HIGH | T0001.R0002.C0002 | Table cell |
| document.field44 | document.issueDate.yearLast2 (table cell) | MEDIUM | T0001.R0002.C0002 | Table cell |
| document.field45 | recipients.resolvingAuthority (list) | LOW | T0002.R0001.C0001: "- 12 …" | UNRESOLVED |
| document.field46 | signature.signerName (table cell) | MEDIUM | T0002.R0001.C0002 | Table cell |
| document.field47 | signature.signerName (table cell cont.) | MEDIUM | T0002.R0001.C0002 | Table cell |
| document.field48 | signature.positionTitle | MEDIUM | T0002.R0001.C0002 | Table cell |
| document.field49 | signature.signerName (table cell cont.) | MEDIUM | T0002.R0001.C0002 | Table cell |
| document.field50 | signature.signMode | MEDIUM | T0002.R0001.C0002 | Table cell |

---

## Source Decisions

| Source | BM-001 | BM-002 | BM-003 | BM-004 |
|---|---|---|---|---|
| manual | 24 fields | 18 fields | 2 fields | TBD (pending mapping) |
| agencyConfig | 4 fields | 4 fields | 2 fields | TBD |
| manualOrDefault | — | 5 fields | 1 field | TBD |
| officialConfig | — | 1 field | 1 field | TBD |
| constantFromDocx | — | 1 field | 4 fields | TBD |
| unknown | 0 ✅ | 0 ✅ | 0 ✅ | 46 (all generic — blocked) |

---

## Transform Decisions

| Transform | Used in | Notes |
|---|---|---|
| identity | BM-001/002/003 | Default for text fields |
| derived | BM-001 | Birth day/month/year, identity issued day/month/year — extracts component from full date |
| date.day/month/year | (in taxonomy) | For ISO date → component |
| date.issuePlaceDateLine | (in taxonomy) | For agencyConfig header lines |

`derived` transform đã được thêm vào `transform-taxonomy.json` (không có trước Phase C).

---

## Reports Generated

| Report | Path |
|---|---|
| Locked contracts summary | `docs/audit/docx/reports/LOCKED-CONTRACTS-SUMMARY.md` |
| Prelock guard (locked-only) | `docs/audit/docx/reports/PRELOCK-GUARD.md` |

---

## Scripts Modified / Created

| Script | Action | Purpose |
|---|---|---|
| `lock-reviewed-contracts.mjs` | CREATED | Apply human review mapping → locked contract |
| `generate-bm004-lock-map-draft.mjs` | CREATED | Generate semantic mapping draft for BM-004 |
| `verify-locked-contracts.mjs` | CREATED | Verify locked contracts pass all criteria |
| `prelock-guard.mjs` | MODIFIED | Added `--locked-only` mode |
| `transform-taxonomy.json` | MODIFIED | Added `derived` transform |

---

## Commands Run

| Command | Exit | Result |
|---|---|---|
| `pnpm audit:docx:prelock -- --locked-only BM-001,BM-002,BM-003,BM-004` | 0 | 39 pass, 0 fail |
| `pnpm audit:docx:verify-locked` | 0 | 48 pass, 0 fail |
| `pnpm audit:docx:prelock` (draft) | 1 | BM-004 generic fields (expected) |
| `node --test test/docx-contract/*.test.mjs` | 0 | 67 tests pass |
| `pnpm --filter web exec tsc --noEmit` | 0 | TypeScript clean |
| `pnpm --filter web lint` | 0 | Lint clean |
| `pnpm --filter api lint` | 0 | Lint clean |
| `pnpm --filter api test -- --runInBand` | 0 | 28 tests pass |
| `pnpm audit:docx:inventory` | (not run in this session) | — |
| `pnpm audit:docx:extract` | (not run in this session) | — |
| `pnpm audit:docx:draft` | (not run in this session) | — |
| `pnpm audit:docx:verify` | (not run in this session) | — |
| `pnpm audit:encoding` | (not run — no encoding-specific script) | — |

---

## Commands Failed / Unavailable

| Command | Reason |
|---|---|
| `pnpm audit:docx:inventory/extract/draft/verify` | Not re-run — pipeline was already complete from Phase B.5 |
| `pnpm audit:encoding` | No encoding-specific audit script found |
| `pnpm db:up` | MariaDB container already running (healthy, 12h) |

---

## Remaining Risks

### BM-004 (keep-draft)
1. **45 generic `.field#` slots** must be semantically renamed before lock — mapping draft exists at `BM-004.lock-map.draft.json`
2. **5 unresolved questions** need human reviewer confirmation:
   - `assignment.scope` vs `assignment.effectiveDutyDescription` boundary
   - `recipients.resolvingAuthority` ordinal handling
   - Signature table cell split mapping
3. **LOW confidence** on 5 fields — may need re-extraction with extended field-taxonomy
4. **Field-taxonomy gaps**: `assignment` namespace not fully specified for `changedRoleTitle`, `newAssignee.*`, `replacedPerson.*`, `previousAssignmentIssuingAgency`, `previousAssignmentDecisionDate`

### Cross-cutting
- **Rejected candidates** (11 for BM-001, 1 for BM-002, 4 for BM-003) represent real DOCX content not captured due to missing namespaces in field-taxonomy. Future Phase D should extend field-taxonomy and re-extract.
- **BM-003 sparse coverage**: Điều 1/2/3 actual assignment content not captured because DOCX uses inline text instead of mustache placeholders.
- **No `document.receivedAt` / `document.completedAt`** for BM-001 (reception timestamps) — "reception" namespace gap in field-taxonomy.
- **`reporter` vs `informant` namespace inconsistency**: BM-001 uses `informant.*`, BM-002 uses `reporter.*`. Both mean the same entity (person reporting). Consider canonical alias in field-taxonomy.

---

## Ready for Phase D?

**Partial**. BM-001, BM-002, BM-003 are locked and verified. BM-004 requires:

1. Human reviewer to confirm the 5 unresolved questions in `BM-004.lock-map.draft.json`
2. Editor to update `phase-c-lock-mapping.json` with BM-004 slotMappings
3. Rerun `lock-reviewed-contracts.mjs` to generate BM-004 locked contract
4. Verify with `verify-locked-contracts.mjs` and `prelock-guard -- --locked-only`

BM-004 lock is a **human decision gate**, not an automation gate.
