import {
  ActivityIcon as Activity,
  BoundingBoxIcon as BoundingBox,
  CheckCircleIcon as CheckCircle,
  DatabaseIcon as Database,
  GitBranchIcon as GitBranch,
  GraphIcon as Graph,
  ImageSquareIcon as ImageSquare,
  PlayIcon as Play,
  SlidersHorizontalIcon as SlidersHorizontal,
  StackIcon as Stack,
  TerminalWindowIcon as TerminalWindow,
  TimerIcon as Timer,
  UploadSimpleIcon as UploadSimple,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react";
import { Background, Controls, Edge, MarkerType, Node, Position, ReactFlow } from "@xyflow/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { InferenceJobStatus, MediaUploadStatus, validateMediaMime } from "@visionflow/contracts";
import { motionTokens } from "@visionflow/motion";
import { demoSnapshot, logs, pipelineValidation } from "./data/demo";
import { checksumFile, uploadMediaFile } from "./lib/media-upload";

type SectionId = "overview" | "media" | "datasets" | "annotate" | "pipeline" | "jobs";

type JobUiState = {
  status: InferenceJobStatus;
  progress: number;
  logCursor: number;
};

type MediaUploadRow = {
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO" | "FRAME";
  checksum: string;
  split: string;
  status: MediaUploadStatus | "hashing" | "uploading";
  progress: number;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  error?: string;
  processingJob?: string;
};

const sections: Array<{
  id: SectionId;
  label: string;
  icon: typeof Activity;
}> = [
  { id: "overview", label: "Command", icon: Activity },
  { id: "media", label: "Media", icon: ImageSquare },
  { id: "datasets", label: "Versions", icon: GitBranch },
  { id: "annotate", label: "Annotate", icon: BoundingBox },
  { id: "pipeline", label: "Pipeline", icon: Graph },
  { id: "jobs", label: "Jobs", icon: Timer },
];

export function App() {
  const [section, setSection] = useState<SectionId>("overview");
  const [threshold, setThreshold] = useState(62);
  const [selectedAnnotation, setSelectedAnnotation] = useState("ann_02");
  const [mediaUploads, setMediaUploads] = useState<MediaUploadRow[]>([]);
  const [job, setJob] = useState<JobUiState>({
    status: demoSnapshot.job.status,
    progress: demoSnapshot.job.progress,
    logCursor: 2,
  });

  useEffect(() => {
    if (job.status !== "RUNNING") {
      return;
    }

    const interval = window.setInterval(() => {
      setJob((current) => {
        const progress = Math.min(current.progress + 7, 100);

        return {
          status: progress >= 100 ? "SUCCEEDED" : "RUNNING",
          progress,
          logCursor: Math.min(logs.length, current.logCursor + 1),
        };
      });
    }, 560);

    return () => window.clearInterval(interval);
  }, [job.status]);

  const startJob = () => {
    setSection("jobs");
    setJob({
      status: "RUNNING",
      progress: 24,
      logCursor: 2,
    });
  };

  return (
    <div className="min-h-[100dvh] bg-graphite-950 text-neutral-100">
      <div className="app-grid min-h-[100dvh]">
        <NavRail active={section} onSelect={setSection} />
        <main className="min-w-0">
          <ShellHeader job={job} threshold={threshold} onRun={startJob} />
          <div className="mx-auto grid max-w-[1500px] gap-4 px-4 pb-5 pt-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0">
              <ReadinessStrip job={job} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: motionTokens.durationBase, ease: motionTokens.easeScan }}
                >
                  {section === "overview" && <OverviewPanel onRun={startJob} />}
                  {section === "media" && (
                    <MediaPanel uploads={mediaUploads} setUploads={setMediaUploads} />
                  )}
                  {section === "datasets" && <DatasetPanel />}
                  {section === "annotate" && (
                    <AnnotationPanel
                      selectedAnnotation={selectedAnnotation}
                      setSelectedAnnotation={setSelectedAnnotation}
                      threshold={threshold}
                      setThreshold={setThreshold}
                    />
                  )}
                  {section === "pipeline" && <PipelinePanel />}
                  {section === "jobs" && (
                    <JobsPanel job={job} threshold={threshold} onRun={startJob} />
                  )}
                </motion.div>
              </AnimatePresence>
            </section>
            <InspectorPanel
              active={section}
              selectedAnnotation={selectedAnnotation}
              threshold={threshold}
              setThreshold={setThreshold}
              job={job}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavRail({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (section: SectionId) => void;
}) {
  return (
    <aside className="nav-rail border-r border-white/10 bg-graphite-950/95 px-3 py-4">
      <div className="mb-6 flex h-10 items-center justify-center rounded-md border border-signal-300/30 bg-signal-300/10 text-signal-300">
        <BoundingBox size={21} weight="duotone" />
      </div>
      <nav className="flex flex-col gap-2" aria-label="VisionFlow workbench">
        {sections.map((item) => {
          const Icon = item.icon;
          const selected = item.id === active;

          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-pressed={selected}
              onClick={() => onSelect(item.id)}
              className={[
                "group relative flex h-11 items-center justify-center rounded-md border text-sm transition active:translate-y-px",
                selected
                  ? "border-signal-300/50 bg-signal-300/12 text-signal-300"
                  : "border-transparent text-neutral-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-neutral-200",
              ].join(" ")}
            >
              {selected && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-md border border-signal-300/30"
                  transition={motionTokens.springFast}
                />
              )}
              <Icon size={21} weight={selected ? "duotone" : "regular"} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function ShellHeader({
  job,
  threshold,
  onRun,
}: {
  job: JobUiState;
  threshold: number;
  onRun: () => void;
}) {
  return (
    <header className="border-b border-white/10 bg-graphite-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
            {demoSnapshot.project.id} / {demoSnapshot.project.datasetVersion}
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-neutral-100">
            VisionFlow Studio
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={job.status} />
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-neutral-300">
            threshold {(threshold / 100).toFixed(2)}
          </span>
          <button
            type="button"
            title="Run inference"
            aria-label="Run inference"
            onClick={onRun}
            className="inline-flex items-center gap-2 rounded-md bg-signal-300 px-3 py-2 text-sm font-semibold text-graphite-950 transition hover:bg-signal-400 active:translate-y-px"
          >
            <Play size={16} weight="fill" />
            Run
          </button>
        </div>
      </div>
    </header>
  );
}

function ReadinessStrip({ job }: { job: JobUiState }) {
  const items = [
    { label: "API", value: "OpenAPI ready", icon: CheckCircle, tone: "text-signal-300" },
    { label: "Schema", value: "Prisma domain mapped", icon: Database, tone: "text-scan-300" },
    {
      label: "Queue",
      value: job.status === "RUNNING" ? "Worker active" : "Redis standby",
      icon: Stack,
      tone: "text-amber-300",
    },
    { label: "CV", value: "Mock detector mounted", icon: Activity, tone: "text-neutral-300" },
  ];

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Icon className={item.tone} size={16} weight="duotone" />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                {item.label}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-200">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function OverviewPanel({ onRun }: { onRun: () => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
      <Panel className="overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                Active project
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-100">
                {demoSnapshot.project.name}
              </h2>
            </div>
            <button
              type="button"
              title="Run inference"
              aria-label="Run inference"
              onClick={onRun}
              className="inline-flex items-center gap-2 rounded-md border border-signal-300/40 bg-signal-300/10 px-3 py-2 text-sm font-medium text-signal-300 transition hover:bg-signal-300/15 active:translate-y-px"
            >
              <Play size={16} weight="fill" />
              Queue job
            </button>
          </div>
        </div>
        <div className="grid min-h-[480px] gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
            <VisionPreview />
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-neutral-100">Vertical slice</h3>
            <div className="mt-4 space-y-3">
              {[
                ["Upload", "20 assets indexed, checksum dedupe pending"],
                ["Version", "Dataset v1.3 locked with train/valid/test splits"],
                ["Annotate", "3 visible boxes, image-coordinate storage"],
                [
                  "Pipeline",
                  pipelineValidation.ok ? "Graph passes V1 validation" : "Graph needs review",
                ],
                ["Inference", "Mock detector path ready for async orchestration"],
                ["Evaluate", "Precision, recall, F1 surface seeded"],
              ].map(([label, value], index) => (
                <motion.div
                  key={label}
                  className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.035, duration: 0.2 }}
                >
                  <span className="font-mono text-xs text-scan-300">{label}</span>
                  <span className="text-sm text-neutral-300">{value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">System states</h2>
        </div>
        <div className="divide-y divide-white/10">
          <StateRow
            label="Loading"
            value="Skeleton rows match table density"
            tone="scan"
            icon={Activity}
          />
          <StateRow
            label="Empty"
            value="Dataset and media surfaces reserve first-run states"
            tone="neutral"
            icon={Stack}
          />
          <StateRow
            label="Error"
            value="Pipeline and job failures surface actionable messages"
            tone="amber"
            icon={WarningCircle}
          />
          <StateRow
            label="Reduced motion"
            value="Scan and flow effects collapse to static state color"
            tone="signal"
            icon={CheckCircle}
          />
        </div>
      </Panel>
    </div>
  );
}

function MediaPanel({
  uploads,
  setUploads,
}: {
  uploads: MediaUploadRow[];
  setUploads: Dispatch<SetStateAction<MediaUploadRow[]>>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const allRows = useMemo(() => [...uploads, ...seededMediaRows()], [uploads]);
  const queuedCount = uploads.filter(
    (row) => row.status === "uploading" || row.status === "hashing",
  ).length;
  const failedCount = uploads.filter((row) => row.status === "failed").length;
  const duplicateCount = uploads.filter((row) => row.status === "duplicate").length;

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = [...fileList];

    for (const file of files) {
      await ingestFile(file, allRows, setUploads);
    }
  };

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
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
            event.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          title="Upload media"
          aria-label="Upload media"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-200 transition hover:bg-white/[0.05] active:translate-y-px"
        >
          <UploadSimple size={16} />
          Upload
        </button>
      </div>
      <div className="grid gap-0 border-b border-white/10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <label
          className={[
            "m-4 flex min-h-44 cursor-pointer flex-col justify-between rounded-md border border-dashed p-4 transition",
            dragActive
              ? "border-signal-300 bg-signal-300/10"
              : "border-white/15 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.04]",
          ].join(" ")}
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
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-signal-300/30 bg-signal-300/10 text-signal-300">
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
              event.currentTarget.value = "";
            }}
          />
        </label>
        <div className="border-t border-white/10 p-4 lg:border-l lg:border-t-0">
          <h3 className="text-sm font-semibold text-neutral-100">Upload state</h3>
          <div className="mt-4 grid gap-2">
            <UploadStateMetric label="new queue" value={queuedCount} tone="scan" />
            <UploadStateMetric label="duplicates" value={duplicateCount} tone="signal" />
            <UploadStateMetric label="failed" value={failedCount} tone="amber" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
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
          <tbody className="divide-y divide-white/10">
            {allRows.map((asset) => (
              <tr key={asset.id} className="text-neutral-300">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-12 rounded border border-white/10 bg-[linear-gradient(135deg,rgba(106,217,161,0.16),rgba(92,200,255,0.08))]" />
                    <div>
                      <p className="font-medium text-neutral-100">{asset.name}</p>
                      <p className="font-mono text-xs text-neutral-500">{asset.id}</p>
                      {asset.error ? (
                        <p className="mt-1 max-w-[34ch] text-xs text-red-300">{asset.error}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {asset.width && asset.height
                    ? `${asset.width} x ${asset.height}`
                    : formatBytes(asset.sizeBytes)}
                </td>
                <td className="px-4 py-3">
                  <SplitPill split={asset.split} />
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

async function ingestFile(
  file: File,
  existingRows: MediaUploadRow[],
  setUploads: Dispatch<SetStateAction<MediaUploadRow[]>>,
) {
  const rowId = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    validateMediaMime(file.type);
  } catch {
    setUploads((current) => [
      {
        id: rowId,
        name: file.name,
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
        checksum: "invalid-mime",
        split: "UNASSIGNED",
        status: "failed",
        progress: 0,
        sizeBytes: file.size,
        width: null,
        height: null,
        error: `Unsupported MIME type: ${file.type || "unknown"}`,
      },
      ...current,
    ]);
    return;
  }

  setUploads((current) => [
    {
      id: rowId,
      name: file.name,
      type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
      checksum: "hashing",
      split: "UNASSIGNED",
      status: "hashing",
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
              status: "duplicate",
              progress: 100,
              error: "Checksum already exists in this project.",
            }
          : row,
      ),
    );
    return;
  }

  setUploads((current) =>
    current.map((row) =>
      row.id === rowId ? { ...row, checksum, status: "uploading", progress: 42 } : row,
    ),
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
              status: response.deduplicated ? "duplicate" : response.asset.status,
              progress: 100,
              sizeBytes: response.asset.sizeBytes,
              width: response.asset.width,
              height: response.asset.height,
              processingJob: response.processingJob?.type ?? undefined,
            }
          : row,
      ),
    );
  } catch (error) {
    setUploads((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              status: "failed",
              progress: 100,
              error: error instanceof Error ? error.message : String(error),
            }
          : row,
      ),
    );
  }
}

function seededMediaRows(): MediaUploadRow[] {
  return demoSnapshot.media.map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    checksum: asset.checksum,
    split: asset.split,
    status: asset.status,
    progress: asset.status === "queued" ? 64 : 100,
    sizeBytes: asset.sizeBytes ?? 1_486_400,
    width: asset.width,
    height: asset.height,
    processingJob: asset.status === "queued" ? "THUMBNAIL" : "complete",
  }));
}

function UploadStateMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "signal" | "scan" | "amber";
}) {
  const toneClass =
    tone === "signal" ? "text-signal-300" : tone === "scan" ? "text-scan-300" : "text-amber-300";

  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

function MediaStatusPill({ status }: { status: MediaUploadRow["status"] }) {
  const tone =
    status === "indexed"
      ? "border-signal-300/35 bg-signal-300/10 text-signal-300"
      : status === "uploading" || status === "hashing" || status === "queued"
        ? "border-scan-300/35 bg-scan-300/10 text-scan-300"
        : status === "duplicate"
          ? "border-amber-300/35 bg-amber-300/10 text-amber-300"
          : "border-red-300/35 bg-red-300/10 text-red-300";

  return <span className={`rounded-md border px-2 py-1 font-mono text-xs ${tone}`}>{status}</span>;
}

function UploadProgress({ row }: { row: MediaUploadRow }) {
  return (
    <div className="min-w-32">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={[
            "h-full",
            row.status === "failed"
              ? "bg-red-300"
              : row.status === "duplicate"
                ? "bg-amber-300"
                : "bg-signal-300",
          ].join(" ")}
          initial={false}
          animate={{ width: `${row.progress}%` }}
          transition={motionTokens.springSoft}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-neutral-500">
        {row.processingJob ?? (row.status === "indexed" ? "audit logged" : row.status)}
      </p>
    </div>
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

function DatasetPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel>
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Dataset versions</h2>
        </div>
        <div className="p-4">
          <div className="relative space-y-4 pl-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
            {[
              ["v1.1", "draft", "16 assets, 28 boxes"],
              ["v1.2", "locked", "18 assets, 36 boxes"],
              ["v1.3", "locked", "20 assets, 42 boxes"],
            ].map(([version, state, meta]) => (
              <div key={version} className="relative">
                <span className="absolute -left-[18px] top-1 h-3 w-3 rounded-full border border-signal-300 bg-graphite-950" />
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm text-neutral-100">{version}</span>
                    <span className="font-mono text-xs uppercase text-neutral-500">{state}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-400">{meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Version diff</h2>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <DiffMetric label="Added boxes" value="+9" tone="text-signal-300" />
          <DiffMetric label="Changed boxes" value="14" tone="text-scan-300" />
          <DiffMetric label="Rejected boxes" value="3" tone="text-red-300" />
        </div>
        <div className="border-t border-white/10 p-4">
          <div className="h-40 rounded-md border border-white/10 bg-[linear-gradient(90deg,rgba(106,217,161,0.12),rgba(245,184,93,0.08),rgba(248,113,113,0.1))] p-4">
            <div className="flex h-full items-end gap-2">
              {[42, 64, 38, 72, 54, 84, 49, 67, 58, 76].map((height, index) => (
                <motion.div
                  key={index}
                  className="w-full rounded-sm bg-signal-300/70"
                  initial={{ height: 8, opacity: 0.35 }}
                  animate={{ height: `${height}%`, opacity: 1 }}
                  transition={{ delay: index * 0.025, duration: 0.24 }}
                />
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function AnnotationPanel({
  selectedAnnotation,
  setSelectedAnnotation,
  threshold,
  setThreshold,
}: {
  selectedAnnotation: string;
  setSelectedAnnotation: (id: string) => void;
  threshold: number;
  setThreshold: (value: number) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Annotation workbench</h2>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              image coordinates, 1920 x 1080
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ToolButton label="Pan" icon={SlidersHorizontal} active />
            <ToolButton label="BBox" icon={BoundingBox} active={false} />
          </div>
        </div>
        <VisionPreview
          selectedAnnotation={selectedAnnotation}
          onSelectAnnotation={setSelectedAnnotation}
        />
      </Panel>
      <Panel>
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Labels</h2>
        </div>
        <div className="divide-y divide-white/10">
          {demoSnapshot.annotations.map((annotation) => (
            <button
              key={annotation.id}
              type="button"
              onClick={() => setSelectedAnnotation(annotation.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04] active:translate-y-px"
            >
              <span>
                <span className="block text-sm font-medium text-neutral-100">
                  {annotation.label}
                </span>
                <span className="font-mono text-xs text-neutral-500">{annotation.id}</span>
              </span>
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: annotation.color }} />
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 p-4">
          <label className="block text-sm font-medium text-neutral-200" htmlFor="threshold">
            Confidence threshold
          </label>
          <input
            id="threshold"
            type="range"
            min="40"
            max="95"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="mt-3 w-full accent-[oklch(80%_0.13_152)]"
          />
          <p className="mt-2 font-mono text-xs text-neutral-500">{(threshold / 100).toFixed(2)}</p>
        </div>
      </Panel>
    </div>
  );
}

function PipelinePanel() {
  const nodes = useMemo<Node[]>(
    () => [
      node("input", "Input", "MediaAsset stream", 0, 90, "signal"),
      node("resize", "Resize", "960px width", 210, 40, "neutral"),
      node("detector", "Detector", "model_onnx_parking", 430, 90, "scan"),
      node("nms", "NMS", "IoU 0.45", 660, 40, "neutral"),
      node("output", "Output", "Predictions", 875, 90, "signal"),
    ],
    [],
  );

  const edges = useMemo<Edge[]>(
    () => [
      edge("e1", "input", "resize"),
      edge("e2", "resize", "detector", true),
      edge("e3", "detector", "nms", true),
      edge("e4", "nms", "output"),
    ],
    [],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Visual pipeline</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Input, resize, detector, NMS, and output validation.
          </p>
        </div>
        <div className="h-[560px] bg-graphite-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
          >
            <Background color="rgba(255,255,255,0.08)" gap={22} size={1} />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>
      </Panel>
      <Panel>
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Graph checks</h2>
        </div>
        <div className="divide-y divide-white/10">
          {pipelineValidation.ok
            ? [
                "Exactly one input",
                "Exactly one output",
                "No cycles",
                "Detector model bound",
                "All nodes connected",
              ].map((label) => (
                <StateRow key={label} label={label} value="pass" tone="signal" icon={CheckCircle} />
              ))
            : pipelineValidation.errors.map((error) => (
                <StateRow
                  key={error}
                  label="Invalid"
                  value={error}
                  tone="amber"
                  icon={WarningCircle}
                />
              ))}
        </div>
      </Panel>
    </div>
  );
}

function JobsPanel({
  job,
  threshold,
  onRun,
}: {
  job: JobUiState;
  threshold: number;
  onRun: () => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Panel>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Inference job</h2>
            <p className="mt-1 font-mono text-xs text-neutral-500">{demoSnapshot.job.id}</p>
          </div>
          <button
            type="button"
            title="Run inference"
            aria-label="Run inference"
            onClick={onRun}
            className="inline-flex items-center gap-2 rounded-md border border-signal-300/40 bg-signal-300/10 px-3 py-2 text-sm font-medium text-signal-300 transition hover:bg-signal-300/15 active:translate-y-px"
          >
            <Play size={16} weight="fill" />
            Run
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <StatusPill status={job.status} />
            <span className="font-mono text-sm text-neutral-300">{job.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-signal-300"
              initial={false}
              animate={{ width: `${job.progress}%` }}
              transition={motionTokens.springSoft}
            />
          </div>
          <div className="mt-5 rounded-md border border-white/10 bg-graphite-950 p-3 font-mono text-xs text-neutral-400">
            {logs.slice(0, job.logCursor).map((line) => (
              <p key={line} className="py-1">
                {line}
              </p>
            ))}
          </div>
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Prediction overlay</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Ground truth and mock detector boxes at threshold {(threshold / 100).toFixed(2)}.
          </p>
        </div>
        <VisionPreview selectedAnnotation="ann_02" running={job.status === "RUNNING"} />
      </Panel>
    </div>
  );
}

function InspectorPanel({
  active,
  selectedAnnotation,
  threshold,
  setThreshold,
  job,
}: {
  active: SectionId;
  selectedAnnotation: string;
  threshold: number;
  setThreshold: (value: number) => void;
  job: JobUiState;
}) {
  const annotation = demoSnapshot.annotations.find((item) => item.id === selectedAnnotation);

  return (
    <aside className="space-y-4">
      <Panel>
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Inspector</h2>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
            {active}
          </p>
        </div>
        <div className="divide-y divide-white/10">
          <InfoRow label="Project" value={demoSnapshot.project.name} />
          <InfoRow label="Dataset" value={demoSnapshot.project.datasetVersion} />
          <InfoRow label="Assets" value={String(demoSnapshot.project.assetCount)} />
          <InfoRow label="Job" value={`${job.status} ${job.progress}%`} />
        </div>
      </Panel>
      <Panel>
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Coordinate contract</h2>
        </div>
        {annotation ? (
          <div className="space-y-3 p-4">
            <MetricLine label="x" value={annotation.geometry.x} />
            <MetricLine label="y" value={annotation.geometry.y} />
            <MetricLine label="width" value={annotation.geometry.width} />
            <MetricLine label="height" value={annotation.geometry.height} />
          </div>
        ) : (
          <p className="p-4 text-sm text-neutral-500">No annotation selected.</p>
        )}
      </Panel>
      <Panel>
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Threshold</h2>
        </div>
        <div className="p-4">
          <input
            aria-label="Confidence threshold"
            type="range"
            min="40"
            max="95"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="w-full accent-[oklch(80%_0.13_152)]"
          />
          <p className="mt-2 font-mono text-xs text-neutral-500">{(threshold / 100).toFixed(2)}</p>
        </div>
      </Panel>
    </aside>
  );
}

function VisionPreview({
  selectedAnnotation = "ann_02",
  onSelectAnnotation,
  running = false,
}: {
  selectedAnnotation?: string;
  onSelectAnnotation?: (id: string) => void;
  running?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="vision-stage relative min-h-[420px] overflow-hidden bg-graphite-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(106,217,161,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.055),transparent_38%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(5,13,12,0.94),transparent)]" />
      <div className="absolute left-[8%] top-[22%] h-[42%] w-[84%] rounded-md border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]">
        <div className="absolute inset-x-0 top-[55%] border-t border-dashed border-white/10" />
        <div className="absolute bottom-[18%] left-[7%] h-[12%] w-[86%] rounded-sm bg-white/[0.025]" />
        {demoSnapshot.annotations.map((annotation) => {
          const selected = annotation.id === selectedAnnotation;
          const style = {
            left: `${(annotation.geometry.x / 1920) * 100}%`,
            top: `${(annotation.geometry.y / 1080) * 100}%`,
            width: `${(annotation.geometry.width / 1920) * 100}%`,
            height: `${(annotation.geometry.height / 1080) * 100}%`,
            borderColor: annotation.color,
          };

          return (
            <motion.button
              key={annotation.id}
              type="button"
              title={annotation.label}
              aria-label={annotation.label}
              onClick={() => onSelectAnnotation?.(annotation.id)}
              className={[
                "bbox absolute rounded-sm border-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-signal-300",
                selected ? "bbox-selected" : "",
              ].join(" ")}
              style={style}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: selected ? 1.02 : 1 }}
              transition={motionTokens.springSoft}
            >
              <span
                className="absolute -top-6 left-0 rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-950"
                style={{ backgroundColor: annotation.color }}
              >
                {annotation.label}
              </span>
            </motion.button>
          );
        })}
        {(running || !shouldReduceMotion) && <div className="scanline" />}
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-graphite-950/80 px-3 py-2 backdrop-blur">
        <span className="font-mono text-xs text-neutral-400">asset_frame_1482 / 1920 x 1080</span>
        <span className="font-mono text-xs text-signal-300">image-coordinate mode</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: InferenceJobStatus }) {
  const tone =
    status === "SUCCEEDED"
      ? "border-signal-300/40 bg-signal-300/10 text-signal-300"
      : status === "RUNNING"
        ? "border-scan-300/40 bg-scan-300/10 text-scan-300"
        : status === "FAILED"
          ? "border-red-300/40 bg-red-300/10 text-red-300"
          : "border-amber-300/40 bg-amber-300/10 text-amber-300";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-md border border-white/10 bg-graphite-900/75 shadow-panel ${className}`}
    >
      {children}
    </div>
  );
}

function StateRow({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "signal" | "scan" | "amber" | "neutral";
  icon: typeof Activity;
}) {
  const toneClass =
    tone === "signal"
      ? "text-signal-300"
      : tone === "scan"
        ? "text-scan-300"
        : tone === "amber"
          ? "text-amber-300"
          : "text-neutral-400";

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className={toneClass} size={18} weight="duotone" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-100">{label}</p>
        <p className="mt-1 text-sm text-neutral-500">{value}</p>
      </div>
    </div>
  );
}

function SplitPill({ split }: { split: string }) {
  return (
    <span className="rounded-md border border-white/10 bg-white/[0.035] px-2 py-1 font-mono text-xs text-neutral-300">
      {split}
    </span>
  );
}

function DiffMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={`mt-3 font-mono text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function ToolButton({
  label,
  icon: Icon,
  active,
}: {
  label: string;
  icon: typeof Activity;
  active: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-md border transition active:translate-y-px",
        active
          ? "border-signal-300/45 bg-signal-300/10 text-signal-300"
          : "border-white/10 text-neutral-400 hover:bg-white/[0.05]",
      ].join(" ")}
    >
      <Icon size={17} />
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 px-4 py-3 text-sm">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className="truncate text-neutral-200">{value}</span>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <span className="font-mono text-sm text-neutral-100">{value}</span>
    </div>
  );
}

function node(
  id: string,
  label: string,
  caption: string,
  x: number,
  y: number,
  tone: "signal" | "scan" | "neutral",
): Node {
  const color =
    tone === "signal" ? "#6ad9a1" : tone === "scan" ? "#5cc8ff" : "rgba(255,255,255,0.48)";

  return {
    id,
    position: { x, y },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      label: (
        <div className="min-w-[150px] rounded-md border border-white/10 bg-graphite-900 px-3 py-2 shadow-panel">
          <p className="text-sm font-semibold text-neutral-100">{label}</p>
          <p className="mt-1 font-mono text-[11px] text-neutral-500">{caption}</p>
          <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: color }} />
        </div>
      ),
    },
    style: {
      background: "transparent",
      border: "none",
      padding: 0,
      color: "inherit",
    },
  };
}

function edge(id: string, source: string, target: string, animated = false): Edge {
  return {
    id,
    source,
    target,
    animated,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: animated ? "#5cc8ff" : "rgba(255,255,255,0.45)",
    },
    style: {
      stroke: animated ? "#5cc8ff" : "rgba(255,255,255,0.38)",
      strokeWidth: animated ? 2 : 1.4,
    },
  };
}
