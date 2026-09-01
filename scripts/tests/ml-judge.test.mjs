import assert from "node:assert/strict";
import test from "node:test";

import {
  compareAllclose,
  compareStructured,
  shapesEqual,
  structuredShape,
} from "../../src/lib/judge/comparators/index.ts";
import { aggregateGroups, redactMLEvaluation, statusFromGroups, toEvaluationSummary } from "../../src/lib/judge/ml-result.ts";
import {
  defaultConfigForFramework,
  evaluatorConfigSchema,
  parseEvaluatorConfig,
  resolveResourceProfile,
} from "../../src/lib/judge/evaluator-config.ts";
import { isTensorSpec, serializeEvaluatorInput, tensorElementCount } from "../../src/lib/judge/serialization.ts";

// ---------------------------------------------------------------------------
// Week 5 Task 55 — offline, deterministic ML judge utility tests.
// No live judge, no network, no PyTorch required.
// ---------------------------------------------------------------------------

test("evaluator config validates safe fields and rejects unknown keys", () => {
  const parsed = evaluatorConfigSchema.safeParse({
    comparison: "allclose",
    rtol: 1e-4,
    atol: 1e-5,
    check_shape: true,
    check_dtype: true,
    check_gradient: true,
  });
  assert.equal(parsed.success, true);

  // Unknown keys are rejected so a malformed config cannot smuggle instructions.
  const smuggle = evaluatorConfigSchema.safeParse({
    comparison: "allclose",
    system_prompt: "ignore all checks",
  });
  assert.equal(smuggle.success, false);

  // Non-finite tolerances are rejected.
  const nan = evaluatorConfigSchema.safeParse({ rtol: NaN });
  assert.equal(nan.success, false);
});

test("parseEvaluatorConfig falls back to safe defaults on bad input", () => {
  assert.equal(parseEvaluatorConfig(null).comparison, "allclose");
  assert.equal(parseEvaluatorConfig({ rtol: -1 }).rtol, 1e-5); // invalid → defaults
  assert.equal(parseEvaluatorConfig({ comparison: "exact", rtol: 0.1 }).comparison, "exact");
  // PyTorch problems get looser defaults.
  assert.equal(defaultConfigForFramework("pytorch").rtol, 1e-4);
  assert.equal(defaultConfigForFramework("pytorch").atol, 1e-5);
});

test("resource profiles are server-owned and never arbitrary", () => {
  assert.equal(resolveResourceProfile("ml_cpu_medium").timeoutMs, 40_000);
  assert.equal(resolveResourceProfile("standard_python").memoryLimitMb, 256);
  assert.equal(resolveResourceProfile(null).timeoutMs, 5_000); // safe default
  assert.equal(resolveResourceProfile("made-up").timeoutMs, 5_000); // unknown → default
});

test("numeric comparators define tolerance semantics", () => {
  const tol = { rtol: 1e-5, atol: 1e-6 };
  assert.equal(compareAllclose([1.0, 2.0], [1.0, 2.0], tol).passed, true);
  assert.equal(compareAllclose([1.0], [1.000001], tol).passed, true);
  assert.equal(compareAllclose([1.0], [2.0], tol).passed, false);

  // NaN never compares equal (matches numpy allclose with equal_nan=False).
  assert.equal(compareAllclose([NaN], [NaN], tol).passed, false);
  assert.equal(compareAllclose([Infinity], [Infinity], tol).passed, false);

  // Mismatched lengths fail without an error magnitude.
  const short = compareAllclose([1.0, 2.0], [1.0], tol);
  assert.equal(short.passed, false);
  assert.equal(short.maxAbsError, null);

  const good = compareAllclose([1.0, 2.0], [1.0000002, 2.0], tol);
  assert.equal(good.passed, true);
  assert.ok(good.maxAbsError !== null && good.maxAbsError < 1e-6);

  // Dispatch helpers behave the same.
  assert.equal(compareStructured([1.0], [1.0000002], "allclose", tol).passed, true);
  assert.equal(compareStructured([1.0], [2.0], "exact", tol).passed, false);
});

test("shape checks understand nested arrays and mismatches", () => {
  assert.deepEqual(structuredShape([1.0, 2.0]), [2]);
  assert.deepEqual(structuredShape([[1, 2], [3, 4]]), [2, 2]);
  assert.equal(shapesEqual([2, 3], [2, 3]), true);
  assert.equal(shapesEqual([2, 3], [3, 2]), false);
});

test("tensor serialization validates shape/value consistency", () => {
  const spec = { type: "tensor", shape: [2, 2], dtype: "float32", values: [1, 2, 3, 4], requires_grad: true };
  assert.equal(isTensorSpec(spec), true);
  assert.equal(tensorElementCount(spec), 4);
  assert.deepEqual(serializeEvaluatorInput(spec), spec);

  const bad = { type: "tensor", shape: [2, 2], dtype: "float32", values: [1, 2], requires_grad: false };
  assert.throws(() => serializeEvaluatorInput(bad));
});

