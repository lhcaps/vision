// Validate the integrity of an installed target.

import path from 'node:path';
import { manifestPath, harnessrcPath, aiDir, cursorRulesDir } from './paths.mjs';
import { exists, listFiles } from './fsx.mjs';
import { readManifest, FILE_STATUS, hashFile } from './manifest.mjs';
import { loadMeta } from './detector.mjs';

export async function doctor(targetRoot) {
  const checks = [];

  const m = await readManifest(targetRoot);
  checks.push({
    name: 'manifest exists',
    ok: !!m,
    detail: m ? `at .harness/manifest.yaml` : `no manifest at ${manifestPath(targetRoot)}`,
  });
  if (!m) return { checks };

  const meta = await loadMeta();
  checks.push({
    name: 'schema version supported',
    ok: m.schema_version === meta.schema_version,
    detail: `installed=${m.schema_version}, meta=${meta.schema_version}`,
  });

  checks.push({
    name: '.harnessrc present',
    ok: await exists(harnessrcPath(targetRoot)),
    detail: harnessrcPath(targetRoot),
  });

  checks.push({
    name: '.ai/ exists',
    ok: await exists(aiDir(targetRoot)),
    detail: aiDir(targetRoot),
  });
  checks.push({
    name: '.cursor/rules/ exists',
    ok: await exists(cursorRulesDir(targetRoot)),
    detail: cursorRulesDir(targetRoot),
  });

  let missing = 0;
  let drift = 0;
  for (const f of m.files) {
    const abs = path.join(targetRoot, f.path);
    if (!(await exists(abs))) {
      missing++;
      continue;
    }
    const h = await hashFile(abs);
    if (f.status === FILE_STATUS.PRISTINE && h !== f.source_hash) {
      drift++;
    } else if (f.status === FILE_STATUS.CUSTOMIZED && f.customized_hash && h !== f.customized_hash && h !== f.source_hash) {
      drift++;
    }
  }
  checks.push({
    name: 'no missing files',
    ok: missing === 0,
    detail: missing === 0 ? '' : `${missing} file(s) missing on disk`,
  });
  checks.push({
    name: 'no hash drift',
    ok: drift === 0,
    detail: drift === 0 ? '' : `${drift} file(s) drift from manifest`,
  });

  return { checks };
}
