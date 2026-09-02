import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleDot } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCodingOverview } from "@/lib/coding/queries";
import { CODING_DIFFICULTY_LABELS } from "@/lib/coding/constants";
import type { CodingSubmissionStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Coding 进度",
  description: "查看你在各个主题和题单中的 Coding 解题进度。",
};

export default async function CodingProgressPage() {
  const overview = await getCodingOverview();

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ label: "Coding", href: "/coding" }, { label: "进度" }]} />
      <div className="mt-7">
        <PageHeader
          title="Coding 进度"
          description="查看已解决和已尝试的题目。进度来自你的提交记录，并会自动更新。"
        />
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="已解决"
          value={overview.counts.solved}
          total={overview.counts.total}
          status="solved"
        />
        <StatCard
          label="已尝试"
          value={overview.counts.attempted}
          total={overview.counts.total}
          status="attempted"
        />
        <StatCard label="题目总数" value={overview.counts.total} status="neutral" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>按难度</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(["easy", "medium", "hard"] as const).map((difficulty) => (
              <ProgressRow
                key={difficulty}
                label={CODING_DIFFICULTY_LABELS[difficulty]}
                solved={overview.byDifficulty[difficulty].solved}
                total={overview.byDifficulty[difficulty].total}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>按主题</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.topics.length === 0 ? (
              <p className="text-ink-tertiary text-sm">暂时还没有主题。</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {overview.topics.slice(0, 8).map((topic) => (
                  <li
                    key={topic.topic.slug}
                    className="flex flex-wrap items-baseline justify-between gap-2"
                  >
                    <Link
                      href={`/coding?topic=${encodeURIComponent(topic.topic.slug)}`}
                      className="text-ink hover:text-accent text-sm font-medium"
                    >
                      {topic.topic.name}
                    </Link>
                    <span className="text-ink-tertiary text-sm tabular-nums">
                      {topic.solved} / {topic.total} 已解决
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>题单进度</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.collections.length === 0 ? (
              <p className="text-ink-tertiary text-sm">暂时还没有题单。</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {overview.collections.map((collection) => (
                  <li key={collection.collection.slug}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/coding/collections/${collection.collection.slug}`}
                        className="text-ink hover:text-accent text-sm font-medium"
                      >
                        {collection.collection.name}
                      </Link>
                      <span className="text-ink-tertiary text-sm tabular-nums">
                        {collection.solved} / {collection.total} 已解决
                      </span>
                    </div>
                    <ProgressBar passed={collection.solved} total={collection.total} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>最近提交</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.recent.length === 0 ? (
              <EmptyState
                title="暂时还没有提交记录"
                description="运行或提交一道题的解答，就可以开始积累进度。"
              />
            ) : (
              <ul className="flex flex-col divide-y divide-[var(--color-line-subtle)]">
                {overview.recent.map((submission) => (
                  <li
                    key={submission.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                  >
                    <div className="min-w-0">
                      {submission.problemTitle ? (
                        <Link
                          href={`/coding/${submission.problemSlug}`}
                          className="text-ink hover:text-accent truncate text-sm font-medium"
                        >
                          {submission.problemTitle}
                        </Link>
                      ) : (
                        <span className="text-ink-secondary text-sm">题目</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 text-sm ${submission.status === "accepted" ? "text-success-ink" : submission.status === "wrong_answer" ? "text-danger-ink" : "text-ink-secondary"}`}
                      >
                        {submission.status === "accepted" ? (
                          <CheckCircle2 className="size-3.5" aria-hidden />
                        ) : (
                          <CircleDot className="size-3.5" aria-hidden />
                        )}
                        {statusLabel(submission.status)}
                      </span>
                      {submission.runtimeMs !== null ? (
                        <span className="text-ink-tertiary text-sm tabular-nums">
                          {submission.runtimeMs} ms
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </Container>
  );
}

function StatCard({
  label,
  value,
  total,
  status,
}: {
  label: string;
  value: number;
  total?: number;
  status: "solved" | "attempted" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-ink-tertiary text-sm">{label}</span>
        <span
          className={`text-ink text-3xl font-semibold tabular-nums ${status === "solved" ? "text-success-ink" : status === "attempted" ? "text-warning-ink" : ""}`}
        >
          {value}
          {typeof total === "number" ? (
            <span className="text-ink-tertiary text-base font-normal"> / {total}</span>
          ) : null}
        </span>
      </CardContent>
    </Card>
  );
}

function ProgressRow({
  label,
  solved,
  total,
}: {
  label: string;
  solved: number;
  total: number;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-ink text-sm font-medium">{label}</span>
        <span className="text-ink-tertiary text-sm tabular-nums">
          {solved} / {total}
        </span>
      </div>
      <ProgressBar passed={solved} total={total} />
    </div>
  );
}

function ProgressBar({ passed, total }: { passed: number; total: number }) {
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <div
      className="bg-surface-sunken mt-2 h-1.5 w-full overflow-hidden rounded-full"
      role="progressbar"
      aria-valuenow={passed}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`已解决 ${passed} / ${total}`}
    >
      <div className="bg-accent h-full rounded-full" style={{ width: `${percent}%` }} />
    </div>
  );
}

function statusLabel(status: CodingSubmissionStatus): string {
  const map: Record<CodingSubmissionStatus, string> = {
    accepted: "通过",
    wrong_answer: "答案错误",
    time_limit_exceeded: "超时",
    memory_limit_exceeded: "内存超限",
    runtime_error: "运行错误",
    compile_error: "编译错误",
    internal_error: "内部错误",
    queued: "排队中",
    running: "运行中",
  };
  return map[status];
}
