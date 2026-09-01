import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/** Current Supabase auth user, or `null` for anonymous visitors. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface ViewerProfile {
  id: string;
  displayName: string | null;
  username: string | null;
}

/**
 * Public profile row for the signed-in user.
 *
 * Returns `null` when there is no user, no profile row, or the query fails —
 * callers fall back to the email address, so a missing row never breaks the UI.
 */
export async function getCurrentProfile(userId: string): Promise<ViewerProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    displayName: data.display_name,
    username: data.username,
  };
}
