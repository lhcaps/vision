// Tiny output helpers. Honors --json flag.

export function shapeHuman(payload, command) {
  switch (command) {
    case 'install':
      return [
        `Installed harness v${payload.manifest.harness_version} (stack: ${payload.manifest.stack})`,
        `  files copied: ${payload.copied}`,
        `  manifest:     .harness/manifest.yaml`,
        '',
        'Next: open the target repo in Cursor and run the bootstrap prompt:',
        '  Read .harness/manifest.yaml and .ai/harness/project-intake.md.',
        '  Inspect this repo, fill the intake, then customize the skills for this stack.',
      ].join('\n');
    case 'diff':
      return renderDiff(payload);
    case 'update':
      return [
        `Update complete.`,
        `  added:       ${payload.added}`,
        `  overwritten: ${payload.overwritten}`,
        `  conflicts:   ${payload.conflicts}`,
        `  customized:  ${payload.customized ?? 0}`,
        `  skipped:     ${payload.skipped ?? 0}`,
      ].join('\n');
    case 'list':
      return renderList(payload);
    case 'doctor':
      return renderDoctor(payload);
    case 'add':
      return `Added: ${payload.id} -> ${payload.path}`;
    case 'remove':
      return `Removed: ${payload.id}`;
    case 'init':
      return [
        `Initialized .harnessrc (stack: ${payload.stack}).`,
        '',
        'Run `harness install` to copy the bundle into this project.',
      ].join('\n');
    default:
      return JSON.stringify(payload, null, 2);
  }
}

function renderDiff(plan) {
  const lines = [];
  lines.push(`harness: ${plan.harness_version_current} -> ${plan.harness_version_target}`);
  lines.push(`stack:   ${plan.stack_current} -> ${plan.stack_target}`);
  lines.push('');
  lines.push(`+ add (${plan.to_add.length})`);
  for (const f of plan.to_add) lines.push(`    ${f.path}`);
  lines.push(`~ overwrite (${plan.to_overwrite.length})`);
  for (const f of plan.to_overwrite) lines.push(`    ${f}`);
  lines.push(`! conflict (${plan.conflicts.length})`);
  for (const f of plan.conflicts) lines.push(`    ${f}`);
  lines.push(`* customized (${plan.customized?.length ?? 0})`);
  for (const f of plan.customized ?? []) lines.push(`    ${f}`);
  lines.push(`· project-local (${plan.project_local?.length ?? 0})  (manifest entries with no bundle source — usually user-created files)`);
  for (const f of plan.project_local ?? []) lines.push(`    ${f}`);
  lines.push(`= unchanged (${plan.unchanged.length})`);
  return lines.join('\n');
}

function renderList(payload) {
  const lines = [`Skills (${payload.items.length}):`];
  for (const s of payload.items) {
    const tag = s.installed ? '[installed]' : '[available]';
    lines.push(`  ${tag.padEnd(12)} ${s.id}  ${s.summary ?? ''}`);
  }
  return lines.join('\n');
}

function renderDoctor(payload) {
  const lines = [];
  let bad = 0;
  for (const c of payload.checks) {
    const mark = c.ok ? 'OK  ' : 'FAIL';
    lines.push(`  [${mark}] ${c.name}${c.detail ? '  - ' + c.detail : ''}`);
    if (!c.ok) bad++;
  }
  lines.push('');
  lines.push(bad === 0 ? 'doctor: all checks passed.' : `doctor: ${bad} check(s) failed.`);
  return lines.join('\n');
}
