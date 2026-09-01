import type {
  CompanyCodingProblemStat,
  CompanyDifficultyStat,
  CompanyPositionStat,
  CompanyQuestionStat,
  CompanyRoundTypeStat,
  CompanySeasonStat,
  CompanyTopicStat,
} from "@/types/company-intelligence";
import type { Difficulty } from "@/types/database";

import { normalizeSeason, round4 } from "./helpers";

/** DB cache rows → presentation types (Task 10: raw cache vs UI types). */

export function mapPositionStat(
  row: {
    company_id: string;
    position_id: string;
    interview_count: number;
    knowledge_occurrences: number;
    coding_occurrences: number;
    latest_interview_at: string | null;
  },
  position: { title: string; slug: string },
): CompanyPositionStat {
  return {
    positionId: row.position_id,
    positionTitle: position.title,
    positionSlug: position.slug,
    interviewCount: row.interview_count,
    knowledgeOccurrences: row.knowledge_occurrences,
    codingOccurrences: row.coding_occurrences,
    latestInterviewAt: row.latest_interview_at,
  };
}

export function mapTopicStat(
  row: {
    topic_id: string;
    occurrence_count: number;
    interview_count: number;
    position_count: number;
    share_of_interviews: number | null;
    trend_score: number | null;
    last_seen_at: string | null;
  },
  topic: { name: string; slug: string },
): CompanyTopicStat {
  return {
    topicId: row.topic_id,
    topicName: topic.name,
    topicSlug: topic.slug,
    occurrenceCount: row.occurrence_count,
    interviewCount: row.interview_count,
    shareOfInterviews: row.share_of_interviews === null ? null : round4(Number(row.share_of_interviews)),
    trendScore: row.trend_score === null ? 0 : round4(Number(row.trend_score)),
    lastSeenAt: row.last_seen_at,
  };
}

export function mapQuestionStat(
  row: {
    question_id: string;
    occurrence_count: number;
    interview_count: number;
    occurrences_30d: number;
    occurrences_90d: number;
    trend_score: number | null;
    last_seen_at: string | null;
  },
  question: { title: string; slug: string; question_type: string | null },
): CompanyQuestionStat {
  return {
    questionId: row.question_id,
    title: question.title,
    slug: question.slug,
    questionType: question.question_type,
    occurrenceCount: row.occurrence_count,
    interviewCount: row.interview_count,
    occurrences30d: row.occurrences_30d,
    occurrences90d: row.occurrences_90d,
    trendScore: row.trend_score === null ? 0 : round4(Number(row.trend_score)),
    lastSeenAt: row.last_seen_at,
  };
}

export function mapCodingProblemStat(
  row: {
    coding_problem_id: string;
    occurrence_count: number;
    interview_count: number;
    trend_score: number | null;
    last_seen_at: string | null;
  },
  problem: { title: string; slug: string; difficulty: Difficulty | null },
): CompanyCodingProblemStat {
  return {
    problemId: row.coding_problem_id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    occurrenceCount: row.occurrence_count,
    interviewCount: row.interview_count,
    trendScore: row.trend_score === null ? 0 : round4(Number(row.trend_score)),
    lastSeenAt: row.last_seen_at,
  };
}

export function mapSeasonStat(row: {
  year: number;
  season: string;
  interview_count: number;
  question_occurrence_count: number;
  knowledge_occurrence_count: number;
  coding_occurrence_count: number;
  coding_share: number | null;
  avg_round_count: number | null;
  avg_question_count: number | null;
}): CompanySeasonStat {
  return {
    year: row.year,
    season: normalizeSeason(row.season) ?? row.season,
    interviewCount: row.interview_count,
    questionOccurrenceCount: row.question_occurrence_count,
    knowledgeOccurrenceCount: row.knowledge_occurrence_count,
    codingOccurrenceCount: row.coding_occurrence_count,
    codingShare: row.coding_share === null ? null : round4(Number(row.coding_share)),
    avgRoundCount: row.avg_round_count === null ? null : round4(Number(row.avg_round_count)),
    avgQuestionCount: row.avg_question_count === null ? null : round4(Number(row.avg_question_count)),
  };
}

export function mapDifficultyStat(row: {
  easy_count: number;
  medium_count: number;
  hard_count: number;
  unknown_count: number;
  average_score: number | null;
  sample_size: number;
}): CompanyDifficultyStat {
  return {
    easyCount: row.easy_count,
    mediumCount: row.medium_count,
    hardCount: row.hard_count,
    unknownCount: row.unknown_count,
    averageScore: row.average_score === null ? null : round4(Number(row.average_score)),
    sampleSize: row.sample_size,
  };
}

export function mapRoundTypeStat(row: {
  round_type: string;
  round_count: number;
  interview_count: number;
  share: number | null;
}): CompanyRoundTypeStat {
  return {
    roundType: row.round_type,
    roundCount: row.round_count,
    interviewCount: row.interview_count,
    share: row.share === null ? null : round4(Number(row.share)),
  };
}
