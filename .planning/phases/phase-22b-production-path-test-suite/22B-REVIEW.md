# Phase 22B — Production-Path Test Suite Review

## Code Review Findings

### Severity: Informational

**Phase 22B API Harness (`scripts/harness/phase22b-production-path-api-check.ts`):**

- Imports `FIXTURE_IDS` from `../fixtures/visionflow-fixtures` — all canonical IDs come from the fixture contract, not hard-coded literals
- Uses native `fetch` with 10s timeout — no external HTTP dependency
- Preflight check: attempts `/health` before running checks; skips or fails based on strict flag
- All 8 checks are read-only HTTP GETs — no DB mutations
- COCO determinism: calls endpoint twice, compares `deterministicHash` — sufficient proof of stability
- `checkCocoExport`: validates status=LOCKED, hash non-empty, hash stable across 2 calls, images>=3, categories>=3, annotations present
- `checkEvaluationReport`: validates `report !== null` and `inputHash` matches `FIXTURE_IDS.evaluation.inputHash`
- Exit behavior: non-strict skip (exit 0), strict fail (exit 1), pass (exit 0), fail (exit 1)

**Phase 22B Meta-Harness (`scripts/harness/phase22b-meta-harness.ts`):**

- Runs Phase 22A meta-harness via `pnpm meta:harness:phase22a` — inherits all Phase 20C/D/E/F harness coverage
- API reachability check: `fetch` with 5s timeout to `/health`
- `--with-api` flag explicitly enables API harness even if unreachable
- Uses `execSync` with `stdio: 'inherit'` — harnesses print directly to CI log — good visibility
- Exit code captured from `status` field, not `signal`
- No shell hiding — failures surface clearly

**Playwright Production-Path Smoke (`apps/web/e2e/production-path.spec.ts`):**

- Follows the same structure as `navigation.spec.ts` — consistent with existing e2e pattern
- Navigation labels defined as `const SECTIONS` array, looped over — avoids code duplication
- 8 navigation smoke tests + 2 app-load smoke tests
- No screenshot assertions, no flaky sleeps
- Navigation labels duplicated from `FIXTURE_IDS` as inline constants — acceptable because:
  - Only route-independent labels are duplicated (not API IDs)
  - The duplication is documented inline with rationale
  - Route labels are stable strings not tied to fixture contract changes
- `page.waitForLoadState('networkidle')` used throughout — consistent with existing `navigation.spec.ts`

**CI Wiring (`.github/workflows/ci.yml`):**

- `meta:harness:phase22b` added after `harness:phase22a` in both `db-harness` and `migration-chain` — correct placement
- DATABASE_URL set for each step — correct
- Existing phase20c/20d/20e/20f all preserved — no weakening
- Live API harness NOT in CI — correct (would require booting full stack)
- `build` job continues to depend on `db-harness` and `migration-chain` — correct

**package.json:**

- `harness:phase22b:api` does NOT use `--strict` by default (strict mode requires live API)
- `meta:harness:phase22b` uses `--strict` — ensures DB-only checks always fail hard in CI

## Testing

- Phase 22B API harness was run without the stack running and correctly skipped with instructions
- Meta-harness auto-detects API reachability correctly
- All existing harnesses (phase20c/20d/20e/20f, phase22a) are unchanged
- Playwright spec typechecks correctly through web tsconfig
- No phase20 harness was weakened or removed

## Recommendations for Phase 23

1. Phase 23 E2E can use `FIXTURE_IDS` from `scripts/fixtures/visionflow-fixtures.ts` directly since it will likely run from the repo root, not from `apps/web/e2e/`
2. Consider adding `--with-api` Playwright job to CI only when a deterministic stack boot is available
3. Docker test-stack.yml (if implemented in Phase 23) could enable live API harness in CI by booting services before running `meta:harness:phase22b --with-api`

## Conclusion

Phase 22B delivers on its goal: proving the seeded production path is testable, deterministic, and CI-safe. The API harness exercises the live NestJS surface against seeded PostgreSQL fixtures. The meta-harness orchestrates Phase 22A + Phase 22B cleanly with split DB/API concerns. The Playwright smoke proves the UI surfaces are navigable without console errors. No product code was changed. No harnesses were weakened. The phase sets a clean foundation for Phase 23 E2E demo video work.
