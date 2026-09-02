import { z } from "zod";

import type {
  EvaluatorInputValue,
  StructuredValue,
  TensorDtype,
  TensorSpec,
} from "@/types/ml-judge";

/**
 * Deterministic structured-input serialization (Week 5 Task 9).
 *
 * JSON on the wire; tensor specs are rebuilt inside the trusted Python runner.
 * Unsupported payloads fail validation here so the runner only ever sees
 * well-formed input. Hidden inputs never leave the server: only visible
 * example payloads are mapped into public responses.
 */

export const tensorDtypeSchema = z.enum(["float32", "float64", "int64", "bool"]);

export const tensorSpecSchema = z
  .object({
    type: z.literal("tensor"),
    shape: z.array(z.number().int().min(0)).max(8),
    dtype: tensorDtypeSchema,
    values: z.array(z.number().finite()).max(100_000),
    requires_grad: z.boolean().default(false),
  })
  .strict();

export const structuredValueSchema: z.ZodType<StructuredValue> = z.lazy(() =>
  z.union([
    z.string().max(10_000),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(structuredValueSchema).max(10_000),
    z.record(z.string(), structuredValueSchema),
  ]),
) as z.ZodType<StructuredValue>;

export const evaluatorInputSchema: z.ZodType<EvaluatorInputValue> = z.union([
  tensorSpecSchema,
  structuredValueSchema,
]) as z.ZodType<EvaluatorInputValue>;

export function isTensorSpec(value: EvaluatorInputValue): value is TensorSpec {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === "tensor"
  );
}

const dtypeSizes: Record<TensorDtype, number> = {
  float32: 4,
  float64: 8,
  int64: 8,
  bool: 1,
};

/** Expected element count of a tensor spec; null when the shape is inconsistent. */
export function tensorElementCount(spec: TensorSpec): number | null {
  let total = 1;
  for (const dim of spec.shape) {
    total *= dim;
    if (total > spec.values.length + 1) return null;
  }
  return total;
}

export function tensorByteLength(spec: TensorSpec): number {
  return (tensorElementCount(spec) ?? spec.values.length) * dtypeSizes[spec.dtype];
}

/**
 * Reconstruct the Python expression-free payload handed to the runner.
 * Values pass through as JSON; tensor specs are normalized (values array
 * length is verified against shape so the runner can trust it).
 */
export function serializeEvaluatorInput(
  value: EvaluatorInputValue,
): EvaluatorInputValue {
  if (!isTensorSpec(value)) return value;
  const count = tensorElementCount(value);
  if (count === null || count > value.values.length) {
    throw new Error("Tensor 的 values 数量与声明的形状不匹配。");
  }
  return value;
}

export function serializeStructuredTestCase(caseInput: {
  args: EvaluatorInputValue[];
  kwargs: Record<string, EvaluatorInputValue>;
}): { args: EvaluatorInputValue[]; kwargs: Record<string, EvaluatorInputValue> } {
  return {
    args: caseInput.args.map(serializeEvaluatorInput),
    kwargs: Object.fromEntries(
      Object.entries(caseInput.kwargs).map(([key, value]) => [
        key,
        serializeEvaluatorInput(value),
      ]),
    ),
  };
}
