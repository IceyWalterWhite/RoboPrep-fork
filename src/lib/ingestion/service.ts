import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { slugify } from "@/lib/ingestion/normalize";
import {
  canTransition,
  PARSER_VERSION,
  PROMPT_VERSION,
  SUBMISSION_MAX_CHARS,
  SUBMISSION_MIN_CHARS,
} from "@/lib/ingestion/constants";
import type { Database } from "@/types/database";
import type {
  IngestionJob,
  InterviewSubmission,
  ParsedInterviewPayload,
  RejectionReason,
  SubmissionStatus,
  SubmissionType,
  TopicSuggestion,
} from "@/types/ingestion";

import { errorFromUnknown, IngestionError } from "./errors";
import { matchCompany } from "./matching/company";
import { findDuplicateInterviews, type DuplicateDetectionRow } from "./matching/interview-duplicates";
import { detectCodingSignal } from "./matching/topics";
import { moderationFlags, redactContactInfo } from "./moderation";
import { normalizeQuestionText } from "./normalize";
import { rankCanonicalCandidates } from "./matching/question-candidates";
import { createParser } from "./parser/service";
import type { ParserUsage } from "./parser/types";
import {
  archiveDraft,
  createJob,
  createReviewTask,
  getDraftBySubmission,
  getJob,
  getSubmission,
  insertDraft,
  insertQuestionDraft,
  insertRoundDraft,
  listEvents,
  listJobsForSubmission,
  listQuestionDrafts,
  recordEvent,
  updateJob,
  updateQuestionDraft,
  updateReviewTask,
  updateSubmissionReview,
  updateSubmissionStatus,
} from "./queries";

/**
 * Ingestion service (Task 12): the single orchestrator for submissions,
 * parse jobs, review state transitions, and publishing. Page components and
 * API routes call these functions; they never orchestrate DB state directly.
 */

export interface CreateSubmissionInput {
  rawText: string;
  submissionType?: SubmissionType;
  sourceUrl?: string | null;
  companyHint?: string | null;
  positionHint?: string | null;
  yearHint?: number | null;
  seasonHint?: string | null;
  locationHint?: string | null;
  language?: string;
}

/** Validate size limits and store the immutable raw submission (Task 53). */
export async function createSubmission(
  admin: SupabaseClient<Database> | null,
  userId: string | null,
  input: CreateSubmissionInput,
): Promise<InterviewSubmission> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const rawText = input.rawText.trim();
  if (rawText.length < SUBMISSION_MIN_CHARS) {
    throw new IngestionError("size_limit", `Interview experience must be at least ${SUBMISSION_MIN_CHARS} characters.`);
  }
  if (rawText.length > SUBMISSION_MAX_CHARS) {
    throw new IngestionError("size_limit", `Interview experience must be at most ${SUBMISSION_MAX_CHARS} characters.`);
  }

  if (input.sourceUrl) {
    assertSafeSourceUrl(input.sourceUrl);
  }

  const { data, error } = await admin
    .from("interview_submissions")
    .insert({
      user_id: userId,
      submission_type: input.submissionType ?? "user_text",
      raw_text: rawText,
      source_url: input.sourceUrl ?? null,
      company_hint: input.companyHint ?? null,
      position_hint: input.positionHint ?? null,
      year_hint: input.yearHint ?? null,
      season_hint: input.seasonHint ?? null,
      location_hint: input.locationHint ?? null,
      language: input.language ?? "zh-CN",
      status: "submitted",
    })
    .select("*")
    .single();
  if (error) throw new Error(`submission create failed: ${error.message}`);

  await recordEvent(admin, {
    submissionId: data.id,
    eventType: "submission_created",
    message: "raw submission stored",
    metadata: { submission_type: data.submission_type, char_count: rawText.length },
  });

  return { ...data, updatedAt: data.updated_at } as unknown as InterviewSubmission;
}

/**
 * Task 39: only http(s) URLs pass; javascript:/data:/malformed URLs are
 * rejected before they are stored.
 */
export function assertSafeSourceUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new IngestionError("unknown", "Source URL is not a valid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new IngestionError("unknown", "Only http(s) source URLs are accepted.");
  }
}

