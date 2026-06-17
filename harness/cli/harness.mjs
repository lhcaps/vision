#!/usr/bin/env node
// Meta-harness CLI entry point.
// Usage: node cli/harness.mjs <command> [args] [--json]
// Commands: init | install | diff | update | list | add | remove | doctor

import { run } from './lib/runner.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const filtered = args.filter((a) => a !== '--json');

const [command, ...rest] = filtered;

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(command ? 0 : 1);
}

try {
  const exitCode = await run(command, rest, { json });
  process.exit(exitCode ?? 0);
} catch (err) {
  if (json) {
    process.stdout.write(JSON.stringify({ ok: false, error: String(err?.message ?? err) }, null, 2) + '\n');
  } else {
    process.stderr.write(`harness: error: ${err?.message ?? err}\n`);
    if (process.env.HARNESS_DEBUG) {
      process.stderr.write((err?.stack ?? '') + '\n');
    }
  }
  process.exit(1);
}

function printHelp() {
  const lines = [
    'harness - personal meta-harness CLI',
    '',
    'Usage: harness <command> [args] [--json]',
    '',
    'Commands:',
    '  init [stack]            Generate .harnessrc, print intake prompt.',
    '  install [--stack=X]     Copy bundle into target repo, write manifest.',
    '  diff                    Show what would change vs installed manifest.',
    '  update [--stack=X]      Apply changes with conflict resolution.',
    '  list [--available]      Show installed or available skills.',
    '  add <skill-id>          Copy a skill on-demand into target.',
    '  remove <skill-id>       Remove a skill from target.',
    '  doctor                  Validate manifest, missing files, hash drift.',
    '',
    'Options:',
    '  --json                  Emit machine-readable JSON output.',
    '  HARNESS_DEBUG=1         Print full stack traces on error.',
  ];
  process.stdout.write(lines.join('\n') + '\n');
}
