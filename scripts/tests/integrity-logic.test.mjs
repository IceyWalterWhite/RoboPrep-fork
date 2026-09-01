/**
 * Task 43: logic tests for the extended coding-integrity checks.
 *
 * Mirrors the data-validation rules in scripts/check-coding-integrity.ts as a
 * pure function over a problem / test-case dataset so the rules can be
 * verified without a live database (offline + deterministic, per Task 55).
 *
 * Run: pnpm test  (or node --test scripts/tests/*.test.mjs)
 */
import assert from "node:assert/strict";
import test from "node:test";

const VALID_EVALUATION_MODES = ["program", "function", "class"];
const VALID_TEST_TYPES = ["example", "value", "shape", "dtype", "gradient", "exception", "performance"];
const VALID_TEST_GROUPS = ["basic", "edge", "numerical", "shape", "gradient", "performance"];
const VALID_EXPECTED_KINDS = ["value", "shape", "dtype", "gradient", "exception", "performance"];
const FRAMEWORKS = ["python", "numpy", "pytorch"];
const PROFILES = ["standard_python", "ml_cpu_small", "ml_cpu_medium"];
const GRAD_LABEL_RE = /^(arg\d+|[a-zA-Z_]\w*|param:[a-zA-Z_]\w*)$/;

function validate({ problems, cases, collections, links }) {
  const failures = [];
  const published = problems.filter((p) => p.is_published);
  const slugs = new Set();
  for (const problem of published) {
    if (slugs.has(problem.slug)) failures.push(`duplicate slug ${problem.slug}`);
    slugs.add(problem.slug);
    if (!VALID_EVALUATION_MODES.includes(problem.evaluation_mode))
      failures.push(`${problem.slug}: bad evaluation_mode`);
    if (!problem.starter_code?.trim()) failures.push(`${problem.slug}: no starter`);
    if (problem.evaluation_mode === "function" || problem.evaluation_mode === "class") {
      if (problem.entrypoint_type !== problem.evaluation_mode)
        failures.push(`${problem.slug}: entrypoint_type mismatch`);
      if (!problem.entrypoint_name?.trim()) failures.push(`${problem.slug}: no entrypoint_name`);
      if (!FRAMEWORKS.includes(problem.framework)) failures.push(`${problem.slug}: bad framework`);
      if (!PROFILES.includes(problem.resource_profile)) failures.push(`${problem.slug}: bad profile`);
      if (!problem.evaluator_config) failures.push(`${problem.slug}: no evaluator_config`);
      else if (problem.evaluator_config.comparison === "bogus") failures.push(`${problem.slug}: bad config`);
    }
    const pc = cases.filter((c) => c.problem_id === problem.id);
    const visible = pc.filter((c) => !c.is_hidden);
    const hidden = pc.filter((c) => c.is_hidden);
    if (visible.length === 0) failures.push(`${problem.slug}: no visible test`);
    if (hidden.length < 3) failures.push(`${problem.slug}: need >=3 hidden, got ${hidden.length}`);
    for (const c of pc) {
      if (problem.evaluation_mode !== "program") {
        if (!VALID_TEST_TYPES.includes(c.test_type)) failures.push(`case ${c.id}: bad test_type`);
        if (!VALID_TEST_GROUPS.includes(c.test_group)) failures.push(`case ${c.id}: bad test_group`);
        const e = c.expected_json;
        if (!e || !VALID_EXPECTED_KINDS.includes(e.kind)) failures.push(`case ${c.id}: bad kind`);
        if (e?.kind === "gradient") {
          if (!Array.isArray(e.gradients)) failures.push(`case ${c.id}: no gradients`);
          else
            for (const g of e.gradients)
              if (!GRAD_LABEL_RE.test(g.label ?? "")) failures.push(`case ${c.id}: bad grad label ${g.label}`);
        }
      } else if (!c.input_data.trim() && !c.expected_output.trim()) {
        failures.push(`case ${c.id}: empty program case`);
      }
    }
  }
  for (const collection of collections.filter((c) => c.is_published)) {
    const members = links.filter((l) => l.collection_id === collection.id);
    if (members.length === 0) failures.push(`collection ${collection.slug}: empty`);
    for (const m of members)
      if (!published.some((p) => p.id === m.problem_id))
        failures.push(`collection ${collection.slug}: refs unpublished problem`);
  }
  return failures;
}