/**
 * Server-triggered worker strategy (Task 49): parse jobs run when invoked
 * (after submit, or by an admin retry). No external queue infrastructure.
 */
export async function enqueueParseJob(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
): Promise<IngestionJob> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const parser = createParser();
  const job = await createJob(admin, {
    submissionId,
    jobType: "parse_interview",
    provider: parser.provider,
    model: parser.model,
    parserVersion: PARSER_VERSION,
    promptVersion: PROMPT_VERSION,
  });
  await recordEvent(admin, { submissionId, jobId: job.id, eventType: "parse_started", message: "parse job queued" });
  return job;
}

/** Parse job runner (Task 17): queued → running → draft graph → succeeded. */
export async function runParseJob(
  admin: SupabaseClient<Database> | null,
  jobId: string,
): Promise<{ job: IngestionJob; submissionStatus: SubmissionStatus }> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const job = await getJob(admin, jobId);
  if (!job) throw new Error(`job ${jobId} not found`);
  if (job.status === "succeeded") return { job, submissionStatus: "parsed" };
  if (job.attemptCount >= job.maxAttempts) {
    throw new IngestionError("unknown", `job ${jobId} exhausted its ${job.maxAttempts} attempts`);
  }

  const submission = await getSubmission(admin, job.submissionId);
  if (!submission) throw new Error(`submission ${job.submissionId} not found`);

  const attempt = job.attemptCount + 1;
  const startedAt = new Date().toISOString();
  await updateJob(admin, job.id, { status: "running", attemptCount: attempt, startedAt, errorCode: null, errorMessage: null });
  await transitionSubmission(admin, submission.id, "processing");

  let usage: ParserUsage = { inputTokens: null, outputTokens: null, estimatedCost: null };
  try {
    // Moderate before parsing: redacted text goes to the provider so contact
    // info is not shipped to an external LLM (Tasks 40/41).
    const redactedText = redactContactInfo(submission.rawText);
    const parser = createParser();
    const parsed = await parser.parseWithUsage({
      rawText: redactedText,
      hints: {
        companyHint: submission.companyHint,
        positionHint: submission.positionHint,
        yearHint: submission.yearHint,
        seasonHint: submission.seasonHint,
        locationHint: submission.locationHint,
      },
      language: submission.language,
    });
    usage = parsed.usage;

    // Replace any previous (failed/partial) draft graph, then persist anew.
    // The submission is the unique key of the draft, so retry is idempotent.
    const previous = await getDraftBySubmission(admin, submission.id);
    if (previous) {
      await archiveDraft(admin, previous.id);
      // The draft row is unique per submission; reset it in place rather than
      // inserting a duplicate.
      await resetDraft(admin, previous.id, parsed, parser, usage);
      await persistDraftChildren(admin, previous.id, parsed);
      await finalizeSuccessfulParse(admin, submission, previous.id, job.id);
      const refreshed = await getJob(admin, job.id);
      return { job: refreshed ?? job, submissionStatus: "parsed" };
    }

    const draft = await insertDraft(admin, {
      submissionId: submission.id,
      companyName: parsed.companyName,
      positionTitle: parsed.positionTitle,
      year: parsed.year,
      season: parsed.season,
      location: parsed.location,
      employmentType: parsed.employmentType,
      experienceLevel: parsed.experienceLevel,
      summary: parsed.summary,
      confidence: parsed.confidence,
      parserVersion: PARSER_VERSION,
      promptVersion: PROMPT_VERSION,
      model: parser.model,
      provider: parser.provider,
      interviewType: classifyInterviewType(parsed),
    });
    await persistDraftChildren(admin, draft.id, parsed);
    await finalizeSuccessfulParse(admin, submission, draft.id, job.id);

    const refreshed = await getJob(admin, job.id);
    return { job: refreshed ?? job, submissionStatus: "parsed" };
  } catch (error) {
    const ingestionError = errorFromUnknown(error);
    const finishedAt = new Date().toISOString();
    await updateJob(admin, job.id, {
      status: "failed",
      errorCode: ingestionError.code,
      errorMessage: ingestionError.message.slice(0, 500),
      finishedAt,
    });
    await recordEvent(admin, {
      submissionId: submission.id,
      jobId: job.id,
      eventType: "parse_failed",
      message: `${ingestionError.code}: ${ingestionError.message.slice(0, 200)}`,
    });
    await transitionSubmission(admin, submission.id, "failed");
    throw ingestionError;
  }
}

