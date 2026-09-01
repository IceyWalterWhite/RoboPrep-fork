import type {
  CompanyCodingProblemStat,
  CompanyPreparationGuide,
  CompanyQuestionStat,
  CompanyTopicStat,
  CompanyTrendItem,
} from "@/types/company-intelligence";

import {
  GUIDE_TOP_CODING,
  GUIDE_TOP_QUESTIONS,
  GUIDE_TOP_TOPICS,
  TREND_MIN_TOTAL_OCCURRENCES,
} from "./constants";
import { isDeclining, isEmerging, occurrenceGuideScore, topicGuideScore } from "./helpers";

/**
 * Company intelligence orchestration (Tasks 36–38, 41–44, 76): assembles
 * ranked lists, trends, and the preparation guide from the cached stats.
 * All rankings are deterministic; no runtime LLM prose (Task 82: copy states
 * evidence, e.g. "appeared in 7 of 18 published interview records").
 */

/** Task 36/37/38: trending/emerging/declining classification. */
export function classifyTrends(input: {
  topics: CompanyTopicStat[];
  questions: CompanyQuestionStat[];
  codingProblems: CompanyCodingProblemStat[];
}): CompanyTrendItem[] {
  const items: CompanyTrendItem[] = [];

  for (const topic of input.topics) {
    if (topic.occurrenceCount < TREND_MIN_TOTAL_OCCURRENCES) continue;
    const direction = topic.trendScore >= 0 ? "rising" : "falling";
    if (direction === "rising" && !isEmerging({ recentCount: topic.occurrenceCount, trendScore: topic.trendScore })) continue;
    if (direction === "falling" && !isDeclining({ recentCount: topic.occurrenceCount, olderCount: topic.occurrenceCount, trendScore: topic.trendScore })) continue;
    items.push({
      kind: "topic",
      id: topic.topicId,
      label: topic.topicName,
      slug: topic.topicSlug,
      trendScore: topic.trendScore,
      recentCount: topic.occurrenceCount,
      totalCount: topic.occurrenceCount,
      direction,
    });
  }

  for (const question of input.questions) {
    if (question.occurrenceCount < TREND_MIN_TOTAL_OCCURRENCES) continue;
    if (Math.abs(question.trendScore) < 0.1) continue;
    items.push({
      kind: "question",
      id: question.questionId,
      label: question.title,
      slug: question.slug,
      trendScore: question.trendScore,
      recentCount: question.occurrences90d,
      totalCount: question.occurrenceCount,
      direction: question.trendScore >= 0 ? "rising" : "falling",
    });
  }

  for (const problem of input.codingProblems) {
    if (problem.occurrenceCount < TREND_MIN_TOTAL_OCCURRENCES) continue;
    if (Math.abs(problem.trendScore) < 0.1) continue;
    items.push({
      kind: "coding_problem",
      id: problem.problemId,
      label: problem.title,
      slug: problem.slug,
      trendScore: problem.trendScore,
      recentCount: problem.occurrenceCount,
      totalCount: problem.occurrenceCount,
      direction: problem.trendScore >= 0 ? "rising" : "falling",
    });
  }

  return items
    .sort((a, b) => b.trendScore - a.trendScore || a.label.localeCompare(b.label))
    .slice(0, 6);
}

/** Task 42: deterministic preparation guide (Task 41 data model). */
export function buildPreparationGuide(input: {
  topics: CompanyTopicStat[];
  questions: CompanyQuestionStat[];
  codingProblems: CompanyCodingProblemStat[];
  structure: {
    medianRoundCount: number | null;
    medianQuestionCount: number | null;
    dominantRoundType?: string | null;
    sampleSize: number;
  };
  publishedInterviewCount: number;
  roleRelevance?: Map<string, number>;
}): CompanyPreparationGuide {
  const { structure, publishedInterviewCount } = input;

  const rankedTopics = [...input.topics]
    .map((topic) => ({
      topic,
      score: topicGuideScore({
        shareOfInterviews: topic.shareOfInterviews,
        trendScore: topic.trendScore,
        roleRelevance: input.roleRelevance?.get(topic.topicId),
      }),
    }))
    .sort((a, b) => b.score - a.score || a.topic.topicName.localeCompare(b.topic.topicName))
    .slice(0, GUIDE_TOP_TOPICS)
    .map((entry) => entry.topic);

  const maxQuestionInterviews = Math.max(1, ...input.questions.map((question) => question.interviewCount));
  const rankedQuestions = [...input.questions]
    .map((question) => ({
      question,
      score: occurrenceGuideScore({
        interviewCount: question.interviewCount,
        maxInterviewCount: maxQuestionInterviews,
        trendScore: question.trendScore,
        daysSinceLastSeen: daysSince(question.lastSeenAt),
      }),
    }))
    .sort((a, b) => b.score - a.score || a.question.title.localeCompare(b.question.title))
    .slice(0, GUIDE_TOP_QUESTIONS)
    .map((entry) => entry.question);

  const maxCodingInterviews = Math.max(1, ...input.codingProblems.map((problem) => problem.interviewCount));
  const rankedCoding = [...input.codingProblems]
    .map((problem) => ({
      problem,
      score: occurrenceGuideScore({
        interviewCount: problem.interviewCount,
        maxInterviewCount: maxCodingInterviews,
        trendScore: problem.trendScore,
        daysSinceLastSeen: daysSince(problem.lastSeenAt),
      }),
    }))
    .sort((a, b) => b.score - a.score || a.problem.title.localeCompare(b.problem.title))
    .slice(0, GUIDE_TOP_CODING)
    .map((entry) => entry.problem);

  return {
    mustStudyTopics: rankedTopics,
    mustStudyQuestions: rankedQuestions,
    recommendedCodingProblems: rankedCoding,
    interviewStructureNotes: {
      medianRoundCount: structure.medianRoundCount,
      medianQuestionCount: structure.medianQuestionCount,
      dominantRoundType: structure.dominantRoundType ?? null,
      sampleSize: structure.sampleSize,
    },
    limitedDataNote: publishedInterviewCount < 3,
  };
}

