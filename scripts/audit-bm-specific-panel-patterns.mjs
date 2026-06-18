import fs from "node:fs";
import path from "node:path";
import {
  analyzeSpecificPanelSource,
  summarizeSpecificPanelAnalysis,
} from "./lib/bm-specific-panel-analyzer.mjs";

const ROOT = process.cwd();
const FORM_DIR = path.join(ROOT, "apps", "web", "src", "components", "documents");
const OUT_DIR = path.join(ROOT, "docs", "audit", "bm-auto-populate-sot");

function rel(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

function markdownTable(results) {
  const header =
    "| BM | Kind | Auto-wire candidate | State | Setter | Default btn | Risks |\n" +
    "|---|---|---:|---|---|---:|---|\n";

  return (
    header +
    results
      .map((item) =>
        [
          item.code,
          item.kind,
          item.canAutoWireGenericCaseAdapter ? "yes" : "no",
          item.stateVariable ?? "-",
          item.setterName ?? "-",
          item.hasDefaultButton ? "yes" : "no",
          item.risks.join("; ") || "-",
        ]
          .map((cell) => String(cell).replaceAll("|", "\\|"))
          .join(" | "),
      )
      .map((line) => `| ${line} |`)
      .join("\n")
  );
}

const files = fs
  .readdirSync(FORM_DIR)
  .filter((fileName) => /^bm-\d{3}-form-inputs\.tsx$/u.test(fileName))
  .sort()
  .map((fileName) => path.join(FORM_DIR, fileName));

const results = files.map((filePath) => {
  const code = `BM-${path.basename(filePath).match(/bm-(\d{3})/u)?.[1] ?? "000"}`;
  return {
    path: rel(filePath),
    ...analyzeSpecificPanelSource({
      code,
      text: fs.readFileSync(filePath, "utf8"),
    }),
  };
});
const summary = {
  generatedAt: new Date().toISOString(),
  ...summarizeSpecificPanelAnalysis(results),
};

fs.mkdirSync(OUT_DIR, { recursive: true });

const jsonPath = path.join(OUT_DIR, "bm-specific-panel-patterns.json");
const mdPath = path.join(OUT_DIR, "BM_SPECIFIC_PANEL_PATTERNS.md");

fs.writeFileSync(jsonPath, `${JSON.stringify({ summary, results }, null, 2)}\n`);
fs.writeFileSync(
  mdPath,
  [
    "# BM Specific Panel Pattern Audit",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Total BM files: ${summary.total}`,
    `- Specific panels: ${summary.specificCount}`,
    `- Generic wrappers: ${summary.genericWrapperCount}`,
    `- Auto-wire candidates: ${summary.autoWireCandidateCount}`,
    `- Specific panels already with case path: ${summary.alreadyHasCasePathCount}`,
    `- Specific panels without default button: ${summary.noDefaultButtonCount}`,
    `- Blocked specific panels: ${summary.blockedSpecificCount}`,
    "",
    "## Matrix",
    "",
    markdownTable(results),
    "",
  ].join("\n"),
);

console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${rel(jsonPath)}`);
console.log(`Wrote ${rel(mdPath)}`);
