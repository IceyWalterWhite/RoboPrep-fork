import type { Difficulty } from "@/types/database";
import type { KnowledgeQuestionSummary } from "@/types/knowledge";

export type InterviewExperienceLevel =
  | "intern"
  | "new_grad"
  | "experienced"
  | "unknown";

export type InterviewEmploymentType =
  | "internship"
  | "full_time"
  | "contract"
  | "unknown";

export type InterviewApplicationStage =
  | "screening"
  | "technical"
  | "onsite"
  | "final"
  | "mixed"
  | "unknown";

export type InterviewDifficulty = Difficulty | "unknown";

export type InterviewRoundType =
  | "recruiter"
  | "technical"
  | "coding"
  | "research"
  | "manager"
  | "behavioral"
  | "mixed"
  | "unknown";

export type InterviewVerificationState = "unverified" | "reviewed" | "verified";

export interface InterviewSource {
  type: string | null;
  label: string;
  url: string | null;
  verification: InterviewVerificationState;
  verifiedAt: string | null;
}

export interface InterviewStats {
  roundCount: number;
  questionCount: number;
  linkedQuestionCount: number;
  codingQuestionCount: number;
  topicCount: number;
}

export interface InterviewQuestionOccurrence {
  id: string;
  questionId: string | null;
  roundId: string | null;
  roundNumber: number;
  orderIndex: number;
  originalWording: string | null;
  canonicalQuestion: KnowledgeQuestionSummary | null;
  notes: string | null;
  questionContext: string | null;
  answerSummary: string | null;
  difficulty: Difficulty | null;
}

export interface InterviewRound {
  id: string | null;
  roundNumber: number;
  title: string;
  roundType: InterviewRoundType;
  durationMinutes: number | null;
  interviewerRole: string | null;
  summary: string | null;
  questions: InterviewQuestionOccurrence[];
}

export interface InterviewCompanyRef {
  id: string;
  name: string;
  slug: string;
}

export interface InterviewPositionRef {
  id: string;
  title: string;
  slug: string;
  category: string | null;
}

export interface InterviewSummary {
  id: string;
  slug: string;
  title: string;
  company: InterviewCompanyRef | null;
  position: InterviewPositionRef | null;
  year: number;
  season: string | null;
  location: string | null;
  interviewType: string | null;
  experienceLevel: InterviewExperienceLevel;
  employmentType: InterviewEmploymentType;
  applicationStage: InterviewApplicationStage;
  difficulty: InterviewDifficulty;
  durationMinutes: number | null;
  summary: string | null;
  language: string;
  isAnonymous: boolean;
  qualityScore: number | null;
  publishedAt: string | null;
  updatedAt: string;
  source: InterviewSource;
  tags: string[];
  stats: InterviewStats;
}

export interface InterviewDetail extends InterviewSummary {
  rounds: InterviewRound[];
  topics: InterviewTopicSummary[];
}

export interface InterviewTopicSummary {
  name: string;
  slug: string;
  questionCount: number;
}

export interface InterviewFilters {
  query?: string;
  company?: string;
  position?: string;
  year?: number;
  season?: string;
  experienceLevel?: InterviewExperienceLevel;
  employmentType?: InterviewEmploymentType;
  difficulty?: InterviewDifficulty;
}

export type InterviewSort = "latest" | "most_questions" | "difficulty";

export interface InterviewFilterOptions {
  companies: Array<{ name: string; slug: string }>;
  positions: Array<{ title: string; slug: string; companySlug: string | null }>;
  years: number[];
  seasons: string[];
  difficulties: InterviewDifficulty[];
}

export interface RelatedInterview extends InterviewSummary {
  relationScore: number;
}

export interface PaginatedInterviews {
  items: InterviewSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
