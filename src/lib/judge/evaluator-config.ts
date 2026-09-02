import { z } from "zod";

import type { EvaluatorConfig } from "@/types/ml-judge";

/**
 * Server-authoritative evaluator configuration.
 *
 * The browser never supplies these values; they are read from
 * `coding_problems.evaluator_config`, validated here, and merged with safe
 * defaults before reaching the judge. Unknown keys are rejected so a malformed
 * config cannot smuggle instructions to the runner.
 */

export const comparisonModeSchema = z.enum([
  "exact",
  "allclose",
  "absolute_error",
  "relative_error",
]);

export const evaluatorConfigSchema = z
  .object({
    comparison: comparisonModeSchema.default("allclose"),
    rtol: z.number().finite().min(0).max(1).default(1e-5),
    atol: z.number().finite().min(0).max(1).default(1e-6),
    check_shape: z.boolean().default(true),
    check_dtype: z.boolean().default(true),
    check_gradient: z.boolean().default(false),
  })
  .strict();

export type RawEvaluatorConfig = z.infer<typeof evaluatorConfigSchema>;

export const frameworkAllowlist = ["python", "numpy", "pytorch"] as const;

export const importPolicy: Record<(typeof frameworkAllowlist)[number], string[]> = {
  python: [
    "math",
    "statistics",
    "collections",
    "itertools",
    "functools",
    "heapq",
    "bisect",
  ],
  numpy: [
    "math",
    "statistics",
    "collections",
    "itertools",
    "functools",
    "heapq",
    "bisect",
    "numpy",
  ],
  pytorch: [
    "math",
    "statistics",
    "collections",
    "itertools",
    "functools",
    "heapq",
    "bisect",
    "numpy",
    "torch",
  ],
};

/**
 * Server-owned resource profiles (Week 5 Task 41). Clients cannot pick
 * arbitrary limits; a problem selects one of these profiles by name.
 */
export interface ResourceProfileSpec {
  timeoutMs: number;
  memoryLimitMb: number;
  description: string;
}

export const resourceProfiles: Record<string, ResourceProfileSpec> = {
  standard_python: {
    timeoutMs: 5_000,
    memoryLimitMb: 256,
    description: "纯 Python 程序题判题，适用于算法题的短时限环境。",
  },
  ml_cpu_small: {
    timeoutMs: 15_000,
    memoryLimitMb: 512,
    description: "NumPy / 小型 PyTorch CPU 任务（包含导入和小张量计算）。",
  },
  ml_cpu_medium: {
    timeoutMs: 40_000,
    memoryLimitMb: 1024,
    description: "带小批量梯度检查的 PyTorch CPU 任务。",
  },
};

export function resolveResourceProfile(
  name: string | null | undefined,
): ResourceProfileSpec {
  return (
    resourceProfiles[name ?? "standard_python"] ?? resourceProfiles.standard_python
  );
}

/**
 * Merge a stored `evaluator_config` jsonb value with safe defaults.
 * Invalid payloads fall back to defaults rather than trusting partial data.
 */
export function parseEvaluatorConfig(raw: unknown): EvaluatorConfig {
  const result = evaluatorConfigSchema.safeParse(raw ?? {});
  if (!result.success) return defaultEvaluatorConfig();
  return result.data;
}

export function defaultEvaluatorConfig(): EvaluatorConfig {
  return {
    comparison: "allclose",
    rtol: 1e-5,
    atol: 1e-6,
    check_shape: true,
    check_dtype: true,
    check_gradient: false,
  };
}

/** PyTorch problems get slightly looser tolerances by default. */
export function defaultConfigForFramework(framework: string | null): EvaluatorConfig {
  if (framework === "pytorch") {
    return { ...defaultEvaluatorConfig(), rtol: 1e-4, atol: 1e-5 };
  }
  return defaultEvaluatorConfig();
}
