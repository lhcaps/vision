import type { PipelineNode, PipelineValidationIssue } from '@visionflow/contracts';
import { InspectorShell } from './MediaInspector';
import { ActionHint } from '../../shared/ui/ActionHint';
import {
  CheckCircleIcon as CheckCircle,
  WarningCircleIcon as WarningCircle,
} from '@phosphor-icons/react';

interface PipelineInspectorProps {
  selectedNode: PipelineNode | null;
  validation: { ok: boolean; issues: PipelineValidationIssue[] };
  onValidate?: () => void;
  onSave?: () => void;
  onClearModel?: () => void;
}

export function PipelineInspector({
  selectedNode,
  validation,
  onValidate,
  onSave,
  onClearModel,
}: PipelineInspectorProps) {
  if (!selectedNode) {
    return (
      <div className="space-y-4">
        <InspectorShell title="Pipeline Inspector" section="pipeline">
          <div className="p-4">
            <ActionHint
              label="Select"
              description="Click a node in the graph to see its parameters."
              tone="neutral"
            />
          </div>
        </InspectorShell>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Node details */}
      <InspectorShell title="Node Inspector" section="pipeline">
        <div className="divide-y divide-graphite-200">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-100">{nodeLabel(selectedNode)}</p>
              <p className="font-mono text-[11px] text-neutral-500">{selectedNode.id}</p>
            </div>
            <span className="inner-border-subtle rounded-md bg-white/[0.035] px-2 py-1 font-mono text-xs uppercase text-neutral-400">
              {selectedNode.type}
            </span>
          </div>

          {selectedNode.type === 'resize' && (
            <div className="px-4 py-3">
              <p className="text-xs text-neutral-500">Target width</p>
              <p className="mt-1 font-mono text-sm text-neutral-200">
                {selectedNode.params.width}px
              </p>
            </div>
          )}

          {selectedNode.type === 'yolo_onnx' && (
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-200">Confidence</span>
                <span className="font-mono text-xs text-signal-300">
                  {selectedNode.params.threshold.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-200">Model</span>
                <span className="font-mono text-xs text-neutral-400">
                  {selectedNode.params.modelId ?? <span className="text-amber-300">unbound</span>}
                </span>
              </div>
              {selectedNode.params.modelId && onClearModel && (
                <button
                  type="button"
                  onClick={onClearModel}
                  className="version-header-action version-header-action-muted w-full justify-center"
                >
                  Clear model
                </button>
              )}
            </div>
          )}

          {selectedNode.type === 'nms' && (
            <div className="px-4 py-3">
              <p className="text-xs text-neutral-500">IoU threshold</p>
              <p className="mt-1 font-mono text-sm text-scan-300">
                {selectedNode.params.iouThreshold.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </InspectorShell>

      {/* Validation issues */}
      <InspectorShell title="Graph Checks" section="pipeline">
        <div className="divide-y divide-graphite-200">
          {validation.issues.length === 0 ? (
            <div className="flex items-start gap-3 px-4 py-3">
              <CheckCircle className="mt-0.5 text-signal-300" size={18} weight="duotone" />
              <div>
                <p className="text-sm font-medium text-neutral-100">Valid</p>
                <p className="mt-1 text-xs text-neutral-500">Graph passes all checks.</p>
              </div>
            </div>
          ) : (
            validation.issues.map((issue) => (
              <div key={issue.message} className="flex items-start gap-3 px-4 py-3">
                <WarningCircle className="mt-0.5 text-amber-300" size={18} weight="duotone" />
                <div>
                  <p className="text-sm font-medium text-neutral-100">
                    {issue.severity === 'error' ? 'Blocker' : 'Warning'}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">{issue.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 p-4">
          {onValidate && (
            <button
              type="button"
              onClick={onValidate}
              className="version-header-action version-header-action-muted"
            >
              <CheckCircle size={14} />
              Validate
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={!validation.ok}
              className="version-header-action version-header-action-lock"
            >
              Save
            </button>
          )}
        </div>
      </InspectorShell>
    </div>
  );
}

function nodeLabel(node: PipelineNode): string {
  const labels: Record<PipelineNode['type'], string> = {
    input: 'Input',
    resize: 'Resize',
    hsv_filter: 'HSV filter',
    yolo_onnx: 'Detector',
    nms: 'NMS',
    output: 'Output',
  };
  return labels[node.type] ?? node.type;
}
