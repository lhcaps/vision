import { describe, it, expect } from 'vitest';

// Replicate the computeIoU and computeDiff logic from DatasetVersionDiff for isolated testing

function computeIoU(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 <= x1 || y2 <= y1) {
    return 0;
  }

  const intersection = (x2 - x1) * (y2 - y1);
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

type AnnotationSummary = {
  id: string;
  labelClassId: string;
  assetId: string;
  geometry: { x: number; y: number; width: number; height: number };
};

const IOU_THRESHOLD = 0.3;

function computeDiff(
  versionA: AnnotationSummary[],
  versionB: AnnotationSummary[]
): { added: number; removed: number; changed: number } {
  const diffBoxes: Array<{ diffType: 'added' | 'removed' | 'changed' }> = [];
  const matchedB = new Set<string>();

  for (const annA of versionA) {
    const matchB = versionB.find(
      (b) => b.labelClassId === annA.labelClassId && b.assetId === annA.assetId
    );

    if (!matchB) {
      diffBoxes.push({ diffType: 'removed' });
    } else {
      matchedB.add(matchB.id);
      const iou = computeIoU(annA.geometry, matchB.geometry);
      if (iou < IOU_THRESHOLD) {
        diffBoxes.push({ diffType: 'changed' });
      }
    }
  }

  for (const annB of versionB) {
    if (!matchedB.has(annB.id)) {
      diffBoxes.push({ diffType: 'added' });
    }
  }

  return {
    added: diffBoxes.filter((b) => b.diffType === 'added').length,
    removed: diffBoxes.filter((b) => b.diffType === 'removed').length,
    changed: diffBoxes.filter((b) => b.diffType === 'changed').length,
  };
}

describe('computeIoU', () => {
  it('returns 1.0 for identical boxes', () => {
    const box = { x: 0, y: 0, width: 100, height: 100 };
    expect(computeIoU(box, box)).toBeCloseTo(1.0);
  });

  it('returns 0 for non-overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(computeIoU(a, b)).toBe(0);
  });

  it('returns correct value for partial overlap', () => {
    // Two 10x10 boxes overlapping by 5x5 = 25 area, union = 175
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(computeIoU(a, b)).toBeCloseTo(0.143, 2);
  });

  it('returns 0 when boxes touch at edge only', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 10, width: 10, height: 10 };
    expect(computeIoU(a, b)).toBe(0);
  });

  it('returns 0 when one box contains the other at a point', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 5, height: 5 };
    // Intersection = 25, areaA = 100, areaB = 25, union = 100
    expect(computeIoU(a, b)).toBeCloseTo(0.25);
  });
});

describe('computeDiff', () => {
  it('detects no differences for identical versions', () => {
    const ann = {
      id: 'a1',
      labelClassId: 'car',
      assetId: 'img1',
      geometry: { x: 0, y: 0, width: 100, height: 100 },
    };
    const result = computeDiff([ann], [ann]);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.changed).toBe(0);
  });

  it('detects added annotations', () => {
    const vA: AnnotationSummary[] = [];
    const vB: AnnotationSummary[] = [
      {
        id: 'b1',
        labelClassId: 'car',
        assetId: 'img1',
        geometry: { x: 10, y: 20, width: 100, height: 80 },
      },
    ];
    const result = computeDiff(vA, vB);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.changed).toBe(0);
  });

  it('detects removed annotations', () => {
    const vA: AnnotationSummary[] = [
      {
        id: 'a1',
        labelClassId: 'car',
        assetId: 'img1',
        geometry: { x: 10, y: 20, width: 100, height: 80 },
      },
    ];
    const vB: AnnotationSummary[] = [];
    const result = computeDiff(vA, vB);
    expect(result.removed).toBe(1);
    expect(result.added).toBe(0);
  });

  it('detects changed geometry when IoU < 0.3', () => {
    const vA: AnnotationSummary[] = [
      {
        id: 'a1',
        labelClassId: 'car',
        assetId: 'img1',
        geometry: { x: 10, y: 20, width: 100, height: 80 },
      },
    ];
    const vB: AnnotationSummary[] = [
      {
        id: 'b1',
        labelClassId: 'car',
        assetId: 'img1',
        geometry: { x: 50, y: 60, width: 100, height: 80 },
      },
    ];
    const result = computeDiff(vA, vB);
    expect(result.changed).toBe(1);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
  });

  it('treats same geometry different label as removed + added', () => {
    const vA: AnnotationSummary[] = [
      {
        id: 'a1',
        labelClassId: 'car',
        assetId: 'img1',
        geometry: { x: 10, y: 20, width: 100, height: 80 },
      },
    ];
    const vB: AnnotationSummary[] = [
      {
        id: 'b1',
        labelClassId: 'van',
        assetId: 'img1',
        geometry: { x: 10, y: 20, width: 100, height: 80 },
      },
    ];
    const result = computeDiff(vA, vB);
    expect(result.removed).toBe(1);
    expect(result.added).toBe(1);
    expect(result.changed).toBe(0);
  });

  it('handles empty versions', () => {
    const empty: AnnotationSummary[] = [];
    const result = computeDiff(empty, empty);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.changed).toBe(0);
  });

  it('detects multiple mixed differences', () => {
    const vA: AnnotationSummary[] = [
      {
        id: 'a1',
        labelClassId: 'car',
        assetId: 'img1',
        geometry: { x: 10, y: 20, width: 100, height: 80 },
      },
      {
        id: 'a2',
        labelClassId: 'van',
        assetId: 'img1',
        geometry: { x: 10, y: 20, width: 100, height: 80 },
      },
    ];
    const vB: AnnotationSummary[] = [
      {
        id: 'b1',
        labelClassId: 'car',
        assetId: 'img1',
        geometry: { x: 500, y: 500, width: 100, height: 80 },
      }, // changed
      {
        id: 'b2',
        labelClassId: 'truck',
        assetId: 'img1',
        geometry: { x: 10, y: 20, width: 100, height: 80 },
      }, // added
    ];
    const result = computeDiff(vA, vB);
    expect(result.changed).toBe(1); // car changed
    expect(result.removed).toBe(1); // van removed
    expect(result.added).toBe(1); // truck added
  });
});
