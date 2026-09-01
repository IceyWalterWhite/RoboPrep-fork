import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Task 13: incremental company stats refresh. Called after a successful
 * publish in addition to the DB trigger from migration 0023 — both paths are
 * idempotent, and a failure here can be retried via the refresh script.
 */
export async function refreshCompanyStats(companyId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return; // cache stays stale; the DB trigger or script will catch up
  const { error } = await admin.rpc("refresh_company_stats", { p_company_id: companyId });
  if (error) {
    console.warn(`[companies] refresh_company_stats failed for ${companyId}: ${error.message}`);
  }
}
