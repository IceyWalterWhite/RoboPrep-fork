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
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export const CODING_SORT_LABELS: Record<CodingSort, string> = {
  recommended: "推荐",
  difficulty: "难度",
  acceptance: "通过率",
  newest: "最新",
};

export const CODING_STATUS_LABELS: Record<CodingProblemStatus, string> = {
  solved: "已解决",
  attempted: "已尝试",
  unsolved: "未解决",
};

export const JUDGE_STATUS_LABELS = {
  queued: "排队中",
  running: "运行中",
  accepted: "通过",
  wrong_answer: "答案错误",
  runtime_error: "运行错误",
  time_limit_exceeded: "超出时间限制",
  memory_limit_exceeded: "超出内存限制",
  compile_error: "编译错误",
  internal_error: "判题服务不可用",
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

export const CODING_CATEGORY_LABELS: Record<string, string> = {
  python: "Python",
  transformer: "Transformer",
  rl: "RL",
  diffusion: "扩散模型",
  robotics: "机器人学",
  robot_learning: "机器人学习",
  algorithms: "算法",
};

// ---------------------------------------------------------------------------
// Week 5 — structured evaluation labels
// ---------------------------------------------------------------------------

export const CODING_EVALUATION_MODE_LABELS: Record<CodingEvaluationMode, string> = {
  program: "程序题",
  function: "函数题",
  class: "类题",
};

export const CODING_FRAMEWORK_LABELS: Record<CodingFramework, string> = {
  python: "Python",
  numpy: "NumPy",
  pytorch: "PyTorch",
};

export const CODING_RESOURCE_PROFILE_LABELS: Record<CodingResourceProfile, string> = {
  standard_python: "标准 Python",
  ml_cpu_small: "ML CPU（小）",
  ml_cpu_medium: "ML CPU（中）",
};

/**
 * Group labels shown in result panels. Order matches the aggregation order in
 * `lib/judge/ml-result.ts` so panels render deterministically.
 */
export const CODING_TEST_GROUP_LABELS: Record<CodingTestGroup, string> = {
  basic: "正确性",
  edge: "边界情况",
  numerical: "数值",
  shape: "形状",
  gradient: "梯度",
  performance: "性能",
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
  correctness: "正确性",
  shape: "形状",
  dtype: "数据类型",
  gradient: "梯度",
  exception: "异常",
  performance: "性能",
} as const;
