import { UploadSimpleIcon as UploadSimple } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { motionTokens } from '@visionflow/motion';
import { validateMediaMime } from '@visionflow/contracts';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useRef, useState } from 'react';
import type { MediaUploadRow } from '../features/media';
import { checksumFile, uploadMediaFile } from '../features/media';
import { demoSnapshot } from '../data/demo';
import { Panel } from './ui/Panel';

interface MediaPanelProps {
  uploads: MediaUploadRow[];
  setUploads: Dispatch<SetStateAction<MediaUploadRow[]>>;
  selectedAssetId: string | null;
  onSelectAsset: (id: string | null) => void;
}

export function MediaPanel({
  uploads,
  setUploads,
  selectedAssetId,
  onSelectAsset,
}: MediaPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const allRows = useMemo(() => [...uploads, ...seededMediaRows()], [uploads]);
  const queuedCount = uploads.filter(
    (row) => row.status === 'uploading' || row.status === 'hashing'
  ).length;
  const failedCount = uploads.filter((row) => row.status === 'failed').length;
  const duplicateCount = uploads.filter((row) => row.status === 'duplicate').length;

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = [...fileList];

    for (const file of files) {
      await ingestFile(file, allRows, setUploads);
    }
  };

  return (
    <Panel className="media-panel overflow-hidden">
      <div className="divider flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">Media ingestion</h2>
          <p className="mt-1 text-sm text-neutral-500">
            MIME validation, SHA-256 dedupe, MinIO storage, metadata rows, and processing jobs.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={(event) => {
            if (event.currentTarget.files) {
              void handleFiles(event.currentTarget.files);
            }
            event.currentTarget.value = '';
          }}
        />
        <button
          type="button"
          title="Upload media"
          aria-label="Upload media"
          onClick={() => inputRef.current?.click()}
          className="version-header-action version-header-action-muted inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.07] active:translate-y-px"
        >
          <UploadSimple size={16} />
          Upload
        </button>
      </div>
      <div className="divider grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <label
          className={[
            'inner-border m-4 flex min-h-44 cursor-pointer flex-col justify-between rounded-md p-4 transition',
            dragActive
              ? 'border-[oklch(0.8_0.13_152)] bg-[oklch(0.8_0.13_152/0.1)]'
              : 'bg-white/[0.025] hover:bg-white/[0.04]',
          ].join(' ')}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            void handleFiles(event.dataTransfer.files);
          }}
        >
          <span>
            <span className="btn-signal-outline flex h-10 w-10 items-center justify-center rounded-md">
              <UploadSimple size={20} weight="duotone" />
            </span>
            <span className="mt-4 block text-base font-semibold text-neutral-100">
              Drop images or video here
            </span>
            <span className="mt-2 block max-w-[62ch] text-sm leading-6 text-neutral-500">
              Supported: JPG, PNG, WebP, MP4, MOV. The client hashes first so duplicate files are
              caught before storage work.
            </span>
          </span>
          <span className="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-signal-300">
            Select files
          </span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            onChange={(event) => {
              if (event.currentTarget.files) {
                void handleFiles(event.currentTarget.files);
              }
              event.currentTarget.value = '';
            }}
          />
        </label>
        <div className="divider-top p-4 lg:border-l lg:border-t-0">
          <h3 className="text-sm font-semibold text-neutral-100">Upload state</h3>
          <div className="mt-4 grid gap-2">
            <UploadStateMetric label="new queue" value={queuedCount} tone="scan" />
            <UploadStateMetric label="duplicates" value={duplicateCount} tone="signal" />
            <UploadStateMetric label="failed" value={failedCount} tone="amber" />
          </div>
        </div>
      </div>
      <div className="media-assets-scroll">
        <table className="media-assets-table w-full border-collapse text-sm">
          <thead className="bg-white/[0.025] text-left font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Shape</th>
              <th className="px-4 py-3 font-medium">Split</th>
              <th className="px-4 py-3 font-medium">Checksum</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Processing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-200">
            {allRows.map((asset) => (
              <tr
                key={asset.id}
                className={[
                  'cursor-pointer text-neutral-300 transition',
                  selectedAssetId === asset.id
                    ? 'bg-signal-400/10 inner-border-subtle'
                    : 'hover:bg-white/[0.03]',
                ].join(' ')}
                onClick={() => onSelectAsset(selectedAssetId === asset.id ? null : asset.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="media-asset-thumb" />
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-100">{asset.name}</p>
                      <p className="media-asset-meta font-mono text-xs text-neutral-500">
                        <span>{asset.id}</span>
                        <span className="media-asset-shape-inline">{formatMediaShape(asset)}</span>
                      </p>
                      {asset.error ? (
                        <p className="mt-1 max-w-[34ch] text-xs text-red-300">{asset.error}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{formatMediaShape(asset)}</td>
                <td className="px-4 py-3">
                  <SplitPillMedia split={asset.split} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{asset.checksum}</td>
                <td className="px-4 py-3">
                  <MediaStatusPill status={asset.status} />
                </td>
                <td className="px-4 py-3">
                  <UploadProgress row={asset} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatMediaShape(asset: MediaUploadRow): string {
  return asset.width && asset.height
    ? `${asset.width} x ${asset.height}`
    : formatBytes(asset.sizeBytes);
}

interface UploadStateMetricProps {
  label: string;
  value: number;
  tone: 'signal' | 'scan' | 'amber';
}

function UploadStateMetric({ label, value, tone }: UploadStateMetricProps) {
  const toneClass =
    tone === 'signal' ? 'text-signal-300' : tone === 'scan' ? 'text-scan-300' : 'text-amber-300';

  return (
    <div className="inner-border-subtle flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

export function MediaStatusPill({ status }: { status: MediaUploadRow['status'] }) {
  const tone =
    status === 'indexed'
      ? 'media-status-pill-signal'
      : status === 'uploading' || status === 'hashing' || status === 'queued'
        ? 'media-status-pill-scan'
        : status === 'duplicate'
          ? 'media-status-pill-amber'
          : 'media-status-pill-red';

  return <span className={`media-status-pill ${tone}`}>{status}</span>;
}

function UploadProgress({ row }: { row: MediaUploadRow }) {
  return (
    <div className="min-w-32">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={[
            'h-full',
            row.status === 'failed'
              ? 'bg-red-300'
              : row.status === 'duplicate'
                ? 'bg-amber-300'
                : 'bg-signal-300',
          ].join(' ')}
          initial={false}
          animate={{ width: `${row.progress}%` }}
          transition={motionTokens.springSoft}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-neutral-500">
        {row.processingJob ?? (row.status === 'indexed' ? 'audit logged' : row.status)}
      </p>
    </div>
  );
}

function SplitPillMedia({ split }: { split: string }) {
  return <span className="split-pill">{split}</span>;
}

export function seededMediaRows(): MediaUploadRow[] {
  return demoSnapshot.media.map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    checksum: asset.checksum,
    split: asset.split,
    status: asset.status,
    progress: asset.status === 'queued' ? 64 : 100,
    sizeBytes: asset.sizeBytes ?? 1_486_400,
    width: asset.width,
    height: asset.height,
    processingJob: asset.status === 'queued' ? 'THUMBNAIL' : 'complete',
  }));
}

export async function ingestFile(
  file: File,
  existingRows: MediaUploadRow[],
  setUploads: Dispatch<SetStateAction<MediaUploadRow[]>>
) {
  const rowId = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    validateMediaMime(file.type);
  } catch {
    setUploads((current) => [
      {
        id: rowId,
        name: file.name,
        type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        checksum: 'invalid-mime',
        split: 'UNASSIGNED',
        status: 'failed',
        progress: 0,
        sizeBytes: file.size,
        width: null,
        height: null,
        error: `Unsupported MIME type: ${file.type || 'unknown'}`,
      },
      ...current,
    ]);
    return;
  }

  setUploads((current) => [
    {
      id: rowId,
      name: file.name,
      type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      checksum: 'hashing',
      split: 'UNASSIGNED',
      status: 'hashing',
      progress: 10,
      sizeBytes: file.size,
      width: null,
      height: null,
    },
    ...current,
  ]);

  const checksum = await checksumFile(file);
  const duplicate = existingRows.some((row) => row.checksum === checksum);

  if (duplicate) {
    setUploads((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              checksum,
              status: 'duplicate',
              progress: 100,
              error: 'Checksum already exists in this project.',
            }
          : row
      )
    );
    return;
  }

  setUploads((current) =>
    current.map((row) =>
      row.id === rowId ? { ...row, checksum, status: 'uploading', progress: 42 } : row
    )
  );

  try {
    const response = await uploadMediaFile(demoSnapshot.project.id, file);

    setUploads((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              id: response.asset.id,
              name: response.asset.name,
              type: response.asset.type,
              checksum: response.asset.checksum,
              status: response.deduplicated ? 'duplicate' : response.asset.status,
              progress: 100,
              sizeBytes: response.asset.sizeBytes,
              width: response.asset.width,
              height: response.asset.height,
              processingJob: response.processingJob?.type ?? undefined,
            }
          : row
      )
    );
  } catch (error) {
    setUploads((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              status: 'failed',
              progress: 100,
              error: error instanceof Error ? error.message : String(error),
            }
          : row
      )
    );
  }
}
