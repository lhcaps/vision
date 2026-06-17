// 3-way file copy with customization detection.

import path from 'node:path';
import { BUNDLES_DIR, STACKS_DIR, manifestPath } from './paths.mjs';
import { readIfExists, writeFile, copyDir, listFiles, exists, removeDir } from './fsx.mjs';
import { sha256 } from './hash.mjs';
import { FILE_STATUS, recordFile, readManifest, writeManifest, emptyManifest, hashFile } from './manifest.mjs';
import { loadMeta } from './detector.mjs';

export async function collectBundleFiles(stackId) {
  const files = [];

  for (const sub of ['rules', 'prompts', 'evals', 'harness', 'skills']) {
    const dir = path.join(BUNDLES_DIR, sub);
    for (const abs of await listFiles(dir)) {
      const rel = path.relative(BUNDLES_DIR, abs);
      if (rel.startsWith(`harness${path.sep}templates${path.sep}`)) {
        files.push({ abs, rel, kind: 'template' });
        continue;
      }
      files.push({ abs, rel });
    }
  }

  const overlay = path.join(STACKS_DIR, stackId);
  if (await exists(overlay)) {
    for (const abs of await listFiles(overlay)) {
      if (path.basename(abs) === 'stack.yaml') continue;
      const stackRel = path.relative(overlay, abs);
      files.push({ abs, rel: stackRel, origin: 'stack' });
    }
  }
  return files;
}

export function targetRelPath(bundleRel, meta, origin = 'bundle') {
  const parts = bundleRel.split(path.sep);
  const top = parts[0];
  const rest = parts.slice(1).join('/');
  const def = meta.defaults ?? {};
  if (top === 'rules') {
    return path.posix.join(def.install?.cursor_rules ?? '.cursor/rules', rest);
  }
  if (top === 'skills') {
    if (origin === 'stack') {
      return path.posix.join(def.install?.ai_dir ?? '.ai', 'skills', 'core', rest);
    }
    return path.posix.join(def.install?.ai_dir ?? '.ai', 'skills', rest);
  }
  if (top === 'prompts' || top === 'evals') {
    return path.posix.join(def.install?.ai_dir ?? '.ai', top, rest);
  }
  if (top === 'harness') {
    if (rest === 'AGENTS.md') return 'AGENTS.md';
    if (rest === 'failure-log.md') {
      return path.posix.join(def.install?.ai_dir ?? '.ai', 'harness', 'failure-log.md');
    }
    if (rest.startsWith('templates/')) {
      return path.posix.join(def.install?.ai_dir ?? '.ai', 'harness', rest);
    }
    return path.posix.join(def.install?.ai_dir ?? '.ai', 'harness', rest);
  }
  return bundleRel;
}

export async function install(targetRoot, { stack, force = false } = {}) {
  const meta = await loadMeta();
  const bundleFiles = await collectBundleFiles(stack);
  const existing = await readManifest(targetRoot);

  if (existing && !force) {
    throw new Error(
      `manifest already exists at ${manifestPath(targetRoot)}. ` +
        `Run \`harness update\` to refresh, or pass --force to reinstall.`
    );
  }

  const manifest = existing ?? emptyManifest({ ...meta, defaults: { ...meta.defaults, stack } });
  manifest.harness_version = meta.version;
  manifest.stack = stack;
  manifest.installed_at = new Date().toISOString().slice(0, 10);

  for (const fileInfo of bundleFiles) {
    const { abs, rel, origin = 'bundle' } = fileInfo;
    const content = await (await import('node:fs/promises')).readFile(abs, 'utf8');
    const srcHash = sha256(content);
    const targetRel = targetRelPath(rel, meta, origin);
    const absTarget = path.join(targetRoot, targetRel);
    await writeFile(absTarget, content);
    recordFile(manifest, {
      path: targetRel,
      source: rel,
      source_hash: srcHash,
      installed_hash: srcHash,
      status: FILE_STATUS.PRISTINE,
    });
  }

  await writeManifest(targetRoot, manifest);
  return { manifest, copied: bundleFiles.length };
}

