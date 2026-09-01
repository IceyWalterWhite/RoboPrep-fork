/**
 * Task 12: deterministic full rebuild of all company intelligence caches.
 *
 * Recomputes company_stats, company_position_stats, company_topic_stats,
 * company_question_stats, company_coding_problem_stats, company_season_stats,
 * company_difficulty_stats, and company_round_type_stats from published
 * interviews via the refresh_company_stats RPC (migration 0023). Idempotent:
 * running twice produces identical results.
 *
 * Usage:
 *   node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/refresh-company-stats.ts [companySlug]
 */
import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("Company stats refresh needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

const companySlug = process.argv[2];
let companyId: string | null = null;

if (companySlug) {
  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("slug", companySlug)
    .maybeSingle();
  if (!company) {
    console.error(`Company "${companySlug}" not found.`);
    process.exit(2);
  }
  companyId = company.id;
  console.log(`Refreshing company stats for ${company.name}…`);
} else {
  console.log("Refreshing company stats for all companies…");
}

const startedAt = Date.now();
const { error } = await supabase.rpc("refresh_company_stats", companyId ? { p_company_id: companyId } : {});
if (error) {
  console.error(`✖ refresh failed: ${error.message}`);
  process.exit(1);
}
console.log(`ok  refresh_company_stats completed in ${Date.now() - startedAt} ms`);
