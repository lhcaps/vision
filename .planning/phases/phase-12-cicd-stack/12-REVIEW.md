# Phase 12 Code Review

Date: 2026-05-01
Phase: 12 — CI/CD Completeness + Local Stack & Seed Reliability
Reviewer: Claude Code (Karpathy Review)

## Scope

| File                       | Lines |
| -------------------------- | ----- |
| `.github/workflows/ci.yml` | 152   |
| `infra/docker-compose.yml` | 77    |
| `.env.example`             | 129   |
| `scripts/start-dev.sh`     | 121   |
| `scripts/start-dev.ps1`    | 114   |
| `scripts/seed-demo.ts`     | 261   |
| `README.md`                | 351   |

---

## Findings

### HIGH (fix before commit)

None identified. No blocking bugs found.

---

### MEDIUM (fix recommended)

#### 1. `seed-demo.ts:93–106` — Sequential API calls with no retry or concurrency control

```93:106:scripts/seed-demo.ts
  for (const media of demoSnapshot.media) {
    const asset = await apiPost<{ id: string }>('/api/media', {
      name: media.name,
      type: media.type,
      url: `https://picsum.photos/seed/${media.id}/1920/1080`,
      width: media.width,
      height: media.height,
      checksum: media.checksum,
      split: media.split,
      projectId,
    });
    mediaIds.push(asset.id);
    console.log(`    Asset: ${asset.id} (${media.name})`);
  }
```

Each `apiPost` call awaits the previous one. For 3 media assets this is fine, but the pattern means a slow or flaky network call adds unnecessary latency and a single failure aborts the entire seed. Consider `Promise.all` for parallelization, or at minimum wrapping each call in a try/catch so one bad asset doesn't stop the whole script. Right now if asset #2 fails, the function throws and the user gets no partial output.

**Fix**: Wrap each `apiPost` in a try/catch and log failures per-asset, continuing with remaining assets.

#### 2. `seed-demo.ts:150–163` — Silent skip on missing asset/label mapping with no count warning

```150:163:scripts/seed-demo.ts
    if (assetIndex === -1 || labelIndex === -1) continue;

    const result = await apiPost<{ id: string }>('/api/annotations', {
      assetId: mediaIds[assetIndex],
      labelId: labelIds[labelIndex],
      geometry: ann.geometry,
      source: ann.source,
      confidence: ann.confidence,
      projectId,
    });
```

If `demoSnapshot.annotations` references an `assetId` or `label` that doesn't exist in `demoSnapshot.media` / `labels` array, the annotation is silently skipped. In this specific case the hardcoded `labels` array on line 130–134 is in sync with the annotation data, so it works — but this is fragile. If someone adds an annotation with a label name not in that array, it disappears silently.

**Fix**: Count skipped annotations and log a warning at the end: `log_warn('Skipped N annotations due to missing asset/label mapping')`.

#### 3. `seed-demo.ts:248–250` — `createDemoDataViaAPI()` return value is silently discarded

```248:250:scripts/seed-demo.ts
  if (API_MODE) {
    await createDemoDataViaAPI();
  }
```

The function returns `CreatedEntities` with all created IDs but nothing is done with them. If the function partially succeeds (e.g., creates 2 of 3 media assets before failing), the caller has no record of what was created. This matters if someone wants to extend the script to clean up or verify the created data.

**Fix**: Capture the return value and log it clearly. Already done inside `createDemoDataViaAPI()` (lines 191–197), so the information is surfaced — just not surfaced to the caller context. Either remove the return type or document the call site expectation.

#### 4. `scripts/start-dev.ps1:61` — `-NoExit` on child processes causes resource leak

```104:107:scripts/start-dev.ps1
Start-Process powershell -ArgumentList "-NoExit", "cd '$ROOT'; pnpm dev"
Start-Process powershell -ArgumentList "-NoExit", "cd '$ROOT'; python -m uvicorn apps.cv-worker.src.main:app --reload --port 8000 --host 127.0.0.1"
```

`-NoExit` keeps each PowerShell window open after the command completes, which is useful for debugging but means these processes will never terminate cleanly when the user closes them. If the user runs the script twice, multiple `pnpm dev` and `uvicorn` processes accumulate. The parent script has no `trap` or cleanup logic for these spawned processes.

**Fix**: Remove `-NoExit` from production use, or add a `Get-Process pnpm, uvicorn | Stop-Process` cleanup step. Keep `-NoExit` only in a debug variant.

#### 5. `scripts/start-dev.ps1:44` — `Invoke-Expression` on user-controlled input

```44:scripts/start-dev.ps1
$result = Invoke-Expression $checkCmd 2>$null
```

`Wait-ForService` receives `$checkCmd` as a string parameter and evaluates it with `Invoke-Expression`. The callers pass hardcoded strings (lines 55, 58, 61), so this is safe in practice — but `Invoke-Expression` is a common injection vector. If this function is ever called with user-supplied `$checkCmd`, it becomes dangerous.

**Fix**: Use `&` (call operator) instead of `Invoke-Expression` for simple command invocation, or use `Start-Process` + `Wait-Process` pattern. For the current callers this is purely cosmetic, but it sets a bad precedent.

#### 6. `infra/docker-compose.yml:64` — `minio-init` entrypoint quotes prevent command chaining

```63:65:infra/docker-compose.yml
    entrypoint: ['/bin/sh', '-c']
    command: |
      "sleep 5 && mc alias set local http://minio:9000 visionflow visionflow-secret && mc mb local/visionflow-artifacts --ignore-existing && mc anonymous set download local/visionflow-artifacts"
