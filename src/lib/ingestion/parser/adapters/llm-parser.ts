import type { ParseInterviewInput } from "@/types/ingestion";

import { errorFromStatus, errorFromUnknown, IngestionError } from "../../errors";
import { buildParserPrompt, PARSER_PROMPT_VERSION } from "../prompts";
import { validateParsedInterview } from "../schema";
import type { InterviewParserWithUsage, ParserResult } from "../types";

/**
 * HTTP LLM parser adapter for OpenAI-compatible chat-completion endpoints
 * (Tasks 13, 16, 52). Configuration is server-only via `INGESTION_LLM_*` env
 * vars; the API key never leaves the server and never appears in logs.
 *
 * Failure handling: rate limit / timeout / invalid JSON / empty response /
 * provider outage / schema mismatch all map into safe, retryable-aware
 * `IngestionError` codes (Task 52).
 */
export class OpenAICompatibleParser implements InterviewParserWithUsage {
  readonly provider: string;
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(config: { provider: string; model: string; baseUrl: string; apiKey: string; timeoutMs?: number }) {
    this.provider = config.provider;
    this.model = config.model;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  async parse(input: ParseInterviewInput): Promise<ParserResult> {
    return this.parseWithUsage(input);
  }

  async parseWithUsage(input: ParseInterviewInput): Promise<ParserResult> {
    const { system, user } = buildParserPrompt(input);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      throw errorFromUnknown(error);
    }
    clearTimeout(timer);

    if (!response.ok) throw errorFromStatus(response.status);

    const body = (await response.json().catch(() => null)) as
      | { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } }
      | null;

    const content = body?.choices?.[0]?.message?.content;
    if (!content) {
      throw new IngestionError("empty_response", "provider returned no content");
    }

    let raw: unknown;
    try {
      raw = JSON.parse(stripFences(content));
    } catch {
      throw new IngestionError("invalid_json", "provider content is not valid JSON");
    }

    try {
      const payload = validateParsedInterview(raw);
      return {
        ...payload,
        usage: {
          inputTokens: body?.usage?.prompt_tokens ?? null,
          outputTokens: body?.usage?.completion_tokens ?? null,
          estimatedCost: null,
        },
      };
    } catch (error) {
      throw new IngestionError(
        "schema_mismatch",
        error instanceof Error ? error.message.slice(0, 300) : "schema mismatch",
      );
    }
  }
}

function stripFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

export const LLM_PROMPT_VERSION = PARSER_PROMPT_VERSION;
