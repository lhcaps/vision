import type { DatasetVersionSummary } from '@visionflow/contracts';
import type { MediaUploadRow } from '../features/media';

export type MediaInspectorData = {
  selectedAssetId: string | null;
  selectedAssetName: string | null;
  selectedAssetMime: string | null;
  selectedAssetWidth: number | null;
  selectedAssetHeight: number | null;
  selectedAssetChecksum: string | null;
  selectedAssetStorageKey: string | null;
  selectedAssetProcessingState: string | null;
};

export type DatasetInspectorData = {
  selectedVersionId: string | null;
  selectedVersionLabel: string | null;
  selectedVersionStatus: 'DRAFT' | 'LOCKED' | null;
  selectedVersionAssetCount: number;
  splitSummary: { train: number; valid: number; test: number; unassigned: number };
  canMutate: boolean;
};

export function buildMediaInspectorData(
  mediaRows: MediaUploadRow[],
  selectedMediaAssetId: string | null
): MediaInspectorData {
  const selected = selectedMediaAssetId
    ? (mediaRows.find((r) => r.id === selectedMediaAssetId) ?? null)
    : null;

  return {
    selectedAssetId: selected?.id ?? null,
    selectedAssetName: selected?.name ?? null,
    selectedAssetMime: selected?.type ?? null,
    selectedAssetWidth: selected?.width ?? null,
    selectedAssetHeight: selected?.height ?? null,
    selectedAssetChecksum: selected?.checksum ?? null,
    selectedAssetStorageKey: null,
    selectedAssetProcessingState:
      selected?.status === 'indexed'
        ? 'processed'
        : selected?.status === 'failed'
          ? 'failed'
          : selected?.status === 'uploading' || selected?.status === 'hashing'
            ? 'processing'
            : (selected?.status ?? null),
  };
}

export function buildDatasetInspectorData(
  selectedDatasetVersionId: string | null,
  versions: DatasetVersionSummary[],
  sourceState: 'loading' | 'api' | 'fallback'
): DatasetInspectorData {
  const selected = selectedDatasetVersionId
    ? (versions.find((v) => v.id === selectedDatasetVersionId) ?? null)
    : null;

  return {
    selectedVersionId: selected?.id ?? null,
    selectedVersionLabel: selected?.label ?? null,
    selectedVersionStatus: selected?.status === 'ARCHIVED' ? null : (selected?.status ?? null),
    selectedVersionAssetCount: selected?.assetCount ?? 0,
    splitSummary: selected?.splitSummary
      ? {
          train: selected.splitSummary.TRAIN ?? 0,
          valid: selected.splitSummary.VALID ?? 0,
          test: selected.splitSummary.TEST ?? 0,
          unassigned: selected.splitSummary.UNASSIGNED ?? 0,
        }
      : { train: 0, valid: 0, test: 0, unassigned: 0 },
    canMutate: selected?.status === 'DRAFT',
  };
}
