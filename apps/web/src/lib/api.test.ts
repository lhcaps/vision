import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch before imports
global.fetch = vi.fn();

// Import the actual functions (each file has its own apiJson — test the public surface)
import {
  loadAnnotationWorkspace,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from './annotations';
import { listProjectDatasets } from './datasets';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── annotations.ts ────────────────────────────────────────────────────────────

describe('loadAnnotationWorkspace', () => {
  it('returns workspace data on success', async () => {
    const mockData = {
      annotations: [],
      annotationSets: [],
      labelClasses: [],
      assets: [],
      versionId: 'v1',
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await loadAnnotationWorkspace('proj-1', 'v-1', 'asset-1');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('annotation-workspace'),
      expect.anything()
    );
  });

  it('calls with assetId query param when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          annotations: [],
          annotationSets: [],
          labelClasses: [],
          assets: [],
          versionId: 'v-1',
        }),
    } as Response);

    await loadAnnotationWorkspace('proj-1', 'v-1', 'asset-abc');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('assetId=asset-abc'),
      expect.anything()
    );
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
    } as Response);

    await expect(loadAnnotationWorkspace('proj-1', 'v-1')).rejects.toThrow('Not found');
  });
});

describe('createAnnotation', () => {
  it('posts annotation and returns summary', async () => {
    const mockSummary = {
      id: 'ann-new',
      labelClassId: 'car',
      geometry: { x: 0, y: 0, width: 100, height: 100 },
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSummary),
    } as Response);

    const body = {
      assetId: 'a1',
      labelClassId: 'car',
      geometry: { x: 0, y: 0, width: 100, height: 100 },
      source: 'MANUAL',
    };
    const result = await createAnnotation('proj-1', 'annset-1', body);
    expect(result).toEqual(mockSummary);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/proj-1/annotation-sets/annset-1/annotations'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('updateAnnotation', () => {
  it('patches annotation and returns updated summary', async () => {
    const mockUpdated = {
      id: 'ann-1',
      labelClassId: 'car',
      geometry: { x: 10, y: 10, width: 100, height: 100 },
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUpdated),
    } as Response);

    const body = { geometry: { x: 10, y: 10, width: 100, height: 100 } };
    const result = await updateAnnotation('proj-1', 'ann-1', body);
    expect(result.id).toBe('ann-1');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/proj-1/annotations/ann-1'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

describe('deleteAnnotation', () => {
  it('deletes annotation and returns response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'ann-1', deleted: true }),
    } as Response);

    await expect(deleteAnnotation('proj-1', 'ann-1')).resolves.toBeDefined();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/projects/proj-1/annotations/ann-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

// ─── datasets.ts ───────────────────────────────────────────────────────────────

describe('listProjectDatasets', () => {
  it('returns dataset list', async () => {
    const mockDatasets = { datasets: [{ id: 'ds-1', name: 'Train Set' }] };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDatasets),
    } as Response);

    const result = await listProjectDatasets('proj-1');
    expect(result.datasets).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('datasets'), expect.anything());
  });

  it('throws on API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Internal error' }),
    } as Response);

    await expect(listProjectDatasets('proj-1')).rejects.toThrow('Internal error');
  });
});
