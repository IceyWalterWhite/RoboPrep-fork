/**
 * Week 7 Company Intelligence domain types.
 *
 * Presentation types are normalized for the UI; raw DB cache rows live in
 * `src/types/database.ts`. Every frequency metric is derived from published
 * interview records only, and the UI always has access to the sample size.
 */

import type { Difficulty } from "./database";

export type SampleBand = "limited" | "counts" | "percentage";

// ---------------------------------------------------------------------------
// Presentation types
// ---------------------------------------------------------------------------

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string | null;
  interviewCount: number;
  positionCount: number;
  latestInterviewAt: string | null;
  topTopics: Array<{ name: string; slug: string; share: number | null }>;
}

export interface CompanyPositionStat {
  positionId: string;
  positionTitle: string;
  positionSlug: string;
  interviewCount: number;
  knowledgeOccurrences: number;
  codingOccurrences: number;
  latestInterviewAt: string | null;
}

export interface CompanyTopicStat {
  topicId: string;
  topicName: string;
  topicSlug: string;
  occurrenceCount: number;
  interviewCount: number;
  /** share of published interviews containing the topic, 0–1, null if n = 0 */
  shareOfInterviews: number | null;
  trendScore: number;
  lastSeenAt: string | null;
}

export interface CompanyQuestionStat {
  questionId: string;
  title: string;
  slug: string;
  questionType: string | null;
  occurrenceCount: number;
  interviewCount: number;
  occurrences30d: number;
  occurrences90d: number;
  trendScore: number;
  lastSeenAt: string | null;
}

export interface CompanyCodingProblemStat {
  problemId: string;
  title: string;
  slug: string;
  difficulty: Difficulty | null;
  occurrenceCount: number;
  interviewCount: number;
  trendScore: number;
  lastSeenAt: string | null;
}

export interface CompanySeasonStat {
  year: number;
  season: string;
  interviewCount: number;
  questionOccurrenceCount: number;
  knowledgeOccurrenceCount: number;
  codingOccurrenceCount: number;
  codingShare: number | null;
  avgRoundCount: number | null;
  avgQuestionCount: number | null;
}

export interface CompanyDifficultyStat {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  unknownCount: number;
  /** mean of easy=1/medium=2/hard=3 over known-difficulty interviews; null if n = 0 */
  averageScore: number | null;
  sampleSize: number;
}

export interface CompanyRoundTypeStat {
  roundType: string;
  roundCount: number;
  interviewCount: number;
  /** share of the company's published rounds, 0–1 */
  share: number | null;
}

export interface CompanyTrendItem {
  kind: "topic" | "question" | "coding_problem";
  id: string;
  label: string;
  slug: string | null;
  trendScore: number;
  recentCount: number;
  totalCount: number;
  direction: "rising" | "falling";
}

export interface CompanyInterviewEmphasis {
  knowledgeShare: number | null;
  codingShare: number | null;
  unclassifiedShare: number | null;
  /** research + system design + behavioral occurrences normalized by all occurrences */
  researchAndDesignShare: number | null;
  knowledgeOccurrences: number;
  codingOccurrences: number;
  unclassifiedOccurrences: number;
  sampleSize: number;
}

export interface CompanyPreparationGuide {
  mustStudyTopics: CompanyTopicStat[];
  mustStudyQuestions: CompanyQuestionStat[];
  recommendedCodingProblems: CompanyCodingProblemStat[];
  interviewStructureNotes: {
    medianRoundCount: number | null;
    medianQuestionCount: number | null;
    dominantRoundType: string | null;
    sampleSize: number;
  };
  limitedDataNote: boolean;
}

export interface CompanyQualitySnapshot {
  publishedInterviewCount: number;
  unlinkedQuestionRate: number | null;
  linkedKnowledgeCount: number;
  linkedCodingCount: number;
  unlinkedCount: number;
  sourceMix: Array<{ source: string; count: number }>;
  reviewedCount: number;
  verifiedCount: number;
  roleCoverage: number;
  seasonCoverage: number;
  confidenceScore: number | null;
}

export interface CompanyFilters {
  q?: string;
  /** has published interviews */
  hasInterviews?: boolean;
  /** has canonical coding-problem evidence */
  hasCoding?: boolean;
  /** role category, e.g. research / engineering */
  roleCategory?: string;
  /** published within the last 180 days */
  recentActivity?: boolean;
}

export interface CompanyDetail {
  company: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    country: string | null;
  };
  stats: {
    publishedInterviewCount: number;
    positionCount: number;
    latestInterviewAt: string | null;
  };
  positions: CompanyPositionStat[];
  topics: CompanyTopicStat[];
  questions: CompanyQuestionStat[];
  codingProblems: CompanyCodingProblemStat[];
  seasons: CompanySeasonStat[];
  difficulty: CompanyDifficultyStat | null;
  roundTypes: CompanyRoundTypeStat[];
  emphasis: CompanyInterviewEmphasis;
  trends: CompanyTrendItem[];
  guide: CompanyPreparationGuide;
}
