import type { InterviewDuplicateCandidate } from "@/types/ingestion";

import { bigramSimilarity, normalizeQuestionText } from "../normalize";

/**
 * Duplicate interview detection (Task 27). Pure scoring over candidate
 * rows; the caller supplies recently published interviews and earlier
 * submissions for the same company. Duplicates are flagged — never
 * auto-deleted — and every candidate carries human-readable reasons.
 */

export interface DuplicateDetectionInput {
  companySlug: string | null;
  positionTitle: string | null;
  year: number | null;
  season: string | null;
  sourceUrl: string | null;
  rawText: string;
  questionTexts: string[];
}

export interface DuplicateDetectionRow {
  interviewId: string | null;
  submissionId: string | null;
  slug: string | null;
  title: string | null;
  companySlug: string | null;
  positionTitle: string | null;
  year: number | null;
  season: string | null;
  sourceUrl: string | null;
  rawText: string | null;
  questionTexts: string[];
}

const WEIGHTS = {
  sameSourceUrl: 0.5,
  sameCompanyPositionYear: 0.3,
  rawTextSimilarity: 0.2,
  questionOverlap: 0.15,
} as const;

export function findDuplicateInterviews(
  input: DuplicateDetectionInput,
  rows: DuplicateDetectionRow[],
  options: { threshold?: number; topK?: number } = {},
): InterviewDuplicateCandidate[] {
  const threshold = options.threshold ?? 0.4;
  const topK = options.topK ?? 5;

  const candidates = rows
    .map((row) => {
      const reasons: string[] = [];
      let score = 0;

      if (
        input.sourceUrl &&
        row.sourceUrl &&
        input.sourceUrl === row.sourceUrl
      ) {
        score += WEIGHTS.sameSourceUrl;
        reasons.push("identical source URL");
      }

      const sameCompany = !input.companySlug || !row.companySlug || input.companySlug === row.companySlug;
      const samePosition =
        !!input.positionTitle &&
        !!row.positionTitle &&
        normalizeQuestionText(input.positionTitle) === normalizeQuestionText(row.positionTitle);
      const sameYear = !!input.year && !!row.year && input.year === row.year;
      if (sameCompany && samePosition && sameYear) {
        score += WEIGHTS.sameCompanyPositionYear;
        reasons.push("same company, position, and year");
      }

      if (row.rawText) {
        const textSim = bigramSimilarity(input.rawText, row.rawText);
        if (textSim > 0.7) {
          score += WEIGHTS.rawTextSimilarity * textSim;
          reasons.push(`raw text ${Math.round(textSim * 100)}% similar`);
        }
      }

      if (input.questionTexts.length > 0 && row.questionTexts.length > 0) {
        const normalizedInput = new Set(input.questionTexts.map(normalizeQuestionText));
        const normalizedRow = new Set(row.questionTexts.map(normalizeQuestionText));
        let overlap = 0;
        for (const question of normalizedInput) if (normalizedRow.has(question)) overlap += 1;
        const ratio = overlap / Math.min(normalizedInput.size, normalizedRow.size);
        if (ratio > 0.5) {
          score += WEIGHTS.questionOverlap * ratio;
          reasons.push(`${overlap} shared question(s)`);
        }
      }

      return {
        interviewId: row.interviewId,
        submissionId: row.submissionId,
        slug: row.slug,
        title: row.title,
        score: Number(Math.min(1, score).toFixed(4)),
        reasons,
      } satisfies InterviewDuplicateCandidate;
    })
    .filter((candidate) => candidate.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return candidates;
}
