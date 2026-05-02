# Phase 15: Observability & Health Checks - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning
**Source:** ROADMAP.md + Phase 14 analysis

---

## Phase Boundary

Phase 15 adds observability capabilities to VisionFlow Studio: request ID tracking, structured JSON logging, job correlation IDs, and health check endpoints. This phase is a prerequisite for Phase 17 (Real Media Processing) which needs reliable observability for debugging async job flows.

---

## Implementation Decisions

### Logging Infrastructure

- **Library:** `pino` v9 for the NestJS API (already has excellent performance and structured JSON output)
- **Format:** JSON in production (`NODE_ENV === 'production'`), pretty-printed in development
- **Log levels:** Controlled via `LOG_LEVEL` env var, defaulting to `"info"`
- **No external services:** No Datadog, Sentry, or cloud logging integrations in v1.1

### Request ID Strategy

- **Header:** `x-request-id` — extracted from request header if present, otherwise generated as UUID v4
- **Propagation:** Via NestJS `AsyncLocalStorage` to make request ID available anywhere in the call chain without prop drilling
- **Response header:** Every API response includes `x-request-id`
- **Log injection:** All pino log calls automatically include request ID via AsyncLocalStorage helper

### Job Correlation IDs

- **BullMQ payload:** Add `correlationId: string` to every job payload
- **HTTP header:** CV worker client sends `x-correlation-id` header to the FastAPI worker
- **Audit logs:** Include request ID when available via `getCurrentRequestId()`
- **Fallback:** When called outside HTTP context (e.g., background processes), generate fresh UUID

### Health Check Design

- **Liveness:** `/api/health/live` — returns `{ status: 'ok' }` immediately, HTTP 200 always
- **Deep:** `/api/health/deep` — checks all dependencies, HTTP 200 if all up, HTTP 503 if any down
- **Timeout:** 5000ms per dependency check (configurable via `HEALTH_CHECK_TIMEOUT_MS`)
- **Format:** JSON with per-dependency status, response time, and optional details
- **No terminus library required** — plain NestJS controllers with dependency injection

### CV Worker Logging

- **Library:** `loguru` for Python (zero-config structured logging, excellent async support)
- **Correlation:** Via Python `contextvars` (equivalent to AsyncLocalStorage)
- **Middleware:** FastAPI middleware extracts `x-correlation-id` from request headers
- **Response header:** Every response includes `x-correlation-id`

### The agent's Discretion

- **Specific pino version:** pino v9.x — check for compatibility with NestJS
- **Logger wrapper pattern:** Create a thin wrapper that injects request context, rather than modifying every log call
- **AsyncLocalStorage vs context propagation:** Use the `request-context.ts` module as a central utility
- **Health check names:** Use lowercase dependency names (`postgres`, `redis`, `minio`, `cvWorker`) for consistency
- **CV worker logging output:** loguru with sys.stderr handler (JSON-like format), no external log aggregation

---

## What NOT to Build

- Prometheus metrics / Grafana dashboards — out of scope for v1.1
- OpenTelemetry distributed tracing — complex to set up, correlation IDs are sufficient for v1.1
- Datadog / Sentry / cloud logging integrations
- Log aggregation infrastructure (ELK, Loki)
- Error tracking service
- Performance profiling

---

## Canonical References

**Must read before implementation:**
- `apps/api/src/main.ts` — API bootstrap
- `apps/api/src/common/interceptors/error.interceptor.ts` — existing interceptor pattern
- `apps/api/src/inference/inference.service.ts` — BullMQ job creation
- `apps/api/src/health/health.controller.ts` — existing health controller
- `apps/cv-worker/src/main.py` — FastAPI worker implementation
- `packages/contracts/src/cv-worker.ts` — CV worker contracts

---

## Specific Ideas

1. **AsyncLocalStorage for request context** — Use Node.js `AsyncLocalStorage` to make request ID available everywhere without modifying every function signature. This is the standard NestJS pattern for request context.

2. **pino-http for request logging** — Consider using `pino-http` middleware for automatic request/response logging with request IDs, but manual middleware gives more control.

3. **BullMQ job metadata** — Add `correlationId` as a top-level field in the BullMQ job payload (same level as `jobId`, not nested).

4. **Health check isolation** — Each dependency check service is independently injectable for easy testing and timeout configuration.

5. **loguru contextvars** — Python `contextvars.ContextVar` is the equivalent of `AsyncLocalStorage`. Set context at the middleware level.

6. **UUID generation** — Use `uuid` package for Node.js, `uuid` Python package for the worker.

---

## Deferred Ideas

- Prometheus metrics endpoint (`/metrics`)
- OpenTelemetry trace propagation
- Log aggregation with structured shipping
- Error tracking integration
- Performance profiling middleware
