import Link from "next/link";
import { CheckCircle2, CircleDot, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CODING_TEST_GROUP_LABELS, JUDGE_STATUS_LABELS } from "@/lib/coding/constants";
import type { CodingSubmission, EvaluationGroupSummary } from "@/types/coding";

/**
 * Submission history (Week 5 Task 48).
 *
 * ML submissions render their persisted group breakdown inline — no rerun
 * required. The breakdown was redacted before it was stored, so hidden inputs,
 * expected tensors and reference gradients are absent by construction.
 * Program-mode submissions stay compact: status, score and time only.
 */
export function SubmissionHistory({
  submissions,
}: {
  submissions: CodingSubmission[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>提交历史</CardTitle>
        {submissions.length > 0 ? (
          <span className="text-ink-tertiary text-xs">
            最近 {submissions.length} 条
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-ink-secondary text-sm">
            登录并提交后，你的提交记录会显示在这里。
          </p>
        ) : (
          <ul className="border-line-subtle divide-line-subtle divide-y rounded-sm border">
            {submissions.map((submission) => (
              <SubmissionRow key={submission.id} submission={submission} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SubmissionRow({ submission }: { submission: CodingSubmission }) {
  const solved = submission.status === "accepted";
  const groups = submission.evaluationSummary?.groups ?? [];
  const required = groups.filter((group) => !group.informational);

  return (
    <li>
      <Link
        href={`/coding/submissions/${submission.id}`}
        className="hover:bg-surface-muted flex flex-col gap-2 px-3 py-3 transition-colors"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {solved ? (
              <CheckCircle2 className="text-success-ink size-4 shrink-0" aria-hidden />
            ) : (
              <CircleDot className="text-ink-tertiary size-4 shrink-0" aria-hidden />
            )}
            <span className="text-ink truncate text-sm">
              {JUDGE_STATUS_LABELS[submission.status]}
            </span>
            <Badge variant="default">{submission.score ?? 0}%</Badge>
          </div>
          <span className="text-ink-tertiary inline-flex items-center gap-1 text-xs">
            <Clock3 className="size-3.5" aria-hidden />
            {formatDate(submission.createdAt)}
          </span>
        </div>
        {required.length > 0 ? <GroupBreakdown groups={required} /> : null}
      </Link>
    </li>
  );
}

/**
 * Compact `Group n/m` chips. Each chip carries its own text, so the result is
 * never conveyed by colour alone (Week 5 Task 54).
 */
function GroupBreakdown({ groups }: { groups: EvaluationGroupSummary[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {groups.map((group) => {
        const allPassed = group.passed === group.total;
        return (
          <li key={group.group} className="text-xs">
            <span className="text-ink-tertiary">{label(group.group)} </span>
            <span
              className={
                allPassed
                  ? "text-success-ink font-medium"
                  : "text-danger-ink font-medium"
              }
            >
              {group.passed}/{group.total}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function label(group: EvaluationGroupSummary["group"]): string {
  return CODING_TEST_GROUP_LABELS[group] ?? "其他检查";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
