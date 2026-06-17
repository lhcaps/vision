import { hashPassword, verifyPassword } from './password.util';

describe('password.util', () => {
  it('hashes passwords with scrypt and verifies the original password', () => {
    const hash = hashPassword('CorrectHorseBatteryStaple!');

    expect(hash).toMatch(/^scrypt:[^:]+:[^:]+$/);
    expect(verifyPassword('CorrectHorseBatteryStaple!', hash)).toBe(true);
    expect(verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('rejects malformed or empty hashes without throwing', () => {
    expect(verifyPassword('anything', '')).toBe(false);
    expect(verifyPassword('anything', 'not-a-real-hash')).toBe(false);
    expect(verifyPassword('anything', 'scrypt:missing-hash')).toBe(false);
  });
});
