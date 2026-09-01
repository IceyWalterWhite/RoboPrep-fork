import "server-only";

import { parseServerEnv } from "./env.shared";

/**
 * Server-only environment access.
 *
 * Importing this module from a Client Component fails the build, so
 * `SUPABASE_SERVICE_ROLE_KEY` can never reach the browser bundle.
 */
export const serverEnv = parseServerEnv();

export { env, isSupabaseConfigured } from "./env";
export type { PublicEnv, ServerEnv } from "./env.shared";
