# Phase 16A — Frontend Split Minimum

## Objective

Reduce risk before real worker/detector phases by extracting the highest-change frontend areas from the monolithic `apps/web/src/App.tsx`. This is a surgical refactor: move code without changing behavior.

## Status

**Done** — Completed 2026-05-03. Commit: `95d52bc10ab60068eec0882b83d8276e870249fc`

## Out of Scope

- UI redesign or visual polish
- Backend or API changes
- Phase 17+ (real media processing, ONNX, COCO export, evaluation E2E)
- Moving dataset, annotation, pipeline, or timeline features

---

## Task 1: Create Phase Plan Artifact

**Status:** Done.

---

## Task 2: Extract Shared API Client

**Goal:** Create a canonical shared API boundary. `lib/http.ts` and `lib/media-upload.ts` both define their own `API_BASE_URL` and `readApiError`. Consolidate into one place.

### Action

Create `apps/web/src/shared/api/client.ts`:

```typescript
// shared/api/client.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as T;
}

export async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      message?: string | string[] | { message?: string; detail?: string };
      error?: string;
      detail?: string;
    };

    if (typeof body.message === 'string') return body.message;
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (typeof body.message === 'object' && body.message?.message) {
      return body.message.detail
        ? `${body.message.message}: ${body.message.detail}`
        : body.message.message;
    }
    return body.detail ?? body.error ?? `Request failed with HTTP ${response.status}`;
  } catch {
    return `Request failed with HTTP ${response.status}`;
  }
}

export async function apiUpload<T>(
  path: string,
  body: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as T;
}
```

Create `apps/web/src/shared/api/index.ts`:

```typescript
export { API_BASE_URL, apiJson, readApiError, apiUpload } from './client';
```

### Acceptance Criteria

1. `API_BASE_URL`, `apiJson`, `readApiError`, `apiUpload` are all exported from `shared/api/index.ts`
2. All callers currently using `lib/http.ts` or `lib/media-upload.ts` can migrate to `shared/api`
3. No circular dependencies: `shared/` does not import from `features/` or `app/`

---

## Task 3: Extract Media Feature Module

**Goal:** Isolate media upload API calls, state types, and components.

### Action

Create `apps/web/src/features/media/media.types.ts`:

```typescript
import type { MediaUploadResponse } from '@visionflow/contracts';

export type MediaUploadRow = {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'FRAME';
  checksum: string;
  split: string;
  status: import('@visionflow/contracts').MediaUploadStatus | 'hashing' | 'uploading';
  progress: number;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  error?: string;
  processingJob?: string;
};

export type MediaUploadAsset = {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'FRAME';
  checksum: string;
  split: string;
  status: import('@visionflow/contracts').MediaUploadStatus;
  sizeBytes?: number;
  width?: number | null;
  height?: number | null;
};
```

Create `apps/web/src/features/media/media.api.ts`:

```typescript
import type { MediaUploadResponse } from '@visionflow/contracts';
import { apiUpload } from '../../shared/api';

export async function uploadMediaFile(
  projectId: string,
  file: File
): Promise<MediaUploadResponse> {
  const body = new FormData();
  body.append('file', file);
  return apiUpload<MediaUploadResponse>(
    `/api/projects/${projectId}/media/upload`,
    body
  );
}

export async function checksumFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
```

Create `apps/web/src/features/media/index.ts`:

```typescript
export type { MediaUploadRow, MediaUploadAsset } from './media.types';
export { uploadMediaFile, checksumFile } from './media.api';
```

### Acceptance Criteria

1. `features/media/index.ts` re-exports `MediaUploadRow`, `uploadMediaFile`, `checksumFile`
2. `lib/media-upload.ts` delegates to `features/media/media.api.ts`
3. `App.tsx` can import from `features/media` instead of `lib/media-upload`

---

## Task 4: Extract Inference Feature Module

**Goal:** Isolate inference job API calls, SSE, and types.

### Action

Create `apps/web/src/features/inference/inference.types.ts`:

```typescript
import type { InferenceJobSummary, InferenceJobEvent } from '@visionflow/contracts';

export type JobSourceState = 'loading' | 'api' | 'fallback';

export type JobUiState = InferenceJobSummary & {
  logs: string[];
  source: JobSourceState;
  error: string | null;
};
```

Create `apps/web/src/features/inference/inference.api.ts`:

```typescript
import type {
  CreateInferenceJobRequest,
  CreateInferenceJobResponse,
  EvaluationReport,
  EvaluationRunResponse,
  InferenceJobListResponse,
  InferenceJobSummary,
  PredictionListResponse,
} from '@visionflow/contracts';
import { apiJson, API_BASE_URL } from '../../shared/api';

export async function listInferenceJobs(
  projectId: string
): Promise<InferenceJobListResponse> {
  return apiJson<InferenceJobListResponse>(
    `/api/projects/${projectId}/inference-jobs`
  );
}

export async function createInferenceJob(
  projectId: string,
  body: CreateInferenceJobRequest
): Promise<CreateInferenceJobResponse> {
  return apiJson<CreateInferenceJobResponse>(
    `/api/projects/${projectId}/inference-jobs`,
    { method: 'POST', body: JSON.stringify(body) }
  );
}

export async function getEvaluationReport(
  projectId: string,
  jobId: string
): Promise<EvaluationReport | null> {
  const data = await apiJson<EvaluationRunResponse>(
    `/api/projects/${projectId}/inference-jobs/${jobId}/evaluation`
  );
  return data.report ?? null;
}

export async function runEvaluation(
  projectId: string,
  jobId: string
): Promise<EvaluationReport> {
  const data = await apiJson<EvaluationRunResponse>(
    `/api/projects/${projectId}/inference-jobs/evaluate`,
    { method: 'POST', body: JSON.stringify({ jobId }) }
  );
  if (!data.report) {
    throw new Error('Evaluation completed but no report was returned.');
  }
  return data.report;
}

export async function getJobPredictions(
  projectId: string,
  jobId: string
): Promise<PredictionListResponse> {
  return apiJson<PredictionListResponse>(
    `/api/projects/${projectId}/inference-jobs/${jobId}/predictions`
  );
}

export async function getInferenceJob(
  projectId: string,
  jobId: string
): Promise<InferenceJobSummary> {
  return apiJson<InferenceJobSummary>(
    `/api/projects/${projectId}/inference-jobs/${jobId}`
  );
}

export function openInferenceJobEvents(
  projectId: string,
  jobId: string
): EventSource {
  return new EventSource(
    `${API_BASE_URL}/api/projects/${projectId}/inference-jobs/${jobId}/events`
  );
}

export function mergeJobEvent(
  job: InferenceJobSummary,
  event: InferenceJobEvent
): InferenceJobSummary {
  return {
    ...job,
    status: event.status,
    progress: event.progress,
    startedAt: job.startedAt ?? (event.status === 'RUNNING' ? event.createdAt : null),
    completedAt:
      event.status === 'SUCCEEDED' ||
      event.status === 'FAILED' ||
      event.status === 'CANCELLED'
        ? event.createdAt
        : job.completedAt,
    errorMessage: event.type === 'error' ? event.message : job.errorMessage,
  };
}
```

Create `apps/web/src/features/inference/index.ts`:

```typescript
export type { JobSourceState, JobUiState } from './inference.types';
export {
  listInferenceJobs,
  createInferenceJob,
  getEvaluationReport,
  runEvaluation,
  getJobPredictions,
  getInferenceJob,
  openInferenceJobEvents,
  mergeJobEvent,
} from './inference.api';
```

### Acceptance Criteria

1. `features/inference/index.ts` re-exports all inference API functions and types
2. `lib/inference.ts` delegates to `features/inference/inference.api.ts`
3. `App.tsx` can import inference functions from `features/inference` instead of `lib/inference`

---

## Task 5: Update lib/http.ts

**Goal:** Remove duplication. Keep `lib/http.ts` for backward compat while delegating to shared.

### Action

Update `lib/http.ts`:

```typescript
// Re-export from canonical shared location
export { API_BASE_URL, apiJson, readApiError } from '../shared/api/client';
```

### Acceptance Criteria

1. `lib/http.ts` re-exports from `shared/api/client.ts`
2. `lib/datasets.ts` and `lib/pipelines.ts` keep working (they import from `lib/http.ts`)
3. `App.tsx` can optionally switch to importing from `shared/api` or `features/*`

---

## Task 6: Update lib/media-upload.ts

**Goal:** Remove duplicate error parsing and base URL.

### Action

Update `lib/media-upload.ts`:

```typescript
import type { MediaUploadResponse } from '@visionflow/contracts';
import { apiUpload } from './shared/api';

export async function uploadMediaFile(
  projectId: string,
  file: File
): Promise<MediaUploadResponse> {
  const body = new FormData();
  body.append('file', file);
  return apiUpload<MediaUploadResponse>(
    `/api/projects/${projectId}/media/upload`,
    body
  );
}

export async function checksumFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
```

### Acceptance Criteria

