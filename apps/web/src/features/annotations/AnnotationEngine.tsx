import {
  ActivityIcon as Activity,
  ArrowClockwiseIcon as ArrowClockwise,
  BoundingBoxIcon as BoundingBox,
  CheckCircleIcon as CheckCircle,
  CloudArrowUpIcon as CloudArrowUp,
  CrosshairIcon as Crosshair,
  FloppyDiskIcon as FloppyDisk,
  ListChecksIcon as ListChecks,
  PlusIcon as Plus,
  StackIcon as Stack,
  TrashIcon as Trash,
  WarningCircleIcon as WarningCircle,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, PointerEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AnnotationAssetSummary,
  AnnotationLabelSummary,
  AnnotationSaveOperation,
  AnnotationSaveQueueItem,
  AnnotationSummary,
  AnnotationWorkspaceResponse,
  BBoxGeometry,
} from '@visionflow/contracts';
import { bboxArea, clampBBox } from '@visionflow/contracts';
import { motionTokens } from '@visionflow/motion';
import { demoSnapshot } from '../../data/demo';
import {
  createAnnotation,
  deleteAnnotation,
  loadAnnotationWorkspace,
  updateAnnotation,
} from '../../lib/annotations';

export const DEFAULT_ANNOTATION_VERSION_ID = 'dataset_proj_parking_lot_parking_v3';

type SourceState = 'loading' | 'api' | 'fallback';
type ToolMode = 'select' | 'draw';

export type AnnotationMediaRow = {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'FRAME';
  width: number | null;
  height: number | null;
  split: string;
  status: string;
};

type AnnotationEnginePanelProps = {
  mediaRows: AnnotationMediaRow[];
};

type DrawingState = {
  start: { x: number; y: number };
  current: { x: number; y: number };
};

type QueueItem = AnnotationSaveQueueItem & {
  label: string;
  queuedAt: string;
};

