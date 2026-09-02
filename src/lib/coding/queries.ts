import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  CodingEvaluationMode,
  CodingFramework,
  CodingResourceProfile,
  CodingSubmission as CodingSubmissionRow,
  CodingTestCase,
} from "@/types/database";
import type { EvaluatorConfig, StructuredTestCase } from "@/types/ml-judge";
import type {
  CodingCollectionDetail,
  CodingCollectionSummary,
  CodingExample,
  CodingFilterOptions,
  CodingFilters,
  CodingOverview,
  CodingProblemDetail,
  CodingProblemStatus,
  CodingProblemSummary,
  CodingProgressCounts,
  CodingSubmission,
  CodingSubmissionCaseResult,
  CodingSubmissionResult,
  CodingTopicRef,
  CollectionProgress,
  PaginatedCodingProblems,
  TopicProgress,
} from "@/types/coding";

import { CODING_PAGE_SIZE } from "./constants";
import { acceptanceRate, deriveProblemStatus } from "./helpers";
import { parseEvaluatorConfig } from "@/lib/judge/evaluator-config";
import {
  mapCodingExample,
  mapCodingProblemDetail,
  mapCodingProblemSummary,
  mapCodingSubmission,
  type CodingProblemCatalogRow,
} from "./mappers";
import { parseStructuredCase, type StructuredCaseRow } from "./structured";

function warn(context: string, error: { message: string }) {
  console.warn(`[coding] ${context} failed: ${error.message}`);
}

function emptyPage(page: number, pageSize: number): PaginatedCodingProblems {
  return { items: [], page, pageSize, total: 0, totalPages: 1 };
}

function ilikePattern(value: string): string {
  const cleaned = value
    .replace(/[%_,().\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? `%${cleaned}%` : "";
}

async function topicRefsForProblems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  problemIds: string[],
): Promise<Map<string, CodingTopicRef[]>> {
  const result = new Map<string, CodingTopicRef[]>();
  if (problemIds.length === 0) return result;
  const { data: links, error } = await supabase
    .from("coding_problem_topics")
    .select("problem_id, topic_id")
    .in("problem_id", problemIds);
  if (error) {
    warn("topic links", error);
    return result;
  }
  const topicIds = [...new Set((links ?? []).map((link) => link.topic_id))];
  if (topicIds.length === 0) return result;
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id, name, slug")
    .in("id", topicIds);
  if (topicsError) warn("topics", topicsError);
  const byId = new Map((topics ?? []).map((topic) => [topic.id, topic]));
  for (const link of links ?? []) {
    const topic = byId.get(link.topic_id);
    if (!topic) continue;
    const refs = result.get(link.problem_id) ?? [];
    refs.push({ name: topic.name, slug: topic.slug });
    result.set(link.problem_id, refs);
  }
  return result;
}

/**
 * Week 7 (Task 70): canonical coding problems linked from published interviews
 * of the given company, optionally narrowed to one of its positions
 * (position validated against the company by the lookup itself).
 */
async function problemIdsForCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companySlug: string,
  positionSlug?: string,
): Promise<string[]> {
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", companySlug)
    .maybeSingle();
  if (!company) return [];

  let positionId: string | null = null;
  if (positionSlug) {
    const { data: position } = await supabase
      .from("positions")
      .select("id, company_id")
      .eq("slug", positionSlug)
      .eq("company_id", company.id)
      .maybeSingle();
    if (!position) return [];
    positionId = position.id;
  }

  const interviewQuery = supabase
    .from("interviews")
    .select("id")
    .eq("company_id", company.id)
    .eq("status", "published");
  const { data: interviews, error } = await (positionId
    ? interviewQuery.eq("position_id", positionId)
    : interviewQuery);
  if (error) {
    warn("problemIdsForCompany/interviews", error);
    return [];
  }
  const interviewIds = (interviews ?? []).map((row) => row.id);
  if (interviewIds.length === 0) return [];

  const { data: links, error: linksError } = await supabase
    .from("interview_questions")
    .select("coding_problem_id")
    .in("interview_id", interviewIds)
    .not("coding_problem_id", "is", null);
  if (linksError) {
    warn("problemIdsForCompany/links", linksError);
    return [];
  }
  return [
    ...new Set(
      (links ?? [])
        .map((row) => row.coding_problem_id)
        .filter((id): id is string => id !== null),
    ),
  ];
}

