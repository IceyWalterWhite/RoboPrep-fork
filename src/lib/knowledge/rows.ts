import type { Question } from "@/types/database";

/**
 * Shape of a `public.questions_with_stats` row (see migration 0004).
 *
 * Declared explicitly because the view is typed in `src/types/database.ts`
 * from this contract; keeping it in one place makes drift obvious.
 */
export type QuestionWithStatsRow = Question & {
  interview_count: number | null;
  company_count: number | null;
  occurrences_30d: number | null;
  occurrences_90d: number | null;
  trend_score: number | null;
  last_seen_at: string | null;
};
