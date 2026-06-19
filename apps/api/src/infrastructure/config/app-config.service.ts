import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigurationError } from '../../common/application-error';
import {
  resolveCorsPolicy,
  type CorsOriginPolicy,
} from '../../common/cors-origin';

type Environment = Readonly<Record<string, string | undefined>>;
type AuthCookieSameSite = 'lax' | 'strict' | 'none';

export const APP_ENV = Symbol('APP_ENV');

@Injectable()
export class AppConfigService {
  private readonly env: Environment;

  constructor(
    @Optional()
    @Inject(APP_ENV)
    env?: Environment,
  ) {
    this.env = env ?? process.env;
  }

  get environment(): string {
    return this.read('NODE_ENV') ?? 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  get apiPort(): number {
    const raw = this.read('API_PORT') ?? '3001';
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      throw new ConfigurationError(
        'INVALID_API_PORT',
        `API_PORT must be an integer between 1 and 65535; received "${raw}".`,
      );
    }
    return port;
  }

  get apiGlobalPrefix(): string {
    const prefix = (this.read('API_GLOBAL_PREFIX') ?? 'api/v1')
      .replace(/^\/+|\/+$/g, '')
      .trim();

    if (!prefix) {
      throw new ConfigurationError(
        'INVALID_API_GLOBAL_PREFIX',
        'API_GLOBAL_PREFIX must not be empty.',
      );
    }
    return prefix;
  }

  get corsPolicy(): CorsOriginPolicy {
    return resolveCorsPolicy(
      this.read('API_CORS_ORIGIN') ?? 'http://localhost:3000',
      this.environment,
    );
  }

  get repoRootOverride(): string | undefined {
    return this.read('REPO_ROOT');
  }

  get storageRoot(): string {
    return this.read('STORAGE_ROOT') ?? './storage';
  }

  get isSwaggerEnabled(): boolean {
    return !this.isProduction || this.readBoolean('SWAGGER_ENABLED', false);
  }

  get authCookieSecure(): boolean {
    return this.readBoolean('AUTH_COOKIE_SECURE', false);
  }

  get authSessionCookieName(): string {
    return this.read('AUTH_SESSION_COOKIE_NAME') ?? 'qlv_session';
  }

  get authSessionTtlMs(): number {
    const raw = this.read('AUTH_SESSION_TTL_DAYS') ?? '14';
    const days = Number(raw);
    if (!Number.isInteger(days) || days < 1) {
      throw new ConfigurationError(
        'INVALID_AUTH_SESSION_TTL',
        `AUTH_SESSION_TTL_DAYS must be a positive integer; received "${raw}".`,
      );
    }
    return days * 24 * 60 * 60 * 1000;
  }

  get authCookieDomain(): string | undefined {
    return this.read('AUTH_COOKIE_DOMAIN');
  }

  get authCookieSameSite(): AuthCookieSameSite {
    const value = (this.read('AUTH_COOKIE_SAMESITE') ?? 'lax').toLowerCase();
    if (value === 'lax' || value === 'strict' || value === 'none') {
      return value;
    }
    throw new ConfigurationError(
      'INVALID_AUTH_COOKIE_SAMESITE',
      `AUTH_COOKIE_SAMESITE must be one of "lax", "strict", or "none"; received "${value}".`,
    );
  }

  get libreOfficePath(): string | undefined {
    return this.read('LIBREOFFICE_PATH')?.replace(/^"|"$/g, '');
  }

  assertProductionSafety(): void {
    if (!this.isProduction) return;

    if (!this.authCookieSecure) {
      throw new ConfigurationError(
        'INSECURE_PRODUCTION_COOKIE',
        'AUTH_COOKIE_SECURE must be "true" in production.',
      );
    }

    if ((this.read('SEED_ADMIN_PASSWORD') ?? '') === 'admin123') {
      throw new ConfigurationError(
        'DEFAULT_PRODUCTION_ADMIN_PASSWORD',
        'SEED_ADMIN_PASSWORD must be changed before production.',
      );
    }

    if (this.corsPolicy.allowAll) {
      throw new ConfigurationError(
        'PRODUCTION_CORS_WILDCARD',
        'API_CORS_ORIGIN="*" is forbidden in production.',
      );
    }
  }

  private read(key: string): string | undefined {
    const value = this.env[key]?.trim();
    return value ? value : undefined;
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const value = this.read(key);
    if (value === undefined) return fallback;
    return value === '1' || value.toLowerCase() === 'true';
  }
}
