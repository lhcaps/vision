# Phase 13 AI-SPEC — Security & Input Validation Hardening

Date: 2026-05-01
Phase: 13
Status: Planning

## AI Integration Notes

This phase does not involve AI model integration. It is purely about securing the API surface. No AI-specific patterns apply.

## Evaluation Strategy

| Dimension   | Approach                                                               |
| ----------- | ---------------------------------------------------------------------- |
| Correctness | Playwright E2E tests for each security control                         |
| Coverage    | Unit tests for magic byte validator and signed URL generator           |
| Robustness  | Manual boundary testing: oversized files, malformed payloads           |
| Edge cases  | UTF-8 filenames, zero-byte files, very long filenames, GIF magic bytes |

## Test Fixtures

| Fixture                                   | Purpose                              |
| ----------------------------------------- | ------------------------------------ |
| Valid JPEG image (fixture.jpg)            | Happy path upload                    |
| Valid PNG image (fixture.png)             | PNG magic byte validation            |
| Valid WebP image (fixture.webp)           | WebP magic byte validation           |
| Valid MP4 video (fixture.mp4)             | Video magic byte validation          |
| Corrupted JPEG (fixture-corrupt.jpg)      | Magic byte mismatch / decode failure |
| Oversized JPEG (fixture-oversized.jpg)    | 413 size limit test                  |
| Fake JPEG extension (fixture.txt renamed) | Extension spoofing test              |
| UTF-8 filename (café_upload.jpg)          | Filename sanitization test           |
