/**
 * Load .env from the project root (or current directory) before any other module
 * initializes. Must be the first import in main.ts entrypoint so that app-mode
 * detection, PrismaService, and all other modules see the same environment.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

const rootEnv = resolve(process.cwd(), '../../.env');
const cwdEnv = resolve(process.cwd(), '.env');

if (existsSync(rootEnv)) {
  config({ path: rootEnv });
} else if (existsSync(cwdEnv)) {
  config({ path: cwdEnv });
}
