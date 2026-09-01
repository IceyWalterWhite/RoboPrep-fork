import { spawn } from "node:child_process";

import { envValue, loadProjectEnv } from "./lib/load-env";

const values = loadProjectEnv();
const provider = envValue(values, "JUDGE_PROVIDER") ?? "local";
const baseUrl = envValue(values, "JUDGE0_BASE_URL");
const apiKey = envValue(values, "JUDGE0_API_KEY");
const timeoutMs = Number(envValue(values, "JUDGE_TIMEOUT_MS") ?? 15000);

if (provider === "judge0") {
  if (!baseUrl) {
    console.error("JUDGE_PROVIDER=judge0 but JUDGE0_BASE_URL is missing.");
    process.exit(1);
  }
  await testJudge0(baseUrl, apiKey, timeoutMs);
} else {
  await testLocal(timeoutMs);
}

async function testJudge0(
  base: string,
  token: string | undefined,
  timeout: number,
): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { "X-Auth-Token": token } : {}),
  };
  const response = await fetch(
    `${base.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ language_id: 71, source_code: "print(1 + 1)" }),
      signal: AbortSignal.timeout(timeout),
    },
  );
  if (!response.ok) throw new Error(`Judge0 returned HTTP ${response.status}`);
  const payload = (await response.json()) as { token?: string };
  if (!payload.token) throw new Error("Judge0 did not return a token");
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const resultResponse = await fetch(
      `${base.replace(/\/$/, "")}/submissions/${encodeURIComponent(payload.token)}?base64_encoded=false`,
      { headers, signal: AbortSignal.timeout(timeout) },
    );
    if (!resultResponse.ok)
      throw new Error(`Judge0 result returned HTTP ${resultResponse.status}`);
    const result = (await resultResponse.json()) as {
      status?: { id?: number };
      stdout?: string | null;
    };
    if (result.status?.id === 3) {
      if (result.stdout?.trim() !== "2")
        throw new Error("Judge0 accepted but stdout was not 2");
      process.stdout.write("Judge integration passed: Judge0 accepted print(1 + 1).\n");
      return;
    }
    if (result.status?.id && result.status.id > 2)
      throw new Error(`Judge0 returned terminal status ${result.status.id}`);
  }
  throw new Error("Judge0 integration timed out");
}

function testLocal(timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      envValue(values, "PYTHON_EXECUTABLE") ?? "python3",
      ["-I", "-S", "-c", "print(1 + 1)"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Local judge integration timed out"));
    }, timeout);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 || stdout.trim() !== "2") {
        reject(
          new Error(
            `Local judge failed with exit ${code}: ${stderr.trim() || "unexpected stdout"}`,
          ),
        );
        return;
      }
      process.stdout.write(
        "Judge integration passed: local Python accepted print(1 + 1).\n",
      );
      resolve();
    });
  });
}
