"use client";

import { useEffect, useState } from "react";
import {
  convertGeneratedDocumentPdf,
  getGeneratedDocumentDownloadUrl,
  getGeneratedDocumentPreExportConfig,
  renderGeneratedDocumentDocx,
  saveGeneratedDocumentPreExportConfig,
  scanGeneratedDocumentPreExportBlankCandidates,
  type GeneratedDocumentExportResponse,
  type GeneratedDocumentPreExportBlankCandidate,
  type GeneratedDocumentPreExportConfig,
  type GeneratedDocumentPreExportManualBlankField,
  type GeneratedDocumentPreExportStyleRule,
} from "@/lib/generated-documents-api";

type Props = {
  documentId: string;
  onFilesChanged?: () => Promise<void> | void;
};

type BusyAction = "loading" | "saving" | "preview" | "word" | "pdf" | "scan" | null;

const PAGE_SETUP_NUMBER_FIELDS: Array<{
  key: "topCm" | "bottomCm" | "leftCm" | "rightCm" | "gutterCm";
  label: string;
}> = [
  { key: "topCm", label: "Lề trên" },
  { key: "bottomCm", label: "Lề dưới" },
  { key: "leftCm", label: "Lề trái" },
  { key: "rightCm", label: "Lề phải" },
  { key: "gutterCm", label: "Gáy" },
];

const DEFAULT_CONFIG: GeneratedDocumentPreExportConfig = {
  version: 1,
  pageSetup: {
    enabled: false,
    topCm: 2,
    bottomCm: 2,
    leftCm: 3,
    rightCm: 2,
    gutterCm: 0,
    gutterPosition: "left",
    orientation: "portrait",
    paperSize: "A4",
  },
  styleRules: [
    {
      id: "preset_agency_area_7",
      enabled: false,
      targetText: "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
      applyToAll: true,
      style: {
        fontFamily: "Times New Roman",
        fontSize: 13,
        bold: true,
        italic: false,
        underline: false,
        alignment: "center",
      },
    },
    {
      id: "preset_header_agency",
      enabled: false,
      targetText: "VIỆN KIỂM SÁT NHÂN DÂN",
      applyToAll: true,
      style: {
        fontFamily: "Times New Roman",
        fontSize: 13,
        bold: false,
        italic: false,
        underline: false,
        alignment: "center",
      },
    },
    {
      id: "preset_header_number",
      enabled: false,
      targetText: "Số:",
      applyToAll: true,
      style: {
        fontFamily: "Times New Roman",
        fontSize: 13,
        bold: false,
        italic: false,
        underline: false,
        alignment: null,
      },
    },
  ],
  manualBlankFields: [],
};

function cloneDefaultConfig(): GeneratedDocumentPreExportConfig {
  return {
    version: 1,
    pageSetup: { ...DEFAULT_CONFIG.pageSetup },
    styleRules: DEFAULT_CONFIG.styleRules.map((rule) => ({
      ...rule,
      style: { ...rule.style },
    })),
    manualBlankFields: [],
  };
}

function createManualFieldFromCandidate(
  candidate: GeneratedDocumentPreExportBlankCandidate,
): GeneratedDocumentPreExportManualBlankField {
  return {
    id: candidate.id,
    enabled: candidate.defaultEnabled,
    label: candidate.label,
    value: "",
    contextBefore: candidate.contextBefore,
    contextAfter: candidate.contextAfter,
    occurrenceKey: candidate.occurrenceKey,
  };
}

