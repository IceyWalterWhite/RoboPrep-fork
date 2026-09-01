import { Check, Minus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PublicMLCaseResult } from "@/types/ml-judge";

/**
 * Structured per-case check results (Week 5 Tasks 14, 23, 54).
 *
 * Pass/fail is never conveyed by colour alone: every row carries an icon plus
 * a text label ("Passed" / "Failed") and the numeric `n / m` tally, so the
 * panel is readable without colour and to screen readers.
 *
 * Diagnostics are only rendered when the server actually sent them. Hidden
 * cases arrive with names, shapes, error magnitudes and messages stripped, so
 * this component cannot leak an answer even if a call site is careless.
 */

type CheckState = "passed" | "failed" | "info";

const STATE_TEXT: Record<CheckState, string> = {
  passed: "Passed",
  failed: "Failed",
  info: "Info",
};

const STATE_STYLES: Record<CheckState, string> = {
  passed: "text-success-ink",
  failed: "text-danger-ink",
  info: "text-ink-tertiary",
};

function StateIcon({ state }: { state: CheckState }) {
  if (state === "passed") return <Check className="text-success-ink size-4 shrink-0" aria-hidden />;
  if (state === "failed") return <X className="text-danger-ink size-4 shrink-0" aria-hidden />;
  return <Minus className="text-ink-tertiary size-4 shrink-0" aria-hidden />;
}

function CheckRow({
  label,
  state,
  detail,
}: {
  label: string;
  state: CheckState;
  detail?: string | null;
}) {
  return (
    <li className="flex items-start justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2 text-sm">
        <StateIcon state={state} />
        <span className="text-ink">{label}</span>
      </span>
      <span className={cn("text-right text-xs", detail ? STATE_STYLES[state] : "text-ink-tertiary")}>
        {detail ?? STATE_TEXT[state]}
      </span>
    </li>
  );
}

function formatError(value: number | null): string | null {
  if (value === null) return null;
  if (value === 0) return "0";
  if (value < 1e-3 || value >= 1e4) return value.toExponential(2);
  return value.toPrecision(3);
}

function formatShape(shape: number[] | null): string | null {
  return shape ? `[${shape.join(", ")}]` : null;
}

export function MLCheckResults({ testCase, index }: { testCase: PublicMLCaseResult; index: number }) {
  const label = testCase.name ?? `Test ${index + 1}`;
  const passed = testCase.status === "accepted";
  const rows: React.ReactNode[] = [];

  if (testCase.value) {
    const error = formatError(testCase.value.maxAbsError);
    rows.push(
      <CheckRow
        key="value"
        label="Value check"
        state={testCase.value.passed ? "passed" : "failed"}
        {...(error ? { detail: `max abs error ${error}` } : {})}
      />,
    );
  }
  if (testCase.shape) {
    const expected = formatShape(testCase.shape.expectedShape);
    const received = formatShape(testCase.shape.receivedShape);
    const detail =
      testCase.shape.passed
        ? expected
          ? `shape ${expected}`
          : null
        : expected || received
          ? `expected ${expected ?? "?"}, received ${received ?? "?"}`
          : null;
    rows.push(
      <CheckRow
        key="shape"
        label="Shape check"
        state={testCase.shape.passed ? "passed" : "failed"}
        {...(detail ? { detail } : {})}
      />,
    );
  }
  if (testCase.dtype) {
    rows.push(<CheckRow key="dtype" label="Dtype check" state={testCase.dtype.passed ? "passed" : "failed"} />);
  }
  if (testCase.gradient) {
    rows.push(
      <CheckRow key="gradient-forward" label="Forward value" state={testCase.gradient.forwardPassed ? "passed" : "failed"} />,
    );
    for (const tensor of testCase.gradient.tensors) {
      rows.push(
        <CheckRow
          key={`gradient-${tensor.label}`}
          label={humanizeGradientLabel(tensor.label)}
          state={tensor.passed ? "passed" : "failed"}
        />,
      );
    }
  }
  if (testCase.exception) {
    rows.push(
      <CheckRow key="exception" label="Exception check" state={testCase.exception.passed ? "passed" : "failed"} />,
    );
  }
  if (testCase.performance) {
    const runtime = testCase.performance.runtimeMs;
    rows.push(
      <CheckRow
        key="performance"
        label="Runtime"
        state="info"
        {...(runtime === null ? {} : { detail: `${Math.round(runtime)} ms (informational)` })}
      />,
    );
  }

  return (
    <div className="border-line-subtle rounded-sm border">
      <div className="bg-surface-muted flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <p className="text-ink text-sm font-medium">{label}</p>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", passed ? STATE_STYLES.passed : STATE_STYLES.failed)}>
          <StateIcon state={passed ? "passed" : "failed"} />
          {passed ? "Passed" : "Failed"}
        </span>
      </div>
      {rows.length > 0 ? (
        <ul className="divide-line-subtle divide-y px-3 py-2">
          {rows}
        </ul>
      ) : (
        <p className="text-ink-tertiary px-3 py-2 text-xs">
          No detailed checks are available for this test.
        </p>
      )}
      {testCase.message ? (
        <p className="text-ink-secondary border-line-subtle border-t px-3 py-2 text-xs leading-relaxed">
          {testCase.message}
        </p>
      ) : null}
    </div>
  );
}

/** `arg0` / `param:weight` → readable gradient labels. */
export function humanizeGradientLabel(label: string): string {
  if (label.startsWith("param:")) return `Parameter gradient · ${label.slice("param:".length)}`;
  if (/^arg\d+$/.test(label)) {
    const index = Number(label.slice(3));
    return `Input gradient · argument ${index + 1}`;
  }
  return `Gradient · ${label}`;
}
