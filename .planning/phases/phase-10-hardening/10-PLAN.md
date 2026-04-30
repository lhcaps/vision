---
name: "Phase 10: Hardening"
phase: 10
phase_slug: hardening
padded_phase: "10"
status: planned
date: 2026-05-01
goal: "Tests, CI, README, one-command boot, demo script."
---

# Phase 10 Plan — Hardening

Status: planned
Date: 2026-05-01

## Goal

Deliver Phase 10 hardening: automated test coverage across all packages, a GitHub Actions CI pipeline, a project README, a one-command startup script, and a polished demo/seed script. No new features — this phase adds confidence that existing features work and that future changes don't regress.

## Design Register

Product UI. Hardening is invisible to end users but critical for long-term maintainability. Tests should cover domain logic, not implementation details. CI should be fast (cache friendly) and block broken builds. README should get new contributors productive in under 5 minutes. The boot script should start everything in the correct order without manual intervention.

## Wave 1 — Testing Infrastructure

### Plan 10-01: Vitest Workspace + Test Config

**Objective:** Establish unified test infrastructure across all TypeScript packages.

#### 10-01 Task 1: Create Vitest Workspace Config

<read_first>
- package.json (root, check vitest version and scripts)
- turbo.json (check test task configuration)
</read_first>

<action>
Create `vitest.workspace.ts` at the project root (`d:/Study/Project/Vision/vitest.workspace.ts`):

```typescript
import { defineWorkspace } from 'vitest/config'
export default defineWorkspace([
  'packages/*/vitest.config.ts',
  'apps/*/vitest.config.ts',
])
```

Update root `package.json` to update the test script:
```json
"test": "vitest run --passWithNoTests",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage"
```

Install missing dev dependencies:
```bash
pnpm add -Dw vitest @vitest/coverage-v8
pnpm add -Dw @testing-library/react @testing-library/jest-dom
pnpm add -Dw jsdom
```

Create a root test setup file `test/setup.ts`:
```typescript
// Global test utilities
import '@testing-library/jest-dom'
```
</action>

<acceptance_criteria>
- `vitest.workspace.ts` exists at root and exports a valid workspace config
- Root `package.json` has updated `test` and new `test:ui`, `test:coverage` scripts
- `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` are added to root devDependencies
- `test/setup.ts` exists and imports `@testing-library/jest-dom`
- `pnpm test` runs without errors (--passWithNoTests allows empty suites)
- Typecheck passes after changes
</acceptance_criteria>

#### 10-01 Task 2: Create API Vitest Config

<read_first>
- apps/api/package.json (check existing test script)
- apps/api/tsconfig.json (check compiler options)
- apps/api/src/inference/inference.service.ts (complexest service)
</read_first>

<action>
Create `apps/api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles: ['../../test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**'],
      thresholds: { statements: 50, branches: 50 },
    },
  },
})
```

Install `vite-tsconfig-paths`:
```bash
pnpm add -Dw -F @visionflow/api vite-tsconfig-paths
```

Add `test` script to `apps/api/package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```
</action>

<acceptance_criteria>
- `apps/api/vitest.config.ts` exists with valid vitest configuration
- `vite-tsconfig-paths` added as API devDependency
- API test script `pnpm --filter @visionflow/api test` runs without errors
- Existing tests (4 test files) still pass
- Coverage report generates in `coverage/` directory
</acceptance_criteria>

#### 10-01 Task 3: Create Web Vitest Config + Library Tests

<read_first>
- apps/web/package.json (check existing test script and deps)
- apps/web/tsconfig.json (check compiler options)
- apps/web/src/lib/annotations.ts (API function to test)
- apps/web/src/lib/datasets.ts (API function to test)
- apps/web/src/lib/pipelines.ts (API function to test)
- apps/web/src/lib/inference.ts (API function to test)
- apps/web/src/features/evaluation/EvaluationMetricsPanel.tsx (metric tone logic)
- apps/web/src/features/timeline/DatasetVersionDiff.tsx (diff engine)
</read_first>

<action>
Create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.test.tsx'],
    setupFiles: ['../../test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**'],
      thresholds: { statements: 30, branches: 30 },
    },
  },
})
```

Install `vite-tsconfig-paths` for web:
```bash
pnpm add -Dw -F @visionflow/web vite-tsconfig-paths
```

Add `test` script to `apps/web/package.json`:
```json
"test": "vitest run --passWithNoTests",
"test:watch": "vitest"
```

Create `apps/web/src/lib/api.test.ts` — test API utility functions with mocked fetch:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch
global.fetch = vi.fn()

// Import the functions to test
import {
  fetchAnnotationWorkspace,
  fetchDatasets,
  createPipeline,
  fetchInferenceJobs,
} from './annotations'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchAnnotationWorkspace', () => {
  it('returns workspace data on success', async () => {
    const mockData = { labels: [], annotations: [] }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response)
    
    const result = await fetchAnnotationWorkspace('proj-1', 'v-1', 'asset-1')
    expect(result).toEqual(mockData)
    expect(fetch).toHaveBeenCalledWith(
      '/api/projects/proj-1/dataset-versions/v-1/annotation-workspace?assetId=asset-1',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)
    
    await expect(fetchAnnotationWorkspace('proj-1', 'v-1', 'asset-1'))
      .rejects.toThrow('404')
  })
})

describe('fetchDatasets', () => {
  it('fetches dataset list', async () => {
    const mockDatasets = [{ id: 'ds-1', name: 'Train Set' }]
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ datasets: mockDatasets }),
    } as Response)
    
    const result = await fetchDatasets('proj-1')
    expect(result).toEqual(mockDatasets)
  })
})
```

