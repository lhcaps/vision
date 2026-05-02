import { GitBranchIcon as GitBranch } from '@phosphor-icons/react';
import type { DatasetInspectorData } from './inspector.types';
import { InspectorShell, InspectorRow } from './MediaInspector';
import { ActionHint } from '../../shared/ui/ActionHint';

interface DatasetInspectorProps {
  data: DatasetInspectorData;
  onLockVersion?: () => void;
  onExportCoco?: () => void;
  onCreateDraft?: () => void;
}

export function DatasetInspector({
  data,
  onLockVersion,
  onExportCoco,
  onCreateDraft,
}: DatasetInspectorProps) {
  const {
    selectedVersionId,
    selectedVersionLabel,
    selectedVersionStatus,
    selectedVersionAssetCount,
    splitSummary,
    canMutate,
  } = data;

  if (!selectedVersionId) {
    return (
      <div className="space-y-4">
        <InspectorShell title="Dataset Inspector" section="datasets">
          <div className="p-4">
            <ActionHint
              label="Select"
              description="Select a version in the Versions panel to see its details."
              tone="neutral"
            />
          </div>
        </InspectorShell>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InspectorShell title="Dataset Inspector" section="datasets">
        <div className="divide-y divide-graphite-200">
          <InspectorRow label="Version" value={selectedVersionLabel ?? '—'} />
          <InspectorRow label="ID" value={selectedVersionId} mono />
          <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 px-4 py-3 text-sm">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              Status
            </span>
            <VersionStatusPill status={selectedVersionStatus} />
          </div>
          <InspectorRow label="Assets" value={String(selectedVersionAssetCount)} mono />
          {selectedVersionStatus === 'LOCKED' ? (
            <>
              <InspectorRow label="Train" value={String(splitSummary.train)} mono />
              <InspectorRow label="Valid" value={String(splitSummary.valid)} mono />
              <InspectorRow label="Test" value={String(splitSummary.test)} mono />
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 p-4">
          {selectedVersionStatus === 'DRAFT' && canMutate && onLockVersion && (
            <button
              type="button"
              onClick={onLockVersion}
              className="version-header-action version-header-action-lock"
            >
              <GitBranch size={14} />
              Lock version
            </button>
          )}
          {selectedVersionStatus === 'LOCKED' && onExportCoco && (
            <button
              type="button"
              onClick={onExportCoco}
              className="version-header-action version-header-action-muted"
            >
              Export COCO
            </button>
          )}
          {selectedVersionStatus === 'DRAFT' && onCreateDraft && (
            <button
              type="button"
              onClick={onCreateDraft}
              className="version-header-action version-header-action-muted"
            >
              Create draft
            </button>
          )}
        </div>
      </InspectorShell>
    </div>
  );
}

function VersionStatusPill({ status }: { status: 'DRAFT' | 'LOCKED' | null }) {
  if (!status) return <span className="text-neutral-500">—</span>;

  const className =
    status === 'LOCKED'
      ? 'dataset-version-pill dataset-version-pill-locked'
      : 'dataset-version-pill dataset-version-pill-draft';

  return <span className={className}>{status}</span>;
}
