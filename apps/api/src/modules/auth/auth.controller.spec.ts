import 'reflect-metadata';
import { AuthController } from './auth.controller';

const THROTTLER_LIMIT_DEFAULT = 'THROTTLER:LIMITdefault';
const THROTTLER_TTL_DEFAULT = 'THROTTLER:TTLdefault';

describe('AuthController throttling', () => {
  it('limits login to five attempts per minute', () => {
    const loginHandler = AuthController.prototype.login;

    expect(Reflect.getMetadata(THROTTLER_LIMIT_DEFAULT, loginHandler)).toBe(5);
    expect(Reflect.getMetadata(THROTTLER_TTL_DEFAULT, loginHandler)).toBe(
      60_000,
    );
  });
});
