# Template Corpus Audit Phase 2

## Goal

Expand template readiness from the original 60-form foundation set to the full TT 03/2026 corpus represented in `docs/`.

## Completed Scope

- Source BM codes audited: 213 (`BM-001` through `BM-213`, code-level).
- Catalog synchronized: `implementedTemplateCodes` and `isImplemented` now cover all 213 codes.
- Stage coverage synchronized to code-level totals: 30, 39, 15, 56, 28, 5, 5, 6, 29.
- Normalized DOCX generated for all 213 codes under `storage/templates/normalized-docx/BM-XXX/BM-XXX_normalized.docx`.
- Workspace fallback added so every BM code has a frontend form panel:
  - 130 specific FE panels.
  - 83 generic FE fallback panels.
- Full corpus report added: `docs/templates/TEMPLATE_CORPUS_AUDIT.md`.

## Verification

- `pnpm lint`
- `pnpm build`
- `pnpm --filter api test -- --runInBand`
- `pnpm audit:templates`
- `pnpm audit:templates:corpus`
- `pnpm audit:templates:foundation`
- `pnpm audit:hardcode`

## Environment Blocker

- `pnpm db:seed` and `pnpm audit:templates:db` are ready for the full corpus, but local MariaDB was not reachable because Docker Desktop was not running.
- Exact local DB endpoint from `.env`: `127.0.0.1:3307`.

## Notes

- The corpus contains 61 source-code variants where a BM code appears in more than one source location. The audit uses the canonical `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/...` source where available.
- `BM-139` has two distinct source variants with the same code. The app keeps one code-level catalog entry and records the duplicate source as a warning in the corpus report.
