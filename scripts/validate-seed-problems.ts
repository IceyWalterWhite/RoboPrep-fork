/**
 * Validate seed_week5_function_problems.sql against the real ML judge.
 *
 * Reads the extracted seed JSON (produced by the Python extractor), builds an
 * MLEvaluationRequest per problem, runs each problem's solution_code through
 * LocalMLPythonAdapter, and reports whether every test case passes.
 *
 * Usage:
 *   PYTHON_EXECUTABLE=/Users/oplisty/.workbuddy/binaries/python/envs/default/bin/python \
 *     pnpm tsx scripts/validate-seed-problems.ts
 */
import { readFileSync } from "node:fs";
import { LocalMLPythonAdapter } from "../src/lib/judge/adapters/ml-python";
import { parseEvaluatorConfig } from "../src/lib/judge/evaluator-config";
import type {
  EvaluatorInputValue,
  ExpectedValue,
  MLEvaluationRequest,
  StructuredTestCase,
} from "../src/types/ml-judge";

interface SeedProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  starter_code: string | null;
  solution_code: string | null;
  evaluation_mode: string;
  entrypoint_type: string;
  entrypoint_name: string;
  framework: string;
  resource_profile: string;
  time_limit_ms: string;
  memory_limit_mb: string;
  evaluator_config: string;
}

interface SeedTestCase {
  id: string;
  problem_id: string;
  name: string;
  test_type: string;
  test_group: string;
  is_hidden: string;
  weight: string;
  order_index: string;
  input_json: string | null;
  expected_json: string | null;
}

interface SeedData {
  problems: SeedProblem[];
  testCases: SeedTestCase[];
}

function parseBool(v: string | undefined): boolean {
  return v === "true";
}

function parseNum(v: string | undefined, fallback = 0): number {
  if (v === undefined || v === "null") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseConfig(json: string) {
  try {
    return parseEvaluatorConfig(JSON.parse(json));
  } catch {
    return parseEvaluatorConfig(null);
  }
}

function buildExpected(expectedJson: string): ExpectedValue {
  const e = JSON.parse(expectedJson);
  // kind/value/shape/dtype/exception/gradient forms
  return e as ExpectedValue;
}

function buildTestCase(tc: SeedTestCase): StructuredTestCase {
  const input = tc.input_json ? JSON.parse(tc.input_json) : {};
  const args: EvaluatorInputValue[] = input.args ?? [];
  const kwargs: Record<string, EvaluatorInputValue> = input.kwargs ?? {};
  const construct = input.construct ?? null;
  const method = input.method ?? null;
  const seed = input.seed ?? null;
  const expected = buildExpected(tc.expected_json ?? "{}");
  return {
    id: tc.id,
    name: tc.name,
    testType: (tc.test_type as StructuredTestCase["testType"]) ?? "value",
    testGroup: (tc.test_group as StructuredTestCase["testGroup"]) ?? "basic",
    args,
    kwargs,
    construct,
    method,
    expected,
    weight: parseNum(tc.weight, 1),
    isHidden: parseBool(tc.is_hidden),
    seed,
    metadata: {},
  };
}

async function main() {
  const data = JSON.parse(readFileSync("/tmp/seed_data_fixed.json", "utf8")) as SeedData;
  const byProblem = new Map<string, SeedTestCase[]>();
  for (const tc of data.testCases) {
    const list = byProblem.get(tc.problem_id) ?? [];
    list.push(tc);
    byProblem.set(tc.problem_id, list);
  }

  const adapter = new LocalMLPythonAdapter();
  let problemFailures = 0;
  let caseFailures = 0;

  for (const problem of data.problems) {
    const tcs = byProblem.get(problem.id) ?? [];
    if (tcs.length === 0) {
      console.log(`  ${problem.slug}: NO TEST CASES`);
      problemFailures += 1;
      continue;
    }
    const request: MLEvaluationRequest = {
      mode: problem.evaluation_mode === "class" ? "class" : "function",
      sourceCode: problem.solution_code ?? "",
      entrypointName: problem.entrypoint_name,
      entrypointType: problem.entrypoint_type === "class" ? "class" : "function",
      framework: problem.framework as MLEvaluationRequest["framework"],
      config: parseConfig(problem.evaluator_config),
      cases: tcs.map(buildTestCase),
      resourceProfile: problem.resource_profile as MLEvaluationRequest["resourceProfile"],
      timeLimitMs: parseNum(problem.time_limit_ms, 15000),
      memoryLimitMb: parseNum(problem.memory_limit_mb, 512),
    };

    let result;
    try {
      result = await adapter.evaluate(request);
    } catch (e) {
      console.log(`  ${problem.slug}: ADAPTER ERROR ${String(e)}`);
      problemFailures += 1;
      continue;
    }

    const failedCases = result.cases.filter((c) => c.status !== "accepted");
    if (result.entrypointError) {
      console.log(`  FAIL ${problem.slug}: entrypoint error ${result.entrypointError.category} — ${result.entrypointError.message.slice(0, 80)}`);
      problemFailures += 1;
      caseFailures += result.cases.length;
      continue;
    }
    if (result.status !== "accepted") {
      const groupStr = result.groups.map((g) => `${g.group} ${g.passed}/${g.total}`).join(" ");
      console.log(`  FAIL ${problem.slug}: status=${result.status} [${groupStr}]`);
      for (const fc of failedCases) {
        const reason =
          fc.value?.passed === false
            ? `value(maxErr=${fc.value.maxAbsError?.toExponential(2) ?? "?"})`
            : fc.shape?.passed === false
              ? "shape"
              : fc.gradient?.passed === false
                ? "gradient"
                : fc.exception?.passed === false
                  ? "exception"
                  : fc.message ?? fc.errorCategory ?? "?";
        console.log(`       case ${fc.name ?? fc.testCaseId}: ${reason}`);
      }
      problemFailures += 1;
      caseFailures += failedCases.length;
    } else {
      console.log(`  ok   ${problem.slug} (${tcs.length} cases, accepted)`);
    }
  }

  console.log(`\nProblems: ${data.problems.length}, failing: ${problemFailures}, failing cases: ${caseFailures}`);
  process.exit(problemFailures === 0 ? 0 : 1);
}

void main();
