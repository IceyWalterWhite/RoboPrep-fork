import { serverEnv } from "@/lib/env.server";

import { normalizeCompletedResult, normalizeJudgeStatus } from "../normalize";
import type { JudgeAdapter, JudgeRequest, JudgeResult, JudgeSubmission } from "../types";

interface Judge0SubmissionResponse {
  token?: string;
}

interface Judge0ResultResponse {
  status?: { id?: number; description?: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
}

export class Judge0Adapter implements JudgeAdapter {
  private readonly baseUrl: string;
  private readonly headers: HeadersInit;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.headers = {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Auth-Token": apiKey } : {}),
    };
  }

  async submit(request: JudgeRequest): Promise<JudgeSubmission> {
    const response = await fetch(`${this.baseUrl}/submissions?base64_encoded=false&wait=false`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        language_id: 71,
        source_code: request.sourceCode,
        stdin: request.stdin,
        cpu_time_limit: Math.max(0.1, request.timeLimitMs / 1000),
        memory_limit: request.memoryLimitMb * 1024,
      }),
      signal: AbortSignal.timeout(serverEnv.JUDGE_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Judge provider returned HTTP ${response.status}`);
    const payload = (await response.json()) as Judge0SubmissionResponse;
    if (!payload.token) throw new Error("Judge provider did not return a token");
    return { token: payload.token, status: "queued" };
  }

  async getResult(token: string, request: JudgeRequest): Promise<JudgeResult> {
    const response = await fetch(`${this.baseUrl}/submissions/${encodeURIComponent(token)}?base64_encoded=false`, {
      headers: this.headers,
      signal: AbortSignal.timeout(serverEnv.JUDGE_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Judge provider returned HTTP ${response.status}`);
    const payload = (await response.json()) as Judge0ResultResponse;
    const status = normalizeJudgeStatus(payload.status?.id);
    const result: JudgeResult = {
      status,
      stdout: payload.stdout ?? null,
      stderr: payload.stderr ?? payload.compile_output ?? null,
      runtimeMs: payload.time ? Math.round(Number(payload.time) * 1000) : null,
      memoryKb: payload.memory ?? null,
      message: payload.message ?? payload.status?.description,
    };
    return normalizeCompletedResult(result, request);
  }
}
