/**
 * Week 7 company intelligence constants: the sample-size policy (Task 24),
 * metric windows, and preparation-guide ranking weights (Task 42).
 *
 * All metric definitions are documented in docs/company-metrics.md.
 */

/** < 3 interviews → "Limited data"; 3–9 → counts primary; ≥ 10 → share primary. */
export const SAMPLE_LIMITED_MAX = 2;
export const SAMPLE_COUNTS_MAX = 9;

/** Trending lists require at least this many occurrences overall. */
export const TREND_MIN_TOTAL_OCCURRENCES = 3;
/** Emerging topics need at least this many recent occurrences. */
export const EMERGING_MIN_RECENT_OCCURRENCES = 2;
/** |trend_score| must exceed this to label rising/falling (noise suppression). */
export const TREND_SIGNIFICANCE = 0.25;

/** Trend windows (days), matching the SQL refresh in migration 0023. */
export const TREND_RECENT_DAYS = 90;

/** Preparation guide ranking weights (Task 42). */
export const TOPIC_SCORE_WEIGHTS = { interviewShare: 0.5, recentTrend: 0.3, roleRelevance: 0.2 } as const;
export const QUESTION_SCORE_WEIGHTS = { interviewCount: 0.6, recentTrend: 0.3, recency: 0.1 } as const;
export const CODING_SCORE_WEIGHTS = { interviewCount: 0.6, recentTrend: 0.3, recency: 0.1 } as const;

/** Guide sizes. */
export const GUIDE_TOP_TOPICS = 5;
export const GUIDE_TOP_QUESTIONS = 5;
export const GUIDE_TOP_CODING = 5;
export const RECENT_INTERVIEW_FEED_SIZE = 8;

/** Difficulty score map (Task 8). */
export const DIFFICULTY_SCORE = { easy: 1, medium: 2, hard: 3 } as const;

/** Role pages fall back to company-wide stats below this sample size. */
export const ROLE_MIN_SAMPLE = 3;
