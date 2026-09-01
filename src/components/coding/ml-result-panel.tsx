import { CheckCircle2, CircleAlert, Clock3, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CODING_TEST_GROUP_LABELS, JUDGE_STATUS_LABELS } from "@/lib/coding/constants";
import { formatRuntime } from "@/lib/coding/helpers";
import { cn } from "@/lib/utils";
import type { CodingTestGroup } from "@/types/database";
import type { PublicMLEvaluationResult } from "@/types/ml-judge";

import { MLCheckResults } from "./ml-check-results";

/**
 * Structured submission result (Week 5 Task 18).
 *
 * Automatically replaces the compact program-mode panel when a problem is
 * evaluated in function/class mode. Group tallies come straight from the
 * server aggregate (Correctness 5/5, Gradient 2/3, …); informational groups
 * such as Performance are labelled so users do not read them as failures.
 *
 * Everything rendered here has already been redacted server-side by
 * `redactMLEvaluation`, so hidden inputs, expected tensors and reference
 * gradients physically cannot reach this component.
 */

export interface MLResultPanelProps {
  status: PublicMLEvaluationResult["status"];
  groups: PublicMLEvaluationResult["groups"];
  cases: PublicMLEvaluationResult["cases"];
  runtimeMs: number | null;
  entrypointError: PublicMLEvaluationResult["entrypointError"];
  title?: string;
}

export function MLResultPanel({
  status,
  groups,
  cases,
  runtimeMs,
  entrypointError,
  title = "Submission result",
}: MLResultPanelProps) {
  const accepted = status === "accepted";
  const requiredGroups = groups.filter((group) => !group.informational);

  return (
    <Card className="border-line-subtle">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            {accepted ? (
              <CheckCircle2 className="text-success-ink size-5" aria-hidden />
            ) : (
              <CircleAlert className="text-warning-ink size-5" aria-hidden />
            )}
            {title}
          </CardTitle>
          <Badge variant="status" tone={accepted ? "published" : status === "internal_error" ? "rejected" : "review"}>
            {JUDGE_STATUS_LABELS[status]}
          </Badge>
        </div>
        <p className="text-ink-secondary text-sm">
          {requiredGroups.length > 0
            ? `${sumPassed(requiredGroups)} of ${sumTotal(requiredGroups)} required checks passed.`
            : "No required checks were reported for this submission."}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {formatRuntime(runtimeMs) ? (
          <p className="text-ink-tertiary inline-flex items-center gap-1 text-xs">
            <Clock3 className="size-3.5" aria-hidden />
            {formatRuntime(runtimeMs)}
          </p>
        ) : null}

        {entrypointError ? <EntrypointError category={entrypointError.category} message={entrypointError.message} /> : null}

        {groups.length > 0 ? (
          <section aria-label="Results by category">
            <ul className="border-line-subtle divide-line-subtle divide-y rounded-sm border">
              {groups.map((group) => <GroupRow key={group.group} group={group} />)}
            </ul>
          </section>
        ) : null}

        {cases.length > 0 ? (
          <section aria-label="Per-test results" className="flex flex-col gap-3">
            <h3 className="text-ink text-sm font-semibold">Test details</h3>
            {cases.map((testCase, index) => (
              <MLCheckResults key={testCase.testCaseId} testCase={testCase} index={index} />
            ))}
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GroupRow({ group }: { group: PublicMLEvaluationResult["groups"][number] }) {
  const allPassed = group.passed === group.total;
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-ink flex items-center gap-2 text-sm">
        {group.informational ? (
          <Info className="text-ink-tertiary size-4 shrink-0" aria-hidden />
        ) : allPassed ? (
          <CheckCircle2 className="text-success-ink size-4 shrink-0" aria-hidden />
        ) : (
          <CircleAlert className="text-danger-ink size-4 shrink-0" aria-hidden />
        )}
        {groupLabel(group.group)}
        {group.informational ? <span className="text-ink-tertiary text-xs">(informational)</span> : null}
      </span>
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          group.informational ? "text-ink-tertiary" : allPassed ? "text-success-ink" : "text-danger-ink",
        )}
      >
        {group.passed} / {group.total}
        <span className="sr-only">
          {group.informational
            ? " informational checks passed"
            : allPassed
              ? " checks passed"
              : " checks passed, some failed"}
        </span>
      </span>
    </li>
  );
}

function EntrypointError({ category, message }: { category: string; message: string }) {
  return (
    <div role="alert" className="border-danger/30 bg-danger/10 rounded-sm border px-4 py-3">
      <p className="text-danger-ink text-sm font-semibold">{entrypointErrorTitle(category)}</p>
      <p className="text-ink-secondary mt-1 text-sm leading-relaxed">{message}</p>
    </div>
  );
}

/** Categorized, safe diagnostics (Week 5 Task 42). */
function entrypointErrorTitle(category: string): string {
  switch (category) {
    case "entrypoint_missing":
    case "entrypoint_not_callable":
    case "entrypoint_signature":
      return "Entrypoint error";
    case "syntax_error":
      return "Syntax error";
    case "timeout":
      return "Time limit exceeded";
    case "forbidden_import":
      return "Import not allowed";
    case "memory_limit":
      return "Memory limit exceeded";
    case "output_limit":
      return "Output limit exceeded";
    case "runtime_error":
      return "Runtime error";
    default:
      return "Evaluation unavailable";
  }
}

function groupLabel(group: CodingTestGroup): string {
  return CODING_TEST_GROUP_LABELS[group] ?? group;
}

function sumPassed(groups: PublicMLEvaluationResult["groups"]): number {
  return groups.reduce((total, group) => total + group.passed, 0);
}

function sumTotal(groups: PublicMLEvaluationResult["groups"]): number {
  return groups.reduce((total, group) => total + group.total, 0);
}
