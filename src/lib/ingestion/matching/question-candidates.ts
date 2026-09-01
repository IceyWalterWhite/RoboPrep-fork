import type { CanonicalMatchCandidate } from "@/types/ingestion";

import { canonicalMatchScore } from "../confidence";
import { bigramSimilarity, keywordOverlap, normalizeQuestionText } from "../normalize";

/**
 * Canonical question candidate retrieval and scoring (Tasks 21, 22).
 *
 * Baseline retrieval loads candidate canonical questions from Postgres and
 * scores them deterministically in-process — no vector database. The formula
 * (documented in docs/ingestion-architecture.md):
 *
 *   score = 0.45 * textSimilarity      (character-bigram similarity)
 *         + 0.25 * keywordOverlap      (token Jaccard)
 *         + 0.20 * topicOverlap        (shared topic ids)
 *         + 0.10 * questionTypeMatch
 *
 * Scores are in [0, 1]; same input always yields the same ranking. Suggestions
 * are reviewer aids only — nothing links automatically.
 */

export interface CanonicalCandidateInput {
  questionId: string;
  title: string;
  slug: string;
  questionType: string | null;
  topicIds: string[];
}

export function rankCanonicalCandidates(
  occurrence: {
    normalizedText: string;
    questionType: string | null;
    topicHints: string[];
  },
  candidates: CanonicalCandidateInput[],
  options: { topK?: number; minScore?: number; candidateTopicIds?: Map<string, string[]> } = {},
): CanonicalMatchCandidate[] {
  const topK = options.topK ?? 5;
  const minScore = options.minScore ?? 0.3;

  const ranked = candidates.map((candidate) => {
    const textSimilarity = Math.max(
      bigramSimilarity(occurrence.normalizedText, candidate.title),
      normalizeQuestionText(occurrence.normalizedText) === normalizeQuestionText(candidate.title) ? 1 : 0,
    );
    const keywords = keywordOverlap(occurrence.normalizedText, candidate.title);
    const candidateTopics = options.candidateTopicIds?.get(candidate.questionId) ?? candidate.topicIds;
    const topicOverlap = jaccard(new Set(occurrence.topicHints), new Set(candidateTopics.map(String)));
    const typeMatch =
      occurrence.questionType && candidate.questionType && occurrence.questionType === candidate.questionType
        ? 1
        : 0;

    const score = canonicalMatchScore({
      textSimilarity,
      keywordOverlap: keywords,
      topicOverlap,
      questionTypeMatch: typeMatch,
    });

    return {
      questionId: candidate.questionId,
      title: candidate.title,
      slug: candidate.slug,
      questionType: candidate.questionType,
      score,
      textSimilarity: round(textSimilarity),
      keywordOverlap: round(keywords),
      topicOverlap: round(topicOverlap),
      questionTypeMatch: typeMatch,
    } satisfies CanonicalMatchCandidate;
  });

  return ranked
    .filter((candidate) => candidate.score >= minScore)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, topK);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function round(value: number): number {
  return Number(value.toFixed(4));
}