1. `lib/media-upload.ts` has no duplicate `API_BASE_URL` or `readApiError`
2. `App.tsx` can still import from `lib/media-upload`

---

## Task 7: Update lib/inference.ts

**Goal:** Remove duplication. Delegate to shared API.

### Action

Update `lib/inference.ts`:

```typescript
// Re-export from canonical feature location
export {
  listInferenceJobs,
  createInferenceJob,
  getEvaluationReport,
  runEvaluation,
  getJobPredictions,
  getInferenceJob,
  openInferenceJobEvents,
  mergeJobEvent,
} from '../features/inference/inference.api';
```

### Acceptance Criteria

1. `lib/inference.ts` re-exports from `features/inference/inference.api.ts`
2. `App.tsx` imports keep working

---

## Task 8: Refactor App.tsx

**Goal:** Replace inline and lib imports with feature module imports.

### Action

Update `App.tsx` imports:

```typescript
// REMOVE these inline/local imports that are now in feature modules:
// - inline MediaUploadRow type (move to features/media/media.types.ts)
// - inline JobUiState type (move to features/inference/inference.types.ts)
// - inline JobSourceState type (move to features/inference/inference.types.ts)

// REPLACE lib imports:
import { checksumFile, uploadMediaFile } from './lib/media-upload';
// BECOMES:
import { checksumFile, uploadMediaFile, type MediaUploadRow } from './features/media';

import {
  createInferenceJob,
  getEvaluationReport,
  getInferenceJob,
  getJobPredictions,
  listInferenceJobs,
  mergeJobEvent,
  openInferenceJobEvents,
  runEvaluation,
} from './lib/inference';
// BECOMES:
import {
  createInferenceJob,
  getEvaluationReport,
  getInferenceJob,
  getJobPredictions,
  listInferenceJobs,
  mergeJobEvent,
  openInferenceJobEvents,
  runEvaluation,
  type JobSourceState,
  type JobUiState,
} from './features/inference';

// KEPT in lib/http.ts (for now — backward compat for datasets, pipelines):
import { apiJson } from './lib/http';
```

Also replace:
```typescript
import { demoSnapshot, logs } from './data/demo';
```
Stays as-is — demo snapshot is intentionally kept at this stage.

### Acceptance Criteria

1. `App.tsx` imports `JobUiState`, `JobSourceState` from `features/inference`
2. `App.tsx` imports `MediaUploadRow` from `features/media`
3. `App.tsx` imports inference functions from `features/inference` (not `lib/inference`)
4. `App.tsx` still imports media functions from `features/media` (or `lib/media-upload`)
5. `App.tsx` keeps `demoSnapshot` imports from `./data/demo` (intentional — not cleaned up in Phase 16A)
6. `App.tsx` keeps all inline sub-components: `NavRail`, `ShellHeader`, `ReadinessStrip`, `OverviewPanel`, `MediaPanel`, `DatasetPanel`, `PipelinePanel`, `JobsPanel` (NOT extracted in Phase 16A — Phase 21 scope)

---

## Task 9: Verification

### Commands

```bash
pnpm --filter @visionflow/web typecheck
pnpm --filter @visionflow/web test
pnpm lint
pnpm format:check
pnpm build
```

### Success Criteria

1. `pnpm typecheck` passes
2. `pnpm test` passes (63 tests)
3. `pnpm lint` passes
4. `pnpm format:check` passes
5. `pnpm build` passes
6. No circular dependencies
7. No behavior regression

---

## Dependency Constraints (enforced)

| Rule | Reason |
|------|--------|
| `shared/` must not import from `features/` | shared is lower-layer |
| `features/media` must not import from `features/inference` | feature isolation |
| `features/inference` must not import from `features/media` | feature isolation |
| `app/` (App.tsx) may compose features | app is upper-layer |
| No `features/*` imports from `app/` | feature modules are tree-shakeable |
| Runtime selectors stay in `shared/state/` | Phase 15.5 contract preserved |
| `demoSnapshot` kept at `data/demo.ts` | Phase 16A does not touch demo truth |

---

## Risk Map

| Risk | Mitigation |
|------|------------|
| Circular deps during re-export chain | Path analysis before writing; barrel exports at leaves only |
| SSE/polling regression | `openInferenceJobEvents`, `mergeJobEvent` preserved verbatim in feature module |
| Runtime selectors broken | `shared/state/` not moved; `WorkbenchRuntimeState` unchanged |
| Seed mismatch | No seed changes in Phase 16A |
| Health endpoint regression | No backend changes |

---

## Phase 17 Pre-flight: P0 Blockers Identified

