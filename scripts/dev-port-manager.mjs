const DEFAULT_DEV_PORTS = Object.freeze([3000, 3001]);

export function parsePorts(args) {
  const parsed = args
    .filter((arg) => !arg.startsWith('--'))
    .join(',')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0 && value <= 65_535);

  return parsed.length > 0 ? [...new Set(parsed)] : [...DEFAULT_DEV_PORTS];
}

export function parseWindowsListenerPids(output, port) {
  const pids = new Set();

  for (const line of output.split(/\r?\n/u)) {
    const columns = line.trim().split(/\s+/u);
    if (columns.length < 5 || columns[0].toUpperCase() !== 'TCP') continue;
    if (columns[3].toUpperCase() !== 'LISTENING') continue;

    const localAddress = columns[1];
    const separatorIndex = localAddress.lastIndexOf(':');
    const localPort = Number(localAddress.slice(separatorIndex + 1));
    const pid = Number(columns[4]);

    if (localPort === port && Number.isInteger(pid) && pid > 0) {
      pids.add(pid);
    }
  }

  return [...pids];
}

export function windowsTaskkillArgs(pid) {
  return ['/PID', String(pid), '/T', '/F'];
}
