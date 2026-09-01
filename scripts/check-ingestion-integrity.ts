/**
 * Task 64: ingestion data integrity check.
 *
 * Read-only checks over the Week 6 ingestion tables. Requires a reachable
 * Supabase with the migrations applied; exits non-zero on any violation.
 *
 * Usage:
 *   node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/check-ingestion-integrity.ts
 */
import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import { SUBMISSION_TRANSITIONS } from "../src/lib/ingestion/constants";
import type { Database } from "../src/types/database";
import type { SubmissionStatus } from "../src/types/ingestion";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("Ingestion integrity check needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

const failures: string[] = [];
function fail(context: string, problem: string): void {
  failures.push(`${context}: ${problem}`);
}

const VALID_SUBMISSION_STATUSES = new Set(Object.keys(SUBMISSION_TRANSITIONS));
const VALID_DRAFT_STATUSES = new Set(["parsed", "approved", "rejected", "published", "archived"]);
const VALID_JOB_STATUSES = new Set(["queued", "running", "succeeded", "failed", "cancelled"]);
const VALID_JOB_TYPES = new Set(["parse_interview", "canonicalize_questions", "classify_topics", "duplicate_check"]);
const VALID_REVIEW_STATUSES = new Set(["open", "in_review", "approved", "rejected", "blocked"]);

const { data: submissions, error: submissionsError } = await supabase
  .from("interview_submissions")
  .select("id, status, raw_text, submission_type");
if (submissionsError) fail("interview_submissions", submissionsError.message);

const { data: drafts, error: draftsError } = await supabase
  .from("interview_drafts")
  .select("id, submission_id, status, published_interview_id, confidence, parser_version");
if (draftsError) fail("interview_drafts", draftsError.message);

const { data: roundDrafts, error: roundsError } = await supabase
  .from("interview_round_drafts")
  .select("id, draft_id, order_index");
if (roundsError) fail("interview_round_drafts", roundsError.message);

const { data: questionDrafts, error: questionsError } = await supabase
  .from("interview_question_drafts")
  .select("id, draft_id, candidate_question_id, review_status, original_wording, match_score");
if (questionsError) fail("interview_question_drafts", questionsError.message);

const { data: jobs, error: jobsError } = await supabase
  .from("ingestion_jobs")
  .select("id, submission_id, job_type, status, error_code, error_message, finished_at, attempt_count, max_attempts");
if (jobsError) fail("ingestion_jobs", jobsError.message);

const { data: reviewTasks, error: tasksError } = await supabase
  .from("review_tasks")
  .select("id, submission_id, status, draft_id");
if (tasksError) fail("review_tasks", tasksError.message);



const { data: canonicalQuestions } = await supabase.from("questions").select("id");
const canonicalIds = new Set((canonicalQuestions ?? []).map((question) => question.id));

const submissionIds = new Set((submissions ?? []).map((submission) => submission.id));
const draftIds = new Set((drafts ?? []).map((draft) => draft.id));

for (const submission of submissions ?? []) {
  if (!VALID_SUBMISSION_STATUSES.has(submission.status)) {
    fail(`submission ${submission.id}`, `invalid status "${submission.status}"`);
  }
  if (!submission.raw_text?.trim()) {
    fail(`submission ${submission.id}`, "empty raw_text");
  }
}

for (const draft of drafts ?? []) {
  if (!submissionIds.has(draft.submission_id)) {
    fail(`draft ${draft.id}`, "belongs to a missing submission");
  }
  if (!VALID_DRAFT_STATUSES.has(draft.status)) {
    fail(`draft ${draft.id}`, `invalid status "${draft.status}"`);
  }
  if (draft.published_interview_id && draft.status !== "published") {
    fail(`draft ${draft.id}`, "points to a published interview but is not marked published");
  }
}

for (const round of roundDrafts ?? []) {
  if (!draftIds.has(round.draft_id)) fail(`round draft ${round.id}`, "belongs to a missing draft");
}

for (const question of questionDrafts ?? []) {
  if (!draftIds.has(question.draft_id)) fail(`question draft ${question.id}`, "belongs to a missing draft");
  if (!question.original_wording?.trim()) fail(`question draft ${question.id}`, "empty original wording");
  if (question.candidate_question_id && !canonicalIds.has(question.candidate_question_id)) {
    fail(`question draft ${question.id}`, "candidate question id does not exist in questions");
  }
}

for (const job of jobs ?? []) {
  if (!submissionIds.has(job.submission_id)) fail(`job ${job.id}`, "belongs to a missing submission");
  if (!VALID_JOB_TYPES.has(job.job_type)) fail(`job ${job.id}`, `invalid job_type "${job.job_type}"`);
  if (!VALID_JOB_STATUSES.has(job.status)) fail(`job ${job.id}`, `invalid status "${job.status}"`);
  if (job.status === "succeeded" && !job.finished_at) fail(`job ${job.id}`, "succeeded but has no finished_at");
  if (job.status === "failed" && !job.error_code && !job.error_message) {
    fail(`job ${job.id}`, "failed without error info");
  }
  if (job.attempt_count > job.max_attempts) fail(`job ${job.id}`, "attempt_count exceeds max_attempts");
}

for (const task of reviewTasks ?? []) {
  if (!submissionIds.has(task.submission_id)) fail(`review task ${task.id}`, "belongs to a missing submission");
  if (!VALID_REVIEW_STATUSES.has(task.status)) fail(`review task ${task.id}`, `invalid status "${task.status}"`);
}

// Published submissions must point at a real published interview (Task 64).
const { data: publishedInterviews } = await supabase
  .from("interviews")
  .select("id, source_submission_id, status")
  .not("source_submission_id", "is", null);
const interviewBySubmission = new Map(
  (publishedInterviews ?? []).map((interview) => [interview.source_submission_id as string, interview]),
);
for (const submission of submissions ?? []) {
  if (submission.status === "published") {
    const interview = interviewBySubmission.get(submission.id);
    if (!interview) fail(`submission ${submission.id}`, "marked published but has no published interview");
    else if (interview.status !== "published") fail(`submission ${submission.id}`, "published interview is not in published state");
  }
}

// State-machine sanity: no transition may be impossible from `submitted`.
for (const [from, targets] of Object.entries(SUBMISSION_TRANSITIONS)) {
  if (!VALID_SUBMISSION_STATUSES.has(from as SubmissionStatus)) fail("state machine", `unknown source status ${from}`);
  for (const target of targets) {
    if (!VALID_SUBMISSION_STATUSES.has(target)) fail("state machine", `unknown target status ${target}`);
  }
}

if (failures.length > 0) {
  console.error(`✖ ingestion integrity: ${failures.length} violation(s)`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `ok  ingestion integrity: ${(submissions ?? []).length} submissions, ${(drafts ?? []).length} drafts, ` +
    `${(questionDrafts ?? []).length} question drafts, ${(jobs ?? []).length} jobs, ${(reviewTasks ?? []).length} review tasks — 0 violations`,
);