Before starting Phase 17, the following P0 issues must be addressed within that phase. No blocking issues prevent beginning Phase 17 — all are correctly scoped as Phase 17 deliverables.

### P0-1: CV Worker Real Media Processing (Core Phase 17 Goal)

**Current state:** `/cv/create-thumbnail` and `/cv/extract-frames` return `SUCCEEDED` with `runtime: mock_thumbnailer` / `mock_frame_extractor`. No MinIO read/write occurs.

**Required:** Real Pillow thumbnail generation, real OpenCV/ffmpeg frame extraction. Worker must read source from MinIO, write derivative to MinIO, return real artifact metadata.

**Required packages missing from `requirements.txt`:**
- `minio` or `boto3` — MinIO/S3 client for artifact read/write
- `opencv-python-headless` — video frame extraction (already in scope, not yet added)
- `ffmpeg-python` or subprocess wrapper — video processing (already in scope, not yet added)

### P0-2: Media Processing BullMQ Consumer

**Current state:** `MediaService.upload()` creates a `MediaProcessingJob` record and queues it, but no BullMQ consumer processes the job and calls the CV worker.

**Required:** NestJS `BullMQ` consumer for `media-processing` queue that dispatches to `/cv/create-thumbnail` or `/cv/extract-frames`, persists derivative metadata, transitions job state, and writes audit logs.

### P0-3: Schema — AssetDerivative Missing `checksum`

**Current state:** `AssetDerivative` model has `storageKey`, `width`, `height` but no `checksum` field.

**Required:** Add `checksum String?` to `AssetDerivative`. Migration file: `infra/prisma/migrations/YYYYMMDDHHMMSS_add_asset_derivative_checksum/migration.sql`. See Task 7 below.

### P0-4: API Upload — MediaService.upload() No Worker Dispatch

**Current state:** `MediaService.upload()` creates asset + job, but does not dispatch the job to the BullMQ queue.

**Required:** After creating `MediaProcessingJob`, enqueue the job to the `media-processing` queue. The BullMQ consumer handles the rest per P0-2.

### Verification: Phase 16A Complete

```bash
git log --oneline 95d52bc10ab60068eec0882b83d8276e870249fc -1
# 95d52bc refactor(web): split media and inference frontend modules

git diff --stat 95d52bc^..95d52bc -- apps/web/src/shared/ apps/web/src/features/ apps/web/src/lib/
# shared/api/client.ts         — new file
# shared/api/index.ts          — new file
# features/media/              — new files (media.types.ts, media.api.ts, index.ts)
# features/inference/         — new files (inference.types.ts, inference.api.ts, index.ts)
# lib/http.ts                  — re-export from shared
# lib/media-upload.ts          — delegates to shared
# lib/inference.ts             — re-exports from features/inference
# App.tsx                      — imports from feature modules
```

## Phase 17 Pre-flight: Schema Change

### Task 7: Add `checksum` to `AssetDerivative`

**Goal:** Track derivative artifact integrity with SHA-256 checksum.

### Action

Add `checksum String?` to `AssetDerivative` model in `infra/prisma/schema.prisma`:

```prisma
model AssetDerivative {
  id         String              @id @default(cuid())
  assetId    String
  type       AssetDerivativeType
  storageKey String
  width      Int?
  height     Int?
  checksum   String?
  createdAt  DateTime            @default(now())

  asset MediaAsset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@index([assetId, type])
}
```

### Acceptance Criteria

1. `AssetDerivative` has `checksum String?` field.
2. Migration generated with `pnpm db:migrate`.
3. CV worker returns `checksum` in artifact metadata response.
4. NestJS consumer persists `checksum` to DB.

---

## Files to Create

- `.planning/phases/phase-16-frontend-split-minimum/16A-PLAN.md` (this file)
- `apps/web/src/shared/api/client.ts`
- `apps/web/src/shared/api/index.ts`
- `apps/web/src/features/media/media.types.ts`
- `apps/web/src/features/media/media.api.ts`
- `apps/web/src/features/media/index.ts`
- `apps/web/src/features/inference/inference.types.ts`
- `apps/web/src/features/inference/inference.api.ts`
- `apps/web/src/features/inference/index.ts`

## Files to Modify

- `apps/web/src/lib/http.ts` — re-export from shared
- `apps/web/src/lib/media-upload.ts` — use shared apiUpload
- `apps/web/src/lib/inference.ts` — re-export from features/inference
- `apps/web/src/App.tsx` — import from feature modules
- `infra/prisma/schema.prisma` — add checksum to AssetDerivative (Phase 17 pre-flight)
- `infra/prisma/migrations/` — new migration for checksum field