/** Retry failed jobs safely (Task 18): attempts enforced, same submission. */
export async function retryParseJob(
  admin: SupabaseClient<Database> | null,
  jobId: string,
): Promise<{ job: IngestionJob; submissionStatus: SubmissionStatus }> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const job = await getJob(admin, jobId);
  if (!job) throw new Error(`job ${jobId} not found`);
  if (job.status === "running") throw new IngestionError("unknown", "job is already running");
  if (job.attemptCount >= job.maxAttempts) {
    throw new IngestionError("unknown", `job reached its maximum of ${job.maxAttempts} attempts`);
  }
  await recordEvent(admin, { submissionId: job.submissionId, jobId: job.id, eventType: "parse_retry", message: "manual retry" });
  return runParseJob(admin, jobId);
}

/** Ingestion failure recovery actions (Task 43). */
export async function resetToReview(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  await transitionSubmission(admin, submissionId, "needs_review");
  await recordEvent(admin, { submissionId, eventType: "review_opened", message: "reset to review" });
}

// ---------------------------------------------------------------------------
// Review decisions (Task 34)
// ---------------------------------------------------------------------------

export async function approveDraft(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
  reviewerId: string,
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const draft = await getDraftBySubmission(admin, submissionId);
  if (!draft) throw new Error("No parsed draft exists for this submission.");
  await transitionSubmission(admin, submissionId, "approved");
  if (draft.status === "parsed") {
    await updateDraftStatus(admin, draft.id, "approved");
  }
  const task = await createReviewTask(admin, { submissionId, draftId: draft.id });
  await updateReviewTask(admin, task.id, { status: "in_review" });
  await recordEvent(admin, { submissionId, eventType: "draft_approved", message: "approved by reviewer", metadata: { reviewerId } });
}

export async function rejectSubmission(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
  reviewerId: string,
  reason: RejectionReason,
  note?: string,
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const submission = await getSubmission(admin, submissionId);
  if (!submission) throw new Error("Submission not found.");
  await transitionSubmission(admin, submission.id, "rejected");
  const internalNote = `reason: ${reason}${note ? ` — ${note}` : ""}`;
  await updateSubmissionReview(admin, submissionId, { reviewNotes: internalNote });
  const task = await createReviewTask(admin, { submissionId });
  await updateReviewTask(admin, task.id, { status: "rejected", completedAt: new Date().toISOString(), reviewNotes: internalNote });
  await recordEvent(admin, {
    submissionId,
    eventType: "submission_rejected",
    message: "rejected by reviewer",
    metadata: { reviewerId, reason },
  });
}

export async function blockSubmission(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
  reviewerId: string,
  note?: string,
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const task = await createReviewTask(admin, { submissionId });
  await updateReviewTask(admin, task.id, { status: "blocked", reviewNotes: note ?? null });
  await recordEvent(admin, { submissionId, eventType: "review_blocked", message: note ?? "blocked", metadata: { reviewerId } });
}

export async function returnToReview(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
  reviewerId: string,
  note?: string,
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  await transitionSubmission(admin, submissionId, "needs_review");
  const task = await createReviewTask(admin, { submissionId });
  await updateReviewTask(admin, task.id, { status: "open", completedAt: null, reviewNotes: note ?? null });
  await recordEvent(admin, { submissionId, eventType: "review_opened", message: note ?? "returned to review", metadata: { reviewerId } });
}

// ---------------------------------------------------------------------------
// Publishing (Tasks 35–38)
// ---------------------------------------------------------------------------

export interface PublishOutcome {
  interviewId: string;
  slug: string;
  alreadyPublished: boolean;
}

