/**
 * Week 6 ingestion domain types.
 *
 * The pipeline distinguishes, and never collapses:
 *
 *   raw submission → parsed draft → reviewed structured interview → published interview
 *
 * Draft types are deliberately distinct from the published `Interview` types
 * in `./coding`-style domain modules. Parser payloads are serializable and
 * provider raw responses never leak into UI types.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type SubmissionType = "user_text" | "public_source" | "editorial" | "development";

export type SubmissionStatus =
  | "submitted"
  | "processing"
  | "parsed"
  | "needs_review"
  | "approved"
  | "rejected"
  | "failed"
  | "published";

export type IngestionJobType =
  | "parse_interview"
  | "canonicalize_questions"
  | "classify_topics"
  | "duplicate_check";

export type IngestionJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type IngestionErrorCode =
  | "rate_limited"
  | "timeout"
  | "invalid_json"
  | "empty_response"
  | "provider_outage"
  | "schema_mismatch"
  | "size_limit"
  | "unknown";

/** Retryable codes can be retried automatically/manually; the rest need fixes. */
export const RETRYABLE_ERROR_CODES: readonly IngestionErrorCode[] = [
  "rate_limited",
  "timeout",
  "provider_outage",
];

export type DraftStatus = "parsed" | "approved" | "rejected" | "published" | "archived";

export type QuestionReviewStatus = "pending" | "accepted" | "edited" | "rejected" | "new_canonical";

export type ReviewTaskStatus = "open" | "in_review" | "approved" | "rejected" | "blocked";

export type ReviewerRole = "user" | "reviewer" | "admin";

export type RejectionReason =
  | "spam"
  | "duplicate"
  | "insufficient_detail"
  | "privacy_concern"
  | "unverifiable"
  | "off_topic"
  | "other";

export type ModerationFlagType =
  | "email"
  | "phone"
  | "personal_name"
  | "account_id"
  | "spam"
  | "too_short"
  | "url";

export interface ModerationFlag {
  type: ModerationFlagType;
  /** Count of matches; never the matched content itself (privacy, Task 40). */
  count: number;
}

// ---------------------------------------------------------------------------
// Rows (database mirror of the Week 6 tables)
// ---------------------------------------------------------------------------

