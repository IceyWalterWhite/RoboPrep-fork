import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses Row Level Security.
 *
 * Reserved for trusted server-side work (seeding, backfills, moderation) and
 * never exposed to the browser. Returns `null` when no service-role key is
 * configured so callers can degrade instead of crashing.
 */
export function createAdminClient(): SupabaseClient<Database> | null {
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return null;
  }

  return createClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
