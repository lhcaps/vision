// Resolve important paths in a cross-platform way (Node 18+, no path module quirks).
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);

/** Root of the meta-harness repo (the folder containing meta.yaml). */
export const META_ROOT = path.resolve(path.dirname(__filename), '..', '..');

/** Path to meta.yaml inside the meta-harness repo. */
export const META_FILE = path.join(META_ROOT, 'meta.yaml');

/** Path to the skills registry. */
export const REGISTRY_FILE = path.join(META_ROOT, 'registry', 'skills.yaml');

/** Path to the bundles directory (the content that gets copied). */
export const BUNDLES_DIR = path.join(META_ROOT, 'bundles');

/** Path to the stacks overlays directory. */
export const STACKS_DIR = path.join(META_ROOT, 'stacks');

/** Path to a target repo's manifest file. */
export function manifestPath(targetRoot) {
  return path.join(targetRoot, '.harness', 'manifest.yaml');
}

/** Path to a target repo's .harnessrc file. */
export function harnessrcPath(targetRoot) {
  return path.join(targetRoot, '.harnessrc');
}

/** Path to a target repo's .ai directory. */
export function aiDir(targetRoot) {
  return path.join(targetRoot, '.ai');
}

/** Path to a target repo's .cursor/rules directory. */
export function cursorRulesDir(targetRoot) {
  return path.join(targetRoot, '.cursor', 'rules');
}

/** Resolve a stack overlay directory, or null if not present. */
export function stackDir(stackId) {
  const p = path.join(STACKS_DIR, stackId);
  return p;
}
