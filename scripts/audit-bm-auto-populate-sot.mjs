import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WEB_SRC_DIR = path.join(ROOT, "apps", "web", "src");
const FORM_DIR = path.join(WEB_SRC_DIR, "components", "documents");
const GENERIC_PANEL_PATH = path.join(FORM_DIR, "generic-template-form-inputs.tsx");
const OUT_DIR = path.join(ROOT, "docs", "audit", "bm-auto-populate-sot");

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function gitStatuses() {
  const output = execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const statuses = new Map();

  for (const line of output.split(/\r?\n/u)) {
    if (!line.trim()) continue;

    const status = line.slice(0, 2);
    const fileName = line.slice(3).trim().replaceAll("\\", "/");
    statuses.set(fileName, status);
  }

  return statuses;
}

function firstExistingPath(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function resolveWebImport(importPath, sourceFile) {
  if (importPath.startsWith("@/")) {
    const withoutAlias = importPath.slice(2);
    return firstExistingPath([
      path.join(WEB_SRC_DIR, `${withoutAlias}.ts`),
      path.join(WEB_SRC_DIR, `${withoutAlias}.tsx`),
      path.join(WEB_SRC_DIR, withoutAlias, "index.ts"),
      path.join(WEB_SRC_DIR, withoutAlias, "index.tsx"),
    ]);
  }
  if ((importPath.startsWith("./") || importPath.startsWith("../")) && sourceFile) {
    const baseDir = path.dirname(sourceFile);
    const candidates = [
      path.join(baseDir, `${importPath}.ts`),
      path.join(baseDir, `${importPath}.tsx`),
      path.join(baseDir, importPath, "index.ts"),
      path.join(baseDir, importPath, "index.tsx"),
    ];
    return firstExistingPath(candidates);
  }
  return null;
}

function directLibHelperFiles(text, sourceFile) {
  const files = [];
  const importPattern = /from\s+["']([^"']+)["']/gu;
  let match;

  while ((match = importPattern.exec(text))) {
    const importPath = match[1];
    if (!(importPath.startsWith("@/lib/") || importPath.startsWith("./") || importPath.startsWith("../"))) continue;
    const resolved = resolveWebImport(importPath, sourceFile);
    if (resolved) files.push(resolved);
  }

  return [...new Set(files)].sort();
}

function getRegisteredBmCodes() {
  const mapPath = path.join(WEB_SRC_DIR, "lib", "bm-auto-populate", "bm-field-map.ts");
  if (!fs.existsSync(mapPath)) return new Set();
  const text = readText(mapPath);
  const codes = new Set();
  const pattern = /["'](BM-\d{3})["']\s*:\s*\[/gu;
  let match;
  while ((match = pattern.exec(text))) {
    codes.add(match[1]);
  }
  return codes;
}

const REGISTERED_BM_CODES = getRegisteredBmCodes();

function extractStringAssignments(text) {
  const assignments = [];
  const pattern = /([A-Za-z0-9_]+)\s*:\s*"([^"]*)"/gu;
  let match;

  while ((match = pattern.exec(text))) {
    assignments.push({ key: match[1], value: match[2] });
  }

  return assignments;
}

function likelyUserDataAssignments(assignments) {
  const ignoredKeys = new Set([
    "Accept",
    "aria-label",
    "cache",
    "className",
    "method",
    "placeholder",
    "type",
  ]);

  return assignments.filter(
    (item) =>
      item.value.trim().length > 0 &&
      !ignoredKeys.has(item.key) &&
      !/^bm-\d{3}-form-inputs$/u.test(item.value) &&
      !/^BM-\d{3}$/u.test(item.value),
  );
}

