import { getCodingProblemBySlug, getMLJudgeDefinition } from "@/lib/coding/queries";
import { checkRateLimit } from "@/lib/judge/rate-limit";
import { runMLCases } from "@/lib/judge/execute-ml";
import { createJudgeService, judgeCases } from "@/lib/judge/service";
import { codingExecutionRequestSchema } from "@/lib/judge/validation";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";

const RUN_LIMIT = 20;
const RUN_WINDOW_MS = 5 * 60 * 1000;

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

  const rate = checkRateLimit(`run:${requestKey(request)}`, RUN_LIMIT, RUN_WINDOW_MS);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many runs. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const problem = await getCodingProblemBySlug(parsed.data.slug);
  if (!problem) {
    return Response.json({ error: "Coding problem not found." }, { status: 404 });
  }

  // Task 49: Run only ever touches visible examples. Structured problems run
  // their visible structured cases; hidden cases are filtered out server-side
  // and are never loaded into the Run request.
  if (problem.evaluation.evaluationMode !== "program") {
    return runStructured(parsed.data.sourceCode, parsed.data.slug);
  }

  if (problem.examples.length === 0) {
    return Response.json({ error: "This problem has no runnable examples yet." }, { status: 422 });
  }

  const judged = await judgeCases(
    createJudgeService(),
    {
      sourceCode: parsed.data.sourceCode,
      language: "python",
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
      comparisonMode: problem.comparisonMode,
      tolerance: problem.tolerance,
    },
    problem.examples.map((example) => ({
      id: example.id,
      name: example.name,
      inputData: example.inputData,
      expectedOutput: example.expectedOutput,
      weight: example.weight,
    })),
  );

  return Response.json({
    mode: "program" as const,
    status: judged.status,
    score: judged.score,
    runtimeMs: judged.runtimeMs,
    memoryKb: judged.memoryKb,
    cases: judged.cases.map((result) => ({
      id: result.testCaseId,
      name: result.name,
      status: result.status,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
      stdout: result.stdout,
      stderr: result.stderr,
      message: result.message,
    })),
  });
}

/**
 * Structured Run: visible cases only, with full diagnostics (Task 23).
 * Hidden structured inputs are never sent to the evaluator during Run.
 */
async function runStructured(sourceCode: string, slug: string) {
  const definition = await getMLJudgeDefinition(slug);
  if (!definition) {
    return Response.json({ error: "This problem has no runnable structured tests yet." }, { status: 422 });
  }
  if (definition.visibleCaseIds.size === 0) {
    return Response.json({ error: "This problem has no visible examples to run." }, { status: 422 });
  }
  const outcome = await runMLCases(definition, sourceCode, { visibleOnly: true });
  return Response.json({
    mode: definition.evaluationMode,
    framework: definition.framework,
    status: outcome.status,
    score: null,
    runtimeMs: outcome.runtimeMs,
    memoryKb: null,
    evaluation: outcome.evaluation,
  });
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

function requestKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "anonymous";
}
