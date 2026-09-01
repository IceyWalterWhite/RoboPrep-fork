/**
 * Confidence and match threshold policies (Tasks 47, 48, 74).
 *
 * Centralized so UI labels, queue prioritization, and review highlighting all
 * agree. Confidence NEVER auto-publishes or auto-links — it only guides the
 * reviewer's attention.
 */

import {
  CONFIDENCE_HIGH,
  CONFIDENCE_LOW,
  MATCH_STRONG_THRESHOLD,
  MATCH_WEAK_THRESHOLD,
} from "./constants";

export type ConfidenceBand = "high" | "medium" | "low";

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= CONFIDENCE_HIGH) return "high";
  if (confidence >= CONFIDENCE_LOW) return "medium";
  return "low";
}

export type MatchBand = "strong" | "possible" | "weak";

export function matchBand(score: number): MatchBand {
  if (score >= MATCH_STRONG_THRESHOLD) return "strong";
  if (score >= MATCH_WEAK_THRESHOLD) return "possible";
  return "weak";
}

export const MATCH_WEIGHTS = {
  textSimilarity: 0.45,
  keywordOverlap: 0.25,
  topicOverlap: 0.2,
  questionTypeMatch: 0.1,
} as const;

/** Deterministic weighted canonical-match score (Task 22). All inputs 0–1. */
export function canonicalMatchScore(input: {
  textSimilarity: number;
  keywordOverlap: number;
  topicOverlap: number;
  questionTypeMatch: number;
}): number {
  const raw =
    MATCH_WEIGHTS.textSimilarity * clamp01(input.textSimilarity) +
    MATCH_WEIGHTS.keywordOverlap * clamp01(input.keywordOverlap) +
    MATCH_WEIGHTS.topicOverlap * clamp01(input.topicOverlap) +
    MATCH_WEIGHTS.questionTypeMatch * clamp01(input.questionTypeMatch);
  return Number(clamp01(raw).toFixed(4));
}

/** Deterministic review-queue priority score (Task 74). Higher = sooner. */
export function queuePriority(input: {
  ageHours: number;
  confidence: number;
  duplicateScore: number | null;
  failedCanonicalization: boolean;
}): number {
  const recency = clamp01(1 - input.ageHours / 168); // newer submissions rank higher within a week
  const duplicateRisk = input.duplicateScore ?? 0;
  const failure = input.failedCanonicalization ? 0.2 : 0;
  return Number((recency * 2 + input.confidence + duplicateRisk * 2 + failure).toFixed(4));
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