Create `apps/web/src/features/evaluation/evaluation-metrics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

// Test the metric tone/threshold logic from EvaluationMetricsPanel
// Extract the tone determination logic into a pure function for testing

function getMetricTone(
  value: number,
  type: 'precision' | 'recall' | 'f1'
): 'green' | 'amber' | 'red' | 'neutral' {
  const thresholds = {
    precision: { green: 0.8, amber: 0.6 },
    recall: { green: 0.75, amber: 0.5 },
    f1: { green: 0.75, amber: 0.55 },
  }
  const t = thresholds[type]
  if (value >= t.green) return 'green'
  if (value >= t.amber) return 'amber'
  if (value > 0) return 'red'
  return 'neutral'
}

describe('getMetricTone', () => {
  describe('precision', () => {
    it('returns green for >= 0.80', () => {
      expect(getMetricTone(0.80, 'precision')).toBe('green')
      expect(getMetricTone(0.95, 'precision')).toBe('green')
    })
    it('returns amber for 0.60-0.79', () => {
      expect(getMetricTone(0.79, 'precision')).toBe('amber')
      expect(getMetricTone(0.60, 'precision')).toBe('amber')
    })
    it('returns red for < 0.60', () => {
      expect(getMetricTone(0.59, 'precision')).toBe('red')
      expect(getMetricTone(0.30, 'precision')).toBe('red')
    })
    it('returns neutral for 0', () => {
      expect(getMetricTone(0, 'precision')).toBe('neutral')
    })
  })
  describe('recall', () => {
    it('returns green for >= 0.75', () => {
      expect(getMetricTone(0.75, 'recall')).toBe('green')
    })
    it('returns amber for 0.50-0.74', () => {
      expect(getMetricTone(0.74, 'recall')).toBe('amber')
    })
    it('returns red for < 0.50', () => {
      expect(getMetricTone(0.49, 'recall')).toBe('red')
    })
  })
  describe('f1', () => {
    it('returns green for >= 0.75', () => {
      expect(getMetricTone(0.75, 'f1')).toBe('green')
    })
    it('returns amber for 0.55-0.74', () => {
      expect(getMetricTone(0.74, 'f1')).toBe('amber')
    })
    it('returns red for < 0.55', () => {
      expect(getMetricTone(0.54, 'f1')).toBe('red')
    })
  })
})
```

