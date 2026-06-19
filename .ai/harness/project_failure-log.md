# Failure Log

> The agent appends here whenever it (or a sub-agent) fails a task.
> The `failure-log` skill governs what to record.
> Format: most recent entry first.

<!--
## YYYY-MM-DD
**Request**: <one-line user request>
**What I tried**: <one-line summary>
**Root cause**: <one-line diagnosis>
**Skill that should have caught it**: <skill-id>
**Fix**: <what I changed in that skill, or in the bundle>
-->

## 2026-06-19
|**Request**: Stabilize DOCX-first audit pipeline (Phase A) — fix duplicate BM-139 output collision, separate reference docs, Unicode ellipsis detector, BOM cleanup, root pizzip dep, table gridSpan/vMerge, verify wording, guessNamespace→suggestNamespace.
|**What I tried**: Modified inventory, extract, draft, verify, compare, report, pilot, encoding-bom scripts; added lib/source-id.mjs; added test/docx-contract/test-unicode-blank-detector.test.mjs.
|**Root cause**: (1) extract/draft used `BM-NNN` filename only, no sourceId, so duplicate BM-139 had one extract/contract overwritten. (2) Reference docs (Thông tư) had templateCode=null and were still drafted as form contracts. (3) Date line regex `\.{3,}` missed `…` and `……`. (4) 32 source files had UTF-8 BOM from PowerShell edits. (5) extract-docx-structure.mjs `require("../../apps/api/node_modules/pizzip")` was brittle. (6) readDocxTables parsed gridSpan/vMerge from `tcAttrs` instead of `<w:tcPr>` block. (7) verify report wording made 0 issues look like "contract correct". (8) `guessNamespace` name made heuristic output seem authoritative.
|**Skill that should have caught it**: audit — should have detected the SHA-collision/overwrite risk when 2 BM-139 records shared templateCode but different SHA, and should have flagged 215 drafted vs 216 extracted as a smell.
|**Fix**: (1) Added `lib/source-id.mjs` deriveSourceId with `<BM-XXX>__<sha12>` / `REF__<slug>__<sha12>` format. Inventory, extract, draft, verify, report, pilot all switched to sourceId-based filenames. (2) draft-contracts skips `documentKind==="reference"` (2 Thông tư). New report REFERENCE-DOCUMENTS.md. (3) Unicode-safe BLANK_PATTERN = `(?:\.{3,}|…+|…+|_{3,})` shared by extract + draft + date line detector. (4) Created `scripts/audit-encoding-bom.mjs` (--fix to strip). Stripped 32 files including apps/api/src/app.module.ts. Wired `pnpm audit:encoding`. (5) Added `pizzip@^3.2.0` + `@types/pizzip@^3.1.2` as root devDependencies, switched to `import PizZip from "pizzip"`. (6) readDocxTables now parses gridSpan/vMerge from `<w:tcPr>` (with fallback to tcAttrs). (7) SLOT-COVERAGE-SUMMARY now has explicit "Phạm vi verify" section separating structural from semantic; lock state called out. (8) Renamed `guessNamespace`→`suggestNamespace`, added `suggestedBy: "heuristic"` to all heuristic slots. (9) Added 9 node:test cases for blank detector + sourceId. (10) Master report uses live `formCount`/`referenceCount` numbers.

## 2026-06-17
**Request**: Audit brutal report: document-renderer.service.ts rỗng, Docker entrypoint dist/main.js sai path, Swagger không có guard production.
**What I tried**: Verified actual file contents and build output.
**Root cause**: (1) document-renderer.service.ts có 33,599 dòng — audit báo rỗng là nhầm. (2) Dockerfile CMD và docker-compose.prod.yml command cùng dùng dist/main.js trong khi tsconfig outDir=dist + rootDir=. tạo output dist/src/main.js. (3) SwaggerModule.setup() không có production guard.
**Skill that should have caught it**: audit — cần verify bằng build thực thay vì chỉ grep.
**Fix**: (1) Xác nhận service không rỗng, không cần restore. (2) Sửa Dockerfile CMD thành dist/src/main.js, docker-compose.prod.yml command thành apps/api/dist/src/main.js. (3) Thêm production guard cho Swagger (chỉ bật khi NODE_ENV != production hoặc SWAGGER_ENABLED=true). (4) Thêm production fail-fast cho AUTH_COOKIE_SECURE, SEED_ADMIN_PASSWORD, API_CORS_ORIGIN. (5) Hoist port declaration trước Swagger log. Build+lint+test đều pass.
