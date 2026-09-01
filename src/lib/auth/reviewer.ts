import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ReviewerRole } from "@/types/ingestion";

/**
 * Reviewer authorization (Task 30): one simple `profiles.role` column
 * (user | reviewer | admin). Role checks are centralized here; admin pages
 * and mutation routes must call these functions server-side.
 */

export interface Viewer {
  id: string;
  role: ReviewerRole;
}

export async function getViewerRole(userId: string): Promise<ReviewerRole> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return (data?.role as ReviewerRole | undefined) ?? "user";
}

/** Resolve the current viewer; `null` when signed out. */
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, role: await getViewerRole(user.id) };
}

export function isReviewer(viewer: Viewer | null): boolean {
  return viewer?.role === "reviewer" || viewer?.role === "admin";
}

export function isAdmin(viewer: Viewer | null): boolean {
  return viewer?.role === "admin";
}

/**
 * Guard for admin pages/routes: returns the viewer when authorized, else
 * `null`. Callers render a 404/403 or redirect — the check itself never
 * throws so it can be used in server components.
 */
export async function requireReviewer(): Promise<Viewer | null> {
  const viewer = await getViewer();
  return isReviewer(viewer) ? viewer : null;
}
