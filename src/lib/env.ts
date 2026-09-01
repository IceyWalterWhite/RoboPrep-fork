import { parsePublicEnv, PUBLIC_FALLBACK } from "./env.shared";

/**
 * Public environment values (`NEXT_PUBLIC_*`).
 *
 * Safe to import anywhere, including Client Components. Server-only secrets live
 * in `./env.server`.
 */
export const env = parsePublicEnv();

/** True when real Supabase credentials are present. */
export const isSupabaseConfigured =
  env.NEXT_PUBLIC_SUPABASE_URL !== PUBLIC_FALLBACK.NEXT_PUBLIC_SUPABASE_URL &&
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== PUBLIC_FALLBACK.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type { PublicEnv, ServerEnv } from "./env.shared";