export async function publishDraft(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
  reviewerId: string,
  overrides: { companyId?: string | null; positionId?: string | null } = {},
): Promise<PublishOutcome> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  await recordEvent(admin, { submissionId, eventType: "publish_started", message: "publish requested", metadata: { reviewerId } });

  const draft = await getDraftBySubmission(admin, submissionId);
  if (!draft) throw new Error("No parsed draft exists for this submission.");
  if (draft.status !== "approved") {
    throw new IngestionError("unknown", "Draft must be approved before publishing.");
  }

  // Idempotency (Task 36): already published → return existing interview.
  if (draft.publishedInterviewId) {
    const existing = await admin
      .from("interviews")
      .select("slug")
      .eq("id", draft.publishedInterviewId)
      .maybeSingle();
    return {
      interviewId: draft.publishedInterviewId,
      slug: existing.data?.slug ?? "",
      alreadyPublished: true,
    };
  }

  // Company resolution: reviewer-chosen override wins; else match from draft.
  const { data: companies } = await admin.from("companies").select("*");
  const companyMatch = matchCompany(draft.companyName, companies ?? []);
  const companyId = overrides.companyId ?? companyMatch.companyId;
  if (!companyId) {
    throw new IngestionError("unknown", "Publish requires a resolved company. Resolve the company first.");
  }

  // Publish validation gate (Task 77).
  const questions = await listQuestionDrafts(admin, draft.id);
  const accepted = questions.filter((question) =>
    ["accepted", "edited", "new_canonical"].includes(question.reviewStatus),
  );
  if (accepted.length === 0) {
    throw new IngestionError("unknown", "At least one accepted question is required to publish.");
  }
  if (draft.year !== null && (draft.year < 1990 || draft.year > 2100)) {
    throw new IngestionError("unknown", "Draft year is outside the valid range.");
  }

  const slug = await generateInterviewSlug(admin, draft.companyName ?? "company", draft.positionTitle ?? "interview");
  const { data: interviewId, error } = await admin.rpc("publish_interview_draft", {
    p_draft_id: draft.id,
    p_company_id: companyId,
    p_position_id: overrides.positionId ?? null,
    p_slug: slug,
  });
  if (error) throw new Error(`publish failed: ${error.message}`);

  // Task 13: refresh the company's stats cache after publish (the DB trigger
  // from migration 0023 also covers this; both paths are idempotent).
  const { refreshCompanyStats } = await import("@/lib/companies/refresh");
  await refreshCompanyStats(companyId).catch(() => undefined);

  const { data: interview } = await admin.from("interviews").select("slug").eq("id", interviewId).maybeSingle();
  return { interviewId, slug: interview?.slug ?? slug, alreadyPublished: false };
}

// ---------------------------------------------------------------------------
// Canonicalization review helpers (Tasks 23, 24, 25, 34)
// ---------------------------------------------------------------------------

export async function acceptCanonicalMatch(
  admin: SupabaseClient<Database> | null,
  questionDraftId: string,
  questionId: string,
  score: number | null,
  reviewerId: string,
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  await updateQuestionDraft(admin, questionDraftId, {
    candidateQuestionId: questionId,
    matchScore: score,
    reviewStatus: "accepted",
  });
  await recordEvent(admin, {
    submissionId: await submissionIdForQuestion(admin, questionDraftId),
    eventType: "question_accepted",
    message: "canonical match accepted",
    metadata: { reviewerId, questionDraftId, questionId },
  });
}

export async function createNewCanonical(
  admin: SupabaseClient<Database> | null,
  questionDraftId: string,
  canonical: { title: string; slug?: string; questionType: string; difficulty?: string; summary?: string; topicIds?: string[] },
  reviewerId: string,
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  await updateQuestionDraft(admin, questionDraftId, {
    candidateQuestionId: null,
    newCanonical: canonical,
    reviewStatus: "new_canonical",
  });
  await recordEvent(admin, {
    submissionId: await submissionIdForQuestion(admin, questionDraftId),
    eventType: "question_new_canonical",
    message: "new canonical question drafted",
    metadata: { reviewerId, questionDraftId },
  });
}

export async function rejectQuestion(
  admin: SupabaseClient<Database> | null,
  questionDraftId: string,
  reviewerId: string,
  note?: string,
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  await updateQuestionDraft(admin, questionDraftId, { reviewStatus: "rejected", reviewNotes: note ?? null });
  await recordEvent(admin, {
    submissionId: await submissionIdForQuestion(admin, questionDraftId),
    eventType: "question_rejected",
    message: note ?? "question rejected",
    metadata: { reviewerId, questionDraftId },
  });
}

