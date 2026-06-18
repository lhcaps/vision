#!/usr/bin/env node
/**
 * free-ports.mjs - Cross-platform helper: kill whatever is listening on
 * the given TCP ports. Defaults: 3000 (Next.js) and 3001 (NestJS API).
 *
 * Usage:
 *   node scripts/free-ports.mjs [port,port,...] [--dry-run]
 *
 * Exit codes:
 *   0  all target ports are free
 *   1  one or more ports still occupied
 *   2  invoked with --dry-run and conflicts were found
 */
import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const portArgs = args.filter((a) => !a.startsWith('--'));
const ports = portArgs.length
  ? portArgs
      .join(',')
      .split(',')
      .map((p) => Number(p.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
  : [3000, 3001];

const isWindows = process.platform === 'win32';

function listListenersWin(port) {
  // netstat -ano | findstr :PORT  -> "TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   1234"
  try {
    const out = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue;
      const m = line.match(new RegExp(`[:.]${port}\\b.*LISTENING\\s+(\\d+)`));
      if (m) pids.add(Number(m[1]));
    }
    return [...pids];
  } catch {
    return [];
  }
}

function listListenersPosix(port) {
  // lsof -nP -iTCP:PORT -sTCP:LISTEN -t
  try {
    const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
    });
    return out
      .split(/\r?\n/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (pid === process.pid) return false;
  if (isWindows) {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/F'], { stdio: 'ignore' });
    return r.status === 0;
  }
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
      return true;
    } catch {
      return false;
    }
  }
}

function sleep(ms) {
  spawnSync(isWindows ? 'powershell' : 'sleep', isWindows ? ['-NoProfile', '-Command', `Start-Sleep -Milliseconds ${ms}`] : [String(ms / 1000)]);
}

const criticalNames = new Set(
  isWindows
    ? ['explorer', 'svchost', 'csrss', 'wininit', 'lsass', 'services', 'dwm']
    : ['launchd', 'systemd', 'init', 'kthreadd', 'sshd'],
);

function isCritical(pid) {
  if (!pid || pid <= 1) return true;
  try {
    const name = isWindows
      ? execFileSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${pid}).ProcessName`], { encoding: 'utf8' }).trim().toLowerCase()
      : execFileSync('ps', ['-o', 'comm=', '-p', String(pid)], { encoding: 'utf8' }).trim().toLowerCase();
    return criticalNames.has(name);
  } catch {
    return false;
  }
}

const occupied = new Map(); // pid -> Set<port>
for (const port of ports) {
  const pids = isWindows ? listListenersWin(port) : listListenersPosix(port);
  for (const pid of pids) {
    if (!occupied.has(pid)) occupied.set(pid, new Set());
    occupied.get(pid).add(port);
  }
}

if (occupied.size === 0) {
  console.log(`[free-ports] Nothing listening on ${ports.join(', ')}. OK.`);
  process.exit(0);
}

console.log(`[free-ports] Occupied ports detected:`);
for (const [pid, portSet] of occupied) {
  console.log(`  - ports ${[...portSet].join(',')}  pid ${pid}`);
}

if (dryRun) {
  console.error(`[free-ports] --dry-run: would kill ${occupied.size} process(es).`);
  process.exit(2);
}

const killed = [];
const failed = [];
for (const pid of occupied.keys()) {
  if (isCritical(pid)) {
    console.log(`[free-ports] Skipping critical pid ${pid}.`);
    continue;
  }
  if (killPid(pid)) {
    console.log(`[free-ports] Killed pid ${pid}.`);
    killed.push(pid);
  } else {
    console.log(`[free-ports] Could not kill pid ${pid}.`);
    failed.push(pid);
  }
}

sleep(500);

const stillOccupied = [];
for (const port of ports) {
  const pids = isWindows ? listListenersWin(port) : listListenersPosix(port);
  if (pids.length) stillOccupied.push(port);
}

if (stillOccupied.length) {
  console.error(`[free-ports] WARN: ports still occupied: ${stillOccupied.join(', ')}`);
  process.exit(failed.length ? 2 : 1);
}

console.log(`[free-ports] All target ports are free.`);
process.exit(0);
