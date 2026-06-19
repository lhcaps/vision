import { ConfigurationError } from '../../common/application-error';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  it('parses comma-separated CORS origins and adds development loopback', () => {
    const config = new AppConfigService({
      NODE_ENV: 'development',
      API_CORS_ORIGIN: 'http://a.test, http://b.test, http://a.test',
    });

    expect(config.corsPolicy).toEqual({
      allowAll: false,
      origins: [
        'http://a.test',
        'http://b.test',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://[::1]:3000',
      ],
    });
  });

  it('normalizes the API global prefix', () => {
    const config = new AppConfigService({
      API_GLOBAL_PREFIX: '/api/v2/',
    });

    expect(config.apiGlobalPrefix).toBe('api/v2');
  });

  it('returns the configured repository-root override', () => {
    const config = new AppConfigService({
      REPO_ROOT: ' D:/workspace/quanlyvks ',
    });

    expect(config.repoRootOverride).toBe('D:/workspace/quanlyvks');
  });

  it('exposes validated auth cookie and session settings', () => {
    const config = new AppConfigService({
      AUTH_SESSION_COOKIE_NAME: ' custom_session ',
      AUTH_SESSION_TTL_DAYS: '30',
      AUTH_COOKIE_SECURE: 'true',
      AUTH_COOKIE_DOMAIN: ' .qlv.local ',
      AUTH_COOKIE_SAMESITE: 'strict',
    });

    expect(config.authSessionCookieName).toBe('custom_session');
    expect(config.authSessionTtlMs).toBe(30 * 24 * 60 * 60 * 1000);
    expect(config.authCookieSecure).toBe(true);
    expect(config.authCookieDomain).toBe('.qlv.local');
    expect(config.authCookieSameSite).toBe('strict');
  });

  it('rejects invalid auth session settings', () => {
    const invalidTtl = new AppConfigService({
      AUTH_SESSION_TTL_DAYS: '0',
    });
    const invalidSameSite = new AppConfigService({
      AUTH_COOKIE_SAMESITE: 'sometimes',
    });

    expect(() => invalidTtl.authSessionTtlMs).toThrow(
      'AUTH_SESSION_TTL_DAYS must be a positive integer',
    );
    expect(() => invalidSameSite.authCookieSameSite).toThrow(
      'AUTH_COOKIE_SAMESITE must be one of',
    );
  });

  it('normalizes the optional LibreOffice executable path', () => {
    const config = new AppConfigService({
      LIBREOFFICE_PATH: ' "C:\\Program Files\\LibreOffice\\soffice.exe" ',
    });

    expect(config.libreOfficePath).toBe(
      'C:\\Program Files\\LibreOffice\\soffice.exe',
    );
  });

  it('rejects wildcard CORS in production', () => {
    const config = new AppConfigService({
      NODE_ENV: 'production',
      API_CORS_ORIGIN: '*',
      AUTH_COOKIE_SECURE: 'true',
      SEED_ADMIN_PASSWORD: 'strong-password',
    });

    expect(() => config.assertProductionSafety()).toThrow(
      new ConfigurationError(
        'PRODUCTION_CORS_WILDCARD',
        'API_CORS_ORIGIN="*" is forbidden in production.',
      ),
    );
  });

  it('rejects an insecure production auth cookie', () => {
    const config = new AppConfigService({
      NODE_ENV: 'production',
      API_CORS_ORIGIN: 'https://app.test',
      AUTH_COOKIE_SECURE: 'false',
      SEED_ADMIN_PASSWORD: 'strong-password',
    });

    expect(() => config.assertProductionSafety()).toThrow(
      'AUTH_COOKIE_SECURE must be "true" in production.',
    );
  });

  it('rejects the default administrator password in production', () => {
    const config = new AppConfigService({
      NODE_ENV: 'production',
      API_CORS_ORIGIN: 'https://app.test',
      AUTH_COOKIE_SECURE: 'true',
      SEED_ADMIN_PASSWORD: 'admin123',
    });

    expect(() => config.assertProductionSafety()).toThrow(
      'SEED_ADMIN_PASSWORD must be changed before production.',
    );
  });

  it('rejects an invalid API port', () => {
    const config = new AppConfigService({
      API_PORT: 'not-a-port',
    });

    expect(() => config.apiPort).toThrow('API_PORT must be an integer');
  });
});
