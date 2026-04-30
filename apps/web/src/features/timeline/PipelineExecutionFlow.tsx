import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  PlayIcon as Play,
  ArrowDownIcon as ArrowDown,
  ArrowClockwiseIcon as ArrowClockwise,
  TerminalWindowIcon as TerminalWindow,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

type PipelineNodeId = "input" | "resize" | "detector" | "nms" | "output";

type NodeState = "idle" | "running" | "complete" | "error";

type PipelineNodeDef = {
  id: PipelineNodeId;
  label: string;
  sublabel: string;
  duration: number;
  color: string;
};

const PIPELINE_NODES: PipelineNodeDef[] = [
  { id: "input", label: "Input", sublabel: "media stream", duration: 10, color: "oklch(80% 0.13 152)" },
  { id: "resize", label: "Resize", sublabel: "960px width", duration: 8, color: "oklch(79% 0.12 190)" },
  { id: "detector", label: "Detector", sublabel: "mock_onnx", duration: 45, color: "oklch(79% 0.12 190)" },
  { id: "nms", label: "NMS", sublabel: "iou 0.45", duration: 3, color: "oklch(79% 0.12 190)" },
  { id: "output", label: "Output", sublabel: "predictions", duration: 1, color: "oklch(80% 0.13 152)" },
];

const DEMO_LOGS: Record<PipelineNodeId, { timestamp: number; message: string }[]> = {
  input: [
    { timestamp: 0, message: "Node input: resolved 20 media assets" },
  ],
  resize: [
    { timestamp: 12, message: "Node resize: output 1920x1080 → 960x540" },
  ],
  detector: [
    { timestamp: 22, message: "Node detector: mock_detector dispatched" },
    { timestamp: 55, message: "Node detector: 12 raw detections" },
  ],
  nms: [
    { timestamp: 63, message: "Node nms: 12 detections → 4 after threshold" },
  ],
  output: [
    { timestamp: 66, message: "Node output: 4 predictions emitted" },
  ],
};

type ExecutionStatus = "idle" | "running" | "complete";

type Props = {
  onExecutionComplete?: () => void;
};