function mergeManualBlankFields(
  config: GeneratedDocumentPreExportConfig,
  candidates: GeneratedDocumentPreExportBlankCandidate[],
): GeneratedDocumentPreExportConfig {
  const savedByOccurrence = new Map(
    config.manualBlankFields.map((field) => [field.occurrenceKey, field]),
  );
  const merged: GeneratedDocumentPreExportManualBlankField[] = [];

  for (const candidate of candidates) {
    const saved = savedByOccurrence.get(candidate.occurrenceKey);

    merged.push(
      saved
        ? {
            ...saved,
            label: saved.label || candidate.label,
            contextBefore: candidate.contextBefore,
            contextAfter: candidate.contextAfter,
          }
        : createManualFieldFromCandidate(candidate),
    );
    savedByOccurrence.delete(candidate.occurrenceKey);
  }

  for (const leftover of savedByOccurrence.values()) {
    merged.push(leftover);
  }

  return {
    ...config,
    manualBlankFields: merged,
  };
}

function createStyleRule(): GeneratedDocumentPreExportStyleRule {
  return {
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    enabled: true,
    targetText: "",
    applyToAll: true,
    style: {
      fontFamily: "Times New Roman",
      fontSize: 13,
      bold: false,
      italic: false,
      underline: false,
      alignment: null,
    },
  };
}

