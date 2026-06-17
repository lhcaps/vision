import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEY_LENGTH = 64;
const SALT_BYTES = 16;
const HASH_PREFIX = 'scrypt';

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString('base64url');
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString(
    'base64url',
  );

  return `${HASH_PREFIX}:${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): boolean {
  if (!storedHash) return false;

  const [algorithm, salt, hash] = storedHash.split(':');
  if (algorithm !== HASH_PREFIX || !salt || !hash) return false;

  try {
    const expected = Buffer.from(hash, 'base64url');
    const actual = scryptSync(password, salt, expected.length);

    if (expected.length !== actual.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
