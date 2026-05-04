---
review: 15-REVIEW
phase: 15
status: has-issues
files_reviewed: 28
depth: standard
---

# Code Review: Phase 15 — Observability & Health Checks

## Summary

The phase introduces comprehensive observability infrastructure including structured logging with AsyncLocalStorage context propagation, health check endpoints for all dependencies, and distributed tracing via correlation IDs. The implementation is largely sound with several issues that should be addressed: two critical bugs (CV Worker URL SSRF vulnerability, BullMQ `getRedisClient` race condition), several warnings (header name inconsistency, error detail leakage, storage interface return type), and multiple info-level improvements.

## Finding Counts

- Critical: 2
- Warning: 8
- Info: 8
- Total: 18

---

## Critical Issues

### CR-01: CV Worker Health Service — SSRF Vulnerability

**File:** `apps/api/src/health/services/cv-worker-health.service.ts`
**Lines:** 22–23
**Severity:** Critical
**Description:** The `CvWorkerHealthService` fetches health from `this.workerUrl` without validating that the URL is an internal service. `CV_WORKER_URL` is an environment variable that can be set to any HTTP/HTTPS URL by a developer, but if this env var is ever injected from untrusted input (e.g., a config file, a deployment template, or a multi-tenant scenario), an attacker could cause the health check to fetch arbitrary URLs — a Server-Side Request Forgery attack. While this is a local workbench (no multi-tenant risk today), it's a bad pattern that could persist into future deployments.

**Fix:**

```typescript
// Add URL allowlist validation
private static readonly ALLOWED_HOSTS = ['localhost', '127.0.0.1', '::1'];

private isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    return (
      parsed.protocol === 'http:' &&
      (host === 'localhost' || host === '127.0.0.1' || host === '::1')
    );
  } catch {
    return false;
  }
}

async check(timeoutMs = 5000): Promise<DependencyHealthDto> {
  // ...
  const response = await fetch(this.workerUrl, {
    // validate before fetch
    if (!this.isAllowedUrl(this.workerUrl)) {
      return {
        status: 'down',
        responseTimeMs: Date.now() - start,
        details: { error: 'CV_WORKER_URL must be a localhost address' },
      };
    }
    // ...
  }
}
```

### CR-02: BullMQ `getRedisClient` Race Condition

**File:** `apps/api/src/queues/job-queue.impl.ts`
**Lines:** 20–31, 53–58
**Severity:** Critical
**Description:** In `BullMqJobQueue.start()`, `getRedisClient()` returns `null` until `start()` is called. But `RedisHealthService` calls `jobQueue.getRedisClient?.()` in its constructor (inject-time), before `start()` has been invoked. This creates a race condition: if the health check fires before the queue has started, `getRedisClient()` returns `null` even though Redis is configured and running. The health check would incorrectly report `status: 'up'` with `note: 'memory mode'` — masking the fact that Redis is the intended mode.

Additionally, `this.redisClient` is set via `(this.queue as any).client` which uses a TypeScript-ignored cast and is an internal BullMQ property that may not be stable across versions.

**Fix:** Refactor `RedisHealthService` to not depend on the queue's client, or add a `isStarted` flag:

```typescript
// job-queue.impl.ts
getRedisClient(): { ping: () => Promise<unknown> } | null {
  if (!this.redisClient) return null;
  // Guard against accessing before start
  if (!this.started) return null;
  return this.redisClient;
}

// Better: expose a ping() method directly on JobQueue
async pingRedis(): Promise<boolean> {
  if (!this.queue) return false; // memory mode
  const client = await (this.queue as any).client;
  await client.ping();
  return true;
}
```

Then in `RedisHealthService`:

```typescript
async check(timeoutMs = 5000): Promise<DependencyHealthDto> {
  const start = Date.now();
  try {
    await Promise.race([
      this.jobQueue.pingRedis(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs),
      ),
    ]);
    return { status: 'up', responseTimeMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      details: { error: (err as Error).message },
    };
  }
}
```