async function problemIdsForTopic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
): Promise<string[]> {
  const { data: topic, error } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) warn("resolve topic", error);
  if (!topic) return [];
  const { data, error: linkError } = await supabase
    .from("coding_problem_topics")
    .select("problem_id")
    .eq("topic_id", topic.id);
  if (linkError) warn("problem ids for topic", linkError);
  return [...new Set((data ?? []).map((row) => row.problem_id))];
}

async function getAcceptanceRates(
  problemIds: string[],
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  if (problemIds.length === 0) return result;
  const admin = createAdminClient();
  if (!admin) return result;
  const { data, error } = await admin
    .from("coding_submissions")
    .select("problem_id, status")
    .in("problem_id", problemIds)
    .not("status", "in", "(queued,running)");
  if (error) {
    warn("acceptance rates", error);
    return result;
  }
  const counts = new Map<string, { accepted: number; completed: number }>();
  for (const row of data ?? []) {
    const current = counts.get(row.problem_id) ?? { accepted: 0, completed: 0 };
    current.completed += 1;
    if (row.status === "accepted") current.accepted += 1;
    counts.set(row.problem_id, current);
  }
  for (const id of problemIds) {
    const count = counts.get(id);
    result.set(id, count ? acceptanceRate(count.accepted, count.completed) : null);
  }
  return result;
}

async function getUserStatuses(
  problemIds: string[],
): Promise<Map<string, CodingProblemStatus>> {
  const result = new Map<string, CodingProblemStatus>();
  if (problemIds.length === 0) return result;
  const user = await getCurrentUser();
  if (!user) return result;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coding_submissions")
    .select("problem_id, status")
    .eq("user_id", user.id)
    .in("problem_id", problemIds);
  if (error) {
    warn("user statuses", error);
    return result;
  }
  const grouped = new Map<string, Array<{ status: CodingSubmissionRow["status"] }>>();
  for (const row of data ?? []) {
    const submissions = grouped.get(row.problem_id) ?? [];
    submissions.push(row);
    grouped.set(row.problem_id, submissions);
  }
  for (const [problemId, submissions] of grouped) {
    result.set(problemId, deriveProblemStatus(submissions));
  }
  return result;
}

async function mapSummaries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: CodingProblemCatalogRow[],
): Promise<CodingProblemSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [topicMap, acceptanceRates, userStatuses] = await Promise.all([
    topicRefsForProblems(supabase, ids),
    getAcceptanceRates(ids),
    getUserStatuses(ids),
  ]);
  return rows.map((row) =>
    mapCodingProblemSummary(
      row,
      topicMap.get(row.id) ?? [],
      acceptanceRates.get(row.id) ?? null,
      userStatuses.get(row.id) ?? null,
    ),
  );
}

