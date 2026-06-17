// Tests for the install / update / diff copier. These exercise the
// manifest-driven two-way sync in a throwaway temp dir per test.
// Run with: node --test test/copier.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// We test the public surface by invoking the CLI in a temp dir.
// This validates end-to-end behavior, not just internal functions.
import { fileURLToPath } from 'node:url';
const HARNESS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(HARNESS_ROOT, 'cli', 'harness.mjs');

async function mkTmp() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'harness-test-'));
  // give the dir a package.json so the harness thinks it's a real project
  await fs.writeFile(
    path.join(dir, 'package.json'),
    '{"name":"test","version":"0.0.1"}',
    'utf8'
  );
  return dir;
}

async function runCli(cwd, ...args) {
  const { spawn } = await import('node:child_process');
  return await new Promise((resolve, reject) => {
    const p = spawn('node', [CLI, ...args], { cwd, shell: false });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => resolve({ code, out, err }));
    p.on('error', reject);
  });
}

async function readManifest(dir) {
  const { parse } = await import('../cli/lib/yaml.mjs');
  const raw = await fs.readFile(path.join(dir, '.harness', 'manifest.yaml'), 'utf8');
  return parse(raw);
}

test('install writes manifest, .cursor/rules, .ai/skills, AGENTS.md', async () => {
  const dir = await mkTmp();
  try {
    const init = await runCli(dir, 'init', 'generic');
    assert.equal(init.code, 0, init.err);
    const inst = await runCli(dir, 'install');
    assert.equal(inst.code, 0, inst.err);
    assert.ok(await fs.stat(path.join(dir, 'AGENTS.md')));
    assert.ok(await fs.stat(path.join(dir, '.cursor', 'rules', '00-meta.mdc')));
    assert.ok(await fs.stat(path.join(dir, '.ai', 'skills', 'core', 'plan', 'SKILL.md')));
    assert.ok(await fs.stat(path.join(dir, '.harness', 'manifest.yaml')));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('install records every file as pristine', async () => {
  const dir = await mkTmp();
  try {
    await runCli(dir, 'init');
    await runCli(dir, 'install');
    const m = await readManifest(dir);
    const customized = m.files.filter((f) => f.status !== 'pristine');
    assert.equal(customized.length, 0, `expected all pristine, found: ${customized.map((f) => f.path).join(', ')}`);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('update detects a user customization and marks it as customized', async () => {
  const dir = await mkTmp();
  try {
    await runCli(dir, 'init');
    await runCli(dir, 'install');
    // User customizes one file
    const target = path.join(dir, '.ai', 'skills', 'core', 'plan', 'SKILL.md');
    const original = await fs.readFile(target, 'utf8');
    await fs.writeFile(target, original + '\n\n# project-specific note\n', 'utf8');
    await runCli(dir, 'update');
    const m = await readManifest(dir);
    const plan = m.files.find((f) => f.path === '.ai/skills/core/plan/SKILL.md');
    assert.equal(plan.status, 'customized');
    // file content preserved
    const after = await fs.readFile(target, 'utf8');
    assert.ok(after.includes('project-specific note'));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('diff reports no changes on a clean tree', async () => {
  const dir = await mkTmp();
  try {
    await runCli(dir, 'init');
    await runCli(dir, 'install');
    const r = await runCli(dir, 'diff', '--json');
    assert.equal(r.code, 0, r.err);
    const plan = JSON.parse(r.out);
    assert.equal(plan.to_add.length, 0);
    assert.equal(plan.to_overwrite.length, 0);
    assert.equal(plan.conflicts.length, 0);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('doctor reports all checks pass on a clean install', async () => {
  const dir = await mkTmp();
  try {
    await runCli(dir, 'init');
    await runCli(dir, 'install');
    const r = await runCli(dir, 'doctor', '--json');
    assert.equal(r.code, 0, r.err);
    const out = JSON.parse(r.out);
    const failed = out.checks.filter((c) => !c.ok);
    assert.equal(failed.length, 0, `failed checks: ${failed.map((c) => c.name).join(', ')}`);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('install is idempotent (re-running with no changes is a no-op)', async () => {
  const dir = await mkTmp();
  try {
    await runCli(dir, 'init');
    await runCli(dir, 'install');
    const first = await readManifest(dir);
    await runCli(dir, 'install');
    const second = await readManifest(dir);
    // file list and pristine status should be identical
    assert.equal(first.files.length, second.files.length);
    for (let i = 0; i < first.files.length; i++) {
      assert.equal(first.files[i].path, second.files[i].path);
      assert.equal(first.files[i].source_hash, second.files[i].source_hash);
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('install on a repo with a pre-existing .cursor/ does not clobber user files', async () => {
  const dir = await mkTmp();
  try {
    // pre-existing user file in .cursor/
    await fs.mkdir(path.join(dir, '.cursor'), { recursive: true });
    const userFile = path.join(dir, '.cursor', 'user-rule.mdc');
    await fs.writeFile(userFile, '# user rule (must survive install)\n', 'utf8');
    await runCli(dir, 'init');
    await runCli(dir, 'install');
    // user file is still there
    const after = await fs.readFile(userFile, 'utf8');
    assert.ok(after.includes('user rule (must survive install)'));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('list shows all 24 skills; generic stack installs 22 and marks 2 stack overlays as available', async () => {
  const dir = await mkTmp();
  try {
    await runCli(dir, 'init');
    await runCli(dir, 'install');
    const r = await runCli(dir, 'list', '--json');
    assert.equal(r.code, 0, r.err);
    const out = JSON.parse(r.out);
    assert.equal(out.items.length, 24);
    const installed = out.items.filter((i) => i.installed);
    const available = out.items.filter((i) => !i.installed);
    // 22 bundle skills are installed for the generic stack.
    assert.equal(installed.length, 22, `installed: ${installed.map((i) => i.id).join(', ')}`);
    // The 2 stack-overlay skills (nextjs, fastapi) are available but not installed.
    assert.equal(available.length, 2);
    assert.ok(available.find((i) => i.id === 'nextjs-conventions'));
    assert.ok(available.find((i) => i.id === 'fastapi-conventions'));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('nextjs stack overlay installs the nextjs .mdc and conventions skill', async () => {
  const dir = await mkTmp();
  try {
    // simulate a Next.js project
    await fs.writeFile(
      path.join(dir, 'package.json'),
      '{"name":"demo","dependencies":{"next":"^15.0.0","react":"^19.0.0"}}',
      'utf8'
    );
    await runCli(dir, 'init', 'nextjs');
    await runCli(dir, 'install');
    assert.ok(await fs.stat(path.join(dir, '.cursor', 'rules', 'nextjs.mdc')));
    assert.ok(
      await fs.stat(path.join(dir, '.ai', 'skills', 'core', 'nextjs-conventions', 'SKILL.md'))
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