```

The command string is double-quoted inside the heredoc, which is redundant and unusual. While `sh -c` handles it correctly, the double quotes serve no purpose and add visual noise. More importantly, `sleep 5` is a fixed 5-second wait that may be insufficient on slow systems, while being excessive on fast ones.

**Fix**: Remove the double quotes and consider replacing `sleep 5` with a `mc ready` loop (the `mc` client has its own readiness check):

```bash
until mc alias set local http://minio:9000 visionflow visionflow-secret; do sleep 1; done && mc mb local/visionflow-artifacts --ignore-existing && mc anonymous set download local/visionflow-artifacts
```

---

### LOW (nice to have)

#### 7. `ci.yml:127–130` — `build` job lacks `if: always()` while using `needs`

```127:130:scripts/start-dev.ps1
  build:
    needs: [typecheck, format, pytest, test]
```

If `typecheck`, `format`, `pytest`, or `test` fails, `build` is skipped entirely. This means no `dist/` artifact is uploaded for failed runs, which makes debugging harder (no artifact to inspect). Compare with the `test` job (lines 120–125) which uses `if: always()` to ensure artifact upload even on failure.

**Fix**: Add `if: always()` to the `build` job's artifact upload step. Or add `if: failure()` to make it intentionally not upload on failure — either choice is fine, but the current implicit behavior (no artifact on failure) is the worst of both worlds.

#### 8. `ci.yml:85` — pytest run from wrong directory

```85:scripts/start-dev.ps1
      - run: cd apps/cv-worker && python -m pytest tests/ -v
```

Running `cd apps/cv-worker &&` changes directory for that step, which is fine — but this means the working directory for subsequent steps (if any) is `apps/cv-worker`. If a future step is added to the `pytest` job, it would accidentally run from the wrong directory. More importantly, this is inconsistent with how `pnpm` commands are run at the repo root throughout the rest of the file.

**Fix**: Either use `working-directory` on the step (cleaner) or add a comment explaining the directory context. The `cd` approach works but lacks explicitness.

#### 9. `scripts/start-dev.sh:71–73` — MinIO healthcheck uses public localhost endpoint

```71:73:scripts/start-dev.sh
wait_for_service "PostgreSQL" "docker exec visionflow-postgres pg_isready -U visionflow"
wait_for_service "Redis" "docker exec visionflow-redis redis-cli ping"
wait_for_service "MinIO" "curl -sf http://localhost:9000/minio/health/live"
```

`pg_isready` and `redis-cli ping` run inside their respective containers via `docker exec`, so they work regardless of host networking. The MinIO check uses `curl` from the host machine against `localhost:9000`, which depends on the host having access to that port. On Linux/macOS this works fine. On Windows (where `start-dev.sh` wouldn't run anyway), this could behave differently depending on Docker networking mode.

Since `start-dev.sh` is Unix-only and `start-dev.ps1` handles Windows, this is not a practical issue — but for symmetry and clarity, the MinIO check could also use `docker exec`:

```bash
wait_for_service "MinIO" "docker exec visionflow-minio mc ready local"
```

This uses the `mc` client installed in the MinIO container to check readiness, which is more reliable than a host-level HTTP check.

#### 10. `scripts/start-dev.sh:87–89` — Seed validation exit code is swallowed

```87:89:scripts/start-dev.sh
if ! pnpm seed 2>/dev/null; then
    log_warn "Demo data validation skipped (Docker required for full validation)"
fi
```

`2>/dev/null` discards both stdout and stderr from `pnpm seed`, so if the seed command fails for a _reason other than Docker not running_ (e.g., a TypeScript error in the seed script, or a syntax error in the demo data), the user sees no output and only a generic warning. This makes debugging the seed step difficult.

**Fix**: Only redirect stderr (`2>/dev/null`) to suppress the Docker-required message, but keep stdout so errors are visible:

```bash
if ! pnpm seed 2>/dev/null; then
    log_warn "Demo data validation skipped (Docker required for full validation)"
