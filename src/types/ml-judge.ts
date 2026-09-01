import type {
  CodingEvaluationMode,
  CodingFramework,
  CodingResourceProfile,
  CodingSubmissionStatus,
  CodingTestGroup,
  CodingTestType,
} from "@/types/database";

/**
 * Week 5 ML judge domain types.
 *
 * `Public*` variants are the redacted shapes allowed to cross the API boundary
 * to the browser. Full result shapes (with error magnitudes, hidden dims,
 * diagnostics) stay server-side behind the judge service.
 */

// ---------------------------------------------------------------------------
// Evaluation configuration (server-authoritative; Zod-validated in lib/judge)
// ---------------------------------------------------------------------------

export type ComparisonMode = "exact" | "allclose" | "absolute_error" | "relative_error";

export interface ComparisonConfig {
  comparison: ComparisonMode;
  rtol: number;
  atol: number;
}

/**
 * Server-authoritative evaluator configuration parsed from
 * `coding_problems.evaluator_config`. The evaluation mode itself lives on the
 * problem row (`evaluation_mode`), not inside the JSON config.
 */
export interface EvaluatorConfig extends ComparisonConfig {
  check_shape: boolean;
  check_dtype: boolean;
  check_gradient: boolean;
}

// ---------------------------------------------------------------------------
// Structured test cases
// ---------------------------------------------------------------------------

/** Deterministic scalar / nested value used to rebuild evaluator inputs. */
export type ScalarValue = number | string | boolean | null;
export type StructuredValue = ScalarValue | StructuredValue[] | { [key: string]: StructuredValue };

export type TensorDtype = "float32" | "float64" | "int64" | "bool";

/** Tensor spec reconstructed inside the trusted Python runner. */
export interface TensorSpec {
  type: "tensor";
  shape: number[];
  dtype: TensorDtype;
  /** Flat row-major values; empty means zeros. */
  values: number[];
  requires_grad: boolean;
}

export type EvaluatorInputValue = StructuredValue | TensorSpec;

export interface StructuredTestCase {
  id: string;
  name: string | null;
  testType: CodingTestType;
  testGroup: CodingTestGroup;
  /** Positional arguments for the entrypoint call. */
  args: EvaluatorInputValue[];
  /** Keyword arguments for the entrypoint call. */
  kwargs: Record<string, EvaluatorInputValue>;
  /** Class mode only: constructor arguments for instantiating the entrypoint. */
  construct: { args: EvaluatorInputValue[]; kwargs: Record<string, EvaluatorInputValue> } | null;
  /** Class mode only: instance method to call (defaults to `forward`). */
  method: string | null;
  /** Expected structured output (value/shape/dtype/exception expectations). */
  expected: ExpectedValue;
  weight: number;
  isHidden: boolean;
  /** Optional seed so randomized cases stay reproducible. */
  seed: number | null;
  metadata: Record<string, unknown>;
}

export type ExpectedValue =
  | { kind: "value"; value: EvaluatorInputValue }
  | { kind: "shape"; shape: number[] }
  | { kind: "dtype"; dtype: TensorDtype }
  | { kind: "exception"; exceptionType: string; messagePattern?: string }
  | { kind: "gradient"; forward: EvaluatorInputValue; gradients: Array<{ label: string; value: TensorSpec }> }
  | { kind: "performance"; maxRuntimeMs?: number };

// ---------------------------------------------------------------------------
// Evaluation requests / results
// ---------------------------------------------------------------------------

export type EvaluationRequest =
  | ProgramEvaluationRequest
  | MLEvaluationRequest;

export interface ProgramEvaluationRequest {
  mode: "program";
  sourceCode: string;
  /** stdin → stdout test cases. */
  cases: ProgramCaseInput[];
  timeLimitMs: number;
  memoryLimitMb: number;
  comparisonMode: "exact" | "trimmed" | "numeric";
  tolerance: number;
}

export interface ProgramCaseInput {
  id: string;
  name: string | null;
  stdin: string;
  expectedOutput: string;
  weight: number;
}

export interface MLEvaluationRequest {
  mode: "function" | "class";
  sourceCode: string;
  entrypointName: string;
  entrypointType: "function" | "class";
  framework: CodingFramework;
  config: EvaluatorConfig;
  cases: StructuredTestCase[];
  resourceProfile: CodingResourceProfile;
  timeLimitMs: number;
  memoryLimitMb: number;
  /** Include only visible cases for Run; all cases for Submit. */
}

// ---------------------------------------------------------------------------
// Case results (server-side full fidelity)
// ---------------------------------------------------------------------------

export interface ValueCheckResult {
  passed: boolean;
  comparison: ComparisonMode;
  /** Max absolute error when numeric; null for exact/exc checks. */
  maxAbsError: number | null;
  message: string | null;
}

export interface ShapeCheckResult {
  passed: boolean;
  expectedShape: number[] | null;
  receivedShape: number[] | null;
}

export interface DtypeCheckResult {
  passed: boolean;
  expectedDtype: TensorDtype | null;
  receivedDtype: string | null;
}

