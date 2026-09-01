import { CheckCircle2, CircleAlert, Clock3, Terminal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JUDGE_STATUS_LABELS } from "@/lib/coding/constants";
import { formatMemory, formatRuntime } from "@/lib/coding/helpers";
import type { CodingSubmissionStatus } from "@/types/database";

export interface JudgeCaseFeedback {
  id?: string;
  index?: number;
  name?: string | null;
  status: CodingSubmissionStatus;
  runtimeMs: number | null;
  memoryKb: number | null;
  stdout?: string | null;
  stderr?: string | null;
  message?: string;
}

export interface JudgeFeedback {
  status: CodingSubmissionStatus;
  score: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  cases: JudgeCaseFeedback[];
}

export function JudgeResult({ result }: { result: JudgeFeedback }) {
  const passed = result.cases.filter((item) => item.status === "accepted").length;
  return (
    <Card className="border-line-subtle">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            {result.status === "accepted" ? <CheckCircle2 className="text-success-ink size-5" aria-hidden /> : <CircleAlert className="text-warning-ink size-5" aria-hidden />}
            {JUDGE_STATUS_LABELS[result.status]}
          </CardTitle>
          <Badge variant="status" tone={result.status === "accepted" ? "published" : result.status === "internal_error" ? "rejected" : "review"}>
            {result.score}%
          </Badge>
        </div>
        <p className="text-ink-secondary text-sm">{passed} of {result.cases.length} test cases passed.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="text-ink-tertiary flex flex-wrap gap-4 text-xs">
          {formatRuntime(result.runtimeMs) ? <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" aria-hidden />{formatRuntime(result.runtimeMs)}</span> : null}
          {formatMemory(result.memoryKb) ? <span className="inline-flex items-center gap-1"><Terminal className="size-3.5" aria-hidden />{formatMemory(result.memoryKb)}</span> : null}
        </div>
        <ul className="border-line-subtle divide-line-subtle divide-y rounded-sm border">
          {result.cases.map((item, index) => <JudgeCase key={item.id ?? `${item.index ?? index}-${item.status}`} item={item} index={index} />)}
        </ul>
      </CardContent>
    </Card>
  );
}

function JudgeCase({ item, index }: { item: JudgeCaseFeedback; index: number }) {
  const passed = item.status === "accepted";
  return (
    <li className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm">
        {passed ? <CheckCircle2 className="text-success-ink size-4" aria-hidden /> : <CircleAlert className="text-warning-ink size-4" aria-hidden />}
        <span className="text-ink">{item.name || `Test ${item.index ?? index + 1}`}</span>
        <span className="text-ink-tertiary text-xs">{JUDGE_STATUS_LABELS[item.status]}</span>
      </div>
      <div className="text-ink-tertiary flex items-center gap-3 text-xs">
        {formatRuntime(item.runtimeMs) ? <span>{formatRuntime(item.runtimeMs)}</span> : null}
        {item.stdout && !passed ? <details><summary className="cursor-pointer text-accent">Output</summary><pre className="bg-surface-sunken text-ink-secondary mt-2 max-w-full overflow-x-auto rounded-sm p-2 text-left whitespace-pre-wrap">{item.stdout}</pre></details> : null}
      </div>
    </li>
  );
}