export interface InterviewSubmission {
  id: string;
  userId: string | null;
  submissionType: SubmissionType;
  rawText: string;
  sourceUrl: string | null;
  companyHint: string | null;
  positionHint: string | null;
  yearHint: number | null;
  seasonHint: string | null;
  locationHint: string | null;
  language: string;
  status: SubmissionStatus;
  moderationFlags: ModerationFlag[];
  reviewNotes: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewDraft {
  id: string;
  submissionId: string;
  companyName: string | null;
  positionTitle: string | null;
  year: number | null;
  season: string | null;
  location: string | null;
  employmentType: "internship" | "full_time" | "contract" | "unknown";
  experienceLevel: "intern" | "new_grad" | "experienced" | "unknown";
  summary: string | null;
  confidence: number;
  parserVersion: string;
  promptVersion: string | null;
  model: string | null;
  provider: string | null;
  interviewType: string;
  status: DraftStatus;
  publishedInterviewId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewRoundDraft {
  id: string;
  draftId: string;
  roundNumber: number | null;
  title: string | null;
  roundType:
    | "recruiter"
    | "technical"
    | "coding"
    | "research"
    | "manager"
    | "behavioral"
    | "mixed"
    | "unknown";
  durationMinutes: number | null;
  interviewerRole: string | null;
  summary: string | null;
  confidence: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicSuggestion {
  topicId: string;
  topicName: string;
  confidence: number;
  source: "keyword_rule" | "canonical_match" | "llm_classifier";
}

export interface NewCanonicalDraft {
  title: string;
  slug?: string;
  questionType: "knowledge" | "coding" | "system_design" | "research" | "behavioral";
  difficulty?: "easy" | "medium" | "hard";
  summary?: string;
  topicIds?: string[];
}

export interface InterviewQuestionDraft {
  id: string;
  draftId: string;
  roundDraftId: string | null;
  originalWording: string;
  normalizedText: string | null;
  questionType: "knowledge" | "coding" | "system_design" | "research" | "behavioral" | null;
  difficulty: "easy" | "medium" | "hard" | "unknown" | null;
  candidateQuestionId: string | null;
  candidateCodingProblemId: string | null;
  matchConfidence: number | null;
  matchScore: number | null;
  topicSuggestions: TopicSuggestion[];
  newCanonical: NewCanonicalDraft | null;
  orderIndex: number;
  reviewStatus: QuestionReviewStatus;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngestionJob {
  id: string;
  submissionId: string;
  jobType: IngestionJobType;
  status: IngestionJobStatus;
  attemptCount: number;
  maxAttempts: number;
  provider: string | null;
  model: string | null;
  parserVersion: string | null;
  promptVersion: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCost: number | null;
  errorCode: IngestionErrorCode | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngestionEvent {
  id: string;
  submissionId: string;
  jobId: string | null;
  eventType: string;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ReviewTask {
  id: string;
  submissionId: string;
  draftId: string | null;
  status: ReviewTaskStatus;
  assignedTo: string | null;
  priority: number;
  duplicateScore: number | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// Parser payloads (strict, serializable, validated by Zod at the boundary)
// ---------------------------------------------------------------------------

export interface ParsedQuestionPayload {
  originalWording: string;
  normalizedText: string | null;
  questionType: "knowledge" | "coding" | "system_design" | "research" | "behavioral" | null;
  roundNumber: number | null;
  orderIndex: number;
  difficulty: "easy" | "medium" | "hard" | null;
  topicHints: string[];
}

export interface ParsedRoundPayload {
  roundNumber: number | null;
  title: string | null;
  roundType:
    | "recruiter"
    | "technical"
    | "coding"
    | "research"
    | "manager"
    | "behavioral"
    | "mixed"
    | "unknown";
  durationMinutes: number | null;
  interviewerRole: string | null;
  summary: string | null;
  confidence: number;
}

export interface ParsedInterviewPayload {
  companyName: string | null;
  positionTitle: string | null;
  year: number | null;
  season: string | null;
  location: string | null;
  employmentType: "internship" | "full_time" | "contract" | "unknown";
  experienceLevel: "intern" | "new_grad" | "experienced" | "unknown";
  summary: string | null;
  confidence: number;
  rounds: ParsedRoundPayload[];
  questions: ParsedQuestionPayload[];
}

export interface ParseInterviewInput {
  rawText: string;
  hints: {
    companyHint: string | null;
    positionHint: string | null;
    yearHint: number | null;
    seasonHint: string | null;
    locationHint: string | null;
  };
  language: string;
}

// ---------------------------------------------------------------------------
// Canonicalization
// ---------------------------------------------------------------------------

export interface CanonicalMatchCandidate {
  questionId: string;
  title: string;
  slug: string;
  questionType: string | null;
  score: number;
  textSimilarity: number;
  keywordOverlap: number;
  topicOverlap: number;
  questionTypeMatch: number;
}

export interface InterviewDuplicateCandidate {
  interviewId: string | null;
  submissionId: string | null;
  slug: string | null;
  title: string | null;
  score: number;
  reasons: string[];
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export type ReviewDecision =
  | { action: "approve" }
  | { action: "reject"; reason: RejectionReason; note?: string }
  | { action: "block"; note?: string }
  | { action: "return_to_review"; note?: string };

export interface CanonicalizationMetrics {
  questionCount: number;
  autoMatchCandidateCount: number;
  highConfidenceMatches: number;
  manualNewCanonicals: number;
  rejectedQuestions: number;
  unresolvedQuestions: number;
}
