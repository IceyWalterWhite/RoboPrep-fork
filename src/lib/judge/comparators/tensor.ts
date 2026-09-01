import type { EvaluatorInputValue, TensorSpec } from "@/types/ml-judge";
import { isTensorSpec, tensorElementCount } from "../serialization";

import { compareAllclose, type ComparisonTolerance, type NumericComparison } from "./numeric";

/**
 * Tensor / shape helpers over structured values (Week 5 Tasks 10 & 11).
 *
 * `structuredShape` returns the tensor spec shape, the strict nested-list
 * shape, or `[]` for scalars. Ragged nested lists return `null` via
 * `structuredShapeStrict`, which is what the shape check uses so a malformed
 * output fails as a shape mismatch rather than throwing.
 */

export function structuredShape(value: EvaluatorInputValue): number[] | null {
  if (isTensorSpec(value)) return value.shape;
  if (Array.isArray(value)) {
    if (value.length === 0) return [0];
    const inner = structuredShape(value[0]);
    return inner === null ? null : [value.length, ...inner];
  }
  return [];
}

export function structuredShapeStrict(value: EvaluatorInputValue): number[] | null {
  if (isTensorSpec(value)) return value.shape;
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [0];
  const shapes = value.map((item) => structuredShapeStrict(item));
  const first = JSON.stringify(shapes[0]);
  if (shapes.some((shape) => JSON.stringify(shape) !== first)) return null;
  const inner = shapes[0];
  return inner === null ? null : [value.length, ...inner];
}

export function shapesEqual(expected: number[] | null, received: number[] | null): boolean {
  if (expected === null || received === null) return false;
  return JSON.stringify(expected) === JSON.stringify(received);
}

export function tensorSpecsEqual(
  a: TensorSpec,
  b: TensorSpec,
  tolerance: ComparisonTolerance,
): boolean {
  return (
    a.dtype === b.dtype &&
    JSON.stringify(a.shape) === JSON.stringify(b.shape) &&
    (tensorElementCount(a) ?? -1) === (tensorElementCount(b) ?? -2) &&
    compareAllclose(a.values, b.values, tolerance).passed
  );
}

export function compareTensorSpecs(
  a: EvaluatorInputValue,
  b: EvaluatorInputValue,
  tolerance: ComparisonTolerance,
): NumericComparison {
  if (!isTensorSpec(a) || !isTensorSpec(b)) {
    return compareAllclose(a, b, tolerance);
  }
  return compareAllclose(a.values, b.values, tolerance);
}
