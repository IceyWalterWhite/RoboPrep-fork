import type { ParseInterviewInput, ParsedInterviewPayload } from "@/types/ingestion";

import { normalizeQuestionText } from "../../normalize";
import type { InterviewParserWithUsage, ParserResult, ParserUsage } from "../types";

/**
 * Deterministic mock parser (Task 66): fixed structured output for tests and
 * CI, independent of any LLM provider. It does rule-based extraction so the
 * smoke test exercises the real pipeline shape (rounds + questions), while
 * remaining fully deterministic.
 */
export class MockInterviewParser implements InterviewParserWithUsage {
  readonly provider = "mock";
  readonly model = "mock-rules-v1";

  async parse(input: ParseInterviewInput): Promise<ParsedInterviewPayload> {
    const { payload } = this.parseWithUsageSync(input);
    return payload;
  }

  async parseWithUsage(input: ParseInterviewInput): Promise<ParserResult> {
    const { payload, usage } = this.parseWithUsageSync(input);
    return { ...payload, usage };
  }

  private parseWithUsageSync(input: ParseInterviewInput): { payload: ParsedInterviewPayload; usage: ParserUsage } {
    const text = input.rawText;

    // Company: honor the hint when present, else the "Company:" line.
    const companyLine = text.match(/(?:公司|Company)\s*[:：]\s*(.+)/i);
    const companyName = input.hints.companyHint ?? companyLine?.[1]?.trim() ?? null;

    const positionLine = text.match(/(?:职位|岗位|Position)\s*[:：]\s*(.+)/i);
    const positionTitle = input.hints.positionHint ?? positionLine?.[1]?.trim() ?? null;

    const yearLine = text.match(/\b(20\d{2})\s*(?:年|届)?\b/);
    const year = input.hints.yearHint ?? (yearLine ? Number(yearLine[1]) : null);

    // Rounds: explicit "第N轮/Round N" headings; otherwise one unknown round.
    const roundMatches = [...text.matchAll(/(?:第\s*([一二三四五六七八九十\d]+)\s*轮|Round\s*(\d+))/gi)];
    const rounds: ParsedInterviewPayload["rounds"] = [];
    if (roundMatches.length > 0) {
      const seen = new Map<number, number>();
      for (const match of roundMatches) {
        const raw = match[1] ?? match[2] ?? "1";
        const num = toArabic(raw);
        if (!seen.has(num)) {
          seen.set(num, rounds.length);
          rounds.push({
            roundNumber: num,
            title: `Round ${num}`,
            roundType: "unknown",
            durationMinutes: null,
            interviewerRole: null,
            summary: null,
            confidence: 0.85,
          });
        }
      }
    } else {
      rounds.push({
        roundNumber: 1,
        title: null,
        roundType: "unknown",
        durationMinutes: null,
        interviewerRole: null,
        summary: null,
        confidence: 0.5,
      });
    }

    // Questions: non-empty lines that look like questions.
    const questionLines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length >= 4)
      .filter((line) => !/^(?:公司|Company|职位|岗位|Position|第|Round)/i.test(line))
      .filter((line) => /[?？]|请问|为什么|如何|怎么|介绍|实现|设计|讲一讲|聊一聊/.test(line))
      .slice(0, 50);

    const questions: ParsedInterviewPayload["questions"] = questionLines.map((line, index) => ({
      originalWording: line,
      normalizedText: normalizeQuestionText(line) || null,
      questionType: /实现|写|手搓|coding|算法/i.test(line)
        ? ("coding" as const)
        : ("knowledge" as const),
      roundNumber: null,
      orderIndex: index,
      difficulty: null,
      topicHints: [],
    }));

    const payload: ParsedInterviewPayload = {
      companyName,
      positionTitle,
      year,
      season: input.hints.seasonHint ?? null,
      location: input.hints.locationHint ?? null,
      employmentType: "unknown",
      experienceLevel: "unknown",
      summary: null,
      confidence: rounds[0]?.roundType === "unknown" ? 0.5 : 0.8,
      rounds,
      questions,
    };

    const usage: ParserUsage = { inputTokens: null, outputTokens: null, estimatedCost: null };
    return { payload, usage };
  }
}

const CN_DIGITS: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

function toArabic(raw: string): number {
  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) return numeric;
  if (raw === "十") return 10;
  const tenMatch = raw.match(/^十([一二三四五六七八九])$/);
  if (tenMatch) return 10 + (CN_DIGITS[tenMatch[1]] ?? 0);
  return CN_DIGITS[raw] ?? 1;
}
