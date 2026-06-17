// `harness list` - show installed vs available skills.

import path from 'node:path';
import { readManifest } from '../lib/manifest.mjs';
import { listAvailable } from '../lib/registry.mjs';

export async function list(args, opts) {
  const targetRoot = process.cwd();
  const availableOnly = args.includes('--available') || args.includes('-a');
  const installed = new Set();
  if (!availableOnly) {
    const m = await readManifest(targetRoot);
    if (m) {
      for (const f of m.files) {
        if (f.path.startsWith('.ai/skills/')) {
          const parts = f.path.split('/');
          if (parts.length >= 5 && parts[4] === 'SKILL.md') {
            installed.add(parts[3]);
          }
        }
      }
    }
  }
  const skills = await listAvailable();
  const items = skills.map((s) => ({
    id: s.id,
    summary: s.summary ?? '',
    group: s.group ?? 'core',
    installed: installed.has(s.id),
  }));
  return { items };
}
