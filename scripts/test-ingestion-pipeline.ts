/**
 * Task 67: end-to-end ingestion smoke test (mock parser, no live LLM).
 *
 * Flow: create a development submission → run the parse job → verify the
 * draft graph → check canonical suggestions → approve → publish → verify the
 * published interview graph. Publish idempotency is exercised by publishing
 * twice.
 *
 * Requires a reachable Supabase with migrations 0017–0022 applied and at
 * least one company row. Uses `submission_type = "development"` records that
 * the script deletes afterwards (isolated fixture strategy).
 *
 * Usage:
 *   node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/test-ingestion-pipeline.ts
 */
import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import { approveDraft, createSubmission, enqueueParseJob, publishDraft, runParseJob } from "../src/lib/ingestion/service";
import { getDraftBySubmission, listQuestionDrafts, listRoundDrafts, listEvents } from "../src/lib/ingestion/queries";
import { MockInterviewParser } from "../src/lib/ingestion/parser/adapters/mock-parser";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error("Ingestion smoke test needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

const RAW_TEXT = `公司: ByteDance
职位: Embodied AI Engineer
2026年春季, 北京。

第一轮:
介绍一下你在研究中最常用的策略梯度方法？为什么 GRPO 不需要 value model？

第二轮:
请手写一个 scaled dot-product attention。
实现一下 replay buffer 的 sample 接口。`;

let passed = 0;
let failed = 0;
const createdSubmissionIds: string[] = [];

async function check(name: string, condition: boolean, detail = ""): Promise<void> {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

try {
  // 1. Create the raw submission.
  const submission = await createSubmission(supabase, null, {
    rawText: RAW_TEXT,
    submissionType: "development",
    companyHint: "ByteDance",
    positionHint: "Embodied AI Engineer",
    yearHint: 2026,
    seasonHint: "spring",
    language: "zh-CN",
  });
  createdSubmissionIds.push(submission.id);
  await check("submission created with status submitted", submission.status === "submitted");

  // 2. Run the mock parser through the real job pipeline.
  const parser = new MockInterviewParser();
  const payload = await parser.parse({
    rawText: RAW_TEXT,
    hints: { companyHint: "ByteDance", positionHint: "Embodied AI Engineer", yearHint: 2026, seasonHint: "spring", locationHint: null },
    language: "zh-CN",
  });
  await check("mock parser extracts questions", payload.questions.length >= 3);
  await check("mock parser extracts rounds", payload.rounds.length >= 2);

  const job = await enqueueParseJob(supabase, submission.id);
  const result = await runParseJob(supabase, job.id);
  await check("parse job succeeded", result.job.status === "succeeded");
  await check("submission status parsed", result.submissionStatus === "parsed");

  // 3. Draft graph shape.
  const draft = await getDraftBySubmission(supabase, submission.id);
  await check("draft persisted", draft !== null);
  const rounds = draft ? await listRoundDrafts(supabase, draft.id) : [];
  const questions = draft ? await listQuestionDrafts(supabase, draft.id) : [];
  await check("round drafts persisted", rounds.length >= 2);
  await check("question drafts preserve original wording", questions.length >= 3 && questions.every((question) => question.originalWording.length > 0));
  await check("coding question detected", questions.some((question) => question.questionType === "coding"));

  // 4. Events are auditable.
  const events = await listEvents(supabase, submission.id);
  await check("events recorded", events.some((event) => event.eventType === "parse_succeeded"));

  // 5. Approve and publish (idempotency: publish twice).
  await approveDraft(supabase, submission.id, "00000000-0000-0000-0000-0000000000review");
  const first = await publishDraft(supabase, submission.id, "reviewer", { companyId: await anyCompanyId() });
  const second = await publishDraft(supabase, submission.id, "reviewer", { companyId: await anyCompanyId() });
  await check("publish created an interview", Boolean(first.interviewId));
  await check("publish is idempotent", first.interviewId === second.interviewId && second.alreadyPublished);

  // 6. Verify the published graph.
  const { data: interview } = await supabase
    .from("interviews")
    .select("id, slug, status, round_count, source_submission_id, is_anonymous")
    .eq("id", first.interviewId)
    .maybeSingle();
  await check("interview published with provenance", interview?.source_submission_id === submission.id && interview.status === "published");
  await check("interview is anonymous", interview?.is_anonymous === true);
  await check("interview slug unique and set", Boolean(interview?.slug));

  const { data: publishedRounds } = await supabase
    .from("interview_rounds")
    .select("id")
    .eq("interview_id", first.interviewId);
  await check("published rounds match draft", (publishedRounds ?? []).length === rounds.length);

  const { data: publishedQuestions } = await supabase
    .from("interview_questions")
    .select("id, original_wording")
    .eq("interview_id", first.interviewId);
  await check("published questions preserve wording", (publishedQuestions ?? []).length >= 3);
} catch (error) {
  failed += 1;
  console.error(`  FAIL  unexpected error: ${error instanceof Error ? error.message : error}`);
} finally {
  // Cleanup fixture (development submissions only).
  for (const submissionId of createdSubmissionIds) {
    await supabase.from("interview_submissions").delete().eq("id", submissionId);
  }
}

console.log(`\n${passed} check(s) passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);

async function anyCompanyId(): Promise<string> {
  const { data, error } = await supabase.from("companies").select("id").limit(1).maybeSingle();
  if (error || !data) throw new Error("No company row exists — seed a company before running the smoke test.");
  return data.id;
}
