// `harness add <skill-id>` - copy one skill on demand.

import path from 'node:path';
import { BUNDLES_DIR } from '../lib/paths.mjs';
import { copyDir, writeFile, exists } from '../lib/fsx.mjs';
import { getSkill } from '../lib/registry.mjs';
import { readManifest, writeManifest, recordFile, FILE_STATUS } from '../lib/manifest.mjs';
import { sha256 } from '../lib/hash.mjs';

export async function add(args, opts) {
  const [skillId] = args;
  if (!skillId) throw new Error('usage: harness add <skill-id>');
  const targetRoot = process.cwd();
  const skill = await getSkill(skillId);
  if (!skill) throw new Error(`unknown skill: ${skillId}`);
  const srcAbs = path.join(BUNDLES_DIR, 'skills', skill.group ?? 'core', skillId);
  if (!(await exists(srcAbs))) throw new Error(`skill source missing: ${srcAbs}`);
  const destRel = path.posix.join('.ai', 'skills', skill.group ?? 'core', skillId);
  const destAbs = path.join(targetRoot, destRel);
  await copyDir(srcAbs, destAbs);

  const manifest = await readManifest(targetRoot);
  if (manifest) {
    const { promises: fs } = await import('node:fs');
    for (const file of await walk(destAbs)) {
      const content = await fs.readFile(file, 'utf8');
      const targetRel = path.relative(targetRoot, file).split(path.sep).join('/');
      const bundleRel = path.relative(BUNDLES_DIR, file).split(path.sep).join('/');
      recordFile(manifest, {
        path: targetRel,
        source: bundleRel,
        source_hash: sha256(content),
        installed_hash: sha256(content),
        status: FILE_STATUS.PRISTINE,
      });
    }
    await writeManifest(targetRoot, manifest);
  }
  return { id: skillId, path: destRel };
}

async function walk(dir) {
  const out = [];
  const { promises: fs } = await import('node:fs');
  async function go(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await go(p);
      else if (e.isFile()) out.push(p);
    }
  }
  await go(dir);
  return out;
}