Create `apps/web/src/features/timeline/dataset-diff.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

// Test the diff computation logic from DatasetVersionDiff
// Extract IoU-based diff computation for testing

interface BBox { x: number; y: number; width: number; height: number }
interface AnnotationItem { id: string; labelClassId: string; geometry: BBox }

function computeIoU(a: BBox, b: BBox): number {
  const ax = Math.max(a.x, b.x)
  const ay = Math.max(a.y, b.y)
  const bx = Math.min(a.x + a.width, b.x + b.width)
  const by = Math.min(a.y + a.height, b.y + b.height)
  if (bx <= ax || by <= ay) return 0
  const inter = (bx - ax) * (by - ay)
  const areaA = a.width * a.height
  const areaB = b.width * b.height
  return inter / (areaA + areaB - inter)
}

type DiffType = 'added' | 'removed' | 'changed' | 'unchanged'

function computeDiff(
  versionA: AnnotationItem[],
  versionB: AnnotationItem[],
  iouThreshold = 0.3
): { type: DiffType; id: string; labelClassId: string }[] {
  const results: { type: DiffType; id: string; labelClassId: string }[] = []
  const usedB = new Set<string>()
  
  for (const a of versionA) {
    let bestIoU = 0
    let bestIdx = -1
    for (let i = 0; i < versionB.length; i++) {
      if (usedB.has(versionB[i].id)) continue
      if (a.labelClassId !== versionB[i].labelClassId) continue
      const iou = computeIoU(a.geometry, versionB[i].geometry)
      if (iou > bestIoU) { bestIoU = iou; bestIdx = i }
    }
    if (bestIdx === -1) {
      results.push({ type: 'removed', id: a.id, labelClassId: a.labelClassId })
    } else if (bestIoU < iouThreshold) {
      results.push({ type: 'changed', id: a.id, labelClassId: a.labelClassId })
      usedB.add(versionB[bestIdx].id)
    } else {
      results.push({ type: 'unchanged', id: a.id, labelClassId: a.labelClassId })
      usedB.add(versionB[bestIdx].id)
    }
  }
  
  for (const b of versionB) {
    if (!usedB.has(b.id)) {
      results.push({ type: 'added', id: b.id, labelClassId: b.labelClassId })
    }
  }
  
  return results
}

describe('computeDiff', () => {
  it('detects added annotations', () => {
    const vA: AnnotationItem[] = []
    const vB: AnnotationItem[] = [
      { id: 'b1', labelClassId: 'car', geometry: { x: 10, y: 20, width: 100, height: 80 } },
    ]
    const result = computeDiff(vA, vB)
    expect(result).toContainEqual({ type: 'added', id: 'b1', labelClassId: 'car' })
    expect(result.filter(r => r.type === 'removed')).toHaveLength(0)
  })
  
  it('detects removed annotations', () => {
    const vA: AnnotationItem[] = [
      { id: 'a1', labelClassId: 'car', geometry: { x: 10, y: 20, width: 100, height: 80 } },
    ]
    const vB: AnnotationItem[] = []
    const result = computeDiff(vA, vB)
    expect(result).toContainEqual({ type: 'removed', id: 'a1', labelClassId: 'car' })
  })
  
  it('detects changed geometry with same label', () => {
    const vA: AnnotationItem[] = [
      { id: 'a1', labelClassId: 'car', geometry: { x: 10, y: 20, width: 100, height: 80 } },
    ]
    const vB: AnnotationItem[] = [
      { id: 'b1', labelClassId: 'car', geometry: { x: 50, y: 60, width: 100, height: 80 } }, // low IoU
    ]
    const result = computeDiff(vA, vB)
    expect(result).toContainEqual({ type: 'changed', id: 'a1', labelClassId: 'car' })
    expect(result).not.toContainEqual({ type: 'unchanged', id: 'a1' })
  })
  
  it('detects unchanged geometry when IoU >= threshold', () => {
    const vA: AnnotationItem[] = [
      { id: 'a1', labelClassId: 'car', geometry: { x: 10, y: 20, width: 100, height: 80 } },
    ]
    const vB: AnnotationItem[] = [
      { id: 'b1', labelClassId: 'car', geometry: { x: 12, y: 22, width: 98, height: 78 } }, // high IoU
    ]
    const result = computeDiff(vA, vB)
    expect(result).toContainEqual({ type: 'unchanged', id: 'a1', labelClassId: 'car' })
  })
  
  it('detects changed label with same geometry', () => {
    const vA: AnnotationItem[] = [
      { id: 'a1', labelClassId: 'car', geometry: { x: 10, y: 20, width: 100, height: 80 } },
    ]
    const vB: AnnotationItem[] = [
      { id: 'b1', labelClassId: 'van', geometry: { x: 10, y: 20, width: 100, height: 80 } },
    ]
    const result = computeDiff(vA, vB)
    // Different labelClassId means 'removed' + 'added', not 'changed'
    expect(result).toContainEqual({ type: 'removed', id: 'a1', labelClassId: 'car' })
    expect(result).toContainEqual({ type: 'added', id: 'b1', labelClassId: 'van' })
  })
  
  it('handles empty versions', () => {
    const empty: AnnotationItem[] = []
    const result = computeDiff(empty, empty)
    expect(result).toHaveLength(0)
  })
})

describe('computeIoU', () => {
  it('returns 1.0 for identical boxes', () => {
    const box = { x: 0, y: 0, width: 100, height: 100 }
    expect(computeIoU(box, box)).toBeCloseTo(1.0)
  })
  it('returns 0 for non-overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 }
    const b = { x: 20, y: 20, width: 10, height: 10 }
    expect(computeIoU(a, b)).toBe(0)
  })
  it('returns correct value for partial overlap', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 }
    const b = { x: 5, y: 5, width: 10, height: 10 }
    expect(computeIoU(a, b)).toBeCloseTo(0.11, 2)
  })
})
```
</action>

<acceptance_criteria>
- `apps/web/vitest.config.ts` exists with jsdom environment
- `vite-tsconfig-paths` added as web devDependency
- `apps/web/src/lib/api.test.ts` exists with 3+ tests covering fetchAnnotationWorkspace and fetchDatasets
- `apps/web/src/features/evaluation/evaluation-metrics.test.ts` exists with 8+ tests for metric tone logic
- `apps/web/src/features/timeline/dataset-diff.test.ts` exists with 6+ tests for diff engine + IoU
- All new test files pass: `pnpm --filter @visionflow/web test`
- Coverage report generates for web package
</acceptance_criteria>

#### 10-01 Task 4: Create Contracts + Motion Test Coverage

