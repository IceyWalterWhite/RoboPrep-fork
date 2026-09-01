import { createClient } from "@supabase/supabase-js";

import { envValue, loadProjectEnv } from "./lib/load-env";
import { evaluatorConfigSchema, frameworkAllowlist, resourceProfiles } from "../src/lib/judge/evaluator-config";
import type { Database } from "../src/types/database";

const values = loadProjectEnv();
const url = envValue(values, "NEXT_PUBLIC_SUPABASE_URL");
const key = envValue(values, "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error(
    "Coding integrity check needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(2);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
const failures: string[] = [];
const { data: problems, error: problemsError } = await supabase
  .from("coding_problems")
  .select(
    "id, slug, difficulty, starter_code, time_limit_ms, memory_limit_mb, is_published, evaluation_mode, entrypoint_type, entrypoint_name, framework, resource_profile, evaluator_config",
  );
if (problemsError) fail("coding problems query", problemsError.message);

const VALID_EVALUATION_MODES = ["program", "function", "class"] as const;
const VALID_TEST_TYPES = ["example", "value", "shape", "dtype", "gradient", "exception", "performance"] as const;
const VALID_TEST_GROUPS = ["basic", "edge", "numerical", "shape", "gradient", "performance"] as const;
const VALID_EXPECTED_KINDS = ["value", "shape", "dtype", "gradient", "exception", "performance"] as const;

const published = (problems ?? []).filter((problem) => problem.is_published);
const problemIds = published.map((problem) => problem.id);
const slugs = new Set<string>();
for (const problem of published) {
  if (slugs.has(problem.slug)) fail(`problem ${problem.id}`, "duplicate slug");
  slugs.add(problem.slug);
  if (!problem.starter_code?.trim())
    fail(`problem ${problem.slug}`, "published problem has no starter code");
  if (!(["easy", "medium", "hard"] as string[]).includes(problem.difficulty))
    fail(`problem ${problem.slug}`, "invalid difficulty");
  if (problem.time_limit_ms <= 0)
    fail(`problem ${problem.slug}`, "time limit must be positive");
  if (problem.memory_limit_mb <= 0)
    fail(`problem ${problem.slug}`, "memory limit must be positive");

  // Week 5 (Task 43): structured evaluation fields.
  const mode = problem.evaluation_mode;
  if (!(VALID_EVALUATION_MODES as readonly string[]).includes(mode))
    fail(`problem ${problem.slug}`, `invalid evaluation_mode "${mode}"`);

  if (mode === "function" || mode === "class") {
    if (problem.entrypoint_type !== "function" && problem.entrypoint_type !== "class")
      fail(`problem ${problem.slug}`, `function/class mode needs entrypoint_type, got "${problem.entrypoint_type}"`);
    if (problem.entrypoint_type !== mode)
      fail(`problem ${problem.slug}`, `entrypoint_type "${problem.entrypoint_type}" does not match evaluation_mode "${mode}"`);
    if (!problem.entrypoint_name?.trim())
      fail(`problem ${problem.slug}`, "function/class mode needs a non-empty entrypoint_name");
    if (!problem.framework || !(frameworkAllowlist as readonly string[]).includes(problem.framework))
      fail(`problem ${problem.slug}`, `invalid framework "${problem.framework}"`);
    if (!problem.resource_profile || !(problem.resource_profile in resourceProfiles))
      fail(`problem ${problem.slug}`, `invalid resource_profile "${problem.resource_profile}"`);
    if (problem.evaluator_config !== null) {
      const parsed = evaluatorConfigSchema.safeParse(problem.evaluator_config);
      if (!parsed.success)
        fail(`problem ${problem.slug}`, `invalid evaluator_config: ${parsed.error.issues[0]?.message ?? "unknown issue"}`);
    } else {
      fail(`problem ${problem.slug}`, "function/class mode needs a valid evaluator_config");
    }
  }
}

const [{ data: cases, error: casesError }, { data: links, error: linksError }] =
  await Promise.all([
    problemIds.length
      ? supabase
          .from("coding_test_cases")
          .select("id, problem_id, is_hidden, input_data, expected_output, test_type, test_group, input_json, expected_json")
          .in("problem_id", problemIds)
      : Promise.resolve({ data: [], error: null }),
    problemIds.length
      ? supabase
          .from("coding_problem_topics")
          .select("problem_id, topic_id")
          .in("problem_id", problemIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
if (casesError) fail("coding test cases query", casesError.message);
if (linksError) fail("coding topic links query", linksError.message);

const casesByProblem = new Map<string, typeof cases>();
for (const testCase of cases ?? []) {
  const list = casesByProblem.get(testCase.problem_id) ?? [];
  list.push(testCase);
  casesByProblem.set(testCase.problem_id, list);
}
for (const problem of published) {
  const problemCases = casesByProblem.get(problem.id) ?? [];
  const visible = problemCases.filter((testCase) => !testCase.is_hidden);
  const hidden = problemCases.filter((testCase) => testCase.is_hidden);
  if (visible.length === 0)
    fail(`problem ${problem.slug}`, "published problem has no visible example");
  if (hidden.length < 3)
    fail(
      `problem ${problem.slug}`,
      `needs at least 3 hidden tests, found ${hidden.length}`,
    );

  const structured = problem.evaluation_mode === "function" || problem.evaluation_mode === "class";
  for (const testCase of problemCases) {
    if (structured) {
      // Task 43: structured test cases must be well-formed.
      if (testCase.test_type === null || !(VALID_TEST_TYPES as readonly string[]).includes(testCase.test_type))
        fail(`test case ${testCase.id}`, `invalid test_type "${testCase.test_type}"`);
      if (testCase.test_group === null || !(VALID_TEST_GROUPS as readonly string[]).includes(testCase.test_group))
        fail(`test case ${testCase.id}`, `invalid test_group "${testCase.test_group}"`);
      if (testCase.input_json === null || testCase.expected_json === null)
        fail(`test case ${testCase.id}`, "structured test case needs input_json and expected_json");
      try {
        const input = testCase.input_json as unknown;
        if (typeof input === "object" && input !== null && !("args" in (input as Record<string, unknown>)))
          fail(`test case ${testCase.id}`, "input_json needs an args field");
        const expected = testCase.expected_json as Record<string, unknown>;
        if (typeof expected !== "object" || expected === null || !("kind" in expected))
          fail(`test case ${testCase.id}`, "expected_json needs a kind field");
        else if (!(VALID_EXPECTED_KINDS as readonly string[]).includes(expected.kind as string))
          fail(`test case ${testCase.id}`, `invalid expected kind "${String(expected.kind)}"`);
        else if (expected.kind === "gradient" && !Array.isArray(expected.gradients))
          fail(`test case ${testCase.id}`, "gradient expected_json needs a gradients array");
        else if (expected.kind === "gradient" && Array.isArray(expected.gradients)) {
          for (const grad of expected.gradients as Array<{ label?: unknown }>) {
            const label = grad.label;
            if (typeof label !== "string" || !/^(arg\d+|[a-zA-Z_]\w*|param:[a-zA-Z_]\w*)$/.test(label))
              fail(`test case ${testCase.id}`, `invalid gradient label "${String(label)}"`);
          }
        }
      } catch {
        fail(`test case ${testCase.id}`, "structured json failed to parse");
      }
    } else {
      if (!testCase.input_data.trim() && !testCase.expected_output.trim())
        fail(`test case ${testCase.id}`, "input and expected output are both empty");
    }
  }
}

// Task 45: collections must not be empty and must only reference published problems.
const { data: collections, error: collectionsError } = await supabase
  .from("coding_collections")
  .select("id, slug, is_published, name");
if (collectionsError) fail("coding collections query", collectionsError.message);
const publishedCollectionIds = (collections ?? []).filter((c) => c.is_published).map((c) => c.id);
if (publishedCollectionIds.length) {
  const { data: collectionLinks, error: collectionLinksError } = await supabase
    .from("coding_collection_problems")
    .select("collection_id, problem_id")
    .in("collection_id", publishedCollectionIds);
  if (collectionLinksError) fail("coding collection problems query", collectionLinksError.message);
  const problemsByCollection = new Map<string, string[]>();
  for (const link of collectionLinks ?? []) {
    const list = problemsByCollection.get(link.collection_id) ?? [];
    list.push(link.problem_id);
    problemsByCollection.set(link.collection_id, list);
  }
  for (const collection of collections ?? []) {
    if (!collection.is_published) continue;
    const members = problemsByCollection.get(collection.id) ?? [];
    if (members.length === 0)
      fail(`collection ${collection.slug}`, "published collection is empty");
    for (const pid of members) {
      if (!problemIds.includes(pid))
        fail(`collection ${collection.slug}`, "references an unpublished or missing problem");
    }
  }
}

const topicIds = [...new Set((links ?? []).map((link) => link.topic_id))];
const { data: topics, error: topicsError } = topicIds.length
  ? await supabase.from("topics").select("id").in("id", topicIds)
  : { data: [], error: null };
if (topicsError) fail("coding topics query", topicsError.message);
const topicSet = new Set((topics ?? []).map((topic) => topic.id));
for (const link of links ?? []) {
  if (!problemIds.includes(link.problem_id))
    fail(
      `topic link ${link.problem_id}`,
      "references an unpublished or missing problem",
    );
  if (!topicSet.has(link.topic_id))
    fail(`topic link ${link.problem_id}`, "references a missing topic");
}

if (failures.length > 0) {
  console.error(`Coding integrity failed with ${failures.length} issue(s):`);
  for (const issue of failures) console.error(`- ${issue}`);
  process.exit(1);
}
process.stdout.write(
  `Coding integrity passed: ${published.length} published problem(s), ${(cases ?? []).length} test case(s), ${(links ?? []).length} topic link(s), ${(collections ?? []).length} collection(s).\n`,
);

function fail(scope: string, message: string): void {
  failures.push(`${scope}: ${message}`);
}