function classifyForm(filePath, statusMap) {
  const text = readText(filePath);
  const genericPanelText = fs.existsSync(GENERIC_PANEL_PATH)
    ? readText(GENERIC_PANEL_PATH)
    : "";
  const helperFiles = directLibHelperFiles(text, filePath);
  const helperTexts = helperFiles.map((helperPath) => readText(helperPath));
  const combinedText = [text, ...helperTexts].join("\n");
  const relativePath = rel(filePath);
  const codeMatch = path.basename(filePath).match(/bm-(\d{3})-form-inputs\.tsx/u);
  const code = codeMatch ? `BM-${codeMatch[1]}` : path.basename(filePath);
  const lineCount = text.split(/\r?\n/u).length;
  const stringAssignments = extractStringAssignments(combinedText);
  const userDataAssignments = likelyUserDataAssignments(stringAssignments);
  const hasGenericPanel = text.includes("GenericTemplateFormInputsPanel");
  const hasRenderPayload = combinedText.includes("render-payload");
  const hasRenderPayloadHelperCall = /\bgetBm\d{3}RenderPayload\b/u.test(text);
  const hasGenericPanelCaseContext =
    hasGenericPanel && genericPanelText.includes("useCasePayload");
  const hasUseCasePayload =
    combinedText.includes("useCasePayload") ||
    hasGenericPanelCaseContext ||
    // BmFormCasePayloadButton / BmFlatFormCasePayloadButton call
    // useApplyCasePayloadToForm / useApplyCasePayloadToFlatForm, both
    // of which call useCasePayload() internally. Treat the button
    // import as an indirect case-context consumer for the metrics that
    // derive from `hasUseCasePayload` (e.g. `caseContextForms`,
    // `case-context-not-consumed`).
    /\bBm(?:Flat)?FormCasePayloadButton\b/u.test(combinedText);
  const hasCasePayloadImport =
    combinedText.includes("CasePayload") || hasGenericPanelCaseContext;
  const hasUseEffect = text.includes("useEffect");
  const hasReloadFunction = /\b(?:reload|loadPayload|fetchPayload|loadInitial)\b/u.test(
    text,
  );
  const emptyConstantMatches = [
    ...combinedText.matchAll(/\b(?:EMPTY|INITIAL)_[A-Z0-9_]*FORM_INPUTS\b/gu),
  ].map((item) => item[0]);
  const hasDefaultButton =
    combinedText.includes("\u0110i\u1ec1n d\u1eef li\u1ec7u m\u1eabu") ||
    combinedText.includes("D\u1eef li\u1ec7u m\u1eabu") ||
    /\b(?:fillDefault|fillCustomerSample|sampleForm|sampleData|fill.*Sample|demo)\b/iu.test(
      combinedText,
    );
  const hasTakeFromCaseButton =
    combinedText.includes("L\u1ea5y t\u1eeb v\u1ee5 \u00e1n") ||
    (hasGenericPanel &&
      genericPanelText.includes("L\u1ea5y t\u1eeb v\u1ee5 \u00e1n")) ||
    /\b(?:layTuVuAn|applyCaseMapping|applyCasePayload|hydrateFromCase)\b/iu.test(
      combinedText,
    );
  const hasRegisteredBmFieldMap = REGISTERED_BM_CODES.has(code);
  const hasSave = /update.*form-inputs|save.*form|onSaved|handleSave|saveForm/iu.test(
    combinedText,
  );
  const hasHardcodedAgency =
    /Vi(?:e|\u1ec7)n\s+ki(?:e|\u1ec3)m\s+s(?:a|\u00e1)t|VKSKV|TP\.\s*H(?:o|\u1ed3)\s*Ch(?:i|\u00ed)\s*Minh/iu.test(
      combinedText,
    );
  const hasHardcodedPerson =
    /Nguy(?:en|\u1ec5n|\u1ec7n)|Tr(?:an|\u1ea7n)|Thanh\s+Nam|Thanh\s+Huy(?:e|\u1ec1)n|Thanh\s+B(?:i|\u00ec)nh/iu.test(
      combinedText,
    );
  const isStub = /STUB|stub|GenericTemplateFormInputsPanel/u.test(text);
  const autoPopulateEvidence = [];

  if (hasGenericPanel) autoPopulateEvidence.push("generic-smart-default-panel");
  if (hasRenderPayload && hasUseEffect) autoPopulateEvidence.push("mount-fetch-render-payload");
  if (hasRenderPayloadHelperCall) autoPopulateEvidence.push("bm-api-helper-render-payload");
  if (hasRenderPayload && hasReloadFunction) autoPopulateEvidence.push("reload-render-payload");
  if (hasGenericPanelCaseContext) autoPopulateEvidence.push("generic-panel-case-context-hook");
  if (hasUseCasePayload && !hasGenericPanelCaseContext) autoPopulateEvidence.push("case-context-hook");
  if (hasRegisteredBmFieldMap) autoPopulateEvidence.push("central-bm-field-map");
  if (hasDefaultButton) autoPopulateEvidence.push("default/sample-button");
  if (hasTakeFromCaseButton) autoPopulateEvidence.push("take-from-case-button");

  let prefillStatus = "missing";
  if (hasGenericPanel || (hasRenderPayload && hasUseEffect)) {
    prefillStatus = "backend_payload_on_open";
  }
  if (hasDefaultButton || hasTakeFromCaseButton || hasUseCasePayload || hasRegisteredBmFieldMap) {
    prefillStatus =
      prefillStatus === "missing" ? "manual_prefill_control" : "backend_plus_manual_control";
  }

  const risks = [];
  if (!hasRenderPayload && !hasGenericPanel && !hasUseCasePayload) {
    risks.push("no evidence of case/render-payload source");
  }
  if (!hasDefaultButton) {
    risks.push("no explicit default/sample button");
  }
  if (!hasTakeFromCaseButton && !hasUseCasePayload) {
    risks.push("no explicit take-from-case control/context usage");
  }
  if (isStub) {
    risks.push("stub/generic wrapper, not a bespoke BM implementation");
  }
  if (hasHardcodedPerson) {
    risks.push("possible hardcoded person/official sample data");
  }

  return {
    code,
    path: relativePath,
    gitStatus: statusMap.get(relativePath) ?? "clean",
    helperFiles: helperFiles.map((helperPath) => {
      const helperRelativePath = rel(helperPath);
      return {
        path: helperRelativePath,
        gitStatus: statusMap.get(helperRelativePath) ?? "clean",
        sha256: sha256(readText(helperPath)),
      };
    }),
    bytes: Buffer.byteLength(text, "utf8"),
    lineCount,
    sha256: sha256(text),
    prefillStatus,
    autoPopulateEvidence,
    hasGenericPanel,
    hasRenderPayload,
    hasRenderPayloadHelperCall,
    hasUseCasePayload,
    hasCasePayloadImport,
    hasDefaultButton,
    hasTakeFromCaseButton,
    hasRegisteredBmFieldMap,
    hasSave,
    hasHardcodedAgency,
    hasHardcodedPerson,
    emptyConstantNames: [...new Set(emptyConstantMatches)],
    nonEmptyStringAssignmentCount: userDataAssignments.length,
    sampleNonEmptyAssignments: userDataAssignments.slice(0, 12),
    risks,
  };
}

