# Phase 17 — Real Media Processing

## Objective

Make the CV worker produce real derivative artifacts. Replace `mock_thumbnailer` with real Pillow thumbnail generation and real MinIO read/write. NestJS owns all database state transitions. FastAPI writes only to MinIO.

## Status

**Completed** — 2026-05-03. Commit: `feat(media): process real thumbnail artifacts`

## Architecture Rule

**NestJS owns database state. FastAPI owns object storage only.**

```
Upload image
  → NestJS stores original in MinIO
  → NestJS creates MediaProcessingJob (QUEUED)
  → NestJS enqueues to media-processing BullMQ queue
  → NestJS BullMQ consumer claims job
  → Consumer calls FastAPI /cv/create-thumbnail
  → FastAPI reads original from MinIO
  → FastAPI creates real thumbnail with Pillow
  → FastAPI writes thumbnail to MinIO
  → FastAPI returns artifact metadata (objectKey, width, height, checksum)
  → NestJS persists AssetDerivative row
  → NestJS updates MediaAsset.thumbnailKey
  → NestJS transitions MediaProcessingJob to SUCCEEDED
  → On failure: NestJS transitions job to FAILED with safe error message
```

**Critical: FastAPI never writes PostgreSQL.**

## Out of Scope

- Phase 18 COCO export
- Phase 19 ONNX inference
- Phase 21 frontend feature split completion
- Frame extraction (deferred — explicit unsupported error until thumbnail path is verified)

---

## Wave 17-01: Contracts + Schema

**Engineer:** Contracts / Database

### Task 1: Extend CV Worker Contracts

File: `packages/contracts/src/cv-worker.ts`

Add:

```typescript
// Media processing request
export const CvWorkerMediaProcessingRequestSchema = z.object({
  jobId: z.string().min(1),
  assetId: z.string().min(1),
  storageKey: z.string().min(1),
  targetKey: z.string().min(1),
  mimeType: z.string().min(1),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

// Derivative artifact returned by worker
export const CvWorkerDerivativeArtifactSchema = z.object({
  type: z.enum(['THUMBNAIL', 'FRAME']),
  storageKey: z.string().min(1),
  width: z.number().int().nonnegative().nullable(),
  height: z.number().int().nonnegative().nullable(),
  checksum: z.string().min(1),
  mimeType: z.string().min(1),
});

// Response from /cv/create-thumbnail
export const CvWorkerCreateThumbnailResponseSchema = z.object({
  jobId: z.string().min(1),
  assetId: z.string().min(1),
  status: z.enum(['SUCCEEDED', 'FAILED']),
  derivative: CvWorkerDerivativeArtifactSchema,
  error: z.string().nullable().optional(),
});

// Response from /cv/extract-frames
export const CvWorkerExtractFramesResponseSchema = z.object({
  jobId: z.string().min(1),
  assetId: z.string().min(1),
  status: z.enum(['SUCCEEDED', 'FAILED']),
  frames: z.array(CvWorkerDerivativeArtifactSchema),
  frameCount: z.number().int().nonnegative(),
  error: z.string().nullable().optional(),
});
```

### Task 2: Update `packages/contracts/src/index.ts`

Re-export new schemas.

### Task 3: Schema — Verify `checksum` Field on `AssetDerivative`

File: `infra/prisma/schema.prisma`

The schema already has `checksum String?` on `AssetDerivative`. No migration needed.

Verify: Run `pnpm db:generate` and `pnpm db:push`.

---

## Wave 17-02: CV Worker Real Thumbnail

**Engineer:** CV Worker

### Task 4: Add MinIO Dependencies to `requirements.txt`

Add:

```
minio>=7.2.0
```

Keep existing: `pillow==11.2.1`

### Task 5: Create `apps/cv-worker/src/storage.py`

MinIO client module for reading source objects and writing derivative objects.

```python
import hashlib
import os
from typing import Tuple
from minio import Minio
from minio.error import S3Error

BUCKET = os.environ.get("MINIO_BUCKET", "visionflow-artifacts")

_client: Minio | None = None

def get_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            endpoint=f"{os.environ.get('MINIO_ENDPOINT', 'localhost')}:{os.environ.get('MINIO_PORT', '9000')}",
            access_key=os.environ.get("MINIO_ACCESS_KEY", ""),
            secret_key=os.environ.get("MINIO_SECRET_KEY", ""),
            secure=os.environ.get("MINIO_USE_SSL", "false").lower() == "true",
        )
    return _client

def read_object(storage_key: str) -> Tuple[bytes, str]:
    """Read an object from MinIO. Returns (bytes, content_type)."""
    client = get_client()
    try:
        response = client.get_object(BUCKET, storage_key)
        data = response.read()
        response.close()
        response.release_conn()
        content_type = response.headers.get("content-type", "application/octet-stream")
        return data, content_type
    except S3Error as e:
        if e.code == "NoSuchKey":
            raise FileNotFoundError(f"Object not found in MinIO: {storage_key}") from e
        raise RuntimeError(f"MinIO read error for {storage_key}: {e}") from e

def write_object(storage_key: str, data: bytes, content_type: str) -> None:
    """Write an object to MinIO."""
    client = get_client()
    try:
        client.put_object(
            BUCKET,
            storage_key,
            data,
            len(data),
            content_type=content_type,
        )
    except S3Error as e:
        raise RuntimeError(f"MinIO write error for {storage_key}: {e}") from e

def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
```

