/**
 * Import community interview contributions from contributions/interviews.json.
 *
 * Maintainer workflow (run after merging a contribution PR):
 *   pnpm import:contributions
 *
 * For each entry: validate (Zod) → dedupe (exact raw-text match) → create the
 * immutable raw submission via the ingestion service (events recorded) →
 * enqueue and run a parse job (mock parser locally, configured LLM in
 * production). Everything then waits in the human review queue at
 * /admin/interviews/review — nothing is published automatically.
 *
 * Safe to re-run: already-imported entries (same raw text) are skipped.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { envValue, loadProjectEnv } from "./lib/load-env";
import {
  createSubmission,
  enqueueParseJob,
  runParseJob,
} from "../src/lib/ingestion/service";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("Import needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

const contributionSchema = z.object({
  companyHint: z.string().trim().max(120).optional(),
  positionHint: z.string().trim().max(120).optional(),
  yearHint: z.coerce.number().int().min(1990).max(2100).optional(),
  seasonHint: z.enum(["spring", "summer", "fall", "winter"]).optional(),
  locationHint: z.string().trim().max(120).optional(),
  language: z.string().max(12).default("zh-CN"),
  submissionType: z.enum(["user_text", "public_source"]).default("user_text"),
  sourceUrl: z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), "only http(s) URLs")
    .optional()
    .or(z.literal("")),
  rawText: z.string().trim().min(50, "rawText must be at least 50 characters").max(50_000),
});

type Contribution = z.infer<typeof contributionSchema>;

let entries: unknown[];
try {
  entries = JSON.parse(readFileSync(resolve(process.cwd(), "contributions/interviews.json"), "utf8"));
} catch (error) {
  console.error(`✖ could not read contributions/interviews.json: ${error instanceof Error ? error.message : error}`);
  process.exit(2);
}

let imported = 0;
let skipped = 0;
let failed = 0;

for (const [index, entry] of entries.entries()) {
  const parsed = contributionSchema.safeParse(entry);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    console.error(`✖ entry #${index + 1}: ${first.path.join(".") || "(root)"} — ${first.message}`);
    failed += 1;
    continue;
  }
  const contribution: Contribution = parsed.data;

  // Idempotency: exact raw-text match means this entry is already imported.
  const { data: existing } = await supabase
    .from("interview_submissions")
    .select("id, status")
    .eq("raw_text", contribution.rawText)
    .limit(1);
  if (existing && existing.length > 0) {
    skipped += 1;
    console.log(`  skip  #${index + 1} already imported (status: ${existing[0].status})`);
    continue;
  }

  const submission = await createSubmission(supabase, null, {
    rawText: contribution.rawText,
    submissionType: contribution.submissionType,
    sourceUrl: contribution.sourceUrl || null,
    companyHint: contribution.companyHint || null,
    positionHint: contribution.positionHint || null,
    yearHint: contribution.yearHint ?? null,
    seasonHint: contribution.seasonHint ?? null,
    locationHint: contribution.locationHint || null,
    language: contribution.language,
  });
  imported += 1;

  // Parse immediately so the entries land in the review queue ready to review.
  // A parse failure is non-fatal: the submission stays retryable from /admin.
  try {
    const job = await enqueueParseJob(supabase, submission.id);
    await runParseJob(supabase, job.id);
    console.log(`  ok    #${index + 1} imported + parsed → review queue (${contribution.companyHint ?? "unknown company"})`);
  } catch (error) {
    console.log(
      `  ok    #${index + 1} imported, parse failed (${error instanceof Error ? error.message.slice(0, 80) : "unknown"}) — retry from /admin`,
    );
  }
}

console.log(`\nimported ${imported}, skipped ${skipped}, failed ${failed}.`);
console.log("Review and publish at /admin/interviews/review — nothing is published automatically.");
process.exit(failed > 0 ? 1 : 0);