export async function setQuestionSuggestions(
  admin: SupabaseClient<Database> | null,
  questionDraftId: string,
  suggestions: TopicSuggestion[],
): Promise<void> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  await updateQuestionDraft(admin, questionDraftId, { topicSuggestions: suggestions });
}

/**
 * Canonical candidate retrieval for the review UI (Tasks 21–23): rank the
 * published canonical questions against one occurrence, deterministically.
 * Returns top 3–5 candidates; weak suggestions are filtered out.
 */
export async function getCanonicalCandidates(
  admin: SupabaseClient<Database> | null,
  questionDraft: { normalizedText: string | null; originalWording: string; questionType: string | null; topicSuggestions: TopicSuggestion[] },
): Promise<Awaited<ReturnType<typeof rankCanonicalCandidates>>> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const [{ data: canonicalQuestions }, { data: topicLinks }] = await Promise.all([
    admin
      .from("questions")
      .select("id, title, slug, question_type")
      .eq("is_published", true)
      .limit(5000),
    admin.from("question_topics").select("question_id, topic_id").limit(20000),
  ]);

  const topicsByQuestion = new Map<string, string[]>();
  for (const link of topicLinks ?? []) {
    const list = topicsByQuestion.get(link.question_id) ?? [];
    list.push(link.topic_id);
    topicsByQuestion.set(link.question_id, list);
  }

  const candidates = (canonicalQuestions ?? []).map((question) => ({
    questionId: question.id,
    title: question.title,
    slug: question.slug,
    questionType: question.question_type,
    topicIds: topicsByQuestion.get(question.id) ?? [],
  }));

  return rankCanonicalCandidates(
    {
      normalizedText: questionDraft.normalizedText ?? normalizeQuestionText(questionDraft.originalWording),
      questionType: questionDraft.questionType,
      topicHints: questionDraft.topicSuggestions.map((suggestion) => suggestion.topicId),
    },
    candidates,
    { candidateTopicIds: topicsByQuestion },
  );
}

// ---------------------------------------------------------------------------
// Duplicate detection & enrichment (Tasks 27, 46)
// ---------------------------------------------------------------------------

/**
 * Flag duplicates for a parsed draft: compare against published interviews and
 * earlier submissions, store the score on the review task, and record the
 * candidates as events for the reviewer.
 */