export function createSeedAnnotationSummaries(): AnnotationSummary[] {
  const labels = seedLabels(demoSnapshot.project.id);
  const labelByName = new Map(labels.map((label) => [label.name, label]));

  return demoSnapshot.annotations.map((annotation, index) => {
    const label = labelByName.get(annotation.label) ?? labels[0];
    const createdAt = new Date(2026, 3, 28, 12, 52, index).toISOString();

    return {
      id: annotation.id,
      annotationSetId: createFallbackAnnotationSet(DEFAULT_ANNOTATION_VERSION_ID).id,
      assetId: annotation.assetId,
      labelClassId: label.id,
      label: label.name,
      color: label.color,
      type: 'BBOX',
      geometry: annotation.geometry,
      source: annotation.source,
      confidence: annotation.confidence ?? null,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

export function AnnotationEnginePanel({ mediaRows }: AnnotationEnginePanelProps) {
  const projectId = demoSnapshot.project.id;
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const annotationsRef = useRef<AnnotationSummary[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationSummary[]>(() =>
    createSeedAnnotationSummaries()
  );
  const [selectedAnnotationId, setSelectedAnnotationId] = useState('ann_02');
  const [threshold, setThreshold] = useState(62);
  const [sourceState, setSourceState] = useState<SourceState>('loading');
  const [workspace, setWorkspace] = useState<AnnotationWorkspaceResponse>(() =>
    createFallbackWorkspace(projectId, DEFAULT_ANNOTATION_VERSION_ID, annotations)
  );
  const [selectedAssetId, setSelectedAssetId] = useState('asset_frame_1482');
  const [activeLabelId, setActiveLabelId] = useState('');
  const [toolMode, setToolMode] = useState<ToolMode>('draw');
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const imageRows = useMemo(
    () => mediaRows.filter((row) => row.type === 'IMAGE' || row.type === 'FRAME'),
    [mediaRows]
  );
  const selectedAsset = normalizeAsset(
    (workspace.asset?.id === selectedAssetId ? workspace.asset : null) ??
      imageRows.find((row) => row.id === selectedAssetId) ??
      workspace.asset ??
      createFallbackAsset(selectedAssetId)
  );
  const visibleAnnotations = useMemo(
    () => annotations.filter((annotation) => annotation.assetId === selectedAsset.id),
    [annotations, selectedAsset.id]
  );
  const selectedAnnotation = visibleAnnotations.find(
    (annotation) => annotation.id === selectedAnnotationId
  );
  const activeLabel =
    workspace.labels.find((label) => label.id === activeLabelId) ?? workspace.labels[0];
  const queuedCount = queue.filter((item) => item.status === 'queued').length;
  const failedCount = queue.filter((item) => item.status === 'failed').length;
  const savingCount = queue.filter((item) => item.status === 'saving').length;

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const refreshWorkspace = useCallback(async () => {
    setSourceState('loading');

    try {
      const response = await loadAnnotationWorkspace(
        projectId,
        DEFAULT_ANNOTATION_VERSION_ID,
        selectedAssetId
      );

      setWorkspace(response);
      setAnnotations((current) => {
        const untouched = current.filter((annotation) => annotation.assetId !== selectedAssetId);
        return [...untouched, ...response.annotations];
      });
      setActiveLabelId((current) => current || response.labels[0]?.id || '');
      setSourceState('api');
    } catch {
      const fallback = createFallbackWorkspace(
        projectId,
        DEFAULT_ANNOTATION_VERSION_ID,
        annotationsRef.current,
        selectedAssetId
      );
      setWorkspace(fallback);
      setActiveLabelId((current) => current || fallback.labels[0]?.id || '');
      setSourceState('fallback');
    }
  }, [projectId, selectedAssetId, setAnnotations]);

  useEffect(() => {
    void refreshWorkspace();
    // Workspace load should react to the selected asset. The annotations dependency is kept in
    // refreshWorkspace so fallback always sees the latest local boxes.
  }, [refreshWorkspace]);

  useEffect(() => {
    if (!selectedAnnotation && visibleAnnotations[0]) {
      setSelectedAnnotationId(visibleAnnotations[0].id);
    }
  }, [setSelectedAnnotationId, selectedAnnotation, visibleAnnotations]);

  const enqueue = useCallback((operation: AnnotationSaveOperation, label: string) => {
    setQueue((current) => {
      const id =
        operation.kind === 'create'
          ? operation.clientId
          : operation.kind === 'update'
            ? operation.annotationId
            : operation.annotationId;
      const withoutSuperseded = current.filter((item) => {
        if (operation.kind === 'create') {
          return item.id !== id;
        }

        if (operation.kind === 'update') {
          return !(
            item.operation.kind === 'update' &&
            item.operation.annotationId === operation.annotationId
          );
        }

        if (
          item.operation.kind === 'create' &&
          item.operation.clientId === operation.annotationId
        ) {
          return false;
        }

        return !(
          item.operation.kind === 'update' && item.operation.annotationId === operation.annotationId
        );
      });

      return [
        ...withoutSuperseded,
        {
          id,
          operation,
          label,
          status: 'queued',
          queuedAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const createLocalAnnotation = useCallback(
    (geometry: BBoxGeometry) => {
      if (!activeLabel || !workspace.annotationSet || !selectedAsset) {
        return;
      }

      const now = new Date().toISOString();
      const clientId = `ann_client_${Date.now()}`;
      const normalized = normalizeCanvasBox(geometry, selectedAsset.width, selectedAsset.height);
      const annotation: AnnotationSummary = {
        id: clientId,
        annotationSetId: workspace.annotationSet.id,
        assetId: selectedAsset.id,
        labelClassId: activeLabel.id,
        label: activeLabel.name,
        color: activeLabel.color,
        type: 'BBOX',
        geometry: normalized,
        source: 'MANUAL',
        confidence: null,
        createdAt: now,
        updatedAt: now,
      };

      setAnnotations((current) => [annotation, ...current]);
      setSelectedAnnotationId(annotation.id);
      enqueue(
        {
          kind: 'create',
          clientId,
          body: {
            assetId: selectedAsset.id,
            labelClassId: activeLabel.id,
            geometry: normalized,
          },
        },
        `Create ${activeLabel.name}`
      );
    },
    [
      activeLabel,
      enqueue,
      setSelectedAnnotationId,
      selectedAsset,
      setAnnotations,
      workspace.annotationSet,
    ]
  );

  const patchAnnotation = useCallback(
    (
      annotationId: string,
      patch: Partial<Pick<AnnotationSummary, 'geometry' | 'labelClassId'>>
    ) => {
      const label = patch.labelClassId
        ? workspace.labels.find((item) => item.id === patch.labelClassId)
        : undefined;

      setAnnotations((current) =>
        current.map((annotation) =>
          annotation.id === annotationId
            ? {
                ...annotation,
                ...(patch.geometry ? { geometry: patch.geometry } : {}),
                ...(label
                  ? {
                      labelClassId: label.id,
                      label: label.name,
                      color: label.color,
                    }
                  : {}),
                updatedAt: new Date().toISOString(),
              }
            : annotation
        )
      );

      const target = annotations.find((annotation) => annotation.id === annotationId);

      if (!target) {
        return;
      }

      if (annotationId.startsWith('ann_client_')) {
        const nextGeometry = patch.geometry ?? target.geometry;
        const nextLabelId = patch.labelClassId ?? target.labelClassId;

        enqueue(
          {
            kind: 'create',
            clientId: annotationId,
            body: {
              assetId: target.assetId,
              labelClassId: nextLabelId,
              geometry: nextGeometry,
            },
          },
          `Create ${label?.name ?? target.label}`
        );
        return;
      }

      enqueue(
        {
          kind: 'update',
          annotationId,
          body: {
            ...(patch.geometry ? { geometry: patch.geometry } : {}),
            ...(patch.labelClassId ? { labelClassId: patch.labelClassId } : {}),
          },
        },
        `Update ${label?.name ?? target.label}`
      );
    },
    [annotations, enqueue, setAnnotations, workspace.labels]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedAnnotation) {
      return;
    }

    setAnnotations((current) =>
      current.filter((annotation) => annotation.id !== selectedAnnotation.id)
    );

    if (selectedAnnotation.id.startsWith('ann_client_')) {
      setQueue((current) =>
        current.filter(
          (item) =>
            !(item.operation.kind === 'create' && item.operation.clientId === selectedAnnotation.id)
        )
      );
    } else {
      enqueue(
        {
          kind: 'delete',
          annotationId: selectedAnnotation.id,
        },
        `Delete ${selectedAnnotation.label}`
      );
    }

    const next = visibleAnnotations.find((annotation) => annotation.id !== selectedAnnotation.id);
    setSelectedAnnotationId(next?.id ?? '');
  }, [enqueue, setSelectedAnnotationId, selectedAnnotation, setAnnotations, visibleAnnotations]);

  const flushQueue = useCallback(async () => {
    const runnable = queue.filter((item) => item.status === 'queued' || item.status === 'failed');

    for (const item of runnable) {
      setQueue((current) =>
        current.map((queued) =>
          queued.id === item.id ? { ...queued, status: 'saving', error: undefined } : queued
        )
      );

      try {
        if (sourceState === 'api') {
          const operation = item.operation;

          if (operation.kind === 'create') {
            const created = await createAnnotation(
              projectId,
              workspace.annotationSet.id,
              operation.body
            );

            setAnnotations((current) =>
              current.map((annotation) =>
                annotation.id === operation.clientId ? created : annotation
              )
            );
            if (selectedAnnotationId === operation.clientId) {
              setSelectedAnnotationId(created.id);
            }
          } else if (operation.kind === 'update') {
            const updated = await updateAnnotation(
              projectId,
              operation.annotationId,
              operation.body
            );

            setAnnotations((current) =>
              current.map((annotation) =>
                annotation.id === operation.annotationId ? updated : annotation
              )
            );
          } else {
            await deleteAnnotation(projectId, operation.annotationId);
          }
        }

        setQueue((current) =>
          current.map((queued) => (queued.id === item.id ? { ...queued, status: 'saved' } : queued))
        );
        setLastSavedAt(new Date().toISOString());
      } catch (error) {
        setQueue((current) =>
          current.map((queued) =>
            queued.id === item.id
              ? {
                  ...queued,
                  status: 'failed',
                  error: error instanceof Error ? error.message : String(error),
                }
              : queued
          )
        );
      }
    }
  }, [
    setSelectedAnnotationId,
    projectId,
    queue,
    selectedAnnotationId,
    setAnnotations,
    sourceState,
    workspace.annotationSet.id,
  ]);

  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (!selectedAnnotation) {
        return;
      }

      patchAnnotation(selectedAnnotation.id, {
        geometry: normalizeCanvasBox(
          {
            ...selectedAnnotation.geometry,
            x: selectedAnnotation.geometry.x + dx,
            y: selectedAnnotation.geometry.y + dy,
          },
          selectedAsset.width,
          selectedAsset.height
        ),
      });
    },
    [patchAnnotation, selectedAnnotation, selectedAsset.height, selectedAsset.width]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'SELECT' ||
        target?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (event.key === 'n' || event.key === 'N') {
        setToolMode('draw');
      } else if (event.key === 'v' || event.key === 'V') {
        setToolMode('select');
      } else if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        void flushQueue();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelected();
      } else if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        const amount = event.shiftKey ? 12 : 3;
        const dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
        const dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
        nudgeSelected(dx, dy);
      } else if (/^[1-9]$/.test(event.key)) {
        const label = workspace.labels[Number(event.key) - 1];

        if (label) {
          setActiveLabelId(label.id);
          if (selectedAnnotation) {
            patchAnnotation(selectedAnnotation.id, { labelClassId: label.id });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    deleteSelected,
    flushQueue,
    nudgeSelected,
    patchAnnotation,
    selectedAnnotation,
    workspace.labels,
  ]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (toolMode !== 'draw' || !stageRef.current) {
      return;
    }

    const point = pointerToImagePoint(
      event,
      stageRef.current,
      selectedAsset.width,
      selectedAsset.height
    );

    setDrawing({ start: point, current: point });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drawing || !stageRef.current) {
      return;
    }

    setDrawing({
      ...drawing,
      current: pointerToImagePoint(
        event,
        stageRef.current,
        selectedAsset.width,
        selectedAsset.height
      ),
    });
  };

  const handlePointerUp = () => {
    if (!drawing) {
      return;
    }

    const box = boxFromDrawing(drawing);

    setDrawing(null);

    if (bboxArea(box) >= 160) {
      createLocalAnnotation(box);
    }
  };

  const draftBox = drawing ? boxFromDrawing(drawing) : null;

  return (
    <div className="grid gap-4">
      <section className="space-y-4">
        <div className="inner-border-subtle bg-graphite-900/75 overflow-hidden rounded-md shadow-panel">
          <div className="divider flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Annotation engine</h2>
              <p className="mt-1 font-mono text-xs text-neutral-500">
                {selectedAsset.id} / {selectedAsset.width} x {selectedAsset.height}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SourcePill state={sourceState} />
              <IconButton
                label="Select"
                icon={Crosshair}
                active={toolMode === 'select'}
                onClick={() => setToolMode('select')}
              />
              <IconButton
                label="Draw bbox"
                icon={BoundingBox}
                active={toolMode === 'draw'}
                onClick={() => setToolMode('draw')}
              />
              <IconButton
                label="Refresh"
                icon={ArrowClockwise}
                onClick={() => void refreshWorkspace()}
              />
              <IconButton
                label="Delete selected"
                icon={Trash}
                disabled={!selectedAnnotation}
                danger
                onClick={deleteSelected}
              />
              <button
                type="button"
                title="Save queued changes"
                aria-label="Save queued changes"
                onClick={() => void flushQueue()}
                disabled={queuedCount === 0 && failedCount === 0}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-signal-300 px-3 text-sm font-semibold text-graphite-950 transition hover:bg-signal-400 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
              >
                <FloppyDisk size={16} weight="duotone" />
                Save
              </button>
            </div>
          </div>

          <div className="grid gap-0">
            <div className="p-4">
              <div
                ref={stageRef}
                className={[
                  'annotation-canvas inner-border-subtle relative aspect-video overflow-hidden rounded-md bg-graphite-950 sm:min-h-[360px]',
                  toolMode === 'draw' ? 'cursor-crosshair' : 'cursor-default',
                ].join(' ')}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <div className="annotation-road inner-border-subtle absolute inset-[12%_7%_16%] rounded-sm" />
                <div className="absolute inset-x-[9%] top-[52%] border-t border-dashed border-graphite-100" />
                <div className="absolute bottom-[19%] left-[11%] h-[10%] w-[78%] rounded-sm bg-white/[0.03]" />
                <AnimatePresence>
                  {visibleAnnotations.map((annotation) => (
                    <AnnotationBox
                      key={annotation.id}
                      annotation={annotation}
                      imageWidth={selectedAsset.width}
                      imageHeight={selectedAsset.height}
                      selected={annotation.id === selectedAnnotationId}
                      reducedMotion={Boolean(shouldReduceMotion)}
                      onSelect={() => setSelectedAnnotationId(annotation.id)}
                    />
                  ))}
                </AnimatePresence>
                {draftBox && (
                  <div
                    className="annotation-draft absolute rounded-sm"
                    style={boxStyle(draftBox, selectedAsset.width, selectedAsset.height)}
                  />
                )}
                {savingCount > 0 && !shouldReduceMotion && <div className="scanline" />}
                <div className="inner-border-subtle bg-graphite-950/84 absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 backdrop-blur">
                  <span className="font-mono text-xs text-neutral-400">
                    {workspace.annotationSet.name} / {visibleAnnotations.length} boxes
                  </span>
                  <span className="font-mono text-xs text-signal-300">image-coordinate mode</span>
                </div>
              </div>
            </div>

            <div className="divider-top p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-neutral-100">Active asset</h3>
                <span className="font-mono text-xs text-neutral-500">{imageRows.length}</span>
              </div>
              <div className="mt-3 grid gap-2 lg:grid-cols-3">
                {imageRows.slice(0, 5).map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedAssetId(row.id)}
                    className={[
                      'asset-row-selected rounded-md border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300 active:translate-y-px',
                      selectedAssetId === row.id ? '' : 'bg-white/[0.025] hover:bg-white/[0.05]',
                    ].join(' ')}
                  >
                    <span className="block truncate text-sm font-medium text-neutral-100">
                      {row.name}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] text-neutral-500">
                      {row.width ?? DEFAULT_IMAGE_WIDTH} x {row.height ?? DEFAULT_IMAGE_HEIGHT}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <MetricPanel
            title="Coverage"
            icon={ListChecks}
            metrics={[
              ['boxes', visibleAnnotations.length],
              ['manual', visibleAnnotations.filter((item) => item.source === 'MANUAL').length],
              ['model', visibleAnnotations.filter((item) => item.source === 'MODEL').length],
              ['queued', queuedCount + failedCount],
            ]}
          />
          <div className="inner-border-subtle bg-graphite-900/75 rounded-md shadow-panel">
            <div className="divider px-4 py-3">
              <h3 className="text-sm font-semibold text-neutral-100">Save queue</h3>
            </div>
            <div className="divide-y divide-graphite-200">
              {queue.length === 0 ? (
                <EmptyQueue />
              ) : (
                queue
                  .slice(-5)
                  .reverse()
                  .map((item) => <QueueRow key={item.id} item={item} />)
              )}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="inner-border-subtle bg-graphite-900/75 rounded-md shadow-panel">
          <div className="divider flex items-center justify-between gap-3 px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-100">Labels</h3>
            <span className="font-mono text-xs text-neutral-500">{workspace.labels.length}</span>
          </div>
          <div className="divide-y divide-graphite-200">
            {workspace.labels.map((label) => (
              <button
                key={label.id}
                type="button"
                title={label.name}
                aria-pressed={activeLabelId === label.id}
                onClick={() => {
                  setActiveLabelId(label.id);
                  if (selectedAnnotation) {
                    patchAnnotation(selectedAnnotation.id, { labelClassId: label.id });
                  }
                }}
                className={[
                  'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300 active:translate-y-px',
                  activeLabelId === label.id
                    ? 'bg-[oklch(0.8_0.13_152/0.1)]'
                    : 'hover:bg-white/[0.04]',
                ].join(' ')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-neutral-100">
                    {label.name}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">{label.id}</span>
                </span>
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: label.color }} />
              </button>
            ))}
          </div>
        </div>

        <div className="inner-border-subtle bg-graphite-900/75 rounded-md shadow-panel">
          <div className="divider px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-100">Selected box</h3>
          </div>
          {selectedAnnotation ? (
            <div className="space-y-3 p-4">
              <GeometryInput
                label="x"
                value={selectedAnnotation.geometry.x}
                onChange={(value) =>
                  patchAnnotation(selectedAnnotation.id, {
                    geometry: normalizeCanvasBox(
                      { ...selectedAnnotation.geometry, x: value },
                      selectedAsset.width,
                      selectedAsset.height
                    ),
                  })
                }
              />
              <GeometryInput
                label="y"
                value={selectedAnnotation.geometry.y}
                onChange={(value) =>
                  patchAnnotation(selectedAnnotation.id, {
                    geometry: normalizeCanvasBox(
                      { ...selectedAnnotation.geometry, y: value },
                      selectedAsset.width,
                      selectedAsset.height
                    ),
                  })
                }
              />
              <GeometryInput
                label="width"
                value={selectedAnnotation.geometry.width}
                onChange={(value) =>
                  patchAnnotation(selectedAnnotation.id, {
                    geometry: normalizeCanvasBox(
                      { ...selectedAnnotation.geometry, width: value },
                      selectedAsset.width,
                      selectedAsset.height
                    ),
                  })
                }
              />
              <GeometryInput
                label="height"
                value={selectedAnnotation.geometry.height}
                onChange={(value) =>
                  patchAnnotation(selectedAnnotation.id, {
                    geometry: normalizeCanvasBox(
                      { ...selectedAnnotation.geometry, height: value },
                      selectedAsset.width,
                      selectedAsset.height
                    ),
                  })
                }
              />
            </div>
          ) : (
            <p className="p-4 text-sm text-neutral-500">No box selected.</p>
          )}
        </div>

        <div className="inner-border-subtle bg-graphite-900/75 rounded-md shadow-panel">
          <div className="divider flex items-center justify-between gap-3 px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-100">Threshold</h3>
            <span className="btn-signal-outline px-2 py-1 font-mono text-xs">
              {(threshold / 100).toFixed(2)}
            </span>
          </div>
          <div className="p-4">
            <input
              aria-label="Confidence threshold"
              type="range"
              min="40"
              max="95"
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              style={thresholdRangeStyle(threshold)}
              className="threshold-range"
            />
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-neutral-500">
              <span>0.40</span>
              <span>0.95</span>
            </div>
          </div>
        </div>

        {lastSavedAt && (
          <p className="btn-signal-outline px-3 py-2 font-mono text-xs">
            saved {new Date(lastSavedAt).toLocaleTimeString()}
          </p>
        )}
      </aside>
    </div>
  );
}

function AnnotationBox({
  annotation,
  imageWidth,
  imageHeight,
  selected,
  reducedMotion,
  onSelect,
}: {
  annotation: AnnotationSummary;
  imageWidth: number;
  imageHeight: number;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      title={annotation.label}
      aria-label={annotation.label}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={[
        'annotation-box absolute rounded-sm border-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-signal-300',
        selected ? 'annotation-box-selected' : '',
      ].join(' ')}
      style={{
        ...boxStyle(annotation.geometry, imageWidth, imageHeight),
        borderColor: annotation.color,
      }}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: selected ? 1.015 : 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={motionTokens.springSoft}
    >
      <span
        className="absolute -top-6 left-0 max-w-36 truncate rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase text-graphite-950"
        style={{ backgroundColor: annotation.color }}
      >
        {annotation.label}
      </span>
      {selected && (
        <>
          <span className="annotation-handle -left-1 -top-1" />
          <span className="annotation-handle -right-1 -top-1" />
          <span className="annotation-handle -bottom-1 -left-1" />
          <span className="annotation-handle -bottom-1 -right-1" />
        </>
      )}
    </motion.button>
  );
}

function SourcePill({ state }: { state: SourceState }) {
  const tone = state === 'api' ? 'pill-signal' : state === 'loading' ? 'pill-scan' : 'pill-amber';

  return <span className={`pill-base ${tone}`}>{state === 'api' ? 'api' : state}</span>;
}

function IconButton({
  label,
  icon: Icon,
  active = false,
  danger = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: typeof Activity;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45',
        active
          ? 'tool-btn-signal-active'
          : danger
            ? 'tool-btn-red-active'
            : 'text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-200',
      ].join(' ')}
    >
      <Icon size={17} />
    </button>
  );
}

function MetricPanel({
  title,
  icon: Icon,
  metrics,
}: {
  title: string;
  icon: typeof Activity;
  metrics: Array<[string, number]>;
}) {
  return (
    <div className="inner-border-subtle bg-graphite-900/75 rounded-md shadow-panel">
      <div className="divider flex items-center gap-2 px-4 py-3">
        <Icon className="text-signal-300" size={17} weight="duotone" />
        <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 xl:grid-cols-2">
        {metrics.map(([label, value]) => (
          <div key={label} className="inner-border-subtle rounded-md bg-white/[0.03] p-3">
            <p className="font-mono text-[11px] uppercase text-neutral-500">{label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-signal-300">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueueRow({ item }: { item: QueueItem }) {
  const Icon =
    item.status === 'saved'
      ? CheckCircle
      : item.status === 'failed'
        ? WarningCircle
        : item.status === 'saving'
          ? CloudArrowUp
          : Stack;
  const tone =
    item.status === 'saved'
      ? 'text-signal-300'
      : item.status === 'failed'
        ? 'text-red-300'
        : item.status === 'saving'
          ? 'text-scan-300'
          : 'text-amber-300';

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className={tone} size={18} weight="duotone" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-100">{item.label}</p>
        <p className="mt-1 font-mono text-xs text-neutral-500">{item.status}</p>
        {item.error && <p className="mt-2 text-xs text-red-300">{item.error}</p>}
      </div>
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <CheckCircle className="text-signal-300" size={18} weight="duotone" />
      <div>
        <p className="text-sm font-medium text-neutral-100">No pending changes</p>
        <p className="mt-1 text-sm text-neutral-500">Annotation state is clean.</p>
      </div>
    </div>
  );
}

function GeometryInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3">
      <span className="font-mono text-xs uppercase text-neutral-500">{label}</span>
      <input
        type="number"
        min="0"
        value={Math.round(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="focus:ring-signal-300/40 min-w-0 rounded-md bg-graphite-950 px-3 py-2 font-mono text-sm text-neutral-100 outline-none transition focus:ring-2 focus:ring-offset-1 focus:ring-offset-graphite-950"
      />
    </label>
  );
}

function createFallbackWorkspace(
  projectId: string,
  datasetVersionId: string,
  annotations: AnnotationSummary[],
  assetId = 'asset_frame_1482'
): AnnotationWorkspaceResponse {
  const asset = createFallbackAsset(assetId);
  const labels = seedLabels(projectId);

  return {
    annotationSet: createFallbackAnnotationSet(datasetVersionId),
    asset,
    labels,
    annotations: annotations.filter((annotation) => annotation.assetId === asset.id),
    imageWidth: asset.width,
    imageHeight: asset.height,
  };
}

function createFallbackAnnotationSet(datasetVersionId: string) {
  return {
    id: `annset_${datasetVersionId.replace(/[^a-zA-Z0-9]+/g, '_')}_manual`,
    datasetVersionId,
    name: 'Manual QA Set',
    status: 'DRAFT' as const,
    createdAt: '2026-04-28T12:50:00.000Z',
  };
}

function seedLabels(projectId: string): AnnotationLabelSummary[] {
  return [
    { name: 'car', color: '#6ad9a1' },
    { name: 'van', color: '#5cc8ff' },
    { name: 'truck', color: '#f5b85d' },
    { name: 'person', color: '#f07178' },
  ].map((label) => ({
    id: `label_${projectId}_${label.name}`,
    projectId,
    name: label.name,
    color: label.color,
    type: 'BBOX',
  }));
}

function normalizeAsset(
  asset: AnnotationAssetSummary | AnnotationMediaRow
): AnnotationAssetSummary {
  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    width: asset.width ?? DEFAULT_IMAGE_WIDTH,
    height: asset.height ?? DEFAULT_IMAGE_HEIGHT,
    split: normalizeSplit(asset.split),
    status: normalizeStatus(asset.status),
  };
}

function createFallbackAsset(assetId: string): AnnotationAssetSummary {
  const asset = demoSnapshot.media.find((item) => item.id === assetId) ?? demoSnapshot.media[0];

  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    width: asset.width ?? DEFAULT_IMAGE_WIDTH,
    height: asset.height ?? DEFAULT_IMAGE_HEIGHT,
    split: asset.split,
    status: asset.status,
  };
}

function normalizeSplit(split: string): AnnotationAssetSummary['split'] {
  return split === 'TRAIN' || split === 'VALID' || split === 'TEST' || split === 'UNASSIGNED'
    ? split
    : 'UNASSIGNED';
}

function normalizeStatus(status: string): AnnotationAssetSummary['status'] {
  return status === 'indexed' ||
    status === 'queued' ||
    status === 'failed' ||
    status === 'duplicate'
    ? status
    : 'indexed';
}

function pointerToImagePoint(
  event: PointerEvent,
  element: HTMLElement,
  imageWidth: number,
  imageHeight: number
) {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * imageWidth;
  const y = ((event.clientY - rect.top) / rect.height) * imageHeight;

  return {
    x: Math.max(0, Math.min(imageWidth, x)),
    y: Math.max(0, Math.min(imageHeight, y)),
  };
}

function boxFromDrawing(drawing: DrawingState): BBoxGeometry {
  const x = Math.min(drawing.start.x, drawing.current.x);
  const y = Math.min(drawing.start.y, drawing.current.y);

  return {
    x,
    y,
    width: Math.abs(drawing.current.x - drawing.start.x),
    height: Math.abs(drawing.current.y - drawing.start.y),
  };
}

function normalizeCanvasBox(
  box: BBoxGeometry,
  imageWidth: number,
  imageHeight: number
): BBoxGeometry {
  const clamped = clampBBox(box, imageWidth, imageHeight);
  const width = Math.max(1, Math.round(Math.min(clamped.width, imageWidth)));
  const height = Math.max(1, Math.round(Math.min(clamped.height, imageHeight)));

  return {
    x: Math.max(0, Math.min(Math.round(clamped.x), imageWidth - width)),
    y: Math.max(0, Math.min(Math.round(clamped.y), imageHeight - height)),
    width,
    height,
  };
}

function thresholdRangeStyle(value: number): CSSProperties {
  return {
    '--threshold-progress': `${Math.max(0, Math.min(100, ((value - 40) / 55) * 100))}%`,
  } as CSSProperties;
}

function boxStyle(box: BBoxGeometry, imageWidth: number, imageHeight: number) {
  return {
    left: `${(box.x / imageWidth) * 100}%`,
    top: `${(box.y / imageHeight) * 100}%`,
    width: `${(box.width / imageWidth) * 100}%`,
    height: `${(box.height / imageHeight) * 100}%`,
  };
}

const DEFAULT_IMAGE_WIDTH = 1920;
const DEFAULT_IMAGE_HEIGHT = 1080;