### Task 6: Create `apps/cv-worker/src/media_processing.py`

Real thumbnail generation using Pillow.

```python
from io import BytesIO
from PIL import Image
from .storage import read_object, write_object, compute_sha256

THUMBNAIL_MAX_BOX = 512
THUMBNAIL_FORMAT = "WEBP"
THUMBNAIL_MIME = "image/webp"

def create_thumbnail(source_key: str, target_key: str) -> dict:
    """Read source image, create thumbnail, write to MinIO, return metadata."""
    data, source_mime = read_object(source_key)

    try:
        img = Image.open(BytesIO(data))
    except Exception as exc:
        raise ValueError(f"Failed to decode image {source_key}: {exc}") from exc

    img = img.convert("RGB")

    # Compute scaling to fit within 512x512 without upscaling
    w, h = img.size
    scale = min(THUMBNAIL_MAX_BOX / w, THUMBNAIL_MAX_BOX / h, 1.0)
    if scale < 1.0:
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)

    # Save to WebP bytes
    output = BytesIO()
    img.save(output, format=THUMBNAIL_FORMAT, quality=85)
    output_bytes = output.getvalue()

    # Write derivative to MinIO
    write_object(target_key, output_bytes, THUMBNAIL_MIME)

    # Compute checksum of output
    checksum = compute_sha256(output_bytes)

    thumb_w, thumb_h = img.size
    img.close()

    return {
        "type": "THUMBNAIL",
        "storageKey": target_key,
        "width": thumb_w,
        "height": thumb_h,
        "checksum": checksum,
        "mimeType": THUMBNAIL_MIME,
    }
```

### Task 7: Update `apps/cv-worker/src/main.py`

Replace mock `create_thumbnail` and `extract_frames` endpoints with real implementations.

**Changes to `/cv/create-thumbnail`:**

- Import `create_thumbnail` from `media_processing`
- Remove mock response with `runtime: mock_thumbnailer`
- Call `create_thumbnail(source_key, target_key)` from MinIO
- Return real artifact metadata: `{ jobId, assetId, status: 'SUCCEEDED', derivative: {...}, error: null }`
- On failure: return `{ jobId, assetId, status: 'FAILED', derivative: null, error: 'safe message' }`
- HTTP 400 if image decode fails, HTTP 404 if source not found

**Changes to `/cv/extract-frames`:**

- Return explicit unsupported response: `{ jobId, assetId, status: 'FAILED', frames: [], frameCount: 0, error: 'Frame extraction is not yet implemented. This feature requires Phase 17 follow-up after thumbnail path is verified.' }`
- Log the unsupported attempt
- HTTP 200 with status FAILED (NestJS will transition the DB job to FAILED)

### Acceptance Criteria

1. `/cv/create-thumbnail` reads from MinIO, produces real WebP thumbnail, writes to MinIO.
2. Response includes `width`, `height`, `checksum` from real artifact.
3. Missing source returns HTTP 404.
4. Corrupt source returns HTTP 400.
5. No `mock_thumbnailer` string in response.
6. `/cv/extract-frames` returns explicit FAILED with clear error message.

---

## Wave 17-03: API Media Processing Consumer

**Engineer:** API / Backend

### Task 8: Create `MediaProcessingService`

File: `apps/api/src/media/media-processing.service.ts`

Responsibilities:

- `enqueueMediaJob(projectId, assetId, jobType, storageKey, targetKey)`: creates job in DB (QUEUED), enqueues to BullMQ
- Worker handler: claims job, transitions to RUNNING, calls FastAPI `/cv/create-thumbnail`, persists derivative, updates `MediaAsset.thumbnailKey`, transitions to SUCCEEDED
- On FastAPI error: transitions to FAILED, stores safe error message
- No DB writes from FastAPI

```typescript
type MediaProcessingPayload = {
  projectId: string;
  mediaJobId: string;
  assetId: string;
  sourceObjectKey: string;
  targetKey: string;
  jobType: 'THUMBNAIL' | 'EXTRACT_FRAMES';
  correlationId: string;
};
```

### Task 9: Create `MediaCvWorkerClient`

File: `apps/api/src/media/media-cv-worker.client.ts`

Wraps HTTP calls to `/cv/create-thumbnail` and `/cv/extract-frames`.

```typescript
async createThumbnail(request: {
  jobId: string;
  assetId: string;
  storageKey: string;
  targetKey: string;
  mimeType: string;
  width: number | null;
  height: number | null;
}): Promise<CvWorkerCreateThumbnailResponse>
```

### Task 10: Wire MediaProcessingService into MediaModule

File: `apps/api/src/media/media.module.ts`

