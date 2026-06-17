// SHA-256 hashing helpers, with a stable `sha256:<hex>` prefix.

import { createHash } from 'node:crypto';

export function sha256(content) {
  const h = createHash('sha256').update(content).digest('hex');
  return `sha256:${h}`;
}

export function shortHash(s) {
  if (!s) return s;
  const [prefix, hex] = s.split(':');
  if (!hex) return s;
  return `${prefix}:${hex.slice(0, 8)}`;
}