export async function getCodingProblems(
  options: {
    filters?: CodingFilters;
    sort?: "recommended" | "difficulty" | "acceptance" | "newest";
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PaginatedCodingProblems> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? CODING_PAGE_SIZE));
  const filters = options.filters ?? {};
  const sort = options.sort ?? "recommended";
  if (!isSupabaseConfigured) return emptyPage(page, pageSize);

  const supabase = await createClient();
  let query = supabase.from("coding_problem_catalog").select("*", { count: "exact" });
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.topic) {
    const ids = await problemIdsForTopic(supabase, filters.topic);
    if (ids.length === 0) return emptyPage(page, pageSize);
    query = query.in("id", ids);
  }
  // Week 7 (Tasks 70, 73): only canonical coding problems appearing in
  // published interviews of the company (and optionally the position).
  if (filters.company) {
    const ids = await problemIdsForCompany(supabase, filters.company, filters.position);
    if (ids.length === 0) return emptyPage(page, pageSize);
    query = query.in("id", ids);
  }
  if (filters.query) {
    const pattern = ilikePattern(filters.query);
    if (!pattern) return emptyPage(page, pageSize);
    const { data: matchedTopics } = await supabase
      .from("topics")
      .select("id")
      .ilike("name", pattern);
    const topicIds = (matchedTopics ?? []).map((topic) => topic.id);
    const topicProblemIds = topicIds.length
      ? ((
          await supabase
            .from("coding_problem_topics")
            .select("problem_id")
            .in("topic_id", topicIds)
        ).data ?? [])
      : [];
    const orParts = [
      `title.ilike.${pattern}`,
      `description.ilike.${pattern}`,
      `category.ilike.${pattern}`,
    ];
    if (topicProblemIds.length > 0)
      orParts.push(`id.in.(${topicProblemIds.map((row) => row.problem_id).join(",")})`);
    query = query.or(orParts.join(","));
  }

  // Progress is derived from the current viewer's submissions, so that filter
  // also has to happen after the batch status query below rather than in SQL.
  const needsMemorySort =
    sort === "difficulty" || sort === "acceptance" || !!filters.status;
  if (!needsMemorySort) {
    query =
      sort === "newest"
        ? query.order("created_at", { ascending: false })
        : query
            .order("is_featured", { ascending: false })
            .order("created_at", { ascending: false });
  }
  const { data, error, count } = needsMemorySort
    ? await query.range(0, Math.max(999, page * pageSize - 1))
    : await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error || !data) {
    if (error) warn("getCodingProblems", error);
    return emptyPage(page, pageSize);
  }
  const summaries = await mapSummaries(supabase, data);
  const matchingSummaries = filters.status
    ? summaries.filter((summary) => summary.userStatus === filters.status)
    : summaries;
  const ordered = [...matchingSummaries].sort((a, b) => {
    if (sort === "difficulty") {
      const rank = { hard: 3, medium: 2, easy: 1 };
      return rank[b.difficulty] - rank[a.difficulty] || a.title.localeCompare(b.title);
    }
    if (sort === "acceptance") {
      return (
        (b.acceptanceRate ?? -1) - (a.acceptanceRate ?? -1) ||
        a.title.localeCompare(b.title)
      );
    }
    return 0;
  });
  const total = filters.status ? ordered.length : (count ?? ordered.length);
  return {
    items: needsMemorySort
      ? ordered.slice((page - 1) * pageSize, page * pageSize)
      : ordered,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getVisibleExamples(
  problemId: string,
  entrypointName?: string | null,
): Promise<CodingExample[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coding_visible_test_cases")
    .select("*")
    .eq("problem_id", problemId)
    .order("order_index");
  if (error) {
    warn("getVisibleExamples", error);
    return [];
  }
  return (data ?? []).map((row) => mapCodingExample(row, entrypointName ?? null));
}

export async function getCodingProblemBySlug(
  slug: string,
): Promise<CodingProblemDetail | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("coding_problem_catalog")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    warn("getCodingProblemBySlug", error);
    return null;
  }
  if (!row) return null;
  const [topics, examples, rates] = await Promise.all([
    topicRefsForProblems(supabase, [row.id]),
    getVisibleExamples(row.id, row.entrypoint_name),
    getAcceptanceRates([row.id]),
  ]);
  return mapCodingProblemDetail(
    row,
    topics.get(row.id) ?? [],
    examples,
    rates.get(row.id) ?? null,
  );
}

export async function getCodingTopics(): Promise<CodingTopicRef[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("coding_problem_topics")
    .select("topic_id");
  if (error) {
    warn("getCodingTopics/links", error);
    return [];
  }
  const topicIds = [...new Set((links ?? []).map((link) => link.topic_id))];
  if (topicIds.length === 0) return [];
  const { data, error: topicError } = await supabase
    .from("topics")
    .select("name, slug")
    .in("id", topicIds)
    .order("name");
  if (topicError) warn("getCodingTopics/topics", topicError);
  return data ?? [];
}

export async function getCodingFilterOptions(): Promise<CodingFilterOptions> {
  if (!isSupabaseConfigured) return { categories: [], topics: [], difficulties: [] };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coding_problem_catalog")
    .select("category, difficulty");
  if (error) {
    warn("getCodingFilterOptions/problems", error);
    return { categories: [], topics: [], difficulties: [] };
  }
  return {
    categories: [
      ...new Set(
        (data ?? [])
          .map((row) => row.category)
          .filter((value): value is string => !!value),
      ),
    ].sort(),
    topics: await getCodingTopics(),
    difficulties: [...new Set((data ?? []).map((row) => row.difficulty))].sort(),
  };
}