---

## Warnings

### WR-01: Header Name Inconsistency — `x-request-id` vs `x-correlation-id`

**File:** `apps/api/src/common/interceptors/request-id.interceptor.ts` (L32–33)
**Files Affected:** `apps/api/src/common/interceptors/request-id.interceptor.ts`, `apps/api/src/inference/cv-worker.client.ts`, `apps/api/src/common/middleware/request-logger.middleware.ts`
**Lines:** RequestIdInterceptor:32–33; CvWorkerClient:44,102; RequestLoggerMiddleware:11
**Severity:** Warning
**Description:** The `RequestIdInterceptor` reads and writes the `x-request-id` header (line 32), but `CvWorkerClient` sends `x-correlation-id` (line 44). The inference job payload also uses `correlationId` as the field name. This creates a split-brain situation where the same logical ID is called `x-request-id` at the HTTP boundary and `x-correlation-id` inside the job payload.

The `RequestLoggerMiddleware` reads `x-request-id` (line 11), so it's consistent with the interceptor. But `main.py` CV worker middleware reads `x-correlation-id`. The README documents `x-correlation-id` for inference jobs but `x-request-id` for general tracing.

**Fix:** Pick one — `x-request-id` (NestJS ecosystem convention) or `x-correlation-id` (distributed tracing convention). Rename `x-correlation-id` to `x-request-id` everywhere in `CvWorkerClient` and `structured.py` to align with the NestJS interceptor. Alternatively, update the `RequestIdInterceptor` to also read/write `x-correlation-id` and keep both headers.

### WR-02: Error Detail Leakage in HTTP 500 Responses

**File:** `apps/api/src/common/interceptors/error.interceptor.ts`
**Lines:** 176–182
**Severity:** Warning
**Description:** In `cv-worker/src/main.py`, the exception handler re-throws with `detail=str(exc)`, exposing the raw exception message to clients:

```python
36|        except Exception as exc:  # noqa: BLE001
37|            RequestLogger.log_request_failed(request, start, str(exc))
38|            raise
```

And in the API:

```typescript
176|  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(...)
      throw new Error('CV worker run-pipeline timed out.');
    }
    throw error; // <-- propagates raw error detail
  }
```

While the `GlobalErrorFilter` catches NestJS exceptions and sanitizes them, direct `Error` throws from `CvWorkerClient.runPipeline` (line 75: `throw error`) would include the raw worker error message (which could include internal paths, model keys, or worker details).

**Fix:** Wrap all worker errors in a domain-specific error:

```typescript
// CvWorkerClient.runPipeline, line 75
throw new CvWorkerError('CV worker request failed', { cause: error });
```

Where `CvWorkerError` has a safe `message` property that doesn't expose internals.

### WR-03: Storage Interface Returns `void` for `listBuckets`

**File:** `apps/api/src/repositories/storage.repository.ts`
**Lines:** 5
**Severity:** Warning
**Description:** The `listBuckets()` method returns `Promise<void>`, meaning the health check call at `minio-health.service.ts:13` is firing the call but throwing away the result:

```typescript
// storage.repository.ts:5
listBuckets(): Promise<void>;
// minio-health.service.ts:13
await this.storage.listBuckets(); // result is always undefined
```

If `listBuckets()` throws, the health check catches it (correct). But if you later want to include bucket names in health response details, the interface prevents it. The implementation `MinioStorageRepository` does return bucket data from `client.listBuckets()`, it's just discarded.

**Fix:** Change the return type to `Promise<BucketItem[]>` from the MinIO SDK (or a simple `string[]` of bucket names) so health details can include actual bucket information:

```typescript
export interface StorageRepository {
  // ...
  listBuckets(): Promise<string[]>;
}

// MinioStorageRepository
async listBuckets(): Promise<string[]> {
  const buckets = await this.client.listBuckets();
  return buckets.map(b => b.name);
}

// LocalStorageRepository
async listBuckets(): Promise<string[]> {
  return [];
}
```

### WR-04: `evaluate` Method Missing Correlation ID Logging

**File:** `apps/api/src/inference/cv-worker.client.ts`
**Lines:** 113–121
**Severity:** Warning
**Description:** The `evaluate` method logs at lines 112–122 but omits `jobId` from the log payload, unlike `runPipeline` which includes `jobId` (lines 55, 62). This makes debugging evaluation failures harder.

**Fix:** Add `jobId` to the evaluate log calls:

```typescript
// line 112-115
logger.error(
  { jobId: payload.jobId, correlationId, statusCode: response.status, durationMs },
  `CV worker evaluate failed: ${errorMsg}`
);
```

### WR-05: `bind_context` Implementation Is Wrong

**File:** `apps/cv-worker/src/observability/structured.py`
**Lines:** 79–81
**Severity:** Warning
**Description:** The `bind_context` function calls `_loguru_logger.configure(extra=kwargs)`, but `configure()` sets global logger configuration. This would mutate the global logger's extra context for ALL concurrent requests, not just the current context. Loguru's context management should use `logger.contextualize()` or bind via `Logger.bind()` per-call.

**Fix:** Use `Logger.bind()` instead:

```python
def bind_context(**kwargs: object) -> "loguru.Logger":
    """Return a logger instance with extra fields bound."""
    return _loguru_logger.bind(**kwargs)
```

Then use it as:

```python
_loguru_logger.bind(correlation_id=cid, job_id=jid).info("message")
```

Or use `contextualize()` for async-safe context propagation.

### WR-06: Python `RequestLogger` Level Function Bug

**File:** `apps/cv-worker/src/observability/structured.py`
**Lines:** 127
**Severity:** Warning
**Description:** The `RequestLogger.log_request_completed` uses `getattr(_loguru_logger, level)()` where `level` is a string (`'info'`, `'warning'`, `'error'`). This is a valid pattern, but the dynamic lookup could silently fail or produce unexpected behavior if `level` ever has an unexpected value. Additionally, `level` values are lowercase (`'error'`, `'warning'`, `'info'`) but Loguru methods are lowercase too, so this happens to work — however this is fragile.

**Fix:** Use a explicit mapping:

```python
_LOGuru_LEVEL_MAP = {
    "info": _loguru_logger.info,
    "warning": _loguru_logger.warning,
    "error": _loguru_logger.error,
}

def log_request_completed(self, request: "Request", status_code: int, start: float) -> None:
    # ...
    if status_code >= 500:
        _loguru_logger.error(...)
    elif status_code >= 400:
        _loguru_logger.warning(...)
    else:
        _loguru_logger.info(...)
```

### WR-07: Prisma Event Typing Workaround Could Break on Prisma Upgrades

**File:** `apps/api/src/prisma/prisma.service.ts`
**Lines:** 17, 22
**Severity:** Warning
**Description:** The `@ts-expect-error` comments suppress strict TypeScript errors for Prisma's `$on` event handler typing. This is a known Prisma issue, but if Prisma's types are updated in a future version, the suppressions could hide real type errors silently.

**Fix:** Add a comment explaining why this is suppressed and link to the issue:

```typescript
// @ts-expect-error - Prisma $on event typing is incompatible with strict mode (github.com/prisma/prisma/issues/XXXX)
// Prisma's $on typings don't match the actual runtime event shape. This is a known issue.
this.$on('warn', (event: { message: string; tags?: string[] }) => {
```

### WR-08: Memory Queue Race Condition in `NoopJobQueue`

