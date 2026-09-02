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
  title = "提交结果",
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
          <Badge
            variant="status"
            tone={
              accepted
                ? "published"
                : status === "internal_error"
                  ? "rejected"
                  : "review"
            }
          >
            {JUDGE_STATUS_LABELS[status]}
          </Badge>
        </div>
        <p className="text-ink-secondary text-sm">
          {requiredGroups.length > 0
            ? `必需检查项通过 ${sumPassed(requiredGroups)} / ${sumTotal(requiredGroups)}。`
            : "这次提交没有报告必需检查项。"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {formatRuntime(runtimeMs) ? (
          <p className="text-ink-tertiary inline-flex items-center gap-1 text-xs">
            <Clock3 className="size-3.5" aria-hidden />
            {formatRuntime(runtimeMs)}
          </p>
        ) : null}

        {entrypointError ? (
          <EntrypointError
            category={entrypointError.category}
            message={entrypointError.message}
          />
        ) : null}

        {groups.length > 0 ? (
          <section aria-label="按类别查看结果">
            <ul className="border-line-subtle divide-line-subtle divide-y rounded-sm border">
              {groups.map((group) => (
                <GroupRow key={group.group} group={group} />
              ))}
            </ul>
          </section>
        ) : null}

        {cases.length > 0 ? (
          <section aria-label="逐项测试结果" className="flex flex-col gap-3">
            <h3 className="text-ink text-sm font-semibold">测试详情</h3>
            {cases.map((testCase, index) => (
              <MLCheckResults
                key={testCase.testCaseId}
                testCase={testCase}
                index={index}
              />
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
        {group.informational ? (
          <span className="text-ink-tertiary text-xs">（仅供参考）</span>
        ) : null}
      </span>
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          group.informational
            ? "text-ink-tertiary"
            : allPassed
              ? "text-success-ink"
              : "text-danger-ink",
        )}
      >
        {group.passed} / {group.total}
        <span className="sr-only">
          {group.informational
            ? " 个参考检查项通过"
            : allPassed
              ? " 个检查项通过"
              : " 个检查项通过，部分失败"}
        </span>
      </span>
    </li>
  );
}

function EntrypointError({ category, message }: { category: string; message: string }) {
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger/10 rounded-sm border px-4 py-3"
    >
      <p className="text-danger-ink text-sm font-semibold">
        {entrypointErrorTitle(category)}
      </p>
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
      return "入口错误";
    case "syntax_error":
      return "语法错误";
    case "timeout":
      return "超出时间限制";
    case "forbidden_import":
      return "不允许导入";
    case "memory_limit":
      return "超出内存限制";
    case "output_limit":
      return "超出输出限制";
    case "runtime_error":
      return "运行错误";
    default:
      return "评测不可用";
  }
}

function groupLabel(group: CodingTestGroup): string {
  return CODING_TEST_GROUP_LABELS[group] ?? "其他检查";
}

function sumPassed(groups: PublicMLEvaluationResult["groups"]): number {
  return groups.reduce((total, group) => total + group.passed, 0);
}

function sumTotal(groups: PublicMLEvaluationResult["groups"]): number {
  return groups.reduce((total, group) => total + group.total, 0);
}