const SUBMISSION_PUBLIC_COLUMNS =
  "id, user_id, problem_id, language, status, score, runtime_ms, memory_kb, evaluation_summary, created_at, completed_at";

export async function getUserSubmissions(
  problemId?: string,
  limit = 30,
): Promise<CodingSubmission[]> {
  if (!isSupabaseConfigured) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  let query = supabase
    .from("coding_submissions")
    .select(SUBMISSION_PUBLIC_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (problemId) query = query.eq("problem_id", problemId);
  const { data, error } = await query;
  if (error) {
    warn("getUserSubmissions", error);
    return [];
  }
  const problemIds = [...new Set((data ?? []).map((row) => row.problem_id))];
  const { data: problems } = problemIds.length
    ? await supabase
        .from("coding_problem_catalog")
        .select("id, slug, title")
        .in("id", problemIds)
    : { data: [] };
  const problemById = new Map((problems ?? []).map((problem) => [problem.id, problem]));
  return (data ?? []).map((row) =>
    mapCodingSubmission(row, problemById.get(row.problem_id)),
  );
}

export async function getUserProblemStatus(
  problemId: string,
): Promise<CodingProblemStatus | null> {
  const submissions = await getUserSubmissions(problemId, 100);
  return submissions.length > 0 ? deriveProblemStatus(submissions) : null;
}

export async function getSubmissionById(
  id: string,
): Promise<CodingSubmissionResult | null> {
  if (!isSupabaseConfigured) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("coding_submissions")
    .select(SUBMISSION_PUBLIC_COLUMNS)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !row) {
    if (error) warn("getSubmissionById/submission", error);
    return null;
  }
  const [{ data: problem }, { data: cases, error: casesError }] = await Promise.all([
    supabase
      .from("coding_problem_catalog")
      .select("id, slug, title")
      .eq("id", row.problem_id)
      .maybeSingle(),
    supabase
      .from("coding_submission_cases")
      .select(
        "id, submission_id, test_case_id, status, runtime_ms, memory_kb, stdout, stderr, created_at",
      )
      .eq("submission_id", id)
      .order("created_at"),
  ]);
  if (casesError) warn("getSubmissionById/cases", casesError);
  const visibleIds = new Set(
    (await getVisibleExamples(row.problem_id)).map((example) => example.id),
  );
  const mappedCases: CodingSubmissionCaseResult[] = (cases ?? []).map((item) => ({
    id: item.id,
    name:
      item.test_case_id && visibleIds.has(item.test_case_id) ? "可见测试" : "隐藏测试",
    status: item.status ?? "internal_error",
    runtimeMs: item.runtime_ms,
    memoryKb: item.memory_kb,
    stdout: item.stdout,
    stderr: item.stderr,
  }));
  return {
    submission: mapCodingSubmission(row, problem ?? undefined),
    cases: mappedCases,
  };
}

export interface CodingJudgeDefinition {
  id: string;
  slug: string;
  language: "python";
  timeLimitMs: number;
  memoryLimitMb: number;
  comparisonMode: "exact" | "trimmed" | "numeric";
  tolerance: number;
  tests: Array<
    Pick<
      CodingTestCase,
      | "id"
      | "name"
      | "input_data"
      | "expected_output"
      | "is_hidden"
      | "weight"
      | "order_index"
    >
  >;
}

export async function getCodingJudgeDefinition(
  slug: string,
): Promise<CodingJudgeDefinition | null> {
  if (!isSupabaseConfigured) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: problem, error } = await admin
    .from("coding_problems")
    .select(
      "id, slug, language, time_limit_ms, memory_limit_mb, comparison_mode, tolerance, is_published",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !problem) {
    if (error) warn("getCodingJudgeDefinition/problem", error);
    return null;
  }
  const { data: tests, error: testsError } = await admin
    .from("coding_test_cases")
    .select(
      "id, problem_id, name, input_data, expected_output, is_hidden, weight, order_index",
    )
    .eq("problem_id", problem.id)
    .order("order_index");
  if (testsError) {
    warn("getCodingJudgeDefinition/tests", testsError);
    return null;
  }
  return {
    id: problem.id,
    slug: problem.slug,
    language: problem.language,
    timeLimitMs: problem.time_limit_ms,
    memoryLimitMb: problem.memory_limit_mb,
    comparisonMode: problem.comparison_mode,
    tolerance: problem.tolerance,
    tests: tests ?? [],
  };
}