export interface GradientTensorResult {
  label: string;
  passed: boolean;
  maxAbsError: number | null;
  missing: boolean;
}

export interface GradientCheckResult {
  passed: boolean;
  forwardPassed: boolean;
  tensors: GradientTensorResult[];
}

export interface NumericalCheckResult extends ValueCheckResult {
  /** Human-readable diagnostics for visible tests only. */
  diagnostics: string | null;
}

export interface ExceptionCheckResult {
  passed: boolean;
  raisedType: string | null;
  expectedType: string | null;
  message: string | null;
}

export interface PerformanceCheckResult {
  runtimeMs: number | null;
  memoryKb: number | null;
  thresholdMs: number | null;
  passed: boolean | null;
}

export interface MLCaseResult {
  testCaseId: string;
  name: string | null;
  testType: CodingTestType;
  testGroup: CodingTestGroup;
  isHidden: boolean;
  status: CodingSubmissionStatus;
  weight: number;
  runtimeMs: number | null;
  value: NumericalCheckResult | null;
  shape: ShapeCheckResult | null;
  dtype: DtypeCheckResult | null;
  gradient: GradientCheckResult | null;
  exception: ExceptionCheckResult | null;
  performance: PerformanceCheckResult | null;
  /** Sanitized error category for entrypoint/harness failures. */
  errorCategory: MLErrorCategory | null;
  /** Sanitized, redacted message safe for review surfaces. */
  message: string | null;
}

export type MLErrorCategory =
  | "entrypoint_missing"
  | "entrypoint_not_callable"
  | "entrypoint_signature"
  | "syntax_error"
  | "runtime_error"
  | "timeout"
  | "memory_limit"
  | "output_limit"
  | "forbidden_import"
  | "harness_error"
  | "internal_error";

export interface ProgramEvaluationResult {
  mode: "program";
  status: CodingSubmissionStatus;
  score: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  cases: ProgramCaseResult[];
}

export interface ProgramCaseResult {
  testCaseId: string;
  name: string | null;
  status: CodingSubmissionStatus;
  runtimeMs: number | null;
  memoryKb: number | null;
  stdout: string | null;
  stderr: string | null;
  message: string | null;
}

export type EvaluationResult = ProgramEvaluationResult | MLEvaluationResult;

export interface MLEvaluationResult {
  mode: "function" | "class";
  status: CodingSubmissionStatus;
  /** Aggregate per-group counts, e.g. correctness 4/4. */
  groups: GroupAggregates;
  cases: MLCaseResult[];
  runtimeMs: number | null;
  memoryKb: number | null;
  /** Entrypoint-level failure (fails everything, message shown once). */
  entrypointError: { category: MLErrorCategory; message: string } | null;
}

export interface GroupAggregate {
  group: CodingTestGroup;
  passed: number;
  total: number;
  /** Performance groups are informational; they never fail a submission. */
  informational: boolean;
}

export type GroupAggregates = GroupAggregate[];

/** jsonb shape persisted on coding_submissions.evaluation_summary. */
export interface EvaluationSummaryPayload {
  mode: "function" | "class";
  groups: Array<{ group: CodingTestGroup; passed: number; total: number; informational?: boolean }>;
  entrypointError?: { category: MLErrorCategory; message: string } | null;
  /** Redacted per-case results so history renders without rerunning the judge. */
  cases?: PublicMLCaseResult[];
  framework?: CodingFramework | null;
}

// ---------------------------------------------------------------------------
// Public (browser) shapes — redacted
// ---------------------------------------------------------------------------

export interface PublicMLCaseResult {
  testCaseId: string;
  name: string | null;
  testGroup: CodingTestGroup;
  status: CodingSubmissionStatus;
  /** Visible tests keep diagnostics; hidden tests keep pass/fail only. */
  value: { passed: boolean; maxAbsError: number | null } | null;
  shape: { passed: boolean; expectedShape: number[] | null; receivedShape: number[] | null } | null;
  dtype: { passed: boolean } | null;
  gradient: { passed: boolean; forwardPassed: boolean; tensors: Array<{ label: string; passed: boolean }> } | null;
  exception: { passed: boolean } | null;
  performance: { runtimeMs: number | null; thresholdMs: number | null } | null;
  message: string | null;
}

export interface PublicMLEvaluationResult {
  status: CodingSubmissionStatus;
  groups: GroupAggregates;
  cases: PublicMLCaseResult[];
  runtimeMs: number | null;
  memoryKb: number | null;
  entrypointError: { category: MLErrorCategory; message: string } | null;
}

// ---------------------------------------------------------------------------
// Evaluation metadata shown on the problem page before coding
// ---------------------------------------------------------------------------

export interface EvaluationMetadata {
  evaluationMode: CodingEvaluationMode;
  entrypointType: "function" | "class" | null;
  entrypointName: string | null;
  framework: CodingFramework | null;
  resourceProfile: CodingResourceProfile;
  /** Public capability hints only — never raw thresholds or hidden config. */
  checks: Array<"correctness" | "shape" | "dtype" | "gradient" | "exception" | "performance">;
}
