import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  IngestionEvent,
  IngestionJob,
  InterviewDraft,
  InterviewQuestionDraft,
  InterviewRoundDraft,
  InterviewSubmission,
  ReviewTask,
} from "@/types/ingestion";

import { mapDraft, mapEvent, mapJob, mapQuestionDraft, mapReviewTask, mapRoundDraft, mapSubmission } from "./mappers";

/**
 * Ingestion query layer (Task 12). All access to the Week 6 tables goes
 * through the service-role client — these tables have RLS with no public
 * policies, so this module is the only door.
 */

const SUBMISSION_COLUMNS =
  "id, user_id, submission_type, raw_text, source_url, company_hint, position_hint, year_hint, season_hint, location_hint, language, status, moderation_flags, review_notes, processed_at, created_at, updated_at";

const DRAFT_COLUMNS =
  "id, submission_id, company_name, position_title, year, season, location, employment_type, experience_level, summary, confidence, parser_version, prompt_version, model, provider, interview_type, status, published_interview_id, created_at, updated_at";

const ROUND_DRAFT_COLUMNS =
  "id, draft_id, round_number, title, round_type, duration_minutes, interviewer_role, summary, confidence, order_index, created_at, updated_at";

const QUESTION_DRAFT_COLUMNS =
  "id, draft_id, round_draft_id, original_wording, normalized_text, question_type, difficulty, candidate_question_id, candidate_coding_problem_id, match_confidence, match_score, topic_suggestions, new_canonical, order_index, review_status, review_notes, created_at, updated_at";

const JOB_COLUMNS =
  "id, submission_id, job_type, status, attempt_count, max_attempts, provider, model, parser_version, prompt_version, input_tokens, output_tokens, estimated_cost, error_code, error_message, started_at, finished_at, created_at, updated_at";

const EVENT_COLUMNS = "id, submission_id, job_id, event_type, message, metadata, created_at";

const REVIEW_TASK_COLUMNS =
  "id, submission_id, draft_id, status, assigned_to, priority, duplicate_score, review_notes, created_at, updated_at, completed_at";