/** Assemble the guide for a company page (cached stats path). */
export async function getCompanyPreparationGuide(
  companyId: string,
  publishedInterviewCount: number,
): Promise<CompanyPreparationGuide> {
  // Lazy import keeps this module importable offline (pure helpers above).
  const { getCompanyRoundTypeStats, getCompanyTopCodingProblems, getCompanyTopQuestions, getCompanyTopTopics, getCompanyTypicalStructure } =
    await import("./queries");
  const [topics, questions, codingProblems, structure, roundTypes] = await Promise.all([
    getCompanyTopTopics(companyId, 12),
    getCompanyTopQuestions(companyId, 12),
    getCompanyTopCodingProblems(companyId, 12),
    getCompanyTypicalStructure(companyId),
    getCompanyRoundTypeStats(companyId),
  ]);
  return buildPreparationGuide({
    topics,
    questions,
    codingProblems,
    structure: { ...structure, dominantRoundType: roundTypes[0]?.roundType ?? null },
    publishedInterviewCount,
  });
}

/** Task 65/66: recent-changes summaries; every sentence maps to a metric. */
export function recentChanges(input: {
  risingTopics: CompanyTopicStat[];
  seasonStats: Array<{ year: number; season: string; codingShare: number | null; interviewCount: number }>;
}): string[] {
  const statements: string[] = [];
  for (const topic of input.risingTopics.slice(0, 3)) {
    if (topic.interviewCount >= 3) {
      statements.push(
        `${topic.topicName} appeared more frequently in recent interview records (seen in ${topic.interviewCount}).`,
      );
    }
  }
  const seasons = [...input.seasonStats].sort((a, b) => b.year - a.year || b.season.localeCompare(a.season));
  if (seasons.length >= 2) {
    const [latest, previous] = seasons;
    if (
      latest.codingShare !== null &&
      previous.codingShare !== null &&
      latest.interviewCount >= 3 &&
      previous.interviewCount >= 3 &&
      Math.abs(latest.codingShare - previous.codingShare) >= 0.1
    ) {
      const direction = latest.codingShare > previous.codingShare ? "more common" : "less common";
      statements.push(`Coding questions were ${direction} in ${latest.year} ${latest.season} than in ${previous.year} ${previous.season}.`);
    }
  }
  return statements;
}

/** Task 76: compare a small number of companies on shared metrics. */
export function compareCompanies(
  companies: Array<{
    name: string;
    topics: CompanyTopicStat[];
    emphasis: { codingShare: number | null };
    difficulty: { averageScore: number | null; sampleSize: number } | null;
    roundTypes: Array<{ roundType: string; share: number | null }>;
  }>,
): Array<{
  metric: string;
  values: Array<string | null>;
}> {
  const topicKeys = [...new Set(companies.flatMap((company) => company.topics.map((topic) => topic.topicName)))].slice(0, 6);
  const rows: Array<{ metric: string; values: Array<string | null> }> = [];
  for (const key of topicKeys) {
    rows.push({
      metric: key,
      values: companies.map((company) => {
        const topic = company.topics.find((entry) => entry.topicName === key);
        return topic?.shareOfInterviews != null ? `${Math.round(topic.shareOfInterviews * 100)}%` : null;
      }),
    });
  }
  rows.push({
    metric: "Coding share",
    values: companies.map((company) => (company.emphasis.codingShare != null ? `${Math.round(company.emphasis.codingShare * 100)}%` : null)),
  });
  rows.push({
    metric: "Avg difficulty (1–3)",
    values: companies.map((company) => company.difficulty?.averageScore?.toFixed(1) ?? null),
  });
  return rows;
}

function daysSince(timestamp: string | null): number | null {
  if (!timestamp) return null;
  return Math.max(0, (Date.now() - new Date(timestamp).getTime()) / 86_400_000);
}
