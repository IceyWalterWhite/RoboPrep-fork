import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCodingProblemBySlug, getCodingJudgeDefinition, getMLJudgeDefinition } from "@/lib/coding/queries";
import { mlScore, mlSubmissionCaseRows, runMLCases } from "@/lib/judge/execute-ml";
import { checkRateLimit } from "@/lib/judge/rate-limit";
import { createJudgeService, judgeCases } from "@/lib/judge/service";
import { codingExecutionRequestSchema } from "@/lib/judge/validation";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";

const SUBMIT_LIMIT = 10;
const SUBMIT_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  if (!isFeatureEnabled("coding_judge")) {
    return Response.json(
      { error: "The coding judge is temporarily offline. Browsing and progress are unaffected." },
      { status: 503 },
    );
  }
  const parsed = await parseRequest(request);
  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Sign in to submit a solution." }, { status: 401 });
  }

  const rate = checkRateLimit(`submit:${user.id}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many submissions. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const publicProblem = await getCodingProblemBySlug(parsed.data.slug);
  if (!publicProblem) {
    return Response.json({ error: "Coding problem not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "The submission service is not configured." }, { status: 503 });
  }

  // Structured problems take the ML path (hidden tests, redacted feedback,
  // persisted group breakdown). Program problems keep the Week 4 flow.
  if (publicProblem.evaluation.evaluationMode !== "program") {
    return submitStructured({
      admin,
      userId: user.id,
      slug: parsed.data.slug,
      sourceCode: parsed.data.sourceCode,
    });
  }

  const definition = await getCodingJudgeDefinition(parsed.data.slug);
  if (!definition) {
    return Response.json({ error: "The submission judge is not configured yet." }, { status: 503 });
  }
  if (definition.tests.length === 0) {
    return Response.json({ error: "This problem has no test cases yet." }, { status: 422 });
  }

  const submissionId = await createSubmission(admin, user.id, definition.id, parsed.data.sourceCode);
  if (!submissionId) {
    return Response.json({ error: "Could not create the submission." }, { status: 500 });
  }
  await markRunning(admin, submissionId, user.id);

  const judged = await judgeCases(
    createJudgeService(),
    {
      sourceCode: parsed.data.sourceCode,
      language: definition.language,
      timeLimitMs: definition.timeLimitMs,
      memoryLimitMb: definition.memoryLimitMb,
      comparisonMode: definition.comparisonMode,
      tolerance: definition.tolerance,
    },
    definition.tests.map((testCase) => ({
      id: testCase.id,
      name: testCase.is_hidden ? null : testCase.name,
      inputData: testCase.input_data,
      expectedOutput: testCase.expected_output,
      weight: testCase.weight,
    })),
  );

  const completedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("coding_submissions")
    .update({
      status: judged.status,
      score: judged.score,
      runtime_ms: judged.runtimeMs,
      memory_kb: judged.memoryKb,
      error_message: judged.status === "internal_error" ? "The judge did not return a usable result." : null,
      completed_at: completedAt,
    })
    .eq("id", submissionId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[coding] failed to finish submission", updateError);
    return Response.json({ error: "The submission finished but could not be saved." }, { status: 500 });
  }

  const caseRows = judged.cases.map((result) => ({
    submission_id: submissionId,
    test_case_id: result.testCaseId,
    status: result.status,
    runtime_ms: result.runtimeMs,
    memory_kb: result.memoryKb,
    stdout: result.stdout,
    stderr: result.stderr,
  }));
  const { error: casesError } = await admin.from("coding_submission_cases").insert(caseRows);
  if (casesError) console.error("[coding] failed to save submission cases", casesError);

  return Response.json({
    mode: "program" as const,
    submission: {
      id: submissionId,
      status: judged.status,
      score: judged.score,
      runtimeMs: judged.runtimeMs,
      memoryKb: judged.memoryKb,
      completedAt,
    },
    // Hidden expected outputs and inputs never cross this boundary. Per-case
    // status is useful feedback without revealing the answer key.
    cases: judged.cases.map((result, index) => ({
      index: index + 1,
      status: result.status,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
      message: result.message,
    })),
  });
}

/**
 * Structured Submit (Week 5 Tasks 18, 25, 49).
 *
 * - runs every authored case, visible and hidden
 * - persists a redacted group breakdown so history renders without a rerun
 * - returns redacted diagnostics: hidden cases expose pass/fail only
 */
async function submitStructured(options: {
  admin: NonNullable<ReturnType<typeof createAdminClient>>;
  userId: string;
  slug: string;
  sourceCode: string;
}) {
  const { admin, userId, slug, sourceCode } = options;
  const definition = await getMLJudgeDefinition(slug);
  if (!definition) {
    return Response.json({ error: "This problem has no structured test cases yet." }, { status: 422 });
  }

  const submissionId = await createSubmission(admin, userId, definition.id, sourceCode);
  if (!submissionId) {
    return Response.json({ error: "Could not create the submission." }, { status: 500 });
  }
  await markRunning(admin, submissionId, userId);

  const outcome = await runMLCases(definition, sourceCode, { visibleOnly: false });
  const completedAt = new Date().toISOString();
  const score = mlScore(outcome.evaluation);

  const { error: updateError } = await admin
    .from("coding_submissions")
    .update({
      status: outcome.status,
      score,
      runtime_ms: outcome.runtimeMs,
      memory_kb: null,
      error_message:
        outcome.status === "internal_error" ? "The evaluator did not return a usable result." : null,
      evaluation_summary: outcome.summary as never,
      completed_at: completedAt,
    })
    .eq("id", submissionId)
    .eq("user_id", userId);

  if (updateError) {
    console.error("[coding] failed to finish ML submission", updateError);
    return Response.json({ error: "The submission finished but could not be saved." }, { status: 500 });
  }

  const caseRows = mlSubmissionCaseRows(outcome.evaluation).map((row) => ({
    submission_id: submissionId,
    ...row,
  }));
  const { error: casesError } = await admin.from("coding_submission_cases").insert(caseRows);
  if (casesError) console.error("[coding] failed to save ML submission cases", casesError);

  return Response.json({
    mode: definition.evaluationMode,
    framework: definition.framework,
    submission: {
      id: submissionId,
      status: outcome.status,
      score,
      runtimeMs: outcome.runtimeMs,
      memoryKb: null,
      completedAt,
    },
    evaluation: outcome.evaluation,
  });
}

async function createSubmission(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  problemId: string,
  sourceCode: string,
): Promise<string | null> {
  const { data: submission, error } = await admin
    .from("coding_submissions")
    .insert({ user_id: userId, problem_id: problemId, language: "python", source_code: sourceCode, status: "queued" })
    .select("id")
    .single();
  if (error || !submission) {
    console.error("[coding] failed to create submission", error);
    return null;
  }
  return submission.id;
}

async function markRunning(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  submissionId: string,
  userId: string,
): Promise<void> {
  await admin
    .from("coding_submissions")
    .update({ status: "running" })
    .eq("id", submissionId)
    .eq("user_id", userId);
}

async function parseRequest(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = codingExecutionRequestSchema.safeParse(body);
    if (result.success) return result;
    return { success: false as const, error: "Invalid coding request." };
  } catch {
    return { success: false as const, error: "Request body must be valid JSON." };
  }
}
