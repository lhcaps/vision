#!/usr/bin/env node
// Encoding hygiene: quét file source trong apps/** cho UTF-8 BOM.
// BOM (EF BB BF) ở đầu file TypeScript/JSON/YAML gây:
//   - compile warning trong một số toolchain
//   - confusion khi merge hoặc scan diff
//   - mismatch khi đọc file từ PowerShell vs Node
// File detect được sẽ được liệt kê và (với --fix) tự strip BOM.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = [
  path.join(ROOT, "apps", "api", "src"),
  path.join(ROOT, "apps", "web", "src"),
  path.join(ROOT, "scripts"),
  path.join(ROOT, "harness"),
];
const EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".yaml", ".yml"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "coverage", ".turbo"]);

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

const walk = (dir, out) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, out);
    } else if (ent.isFile() && EXTS.has(path.extname(ent.name).toLowerCase())) {
      out.push(full);
    }
  }
};

const hasBom = (file) => {
  try {
    const fd = fs.openSync(file, "r");
    try {
      const buf = Buffer.alloc(3);
      const read = fs.readSync(fd, buf, 0, 3, 0);
      return read === 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
};

const stripBom = (file) => {
  const buf = fs.readFileSync(file);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    fs.writeFileSync(file, buf.subarray(3));
    return true;
  }
  return false;
};

const main = () => {
  const fix = process.argv.includes("--fix");
  const files = [];
  for (const dir of SCAN_DIRS) {
    if (fs.existsSync(dir)) walk(dir, files);
  }
  const bomFiles = files.filter(hasBom);
  if (bomFiles.length === 0) {
    console.log("No BOM found. Encoding clean.");
    return;
  }
  console.log(`Found ${bomFiles.length} files with UTF-8 BOM:`);
  for (const f of bomFiles) {
    const rel = path.relative(ROOT, f);
    if (fix) {
      const ok = stripBom(f);
      console.log(`  [stripped] ${rel} (${ok ? "ok" : "skip"})`);
    } else {
      console.log(`  ${rel}`);
    }
  }
  if (!fix) {
    console.log("");
    console.log("Run with --fix to strip BOM from these files.");
    process.exit(1);
  }
};

main();
