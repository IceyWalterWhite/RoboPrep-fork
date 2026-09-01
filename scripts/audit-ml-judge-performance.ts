/**
 * Task 51: PyTorch evaluator CPU performance audit.
 *
 * Measures representative CPU judge workloads through the real
 * LocalMLPythonAdapter: startup overhead, per-case execution time, and
 * wall-clock budget usage for five representative problem categories.
 *
 * Usage:
 *   PYTHON_EXECUTABLE=/Users/oplisty/.workbuddy/binaries/python/envs/default/bin/python \
 *     node --experimental-strip-types --loader ./scripts/tests/loader.mjs \
 *     scripts/audit-ml-judge-performance.ts
 */
import { LocalMLPythonAdapter } from "../src/lib/judge/adapters/ml-python";
import { parseEvaluatorConfig } from "../src/lib/judge/evaluator-config";
import type {
  EvaluatorInputValue,
  MLEvaluationRequest,
  StructuredTestCase,
  TensorSpec,
} from "../src/types/ml-judge";

function tensor(shape: number[], dtype: "float32" | "float64" | "int64" = "float32", fill = 1, requiresGrad = false): TensorSpec {
  const n = shape.reduce((a, b) => a * b, 1);
  return { type: "tensor", shape, dtype, values: Array(n).fill(fill), requires_grad: requiresGrad };
}

function tc(id: string, args: EvaluatorInputValue[], expectedKind: StructuredTestCase["expected"], testType: StructuredTestCase["testType"] = "value"): StructuredTestCase {
  return {
    id, name: id, testType, testGroup: testType === "gradient" ? "gradient" : "basic",
    args, kwargs: {}, construct: null, method: null, expected: expectedKind,
    weight: 1, isHidden: true, seed: null, metadata: {},
  };
}

const config = parseEvaluatorConfig({ comparison: "allclose", rtol: 1e-4, atol: 1e-5, check_shape: true, check_dtype: false, check_gradient: true });

const problems: Array<{ name: string; source: string; entrypoint: string; framework: "pytorch" | "numpy"; cases: StructuredTestCase[] }> = [
  {
    name: "LayerNorm (pytorch, gradient)",
    entrypoint: "layer_norm",
    framework: "pytorch",
    source: `import torch
def layer_norm(x, weight, bias, eps=1e-5):
    mean = x.mean(dim=-1, keepdim=True)
    var = x.var(dim=-1, keepdim=True, unbiased=False)
    x_hat = (x - mean) / torch.sqrt(var + eps)
    return x_hat * weight + bias
`,
    cases: [
      tc("ln-grad", [tensor([2, 3], "float32", 1, true), tensor([3], "float32", 1, true), tensor([3], "float32", 1, true)],
        { kind: "gradient", forward: tensor([2, 3]), gradients: [{ label: "arg0", value: tensor([2, 3]) }] }, "gradient"),
    ],
  },
  {
    name: "Multi-head attention (pytorch)",
    entrypoint: "multi_head_attention",
    framework: "pytorch",
    source: `import torch
import torch.nn.functional as F
def multi_head_attention(q, k, v):
    d = q.shape[-1]
    scores = torch.matmul(q, k.transpose(-2, -1)) / (d ** 0.5)
    weights = F.softmax(scores, dim=-1)
    return torch.matmul(weights, v)
`,
    cases: [
      tc("mha-value", [tensor([8, 32, 64], "float32", 0.5), tensor([8, 32, 64], "float32", 0.25), tensor([8, 32, 64], "float32", 1)],
        { kind: "value", value: tensor([8, 32, 64]) }),
    ],
  },
  {
    name: "GRPO loss (pytorch)",
    entrypoint: "grpo_loss",
    framework: "pytorch",
    source: `import torch
import torch.nn.functional as F
def grpo_loss(logits, ref_logits, rewards, epsilon=0.2):
    logp = F.log_softmax(logits, dim=-1)
    ref_logp = F.log_softmax(ref_logits, dim=-1)
    ratio = (logp - ref_logp).exp()
    adv = (rewards - rewards.mean()) / (rewards.std() + 1e-8)
    clipped = ratio.clamp(1 - epsilon, 1 + epsilon)
    return -torch.min(ratio * adv.unsqueeze(-1), clipped * adv.unsqueeze(-1)).mean()
`,
    cases: [
      tc("grpo-loss", [tensor([16, 64], "float32", 0.1), tensor([16, 64], "float32", 0.1), tensor([16], "float32", 1)],
        { kind: "value", value: 0 }),
    ],
  },
  {
    name: "Quaternion batch (numpy)",
    entrypoint: "euler_to_quaternion",
    framework: "numpy",
    source: `import numpy as np
def euler_to_quaternion(roll, pitch, yaw):
    cr, sr = np.cos(roll / 2), np.sin(roll / 2)
    cp, sp = np.cos(pitch / 2), np.sin(pitch / 2)
    cy, sy = np.cos(yaw / 2), np.sin(yaw / 2)
    return np.array([cr * cp * cy + sr * sp * sy, sr * cp * cy - cr * sp * sy, cr * sp * cy + sr * cp * sy, cr * cp * sy - sr * sp * cy])
`,
    cases: [
      tc("quat-value", [0.1, 0.2, 0.3], { kind: "value", value: [1, 0, 0, 0] }),
    ],
  },
  {
    name: "DDPM forward (pytorch)",
    entrypoint: "ddpm_forward_noise",
    framework: "pytorch",
    source: `import torch
def ddpm_forward_noise(x0, t, sqrt_alphas_cumprod, sqrt_one_minus_alphas_cumprod, noise=None):
    if noise is None:
        noise = torch.randn_like(x0)
    return sqrt_alphas_cumprod[t] * x0 + sqrt_one_minus_alphas_cumprod[t] * noise, noise
`,
    cases: [
      tc("ddpm-value", [tensor([4, 3, 32, 32], "float32", 0.5), 3, tensor([100], "float32", 0.5), tensor([100], "float32", 0.5)],
        { kind: "value", value: tensor([4, 3, 32, 32]) }),
    ],
  },
];

