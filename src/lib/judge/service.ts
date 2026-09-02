import { serverEnv } from "@/lib/env.server";
import type { CodingSubmissionStatus } from "@/types/database";
import type {
  EvaluationRequest,
  EvaluationResult,
  MLEvaluationRequest,
  MLEvaluationResult,
} from "@/types/ml-judge";

import { aggregateSubmissionStatus, isTerminalJudgeStatus } from "@/lib/coding/helpers";
import { Judge0Adapter } from "./adapters/judge0";
import { LocalPythonAdapter } from "./adapters/local-python";
import { LocalMLPythonAdapter, type MLEvaluatorAdapter } from "./adapters/ml-python";
import type {
  JudgeAdapter,
  JudgeCaseInput,
  JudgeCaseResult,
  JudgeRequest,
} from "./types";

/**
 * JudgeService (Week 5 Task 5).
 *
 * One service boundary for both evaluation families:
 * - `program`: stdin → stdout comparison via the Week 4 adapter chain.
 * - `function` / `class`: structured ML evaluation via the ML evaluator
 *   adapter (isolated Python child process running the trusted harness).
 *
 * Page components and API routes only see `evaluate()` and its
 * `EvaluationResult` union; provider details stay behind this boundary.
 */
export class JudgeService {
  constructor(
    private readonly adapter: JudgeAdapter | null,
    private readonly mlAdapter: MLEvaluatorAdapter | null,
  ) {}

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    if (request.mode === "program") {
      return this.evaluateProgram(request);
    }
    return this.evaluateML(request);
  }

  private async evaluateProgram(
    request: Extract<EvaluationRequest, { mode: "program" }>,
  ): Promise<EvaluationResult> {
    if (!this.adapter) {
      return unavailableProgram("判题服务未配置，请稍后重试。");
    }
    try {
      const results: JudgeCaseResult[] = [];
      for (const testCase of request.cases) {
        const judgeRequest: JudgeRequest = {
          sourceCode: request.sourceCode,
          language: "python",
          stdin: testCase.stdin,
          expectedOutput: testCase.expectedOutput,
          timeLimitMs: request.timeLimitMs,
          memoryLimitMb: request.memoryLimitMb,
          comparisonMode: request.comparisonMode,
          tolerance: request.tolerance,
        };
        const submission = await this.adapter.submit(judgeRequest);
        let result = await this.adapter.getResult(submission.token, judgeRequest);
        const deadline = Date.now() + serverEnv.JUDGE_TIMEOUT_MS;
        while (!isTerminalJudgeStatus(result.status) && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          result = await this.adapter.getResult(submission.token, judgeRequest);
        }
        if (!isTerminalJudgeStatus(result.status)) {
          result = {
            status: "internal_error",
            stdout: null,
            stderr: null,
            runtimeMs: null,
            memoryKb: null,
            message: "判题服务在返回结果前超时。",
          };
        }
        results.push({ ...result, testCaseId: testCase.id, name: testCase.name });
      }
      return {
        mode: "program",
        status: aggregateSubmissionStatus(results.map((result) => result.status)),
        score: weightedScore(request.cases, results),
        runtimeMs: maxNumber(results.map((result) => result.runtimeMs)),
        memoryKb: maxNumber(results.map((result) => result.memoryKb)),
        cases: results.map((result) => ({
          testCaseId: result.testCaseId,
          name: result.name,
          status: result.status,
          runtimeMs: result.runtimeMs,
          memoryKb: result.memoryKb,
          stdout: result.stdout,
          stderr: result.stderr,
          message: result.message ?? null,
        })),
      };
    } catch (error) {
      console.error("[judge] provider failure", error);
      return unavailableProgram("判题服务暂时不可用，请重试。");
    }
  }

  private async evaluateML(request: MLEvaluationRequest): Promise<MLEvaluationResult> {
    if (!this.mlAdapter) {
      return {
        mode: request.mode,
        status: "internal_error",
        groups: [],
        cases: [],
        runtimeMs: null,
        memoryKb: null,
        entrypointError: {
          category: "internal_error",
          message: "当前环境未配置 ML 评估器，请稍后重试。",
        },
      };
    }
    try {
      return await this.mlAdapter.evaluate(request);
    } catch (error) {
      console.error("[judge] ml evaluator failure", error);
      return {
        mode: request.mode,
        status: "internal_error",
        groups: [],
        cases: [],
        runtimeMs: null,
        memoryKb: null,
        entrypointError: {
          category: "internal_error",
          message: "ML 评估器暂时失败，请重试。",
        },
      };
    }
  }
}

function unavailableProgram(_message: string): EvaluationResult {
  // The message is logged by callers via console; the program result shape
  // carries only statuses. Kept simple so the client sees internal_error.
  void _message;
  return {
    mode: "program",
    status: "internal_error",
    score: 0,
    runtimeMs: null,
    memoryKb: null,
    cases: [],
  };
}

function weightedScore(
  cases: Array<{ id: string; weight: number }>,
  results: JudgeCaseResult[],
): number {
  const totalWeight = cases.reduce((sum, testCase) => sum + testCase.weight, 0);
  if (totalWeight <= 0) return 0;
  const passedWeight = cases.reduce(
    (sum, testCase) =>
      sum +
      (results.find((result) => result.testCaseId === testCase.id)?.status ===
      "accepted"
        ? testCase.weight
        : 0),
    0,
  );
  return Math.round((passedWeight / totalWeight) * 10000) / 100;
}

function maxNumber(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length > 0 ? Math.max(...present) : null;
}

export function createJudgeService(): JudgeService {
  const programAdapter =
    serverEnv.JUDGE_PROVIDER === "judge0" && serverEnv.JUDGE0_BASE_URL
      ? new Judge0Adapter(serverEnv.JUDGE0_BASE_URL, serverEnv.JUDGE0_API_KEY)
      : serverEnv.JUDGE_PROVIDER === "local" && process.env.NODE_ENV !== "production"
        ? new LocalPythonAdapter()
        : null;
  // ML evaluation runs in a local child process for development. Production
  // must plug in an isolated evaluator before enabling function/class problems.
  const mlAdapter =
    process.env.NODE_ENV !== "production" ? new LocalMLPythonAdapter() : null;
  return new JudgeService(programAdapter, mlAdapter);
}

// ---------------------------------------------------------------------------
// Back-compat: Week 4 helpers still used by existing call sites.
// ---------------------------------------------------------------------------

export async function judgeCases(
  service: JudgeService,
  definition: Omit<JudgeRequest, "stdin" | "expectedOutput">,
  cases: JudgeCaseInput[],
): Promise<{
  status: CodingSubmissionStatus;
  score: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  cases: JudgeCaseResult[];
}> {
  const result = await service.evaluate({
    mode: "program",
    sourceCode: definition.sourceCode,
    cases: cases.map((testCase) => ({
      id: testCase.id,
      name: testCase.name,
      stdin: testCase.inputData,
      expectedOutput: testCase.expectedOutput,
      weight: testCase.weight,
    })),
    timeLimitMs: definition.timeLimitMs,
    memoryLimitMb: definition.memoryLimitMb,
    comparisonMode: definition.comparisonMode,
    tolerance: definition.tolerance,
  });
  if (result.mode !== "program") {
    throw new Error("评测模式不符合预期");
  }
  return {
    status: result.status,
    score: result.score,
    runtimeMs: result.runtimeMs,
    memoryKb: result.memoryKb,
    cases: result.cases.map((entry) => ({
      ...entry,
      message: entry.message ?? undefined,
    })),
  };
}
