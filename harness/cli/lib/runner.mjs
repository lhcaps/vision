#!/usr/bin/env node
// Command router. Dispatches to the right command module and shapes output.

import { init } from '../commands/init.mjs';
import { install } from '../commands/install.mjs';
import { diff } from '../commands/diff.mjs';
import { update } from '../commands/update.mjs';
import { list } from '../commands/list.mjs';
import { add } from '../commands/add.mjs';
import { remove } from '../commands/remove.mjs';
import { doctor } from '../commands/doctor.mjs';
import { shapeHuman } from './output.mjs';

const COMMANDS = { init, install, diff, update, list, add, remove, doctor };

export async function run(command, args, opts) {
  const fn = COMMANDS[command];
  if (!fn) {
    throw new Error(`unknown command: ${command} (try: harness help)`);
  }
  const result = await fn(args, opts);
  if (typeof result === 'number') return result;
  if (opts?.json) {
    process.stdout.write(JSON.stringify({ ok: true, ...result }, null, 2) + '\n');
  } else if (result && typeof result === 'object') {
    process.stdout.write(shapeHuman(result, command) + '\n');
  }
  return 0;
}
