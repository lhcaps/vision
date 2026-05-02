/**
 * Application mode configuration for VisionFlow Studio.
 * Determines whether the application uses database or in-memory stores.
 *
 * Priority:
 *  1. DATA_MODE env var (explicit, preferred)
 *  2. APP_MODE env var (backwards-compatible fallback)
 *  3. DATABASE_URL presence (legacy heuristic)
 */

export type DataMode = 'database' | 'memory';

/**
 * Detect data mode from environment variables.
 * DATA_MODE is the preferred explicit override.
 */
export function detectMode(): DataMode {
  if (process.env.DATA_MODE === 'database') return 'database';
  if (process.env.DATA_MODE === 'memory') return 'memory';

  if (process.env.APP_MODE === 'demo') return 'memory';
  if (process.env.APP_MODE === 'production') return 'database';

  if (process.env.DATABASE_URL) return 'database';

  return 'memory';
}

export function isDatabaseMode(): boolean {
  return detectMode() === 'database';
}

export function isMemoryMode(): boolean {
  return detectMode() === 'memory';
}
