import { MockInterviewParser } from "./adapters/mock-parser";
import { OpenAICompatibleParser } from "./adapters/llm-parser";
import type { InterviewParserWithUsage } from "./types";

/**
 * Parser factory (Task 13/16). Provider selection is server-only:
 *
 *   INGESTION_LLM_PROVIDER=openai-compatible + INGESTION_LLM_API_KEY
 *     → HTTP LLM parser (OpenAI-compatible /chat/completions)
 *   otherwise
 *     → deterministic mock parser (dev/CI; never auto-publishes anything)
 *
 * Missing configuration degrades cleanly to the mock parser instead of
 * crashing the ingestion path.
 */
export function createParser(): InterviewParserWithUsage {
  // Week 8 Task 5: FLAG_LLM_INGESTION=off forces the deterministic mock
  // parser so operator can pause LLM spend without a deploy.
  const llmEnabled = process.env.FLAG_LLM_INGESTION !== "off" && process.env.FLAG_LLM_INGESTION !== "false";
  const provider = llmEnabled ? process.env.INGESTION_LLM_PROVIDER || "" : "";
  const apiKey = process.env.INGESTION_LLM_API_KEY;
  const model = process.env.INGESTION_LLM_MODEL || "gpt-4o-mini";
  const baseUrl = process.env.INGESTION_LLM_BASE_URL || "https://api.openai.com/v1";

  if (provider === "openai-compatible" && apiKey) {
    return new OpenAICompatibleParser({
      provider: "openai-compatible",
      model,
      baseUrl,
      apiKey,
    });
  }

  return new MockInterviewParser();
}
