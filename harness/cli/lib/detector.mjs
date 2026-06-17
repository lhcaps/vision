// Stack detection: user-declared primary, with a sanity check via package files.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { META_FILE } from './paths.mjs';
import { readIfExists, exists } from './fsx.mjs';
import { parse } from './yaml.mjs';

let metaCache = null;

export async function loadMeta() {
  if (metaCache) return metaCache;
  const raw = await readIfExists(META_FILE);
  if (!raw) throw new Error(`meta.yaml not found at ${META_FILE}`);
  metaCache = parse(raw);
  return metaCache;
}

export async function resolveStack(declared) {
  const meta = await loadMeta();
  const stacks = meta.supported_stacks ?? [];
  if (declared) {
    const found = stacks.find((s) => s.id === declared);
    if (!found) {
      throw new Error(`unknown stack: ${declared}. Available: ${stacks.map((s) => s.id).join(', ')}`);
    }
    return found;
  }
  return stacks.find((s) => s.id === (meta.defaults?.stack ?? 'generic')) ?? { id: 'generic', description: 'fallback' };
}

export async function sanityCheck(targetRoot, stack) {
  const hints = stack.detect_files ?? [];
  if (hints.length === 0) return { ok: true, found: [], missing: [] };
  const found = [];
  const missing = [];
  for (const hint of hints) {
    const candidates = expandBraces(hint);
    let any = false;
    for (const c of candidates) {
      if (await exists(path.join(targetRoot, c))) {
        found.push(c);
        any = true;
        break;
      }
    }
    if (!any) missing.push(hint);
  }
  return { ok: found.length > 0, found, missing };
}

function expandBraces(p) {
  const m = p.match(/^(.*)\{([^}]+)\}(.*)$/);
  if (!m) return [p];
  const [, pre, body, post] = m;
  return body.split(',').map((x) => `${pre}${x}${post}`);
}
