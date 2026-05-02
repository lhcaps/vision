# Phase 13 — Security & Input Validation Hardening

Date: 2026-05-01
Phase: 13
Status: In Progress

## Source

Derived from ROADMAP.md Phase 13 requirements (SEC-01 through SEC-11).

## Goal

Close the basic attack surface of a media upload platform by implementing:

- Global NestJS ValidationPipe with whitelist/forbidNonWhitelisted/transform
- CORS explicit allowlist from WEB_ORIGIN env var
- Upload hardening: size limits, MIME allowlist, magic byte validation, corrupted media rejection, deterministic SHA-256 object keys, checksum dedupe
- Signed URL or controlled API proxy for asset serving
- Structured error responses that never leak internal paths, stack traces, or credentials

## Why This Phase Matters

Phase 13 is the foundation for every production-facing feature. Without it, the platform cannot safely accept untrusted input. It is the first line of defense before adapter boundaries (Phase 14A) and domain invariants (Phase 14B).

## What's Already Partially Done

From Phase 2 and Phase 4:

- `validateMediaMime()` uses Zod schema for MIME validation (contracts)
- `createMediaObjectKey()` generates deterministic keys from SHA-256
- `buildMediaIngestionPlan()` computes checksum with SHA-256
- Checksum dedupe already returns existing asset on duplicate
- Error handling uses structured `InternalServerErrorException` with `{message, detail}` shape
- File size limit of 250MB already set in `FileInterceptor`

## What's Missing

| Gap                           | Severity | Description                            |
| ----------------------------- | -------- | -------------------------------------- |
| ValidationPipe not global     | HIGH     | Unknown fields not rejected            |
| CORS open (cors: true)        | HIGH     | Any origin allowed                     |
| No magic byte validation      | HIGH     | File extension spoofing possible       |
| No corrupted media detection  | HIGH     | Malformed images accepted              |
| No signed URL or proxy        | MEDIUM   | Assets served via direct MinIO URL     |
| Original filename trusted     | LOW      | Filename injection risk                |
| Error messages may leak paths | LOW      | Some errors expose file system info    |
| Security docs not in README   | LOW      | No documentation of hardening behavior |

## Scope Boundaries

**In scope:**

- NestJS `ValidationPipe` global setup
- CORS configuration from `WEB_ORIGIN`
- Magic byte validation for image/video files
- Corrupted media detection via decode attempts
- File upload size limit (413 response)
- Original filename sanitization
- Signed URL generation for MinIO
- Controlled asset proxy endpoint (`GET /projects/:id/media/:assetId`)
- Structured error response interceptor
- README security documentation

**Out of scope:**

- Rate limiting (future phase)
- Authentication/authorization (Phase 14B)
- CSRF protection (future phase)
- Content-Disposition header for downloads (can add in future)
- CSP headers (future phase)