const goodProblem = {
  id: "p1", slug: "implement-layernorm", difficulty: "medium", starter_code: "def f():\n    pass\n",
  evaluation_mode: "function", entrypoint_type: "function", entrypoint_name: "layer_norm",
  framework: "pytorch", resource_profile: "ml_cpu_small", evaluator_config: { comparison: "allclose" },
  is_published: true,
};
const goodCases = [
  { id: "c1", problem_id: "p1", is_hidden: false, test_type: "example", test_group: "basic", expected_json: { kind: "value" } },
  { id: "c2", problem_id: "p1", is_hidden: true, test_type: "value", test_group: "edge", expected_json: { kind: "value" } },
  { id: "c3", problem_id: "p1", is_hidden: true, test_type: "shape", test_group: "shape", expected_json: { kind: "shape" } },
  { id: "c4", problem_id: "p1", is_hidden: true, test_type: "gradient", test_group: "gradient",
    expected_json: { kind: "gradient", gradients: [{ label: "arg0", value: {} }, { label: "param:w", value: {} }] } },
];
const programProblem = {
  id: "p2", slug: "week4-program", difficulty: "easy", starter_code: "x=input()\n",
  evaluation_mode: "program", entrypoint_type: null, entrypoint_name: null,
  framework: null, resource_profile: "standard_python", evaluator_config: null, is_published: true,
};
const programCases = [
  { id: "c5", problem_id: "p2", is_hidden: false, input_data: "1", expected_output: "2", test_type: null, test_group: null, expected_json: null },
  { id: "c6", problem_id: "p2", is_hidden: true, input_data: "2", expected_output: "4", test_type: null, test_group: null, expected_json: null },
  { id: "c7", problem_id: "p2", is_hidden: true, input_data: "3", expected_output: "6", test_type: null, test_group: null, expected_json: null },
  { id: "c8", problem_id: "p2", is_hidden: true, input_data: "4", expected_output: "8", test_type: null, test_group: null, expected_json: null },
];

test("good mixed dataset (function + program) passes", () => {
  const problems = [goodProblem, programProblem];
  const cases = [...goodCases, ...programCases];
  const collections = [{ id: "col1", slug: "transformer-essentials", is_published: true }];
  const links = [{ collection_id: "col1", problem_id: "p1" }];
  assert.deepEqual(validate({ problems, cases, collections, links }), []);
});

test("bad framework and missing entrypoint are caught", () => {
  const bad = { ...goodProblem, framework: "tensorflow", entrypoint_name: "" };
  const failures = validate({ problems: [bad], cases: goodCases, collections: [], links: [] });
  assert.ok(failures.some((f) => f.includes("bad framework")));
  assert.ok(failures.some((f) => f.includes("no entrypoint_name")));
});

test("insufficient hidden tests are caught", () => {
  const cases = goodCases.filter((c) => c.id !== "c4");
  const failures = validate({ problems: [goodProblem], cases, collections: [], links: [] });
  assert.ok(failures.some((f) => f.includes("need >=3 hidden")));
});

test("invalid gradient label is caught", () => {
  const cases = goodCases.map((c) =>
    c.id === "c4"
      ? { ...c, expected_json: { kind: "gradient", gradients: [{ label: "argx!!", value: {} }] } }
      : c);
  const failures = validate({ problems: [goodProblem], cases, collections: [], links: [] });
  assert.ok(failures.some((f) => f.includes("bad grad label")));
});

test("empty published collection is caught", () => {
  const collections = [{ id: "col2", slug: "empty-collection", is_published: true }];
  const failures = validate({ problems: [goodProblem], cases: goodCases, collections, links: [] });
  assert.ok(failures.some((f) => f.includes("empty")));
});

test("program case with empty input and output is caught", () => {
  const cases = programCases.map((c, i) =>
    i === 0 ? { ...c, input_data: "", expected_output: "" } : c);
  const failures = validate({ problems: [programProblem], cases, collections: [], links: [] });
  assert.ok(failures.some((f) => f.includes("empty program case")));
});