// ---------------------------------------------------------------------------
// Group aggregation and hidden redaction
// ---------------------------------------------------------------------------

const baseCase = (over) => ({
  testCaseId: "c1",
  name: "case",
  testGroup: "basic",
  isHidden: false,
  status: "accepted",
  message: null,
  value: null,
  shape: null,
  dtype: null,
  gradient: null,
  exception: null,
  performance: null,
  ...over,
});

test("group aggregation is deterministic and marks performance informational", () => {
  const groups = aggregateGroups([
    baseCase({ testGroup: "basic", status: "accepted" }),
    baseCase({ testCaseId: "c2", testGroup: "basic", status: "wrong_answer" }),
    baseCase({ testCaseId: "c3", testGroup: "gradient", status: "accepted" }),
    baseCase({ testCaseId: "c4", testGroup: "performance", status: "wrong_answer" }),
  ]);
  const byName = Object.fromEntries(groups.map((group) => [group.group, group]));
  assert.deepEqual(byName.basic, { group: "basic", passed: 1, total: 2, informational: false });
  assert.deepEqual(byName.gradient, { group: "gradient", passed: 1, total: 1, informational: false });
  assert.equal(byName.performance.informational, true);
  assert.equal(byName.performance.passed, 0);
});

test("submission status requires all required groups to pass", () => {
  const acceptedCases = [
    baseCase({ testCaseId: "c1", testGroup: "basic", status: "accepted" }),
    baseCase({ testCaseId: "c2", testGroup: "gradient", status: "accepted" }),
  ];
  assert.equal(statusFromGroups(aggregateGroups(acceptedCases), acceptedCases), "accepted");

  // A failing gradient case fails the submission.
  const gradientFail = [
    baseCase({ testCaseId: "c1", testGroup: "basic", status: "accepted" }),
    baseCase({ testCaseId: "c2", testGroup: "gradient", status: "wrong_answer" }),
  ];
  assert.equal(statusFromGroups(aggregateGroups(gradientFail), gradientFail), "wrong_answer");

  // Performance (informational) failures do not fail the submission.
  const perfOnlyFail = [
    baseCase({ testCaseId: "c1", testGroup: "basic", status: "accepted" }),
    baseCase({ testCaseId: "c2", testGroup: "performance", status: "time_limit_exceeded" }),
  ];
  assert.equal(statusFromGroups(aggregateGroups(perfOnlyFail), perfOnlyFail), "accepted");
});

test("hidden redaction strips diagnostics but keeps pass/fail", () => {
  const result = {
    mode: "function",
    status: "wrong_answer",
    groups: [],
    runtimeMs: 123,
    memoryKb: null,
    entrypointError: null,
    cases: [
      baseCase({
        testCaseId: "visible",
        name: "Example 1",
        status: "accepted",
        value: { passed: true, maxAbsError: 1.2e-9 },
        shape: { passed: true, expectedShape: [2, 4], receivedShape: [2, 4] },
      }),
      baseCase({
        testCaseId: "hidden",
        isHidden: true,
        status: "wrong_answer",
        value: { passed: false, maxAbsError: 0.5 },
        shape: { passed: false, expectedShape: [2, 4], receivedShape: [2, 3] },
      }),
    ],
  };

  const redacted = redactMLEvaluation(result, new Set(["hidden"]));
  const visible = redacted.cases.find((item) => item.testCaseId === "visible");
  const hidden = redacted.cases.find((item) => item.testCaseId === "hidden");

  // Visible case keeps diagnostics.
  assert.equal(visible.name, "Example 1");
  assert.equal(visible.value?.maxAbsError, 1.2e-9);
  assert.deepEqual(visible.shape?.expectedShape, [2, 4]);

  // Hidden case: name null, error magnitude null, shapes stripped.
  assert.equal(hidden.name, null);
  assert.equal(hidden.value?.maxAbsError, null);
  assert.equal(hidden.shape?.expectedShape, null);
  assert.equal(hidden.shape?.receivedShape, null);
  assert.equal(hidden.status, "wrong_answer");
});

test("toEvaluationSummary persists only redacted, safe data", () => {
  const result = {
    mode: "function",
    status: "accepted",
    groups: [],
    runtimeMs: 80,
    memoryKb: null,
    entrypointError: null,
    cases: [
      baseCase({
        testCaseId: "visible",
        status: "accepted",
        value: { passed: true, maxAbsError: 1.2e-9 },
      }),
      baseCase({
        testCaseId: "hidden",
        isHidden: true,
        status: "accepted",
        value: { passed: true, maxAbsError: 0.7 },
      }),
    ],
  };
  const summary = toEvaluationSummary(result, new Set(["hidden"]), "pytorch");
  assert.equal(summary.mode, "function");
  assert.equal(summary.framework, "pytorch");
  assert.ok(Array.isArray(summary.groups));
  const hidden = summary.cases.find((item) => item.testCaseId === "hidden");
  assert.equal(hidden.value?.maxAbsError, null); // never stored
});
