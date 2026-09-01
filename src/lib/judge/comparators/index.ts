import type { EvaluatorInputValue } from "@/types/ml-judge";

import { compareExact } from "./exact";
import {
  compareAbsoluteError,
  compareAllclose,
  compareRelativeError,
  type ComparisonTolerance,
  type NumericComparison,
} from "./numeric";
/**
 * Numerical comparator framework (Week 5 Task 10).
 *
 * Modes: `exact`, `allclose`, `absolute_error`, `relative_error`.
 * The Python runner performs the authoritative comparison during evaluation;
 * these TS comparators are the documented, testable definition of the same
 * semantics and are used by server-side utilities and offline tests.
 */

export type ComparisonMode = "exact" | "allclose" | "absolute_error" | "relative_error";

export { compareExact } from "./exact";
export {
  compareAbsoluteError,
  compareAllclose,
  compareRelativeError,
  type ComparisonTolerance,
  type NumericComparison,
} from "./numeric";
export {
  compareTensorSpecs,
  shapesEqual,
  structuredShape,
  structuredShapeStrict,
  tensorSpecsEqual,
} from "./tensor";

export function compareStructured(
  a: EvaluatorInputValue,
  b: EvaluatorInputValue,
  mode: ComparisonMode,
  tolerance: ComparisonTolerance,
): NumericComparison {
  if (mode === "exact") return { passed: compareExact(a, b), maxAbsError: null };
  if (mode === "absolute_error") return compareAbsoluteError(a, b, tolerance.atol);
  if (mode === "relative_error") return compareRelativeError(a, b, tolerance.rtol);
  return compareAllclose(a, b, tolerance);
}
