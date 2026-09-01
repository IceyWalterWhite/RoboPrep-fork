/**
 * Task 68: live parser integration test (optional, development only).
 *
 * Runs a short, safe example interview through the configured LLM parser
 * (INGESTION_LLM_PROVIDER=openai-compatible + INGESTION_LLM_API_KEY). Never
 * runs in CI; secrets are never printed. Exits 0 on a valid payload, 1 on
 * any failure.
 *
 * Usage:
 *   node --experimental-strip-types --loader ./scripts/tests/loader.mjs scripts/test-live-parser.ts
 */
import { createParser } from "../src/lib/ingestion/parser/service";
import { validateParsedInterview } from "../src/lib/ingestion/parser/schema";

const provider = process.env.INGESTION_LLM_PROVIDER;
const apiKey = process.env.INGESTION_LLM_API_KEY;

if (!provider || provider === "mock" || !apiKey) {
  console.log("Live parser test skipped: INGESTION_LLM_PROVIDER / INGESTION_LLM_API_KEY are not configured.");
  console.log("This is expected in CI — the mock parser covers the pipeline end to end.");
  process.exit(0);
}

const SAMPLE = `公司: Example Robotics
职位: 具身智能算法工程师
2026年 春季, 北京。

第一轮（技术面，约50分钟）:
面试官先问了 Transformer 的 self-attention 复杂度问题：为什么 attention 是 O(n^2) 的？
追问：如果序列长度翻倍，显存占用会怎么变化？

第二轮（coding，约60分钟）:
请手写实现一个 LayerNorm，要求支持 gradient 检查。

第三轮（research）:
介绍一下你的研究工作里 diffusion policy 和 VLA 的关系。`;

try {
  const parser = createParser();
  console.log(`provider=${parser.provider} model=${parser.model}`);
  const payload = await parser.parse({
    rawText: SAMPLE,
    hints: { companyHint: null, positionHint: null, yearHint: 2026, seasonHint: "spring", locationHint: null },
    language: "zh-CN",
  });

  // Re-validate through the strict schema (Task 68: parsed payload validated).
  const validated = validateParsedInterview(payload);
  console.log(`ok  parsed ${validated.questions.length} question(s), ${validated.rounds.length} round(s)`);
  for (const question of validated.questions) {
    console.log(`    [${question.questionType ?? "?"}] ${question.originalWording.slice(0, 60)}`);
  }
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  // Print only the error class and message — never request/response bodies.
  console.error(`FAIL  live parser test failed: ${message.slice(0, 300)}`);
  process.exit(1);
}
