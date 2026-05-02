import { CopySimpleIcon as Copy } from '@phosphor-icons/react';
import type { MediaInspectorData } from './inspector.types';
import { ActionHint } from '../../shared/ui/ActionHint';

interface MediaInspectorProps {
  data: MediaInspectorData;
  onAddToDraft?: () => void;
  onCopyChecksum?: () => void;
  onViewAsset?: () => void;
}

export function MediaInspector({
  data,
  onAddToDraft,
  onCopyChecksum,
  onViewAsset,
}: MediaInspectorProps) {
  const {
    selectedAssetId,
    selectedAssetName,
    selectedAssetMime,
    selectedAssetWidth,
    selectedAssetHeight,
    selectedAssetChecksum,
    selectedAssetStorageKey,
    selectedAssetProcessingState,
  } = data;

  if (!selectedAssetId) {
    return (
      <aside className="space-y-4">
        <InspectorShell title="Media Inspector" section="media">
          <div className="p-4">
            <ActionHint
              label="Select"
              description="Click an asset in the table to see its details here."
              tone="neutral"
            />
          </div>
        </InspectorShell>
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      <InspectorShell title="Media Inspector" section="media">
        <div className="divide-y divide-graphite-200">
          <InspectorRow label="Name" value={selectedAssetName ?? '—'} />
          <InspectorRow label="ID" value={selectedAssetId} mono />
          <InspectorRow label="Type" value={selectedAssetMime ?? '—'} mono />
          {selectedAssetWidth && selectedAssetHeight ? (
            <InspectorRow
              label="Dimensions"
              value={`${selectedAssetWidth} x ${selectedAssetHeight}`}
              mono
            />
          ) : null}
          {selectedAssetChecksum ? (
            <InspectorRow label="Checksum" value={selectedAssetChecksum} mono truncate />
          ) : null}
          {selectedAssetStorageKey ? (
            <InspectorRow label="Storage key" value={selectedAssetStorageKey} mono truncate />
          ) : null}
          {selectedAssetProcessingState ? (
            <InspectorRow label="State" value={selectedAssetProcessingState} mono />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 p-4">
          {onViewAsset && (
            <button
              type="button"
              onClick={onViewAsset}
              className="version-header-action version-header-action-muted"
            >
              View
            </button>
          )}
          {onCopyChecksum && selectedAssetChecksum && (
            <button
              type="button"
              onClick={onCopyChecksum}
              className="version-header-action version-header-action-muted"
            >
              <Copy size={14} />
              Copy checksum
            </button>
          )}
          {onAddToDraft && (
            <button
              type="button"
              onClick={onAddToDraft}
              className="version-header-action version-header-action-lock"
            >
              Add to draft
            </button>
          )}
        </div>
      </InspectorShell>
    </aside>
  );
}

interface InspectorShellProps {
  title: string;
  section: string;
  children: React.ReactNode;
}

export function InspectorShell({ title, section, children }: InspectorShellProps) {
  return (
    <div
      className="bg-graphite-900/75 inner-border-subtle min-w-0 rounded-md shadow-panel"
      style={{ width: 320 }}
    >
      <div className="divider px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          {section}
        </p>
      </div>
      {children}
    </div>
  );
}

interface InspectorRowProps {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}

export function InspectorRow({ label, value, mono, truncate }: InspectorRowProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 px-4 py-3 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span
        className={`text-neutral-200 ${mono ? 'font-mono text-xs' : ''} ${truncate ? 'truncate' : ''}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