function withCacheBuster(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mergeWarnings(...warningGroups: Array<string[] | undefined>): string[] {
  return Array.from(
    new Set(
      warningGroups.flatMap((group) => group ?? []).filter((item) => item.trim()),
    ),
  );
}

export function PreExportCustomizationPanel({
  documentId,
  onFilesChanged,
}: Props) {
  const [config, setConfig] = useState<GeneratedDocumentPreExportConfig | null>(null);
  const [blankCandidates, setBlankCandidates] = useState<
    GeneratedDocumentPreExportBlankCandidate[]
  >([]);
  const [busyAction, setBusyAction] = useState<BusyAction>("loading");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadState() {
      if (!active) {
        return;
      }

      setBusyAction("loading");
      setError(null);
      setWarnings([]);

      try {
        const [configResponse, scanResponse] = await Promise.all([
          getGeneratedDocumentPreExportConfig(documentId),
          scanGeneratedDocumentPreExportBlankCandidates(documentId),
        ]);

        if (!active) {
          return;
        }

        setConfig(
          mergeManualBlankFields(configResponse.config, scanResponse.candidates),
        );
        setBlankCandidates(scanResponse.candidates);
        setWarnings(
          mergeWarnings(configResponse.warnings, scanResponse.warnings),
        );
      } catch (loadError) {
        if (!active) {
          return;
        }

        setConfig(cloneDefaultConfig());
        setBlankCandidates([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không tải được tùy chỉnh trước khi xuất.",
        );
      } finally {
        if (active) {
          setBusyAction(null);
        }
      }
    }

    void loadState();

    return () => {
      active = false;
    };
  }, [documentId]);

  async function saveCurrentConfig(
    nextConfig: GeneratedDocumentPreExportConfig,
    action: BusyAction = "saving",
  ) {
    setBusyAction(action);
    setError(null);
    setSuccessMessage(null);

    const response = await saveGeneratedDocumentPreExportConfig(
      documentId,
      nextConfig,
    );
    setConfig(response.config);
    setWarnings(response.warnings);
    return response;
  }

  async function handleSave() {
    if (!config) {
      return;
    }

    try {
      const response = await saveCurrentConfig(config, "saving");
      setConfig(response.config);
      setWarnings(response.warnings);
      setSuccessMessage("Đã lưu tùy chỉnh.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không lưu được tùy chỉnh.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRescanBlanks() {
    if (!config) {
      return;
    }

    try {
      setBusyAction("scan");
      setError(null);
      setSuccessMessage(null);

      const response = await scanGeneratedDocumentPreExportBlankCandidates(
        documentId,
      );
      const mergedConfig = mergeManualBlankFields(config, response.candidates);

      setBlankCandidates(response.candidates);
      setConfig(mergedConfig);
      setWarnings(response.warnings);
      setSuccessMessage("Đã quét lại chỗ trống.");
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Không quét lại được chỗ trống.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function refreshFiles() {
    if (onFilesChanged) {
      await onFilesChanged();
    }
  }

  function openExportedFile(
    response: GeneratedDocumentExportResponse,
    format: "DOCX" | "PDF",
  ) {
    const fileId = response.file?.id;

    if (!fileId) {
      return;
    }

    const downloadUrl = getGeneratedDocumentDownloadUrl(documentId, fileId);
    const url =
      format === "PDF" ? withCacheBuster(downloadUrl) : downloadUrl;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function runExportAction(
    action: Extract<BusyAction, "preview" | "word" | "pdf">,
    message: string,
    execute: () => Promise<GeneratedDocumentExportResponse>,
    options?: {
      openFile?: boolean;
      format?: "DOCX" | "PDF";
    },
  ) {
    if (!config) {
      return;
    }

    try {
      const savedResponse = await saveCurrentConfig(config, action);
      const response = await execute();

      setConfig(savedResponse.config);
      setWarnings(mergeWarnings(savedResponse.warnings, response.warnings));
      setSuccessMessage(message);

      await refreshFiles();

      if (options?.openFile && options.format) {
        openExportedFile(response, options.format);
      }
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Không thực hiện được thao tác xuất file.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function updatePageSetup<
    Key extends keyof GeneratedDocumentPreExportConfig["pageSetup"],
  >(key: Key, value: GeneratedDocumentPreExportConfig["pageSetup"][Key]) {
    setConfig((current) =>
      current
        ? {
            ...current,
            pageSetup: {
              ...current.pageSetup,
              [key]: value,
            },
          }
        : current,
    );
  }

  function updateStyleRule(
    ruleId: string,
    updater: (rule: GeneratedDocumentPreExportStyleRule) => GeneratedDocumentPreExportStyleRule,
  ) {
    setConfig((current) =>
      current
        ? {
            ...current,
            styleRules: current.styleRules.map((rule) =>
              rule.id === ruleId ? updater(rule) : rule,
            ),
          }
        : current,
    );
  }

  function removeStyleRule(ruleId: string) {
    setConfig((current) =>
      current
        ? {
            ...current,
            styleRules: current.styleRules.filter((rule) => rule.id !== ruleId),
          }
        : current,
    );
  }

  function updateManualBlankField(
    occurrenceKey: string,
    updater: (
      field: GeneratedDocumentPreExportManualBlankField,
    ) => GeneratedDocumentPreExportManualBlankField,
  ) {
    setConfig((current) =>
      current
        ? {
            ...current,
            manualBlankFields: current.manualBlankFields.map((field) =>
              field.occurrenceKey === occurrenceKey ? updater(field) : field,
            ),
          }
        : current,
    );
  }

  function resetToDefaults() {
    setConfig((current) => {
      const next = mergeManualBlankFields(cloneDefaultConfig(), blankCandidates);

      if (!current) {
        return next;
      }

      return {
        ...next,
        manualBlankFields: next.manualBlankFields.map((field) => {
          const existing = current.manualBlankFields.find(
            (item) => item.occurrenceKey === field.occurrenceKey,
          );

          return existing
            ? {
                ...field,
                label: existing.label || field.label,
              }
            : field;
        }),
      };
    });
    setWarnings([]);
    setError(null);
    setSuccessMessage("Đã đưa màn hình về mặc định. Nhấn Lưu tùy chỉnh nếu muốn lưu.");
  }

  if (!config) {
    return (
      <section className="mb-5 rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Đang tải tùy chỉnh trước khi xuất...</p>
      </section>
    );
  }

  const isBusy = busyAction !== null;

  return (
    <section className="mb-5 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tùy chỉnh trước khi xuất
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Tùy chỉnh trước khi xuất
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nếu không nhập, hệ thống sẽ giữ nguyên biểu mẫu gốc.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          disabled={isBusy}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {showAdvanced ? "Ẩn chỉnh chữ" : "Mở thêm chỉnh chữ"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {warnings.length ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">Lưu ý</p>
          <div className="mt-1 space-y-1">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Chỉnh lề</h4>
              <p className="mt-1 text-xs text-slate-500">
                Chỉ áp dụng khi bật mục này.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={config.pageSetup.enabled}
                onChange={(event) =>
                  updatePageSetup("enabled", event.target.checked)
                }
                disabled={isBusy}
                className="h-4 w-4 rounded border-slate-300"
              />
              Sử dụng
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {PAGE_SETUP_NUMBER_FIELDS.map(({ key, label }) => (
              <label
                key={key}
                className="flex flex-col gap-1 text-sm text-slate-700"
              >
                <span>{label}</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={config.pageSetup[key]}
                  onChange={(event) =>
                    updatePageSetup(
                      key,
                      clampNumber(
                        Number(event.target.value || 0),
                        0,
                        10,
                      ),
                    )
                  }
                  disabled={isBusy}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
            ))}

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>Vị trí gáy</span>
              <select
                value={config.pageSetup.gutterPosition}
                onChange={(event) =>
                  updatePageSetup(
                    "gutterPosition",
                    event.target.value as "left" | "top",
                  )
                }
                disabled={isBusy}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="left">Trái</option>
                <option value="top">Trên</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>Hướng giấy</span>
              <select
                value={config.pageSetup.orientation}
                onChange={(event) =>
                  updatePageSetup(
                    "orientation",
                    event.target.value as "portrait" | "landscape",
                  )
                }
                disabled={isBusy}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="portrait">Dọc</option>
                <option value="landscape">Ngang</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>Khổ giấy</span>
              <select
                value={config.pageSetup.paperSize}
                onChange={() => updatePageSetup("paperSize", "A4")}
                disabled={isBusy}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="A4">A4</option>
              </select>
            </label>
          </div>
        </div>

        {showAdvanced ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Chỉnh chữ</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Để trống nội dung cần tìm thì hệ thống sẽ bỏ qua dòng đó.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setConfig((current) =>
                    current
                      ? {
                          ...current,
                          styleRules: [...current.styleRules, createStyleRule()],
                        }
                      : current,
                  )
                }
                disabled={isBusy}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Thêm dòng chỉnh chữ
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {config.styleRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Dòng chỉnh chữ {index + 1}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(event) =>
                            updateStyleRule(rule.id, (current) => ({
                              ...current,
                              enabled: event.target.checked,
                            }))
                          }
                          disabled={isBusy}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Sử dụng
                      </label>

                      <button
                        type="button"
                        onClick={() => removeStyleRule(rule.id)}
                        disabled={isBusy}
                        className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Xóa dòng
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2 xl:col-span-2">
                      <span>Nội dung cần tìm</span>
                      <input
                        type="text"
                        value={rule.targetText}
                        maxLength={200}
                        onChange={(event) =>
                          updateStyleRule(rule.id, (current) => ({
                            ...current,
                            targetText: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span>Phông chữ</span>
                      <input
                        type="text"
                        value={rule.style.fontFamily}
                        maxLength={100}
                        onChange={(event) =>
                          updateStyleRule(rule.id, (current) => ({
                            ...current,
                            style: {
                              ...current.style,
                              fontFamily: event.target.value,
                            },
                          }))
                        }
                        disabled={isBusy}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span>Cỡ chữ</span>
                      <input
                        type="number"
                        min={6}
                        max={72}
                        step={1}
                        value={rule.style.fontSize}
                        onChange={(event) =>
                          updateStyleRule(rule.id, (current) => ({
                            ...current,
                            style: {
                              ...current.style,
                              fontSize: clampNumber(
                                Number(event.target.value || 13),
                                6,
                                72,
                              ),
                            },
                          }))
                        }
                        disabled={isBusy}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={rule.style.bold}
                        onChange={(event) =>
                          updateStyleRule(rule.id, (current) => ({
                            ...current,
                            style: {
                              ...current.style,
                              bold: event.target.checked,
                            },
                          }))
                        }
                        disabled={isBusy}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Đậm
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={rule.style.italic}
                        onChange={(event) =>
                          updateStyleRule(rule.id, (current) => ({
                            ...current,
                            style: {
                              ...current.style,
                              italic: event.target.checked,
                            },
                          }))
                        }
                        disabled={isBusy}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Nghiêng
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={rule.style.underline}
                        onChange={(event) =>
                          updateStyleRule(rule.id, (current) => ({
                            ...current,
                            style: {
                              ...current.style,
                              underline: event.target.checked,
                            },
                          }))
                        }
                        disabled={isBusy}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Gạch chân
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={rule.applyToAll}
                        onChange={(event) =>
                          updateStyleRule(rule.id, (current) => ({
                            ...current,
                            applyToAll: event.target.checked,
                          }))
                        }
                        disabled={isBusy}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Áp dụng cho tất cả chỗ giống nhau
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span>Căn lề chữ</span>
                      <select
                        value={rule.style.alignment ?? ""}
                        onChange={(event) =>
                          updateStyleRule(rule.id, (current) => ({
                            ...current,
                            style: {
                              ...current.style,
                              alignment: event.target.value
                                ? (event.target.value as
                                    | "left"
                                    | "center"
                                    | "right"
                                    | "justify")
                                : null,
                            },
                          }))
                        }
                        disabled={isBusy}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Giữ nguyên</option>
                        <option value="left">Trái</option>
                        <option value="center">Giữa</option>
                        <option value="right">Phải</option>
                        <option value="justify">Đều hai bên</option>
                      </select>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Chỗ trống cần điền
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Tìm thấy các chỗ trống có thể cần điền:
              </p>
            </div>

            <button
              type="button"
              onClick={handleRescanBlanks}
              disabled={isBusy}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "scan" ? "Đang quét..." : "Quét lại"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {config.manualBlankFields.length ? (
              config.manualBlankFields.map((field, index) => (
                <div
                  key={field.occurrenceKey}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Chỗ trống {index + 1}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {field.contextBefore || "..."}
                        {field.contextAfter ? ` ... ${field.contextAfter}` : ""}
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={(event) =>
                          updateManualBlankField(field.occurrenceKey, (current) => ({
                            ...current,
                            enabled: event.target.checked,
                          }))
                        }
                        disabled={isBusy}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Sử dụng
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span>Nhãn gợi ý</span>
                      <input
                        type="text"
                        value={field.label}
                        maxLength={120}
                        onChange={(event) =>
                          updateManualBlankField(field.occurrenceKey, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span>Giá trị điền vào</span>
                      <input
                        type="text"
                        value={field.value}
                        maxLength={500}
                        onChange={(event) =>
                          updateManualBlankField(field.occurrenceKey, (current) => ({
                            ...current,
                            value: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Chưa tìm thấy chỗ trống phù hợp.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={resetToDefaults}
          disabled={isBusy}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Dùng mặc định
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          className="rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "saving" ? "Đang lưu..." : "Lưu tùy chỉnh"}
        </button>

        <button
          type="button"
          onClick={() =>
            void runExportAction(
              "preview",
              "Đã tạo bản Word để xem trước.",
              () => renderGeneratedDocumentDocx(documentId),
            )
          }
          disabled={isBusy}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "preview" ? "Đang tạo..." : "Xem trước"}
        </button>

        <button
          type="button"
          onClick={() =>
            void runExportAction(
              "word",
              "Đã xuất Word mới.",
              () => renderGeneratedDocumentDocx(documentId),
              {
                openFile: true,
                format: "DOCX",
              },
            )
          }
          disabled={isBusy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "word" ? "Đang xuất..." : "Xuất Word"}
        </button>

        <button
          type="button"
          onClick={() =>
            void runExportAction(
              "pdf",
              "Đã xuất PDF mới.",
              () => convertGeneratedDocumentPdf(documentId),
              {
                openFile: true,
                format: "PDF",
              },
            )
          }
          disabled={isBusy}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "pdf" ? "Đang xuất..." : "Xuất PDF"}
        </button>
      </div>
    </section>
  );
}
