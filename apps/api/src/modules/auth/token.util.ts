import { createHash, randomBytes } from 'node:crypto';

/**
 * Sinh session token ngẫu nhiên (URL-safe) + hash để lưu DB.
 * Token raw gửi cho client qua cookie; hash lưu DB để verify (không lưu raw).
 */
export function generateSessionToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = hashSessionToken(raw);
  return { raw, hash };
}

export function hashSessionToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}
