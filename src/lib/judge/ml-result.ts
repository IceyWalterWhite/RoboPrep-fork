import type { CodingFramework, CodingSubmissionStatus } from "@/types/database";
import type {
  EvaluationSummaryPayload,
  GroupAggregate,
  GroupAggregates,
  MLCaseResult,
  MLEvaluationResult,
  PublicMLEvaluationResult,
} from "@/types/ml-judge";

/**
 * Test-group aggregation and hidden-test redaction (Week 5 Tasks 17 & 24).
 *
 * Aggregation is deterministic: cases keep their server order, groups sort by
 * weight of first appearance. Performance groups are informational and never
 * fail a submission (Task 16).
 *
 * `redactMLEvaluation` is the ONLY sanctioned way to turn a full evaluation
 * result into a browser payload. Hidden cases keep pass/fail plus safe
 * aggregates; hidden inputs, expected tensors, reference gradients, error
 * magnitudes and diagnostics are stripped here so no other call site can
 * forget to redact (Task 42).
 */

const GROUP_ORDER: GroupAggregate["group"][] = [
  "basic",
  "edge",
  "numerical",
  "shape",
  "gradient",
  "performance",
];

/** Groups that must fully pass for the submission to be Accepted. */
const REQUIRED_GROUPS: GroupAggregate["group"][] = ["basic", "edge", "numerical", "shape", "gradient", "performance"];

export function aggregateGroups(cases: MLCaseResult[]): GroupAggregates {
  const byGroup = new Map<GroupAggregate["group"], GroupAggregate>();
  for (const testCase of cases) {
    const group = testCase.testGroup;
    const current = byGroup.get(group) ?? { group, passed: 0, total: 0, informational: group === "performance" };
    current.total += 1;
    if (testCase.status === "accepted") current.passed += 1;
    byGroup.set(group, current);
  }
  return GROUP_ORDER.filter((group) => byGroup.has(group)).map((group) => byGroup.get(group)!);
}

/**
 * Submission status from group aggregates: all required groups pass →
 * accepted, otherwise the worst underlying case status wins. Informational
 * groups are excluded from the requirement but their failures still surface
 * in the breakdown.
 */
export function statusFromGroups(groups: GroupAggregates, cases: MLCaseResult[]): CodingSubmissionStatus {
  const required = groups.filter((group) => !group.informational);
  if (required.length === 0) return cases.length > 0 ? cases[0]!.status : "internal_error";
  const allRequiredPass = required.every((group) => group.passed === group.total);
  if (allRequiredPass) return "accepted";
  const failing = cases.filter((testCase) => testCase.status !== "accepted" && REQUIRED_GROUPS.includes(testCase.testGroup));
  return worstStatus(failing.map((testCase) => testCase.status));
}

const STATUS_SEVERITY: CodingSubmissionStatus[] = [
  "internal_error",
  "compile_error",
  "time_limit_exceeded",
  "memory_limit_exceeded",
  "runtime_error",
  "wrong_answer",
  "accepted",
];

function worstStatus(statuses: CodingSubmissionStatus[]): CodingSubmissionStatus {
  if (statuses.length === 0) return "wrong_answer";
  return STATUS_SEVERITY.find((status) => statuses.includes(status)) ?? "internal_error";
}

/** Full-fidelity → browser-safe. Centralized per Task 24. */
export function redactMLEvaluation(result: MLEvaluationResult, hiddenCaseIds: Set<string>): PublicMLEvaluationResult {
  return {
    status: result.status,
    groups: result.groups,
    runtimeMs: result.runtimeMs,
    memoryKb: result.memoryKb,
    entrypointError: result.entrypointError,
    cases: result.cases.map((testCase) => redactCase(testCase, hiddenCaseIds.has(testCase.testCaseId))),
  };
}

/**
 * Persistence payload for `coding_submissions.evaluation_summary` (Task 25).
 *
 * It is built from the same redactor the API uses, so a stored summary can
 * never contain more than a browser payload would. Hidden raw test payloads
 * are excluded by construction: only pass/fail plus safe aggregates survive.
 */
export function toEvaluationSummary(
  result: MLEvaluationResult,
  hiddenCaseIds: Set<string>,
  framework: CodingFramework | null = null,
): EvaluationSummaryPayload {
  return {
    mode: result.mode,
    groups: result.groups.map((group) => ({
      group: group.group,
      passed: group.passed,
      total: group.total,
      ...(group.informational ? { informational: true } : {}),
    })),
    entrypointError: result.entrypointError,
    cases: redactMLEvaluation(result, hiddenCaseIds).cases,
    framework,
  };
}

function redactCase(testCase: MLCaseResult, isHidden: boolean): PublicMLEvaluationResult["cases"][number] {
  if (testCase.isHidden || isHidden) {
    // Hidden case: pass/fail only. No expected/received shapes, no error
    // magnitudes, no diagnostics, no exception text (it could quote hidden
    // input shapes/values). A neutral message is all the client gets.
    return {
      testCaseId: testCase.testCaseId,
      name: null,
      testGroup: testCase.testGroup,
      status: testCase.status,
      message: testCase.status === "internal_error" ? testCase.message : null,
      value: testCase.value ? { passed: testCase.value.passed, maxAbsError: null } : null,
      shape: testCase.shape ? { passed: testCase.shape.passed, expectedShape: null, receivedShape: null } : null,
      dtype: testCase.dtype ? { passed: testCase.dtype.passed } : null,
      gradient: testCase.gradient
        ? {
            passed: testCase.gradient.passed,
            forwardPassed: testCase.gradient.forwardPassed,
            tensors: testCase.gradient.tensors.map((tensor) => ({ label: tensor.label, passed: tensor.passed })),
          }
        : null,
      exception: testCase.exception ? { passed: testCase.exception.passed } : null,
      performance: testCase.performance ? { runtimeMs: testCase.performance.runtimeMs, thresholdMs: null } : null,
    };
  }

  // Visible case: diagnostics allowed (Task 23).
  return {
    testCaseId: testCase.testCaseId,
    name: testCase.name,
    testGroup: testCase.testGroup,
    status: testCase.status,
    message: testCase.message,
    value: testCase.value ? { passed: testCase.value.passed, maxAbsError: testCase.value.maxAbsError } : null,
    shape: testCase.shape
      ? { passed: testCase.shape.passed, expectedShape: testCase.shape.expectedShape, receivedShape: testCase.shape.receivedShape }
      : null,
    dtype: testCase.dtype ? { passed: testCase.dtype.passed } : null,
    gradient: testCase.gradient
      ? {
          passed: testCase.gradient.passed,
          forwardPassed: testCase.gradient.forwardPassed,
          tensors: testCase.gradient.tensors.map((tensor) => ({ label: tensor.label, passed: tensor.passed })),
        }
      : null,
    exception: testCase.exception ? { passed: testCase.exception.passed } : null,
    performance: testCase.performance ? { runtimeMs: testCase.performance.runtimeMs, thresholdMs: testCase.performance.thresholdMs } : null,
  };
}
