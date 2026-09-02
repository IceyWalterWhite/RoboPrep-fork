import { z } from "zod";

import type { CodingTestGroup, CodingTestType } from "@/types/database";
import type {
  EvaluatorInputValue,
  ExpectedValue,
  StructuredTestCase,
  TensorSpec,
} from "@/types/ml-judge";

/**
 * Structured test-case parsing and display (Week 5 Tasks 3, 9, 19, 23).
 *
 * `coding_test_cases.input_json` / `expected_json` are authored server-side.
 * They use the same snake_case shape the Python runner consumes, so there is a
 * single on-disk format and no translation drift between authoring, the
 * integrity check and the evaluator.
 *
 * Everything here runs on the server. Only `renderCallForDisplay` /
 * `renderExpectedForDisplay` output — short, authored, human-readable strings —
 * ever reaches the browser, and only for visible cases.
 */

export const tensorSpecSchema = z
  .object({
    type: z.literal("tensor"),
    shape: z.array(z.number().int().min(0)).max(8),
    dtype: z.enum(["float32", "float64", "int64", "bool"]),
    values: z.array(z.number().finite()).max(100_000),
    requires_grad: z.boolean().default(false),
  })
  .strict();

export const structuredValueSchema: z.ZodType<EvaluatorInputValue> = z.lazy(() =>
  z.union([
    z.string().max(10_000),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(structuredValueSchema).max(10_000),
    z.record(z.string(), structuredValueSchema),
    tensorSpecSchema,
  ]),
) as z.ZodType<EvaluatorInputValue>;

export const callSpecSchema = z
  .object({
    args: z.array(structuredValueSchema).default([]),
    kwargs: z.record(z.string(), structuredValueSchema).default({}),
  })
  .strict();

export const inputJsonSchema = callSpecSchema.extend({
  construct: callSpecSchema.nullish(),
  method: z.string().max(80).nullish(),
  seed: z.number().int().nullish(),
});

const expectedJsonSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("value"), value: structuredValueSchema }).strict(),
  z
    .object({
      kind: z.literal("shape"),
      shape: z.array(z.number().int().min(0)).max(8),
    })
    .strict(),
  z
    .object({
      kind: z.literal("dtype"),
      dtype: z.enum(["float32", "float64", "int64", "bool"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("exception"),
      exception_type: z.string().min(1).max(80),
      message_pattern: z.string().max(200).nullish(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("gradient"),
      forward: structuredValueSchema.nullish(),
      gradients: z
        .array(
          z
            .object({ label: z.string().min(1).max(80), value: tensorSpecSchema })
            .strict(),
        )
        .min(1)
        .max(16),
    })
    .strict(),
  z
    .object({
      kind: z.literal("performance"),
      max_runtime_ms: z.number().positive().nullish(),
    })
    .strict(),
]);

export type StructuredInputJson = z.infer<typeof inputJsonSchema>;
export type StructuredExpectedJson = z.infer<typeof expectedJsonSchema>;

export interface StructuredCaseRow {
  id: string;
  name: string | null;
  test_type: CodingTestType | null;
  test_group: CodingTestGroup | null;
  input_json: unknown;
  expected_json: unknown;
  metadata: unknown;
  weight: number;
  is_hidden: boolean;
  order_index: number;
}

export interface ParsedStructuredCase {
  testCase: StructuredTestCase;
  /** Human-readable display strings for visible cases only. */
  display: { call: string; expected: string; note: string | null };
}

/**
 * Parse one authored row into a runnable test case.
 * Returns `null` when the row is not a structured case or is malformed — the
 * integrity check surfaces those separately so a single bad row cannot break
 * an entire submission.
 */
export function parseStructuredCase(
  row: StructuredCaseRow,
  entrypointName: string,
): ParsedStructuredCase | null {
  if (!row.input_json || !row.expected_json) return null;
  const input = inputJsonSchema.safeParse(row.input_json);
  const expected = expectedJsonSchema.safeParse(row.expected_json);
  if (!input.success || !expected.success) return null;

  const testType: CodingTestType =
    row.test_type ??
    (expected.data.kind === "value" ? "value" : testTypeFor(expected.data.kind));
  const testGroup: CodingTestGroup = row.test_group ?? defaultGroupFor(testType);
  const note = readNote(row.metadata);

  return {
    testCase: {
      id: row.id,
      name: row.name,
      testType,
      testGroup,
      args: input.data.args,
      kwargs: input.data.kwargs,
      construct: input.data.construct ?? null,
      method: input.data.method ?? null,
      expected: toExpectedValue(expected.data),
      weight: row.weight,
      isHidden: row.is_hidden,
      seed: input.data.seed ?? null,
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {},
    },
    display: {
      call: renderCall(entrypointName, input.data),
      expected: renderExpected(expected.data),
      note,
    },
  };
}

function toExpectedValue(value: StructuredExpectedJson): ExpectedValue {
  switch (value.kind) {
    case "value":
      return { kind: "value", value: value.value };
    case "shape":
      return { kind: "shape", shape: value.shape };
    case "dtype":
      return { kind: "dtype", dtype: value.dtype };
    case "exception":
      return {
        kind: "exception",
        exceptionType: value.exception_type,
        ...(value.message_pattern ? { messagePattern: value.message_pattern } : {}),
      };
    case "gradient":
      return {
        kind: "gradient",
        forward: value.forward ?? {
          type: "tensor",
          shape: [],
          dtype: "float32",
          values: [],
          requires_grad: false,
        },
        gradients: value.gradients.map((entry) => ({
          label: entry.label,
          value: entry.value,
        })),
      };
    case "performance":
      return {
        kind: "performance",
        ...(value.max_runtime_ms === null || value.max_runtime_ms === undefined
          ? {}
          : { maxRuntimeMs: value.max_runtime_ms }),
      };
  }
}

function testTypeFor(kind: StructuredExpectedJson["kind"]): CodingTestType {
  if (kind === "shape") return "shape";
  if (kind === "dtype") return "dtype";
  if (kind === "gradient") return "gradient";
  if (kind === "exception") return "exception";
  if (kind === "performance") return "performance";
  return "value";
}

function defaultGroupFor(testType: CodingTestType): CodingTestGroup {
  switch (testType) {
    case "shape":
      return "shape";
    case "gradient":
      return "gradient";
    case "performance":
      return "performance";
    case "exception":
      return "edge";
    default:
      return "basic";
  }
}

function readNote(metadata: unknown): string | null {
  if (metadata && typeof metadata === "object") {
    const note = (metadata as Record<string, unknown>).note;
    if (typeof note === "string") return note.slice(0, 200);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Display rendering (visible cases only)
// ---------------------------------------------------------------------------

export function renderCall(entrypointName: string, input: StructuredInputJson): string {
  const parts = [
    ...input.args.map(renderValue),
    ...Object.entries(input.kwargs).map(
      ([key, value]) => `${key}=${renderValue(value)}`,
    ),
  ];
  if (input.construct) {
    const constructParts = [
      ...input.construct.args.map(renderValue),
      ...Object.entries(input.construct.kwargs).map(
        ([key, value]) => `${key}=${renderValue(value)}`,
      ),
    ];
    const method = input.method ?? "forward";
    return `${entrypointName}(${constructParts.join(", ")}).${method}(${parts.join(", ")})`;
  }
  return `${entrypointName}(${parts.join(", ")})`;
}

export function renderExpected(expected: StructuredExpectedJson): string {
  switch (expected.kind) {
    case "value":
      return renderValue(expected.value);
    case "shape":
      return `形状 ${formatShape(expected.shape)}`;
    case "dtype":
      return `数据类型 ${expected.dtype}`;
    case "exception":
      return `抛出 ${expected.exception_type}`;
    case "gradient":
      return `梯度：${expected.gradients.map((entry) => entry.label).join("、")}`;
    case "performance":
      return expected.max_runtime_ms
        ? `低于 ${expected.max_runtime_ms} ms`
        : "已记录运行时间";
  }
}

function formatShape(shape: number[]): string {
  return `[${shape.join(", ")}]`;
}

export function renderValue(value: EvaluatorInputValue): string {
  if (isTensorLike(value)) return renderTensor(value);
  if (value === null) return "None";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) {
    const rendered = value.slice(0, 12).map(renderValue).join(", ");
    return value.length > 12 ? `[${rendered}，… ${value.length} 项]` : `[${rendered}]`;
  }
  const entries = Object.entries(value as Record<string, EvaluatorInputValue>).slice(
    0,
    8,
  );
  const rendered = entries
    .map(([key, entry]) => `${key}: ${renderValue(entry)}`)
    .join(", ");
  return `{${rendered}}`;
}

function renderTensor(spec: TensorSpec): string {
  const base = `tensor${formatShape(spec.shape)}${spec.dtype === "float32" ? "" : `, ${spec.dtype}`}`;
  if (spec.values.length === 0) return `${base}（全零）`;
  if (spec.values.length <= 8) return `${base} ${JSON.stringify(spec.values)}`;
  return `${base} [${spec.values.slice(0, 6).map(formatNumber).join(", ")}, …]`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
  const rounded = Number(value.toPrecision(6));
  return Number.isInteger(rounded) ? `${rounded}.0` : String(rounded);
}

function isTensorLike(value: EvaluatorInputValue): value is TensorSpec {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === "tensor"
  );
}

/** Rendered call/expected pair used by the problem page for visible cases. */
export interface StructuredDisplay {
  call: string;
  expected: string;
  note: string | null;
}

export function displayFor(
  row: StructuredCaseRow,
  entrypointName: string,
): StructuredDisplay | null {
  const parsed = parseStructuredCase(row, entrypointName);
  return parsed ? parsed.display : null;
}
