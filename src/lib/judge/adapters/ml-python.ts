import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { MLErrorCategory, MLEvaluationRequest, MLEvaluationResult, MLCaseResult, NumericalCheckResult, TensorDtype } from "@/types/ml-judge";
import type { CodingSubmissionStatus } from "@/types/database";

import { importPolicy, resolveResourceProfile } from "../evaluator-config";
import { buildHarnessScript, buildRunnerPayload, type RunnerPayload } from "../harness/python";
import { aggregateGroups, statusFromGroups } from "../ml-result";

/**
 * ML evaluator adapter (Week 5 Task 6).
 *
 * Architecture: JudgeService → this adapter → isolated Python child process →
 * trusted harness → structured JSON result. The Next.js server process never
 * `exec`s user source in-process.
 *
 * PRODUCTION LIMITATION: the child process is a plain subprocess with a
 * timeout and output caps, NOT a hardened sandbox (no cgroups/containers,
 * memory is not strictly enforced, filesystem/network are not restricted).
 * Production deployments must run evaluation in an isolated worker (e.g. a
 * container pool or a Judge0-style service); this adapter is dev/local only.
 * See docs/week5-ml-judge-security.md.
 */

export interface MLEvaluatorAdapter {
  evaluate(request: MLEvaluationRequest): Promise<MLEvaluationResult>;
}

const RESULT_SENTINEL = "__ROBOPREP_RESULT__";
const MAX_RESULT_BYTES = 512 * 1024;

export class LocalMLPythonAdapter implements MLEvaluatorAdapter {
  async evaluate(request: MLEvaluationRequest): Promise<MLEvaluationResult> {
    const profile = resolveResourceProfile(request.resourceProfile);
    const payload = buildRunnerPayload(request, [...importPolicy[request.framework]]);
    const script = buildHarnessScript(request.entrypointType);
    const raw = await runPython(script, payload, Math.min(profile.timeoutMs, 60_000));
    return mapRunnerResult(raw, request);
  }
}

interface RawRunnerResult {
  cases: Array<Record<string, unknown>>;
  entrypoint_error: { category: string; message: string } | null;
  total_runtime_ms: number | null;
}

function runPython(script: string, payload: RunnerPayload, timeoutMs: number): Promise<RawRunnerResult | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: RawRunnerResult | null) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    void (async () => {
      const dir = await mkdtemp(join(tmpdir(), "roboprep-ml-"));
      const scriptPath = join(dir, "harness.py");
      await writeFile(scriptPath, script, "utf8");
      const child = spawn(serverPython(), ["-I", scriptPath], {
        cwd: dir,
        // Deliberately small environment: no secrets reach the runner.
        env: {
          NODE_ENV: process.env.NODE_ENV ?? "development",
          PATH: process.env.PATH ?? "",
          LANG: "C.UTF-8",
          PYTHONHASHSEED: "0",
        },
        stdio: ["pipe", "pipe", "pipe"] as const,
      });

      let stdout = "";
      let stderr = "";
      let bytes = 0;
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        bytes += chunk.byteLength;
        if (bytes <= MAX_RESULT_BYTES * 2) stdout += chunk.toString("utf8");
      });
      child.stderr.on("data", (chunk: Buffer) => {
        if (stderr.length < 16_000) stderr += chunk.toString("utf8");
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        void rm(dir, { recursive: true, force: true });
        finish(null);
        console.error("[ml-judge] spawn failed", error.message);
      });
      child.on("close", () => {
        clearTimeout(timer);
        void rm(dir, { recursive: true, force: true });
        if (timedOut) {
          finish({ cases: [], entrypoint_error: { category: "timeout", message: "Evaluation exceeded the time limit." }, total_runtime_ms: null });
          return;
        }
        if (bytes > MAX_RESULT_BYTES * 2) {
          finish({ cases: [], entrypoint_error: { category: "output_limit", message: "The evaluation produced too much output." }, total_runtime_ms: null });
          return;
        }
        finish(parseSentinel(stdout));
        if (stderr.trim()) console.warn("[ml-judge] runner stderr:", stderr.slice(0, 500));
      });

      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    })().catch((error) => {
      console.error("[ml-judge] adapter failure", error);
      finish(null);
    });
  });
}

function serverPython(): string {
  // PYTHON_EXECUTABLE is server-owned configuration (never client-provided).
  return process.env.PYTHON_EXECUTABLE || "python3";
}

