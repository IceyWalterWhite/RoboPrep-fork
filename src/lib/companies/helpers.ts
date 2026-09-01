/**
 * Pure, deterministic metric helpers for company intelligence (Week 7).
 *
 * Every function here is offline-testable and used by both the query layer
 * and the UI. Definitions are documented in docs/company-metrics.md.
 */

import {
  DIFFICULTY_SCORE,
  EMERGING_MIN_RECENT_OCCURRENCES,
  QUESTION_SCORE_WEIGHTS,
  CODING_SCORE_WEIGHTS,
  ROLE_MIN_SAMPLE,
  SAMPLE_COUNTS_MAX,
  SAMPLE_LIMITED_MAX,
  TOPIC_SCORE_WEIGHTS,
  TREND_RECENT_DAYS,
  TREND_SIGNIFICANCE,
} from "./constants";
import type { SampleBand } from "@/types/company-intelligence";

/** Task 24: limited (< 3), counts (3–9), percentage (≥ 10). */
export function sampleBand(sampleSize: number): SampleBand {
  if (sampleSize <= SAMPLE_LIMITED_MAX) return "limited";
  if (sampleSize <= SAMPLE_COUNTS_MAX) return "counts";
  return "percentage";
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function round4(value: number): number {
  return Number(value.toFixed(4));
}

/**
 * Task 35: trend score = recent_rate − historical_rate, both normalized by
 * interview volume so a burst of interviews cannot fake a trend.
 */
export function trendScore(input: {
  recentOccurrences: number;
  recentInterviews: number;
  olderOccurrences: number;
  olderInterviews: number;
}): number {
  const recentRate = input.recentOccurrences / Math.max(input.recentInterviews, 1);
  const historicalRate = input.olderOccurrences / Math.max(input.olderInterviews, 1);
  return round4(recentRate - historicalRate);
}

export function splitTrendWindow(now: Date): { recentStart: Date } {
  return { recentStart: new Date(now.getTime() - TREND_RECENT_DAYS * 24 * 3_600_000) };
}

/** Task 8: easy=1, medium=2, hard=3; unknown excluded from the average. */
export function difficultyAverage(counts: {
  easy: number;
  medium: number;
  hard: number;
}): number | null {
  const known = counts.easy + counts.medium + counts.hard;
  if (known === 0) return null;
  return round4((counts.easy * DIFFICULTY_SCORE.easy + counts.medium * DIFFICULTY_SCORE.medium + counts.hard * DIFFICULTY_SCORE.hard) / known);
}

/** Task 32: median without false precision. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function normalizeSeason(season: string | null): string | null {
  if (!season) return null;
  const lowered = season.toLowerCase();
  return lowered === "fall" ? "autumn" : lowered;
}

/** Task 28: coding vs knowledge emphasis over classified occurrences. */
export function emphasisSplit(occurrences: Array<{ coding: boolean }>): {
  codingShare: number | null;
  knowledgeShare: number | null;
  unclassifiedShare: number | null;
} {
  const total = occurrences.length;
  if (total === 0) return { codingShare: null, knowledgeShare: null, unclassifiedShare: null };
  const coding = occurrences.filter((entry) => entry.coding).length;
  const knowledge = occurrences.filter((entry) => !entry.coding).length;
  return {
    codingShare: round4(coding / total),
    knowledgeShare: round4(knowledge / total),
    unclassifiedShare: round4((total - coding - knowledge) / total),
  };
}

/** Task 42: deterministic preparation-guide topic ranking. */
export function topicGuideScore(topic: {
  shareOfInterviews: number | null;
  trendScore: number;
  roleRelevance?: number;
}): number {
  return round4(
    TOPIC_SCORE_WEIGHTS.interviewShare * clamp01(topic.shareOfInterviews ?? 0) +
      TOPIC_SCORE_WEIGHTS.recentTrend * clamp01(topic.trendScore) +
      TOPIC_SCORE_WEIGHTS.roleRelevance * clamp01(topic.roleRelevance ?? 0),
  );
}

/** Task 42: deterministic preparation-guide question/coding ranking. */
export function occurrenceGuideScore(item: {
  interviewCount: number;
  maxInterviewCount: number;
  trendScore: number;
  daysSinceLastSeen: number | null;
}): number {
  const countNorm = item.maxInterviewCount > 0 ? item.interviewCount / item.maxInterviewCount : 0;
  const trendNorm = clamp01(item.trendScore);
  const recencyNorm = clamp01(item.daysSinceLastSeen === null ? 0 : 1 - item.daysSinceLastSeen / 365);
  return round4(
    QUESTION_SCORE_WEIGHTS.interviewCount * countNorm +
      QUESTION_SCORE_WEIGHTS.recentTrend * trendNorm +
      QUESTION_SCORE_WEIGHTS.recency * recencyNorm,
  );
}

export const CODING_GUIDE_WEIGHTS = CODING_SCORE_WEIGHTS;

/** Task 37: emerging = recent occurrences ≥ 2 and clearly rising. */
export function isEmerging(item: { recentCount: number; trendScore: number }): boolean {
  return item.recentCount >= EMERGING_MIN_RECENT_OCCURRENCES && item.trendScore >= TREND_SIGNIFICANCE;
}

/** Task 38: declining requires enough history on both sides to claim. */
export function isDeclining(item: { recentCount: number; olderCount: number; trendScore: number }): boolean {
  return item.olderCount >= EMERGING_MIN_RECENT_OCCURRENCES && item.recentCount >= 1 && item.trendScore <= -TREND_SIGNIFICANCE;
}

/** Task 44: role pages fall back to company-wide stats below this sample. */
export function roleUsesFallback(roleSample: number): boolean {
  return roleSample < ROLE_MIN_SAMPLE;
}