export async function diffPlan(targetRoot, stack) {
  const manifest = await readManifest(targetRoot);
  if (!manifest) throw new Error('no manifest found. Run `harness install` first.');
  const bundleFiles = await collectBundleFiles(stack);
  const meta = await loadMeta();

  const targetByRel = new Map();
  for (const fileInfo of bundleFiles) {
    const trel = targetRelPath(fileInfo.rel, meta, fileInfo.origin);
    targetByRel.set(trel, { bundleRel: fileInfo.rel, abs: fileInfo.abs });
  }

  const plan = {
    harness_version_current: manifest.harness_version,
    harness_version_target: (await loadMeta()).version,
    stack_current: manifest.stack,
    stack_target: stack,
    to_add: [],
    to_overwrite: [],
    conflicts: [],
    customized: [],
    unchanged: [],
    project_local: [],
  };

  for (const entry of manifest.files) {
    const inBundle = targetByRel.has(entry.path);
    if (!inBundle) {
      // File is in the manifest but not in the bundle. Two cases:
      //   1. customized: user-created file (e.g. project-intake.md) - keep.
      //   2. genuinely orphaned: bundle removed this file in a new version.
      // We can't always tell, but customized files are the common case
      // and the user clearly wants to keep them.
      if (entry.status === 'customized') {
        plan.project_local.push(entry.path);
      } else {
        plan.project_local.push(entry.path);
      }
      continue;
    }
    const cur = await hashFile(path.join(targetRoot, entry.path));
    const bundleInfo = targetByRel.get(entry.path);
    const bundleSrc = await (await import('node:fs/promises')).readFile(bundleInfo.abs, 'utf8');
    const bundleHash = sha256(bundleSrc);
    const sourceChanged = bundleHash !== entry.source_hash;
    const userChanged = cur !== entry.source_hash;

    if (userChanged && sourceChanged) {
      plan.conflicts.push(entry.path);
    } else if (userChanged && !sourceChanged) {
      plan.customized.push(entry.path);
    } else if (!userChanged && sourceChanged) {
      plan.to_overwrite.push(entry.path);
    } else {
      plan.unchanged.push(entry.path);
    }
    targetByRel.delete(entry.path);
  }

  for (const [trel, info] of targetByRel) {
    plan.to_add.push({ path: trel, source: info.bundleRel });
  }

  return plan;
}

export async function updateApply(targetRoot, plan, { force = false } = {}) {
  const manifest = await readManifest(targetRoot);
  if (!manifest) throw new Error('no manifest found.');
  const meta = await loadMeta();

  const summary = { added: 0, overwritten: 0, conflicts: 0, customized: 0, skipped: 0 };

  for (const targetRel of plan.to_overwrite) {
    if (!force) {
      const entry = manifest.files.find((f) => f.path === targetRel);
      const cur = await hashFile(path.join(targetRoot, targetRel));
      if (entry.status !== FILE_STATUS.PRISTINE || cur !== entry.source_hash) {
        plan.conflicts.push(targetRel);
        continue;
      }
    }
    const bundleRel = manifest.files.find((f) => f.path === targetRel)?.source;
    const abs = path.join(BUNDLES_DIR, bundleRel);
    const content = await (await import('node:fs/promises')).readFile(abs, 'utf8');
    await writeFile(path.join(targetRoot, targetRel), content);
    const newHash = sha256(content);
    const entry = manifest.files.find((f) => f.path === targetRel);
    entry.source_hash = newHash;
    entry.installed_hash = newHash;
    entry.status = FILE_STATUS.PRISTINE;
    summary.overwritten++;
  }

  for (const { path: targetRel, source: bundleRel } of plan.to_add) {
    const abs = path.join(BUNDLES_DIR, bundleRel);
    const content = await (await import('node:fs/promises')).readFile(abs, 'utf8');
    await writeFile(path.join(targetRoot, targetRel), content);
    const newHash = sha256(content);
    recordFile(manifest, {
      path: targetRel,
      source: bundleRel,
      source_hash: newHash,
      installed_hash: newHash,
      status: FILE_STATUS.PRISTINE,
    });
    summary.added++;
  }

  for (const targetRel of plan.conflicts) {
    const entry = manifest.files.find((f) => f.path === targetRel);
    if (entry) {
      entry.status = FILE_STATUS.CONFLICT;
      entry.customized_hash = await hashFile(path.join(targetRoot, targetRel));
    }
    summary.conflicts++;
  }

  for (const targetRel of plan.customized ?? []) {
    const entry = manifest.files.find((f) => f.path === targetRel);
    if (entry) {
      entry.status = FILE_STATUS.CUSTOMIZED;
      entry.customized_hash = await hashFile(path.join(targetRoot, targetRel));
    }
    summary.customized++;
  }

  manifest.harness_version = (await loadMeta()).version;
  await writeManifest(targetRoot, manifest);
  return summary;
}
