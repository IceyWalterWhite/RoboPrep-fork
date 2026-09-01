import type {
  InterviewDifficulty,
  InterviewQuestionOccurrence,
  InterviewRound,
  InterviewSource,
  InterviewStats,
  InterviewSummary,
  InterviewVerificationState,
} from "@/types/interview";

import { SOURCE_TYPE_LABELS } from "./constants";

export function displaySeason(season: string | null | undefined): string | null {
  if (!season) return null;
  const normalized = season.trim().toLowerCase();
  return normalized.length > 0
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : null;
}

export function displayEnum(value: string | null | undefined): string | null {
  if (!value || value === "unknown") return null;
  return value
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeInterviewSlug(
  title: string | null,
  fallback: string,
): string {
  const slug = (title ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

export function interviewVerificationState(
  status: string,
  verifiedAt: string | null,
  sourceType: string | null,
): InterviewVerificationState {
  if (sourceType === "development_seed") return "unverified";
  if (verifiedAt) return "verified";
  if (status === "review" || sourceType === "editorial") return "reviewed";
  return "unverified";
}

export function mapSourceMetadata(input: {
  sourceType: string | null;
  sourceUrl: string | null;
  status: string;
  verifiedAt: string | null;
}): InterviewSource {
  const safeUrl = isSafeSourceUrl(input.sourceUrl) ? input.sourceUrl : null;
  return {
    type: input.sourceType,
    label: input.sourceType
      ? (SOURCE_TYPE_LABELS[input.sourceType] ?? displayEnum(input.sourceType) ?? "Interview report")
      : "Interview report",
    url: safeUrl,
    verification: interviewVerificationState(
      input.status,
      input.verifiedAt,
      input.sourceType,
    ),
    verifiedAt: input.verifiedAt,
  };
}

export function isSafeSourceUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function calculateInterviewStats(input: {
  rounds: Array<{ roundNumber: number }>;
  questions: Array<{ questionId: string | null; questionType?: string | null }>;
  topics?: Array<{ slug: string }>;
}): InterviewStats {
  const uniqueRoundNumbers = new Set(input.rounds.map((round) => round.roundNumber));
  const uniqueTopics = new Set(input.topics?.map((topic) => topic.slug) ?? []);
  return {
    roundCount: uniqueRoundNumbers.size,
    questionCount: input.questions.length,
    linkedQuestionCount: input.questions.filter((question) => question.questionId !== null)
      .length,
    codingQuestionCount: input.questions.filter(
      (question) => question.questionType === "coding",
    ).length,
    topicCount: uniqueTopics.size,
  };
}

export function difficultyRank(value: InterviewDifficulty): number {
  return { hard: 3, medium: 2, easy: 1, unknown: 0 }[value];
}

export function sortInterviewSummaries(
  items: InterviewSummary[],
  sort: "latest" | "most_questions" | "difficulty",
): InterviewSummary[] {
  return [...items].sort((a, b) => {
    if (sort === "most_questions") {
      return b.stats.questionCount - a.stats.questionCount || compareDates(b, a);
    }
    if (sort === "difficulty") {
      return difficultyRank(b.difficulty) - difficultyRank(a.difficulty) || compareDates(b, a);
    }
    return compareDates(b, a);
  });
}

function compareDates(a: InterviewSummary, b: InterviewSummary): number {
  const aDate = a.publishedAt ?? a.updatedAt;
  const bDate = b.publishedAt ?? b.updatedAt;
  return aDate.localeCompare(bDate);
}

export function rankRelatedInterviews(
  current: InterviewSummary,
  candidates: InterviewSummary[],
  currentTopicSlugs: string[] = [],
): InterviewSummary[] {
  const currentTopics = new Set(currentTopicSlugs);
  return candidates
    .filter((candidate) => candidate.id !== current.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.company?.id === current.company?.id) score += 8;
      if (candidate.position?.category && candidate.position.category === current.position?.category) {
        score += 4;
      }
      if (candidate.position?.id === current.position?.id) score += 3;
      if (candidate.year === current.year) score += 1;
      if (candidate.season && candidate.season === current.season) score += 1;
      score += candidate.tags.filter((tag) => current.tags.includes(tag)).length;
      return { candidate, score };
    })
    .map(({ candidate, score }) => ({
      candidate,
      score: score + (currentTopics.size > 0 ? 0 : 0),
    }))
    .sort((a, b) => b.score - a.score || compareDates(b.candidate, a.candidate))
    .map(({ candidate }) => candidate);
}

export function groupQuestionsByRound(
  questions: InterviewQuestionOccurrence[],
  rounds: InterviewRound[],
): InterviewRound[] {
  const byId = new Map<string, InterviewRound>();
  const byNumber = new Map<number, InterviewRound>();
  for (const round of rounds) {
    const copy: InterviewRound = { ...round, questions: [] };
    if (copy.id) byId.set(copy.id, copy);
    byNumber.set(copy.roundNumber, copy);
  }

  for (const question of questions) {
    const round =
      (question.roundId ? byId.get(question.roundId) : undefined) ??
      byNumber.get(question.roundNumber);
    if (round) {
      round.questions.push(question);
      continue;
    }
    const generated: InterviewRound = {
      id: question.roundId,
      roundNumber: question.roundNumber,
      title: `Round ${question.roundNumber}`,
      roundType: "unknown",
      durationMinutes: null,
      interviewerRole: null,
      summary: null,
      questions: [question],
    };
    byNumber.set(question.roundNumber, generated);
  }

  return [...byNumber.values()]
    .map((round) => ({
      ...round,
      questions: [...round.questions].sort((a, b) => a.orderIndex - b.orderIndex),
    }))
    .sort((a, b) => a.roundNumber - b.roundNumber);
}
