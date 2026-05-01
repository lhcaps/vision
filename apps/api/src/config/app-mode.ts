/**
 * Application mode configuration for VisionFlow Studio.
 * Determines whether the application runs in production or demo mode.
 */

export type AppMode = 'production' | 'demo';

/**
 * Detect the application mode from environment variables.
 *
 * Priority:
 * 1. APP_MODE environment variable (explicit override)
 * 2. DATABASE_URL presence (production if present)
 * 3. Default to demo mode
 */
export function detectMode(): AppMode {
  if (process.env.APP_MODE === 'demo') {
    return 'demo';
  }

  if (process.env.DATABASE_URL) {
    return 'production';
  }

  return 'demo';
}

/**
 * Check if the application is running in production mode.
 */
export function isProductionMode(): boolean {
  return detectMode() === 'production';
}

/**
 * Check if the application is running in demo mode.
 */
export function isDemoMode(): boolean {
  return detectMode() === 'demo';
}