**File:** `apps/api/src/queues/job-queue.impl.ts`
**Lines:** 76–81
**Severity:** Warning
**Description:** In `NoopJobQueue.enqueue()`, if `this.processor` is set, it shifts one item and processes it. But if `enqueue` is called rapidly (e.g., 10 calls in one event loop tick), each call would process only its own item. However, if `enqueue` is called concurrently with `start()`, there's a race where `start()` calls `drain()` simultaneously with an `enqueue()` call modifying `this.queue`.

```typescript
async enqueue(payload: JobQueuePayload): Promise<void> {
  this.queue.push(payload);
  if (this.processor) {
    const p = this.queue.shift();  // processes only 1 item
    if (p) await this.processor(p);
  }
}

private async drain(): Promise<void> {
  while (this.queue.length > 0) {
    const payload = this.queue.shift();  // may race with enqueue
    if (payload && this.processor) await this.processor(payload);
  }
}
```

The `enqueue` only processes ONE item per call even if multiple are queued. This is inconsistent with the BullMQ behavior which would process all queued items.

**Fix:** Process all queued items in `enqueue`:

```typescript
async enqueue(payload: JobQueuePayload): Promise<void> {
  this.queue.push(payload);
  if (this.processor) {
    await this.processAll();
  }
}

private async processAll(): Promise<void> {
  while (this.queue.length > 0) {
    const p = this.queue.shift();
    if (p) await this.processor!(p);
  }
}
```

---

## Info

### IN-01: Unused Import in `main.ts`

**File:** `apps/api/src/main.ts`
**Lines:** 6–8
**Severity:** Info
**Description:** `RequestIdInterceptor` is imported at line 7 but the import is used at line 31. The import is correct and used.

### IN-02: `getRedisClient` Return Type Uses `any`

**File:** `apps/api/src/queues/job-queue.impl.ts`
**Lines:** 14, 53
**Severity:** Info
**Description:** `private redisClient: any = null;` uses `any` to store the BullMQ internal Redis client. Consider using `import type { RedisClient } from 'bullmq'` if available, or at minimum `object` with a typed interface.

### IN-03: Missing Type for `npm_package_version`

**File:** `apps/api/src/health/health.service.ts`
**Lines:** 36
**Severity:** Info
**Description:** `process.env.npm_package_version` is a non-standard env var populated by some tools (e.g., `npm run`). This could be `undefined` even though TypeScript narrows it. The `?? '0.0.0'` fallback is correct, but the source of this value is non-standard. Consider using `import { version } from '../../../package.json'` with a build-time replacement, or a dedicated `APP_VERSION` env var.

### IN-04: CV Worker `/health` Endpoint Doesn't Validate `x-correlation-id`

**File:** `apps/cv-worker/src/main.py`
**Lines:** 100–124
**Severity:** Info
**Description:** The `/health` endpoint reads `correlation_id` from `request.state` but never validates it. Since this is a public endpoint (used by load balancers and orchestrators), any input is acceptable. No action needed, but be aware that the `correlationId` in the response is whatever was passed in (including malformed values).

### IN-05: Hardcoded Version String in CV Worker

**File:** `apps/cv-worker/src/main.py`
**Lines:** 22
**Severity:** Info
**Description:** `WORKER_VERSION = "0.2.0"` is hardcoded. Consider loading from `pyproject.toml` or `__version__` to avoid drift.

### IN-06: `x-request-id` Header Only Set When Present in Incoming Request

**File:** `apps/api/src/common/interceptors/request-id.interceptor.ts`
**Lines:** 31–33
**Severity:** Info
**Description:** The interceptor only sets `x-request-id` response header if an incoming header exists. If the client doesn't send `x-request-id`, the response won't have it either. This is generally fine, but could make tracing harder for clients who don't send an initial ID. Consider always setting the response header (regardless of whether one was received).

### IN-07: `listBuckets()` Called Without Bucket Names in Health Response

