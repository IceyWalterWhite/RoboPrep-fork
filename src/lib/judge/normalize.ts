import type { CodingSubmissionStatus } from "@/types/database";

import { compareOutputs } from "../coding/helpers";
import type { JudgeResult, JudgeRequest } from "./types";

export function normalizeJudgeStatus(
  value: string | number | null | undefined,
): CodingSubmissionStatus {
  const status = typeof value === "number" ? value : String(value ?? "").toLowerCase();
  if (status === 3 || status === "accepted") return "accepted";
  if (status === 4 || status === "wrong answer" || status === "wrong_answer")
    return "wrong_answer";
  if (
    status === 5 ||
    status === "time limit exceeded" ||
    status === "time_limit_exceeded"
  )
    return "time_limit_exceeded";
  if (status === 6 || status === "compilation error" || status === "compile_error")
    return "compile_error";
  if (
    status === 1 ||
    status === 2 ||
    status === "queued" ||
    status === "processing" ||
    status === "running"
  )
    return "running";
  if (status === 13 || status === "internal error" || status === "internal_error")
    return "internal_error";
  if (status === "memory limit exceeded" || status === "memory_limit_exceeded")
    return "memory_limit_exceeded";
  if (typeof status === "number" && status >= 7) return "runtime_error";
  return "internal_error";
}

export function normalizeCompletedResult(
  result: JudgeResult,
  request: JudgeRequest,
): JudgeResult {
  if (result.status !== "accepted") return result;
  const matches = compareOutputs(
    result.stdout,
    request.expectedOutput,
    request.comparisonMode,
    request.tolerance,
  );
  return matches
    ? result
    : { ...result, status: "wrong_answer", message: "输出与预期结果不匹配。" };
}