function countBy(items, key) {
  const result = {};
  for (const item of items) {
    const value = item[key];
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}

function markdownTable(rows) {
  const header =
    "| BM | Status | Evidence | Helpers | Default btn | Case btn/context | Git | Risks |\n" +
    "|---|---|---|---:|---:|---:|---|---|\n";

  return (
    header +
    rows
      .map((row) =>
        [
          row.code,
          row.prefillStatus,
          row.autoPopulateEvidence.join(", ") || "-",
          row.helperFiles.length,
          row.hasDefaultButton ? "yes" : "no",
          row.hasTakeFromCaseButton || row.hasUseCasePayload ? "yes" : "no",
          row.gitStatus,
          row.risks.join("; ") || "-",
        ]
          .map((cell) => String(cell).replaceAll("|", "\\|"))
          .join(" | "),
      )
      .map((line) => `| ${line} |`)
      .join("\n")
  );
}

function main() {
  const files = fs
    .readdirSync(FORM_DIR)
    .filter((name) => /^bm-\d{3}-form-inputs\.tsx$/u.test(name))
    .sort()
    .map((name) => path.join(FORM_DIR, name));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const statusMap = gitStatuses();
  const forms = files.map((filePath) => classifyForm(filePath, statusMap));
  const now = new Date().toISOString();
  const uniqueHelperFiles = new Set(
    forms.flatMap((item) => item.helperFiles.map((helper) => helper.path)),
  );
  const summary = {
    generatedAt: now,
    formCount: forms.length,
    prefillStatusCounts: countBy(forms, "prefillStatus"),
    hasRenderPayloadCount: forms.filter((item) => item.hasRenderPayload).length,
    hasRenderPayloadHelperCallCount: forms.filter((item) => item.hasRenderPayloadHelperCall)
      .length,
    hasGenericPanelCount: forms.filter((item) => item.hasGenericPanel).length,
    hasUseCasePayloadCount: forms.filter((item) => item.hasUseCasePayload).length,
    hasDefaultButtonCount: forms.filter((item) => item.hasDefaultButton).length,
    hasTakeFromCaseOrContextCount: forms.filter(
      (item) => item.hasTakeFromCaseButton || item.hasUseCasePayload || item.hasRegisteredBmFieldMap,
    ).length,
    hasTakeFromCaseButtonCount: forms.filter((item) => item.hasTakeFromCaseButton).length,
    hasRegisteredBmFieldMapCount: forms.filter((item) => item.hasRegisteredBmFieldMap).length,
    hardcodedPersonRiskCount: forms.filter((item) => item.hasHardcodedPerson).length,
    helperFileReferenceCount: forms.reduce(
      (total, item) => total + item.helperFiles.length,
      0,
    ),
    uniqueHelperFileCount: uniqueHelperFiles.size,
    noPayloadSource: forms
      .filter((item) => !item.hasRenderPayload && !item.hasGenericPanel)
      .map((item) => item.code),
    noDefaultButton: forms
      .filter((item) => !item.hasDefaultButton)
      .map((item) => item.code),
    noTakeFromCaseControlOrContext: forms
      .filter(
        (item) =>
          !item.hasTakeFromCaseButton && !item.hasUseCasePayload && !item.hasRegisteredBmFieldMap,
      )
      .map((item) => item.code),
  };

  const jsonPath = path.join(OUT_DIR, "bm-auto-populate-sot.json");
  const mdPath = path.join(OUT_DIR, "BM_AUTO_POPULATE_SOT.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify({ summary, forms }, null, 2)}\n`);
  fs.writeFileSync(
    mdPath,
    [
      "# BM Auto-Populate SOT Audit",
      "",
      `Generated: ${now}`,
      "",
      "## Summary",
      "",
      `- Forms scanned: ${summary.formCount}`,
      `- Prefill status: ${JSON.stringify(summary.prefillStatusCounts)}`,
      `- Has render-payload evidence: ${summary.hasRenderPayloadCount}`,
      `- Has BM API helper render-payload call: ${summary.hasRenderPayloadHelperCallCount}`,
      `- Uses GenericTemplateFormInputsPanel: ${summary.hasGenericPanelCount}`,
      `- Uses useCasePayload context directly: ${summary.hasUseCasePayloadCount}`,
      `- Has explicit default/sample button: ${summary.hasDefaultButtonCount}`,
      `- Has explicit take-from-case button or context usage: ${summary.hasTakeFromCaseOrContextCount}`,
      `- Direct helper references: ${summary.helperFileReferenceCount} references to ${summary.uniqueHelperFileCount} unique files`,
      `- Possible hardcoded person/official risk: ${summary.hardcodedPersonRiskCount}`,
      "",
      "## Interpretation",
      "",
      "- `backend_payload_on_open`: the form has evidence that it fetches `render-payload` on mount or delegates to the generic smart-default panel.",
      "- `manual_prefill_control`: the form has a default/sample or case-context control but no mount-time payload evidence.",
      "- `backend_plus_manual_control`: both mount-time payload evidence and manual prefill controls exist.",
      "- `missing`: no static evidence that opening the form will prefill from case/render-payload.",
      "- Forms with a `BM_FIELD_MAP` entry in `bm-field-map.ts` are credited for case-context mapping even before the panel wires the button (registry-driven auto-populate).",
      "",
      "## Per-form SOT",
      "",
      markdownTable(forms),
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify(summary, null, 2));
  console.log(`Wrote ${rel(jsonPath)}`);
  console.log(`Wrote ${rel(mdPath)}`);
}

main();
