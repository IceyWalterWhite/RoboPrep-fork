import "server-only";

/**
 * Week 8 Task 5: lightweight server-side feature flags.
 *
 * Flags let an operator disable high-risk / high-cost capabilities without a
 * deploy (Task 120 rollback plan). They are env-driven and server-only; the
 * client learns about a disabled feature only through graceful UI states
 * (Task 96), never from exposed config.
 *
 * Env switches (all default to enabled where safe):
 *   FLAG_CODING_JUDGE=off        — disables Run/Submit for coding problems
 *   FLAG_INTERVIEW_SUBMISSION=off — hides /interviews/submit + API
 *   FLAG_LLM_INGESTION=off       — parser falls back to the mock parser
 *   FLAG_COMPANY_TRENDS=off      — hides trend sections on company pages
 *
 * Values: "on" (default) / "off".
 */

export type FeatureFlag =
  "coding_judge" | "interview_submission" | "llm_ingestion" | "company_trends";

export const FEATURE_FLAG_LABELS: Record<FeatureFlag, string> = {
  coding_judge: "Coding 判题",
  interview_submission: "面试投稿",
  llm_ingestion: "LLM 面试解析",
  company_trends: "公司趋势",
};

const ENV_KEYS: Record<FeatureFlag, string> = {
  coding_judge: "FLAG_CODING_JUDGE",
  interview_submission: "FLAG_INTERVIEW_SUBMISSION",
  llm_ingestion: "FLAG_LLM_INGESTION",
  company_trends: "FLAG_COMPANY_TRENDS",
};

function readFlag(flag: FeatureFlag): boolean {
  const raw = process.env[ENV_KEYS[flag]];
  if (raw === undefined || raw === "") return true;
  return raw !== "off" && raw !== "false" && raw !== "0";
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return readFlag(flag);
}

export function getFeatureFlags(): Record<FeatureFlag, boolean> {
  return {
    coding_judge: readFlag("coding_judge"),
    interview_submission: readFlag("interview_submission"),
    llm_ingestion: readFlag("llm_ingestion"),
    company_trends: readFlag("company_trends"),
  };
}

/** Feature flag audit for /admin/system (values only, never secrets). */
export function describeFeatureFlags(): Array<{
  flag: FeatureFlag;
  enabled: boolean;
  envKey: string;
}> {
  return (Object.keys(ENV_KEYS) as FeatureFlag[]).map((flag) => ({
    flag,
    enabled: readFlag(flag),
    envKey: ENV_KEYS[flag],
  }));
}
