import type { EvaluatorInputValue } from "@/types/ml-judge";
import { isTensorSpec } from "../serialization";

/**
 * Numeric tolerance comparators (Week 5 Task 10).
 *
 * Pure functions over structured values. The Python runner performs the
 * authoritative comparison during evaluation (it owns the live tensors);
 * these TS mirrors exist for server-side utilities and tests so the
 * tolerance semantics are defined once and documented.
 *
 * NaN / Inf policy: non-finite values never compare equal under `allclose`
 * (matching `numpy.allclose` with `equal_nan=False`). One-sided nulls never
 * match; matching nulls on both sides pass without contributing to error.
 */

export interface ComparisonTolerance {
  rtol: number;
  atol: number;
}

export interface NumericComparison {
  passed: boolean;
  /** Max absolute element error; null when shapes differ or a side is non-numeric. */
  maxAbsError: number | null;
}

export function compareAllclose(
  a: EvaluatorInputValue,
  b: EvaluatorInputValue,
  tolerance: ComparisonTolerance,
): NumericComparison {
  const flatA = flatten(a);
  const flatB = flatten(b);
  if (flatA.length !== flatB.length) {
    return { passed: false, maxAbsError: null };
  }
  let maxAbsError = 0;
  for (let i = 0; i < flatA.length; i += 1) {
    const x = flatA[i];
    const y = flatB[i];
    if (x === null || y === null) {
      if (x !== y) return { passed: false, maxAbsError: null };
      continue;
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { passed: false, maxAbsError: null };
    const absError = Math.abs(x - y);
    maxAbsError = Math.max(maxAbsError, absError);
    if (absError > tolerance.atol + tolerance.rtol * Math.abs(y)) {
      return { passed: false, maxAbsError };
    }
  }
  return { passed: true, maxAbsError };
}

export function compareAbsoluteError(
  a: EvaluatorInputValue,
  b: EvaluatorInputValue,
  atol: number,
): NumericComparison {
  return compareAllclose(a, b, { rtol: 0, atol });
}

export function compareRelativeError(
  a: EvaluatorInputValue,
  b: EvaluatorInputValue,
  rtol: number,
): NumericComparison {
  return compareAllclose(a, b, { rtol, atol: 0 });
}

function flatten(value: EvaluatorInputValue): Array<number | null> {
  if (isTensorSpec(value)) return value.values;
  const out: Array<number | null> = [];
  walk(value, out);
  return out;
}

function walk(value: EvaluatorInputValue, out: Array<number | null>): void {
  if (value === null) {
    out.push(null);
    return;
  }
  if (typeof value === "number") {
    out.push(value);
    return;
  }
  if (typeof value === "boolean" || typeof value === "string") {
    out.push(null);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walk(item, out);
    return;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, EvaluatorInputValue>;
    for (const key of Object.keys(record)) walk(record[key], out);
  }
}
