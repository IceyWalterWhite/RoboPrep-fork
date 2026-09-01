import "server-only";

import type { Json } from "@/types/database";
import type {
  IngestionEvent,
  IngestionJob,
  IngestionJobStatus,
  IngestionJobType,
  InterviewDraft,
  InterviewQuestionDraft,
  InterviewRoundDraft,
  InterviewSubmission,
  ModerationFlag,
  NewCanonicalDraft,
  ReviewTask,
  ReviewTaskStatus,
  SubmissionStatus,
  SubmissionType,
  TopicSuggestion,
} from "@/types/ingestion";

/**
 * Mappers: database rows → Week 6 domain types. All JSONB columns are parsed
 * defensively so a malformed value degrades to an empty default rather than
 * crashing a review page.
 */

export function mapSubmission(row: {
  id: string;
  user_id: string | null;
  submission_type: string;
  raw_text: string;
  source_url: string | null;
  company_hint: string | null;
  position_hint: string | null;
  year_hint: number | null;
  season_hint: string | null;
  location_hint: string | null;
  language: string;
  status: string;
  moderation_flags: Json;
  review_notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}): InterviewSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    submissionType: row.submission_type as SubmissionType,
    rawText: row.raw_text,
    sourceUrl: row.source_url,
    companyHint: row.company_hint,
    positionHint: row.position_hint,
    yearHint: row.year_hint,
    seasonHint: row.season_hint,
    locationHint: row.location_hint,
    language: row.language,
    status: row.status as SubmissionStatus,
    moderationFlags: parseModerationFlags(row.moderation_flags),
    reviewNotes: row.review_notes,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDraft(row: {
  id: string;
  submission_id: string;
  company_name: string | null;
  position_title: string | null;
  year: number | null;
  season: string | null;
  location: string | null;
  employment_type: string;
  experience_level: string;
  summary: string | null;
  confidence: number | string | null;
  parser_version: string;
  prompt_version: string | null;
  model: string | null;
  provider: string | null;
  interview_type: string;
  status: string;
  published_interview_id: string | null;
  created_at: string;
  updated_at: string;
}): InterviewDraft {
  return {
    id: row.id,
    submissionId: row.submission_id,
    companyName: row.company_name,
    positionTitle: row.position_title,
    year: row.year,
    season: row.season,
    location: row.location,
    employmentType: row.employment_type as InterviewDraft["employmentType"],
    experienceLevel: row.experience_level as InterviewDraft["experienceLevel"],
    summary: row.summary,
    confidence: Number(row.confidence ?? 0),
    parserVersion: row.parser_version,
    promptVersion: row.prompt_version,
    model: row.model,
    provider: row.provider,
    interviewType: row.interview_type,
    status: row.status as InterviewDraft["status"],
    publishedInterviewId: row.published_interview_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRoundDraft(row: {
  id: string;
  draft_id: string;
  round_number: number | null;
  title: string | null;
  round_type: string;
  duration_minutes: number | null;
  interviewer_role: string | null;
  summary: string | null;
  confidence: number | string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}): InterviewRoundDraft {
  return {
    id: row.id,
    draftId: row.draft_id,
    roundNumber: row.round_number,
    title: row.title,
    roundType: row.round_type as InterviewRoundDraft["roundType"],
    durationMinutes: row.duration_minutes,
    interviewerRole: row.interviewer_role,
    summary: row.summary,
    confidence: Number(row.confidence ?? 0),
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapQuestionDraft(row: {
  id: string;
  draft_id: string;
  round_draft_id: string | null;
  original_wording: string;
  normalized_text: string | null;
  question_type: string | null;
  difficulty: string | null;
  candidate_question_id: string | null;
  candidate_coding_problem_id: string | null;
  match_confidence: number | string | null;
  match_score: number | string | null;
  topic_suggestions: Json;
  new_canonical: Json | null;
  order_index: number;
  review_status: string;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}): InterviewQuestionDraft {
  return {
    id: row.id,
    draftId: row.draft_id,
    roundDraftId: row.round_draft_id,
    originalWording: row.original_wording,
    normalizedText: row.normalized_text,
    questionType: row.question_type as InterviewQuestionDraft["questionType"],
    difficulty: row.difficulty as InterviewQuestionDraft["difficulty"],
    candidateQuestionId: row.candidate_question_id,
    candidateCodingProblemId: row.candidate_coding_problem_id,
    matchConfidence: row.match_confidence === null ? null : Number(row.match_confidence),
    matchScore: row.match_score === null ? null : Number(row.match_score),
    topicSuggestions: parseTopicSuggestions(row.topic_suggestions),
    newCanonical: parseNewCanonical(row.new_canonical),
    orderIndex: row.order_index,
    reviewStatus: row.review_status as InterviewQuestionDraft["reviewStatus"],
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapJob(row: {
  id: string;
  submission_id: string;
  job_type: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  provider: string | null;
  model: string | null;
  parser_version: string | null;
  prompt_version: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: number | string | null;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}): IngestionJob {
  return {
    id: row.id,
    submissionId: row.submission_id,
    jobType: row.job_type as IngestionJobType,
    status: row.status as IngestionJobStatus,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    provider: row.provider,
    model: row.model,
    parserVersion: row.parser_version,
    promptVersion: row.prompt_version,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    estimatedCost: row.estimated_cost === null ? null : Number(row.estimated_cost),
    errorCode: (row.error_code ?? null) as IngestionJob["errorCode"],
    errorMessage: row.error_message,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEvent(row: {
  id: string;
  submission_id: string;
  job_id: string | null;
  event_type: string;
  message: string | null;
  metadata: Json;
  created_at: string;
}): IngestionEvent {
  return {
    id: row.id,
    submissionId: row.submission_id,
    jobId: row.job_id,
    eventType: row.event_type,
    message: row.message,
    metadata: (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {}),
    createdAt: row.created_at,
  };
}

export function mapReviewTask(row: {
  id: string;
  submission_id: string;
  draft_id: string | null;
  status: string;
  assigned_to: string | null;
  priority: number;
  duplicate_score: number | string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}): ReviewTask {
  return {
    id: row.id,
    submissionId: row.submission_id,
    draftId: row.draft_id,
    status: row.status as ReviewTaskStatus,
    assignedTo: row.assigned_to,
    priority: row.priority,
    duplicateScore: row.duplicate_score === null ? null : Number(row.duplicate_score),
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function parseModerationFlags(value: Json): ModerationFlag[] {
  if (!Array.isArray(value)) return [];
  const flags: ModerationFlag[] = [];
  for (const entry of value as unknown[]) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Partial<ModerationFlag>;
    if (typeof candidate.type === "string" && typeof candidate.count === "number") {
      flags.push({ type: candidate.type, count: candidate.count });
    }
  }
  return flags;
}

function parseTopicSuggestions(value: Json): TopicSuggestion[] {
  if (!Array.isArray(value)) return [];
  const suggestions: TopicSuggestion[] = [];
  for (const entry of value as unknown[]) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Partial<TopicSuggestion>;
    if (
      typeof candidate.topicId === "string" &&
      typeof candidate.topicName === "string" &&
      typeof candidate.confidence === "number" &&
      (candidate.source === "keyword_rule" || candidate.source === "canonical_match" || candidate.source === "llm_classifier")
    ) {
      suggestions.push({
        topicId: candidate.topicId,
        topicName: candidate.topicName,
        confidence: candidate.confidence,
        source: candidate.source,
      });
    }
  }
  return suggestions;
}

function parseNewCanonical(value: Json | null): NewCanonicalDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as unknown as Partial<NewCanonicalDraft>;
  if (typeof candidate.title !== "string" || candidate.title.trim().length === 0) return null;
  return {
    title: candidate.title,
    slug: candidate.slug,
    questionType: candidate.questionType ?? "knowledge",
    difficulty: candidate.difficulty,
    summary: candidate.summary,
    topicIds: candidate.topicIds,
  };
}
