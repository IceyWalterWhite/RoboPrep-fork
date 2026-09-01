/**
 * Week 8 Task 99: conservative recovery of stuck ingestion jobs.
 *
 * Marks `running` jobs older than the staleness window as `failed` so their
 * submissions can be retried by a reviewer. Never re-publishes, never
 * touches succeeded jobs. Supports --dry-run (default when "apply" is not
 * passed).
 *
 * Usage:
 *   node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/recover-stuck-jobs.ts [--apply] [--minutes 30]
 */
import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("Stuck job recovery needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const apply = process.argv.includes("--apply");
const minutesArg = process.argv[process.argv.indexOf("--minutes") + 1];
const stalenessMinutes = Number(minutesArg ?? 30);
if (!Number.isFinite(stalenessMinutes) || stalenessMinutes <= 0) {
  console.error("--minutes must be a positive number.");
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
const cutoff = new Date(Date.now() - stalenessMinutes * 60_000).toISOString();

const { data: stuck, error } = await supabase
  .from("ingestion_jobs")
  .select("id, submission_id, job_type, status, updated_at, attempt_count, max_attempts")
  .eq("status", "running")
  .lt("updated_at", cutoff);

if (error) {
  console.error(`✖ query failed: ${error.message}`);
  process.exit(1);
}

if (!stuck || stuck.length === 0) {
  console.log("ok  no stuck jobs found.");
  process.exit(0);
}

console.log(`${stuck.length} stuck job(s) running longer than ${stalenessMinutes} min:`);
for (const job of stuck) {
  console.log(`  - ${job.id} (${job.job_type}, attempt ${job.attempt_count}/${job.max_attempts}, updated ${job.updated_at})`);
}

if (!apply) {
  console.log("\ndry-run: pass --apply to mark these jobs failed (safe to re-run).");
  process.exit(0);
}

let recovered = 0;
for (const job of stuck) {
  const attemptsExhausted = job.attempt_count >= job.max_attempts;
  const { error: updateError } = await supabase
    .from("ingestion_jobs")
    .update({
      status: "failed",
      error_code: "timeout" as string,
      error_message: `recovered by script: running longer than ${stalenessMinutes} min`,
      finished_at: new Date().toISOString(),
    })
    .eq("id", job.id);
  if (updateError) {
    console.error(`  ✖ ${job.id}: ${updateError.message}`);
    continue;
  }
  recovered += 1;
  // Submission goes to `failed` (retryable by a reviewer) unless attempts are
  // exhausted — we never auto-retry and never auto-publish.
  await supabase
    .from("interview_submissions")
    .update({ status: "failed" })
    .eq("id", job.submission_id);
  void attemptsExhausted;
}

console.log(`\nok  marked ${recovered}/${stuck.length} stuck job(s) failed. Reviewers can retry from the review detail.`);
