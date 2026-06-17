// `harness remove <skill-id>` - remove a skill from target.

import path from 'node:path';
import { removeDir } from '../lib/fsx.mjs';
import { readManifest, writeManifest } from '../lib/manifest.mjs';

export async function remove(args, opts) {
  const [skillId] = args;
  if (!skillId) throw new Error('usage: harness remove <skill-id>');
  const targetRoot = process.cwd();
  const candidates = [
    path.join(targetRoot, '.ai', 'skills', 'core', skillId),
    path.join(targetRoot, '.ai', 'skills', 'frontend', skillId),
    path.join(targetRoot, '.ai', 'skills', 'ai', skillId),
    path.join(targetRoot, '.ai', 'skills', 'quality', skillId),
    path.join(targetRoot, '.ai', 'skills', 'workflow', skillId),
  ];
  for (const c of candidates) {
    await removeDir(c);
  }
  const manifest = await readManifest(targetRoot);
  if (manifest) {
    manifest.files = manifest.files.filter((f) => !f.path.includes(`/skills/${skillId}/`));
    await writeManifest(targetRoot, manifest);
  }
  return { id: skillId };
}
