import type {
  Interview,
  InterviewQuestion,
  InterviewRound as InterviewRoundRow,
  Position,
  Question,
} from "@/types/database";
import type {
  InterviewCompanyRef,
  InterviewPositionRef,
  InterviewQuestionOccurrence,
  InterviewRound,
  InterviewSummary,
  InterviewTopicSummary,
  RelatedInterview,
} from "@/types/interview";
import type { KnowledgeQuestionSummary } from "@/types/knowledge";

import {
  calculateInterviewStats,
  mapSourceMetadata,
  normalizeInterviewSlug,
} from "./helpers";

type CompanyRow = { id: string; name: string; slug: string };

export function mapInterviewSummary(input: {
  interview: Interview;
  company?: CompanyRow | null;
  position?: Pick<Position, "id" | "title" | "slug" | "category"> | null;
  tags?: string[];
  stats?: ReturnType<typeof calculateInterviewStats>;
}): InterviewSummary {
  const { interview, company, position } = input;
  const companyRef: InterviewCompanyRef | null = company
    ? { id: company.id, name: company.name, slug: company.slug }
    : null;
  const positionRef: InterviewPositionRef | null = position
    ? {
        id: position.id,
        title: position.title,
        slug: position.slug,
        category: position.category,
      }
    : null;
  const fallbackSlug = normalizeInterviewSlug(interview.title, interview.id);
  return {
    id: interview.id,
    slug: interview.slug ?? fallbackSlug,
    title: interview.title ?? position?.title ?? interview.interview_type ?? "面试经历",
    company: companyRef,
    position: positionRef,
    year: interview.year,
    season: interview.season,
    location: interview.location,
    interviewType: interview.interview_type,
    experienceLevel: interview.experience_level,
    employmentType: interview.employment_type,
    applicationStage: interview.application_stage,
    difficulty: interview.difficulty_overall,
    durationMinutes: interview.duration_minutes,
    summary: interview.summary,
    language: interview.language,
    isAnonymous: interview.is_anonymous,
    qualityScore: interview.quality_score,
    publishedAt: interview.published_at,
    updatedAt: interview.updated_at,
    source: mapSourceMetadata({
      sourceType: interview.source_type,
      sourceUrl: interview.source_url,
      status: interview.status,
      verifiedAt: interview.verified_at,
    }),
    tags: [...new Set(input.tags ?? [])],
    stats: input.stats ?? {
      roundCount: interview.round_count,
      questionCount: 0,
      linkedQuestionCount: 0,
      codingQuestionCount: 0,
      topicCount: 0,
    },
  };
}

export function mapInterviewRound(row: InterviewRoundRow): InterviewRound {
  return {
    id: row.id,
    roundNumber: row.round_number,
    title: row.title ?? `第 ${row.round_number} 轮`,
    roundType: row.round_type,
    durationMinutes: row.duration_minutes,
    interviewerRole: row.interviewer_role,
    summary: row.summary,
    questions: [],
  };
}

export function mapInterviewQuestion(
  row: InterviewQuestion,
  canonicalQuestion: KnowledgeQuestionSummary | null,
): InterviewQuestionOccurrence {
  return {
    id: row.id,
    questionId: row.question_id,
    roundId: row.round_id,
    roundNumber: row.round_number ?? 1,
    orderIndex: row.order_index ?? 0,
    originalWording: row.original_wording,
    canonicalQuestion,
    notes: row.notes,
    questionContext: row.question_context,
    answerSummary: row.answer_summary,
    difficulty: row.difficulty === "unknown" ? null : row.difficulty,
  };
}

export function mapInterviewTopicSummary(
  name: string,
  slug: string,
  questionCount: number,
): InterviewTopicSummary {
  return { name, slug, questionCount };
}

export function toRelatedInterview(
  summary: InterviewSummary,
  relationScore: number,
): RelatedInterview {
  return { ...summary, relationScore };
}

export type CanonicalQuestionRow = Question;
