/**
 * Week 6 ingestion constants: statuses, limits, thresholds, and the valid
 * state transitions. Everything here is server-authoritative — the client
 * never supplies any of these values.
 */

import type { SubmissionStatus } from "@/types/ingestion";

export const PARSER_VERSION = "v1";
export const PROMPT_VERSION = "v1";

/** Raw submission size limits (Task 53). Configurable via env. */
export const SUBMISSION_MIN_CHARS = Number(process.env.INGESTION_MIN_CHARS ?? 50);
export const SUBMISSION_MAX_CHARS = Number(process.env.INGESTION_MAX_CHARS ?? 50_000);

/** Submission rate limiting (Task 54): 5 / hour / user by default. */
export const SUBMISSION_RATE_LIMIT = Number(process.env.INGESTION_RATE_LIMIT ?? 5);
export const SUBMISSION_RATE_WINDOW_MS = 60 * 60 * 1000;

/** Canonical match suggestion thresholds (Task 48). Reviewer aid only. */
export const MATCH_STRONG_THRESHOLD = 0.9;
export const MATCH_WEAK_THRESHOLD = 0.7;

/** Parser confidence bands (Task 47). Highlighting only — never auto-publish. */
export const CONFIDENCE_HIGH = 0.85;
export const CONFIDENCE_LOW = 0.6;

/**
 * Valid submission status transitions (Task 12). Every transition in the
 * ingestion service goes through this table.
 */
export const SUBMISSION_TRANSITIONS: Record<
  SubmissionStatus,
  readonly SubmissionStatus[]
> = {
  submitted: ["processing", "failed", "rejected"],
  processing: ["parsed", "needs_review", "failed"],
  parsed: ["needs_review", "approved", "rejected", "failed"],
  needs_review: ["approved", "rejected", "processing"],
  approved: ["published", "needs_review", "rejected"],
  rejected: [],
  failed: ["processing", "rejected"],
  published: [],
};

export function canTransition(from: SubmissionStatus, to: SubmissionStatus): boolean {
  return SUBMISSION_TRANSITIONS[from].includes(to);
}

/**
 * User-facing status mapping (Task 42): internal pipeline states map to
 * friendly labels; internal error details never reach the user.
 */
export const USER_FACING_STATUS: Record<
  SubmissionStatus,
  {
    label: string;
    description: string;
    tone: "neutral" | "pending" | "success" | "attention";
  }
> = {
  submitted: {
    label: "已接收",
    description: "你的投稿已进入处理队列。",
    tone: "neutral",
  },
  processing: {
    label: "处理中",
    description: "我们正在提取面经结构。",
    tone: "pending",
  },
  parsed: {
    label: "审核中",
    description: "审核员正在检查解析后的结构。",
    tone: "pending",
  },
  needs_review: {
    label: "审核中",
    description: "审核员正在检查解析后的结构。",
    tone: "pending",
  },
  approved: {
    label: "已批准",
    description: "审核已通过，接下来将进行发布。",
    tone: "success",
  },
  rejected: {
    label: "未发布",
    description: "审核后，这份投稿未被发布。欢迎补充更详细的经历后再次投稿。",
    tone: "attention",
  },
  failed: {
    label: "需要处理",
    description: "自动处理未能完成，我们的团队会进一步查看。",
    tone: "attention",
  },
  published: {
    label: "已发布",
    description: "你的面经现已成为 RoboPrep 的一部分，感谢你的贡献！",
    tone: "success",
  },
};

export const SEASONS = ["spring", "summer", "fall", "autumn", "winter"] as const;