function requireAdmin(admin: SupabaseClient | null): SupabaseClient {
  if (!admin) {
    throw new Error("The ingestion service is not configured (missing service-role key).");
  }
  return admin;
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function getSubmission(
  admin: SupabaseClient | null,
  submissionId: string,
): Promise<InterviewSubmission | null> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("interview_submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw new Error(`submission query failed: ${error.message}`);
  return data ? mapSubmission(data) : null;
}

export async function getOwnSubmission(
  admin: SupabaseClient | null,
  submissionId: string,
  userId: string,
): Promise<InterviewSubmission | null> {
  const submission = await getSubmission(admin, submissionId);
  if (!submission || submission.userId !== userId) return null;
  return submission;
}

export async function listSubmissions(
  admin: SupabaseClient | null,
  options: { statuses?: string[]; limit?: number; offset?: number } = {},
): Promise<InterviewSubmission[]> {
  const client = requireAdmin(admin);
  let query = client
    .from("interview_submissions")
    .select(SUBMISSION_COLUMNS)
    .order("created_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 25) - 1);
  if (options.statuses && options.statuses.length > 0) {
    query = query.in("status", options.statuses);
  }
  const { data, error } = await query;
  if (error) throw new Error(`submission list failed: ${error.message}`);
  return (data ?? []).map(mapSubmission);
}

export async function updateSubmissionStatus(
  admin: SupabaseClient | null,
  submissionId: string,
  status: string,
): Promise<void> {
  const client = requireAdmin(admin);
  const { error } = await client
    .from("interview_submissions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", submissionId);
  if (error) throw new Error(`submission status update failed: ${error.message}`);
}

export async function updateSubmissionReview(
  admin: SupabaseClient | null,
  submissionId: string,
  patch: { reviewNotes?: string | null; moderationFlags?: unknown; processedAt?: string | null },
): Promise<void> {
  const client = requireAdmin(admin);
  const { error } = await client
    .from("interview_submissions")
    .update({
      ...(patch.reviewNotes !== undefined ? { review_notes: patch.reviewNotes } : {}),
      ...(patch.moderationFlags !== undefined ? { moderation_flags: patch.moderationFlags } : {}),
      ...(patch.processedAt !== undefined ? { processed_at: patch.processedAt } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) throw new Error(`submission review update failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

export async function getDraftBySubmission(
  admin: SupabaseClient | null,
  submissionId: string,
): Promise<InterviewDraft | null> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("interview_drafts")
    .select(DRAFT_COLUMNS)
    .eq("submission_id", submissionId)
    .maybeSingle();
  if (error) throw new Error(`draft query failed: ${error.message}`);
  return data ? mapDraft(data) : null;
}

export async function listDrafts(
  admin: SupabaseClient | null,
  submissionIds: string[],
): Promise<Map<string, InterviewDraft>> {
  if (submissionIds.length === 0) return new Map();
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("interview_drafts")
    .select(DRAFT_COLUMNS)
    .in("submission_id", submissionIds);
  if (error) throw new Error(`draft list failed: ${error.message}`);
  return new Map((data ?? []).map((row) => [row.submission_id, mapDraft(row)]));
}

export async function insertDraft(
  admin: SupabaseClient | null,
  draft: {
    submissionId: string;
    companyName: string | null;
    positionTitle: string | null;
    year: number | null;
    season: string | null;
    location: string | null;
    employmentType: string;
    experienceLevel: string;
    summary: string | null;
    confidence: number;
    parserVersion: string;
    promptVersion: string;
    model: string;
    provider: string;
    interviewType: string;
  },
): Promise<InterviewDraft> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("interview_drafts")
    .insert({
      submission_id: draft.submissionId,
      company_name: draft.companyName,
      position_title: draft.positionTitle,
      year: draft.year,
      season: draft.season,
      location: draft.location,
      employment_type: draft.employmentType,
      experience_level: draft.experienceLevel,
      summary: draft.summary,
      confidence: draft.confidence,
      parser_version: draft.parserVersion,
      prompt_version: draft.promptVersion,
      model: draft.model,
      provider: draft.provider,
      interview_type: draft.interviewType,
      status: "parsed",
    })
    .select(DRAFT_COLUMNS)
    .single();
  if (error) throw new Error(`draft insert failed: ${error.message}`);
  return mapDraft(data);
}

export async function updateDraft(
  admin: SupabaseClient | null,
  draftId: string,
  patch: Partial<{
    companyName: string | null;
    positionTitle: string | null;
    year: number | null;
    season: string | null;
    location: string | null;
    summary: string | null;
    status: string;
  }>,
): Promise<void> {
  const client = requireAdmin(admin);
  const { error } = await client
    .from("interview_drafts")
    .update({
      ...(patch.companyName !== undefined ? { company_name: patch.companyName } : {}),
      ...(patch.positionTitle !== undefined ? { position_title: patch.positionTitle } : {}),
      ...(patch.year !== undefined ? { year: patch.year } : {}),
      ...(patch.season !== undefined ? { season: patch.season } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);
  if (error) throw new Error(`draft update failed: ${error.message}`);
}

export async function archiveDraft(
  admin: SupabaseClient | null,
  draftId: string,
): Promise<void> {
  await updateDraft(admin, draftId, { status: "archived" });
}

// ---------------------------------------------------------------------------
// Round drafts
// ---------------------------------------------------------------------------

export async function listRoundDrafts(
  admin: SupabaseClient | null,
  draftId: string,
): Promise<InterviewRoundDraft[]> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("interview_round_drafts")
    .select(ROUND_DRAFT_COLUMNS)
    .eq("draft_id", draftId)
    .order("order_index");
  if (error) throw new Error(`round draft query failed: ${error.message}`);
  return (data ?? []).map(mapRoundDraft);
}

export async function insertRoundDraft(
  admin: SupabaseClient | null,
  round: {
    draftId: string;
    roundNumber: number | null;
    title: string | null;
    roundType: string;
    durationMinutes: number | null;
    interviewerRole: string | null;
    summary: string | null;
    confidence: number;
    orderIndex: number;
  },
): Promise<InterviewRoundDraft> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("interview_round_drafts")
    .insert({
      draft_id: round.draftId,
      round_number: round.roundNumber,
      title: round.title,
      round_type: round.roundType,
      duration_minutes: round.durationMinutes,
      interviewer_role: round.interviewerRole,
      summary: round.summary,
      confidence: round.confidence,
      order_index: round.orderIndex,
    })
    .select(ROUND_DRAFT_COLUMNS)
    .single();
  if (error) throw new Error(`round draft insert failed: ${error.message}`);
  return mapRoundDraft(data);
}

export async function updateRoundDraft(
  admin: SupabaseClient | null,
  roundDraftId: string,
  patch: Partial<{ title: string | null; roundType: string; durationMinutes: number | null }>,
): Promise<void> {
  const client = requireAdmin(admin);
  const { error } = await client
    .from("interview_round_drafts")
    .update({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.roundType !== undefined ? { round_type: patch.roundType } : {}),
      ...(patch.durationMinutes !== undefined ? { duration_minutes: patch.durationMinutes } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", roundDraftId);
  if (error) throw new Error(`round draft update failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Question drafts
// ---------------------------------------------------------------------------

export async function listQuestionDrafts(
  admin: SupabaseClient | null,
  draftId: string,
): Promise<InterviewQuestionDraft[]> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("interview_question_drafts")
    .select(QUESTION_DRAFT_COLUMNS)
    .eq("draft_id", draftId)
    .order("order_index");
  if (error) throw new Error(`question draft query failed: ${error.message}`);
  return (data ?? []).map(mapQuestionDraft);
}

export async function insertQuestionDraft(
  admin: SupabaseClient | null,
  question: {
    draftId: string;
    roundDraftId: string | null;
    originalWording: string;
    normalizedText: string | null;
    questionType: string | null;
    difficulty: string | null;
    matchConfidence: number | null;
    matchScore: number | null;
    topicSuggestions: unknown;
    orderIndex: number;
  },
): Promise<InterviewQuestionDraft> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("interview_question_drafts")
    .insert({
      draft_id: question.draftId,
      round_draft_id: question.roundDraftId,
      original_wording: question.originalWording,
      normalized_text: question.normalizedText,
      question_type: question.questionType,
      difficulty: question.difficulty,
      match_confidence: question.matchConfidence,
      match_score: question.matchScore,
      topic_suggestions: question.topicSuggestions,
      order_index: question.orderIndex,
      review_status: "pending",
    })
    .select(QUESTION_DRAFT_COLUMNS)
    .single();
  if (error) throw new Error(`question draft insert failed: ${error.message}`);
  return mapQuestionDraft(data);
}

export async function updateQuestionDraft(
  admin: SupabaseClient | null,
  questionDraftId: string,
  patch: Partial<{
    normalizedText: string | null;
    questionType: string | null;
    difficulty: string | null;
    candidateQuestionId: string | null;
    candidateCodingProblemId: string | null;
    matchConfidence: number | null;
    matchScore: number | null;
    topicSuggestions: unknown;
    newCanonical: unknown;
    reviewStatus: string;
    reviewNotes: string | null;
  }>,
): Promise<void> {
  const client = requireAdmin(admin);
  const { error } = await client
    .from("interview_question_drafts")
    .update({
      ...(patch.normalizedText !== undefined ? { normalized_text: patch.normalizedText } : {}),
      ...(patch.questionType !== undefined ? { question_type: patch.questionType } : {}),
      ...(patch.difficulty !== undefined ? { difficulty: patch.difficulty } : {}),
      ...(patch.candidateQuestionId !== undefined ? { candidate_question_id: patch.candidateQuestionId } : {}),
      ...(patch.candidateCodingProblemId !== undefined
        ? { candidate_coding_problem_id: patch.candidateCodingProblemId }
        : {}),
      ...(patch.matchConfidence !== undefined ? { match_confidence: patch.matchConfidence } : {}),
      ...(patch.matchScore !== undefined ? { match_score: patch.matchScore } : {}),
      ...(patch.topicSuggestions !== undefined ? { topic_suggestions: patch.topicSuggestions } : {}),
      ...(patch.newCanonical !== undefined ? { new_canonical: patch.newCanonical } : {}),
      ...(patch.reviewStatus !== undefined ? { review_status: patch.reviewStatus } : {}),
      ...(patch.reviewNotes !== undefined ? { review_notes: patch.reviewNotes } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionDraftId);
  if (error) throw new Error(`question draft update failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export async function createJob(
  admin: SupabaseClient | null,
  job: {
    submissionId: string;
    jobType: string;
    provider?: string | null;
    model?: string | null;
    parserVersion?: string | null;
    promptVersion?: string | null;
    maxAttempts?: number;
  },
): Promise<IngestionJob> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("ingestion_jobs")
    .insert({
      submission_id: job.submissionId,
      job_type: job.jobType,
      provider: job.provider ?? null,
      model: job.model ?? null,
      parser_version: job.parserVersion ?? null,
      prompt_version: job.promptVersion ?? null,
      max_attempts: job.maxAttempts ?? 3,
      status: "queued",
    })
    .select(JOB_COLUMNS)
    .single();
  if (error) throw new Error(`job create failed: ${error.message}`);
  return mapJob(data);
}

export async function getJob(
  admin: SupabaseClient | null,
  jobId: string,
): Promise<IngestionJob | null> {
  const client = requireAdmin(admin);
  const { data, error } = await client.from("ingestion_jobs").select(JOB_COLUMNS).eq("id", jobId).maybeSingle();
  if (error) throw new Error(`job query failed: ${error.message}`);
  return data ? mapJob(data) : null;
}

export async function listJobsForSubmission(
  admin: SupabaseClient | null,
  submissionId: string,
): Promise<IngestionJob[]> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("ingestion_jobs")
    .select(JOB_COLUMNS)
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`job list failed: ${error.message}`);
  return (data ?? []).map(mapJob);
}

export async function updateJob(
  admin: SupabaseClient | null,
  jobId: string,
  patch: Partial<{
    status: string;
    attemptCount: number;
    errorCode: string | null;
    errorMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
    estimatedCost: number | null;
  }>,
): Promise<void> {
  const client = requireAdmin(admin);
  const { error } = await client
    .from("ingestion_jobs")
    .update({
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.attemptCount !== undefined ? { attempt_count: patch.attemptCount } : {}),
      ...(patch.errorCode !== undefined ? { error_code: patch.errorCode } : {}),
      ...(patch.errorMessage !== undefined ? { error_message: patch.errorMessage } : {}),
      ...(patch.startedAt !== undefined ? { started_at: patch.startedAt } : {}),
      ...(patch.finishedAt !== undefined ? { finished_at: patch.finishedAt } : {}),
      ...(patch.inputTokens !== undefined ? { input_tokens: patch.inputTokens } : {}),
      ...(patch.outputTokens !== undefined ? { output_tokens: patch.outputTokens } : {}),
      ...(patch.estimatedCost !== undefined ? { estimated_cost: patch.estimatedCost } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  if (error) throw new Error(`job update failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function recordEvent(
  admin: SupabaseClient | null,
  event: { submissionId: string; jobId?: string | null; eventType: string; message?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  const client = requireAdmin(admin);
  const { error } = await client.from("ingestion_events").insert({
    submission_id: event.submissionId,
    job_id: event.jobId ?? null,
    event_type: event.eventType,
    message: event.message ?? null,
    metadata: event.metadata ?? {},
  });
  if (error) throw new Error(`event insert failed: ${error.message}`);
}

export async function listEvents(
  admin: SupabaseClient | null,
  submissionId: string,
): Promise<IngestionEvent[]> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("ingestion_events")
    .select(EVENT_COLUMNS)
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`event list failed: ${error.message}`);
  return (data ?? []).map(mapEvent);
}

// ---------------------------------------------------------------------------
// Review tasks
// ---------------------------------------------------------------------------

export async function createReviewTask(
  admin: SupabaseClient | null,
  task: { submissionId: string; draftId?: string | null; duplicateScore?: number | null },
): Promise<ReviewTask> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("review_tasks")
    .upsert(
      {
        submission_id: task.submissionId,
        draft_id: task.draftId ?? null,
        duplicate_score: task.duplicateScore ?? null,
        status: "open",
      },
      { onConflict: "submission_id" },
    )
    .select(REVIEW_TASK_COLUMNS)
    .single();
  if (error) throw new Error(`review task create failed: ${error.message}`);
  return mapReviewTask(data);
}

export async function getReviewTask(
  admin: SupabaseClient | null,
  submissionId: string,
): Promise<ReviewTask | null> {
  const client = requireAdmin(admin);
  const { data, error } = await client
    .from("review_tasks")
    .select(REVIEW_TASK_COLUMNS)
    .eq("submission_id", submissionId)
    .maybeSingle();
  if (error) throw new Error(`review task query failed: ${error.message}`);
  return data ? mapReviewTask(data) : null;
}

export async function updateReviewTask(
  admin: SupabaseClient | null,
  taskId: string,
  patch: Partial<{
    status: string;
    assignedTo: string | null;
    priority: number;
    duplicateScore: number | null;
    reviewNotes: string | null;
    completedAt: string | null;
  }>,
): Promise<void> {
  const client = requireAdmin(admin);
  const { error } = await client
    .from("review_tasks")
    .update({
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.assignedTo !== undefined ? { assigned_to: patch.assignedTo } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      ...(patch.duplicateScore !== undefined ? { duplicate_score: patch.duplicateScore } : {}),
      ...(patch.reviewNotes !== undefined ? { review_notes: patch.reviewNotes } : {}),
      ...(patch.completedAt !== undefined ? { completed_at: patch.completedAt } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) throw new Error(`review task update failed: ${error.message}`);
}