export async function detectDuplicatesForDraft(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
): Promise<{ score: number; candidates: ReturnType<typeof findDuplicateInterviews> }> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const submission = await getSubmission(admin, submissionId);
  const draft = await getDraftBySubmission(admin, submissionId);
  if (!submission || !draft) return { score: 0, candidates: [] };

  const questions = await listQuestionDrafts(admin, draft.id);
  const questionTexts = questions.map((question) => question.originalWording);

  const [published, earlier] = await Promise.all([
    admin
      .from("interviews")
      .select("id, slug, title, company_id, year, source_url, source_submission_id")
      .eq("status", "published")
      .limit(200),
    admin
      .from("interview_submissions")
      .select("id, raw_text, company_hint, position_hint, year_hint, source_url")
      .neq("id", submissionId)
      .eq("submission_type", "user_text")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const { data: companyRows } = await admin.from("companies").select("id, name, slug");
  const companyById = new Map((companyRows ?? []).map((company) => [company.id, company]));

  const rows: DuplicateDetectionRow[] = [];
  for (const interview of published.data ?? []) {
    const company = interview.company_id ? companyById.get(interview.company_id) : undefined;
    rows.push({
      interviewId: interview.id,
      submissionId: null,
      slug: interview.slug,
      title: interview.title,
      companySlug: company?.slug ?? null,
      positionTitle: null,
      year: interview.year,
      season: null,
      sourceUrl: interview.source_url,
      rawText: null,
      questionTexts: [],
    });
  }
  for (const earlierSubmission of earlier.data ?? []) {
    rows.push({
      interviewId: null,
      submissionId: earlierSubmission.id,
      slug: null,
      title: null,
      companySlug: null,
      positionTitle: earlierSubmission.position_hint,
      year: earlierSubmission.year_hint,
      season: null,
      sourceUrl: earlierSubmission.source_url,
      rawText: earlierSubmission.raw_text,
      questionTexts: [],
    });
  }

  const candidates = findDuplicateInterviews(
    {
      companySlug: null,
      positionTitle: draft.positionTitle ?? submission.positionHint,
      year: draft.year ?? submission.yearHint,
      season: draft.season,
      sourceUrl: submission.sourceUrl,
      rawText: submission.rawText,
      questionTexts,
    },
    rows,
  );

  const topScore = candidates[0]?.score ?? 0;
  const task = await createReviewTask(admin, { submissionId, draftId: draft.id, duplicateScore: topScore });
  await updateReviewTask(admin, task.id, { duplicateScore: topScore });
  if (candidates.length > 0) {
    await recordEvent(admin, {
      submissionId,
      eventType: "duplicate_flagged",
      message: `${candidates.length} duplicate candidate(s)`,
      metadata: { topScore, candidates: candidates.slice(0, 3) },
    });
  }
  return { score: topScore, candidates };
}

/** Canonicalization review metrics (Task 46): queryable, no dashboard. */
export async function getCanonicalizationMetrics(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
): Promise<{
  questionCount: number;
  autoMatchCandidateCount: number;
  highConfidenceMatches: number;
  manualNewCanonicals: number;
  rejectedQuestions: number;
  unresolvedQuestions: number;
}> {
  if (!admin) throw new Error("The ingestion service is not configured.");
  const draft = await getDraftBySubmission(admin, submissionId);
  if (!draft) {
    return {
      questionCount: 0,
      autoMatchCandidateCount: 0,
      highConfidenceMatches: 0,
      manualNewCanonicals: 0,
      rejectedQuestions: 0,
      unresolvedQuestions: 0,
    };
  }
  const questions = await listQuestionDrafts(admin, draft.id);
  return {
    questionCount: questions.length,
    autoMatchCandidateCount: questions.filter((question) => question.candidateQuestionId).length,
    highConfidenceMatches: questions.filter((question) => (question.matchScore ?? 0) >= 0.9).length,
    manualNewCanonicals: questions.filter((question) => question.reviewStatus === "new_canonical").length,
    rejectedQuestions: questions.filter((question) => question.reviewStatus === "rejected").length,
    unresolvedQuestions: questions.filter(
      (question) => question.reviewStatus === "pending" || (!question.candidateQuestionId && question.reviewStatus !== "rejected"),
    ).length,
  };
}

/** Ingestion event timeline (Task 7): admin inspection. */
export async function getSubmissionTimeline(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
): Promise<Awaited<ReturnType<typeof listEvents>>> {
  return listEvents(admin, submissionId);
}

/** Job history for a submission (Task 6: auditable). */
export async function getSubmissionJobs(
  admin: SupabaseClient<Database> | null,
  submissionId: string,
): Promise<IngestionJob[]> {
  return listJobsForSubmission(admin, submissionId);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function persistDraftChildren(
  admin: SupabaseClient<Database>,
  draftId: string,
  parsed: ParsedInterviewPayload,
): Promise<void> {
  const roundIdByNumber = new Map<number, string>();
  for (const [index, round] of parsed.rounds.entries()) {
    const inserted = await insertRoundDraft(admin, {
      draftId,
      roundNumber: round.roundNumber,
      title: round.title,
      roundType: round.roundType,
      durationMinutes: round.durationMinutes,
      interviewerRole: round.interviewerRole,
      summary: round.summary,
      confidence: round.confidence,
      orderIndex: index,
    });
    if (round.roundNumber !== null) roundIdByNumber.set(round.roundNumber, inserted.id);
  }

  for (const question of parsed.questions) {
    await insertQuestionDraft(admin, {
      draftId,
      roundDraftId: question.roundNumber !== null ? (roundIdByNumber.get(question.roundNumber) ?? null) : null,
      originalWording: question.originalWording,
      normalizedText: question.normalizedText ?? normalizeQuestionText(question.originalWording),
      questionType: question.questionType,
      difficulty: question.difficulty,
      matchConfidence: null,
      matchScore: null,
      topicSuggestions: [],
      orderIndex: question.orderIndex,
    });
  }
}

async function finalizeSuccessfulParse(
  admin: SupabaseClient<Database>,
  submission: InterviewSubmission,
  draftId: string,
  jobId: string,
): Promise<void> {
  const finishedAt = new Date().toISOString();
  await updateJob(admin, jobId, { status: "succeeded", finishedAt, errorCode: null, errorMessage: null });
  await recordEvent(admin, { submissionId: submission.id, jobId, eventType: "parse_succeeded", message: "draft persisted" });
  // Moderation flags are stored privately on the submission (Task 40).
  const flags = moderationFlags(submission.rawText);
  await updateSubmissionReview(admin, submission.id, { moderationFlags: flags, processedAt: finishedAt });
  await transitionSubmission(admin, submission.id, "parsed");
  await createReviewTask(admin, { submissionId: submission.id, draftId });
}

async function resetDraft(
  admin: SupabaseClient<Database>,
  draftId: string,
  parsed: ParsedInterviewPayload,
  parser: { model: string; provider: string },
  usage: ParserUsage,
): Promise<void> {
  const { error } = await admin
    .from("interview_drafts")
    .update({
      company_name: parsed.companyName,
      position_title: parsed.positionTitle,
      year: parsed.year,
      season: parsed.season,
      location: parsed.location,
      employment_type: parsed.employmentType,
      experience_level: parsed.experienceLevel,
      summary: parsed.summary,
      confidence: parsed.confidence,
      interview_type: classifyInterviewType(parsed),
      model: parser.model,
      provider: parser.provider,
      status: "parsed" as const,
      published_interview_id: null,
    })
    .eq("id", draftId);
  if (error) throw new Error(`draft reset failed: ${error.message}`);
  void usage;
}

async function updateDraftStatus(
  admin: SupabaseClient<Database>,
  draftId: string,
  status: "parsed" | "approved" | "rejected" | "published" | "archived",
): Promise<void> {
  const { error } = await admin
    .from("interview_drafts")
    .update({ status })
    .eq("id", draftId);
  if (error) throw new Error(`draft status update failed: ${error.message}`);
}

async function transitionSubmission(
  admin: SupabaseClient<Database>,
  submissionId: string,
  next: SubmissionStatus,
): Promise<void> {
  const submission = await getSubmission(admin, submissionId);
  if (!submission) throw new Error(`submission ${submissionId} not found`);
  if (submission.status === next) return;
  if (!canTransition(submission.status, next)) {
    throw new Error(`invalid submission transition ${submission.status} → ${next}`);
  }
  await updateSubmissionStatus(admin, submissionId, next);
}

async function submissionIdForQuestion(admin: SupabaseClient<Database>, questionDraftId: string): Promise<string> {
  const { data: question, error: questionError } = await admin
    .from("interview_question_drafts")
    .select("draft_id")
    .eq("id", questionDraftId)
    .maybeSingle();
  if (questionError || !question) throw new Error(`question draft ${questionDraftId} not found`);
  const { data: draft, error: draftError } = await admin
    .from("interview_drafts")
    .select("submission_id")
    .eq("id", question.draft_id)
    .maybeSingle();
  if (draftError || !draft) throw new Error(`draft ${question.draft_id} not found`);
  return draft.submission_id;
}

async function generateInterviewSlug(
  admin: SupabaseClient<Database>,
  company: string,
  position: string,
): Promise<string> {
  const base = slugify(`${company} ${position}`);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data } = await admin.from("interviews").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Task 61: interview emphasis from structured question-type counts. */
export function classifyInterviewType(parsed: ParsedInterviewPayload): string {
  const counts = { coding: 0, research: 0, behavioral: 0, other: 0 };
  for (const question of parsed.questions) {
    if (question.questionType === "coding") counts.coding += 1;
    else if (question.questionType === "research") counts.research += 1;
    else if (question.questionType === "behavioral") counts.behavioral += 1;
    else counts.other += 1;
  }
  const total = Math.max(1, parsed.questions.length);
  if (counts.coding / total >= 0.5) return "coding-heavy";
  if (counts.research / total >= 0.5) return "research-heavy";
  if (counts.behavioral / total >= 0.5) return "behavioral-heavy";
  if (counts.coding > 0 && counts.research > 0) return "mixed";
  return "unknown";
}

export { detectCodingSignal };
