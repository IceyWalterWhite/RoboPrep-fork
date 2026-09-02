import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

import { serverEnv } from "@/lib/env.server";

import { compareOutputs } from "@/lib/coding/helpers";
import type {
  JudgeAdapter,
  JudgeRequest,
  JudgeResult,
  JudgeSubmission,
} from "../types";

const MAX_OUTPUT_BYTES = 256 * 1024;

/**
 * Development-only adapter. Production must use an isolated provider; this
 * subprocess is intentionally not described as a security sandbox.
 */
export class LocalPythonAdapter implements JudgeAdapter {
  private readonly results = new Map<string, JudgeResult>();

  async submit(request: JudgeRequest): Promise<JudgeSubmission> {
    const token = randomUUID();
    const result = await executePython(request);
    this.results.set(token, result);
    return { token, status: result.status };
  }

  async getResult(token: string): Promise<JudgeResult> {
    return (
      this.results.get(token) ?? {
        status: "internal_error",
        stdout: null,
        stderr: null,
        runtimeMs: null,
        memoryKb: null,
        message: "未找到本地判题结果。",
      }
    );
  }
}

function executePython(request: JudgeRequest): Promise<JudgeResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(
      serverEnv.PYTHON_EXECUTABLE,
      ["-I", "-S", "-c", request.sourceCode],
      {
        cwd: process.cwd(),
        // Keep the subprocess environment deliberately small. Python only
        // needs PATH and the harmless runtime mode marker.
        env: {
          NODE_ENV: process.env.NODE_ENV ?? "development",
          PATH: process.env.PATH ?? "",
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let timedOut = false;
    let outputLimit = false;
    const timer = setTimeout(
      () => {
        timedOut = true;
        child.kill("SIGKILL");
      },
      Math.min(request.timeLimitMs, serverEnv.JUDGE_TIMEOUT_MS),
    );
    const collect = (target: "stdout" | "stderr") => (chunk: Buffer) => {
      outputBytes += chunk.byteLength;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        outputLimit = true;
        child.kill("SIGKILL");
        return;
      }
      if (target === "stdout") stdout += chunk.toString("utf8");
      else stderr += chunk.toString("utf8");
    };
    child.stdout.on("data", collect("stdout"));
    child.stderr.on("data", collect("stderr"));
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        status: "internal_error",
        stdout: null,
        stderr: null,
        runtimeMs: Date.now() - started,
        memoryKb: null,
        message: error.message,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const runtimeMs = Date.now() - started;
      if (timedOut) {
        resolve({
          status: "time_limit_exceeded",
          stdout,
          stderr,
          runtimeMs,
          memoryKb: null,
          message: "程序运行超过时间限制。",
        });
        return;
      }
      if (outputLimit) {
        resolve({
          status: "runtime_error",
          stdout,
          stderr,
          runtimeMs,
          memoryKb: null,
          message: "程序产生的输出过多。",
        });
        return;
      }
      if (code !== 0) {
        resolve({
          status: "runtime_error",
          stdout,
          stderr,
          runtimeMs,
          memoryKb: null,
          message: "程序运行出错。",
        });
        return;
      }
      resolve({
        status: compareOutputs(
          stdout,
          request.expectedOutput,
          request.comparisonMode,
          request.tolerance,
        )
          ? "accepted"
          : "wrong_answer",
        stdout,
        stderr,
        runtimeMs,
        memoryKb: null,
      });
    });
    child.stdin.end(request.stdin);
  });
}
