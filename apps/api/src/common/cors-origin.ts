export type CorsOriginPolicy = {
  allowAll: boolean;
  origins: string[];
};

export type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

const DEVELOPMENT_LOOPBACK_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://[::1]:3000',
];

/**
 * Parse the configured CORS allow-list into a deterministic policy.
 */
export function resolveCorsPolicy(
  configured: string,
  environment: string,
): CorsOriginPolicy {
  if (configured.trim() === '*') {
    return {
      allowAll: true,
      origins: [],
    };
  }

  const origins = new Set(
    configured
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  if (environment !== 'production') {
    for (const origin of DEVELOPMENT_LOOPBACK_ORIGINS) {
      origins.add(origin);
    }
  }

  return {
    allowAll: false,
    origins: [...origins],
  };
}

/**
 * Build the callback expected by the Express CORS integration.
 */
export function createCorsOriginValidator(policy: CorsOriginPolicy) {
  const allowedOrigins = new Set(policy.origins);

  return (origin: string | undefined, callback: CorsOriginCallback): void => {
    if (policy.allowAll || !origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin is not allowed: ${origin}`), false);
  };
}