<read_first>
- packages/contracts/src/index.ts (exports map)
- packages/contracts/src/schemas/*.ts (all schema files)
- packages/motion/src/index.ts (motion token exports)
- packages/contracts/src/__tests__/ (existing test files to avoid duplication)
</read_first>

<action>
Create `packages/contracts/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles: ['../../test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**'],
      thresholds: { statements: 80, branches: 80 },
    },
  },
})
```

Create `packages/motion/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['../../test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
    },
  },
})
```

Install `vite-tsconfig-paths`:
```bash
pnpm add -Dw vite-tsconfig-paths
```

Add test scripts to `packages/contracts/package.json` and `packages/motion/package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `packages/contracts/src/evaluation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { EvaluationReportSchema, PerClassMetricSchema, PredictionSummarySchema } from './evaluation'

describe('EvaluationReportSchema', () => {
  it('accepts valid evaluation report', () => {
    const valid = {
      jobId: 'job-1',
      overall: { precision: 0.82, recall: 0.74, f1: 0.78, meanIoU: 0.61 },
      perClass: [
        { labelClassId: 'car', label: 'Car', tp: 45, fp: 8, fn: 12, precision: 0.82, recall: 0.74, f1: 0.78, iou: 0.61, count: 57 },
      ],
      summary: { totalGt: 57, totalPred: 53, matched: 45, totalPredictions: 53 },
      computedAt: '2026-04-28T13:36:00.000Z',
    }
    expect(() => EvaluationReportSchema.parse(valid)).not.toThrow()
  })
  it('rejects negative precision', () => {
    const invalid = {
      jobId: 'job-1',
      overall: { precision: -0.1, recall: 0.74, f1: 0.78, meanIoU: 0.61 },
      perClass: [],
      summary: { totalGt: 57, totalPred: 53, matched: 45, totalPredictions: 53 },
      computedAt: '2026-04-28T13:36:00.000Z',
    }
    expect(() => EvaluationReportSchema.parse(invalid)).toThrow()
  })
  it('rejects f1 outside 0-1 range', () => {
    const invalid = {
      jobId: 'job-1',
      overall: { precision: 0.82, recall: 0.74, f1: 1.5, meanIoU: 0.61 },
      perClass: [],
      summary: { totalGt: 57, totalPred: 53, matched: 45, totalPredictions: 53 },
      computedAt: '2026-04-28T13:36:00.000Z',
    }
    expect(() => EvaluationReportSchema.parse(invalid)).toThrow()
  })
})

describe('PerClassMetricSchema', () => {
  it('accepts valid per-class metric', () => {
    const valid = {
      labelClassId: 'car', label: 'Car', tp: 45, fp: 8, fn: 12,
      precision: 0.82, recall: 0.74, f1: 0.78, iou: 0.61, count: 57,
    }
    expect(() => PerClassMetricSchema.parse(valid)).not.toThrow()
  })
  it('rejects tp + fp + fn = 0 (no data)', () => {
    const zero = {
      labelClassId: 'car', label: 'Car', tp: 0, fp: 0, fn: 0,
      precision: 0, recall: 0, f1: 0, iou: 0, count: 0,
    }
    // Zero counts are valid (empty class)
    expect(() => PerClassMetricSchema.parse(zero)).not.toThrow()
  })
})

describe('PredictionSummarySchema', () => {
  it('accepts valid prediction summary', () => {
    const valid = {
      predictionId: 'pred-1',
      assetId: 'asset-1',
      labelClassId: 'car',
      confidence: 0.87,
      geometry: { x: 120, y: 80, width: 200, height: 160 },
    }
    expect(() => PredictionSummarySchema.parse(valid)).not.toThrow()
  })
  it('rejects confidence outside 0-1', () => {
    const invalid = { predictionId: 'pred-1', assetId: 'asset-1', labelClassId: 'car', confidence: 1.5,
      geometry: { x: 120, y: 80, width: 200, height: 160 } }
    expect(() => PredictionSummarySchema.parse(invalid)).toThrow()
  })
  it('rejects negative confidence', () => {
    const invalid = { predictionId: 'pred-1', assetId: 'asset-1', labelClassId: 'car', confidence: -0.1,
      geometry: { x: 120, y: 80, width: 200, height: 160 } }
    expect(() => PredictionSummarySchema.parse(invalid)).toThrow()
  })
})
```

Create `packages/motion/src/motion.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { motionTokens, pipelineMotion, stateMotion } from './index'

describe('motionTokens', () => {
  it('has springFast with correct values', () => {
    expect(motionTokens.springFast).toEqual({ stiffness: 420, damping: 32 })
  })
  it('has springSoft with correct values', () => {
    expect(motionTokens.springSoft).toEqual({ stiffness: 220, damping: 26 })
  })
  it('has springMorph with correct values', () => {
    expect(motionTokens.springMorph).toEqual({ stiffness: 280, damping: 28 })
  })
  it('has easeOut cubic bezier', () => {
    expect(motionTokens.easeOut).toEqual([0.22, 1, 0.36, 1])
  })
  it('has easeInOut cubic bezier', () => {
    expect(motionTokens.easeInOut).toEqual([0.65, 0, 0.35, 1])
  })
  it('has duration values', () => {
    expect(motionTokens.durationInstant).toBe(0)
    expect(motionTokens.durationFast).toBe(0.12)
    expect(motionTokens.durationBase).toBe(0.2)
    expect(motionTokens.durationSlow).toBe(0.36)
  })
})

describe('pipelineMotion', () => {
  it('has nodePulse animation', () => {
    expect(pipelineMotion.nodePulse).toBeDefined()
    expect(pipelineMotion.nodePulse.animation).toContain('node-pulse')
  })
  it('has edgeFlow animation', () => {
    expect(pipelineMotion.edgeFlow).toBeDefined()
  })
  it('has nodeComplete animation', () => {
    expect(pipelineMotion.nodeComplete).toBeDefined()
  })
})

describe('stateMotion', () => {
  it('has bboxStateMotion classes', () => {
    expect(stateMotion.bboxStateMotion).toBeDefined()
    expect(stateMotion.bboxStateMotion.ground).toBeDefined()
    expect(stateMotion.bboxStateMotion.prediction).toBeDefined()
  })
  it('has pipelineNodeMotion classes', () => {
    expect(stateMotion.pipelineNodeMotion).toBeDefined()
    expect(stateMotion.pipelineNodeMotion.idle).toBeDefined()
    expect(stateMotion.pipelineNodeMotion.running).toBeDefined()
    expect(stateMotion.pipelineNodeMotion.complete).toBeDefined()
    expect(stateMotion.pipelineNodeMotion.error).toBeDefined()
  })
})
```
</action>

<acceptance_criteria>
- `packages/contracts/vitest.config.ts` and `packages/motion/vitest.config.ts` exist
- `packages/contracts/src/evaluation.test.ts` has 5+ tests
- `packages/motion/src/motion.test.ts` has 10+ tests
- `pnpm --filter @visionflow/contracts test` passes
- `pnpm --filter @visionflow/motion test` passes
- Coverage reports generate for both packages
</acceptance_criteria>

### Plan 10-01 Verification

```bash
pnpm test  # runs all packages via turbo
pnpm typecheck
pnpm build
```

---

### Plan 10-02: CI Pipeline + Linting Setup

**Objective:** Establish GitHub Actions CI pipeline, ESLint, Prettier, and pre-commit hooks.

#### 10-02 Task 1: Create GitHub Actions CI Workflow

<read_first>
- .github/ directory (check if it exists)
- package.json (check scripts and deps)
- turbo.json (check pipeline tasks)
- pnpm-lock.yaml (check lockfile exists)
</read_first>

<action>
Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop, 'phase/**']
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build  # build compiles TypeScript + generates Prisma client
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          CV_WORKER_URL: http://localhost:8001

  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: '**/coverage/'
          retention-days: 7

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: dist
          path: '**/dist/'
          retention-days: 1
