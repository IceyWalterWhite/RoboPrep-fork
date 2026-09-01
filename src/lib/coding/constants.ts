import type {
  CodingDifficulty,
  CodingEvaluationMode,
  CodingFramework,
  CodingResourceProfile,
  CodingTestGroup,
} from "@/types/database";
import type { CodingProblemStatus, CodingSort } from "@/types/coding";

export const CODING_PAGE_SIZE = 20;
export const CODING_MAX_PAGE = 500;

export const CODING_DIFFICULTY_LABELS: Record<CodingDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const CODING_SORT_LABELS: Record<CodingSort, string> = {
  recommended: "Recommended",
  difficulty: "Difficulty",
  acceptance: "Acceptance rate",
  newest: "Newest",
};

export const CODING_STATUS_LABELS: Record<CodingProblemStatus, string> = {
  solved: "Solved",
  attempted: "Attempted",
  unsolved: "Unsolved",
};

export const JUDGE_STATUS_LABELS = {
  queued: "Queued",
  running: "Running",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  time_limit_exceeded: "Time Limit Exceeded",
  memory_limit_exceeded: "Memory Limit Exceeded",
  compile_error: "Compile Error",
  internal_error: "Judge unavailable",
} as const;

export const CODING_CATEGORIES = [
  "python",
  "transformer",
  "rl",
  "diffusion",
  "robotics",
  "robot_learning",
  "algorithms",
] as const;

// ---------------------------------------------------------------------------
// Week 5 — structured evaluation labels
// ---------------------------------------------------------------------------

export const CODING_EVALUATION_MODE_LABELS: Record<CodingEvaluationMode, string> = {
  program: "Program",
  function: "Function",
  class: "Class",
};

export const CODING_FRAMEWORK_LABELS: Record<CodingFramework, string> = {
  python: "Python",
  numpy: "NumPy",
  pytorch: "PyTorch",
};

export const CODING_RESOURCE_PROFILE_LABELS: Record<CodingResourceProfile, string> = {
  standard_python: "Standard Python",
  ml_cpu_small: "ML CPU (small)",
  ml_cpu_medium: "ML CPU (medium)",
};

/**
 * Group labels shown in result panels. Order matches the aggregation order in
 * `lib/judge/ml-result.ts` so panels render deterministically.
 */
export const CODING_TEST_GROUP_LABELS: Record<CodingTestGroup, string> = {
  basic: "Correctness",
  edge: "Edge Cases",
  numerical: "Numerical",
  shape: "Shape",
  gradient: "Gradient",
  performance: "Performance",
};

export const CODING_TEST_GROUP_ORDER: CodingTestGroup[] = [
  "basic",
  "edge",
  "numerical",
  "shape",
  "gradient",
  "performance",
];

/** Capability hints derived from evaluator_config, safe to show publicly. */
export const CODING_CHECK_LABELS = {
  correctness: "Correctness",
  shape: "Shape",
  dtype: "Dtype",
  gradient: "Gradient",
  exception: "Exception",
  performance: "Performance",
} as const;