export async function getCodingAcceptanceRate(
  problemId: string,
): Promise<number | null> {
  return (await getAcceptanceRates([problemId])).get(problemId) ?? null;
}

// ---------------------------------------------------------------------------
// Week 5 — structured (function/class) judge definitions
// ---------------------------------------------------------------------------

export interface MLJudgeDefinition {
  id: string;
  slug: string;
  evaluationMode: "function" | "class";
  entrypointName: string;
  entrypointType: "function" | "class";
  framework: CodingFramework;
  resourceProfile: CodingResourceProfile;
  config: EvaluatorConfig;
  cases: StructuredTestCase[];
  visibleCaseIds: Set<string>;
}

/**
 * Server-only structured judge definition (Week 5 Tasks 6 & 49).
 *
 * Uses the service-role client on purpose: hidden structured inputs, expected
 * tensors and reference gradients must never be reachable through the
 * anonymous/authenticated client or the public test-case view. The returned
 * object is therefore only ever used inside API routes, and every field that
 * crosses back to the browser goes through `redactMLEvaluation`.
 */
export async function getMLJudgeDefinition(
  slug: string,
): Promise<MLJudgeDefinition | null> {
  if (!isSupabaseConfigured) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: problem, error } = await admin
    .from("coding_problems")
    .select(
      "id, slug, evaluation_mode, entrypoint_type, entrypoint_name, framework, resource_profile, evaluator_config, is_published",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !problem) {
    if (error) warn("getMLJudgeDefinition/problem", error);
    return null;
  }
  if (problem.evaluation_mode !== "function" && problem.evaluation_mode !== "class")
    return null;
  if (!problem.entrypoint_name || !problem.entrypoint_type) return null;

  const { data: tests, error: testsError } = await admin
    .from("coding_test_cases")
    .select(
      "id, name, test_type, test_group, input_json, expected_json, metadata, weight, is_hidden, order_index",
    )
    .eq("problem_id", problem.id)
    .order("order_index");
  if (testsError) {
    warn("getMLJudgeDefinition/tests", testsError);
    return null;
  }

  const cases: StructuredTestCase[] = [];
  const visibleCaseIds = new Set<string>();
  for (const row of tests ?? []) {
    const parsed = parseStructuredCase(
      row as StructuredCaseRow,
      problem.entrypoint_name,
    );
    if (!parsed) {
      warn("getMLJudgeDefinition/case", {
        message: `skipped malformed structured case ${row.id} on ${problem.slug}`,
      });
      continue;
    }
    cases.push(parsed.testCase);
    if (!row.is_hidden) visibleCaseIds.add(row.id);
  }
  if (cases.length === 0) return null;

  return {
    id: problem.id,
    slug: problem.slug,
    evaluationMode: problem.evaluation_mode,
    entrypointName: problem.entrypoint_name,
    entrypointType: problem.entrypoint_type,
    framework: (problem.framework ?? "python") as CodingFramework,
    resourceProfile: problem.resource_profile,
    config: parseEvaluatorConfig(problem.evaluator_config),
    cases,
    visibleCaseIds,
  };
}

/** Resolve the evaluation mode without loading hidden payloads. */
export async function getCodingEvaluationMode(
  slug: string,
): Promise<CodingEvaluationMode | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coding_problem_catalog")
    .select("evaluation_mode")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    warn("getCodingEvaluationMode", error);
    return null;
  }
  return data?.evaluation_mode ?? null;
}

// ---------------------------------------------------------------------------
// Week 5 — collections & progress (Tasks 27, 29, 46)
// ---------------------------------------------------------------------------

function emptyCounts(total: number): CodingProgressCounts {
  return { solved: 0, attempted: 0, unsolved: total, total };
}

/**
 * Per-problem status map for a set of problem ids. Progress is always derived
 * from the current viewer's submissions (never a stale cache), so it is
 * correct for anonymous users (all unsolved) and authenticated users alike.
 */
