# CSRF Decision

## Current Auth Model

- The API uses an httpOnly session cookie named `qlv_session` by default.
- Session cookies use `sameSite=lax`.
- CORS is allowlist-based through `API_CORS_ORIGIN`.
- Production startup fails when `AUTH_COOKIE_SECURE=false` or `API_CORS_ORIGIN=*`.

## Risk

`sameSite=lax` reduces cross-site POST risk in modern browsers, but cookie auth is not complete CSRF protection by itself. If an operator hosts the web app and API on separate origins, or enables broad CORS, state-changing requests can become easier to abuse.

## Decision

CSRF token enforcement is deferred to P2 for this internal production baseline.

Reason:

- Current deployment is same-site and internal.
- The web client already sends authenticated requests through explicit API helpers with credentials.
- This phase adds rate limiting, security headers, CORS fail-fast, and stricter validation first.

## P2 Requirement

Before internet-facing production, add a CSRF token flow for cookie-authenticated state-changing requests:

- API issues a per-session CSRF token through a safe endpoint.
- Web sends the token in an `X-CSRF-Token` header for POST, PUT, PATCH, and DELETE.
- API rejects missing or mismatched tokens before controller execution.
- E2E covers login plus a rejected state-changing request without token.
