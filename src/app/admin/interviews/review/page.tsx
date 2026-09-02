import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { queuePriority } from "@/lib/ingestion/confidence";
import { confidenceBand } from "@/lib/ingestion/confidence";
import { listDrafts, listSubmissions } from "@/lib/ingestion/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InterviewDraft } from "@/types/ingestion";
import { displayModerationFlagType } from "@/lib/ingestion/display";

export const metadata: Metadata = {
  title: "面试审核队列",
  robots: { index: false, follow: false },
};

const QUEUE_FILTERS = [
  {
    key: "open",
    label: "待处理",
    statuses: ["submitted", "parsed", "needs_review", "approved"],
  },
  { key: "in_review", label: "审核中", statuses: ["needs_review"] },
  { key: "failed", label: "失败", statuses: ["failed"] },
  { key: "published", label: "已发布", statuses: ["published"] },
  { key: "rejected", label: "已拒绝", statuses: ["rejected"] },
] as const;

/** Deterministic queue priority (Task 74); computed outside render. */
function priorityFor(
  submission: Awaited<ReturnType<typeof listSubmissions>>[number],
  draft: InterviewDraft | undefined,
): number {
  const ageHours = (Date.now() - new Date(submission.createdAt).getTime()) / 3_600_000;
  return queuePriority({
    ageHours,
    confidence: draft?.confidence ?? 0,
    duplicateScore: null,
    failedCanonicalization: submission.status === "failed",
  });
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "已接收",
  processing: "处理中",
  parsed: "已解析",
  needs_review: "待审核",
  approved: "已批准",
  rejected: "已拒绝",
  failed: "失败",
  published: "已发布",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

/**
 * Admin review queue (Task 31): dense, paginated, no raw full text in the
 * list view. Queue priority (Task 74) is deterministic.
 */
export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const { filter = "open", page = "1" } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);
  const activeFilter =
    QUEUE_FILTERS.find((entry) => entry.key === filter) ?? QUEUE_FILTERS[0];

  const admin = createAdminClient();
  if (!admin) {
    return (
      <Container className="py-14">
        <EmptyState
          title="数据导入服务未配置"
          description="请设置 SUPABASE_SERVICE_ROLE_KEY 后使用审核队列。"
        />
      </Container>
    );
  }

  const pageSize = 25;
  const [submissions, drafts] = await Promise.all([
    listSubmissions(admin, {
      statuses: [...activeFilter.statuses],
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
    }),
    listDrafts(admin, []),
  ]);

  // Draft confidence + duplicate score for prioritization; one batched query.
  const draftMap = await listDrafts(
    admin,
    submissions.map((submission) => submission.id),
  );
  void drafts;

  const rows = submissions
    .map((submission) => {
      const draft = draftMap.get(submission.id);
      const priority = priorityFor(submission, draft);
      return { submission, draft, priority };
    })
    .sort((a, b) => b.priority - a.priority);

  return (
    <Container className="py-10">
      <PageHeader
        title="面试审核"
        description="以下投稿正在等待审核。自动化负责提供建议，最终由你决定。"
      />

      <nav
        className="border-line-subtle mt-6 flex flex-wrap gap-2 border-b pb-3"
        aria-label="队列筛选"
      >
        {QUEUE_FILTERS.map((entry) => (
          <Link
            key={entry.key}
            href={`/admin/interviews/review?filter=${entry.key}`}
            className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              entry.key === activeFilter.key
                ? "bg-accent text-white"
                : "text-ink-secondary hover:bg-surface-sunken hover:text-ink"
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="队列已清空"
          description={`没有状态为“${activeFilter.label}”的投稿。`}
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {rows.map(({ submission, draft, priority }) => {
            const band = confidenceBand(draft?.confidence ?? 0);
            return (
              <li key={submission.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-ink font-medium">
                          {submission.companyHint ?? draft?.companyName ?? "未知公司"}
                        </span>
                        <span className="text-ink-tertiary">·</span>
                        <span className="text-ink-secondary truncate text-sm">
                          {submission.positionHint ??
                            draft?.positionTitle ??
                            "未知岗位"}
                        </span>
                      </div>
                      <p className="text-ink-tertiary mt-1 text-xs">
                        {new Date(submission.createdAt).toLocaleString()} ·{" "}
                        {submission.rawText.length.toLocaleString()} 字符
                        {draft
                          ? ` · 解析器 ${draft.parserVersion}（${draft.provider}）`
                          : " · 尚未解析"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="status"
                        tone={
                          submission.status === "failed" ||
                          submission.status === "rejected"
                            ? "rejected"
                            : submission.status === "published"
                              ? "published"
                              : undefined
                        }
                      >
                        {STATUS_LABELS[submission.status] ?? "未知状态"}
                      </Badge>
                      {draft && (
                        <span className="text-ink-tertiary text-xs tabular-nums">
                          置信度 {draft.confidence.toFixed(2)}（
                          {CONFIDENCE_LABELS[band] ?? "未知"}）
                        </span>
                      )}
                      <span className="text-ink-tertiary text-xs tabular-nums">
                        P{priority.toFixed(2)}
                      </span>
                      <Link
                        href={`/admin/interviews/review/${submission.id}`}
                        className="text-accent hover:text-accent-hover text-sm font-medium"
                      >
                        审核 →
                      </Link>
                    </div>
                  </div>
                  {submission.moderationFlags.length > 0 && (
                    <p className="text-warning mt-2 text-xs">
                      内容审核标记：
                      {submission.moderationFlags
                        .map(
                          (flag) =>
                            `${displayModerationFlagType(flag.type)}×${flag.count}`,
                        )
                        .join("、")}
                    </p>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <div className="text-ink-tertiary mt-6 flex items-center justify-between text-sm">
        <span>第 {pageNumber} 页</span>
        <div className="flex gap-3">
          {pageNumber > 1 && (
            <Link
              href={`/admin/interviews/review?filter=${activeFilter.key}&page=${pageNumber - 1}`}
              className="hover:text-ink"
            >
              ← 上一页
            </Link>
          )}
          {rows.length === pageSize && (
            <Link
              href={`/admin/interviews/review?filter=${activeFilter.key}&page=${pageNumber + 1}`}
              className="hover:text-ink"
            >
              下一页 →
            </Link>
          )}
        </div>
      </div>
    </Container>
  );
}