async function statusMapForProblems(
  problemIds: string[],
): Promise<Map<string, CodingProblemStatus>> {
  const result = new Map<string, CodingProblemStatus>();
  if (problemIds.length === 0) return result;
  const user = await getCurrentUser();
  if (!user) return result;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coding_submissions")
    .select("problem_id, status")
    .eq("user_id", user.id)
    .in("problem_id", problemIds)
    .not("status", "in", "(queued,running)");
  if (error) {
    warn("progress statuses", error);
    return result;
  }
  const grouped = new Map<string, Array<{ status: CodingSubmissionRow["status"] }>>();
  for (const row of data ?? []) {
    const list = grouped.get(row.problem_id) ?? [];
    list.push(row);
    grouped.set(row.problem_id, list);
  }
  for (const [problemId, submissions] of grouped) {
    result.set(problemId, deriveProblemStatus(submissions));
  }
  return result;
}

/** Aggregate a status map into solved / attempted / unsolved / total counts. */
function countsFromStatuses(
  statuses: Array<CodingProblemStatus | undefined>,
): CodingProgressCounts {
  const counts: CodingProgressCounts = {
    solved: 0,
    attempted: 0,
    unsolved: 0,
    total: statuses.length,
  };
  for (const status of statuses) {
    if (status === "solved") counts.solved += 1;
    else if (status === "attempted") counts.attempted += 1;
    else counts.unsolved += 1;
  }
  return counts;
}

export async function getCodingCollections(): Promise<CodingCollectionSummary[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coding_collections")
    .select("id, name, slug, description, order_index")
    .eq("is_published", true)
    .order("order_index");
  if (error) {
    warn("getCodingCollections", error);
    return [];
  }
  if (data.length === 0) return [];

  const collectionIds = data.map((collection) => collection.id);
  const { data: links, error: linksError } = await supabase
    .from("coding_collection_problems")
    .select("collection_id, problem_id")
    .in("collection_id", collectionIds);
  if (linksError) warn("getCodingCollections/links", linksError);

  const problemIds = [...new Set((links ?? []).map((link) => link.problem_id))];
  const statuses = await statusMapForProblems(problemIds);

  const problemCountByCollection = new Map<string, number>();
  const solvedByCollection = new Map<string, number>();
  for (const link of links ?? []) {
    problemCountByCollection.set(
      link.collection_id,
      (problemCountByCollection.get(link.collection_id) ?? 0) + 1,
    );
    if (statuses.get(link.problem_id) === "solved") {
      solvedByCollection.set(
        link.collection_id,
        (solvedByCollection.get(link.collection_id) ?? 0) + 1,
      );
    }
  }

  return data.map((collection) => ({
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    orderIndex: collection.order_index,
    problemCount: problemCountByCollection.get(collection.id) ?? 0,
    solvedCount: solvedByCollection.get(collection.id) ?? 0,
  }));
}

export async function getCodingCollectionBySlug(
  slug: string,
): Promise<CodingCollectionDetail | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: collection, error } = await supabase
    .from("coding_collections")
    .select("id, name, slug, description, order_index")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !collection) {
    if (error) warn("getCodingCollectionBySlug/collection", error);
    return null;
  }

  const { data: links, error: linksError } = await supabase
    .from("coding_collection_problems")
    .select("problem_id, order_index")
    .eq("collection_id", collection.id)
    .order("order_index");
  if (linksError) warn("getCodingCollectionBySlug/links", linksError);

  const problemIds = [...new Set((links ?? []).map((link) => link.problem_id))];
  if (problemIds.length === 0) {
    return {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      orderIndex: collection.order_index,
      problemCount: 0,
      solvedCount: 0,
      problems: [],
    };
  }
  const { data: rows, error: problemsError } = await supabase
    .from("coding_problem_catalog")
    .select("*")
    .in("id", problemIds);
  if (problemsError) warn("getCodingCollectionBySlug/problems", problemsError);

  const orderByProblem = new Map(
    (links ?? []).map((link) => [link.problem_id, link.order_index]),
  );
  const orderedRows = [...(rows ?? [])].sort(
    (a, b) => (orderByProblem.get(a.id) ?? 0) - (orderByProblem.get(b.id) ?? 0),
  );

  const [summaries, statuses] = await Promise.all([
    mapSummaries(supabase, orderedRows),
    statusMapForProblems(problemIds),
  ]);
  let solvedCount = 0;
  const problems = summaries.map((summary) => {
    if (statuses.get(summary.id) === "solved") solvedCount += 1;
    return { ...summary, orderIndex: orderByProblem.get(summary.id) ?? 0 };
  });

  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    orderIndex: collection.order_index,
    problemCount: problems.length,
    solvedCount,
    problems,
  };
}

