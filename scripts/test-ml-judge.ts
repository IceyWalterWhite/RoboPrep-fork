/**
 * End-to-end ML evaluator smoke test (Week 5 Task 56).
 *
 * Runs the real local Python adapter against representative function problems
 * and asserts expected statuses — no Supabase, no network.
 *
 * Scenarios:
 *   - correct function        → accepted
 *   - wrong value             → wrong_answer
 *   - wrong shape             → wrong_answer (shape check)
 *   - missing entrypoint      → wrong_answer + entrypointError category
 *   - incorrect gradient      → wrong_answer (gradient check)
 *   - timeout                 → time_limit_exceeded
 *
 * Requires a Python 3 interpreter with numpy (+ torch for gradient cases).
 * Point PYTHON_EXECUTABLE at the managed venv, e.g.:
 *
 *   PYTHON_EXECUTABLE=/Users/oplisty/.workbuddy/binaries/python/envs/default/bin/python \
 *     pnpm test:ml-judge
 */
import { LocalMLPythonAdapter } from "../src/lib/judge/adapters/ml-python";
import type { MLEvaluationRequest } from "../src/types/ml-judge";

const adapter = new LocalMLPythonAdapter();

const baseRequest: MLEvaluationRequest = {
  mode: "function",
  sourceCode: "",
  entrypointName: "double",
  entrypointType: "function",
  framework: "python",
  resourceProfile: "ml_cpu_small",
  timeLimitMs: 15_000,
  memoryLimitMb: 512,
  config: { comparison: "allclose", rtol: 1e-5, atol: 1e-6, check_shape: true, check_dtype: false, check_gradient: false },
  cases: [
    {
      id: "c1",
      name: "positive",
      testType: "value",
      testGroup: "basic",
      isHidden: false,
      weight: 1,
      seed: 1,
      args: [[2, 3]],
      kwargs: {},
      construct: null,
      method: null,
      expected: { kind: "value", value: [4, 6] },
      metadata: {},
    },
    {
      id: "c2",
      name: "negative",
      testType: "value",
      testGroup: "edge",
      isHidden: false,
      weight: 1,
      seed: 2,
      args: [[-1, 0]],
      kwargs: {},
      construct: null,
      method: null,
      expected: { kind: "value", value: [-2, 0] },
      metadata: {},
    },
  ],
};

let failures = 0;

async function check(label: string, actual: string, expected: string) {
  const pass = actual === expected;
  if (!pass) failures += 1;
  process.stdout.write(`  ${pass ? "ok" : "FAIL"}  ${label}: expected ${expected}, got ${actual}\n`);
}

async function run() {
  process.stdout.write("ML judge smoke test\n");

  // 1. Correct function.
  const correct = await adapter.evaluate({
    ...baseRequest,
    sourceCode: "def double(x):\n    return [v * 2 for v in x]\n",
  });
  await check("correct function", correct.status, "accepted");

  // 2. Wrong value.
  const wrongValue = await adapter.evaluate({
    ...baseRequest,
    sourceCode: "def double(x):\n    return [v + 1 for v in x]\n",
  });
  await check("wrong value", wrongValue.status, "wrong_answer");

  // 3. Wrong shape.
  const wrongShape = await adapter.evaluate({
    ...baseRequest,
    sourceCode: "def double(x):\n    return [x[0] * 2]\n", // returns rank-1 of length 1 instead of 2
  });
  await check("wrong shape", wrongShape.status, "wrong_answer");
  const shapeCase = wrongShape.cases[0];
  if (shapeCase?.shape && shapeCase.shape.passed === false) {
    process.stdout.write("  ok  wrong shape flagged by shape check\n");
  } else {
    failures += 1;
    process.stdout.write("  FAIL  wrong shape not flagged by shape check\n");
  }

  // 4. Missing entrypoint.
  const missing = await adapter.evaluate({
    ...baseRequest,
    sourceCode: "def triple(x):\n    return [v * 3 for v in x]\n",
  });
  await check("missing entrypoint", missing.status, "wrong_answer");
  if (missing.entrypointError?.category === "entrypoint_missing") {
    process.stdout.write("  ok  missing entrypoint categorized\n");
  } else {
    failures += 1;
    process.stdout.write(`  FAIL  missing entrypoint category: ${missing.entrypointError?.category ?? "none"}\n`);
  }

  // 5. Timeout: an infinite loop.
  const timeout = await adapter.evaluate({
    ...baseRequest,
    timeLimitMs: 1500,
    sourceCode: "def double(x):\n    while True:\n        pass\n",
  });
  await check("timeout", timeout.status, "time_limit_exceeded");

  // 6. Incorrect gradient: forward is correct but the backward graph is wrong.
  //    `x.detach() * x` equals x**2 in value, but its gradient is x instead of 2x.
  const gradRequest: MLEvaluationRequest = {
    mode: "function",
    sourceCode: "",
    entrypointName: "square",
    entrypointType: "function",
    framework: "pytorch",
    resourceProfile: "ml_cpu_small",
    timeLimitMs: 15_000,
    memoryLimitMb: 512,
    config: { comparison: "allclose", rtol: 1e-5, atol: 1e-6, check_shape: true, check_dtype: false, check_gradient: true },
    cases: [
      {
        id: "g1",
        name: "square gradient",
        testType: "gradient",
        testGroup: "gradient",
        isHidden: false,
        weight: 1,
        seed: 3,
        args: [{ type: "tensor", shape: [2], dtype: "float32", values: [2, 3], requires_grad: true }],
        kwargs: {},
        construct: null,
        method: null,
        expected: {
          kind: "gradient",
          forward: { type: "tensor", shape: [2], dtype: "float32", values: [4, 9], requires_grad: false },
          gradients: [{ label: "arg0", value: { type: "tensor", shape: [2], dtype: "float32", values: [4, 6], requires_grad: false } }],
        },
        metadata: {},
      },
    ],
  };
  const gradCorrect = await adapter.evaluate({
    ...gradRequest,
    sourceCode: "def square(x):\n    return x * x\n",
  });
  await check("correct gradient", gradCorrect.status, "accepted");
  const gradWrong = await adapter.evaluate({
    ...gradRequest,
    sourceCode: "def square(x):\n    return x.detach() * x\n",
  });
  await check("incorrect gradient", gradWrong.status, "wrong_answer");
  const gradOut = gradWrong.cases[0];
  if (gradOut?.gradient && gradOut.gradient.passed === false) {
    process.stdout.write("  ok  incorrect gradient flagged by gradient check\n");
  } else {
    failures += 1;
    process.stdout.write("  FAIL  incorrect gradient not flagged by gradient check\n");
  }

  process.stdout.write(failures === 0 ? "All smoke checks passed.\n" : `${failures} check(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void run();
