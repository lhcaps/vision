// Filesystem helpers used by the harness CLI.
// All file operations are async and use node:fs/promises.

import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Recursively copy src -> dst, overwriting files but creating missing parents. */
export async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(d), { recursive: true });
      await fs.copyFile(s, d);
    }
  }
}

/** Recursively remove a directory. */
export async function removeDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

/** Read a file as UTF-8 string. Returns null if missing. */
export async function readIfExists(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/** Write a string to a file, creating parents. */
export async function writeFile(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

/** List all files in a directory recursively, returning absolute paths. */
export async function listFiles(dir) {
  const out = [];
  async function walk(d) {
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch (err) {
      if (err.code === 'ENOENT') return;
      throw err;
    }
    for (const entry of entries) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(p);
      } else if (entry.isFile()) {
        out.push(p);
      }
    }
  }
  await walk(dir);
  return out;
}

/** Check if a path exists. */
export async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
