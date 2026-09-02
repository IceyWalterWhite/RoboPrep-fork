import { z } from "zod";

import type {
  ParsedInterviewPayload,
  ParsedQuestionPayload,
  ParsedRoundPayload,
} from "@/types/ingestion";

/**
 * Strict parser output schema (Task 14). Provider output that fails this
 * Zod validation is rejected with `schema_mismatch` — raw provider text is
 * never trusted, and missing optional metadata is tolerated.
 */

const ROUND_TYPES = [
  "recruiter",
  "technical",
  "coding",
  "research",
  "manager",
  "behavioral",
  "mixed",
  "unknown",
] as const;

const QUESTION_TYPES = [
  "knowledge",
  "coding",
  "system_design",
  "research",
  "behavioral",
] as const;

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const nullableString = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length > 0 ? value : null))
  .nullish()
  .transform((value) => value ?? null);

export const parsedRoundSchema = z.object({
  roundNumber: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .nullish()
    .transform((v) => v ?? null),
  title: nullableString,
  roundType: z.enum(ROUND_TYPES).catch("unknown").default("unknown"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1)
    .max(600)
    .nullish()
    .transform((v) => v ?? null),
  interviewerRole: nullableString,
  summary: nullableString,
  confidence: z.coerce.number().min(0).max(1).catch(0.5).default(0.5),
});

export const parsedQuestionSchema = z.object({
  originalWording: z.string().trim().min(2, "问题原文不能为空"),
  normalizedText: nullableString,
  questionType: z
    .enum(QUESTION_TYPES)
    .nullish()
    .transform((v) => v ?? null),
  roundNumber: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .nullish()
    .transform((v) => v ?? null),
  orderIndex: z.coerce.number().int().min(0).default(0),
  difficulty: z
    .enum(DIFFICULTIES)
    .nullish()
    .transform((v) => v ?? null),
  topicHints: z.array(z.string().trim().min(1)).max(8).default([]),
});

export const parsedInterviewSchema = z.object({
  companyName: nullableString,
  positionTitle: nullableString,
  year: z.coerce
    .number()
    .int()
    .min(1990)
    .max(2100)
    .nullish()
    .transform((v) => v ?? null),
  season: nullableString,
  location: nullableString,
  employmentType: z
    .enum(["internship", "full_time", "contract", "unknown"])
    .catch("unknown")
    .default("unknown"),
  experienceLevel: z
    .enum(["intern", "new_grad", "experienced", "unknown"])
    .catch("unknown")
    .default("unknown"),
  summary: nullableString,
  confidence: z.coerce.number().min(0).max(1).catch(0.5).default(0.5),
  rounds: z.array(parsedRoundSchema).max(20).default([]),
  questions: z.array(parsedQuestionSchema).min(1, "至少需要一个问题").max(200),
});

export function validateParsedInterview(raw: unknown): ParsedInterviewPayload {
  const result = parsedInterviewSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first ? first.path.join(".") : "(root)";
    throw new Error(
      `解析器输出未通过 ${path} 的结构校验：${first?.message ?? "未知错误"}`,
    );
  }
  const data = result.data;
  const rounds: ParsedRoundPayload[] = data.rounds;
  const questions: ParsedQuestionPayload[] = data.questions;
  return { ...data, rounds, questions };
}

export type ParsedInterviewRaw = z.infer<typeof parsedInterviewSchema>;
