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
export const SUBMISSION_TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
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
  { label: string; description: string; tone: "neutral" | "pending" | "success" | "attention" }
> = {
  submitted: {
    label: "Received",
    description: "Your submission is in the queue for processing.",
    tone: "neutral",
  },
  processing: {
    label: "Processing",
    description: "We are extracting the structure of your interview.",
    tone: "pending",
  },
  parsed: {
    label: "Under review",
    description: "A reviewer is checking the parsed structure.",
    tone: "pending",
  },
  needs_review: {
    label: "Under review",
    description: "A reviewer is checking the parsed structure.",
    tone: "pending",
  },
  approved: {
    label: "Approved",
    description: "The review passed. Publication is the final step.",
    tone: "success",
  },
  rejected: {
    label: "Not published",
    description:
      "After review, this submission was not published. You are welcome to submit a more detailed experience.",
    tone: "attention",
  },
  failed: {
    label: "Needs attention",
    description: "Automatic processing could not complete. Our team will take a look.",
    tone: "attention",
  },
  published: {
    label: "Published",
    description: "Your interview is now part of RoboPrep. Thank you for contributing!",
    tone: "success",
  },
};

export const SEASONS = ["spring", "summer", "fall", "autumn", "winter"] as const;
