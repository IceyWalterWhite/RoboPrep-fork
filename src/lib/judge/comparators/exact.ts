import type { EvaluatorInputValue } from "@/types/ml-judge";
import { isTensorSpec } from "../serialization";

/**
 * Exact comparison (Week 5 Task 10).
 *
 * Structural equality over scalars, nested lists, dicts and tensor specs.
 * Tensor specs compare dtype, shape and values bit-for-bit (JSON numbers),
 * so this mode is only appropriate for integer/boolean/discrete outputs.
 */
export function compareExact(a: EvaluatorInputValue, b: EvaluatorInputValue): boolean {
  return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
}

function normalizeForCompare(value: EvaluatorInputValue): unknown {
  if (isTensorSpec(value)) {
    return { tensor: value.dtype, shape: value.shape, values: value.values };
  }
  if (Array.isArray(value)) return value.map(normalizeForCompare);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, normalizeForCompare(v as EvaluatorInputValue)]),
    );
  }
  return value;
}
