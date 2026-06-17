import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const targets = [
  'apps/api/src/modules/cases/dto',
  'apps/api/src/modules/documents',
  'apps/web/src/app/globals.css',
  'apps/web/src/app/login/page.tsx',
  'apps/web/src/components/documents',
];

const replacements = [
  ['w7RuZyBOZ3V54buFbiBWxINuIEE=', 'bmfGsOG7nWkgY3VuZyBj4bqlcCBuZ3Xhu5NuIHRpbg=='],
  ['Tmd1eeG7hW4gVsSDbiBB', ''],
  ['xJBvw6BuIFbEg24gRMWpbmc=', ''],
  ['Tmd1eeG7hW4gVsSDbiBC4bqjbw==', ''],
  ['VHLhuqduIFRoYW5oIE5hbQ==', ''],
  ['Tmd1eeG7hW4gVGjhu4sgVGhhbmggSHV54buBbg==', ''],
  ['VGhhbmggQsOsbmg=', ''],
  ['MDk4ODAyNzc4OA==', ''],
  ['VktTLTIwMjYtMDAwMQ==', ''],
  ['RzgxMy9RxJAtVlBDUUNTxJBU', ''],
].map(([from, to]) => [decode(from), decode(to)]);

let touched = 0;
for (const target of targets) {
  const full = join(root, target);
  for (const file of files(full)) {
    if (!/\.(css|ts|tsx)$/u.test(file)) continue;
    const original = readFileSync(file, 'utf8');
    let next = original;
    for (const [from, to] of replacements) {
      next = next.split(from).join(to);
    }
    if (next !== original) {
      writeFileSync(file, next, 'utf8');
      touched += 1;
    }
  }
}

console.log(`sanitized ${touched} files`);

function decode(value) {
  return Buffer.from(value, 'base64').toString('utf8');
}

function* files(target) {
  const stat = statSync(target);
  if (stat.isFile()) {
    yield target;
    return;
  }

  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const child = join(target, entry.name);
    if (entry.isDirectory()) yield* files(child);
    else if (entry.isFile()) yield child;
  }
}
