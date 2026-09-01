import type {
  CodingFramework,
  CodingProblem,
  CodingSubmission as CodingSubmissionRow,
  CodingTestCase as CodingTestCaseRow,
  CodingTestGroup,
} from "@/types/database";
import type {
  CodingExample,
  CodingProblemDetail,
  CodingProblemSummary,
  CodingSubmission,
  CodingTopicRef,
  EvaluationGroupSummary,
  PublicEvaluationMetadata,
} from "@/types/coding";
import type { EvaluationMetadata, PublicMLCaseResult } from "@/types/ml-judge";

import { displayFor, type StructuredCaseRow } from "./structured";

export type CodingProblemCatalogRow = Omit<CodingProblem, "solution_code" | "evaluator_config"> & {
  /** Derived public capability hints published by migration 0016. */
  public_checks?: string[] | null;
};
export type CodingVisibleTestCaseRow = Omit<CodingTestCaseRow, "is_hidden">;

export function mapCodingProblemSummary(
  row: CodingProblemCatalogRow,
  topics: CodingTopicRef[] = [],
  acceptanceRate: number | null = null,
  userStatus: CodingProblemSummary["userStatus"] = null,
): CodingProblemSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty,
    category: row.category,
    topics,
    language: row.language,
    isFeatured: row.is_featured,
    acceptanceRate,
    userStatus,
    evaluationMode: row.evaluation_mode,
    framework: row.framework,
  };
}

export function mapCodingExample(row: CodingVisibleTestCaseRow, entrypointName: string | null = null): CodingExample {
  const structured =
    row.input_json && row.expected_json && entrypointName
      ? displayFor(row as unknown as StructuredCaseRow, entrypointName)
      : null;
  return {
    id: row.id,
    name: row.name ?? `Example ${row.order_index + 1}`,
    inputData: row.input_data,
    expectedOutput: row.expected_output,
    weight: row.weight,
    orderIndex: row.order_index,
    structured: structured
      ? {
          testType: row.test_type ?? "value",
          testGroup: (row.test_group ?? "basic") as CodingTestGroup,
          call: structured.call,
          expected: structured.expected,
          note: structured.note,
        }
      : null,
  };
}

const PUBLIC_CHECKS = ["correctness", "shape", "dtype", "gradient", "exception", "performance"] as const;
type PublicCheck = (typeof PUBLIC_CHECKS)[number];

/**
 * Public evaluation metadata (Week 5 Task 19).
 *
 * The raw `evaluator_config` jsonb is excluded from the catalog view, so it is
 * never available here. Migration `0016` publishes only a derived text[] of
 * capability hints (`public_checks`) — tolerances, group weights and reference
 * data stay server-side.
 */
export function mapEvaluationMetadata(
  row: Pick<
    CodingProblem,
    "evaluation_mode" | "entrypoint_type" | "entrypoint_name" | "framework" | "resource_profile"
  > & { public_checks?: string[] | null },
): PublicEvaluationMetadata {
  return {
    evaluationMode: row.evaluation_mode,
    entrypointType: row.entrypoint_type,
    entrypointName: row.entrypoint_name,
    framework: row.framework,
    resourceProfile: row.resource_profile,
    checks: publicChecks(row.public_checks),
  };
}

function publicChecks(raw: string[] | null | undefined): EvaluationMetadata["checks"] {
  if (!raw || raw.length === 0) return ["correctness"];
  const filtered = raw.filter((value): value is PublicCheck => PUBLIC_CHECKS.includes(value as PublicCheck));
  return filtered.length > 0 ? filtered : ["correctness"];
}

export function mapCodingProblemDetail(
  row: CodingProblemCatalogRow,
  topics: CodingTopicRef[],
  examples: CodingExample[],
  acceptanceRate: number | null = null,
): CodingProblemDetail {
  return {
    ...mapCodingProblemSummary(row, topics, acceptanceRate),
    description: row.description,
    constraints: row.constraints,
    starterCode: row.starter_code ?? "",
    functionName: row.function_name,
    timeLimitMs: row.time_limit_ms,
    memoryLimitMb: row.memory_limit_mb,
    comparisonMode: row.comparison_mode,
    tolerance: row.tolerance,
    examples: examples.sort((a, b) => a.orderIndex - b.orderIndex),
    evaluation: mapEvaluationMetadata({
      evaluation_mode: row.evaluation_mode,
      entrypoint_type: row.entrypoint_type,
      entrypoint_name: row.entrypoint_name,
      framework: row.framework,
      resource_profile: row.resource_profile,
      public_checks: row.public_checks ?? null,
    }),
  };
}

type SubmissionRow = Pick<
  CodingSubmissionRow,
  | "id"
  | "user_id"
  | "problem_id"
  | "language"
  | "status"
  | "score"
  | "runtime_ms"
  | "memory_kb"
  | "evaluation_summary"
  | "created_at"
  | "completed_at"
>;

export function mapCodingSubmission(
  row: SubmissionRow,
  problem?: { slug: string; title: string } | null,
): CodingSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    problemId: row.problem_id,
    problemSlug: problem?.slug,
    problemTitle: problem?.title,
    language: row.language,
    status: row.status,
    score: row.score,
    runtimeMs: row.runtime_ms,
    memoryKb: row.memory_kb,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    evaluationSummary: parseEvaluationSummary(row.evaluation_summary),
  };
}

/**
 * The stored summary was already redacted when it was written (Task 25), but
 * it is re-validated on read: a hand-edited or legacy row must not be able to
 * smuggle hidden diagnostics into the browser.
 */
function parseEvaluationSummary(value: unknown): CodingSubmission["evaluationSummary"] {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.mode !== "function" && record.mode !== "class") return null;

  const groups: EvaluationGroupSummary[] = Array.isArray(record.groups)
    ? record.groups.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const group = entry as Record<string, unknown>;
        if (typeof group.group !== "string" || typeof group.passed !== "number" || typeof group.total !== "number") {
          return [];
        }
        return [{
          group: group.group as EvaluationGroupSummary["group"],
          passed: group.passed,
          total: group.total,
          informational: group.informational === true,
        }];
      })
    : [];

  const cases: PublicMLCaseResult[] = Array.isArray(record.cases)
    ? record.cases.filter((entry): entry is PublicMLCaseResult => !!entry && typeof entry === "object")
    : [];

  const rawError = record.entrypointError;
  const entrypointError =
    rawError && typeof rawError === "object"
      ? {
          category: String((rawError as Record<string, unknown>).category ?? "internal_error"),
          message: String((rawError as Record<string, unknown>).message ?? ""),
        }
      : null;

  const framework =
    record.framework === "python" || record.framework === "numpy" || record.framework === "pytorch"
      ? (record.framework as CodingFramework)
      : null;

  return { mode: record.mode, groups, cases, entrypointError, framework };
}
