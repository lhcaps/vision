# Phase 13 UI-SPEC — Security & Input Validation Hardening

Date: 2026-05-01
Phase: 13
Status: Planning

## Frontend Impact

This phase primarily affects the NestJS API backend. The frontend should not require significant changes since the API contract remains the same. However, error handling in the frontend may need updates to display structured error messages correctly.

## What the UI Should Display

| Scenario                  | Expected UI Behavior                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| 413 Payload Too Large     | Toast/alert: "File too large. Maximum size is 250MB."                        |
| 400 Bad Request (MIME)    | Toast/alert: "Unsupported file type. Upload a JPEG, PNG, WebP, or MP4 file." |
| 400 Bad Request (corrupt) | Toast/alert: "File appears to be corrupted. Please try a different file."    |
| 401 Unauthorized (future) | Redirect to login                                                            |
| 500 Internal Error        | Toast/alert: "Upload failed. Please try again." (no stack trace shown)       |

## No UI Changes Required For

- ValidationPipe (backend only, API contracts unchanged)
- CORS allowlist (backend only)
- Signed URL generation (backend only)
- Error interceptor (backend only)

## Error Message Design

All user-facing error messages must:

- Be in plain English, no technical jargon
- Not expose file paths, stack traces, or system details
- Provide actionable guidance (e.g., "try a different file")
- Match the existing toast/notification pattern in the web app

## Existing Pattern to Follow

Check the web app's existing error display pattern for uploads (likely in MediaUploader component) and ensure the new structured errors from the API are properly mapped to user-friendly messages.
