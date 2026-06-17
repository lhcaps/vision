# Template Foundation Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `docs/Biểu mẫu/Biểu mẫu` the authoritative first rollout set and verify all 60 commonly used forms are represented consistently in source files, catalog metadata, frontend form panels, normalized DOCX files, and seeded DB template versions.

**Architecture:** Keep the existing file-based template pipeline. Treat the 60 `.doc/.docx` files under `docs/Biểu mẫu/Biểu mẫu` as the source-of-truth set, then make the web catalog and audits enforce that exact set before expanding to the rest of TT 03/2026.

**Tech Stack:** Node.js scripts, TypeScript/Next catalog, Nest API seed config, Prisma template DB, DOCX source/normalized template files.

---

### Task 1: Align Catalog Metadata With The 60 Source Forms

**Files:**
- Modify: `apps/web/src/lib/vks-template-catalog.ts`

- [ ] **Step 1: Compute source form codes**

Run:

```powershell
Get-ChildItem -LiteralPath "docs\Biểu mẫu\Biểu mẫu" -File |
  Where-Object { $_.Extension -match '^\.docx?$' } |
  ForEach-Object { if ($_.Name -match '^(\d{1,3})') { 'BM-' + $matches[1].PadLeft(3, '0') } } |
  Sort-Object -Unique
```

Expected: 60 codes from `BM-001` through `BM-173`, matching the local source folder.

- [ ] **Step 2: Replace `implementedTemplateCodes`**

Set `implementedTemplateCodes` to exactly the 60 source codes:

```ts
export const implementedTemplateCodes = [
  "BM-001",
  "BM-002",
  "BM-003",
  "BM-005",
  "BM-006",
  "BM-007",
  "BM-008",
  "BM-009",
  "BM-010",
  "BM-011",
  "BM-012",
  "BM-014",
  "BM-015",
  "BM-016",
  "BM-017",
  "BM-018",
  "BM-023",
  "BM-030",
  "BM-031",
  "BM-033",
  "BM-037",
  "BM-038",
  "BM-039",
  "BM-040",
  "BM-042",
  "BM-043",
  "BM-044",
  "BM-045",
  "BM-046",
  "BM-047",
  "BM-053",
  "BM-054",
  "BM-055",
  "BM-056",
  "BM-057",
  "BM-058",
  "BM-059",
  "BM-070",
  "BM-071",
  "BM-085",
  "BM-086",
  "BM-090",
  "BM-097",
  "BM-103",
  "BM-104",
  "BM-141",
  "BM-144",
  "BM-145",
  "BM-146",
  "BM-148",
  "BM-150",
  "BM-156",
  "BM-159",
  "BM-166",
  "BM-168",
  "BM-169",
  "BM-170",
  "BM-171",
  "BM-172",
  "BM-173",
] as const;
```

- [ ] **Step 3: Update catalog entry flags and stage counts**

Set `isImplemented: true` only for the 60 source codes. Update `vksTemplateStages[].implemented` to:

```ts
stage-01: 18
stage-02: 19
stage-03: 2
stage-04: 6
stage-05: 10
stage-06: 5
stage-07: 0
stage-08: 0
stage-09: 0
```

- [ ] **Step 4: Verify catalog consistency**

Run:

```powershell
pnpm --filter web lint
pnpm audit:templates
```

Expected: both commands pass; `audit:templates` should report 60 source forms covered.

### Task 2: Strengthen Source Coverage Audit

**Files:**
- Modify: `scripts/audit-template-source-coverage.mjs`

- [ ] **Step 1: Add catalog implemented set checks**

Extend the script to read:

```js
export const implementedTemplateCodes = [...]
"code": "BM-###"
"isImplemented": true
```

Expected behavior:
- Every source code must be in `implementedTemplateCodes`.
- Every source code must have `isImplemented: true`.
- Every `implementedTemplateCodes` code must be backed by a source file, normalized DOCX, frontend component, and workspace panel mapping.

- [ ] **Step 2: Add workspace mapping check**

Read `apps/web/src/components/documents/generated-document-workspace.tsx` and require each source code to appear in `BM_PANEL_BY_CODE`.

- [ ] **Step 3: Run regression audit**

Run:

```powershell
pnpm audit:templates
```

Expected: pass with 60 source forms and no mismatched catalog flags.

### Task 3: Add Human-Readable Foundation Report

**Files:**
- Create: `scripts/report-template-foundation.mjs`
- Modify: `package.json`

- [ ] **Step 1: Generate report data**

Create a Node script that compares the 60 source codes against:
- catalog entry
- `isImplemented`
- `implementedTemplateCodes`
- frontend form component file
- `BM_PANEL_BY_CODE`
- normalized DOCX

- [ ] **Step 2: Write Markdown report**

Write `docs/templates/TEMPLATE_FOUNDATION_AUDIT.md` with a summary table and per-code rows. Include missing items if any.

- [ ] **Step 3: Add package script**

Add:

```json
"audit:templates:foundation": "node scripts/report-template-foundation.mjs"
```

- [ ] **Step 4: Run report**

Run:

```powershell
pnpm audit:templates:foundation
```

Expected: report says 60/60 source forms are foundation-ready, or lists exact missing items.

### Task 4: Final Verification

**Files:**
- No code changes beyond Tasks 1-3.

- [ ] **Step 1: Run full template audits**

Run:

```powershell
pnpm audit:templates
pnpm audit:templates:foundation
pnpm audit:templates:db
```

Expected: all pass.

- [ ] **Step 2: Run app verification**

Run:

```powershell
pnpm lint
pnpm --filter api test -- --runInBand
pnpm build
```

Expected: lint passes with no warnings/errors, API tests pass, API and web production build succeeds.

- [ ] **Step 3: Report remaining non-60 work**

Use the generated report plus catalog data to state that the 60-source set is complete and that later TT 03/2026 folders remain a separate expansion phase.