function parseSentinel(stdout: string): RawRunnerResult | null {
  const lines = stdout.split("\n");
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim();
    if (line.startsWith(RESULT_SENTINEL)) {
      try {
        return JSON.parse(line.slice(RESULT_SENTINEL.length)) as RawRunnerResult;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function mapRunnerResult(raw: RawRunnerResult | null, request: MLEvaluationRequest): MLEvaluationResult {
  if (!raw) {
    return {
      mode: request.mode,
      status: "internal_error",
      groups: [],
      cases: [],
      runtimeMs: null,
      memoryKb: null,
      entrypointError: { category: "internal_error", message: "The evaluator did not return a usable result." },
    };
  }

  if (raw.entrypoint_error) {
    return {
      mode: request.mode,
      status: mapEntrypointStatus(raw.entrypoint_error.category),
      groups: [],
      cases: [],
      runtimeMs: null,
      memoryKb: null,
      entrypointError: {
        category: sanitizeCategory(raw.entrypoint_error.category),
        message: raw.entrypoint_error.message,
      },
    };
  }

  const weightById = new Map(request.cases.map((testCase) => [testCase.id, testCase.weight]));
  const hiddenById = new Set(request.cases.filter((testCase) => testCase.isHidden).map((testCase) => testCase.id));
  const cases = (raw.cases ?? []).map((entry) => {
    const mapped = mapCaseResult(entry, weightById);
    return { ...mapped, isHidden: hiddenById.has(mapped.testCaseId) };
  });
  const groups = aggregateGroups(cases);
  return {
    mode: request.mode,
    // Group-aware status (Task 17): every required group must pass, while
    // informational groups (performance) never fail a submission.
    status: statusFromGroups(groups, cases),
    groups,
    cases,
    runtimeMs: raw.total_runtime_ms === null ? null : Math.round(raw.total_runtime_ms),
    memoryKb: null,
    entrypointError: null,
  };
}

function mapCaseResult(entry: Record<string, unknown>, weightById: Map<string, number>): MLCaseResult {
  const status = (entry.status as CodingSubmissionStatus) ?? "internal_error";
  const runtimeMs = typeof entry.runtime_ms === "number" ? Math.round(entry.runtime_ms) : null;
  const testCaseId = String(entry.id ?? "");
  return {
    testCaseId,
    name: (entry.name as string | null) ?? null,
    testType: (entry.test_type as MLCaseResult["testType"]) ?? "value",
    testGroup: (entry.test_group as MLCaseResult["testGroup"]) ?? "basic",
    isHidden: false, // set by the caller; runner never learns visibility
    status,
    weight: weightById.get(testCaseId) ?? 1,
    runtimeMs,
    value: mapValueCheck(entry.value),
    shape: mapShapeCheck(entry.shape),
    dtype: mapDtypeCheck(entry.dtype),
    gradient: mapGradientCheck(entry.gradient),
    exception: mapExceptionCheck(entry.exception),
    performance: mapPerformanceCheck(entry.performance),
    errorCategory: (entry.error_category as MLCaseResult["errorCategory"]) ?? null,
    message: (entry.message as string | null) ?? null,
  };
}

function mapValueCheck(value: unknown): MLCaseResult["value"] {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return {
    passed: Boolean(record.passed),
    comparison: (record.comparison as NumericalCheckResult["comparison"]) ?? "allclose",
    maxAbsError: typeof record.max_abs_error === "number" ? record.max_abs_error : null,
    message: (record.message as string | null) ?? null,
    diagnostics: null,
  };
}

function mapShapeCheck(value: unknown): MLCaseResult["shape"] {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return {
    passed: Boolean(record.passed),
    expectedShape: (record.expected as number[] | null) ?? null,
    receivedShape: (record.received as number[] | null) ?? null,
  };
}

function mapDtypeCheck(value: unknown): MLCaseResult["dtype"] {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return {
    passed: Boolean(record.passed),
    expectedDtype: (record.expected as TensorDtype | null) ?? null,
    receivedDtype: (record.received as string | null) ?? null,
  };
}

function mapGradientCheck(value: unknown): MLCaseResult["gradient"] {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return {
    passed: Boolean(record.passed),
    forwardPassed: Boolean(record.forward_passed),
    tensors: ((record.tensors as Array<Record<string, unknown>>) ?? []).map((tensor) => ({
      label: String(tensor.label ?? ""),
      passed: Boolean(tensor.passed),
      maxAbsError: typeof tensor.max_abs_error === "number" ? tensor.max_abs_error : null,
      missing: Boolean(tensor.missing),
    })),
  };
}

function mapExceptionCheck(value: unknown): MLCaseResult["exception"] {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return {
    passed: Boolean(record.passed),
    raisedType: (record.raised_type as string | null) ?? null,
    expectedType: (record.expected_type as string | null) ?? null,
    message: (record.message as string | null) ?? null,
  };
}

function mapPerformanceCheck(value: unknown): MLCaseResult["performance"] {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return {
    runtimeMs: (record.runtime_ms as number | null) ?? null,
    memoryKb: null,
    thresholdMs: (record.threshold_ms as number | null) ?? null,
    passed: (record.passed as boolean | null) ?? null,
  };
}

function mapEntrypointStatus(category: string): CodingSubmissionStatus {
  if (category === "syntax_error") return "compile_error";
  if (category === "timeout") return "time_limit_exceeded";
  if (category === "internal_error") return "internal_error";
  return "wrong_answer";
}

function sanitizeCategory(category: string): MLErrorCategory {
  const allowed: string[] = [
    "entrypoint_missing",
    "entrypoint_not_callable",
    "entrypoint_signature",
    "syntax_error",
    "runtime_error",
    "timeout",
    "memory_limit",
    "output_limit",
    "forbidden_import",
    "harness_error",
    "internal_error",
  ];
  return (allowed.includes(category) ? category : "internal_error") as MLErrorCategory;
}