fi
```

Actually, `2>/dev/null` alone already does this — it suppresses stderr only. If `pnpm seed` writes errors to stderr, they will be hidden. Capture and display just the specific "API is not reachable" message instead.

---

## Security

#### 11. `infra/docker-compose.yml:42–43` — MinIO credentials hardcoded in compose file

```42:43:infra/docker-compose.yml
      MINIO_ROOT_USER: visionflow
      MINIO_ROOT_PASSWORD: visionflow-secret
```

The MinIO root credentials are hardcoded in the docker-compose file. This is acceptable for local development, but the `.env.example` does not include `MINIO_ROOT_USER` or `MINIO_ROOT_PASSWORD`, meaning the values in the compose file are the canonical source of truth. If a user follows the README and copies `.env.example` to `.env`, their env file will have `MINIO_ACCESS_KEY=visionflow` and `MINIO_SECRET_KEY=visionflow-secret` but the Docker container uses different variable names (`MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`). This mismatch would only matter if the user tried to access MinIO from outside Docker (using credentials from `.env`), but it's an inconsistency.

**Fix**: Either add `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` to `.env.example`, or document explicitly that docker-compose credentials are separate from app credentials.

#### 12. `ci.yml:46–47` and `ci.yml:144–145` — Test credentials in CI env vars

```46:47:scripts/start-dev.ps1
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          CV_WORKER_URL: http://localhost:8000
```

Hardcoded `test:test` credentials for the CI PostgreSQL service are acceptable — this is a throwaway test database that only exists during the CI run. No credential rotation or secret scanning concerns here. This is standard practice.

**Verdict**: Acceptable. No change needed.

---

## Design Decisions

### 1. Pytest isolated from Node.js pipeline

The `pytest` job runs independently of the Node.js pipeline (no `needs` on any TypeScript job), only gating on `lint`. This is the right call — Python tests are unrelated to TypeScript linting success, and coupling them would mean TypeScript failures block Python tests. The `build` job correctly waits for all four ([typecheck, format, pytest, test]) before running, ensuring the full pipeline is green before deploying artifacts.

### 2. MinIO healthcheck uses HTTP probe

Using `curl -f http://localhost:9000/minio/health/live` for the MinIO healthcheck is correct — this is the documented health endpoint for MinIO server. The `mc` alias approach would require the `mc` client inside the container, which is only in the `minio/mc` image, not the `minio/minio` image. The current approach is correct.

### 3. `seed-demo.ts` API mode graceful degradation

The `--api` mode falls back silently when the API is unreachable (lines 62–76), which is correct behavior for a seed/validation script that should work even without Docker. The `Demo data validation skipped` message on the PowerShell side (line 85) conflates "API unreachable" with "seed failed" — but this is a minor UX issue, not a functional bug.

### 4. Named Docker network vs. default

Using a named network `visionflow-network` in docker-compose is the right choice for local development — it gives predictable hostnames (`postgres`, `redis`, `minio`) and avoids Docker's default network naming ambiguity. The `visionflow-net` vs `visionflow-network` naming inconsistency between the service-level reference (`visionflow-net`) and the top-level definition (`visionflow-network`) is worth noting — the compose file actually defines `visionflow-net` as the name at line 70–71, so this is consistent.

### 5. Concurrency group with `cancel-in-progress`

Using `cancel-in-progress: true` on the concurrency group means pushing multiple commits in quick succession cancels earlier runs. For a project at this stage, this is correct — saving CI minutes and avoiding stale results. When the project has more contributors and longer-running CI, the team may want to change this to `concurrency: { group: ..., cancel-in-progress: false }` to let queued runs complete.

---

## Recommendations

1. **Seed script**: Add per-asset try/catch and a summary of skipped annotations (Items 1, 2).
2. **PowerShell script**: Remove `-NoExit` from background process spawning, or add explicit cleanup (Item 4).
3. **MinIO init**: Replace `sleep 5` with `mc ready` loop for more reliable initialization (Item 6).
4. **CI build job**: Add `if: always()` to artifact upload step for better failure debugging (Item 7).
5. **MinIO credentials**: Add `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` to `.env.example` to match compose file (Item 11).
6. **PowerShell `Invoke-Expression`**: Replace with `&` call operator as a matter of hygiene (Item 5).

All of these are non-blocking. The pipeline structure, Docker configuration, and seed script logic are fundamentally sound.

---

## Sign-off

**APPROVED with recommendations**

The CI pipeline, Docker stack, boot scripts, and seed tool are well-implemented. The issues found are polish-level (error handling granularity, credential documentation, process management hygiene) rather than correctness problems. No HIGH-severity bugs were found. The MEDIUM items above should be addressed before the phase is considered production-ready, with Items 1 and 6 being the highest priority.