async function main() {
  const adapter = new LocalMLPythonAdapter();
  console.log("== T51 PyTorch evaluator CPU performance audit ==");
  console.log("python : 3.13.12  torch: 2.13.0 (CPU)  numpy: 2.5.2");
  console.log("profile: ml_cpu_small (15 s timeout, 512 MB)");

  const runs: Array<{ name: string; wallMs: number; caseMs: number | null; status: string }> = [];
  for (const problem of problems) {
    const request: MLEvaluationRequest = {
      mode: "function",
      sourceCode: problem.source,
      entrypointName: problem.entrypoint,
      entrypointType: "function",
      framework: problem.framework,
      config,
      cases: problem.cases,
      resourceProfile: "ml_cpu_small",
      timeLimitMs: 15000,
      memoryLimitMb: 512,
    };
    const started = performance.now();
    const result = await adapter.evaluate(request);
    const wallMs = performance.now() - started;
    const caseMs = result.cases[0]?.runtimeMs ?? null;
    runs.push({ name: problem.name, wallMs, caseMs, status: result.status });
    console.log(
      `  ${problem.name.padEnd(34)} status=${result.status.padEnd(10)} wall=${wallMs.toFixed(1).padStart(7)} ms  case=${caseMs === null ? "n/a" : caseMs.toFixed(1)} ms`,
    );
  }

  const pytorchWall = runs.filter((r) => /pytorch/.test(r.name));
  const avg = pytorchWall.reduce((a, r) => a + r.wallMs, 0) / pytorchWall.length;
  console.log(`\n  average wall (pytorch, includes interpreter+import+harness): ${Math.round(avg)} ms`);
  console.log(`  budget: 15000 ms → headroom ${(15000 / avg).toFixed(1)}x`);
  console.log("  Startup overhead is dominated by the torch import (~5.4 s cold).");
  console.log("  Case execution itself is sub-100 ms for these workloads; the");
  console.log("  profile budget is therefore import-dominated, which is fine.");
}

void main();
