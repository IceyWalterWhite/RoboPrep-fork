import type { CodingComparisonMode, CodingSubmissionStatus } from "@/types/database";
import type { CodingProblemStatus, CodingSubmission } from "@/types/coding";

const STATUS_PRECEDENCE: CodingSubmissionStatus[] = [
  "internal_error",
  "compile_error",
  "runtime_error",
  "time_limit_exceeded",
  "memory_limit_exceeded",
  "wrong_answer",
  "accepted",
];

export function aggregateSubmissionStatus(statuses: CodingSubmissionStatus[]): CodingSubmissionStatus {
  if (statuses.length === 0) return "internal_error";
  return STATUS_PRECEDENCE.find((status) => statuses.includes(status)) ?? "internal_error";
}

export function compareOutputs(
  actual: string | null | undefined,
  expected: string,
  mode: CodingComparisonMode,
  tolerance = 0.00001,
): boolean {
  if (actual === null || actual === undefined) return false;
  if (mode === "exact") return actual === expected;
  if (mode === "trimmed") return actual.trim() === expected.trim();
  const actualTokens = actual.trim().split(/\s+/).filter(Boolean);
  const expectedTokens = expected.trim().split(/\s+/).filter(Boolean);
  if (actualTokens.length !== expectedTokens.length) return false;
  return actualTokens.every((token, index) => {
    const actualNumber = Number(token);
    const expectedNumber = Number(expectedTokens[index]);
    return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && Math.abs(actualNumber - expectedNumber) <= tolerance;
  });
}

export function deriveProblemStatus(submissions: Pick<CodingSubmission, "status">[]): CodingProblemStatus {
  if (submissions.some((submission) => submission.status === "accepted")) return "solved";
  if (submissions.length > 0) return "attempted";
  return "unsolved";
}

export function acceptanceRate(accepted: number, completed: number): number | null {
  if (completed <= 0 || accepted < 0) return null;
  return Math.round((accepted / completed) * 1000) / 10;
}

export function isTerminalJudgeStatus(status: CodingSubmissionStatus): boolean {
  return !["queued", "running"].includes(status);
}

export function formatRuntime(runtimeMs: number | null): string | null {
  return runtimeMs === null ? null : `${runtimeMs} ms`;
}

export function formatMemory(memoryKb: number | null): string | null {
  return memoryKb === null ? null : `${Math.max(1, Math.round(memoryKb / 1024))} MB`;
}
