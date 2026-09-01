import "server-only";

import { z } from "zod";

import { SUBMISSION_MAX_CHARS, SUBMISSION_MIN_CHARS } from "./constants";

/**
 * Server-authoritative submission validation (Tasks 9, 53). Hints are
 * optional; only the interview experience text is required.
 */
export const submissionRequestSchema = z.object({
  companyHint: z.string().trim().max(120).optional().or(z.literal("")),
  positionHint: z.string().trim().max(120).optional().or(z.literal("")),
  yearHint: z.coerce.number().int().min(1990).max(2100).optional(),
  seasonHint: z.enum(["spring", "summer", "fall", "winter"]).optional(),
  locationHint: z.string().trim().max(120).optional().or(z.literal("")),
  rawText: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length >= SUBMISSION_MIN_CHARS, {
      message: `Interview experience must be at least ${SUBMISSION_MIN_CHARS} characters.`,
    })
    .refine((value) => value.length <= SUBMISSION_MAX_CHARS, {
      message: `Interview experience must be at most ${SUBMISSION_MAX_CHARS} characters.`,
    }),
  sourceUrl: z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), { message: "Only http(s) URLs are accepted." })
    .optional()
    .or(z.literal("")),
  language: z.string().max(12).default("zh-CN"),
});

export type SubmissionRequest = z.infer<typeof submissionRequestSchema>;
