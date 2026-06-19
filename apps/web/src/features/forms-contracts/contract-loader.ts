/**
 * Phase D — Runtime contract loader (API / server-side only).
 *
 * Loads contracts from the filesystem and normalizes them into
 * `LoadedFormContract` shape. Rules:
 *
 * - Prefer locked contract if it exists for a given template code.
 * - Draft contracts are loaded but marked `runtimeEligible=false`.
 * - Reference docs are excluded.
 * - Generic `.field#` placeholders mark `needsReview=true`.
 * - Contract loader does NOT mutate the original contract.
 *
 * NOTE: This module uses Node.js `fs` — it must only be imported from
 * server-side code (NestJS services, API layer, scripts).
 * For browser-side use, call the API endpoints instead.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type {
  FormContract,
  LoadedFormContract,
  FormCatalogItem,
  FormCatalogQuery,
} from "./contract-types";
import {
  normalizeContract,
  buildFormCatalog,
} from "./contract-normalizer";

// ─── Contract file discovery ────────────────────────────────────────────────────

/**
 * Discover all contract file paths under `contractsRoot`.
 * Recursively descends into the `locked` subdirectory.
 */
export function discoverContractPaths(contractsRoot: string): {
  locked: string[];
  draft: string[];
} {
  const locked: string[] = [];
  const draft: string[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "locked") scan(full);
      } else if (/\.contract\.(draft|locked)\.json$/.test(entry.name)) {
        if (entry.name.includes(".locked.")) locked.push(full);
        else draft.push(full);
      }
    }
  }

  scan(contractsRoot);
  return { locked, draft };
}

/**
 * Load a single contract JSON file.
 */
function loadJsonFile(fp: string): FormContract {
  return JSON.parse(fs.readFileSync(fp, "utf8")) as FormContract;
}

/**
 * Load a single contract from a file path.
 * Returns null if file doesn't exist or is invalid.
 */
export function loadContractFromPath(fp: string): FormContract | null {
  try {
    if (!fs.existsSync(fp)) return null;
    return loadJsonFile(fp);
  } catch {
    return null;
  }
}

/**
 * Load the best contract for a given template code.
 * Priority: locked > draft.
 * Reference docs are skipped.
 */
export function loadBestContract(
  templateCode: string,
  contractsRoot: string,
): LoadedFormContract | null {
  const lockedDir = path.join(contractsRoot, "locked");

  // 1. Try locked contract
  if (fs.existsSync(lockedDir)) {
    const lockedFiles = (fs.readdirSync(lockedDir) as string[]).filter(
      (n) => n.includes(templateCode) && n.endsWith(".contract.locked.json"),
    );
    if (lockedFiles.length > 0) {
      const contract = loadJsonFile(path.join(lockedDir, lockedFiles[0]));
      if (contract.documentKind !== "reference") {
        return normalizeContract(contract);
      }
    }
  }

  // 2. Try draft contract
  if (fs.existsSync(contractsRoot)) {
    const draftFiles = (fs.readdirSync(contractsRoot) as string[]).filter(
      (n) => n.includes(templateCode) && n.endsWith(".contract.draft.json"),
    );
    if (draftFiles.length > 0) {
      const contract = loadJsonFile(path.join(contractsRoot, draftFiles[0]));
      if (contract.documentKind !== "reference") {
        return normalizeContract(contract);
      }
    }
  }

  return null;
}

// ─── Batch loading ─────────────────────────────────────────────────────────────

/**
 * Load all contracts and return them as `LoadedFormContract[]`.
 * Reference docs are excluded.
 * For each template code, locked contract takes precedence.
 */
export function loadAllContracts(contractsRoot: string): LoadedFormContract[] {
  const { locked, draft } = discoverContractPaths(contractsRoot);

  const byCode = new Map<string, LoadedFormContract>();

  // Load locked first (higher priority)
  for (const fp of locked) {
    const c = loadContractFromPath(fp);
    if (!c || c.documentKind === "reference") continue;
    const loaded = normalizeContract(c);
    byCode.set(loaded.templateCode, loaded);
  }

  // Load drafts, only if no locked version exists
  for (const fp of draft) {
    const c = loadContractFromPath(fp);
    if (!c || c.documentKind === "reference") continue;
    if (byCode.has(c.templateCode)) continue;
    const loaded = normalizeContract(c);
    byCode.set(loaded.templateCode, loaded);
  }

  return Array.from(byCode.values()).sort((a, b) =>
    (a.templateCode ?? "").localeCompare(b.templateCode ?? ""),
  );
}