export async function getUserCodingProgress(): Promise<CodingProgressCounts> {
  if (!isSupabaseConfigured) return emptyCounts(0);
  const supabase = await createClient();
  const { data, error } = await supabase.from("coding_problem_catalog").select("id");
  if (error) {
    warn("getUserCodingProgress/problems", error);
    return emptyCounts(0);
  }
  const ids = (data ?? []).map((row) => row.id);
  const statuses = await statusMapForProblems(ids);
  return countsFromStatuses(ids.map((id) => statuses.get(id)));
}

export async function getCollectionProgress(): Promise<CollectionProgress[]> {
  const collections = await getCodingCollections();
  return collections.map((collection) => ({
    solved: collection.solvedCount,
    attempted: 0,
    unsolved: collection.problemCount - collection.solvedCount,
    total: collection.problemCount,
    collection: { name: collection.name, slug: collection.slug },
  }));
}

export async function getTopicProgress(): Promise<TopicProgress[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("coding_problem_topics")
    .select("problem_id, topic_id");
  if (error) {
    warn("getTopicProgress/links", error);
    return [];
  }
  const topicIds = [...new Set((links ?? []).map((link) => link.topic_id))];
  if (topicIds.length === 0) return [];
  const { data: topics, error: topicError } = await supabase
    .from("topics")
    .select("id, name, slug")
    .in("id", topicIds);
  if (topicError) warn("getTopicProgress/topics", topicError);
  const byId = new Map((topics ?? []).map((topic) => [topic.id, topic]));

  const problemIds = [...new Set((links ?? []).map((link) => link.problem_id))];
  const statuses = await statusMapForProblems(problemIds);

  const problemsByTopic = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = problemsByTopic.get(link.topic_id) ?? [];
    list.push(link.problem_id);
    problemsByTopic.set(link.topic_id, list);
  }

  const result: TopicProgress[] = [];
  for (const [topicId, problemIdsForTopic] of problemsByTopic) {
    const topic = byId.get(topicId);
    if (!topic) continue;
    const unique = [...new Set(problemIdsForTopic)];
    result.push({
      ...countsFromStatuses(unique.map((id) => statuses.get(id))),
      topic: { name: topic.name, slug: topic.slug },
    });
  }
  return result.sort((a, b) => b.total - a.total);
}

export async function getCodingOverview(): Promise<CodingOverview> {
  if (!isSupabaseConfigured) {
    return {
      counts: emptyCounts(0),
      byDifficulty: {
        easy: emptyCounts(0),
        medium: emptyCounts(0),
        hard: emptyCounts(0),
      },
      topics: [],
      collections: [],
      recent: [],
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coding_problem_catalog")
    .select("id, difficulty");
  if (error) {
    warn("getCodingOverview/problems", error);
    return {
      counts: emptyCounts(0),
      byDifficulty: {
        easy: emptyCounts(0),
        medium: emptyCounts(0),
        hard: emptyCounts(0),
      },
      topics: [],
      collections: [],
      recent: [],
    };
  }
  const ids = (data ?? []).map((row) => row.id);
  const statuses = await statusMapForProblems(ids);
  const statusForId = (id: string) => statuses.get(id);

  const byDifficulty: CodingOverview["byDifficulty"] = {
    easy: countsFromStatuses(
      (data ?? [])
        .filter((row) => row.difficulty === "easy")
        .map((row) => statusForId(row.id)),
    ),
    medium: countsFromStatuses(
      (data ?? [])
        .filter((row) => row.difficulty === "medium")
        .map((row) => statusForId(row.id)),
    ),
    hard: countsFromStatuses(
      (data ?? [])
        .filter((row) => row.difficulty === "hard")
        .map((row) => statusForId(row.id)),
    ),
  };

  const [topics, collections, recent] = await Promise.all([
    getTopicProgress(),
    getCollectionProgress(),
    getUserSubmissions(undefined, 8),
  ]);

  return {
    counts: countsFromStatuses(ids.map(statusForId)),
    byDifficulty,
    topics,
    collections,
    recent,
  };
}
