import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/judge/rate-limit";
import {
  SUBMISSION_RATE_LIMIT,
  SUBMISSION_RATE_WINDOW_MS,
} from "@/lib/ingestion/constants";
import {
  createSubmission,
  enqueueParseJob,
  runParseJob,
} from "@/lib/ingestion/service";
import { submissionRequestSchema } from "@/lib/ingestion/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getRequestId } from "@/lib/server/request";

export const runtime = "nodejs";

/**
 * POST /api/interviews/submit — create a raw submission and enqueue its
 * initial parse. The client provides only the raw text and optional hints;
 * status, limits, and pipeline behavior are server-authoritative.
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);
  if (!isFeatureEnabled("interview_submission")) {
    return Response.json(
      { error: "面试投稿暂时暂停，请稍后再来查看。" },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "请登录后提交面试经历。" }, { status: 401 });
  }

  const rate = checkRateLimit(
    `interview-submit:${user.id}`,
    SUBMISSION_RATE_LIMIT,
    SUBMISSION_RATE_WINDOW_MS,
  );
  if (!rate.allowed) {
    return Response.json(
      { error: "当前投稿次数过多，请稍后再试。" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求内容无效。" }, { status: 400 });
  }

  const parsed = submissionRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      { error: first?.message ?? "投稿内容无效。", field: first?.path.join(".") },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "投稿服务尚未配置。" }, { status: 503 });
  }

  const submission = await createSubmission(admin, user.id, {
    rawText: data.rawText,
    submissionType: "user_text",
    sourceUrl: data.sourceUrl || null,
    companyHint: data.companyHint || null,
    positionHint: data.positionHint || null,
    yearHint: data.yearHint ?? null,
    seasonHint: data.seasonHint ?? null,
    locationHint: data.locationHint || null,
    language: data.language,
  });

  // Server-triggered worker (Task 49): run the first parse inline, but never
  // fail the user's submission when parsing fails — the job stays retryable.
  let parseError: string | null = null;
  try {
    const job = await enqueueParseJob(admin, submission.id);
    await runParseJob(admin, job.id);
  } catch (error) {
    parseError = error instanceof Error ? error.message : "解析失败";
  }

  return Response.json({ id: submission.id, parseError }, { status: 201 });
}