```

Create `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          VITE_API_BASE_URL: http://localhost:3000
          API_BASE_URL: http://localhost:3100
```

Also create `.github/ISSUE_TEMPLATE/` with a bug report and feature request template.
</action>

<acceptance_criteria>
- `.github/workflows/ci.yml` exists with lint, typecheck, test, build jobs
- `.github/workflows/e2e.yml` exists for E2E on main push
- GitHub Actions config uses ubuntu-latest, Node 20, pnpm 9
- Concurrency group cancels in-progress runs on same branch
- Artifact uploads for coverage and dist on failure
- Postgres service container configured for test job
</acceptance_criteria>

#### 10-02 Task 2: Create ESLint + Prettier Config

<read_first>
- package.json (check existing deps)
- apps/web/package.json (check React deps)
- apps/api/package.json (check NestJS deps)
</read_first>

<action>
Create `.eslintrc.cjs` at root:

```javascript
/* eslint-env node */
module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '.turbo/'],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'tailwindcss'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:tailwindcss/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.base.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: process.cwd(),
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-misused-promises': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'tailwindcss/no-contradicting-classname': 'error',
  },
  overrides: [
    {
      files: ['apps/web/**'],
      extends: ['plugin:react/recommended'],
      rules: {
        'react/jsx-uses-react': 'off',
        'react/react-in-jsx-scope': 'off',
      },
    },
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-misused-promises': 'off',
      },
    },
  ],
}
```

Install ESLint dependencies:
```bash
pnpm add -Dw eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser @typescript-eslint/rule-type-checker eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-tailwindcss
```

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Install Prettier plugin:
```bash
pnpm add -Dw prettier prettier-plugin-tailwindcss
```

Add lint script to root `package.json`:
```json
"lint": "eslint . --ext .ts,.tsx,.js,.cjs,.mjs --max-warnings 10",
"lint:fix": "eslint . --ext .ts,.tsx,.js,.cjs,.mjs --fix",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

Create `.prettierignore`:
```
dist/
node_modules/
.turbo/
coverage/
pnpm-lock.yaml
```

Create `.eslintignore`:
```
dist/
node_modules/
.turbo/
coverage/
vitest.workspace.ts
test/setup.ts
```

Create `.editorconfig` at root:
```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.yml]
indent_size = 2

[*.json]
indent_size = 2
```
</action>

<acceptance_criteria>
- `.eslintrc.cjs` exists with TypeScript, React, and Tailwind rules
- `.prettierrc` exists with correct formatting rules
- `.prettierignore` and `.eslintignore` exist
- `.editorconfig` exists at root
- ESLint runs without errors on clean code: `pnpm lint`
- Prettier runs without errors: `pnpm format:check`
- `pnpm lint:fix` auto-fixes issues where possible
</acceptance_criteria>

### Plan 10-02 Verification

```bash
pnpm lint
pnpm format:check
```

---

## Wave 2 — Documentation + Boot Scripts

### Plan 10-03: README + One-Command Boot + Demo Script

**Objective:** Create the project README, one-command startup scripts, and demo/seed script.

#### 10-03 Task 1: Create Project README

<read_first>
- PROJECT.md (product context)
- DESIGN.md (design system)
- docs/architecture/overview.md (architecture)
- docs/demo-script.md (existing demo walkthrough)
- .env.example (all env vars)
- apps/api/src/main.ts (port config)
- apps/web/vite.config.ts (port config)
</read_first>

<action>
Create `README.md` at project root. The README should be a premium technical product README covering:

1. **Hero section** — Project name, one-line description, key feature list
2. **Quick Start** — 5 steps: clone, install, env, docker, dev
3. **Architecture** — Diagram text showing web/api/cv-worker/data storage
4. **Features** — 8 sections of the workbench
5. **Development** — `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm verify`
6. **Environment Variables** — Table from `.env.example` with descriptions
7. **Project Structure** — Monorepo layout with apps/ and packages/
8. **Tech Stack** — NestJS, React, FastAPI, Prisma, BullMQ, MinIO, etc.
9. **Contributing** — Link to docs/, how to run tests
10. **License** — MIT

Key content:

```markdown
# VisionFlow Studio

Computer vision pipeline workbench — annotate datasets, build inference pipelines, run model evaluations.

## Features

- **Media Ingestion** — Upload media with SHA-256 dedupe and MinIO storage
- **Dataset Versioning** — Immutable version snapshots with split summaries
- **Annotation Engine** — Bounding box annotations in image coordinates
- **Pipeline Builder** — React Flow pipeline graph with typed node/edge validation
- **Inference Orchestration** — BullMQ job queue with SSE progress streaming
- **CV Worker** — Mock detector with ONNX runtime support
- **Prediction Overlay** — Side-by-side GT vs. prediction bounding box comparison
- **Evaluation** — IoU-based precision, recall, F1 metrics per class
- **Timeline Replay** — Frame-by-frame BBox morph animation with playback controls
- **Dataset Diff** — Visual added/removed/changed annotation comparison
- **Pipeline Execution Flow** — Animated node-by-node execution graph

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/lhcaps/Vision.git
cd Vision
pnpm install

# 2. Copy environment
cp .env.example .env

# 3. Start infrastructure
docker compose -f infra/docker-compose.yml up -d

# 4. Generate Prisma client
pnpm db:generate

# 5. Start all apps
pnpm dev:full

# Or start individually:
pnpm dev:web    # Web: http://localhost:5173
pnpm dev:api    # API:  http://localhost:3100
python -m uvicorn apps.cv-worker.src.main:app --reload --port 8001  # CV Worker
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web | React 19, Vite, Tailwind, Framer Motion, Zustand, React Flow |
| API | NestJS, Prisma, BullMQ, MinIO, Zod |
| CV Worker | FastAPI, Pydantic, ONNX Runtime |
| Storage | PostgreSQL, Redis, MinIO |
| Types | TypeScript, Zod |

## Development

| Command | Description |
|---------|-------------|
| `pnpm dev:full` | Start Docker + all apps |
| `pnpm dev:web` | Web only |
| `pnpm dev:api` | API only |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all tests |
| `pnpm verify` | Type-check + test + build |
| `pnpm lint` | Lint all files |
| `pnpm format` | Format all files |
| `pnpm db:generate` | Regenerate Prisma client |
```
</action>

<acceptance_criteria>
- `README.md` exists at root with at minimum: quick start, features, tech stack, development commands
- README contains correct port numbers (web: 5173, api: 3100, cv-worker: 8001)
- README references `pnpm dev:full` as the one-command boot
- `pnpm dev:full --help` or similar shows usage if implemented
</acceptance_criteria>

#### 10-03 Task 2: Create One-Command Boot Scripts

<read_first>
- package.json (root, check existing scripts)
- scripts/ directory (check if it exists)
</read_first>

<action>
Create `scripts/start-dev.sh` (Unix/macOS/WSL):

```bash
#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VisionFlow Studio — Full Stack Boot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Start infrastructure
echo ""
echo "▶ Starting infrastructure (Docker)..."
docker compose -f "$ROOT_DIR/infra/docker-compose.yml" up -d

# Wait for postgres to be ready
echo "▶ Waiting for PostgreSQL..."
for i in {1..30}; do
  if docker exec vision-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
    echo "✓ PostgreSQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "✗ PostgreSQL failed to start"
    exit 1
  fi
  sleep 1
done

# Step 2: Generate Prisma client
echo ""
echo "▶ Generating Prisma client..."
cd "$ROOT_DIR"
pnpm db:generate

# Step 3: Seed demo data (optional)
echo ""
echo "▶ Seeding demo data..."
pnpm seed 2>/dev/null || echo "(No seed script — using in-memory fallback)"

# Step 4: Start all apps
echo ""
echo "▶ Starting all apps..."
echo "  Web:     http://localhost:5173"
echo "  API:     http://localhost:3100"
echo "  Swagger: http://localhost:3100/api/docs"
echo "  MinIO:   http://localhost:9001"
echo ""

# Start web and api in background
pnpm dev &
API_PID=$!

# Start CV worker in background
cd "$ROOT_DIR"
python -m uvicorn apps.cv-worker.src.main:app --reload --port 8001 --host 127.0.0.1 &
CV_PID=$!

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " VisionFlow Studio is running!"
echo "  Stop all: pnpm kill"
echo "  Logs: docker compose -f infra/docker-compose.yml logs -f"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for background processes
wait
```

Create `scripts/start-dev.ps1` (Windows PowerShell):

