# VisionFlow Runtime Skill

Use this skill for all VisionFlow Studio runtime, backend, seed, inference, dataset,
annotation, queue, Docker, and API consistency issues.

## System Model

- **Frontend**: React/Vite/TypeScript (apps/web)
- **API**: NestJS/TypeScript (apps/api)
- **DB**: PostgreSQL via Prisma (infra/prisma)
- **Queue**: Redis/BullMQ
- **Storage**: MinIO (S3-compatible)
- **CV Worker**: Python/FastAPI or mock detector (apps/api/src/inference)
- **Package Manager**: pnpm workspaces

## Debug Order

For ANY runtime issue, follow this order:

1. **Confirm API boots.** `curl http://localhost:3000/api/health`
2. **Confirm Docker infra.** `docker ps` — Postgres, Redis, MinIO all running
3. **Confirm env vars.** DATABASE_URL, REDIS_PORT, MinIO config present
4. **Confirm Prisma schema.** `pnpm db:generate` succeeds
5. **Confirm seed-db consistency.** `pnpm seed:db -- --reset`
6. **Confirm dataset version IDs** match between frontend and API
7. **Confirm no stale QUEUED/RUNNING jobs** without real queue worker
8. **Confirm annotation workspace endpoint.** Returns 200 with valid payload
9. **Confirm inference job lifecycle** reaches terminal state (COMPLETED/FAILED)
10. **Confirm browser UI** shows no stale runtime errors

## Required Verification Checks

After any code change, ALWAYS run ALL applicable checks:

```powershell
# Core
pnpm typecheck
pnpm test
pnpm build

# API health
curl http://localhost:3000/api/health

# Dataset endpoints
curl http://localhost:3000/api/projects/proj_parking_lot/datasets
curl http://localhost:3000/api/projects/proj_parking_lot/dataset-versions

# Annotation workspace
curl "http://localhost:3000/api/projects/proj_parking_lot/dataset-versions/dataset_proj_parking_lot_parking_v3/annotation-workspace?assetId=asset_frame_1482"

# Inference jobs
curl http://localhost:3000/api/projects/proj_parking_lot/inference-jobs

# Queue health
curl http://localhost:3000/api/health  # includes queue worker status
```

## Hard Fail Conditions

**FAIL immediately** if response contains:

- `"status":"QUEUED"` with no corresponding queue worker
- `"status":"RUNNING"` stuck for >5 minutes
- `Dataset version not found`
- `Annotation workspace 404`
- `API is not connected`
- `Progress stream disconnected`
- `PrismaClientKnownRequestError`
- `Connection refused` on DATABASE_URL

## Never Claim Success Without

1. `pnpm typecheck` passes
2. `pnpm test` passes (when touched code has tests)
3. `pnpm build` passes (when API/backend changed)
4. API health endpoint returns 200
5. The specific endpoint relevant to the fix returns expected data

## Common Failure Patterns

### Stale seed data
Dataset version IDs in seed don't match what frontend requests.
Fix: `pnpm seed:db -- --reset`

### QUEUED jobs stuck forever
No queue worker running, or worker crashed.
Fix: Start queue worker + `pnpm seed:db -- --reset` to clean job table.

### Annotation workspace 404
Asset ID not in seed data, or dataset version mismatch.
Fix: Verify assetId in seed-db.ts, verify dataset version matches.

### API disconnected in browser
Backend not running, CORS misconfigured, or wrong port.
Fix: `pnpm dev`, check `apps/api/src/main.ts` CORS config.

### Progress stream disconnected
MinIO not running, or PRESIGNED_URL expired.
Fix: `docker ps` for MinIO, check MinIO credentials in .env.
