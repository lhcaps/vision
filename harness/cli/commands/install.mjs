// `harness install` - copy bundle into target, write manifest.

import { promises as fs } from 'node:fs';
import { install as installImpl } from '../lib/copier.mjs';
import { resolveStack } from '../lib/detector.mjs';
import { harnessrcPath } from '../lib/paths.mjs';
import { readIfExists } from '../lib/fsx.mjs';
import { parse } from '../lib/yaml.mjs';

export async function install(args, opts) {
  const targetRoot = process.cwd();
  const stackArg = parseStack(args);
  let declared = stackArg;
  if (!declared) {
    const rcRaw = await readIfExists(harnessrcPath(targetRoot));
    if (rcRaw) {
      const rc = parse(rcRaw);
      declared = rc?.stack;
    }
  }
  const stack = await resolveStack(declared);
  return await installImpl(targetRoot, { stack: stack.id });
}

function parseStack(args) {
  for (const a of args) {
    if (a.startsWith('--stack=')) return a.slice('--stack='.length);
  }
  return undefined;
}
