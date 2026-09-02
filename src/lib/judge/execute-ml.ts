import "server-only";

import type { CodingSubmissionStatus } from "@/types/database";
import type { MLEvaluationRequest, PublicMLEvaluationResult } from "@/types/ml-judge";

import type { MLJudgeDefinition } from "@/lib/coding/queries";
import { resolveResourceProfile } from "@/lib/judge/evaluator-config";
import { redactMLEvaluation, toEvaluationSummary } from "@/lib/judge/ml-result";
import { createJudgeService } from "@/lib/judge/service";

/**
 * Shared structured-evaluation entry point for the coding API routes
 * (Week 5 Tasks 5, 6, 49).
 *
 * Run vs Submit semantics are enforced here, not in the client:
 * - Run    → visible cases only, full diagnostics.
 * - Submit → every case (visible + hidden), redacted diagnostics.
 *
 * A client cannot influence which cases run: the case list always comes from
 * the server-owned judge definition, and the client never supplies an
 * expected value of any kind.
 */

export interface MLRunOutcome {
  evaluation: PublicMLEvaluationResult;
  hiddenCaseIds: string[];
  summary: ReturnType<typeof toEvaluationSummary>;
  runtimeMs: number | null;
  status: CodingSubmissionStatus;
}

export async function runMLCases(
  definition: MLJudgeDefinition,
  sourceCode: string,
  options: { visibleOnly: boolean },
): Promise<MLRunOutcome> {
  const cases = options.visibleOnly
    ? definition.cases.filter((testCase) => !testCase.isHidden)
    : definition.cases;
  const profile = resolveResourceProfile(definition.resourceProfile);

  const request: MLEvaluationRequest = {
    mode: definition.evaluationMode,
    sourceCode,
    entrypointName: definition.entrypointName,
    entrypointType: definition.entrypointType,
    framework: definition.framework,
    config: definition.config,
    cases,
    resourceProfile: definition.resourceProfile,
    timeLimitMs: profile.timeoutMs,
    memoryLimitMb: profile.memoryLimitMb,
  };

  const result = await createJudgeService().evaluate(request);
  if (result.mode === "program") {
    // Unreachable: the definition already guarantees function/class mode.
    throw new Error("评测器没有返回结构化结果");
  }

  const hiddenCaseIds = cases
    .filter((testCase) => testCase.isHidden)
    .map((testCase) => testCase.id);
  const hiddenIdSet = new Set(hiddenCaseIds);
  return {
    evaluation: redactMLEvaluation(result, hiddenIdSet),
    hiddenCaseIds,
    summary: toEvaluationSummary(result, hiddenIdSet, definition.framework),
    runtimeMs: result.runtimeMs,
    status: result.status,
  };
}

/** Rows for coding_submission_cases; ML mode has no stdout/stderr to store. */
export function mlSubmissionCaseRows(evaluation: PublicMLEvaluationResult): Array<{
  test_case_id: string;
  status: CodingSubmissionStatus;
  runtime_ms: number | null;
}> {
  return evaluation.cases.map((testCase) => ({
    test_case_id: testCase.testCaseId,
    status: testCase.status,
    runtime_ms: null,
  }));
}

export function mlScore(evaluation: PublicMLEvaluationResult): number {
  const total = evaluation.groups
    .filter((group) => !group.informational)
    .reduce((sum, group) => sum + group.total, 0);
  if (total === 0) return 0;
  const passed = evaluation.groups
    .filter((group) => !group.informational)
    .reduce((sum, group) => sum + group.passed, 0);
  return Math.round((passed / total) * 10000) / 100;
}
