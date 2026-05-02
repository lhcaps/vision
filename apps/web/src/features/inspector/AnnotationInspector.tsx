import type { AnnotationSummary } from '@visionflow/contracts';
import { InspectorShell, InspectorRow } from './MediaInspector';
import { ActionHint } from '../../shared/ui/ActionHint';

interface AnnotationInspectorProps {
  selectedAnnotation: AnnotationSummary | null;
  threshold: number;
  onThresholdChange?: (value: number) => void;
}

export function AnnotationInspector({
  selectedAnnotation,
  threshold,
  onThresholdChange,
}: AnnotationInspectorProps) {
  if (!selectedAnnotation) {
    return (
      <div className="space-y-4">
        <InspectorShell title="Annotation Inspector" section="annotate">
          <div className="p-4">
            <ActionHint
              label="Select"
              description="Select a bounding box on the canvas to inspect its properties."
              tone="neutral"
            />
          </div>
        </InspectorShell>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Coordinate contract — only shown when an annotation is selected */}
      <InspectorShell title="Coordinate Contract" section="annotate">
        <div className="divide-y divide-graphite-200">
          <InspectorRow label="Label" value={selectedAnnotation.label} />
          <InspectorRow label="Source" value={selectedAnnotation.source} mono />
          {selectedAnnotation.confidence != null && (
            <InspectorRow
              label="Confidence"
              value={(selectedAnnotation.confidence * 100).toFixed(1) + '%'}
              mono
            />
          )}
        </div>

        <div className="space-y-3 p-4">
          <p className="text-xs font-semibold text-neutral-300">Geometry (image coordinates)</p>
          <div className="grid grid-cols-2 gap-2">
            <GeometryCell label="x" value={selectedAnnotation.geometry.x} />
            <GeometryCell label="y" value={selectedAnnotation.geometry.y} />
            <GeometryCell label="w" value={selectedAnnotation.geometry.width} />
            <GeometryCell label="h" value={selectedAnnotation.geometry.height} />
          </div>
        </div>
      </InspectorShell>

      {/* Threshold control — shared but contextual to annotate page */}
      <InspectorShell title="Threshold" section="annotate">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-200" htmlFor="inspector-threshold">
              Confidence threshold
            </label>
            <span className="font-mono text-xs text-signal-300">
              {(threshold / 100).toFixed(2)}
            </span>
          </div>
          {onThresholdChange && (
            <input
              id="inspector-threshold"
              type="range"
              min="40"
              max="95"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="threshold-range w-full"
            />
          )}
        </div>
      </InspectorShell>
    </div>
  );
}

function GeometryCell({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2"
      style={{ boxShadow: 'inset 0 0 0 1px oklch(94% 0.006 180 / 0.06)' }}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className="font-mono text-sm text-neutral-100">{value}</span>
    </div>
  );
}
