// Read/write the .harness/manifest.yaml file in a target repo.
// The manifest tracks every file copied from the meta-harness bundle,
// its current hash, and whether it has been customized.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { manifestPath } from './paths.mjs';
import { readIfExists, writeFile, exists } from './fsx.mjs';
import { sha256 } from './hash.mjs';
import { parse, toYaml } from './yaml.mjs';

export const FILE_STATUS = Object.freeze({
  PRISTINE: 'pristine',
  CUSTOMIZED: 'customized',
  CONFLICT: 'conflict',
  MISSING: 'missing',
});

export async function readManifest(targetRoot) {
  const raw = await readIfExists(manifestPath(targetRoot));
  if (!raw) return null;
  return parse(raw);
}

export async function writeManifest(targetRoot, manifest) {
  const out = toYaml(manifest);
  await writeFile(manifestPath(targetRoot), out);
}

export function emptyManifest(meta) {
  return {
    schema_version: meta.schema_version ?? 1,
    harness_version: meta.version ?? '0.0.0',
    installed_at: new Date().toISOString().slice(0, 10),
    stack: meta.defaults?.stack ?? 'generic',
    files: [],
  };
}

export function recordFile(manifest, entry) {
  const idx = manifest.files.findIndex((f) => f.path === entry.path);
  if (idx === -1) {
    manifest.files.push(entry);
  } else {
    manifest.files[idx] = entry;
  }
}

export async function hashFile(absPath) {
  const raw = await readIfExists(absPath);
  if (raw === null) return null;
  return sha256(raw);
}

export async function inspectEntry(entry, currentAbsPath) {
  const currentHash = await hashFile(currentAbsPath);
  if (!currentHash) return { ...entry, status: FILE_STATUS.MISSING, current_hash: null };
  if (entry.status === FILE_STATUS.CUSTOMIZED) {
    const sameAsCustomized = entry.customized_hash === currentHash;
    return { ...entry, status: FILE_STATUS.CUSTOMIZED, current_hash: currentHash, customized_intact: sameAsCustomized };
  }
  if (currentHash === entry.source_hash) {
    return { ...entry, status: FILE_STATUS.PRISTINE, current_hash: currentHash };
  }
  return { ...entry, status: FILE_STATUS.CUSTOMIZED, current_hash: currentHash, customized_hash: currentHash };
}
