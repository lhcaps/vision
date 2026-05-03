# Vision Project - Cursor Agent Instructions
# This file guides the Cursor Agent when working on the Vision monorepo

## Project Overview

Vision is a video annotation and ML inference platform monorepo containing:
- `apps/api` — NestJS backend (TypeScript)
- `apps/web` — React frontend (TypeScript)
- `scripts` — Dev helper scripts (PowerShell/Bash)
- `infra` — Infrastructure (Prisma schema, Docker)

## Before You Start

1. Read the repository structure. Understand the monorepo layout.
2. Run `pnpm typecheck` to verify type correctness.
3. Always run `pnpm build` after making API changes.

## Safety Rules

- **Never use destructive git commands**: `git reset --hard`, `git checkout --`, `git push --force`
- **Scope edits carefully**: Only modify files directly related to the task.
- **Validate before committing**: Run typecheck and tests after every change.
- **Test the API**: After modifying API routes, verify with `curl http://localhost:3000/api/health`

## Development Workflow

```powershell
# Start dev environment
pnpm dev

# Type check
pnpm typecheck

# Run tests
pnpm test

# Seed database
pnpm seed:db -- --reset

# API health check
curl http://localhost:3000/api/health
```

## Allowed Write Paths

Only modify these files/directories when working within metaharness:
- `AGENTS.md`, `.cursor/rules`, `scripts/start-dev.ps1`, `scripts/start-dev.sh`
- `scripts/smoke`, `baseline/scripts`, `baseline/smoke`
- `apps/web/src/features/annotations`, `apps/web/src/shared/state`
- `apps/api/src/annotations`, `apps/api/src/inference`
- `infra/prisma/schema.prisma`

## Validation Checklist

Before marking a task as complete, verify:
1. `pnpm typecheck` passes
2. `pnpm test` passes
3. `pnpm build` passes (if API changed)
4. API health endpoint responds correctly
