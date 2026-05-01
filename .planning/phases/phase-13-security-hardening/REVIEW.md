# Phase 13 Review — Security & Input Validation Hardening

Date: 2026-05-01
Phase: 13 — Security & Input Validation Hardening
Reviewer: Claude Code

## Scope Reviewed

All files created/modified in Phase 13:

### New Files

| File                                                      | Purpose                                        |
| --------------------------------------------------------- | ---------------------------------------------- |
| `apps/api/src/common/interceptors/error.interceptor.ts`   | Global exception filter                        |
| `apps/api/src/common/interceptors/index.ts`               | Module exports                                 |
| `apps/api/src/common/utils/magic-bytes.ts`                | Magic byte signature validation                |
| `apps/api/src/common/utils/magic-bytes.test.ts`           | Magic byte unit tests (17 tests)               |
| `apps/api/src/common/utils/media-integrity.ts`            | Corrupted media detection via sharp            |
| `apps/api/src/common/utils/media-integrity.test.ts`       | Media integrity unit tests (8 tests)           |
| `apps/api/src/common/utils/sanitize-filename.ts`          | Filename path traversal prevention             |
| `apps/api/src/common/utils/sanitize-filename.test.ts`     | Filename sanitization unit tests (13 tests)    |
| `apps/api/src/common/utils/signed-url.ts`                 | MinIO presigned URL generation + API proxy     |
| `apps/api/src/common/common.module.ts`                    | Global CommonModule providing SignedUrlService |
| `apps/api/src/media/__fixtures__/valid-signatures.ts`     | Test fixtures for magic byte testing           |
| `apps/api/src/media/__fixtures__/valid-png.png`           | Valid PNG fixture for integrity testing        |
| `apps/api/src/media/__fixtures__/index.ts`                | Test fixtures barrel export                    |
| `apps/web/e2e/security.spec.ts`                           | Playwright E2E security tests                  |
| `.planning/phases/phase-13-security-hardening/AI-SPEC.md` | AI integration design contract                 |
| `.planning/phases/phase-13-security-hardening/UI-SPEC.md` | UI design contract                             |
| `.planning/phases/phase-13-security-hardening/PLAN.md`    | Phase execution plan                           |
| `.planning/phases/phase-13-security-hardening/SPEC.md`    | Phase specification                            |

### Modified Files

| File                                         | Change                                                              |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `apps/api/src/main.ts`                       | ValidationPipe, CORS allowlist, GlobalErrorFilter                   |
| `apps/api/src/app.module.ts`                 | Imported CommonModule                                               |
| `apps/api/src/media/media.controller.ts`     | Added `GET /projects/:projectId/media/:assetId/file` proxy endpoint |
| `apps/api/src/media/media.service.ts`        | Integrated magic byte + integrity validation, added `findAsset()`   |
| `apps/api/src/media/media-ingestion.ts`      | Integrated magic byte validation                                    |
| `apps/api/src/media/media-ingestion.test.ts` | Uses real fixture file for PNG integrity                            |
| `README.md`                                  | Security section documenting all hardening behaviors                |
| `.env.example`                               | Added `WEB_ORIGIN`, `SIGNED_URL_EXPIRY_SECONDS`                     |
| `apps/web/playwright.config.ts`              | Updated baseURL to use env var, webServer configuration             |

## Verification Results

| Check                  | Result |
| ---------------------- | ------ |
| `pnpm typecheck`       | PASS   |
| `pnpm test` (61 tests) | PASS   |
| `pnpm build`           | PASS   |
| `pnpm lint`            | PASS   |
| `pnpm format:check`    | PASS   |

## Findings

### HIGH

None.

### MEDIUM

1. **`@types/express` empty node_modules subdirectory** — After `pnpm add @types/express@5.0.6`, the directory existed but appeared empty due to PowerShell `Get-ChildItem` quirk. `pnpm list` confirmed the package was correctly installed. Fixed by forcing a fresh install which resolved the issue. This is a pnpm/Windows interaction edge case, not a code issue.

2. **PNG fixture too small for sharp decode** — The original `media-ingestion.test.ts` used a hardcoded Buffer with only PNG header bytes (no IDAT/IEND chunks). `sharp` cannot decode a partial PNG. Fixed by generating a minimal valid PNG with sharp and reading it from `__fixtures__/valid-png.png`.

### LOW

1. **E2E tests require running API server** — The Playwright security tests (`apps/web/e2e/security.spec.ts`) target the API at `http://localhost:3000/api`. They cannot run in isolation without the API server running. The CI pipeline handles this via `e2e.yml` workflow.

2. **`sharp` is a native module** — `sharp` requires native binary builds. The pnpm warning about ignored build scripts means sharp must be approved via `pnpm approve-builds` on first install. This is standard for sharp.

3. **Prettier formatting on new files** — Multiple new files (magic-bytes, media-integrity, signed-url, etc.) were not formatted before the first lint check. Fixed by running `pnpm format --`.

### Security

- No secrets or credentials in any new files
- No `eval()`, no SQL construction, no `innerHTML`
- GlobalErrorFilter strips stack traces, file paths, SQL errors, and environment variables from all API error responses
- ValidationPipe with `forbidNonWhitelisted` ensures no unexpected fields pass through
- Magic byte validation prevents extension/mimetype spoofing
- MinIO presigned URLs are time-limited (default 3600s, configurable via `SIGNED_URL_EXPIRY_SECONDS`)
- Storage keys are never exposed to clients

## Recommendations

1. Run `pnpm approve-builds` to enable `sharp` native module builds on first setup
2. Run E2E tests against a live API + database + MinIO instance for full security coverage
3. Consider adding a rate-limiter middleware (future phase)
4. Consider adding `Content-Security-Policy` headers (future phase)

## Sign-off

Phase 13 security hardening complete. All deliverables implemented and verified. `pnpm verify` passes (typecheck + 61 tests + production build + lint + format). Ready for push to GitHub.