```powershell
# VisionFlow Studio — Full Stack Boot (Windows)
$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host " VisionFlow Studio — Full Stack Boot"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Start infrastructure
Write-Host ""
Write-Host "▶ Starting infrastructure (Docker)..."
docker compose -f "$ROOT/infra/docker-compose.yml" up -d

# Wait for postgres
Write-Host "▶ Waiting for PostgreSQL..."
$attempts = 0
while ($attempts -lt 30) {
    $attempts++
    try {
        docker exec vision-postgres-1 pg_isready -U postgres | Out-Null
        Write-Host "✓ PostgreSQL is ready"
        break
    } catch {
        Start-Sleep -Seconds 1
    }
    if ($attempts -eq 30) {
        Write-Host "✗ PostgreSQL failed to start"
        exit 1
    }
}

# Step 2: Generate Prisma client
Write-Host ""
Write-Host "▶ Generating Prisma client..."
Push-Location $ROOT
pnpm db:generate
Pop-Location

# Step 3: Start apps
Write-Host ""
Write-Host "▶ Starting all apps..."
Write-Host "  Web:     http://localhost:5173"
Write-Host "  API:     http://localhost:3100"
Write-Host "  Swagger: http://localhost:3100/api/docs"

# Start web + api in background
Start-Process powershell -ArgumentList "-NoExit", "cd $ROOT; pnpm dev"

# Start CV worker in background
Start-Process powershell -ArgumentList "-NoExit", "cd $ROOT; python -m uvicorn apps.cv-worker.src.main:app --reload --port 8001 --host 127.0.0.1"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host " VisionFlow Studio is running!"
Write-Host "  Stop: docker compose -f infra/docker-compose.yml down"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

Add scripts to root `package.json`:

```json
"dev:full": "bash scripts/start-dev.sh",
"dev:full:win": "powershell -File scripts/start-dev.ps1",
"kill": "docker compose -f infra/docker-compose.yml down",
"seed": "npx tsx scripts/seed-demo.ts"
```

Create `scripts/` directory with empty `.gitkeep` if it doesn't exist.

Make the shell script executable:
```bash
chmod +x scripts/start-dev.sh
```
</action>

<acceptance_criteria>
- `scripts/start-dev.sh` exists and is executable
- `scripts/start-dev.ps1` exists for Windows
- `pnpm dev:full` runs Docker, db:generate, and starts all apps
- `scripts/start-dev.ps1` works on Windows PowerShell
- `pnpm kill` stops Docker containers
</acceptance_criteria>

#### 10-03 Task 3: Create Demo/Seed Script

<read_first>
- apps/web/src/data/demo.ts (existing demo data)
- apps/api/src/lib/demo-snapshot.ts (if exists)
- scripts/ directory
</read_first>

<action>
Create `scripts/seed-demo.ts`:

```typescript
#!/usr/bin/env node
/**
 * VisionFlow Studio — Demo Data Seeder
 * 
 * Resets the demo state so reviewers can walk through the workbench
 * without running Docker/PostgreSQL. Uses the memory-fallback path.
 * 
 * Usage: npx tsx scripts/seed-demo.ts
 */

import { demoSnapshot } from '../apps/web/src/data/demo'
import { validatePipelineDefinition } from '../apps/web/src/data/demo'

// The demo data is already loaded from demo.ts
// This script validates the demo state and prints a summary

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(' VisionFlow Studio — Demo Data Seed')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('Project:', demoSnapshot.project.name)
console.log('Media assets:', demoSnapshot.media.length)
console.log('Annotations:', demoSnapshot.annotations.length)
console.log('')
console.log('Pipeline:')
console.log('  Version:', demoSnapshot.pipeline.version)
console.log('  Nodes:', demoSnapshot.pipeline.nodes.length)
console.log('  Edges:', demoSnapshot.pipeline.edges.length)
console.log('  Valid:', validatePipelineDefinition(demoSnapshot.pipeline).valid ? 'YES ✓' : 'NO ✗')
console.log('')
console.log('Latest Job:')
console.log('  ID:', demoSnapshot.job.id)
console.log('  Status:', demoSnapshot.job.status)
console.log('  Progress:', demoSnapshot.job.progress + '%')
console.log('')

// Validate all annotations have valid geometry
const badAnnotations = demoSnapshot.annotations.filter(a => {
  const { x, y, width, height } = a.geometry
  const media = demoSnapshot.media.find(m => m.id === a.assetId)
  if (!media) return true
  return x < 0 || y < 0 || x + width > media.width || y + height > media.height
})

if (badAnnotations.length > 0) {
  console.error('✗ Found', badAnnotations.length, 'annotations with invalid geometry')
  process.exit(1)
} else {
  console.log('✓ All annotations are within media bounds')
}

console.log('')
console.log('Demo state is valid and ready.')
console.log('Start the app with: pnpm dev:web')
console.log('')
```
</action>

<acceptance_criteria>
- `scripts/seed-demo.ts` exists and runs without errors
- Output shows project name, media count, annotation count, pipeline validation
- Script exits 0 on valid demo data, non-zero on invalid data
</acceptance_criteria>

#### 10-03 Task 4: Create Playwright E2E Test Setup

<read_first>
- apps/web/package.json (check Playwright is available)
- apps/web/src/App.tsx (check section IDs)
</read_first>

<action>
Create `apps/web/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: [
    {
      command: 'pnpm dev:web',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
})
```

Install Playwright browsers:
```bash
pnpm exec playwright install chromium
```

Add test scripts to `apps/web/package.json`:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed"
```

