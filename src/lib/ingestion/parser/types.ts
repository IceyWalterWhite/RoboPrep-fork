import type { ParseInterviewInput, ParsedInterviewPayload } from "@/types/ingestion";

/**
 * Parser provider abstraction (Task 13). LLM-specific logic stays inside
 * adapters; everything above this interface works with validated
 * `ParsedInterviewPayload` values only.
 */
export interface InterviewParser {
  readonly provider: string;
  readonly model: string;
  parse(input: ParseInterviewInput): Promise<ParsedInterviewPayload>;
}

export interface ParserUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCost: number | null;
}

export type ParserResult = ParsedInterviewPayload & { usage: ParserUsage };

export interface InterviewParserWithUsage extends InterviewParser {
  parseWithUsage(input: ParseInterviewInput): Promise<ParserResult>;
}