**File:** `apps/api/src/health/services/minio-health.service.ts`
**Lines:** 13, 18
**Severity:** Info
**Description:** The MinIO health check successfully calls `listBuckets()` but doesn't include bucket information in the response. Since the return type is `void`, this information is lost. If desired for debugging, the `StorageRepository` interface could be updated to return bucket data.

### IN-08: Python Exception Handler Uses Bare `raise`

**File:** `apps/cv-worker/src/main.py`
**Lines:** 42
**Severity:** Info
**Description:** The middleware uses bare `raise` to re-raise the exception after logging. This is correct Python 3 behavior (it re-raises the active exception), but it's idiomatic and fine.

---

## Pass Checks

The following files passed review with no issues:

| File                                                                   | Reason                                                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `apps/api/src/common/logging/request-context.ts`                       | Clean AsyncLocalStorage implementation, correct `getStore()` usage, proper `withRequestContext` wrapper |
| `apps/api/src/common/logging/structured-logger.ts`                     | Clean pino factory, proper logger caching, transport configuration is sound                             |
| `apps/api/src/common/middleware/request-logger.middleware.ts`          | Proper `res.on('finish')` pattern, correct timing measurement, appropriate log levels                   |
| `apps/api/src/common/interceptors/error.interceptor.ts`                | Proper exception hierarchy handling, safe error response construction, sanitized messages               |
| `apps/api/src/health/health.controller.ts`                             | Clean controller, proper DTO usage, correct HTTP status codes                                           |
| `apps/api/src/health/health.module.ts`                                 | Proper module structure, all dependencies correctly imported                                            |
| `apps/api/src/health/dto/health-response.dto.ts`                       | Clean DTOs with `!` definite assignment assertions for required fields                                  |
| `apps/api/src/health/services/postgres-health.service.ts`              | Correct `Promise.race` timeout pattern, proper error handling                                           |
| `apps/api/src/health/services/redis-health.service.ts`                 | Graceful fallback to memory mode, proper timeout handling                                               |
| `apps/api/src/health/services/minio-health.service.ts`                 | Clean abstraction through `StorageRepository`, proper timeout                                           |
| `apps/api/src/app.module.ts`                                           | Proper module imports, middleware configuration is correct                                              |
| `apps/cv-worker/src/observability/__init__.py`                         | Clean module exports, all public API properly exposed                                                   |
| `apps/cv-worker/src/observability/structured.py` (except WR-05, WR-06) | Proper contextvars usage, loguru configuration, context manager cleanup                                 |
| `apps/cv-worker/tests/test_worker.py`                                  | Comprehensive test coverage, edge cases covered                                                         |
| `README.md`                                                            | Well-structured documentation, accurate examples                                                        |

---

## Recommendations

### R-01: Add Health Check Timeout Configuration

The `timeoutMs` parameter is hardcoded to `5000` in all health services. The README documents `HEALTH_CHECK_TIMEOUT_MS` but it's not actually used. Consider wiring it up:

```typescript
// health.service.ts
const DEFAULT_TIMEOUT_MS = Number(process.env.HEALTH_CHECK_TIMEOUT_MS ?? '5000');

// In each check():
async check(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<DependencyHealthDto>
```

### R-02: Add Correlation ID to Swagger/OpenAPI

Add the `x-request-id` and `x-correlation-id` headers to the Swagger documentation so API consumers know to use them for tracing.

### R-03: Consider Adding Request Logging to FastAPI Middleware

The CV worker `correlation_id_middleware` handles correlation IDs and timing but doesn't log request details by default. Adding structured request/response logging similar to the NestJS `RequestLoggerMiddleware` would make debugging easier.

### R-04: Add `correlationId` Field to `run_pipeline` Response

The CV worker already echoes `x-correlation-id` in response headers, but the response body could also include it for clients who don't have access to response headers.

### R-05: Test Memory Mode Fallback Explicitly

The health check has two branches (memory mode vs Redis). Add a test case that verifies the health service handles the memory mode gracefully without needing Redis.