export function PipelineExecutionFlow({ onExecutionComplete }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [nodeStates, setNodeStates] = useState<Record<PipelineNodeId, NodeState>>({
    input: "idle",
    resize: "idle",
    detector: "idle",
    nms: "idle",
    output: "idle",
  });
  const [nodeElapsed, setNodeElapsed] = useState<Record<PipelineNodeId, number>>({
    input: 0,
    resize: 0,
    detector: 0,
    nms: 0,
    output: 0,
  });
  const [logsOpen, setLogsOpen] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState<Array<{ timestamp: number; message: string }>>([]);

  const resetExecution = useCallback(() => {
    setStatus("idle");
    setNodeStates({
      input: "idle",
      resize: "idle",
      detector: "idle",
      nms: "idle",
      output: "idle",
    });
    setNodeElapsed({ input: 0, resize: 0, detector: 0, nms: 0, output: 0 });
    setVisibleLogs([]);
  }, []);

  const simulateExecution = useCallback(() => {
    resetExecution();
    setStatus("running");

    const nodes = ["input", "resize", "detector", "nms", "output"] as PipelineNodeId[];
    let currentNodeIndex = 0;
    let totalElapsed = 0;
    const newLogs: Array<{ timestamp: number; message: string }> = [];

    const advanceNode = () => {
      if (currentNodeIndex >= nodes.length) {
        setStatus("complete");
        onExecutionComplete?.();
        return;
      }

      const nodeId = nodes[currentNodeIndex];
      const nodeDef = PIPELINE_NODES.find((n) => n.id === nodeId)!;

      setNodeStates((prev) => ({ ...prev, [nodeId]: "running" }));

      let nodeElapsed = 0;
      const elapsedInterval = setInterval(() => {
        nodeElapsed += 10;
        totalElapsed += 10;
        setNodeElapsed((prev) => ({ ...prev, [nodeId]: nodeElapsed }));

        const newNodeLogs = DEMO_LOGS[nodeId].filter(
          (log) => log.timestamp >= totalElapsed - nodeElapsed && log.timestamp < totalElapsed
        );
        newNodeLogs.forEach((log) => {
          if (!newLogs.some((l) => l.timestamp === log.timestamp && l.message === log.message)) {
            newLogs.push({ timestamp: totalElapsed, message: log.message });
            setVisibleLogs([...newLogs]);
          }
        });
      }, 10);

      setTimeout(() => {
        clearInterval(elapsedInterval);
        setNodeElapsed((prev) => ({ ...prev, [nodeId]: nodeDef.duration }));
        setNodeStates((prev) => ({ ...prev, [nodeId]: "complete" }));
        currentNodeIndex++;
        advanceNode();
      }, nodeDef.duration * 10);
    };

    advanceNode();
  }, [resetExecution, onExecutionComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "idle") {
        simulateExecution();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === "complete") {
      const timer = setTimeout(() => {
        simulateExecution();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, simulateExecution]);

  const getNodeClasses = (nodeId: PipelineNodeId, state: NodeState) => {
    const base = "execution-node-card relative flex flex-col items-center justify-center rounded-md transition-all duration-200";

    if (state === "idle") {
      return `${base} bg-graphite-900/50 text-neutral-500 inner-border-subtle`;
    }
    if (state === "running") {
      return `${base} bg-scan-300/10 text-scan-300 running-node`;
    }
    if (state === "complete") {
      return `${base} bg-signal-300/10 text-signal-300 inner-border-complete`;
    }
    return `${base} bg-red-300/10 text-red-300 inner-border-error`;
  };

  return (
    <>
      <motion.div
        className="rounded-md bg-graphite-900/75 shadow-panel inner-border-subtle overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="divider px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Pipeline execution</h3>
            <p className="mt-1 font-mono text-[11px] text-neutral-500">
              {PIPELINE_NODES.length} nodes / sequential
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`execution-status-pill execution-status-${status}`}>
              {status}
            </span>
            {status === "idle" && (
              <button
                type="button"
                onClick={simulateExecution}
                className="execution-ctrl-btn execution-ctrl-btn-primary"
              >
                <Play size={14} weight="fill" />
                Simulate
              </button>
            )}
            {status === "complete" && (
              <button
                type="button"
                onClick={resetExecution}
                className="execution-ctrl-btn execution-ctrl-btn-muted"
              >
                <ArrowClockwise size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-center gap-0">
            {PIPELINE_NODES.map((node, index) => {
              const state = nodeStates[node.id];
              const showFlow = state === "running" && index < PIPELINE_NODES.length - 1;

              return (
                <div key={node.id} className="flex items-center">
                  <motion.div
                    className={getNodeClasses(node.id, state)}
                    animate={state === "complete" && !shouldReduceMotion ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-[11px] font-mono font-semibold tracking-tight">
                      {node.label}
                    </span>
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-md"
                      style={{ backgroundColor: node.color }}
                    />
                  </motion.div>

                  {index < PIPELINE_NODES.length - 1 && (
                    <svg
                      width="48"
                      height="20"
                      viewBox="0 0 48 20"
                      className="mx-1 overflow-visible"
                    >
                      <line
                        x1="0"
                        y1="10"
                        x2="40"
                        y2="10"
                        stroke={showFlow ? "oklch(78% 0.12 205)" : "oklch(94% 0.006 180 / 0.2)"}
                        strokeWidth="1.5"
                        className={showFlow ? "flowing-edge" : ""}
                      />
                      <polygon
                        points="38,6 44,10 38,14"
                        fill={showFlow ? "oklch(78% 0.12 205)" : "oklch(94% 0.006 180 / 0.2)"}
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-start justify-center mt-4 gap-[72px]">
            {PIPELINE_NODES.map((node) => {
              const state = nodeStates[node.id];
              const elapsed = nodeElapsed[node.id];
              const displayMs = state === "running" ? elapsed : node.duration;

              return (
                <div key={node.id} className="flex flex-col items-center w-[72px]">
                  <span
                    className={`font-mono text-[10px] ${
                      state === "running"
                        ? "text-scan-300"
                        : state === "complete"
                          ? "text-signal-300"
                          : state === "error"
                            ? "text-red-300"
                            : "text-neutral-500"
                    }`}
                  >
                    {displayMs}ms
                  </span>
                  <div className="mt-1 h-px w-8 bg-graphite-200/30" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="divider-top">
          <button
            type="button"
            onClick={() => setLogsOpen(!logsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <TerminalWindow size={16} className="text-neutral-500" />
              <span className="text-sm text-neutral-300">Worker logs</span>
              {visibleLogs.length > 0 && (
                <span className="font-mono text-[10px] text-scan-300">
                  {visibleLogs.length} entries
                </span>
              )}
            </div>
            <motion.div
              animate={{ rotate: logsOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowDown size={16} className="text-neutral-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {logsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="logs-scroll bg-graphite-950 mx-4 mb-4 rounded-md p-3 max-h-[120px] overflow-y-auto">
                  {visibleLogs.length === 0 ? (
                    <p className="font-mono text-[11px] text-neutral-500">Waiting for execution...</p>
                  ) : (
                    visibleLogs.map((log, idx) => (
                      <motion.p
                        key={`${log.timestamp}-${idx}`}
                        className="font-mono text-[11px] text-neutral-400 py-0.5"
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <span className="text-scan-300/60">[{log.timestamp}ms]</span> {log.message}
                      </motion.p>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