- Import BullMQ if in database mode
- Add `MediaProcessingService` as provider
- Add `BullMQWorker` for `media-processing` queue
- Consumer starts on `onModuleInit`, closes on `onModuleDestroy`

### Task 11: Extend PrismaMediaRepository

File: `apps/api/src/repositories/media.repository.impl.ts`

Add methods:

- `updateProcessingJobStatus(jobId, status, errorMessage?)`
- `findProcessingJob(jobId)` — returns full MediaProcessingJob
- `createAssetDerivative({ assetId, type, storageKey, width, height, checksum })`
- `updateAssetThumbnailKey(assetId, thumbnailKey)`

### Task 12: Extend MediaRepository Interface

File: `apps/api/src/repositories/media.repository.ts`

Add method signatures for the above.

### Task 13: Persist Derivative After Worker Success

After FastAPI returns success from `/cv/create-thumbnail`:

1. Create `AssetDerivative` row with storageKey, width, height, checksum, type=THUMBNAIL
2. If jobType === 'THUMBNAIL', update `MediaAsset.thumbnailKey` to the derivative storageKey
3. Transition `MediaProcessingJob` to SUCCEEDED
4. Write audit log entry

### Task 14: Failure Path

On FastAPI failure or worker exception:

1. Transition `MediaProcessingJob` to FAILED
2. Store safe error message in `MediaProcessingJob.errorMessage`
3. Write audit log entry with failure details
4. Never leak internal error details to client

---

## Wave 17-04: Frame Extraction — Explicit Deferred

**Engineer:** CV Worker

### Task 15: Frame Extraction Deferred Stub

`/cv/extract-frames` returns:

```json
{
  "jobId": "...",
  "assetId": "...",
  "status": "FAILED",
  "frames": [],
  "frameCount": 0,
  "error": "Frame extraction requires additional dependencies (OpenCV or ffmpeg) and is not yet implemented. Implement after thumbnail path is verified end-to-end."
}
```

The NestJS consumer will catch this FAILED status and transition the DB job to FAILED.

---

## Verification Plan

### Step 1: Typecheck + Tests

```bash
pnpm db:generate
pnpm db:push
pnpm typecheck
pnpm test
cd apps/cv-worker && python -m pytest tests/ -v
pnpm build
pnpm lint
pnpm format:check
```

### Step 2: Boot Stack

```bash
pnpm dev:full:win
```

### Step 3: API Smoke

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/live
curl http://localhost:3000/api/health/deep
curl http://localhost:8000/health
curl http://localhost:3000/api/projects/proj_parking_lot/media
```

### Step 4: Real Media Processing Smoke

1. Upload a small JPEG/PNG via the web UI or API
2. Confirm MediaProcessingJob is created with status QUEUED
3. Wait for job to transition RUNNING → SUCCEEDED
4. Confirm thumbnail object exists in MinIO at targetKey
5. Confirm AssetDerivative row exists with checksum
6. Confirm MediaAsset.thumbnailKey is set
7. Confirm media list returns thumbnailKey

### Step 5: Failure Smoke

1. Upload image, then manually corrupt or delete the MinIO source object
2. Observe MediaProcessingJob transitions to FAILED
3. Confirm errorMessage is safe (no stack traces or credentials)

---

## Files to Create

- `.planning/phases/phase-17-real-media-processing/17-PLAN.md`
- `.planning/phases/phase-17-real-media-processing/17-SUMMARY.md`
- `.planning/phases/phase-17-real-media-processing/17-REVIEW.md`
- `apps/cv-worker/src/storage.py`
- `apps/cv-worker/src/media_processing.py`

## Files to Modify

- `packages/contracts/src/cv-worker.ts`
- `packages/contracts/src/index.ts`
- `apps/cv-worker/src/main.py`
- `apps/cv-worker/requirements.txt`
- `apps/api/src/media/media-processing.service.ts` (new)
- `apps/api/src/media/media-cv-worker.client.ts` (new)
- `apps/api/src/media/media.module.ts`
- `apps/api/src/repositories/media.repository.ts`
- `apps/api/src/repositories/media.repository.impl.ts`
- `apps/api/src/repositories/storage.repository.ts`
- `apps/api/src/repositories/storage.impl.ts`
- `apps/api/src/config/provider-tokens.ts`
- `.env.example`
- `README.md` (if setup/env changed)

## Success Criteria

1. `/cv/create-thumbnail` produces a real image artifact in MinIO.
2. AssetDerivative row contains real checksum.
3. MediaAsset.thumbnailKey is updated after thumbnail success.
4. MediaProcessingJob transitions: QUEUED → RUNNING → SUCCEEDED (or FAILED on error).
5. No `mock_thumbnailer` string in any media processing response.
6. FastAPI has no PostgreSQL access — only MinIO reads/writes.
7. `/cv/extract-frames` returns explicit FAILED with clear error message.
8. Failed media processing writes safe error message via NestJS audit log.
9. Integration smoke: upload → thumbnail in MinIO → derivative in DB.
