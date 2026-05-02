# Phase 13 Plan — Security & Input Validation Hardening

Phase: 13
Wave: 1
Status: In Progress

## Objective

Implement global security hardening for the NestJS API: ValidationPipe, CORS allowlist, magic byte validation, corrupted media detection, signed URL proxy, structured error interceptor, and README documentation.

## Key Files

- `apps/api/src/main.ts`
- `apps/api/src/common/interceptors/error.interceptor.ts` (new)
- `apps/api/src/common/utils/magic-bytes.ts` (new)
- `apps/api/src/common/utils/sanitize-filename.ts` (new)
- `apps/api/src/common/utils/signed-url.ts` (new)
- `apps/api/src/media/media.controller.ts` (update)
- `apps/api/src/media/media-storage.service.ts` (update)
- `packages/contracts/src/media.ts` (update)
- `README.md` (update)
- `apps/api/src/media/magic-bytes.test.ts` (new)

## Requirements

- SEC-01: Global ValidationPipe with whitelist/forbidNonWhitelisted/transform
- SEC-02: CORS from WEB_ORIGIN env var
- SEC-03: Oversized uploads return 413
- SEC-04: MIME type validated by extension AND magic bytes
- SEC-05: Corrupted media rejected
- SEC-06: Original filename sanitized (never trusted as-is)
- SEC-07: Deterministic object keys from SHA-256 (already done)
- SEC-08: Duplicate uploads return existing asset (already done)
- SEC-09: Assets served via signed URLs or controlled proxy
- SEC-10: Error responses structured, safe (no paths/stack traces/credentials)
- SEC-11: Security behavior documented in README

## Wave 1 Tasks

### Task 1 — Global ValidationPipe

Enable ValidationPipe globally in `main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

Verify: `pnpm typecheck` passes.

### Task 2 — CORS Allowlist

Replace `cors: true` in `main.ts` with explicit allowlist from `WEB_ORIGIN` env var. Parse multiple origins if comma-separated. Default to no CORS if not set.

Verify: `pnpm typecheck` passes.

### Task 3 — Magic Byte Validation

Create `apps/api/src/common/utils/magic-bytes.ts` with a `validateMagicBytes(buffer: Buffer, mimeType: string): boolean` function. Support JPEG (`\xFF\xD8\xFF`), PNG (`\x89PNG`), WebP (`RIFF....WEBP`), MP4 (`....ftyp`), MOV (`....ftyp`). Create `apps/api/src/media/magic-bytes.test.ts` with unit tests covering valid signatures, mismatched signatures, and truncated files.

Integrate into `buildMediaIngestionPlan()` in `media-ingestion.ts` by adding a `validateMagicBytes()` check before returning the plan.

Verify: `pnpm test` passes for magic-bytes tests.

### Task 4 — Corrupted Media Detection

Add a `validateMediaIntegrity(buffer: Buffer, mimeType: string): void` function that attempts to decode the image/video to detect corruption. For images: use `sharp` library to decode. For videos: check basic container structure (MP4/MOV box structure). Throw `BadRequestException` if decode fails.

Install `sharp` as a dependency in `apps/api/package.json`.

Verify: `pnpm typecheck` passes.

### Task 5 — File Size Limit with 413 Response

Configure Multer `FileInterceptor` with `limits.fileSize: 250 * 1024 * 1024` (already present). Ensure NestJS returns HTTP 413 when limit is exceeded. The default Multer behavior already handles this, but verify the response body is structured.

Verify: Upload a file larger than 250MB and confirm 413 response.

### Task 6 — Original Filename Sanitization

Create `apps/api/src/common/utils/sanitize-filename.ts` with a function that strips path traversal sequences (`..`, `/`, `\`, null bytes) and limits length to 255 characters. Use sanitized name only for display purposes; storage keys never use original filename.

Update `media-ingestion.ts` to accept a `sanitizedName` field in the plan.

Verify: `pnpm typecheck` passes.

### Task 7 — Signed URL Generation

Create `apps/api/src/common/utils/signed-url.ts` with a `generateSignedUrl(storageKey: string, expiresInSeconds?: number): string` function using MinIO `presignedGetObject`. Add `GET /projects/:projectId/media/:assetId/file` endpoint in `media.controller.ts` that returns a signed URL or streams the file directly through the API as a controlled proxy. If `SIGNED_URL_EXPIRY_SECONDS` is set, generate presigned URLs. Otherwise, stream through API proxy.

Remove any direct MinIO URL exposure in API responses. Ensure `storageKey` is never returned to the client in unsafe contexts.

Verify: `pnpm typecheck` passes.

### Task 8 — Structured Error Interceptor

Create `apps/api/src/common/interceptors/error.interceptor.ts` that catches all exceptions and transforms them into a safe structured response:

```typescript
{
  statusCode: number,
  message: string,      // safe for client
  error?: string,       // short error type (e.g., "Bad Request")
  timestamp: string,     // ISO timestamp
  requestId: string     // from request context (Phase 15 adds full tracing)
}
```

Strip internal details: no stack traces, no file paths, no SQL errors, no environment variables.

Apply globally in `main.ts`.

Verify: `pnpm typecheck` passes.

### Task 9 — README Security Documentation

Update `README.md` Security section to document:

- ValidationPipe behavior (unknown fields rejected)
- CORS policy (explicit allowlist)
- File size limits (250MB max, 413 on oversize)
- Accepted file types (MIME allowlist + magic byte validation)
- Corrupted media rejection
- Signed URL behavior
- Error response format
- No internal details leaked in API errors

Verify: README renders correctly.

### Task 10 — E2E Security Tests

Add Playwright E2E tests in `apps/web/e2e/security.spec.ts` covering:

- Oversized file upload returns 413
- Invalid MIME type returns 400
- Corrupted file returns 400
- Duplicate upload returns existing asset with `deduplicated: true`
- Assets served through proxy endpoint (no direct MinIO URL)

Verify: `pnpm test:e2e` passes.

## Must-Haves

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (all 118+ tests)
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] E2E security tests pass
- [ ] README updated with security documentation
