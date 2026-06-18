import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateBmProductionReadiness,
  formatReadinessReport,
} from "./lib/bm-production-readiness.mjs";

const ROOT = process.cwd();
const SOT_DIR = join(ROOT, "docs", "audit", "bm-auto-populate-sot");

function readJson(fileName) {
  return JSON.parse(readFileSync(join(SOT_DIR, fileName), "utf8"));
}

const result = evaluateBmProductionReadiness({
  autoPopulate: readJson("bm-auto-populate-sot.json"),
  docxSync: readJson("bm-docx-requirement-sync.json"),
});

process.stdout.write(formatReadinessReport(result));
process.exitCode = result.ready ? 0 : 1;