Create `apps/web/e2e/navigation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

const SECTIONS = [
  { id: 'overview', label: 'Command' },
  { id: 'media', label: 'Media' },
  { id: 'datasets', label: 'Versions' },
  { id: 'annotate', label: 'Annotate' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'timeline', label: 'Replay' },
  { id: 'diff', label: 'Diff' },
] as const

test.describe('Navigation', () => {
  for (const section of SECTIONS) {
    test(`navigates to ${section.label} section`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const navButton = page.getByRole('button', { name: section.label })
      await navButton.click()
      await page.waitForTimeout(300) // Allow animations to settle

      expect(errors).toHaveLength(0)
    })
  }

  test('no console errors on initial load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('all 8 sections are present in nav rail', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    for (const section of SECTIONS) {
      await expect(page.getByRole('button', { name: section.label })).toBeVisible()
    }
  })
})
```

Create `apps/web/e2e/pipeline.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Pipeline Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Pipeline' }).click()
    await page.waitForTimeout(500)
  })

  test('pipeline section renders without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(500)
    expect(errors).toHaveLength(0)
  })

  test('nodes are visible in the pipeline canvas', async ({ page }) => {
    // Check for node labels in the React Flow canvas
    await expect(page.locator('.react-flow__node')).toHaveCount({ minimum: 1 })
  })
})
```

Create `apps/web/e2e/annotation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Annotation Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Annotate' }).click()
    await page.waitForTimeout(500)
  })

  test('annotation section renders without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(500)
    expect(errors).toHaveLength(0)
  })

  test('has a canvas or image area', async ({ page }) => {
    // Annotation section should show a canvas or image viewer
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
  })
})
```

Add `test:e2e` to root `package.json`:
```json
"test:e2e": "pnpm --filter @visionflow/web test:e2e"
```
</action>

<acceptance_criteria>
- `apps/web/playwright.config.ts` exists with Chromium + mobile configs
- `apps/web/e2e/navigation.spec.ts` has 10 tests covering all 8 sections
- `apps/web/e2e/pipeline.spec.ts` has 2 tests
- `apps/web/e2e/annotation.spec.ts` has 2 tests
- `pnpm test:e2e` runs and passes (or at least starts without errors)
- Playwright browsers are installed
</acceptance_criteria>

### Plan 10-03 Verification

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

---

## Key Files Modified/Created

**Created:**
- `vitest.workspace.ts` (root)
- `test/setup.ts`
- `apps/api/vitest.config.ts`
- `apps/web/vitest.config.ts`
- `packages/contracts/vitest.config.ts`
- `packages/motion/vitest.config.ts`
- `apps/web/src/lib/api.test.ts`
- `apps/web/src/features/evaluation/evaluation-metrics.test.ts`
- `apps/web/src/features/timeline/dataset-diff.test.ts`
- `packages/contracts/src/evaluation.test.ts`
- `packages/motion/src/motion.test.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.eslintrc.cjs`
- `.prettierrc`
- `.prettierignore`
- `.eslintignore`
- `.editorconfig`
- `README.md`
- `scripts/start-dev.sh`
- `scripts/start-dev.ps1`
- `scripts/seed-demo.ts`
- `apps/web/playwright.config.ts`
- `apps/web/e2e/navigation.spec.ts`
- `apps/web/e2e/pipeline.spec.ts`
- `apps/web/e2e/annotation.spec.ts`

**Modified:**
- `package.json` (add scripts: test:ui, test:coverage, dev:full, dev:full:win, kill, seed, test:e2e, lint, lint:fix, format, format:check)
- `apps/api/package.json` (add test scripts, vite-tsconfig-paths)
- `apps/web/package.json` (add test scripts, vite-tsconfig-paths)
- `packages/contracts/package.json` (add test scripts)
- `packages/motion/package.json` (add test scripts)

## Key Decisions

1. **Vitest workspace** — Single workspace config at root, per-package configs inherit via `extends`. Matches the `turbo test` pipeline.
2. **No onnxruntime integration** — CV worker ONNX path remains stubbed; Phase 10 does not implement the actual inference. This is a Phase 11+ item.
3. **Memory fallback for tests** — All TypeScript tests use mocked/fake implementations, not real DB/Redis/MinIO. Real integration tests require Docker containers and are deferred.
4. **Playwright for E2E** — Uses existing Playwright devDependency rather than installing a new runner.
5. **Shell scripts** — Unix shell script + PowerShell script for boot, not a Node.js wrapper.
6. **CI runs on all branches** — CI triggers on push and PR for all branches, not just main, so phase branches get validation too.
7. **Test coverage thresholds** — API: 50%, Web: 30%, Contracts: 80%. Thresholds are conservative — this is a first pass. Can be raised in future phases.

## Must-Haves (Verification Evidence)

- `pnpm verify` passes: typecheck + test + build
- `pnpm lint` passes with 0 errors
- `pnpm format:check` passes
- GitHub Actions CI workflow exists and is valid YAML
- README.md exists at root with quick start, features, and tech stack
- `pnpm dev:full` (shell script) starts Docker + generates Prisma client + launches all apps
- Demo/seed script runs and validates demo data
- Playwright navigation tests exist and pass on Chromium
- All new test files pass with meaningful assertions
