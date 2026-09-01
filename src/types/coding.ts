import type {
  CodingComparisonMode,
  CodingDifficulty,
  CodingEvaluationMode,
  CodingFramework,
  CodingSubmissionStatus,
  CodingTestGroup,
} from "@/types/database";
import type { EvaluationMetadata, EvaluationSummaryPayload, PublicMLCaseResult } from "@/types/ml-judge";

export type CodingProblemStatus = "solved" | "attempted" | "unsolved";
export type CodingSort = "recommended" | "difficulty" | "acceptance" | "newest";

export interface CodingTopicRef {
  name: string;
  slug: string;
}

/**
 * How a problem is judged. Mirrors `coding_problems.evaluation_mode`, but is
 * a public, read-only projection: raw `evaluator_config` never reaches the
 * browser (Week 5 Task 19 / Task 2).
 */
export type PublicEvaluationMetadata = EvaluationMetadata;

export interface CodingExample {
  id: string;
  name: string;
  inputData: string;
  expectedOutput: string;
  weight: number;
  orderIndex: number;
  /** Function/class mode: the structured call this case exercises. */
  structured: StructuredExamplePayload | null;
}

/**
 * Visible structured case for function/class problems. Only safe, authored
 * display fields are exposed: the runner payload itself stays server-side
 * until Run executes it (Week 5 Task 23).
 */
export interface StructuredExamplePayload {
  testType: string;
  testGroup: CodingTestGroup;
  /** Rendered call, e.g. `softmax([1.0, 2.0, 3.0])`. */
  call: string;
  /** Rendered expected result, or a category label for non-value checks. */
  expected: string;
  note: string | null;
}

export interface CodingProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: CodingDifficulty;
  category: string | null;
  topics: CodingTopicRef[];
  language: "python";
  isFeatured: boolean;
  acceptanceRate: number | null;
  userStatus: CodingProblemStatus | null;
  evaluationMode: CodingEvaluationMode;
  framework: CodingFramework | null;
}

/** Group rollup persisted on a submission, e.g. `gradient 2 / 3`. */
export interface EvaluationGroupSummary {
  group: CodingTestGroup;
  passed: number;
  total: number;
  informational: boolean;
}

export interface CodingProblemDetail extends CodingProblemSummary {
  description: string;
  constraints: string | null;
  starterCode: string;
  functionName: string | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  comparisonMode: CodingComparisonMode;
  tolerance: number;
  examples: CodingExample[];
  evaluation: PublicEvaluationMetadata;
}

export interface CodingTestCase extends CodingExample {
  isHidden: boolean;
}

export interface CodingSubmission {
  id: string;
  userId: string;
  problemId: string;
  problemSlug?: string;
  problemTitle?: string;
  language: "python";
  sourceCode?: string;
  status: CodingSubmissionStatus;
  score: number | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  createdAt: string;
  completedAt: string | null;
  /** Week 5 Task 25: redacted structured breakdown, rendered without rerun. */
  evaluationSummary: RedactedEvaluationSummary | null;
}

export interface CodingSubmissionCaseResult {
  id?: string;
  name?: string;
  status: CodingSubmissionStatus;
  runtimeMs: number | null;
  memoryKb: number | null;
  stdout: string | null;
  stderr: string | null;
}

export interface CodingSubmissionResult {
  submission: CodingSubmission;
  cases: CodingSubmissionCaseResult[];
  message?: string;
}

export interface CodingFilters {
  query?: string;
  difficulty?: CodingDifficulty;
  category?: string;
  topic?: string;
  status?: CodingProblemStatus;
  /** company slug (Week 7): canonical coding evidence from published interviews */
  company?: string;
  /** position slug, validated against the company (Week 7, Task 73) */
  position?: string;
}

export interface CodingFilterOptions {
  categories: string[];
  topics: CodingTopicRef[];
  difficulties: CodingDifficulty[];
}

export interface PaginatedCodingProblems {
  items: CodingProblemSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type JudgeStatus = CodingSubmissionStatus;

/** Server-side request; expected output never comes from the browser. */
export interface JudgeRequest {
  sourceCode: string;
  language: "python";
  stdin: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  comparisonMode: CodingComparisonMode;
  tolerance: number;
}

export interface JudgeSubmission {
  token: string;
  status: JudgeStatus;
}

export type JudgeResult = {
  status: JudgeStatus;
  stdout: string | null;
  stderr: string | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  message?: string;
};

// ---------------------------------------------------------------------------
// Week 5 — collections, progress, analytics
// ---------------------------------------------------------------------------

export interface CodingCollectionSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  orderIndex: number;
  problemCount: number;
  solvedCount: number;
}

export interface CodingCollectionDetail extends CodingCollectionSummary {
  problems: Array<CodingProblemSummary & { orderIndex: number }>;
}

/**
 * Persisted (already redacted) evaluation summary. Hidden cases keep
 * pass/fail only; no hidden inputs, expected tensors or gradients are stored
 * here (Week 5 Task 25).
 */
export interface RedactedEvaluationSummary {
  mode: CodingEvaluationMode;
  groups: EvaluationGroupSummary[];
  entrypointError: { category: string; message: string } | null;
  framework: CodingFramework | null;
  cases: PublicMLCaseResult[];
}

export interface CodingProgressCounts {
  solved: number;
  attempted: number;
  unsolved: number;
  total: number;
}

export interface TopicProgress extends CodingProgressCounts {
  topic: CodingTopicRef;
}

export interface CollectionProgress extends CodingProgressCounts {
  collection: { name: string; slug: string };
}

export interface CodingOverview {
  counts: CodingProgressCounts;
  byDifficulty: Record<CodingDifficulty, CodingProgressCounts>;
  topics: TopicProgress[];
  collections: CollectionProgress[];
  recent: CodingSubmission[];
}

/** Week 5 Task 33: per-problem analytics, no dashboard required. */
export interface CodingProblemAnalytics {
  problemId: string;
  slug: string;
  title: string;
  difficulty: CodingDifficulty;
  submissionCount: number;
  uniqueAttemptUsers: number;
  acceptedUsers: number;
  acceptanceRate: number | null;
  medianRuntimeMs: number | null;
  medianAttemptsToSolve: number | null;
  lowSample: boolean;
}

/** Build the jsonb persisted on coding_submissions.evaluation_summary. */
export type EvaluationSummaryInput = EvaluationSummaryPayload;
