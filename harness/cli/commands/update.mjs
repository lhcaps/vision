// `harness update` - apply changes per diff plan.

import { diffPlan, updateApply } from '../lib/copier.mjs';
import { resolveStack } from '../lib/detector.mjs';
import { readManifest } from '../lib/manifest.mjs';

export async function update(args, opts) {
  const targetRoot = process.cwd();
  const manifest = await readManifest(targetRoot);
  const stackArg = parseStack(args);
  const stack = await resolveStack(stackArg ?? manifest?.stack);
  const force = args.includes('--force');
  const plan = await diffPlan(targetRoot, stack.id);
  return await updateApply(targetRoot, plan, { force });
}

function parseStack(args) {
  for (const a of args) {
    if (a.startsWith('--stack=')) return a.slice('--stack='.length);
  }
  return undefined;
}
