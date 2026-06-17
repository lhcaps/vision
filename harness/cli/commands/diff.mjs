// `harness diff` - show pending changes.

import { diffPlan } from '../lib/copier.mjs';
import { resolveStack } from '../lib/detector.mjs';
import { readManifest } from '../lib/manifest.mjs';

export async function diff(args, opts) {
  const targetRoot = process.cwd();
  const manifest = await readManifest(targetRoot);
  const stackArg = parseStack(args);
  const stack = await resolveStack(stackArg ?? manifest?.stack);
  return await diffPlan(targetRoot, stack.id);
}

function parseStack(args) {
  for (const a of args) {
    if (a.startsWith('--stack=')) return a.slice('--stack='.length);
  }
  return undefined;
}
